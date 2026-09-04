# PyroGuard — Implementation Plan

**Project:** Wildfire vs. Industrial Heat-Source Classifier for India (NASA FIRMS/VIIRS data)
**Goal:** Build a full-stack web app (React frontend + FastAPI backend) around an existing trained XGBoost classifier and pre-processed satellite fire-detection data.

Give this entire document to your IDE / AI coding assistant as the spec. It describes exact file structure, data contracts, API endpoints, and component responsibilities so the assistant can generate working code directly.

---

## 1. What already exists (inputs to this project)

These files exist and must be treated as fixed inputs — do not regenerate or retrain them.

| File | Type | Purpose |
|---|---|---|
| `fire_classifier_model.pkl` | `xgboost.sklearn.XGBClassifier` (3 classes, multi:softprob objective) | Trained classifier that predicts fire type |
| `feature_scaler.pkl` | `sklearn.preprocessing.StandardScaler` | Must be applied to raw features before calling `model.predict()` |
| `feature_names (1).txt` | text, comma-separated | Exact order of the 16 features the scaler/model expect |
| `type_mapping.json` | JSON | Maps original label → training label index: `{"0":0,"2":1,"3":2}` |
| `reverse_mapping.json` | JSON | Maps model output index → original label: `{"0":0,"1":2,"2":3}` |
| `firms_india_2024_features (1).csv` | CSV | Full feature-engineered dataset (has lat/lon + all 16 model features + metadata) |
| `firms_india_2024_corrected (1).csv` | CSV | Raw/corrected detections (lat/lon, brightness temps, FRP, type label, no engineered features) |
| `viirs-jpss1_2024_India.csv` | CSV | Raw VIIRS source data |
| `misclassified_type0_as_type2 (1).csv` | CSV | Model error analysis subset |
| `misclassified_industrial_points (1).html` | Folium HTML | Existing static map of misclassified points |
| `pyroguard_demo_map.html` | Folium HTML | Existing static demo map (Leaflet-based) — use as visual/UX reference only |
| `thermal_signatures_comparison.png` | image | Reference chart comparing thermal signatures by class |

### Model input contract (16 features, in this exact order)

```
bright_ti4, bright_ti5, temp_diff, temp_ratio, frp, frp_log,
intensity_score, day_of_year, month, week, quarter, day_of_week,
hour, is_night, detection_count, confidence_numeric
```

### Label semantics

- Raw/original type labels in the data: `0`, `2`, `3`
- `type_mapping.json` converts these to the 0/1/2 the model was trained on
- `reverse_mapping.json` converts model output (0/1/2) back to the original label (0/2/3)
- **Recommended real-world names** (confirm against your own class definitions before shipping):
  - `0` → Vegetation / Wildfire
  - `2` → Industrial / Static thermal source
  - `3` → Other / Offshore/volcanic (confirm actual meaning from your training notebook)

---

## 2. Target architecture

```
┌─────────────────────────┐        HTTPS/JSON        ┌──────────────────────────┐
│   React Frontend (Vite) │ ────────────────────────▶ │   FastAPI Backend        │
│   - Map dashboard        │ ◀──────────────────────── │   - loads .pkl at startup │
│   - Prediction form      │                           │   - /predict endpoint    │
│   - Charts/stats panel   │                           │   - /detections endpoint │
└─────────────────────────┘                           │   - /stats endpoint      │
                                                        └──────────────────────────┘
```

No database is required for v1 — the backend reads directly from the existing CSVs at startup and serves them from memory (pandas DataFrame). This can be swapped for a real DB later without changing the frontend contract.

---

## 3. Backend: FastAPI service

### 3.1 Folder structure

```
backend/
├── main.py                  # FastAPI app, CORS, route registration
├── model/
│   ├── fire_classifier_model.pkl
│   ├── feature_scaler.pkl
│   ├── type_mapping.json
│   ├── reverse_mapping.json
│   └── feature_names.txt
├── data/
│   └── firms_india_2024_features.csv
├── services/
│   ├── predictor.py          # loads model+scaler, exposes predict_one(features_dict)
│   └── data_loader.py        # loads CSV into a pandas DataFrame at startup
├── schemas.py                 # Pydantic request/response models
├── requirements.txt
└── README.md
```

### 3.2 `requirements.txt`

```
fastapi
uvicorn[standard]
pandas
scikit-learn==1.8.0
xgboost
joblib
python-multipart
```

> Note: the scaler was originally pickled with scikit-learn 1.6.1 and will emit an `InconsistentVersionWarning` under 1.8.0. This is safe to ignore for now, but pin scikit-learn to 1.6.1 if you want to silence it.

### 3.3 `services/predictor.py` — responsibilities

- On import: load `fire_classifier_model.pkl` and `feature_scaler.pkl` with `joblib.load(...)`, load `feature_names.txt` (split on comma) and `reverse_mapping.json`.
- Expose `predict_one(features: dict) -> dict`:
  1. Build a single-row DataFrame using `feature_names` order (raise `400` if any required feature key is missing).
  2. Apply `scaler.transform(...)`.
  3. Call `model.predict(...)` and `model.predict_proba(...)`.
  4. Map the predicted class index through `reverse_mapping.json` to get the original label.
  5. Return `{ "predicted_label": <int>, "predicted_class_name": <str>, "confidence": <float>, "class_probabilities": {label: prob, ...} }`.

### 3.4 `services/data_loader.py` — responsibilities

- Load `firms_india_2024_features.csv` into a module-level pandas DataFrame at startup.
- Expose `get_detections(filters) -> list[dict]` supporting optional query filters: `month`, `type`, `min_confidence`, `daynight`, and a `limit`/`page` for pagination (dataset may be large — do not send 100k+ rows to the browser at once; default `limit=2000`).
- Expose `get_summary_stats() -> dict` returning: total detection count, counts by type, counts by month, average FRP by type, day/night split — used to power the dashboard charts without shipping raw rows.

### 3.5 API contract

#### `GET /health`
Returns `{"status": "ok"}`. Used by the frontend to confirm backend is reachable before rendering.

#### `GET /detections`
Query params: `type` (optional, comma-separated original labels), `month` (optional, 1–12), `min_confidence` (optional float), `limit` (default 2000), `offset` (default 0).

Response:
```json
{
  "total": 48213,
  "count": 2000,
  "results": [
    {
      "latitude": 24.82792,
      "longitude": 93.75638,
      "type": 0,
      "type_name": "Vegetation/Wildfire",
      "bright_ti4": 339.55,
      "bright_ti5": 288.58,
      "frp": 4.46,
      "confidence": "n",
      "acq_date": "2024-01-01",
      "daynight": "D"
    }
  ]
}
```

#### `GET /stats`
Response:
```json
{
  "total_detections": 48213,
  "by_type": {"0": 30211, "2": 15002, "3": 3000},
  "by_month": {"1": 4210, "2": 3900, "...": "..."},
  "avg_frp_by_type": {"0": 12.4, "2": 8.1, "3": 5.6},
  "daynight_split": {"D": 28000, "N": 20213}
}
```

#### `POST /predict`
Request body (all 16 raw feature values):
```json
{
  "bright_ti4": 339.55,
  "bright_ti5": 288.58,
  "temp_diff": 50.97,
  "temp_ratio": 1.1766,
  "frp": 4.46,
  "frp_log": 1.6974,
  "intensity_score": 15.14,
  "day_of_year": 1,
  "month": 1,
  "week": 1,
  "quarter": 1,
  "day_of_week": 0,
  "hour": 6,
  "is_night": 0,
  "detection_count": 1,
  "confidence_numeric": 0.7
}
```

Response:
```json
{
  "predicted_label": 0,
  "predicted_class_name": "Vegetation/Wildfire",
  "confidence": 0.94,
  "class_probabilities": {"0": 0.94, "2": 0.04, "3": 0.02}
}
```

- Validate with a Pydantic model; return `422` automatically on missing/invalid fields via FastAPI.
- Wrap prediction logic in try/except → return `500` with a clear error message on failure (e.g., scaler/model mismatch).

### 3.6 `main.py` — responsibilities

- Instantiate `FastAPI()`.
- Add `CORSMiddleware` allowing the frontend's dev origin (`http://localhost:5173`) and production origin (set via env var `FRONTEND_ORIGIN`).
- Register the three route groups (`/health`, `/detections`, `/stats`, `/predict`).
- Run with: `uvicorn main:app --reload --port 8000`.

---

## 4. Frontend: React (Vite) application

### 4.1 Folder structure

```
frontend/
├── index.html
├── package.json
├── vite.config.js
├── tailwind.config.js
├── src/
│   ├── main.jsx
│   ├── App.jsx
│   ├── api/
│   │   └── client.js              # axios instance, base URL from env
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Header.jsx
│   │   │   └── Sidebar.jsx        # filters: type, month, confidence
│   │   ├── map/
│   │   │   ├── FireMap.jsx        # react-leaflet map + markers
│   │   │   └── MapLegend.jsx
│   │   ├── stats/
│   │   │   ├── StatsSummaryCards.jsx
│   │   │   ├── DetectionsByMonthChart.jsx
│   │   │   └── TypeBreakdownChart.jsx
│   │   └── predict/
│   │       ├── PredictionForm.jsx
│   │       └── PredictionResult.jsx
│   ├── hooks/
│   │   ├── useDetections.js       # fetch + filter state
│   │   └── useStats.js
│   └── styles/
│       └── index.css              # Tailwind entry
└── .env                           # VITE_API_BASE_URL=http://localhost:8000
```

### 4.2 Tech stack

- **React 18 + Vite** — app shell and dev server
- **react-leaflet + leaflet** — map rendering
- **Recharts** — bar/line/pie charts for stats
- **Tailwind CSS** — styling
- **axios** — API calls
- **react-hook-form** (optional but recommended) — validation for the prediction form's 16 numeric inputs

### 4.3 Component responsibilities

**`App.jsx`**
Top-level layout: `Header` + `Sidebar` (filters) on the left, main content area split into `FireMap` (top) and `StatsSummaryCards` / charts (bottom), with a `PredictionForm` accessible via a tab or modal.

**`Sidebar.jsx`**
Holds filter state (type checkboxes for the 3 classes, month range slider/select, min-confidence slider). Lifts state up to `App` so both the map and stats respond to the same filters.

**`FireMap.jsx`**
- Uses `react-leaflet`'s `MapContainer`, `TileLayer` (OpenStreetMap tiles), and `CircleMarker` for each detection.
- Color-codes markers by `type_name` (e.g., red = wildfire, orange = industrial, gray = other).
- On marker click, show a popup with `bright_ti4`, `bright_ti5`, `frp`, `acq_date`, `confidence`.
- Fetches from `GET /detections` via `useDetections(filters)`, re-fetching when filters change (debounce ~300ms).
- Because the dataset can be large, cap markers at the `limit` returned by the API and show a "Showing X of Y detections — narrow your filters to see more" note when `count < total`.

**`StatsSummaryCards.jsx`**
Small cards showing total detections, % wildfire vs industrial, average FRP — sourced from `GET /stats`.

**`TypeBreakdownChart.jsx`** / **`DetectionsByMonthChart.jsx`**
Recharts pie chart and bar chart respectively, driven by `/stats` response.

**`PredictionForm.jsx`**
- A form with 16 numeric inputs matching the feature list in Section 1. Pre-fill sensible defaults (e.g., from a sample row) so a user isn't stuck typing everything from scratch.
- On submit, POST to `/predict`, show a loading state, then render `PredictionResult.jsx`.

**`PredictionResult.jsx`**
Displays predicted class name, confidence %, and a small bar chart of `class_probabilities`.

### 4.4 `.env`

```
VITE_API_BASE_URL=http://localhost:8000
```

`api/client.js` reads this via `import.meta.env.VITE_API_BASE_URL`.

---

## 5. Build order (do this sequentially)

1. **Backend skeleton** — set up `main.py` with `/health` only, confirm it runs (`uvicorn main:app --reload`).
2. **Predictor service** — implement `predictor.py`, test `/predict` with `curl` using the sample payload in Section 3.5 before touching the frontend.
3. **Data loader + `/detections` + `/stats`** — implement and test with `curl`/Postman, confirming pagination and filters work.
4. **CORS** — enable it, confirm a fetch from a plain `fetch()` in the browser console works against `http://localhost:8000`.
5. **Frontend scaffold** — `npm create vite@latest frontend -- --template react`, install dependencies (react-leaflet, leaflet, recharts, axios, tailwindcss).
6. **Map first** — get `FireMap.jsx` rendering static markers from `/detections` before adding filters.
7. **Filters + Sidebar** — wire filter state into the map fetch.
8. **Stats panel** — add summary cards and charts from `/stats`.
9. **Prediction form** — build and connect last, since it's independent of the map/filter state.
10. **Styling pass** — apply Tailwind layout/theme once everything works functionally.
11. **Deploy** — backend to Render/Railway, frontend to Vercel/Netlify; set `VITE_API_BASE_URL` and `FRONTEND_ORIGIN` env vars accordingly.

---

## 6. Things to double check before/while building

- Confirm the real-world meaning of original labels `0`, `2`, `3` (this plan guesses "Vegetation/Wildfire", "Industrial", "Other" — verify against your training notebook or dataset documentation and rename in `type_mapping`/UI accordingly).
- Pin `scikit-learn` version close to `1.6.1` to avoid the version-mismatch warning affecting scaler output.
- The `firms_india_2024_features (1).csv` file may be large — check its row count; if it's over ~50k rows, definitely keep server-side pagination rather than sending it all to the browser.
- Rename uploaded files (strip spaces/parentheses, e.g. `firms_india_2024_features (1).csv` → `firms_india_2024_features.csv`) before referencing them in code, since spaces in filenames cause friction in Python/JS tooling.
