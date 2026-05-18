RISK_DB = {
    "palm oil": {
        "level": "High",
        "reason": "Highly refined oil, high in saturated fat, linked to inflammation"
    },
    "added sugar": {
        "level": "High",
        "reason": "Empty calories, spikes blood sugar, addictive"
    },
    "maltodextrin": {
        "level": "High",
        "reason": "Very high glycemic index, spikes insulin"
    },
    "dextrose": {
        "level": "High",
        "reason": "Fast-absorbing sugar, no nutritional value"
    },
    "hydrolysed vegetable protein": {
        "level": "High",
        "reason": "Processed protein, often contains free glutamates (MSG-like)"
    },
    "flavour enhancer (INS 627)": {
        "level": "High",
        "reason": "Synthetic flavour enhancer, linked to headaches & overeating"
    },
    "flavour enhancer (INS 631)": {
        "level": "High",
        "reason": "Often used with MSG, ultra-processed additive"
    },
    "artificial flavour": {
        "level": "Medium",
        "reason": "Synthetic flavouring, masks poor ingredient quality"
    },
    "added flavour": {
        "level": "Medium",
        "reason": "Non-natural flavouring, indicates heavy processing"
    },
    "emulsifier": {
    "level": "Medium",
    "reason": "Ultra-processed additive used to improve texture and shelf life"
    },
   "soy lecithin": {
    "level": "Medium",
    "reason": "Processed emulsifier, indicator of ultra-processed food"
    },
   "refined sugar": {
    "level": "High",
    "reason": "Highly processed sugar, contributes to insulin spikes"
    },
   "added sugar": {
    "level": "High",
    "reason": "High sugar content, linked to metabolic issues"
    },
   "milk solids": {
    "level": "Medium",
    "reason": "Highly processed dairy ingredient used in confectionery"
    },
   "refined fat": {
    "level": "Medium",
    "reason": "Refined fat with low micronutrient value"
    },
   "cocoa solids": {
    "level": "Low",
    "reason": "Cocoa component; benefits depend on sugar and processing level"
}

}
def analyze_risks(ingredients):
    report = []

    for ing in ingredients:
        for risk_key in RISK_DB:
            if risk_key in ing:
                data = RISK_DB[risk_key]
                report.append({
                    "ingredient": risk_key,
                    "level": data["level"],
                    "reason": data["reason"]
                })

    return report

def final_verdict(report):
    high = sum(1 for r in report if r["level"] == "High")
    medium = sum(1 for r in report if r["level"] == "Medium")

    ingredient_names = [r["ingredient"] for r in report]

    # Chocolate / confectionery rule
    if "milk solids" in ingredient_names or "soy lecithin" in ingredient_names:
        return "🟡 Ultra-processed confectionery — consume occasionally"

    if high >= 3:
        return "🔴 Avoid this product"
    elif high >= 1:
        return "🟡 Consume occasionally"
    elif medium >= 2:
        return "🟡 Ultra-processed — consume occasionally"
    elif len(report) == 0:
        return "🟡 Processed food — image unclear or incomplete"
    else:
        return "🟢 Relatively safe"



