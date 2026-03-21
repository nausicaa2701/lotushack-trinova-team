from __future__ import annotations

from pathlib import Path

import pandas as pd


ROOT_DIR = Path(__file__).resolve().parents[2]
INPUT_DIR = ROOT_DIR / "Dataset" / "ProcessedData"
REPORT_DIR = ROOT_DIR / ".prompt" / "reports"

SEARCH_EVENTS_PATH = INPUT_DIR / "search_events.csv"
SLOT_EVENTS_PATH = INPUT_DIR / "slot_events.csv"
MERCHANT_GEO_READY_PATH = INPUT_DIR / "merchant_geo_ready.csv"
MERCHANT_RANKING_FEATURES_PATH = INPUT_DIR / "merchant_ranking_features.csv"
IMPRESSION_EVENTS_PATH = INPUT_DIR / "impression_events.csv"
CLICK_EVENTS_PATH = INPUT_DIR / "click_events.csv"
BOOKING_EVENTS_PATH = INPUT_DIR / "booking_events.csv"

SLOT_TRAINING_DATASET_OUTPUT_PATH = INPUT_DIR / "slot_training_dataset.csv"
SLOT_FEATURE_DICTIONARY_OUTPUT_PATH = INPUT_DIR / "slot_feature_dictionary.csv"
REPORT_OUTPUT_PATH = REPORT_DIR / "phase8_slot_dataset_report.md"

SERVICE_FLAG_COLUMNS = [
    "service_exterior_wash",
    "service_interior_cleaning",
    "service_detailing",
    "service_ceramic",
    "service_ev_safe",
    "service_fast_lane",
    "service_car_supported",
    "service_motorbike_supported",
]

NUMERIC_COLUMNS_TO_FILL = [
    "require_open_now",
    "min_rating",
    "radius_km",
    "max_corridor_km",
    "rating",
    "review_count_source",
    "is_open_now_proxy",
    "rating_score",
    "review_volume_score",
    "trust_score",
    "open_score",
    "service_richness_score",
    "base_rank_score",
    "slot_hour",
    "slot_minute",
    "lead_time_hours",
    "slot_position_if_available",
    "merchant_rank_position",
    "merchant_final_rank_score",
    "distance_km",
    "detour_proxy",
    "route_distance_proxy",
]


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


def ensure_column(df: pd.DataFrame, column: str, default: object = pd.NA) -> pd.DataFrame:
    if column not in df.columns:
        df[column] = default
    return df


def bool_from_mixed(value: object) -> bool:
    if isinstance(value, bool):
        return value
    if pd.isna(value):
        return False
    text = str(value).strip().lower()
    return text in {"true", "1", "yes", "y"}


def load_input_tables() -> dict[str, pd.DataFrame]:
    return {
        "search_events": safe_read_csv(SEARCH_EVENTS_PATH),
        "slot_events": safe_read_csv(SLOT_EVENTS_PATH),
        "merchant_geo_ready": safe_read_csv(MERCHANT_GEO_READY_PATH),
        "merchant_ranking_features": safe_read_csv(MERCHANT_RANKING_FEATURES_PATH),
        "impression_events": safe_read_csv(IMPRESSION_EVENTS_PATH),
        "click_events": safe_read_csv(CLICK_EVENTS_PATH),
        "booking_events": safe_read_csv(BOOKING_EVENTS_PATH),
    }


def build_slot_base(slot_events: pd.DataFrame) -> pd.DataFrame:
    slot_df = slot_events.copy()
    slot_df["slot_start_ts"] = pd.to_datetime(slot_df["slot_start_ts"], errors="coerce", utc=True)
    slot_df["slot_end_ts"] = pd.to_datetime(slot_df["slot_end_ts"], errors="coerce", utc=True)
    slot_df["event_ts"] = pd.to_datetime(slot_df["event_ts"], errors="coerce", utc=True)
    slot_df["slot_rank"] = pd.to_numeric(slot_df["slot_rank"], errors="coerce")
    slot_df["slot_id"] = slot_df["slot_id"].fillna(
        slot_df["merchant_id"].astype(str) + "_" + slot_df["slot_start_ts"].astype(str)
    )
    slot_df["slot_selected"] = slot_df["slot_selected"].apply(bool_from_mixed)

    aggregate = (
        slot_df.groupby(["query_id", "merchant_id", "slot_id"], as_index=False)
        .agg(
            search_event_id=("search_event_id", "first"),
            user_id=("user_id", "first"),
            session_id=("session_id", "first"),
            search_mode=("search_mode", "first"),
            merchant_name=("merchant_name", "first"),
            slot_time=("slot_start_ts", "min"),
            slot_end_time=("slot_end_ts", "max"),
            slot_position_if_available=("slot_rank", "min"),
            slot_event_count=("slot_event_id", "size"),
            slot_shown_count=("slot_event_type", lambda values: int((pd.Series(values) == "slot_shown").sum())),
            slot_selected_count=("slot_event_type", lambda values: int((pd.Series(values) == "slot_selected").sum())),
        )
        .sort_values(["query_id", "merchant_id", "slot_time", "slot_id"])
        .reset_index(drop=True)
    )
    aggregate["slot_selected"] = (aggregate["slot_selected_count"] > 0).astype(int)
    aggregate["slot_shown"] = (aggregate["slot_shown_count"] > 0).astype(int)
    aggregate["slot_time"] = pd.to_datetime(aggregate["slot_time"], errors="coerce", utc=True)
    aggregate["slot_end_time"] = pd.to_datetime(aggregate["slot_end_time"], errors="coerce", utc=True)
    return aggregate


def build_search_context(search_events: pd.DataFrame) -> pd.DataFrame:
    search_df = search_events.copy()
    search_df["event_ts"] = pd.to_datetime(search_df["event_ts"], errors="coerce", utc=True)
    search_df["search_timestamp"] = search_df["event_ts"]
    search_df["weekday"] = search_df["search_timestamp"].dt.dayofweek
    search_df["hour_of_day"] = search_df["search_timestamp"].dt.hour
    search_df["is_weekend"] = search_df["weekday"].isin([5, 6]).astype(int)
    search_df["require_open_now"] = pd.to_numeric(search_df["require_open_now"], errors="coerce")
    search_df["min_rating"] = pd.to_numeric(search_df["min_rating"], errors="coerce")
    search_df["radius_km"] = pd.to_numeric(search_df["radius_km"], errors="coerce")
    search_df["max_corridor_km"] = pd.to_numeric(search_df["max_corridor_km"], errors="coerce")
    search_df["has_destination"] = search_df["destination_latitude"].notna() & search_df["destination_longitude"].notna()

    search_columns = [
        "query_id",
        "search_event_id",
        "search_mode",
        "query_source",
        "search_timestamp",
        "weekday",
        "hour_of_day",
        "is_weekend",
        "require_open_now",
        "min_rating",
        "radius_km",
        "max_corridor_km",
        "has_destination",
    ]
    return search_df[search_columns].copy()


def build_merchant_features(
    merchant_geo_ready: pd.DataFrame,
    merchant_ranking_features: pd.DataFrame,
) -> pd.DataFrame:
    geo_columns = [
        "merchant_id",
        "merchant_name",
        "rating",
        "review_count_source",
        "is_open_now_proxy",
    ]
    geo_df = merchant_geo_ready[[column for column in geo_columns if column in merchant_geo_ready.columns]].copy()

    ranking_columns = [
        "merchant_id",
        "rating_score",
        "review_volume_score",
        "trust_score",
        "open_score",
        "service_richness_score",
        "base_rank_score",
    ] + [column for column in SERVICE_FLAG_COLUMNS if column in merchant_ranking_features.columns]
    ranking_df = merchant_ranking_features[[column for column in ranking_columns if column in merchant_ranking_features.columns]].copy()

    merchant_df = geo_df.merge(ranking_df, how="left", on="merchant_id", suffixes=("", "_ranking"))
    for column in ["rating", "review_count_source", "is_open_now_proxy", "rating_score", "review_volume_score", "trust_score", "open_score", "service_richness_score", "base_rank_score"]:
        if column in merchant_df.columns:
            merchant_df[column] = pd.to_numeric(merchant_df[column], errors="coerce")
    for column in SERVICE_FLAG_COLUMNS:
        merchant_df = ensure_column(merchant_df, column, False)
        merchant_df[column] = merchant_df[column].apply(bool_from_mixed)
    return merchant_df.drop_duplicates(subset=["merchant_id"]).copy()


def build_query_merchant_context(
    impression_events: pd.DataFrame,
    click_events: pd.DataFrame,
    booking_events: pd.DataFrame,
) -> pd.DataFrame:
    impression_df = impression_events.copy()
    for column in ["rank_position", "final_rank_score", "distance_km", "detour_proxy", "route_distance_proxy"]:
        impression_df[column] = pd.to_numeric(impression_df[column], errors="coerce")
    impression_df = (
        impression_df.sort_values(["query_id", "merchant_id", "rank_position"])
        .drop_duplicates(subset=["query_id", "merchant_id"], keep="first")
        .copy()
    )
    impression_df = impression_df.rename(
        columns={
            "rank_position": "merchant_rank_position",
            "final_rank_score": "merchant_final_rank_score",
        }
    )
    impression_df = impression_df[
        [
            "query_id",
            "merchant_id",
            "merchant_rank_position",
            "merchant_final_rank_score",
            "distance_km",
            "detour_proxy",
            "route_distance_proxy",
        ]
    ].copy()

    click_df = (
        click_events.groupby(["query_id", "merchant_id"], as_index=False)
        .size()
        .rename(columns={"size": "click_event_count"})
    )
    click_df["was_clicked_for_query"] = (click_df["click_event_count"] > 0).astype(int)

    booking_df = (
        booking_events.groupby(["query_id", "merchant_id"], as_index=False)
        .size()
        .rename(columns={"size": "booking_event_count"})
    )
    booking_df["was_booked_for_query"] = (booking_df["booking_event_count"] > 0).astype(int)

    context_df = impression_df.merge(click_df, how="left", on=["query_id", "merchant_id"])
    context_df = context_df.merge(booking_df, how="left", on=["query_id", "merchant_id"])
    context_df["click_event_count"] = context_df["click_event_count"].fillna(0).astype(int)
    context_df["booking_event_count"] = context_df["booking_event_count"].fillna(0).astype(int)
    context_df["was_clicked_for_query"] = context_df["was_clicked_for_query"].fillna(0).astype(int)
    context_df["was_booked_for_query"] = context_df["was_booked_for_query"].fillna(0).astype(int)
    return context_df


def add_slot_time_features(dataset: pd.DataFrame) -> pd.DataFrame:
    df = dataset.copy()
    df["search_timestamp"] = pd.to_datetime(df["search_timestamp"], errors="coerce", utc=True)
    df["slot_time"] = pd.to_datetime(df["slot_time"], errors="coerce", utc=True)

    df["slot_hour"] = df["slot_time"].dt.hour
    df["slot_minute"] = df["slot_time"].dt.minute
    df["slot_hour_bucket"] = pd.cut(
        df["slot_hour"],
        bins=[-1, 10, 14, 18, 24],
        labels=["morning", "midday", "afternoon", "evening"],
    ).astype("object").fillna("unknown")
    df["lead_time_hours"] = (df["slot_time"] - df["search_timestamp"]).dt.total_seconds() / 3600.0
    df["slot_is_same_day"] = (
        df["slot_time"].dt.date == df["search_timestamp"].dt.date
    ).fillna(False)
    df["slot_is_next_day"] = (
        (df["slot_time"].dt.floor("D") - df["search_timestamp"].dt.floor("D")).dt.days == 1
    ).fillna(False)
    df["slot_is_weekend"] = df["slot_time"].dt.dayofweek.isin([5, 6]).fillna(False)
    df["slot_is_business_hour"] = df["slot_hour"].between(8, 17, inclusive="both").fillna(False)
    df["slot_is_evening"] = df["slot_hour"].between(17, 21, inclusive="both").fillna(False)
    df["slot_is_morning"] = df["slot_hour"].between(6, 11, inclusive="both").fillna(False)

    return df


def add_heuristic_features(dataset: pd.DataFrame) -> pd.DataFrame:
    df = dataset.copy()
    df["short_lead_time_flag"] = (df["lead_time_hours"] <= 12).fillna(False)
    df["medium_lead_time_flag"] = ((df["lead_time_hours"] > 12) & (df["lead_time_hours"] <= 36)).fillna(False)
    df["long_lead_time_flag"] = (df["lead_time_hours"] > 36).fillna(False)
    df["high_trust_evening_flag"] = ((df["trust_score"] >= 0.65) & df["slot_is_evening"]).fillna(False)
    df["open_and_top_ranked_flag"] = (
        df["is_open_now_proxy"].fillna(-1).eq(1)
        & df["merchant_rank_position"].fillna(999).le(3)
    )
    df["nearby_query_flag"] = (df["search_mode"] == "nearby").fillna(False)
    df["route_query_flag"] = (df["search_mode"] == "on_route").fillna(False)
    return df


def add_missing_safe_features(dataset: pd.DataFrame) -> pd.DataFrame:
    df = dataset.copy()

    defaults = {
        "require_open_now": 0.0,
        "min_rating": 0.0,
        "radius_km": df["radius_km"].median(skipna=True),
        "max_corridor_km": df["max_corridor_km"].median(skipna=True),
        "rating": df["rating"].median(skipna=True),
        "review_count_source": 0.0,
        "is_open_now_proxy": -1.0,
        "rating_score": 0.0,
        "review_volume_score": 0.0,
        "trust_score": 0.0,
        "open_score": 0.5,
        "service_richness_score": 0.0,
        "base_rank_score": 0.0,
        "slot_hour": 12.0,
        "slot_minute": 0.0,
        "lead_time_hours": 24.0,
        "slot_position_if_available": 99.0,
        "merchant_rank_position": 999.0,
        "merchant_final_rank_score": 0.0,
        "distance_km": df["distance_km"].median(skipna=True),
        "detour_proxy": 0.0,
        "route_distance_proxy": df["route_distance_proxy"].median(skipna=True),
    }

    for column in NUMERIC_COLUMNS_TO_FILL:
        df = ensure_column(df, column)
        df[column] = pd.to_numeric(df[column], errors="coerce")
        default_value = defaults.get(column, 0.0)
        if pd.isna(default_value):
            default_value = 0.0
        df[f"{column}_missing"] = df[column].isna().astype(int)
        df[f"{column}_filled"] = df[column].fillna(default_value)

    bool_columns = SERVICE_FLAG_COLUMNS + [
        "has_destination",
        "slot_is_same_day",
        "slot_is_next_day",
        "slot_is_weekend",
        "slot_is_business_hour",
        "slot_is_evening",
        "slot_is_morning",
        "short_lead_time_flag",
        "medium_lead_time_flag",
        "long_lead_time_flag",
        "high_trust_evening_flag",
        "open_and_top_ranked_flag",
        "nearby_query_flag",
        "route_query_flag",
        "is_weekend",
        "was_clicked_for_query",
        "was_booked_for_query",
    ]
    for column in bool_columns:
        df = ensure_column(df, column, False)
        df[column] = df[column].fillna(False).apply(bool_from_mixed).astype(int)

    return df


def build_slot_dataset(tables: dict[str, pd.DataFrame]) -> pd.DataFrame:
    slot_df = build_slot_base(tables["slot_events"])
    search_df = build_search_context(tables["search_events"])
    merchant_df = build_merchant_features(tables["merchant_geo_ready"], tables["merchant_ranking_features"])
    query_merchant_df = build_query_merchant_context(
        tables["impression_events"],
        tables["click_events"],
        tables["booking_events"],
    )

    dataset = slot_df.merge(search_df, how="left", on=["query_id", "search_event_id"])
    dataset = dataset.merge(merchant_df, how="left", on="merchant_id", suffixes=("", "_merchant"))
    dataset = dataset.merge(query_merchant_df, how="left", on=["query_id", "merchant_id"])
    dataset = dataset.drop(columns=[column for column in ["merchant_name_merchant"] if column in dataset.columns])

    if "search_mode_x" in dataset.columns or "search_mode_y" in dataset.columns:
        dataset["search_mode"] = dataset.get("search_mode_y", dataset.get("search_mode_x"))
        if "search_mode_y" in dataset.columns:
            dataset["search_mode"] = dataset["search_mode"].fillna(dataset.get("search_mode_x"))
        dataset = dataset.drop(columns=[column for column in ["search_mode_x", "search_mode_y"] if column in dataset.columns])

    dataset = add_slot_time_features(dataset)
    dataset = add_heuristic_features(dataset)
    dataset = add_missing_safe_features(dataset)
    dataset = dataset.drop_duplicates(subset=["query_id", "merchant_id", "slot_id"], keep="first").copy()
    return dataset


def get_model_feature_columns(dataset: pd.DataFrame) -> list[str]:
    excluded = {
        "query_id",
        "merchant_id",
        "slot_id",
        "search_event_id",
        "user_id",
        "session_id",
        "merchant_name",
        "slot_time",
        "slot_end_time",
        "search_timestamp",
        "search_mode",
        "slot_hour_bucket",
        "slot_selected",
        "slot_shown",
        "slot_event_count",
        "slot_shown_count",
        "slot_selected_count",
    }
    allowed = []
    for column in dataset.columns:
        if column in excluded:
            continue
        if column.endswith("_filled") or column.endswith("_missing"):
            allowed.append(column)
        elif column in SERVICE_FLAG_COLUMNS + [
            "has_destination",
            "weekday",
            "hour_of_day",
            "is_weekend",
            "slot_is_same_day",
            "slot_is_next_day",
            "slot_is_weekend",
            "slot_is_business_hour",
            "slot_is_evening",
            "slot_is_morning",
            "was_clicked_for_query",
            "was_booked_for_query",
            "short_lead_time_flag",
            "medium_lead_time_flag",
            "long_lead_time_flag",
            "high_trust_evening_flag",
            "open_and_top_ranked_flag",
            "nearby_query_flag",
            "route_query_flag",
        ]:
            allowed.append(column)
    return sorted(dict.fromkeys(allowed))


def build_feature_dictionary(dataset: pd.DataFrame) -> pd.DataFrame:
    source_map = {
        "query_id": "slot_events",
        "merchant_id": "slot_events",
        "slot_id": "slot_events",
        "search_event_id": "slot_events/search_events",
        "user_id": "slot_events",
        "session_id": "slot_events",
        "merchant_name": "slot_events",
        "search_mode": "search_events",
        "search_timestamp": "search_events",
        "weekday": "engineered_from_search_events",
        "hour_of_day": "engineered_from_search_events",
        "is_weekend": "engineered_from_search_events",
        "require_open_now": "search_events",
        "min_rating": "search_events",
        "radius_km": "search_events",
        "max_corridor_km": "search_events",
        "has_destination": "engineered_from_search_events",
        "rating": "merchant_geo_ready",
        "review_count_source": "merchant_geo_ready",
        "is_open_now_proxy": "merchant_geo_ready",
        "rating_score": "merchant_ranking_features",
        "review_volume_score": "merchant_ranking_features",
        "trust_score": "merchant_ranking_features",
        "open_score": "merchant_ranking_features",
        "service_richness_score": "merchant_ranking_features",
        "base_rank_score": "merchant_ranking_features",
        "merchant_rank_position": "impression_events",
        "merchant_final_rank_score": "impression_events",
        "distance_km": "impression_events",
        "detour_proxy": "impression_events",
        "route_distance_proxy": "impression_events",
        "was_clicked_for_query": "click_events",
        "was_booked_for_query": "booking_events",
        "slot_time": "slot_events",
        "slot_hour": "engineered_from_slot_events",
        "slot_minute": "engineered_from_slot_events",
        "slot_hour_bucket": "engineered_from_slot_events",
        "lead_time_hours": "engineered_from_slot_events",
        "slot_is_same_day": "engineered_from_slot_events",
        "slot_is_next_day": "engineered_from_slot_events",
        "slot_is_weekend": "engineered_from_slot_events",
        "slot_is_business_hour": "engineered_from_slot_events",
        "slot_is_evening": "engineered_from_slot_events",
        "slot_is_morning": "engineered_from_slot_events",
        "slot_position_if_available": "slot_events",
        "slot_selected": "slot_events",
    }
    for column in SERVICE_FLAG_COLUMNS:
        source_map[column] = "merchant_ranking_features"

    descriptions = {
        "slot_selected": "Target label where selected slot = 1 and shown-only slot = 0.",
        "slot_time": "Slot start timestamp used to derive timing features.",
        "lead_time_hours": "Hours between the search timestamp and slot start time.",
        "merchant_rank_position": "Merchant ranking position for the query from impression logs.",
        "merchant_final_rank_score": "Merchant ranking score from the query impression context.",
        "high_trust_evening_flag": "Indicator for trusted merchants offered in evening slots.",
        "open_and_top_ranked_flag": "Indicator for merchants that appear open now and were highly ranked for the query.",
    }

    model_features = set(get_model_feature_columns(dataset))
    records = []
    for column in dataset.columns:
        records.append(
            {
                "column_name": column,
                "source_table": source_map.get(
                    column,
                    "engineered" if column.endswith("_filled") or column.endswith("_missing") else "joined_dataset",
                ),
                "data_type": str(dataset[column].dtype),
                "description": descriptions.get(column, f"Slot dataset column `{column}`."),
                "used_for_model": "yes" if column in model_features else "no",
            }
        )
    return pd.DataFrame(records, columns=["column_name", "source_table", "data_type", "description", "used_for_model"])


def write_report(dataset: pd.DataFrame, feature_dictionary: pd.DataFrame) -> None:
    REPORT_DIR.mkdir(parents=True, exist_ok=True)
    label_distribution = dataset["slot_selected"].value_counts().sort_index()
    positive_rate = float(dataset["slot_selected"].mean()) if len(dataset) else 0.0
    missing_summary = (
        dataset[[column for column in dataset.columns if column.endswith("_missing")]]
        .sum()
        .sort_values(ascending=False)
        .head(20)
    )
    final_model_features = feature_dictionary.loc[feature_dictionary["used_for_model"] == "yes", "column_name"].tolist()

    lines = [
        "# Phase 8 Slot Dataset Report",
        "",
        "## Dataset Summary",
        f"- Total rows: {len(dataset)}",
        f"- Unique queries: {dataset['query_id'].nunique()}",
        f"- Unique merchants: {dataset['merchant_id'].nunique()}",
        f"- Unique slots: {dataset['slot_id'].nunique()}",
        f"- Positive rate: {positive_rate:.4f}",
        "",
        "## Label Distribution",
    ]
    for label, count in label_distribution.items():
        lines.append(f"- Label {int(label)}: {int(count)}")

    lines.extend(["", "## Missing Value Summary"])
    for column, count in missing_summary.items():
        lines.append(f"- `{column}`: {int(count)}")

    lines.extend(["", "## Final Model Feature List"])
    for feature in final_model_features:
        lines.append(f"- `{feature}`")

    lines.extend(
        [
            "",
            "## Assumptions Used For Slot Parsing And Feature Engineering",
            "- Slot rows are built from unique `query_id + merchant_id + slot_id` combinations, with `slot_selected = 1` if any matching slot_selected event exists.",
            "- Slot start time comes from `slot_start_ts`; if `slot_id` were missing, the pipeline would rebuild it deterministically from `merchant_id + slot_start_ts`.",
            "- Search timestamps and slot timestamps are parsed in UTC and used directly for lead-time and weekday features.",
            "- Impression, click, and booking context is joined at the `query_id + merchant_id` grain and reused across all slots for that merchant within the query.",
            "- Missing numeric values are converted to model-safe `_filled` features with paired `_missing` indicators.",
            "",
            "## Synthetic Data Warnings",
            "- Slot events are synthetic and inherit the behavioral assumptions from Phase 5, so this dataset is suitable for pipeline prototyping but not production learning.",
            "- Merchant-level and ranking-level context may dominate slot behavior because true user calendar constraints, merchant capacity, and historical slot occupancy are not present.",
            "- A future production dataset should add real slot availability, merchant operating calendars, and actual appointment acceptance outcomes.",
        ]
    )

    REPORT_OUTPUT_PATH.write_text("\n".join(lines) + "\n", encoding="utf-8")


def print_terminal_summary(dataset: pd.DataFrame, feature_dictionary: pd.DataFrame) -> None:
    print(f"rows: {len(dataset)}")
    print(f"unique queries: {dataset['query_id'].nunique()}")
    print(f"unique merchants: {dataset['merchant_id'].nunique()}")
    print(f"unique slots: {dataset['slot_id'].nunique()}")
    print(f"positive rate: {dataset['slot_selected'].mean():.4f}")
    print("label distribution:")
    for label, count in dataset["slot_selected"].value_counts().sort_index().items():
        print(f"- {int(label)}: {int(count)}")
    print(f"model feature count: {(feature_dictionary['used_for_model'] == 'yes').sum()}")


def main() -> None:
    tables = load_input_tables()
    dataset = build_slot_dataset(tables)
    feature_dictionary = build_feature_dictionary(dataset)

    dataset.to_csv(SLOT_TRAINING_DATASET_OUTPUT_PATH, index=False, encoding="utf-8")
    feature_dictionary.to_csv(SLOT_FEATURE_DICTIONARY_OUTPUT_PATH, index=False, encoding="utf-8")
    write_report(dataset, feature_dictionary)
    print_terminal_summary(dataset, feature_dictionary)


if __name__ == "__main__":
    main()
