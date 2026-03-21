import json
import sys
from datetime import datetime
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from app.core.database import SessionLocal
from app.models import (
    AIRollout,
    Booking,
    CampaignRequest,
    Dispute,
    Merchant,
    MerchantApproval,
    RankingRule,
    SearchLog,
    User,
)

DOCKER_MOCK_ROOT = Path("/mock")
LOCAL_MOCK_ROOT = ROOT.parent / "EcoCare-UI" / "public" / "mock"
MOCK_ROOT = DOCKER_MOCK_ROOT if DOCKER_MOCK_ROOT.exists() else LOCAL_MOCK_ROOT


def load_json(filename: str):
    with (MOCK_ROOT / filename).open("r", encoding="utf-8") as f:
        return json.load(f)


def run() -> None:
    db = SessionLocal()
    try:
        auth_users = load_json("auth-users.json")["users"]
        for item in auth_users:
            db.merge(
                User(
                    id=item["id"],
                    name=item["name"],
                    email=item["email"],
                    roles=item["roles"],
                    default_role=item["defaultRole"],
                )
            )
        db.commit()

        merchants = load_json("merchants.json")["merchants"]
        for item in merchants:
            db.merge(
                Merchant(
                    merchant_id=item["merchantId"],
                    name=item["name"],
                    address=item["address"],
                    lat=item["lat"],
                    lng=item["lng"],
                    rating=item["rating"],
                    review_count=item["reviewCount"],
                    successful_orders=item["successfulOrders"],
                    price_from=item["priceFrom"],
                    is_ev_safe=item["isEvSafe"],
                    open_now=item["openNow"],
                    service_types=item["serviceTypes"],
                )
            )
        db.commit()

        owner_bookings = load_json("owner-bookings.json")["bookings"]
        provider_users = {u["name"]: u["id"] for u in auth_users if "provider" in u["roles"]}
        for item in owner_bookings:
            db.merge(
                Booking(
                    id=item["id"],
                    owner_id=item["ownerId"],
                    provider_id=provider_users.get(item["provider"]),
                    provider=item["provider"],
                    service=item["service"],
                    slot=item["slot"],
                    state=item["state"],
                    price=item["price"],
                )
            )

        provider_ops = load_json("provider-ops.json")
        for item in provider_ops["campaignRequests"]:
            db.merge(
                CampaignRequest(
                    id=item["id"],
                    provider_id=provider_users.get(item["provider"], "provider-unknown"),
                    provider=item["provider"],
                    type=item["type"],
                    status=item["status"],
                )
            )

        admin_ops = load_json("admin-ops.json")
        for item in admin_ops["merchantApprovals"]:
            db.merge(
                MerchantApproval(
                    id=item["id"],
                    merchant=item["merchant"],
                    city=item["city"],
                    status=item["status"],
                )
            )

        for item in admin_ops["disputes"]:
            db.merge(
                Dispute(
                    id=item["id"],
                    booking_id=item["bookingId"],
                    type=item["type"],
                    status=item["status"],
                )
            )

        ranking = admin_ops["rankingRules"]
        db.merge(
            RankingRule(
                id=1,
                route_match_weight=ranking["routeMatchWeight"],
                distance_detour_weight=ranking["distanceDetourWeight"],
                rating_weight=ranking["ratingWeight"],
                successful_order_weight=ranking["successfulOrderWeight"],
                slot_availability_weight=ranking["slotAvailabilityWeight"],
                price_fit_weight=ranking["priceFitWeight"],
            )
        )

        ai_rollout = admin_ops["aiRollout"]
        db.merge(
            AIRollout(
                id=1,
                ranking_model_status=ai_rollout["rankingModel"]["status"],
                ranking_model_ndcg10=ai_rollout["rankingModel"]["ndcg10"],
                ranking_model_recall10=ai_rollout["rankingModel"]["recall10"],
                slot_model_status=ai_rollout["slotModel"]["status"],
                slot_model_top3_hit_rate=ai_rollout["slotModel"]["top3HitRate"],
                slot_model_auc=ai_rollout["slotModel"]["auc"],
                fallback_healthy=ai_rollout["fallbackHealthy"],
            )
        )

        search_logs = load_json("ai-search-logs.json")["events"]
        for item in search_logs:
            db.merge(
                SearchLog(
                    id=item["id"],
                    user_id_anonymized=item["user_id_anonymized"],
                    mode=item["mode"],
                    origin_lat=item["origin_lat"],
                    origin_lng=item["origin_lng"],
                    destination_lat=item.get("destination_lat"),
                    destination_lng=item.get("destination_lng"),
                    route_polyline=item["route_polyline"],
                    filters_json=item["filters_json"],
                    shown_merchants_json=item["shown_merchants_json"],
                    clicked_merchant_id=item.get("clicked_merchant_id"),
                    booked_merchant_id=item.get("booked_merchant_id"),
                    merchant_rank_position=item.get("merchant_rank_position"),
                    detour_minutes=item.get("detour_minutes"),
                    created_at=datetime.fromisoformat(item["created_at"].replace("Z", "+00:00")),
                )
            )

        db.commit()
        print("Seed completed from mock files.")
    finally:
        db.close()


if __name__ == "__main__":
    run()
