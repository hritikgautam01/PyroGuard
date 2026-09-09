from pydantic import BaseModel, Field
from typing import Dict, List, Optional

class PredictRequest(BaseModel):
    bright_ti4: float = Field(..., example=339.55, description="Brightness temperature ti4 (K)")
    bright_ti5: float = Field(..., example=288.58, description="Brightness temperature ti5 (K)")
    temp_diff: float = Field(..., example=50.97, description="Temperature difference (ti4 - ti5)")
    temp_ratio: float = Field(..., example=1.1766, description="Temperature ratio (ti4 / ti5)")
    frp: float = Field(..., example=4.46, description="Fire Radiative Power (MW)")
    frp_log: float = Field(..., example=1.6974, description="Log-transformed FRP")
    intensity_score: float = Field(..., example=15.14, description="Thermal intensity score")
    day_of_year: int = Field(..., example=1, ge=1, le=366)
    month: int = Field(..., example=1, ge=1, le=12)
    week: int = Field(..., example=1, ge=1, le=53)
    quarter: int = Field(..., example=1, ge=1, le=4)
    day_of_week: int = Field(..., example=0, ge=0, le=6)
    hour: int = Field(..., example=6, ge=0, le=23)
    is_night: int = Field(..., example=0, ge=0, le=1)
    detection_count: int = Field(..., example=1, ge=1)
    confidence_numeric: float = Field(..., example=0.7, ge=0.0, le=1.0)

class PredictResponse(BaseModel):
    predicted_label: int
    predicted_class_name: str
    confidence: float
    class_probabilities: Dict[str, float]

class DetectionItem(BaseModel):
    latitude: float
    longitude: float
    type: int
    type_name: str

    # Original FIRMS telemetry
    bright_ti4: float
    bright_ti5: float
    frp: float
    confidence: str
    acq_date: str
    daynight: str

    # Engineered features used by XGBoost
    temp_diff: float
    temp_ratio: float
    frp_log: float
    intensity_score: float
    confidence_numeric: float

    # Temporal features
    day_of_year: int
    month: int
    week: int
    quarter: int
    day_of_week: int
    hour: int
    is_night: int

    # Detection history
    detection_count: int
    
class DetectionsResponse(BaseModel):
    total: int
    count: int
    results: List[DetectionItem]

class StatsResponse(BaseModel):
    total_detections: int
    by_type: Dict[str, int]
    by_month: Dict[str, int]
    avg_frp_by_type: Dict[str, float]
    daynight_split: Dict[str, int]
