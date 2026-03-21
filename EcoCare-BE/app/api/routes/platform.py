from decimal import Decimal

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.models import AIRollout, Booking, CampaignRequest, Dispute, Merchant, MerchantApproval, RankingRule, User

router = APIRouter()


def _to_float(value: float | Decimal) -> float:
    return float(value)


@router.get("/bootstrap")
def platform_bootstrap(db: Session = Depends(get_db)):
    users = db.scalars(select(User)).all()
    merchants = db.scalars(select(Merchant)).all()
    bookings = db.scalars(select(Booking)).all()
    campaign_requests = db.scalars(select(CampaignRequest)).all()
    merchant_approvals = db.scalars(select(MerchantApproval)).all()
    disputes = db.scalars(select(Dispute)).all()

    ranking = db.get(RankingRule, 1)
    ai_rollout = db.get(AIRollout, 1)

    return {
        "users": [
            {
                "id": user.id,
                "name": user.name,
                "email": user.email,
                "roles": user.roles,
                "defaultRole": user.default_role,
            }
            for user in users
        ],
        "providers": [
            {
                "id": merchant.merchant_id,
                "name": merchant.name,
                "address": merchant.address,
                "lat": merchant.lat,
                "lng": merchant.lng,
                "rating": merchant.rating,
                "successfulOrders": merchant.successful_orders,
                "distanceKm": 1.2,
                "detourMin": 4,
                "priceFrom": _to_float(merchant.price_from),
                "openNow": merchant.open_now,
                "evSafe": merchant.is_ev_safe,
                "boosted": False,
                "serviceTypes": merchant.service_types,
                "reasonCodes": ["available_now", "top_rated_nearby"] if merchant.open_now else ["on_your_route"],
            }
            for merchant in merchants
        ],
        "vehicles": [],
        "slotRecommendations": [],
        "ownerBookings": [
            {
                "id": booking.id,
                "vehicleId": f"v-{booking.owner_id}",
                "plateNumber": "N/A",
                "provider": booking.provider,
                "slot": booking.slot,
                "state": booking.state,
                "price": _to_float(booking.price),
            }
            for booking in bookings
        ],
        "providerBookings": [
            {
                "id": booking.id,
                "providerId": booking.provider_id,
                "owner": booking.owner_id,
                "service": booking.service,
                "state": booking.state,
            }
            for booking in bookings
        ],
        "campaignRequests": [
            {
                "id": item.id,
                "provider": item.provider,
                "type": item.type,
                "status": item.status,
            }
            for item in campaign_requests
        ],
        "merchantApprovals": [
            {
                "id": item.id,
                "merchant": item.merchant,
                "city": item.city,
                "status": item.status,
            }
            for item in merchant_approvals
        ],
        "disputes": [
            {
                "id": item.id,
                "bookingId": item.booking_id,
                "type": item.type,
                "status": item.status,
            }
            for item in disputes
        ],
        "rankingRules": {
            "routeMatchWeight": ranking.route_match_weight if ranking else 0.3,
            "distanceDetourWeight": ranking.distance_detour_weight if ranking else 0.25,
            "ratingWeight": ranking.rating_weight if ranking else 0.15,
            "successfulOrderWeight": ranking.successful_order_weight if ranking else 0.1,
            "slotAvailabilityWeight": ranking.slot_availability_weight if ranking else 0.1,
            "priceFitWeight": ranking.price_fit_weight if ranking else 0.1,
        },
        "aiRollout": {
            "rankingModel": {
                "status": ai_rollout.ranking_model_status if ai_rollout else "shadow_mode",
                "ndcg10": ai_rollout.ranking_model_ndcg10 if ai_rollout else 0.0,
                "recall10": ai_rollout.ranking_model_recall10 if ai_rollout else 0.0,
            },
            "slotModel": {
                "status": ai_rollout.slot_model_status if ai_rollout else "rule_engine_active",
                "top3HitRate": ai_rollout.slot_model_top3_hit_rate if ai_rollout else 0.0,
                "auc": ai_rollout.slot_model_auc if ai_rollout else 0.0,
            },
            "fallbackHealthy": ai_rollout.fallback_healthy if ai_rollout else True,
        },
        "forecast": [],
    }
