from datetime import date, datetime
from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, Field


class LatLng(BaseModel):
    lat: float
    lng: float


class SearchFilters(BaseModel):
    openNow: bool = True
    evSafe: bool = True
    minRating: float = Field(default=0, ge=0, le=5)
    serviceTypes: list[str] = Field(default_factory=list)


class RoutePreviewRequest(BaseModel):
    origin: LatLng
    destination: LatLng


class RouteBounds(BaseModel):
    north: float
    south: float
    east: float
    west: float


class RoutePreviewResponse(BaseModel):
    distanceKm: float
    durationMin: int
    polyline: str
    bounds: RouteBounds


class NearbySearchRequest(BaseModel):
    location: LatLng
    radiusKm: float = 5
    filters: SearchFilters


class OnRouteSearchRequest(BaseModel):
    origin: LatLng
    destination: LatLng
    polyline: str = ""
    maxDetourKm: float = 2
    filters: SearchFilters


class SearchResultMerchant(BaseModel):
    merchantId: str
    name: str
    lat: float
    lng: float
    rating: float
    successfulOrders: int
    priceFrom: float
    distanceFromRouteKm: float
    detourMin: int
    availableNow: bool
    reasonTags: list[str]


class NearbySearchResponse(BaseModel):
    results: list[SearchResultMerchant]


class LoginRequest(BaseModel):
    email: str
    password: str


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

    id: str
    name: str
    email: str
    roles: list[str]
    default_role: str = Field(alias="defaultRole")


class LoginResponse(BaseModel):
    token: str
    refreshToken: str
    user: UserOut


class SwitchRoleRequest(BaseModel):
    role: str


class BookingOut(BaseModel):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

    id: str
    owner_id: str = Field(alias="ownerId")
    provider_id: str | None = Field(default=None, alias="providerId")
    provider: str
    service: str
    slot: str
    state: str
    price: float
    created_at: datetime = Field(alias="createdAt")
    vehicle_id: str | None = Field(default=None, alias="vehicleId")


class CreateBookingRequest(BaseModel):
    id: str | None = None  # Auto-generated if not provided
    merchant_id: str | None = None  # Can use merchant_id or provider
    provider: str | None = None  # Or provider name
    service: str | None = None  # Auto-filled from service_type
    service_type: str | None = None  # User-friendly: exterior, interior, full
    slot: str | None = None  # Auto-filled from slot_time
    slot_time: str | None = None  # User-friendly time slot
    vehicle_id: str | None = None
    price: float | None = None  # Auto-calculated
    notes: str | None = None


class UpdateBookingStateRequest(BaseModel):
    state: Literal["pending", "confirmed", "in_progress", "completed", "cancelled", "no_show"]


class SearchLogRequest(BaseModel):
    id: str
    user_id_anonymized: str
    mode: Literal["nearby", "on-route"]
    origin_lat: float
    origin_lng: float
    destination_lat: float | None = None
    destination_lng: float | None = None
    route_polyline: str
    filters_json: dict[str, Any]
    shown_merchants_json: list[dict[str, Any]]
    clicked_merchant_id: str | None = None
    booked_merchant_id: str | None = None
    merchant_rank_position: int | None = None
    detour_minutes: int | None = None
    created_at: datetime


class CampaignRequestOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    provider_id: str = Field(alias="providerId")
    provider: str
    type: str
    status: str


class CreateCampaignRequest(BaseModel):
    id: str
    provider: str
    type: str


class ProviderRatingsResponse(BaseModel):
    avgRating: float
    reviewCount: int
    successfulOrders: int


class MerchantApprovalOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    merchant: str
    city: str
    status: str


class DisputeOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    booking_id: str = Field(alias="bookingId")
    type: str
    status: str


class UpdateStatusRequest(BaseModel):
    status: str


class RankingRulesResponse(BaseModel):
    routeMatchWeight: float
    distanceDetourWeight: float
    ratingWeight: float
    successfulOrderWeight: float
    slotAvailabilityWeight: float
    priceFitWeight: float


class UpdateRankingRulesRequest(BaseModel):
    routeMatchWeight: float
    distanceDetourWeight: float
    ratingWeight: float
    successfulOrderWeight: float
    slotAvailabilityWeight: float
    priceFitWeight: float


class RankingModelStatus(BaseModel):
    status: str
    ndcg10: float
    recall10: float


class SlotModelStatus(BaseModel):
    status: str
    top3HitRate: float
    auc: float


class AIRolloutResponse(BaseModel):
    rankingModel: RankingModelStatus
    slotModel: SlotModelStatus
    fallbackHealthy: bool


class UpdateAIRolloutRequest(BaseModel):
    rankingModelStatus: str | None = None
    slotModelStatus: str | None = None
    fallbackHealthy: bool | None = None


class SlotRecommendationRequest(BaseModel):
    merchantId: str
    searchTimestamp: datetime | None = None
    preferredDate: date | None = None
    preferredPeriod: str | None = None
    searchMode: str | None = None


class SlotRecommendationItem(BaseModel):
    slotId: str
    slotTime: str
    score: float
    reason: str


class SlotRecommendationResponse(BaseModel):
    merchantId: str
    slots: list[SlotRecommendationItem]
