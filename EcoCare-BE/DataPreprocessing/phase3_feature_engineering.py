from __future__ import annotations

import math
import re
import unicodedata
from pathlib import Path

import pandas as pd


ROOT_DIR = Path(__file__).resolve().parents[2]
INPUT_PATH = ROOT_DIR / "Dataset" / "ProcessedData" / "merchant_master.csv"
GEO_OUTPUT_PATH = ROOT_DIR / "Dataset" / "ProcessedData" / "merchant_geo_ready.csv"
RANKING_OUTPUT_PATH = ROOT_DIR / "Dataset" / "ProcessedData" / "merchant_ranking_features.csv"
REPORT_PATH = ROOT_DIR / ".prompt" / "reports" / "phase3_feature_report.md"


LOCATION_TEXT_COLUMNS = ["district", "address", "merchant_name"]
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
RANKING_FEATURE_COLUMNS = [
    "rating_score",
    "review_volume_score",
    "trust_score",
    "open_score",
    "service_richness_score",
    "unclaimed_penalty",
    "base_rank_score",
]

SERVICE_KEYWORDS = {
    "service_exterior_wash": [
        "rua xe",
        "car wash",
        "tram rua xe",
        "bai rua xe",
        "rua xe oto",
        "rua xe hoi",
        "rua xe bot tuyet",
        "self service wash",
    ],
    "service_interior_cleaning": [
        "noi that",
        "ve sinh noi that",
        "hut bui",
        "giuong nam",
        "khu mui",
        "lam sach ghe",
        "interior",
        "cleaning cabin",
    ],
    "service_detailing": [
        "detailing",
        "detail",
        "cham soc xe",
        "car care",
        "auto care",
        "premium care",
    ],
    "service_ceramic": [
        "ceramic",
        "phu ceramic",
        "coating",
        "nano",
        "graphene",
    ],
    "service_ev_safe": [
        "ev",
        "xe dien",
        "o to dien",
        "vinfast",
        "electric vehicle",
    ],
    "service_fast_lane": [
        "24h",
        "nhanh",
        "express",
        "fast",
        "tu dong",
        "self service",
        "tu phuc vu",
    ],
    "service_car_supported": [
        "oto",
        "o to",
        "xe hoi",
        "car",
        "auto",
    ],
    "service_motorbike_supported": [
        "xe may",
        "motorbike",
        "motor",
        "bike wash",
        "xe 2 banh",
    ],
}


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


def normalize_whitespace(value: object) -> object:
    if pd.isna(value):
        return pd.NA
    text = re.sub(r"\s+", " ", str(value)).strip()
    return text if text else pd.NA


def normalize_text_key(value: object) -> object:
    text = normalize_whitespace(value)
    if pd.isna(text):
        return pd.NA
    text = str(text).replace("Đ", "D").replace("đ", "d")
    ascii_text = unicodedata.normalize("NFKD", text)
    ascii_text = ascii_text.encode("ascii", "ignore").decode("ascii")
    ascii_text = ascii_text.lower()
    ascii_text = re.sub(r"[^a-z0-9]+", " ", ascii_text)
    ascii_text = re.sub(r"\s+", " ", ascii_text).strip()
    return ascii_text if ascii_text else pd.NA


def clean_text_columns(df: pd.DataFrame, columns: list[str]) -> pd.DataFrame:
    for column in columns:
        df = ensure_column(df, column)
        df[column] = df[column].apply(normalize_whitespace)
    return df


def to_numeric_series(series: pd.Series) -> pd.Series:
    return pd.to_numeric(series, errors="coerce")


def parse_open_state(value: object) -> tuple[object, float, object]:
    cleaned = normalize_whitespace(value)
    if pd.isna(cleaned):
        return pd.NA, 0.5, pd.NA

    normalized_value = normalize_text_key(cleaned)
    text_norm = "" if pd.isna(normalized_value) else str(normalized_value)
    open_tokens = ["dang mo cua", "mo ca ngay", "open now"]
    closed_tokens = ["tam dong cua", "temporarily closed", "permanently closed", "dong cua", "closed"]
    scheduled_tokens = ["sap mo cua", "opening soon"]

    if any(token in text_norm for token in scheduled_tokens):
        return pd.NA, 0.5, cleaned
    if any(token in text_norm for token in open_tokens):
        return 1, 1.0, cleaned
    if any(token in text_norm for token in closed_tokens):
        return 0, 0.0, cleaned
    return pd.NA, 0.5, cleaned


def build_geo_point_wkt(longitude: object, latitude: object) -> object:
    if pd.isna(longitude) or pd.isna(latitude):
        return pd.NA
    return f"POINT({float(longitude):.6f} {float(latitude):.6f})"


def combine_search_text(parts: list[object]) -> object:
    cleaned_parts = [str(normalize_whitespace(part)) for part in parts if not pd.isna(normalize_whitespace(part))]
    if not cleaned_parts:
        return pd.NA
    combined = " | ".join(cleaned_parts)
    return combined


def service_flag_from_text(row: pd.Series, keywords: list[str]) -> bool:
    text_parts = [
        row.get("merchant_name_norm"),
        row.get("merchant_type_norm"),
        row.get("merchant_types_norm"),
    ]
    haystack = " ".join(str(part) for part in text_parts if not pd.isna(part))
    if not haystack:
        return False
    return any(keyword in haystack for keyword in keywords)


def build_service_taxonomy(df: pd.DataFrame) -> pd.DataFrame:
    df = ensure_column(df, "merchant_name")
    df = ensure_column(df, "merchant_type")
    df = ensure_column(df, "merchant_types")

    df["merchant_name_norm"] = df["merchant_name"].apply(normalize_text_key)
    df["merchant_type_norm"] = df["merchant_type"].apply(normalize_text_key)
    df["merchant_types_norm"] = df["merchant_types"].apply(normalize_text_key)

    for flag, keywords in SERVICE_KEYWORDS.items():
        df[flag] = df.apply(lambda row: service_flag_from_text(row, keywords), axis=1)

    return df


def normalized_log_score(series: pd.Series) -> pd.Series:
    safe_series = to_numeric_series(series).fillna(0).clip(lower=0)
    transformed = safe_series.apply(lambda value: math.log1p(float(value)))
    max_value = transformed.max()
    if pd.isna(max_value) or max_value <= 0:
        return pd.Series(0.0, index=series.index)
    return transformed / max_value


def bool_from_mixed(value: object) -> bool:
    if isinstance(value, bool):
        return value
    if pd.isna(value):
        return False
    text = str(value).strip().lower()
    return text in {"true", "1", "yes", "y"}


def clamp_series(series: pd.Series, lower: float = 0.0, upper: float = 1.0) -> pd.Series:
    return to_numeric_series(series).clip(lower=lower, upper=upper)


def build_geo_features(df: pd.DataFrame) -> pd.DataFrame:
    geo_df = df.copy()
    geo_df = clean_text_columns(geo_df, LOCATION_TEXT_COLUMNS + ["open_state", "hours"])

    for column in LOCATION_TEXT_COLUMNS:
        geo_df[f"{column}_norm"] = geo_df[column].apply(normalize_text_key)

    geo_df = ensure_column(geo_df, "latitude")
    geo_df = ensure_column(geo_df, "longitude")
    geo_df["latitude"] = to_numeric_series(geo_df["latitude"])
    geo_df["longitude"] = to_numeric_series(geo_df["longitude"])

    geo_df["is_valid_geo"] = (
        geo_df["latitude"].between(-90, 90, inclusive="both")
        & geo_df["longitude"].between(-180, 180, inclusive="both")
    )
    geo_df["geo_point_wkt"] = geo_df.apply(
        lambda row: build_geo_point_wkt(row["longitude"], row["latitude"]) if row["is_valid_geo"] else pd.NA,
        axis=1,
    )
    geo_df["searchable_location_text"] = geo_df.apply(
        lambda row: combine_search_text([row.get("merchant_name"), row.get("address"), row.get("district")]),
        axis=1,
    )
    geo_df["district_norm"] = geo_df["district"].apply(normalize_text_key)

    open_parse = geo_df["open_state"].apply(parse_open_state)
    geo_df["is_open_now_proxy"] = pd.Series([item[0] for item in open_parse], index=geo_df.index, dtype="Int64")
    geo_df["open_score"] = pd.Series([item[1] for item in open_parse], index=geo_df.index, dtype="float64")
    parsed_open_state_clean = pd.Series([item[2] for item in open_parse], index=geo_df.index)
    geo_df["hours_text_clean"] = geo_df["hours"].where(geo_df["hours"].notna(), parsed_open_state_clean)
    geo_df["is_open_info_available"] = geo_df["open_state"].notna() | geo_df["hours"].notna()

    return geo_df


def build_ranking_features(df: pd.DataFrame) -> pd.DataFrame:
    ranking_df = build_service_taxonomy(df.copy())

    ranking_df = ensure_column(ranking_df, "rating")
    ranking_df = ensure_column(ranking_df, "review_row_count", 0)
    ranking_df = ensure_column(ranking_df, "review_count_source", 0)
    ranking_df = ensure_column(ranking_df, "has_review_text", False)
    ranking_df = ensure_column(ranking_df, "unclaimed_listing", False)

    rating_raw = to_numeric_series(ranking_df["rating"])
    rating_fill = rating_raw.fillna(0)
    ranking_df["rating_score"] = (rating_fill.clip(lower=0, upper=5) / 5.0).round(6)

    review_count_combined = pd.concat(
        [
            to_numeric_series(ranking_df["review_row_count"]).fillna(0),
            to_numeric_series(ranking_df["review_count_source"]).fillna(0),
        ],
        axis=1,
    ).max(axis=1)
    ranking_df["review_volume_score"] = normalized_log_score(review_count_combined).round(6)

    review_text_bonus = ranking_df["has_review_text"].apply(bool_from_mixed).astype(float)
    ranking_df["trust_score"] = (
        ranking_df["rating_score"] * 0.5
        + ranking_df["review_volume_score"] * 0.35
        + review_text_bonus * 0.15
    ).round(6)

    service_flag_sum = ranking_df[SERVICE_FLAG_COLUMNS].sum(axis=1)
    ranking_df["service_richness_score"] = (service_flag_sum / len(SERVICE_FLAG_COLUMNS)).round(6)

    ranking_df["unclaimed_penalty"] = ranking_df["unclaimed_listing"].apply(
        lambda value: -0.05 if bool_from_mixed(value) else 0.0
    )

    ranking_df["base_rank_score"] = clamp_series(
        ranking_df["trust_score"] * 0.45
        + ranking_df["open_score"] * 0.20
        + ranking_df["service_richness_score"] * 0.20
        + ranking_df["rating_score"] * 0.10
        + ranking_df["review_volume_score"] * 0.05
        + ranking_df["unclaimed_penalty"]
    ).round(6)

    return ranking_df


def summary_stats(df: pd.DataFrame, columns: list[str]) -> pd.DataFrame:
    available = [column for column in columns if column in df.columns]
    if not available:
        return pd.DataFrame()
    return df[available].describe().round(6)


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


def write_report(geo_df: pd.DataFrame, ranking_df: pd.DataFrame, assumptions: list[str]) -> None:
    REPORT_PATH.parent.mkdir(parents=True, exist_ok=True)

    district_counts = (
        geo_df["district_norm"]
        .fillna("unknown")
        .value_counts()
        .sort_index()
    )
    service_counts = {column: int(ranking_df[column].sum()) for column in SERVICE_FLAG_COLUMNS if column in ranking_df.columns}
    ranking_summary = summary_stats(ranking_df, RANKING_FEATURE_COLUMNS)

    lines = [
        "# Phase 3 Feature Report",
        "",
        "## Row Counts",
        f"- Input row count: {len(geo_df)}",
        f"- Output row count: {len(ranking_df)}",
        f"- Geo-valid merchant count: {int(geo_df['is_valid_geo'].sum())}",
        "",
        "## Merchant Count By District",
    ]

    for district, count in district_counts.items():
        lines.append(f"- `{district}`: {int(count)}")

    lines.extend(["", "## Service Flag Counts"])
    for flag, count in service_counts.items():
        lines.append(f"- `{flag}`: {count}")

    lines.extend(["", "## Ranking Feature Summary Stats"])
    if ranking_summary.empty:
        lines.append("- No ranking feature columns available.")
    else:
        lines.extend([""] + dataframe_to_markdown_table(ranking_summary))

    lines.extend(["", "## Assumptions And Fallback Rules"])
    for item in assumptions:
        lines.append(f"- {item}")

    REPORT_PATH.write_text("\n".join(lines) + "\n", encoding="utf-8")


def print_terminal_summary(geo_df: pd.DataFrame, ranking_df: pd.DataFrame) -> None:
    print(f"input rows: {len(geo_df)}")
    print(f"output rows: {len(ranking_df)}")
    print(f"geo valid merchants: {int(geo_df['is_valid_geo'].sum())}")
    top_districts = geo_df["district_norm"].fillna("unknown").value_counts().head(5)
    print("top districts:")
    for district, count in top_districts.items():
        print(f"- {district}: {int(count)}")
    print("ranking score means:")
    for column in ["rating_score", "trust_score", "open_score", "base_rank_score"]:
        if column in ranking_df.columns:
            print(f"- {column}: {ranking_df[column].mean():.4f}")


def main() -> None:
    df = safe_read_csv(INPUT_PATH)

    geo_df = build_geo_features(df)
    ranking_df = build_ranking_features(geo_df)

    GEO_OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    geo_df.to_csv(GEO_OUTPUT_PATH, index=False, encoding="utf-8")
    ranking_df.to_csv(RANKING_OUTPUT_PATH, index=False, encoding="utf-8")

    assumptions = [
        "CSV loading tries utf-8, utf-8-sig, cp1258, then latin1 to reduce encoding failures.",
        "Location text normalization trims whitespace and builds ASCII-friendly normalized keys for search and grouping.",
        "Open-state proxy maps phrases like 'Dang mo cua' and 'Mo ca ngay' to open=1, phrases containing closed states to open=0, and unknown or scheduled states to a neutral score of 0.5.",
        "Service taxonomy flags are keyword-based heuristics across normalized merchant_name, merchant_type, and merchant_types.",
        "Review volume uses the larger of review_row_count and review_count_source before applying log normalization.",
        "Base ranking score uses a weighted blend of trust, open status, service richness, rating, review volume, and a small penalty for unclaimed listings.",
        "Missing optional columns are created with safe defaults so the script completes without critical crashes.",
    ]
    write_report(geo_df, ranking_df, assumptions)
    print_terminal_summary(geo_df, ranking_df)


if __name__ == "__main__":
    main()
