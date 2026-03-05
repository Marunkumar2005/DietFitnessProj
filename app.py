from flask import Flask, render_template, request
import pandas as pd
import numpy as np
import joblib

app = Flask(__name__)

# Load your trained pipeline
import os


BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR, "random_forest_pipeline.pkl")  # or models/random_forest_pipeline.pkl
pipeline = joblib.load(MODEL_PATH)
# Diet mappings
DIET_TO_FITNESS = {
    "Balanced": ("Excellent", 5),
    "Low_Carb": ("Medium", 3),
    "Low_Sodium": ("Low", 1)
}
NUM_TO_DIET_FALLBACK = {0: "Balanced", 1: "Low_Carb", 2: "Low_Sodium"}

DIET_FOOD_GUIDE = {
    "Balanced": {
        "Foods to Eat": ["Vegetables", "Fruits", "Whole grains", "Lean proteins"],
        "Foods to Avoid": ["Excess sugar", "Fried foods"]
    },
    "Low_Carb": {
        "Foods to Eat": ["Leafy greens", "Eggs", "Fish", "Nuts", "Avocado"],
        "Foods to Avoid": ["Bread", "Pasta", "Rice", "Sugary drinks"]
    },
    "Low_Sodium": {
        "Foods to Eat": ["Bananas", "Oats", "Leafy greens", "Fish", "Unsalted nuts"],
        "Foods to Avoid": ["Processed foods", "Pickles", "Chips", "Canned soups"]
    }
}

# Expected fields for form rendering
FIELDS = [
    ("Age","Age","number"),
    ("Gender","Gender (Male/Female)","text"),
    ("Weight_kg","Weight (kg)","number"),
    ("Height_cm","Height (cm)","number"),
    ("BMI","BMI","number"),
    ("Disease_Type","Disease Type","text"),
    ("Severity","Severity","text"),
    ("Physical_Activity_Level","Physical Activity Level","text"),
    ("Daily_Caloric_Intake","Daily Caloric Intake","number"),
    ("Cholesterol_mg/dL","Cholesterol (mg/dL)","number"),
    ("Blood_Pressure_mmHg","Blood Pressure (mmHg)","number"),
    ("Glucose_mg/dL","Glucose (mg/dL)","number"),
    ("Dietary_Restrictions","Dietary Restrictions","text"),
    ("Allergies","Allergies","text"),
    ("Preferred_Cuisine","Preferred Cuisine","text"),
    ("Weekly_Exercise_Hours","Weekly Exercise Hours","number"),
    ("Adherence_to_Diet_Plan","Adherence to Diet Plan (0–100)","number"),
    ("Dietary_Nutrient_Imbalance_Score","Nutrient Imbalance Score","number")
]

@app.route("/", methods=["GET", "POST"])
def index():
    result = None
    if request.method == "POST":
        # Build DataFrame from form input
        input_data = {}
        for field, _, _ in FIELDS:
            value = request.form.get(field)
            if field in ["Age","Weight_kg","Height_cm","BMI","Daily_Caloric_Intake",
                         "Cholesterol_mg/dL","Blood_Pressure_mmHg","Glucose_mg/dL",
                         "Weekly_Exercise_Hours","Adherence_to_Diet_Plan","Dietary_Nutrient_Imbalance_Score"]:
                input_data[field] = float(value) if value else 0
            else:
                input_data[field] = value if value else "None"

        df = pd.DataFrame([input_data])

        # Predict
        try:
            pred_raw = pipeline.predict(df)[0]
        except Exception as e:
            return render_template("index.html", fields=FIELDS, result={"error": str(e)})

        # Resolve diet label
        try:
            clf = pipeline.named_steps.get("classifier", list(pipeline.named_steps.values())[-1])
            classes = getattr(clf, "classes_", None)
            if classes is not None and isinstance(classes[0], str):
                diet_label = str(pred_raw)
            else:
                diet_label = NUM_TO_DIET_FALLBACK.get(int(pred_raw), str(pred_raw))
        except:
            diet_label = str(pred_raw)

        fitness_label, fitness_score = DIET_TO_FITNESS.get(diet_label, ("Unknown", 0))
        food_info = DIET_FOOD_GUIDE.get(diet_label, {"Foods to Eat":[], "Foods to Avoid":[]})

        result = {
            "diet": diet_label,
            "fitness": fitness_label,
            "score": fitness_score,
            "food_eat": ", ".join(food_info["Foods to Eat"]),
            "food_avoid": ", ".join(food_info["Foods to Avoid"])
        }

    return render_template("index.html", fields=FIELDS, result=result)

if __name__ == "__main__":
    app.run(debug=True)
