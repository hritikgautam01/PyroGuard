import os
import pandas as pd
from typing import List, Dict, Optional, Any

from services import firms_live

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_PATH = os.path.join(BASE_DIR, "data", "firms_india_2024_features.csv")

CLASS_NAME_MAP = {
    0: "Vegetation / Wildfire",
    2: "Industrial / Static Thermal",
    3: "Other / Offshore Thermal"
}

_df_cache: Optional[pd.DataFrame] = None

def load_dataset() -> pd.DataFrame:
    global _df_cache
    if _df_cache is not None:
        return _df_cache

    if not os.path.exists(DATA_PATH):
        raise FileNotFoundError(f"Dataset CSV not found at {DATA_PATH}")

    print(f"Loading dataset from {DATA_PATH}...")
    df = pd.read_csv(DATA_PATH)

    # Ensure type and numeric fields are properly typed
    if "type" in df.columns:
        df["type"] = df["type"].fillna(0).astype(int)

    if "acq_date" in df.columns:
        dt_series = pd.to_datetime(df["acq_date"], errors="coerce")
        df["month"] = dt_series.dt.month.fillna(1).astype(int)
        df["year"] = dt_series.dt.year.fillna(2024).astype(int)
    elif "month" in df.columns:
        df["month"] = df["month"].fillna(1).astype(int)
        df["year"] = 2024

    if "confidence_numeric" in df.columns:
        df["confidence_numeric"] = pd.to_numeric(df["confidence_numeric"], errors="coerce").fillna(0.7)

    # Cache dataset
    _df_cache = df
    print(f"Dataset loaded: {len(df)} total rows.")
    return _df_cache


def get_detections(
    types: Optional[List[int]] = None,
    month: Optional[int] = None,
    year: Optional[int] = None,
    min_confidence: Optional[float] = None,
    daynight: Optional[str] = None,
    limit: int = 2000,
    offset: int = 0,
    stream_mode: str = "archive",
    source: str = "VIIRS_NOAA20_NRT",
    day_range: int = 1,
    firms_map_key: str = ""
) -> Dict[str, Any]:

    if stream_mode == "live":
        # Fetch live data from NASA FIRMS API and classify using XGBoost model
        try:
            df = firms_live.fetch_firms_live_data(
                map_key=firms_map_key,
                source=source,
                day_range=day_range
            )
        except ValueError as ve:
            return {
                "total": 0,
                "count": 0,
                "results": [],
                "error": str(ve)
            }
        except Exception as e:
            return {
                "total": 0,
                "count": 0,
                "results": [],
                "error": f"Live FIRMS fetch failed: {str(e)}"
            }
    else:
        # Archive dataset mode
        df = load_dataset()

    # Start with the complete dataset
    filtered = df

    # =========================================================
    # YEAR FILTER (Archive mode)
    # =========================================================
    if year is not None and year > 0 and stream_mode != "live":
        if "year" in filtered.columns:
            year_mask = filtered["year"] == year
            # If requested year exists in dataset, filter by it.
            # If dataset only has 2024 and user selected a different year, return empty or filtered.
            if year_mask.any():
                filtered = filtered[year_mask]
            elif "acq_date" in filtered.columns:
                dt_years = pd.to_datetime(filtered["acq_date"], errors="coerce").dt.year
                if (dt_years == year).any():
                    filtered = filtered[dt_years == year]

    # =========================================================
    # TYPE FILTER
    # =========================================================
    if types is not None:
        if len(types) == 0:
            filtered = filtered.iloc[0:0]
        else:
            if "type" in filtered.columns:
                filtered = filtered[filtered["type"].isin(types)]

    # =========================================================
    # MONTH FILTER
    # =========================================================

    if month is not None and month > 0:
        filtered = filtered[
            filtered["month"] == month
        ]

    # =========================================================
    # DAY / NIGHT FILTER
    # =========================================================

    if daynight and daynight in ["D", "N"]:

        if "daynight" in filtered.columns:
            filtered = filtered[
                filtered["daynight"] == daynight
            ]

    # =========================================================
    # CONFIDENCE FILTER
    # =========================================================

    if min_confidence is not None:

        if "confidence_numeric" in filtered.columns:
            filtered = filtered[
                filtered["confidence_numeric"] >= min_confidence
            ]

    # =========================================================
    # TOTAL MATCHING RECORDS
    # =========================================================

    total_matching = len(filtered)

    # =========================================================
    # PAGINATION
    # =========================================================

    sliced = filtered.iloc[
        offset : offset + limit
    ]

    # =========================================================
    # CONVERT DATASET ROWS TO API RESPONSE
    # =========================================================

    results = []

    for _, row in sliced.iterrows():

        t_val = int(row.get("type", 0))

        results.append({

            # ---------------------------------------------
            # Original FIRMS fields
            # ---------------------------------------------

            "latitude": float(
                row.get("latitude", 0.0)
            ),

            "longitude": float(
                row.get("longitude", 0.0)
            ),

            "type": t_val,

            "type_name": CLASS_NAME_MAP.get(
                t_val,
                f"Type {t_val}"
            ),

            "bright_ti4": round(
                float(row.get("bright_ti4", 0.0)),
                2
            ),

            "bright_ti5": round(
                float(row.get("bright_ti5", 0.0)),
                2
            ),

            "frp": round(
                float(row.get("frp", 0.0)),
                2
            ),

            "confidence": str(
                row.get("confidence", "n")
            ),

            "acq_date": str(
                row.get("acq_date", "2024-01-01")
            ),

            "daynight": str(
                row.get("daynight", "D")
            ),

            # ---------------------------------------------
            # XGBoost engineered features
            # ---------------------------------------------

            "temp_diff": float(
                row.get("temp_diff", 0.0)
            ),

            "temp_ratio": float(
                row.get("temp_ratio", 0.0)
            ),

            "frp_log": float(
                row.get("frp_log", 0.0)
            ),

            "intensity_score": float(
                row.get("intensity_score", 0.0)
            ),

            "confidence_numeric": float(
                row.get("confidence_numeric", 0.0)
            ),

            # ---------------------------------------------
            # Temporal features
            # ---------------------------------------------

            "day_of_year": int(
                row.get("day_of_year", 1)
            ),

            "month": int(
                row.get("month", 1)
            ),

            "week": int(
                row.get("week", 1)
            ),

            "quarter": int(
                row.get("quarter", 1)
            ),

            "day_of_week": int(
                row.get("day_of_week", 0)
            ),

            "hour": int(
                row.get("hour", 0)
            ),

            "is_night": int(
                row.get("is_night", 0)
            ),

            # ---------------------------------------------
            # Detection history
            # ---------------------------------------------

            "detection_count": int(
                row.get("detection_count", 1)
            )
        })

    # =========================================================
    # API RESPONSE
    # =========================================================

    return {
        "total": total_matching,
        "count": len(results),
        "results": results
    }

def get_summary_stats() -> Dict[str, Any]:
    df = load_dataset()

    # Only count heat-source classes supported by PyroGuard
    supported_types = [0, 2, 3]
    df = df[df["type"].isin(supported_types)].copy()

    total_count = len(df)
    # By type breakdown
    by_type = {}
    if "type" in df.columns:
        counts = df["type"].value_counts().to_dict()
        for k, v in counts.items():
            by_type[str(int(k))] = int(v)

    # By month breakdown
    by_month = {}
    if "month" in df.columns:
        m_counts = df["month"].value_counts().sort_index().to_dict()
        for k, v in m_counts.items():
            by_month[str(int(k))] = int(v)

    # Avg FRP by type
    avg_frp_by_type = {}
    if "type" in df.columns and "frp" in df.columns:
        frp_means = df.groupby("type")["frp"].mean().to_dict()
        for k, v in frp_means.items():
            avg_frp_by_type[str(int(k))] = round(float(v), 2)

    # Day / Night split
    daynight_split = {"D": 0, "N": 0}
    if "daynight" in df.columns:
        dn_counts = df["daynight"].value_counts().to_dict()
        for k, v in dn_counts.items():
            if str(k).upper() in ["D", "N"]:
                daynight_split[str(k).upper()] = int(v)

    return {
        "total_detections": total_count,
        "by_type": by_type,
        "by_month": by_month,
        "avg_frp_by_type": avg_frp_by_type,
        "daynight_split": daynight_split
    }
