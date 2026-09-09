import math
import requests
from typing import List, Dict, Any


# =========================================================
# OVERPASS API
# =========================================================

OVERPASS_URL = "https://overpass-api.de/api/interpreter"

DEFAULT_RADIUS_KM = 10


# =========================================================
# HAVERSINE DISTANCE
# =========================================================

def calculate_distance_km(
    lat1: float,
    lon1: float,
    lat2: float,
    lon2: float
) -> float:

    earth_radius_km = 6371.0

    lat1_rad = math.radians(lat1)
    lat2_rad = math.radians(lat2)

    delta_lat = math.radians(lat2 - lat1)
    delta_lon = math.radians(lon2 - lon1)

    a = (
        math.sin(delta_lat / 2) ** 2
        +
        math.cos(lat1_rad)
        * math.cos(lat2_rad)
        * math.sin(delta_lon / 2) ** 2
    )

    c = 2 * math.atan2(
        math.sqrt(a),
        math.sqrt(1 - a)
    )

    return earth_radius_km * c


# =========================================================
# OVERPASS QUERY
# =========================================================

def query_overpass(query: str) -> List[Dict[str, Any]]:

    try:

        response = requests.post(
            OVERPASS_URL,
            data={"data": query},
            headers={
                "User-Agent": "PyroGuard/1.0"
            },
            timeout=60
        )

        response.raise_for_status()

        data = response.json()

        return data.get("elements", [])

    except requests.RequestException as e:

        print(
            f"Overpass API request failed: {e}"
        )

        return []


# =========================================================
# GET ELEMENT COORDINATES
# =========================================================

def get_element_coordinates(
    element: Dict[str, Any]
):

    # Node
    if "lat" in element and "lon" in element:

        return (
            float(element["lat"]),
            float(element["lon"])
        )

    # Way / relation
    center = element.get("center")

    if center:

        return (
            float(center["lat"]),
            float(center["lon"])
        )

    return None


# =========================================================
# GET NAME
# =========================================================

def get_element_name(
    element: Dict[str, Any]
) -> str:

    tags = element.get("tags", {})

    return (
        tags.get("name")
        or tags.get("operator")
        or tags.get("brand")
        or "Unnamed facility"
    )


# =========================================================
# CLASSIFY OSM ELEMENT
# =========================================================

def classify_infrastructure(
    tags: Dict[str, Any]
) -> str:

    # Power plants
    if tags.get("power") == "plant":
        return "power_plant"

    # Refineries / petroleum facilities
    if tags.get("industrial") in [
        "oil",
        "gas",
        "petroleum",
        "refinery"
    ]:
        return "refinery"

    # Factory / industrial works
    if tags.get("man_made") == "works":
        return "factory"

    # Industrial land
    if tags.get("landuse") == "industrial":
        return "industrial"

    # Industrial buildings
    if tags.get("building") == "industrial":
        return "industrial"

    return "industrial"


# =========================================================
# FIND NEARBY INFRASTRUCTURE
# =========================================================

def get_nearby_infrastructure(
    latitude: float,
    longitude: float,
    radius_km: float = DEFAULT_RADIUS_KM
) -> Dict[str, Any]:

    radius_m = int(radius_km * 1000)

    # -----------------------------------------------------
    # BROADER OSM QUERY
    # -----------------------------------------------------

    query = f"""
    [out:json][timeout:50];

    (
        /* Power plants */
        nwr["power"="plant"]
            (around:{radius_m},{latitude},{longitude});

        /* Industrial areas */
        nwr["landuse"="industrial"]
            (around:{radius_m},{latitude},{longitude});

        /* Factories / industrial works */
        nwr["man_made"="works"]
            (around:{radius_m},{latitude},{longitude});

        /* Industrial buildings */
        nwr["building"="industrial"]
            (around:{radius_m},{latitude},{longitude});

        /* Refineries */
        nwr["industrial"="oil"]
            (around:{radius_m},{latitude},{longitude});

        nwr["industrial"="gas"]
            (around:{radius_m},{latitude},{longitude});

        nwr["industrial"="petroleum"]
            (around:{radius_m},{latitude},{longitude});

        nwr["industrial"="refinery"]
            (around:{radius_m},{latitude},{longitude});
    );

    out center tags;
    """

    elements = query_overpass(query)

    infrastructure = []

    # -----------------------------------------------------
    # PROCESS RESULTS
    # -----------------------------------------------------

    for element in elements:

        coordinates = get_element_coordinates(
            element
        )

        if coordinates is None:
            continue

        facility_lat, facility_lon = coordinates

        distance = calculate_distance_km(
            latitude,
            longitude,
            facility_lat,
            facility_lon
        )

        tags = element.get("tags", {})

        infrastructure_type = classify_infrastructure(
            tags
        )

        infrastructure.append({

            "type": infrastructure_type,

            "name": get_element_name(
                element
            ),

            "distance_km": round(
                distance,
                2
            ),

            "latitude": facility_lat,

            "longitude": facility_lon

        })

    # -----------------------------------------------------
    # REMOVE DUPLICATES
    # -----------------------------------------------------

    unique = {}

    for item in infrastructure:

        key = (
            item["type"],
            item["name"],
            round(item["latitude"], 4),
            round(item["longitude"], 4)
        )

        unique[key] = item

    infrastructure = list(
        unique.values()
    )

    # -----------------------------------------------------
    # SORT BY DISTANCE
    # -----------------------------------------------------

    infrastructure.sort(
        key=lambda x: x["distance_km"]
    )

    # -----------------------------------------------------
    # LIMIT RESULTS
    # -----------------------------------------------------

    infrastructure = infrastructure[:20]

    # -----------------------------------------------------
    # SUMMARY
    # -----------------------------------------------------

    return {

        "latitude": latitude,

        "longitude": longitude,

        "search_radius_km": radius_km,

        "count": len(infrastructure),

        "nearby_infrastructure": infrastructure

    }