# ingredient_normalizer.py

NORMALIZATION_MAP = {
    # Oils & fats
    "palm": "palm oil",
    "palmolein": "palm oil",

    # Sugars
    "sugar": "added sugar",
    "dextrose": "added sugar",

    # Chocolate / confectionery
    "milk solid": "milk solids",
    "milk solids": "milk solids",
    "cocoa butter": "refined fat",
    "cocoa solid": "cocoa solids",
    "cocoa solids": "cocoa solids",

    # Additives
    "emulsifier": "emulsifier",
    "lecith": "soy lecithin",
    "322": "soy lecithin",
    "vanillin": "artificial flavour",
    "flavour": "artificial flavour",

    # Others
    "maltodextr": "maltodextrin",
    "hydrolysed": "hydrolysed vegetable protein"
}


def normalize_ingredients(raw_ingredients):
    normalized = set()

    for ing in raw_ingredients:
        ing = ing.lower()
        for key in NORMALIZATION_MAP:
            if key in ing:
                normalized.add(NORMALIZATION_MAP[key])

    return list(normalized)

