from datetime import datetime

from sqlalchemy import JSON, Boolean, DateTime, Float, ForeignKey, Integer, Numeric, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    roles: Mapped[list[str]] = mapped_column(JSON, nullable=False)
    default_role: Mapped[str] = mapped_column(String(32), nullable=False)
    password_hash: Mapped[str | None] = mapped_column(String(255), nullable=True)


class Merchant(Base):
    __tablename__ = "merchants"

    merchant_id: Mapped[str] = mapped_column(String(64), primary_key=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    address: Mapped[str] = mapped_column(String(255), nullable=False)
    lat: Mapped[float] = mapped_column(Float, nullable=False)
    lng: Mapped[float] = mapped_column(Float, nullable=False)
    rating: Mapped[float] = mapped_column(Float, nullable=False)
    review_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    successful_orders: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    price_from: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    is_ev_safe: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    open_now: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    service_types: Mapped[list[str]] = mapped_column(JSON, nullable=False)


class Booking(Base):
    __tablename__ = "bookings"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    owner_id: Mapped[str] = mapped_column(ForeignKey("users.id"), nullable=False)
    provider_id: Mapped[str | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    provider: Mapped[str] = mapped_column(String(255), nullable=False)
    service: Mapped[str] = mapped_column(String(255), nullable=False)
    slot: Mapped[str] = mapped_column(String(32), nullable=False)
    state: Mapped[str] = mapped_column(String(32), nullable=False)
    price: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=datetime.utcnow)


class CampaignRequest(Base):
    __tablename__ = "campaign_requests"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    provider_id: Mapped[str] = mapped_column(String(64), nullable=False)
    provider: Mapped[str] = mapped_column(String(255), nullable=False)
    type: Mapped[str] = mapped_column(String(128), nullable=False)
    status: Mapped[str] = mapped_column(String(32), nullable=False)


class MerchantApproval(Base):
    __tablename__ = "merchant_approvals"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    merchant: Mapped[str] = mapped_column(String(255), nullable=False)
    city: Mapped[str] = mapped_column(String(128), nullable=False)
    status: Mapped[str] = mapped_column(String(32), nullable=False)


class Dispute(Base):
    __tablename__ = "disputes"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    booking_id: Mapped[str] = mapped_column(String(64), nullable=False)
    type: Mapped[str] = mapped_column(String(64), nullable=False)
    status: Mapped[str] = mapped_column(String(32), nullable=False)


class RankingRule(Base):
    __tablename__ = "ranking_rules"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, default=1)
    route_match_weight: Mapped[float] = mapped_column(Float, nullable=False, default=0.3)
    distance_detour_weight: Mapped[float] = mapped_column(Float, nullable=False, default=0.25)
    rating_weight: Mapped[float] = mapped_column(Float, nullable=False, default=0.15)
    successful_order_weight: Mapped[float] = mapped_column(Float, nullable=False, default=0.1)
    slot_availability_weight: Mapped[float] = mapped_column(Float, nullable=False, default=0.1)
    price_fit_weight: Mapped[float] = mapped_column(Float, nullable=False, default=0.1)


class AIRollout(Base):
    __tablename__ = "ai_rollout"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, default=1)
    ranking_model_status: Mapped[str] = mapped_column(String(64), nullable=False, default="shadow_mode")
    ranking_model_ndcg10: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    ranking_model_recall10: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    slot_model_status: Mapped[str] = mapped_column(String(64), nullable=False, default="rule_engine_active")
    slot_model_top3_hit_rate: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    slot_model_auc: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    fallback_healthy: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)


class SearchLog(Base):
    __tablename__ = "search_logs"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    user_id_anonymized: Mapped[str] = mapped_column(String(128), nullable=False)
    mode: Mapped[str] = mapped_column(String(32), nullable=False)
    origin_lat: Mapped[float] = mapped_column(Float, nullable=False)
    origin_lng: Mapped[float] = mapped_column(Float, nullable=False)
    destination_lat: Mapped[float | None] = mapped_column(Float, nullable=True)
    destination_lng: Mapped[float | None] = mapped_column(Float, nullable=True)
    route_polyline: Mapped[str] = mapped_column(Text, nullable=False)
    filters_json: Mapped[dict] = mapped_column(JSON, nullable=False)
    shown_merchants_json: Mapped[list[dict]] = mapped_column(JSON, nullable=False)
    clicked_merchant_id: Mapped[str | None] = mapped_column(String(64), nullable=True)
    booked_merchant_id: Mapped[str | None] = mapped_column(String(64), nullable=True)
    merchant_rank_position: Mapped[int | None] = mapped_column(Integer, nullable=True)
    detour_minutes: Mapped[int | None] = mapped_column(Integer, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False)
