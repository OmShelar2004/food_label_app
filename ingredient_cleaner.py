import re

def clean_ingredients(text):
    text = text.lower()

    # remove common OCR noise
    text = text.replace("\n", " ")
    text = re.sub(r"[^a-z0-9(),.% ]", "", text)

    # find ingredients section
    if "ingredient" in text:
        text = text.split("ingredient", 1)[1]

    ingredients = text.split(",")

    cleaned = []
    for ing in ingredients:
        ing = ing.strip()
        if len(ing) > 2:
            cleaned.append(ing)

    return cleaned
