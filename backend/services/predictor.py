import json
import os
import joblib
import pandas as pd
import numpy as np
from fastapi import HTTPException

# Class display names mapping
CLASS_NAME_MAP = {
    0: "Vegetation / Wildfire",
    2: "Industrial / Static Thermal",
    3: "Other / Offshore Thermal"
}

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODEL_DIR = os.path.join(BASE_DIR, "model")

# File paths
MODEL_PATH = os.path.join(MODEL_DIR, "fire_classifier_model.pkl")
SCALER_PATH = os.path.join(MODEL_DIR, "feature_scaler.pkl")
TYPE_MAP_PATH = os.path.join(MODEL_DIR, "type_mapping.json")
REVERSE_MAP_PATH = os.path.join(MODEL_DIR, "reverse_mapping.json")
FEATURE_NAMES_PATH = os.path.join(MODEL_DIR, "feature_names.txt")

# Load artifacts at module load
model = None
scaler = None
feature_names = []
type_mapping = {}
reverse_mapping = {}

def load_predictor():
    global model, scaler, feature_names, type_mapping, reverse_mapping
    if model is not None:
        return

    if not os.path.exists(MODEL_PATH):
        raise FileNotFoundError(f"Model file not found at {MODEL_PATH}")

    model = joblib.load(MODEL_PATH)
    scaler = joblib.load(SCALER_PATH)

    with open(FEATURE_NAMES_PATH, "r") as f:
        content = f.read().strip()
        feature_names = [feat.strip() for feat in content.split(",") if feat.strip()]

    with open(TYPE_MAP_PATH, "r") as f:
        type_mapping = json.load(f)

    with open(REVERSE_MAP_PATH, "r") as f:
        raw_rev = json.load(f)
        # Reverse mapping keys can be strings, convert to int values
        reverse_mapping = {int(k): int(v) for k, v in raw_rev.items()}

load_predictor()

def get_class_name(orig_label: int) -> str:
    return CLASS_NAME_MAP.get(orig_label, f"Type {orig_label}")

def predict_one(features: dict) -> dict:
    load_predictor()

    missing_keys = [fn for fn in feature_names if fn not in features]
    if missing_keys:
        raise HTTPException(
            status_code=400,
            detail=f"Missing required feature keys: {missing_keys}"
        )

    # Reorder features strictly as expected by scaler & model
    row_data = {fn: [features[fn]] for fn in feature_names}
    input_df = pd.DataFrame(row_data)

    try:
        scaled_array = scaler.transform(input_df)
        pred_idx = int(model.predict(scaled_array)[0])
        probabilities = model.predict_proba(scaled_array)[0]

        # Convert internal model index (0, 1, 2) -> original label (0, 2, 3)
        orig_label = reverse_mapping.get(pred_idx, pred_idx)
        class_name = get_class_name(orig_label)

        # Build class probabilities dictionary mapped by original label
        class_probs = {}
        for idx, prob in enumerate(probabilities):
            label_orig = reverse_mapping.get(idx, idx)
            class_probs[str(label_orig)] = round(float(prob), 4)

        max_prob = round(float(probabilities[pred_idx]), 4)

        return {
            "predicted_label": orig_label,
            "predicted_class_name": class_name,
            "confidence": max_prob,
            "class_probabilities": class_probs
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error during model prediction: {str(e)}"
        )
