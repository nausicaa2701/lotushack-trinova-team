from __future__ import annotations

import re
from pathlib import Path

import pandas as pd


ROOT_DIR = Path(__file__).resolve().parents[2]
INPUT_DIR = ROOT_DIR / "Dataset" / "ProcessedData"
REPORT_DIR = ROOT_DIR / ".prompt" / "reports"

SEARCH_EVENTS_PATH = INPUT_DIR / "search_events.csv"
BOOKING_EVENTS_PATH = INPUT_DIR / "booking_events.csv"
MERCHANT_GEO_READY_PATH = INPUT_DIR / "merchant_geo_ready.csv"

DEMAND_TIMESERIES_OUTPUT_PATH = INPUT_DIR / "demand_timeseries_dataset.csv"
DEMAND_ZONE_SUMMARY_OUTPUT_PATH = INPUT_DIR / "demand_zone_summary.csv"
REPORT_OUTPUT_PATH = REPORT_DIR / "phase10_demand_dataset_report.md"


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


def normalize_zone_text(value: object) -> str:
    if pd.isna(value):
        return "unknown"
    text = str(value).strip().lower()
    text = re.sub(r"\s+", " ", text)
    return text if text else "unknown"


def parse_search_zone(query_context: object) -> str:
    if pd.isna(query_context):
        return "unknown"
    text = normalize_zone_text(query_context)
    if "nearby around " in text:
        return normalize_zone_text(text.split("nearby around ", 1)[1])
    if text.startswith("route ") and " -> " in text:
        return normalize_zone_text(text.split("route ", 1)[1].split(" -> ", 1)[0])
    return "unknown"


def add_time_features(df: pd.DataFrame, timestamp_column: str) -> pd.DataFrame:
    result = df.copy()
    result[timestamp_column] = pd.to_datetime(result[timestamp_column], errors="coerce", utc=True)
    result["event_timestamp"] = result[timestamp_column]
    result["event_date"] = result["event_timestamp"].dt.date.astype("string")
    result["event_hour"] = result["event_timestamp"].dt.hour
    result["weekday"] = result["event_timestamp"].dt.dayofweek
    result["is_weekend"] = result["weekday"].isin([5, 6]).astype(int)
    result["hour_of_day"] = result["event_hour"]
    result["month"] = result["event_timestamp"].dt.month
    result["hour_bucket"] = pd.cut(
        result["event_hour"],
        bins=[-1, 5, 11, 17, 23],
        labels=["overnight", "morning", "afternoon", "evening"],
    ).astype("object").fillna("unknown")
    result["is_peak_hour"] = result["event_hour"].isin([8, 9, 10, 17, 18, 19]).astype(int)
    result["event_hour_ts"] = result["event_timestamp"].dt.floor("h")
    return result


def build_zone_lookup(merchant_geo_ready: pd.DataFrame) -> pd.DataFrame:
    lookup = merchant_geo_ready.copy()
    lookup["zone"] = lookup["district_norm"].fillna(lookup.get("district", pd.NA)).apply(normalize_zone_text)
    return lookup[["merchant_id", "zone"]].drop_duplicates(subset=["merchant_id"]).copy()


def build_search_aggregates(search_events: pd.DataFrame) -> pd.DataFrame:
    search_df = add_time_features(search_events, "event_ts")
    search_df["zone"] = search_df["query_context"].apply(parse_search_zone)
    search_df["search_count"] = 1
    search_agg = (
        search_df.groupby(["zone", "event_hour_ts"], as_index=False)
        .agg(
            search_count=("search_count", "sum"),
            unique_queries=("query_id", "nunique"),
        )
    )
    return search_agg


def build_booking_aggregates(booking_events: pd.DataFrame, zone_lookup: pd.DataFrame) -> pd.DataFrame:
    booking_df = add_time_features(booking_events, "event_ts")
    booking_df = booking_df.merge(zone_lookup, how="left", on="merchant_id")
    booking_df["zone"] = booking_df["zone"].fillna("unknown").apply(normalize_zone_text)
    booking_df["booking_count"] = 1
    booking_agg = (
        booking_df.groupby(["zone", "event_hour_ts"], as_index=False)
        .agg(
            booking_count=("booking_count", "sum"),
            unique_merchants_booked=("merchant_id", "nunique"),
        )
    )
    return booking_agg


def build_complete_grid(search_agg: pd.DataFrame, booking_agg: pd.DataFrame) -> pd.DataFrame:
    zones = sorted(set(search_agg["zone"]).union(set(booking_agg["zone"])))
    min_hour = min(search_agg["event_hour_ts"].min(), booking_agg["event_hour_ts"].min())
    max_hour = max(search_agg["event_hour_ts"].max(), booking_agg["event_hour_ts"].max())
    all_hours = pd.date_range(min_hour, max_hour, freq="h", tz="UTC")

    grid = pd.MultiIndex.from_product([zones, all_hours], names=["zone", "event_hour_ts"]).to_frame(index=False)
    return grid


def add_lag_features(df: pd.DataFrame) -> pd.DataFrame:
    result = df.sort_values(["zone", "event_hour_ts"]).copy()
    grouped = result.groupby("zone", sort=False)

    result["lag_search_count_1"] = grouped["search_count"].shift(1)
    result["lag_search_count_24"] = grouped["search_count"].shift(24)
    result["lag_booking_count_1"] = grouped["booking_count"].shift(1)

    result["rolling_search_mean_3"] = grouped["search_count"].transform(
        lambda series: series.shift(1).rolling(window=3, min_periods=1).mean()
    )
    result["rolling_booking_mean_3"] = grouped["booking_count"].transform(
        lambda series: series.shift(1).rolling(window=3, min_periods=1).mean()
    )
    result["rolling_search_mean_24"] = grouped["search_count"].transform(
        lambda series: series.shift(1).rolling(window=24, min_periods=1).mean()
    )
    result["rolling_booking_mean_24"] = grouped["booking_count"].transform(
        lambda series: series.shift(1).rolling(window=24, min_periods=1).mean()
    )
    return result


def build_demand_dataset(
    search_events: pd.DataFrame,
    booking_events: pd.DataFrame,
    merchant_geo_ready: pd.DataFrame,
) -> tuple[pd.DataFrame, pd.DataFrame]:
    zone_lookup = build_zone_lookup(merchant_geo_ready)
    search_agg = build_search_aggregates(search_events)
    booking_agg = build_booking_aggregates(booking_events, zone_lookup)

    grid = build_complete_grid(search_agg, booking_agg)
    dataset = grid.merge(search_agg, how="left", on=["zone", "event_hour_ts"])
    dataset = dataset.merge(booking_agg, how="left", on=["zone", "event_hour_ts"])

    for column in ["search_count", "booking_count", "unique_queries", "unique_merchants_booked"]:
        dataset[column] = pd.to_numeric(dataset[column], errors="coerce").fillna(0).astype(int)

    dataset["event_date"] = dataset["event_hour_ts"].dt.date.astype("string")
    dataset["event_hour"] = dataset["event_hour_ts"].dt.hour
    dataset["weekday"] = dataset["event_hour_ts"].dt.dayofweek
    dataset["is_weekend"] = dataset["weekday"].isin([5, 6]).astype(int)
    dataset["hour_of_day"] = dataset["event_hour"]
    dataset["month"] = dataset["event_hour_ts"].dt.month
    dataset["hour_bucket"] = pd.cut(
        dataset["event_hour"],
        bins=[-1, 5, 11, 17, 23],
        labels=["overnight", "morning", "afternoon", "evening"],
    ).astype("object").fillna("unknown")
    dataset["is_peak_hour"] = dataset["event_hour"].isin([8, 9, 10, 17, 18, 19]).astype(int)

    dataset = add_lag_features(dataset)

    zone_summary = (
        dataset.groupby("zone", as_index=False)
        .agg(
            total_search_count=("search_count", "sum"),
            total_booking_count=("booking_count", "sum"),
            total_unique_queries=("unique_queries", "sum"),
            active_hour_rows=("event_hour_ts", "size"),
            avg_search_count=("search_count", "mean"),
            avg_booking_count=("booking_count", "mean"),
        )
        .sort_values(["total_search_count", "total_booking_count"], ascending=[False, False])
        .reset_index(drop=True)
    )

    return dataset, zone_summary


def write_report(dataset: pd.DataFrame, zone_summary: pd.DataFrame) -> None:
    REPORT_DIR.mkdir(parents=True, exist_ok=True)

    search_summary = dataset["search_count"].describe().round(4)
    booking_summary = dataset["booking_count"].describe().round(4)
    missing_summary = dataset.isna().sum().sort_values(ascending=False)

    lines = [
        "# Phase 10 Demand Dataset Report",
        "",
        "## Dataset Summary",
        f"- Total rows: {len(dataset)}",
        f"- Total unique zones: {dataset['zone'].nunique()}",
        f"- Total date/hour combinations: {dataset[['event_date', 'event_hour_ts']].drop_duplicates().shape[0]}",
        "",
        "## Search Count Summary",
    ]
    for metric, value in search_summary.items():
        lines.append(f"- `{metric}`: {value}")

    lines.extend(["", "## Booking Count Summary"])
    for metric, value in booking_summary.items():
        lines.append(f"- `{metric}`: {value}")

    lines.extend(["", "## Top Zones By Demand"])
    for _, row in zone_summary.head(10).iterrows():
        lines.append(
            f"- `{row['zone']}`: searches={int(row['total_search_count'])}, bookings={int(row['total_booking_count'])}"
        )

    lines.extend(["", "## Missing Value Summary"])
    for column, count in missing_summary.head(20).items():
        lines.append(f"- `{column}`: {int(count)}")

    lines.extend(
        [
            "",
            "## Assumptions And Limitations",
            "- Search zones are derived from `query_context` because the synthetic search events do not store a dedicated district column.",
            "- Route queries are assigned to their origin district as the zone proxy for this phase.",
            "- Booking zones are assigned from the booked merchant's `district_norm`, with fallback to `district` and then `unknown`.",
            "- The time-series grid is expanded to every observed hour between the minimum and maximum event timestamps for each observed zone.",
            "- Lag and rolling features are zone-specific and rely on the synthetic event horizon, which is very short and therefore sparse.",
            "- Because search and booking logs are synthetic and concentrated in a narrow time window, this dataset is suitable for forecasting experiments but not for production-quality demand modeling.",
        ]
    )

    REPORT_OUTPUT_PATH.write_text("\n".join(lines) + "\n", encoding="utf-8")


def print_terminal_summary(dataset: pd.DataFrame, zone_summary: pd.DataFrame) -> None:
    print(f"rows: {len(dataset)}")
    print(f"unique zones: {dataset['zone'].nunique()}")
    print(f"date/hour combinations: {dataset[['event_date', 'event_hour_ts']].drop_duplicates().shape[0]}")
    print(f"total searches: {int(dataset['search_count'].sum())}")
    print(f"total bookings: {int(dataset['booking_count'].sum())}")
    print("top zones:")
    for _, row in zone_summary.head(5).iterrows():
        print(f"- {row['zone']}: searches={int(row['total_search_count'])}, bookings={int(row['total_booking_count'])}")


def main() -> None:
    search_events = safe_read_csv(SEARCH_EVENTS_PATH)
    booking_events = safe_read_csv(BOOKING_EVENTS_PATH)
    merchant_geo_ready = safe_read_csv(MERCHANT_GEO_READY_PATH)

    dataset, zone_summary = build_demand_dataset(search_events, booking_events, merchant_geo_ready)

    dataset.to_csv(DEMAND_TIMESERIES_OUTPUT_PATH, index=False, encoding="utf-8")
    zone_summary.to_csv(DEMAND_ZONE_SUMMARY_OUTPUT_PATH, index=False, encoding="utf-8")
    write_report(dataset, zone_summary)
    print_terminal_summary(dataset, zone_summary)


if __name__ == "__main__":
    main()
