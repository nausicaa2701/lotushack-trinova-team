from datetime import datetime
from decimal import Decimal

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.core.geo import haversine_km
from app.models import Merchant, SearchLog
from app.schemas import (
    NearbySearchRequest,
    NearbySearchResponse,
    OnRouteSearchRequest,
    SearchLogRequest,
    SearchResultMerchant,
)
from app.services import AIServingRepository, ArtifactUnavailableError, get_ai_serving_repository

router = APIRouter()


def _to_float(value: float | Decimal) -> float:
    return float(value)


def _service_types_match(merchant: Merchant, service_types: list[str]) -> bool:
    """Allow partial matches so FE tags like 'ceramic' match DB values like 'ceramic coating'."""
    if not service_types:
        return True
    lowered = [str(s).lower() for s in merchant.service_types]
    for req in service_types:
        rl = str(req).lower()
        if not any(rl in m or m in rl for m in lowered):
            return False
    return True


def _match_filters(merchant: Merchant, min_rating: float, open_now: bool, ev_safe: bool, service_types: list[str]) -> bool:
    if merchant.rating < min_rating:
        return False
    if open_now and not merchant.open_now:
        return False
    if ev_safe and not merchant.is_ev_safe:
        return False
    if not _service_types_match(merchant, service_types):
        return False
    return True


def _merchant_result(merchant: Merchant, distance_km: float, reason_context: str) -> SearchResultMerchant:
    tags = [reason_context]
    if merchant.rating >= 4.8:
        tags.append("Top Rated")
    if merchant.open_now:
        tags.append("Available Now")

    detour_min = max(1, int((distance_km / 30) * 60))

    return SearchResultMerchant(
        merchantId=merchant.merchant_id,
        name=merchant.name,
        lat=merchant.lat,
        lng=merchant.lng,
        rating=merchant.rating,
        successfulOrders=merchant.successful_orders,
        priceFrom=_to_float(merchant.price_from),
        distanceFromRouteKm=round(distance_km, 2),
        detourMin=detour_min,
        availableNow=merchant.open_now,
        reasonTags=tags,
    )


def _db_nearby_search(payload: NearbySearchRequest, db: Session) -> NearbySearchResponse:
    merchants = db.scalars(select(Merchant)).all()
    results: list[SearchResultMerchant] = []

    for merchant in merchants:
        if not _match_filters(
            merchant,
            payload.filters.minRating,
            payload.filters.openNow,
            payload.filters.evSafe,
            payload.filters.serviceTypes,
        ):
            continue

        distance = haversine_km(payload.location.lat, payload.location.lng, merchant.lat, merchant.lng)
        if distance > payload.radiusKm:
            continue

        results.append(_merchant_result(merchant, distance, "Near You"))

    results.sort(key=lambda x: (x.distanceFromRouteKm, -x.rating, x.priceFrom))
    return NearbySearchResponse(results=results)


def _db_on_route_search(payload: OnRouteSearchRequest, db: Session) -> NearbySearchResponse:
    merchants = db.scalars(select(Merchant)).all()
    results: list[SearchResultMerchant] = []

    for merchant in merchants:
        if not _match_filters(
            merchant,
            payload.filters.minRating,
            payload.filters.openNow,
            payload.filters.evSafe,
            payload.filters.serviceTypes,
        ):
            continue

        distance_origin_to_merchant = haversine_km(payload.origin.lat, payload.origin.lng, merchant.lat, merchant.lng)
        distance_dest_to_merchant = haversine_km(payload.destination.lat, payload.destination.lng, merchant.lat, merchant.lng)
        route_proxy_distance = min(distance_origin_to_merchant, distance_dest_to_merchant)

        if route_proxy_distance > payload.maxDetourKm:
            continue

        results.append(_merchant_result(merchant, route_proxy_distance, "On Route"))

    results.sort(key=lambda x: (x.distanceFromRouteKm, -x.rating, x.priceFrom))
    return NearbySearchResponse(results=results)


@router.post("/nearby", response_model=NearbySearchResponse)
def nearby_search(
    payload: NearbySearchRequest,
    db: Session = Depends(get_db),
    repo: AIServingRepository = Depends(get_ai_serving_repository),
):
    try:
        results = repo.search_nearby(
            latitude=payload.location.lat,
            longitude=payload.location.lng,
            radius_km=payload.radiusKm,
            filters=payload.filters.model_dump(),
        )
        return NearbySearchResponse(results=results)
    except ArtifactUnavailableError:
        return _db_nearby_search(payload, db)


@router.post("/on-route", response_model=NearbySearchResponse)
def on_route_search(
    payload: OnRouteSearchRequest,
    db: Session = Depends(get_db),
    repo: AIServingRepository = Depends(get_ai_serving_repository),
):
    try:
        results = repo.search_on_route(
            origin_lat=payload.origin.lat,
            origin_lng=payload.origin.lng,
            destination_lat=payload.destination.lat,
            destination_lng=payload.destination.lng,
            max_corridor_km=payload.maxDetourKm,
            filters=payload.filters.model_dump(),
        )
        return NearbySearchResponse(results=results)
    except ArtifactUnavailableError:
        return _db_on_route_search(payload, db)


@router.post("/logs")
def log_search_event(payload: SearchLogRequest, db: Session = Depends(get_db)):
    db_log = SearchLog(
        id=payload.id,
        user_id_anonymized=payload.user_id_anonymized,
        mode=payload.mode,
        origin_lat=payload.origin_lat,
        origin_lng=payload.origin_lng,
        destination_lat=payload.destination_lat,
        destination_lng=payload.destination_lng,
        route_polyline=payload.route_polyline,
        filters_json=payload.filters_json,
        shown_merchants_json=payload.shown_merchants_json,
        clicked_merchant_id=payload.clicked_merchant_id,
        booked_merchant_id=payload.booked_merchant_id,
        merchant_rank_position=payload.merchant_rank_position,
        detour_minutes=payload.detour_minutes,
        created_at=payload.created_at or datetime.utcnow(),
    )
    db.merge(db_log)
    db.commit()

    return {"accepted": True}
