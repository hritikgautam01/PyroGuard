import os
from typing import List, Optional

from fastapi import FastAPI, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from schemas import (
    PredictRequest,
    PredictResponse,
    DetectionsResponse,
    StatsResponse
)

from services import predictor, data_loader, infrastructure, firms_live


app = FastAPI(
    title="PyroGuard API",
    description="Wildfire vs. Industrial Heat-Source Classifier for India (NASA FIRMS dataset)",
    version="1.0.0"
)


# =========================================================
# CORS SETUP
# =========================================================

frontend_origin = os.getenv(
    "FRONTEND_ORIGIN",
    "http://localhost:5173"
)

origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    frontend_origin
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# =========================================================
# STARTUP
# =========================================================

@app.on_event("startup")
def startup_event():

    print("Initializing PyroGuard backend services...")

    try:

        data_loader.load_dataset()
        predictor.load_predictor()

        print("Backend models and datasets ready!")

    except Exception as e:

        print(
            f"Warning during startup initialization: {e}"
        )


# =========================================================
# HEALTH CHECK
# =========================================================

@app.get(
    "/health",
    summary="Health check endpoint"
)
def health_check():

    return {
        "status": "ok",
        "service": "PyroGuard API",
        "version": "1.0.0"
    }


# =========================================================
# DETECTIONS
# =========================================================

@app.get(
    "/detections",
    response_model=DetectionsResponse,
    summary="Get satellite fire detections"
)
def get_detections_endpoint(

    type: Optional[str] = Query(
        None,
        description="Comma-separated type values e.g. 0,2,3"
    ),

    month: Optional[int] = Query(
        None,
        ge=1,
        le=12,
        description="Filter by month (1-12)"
    ),

    year: Optional[int] = Query(
        None,
        description="Filter by year e.g. 2024, 2023"
    ),

    min_confidence: Optional[float] = Query(
        None,
        ge=0.0,
        le=1.0,
        description="Minimum confidence threshold"
    ),

    daynight: Optional[str] = Query(
        None,
        description="Filter 'D' for Day, 'N' for Night"
    ),

    limit: int = Query(
        2000,
        ge=1,
        le=10000,
        description="Max detections to return"
    ),

    offset: int = Query(
        0,
        ge=0,
        description="Pagination offset"
    ),

    stream_mode: str = Query(
        "archive",
        description="Data stream mode: 'archive' or 'live'"
    ),

    source: str = Query(
        "VIIRS_NOAA20_NRT",
        description="FIRMS Satellite source e.g. VIIRS_NOAA20_NRT, VIIRS_SNPP_NRT, MODIS_NRT"
    ),

    day_range: int = Query(
        1,
        ge=1,
        le=10,
        description="Time window in days for live FIRMS data"
    ),

    firms_map_key: str = Query(
        "",
        description="NASA FIRMS MAP KEY"
    )
):

    # -----------------------------------------------------
    # TYPE FILTER
    # -----------------------------------------------------

    type_list = None

    # None  = no type filter
    # ""    = explicitly no types selected
    # "0,2" = show only types 0 and 2

    if type is not None:

        try:

            type_list = [
                int(t.strip())
                for t in type.split(",")
                if t.strip()
            ]

        except ValueError:

            raise HTTPException(
                status_code=400,
                detail=(
                    "Invalid format for 'type'. "
                    "Must be comma-separated integers."
                )
            )

    # -----------------------------------------------------
    # GET FILTERED DETECTIONS
    # -----------------------------------------------------

    return data_loader.get_detections(

        types=type_list,

        month=month,

        year=year,

        min_confidence=min_confidence,

        daynight=daynight,

        limit=limit,

        offset=offset,

        stream_mode=stream_mode,

        source=source,

        day_range=day_range,

        firms_map_key=firms_map_key
    )


# =========================================================
# NASA FIRMS MAP KEY VALIDATION
# =========================================================

@app.get(
    "/firms/validate",
    summary="Validate NASA FIRMS MAP KEY"
)
def validate_firms_key_endpoint(
    map_key: str = Query(..., description="NASA FIRMS MAP KEY to validate")
):
    return firms_live.validate_firms_key(map_key)


# =========================================================
# INDUSTRIAL INFRASTRUCTURE
# =========================================================

@app.get(
    "/infrastructure",
    summary="Find nearby industrial infrastructure"
)
def get_infrastructure_endpoint(

    latitude: float = Query(
        ...,
        description="Heat point latitude"
    ),

    longitude: float = Query(
        ...,
        description="Heat point longitude"
    ),

    radius_km: float = Query(
        10.0,
        ge=0.5,
        le=50.0,
        description="Search radius in kilometers"
    )
):

    return infrastructure.get_nearby_infrastructure(

        latitude=latitude,

        longitude=longitude,

        radius_km=radius_km
    )


# =========================================================
# STATISTICS
# =========================================================

@app.get(
    "/stats",
    response_model=StatsResponse,
    summary="Get dataset summary statistics"
)
def get_stats_endpoint():

    return data_loader.get_summary_stats()


# =========================================================
# AI PREDICTION
# =========================================================

@app.post(
    "/predict",
    response_model=PredictResponse,
    summary="Predict fire type using XGBoost model"
)
def predict_endpoint(
    payload: PredictRequest
):

    features_dict = payload.model_dump()

    return predictor.predict_one(
        features_dict
    )


# =========================================================
# RUN SERVER
# =========================================================

if __name__ == "__main__":

    import uvicorn

    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    )
    
