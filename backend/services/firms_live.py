import os
import time
import io
import json
import urllib.request
import urllib.parse
import pandas as pd
import numpy as np
from typing import List, Dict, Any, Optional

from services import predictor

# Default NASA FIRMS MAP KEY (can be set via env var FIRMS_MAP_KEY)
DEFAULT_MAP_KEY = os.getenv("FIRMS_MAP_KEY", "bf6fe16d62edc12939c7193b0b0cdd58")

# In-memory cache for live FIRMS data to prevent hitting rate limits
# Key format: f"{map_key}_{source}_{day_range}_{year}_{date_str}"
_LIVE_CACHE: Dict[str, Dict[str, Any]] = {}
CACHE_TTL_SECONDS = 600  # 10 minutes cache

CLASS_NAME_MAP = {
    0: "Vegetation / Wildfire",
    2: "Industrial / Static Thermal",
    3: "Other / Offshore Thermal"
}

CONFIDENCE_MAP = {
    "l": 0.3,
    "low": 0.3,
    "n": 0.7,
    "nominal": 0.7,
    "h": 0.95,
    "high": 0.95
}


def parse_confidence(val: Any) -> float:
    """Convert FIRMS confidence string or numeric to a 0.0-1.0 float score."""
    if val is None or pd.isna(val):
        return 0.7
    val_str = str(val).strip().lower()
    if val_str in CONFIDENCE_MAP:
        return CONFIDENCE_MAP[val_str]
    try:
        num = float(val_str)
        if num > 1.0:
            num = num / 100.0
        return max(0.0, min(1.0, num))
    except ValueError:
        return 0.7


def engineer_features(df: pd.DataFrame) -> pd.DataFrame:
    """
    Transforms raw FIRMS satellite detections DataFrame into the exact 16-feature schema
    required by the PyroGuard XGBoost classifier.
    """
    if df.empty:
        return df

    df = df.copy()

    # Standardize column names (handling MODIS vs VIIRS differences)
    # VIIRS uses bright_ti4 and bright_ti5. MODIS uses brightness and bright_t31.
    if "bright_ti4" not in df.columns and "brightness" in df.columns:
        df["bright_ti4"] = pd.to_numeric(df["brightness"], errors="coerce").fillna(320.0)
    else:
        df["bright_ti4"] = pd.to_numeric(df.get("bright_ti4", 320.0), errors="coerce").fillna(320.0)

    if "bright_ti5" not in df.columns and "bright_t31" in df.columns:
        df["bright_ti5"] = pd.to_numeric(df["bright_t31"], errors="coerce").fillna(290.0)
    else:
        df["bright_ti5"] = pd.to_numeric(df.get("bright_ti5", 290.0), errors="coerce").fillna(290.0)

    df["frp"] = pd.to_numeric(df.get("frp", 1.0), errors="coerce").fillna(1.0)
    df["latitude"] = pd.to_numeric(df.get("latitude", 0.0), errors="coerce").fillna(0.0)
    df["longitude"] = pd.to_numeric(df.get("longitude", 0.0), errors="coerce").fillna(0.0)

    # 1. Thermal differences & ratios
    df["temp_diff"] = df["bright_ti4"] - df["bright_ti5"]
    df["temp_ratio"] = df["bright_ti4"] / np.maximum(df["bright_ti5"], 1.0)

    # 2. FRP Log & Intensity score
    df["frp_log"] = np.log1p(np.maximum(df["frp"], 0.0))
    df["intensity_score"] = df["temp_diff"] * df["frp_log"]

    # 3. Temporal features from acq_date and acq_time
    if "acq_date" in df.columns:
        dt_series = pd.to_datetime(df["acq_date"], errors="coerce").fillna(pd.Timestamp.now())
    else:
        dt_series = pd.Series([pd.Timestamp.now()] * len(df))

    df["day_of_year"] = dt_series.dt.dayofyear.astype(int)
    df["month"] = dt_series.dt.month.astype(int)
    df["week"] = dt_series.dt.isocalendar().week.astype(int)
    df["quarter"] = dt_series.dt.quarter.astype(int)
    df["day_of_week"] = dt_series.dt.dayofweek.astype(int)

    # Hour from acq_time (e.g. 613 -> "0613" -> hour 6, 1345 -> "1345" -> hour 13)
    def extract_hour(val: Any) -> int:
        if pd.isna(val) or val is None:
            return 12
        s = str(val).split(".")[0].zfill(4)
        try:
            return int(s[:2])
        except Exception:
            return 12

    df["hour"] = df.get("acq_time", 1200).apply(extract_hour)

    # 4. Day / Night boolean
    daynight_series = df.get("daynight", "D").astype(str).str.upper()
    df["is_night"] = (daynight_series == "N").astype(int)
    df["daynight"] = daynight_series

    # 5. Confidence numeric
    df["confidence_numeric"] = df.get("confidence", "n").apply(parse_confidence)

    # 6. Detection count (spatial cluster density)
    lat_round = df["latitude"].round(1)
    lon_round = df["longitude"].round(1)
    grid_counts = df.groupby([lat_round, lon_round])["latitude"].transform("count")
    df["detection_count"] = grid_counts.astype(int)

    return df


def classify_detections(df: pd.DataFrame) -> pd.DataFrame:
    """
    Runs the pre-trained XGBoost ML model on engineered features
    and assigns predicted type (0, 2, 3) and class probabilities.
    """
    if df.empty:
        return df

    predictor.load_predictor()
    model = predictor.model
    scaler = predictor.scaler
    feature_names = predictor.feature_names
    reverse_mapping = predictor.reverse_mapping

    df_feats = engineer_features(df)

    # Reorder features strictly as expected by scaler & model
    X_input = df_feats[feature_names]

    try:
        # Scale features
        scaled_array = scaler.transform(X_input)

        # Import xgboost DMatrix inside function if needed
        import xgboost as xgb
        dmatrix = xgb.DMatrix(scaled_array)

        # Predict probabilities
        probabilities = model.predict(dmatrix)

        predicted_types = []
        predicted_names = []
        model_confidences = []

        for idx, probs in enumerate(probabilities):
            pred_idx = int(np.argmax(probs))
            orig_label = reverse_mapping.get(pred_idx, pred_idx)
            class_name = CLASS_NAME_MAP.get(orig_label, f"Type {orig_label}")
            max_prob = round(float(probs[pred_idx]), 4)

            predicted_types.append(orig_label)
            predicted_names.append(class_name)
            model_confidences.append(max_prob)

        df_feats["type"] = predicted_types
        df_feats["type_name"] = predicted_names
        df_feats["ml_confidence"] = model_confidences

    except Exception as e:
        print(f"Error during live classification: {e}")
        # Fallback if model fails
        df_feats["type"] = 0
        df_feats["type_name"] = CLASS_NAME_MAP[0]
        df_feats["ml_confidence"] = 0.50

    return df_feats


def fetch_firms_live_data(
    map_key: str = "",
    source: str = "VIIRS_NOAA20_NRT",
    day_range: int = 1,
    country_code: str = "IND",
    date_str: Optional[str] = None
) -> pd.DataFrame:
    """
    Fetches real-time active fire detections from NASA FIRMS API.
    API URL: https://firms.modaps.eosdis.nasa.gov/api/country/csv/{MAP_KEY}/{SOURCE}/{COUNTRY}/{DAY_RANGE}[/{DATE}]
    """
    active_key = map_key.strip() if map_key.strip() else DEFAULT_MAP_KEY
    if not active_key:
        raise ValueError("NASA FIRMS MAP_KEY is required to fetch real-time live data.")

    # Validate source parameter
    valid_sources = ["VIIRS_NOAA20_NRT", "VIIRS_SNPP_NRT", "VIIRS_NOAA21_NRT", "MODIS_NRT"]
    if source not in valid_sources:
        source = "VIIRS_NOAA20_NRT"

    day_range = max(1, min(10, day_range))

    # Construct Cache Key
    cache_key = f"{active_key}_{source}_{day_range}_{country_code}_{date_str or 'live'}"
    now = time.time()

    if cache_key in _LIVE_CACHE:
        cache_entry = _LIVE_CACHE[cache_key]
        if now - cache_entry["timestamp"] < CACHE_TTL_SECONDS:
            print(f"Returning cached FIRMS live data ({len(cache_entry['df'])} records).")
            return cache_entry["df"]

    # Build NASA FIRMS API URL (using area bounding box 68,6,98,37 for India)
    area_bbox = "68,6,98,37"
    url = f"https://firms.modaps.eosdis.nasa.gov/api/area/csv/{active_key}/{source}/{area_bbox}/{day_range}"
    if date_str:
        url += f"/{date_str}"

    print(f"Fetching NASA FIRMS live data from: {url}")

    req = urllib.request.Request(
        url,
        headers={"User-Agent": "PyroGuard-Wildfire-Classifier/1.0"}
    )

    try:
        with urllib.request.urlopen(req, timeout=30) as response:
            csv_text = response.read().decode("utf-8")

        if csv_text.startswith("Invalid MAP_KEY") or "Invalid MAP_KEY" in csv_text:
            raise ValueError("Invalid NASA FIRMS MAP_KEY provided. Please check your API key.")

        df_raw = pd.read_csv(io.StringIO(csv_text))
        print(f"Fetched {len(df_raw)} raw detections from NASA FIRMS API.")

        if df_raw.empty:
            df_classified = pd.DataFrame()
        else:
            # Add satellite metadata tag if not present
            df_raw["satellite"] = source
            df_raw["stream_mode"] = "live"
            # Classify using XGBoost ML model
            df_classified = classify_detections(df_raw)

        # Cache result
        _LIVE_CACHE[cache_key] = {
            "timestamp": now,
            "df": df_classified
        }

        return df_classified

    except Exception as e:
        print(f"Failed to fetch NASA FIRMS live data: {e}")
        raise e


def validate_firms_key(map_key: str) -> Dict[str, Any]:
    """Validates if a given NASA FIRMS MAP_KEY is active and functional."""
    if not map_key or not map_key.strip():
        return {"valid": False, "message": "MAP_KEY cannot be empty."}

    test_url = f"https://firms.modaps.eosdis.nasa.gov/api/area/csv/{map_key.strip()}/VIIRS_NOAA20_NRT/68,6,98,37/1"
    req = urllib.request.Request(
        test_url,
        headers={"User-Agent": "PyroGuard-Validator/1.0"}
    )

    try:
        with urllib.request.urlopen(req, timeout=10) as response:
            csv_text = response.read().decode("utf-8")
        
        if "Invalid MAP_KEY" in csv_text:
            return {"valid": False, "message": "Invalid NASA FIRMS MAP_KEY."}

        return {"valid": True, "message": "NASA FIRMS MAP_KEY is valid and connected!"}

    except Exception as err:
        return {"valid": False, "message": f"Connection error: {str(err)}"}
