from ingredient_cleaner import clean_ingredients
from ingredient_normalizer import normalize_ingredients
from risk_engine import analyze_risks, final_verdict
import cv2
import pytesseract

pytesseract.pytesseract.tesseract_cmd = "/opt/homebrew/bin/tesseract"

img = cv2.imread("test.jpg")
gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
gray = cv2.threshold(gray, 150, 255, cv2.THRESH_BINARY)[1]

text = pytesseract.image_to_string(gray, config="--psm 6")

cleaned = clean_ingredients(text)
normalized = normalize_ingredients(cleaned)
report = analyze_risks(normalized)
verdict = final_verdict(report)

print("\n🚨 FOODPHARMER-STYLE ANALYSIS\n")

for r in report:
    emoji = "🔴" if r["level"] == "High" else "🟡"
    print(f"{emoji} {r['ingredient'].title()}")
    print(f"   → {r['reason']}\n")

print("FINAL VERDICT:", verdict)
