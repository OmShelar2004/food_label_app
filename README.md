# Food Label Analyzer App 🍎🔍

Food Label Analyzer is an intelligent tool designed to help consumers understand the ingredients in their packaged foods. By simply taking a picture of a food label's ingredient list, the app uses Optical Character Recognition (OCR) and AI to identify potential health risks, banned additives, and harmful preservatives.

## 🌟 Features

- **📷 Image Upload & OCR:** Upload images of food ingredient labels. The app extracts text using Tesseract OCR.
- **🔬 Ingredient Analysis:** Automatically cleans, normalizes, and analyzes ingredients.
- **🤖 AI-Powered Insights:** Uses the Gemini AI model to generate concise, science-based health impact reports for each ingredient and provides a final verdict (e.g., 🟢 Safe, 🔴 Avoid).
- **📰 Food Health News:** A dedicated news endpoint fetching the latest food safety and health news via NewsAPI.
- **💬 AI Chatbot:** Built-in AI assistant to answer questions about food safety, nutrition, and healthy habits.
- **📱 Cross-Platform:** Includes both a Flask-based web interface and a React Native (Expo) mobile app.

## 🏗️ Project Structure

- `app.py`: Main Flask server backend containing all API endpoints (`/api/analyze`, `/api/news`, `/api/chat`).
- `ingredient_cleaner.py` / `ingredient_normalizer.py`: NLP and text processing utilities to standardize OCR text.
- `risk_engine.py`: Static fallback logic to assess ingredient safety levels.
- `templates/` & `static/`: HTML and CSS files for the web application frontend.
- `mobile/`: Expo/React Native source code for the mobile application.

## 🚀 Getting Started

### Prerequisites
- Python 3.x
- Tesseract OCR (`brew install tesseract` on Mac or via your package manager)
- Node.js & npm (for the mobile app)

### Backend Setup (Flask)
1. Install Python dependencies:
   ```bash
   pip install Flask opencv-python pytesseract requests flask-cors
   ```
2. Set up your API Keys:
   - Add your NewsAPI key inside a file named `api_key.txt` in the root directory.
   - Configure your Gemini API key in `app.py`.
3. Run the Flask server:
   ```bash
   python app.py
   ```
   The backend will run on `http://localhost:5001`.

### Mobile App Setup (Expo)
1. Navigate to the `mobile` directory:
   ```bash
   cd mobile
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the Expo server:
   ```bash
   npx expo start
   ```

## 🤝 Contributing

Contributions are welcome! Feel free to open issues or submit pull requests.

## 📝 License

This project is open-source and available under standard open-source licenses.
