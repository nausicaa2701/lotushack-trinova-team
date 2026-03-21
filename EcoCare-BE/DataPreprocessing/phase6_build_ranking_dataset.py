from __future__ import annotations

from pathlib import Path

import pandas as pd


ROOT_DIR = Path(__file__).resolve().parents[2]
INPUT_DIR = ROOT_DIR / "Dataset" / "ProcessedData"
REPORT_DIR = ROOT_DIR / ".prompt" / "reports"

MERCHANT_GEO_READY_PATH = INPUT_DIR / "merchant_geo_ready.csv"
MERCHANT_RANKING_FEATURES_PATH = INPUT_DIR / "merchant_ranking_features.csv"
SEARCH_EVENTS_PATH = INPUT_DIR / "search_events.csv"
IMPRESSION_EVENTS_PATH = INPUT_DIR / "impression_events.csv"
CLICK_EVENTS_PATH = INPUT_DIR / "click_events.csv"
BOOKING_EVENTS_PATH = INPUT_DIR / "booking_events.csv"
RELEVANCE_LABELS_PATH = INPUT_DIR / "relevance_labels.csv"

TRAINING_DATASET_OUTPUT_PATH = INPUT_DIR / "ranking_training_dataset.csv"
GROUP_SIZES_OUTPUT_PATH = INPUT_DIR / "ranking_group_sizes.csv"
FEATURE_DICTIONARY_OUTPUT_PATH = INPUT_DIR / "ranking_feature_dictionary.csv"
REPORT_OUTPUT_PATH = REPORT_DIR / "phase6_ranking_dataset_report.md"

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

MERCHANT_FEATURE_COLUMNS = [
    "latitude",
    "longitude",
    "rating",
    "review_count_source",
    "is_open_now_proxy",
    "rating_score",
    "review_volume_score",
    "trust_score",
    "open_score",
    "service_richness_score",
    "unclaimed_penalty",
    "base_rank_score",
] + SERVICE_FLAG_COLUMNS

NUMERIC_COLUMNS_TO_FILL = [
    "require_open_now",
    "min_rating",
    "radius_km",
    "max_corridor_km",
    "latitude",
    "longitude",
    "rating",
    "review_count_source",
    "is_open_now_proxy",
    "rating_score",
    "review_volume_score",
    "trust_score",
    "open_score",
    "service_richness_score",
    "unclaimed_penalty",
    "base_rank_score",
    "rank_position",
    "final_rank_score",
    "distance_km",
    "route_distance_proxy",
    "detour_proxy",
    "reciprocal_rank",
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


def bool_from_mixed(value: object) -> bool:
    if isinstance(value, bool):
        return value
    if pd.isna(value):
        return False
    text = str(value).strip().lower()
    return text in {"true", "1", "yes", "y"}


def ensure_column(df: pd.DataFrame, column: str, default: object = pd.NA) -> pd.DataFrame:
    if column not in df.columns:
        df[column] = default
    return df


def load_input_tables() -> dict[str, pd.DataFrame]:
    return {
        "merchant_geo_ready": safe_read_csv(MERCHANT_GEO_READY_PATH),
        "merchant_ranking_features": safe_read_csv(MERCHANT_RANKING_FEATURES_PATH),
        "search_events": safe_read_csv(SEARCH_EVENTS_PATH),
        "impression_events": safe_read_csv(IMPRESSION_EVENTS_PATH),
        "click_events": safe_read_csv(CLICK_EVENTS_PATH),
        "booking_events": safe_read_csv(BOOKING_EVENTS_PATH),
        "relevance_labels": safe_read_csv(RELEVANCE_LABELS_PATH),
    }


def build_merchant_feature_table(
    merchant_geo_ready: pd.DataFrame,
    merchant_ranking_features: pd.DataFrame,
) -> pd.DataFrame:
    geo_columns = [
        "merchant_id",
        "merchant_name",
        "district_norm",
        "latitude",
        "longitude",
        "rating",
        "review_count_source",
        "is_open_now_proxy",
        "is_valid_geo",
    ]
    geo_df = merchant_geo_ready[[column for column in geo_columns if column in merchant_geo_ready.columns]].copy()

    ranking_extra_columns = [
        "merchant_id",
        "rating_score",
        "review_volume_score",
        "trust_score",
        "open_score",
        "service_richness_score",
        "unclaimed_penalty",
        "base_rank_score",
    ] + [column for column in SERVICE_FLAG_COLUMNS if column in merchant_ranking_features.columns]
    ranking_columns = [column for column in ranking_extra_columns if column in merchant_ranking_features.columns]
    ranking_df = merchant_ranking_features[ranking_columns].copy()

    merchant_df = geo_df.merge(ranking_df, how="left", on="merchant_id", suffixes=("", "_ranking"))
    if "merchant_name_ranking" in merchant_df.columns:
        merchant_df = merchant_df.drop(columns=["merchant_name_ranking"])

    for column in MERCHANT_FEATURE_COLUMNS + ["is_valid_geo"]:
        if column in merchant_df.columns:
            if column in SERVICE_FLAG_COLUMNS or column == "is_valid_geo":
                merchant_df[column] = merchant_df[column].apply(bool_from_mixed)
            else:
                merchant_df[column] = pd.to_numeric(merchant_df[column], errors="coerce")

    return merchant_df.drop_duplicates(subset=["merchant_id"]).copy()


def build_event_context_tables(
    search_events: pd.DataFrame,
    impression_events: pd.DataFrame,
    click_events: pd.DataFrame,
    booking_events: pd.DataFrame,
) -> tuple[pd.DataFrame, pd.DataFrame]:
    search_columns = [
        "query_id",
        "search_event_id",
        "query_source",
        "require_open_now",
        "min_rating",
        "radius_km",
        "max_corridor_km",
    ]
    search_df = search_events[[column for column in search_columns if column in search_events.columns]].copy()
    search_df["require_open_now"] = pd.to_numeric(search_df["require_open_now"], errors="coerce")
    search_df["min_rating"] = pd.to_numeric(search_df["min_rating"], errors="coerce")
    search_df["radius_km"] = pd.to_numeric(search_df["radius_km"], errors="coerce")
    search_df["max_corridor_km"] = pd.to_numeric(search_df["max_corridor_km"], errors="coerce")
    search_df["has_destination"] = search_df["max_corridor_km"].notna()

    impression_columns = [
        "query_id",
        "merchant_id",
        "rank_position",
        "final_rank_score",
        "distance_km",
        "route_distance_proxy",
        "detour_proxy",
    ]
    impression_df = impression_events[[column for column in impression_columns if column in impression_events.columns]].copy()
    for column in ["rank_position", "final_rank_score", "distance_km", "route_distance_proxy", "detour_proxy"]:
        impression_df[column] = pd.to_numeric(impression_df[column], errors="coerce")
    impression_df = (
        impression_df.sort_values(["query_id", "merchant_id", "rank_position"])
        .drop_duplicates(subset=["query_id", "merchant_id"], keep="first")
        .copy()
    )
    impression_df["was_impressed"] = True

    click_df = (
        click_events.groupby(["query_id", "merchant_id"], as_index=False)
        .size()
        .rename(columns={"size": "click_event_count"})
    )
    click_df["was_clicked"] = click_df["click_event_count"] > 0

    booking_df = (
        booking_events.groupby(["query_id", "merchant_id"], as_index=False)
        .size()
        .rename(columns={"size": "booking_event_count"})
    )
    booking_df["was_booked"] = booking_df["booking_event_count"] > 0

    event_context_df = impression_df.merge(click_df, how="left", on=["query_id", "merchant_id"])
    event_context_df = event_context_df.merge(booking_df, how="left", on=["query_id", "merchant_id"])
    event_context_df["click_event_count"] = event_context_df["click_event_count"].fillna(0).astype(int)
    event_context_df["booking_event_count"] = event_context_df["booking_event_count"].fillna(0).astype(int)
    event_context_df["was_clicked"] = event_context_df["was_clicked"].where(
        event_context_df["was_clicked"].notna(),
        False,
    ).astype(bool)
    event_context_df["was_booked"] = event_context_df["was_booked"].where(
        event_context_df["was_booked"].notna(),
        False,
    ).astype(bool)

    return search_df, event_context_df


def build_training_dataset(tables: dict[str, pd.DataFrame]) -> pd.DataFrame:
    merchant_df = build_merchant_feature_table(
        tables["merchant_geo_ready"],
        tables["merchant_ranking_features"],
    )
    search_df, event_context_df = build_event_context_tables(
        tables["search_events"],
        tables["impression_events"],
        tables["click_events"],
        tables["booking_events"],
    )

    labels_df = tables["relevance_labels"].copy()
    labels_df = labels_df.drop_duplicates(subset=["query_id", "merchant_id"], keep="first").copy()

    dataset = labels_df.merge(search_df, how="left", on=["query_id", "search_event_id"])
    dataset = dataset.merge(event_context_df, how="left", on=["query_id", "merchant_id"])
    dataset = dataset.merge(merchant_df, how="left", on="merchant_id", suffixes=("", "_merchant"))
    dataset = dataset.drop(columns=[column for column in ["merchant_name_merchant"] if column in dataset.columns])

    dataset["was_impressed"] = dataset["impressed"].fillna(0).astype(int).astype(bool)
    dataset["was_clicked"] = dataset["clicked"].fillna(0).astype(int).astype(bool)
    dataset["was_booked"] = dataset["booked"].fillna(0).astype(int).astype(bool)
    dataset["relevance_label"] = pd.to_numeric(dataset["relevance_label"], errors="coerce").fillna(0).astype(int)

    dataset["search_mode"] = dataset["search_mode"].fillna("unknown")
    dataset["query_source"] = dataset["query_source"].fillna("unknown")
    dataset["route_query_flag"] = (dataset["search_mode"] == "on_route").astype(int)
    dataset["nearby_query_flag"] = (dataset["search_mode"] == "nearby").astype(int)
    dataset["has_destination"] = dataset["has_destination"].fillna(False).astype(bool)

    for column in SERVICE_FLAG_COLUMNS + ["is_valid_geo"]:
        dataset = ensure_column(dataset, column, False)
        dataset[column] = dataset[column].fillna(False).apply(bool_from_mixed)

    for column in [
        "require_open_now",
        "min_rating",
        "radius_km",
        "max_corridor_km",
        "latitude",
        "longitude",
        "rating",
        "review_count_source",
        "is_open_now_proxy",
        "rating_score",
        "review_volume_score",
        "trust_score",
        "open_score",
        "service_richness_score",
        "unclaimed_penalty",
        "base_rank_score",
        "rank_position",
        "final_rank_score",
        "distance_km",
        "route_distance_proxy",
        "detour_proxy",
    ]:
        dataset = ensure_column(dataset, column)
        dataset[column] = pd.to_numeric(dataset[column], errors="coerce")

    dataset["reciprocal_rank"] = dataset["rank_position"].apply(
        lambda value: 1.0 / value if pd.notna(value) and value > 0 else 0.0
    )
    dataset["top_3_flag"] = dataset["rank_position"].apply(lambda value: bool(pd.notna(value) and value <= 3))
    dataset["top_5_flag"] = dataset["rank_position"].apply(lambda value: bool(pd.notna(value) and value <= 5))
    dataset["high_rating_flag"] = dataset["rating"].apply(lambda value: bool(pd.notna(value) and value >= 4.5))
    dataset["open_and_high_rating_flag"] = (
        dataset["high_rating_flag"] & dataset["is_open_now_proxy"].fillna(0).eq(1)
    )

    dataset = add_missing_safe_features(dataset)
    dataset = dataset.drop_duplicates(subset=["query_id", "merchant_id"], keep="first").copy()
    return dataset


def add_missing_safe_features(dataset: pd.DataFrame) -> pd.DataFrame:
    filled = dataset.copy()
    global_defaults = {
        "require_open_now": 0.0,
        "min_rating": 0.0,
        "radius_km": filled["radius_km"].median(skipna=True) if "radius_km" in filled else 0.0,
        "max_corridor_km": filled["max_corridor_km"].median(skipna=True) if "max_corridor_km" in filled else 0.0,
        "latitude": filled["latitude"].median(skipna=True),
        "longitude": filled["longitude"].median(skipna=True),
        "rating": filled["rating"].median(skipna=True),
        "review_count_source": 0.0,
        "is_open_now_proxy": -1.0,
        "rating_score": 0.0,
        "review_volume_score": 0.0,
        "trust_score": 0.0,
        "open_score": 0.5,
        "service_richness_score": 0.0,
        "unclaimed_penalty": 0.0,
        "base_rank_score": 0.0,
        "rank_position": 999.0,
        "final_rank_score": 0.0,
        "distance_km": filled["radius_km"].fillna(10).median(skipna=True),
        "route_distance_proxy": filled["max_corridor_km"].fillna(5).median(skipna=True),
        "detour_proxy": 0.0,
        "reciprocal_rank": 0.0,
    }

    for column in NUMERIC_COLUMNS_TO_FILL:
        filled = ensure_column(filled, column)
        default_value = global_defaults.get(column, 0.0)
        if pd.isna(default_value):
            default_value = 0.0
        filled[f"{column}_missing"] = filled[column].isna().astype(int)
        filled[f"{column}_filled"] = filled[column].fillna(default_value)

    bool_feature_columns = SERVICE_FLAG_COLUMNS + [
        "has_destination",
        "route_query_flag",
        "nearby_query_flag",
        "top_3_flag",
        "top_5_flag",
        "high_rating_flag",
        "open_and_high_rating_flag",
        "is_valid_geo",
    ]
    for column in bool_feature_columns:
        filled = ensure_column(filled, column, False)
        filled[column] = filled[column].fillna(False).apply(bool_from_mixed).astype(int)

    return filled


def build_group_sizes(dataset: pd.DataFrame) -> pd.DataFrame:
    group_sizes = (
        dataset.groupby("query_id", as_index=False)
        .size()
        .rename(columns={"size": "group_size"})
        .sort_values("query_id")
        .reset_index(drop=True)
    )
    return group_sizes


def build_feature_dictionary(dataset: pd.DataFrame) -> pd.DataFrame:
    source_table_map = {
        "query_id": "relevance_labels",
        "merchant_id": "relevance_labels",
        "search_event_id": "relevance_labels/search_events",
        "user_id": "relevance_labels",
        "session_id": "relevance_labels",
        "search_mode": "search_events",
        "query_source": "search_events",
        "require_open_now": "search_events",
        "min_rating": "search_events",
        "radius_km": "search_events",
        "max_corridor_km": "search_events",
        "has_destination": "engineered_from_search_events",
        "latitude": "merchant_geo_ready",
        "longitude": "merchant_geo_ready",
        "rating": "merchant_geo_ready",
        "review_count_source": "merchant_geo_ready",
        "is_open_now_proxy": "merchant_geo_ready",
        "rank_position": "impression_events",
        "final_rank_score": "impression_events",
        "distance_km": "impression_events",
        "route_distance_proxy": "impression_events",
        "detour_proxy": "impression_events",
        "was_impressed": "relevance_labels/impression_events",
        "was_clicked": "relevance_labels/click_events",
        "was_booked": "relevance_labels/booking_events",
        "relevance_label": "relevance_labels",
        "label_source": "relevance_labels",
        "reciprocal_rank": "engineered",
        "top_3_flag": "engineered",
        "top_5_flag": "engineered",
        "high_rating_flag": "engineered",
        "open_and_high_rating_flag": "engineered",
        "route_query_flag": "engineered",
        "nearby_query_flag": "engineered",
    }

    for column in SERVICE_FLAG_COLUMNS + [
        "rating_score",
        "review_volume_score",
        "trust_score",
        "open_score",
        "service_richness_score",
        "unclaimed_penalty",
        "base_rank_score",
    ]:
        source_table_map[column] = "merchant_ranking_features"

    model_feature_columns = get_model_feature_columns(dataset)

    descriptions = {
        "query_id": "Stable query grouping key for ranking tasks.",
        "merchant_id": "Stable merchant identifier for joins and evaluation.",
        "relevance_label": "Target label where booked=3, clicked=2, impression-only=1, not shown=0.",
        "search_mode": "Search mode context, nearby or on_route.",
        "query_source": "Query source descriptor from the synthetic or future production pipeline.",
        "rank_position": "Baseline ranked list position from Phase 4 impressions.",
        "final_rank_score": "Rule-based baseline ranking score from Phase 4.",
        "distance_km": "Nearby distance between user and merchant when available.",
        "route_distance_proxy": "Approximate merchant distance to route corridor when available.",
        "detour_proxy": "Approximate extra route cost proxy when a merchant is added to a route query.",
        "reciprocal_rank": "Inverse rank feature, 1 / rank_position when available.",
        "top_3_flag": "Indicator that the merchant was in the top 3 baseline positions.",
        "top_5_flag": "Indicator that the merchant was in the top 5 baseline positions.",
        "high_rating_flag": "Indicator that merchant rating is at least 4.5.",
        "open_and_high_rating_flag": "Indicator that merchant appears open now and has a high rating.",
        "route_query_flag": "Indicator that the query is an on-route search.",
        "nearby_query_flag": "Indicator that the query is a nearby search.",
    }

    records: list[dict[str, object]] = []
    for column in dataset.columns:
        records.append(
            {
                "column_name": column,
                "source_table": source_table_map.get(
                    column,
                    "engineered" if column.endswith("_filled") or column.endswith("_missing") else "joined_dataset",
                ),
                "data_type": str(dataset[column].dtype),
                "description": descriptions.get(
                    column,
                    f"Dataset column `{column}` carried into the model-ready ranking table.",
                ),
                "used_for_model": "yes" if column in model_feature_columns else "no",
            }
        )

    return pd.DataFrame(records, columns=["column_name", "source_table", "data_type", "description", "used_for_model"])


def get_model_feature_columns(dataset: pd.DataFrame) -> list[str]:
    excluded = {
        "query_id",
        "merchant_id",
        "search_event_id",
        "user_id",
        "session_id",
        "merchant_name",
        "district_norm",
        "search_mode",
        "label_source",
        "relevance_label",
        "was_impressed",
        "was_clicked",
        "was_booked",
        "impressed",
        "clicked",
        "booked",
    }
    model_features = []
    for column in dataset.columns:
        if column in excluded:
            continue
        if column.endswith("_filled") or column.endswith("_missing"):
            model_features.append(column)
        elif column in SERVICE_FLAG_COLUMNS + [
            "has_destination",
            "route_query_flag",
            "nearby_query_flag",
            "top_3_flag",
            "top_5_flag",
            "high_rating_flag",
            "open_and_high_rating_flag",
            "is_valid_geo",
        ]:
            model_features.append(column)
    return sorted(dict.fromkeys(model_features))


def write_report(dataset: pd.DataFrame, group_sizes: pd.DataFrame, feature_dictionary: pd.DataFrame) -> None:
    REPORT_DIR.mkdir(parents=True, exist_ok=True)

    label_distribution = dataset["relevance_label"].value_counts().sort_index()
    average_group_size = group_sizes["group_size"].mean() if not group_sizes.empty else 0.0
    min_group_size = group_sizes["group_size"].min() if not group_sizes.empty else 0
    max_group_size = group_sizes["group_size"].max() if not group_sizes.empty else 0

    final_model_features = feature_dictionary.loc[feature_dictionary["used_for_model"] == "yes", "column_name"].tolist()
    missing_summary = (
        dataset[[column for column in dataset.columns if column.endswith("_missing")]]
        .sum()
        .sort_values(ascending=False)
        .head(20)
    )

    lines = [
        "# Phase 6 Ranking Dataset Report",
        "",
        "## Dataset Summary",
        f"- Total rows: {len(dataset)}",
        f"- Total unique queries: {dataset['query_id'].nunique()}",
        f"- Total unique merchants: {dataset['merchant_id'].nunique()}",
        f"- Average group size: {average_group_size:.2f}",
        f"- Min group size: {int(min_group_size)}",
        f"- Max group size: {int(max_group_size)}",
        "",
        "## Label Distribution",
    ]

    for label, count in label_distribution.items():
        lines.append(f"- Label {int(label)}: {int(count)}")

    lines.extend(["", "## Final Model Features"])
    for feature in final_model_features:
        lines.append(f"- `{feature}`")

    lines.extend(["", "## Missing Value Summary"])
    for column, count in missing_summary.items():
        lines.append(f"- `{column}`: {int(count)}")

    lines.extend(
        [
            "",
            "## Leakage Prevention Notes",
            "- `query_id` and `merchant_id` are kept only as grouping and join identifiers, not model features.",
            "- Raw event identifiers such as `search_event_id` are retained for traceability but excluded from model features.",
            "- Post-label interaction indicators `was_impressed`, `was_clicked`, and `was_booked` remain in the dataset for audit and analysis but are marked `used_for_model = no` in the feature dictionary.",
            "- Baseline `rank_position` and `final_rank_score` are intentionally retained through their filled variants because this dataset is for baseline-enhancement ranking experiments.",
            "",
            "## Assumptions And Synthetic Data Limitations",
            "- Query and interaction behavior comes from synthetic seeded data, so feature-label relationships are useful for pipeline validation but not representative of production demand.",
            "- Missing numeric values are converted into `_filled` features plus `_missing` indicators so the exported table is safe for LightGBM or XGBoost ranking inputs.",
            "- Merchant features are joined from Phase 3 outputs and interaction context is joined from Phase 5 logs using the `query_id + merchant_id` grain.",
        ]
    )

    REPORT_OUTPUT_PATH.write_text("\n".join(lines) + "\n", encoding="utf-8")


def print_terminal_summary(dataset: pd.DataFrame, group_sizes: pd.DataFrame) -> None:
    print(f"rows: {len(dataset)}")
    print(f"unique queries: {dataset['query_id'].nunique()}")
    print(f"unique merchants: {dataset['merchant_id'].nunique()}")
    print(f"avg group size: {group_sizes['group_size'].mean():.2f}")
    print(f"min group size: {int(group_sizes['group_size'].min())}")
    print(f"max group size: {int(group_sizes['group_size'].max())}")
    print("label distribution:")
    for label, count in dataset["relevance_label"].value_counts().sort_index().items():
        print(f"- {int(label)}: {int(count)}")


def main() -> None:
    tables = load_input_tables()
    dataset = build_training_dataset(tables)
    group_sizes = build_group_sizes(dataset)
    feature_dictionary = build_feature_dictionary(dataset)

    dataset.to_csv(TRAINING_DATASET_OUTPUT_PATH, index=False, encoding="utf-8")
    group_sizes.to_csv(GROUP_SIZES_OUTPUT_PATH, index=False, encoding="utf-8")
    feature_dictionary.to_csv(FEATURE_DICTIONARY_OUTPUT_PATH, index=False, encoding="utf-8")

    write_report(dataset, group_sizes, feature_dictionary)
    print_terminal_summary(dataset, group_sizes)


if __name__ == "__main__":
    main()
