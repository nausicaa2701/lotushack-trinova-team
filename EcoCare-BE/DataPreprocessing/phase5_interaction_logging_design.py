from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from pathlib import Path
import hashlib
import math
import random

import pandas as pd


ROOT_DIR = Path(__file__).resolve().parents[2]
INPUT_DIR = ROOT_DIR / "Dataset" / "ProcessedData"
REPORT_DIR = ROOT_DIR / ".prompt" / "reports"

RANKING_NEARBY_PATH = INPUT_DIR / "ranking_results_nearby.csv"
RANKING_ON_ROUTE_PATH = INPUT_DIR / "ranking_results_on_route.csv"
QUERIES_NEARBY_PATH = INPUT_DIR / "queries_nearby_sample.csv"
QUERIES_ON_ROUTE_PATH = INPUT_DIR / "queries_on_route_sample.csv"

SEARCH_EVENTS_OUTPUT_PATH = INPUT_DIR / "search_events.csv"
IMPRESSION_EVENTS_OUTPUT_PATH = INPUT_DIR / "impression_events.csv"
CLICK_EVENTS_OUTPUT_PATH = INPUT_DIR / "click_events.csv"
BOOKING_EVENTS_OUTPUT_PATH = INPUT_DIR / "booking_events.csv"
SLOT_EVENTS_OUTPUT_PATH = INPUT_DIR / "slot_events.csv"
RELEVANCE_LABELS_OUTPUT_PATH = INPUT_DIR / "relevance_labels.csv"
REPORT_OUTPUT_PATH = REPORT_DIR / "phase5_interaction_logging_report.md"

RANDOM_SEED = 20260322
BASE_EVENT_TIME = datetime(2026, 3, 22, 9, 0, 0, tzinfo=timezone.utc)
USER_POOL_SIZE = 9


EVENT_SCHEMAS = {
    "search_events": [
        "search_event_id",
        "query_id",
        "user_id",
        "session_id",
        "event_ts",
        "search_mode",
        "query_index",
        "query_source",
        "query_context",
        "origin_latitude",
        "origin_longitude",
        "destination_latitude",
        "destination_longitude",
        "radius_km",
        "max_corridor_km",
        "require_open_now",
        "min_rating",
    ],
    "impression_events": [
        "impression_event_id",
        "query_id",
        "search_event_id",
        "user_id",
        "session_id",
        "event_ts",
        "search_mode",
        "merchant_id",
        "merchant_name",
        "rank_position",
        "base_rank_score",
        "final_rank_score",
        "distance_km",
        "route_distance_proxy",
        "detour_proxy",
        "reason_tags",
    ],
    "click_events": [
        "click_event_id",
        "impression_event_id",
        "query_id",
        "search_event_id",
        "user_id",
        "session_id",
        "event_ts",
        "search_mode",
        "merchant_id",
        "merchant_name",
        "rank_position",
        "final_rank_score",
        "click_rank_bias",
        "click_source",
    ],
    "booking_events": [
        "booking_event_id",
        "click_event_id",
        "query_id",
        "search_event_id",
        "user_id",
        "session_id",
        "event_ts",
        "search_mode",
        "merchant_id",
        "merchant_name",
        "booking_value_band",
        "booking_status",
    ],
    "slot_events": [
        "slot_event_id",
        "query_id",
        "search_event_id",
        "user_id",
        "session_id",
        "event_ts",
        "search_mode",
        "merchant_id",
        "merchant_name",
        "slot_event_type",
        "slot_id",
        "slot_start_ts",
        "slot_end_ts",
        "slot_rank",
        "slot_selected",
        "booking_event_id",
    ],
}


@dataclass
class SearchContext:
    query_id: str
    search_mode: str
    user_id: str
    session_id: str
    search_event_id: str
    event_ts: datetime


def safe_read_csv(path: Path) -> pd.DataFrame:
    last_error: Exception | None = None
    for encoding in ("utf-8", "utf-8-sig", "cp1258", "latin1"):
        try:
            return pd.read_csv(path, encoding=encoding)
        except UnicodeDecodeError as exc:
            last_error = exc
    if last_error is not None:
        raise last_error
    return pd.read_csv(path)


def stable_hash_int(value: str) -> int:
    return int(hashlib.sha256(value.encode("utf-8")).hexdigest()[:16], 16)


def anonymized_user_id(index: int) -> str:
    return f"user_{index:03d}"


def first_non_null(*values: object) -> object:
    for value in values:
        if pd.notna(value):
            return value
    return pd.NA


def build_search_events() -> pd.DataFrame:
    nearby_queries = safe_read_csv(QUERIES_NEARBY_PATH).copy()
    nearby_queries["search_mode"] = "nearby"
    nearby_queries["query_source"] = "synthetic_nearby_seeded"

    route_queries = safe_read_csv(QUERIES_ON_ROUTE_PATH).copy()
    route_queries["search_mode"] = "on_route"
    route_queries["query_source"] = "synthetic_route_seeded"

    all_queries = pd.concat([nearby_queries, route_queries], ignore_index=True, sort=False)
    all_queries = all_queries.reset_index(drop=True)

    search_events: list[dict[str, object]] = []
    for idx, row in all_queries.iterrows():
        user_slot = (idx % USER_POOL_SIZE) + 1
        query_ts = BASE_EVENT_TIME + timedelta(minutes=idx * 7)
        query_id = row["query_id"]
        search_mode = row["search_mode"]
        query_context = (
            f"nearby around {row.get('anchor_district', 'unknown')}"
            if search_mode == "nearby"
            else f"route {row.get('origin_district', 'unknown')} -> {row.get('destination_district', 'unknown')}"
        )
        search_events.append(
            {
                "search_event_id": f"search_evt_{idx + 1:04d}",
                "query_id": query_id,
                "user_id": anonymized_user_id(user_slot),
                "session_id": f"session_{user_slot:03d}_{(idx // USER_POOL_SIZE) + 1:02d}",
                "event_ts": query_ts.isoformat(),
                "search_mode": search_mode,
                "query_index": idx + 1,
                "query_source": row["query_source"],
                "query_context": query_context,
                "origin_latitude": first_non_null(row.get("origin_latitude"), row.get("user_latitude")),
                "origin_longitude": first_non_null(row.get("origin_longitude"), row.get("user_longitude")),
                "destination_latitude": first_non_null(row.get("destination_latitude")),
                "destination_longitude": first_non_null(row.get("destination_longitude")),
                "radius_km": first_non_null(row.get("radius_km")),
                "max_corridor_km": first_non_null(row.get("max_corridor_km")),
                "require_open_now": first_non_null(row.get("require_open_now")),
                "min_rating": first_non_null(row.get("min_rating")),
            }
        )

    return pd.DataFrame(search_events, columns=EVENT_SCHEMAS["search_events"])


def load_ranked_results() -> pd.DataFrame:
    common_columns = [
        "query_id",
        "merchant_id",
        "merchant_name",
        "distance_km",
        "route_distance_proxy",
        "detour_proxy",
        "base_rank_score",
        "final_rank_score",
        "rank_position",
        "reason_tags",
        "search_mode",
    ]

    nearby = safe_read_csv(RANKING_NEARBY_PATH).copy()
    nearby["search_mode"] = "nearby"
    nearby["distance_km"] = pd.to_numeric(nearby["distance_km"], errors="coerce")
    nearby["route_distance_proxy"] = float("nan")
    nearby["detour_proxy"] = float("nan")
    nearby = nearby.reindex(columns=common_columns)

    route = safe_read_csv(RANKING_ON_ROUTE_PATH).copy()
    route["search_mode"] = "on_route"
    route["distance_km"] = float("nan")
    route["route_distance_proxy"] = pd.to_numeric(route["route_distance_proxy"], errors="coerce")
    route["detour_proxy"] = pd.to_numeric(route["detour_proxy"], errors="coerce")
    route = route.reindex(columns=common_columns)

    ranked = pd.concat([nearby, route], ignore_index=True)
    ranked["base_rank_score"] = pd.to_numeric(ranked["base_rank_score"], errors="coerce").fillna(0.0)
    ranked["final_rank_score"] = pd.to_numeric(ranked["final_rank_score"], errors="coerce").fillna(0.0)
    ranked["rank_position"] = pd.to_numeric(ranked["rank_position"], errors="coerce").fillna(9999).astype(int)
    return ranked


def build_search_contexts(search_events_df: pd.DataFrame) -> dict[str, SearchContext]:
    contexts: dict[str, SearchContext] = {}
    for _, row in search_events_df.iterrows():
        contexts[row["query_id"]] = SearchContext(
            query_id=row["query_id"],
            search_mode=row["search_mode"],
            user_id=row["user_id"],
            session_id=row["session_id"],
            search_event_id=row["search_event_id"],
            event_ts=datetime.fromisoformat(row["event_ts"]),
        )
    return contexts


def build_impression_events(ranked_df: pd.DataFrame, contexts: dict[str, SearchContext]) -> pd.DataFrame:
    records: list[dict[str, object]] = []
    for idx, row in ranked_df.sort_values(["query_id", "rank_position"]).iterrows():
        context = contexts[row["query_id"]]
        impression_ts = context.event_ts + timedelta(seconds=int(row["rank_position"]) * 2)
        records.append(
            {
                "impression_event_id": f"imp_evt_{idx + 1:05d}",
                "query_id": row["query_id"],
                "search_event_id": context.search_event_id,
                "user_id": context.user_id,
                "session_id": context.session_id,
                "event_ts": impression_ts.isoformat(),
                "search_mode": row["search_mode"],
                "merchant_id": row["merchant_id"],
                "merchant_name": row["merchant_name"],
                "rank_position": int(row["rank_position"]),
                "base_rank_score": float(row["base_rank_score"]),
                "final_rank_score": float(row["final_rank_score"]),
                "distance_km": row.get("distance_km", pd.NA),
                "route_distance_proxy": row.get("route_distance_proxy", pd.NA),
                "detour_proxy": row.get("detour_proxy", pd.NA),
                "reason_tags": row.get("reason_tags", ""),
            }
        )
    return pd.DataFrame(records, columns=EVENT_SCHEMAS["impression_events"])


def click_probability(rank_position: int, final_rank_score: float, search_mode: str, rng: random.Random) -> float:
    rank_term = math.exp(-(rank_position - 1) / 4.5)
    mode_bias = 0.03 if search_mode == "on_route" else 0.0
    noise = rng.uniform(-0.02, 0.02)
    probability = 0.07 + (0.42 * rank_term) + (0.28 * final_rank_score) + mode_bias + noise
    return max(0.03, min(0.88, probability))


def booking_probability(rank_position: int, final_rank_score: float, reason_tags: str, rng: random.Random) -> float:
    tag_bonus = 0.08 if "open_now" in str(reason_tags) else 0.0
    rank_bonus = max(0.0, 0.16 - ((rank_position - 1) * 0.015))
    noise = rng.uniform(-0.015, 0.015)
    probability = 0.08 + (0.25 * final_rank_score) + rank_bonus + tag_bonus + noise
    return max(0.04, min(0.7, probability))


def should_select_slot(rank_position: int, final_rank_score: float, rng: random.Random) -> bool:
    probability = max(0.08, min(0.82, 0.16 + (0.22 * final_rank_score) + (0.10 if rank_position <= 3 else 0.0) + rng.uniform(-0.02, 0.02)))
    return rng.random() < probability


def build_click_and_booking_events(impressions_df: pd.DataFrame) -> tuple[pd.DataFrame, pd.DataFrame]:
    click_records: list[dict[str, object]] = []
    booking_records: list[dict[str, object]] = []

    click_idx = 1
    booking_idx = 1

    for _, row in impressions_df.iterrows():
        seed = stable_hash_int(f"click::{row['query_id']}::{row['merchant_id']}")
        rng = random.Random(RANDOM_SEED + seed)
        click_prob = click_probability(
            int(row["rank_position"]),
            float(row["final_rank_score"]),
            str(row["search_mode"]),
            rng,
        )
        if rng.random() >= click_prob:
            continue

        impression_ts = datetime.fromisoformat(row["event_ts"])
        click_ts = impression_ts + timedelta(seconds=5 + (int(row["rank_position"]) % 5) * 3)
        click_event_id = f"click_evt_{click_idx:05d}"
        click_records.append(
            {
                "click_event_id": click_event_id,
                "impression_event_id": row["impression_event_id"],
                "query_id": row["query_id"],
                "search_event_id": row["search_event_id"],
                "user_id": row["user_id"],
                "session_id": row["session_id"],
                "event_ts": click_ts.isoformat(),
                "search_mode": row["search_mode"],
                "merchant_id": row["merchant_id"],
                "merchant_name": row["merchant_name"],
                "rank_position": int(row["rank_position"]),
                "final_rank_score": float(row["final_rank_score"]),
                "click_rank_bias": round(click_prob, 4),
                "click_source": "synthetic_top_bias",
            }
        )
        click_idx += 1

        book_rng = random.Random(RANDOM_SEED + seed + 77)
        booking_prob = booking_probability(
            int(row["rank_position"]),
            float(row["final_rank_score"]),
            str(row.get("reason_tags", "")),
            book_rng,
        )
        if book_rng.random() >= booking_prob:
            continue

        booking_ts = click_ts + timedelta(minutes=4 + (int(row["rank_position"]) % 4) * 2)
        booking_records.append(
            {
                "booking_event_id": f"booking_evt_{booking_idx:05d}",
                "click_event_id": click_event_id,
                "query_id": row["query_id"],
                "search_event_id": row["search_event_id"],
                "user_id": row["user_id"],
                "session_id": row["session_id"],
                "event_ts": booking_ts.isoformat(),
                "search_mode": row["search_mode"],
                "merchant_id": row["merchant_id"],
                "merchant_name": row["merchant_name"],
                "booking_value_band": "medium" if float(row["final_rank_score"]) < 0.75 else "high",
                "booking_status": "confirmed",
            }
        )
        booking_idx += 1

    clicks_df = pd.DataFrame(click_records, columns=EVENT_SCHEMAS["click_events"])
    bookings_df = pd.DataFrame(booking_records, columns=EVENT_SCHEMAS["booking_events"])
    return clicks_df, bookings_df


def build_slot_events(clicks_df: pd.DataFrame, bookings_df: pd.DataFrame) -> pd.DataFrame:
    booking_lookup = {
        (row["query_id"], row["merchant_id"]): row["booking_event_id"]
        for _, row in bookings_df.iterrows()
    }

    slot_records: list[dict[str, object]] = []
    slot_idx = 1
    base_slots = [
        (9, 0),
        (11, 0),
        (14, 0),
    ]

    for _, row in clicks_df.iterrows():
        click_ts = datetime.fromisoformat(row["event_ts"])
        day_offset = stable_hash_int(f"slot-day::{row['merchant_id']}::{row['query_id']}") % 3
        selected_slot_rank: int | None = None

        slot_rng = random.Random(RANDOM_SEED + stable_hash_int(f"slot::{row['query_id']}::{row['merchant_id']}"))
        if should_select_slot(int(row["rank_position"]), float(row["final_rank_score"]), slot_rng):
            selected_slot_rank = 1 + (stable_hash_int(f"slot-pick::{row['query_id']}::{row['merchant_id']}") % len(base_slots))

        for slot_rank, (hour, minute) in enumerate(base_slots, start=1):
            slot_start = (click_ts + timedelta(days=day_offset + 1)).replace(hour=hour, minute=minute, second=0, microsecond=0)
            slot_end = slot_start + timedelta(minutes=45)
            slot_id = f"{row['merchant_id']}_slot_{slot_rank}"

            slot_records.append(
                {
                    "slot_event_id": f"slot_evt_{slot_idx:06d}",
                    "query_id": row["query_id"],
                    "search_event_id": row["search_event_id"],
                    "user_id": row["user_id"],
                    "session_id": row["session_id"],
                    "event_ts": (click_ts + timedelta(seconds=slot_rank * 4)).isoformat(),
                    "search_mode": row["search_mode"],
                    "merchant_id": row["merchant_id"],
                    "merchant_name": row["merchant_name"],
                    "slot_event_type": "slot_shown",
                    "slot_id": slot_id,
                    "slot_start_ts": slot_start.isoformat(),
                    "slot_end_ts": slot_end.isoformat(),
                    "slot_rank": slot_rank,
                    "slot_selected": False,
                    "booking_event_id": pd.NA,
                }
            )
            slot_idx += 1

            if selected_slot_rank == slot_rank:
                slot_records.append(
                    {
                        "slot_event_id": f"slot_evt_{slot_idx:06d}",
                        "query_id": row["query_id"],
                        "search_event_id": row["search_event_id"],
                        "user_id": row["user_id"],
                        "session_id": row["session_id"],
                        "event_ts": (click_ts + timedelta(seconds=slot_rank * 4 + 9)).isoformat(),
                        "search_mode": row["search_mode"],
                        "merchant_id": row["merchant_id"],
                        "merchant_name": row["merchant_name"],
                        "slot_event_type": "slot_selected",
                        "slot_id": slot_id,
                        "slot_start_ts": slot_start.isoformat(),
                        "slot_end_ts": slot_end.isoformat(),
                        "slot_rank": slot_rank,
                        "slot_selected": True,
                        "booking_event_id": booking_lookup.get((row["query_id"], row["merchant_id"]), pd.NA),
                    }
                )
                slot_idx += 1

    return pd.DataFrame(slot_records, columns=EVENT_SCHEMAS["slot_events"])


def build_relevance_labels(
    search_events_df: pd.DataFrame,
    impressions_df: pd.DataFrame,
    clicks_df: pd.DataFrame,
    bookings_df: pd.DataFrame,
) -> pd.DataFrame:
    merchant_pool = pd.concat(
        [
            impressions_df[["merchant_id", "merchant_name"]],
            clicks_df[["merchant_id", "merchant_name"]],
            bookings_df[["merchant_id", "merchant_name"]],
        ],
        ignore_index=True,
    ).drop_duplicates(subset=["merchant_id"]).reset_index(drop=True)

    search_keys = search_events_df[["query_id", "search_event_id", "user_id", "session_id", "search_mode"]].copy()
    search_keys["join_key"] = 1
    merchant_pool["join_key"] = 1
    labels_df = search_keys.merge(merchant_pool, on="join_key", how="left").drop(columns=["join_key"])

    impression_pairs = impressions_df[["query_id", "merchant_id"]].drop_duplicates().assign(impressed=1)
    click_pairs = clicks_df[["query_id", "merchant_id"]].drop_duplicates().assign(clicked=1)
    booking_pairs = bookings_df[["query_id", "merchant_id"]].drop_duplicates().assign(booked=1)

    labels_df = labels_df.merge(impression_pairs, on=["query_id", "merchant_id"], how="left")
    labels_df = labels_df.merge(click_pairs, on=["query_id", "merchant_id"], how="left")
    labels_df = labels_df.merge(booking_pairs, on=["query_id", "merchant_id"], how="left")

    labels_df["impressed"] = labels_df["impressed"].fillna(0).astype(int)
    labels_df["clicked"] = labels_df["clicked"].fillna(0).astype(int)
    labels_df["booked"] = labels_df["booked"].fillna(0).astype(int)
    labels_df["relevance_label"] = 0
    labels_df.loc[labels_df["impressed"] == 1, "relevance_label"] = 1
    labels_df.loc[labels_df["clicked"] == 1, "relevance_label"] = 2
    labels_df.loc[labels_df["booked"] == 1, "relevance_label"] = 3
    labels_df["label_source"] = labels_df["relevance_label"].map(
        {
            0: "not_shown_negative",
            1: "impression_only",
            2: "clicked",
            3: "booked",
        }
    )

    columns = [
        "query_id",
        "search_event_id",
        "user_id",
        "session_id",
        "search_mode",
        "merchant_id",
        "merchant_name",
        "impressed",
        "clicked",
        "booked",
        "relevance_label",
        "label_source",
    ]
    return labels_df[columns].copy()


def dataframe_to_markdown_table(df: pd.DataFrame) -> list[str]:
    header = ["metric"] + [str(column) for column in df.columns]
    lines = [
        "| " + " | ".join(header) + " |",
        "| " + " | ".join(["---"] * len(header)) + " |",
    ]
    for index, row in df.iterrows():
        values = [str(index)] + [str(row[column]) for column in df.columns]
        lines.append("| " + " | ".join(values) + " |")
    return lines


def write_report(
    search_events_df: pd.DataFrame,
    impressions_df: pd.DataFrame,
    clicks_df: pd.DataFrame,
    bookings_df: pd.DataFrame,
    slot_events_df: pd.DataFrame,
    relevance_labels_df: pd.DataFrame,
) -> None:
    REPORT_DIR.mkdir(parents=True, exist_ok=True)

    total_searches = len(search_events_df)
    total_impressions = len(impressions_df)
    total_clicks = len(clicks_df)
    total_bookings = len(bookings_df)
    total_slot_shown = int((slot_events_df["slot_event_type"] == "slot_shown").sum())
    total_slot_selected = int((slot_events_df["slot_event_type"] == "slot_selected").sum())
    ctr = (total_clicks / total_impressions) if total_impressions else 0.0
    booking_after_click = (total_bookings / total_clicks) if total_clicks else 0.0

    label_distribution = relevance_labels_df["relevance_label"].value_counts().sort_index()
    label_distribution_df = label_distribution.rename_axis("label").to_frame("count")

    schema_lines = []
    for schema_name, columns in EVENT_SCHEMAS.items():
        schema_lines.append(f"- `{schema_name}`: {', '.join(f'`{column}`' for column in columns)}")

    assumptions = [
        "Every ranked merchant becomes an impression event so the log preserves full shown-result exposure for each query.",
        "Click probability is biased toward better rank positions and stronger final rank scores, with small seeded noise for variation.",
        "Booking probability is conditioned on clicked merchants only and is slightly higher for open-now and high-rank results.",
        "Slot events are generated only for clicked merchants, with three candidate slots shown and an optional selected slot event.",
        "Relevance labels include full query-merchant combinations over the shown merchant pool so label 0 negatives are available for future training joins.",
        f"All synthetic behavior is deterministic under seed `{RANDOM_SEED}` for reproducibility.",
    ]

    lines = [
        "# Phase 5 Interaction Logging Report",
        "",
        "## Event Volume",
        f"- Total search events: {total_searches}",
        f"- Total impressions: {total_impressions}",
        f"- Total clicks: {total_clicks}",
        f"- Total bookings: {total_bookings}",
        f"- Total slot_shown: {total_slot_shown}",
        f"- Total slot_selected: {total_slot_selected}",
        f"- Click-through rate: {ctr:.4f}",
        f"- Booking-after-click rate: {booking_after_click:.4f}",
        "",
        "## Relevance Label Distribution",
    ]

    if label_distribution_df.empty:
        lines.append("- No labels generated.")
    else:
        for label, row in label_distribution_df.iterrows():
            lines.append(f"- Label {label}: {int(row['count'])}")

    lines.extend(["", "## Event Schemas"])
    lines.extend(schema_lines)
    lines.extend(["", "## Assumptions Used For Synthetic Behavior Generation"])
    lines.extend([f"- {item}" for item in assumptions])

    REPORT_OUTPUT_PATH.write_text("\n".join(lines) + "\n", encoding="utf-8")


def print_terminal_summary(
    search_events_df: pd.DataFrame,
    impressions_df: pd.DataFrame,
    clicks_df: pd.DataFrame,
    bookings_df: pd.DataFrame,
    slot_events_df: pd.DataFrame,
    relevance_labels_df: pd.DataFrame,
) -> None:
    slot_shown = int((slot_events_df["slot_event_type"] == "slot_shown").sum())
    slot_selected = int((slot_events_df["slot_event_type"] == "slot_selected").sum())
    ctr = (len(clicks_df) / len(impressions_df)) if len(impressions_df) else 0.0
    booking_rate = (len(bookings_df) / len(clicks_df)) if len(clicks_df) else 0.0
    print(f"search events: {len(search_events_df)}")
    print(f"impressions: {len(impressions_df)}")
    print(f"clicks: {len(clicks_df)}")
    print(f"bookings: {len(bookings_df)}")
    print(f"slot shown: {slot_shown}")
    print(f"slot selected: {slot_selected}")
    print(f"ctr: {ctr:.4f}")
    print(f"booking-after-click: {booking_rate:.4f}")
    print("label distribution:")
    for label, count in relevance_labels_df["relevance_label"].value_counts().sort_index().items():
        print(f"- {label}: {int(count)}")


def main() -> None:
    search_events_df = build_search_events()
    ranked_df = load_ranked_results()
    contexts = build_search_contexts(search_events_df)
    impressions_df = build_impression_events(ranked_df, contexts)
    clicks_df, bookings_df = build_click_and_booking_events(impressions_df)
    slot_events_df = build_slot_events(clicks_df, bookings_df)
    relevance_labels_df = build_relevance_labels(search_events_df, impressions_df, clicks_df, bookings_df)

    search_events_df.to_csv(SEARCH_EVENTS_OUTPUT_PATH, index=False, encoding="utf-8")
    impressions_df.to_csv(IMPRESSION_EVENTS_OUTPUT_PATH, index=False, encoding="utf-8")
    clicks_df.to_csv(CLICK_EVENTS_OUTPUT_PATH, index=False, encoding="utf-8")
    bookings_df.to_csv(BOOKING_EVENTS_OUTPUT_PATH, index=False, encoding="utf-8")
    slot_events_df.to_csv(SLOT_EVENTS_OUTPUT_PATH, index=False, encoding="utf-8")
    relevance_labels_df.to_csv(RELEVANCE_LABELS_OUTPUT_PATH, index=False, encoding="utf-8")

    write_report(
        search_events_df,
        impressions_df,
        clicks_df,
        bookings_df,
        slot_events_df,
        relevance_labels_df,
    )
    print_terminal_summary(
        search_events_df,
        impressions_df,
        clicks_df,
        bookings_df,
        slot_events_df,
        relevance_labels_df,
    )


if __name__ == "__main__":
    main()
