import csv
import unicodedata
from collections import Counter, defaultdict
from datetime import UTC, date, datetime, time, timedelta
from functools import lru_cache
from pathlib import Path
from statistics import mean
from typing import Any

from app.core.config import get_settings
from app.core.geo import haversine_km, point_to_segment_km, route_detour_proxy_km


SERVICE_FLAG_FIELDS = [
    "service_exterior_wash",
    "service_interior_cleaning",
    "service_detailing",
    "service_ceramic",
    "service_ev_safe",
    "service_fast_lane",
    "service_car_supported",
    "service_motorbike_supported",
]

SERVICE_FLAG_ALIASES = {
    "exterior_wash": "service_exterior_wash",
    "exteriorwash": "service_exterior_wash",
    "wash": "service_exterior_wash",
    "interior_cleaning": "service_interior_cleaning",
    "interiorcleaning": "service_interior_cleaning",
    "interior": "service_interior_cleaning",
    "detailing": "service_detailing",
    "detailing_service": "service_detailing",
    "ceramic": "service_ceramic",
    "ceramic_coating": "service_ceramic",
    "ev_safe": "service_ev_safe",
    "evsafe": "service_ev_safe",
    "fast_lane": "service_fast_lane",
    "fastlane": "service_fast_lane",
    "car_supported": "service_car_supported",
    "car": "service_car_supported",
    "motorbike_supported": "service_motorbike_supported",
    "motorbike": "service_motorbike_supported",
}

SERVICE_FLAG_LABELS = {
    "service_exterior_wash": "exterior_wash",
    "service_interior_cleaning": "interior_cleaning",
    "service_detailing": "detailing",
    "service_ceramic": "ceramic",
    "service_ev_safe": "ev_safe",
    "service_fast_lane": "fast_lane",
    "service_car_supported": "car_supported",
    "service_motorbike_supported": "motorbike_supported",
}

CAMEL_SERVICE_FLAG_LABELS = {
    "service_exterior_wash": "exteriorWash",
    "service_interior_cleaning": "interiorCleaning",
    "service_detailing": "detailing",
    "service_ceramic": "ceramic",
    "service_ev_safe": "evSafe",
    "service_fast_lane": "fastLane",
    "service_car_supported": "carSupported",
    "service_motorbike_supported": "motorbikeSupported",
}

PERIOD_BUCKETS = {
    "morning": range(6, 12),
    "afternoon": range(12, 17),
    "evening": range(17, 22),
}


class ArtifactUnavailableError(RuntimeError):
    pass


def _normalize_text(value: str | None) -> str:
    text = (value or "").strip().lower()
    if not text:
        return ""
    text = unicodedata.normalize("NFKD", text)
    text = "".join(char for char in text if not unicodedata.combining(char))
    return " ".join(text.split())


def _to_bool(value: Any) -> bool:
    if isinstance(value, bool):
        return value
    text = str(value or "").strip().lower()
    return text in {"1", "1.0", "true", "yes", "y"}


def _to_optional_float(value: Any) -> float | None:
    text = str(value or "").strip()
    if not text:
        return None
    try:
        return float(text)
    except ValueError:
        return None


def _to_float(value: Any, default: float = 0.0) -> float:
    parsed = _to_optional_float(value)
    return default if parsed is None else parsed


def _to_int(value: Any, default: int = 0) -> int:
    text = str(value or "").strip()
    if not text:
        return default
    try:
        return int(float(text))
    except ValueError:
        return default


def _parse_datetime(value: str | None) -> datetime | None:
    text = (value or "").strip()
    if not text:
        return None
    try:
        return datetime.fromisoformat(text)
    except ValueError:
        return None


def _read_csv_rows(path: Path) -> list[dict[str, str]]:
    with path.open("r", encoding="utf-8-sig", newline="") as handle:
        return list(csv.DictReader(handle))


class AIServingRepository:
    def __init__(self, processed_data_dir: Path, processed_models_dir: Path):
        self.processed_data_dir = processed_data_dir
        self.processed_models_dir = processed_models_dir
        self._merchant_records: dict[str, dict[str, Any]] | None = None
        self._slot_rows: list[dict[str, str]] | None = None
        self._forecast_rows: list[dict[str, Any]] | None = None

    def _artifact_path(self, *parts: str, models: bool = False) -> Path:
        base_dir = self.processed_models_dir if models else self.processed_data_dir
        path = base_dir.joinpath(*parts)
        if not path.exists():
            raise ArtifactUnavailableError(f"Required artifact not found: {path}")
        return path

    def _load_merchants(self) -> dict[str, dict[str, Any]]:
        if self._merchant_records is not None:
            return self._merchant_records

        ranking_path = self.processed_data_dir / "merchant_ranking_features.csv"
        geo_path = self.processed_data_dir / "merchant_geo_ready.csv"
        if ranking_path.exists():
            rows = _read_csv_rows(ranking_path)
        elif geo_path.exists():
            rows = _read_csv_rows(geo_path)
        else:
            raise ArtifactUnavailableError("No merchant serving artifact found in Dataset/ProcessedData")

        merchants: dict[str, dict[str, Any]] = {}
        for row in rows:
            merchant_id = (row.get("merchant_id") or "").strip()
            if not merchant_id:
                continue

            service_flags = {field: _to_bool(row.get(field)) for field in SERVICE_FLAG_FIELDS}
            open_now_value = _to_optional_float(row.get("is_open_now_proxy"))
            review_count = _to_int(row.get("review_count_source") or row.get("review_row_count"))
            merchant = {
                "merchantId": merchant_id,
                "merchantName": (row.get("merchant_name") or "").strip(),
                "merchantType": (row.get("merchant_type") or "").strip(),
                "merchantTypes": (row.get("merchant_types") or "").strip(),
                "address": (row.get("address") or "").strip(),
                "district": (row.get("district") or "").strip(),
                "districtNorm": _normalize_text(row.get("district_norm") or row.get("district")),
                "latitude": _to_optional_float(row.get("latitude")),
                "longitude": _to_optional_float(row.get("longitude")),
                "rating": _to_float(row.get("rating")),
                "reviewCount": review_count,
                "openState": (row.get("open_state") or "").strip(),
                "openNowValue": open_now_value,
                "openNow": open_now_value == 1.0,
                "openScore": _to_float(row.get("open_score"), default=0.5),
                "hoursTextClean": (row.get("hours_text_clean") or row.get("hours") or "").strip(),
                "isOpenInfoAvailable": _to_bool(row.get("is_open_info_available")),
                "isValidGeo": _to_bool(row.get("is_valid_geo")),
                "phone": (row.get("phone") or "").strip(),
                "website": (row.get("website") or "").strip(),
                "searchableLocationText": (row.get("searchable_location_text") or "").strip(),
                "ratingScore": _to_float(row.get("rating_score")),
                "reviewVolumeScore": _to_float(row.get("review_volume_score")),
                "trustScore": _to_float(row.get("trust_score")),
                "serviceRichnessScore": _to_float(row.get("service_richness_score")),
                "unclaimedPenalty": _to_float(row.get("unclaimed_penalty")),
                "baseRankScore": _to_float(row.get("base_rank_score")),
                "unclaimedListing": _to_bool(row.get("unclaimed_listing")),
                "serviceFlags": service_flags,
                "serviceTypesList": [SERVICE_FLAG_LABELS[field] for field in SERVICE_FLAG_FIELDS if service_flags[field]],
                "rawRow": row,
            }
            merchants[merchant_id] = merchant

        self._merchant_records = merchants
        return merchants

    def _load_slot_rows(self) -> list[dict[str, str]]:
        if self._slot_rows is None:
            path = self._artifact_path("slot_events.csv")
            self._slot_rows = _read_csv_rows(path)
        return self._slot_rows

    def _load_forecast_rows(self) -> list[dict[str, Any]]:
        if self._forecast_rows is not None:
            return self._forecast_rows

        path = self._artifact_path("demand_forecast_predictions.csv", models=True)
        rows = []
        for row in _read_csv_rows(path):
            rows.append(
                {
                    "zone": (row.get("zone") or "").strip(),
                    "zoneNorm": _normalize_text(row.get("zone")),
                    "forecastTimestamp": (row.get("event_hour_ts") or "").strip(),
                    "eventDate": (row.get("event_date") or "").strip(),
                    "eventHour": _to_int(row.get("event_hour")),
                    "observedSearchCount": _to_int(row.get("search_count")),
                    "observedBookingCount": _to_int(row.get("booking_count")),
                    "predictedBookingCount": _to_float(row.get("prediction_booking_count")),
                    "baselineBookingCount": _to_float(row.get("baseline_booking_count")),
                    "isPeakHour": _to_bool(row.get("is_peak_hour")),
                }
            )
        self._forecast_rows = rows
        return rows

    def get_merchant(self, merchant_id: str) -> dict[str, Any] | None:
        return self._load_merchants().get(merchant_id)

    def _requested_service_flags(self, filters: dict[str, Any] | None) -> list[str]:
        if not filters:
            return []

        requested = set()
        for raw_service in filters.get("serviceTypes") or []:
            key = _normalize_text(str(raw_service)).replace(" ", "_")
            mapped = SERVICE_FLAG_ALIASES.get(key)
            if mapped:
                requested.add(mapped)

        boolean_map = {
            "exteriorWash": "service_exterior_wash",
            "interiorCleaning": "service_interior_cleaning",
            "detailing": "service_detailing",
            "ceramic": "service_ceramic",
            "evSafe": "service_ev_safe",
            "fastLane": "service_fast_lane",
            "carSupported": "service_car_supported",
            "motorbikeSupported": "service_motorbike_supported",
        }
        for filter_key, service_flag in boolean_map.items():
            if _to_bool(filters.get(filter_key)):
                requested.add(service_flag)

        return sorted(requested)

    def _merchant_matches(self, merchant: dict[str, Any], filters: dict[str, Any] | None) -> bool:
        if not merchant["isValidGeo"]:
            return False

        filters = filters or {}
        min_rating = _to_float(filters.get("minRating"), default=0.0)
        if merchant["rating"] < min_rating:
            return False

        if _to_bool(filters.get("openNow")) and merchant["openNowValue"] != 1.0:
            return False

        if _to_bool(filters.get("evSafe")) and not merchant["serviceFlags"]["service_ev_safe"]:
            return False

        district = _normalize_text(filters.get("district"))
        if district and district not in {merchant["districtNorm"], _normalize_text(merchant["district"])}:
            return False

        for service_flag in self._requested_service_flags(filters):
            if not merchant["serviceFlags"].get(service_flag):
                return False

        return True

    def _nearby_score(self, merchant: dict[str, Any], distance_km: float, radius_km: float) -> float:
        radius = max(radius_km, 0.1)
        distance_score = max(0.0, 1.0 - (distance_km / radius))
        return round(
            (0.35 * distance_score)
            + (0.20 * merchant["ratingScore"])
            + (0.10 * merchant["reviewVolumeScore"])
            + (0.10 * merchant["trustScore"])
            + (0.10 * merchant["openScore"])
            + (0.10 * merchant["serviceRichnessScore"])
            + (0.05 * merchant["unclaimedPenalty"]),
            6,
        )

    def _route_score(self, merchant: dict[str, Any], route_distance_km: float, detour_proxy_km: float, corridor_km: float) -> float:
        corridor = max(corridor_km, 0.1)
        route_match_score = max(0.0, 1.0 - (route_distance_km / corridor))
        detour_score = max(0.0, 1.0 - (detour_proxy_km / max(corridor * 2, 0.5)))
        return round(
            (0.30 * route_match_score)
            + (0.20 * detour_score)
            + (0.15 * merchant["ratingScore"])
            + (0.10 * merchant["reviewVolumeScore"])
            + (0.10 * merchant["trustScore"])
            + (0.10 * merchant["openScore"])
            + (0.05 * merchant["serviceRichnessScore"]),
            6,
        )

    def _reason_tags(self, merchant: dict[str, Any], *, distance_km: float | None = None, route_distance_km: float | None = None) -> list[str]:
        tags: list[str] = []
        if distance_km is not None:
            if distance_km <= 1:
                tags.append("very_close")
            elif distance_km <= 3:
                tags.append("close_by")
        if route_distance_km is not None:
            if route_distance_km <= 0.5:
                tags.append("on_corridor")
            else:
                tags.append("near_route")
        if merchant["trustScore"] >= 0.7:
            tags.append("trusted")
        if merchant["rating"] >= 4.5:
            tags.append("top_rated")
        if merchant["openNow"]:
            tags.append("open_now")
        elif merchant["openNowValue"] is None:
            tags.append("open_unknown")
        for field in SERVICE_FLAG_FIELDS:
            if merchant["serviceFlags"][field]:
                tags.append(SERVICE_FLAG_LABELS[field])
        return tags[:8]

    def _merchant_response(
        self,
        merchant: dict[str, Any],
        *,
        distance_km: float | None,
        route_distance_proxy: float | None,
        detour_proxy: float | None,
        rank_score: float,
        reason_tags: list[str],
    ) -> dict[str, Any]:
        distance_for_eta = distance_km if distance_km is not None else route_distance_proxy or 0.0
        return {
            "merchantId": merchant["merchantId"],
            "name": merchant["merchantName"],
            "address": merchant["address"],
            "district": merchant["district"],
            "lat": merchant["latitude"] or 0.0,
            "lng": merchant["longitude"] or 0.0,
            "rating": merchant["rating"],
            "reviewCount": merchant["reviewCount"],
            "successfulOrders": merchant["reviewCount"],
            "priceFrom": 0.0,
            "distanceFromRouteKm": round(distance_for_eta, 4),
            "distanceKm": round(distance_km, 4) if distance_km is not None else None,
            "routeDistanceProxy": round(route_distance_proxy, 4) if route_distance_proxy is not None else None,
            "detourProxy": round(detour_proxy, 4) if detour_proxy is not None else None,
            "detourMin": max(1, int((distance_for_eta / 30) * 60)) if distance_for_eta is not None else 1,
            "availableNow": merchant["openNow"],
            "openState": merchant["openState"],
            "serviceTypes": merchant["serviceTypesList"],
            "serviceFlags": {
                CAMEL_SERVICE_FLAG_LABELS[field]: enabled for field, enabled in merchant["serviceFlags"].items()
            },
            "rankScore": rank_score,
            "baseRankScore": merchant["baseRankScore"],
            "reasonTags": reason_tags,
        }

    def search_nearby(
        self,
        latitude: float,
        longitude: float,
        radius_km: float,
        filters: dict[str, Any] | None = None,
        limit: int = 20,
    ) -> list[dict[str, Any]]:
        candidates: list[dict[str, Any]] = []
        for merchant in self._load_merchants().values():
            if merchant["latitude"] is None or merchant["longitude"] is None:
                continue
            if not self._merchant_matches(merchant, filters):
                continue

            distance_km = haversine_km(latitude, longitude, merchant["latitude"], merchant["longitude"])
            if distance_km > radius_km:
                continue

            rank_score = self._nearby_score(merchant, distance_km, radius_km)
            candidates.append(
                self._merchant_response(
                    merchant,
                    distance_km=distance_km,
                    route_distance_proxy=None,
                    detour_proxy=None,
                    rank_score=rank_score,
                    reason_tags=self._reason_tags(merchant, distance_km=distance_km),
                )
            )

        candidates.sort(key=lambda item: (-item["rankScore"], item["distanceKm"] or 9999, -item["rating"]))
        return candidates[:limit]

    def search_on_route(
        self,
        origin_lat: float,
        origin_lng: float,
        destination_lat: float,
        destination_lng: float,
        max_corridor_km: float,
        filters: dict[str, Any] | None = None,
        limit: int = 20,
    ) -> list[dict[str, Any]]:
        candidates: list[dict[str, Any]] = []
        for merchant in self._load_merchants().values():
            if merchant["latitude"] is None or merchant["longitude"] is None:
                continue
            if not self._merchant_matches(merchant, filters):
                continue

            route_distance_km = point_to_segment_km(
                merchant["latitude"],
                merchant["longitude"],
                origin_lat,
                origin_lng,
                destination_lat,
                destination_lng,
            )
            if route_distance_km > max_corridor_km:
                continue

            detour_proxy_km = route_detour_proxy_km(
                origin_lat,
                origin_lng,
                destination_lat,
                destination_lng,
                merchant["latitude"],
                merchant["longitude"],
            )
            rank_score = self._route_score(merchant, route_distance_km, detour_proxy_km, max_corridor_km)
            candidates.append(
                self._merchant_response(
                    merchant,
                    distance_km=None,
                    route_distance_proxy=route_distance_km,
                    detour_proxy=detour_proxy_km,
                    rank_score=rank_score,
                    reason_tags=self._reason_tags(merchant, route_distance_km=route_distance_km),
                )
            )

        candidates.sort(
            key=lambda item: (
                -item["rankScore"],
                item["routeDistanceProxy"] or 9999,
                item["detourProxy"] or 9999,
                -item["rating"],
            )
        )
        return candidates[:limit]

    def merchant_detail(self, merchant_id: str) -> dict[str, Any] | None:
        merchant = self.get_merchant(merchant_id)
        if not merchant:
            return None

        return {
            "merchantId": merchant["merchantId"],
            "merchantName": merchant["merchantName"],
            "merchantType": merchant["merchantType"],
            "merchantTypes": merchant["merchantTypes"],
            "address": merchant["address"],
            "district": merchant["district"],
            "latitude": merchant["latitude"],
            "longitude": merchant["longitude"],
            "rating": merchant["rating"],
            "reviewCount": merchant["reviewCount"],
            "openState": merchant["openState"],
            "openNow": merchant["openNow"],
            "hoursText": merchant["hoursTextClean"],
            "phone": merchant["phone"],
            "website": merchant["website"],
            "isValidGeo": merchant["isValidGeo"],
            "serviceTypes": merchant["serviceTypesList"],
            "serviceFlags": {
                CAMEL_SERVICE_FLAG_LABELS[field]: enabled for field, enabled in merchant["serviceFlags"].items()
            },
            "ratingScore": merchant["ratingScore"],
            "reviewVolumeScore": merchant["reviewVolumeScore"],
            "trustScore": merchant["trustScore"],
            "openScore": merchant["openScore"],
            "serviceRichnessScore": merchant["serviceRichnessScore"],
            "baseRankScore": merchant["baseRankScore"],
            "unclaimedListing": merchant["unclaimedListing"],
        }

    def recommend_slots(
        self,
        merchant_id: str,
        search_timestamp: datetime | None = None,
        preferred_date: date | None = None,
        preferred_period: str | None = None,
        search_mode: str | None = None,
    ) -> list[dict[str, Any]]:
        merchant = self.get_merchant(merchant_id)
        slot_rows = [row for row in self._load_slot_rows() if (row.get("merchant_id") or "").strip() == merchant_id]

        grouped: dict[tuple[int, int], dict[str, Any]] = defaultdict(lambda: {"shown": 0, "selected": 0})
        for row in slot_rows:
            slot_dt = _parse_datetime(row.get("slot_start_ts"))
            if slot_dt is None:
                continue
            key = (slot_dt.hour, slot_dt.minute)
            grouped[key]["shown"] += 1
            if _to_bool(row.get("slot_selected")) or (row.get("slot_event_type") or "").strip() == "slot_selected":
                grouped[key]["selected"] += 1

        base_dt = search_timestamp or datetime.now(UTC)
        target_date = preferred_date or base_dt.date()
        if target_date < base_dt.date():
            target_date = base_dt.date()

        if grouped:
            ordered_templates = sorted(
                grouped.items(),
                key=lambda item: (-item[1]["selected"], -item[1]["shown"], item[0][0], item[0][1]),
            )
            slot_templates = ordered_templates[:6]
        else:
            slot_templates = [
                ((9, 0), {"shown": 1, "selected": 0}),
                ((11, 0), {"shown": 1, "selected": 0}),
                ((14, 0), {"shown": 1, "selected": 0}),
                ((16, 0), {"shown": 1, "selected": 0}),
                ((18, 0), {"shown": 1, "selected": 0}),
            ]

        recommendations: list[dict[str, Any]] = []
        for (hour_value, minute_value), stats in slot_templates:
            slot_dt = datetime.combine(target_date, time(hour_value, minute_value), tzinfo=base_dt.tzinfo or UTC)
            if slot_dt <= base_dt:
                slot_dt = slot_dt + timedelta(days=1)

            lead_time_hours = max(0.0, (slot_dt - base_dt).total_seconds() / 3600)
            popularity = stats["selected"] / stats["shown"] if stats["shown"] else 0.0
            period_match = 1.0
            if preferred_period:
                period_match = 1.0 if hour_value in PERIOD_BUCKETS.get(preferred_period, range(0, 24)) else 0.35
            business_hour = 1.0 if 8 <= hour_value < 18 else 0.4
            lead_score = 1.0 if 2 <= lead_time_hours <= 36 else 0.65 if lead_time_hours < 2 else 0.75
            merchant_open_score = merchant["openScore"] if merchant else 0.5
            merchant_rank_score = merchant["baseRankScore"] if merchant else 0.5
            search_mode_bonus = 0.05 if (search_mode or "") == "nearby" and hour_value in range(9, 18) else 0.0

            score = round(
                (0.35 * popularity)
                + (0.20 * period_match)
                + (0.15 * lead_score)
                + (0.15 * business_hour)
                + (0.10 * merchant_open_score)
                + (0.05 * merchant_rank_score)
                + search_mode_bonus,
                6,
            )

            reason_parts = []
            if popularity >= 0.4:
                reason_parts.append("historically_selected")
            if preferred_period and period_match >= 1.0:
                reason_parts.append(f"matches_{preferred_period}")
            if business_hour >= 1.0:
                reason_parts.append("business_hour")
            if lead_score >= 1.0:
                reason_parts.append("good_lead_time")
            if merchant and merchant["openNow"]:
                reason_parts.append("merchant_open_signal")
            if not reason_parts:
                reason_parts.append("safe_default")

            slot_id = f"{merchant_id}_{slot_dt.strftime('%Y%m%d_%H%M')}"
            recommendations.append(
                {
                    "slotId": slot_id,
                    "slotTime": slot_dt.isoformat(),
                    "score": score,
                    "reason": ", ".join(reason_parts[:3]),
                }
            )

        recommendations.sort(key=lambda item: (-item["score"], item["slotTime"]))
        return recommendations[:3]

    def forecast_for_zone(self, zone_id: str) -> list[dict[str, Any]]:
        zone_norm = _normalize_text(zone_id)
        if not zone_norm:
            return []
        return [row for row in self._load_forecast_rows() if row["zoneNorm"] == zone_norm]

    def forecast_summary(self) -> dict[str, Any]:
        rows = self._load_forecast_rows()
        if not rows:
            return {
                "topZones": [],
                "peakHours": [],
                "latestForecastTimestamp": None,
                "forecastStats": {"rowCount": 0, "avgPredictedDemand": 0.0, "maxPredictedDemand": 0.0},
            }

        zone_totals: Counter[str] = Counter()
        hour_totals: Counter[int] = Counter()
        predicted_values: list[float] = []
        latest_forecast_timestamp = max(row["forecastTimestamp"] for row in rows if row["forecastTimestamp"])

        for row in rows:
            zone_totals[row["zone"]] += row["predictedBookingCount"]
            hour_totals[row["eventHour"]] += row["predictedBookingCount"]
            predicted_values.append(row["predictedBookingCount"])

        top_zones = [
            {"zone": zone, "predictedDemand": round(total, 4)}
            for zone, total in zone_totals.most_common(5)
        ]
        peak_hours = [
            {"hour": hour_value, "predictedDemand": round(total, 4)}
            for hour_value, total in hour_totals.most_common(5)
        ]

        return {
            "topZones": top_zones,
            "peakHours": peak_hours,
            "latestForecastTimestamp": latest_forecast_timestamp,
            "forecastStats": {
                "rowCount": len(rows),
                "avgPredictedDemand": round(mean(predicted_values), 4) if predicted_values else 0.0,
                "maxPredictedDemand": round(max(predicted_values), 4) if predicted_values else 0.0,
            },
        }


@lru_cache(maxsize=1)
def get_ai_serving_repository() -> AIServingRepository:
    settings = get_settings()
    return AIServingRepository(settings.processed_data_path, settings.processed_models_path)
