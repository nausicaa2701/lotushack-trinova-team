from fastapi import APIRouter

from app.core.geo import haversine_km
from app.schemas import RouteBounds, RoutePreviewRequest, RoutePreviewResponse

router = APIRouter()


@router.post("/preview", response_model=RoutePreviewResponse)
def route_preview(payload: RoutePreviewRequest):
    distance_km = haversine_km(
        payload.origin.lat,
        payload.origin.lng,
        payload.destination.lat,
        payload.destination.lng,
    )
    duration_min = max(1, int((distance_km / 35) * 60))

    north = max(payload.origin.lat, payload.destination.lat)
    south = min(payload.origin.lat, payload.destination.lat)
    east = max(payload.origin.lng, payload.destination.lng)
    west = min(payload.origin.lng, payload.destination.lng)

    polyline = f"{payload.origin.lat},{payload.origin.lng};{payload.destination.lat},{payload.destination.lng}"

    return RoutePreviewResponse(
        distanceKm=round(distance_km, 2),
        durationMin=duration_min,
        polyline=polyline,
        bounds=RouteBounds(north=north, south=south, east=east, west=west),
    )
