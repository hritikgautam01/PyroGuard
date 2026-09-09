import pandas as pd
import numpy as np
import joblib
import xgboost as xgb
from sklearn.metrics import classification_report, confusion_matrix

df = pd.read_csv("data/firms_india_2024_features.csv")
df = df[df["type"].isin([0, 2, 3])].copy()

cols = [
    "bright_ti4","bright_ti5","temp_diff","temp_ratio","frp","frp_log",
    "intensity_score","day_of_year","month","week","quarter",
    "day_of_week","hour","is_night","detection_count","confidence_numeric"
]

# Take a random sample from each supported class
parts = []
for label in [0, 2, 3]:
    class_df = df[df["type"] == label]
    parts.append(
        class_df.sample(n=min(500, len(class_df)), random_state=42)
    )

sample = pd.concat(parts, ignore_index=True)

scaler = joblib.load("model/feature_scaler.pkl")

model = xgb.Booster()
model.load_model("model/fire_classifier_recovered.json")

X = scaler.transform(sample[cols])
pred_idx = np.argmax(model.predict(xgb.DMatrix(X)), axis=1)

# Model internal classes -> original FIRMS Type
reverse = {0: 0, 1: 2, 2: 3}
y_pred = np.array([reverse[int(x)] for x in pred_idx])
y_true = sample["type"].astype(int).to_numpy()

print("\n=== 1,500-RECORD SANITY CHECK ===")
print("Samples:", len(sample))

print("\nConfusion Matrix (rows = actual, columns = predicted)")
print("Labels: [0, 2, 3]")
print(confusion_matrix(y_true, y_pred, labels=[0, 2, 3]))

print("\nClassification Report")
print(classification_report(
    y_true,
    y_pred,
    labels=[0, 2, 3],
    target_names=[
        "Vegetation/Wildfire",
        "Industrial/Static Thermal",
        "Other/Offshore Thermal"
    ],
    digits=4
))
