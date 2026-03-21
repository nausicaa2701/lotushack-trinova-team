from __future__ import annotations

import re
import unicodedata
from pathlib import Path

import pandas as pd


ROOT_DIR = Path(__file__).resolve().parents[2]
RAW_DIR = ROOT_DIR / "Dataset" / "RawData"
PROCESSED_DIR = ROOT_DIR / "Dataset" / "ProcessedData"
REPORTS_DIR = ROOT_DIR / "reports"

MERCHANT_INPUT_PATH = RAW_DIR / "LocationCarWash - TPHCM.csv"
REVIEW_INPUT_PATH = RAW_DIR / "LocationCarWashReview - TPHCM_Reviews.csv"

MERCHANT_OUTPUT_PATH = PROCESSED_DIR / "merchant_clean.csv"
REVIEW_AGG_OUTPUT_PATH = PROCESSED_DIR / "merchant_review_agg.csv"
MERCHANT_MASTER_OUTPUT_PATH = PROCESSED_DIR / "merchant_master.csv"
REPORT_OUTPUT_PATH = REPORTS_DIR / "phase2_cleaning_report.md"


MERCHANT_RENAME_MAP = {
    "title": "merchant_name",
    "type": "merchant_type",
    "type_id": "merchant_type_id",
    "type_ids": "merchant_type_ids",
    "types": "merchant_types",
    "reviews": "review_count_source",
    "place_id": "merchant_id",
}

REVIEW_RENAME_MAP = {
    "place_id": "merchant_id",
    "place_name": "merchant_name",
    "rating": "review_rating",
}

MERCHANT_DROP_COLUMNS = [
    "record_key",
    "page_start",
    "page_position",
    "position",
    "place_link",
    "reviews_link",
    "photos_link",
    "thumbnail",
    "serpapi_thumbnail",
    "query",
    "local_results_state",
    "search_id",
    "google_maps_url",
    "json_endpoint",
    "hl",
    "gl",
    "operating_hours_json",
    "service_options_json",
    "raw_place_json",
    "crawl_date",
]

REVIEW_DROP_COLUMNS = [
    "record_key",
    "address",
    "crawl_date",
    "crawl_timestamp",
]


def normalize_whitespace(value: object) -> object:
    if pd.isna(value):
        return pd.NA
    cleaned = re.sub(r"\s+", " ", str(value)).strip()
    if not cleaned:
        return pd.NA
    return cleaned


def normalize_text_key(value: object) -> object:
    cleaned = normalize_whitespace(value)
    if pd.isna(cleaned):
        return pd.NA
    ascii_text = unicodedata.normalize("NFKD", str(cleaned))
    ascii_text = ascii_text.encode("ascii", "ignore").decode("ascii")
    ascii_text = ascii_text.lower()
    ascii_text = re.sub(r"[^a-z0-9]+", " ", ascii_text)
    ascii_text = re.sub(r"\s+", " ", ascii_text).strip()
    if not ascii_text:
        return pd.NA
    return ascii_text


def parse_vietnamese_decimal(value: object) -> float | None:
    if pd.isna(value):
        return None
    cleaned = str(value).strip()
    if not cleaned:
        return None
    cleaned = cleaned.replace("\u00a0", "").replace(" ", "")
    cleaned = cleaned.replace(",", ".")
    try:
        return float(cleaned)
    except ValueError:
        return None


def clean_text_columns(df: pd.DataFrame, columns: list[str]) -> pd.DataFrame:
    for column in columns:
        if column in df.columns:
            df[column] = df[column].apply(normalize_whitespace)
    return df


def load_data() -> tuple[pd.DataFrame, pd.DataFrame]:
    merchant_df = pd.read_csv(MERCHANT_INPUT_PATH)
    review_df = pd.read_csv(REVIEW_INPUT_PATH)
    return merchant_df, review_df


def prepare_merchants(merchant_df: pd.DataFrame) -> tuple[pd.DataFrame, dict[str, int]]:
    merchant_df = merchant_df.rename(columns=MERCHANT_RENAME_MAP).copy()
    merchant_df = merchant_df.drop(columns=[c for c in MERCHANT_DROP_COLUMNS if c in merchant_df.columns])

    text_columns = [
        "district",
        "merchant_name",
        "merchant_type",
        "merchant_type_id",
        "merchant_type_ids",
        "merchant_types",
        "address",
        "phone",
        "website",
        "price",
        "open_state",
        "hours",
        "friday_hours",
        "merchant_id",
        "provider_id",
        "data_id",
        "data_cid",
        "unclaimed_listing",
        "service_options_on_site",
    ]
    merchant_df = clean_text_columns(merchant_df, text_columns)

    merchant_df["normalized_merchant_name"] = merchant_df["merchant_name"].apply(normalize_text_key)
    merchant_df["normalized_address"] = merchant_df["address"].apply(normalize_text_key)

    for column in ["latitude", "longitude", "rating"]:
        merchant_df[column] = merchant_df[column].apply(parse_vietnamese_decimal)

    invalid_lat_mask = merchant_df["latitude"].notna() & ~merchant_df["latitude"].between(-90, 90)
    invalid_lon_mask = merchant_df["longitude"].notna() & ~merchant_df["longitude"].between(-180, 180)
    partial_geo_mask = merchant_df["latitude"].isna() ^ merchant_df["longitude"].isna()
    invalid_geo_mask = invalid_lat_mask | invalid_lon_mask | partial_geo_mask
    merchant_df.loc[invalid_lat_mask, "latitude"] = pd.NA
    merchant_df.loc[invalid_lon_mask, "longitude"] = pd.NA
    merchant_df.loc[partial_geo_mask, ["latitude", "longitude"]] = pd.NA

    invalid_rating_mask = merchant_df["rating"].notna() & ~merchant_df["rating"].between(0, 5)
    merchant_df.loc[invalid_rating_mask, "rating"] = pd.NA

    missing_name_mask = merchant_df["merchant_name"].isna()
    has_address = merchant_df["address"].notna()
    has_coordinates = merchant_df["latitude"].notna() & merchant_df["longitude"].notna()
    missing_location_mask = ~has_address & ~has_coordinates

    merchant_df["is_duplicate_merchant_id"] = merchant_df.duplicated(subset=["merchant_id"], keep=False)

    duplicate_name_address_mask = (
        merchant_df["normalized_merchant_name"].notna()
        & merchant_df["normalized_address"].notna()
        & merchant_df.duplicated(
            subset=["normalized_merchant_name", "normalized_address"],
            keep=False,
        )
    )
    merchant_df["is_duplicate_name_address"] = duplicate_name_address_mask
    merchant_df["is_duplicate_any"] = (
        merchant_df["is_duplicate_merchant_id"] | merchant_df["is_duplicate_name_address"]
    )

    removed_row_mask = missing_name_mask | missing_location_mask
    merchant_clean = merchant_df.loc[~removed_row_mask].copy()

    metrics = {
        "merchant_input_row_count": int(len(merchant_df)),
        "merchant_cleaned_row_count": int(len(merchant_clean)),
        "rows_removed_missing_name": int(missing_name_mask.sum()),
        "rows_removed_missing_location": int(missing_location_mask.sum()),
        "invalid_geo_count": int(invalid_geo_mask.sum()),
        "invalid_rating_count": int(invalid_rating_mask.sum()),
        "duplicate_count": int(merchant_clean["is_duplicate_any"].sum()),
        "duplicate_merchant_id_count": int(merchant_clean["is_duplicate_merchant_id"].sum()),
        "duplicate_name_address_count": int(merchant_clean["is_duplicate_name_address"].sum()),
    }
    return merchant_clean, metrics


def prepare_reviews(review_df: pd.DataFrame) -> tuple[pd.DataFrame, pd.DataFrame]:
    review_df = review_df.rename(columns=REVIEW_RENAME_MAP).copy()
    review_df = review_df.drop(columns=[c for c in REVIEW_DROP_COLUMNS if c in review_df.columns])

    text_columns = [
        "review_id",
        "merchant_id",
        "merchant_name",
        "reviewer_name",
        "reviewer_title",
        "review_text",
        "review_datetime",
        "verified_purchase",
        "response_from_owner",
        "response_datetime",
    ]
    review_df = clean_text_columns(review_df, text_columns)
    review_df["review_rating"] = review_df["review_rating"].apply(parse_vietnamese_decimal)

    review_df["has_review_text"] = review_df["review_text"].notna()

    review_agg = (
        review_df.groupby("merchant_id", dropna=False)
        .agg(
            review_row_count=("review_id", "size"),
            review_rating_avg_from_reviews=("review_rating", "mean"),
            review_text_count=("has_review_text", "sum"),
        )
        .reset_index()
    )
    review_agg["review_text_count"] = review_agg["review_text_count"].astype("int64")
    review_agg["has_review_text"] = review_agg["review_text_count"] > 0
    review_agg["review_rating_avg_from_reviews"] = review_agg["review_rating_avg_from_reviews"].round(4)

    return review_df, review_agg


def build_missing_value_summary(merchant_clean: pd.DataFrame) -> pd.Series:
    summary_columns = [
        "merchant_name",
        "address",
        "latitude",
        "longitude",
        "rating",
        "phone",
        "website",
        "hours",
    ]
    available_columns = [column for column in summary_columns if column in merchant_clean.columns]
    return merchant_clean[available_columns].isna().sum().sort_values(ascending=False)


def write_report(
    merchant_clean: pd.DataFrame,
    review_agg: pd.DataFrame,
    merchant_master: pd.DataFrame,
    metrics: dict[str, int],
    missing_value_summary: pd.Series,
) -> None:
    report_lines = [
        "# Phase 2 Cleaning Report",
        "",
        "## Inputs",
        f"- Merchant input file: `{MERCHANT_INPUT_PATH.relative_to(ROOT_DIR)}`",
        f"- Review input file: `{REVIEW_INPUT_PATH.relative_to(ROOT_DIR)}`",
        f"- Merchant input row count: {metrics['merchant_input_row_count']}",
        "",
        "## Merchant Cleaning Summary",
        f"- Cleaned row count: {metrics['merchant_cleaned_row_count']}",
        f"- Rows removed for missing merchant name: {metrics['rows_removed_missing_name']}",
        f"- Rows removed for missing address and coordinates: {metrics['rows_removed_missing_location']}",
        f"- Invalid geo count: {metrics['invalid_geo_count']}",
        f"- Invalid rating count: {metrics['invalid_rating_count']}",
        f"- Duplicate count: {metrics['duplicate_count']}",
        f"- Duplicate rows by merchant_id: {metrics['duplicate_merchant_id_count']}",
        f"- Duplicate rows by normalized merchant_name + normalized address: {metrics['duplicate_name_address_count']}",
        "",
        "## Review Aggregation Summary",
        f"- Review aggregate row count: {len(review_agg)}",
        f"- Merchant master row count: {len(merchant_master)}",
        "",
        "## Missing Value Summary",
    ]

    for column, count in missing_value_summary.items():
        report_lines.append(f"- `{column}`: {int(count)}")

    report_lines.extend(
        [
            "",
            "## Output Files",
            f"- `{MERCHANT_OUTPUT_PATH.relative_to(ROOT_DIR)}`",
            f"- `{REVIEW_AGG_OUTPUT_PATH.relative_to(ROOT_DIR)}`",
            f"- `{MERCHANT_MASTER_OUTPUT_PATH.relative_to(ROOT_DIR)}`",
        ]
    )

    REPORT_OUTPUT_PATH.write_text("\n".join(report_lines) + "\n", encoding="utf-8")


def main() -> None:
    PROCESSED_DIR.mkdir(parents=True, exist_ok=True)
    REPORTS_DIR.mkdir(parents=True, exist_ok=True)

    merchant_df, review_df = load_data()
    merchant_clean, metrics = prepare_merchants(merchant_df)
    _, review_agg = prepare_reviews(review_df)

    merchant_master = merchant_clean.merge(review_agg, how="left", on="merchant_id")
    merchant_master["review_row_count"] = merchant_master["review_row_count"].fillna(0).astype("int64")
    merchant_master["review_text_count"] = merchant_master["review_text_count"].fillna(0).astype("int64")
    merchant_master["has_review_text"] = merchant_master["has_review_text"].where(
        merchant_master["has_review_text"].notna(),
        False,
    ).astype(bool)
    merchant_master["review_rating_avg_from_reviews"] = merchant_master[
        "review_rating_avg_from_reviews"
    ].round(4)

    merchant_clean.to_csv(MERCHANT_OUTPUT_PATH, index=False)
    review_agg.to_csv(REVIEW_AGG_OUTPUT_PATH, index=False)
    merchant_master.to_csv(MERCHANT_MASTER_OUTPUT_PATH, index=False)

    missing_value_summary = build_missing_value_summary(merchant_clean)
    write_report(merchant_clean, review_agg, merchant_master, metrics, missing_value_summary)

    print(f"input row count: {metrics['merchant_input_row_count']}")
    print(f"cleaned row count: {metrics['merchant_cleaned_row_count']}")
    print(f"duplicate count: {metrics['duplicate_count']}")
    print(f"invalid geo count: {metrics['invalid_geo_count']}")
    print("missing value summary:")
    for column, count in missing_value_summary.items():
        print(f"- {column}: {int(count)}")


if __name__ == "__main__":
    main()
