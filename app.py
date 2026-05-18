from flask import Flask, render_template, request, jsonify
import os
import cv2
import pytesseract
import requests
from flask_cors import CORS

from ingredient_cleaner import clean_ingredients
from ingredient_normalizer import normalize_ingredients
from risk_engine import analyze_risks, final_verdict

pytesseract.pytesseract.tesseract_cmd = "/opt/homebrew/bin/tesseract"

app = Flask(__name__)
CORS(app)
UPLOAD_FOLDER = "uploads"
app.config["UPLOAD_FOLDER"] = UPLOAD_FOLDER

# Load NewsAPI key
_api_key_path = os.path.join(os.path.dirname(__file__), "api_key.txt")
with open(_api_key_path, "r") as _f:
    NEWS_API_KEY = _f.read().strip()

# Configure Gemini (REST API key)
GEMINI_API_KEY = "AIzaSyA3et7kjlkLtMXKl7EZNebXouBHfxGVvgA"

FOOD_SYSTEM_PROMPT = """You are a friendly and knowledgeable food health assistant specializing in:
- Food safety and ingredient analysis
- Harmful or banned food additives and preservatives
- Reading and understanding food labels on packaged foods
- Nutrition advice and healthy eating habits
- Food-related health risks and concerns

Guidelines:
- Keep responses clear, concise and easy to understand
- Use bullet points for lists
- Always recommend consulting a doctor for serious health concerns
- If asked about non-food topics, politely redirect to food/health topics
- Use emojis sparingly to make responses friendly"""


@app.route("/", methods=["GET", "POST"])
def index():
    if request.method == "POST":
        image = request.files.get("image")
        if image:
            image_path = os.path.join(app.config["UPLOAD_FOLDER"], image.filename)
            image.save(image_path)

            # OCR
            img = cv2.imread(image_path)
            gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
            gray = cv2.threshold(gray, 150, 255, cv2.THRESH_BINARY)[1]

            text = pytesseract.image_to_string(gray, config="--psm 6")

            # Analysis pipeline
            cleaned = clean_ingredients(text)
            normalized = normalize_ingredients(cleaned)
            
            print("OCR TEXT:\n", text)
            print("CLEANED:", cleaned)
            print("NORMALIZED:", normalized)

            report = analyze_risks(normalized)
            verdict = final_verdict(report)

            return render_template("result.html", report=report, verdict=verdict)

    return render_template("index.html")

@app.route("/api/analyze", methods=["POST"])
def api_analyze():
    if "image" not in request.files:
        return jsonify({"error": "No image provided"}), 400
        
    image = request.files["image"]
    if image.filename == "":
        return jsonify({"error": "Empty filename"}), 400
        
    if image:
        image_path = os.path.join(app.config["UPLOAD_FOLDER"], image.filename)
        image.save(image_path)

        # OCR
        img = cv2.imread(image_path)
        if img is None:
             return jsonify({"error": "Failed to read image"}), 400
             
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        gray = cv2.threshold(gray, 150, 255, cv2.THRESH_BINARY)[1]

        text = pytesseract.image_to_string(gray, config="--psm 6")

        # Analysis pipeline
        cleaned = clean_ingredients(text)
        
        print("API OCR TEXT:\n", text)
        print("API CLEANED:", cleaned)

        # Use AI for detailed analysis
        try:
            analysis_prompt = f"""Analyze these food ingredients and provide a health-impact report.
            Ingredients: {', '.join(cleaned)}

            Return a JSON object with:
            1. "report": An array of objects, each with:
               - "ingredient": The name of the ingredient.
               - "level": Health risk level ("High", "Medium", or "Low").
               - "reason": A short (1-2 sentence) description of how it affects health.
            2. "verdict": A single summary sentence with an emoji (e.g., "🟢 Relatively safe", "🔴 Avoid this product").

            Keep descriptions concise and science-based."""

            payload = {
                "system_instruction": {"parts": [{"text": FOOD_SYSTEM_PROMPT}]},
                "contents": [{"role": "user", "parts": [{"text": analysis_prompt}]}],
                "generationConfig": {"temperature": 0.2, "response_mime_type": "application/json"},
            }

            url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={GEMINI_API_KEY}"
            resp = requests.post(url, json=payload, timeout=30)
            
            if resp.status_code == 200:
                ai_data = resp.json()
                # Parse the inner JSON string if necessary or extract directly if using response_mime_type
                candidates = ai_data.get("candidates", [])
                if candidates:
                    import json
                    analysis_text = candidates[0]["content"]["parts"][0]["text"]
                    analysis_json = json.loads(analysis_text)
                    
                    return jsonify({
                        "report": analysis_json.get("report", []),
                        "verdict": analysis_json.get("verdict", "Unknown"),
                        "ingredients_detected": cleaned
                    })
            
            # Fallback to static analysis if AI fails
            report = analyze_risks(normalize_ingredients(cleaned))
            verdict = final_verdict(report)
            return jsonify({
                "report": report,
                "verdict": verdict,
                "ingredients_detected": cleaned
            })

        except Exception as e:
            print(f"AI Analysis Error: {e}")
            # Fallback logic
            report = analyze_risks(normalize_ingredients(cleaned))
            verdict = final_verdict(report)
            return jsonify({
                "report": report,
                "verdict": verdict,
                "ingredients_detected": cleaned
            })

@app.route("/api/news", methods=["GET"])
def get_food_news():
    """Fetch food-related news from NewsAPI."""
    query = request.args.get("q", "food safety banned ingredients food health")
    page_size = int(request.args.get("pageSize", 20))

    url = "https://newsapi.org/v2/everything"
    params = {
        "q": query,
        "language": "en",
        "sortBy": "publishedAt",
        "pageSize": page_size,
        "apiKey": NEWS_API_KEY,
    }

    try:
        resp = requests.get(url, params=params, timeout=10)
        data = resp.json()

        if data.get("status") != "ok":
            return jsonify({"error": data.get("message", "NewsAPI error")}), 502

        # Filter out articles with removed content
        articles = [
            {
                "title": a.get("title"),
                "description": a.get("description"),
                "url": a.get("url"),
                "urlToImage": a.get("urlToImage"),
                "source": a.get("source", {}).get("name"),
                "publishedAt": a.get("publishedAt"),
            }
            for a in data.get("articles", [])
            if a.get("title") and "[Removed]" not in a.get("title", "")
        ]

        return jsonify({"articles": articles, "totalResults": len(articles)})

    except requests.exceptions.RequestException as e:
        return jsonify({"error": str(e)}), 503

@app.route("/api/chat", methods=["POST"])
def chat():
    """AI chatbot endpoint powered by Gemini via REST API."""
    data = request.get_json()
    if not data or not data.get("message"):
        return jsonify({"error": "No message provided"}), 400

    user_message = data["message"].strip()
    history = data.get("history", [])  # [{role: "user"|"model", text: "..."}]

    try:
        # Build contents array for Gemini REST API
        contents = []
        for entry in history:
            role = "user" if entry.get("role") == "user" else "model"
            contents.append({"role": role, "parts": [{"text": entry.get("text", "")}]})
        # Add current user message
        contents.append({"role": "user", "parts": [{"text": user_message}]})

        payload = {
            "system_instruction": {"parts": [{"text": FOOD_SYSTEM_PROMPT}]},
            "contents": contents,
            "generationConfig": {"temperature": 0.7, "maxOutputTokens": 1024},
        }

        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key={GEMINI_API_KEY}"
        resp = requests.post(url, json=payload, timeout=30)
        result = resp.json()

        if resp.status_code != 200:
            err = result.get("error", {}).get("message", "Gemini API error")
            return jsonify({"error": err}), resp.status_code

        reply = result["candidates"][0]["content"]["parts"][0]["text"]
        return jsonify({"reply": reply})

    except Exception as e:
        return jsonify({"error": f"AI error: {str(e)}"}), 500

if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5001)
