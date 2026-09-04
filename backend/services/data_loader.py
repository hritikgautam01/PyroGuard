import os
import pandas as pd
from typing import List, Dict, Optional, Any

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

    if "month" in df.columns:
        df["month"] = df["month"].fillna(1).astype(int)
    elif "acq_date" in df.columns:
        df["month"] = pd.to_datetime(df["acq_date"], errors="coerce").dt.month.fillna(1).astype(int)

    if "confidence_numeric" in df.columns:
        df["confidence_numeric"] = pd.to_numeric(df["confidence_numeric"], errors="coerce").fillna(0.7)

    # Cache dataset
    _df_cache = df
    print(f"Dataset loaded: {len(df)} total rows.")
    return _df_cache


def get_detections(
    types: Optional[List[int]] = None,
    month: Optional[int] = None,
    min_confidence: Optional[float] = None,
    daynight: Optional[str] = None,
    limit: int = 2000,
    offset: int = 0
) -> Dict[str, Any]:
    df = load_dataset()

    filtered = df

    if types:
        filtered = filtered[filtered["type"].isin(types)]

    if month is not None and month > 0:
        filtered = filtered[filtered["month"] == month]

    if daynight and daynight in ["D", "N"]:
        if "daynight" in filtered.columns:
            filtered = filtered[filtered["daynight"] == daynight]

    if min_confidence is not None:
        if "confidence_numeric" in filtered.columns:
            filtered = filtered[filtered["confidence_numeric"] >= min_confidence]

    total_matching = len(filtered)

    # Slice offset and limit
    sliced = filtered.iloc[offset : offset + limit]

    results = []
    for _, row in sliced.iterrows():
        t_val = int(row.get("type", 0))
        results.append({
            "latitude": float(row.get("latitude", 0.0)),
            "longitude": float(row.get("longitude", 0.0)),
            "type": t_val,
            "type_name": CLASS_NAME_MAP.get(t_val, f"Type {t_val}"),
            "bright_ti4": round(float(row.get("bright_ti4", 0.0)), 2),
            "bright_ti5": round(float(row.get("bright_ti5", 0.0)), 2),
            "frp": round(float(row.get("frp", 0.0)), 2),
            "confidence": str(row.get("confidence", "n")),
            "acq_date": str(row.get("acq_date", "2024-01-01")),
            "daynight": str(row.get("daynight", "D"))
        })

    return {
        "total": total_matching,
        "count": len(results),
        "results": results
    }


def get_summary_stats() -> Dict[str, Any]:
    df = load_dataset()

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
