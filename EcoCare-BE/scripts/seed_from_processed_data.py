import csv
import hashlib
import random
import sys
from collections import defaultdict
from datetime import datetime
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from app.core.database import SessionLocal
from app.models import Booking, Merchant, SearchLog, User, Vehicle


def _read_csv_rows(path: Path) -> list[dict[str, str]]:
    with path.open("r", encoding="utf-8-sig", newline="") as handle:
        return list(csv.DictReader(handle))


def _normalize_text(value: str | None) -> str:
    return " ".join((value or "").strip().split())


def _to_float(value: Any, default: float = 0.0) -> float:
    text = str(value or "").strip()
    if not text:
        return default
    try:
        return float(text)
    except ValueError:
        return default


def _to_int(value: Any, default: int = 0) -> int:
    text = str(value or "").strip()
    if not text:
        return default
    try:
        return int(float(text))
    except ValueError:
        return default


def _to_bool(value: Any, default: bool = False) -> bool:
    text = str(value or "").strip().lower()
    if not text:
        return default
    return text in {"1", "1.0", "true", "yes", "y"}


def _parse_datetime(value: str | None) -> datetime:
    text = (value or "").strip()
    if not text:
        return datetime.utcnow()
    try:
        return datetime.fromisoformat(text)
    except ValueError:
        return datetime.utcnow()


def _hashed_id(prefix: str, source: str, max_len: int = 64) -> str:
    digest = hashlib.sha1(source.encode("utf-8")).hexdigest()
    candidate = f"{prefix}{digest}"
    return candidate[:max_len]


def _safe_merchant_id(source_id: str) -> str:
    source = source_id.strip()
    if len(source) <= 64:
        return source
    return _hashed_id("m_", source, max_len=64)


def _parse_service_types(row: dict[str, str]) -> list[str]:
    merchant_types = row.get("merchant_types") or row.get("merchant_type") or row.get("merchant_type_id") or ""
    if not merchant_types.strip():
        return ["car_wash"]

    normalized = merchant_types.replace("|", ",").replace(";", ",")
    parts = [_normalize_text(part).lower().replace(" ", "_") for part in normalized.split(",")]
    values = [part for part in parts if part]
    return values if values else ["car_wash"]


def _infer_ev_safe(row: dict[str, str]) -> bool:
    haystack = " ".join(
        [
            row.get("merchant_types", ""),
            row.get("merchant_type", ""),
            row.get("service_options_on_site", ""),
            row.get("merchant_name", ""),
        ]
    ).lower()

    if any(token in haystack for token in ["ev", "electric", "xe dien", "xe điện"]):
        return True
    return True


def _resolve_processed_data_dir() -> Path:
    candidates = [
        Path("/Dataset/ProcessedData"),
        ROOT.parent / "Dataset" / "ProcessedData",
        ROOT.parent / "dataset" / "ProcessedData",
    ]
    for candidate in candidates:
        if candidate.exists():
            return candidate
    raise FileNotFoundError("Unable to locate Dataset/ProcessedData")


def _truncate_operational_tables(db) -> None:
    # Delete children first to satisfy foreign keys.
    db.query(SearchLog).delete()
    db.query(Booking).delete()
    db.query(Vehicle).delete()
    db.query(Merchant).delete()
    db.query(User).delete()
    db.commit()


def run(truncate_first: bool = False) -> None:
    processed_dir = _resolve_processed_data_dir()

    merchant_rows = _read_csv_rows(processed_dir / "merchant_geo_ready.csv")
    booking_rows = _read_csv_rows(processed_dir / "booking_events.csv")
    search_rows = _read_csv_rows(processed_dir / "search_events.csv")
    impression_rows = _read_csv_rows(processed_dir / "impression_events.csv")
    click_rows = _read_csv_rows(processed_dir / "click_events.csv")

    db = SessionLocal()
    try:
        if truncate_first:
            _truncate_operational_tables(db)

        source_to_db_merchant_id: dict[str, str] = {}
        merchant_name_by_id: dict[str, str] = {}

        for row in merchant_rows:
            source_mid = (row.get("merchant_id") or "").strip()
            if not source_mid:
                continue

            db_mid = _safe_merchant_id(source_mid)
            source_to_db_merchant_id[source_mid] = db_mid
            merchant_name = _normalize_text(row.get("merchant_name")) or db_mid
            merchant_name_by_id[db_mid] = merchant_name

            db.merge(
                Merchant(
                    merchant_id=db_mid,
                    name=merchant_name[:255],
                    address=_normalize_text(row.get("address"))[:255] or "Unknown",
                    lat=_to_float(row.get("latitude")),
                    lng=_to_float(row.get("longitude")),
                    rating=_to_float(row.get("rating")),
                    review_count=_to_int(row.get("review_count_source") or row.get("review_row_count")),
                    successful_orders=0,
                    price_from=round(_to_float(row.get("price"), default=0.0), 2),
                    is_ev_safe=_infer_ev_safe(row),
                    open_now=_to_bool(row.get("is_open_now_proxy"), default=False),
                    service_types=_parse_service_types(row),
                )
            )
        db.commit()

        owner_user_ids = {
            (row.get("user_id") or "").strip()
            for row in booking_rows + search_rows
            if (row.get("user_id") or "").strip()
        }

        provider_user_by_merchant: dict[str, str] = {}
        for booking in booking_rows:
            source_mid = (booking.get("merchant_id") or "").strip()
            if not source_mid:
                continue
            db_mid = source_to_db_merchant_id.get(source_mid, _safe_merchant_id(source_mid))
            provider_user_by_merchant.setdefault(db_mid, _hashed_id("provider_", db_mid, max_len=64))

        for uid in sorted(owner_user_ids):
            db.merge(
                User(
                    id=uid,
                    name=f"Dataset user {uid}",
                    email=f"{uid}@dataset.local",
                    roles=["owner"],
                    default_role="owner",
                )
            )

        for db_mid, provider_uid in provider_user_by_merchant.items():
            db.merge(
                User(
                    id=provider_uid,
                    name=f"Provider {merchant_name_by_id.get(db_mid, db_mid)}",
                    email=f"{provider_uid}@dataset.local",
                    roles=["provider"],
                    default_role="provider",
                )
            )
        db.commit()

        vehicle_specs = [
            ("Tesla", "Model 3", "Long Range"),
            ("Tesla", "Model Y", "Performance"),
            ("Hyundai", "Ioniq 5", "Limited"),
            ("Kia", "EV6", "GT-Line"),
            ("VinFast", "VF 8", "Plus"),
            ("BYD", "Atto 3", "Premium"),
        ]
        vehicle_colors = ["Pearl White", "Midnight Silver", "Deep Blue", "Graphite", "Crimson Red", "Atlas White"]
        vehicle_rng = random.Random(20260322)

        for idx, owner_id in enumerate(sorted(owner_user_ids), start=1):
            make, model, trim = vehicle_specs[(idx - 1) % len(vehicle_specs)]
            color = vehicle_colors[(idx - 1) % len(vehicle_colors)]
            mileage = 4000 + (idx * 173)
            battery_health = max(88, 100 - (idx % 12))

            db.merge(
                Vehicle(
                    id=f"veh-{owner_id}",
                    owner_id=owner_id,
                    make=make,
                    model=model,
                    trim=trim,
                    year=2023 + (idx % 3),
                    color=color,
                    plate_number=f"DS{idx:03d}-{vehicle_rng.randint(10, 99)}.{vehicle_rng.randint(10, 99)}",
                    status="active",
                    mileage_miles=mileage,
                    battery_health_pct=battery_health,
                    next_service_due="2026-12-31",
                    next_service_label="Dec 31, 2026",
                    last_wash_label=f"{vehicle_rng.randint(2, 14)} days ago",
                    image_url="https://images.pexels.com/photos/2127039/pexels-photo-2127039.jpeg",
                    water_saved_liters=180 + (idx * 7),
                    co2_offset_kg=round(4.0 + (idx * 0.18), 1),
                    loyalty_points=220 + (idx * 15),
                    rewards_progress_pct=min(100, 20 + (idx % 9) * 8),
                    subscription="Eco Care",
                    range_km=420 + (idx % 6) * 22,
                    upcoming_wash_json=None,
                )
            )
        db.commit()

        successful_orders_count: dict[str, int] = defaultdict(int)
        booked_merchant_by_search_event: dict[str, str] = {}

        for row in booking_rows:
            booking_id = (row.get("booking_event_id") or "").strip()
            owner_id = (row.get("user_id") or "").strip()
            source_mid = (row.get("merchant_id") or "").strip()
            if not booking_id or not owner_id:
                continue

            db_mid = source_to_db_merchant_id.get(source_mid, _safe_merchant_id(source_mid))
            provider_id = provider_user_by_merchant.get(db_mid)
            provider_name = _normalize_text(row.get("merchant_name")) or merchant_name_by_id.get(db_mid, db_mid)
            status = (row.get("booking_status") or "pending").strip().lower().replace(" ", "_")
            if status not in {"pending", "confirmed", "in_progress", "completed", "cancelled", "no_show"}:
                status = "pending"

            value_band = (row.get("booking_value_band") or "").strip().lower()
            price = 25.0
            if value_band == "medium":
                price = 45.0
            elif value_band == "high":
                price = 75.0

            if status in {"confirmed", "in_progress", "completed"}:
                successful_orders_count[db_mid] += 1

            search_event_id = (row.get("search_event_id") or "").strip()
            if search_event_id and db_mid:
                booked_merchant_by_search_event.setdefault(search_event_id, db_mid)

            db.merge(
                Booking(
                    id=booking_id,
                    owner_id=owner_id,
                    provider_id=provider_id,
                    provider=provider_name[:255],
                    service="wash",
                    slot="synthetic",
                    state=status,
                    price=price,
                    created_at=_parse_datetime(row.get("event_ts")),
                )
            )
        db.commit()

        for merchant_id, count in successful_orders_count.items():
            merchant = db.get(Merchant, merchant_id)
            if merchant:
                merchant.successful_orders = count
        db.commit()

        shown_merchants_by_search_event: dict[str, list[dict[str, Any]]] = defaultdict(list)
        for row in impression_rows:
            search_event_id = (row.get("search_event_id") or "").strip()
            source_mid = (row.get("merchant_id") or "").strip()
            if not search_event_id or not source_mid:
                continue
            db_mid = source_to_db_merchant_id.get(source_mid, _safe_merchant_id(source_mid))
            shown_merchants_by_search_event[search_event_id].append(
                {
                    "merchant_id": db_mid,
                    "rank": _to_int(row.get("rank_position"), default=0),
                    "score": round(_to_float(row.get("final_rank_score")), 6),
                }
            )

        for key in shown_merchants_by_search_event:
            shown_merchants_by_search_event[key].sort(key=lambda item: item.get("rank", 0))

        click_by_search_event: dict[str, dict[str, Any]] = {}
        for row in click_rows:
            search_event_id = (row.get("search_event_id") or "").strip()
            source_mid = (row.get("merchant_id") or "").strip()
            if not search_event_id or not source_mid:
                continue
            db_mid = source_to_db_merchant_id.get(source_mid, _safe_merchant_id(source_mid))
            existing_rank = click_by_search_event.get(search_event_id, {}).get("rank", 10_000)
            rank = _to_int(row.get("rank_position"), default=10_000)
            if rank < existing_rank:
                click_by_search_event[search_event_id] = {"merchant_id": db_mid, "rank": rank}

        for row in search_rows:
            search_event_id = (row.get("search_event_id") or "").strip()
            if not search_event_id:
                continue

            search_mode = (row.get("search_mode") or "nearby").strip().lower()
            mode = "on-route" if search_mode in {"on-route", "on_route", "route"} else "nearby"

            filters_json = {
                "require_open_now": _to_bool(row.get("require_open_now"), default=False),
                "min_rating": _to_float(row.get("min_rating"), default=0.0),
                "radius_km": _to_float(row.get("radius_km"), default=0.0),
                "max_corridor_km": _to_float(row.get("max_corridor_km"), default=0.0),
            }

            shown_merchants = shown_merchants_by_search_event.get(search_event_id, [])
            clicked = click_by_search_event.get(search_event_id)

            db.merge(
                SearchLog(
                    id=search_event_id,
                    user_id_anonymized=(row.get("user_id") or "anonymous").strip() or "anonymous",
                    mode=mode,
                    origin_lat=_to_float(row.get("origin_latitude")),
                    origin_lng=_to_float(row.get("origin_longitude")),
                    destination_lat=_to_float(row.get("destination_latitude"), default=0.0) if (row.get("destination_latitude") or "").strip() else None,
                    destination_lng=_to_float(row.get("destination_longitude"), default=0.0) if (row.get("destination_longitude") or "").strip() else None,
                    route_polyline="",
                    filters_json=filters_json,
                    shown_merchants_json=shown_merchants,
                    clicked_merchant_id=clicked.get("merchant_id") if clicked else None,
                    booked_merchant_id=booked_merchant_by_search_event.get(search_event_id),
                    merchant_rank_position=clicked.get("rank") if clicked else None,
                    detour_minutes=None,
                    created_at=_parse_datetime(row.get("event_ts")),
                )
            )
        db.commit()

        print("ProcessedData import complete.")
        print(f"Imported merchants: {len(merchant_rows)}")
        print(f"Imported users (owners + providers): {len(owner_user_ids) + len(provider_user_by_merchant)}")
        print(f"Imported vehicles: {len(owner_user_ids)}")
        print(f"Imported bookings: {len(booking_rows)}")
        print(f"Imported search logs: {len(search_rows)}")
    finally:
        db.close()


if __name__ == "__main__":
    truncate = "--truncate" in sys.argv
    run(truncate_first=truncate)