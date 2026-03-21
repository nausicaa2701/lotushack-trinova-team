from __future__ import annotations

import math
from pathlib import Path

import pandas as pd


ROOT_DIR = Path(__file__).resolve().parents[2]
INPUT_DIR = ROOT_DIR / "Dataset" / "ProcessedData"
REPORT_DIR = ROOT_DIR / ".prompt" / "reports"

MERCHANT_GEO_READY_PATH = INPUT_DIR / "merchant_geo_ready.csv"
MERCHANT_RANKING_FEATURES_PATH = INPUT_DIR / "merchant_ranking_features.csv"

QUERIES_NEARBY_OUTPUT_PATH = INPUT_DIR / "queries_nearby_sample.csv"
QUERIES_ON_ROUTE_OUTPUT_PATH = INPUT_DIR / "queries_on_route_sample.csv"
RETRIEVAL_RESULTS_NEARBY_OUTPUT_PATH = INPUT_DIR / "retrieval_results_nearby.csv"
RETRIEVAL_RESULTS_ON_ROUTE_OUTPUT_PATH = INPUT_DIR / "retrieval_results_on_route.csv"
RANKING_RESULTS_NEARBY_OUTPUT_PATH = INPUT_DIR / "ranking_results_nearby.csv"
RANKING_RESULTS_ON_ROUTE_OUTPUT_PATH = INPUT_DIR / "ranking_results_on_route.csv"
REPORT_OUTPUT_PATH = REPORT_DIR / "phase4_retrieval_ranking_report.md"

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
    "base_rank_score",
    "rating_score",
    "review_volume_score",
    "trust_score",
    "open_score",
    "service_richness_score",
    "unclaimed_penalty",
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


def ensure_column(df: pd.DataFrame, column: str, default: object) -> pd.DataFrame:
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


def load_merchant_working_frame() -> pd.DataFrame:
    geo_df = safe_read_csv(MERCHANT_GEO_READY_PATH)
    ranking_df = safe_read_csv(MERCHANT_RANKING_FEATURES_PATH)

    geo_df = ensure_column(geo_df, "merchant_id", pd.NA)
    ranking_df = ensure_column(ranking_df, "merchant_id", pd.NA)

    ranking_extra_columns = [
        column
        for column in ranking_df.columns
        if column == "merchant_id" or column not in geo_df.columns
    ]
    working_df = geo_df.merge(
        ranking_df[ranking_extra_columns],
        how="left",
        on="merchant_id",
    )

    for column in ["latitude", "longitude", "rating", "base_rank_score"] + RANKING_FEATURE_COLUMNS:
        if column in working_df.columns:
            working_df[column] = pd.to_numeric(working_df[column], errors="coerce")

    for column in ["is_valid_geo", "is_open_now_proxy"] + SERVICE_FLAG_COLUMNS:
        working_df = ensure_column(working_df, column, pd.NA if column == "is_open_now_proxy" else False)

    working_df["is_valid_geo"] = working_df["is_valid_geo"].apply(bool_from_mixed)
    for column in SERVICE_FLAG_COLUMNS:
        working_df[column] = working_df[column].apply(bool_from_mixed)

    working_df["merchant_name"] = working_df.get("merchant_name", pd.Series(index=working_df.index, dtype="object"))
    working_df["district_norm"] = working_df.get("district_norm", pd.Series(index=working_df.index, dtype="object"))
    working_df["open_score"] = pd.to_numeric(working_df.get("open_score", 0.5), errors="coerce").fillna(0.5)
    working_df["rating_score"] = pd.to_numeric(working_df.get("rating_score", 0), errors="coerce").fillna(0.0)
    working_df["review_volume_score"] = pd.to_numeric(
        working_df.get("review_volume_score", 0),
        errors="coerce",
    ).fillna(0.0)
    working_df["trust_score"] = pd.to_numeric(working_df.get("trust_score", 0), errors="coerce").fillna(0.0)
    working_df["service_richness_score"] = pd.to_numeric(
        working_df.get("service_richness_score", 0),
        errors="coerce",
    ).fillna(0.0)
    working_df["unclaimed_penalty"] = pd.to_numeric(
        working_df.get("unclaimed_penalty", 0),
        errors="coerce",
    ).fillna(0.0)
    working_df["base_rank_score"] = pd.to_numeric(
        working_df.get("base_rank_score", 0),
        errors="coerce",
    ).fillna(0.0)
    return working_df


def haversine_distance_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    radius_km = 6371.0088
    lat1_rad, lon1_rad = math.radians(lat1), math.radians(lon1)
    lat2_rad, lon2_rad = math.radians(lat2), math.radians(lon2)
    dlat = lat2_rad - lat1_rad
    dlon = lon2_rad - lon1_rad
    a = math.sin(dlat / 2) ** 2 + math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(dlon / 2) ** 2
    return 2 * radius_km * math.asin(math.sqrt(a))


def latlon_to_km_xy(latitude: float, longitude: float, reference_latitude: float) -> tuple[float, float]:
    x = longitude * 111.320 * math.cos(math.radians(reference_latitude))
    y = latitude * 110.574
    return x, y


def point_to_segment_distance_km(
    point_lat: float,
    point_lon: float,
    start_lat: float,
    start_lon: float,
    end_lat: float,
    end_lon: float,
) -> tuple[float, float]:
    reference_lat = (point_lat + start_lat + end_lat) / 3.0
    px, py = latlon_to_km_xy(point_lat, point_lon, reference_lat)
    ax, ay = latlon_to_km_xy(start_lat, start_lon, reference_lat)
    bx, by = latlon_to_km_xy(end_lat, end_lon, reference_lat)

    abx = bx - ax
    aby = by - ay
    ab_len_sq = abx * abx + aby * aby
    if ab_len_sq == 0:
        distance = math.dist((px, py), (ax, ay))
        return distance, distance

    apx = px - ax
    apy = py - ay
    t = max(0.0, min(1.0, (apx * abx + apy * aby) / ab_len_sq))
    nearest_x = ax + t * abx
    nearest_y = ay + t * aby
    corridor_distance = math.dist((px, py), (nearest_x, nearest_y))
    route_length = math.sqrt(ab_len_sq)
    progress_km = t * route_length
    return corridor_distance, progress_km


def normalize_inverse_distance(series: pd.Series, max_distance: pd.Series | float) -> pd.Series:
    safe_series = pd.to_numeric(series, errors="coerce").fillna(float("inf"))
    if isinstance(max_distance, pd.Series):
        safe_max = pd.to_numeric(max_distance, errors="coerce").replace(0, pd.NA)
    else:
        safe_max = max_distance if max_distance else pd.NA
    score = 1 - (safe_series / safe_max)
    return score.clip(lower=0, upper=1).fillna(0.0)


def normalize_inverse_by_max(series: pd.Series) -> pd.Series:
    safe_series = pd.to_numeric(series, errors="coerce")
    if safe_series.notna().sum() == 0:
        return pd.Series(0.0, index=series.index)
    max_value = safe_series.max()
    min_value = safe_series.min()
    if pd.isna(max_value) or pd.isna(min_value) or max_value == min_value:
        return pd.Series(1.0, index=series.index)
    normalized = 1 - ((safe_series - min_value) / (max_value - min_value))
    return normalized.clip(lower=0, upper=1).fillna(0.0)


def generate_reason_tags(row: pd.Series, mode: str) -> str:
    tags: list[str] = []
    if mode == "nearby":
        distance_km = row.get("distance_km")
        if pd.notna(distance_km):
            if float(distance_km) <= 1.5:
                tags.append("very_close")
            elif float(distance_km) <= 4:
                tags.append("close")
    else:
        route_distance = row.get("route_distance_proxy")
        detour_proxy = row.get("detour_proxy")
        if pd.notna(route_distance) and float(route_distance) <= 1.0:
            tags.append("on_corridor")
        if pd.notna(detour_proxy) and float(detour_proxy) <= 1.5:
            tags.append("low_detour")

    if float(row.get("rating_score", 0)) >= 0.85:
        tags.append("high_rating")
    if float(row.get("review_volume_score", 0)) >= 0.6:
        tags.append("popular")
    if float(row.get("trust_score", 0)) >= 0.6:
        tags.append("trusted")
    if float(row.get("open_score", 0.5)) >= 1.0:
        tags.append("open_now")
    if float(row.get("service_richness_score", 0)) >= 0.35:
        tags.append("service_rich")

    active_services = [flag.replace("service_", "") for flag in SERVICE_FLAG_COLUMNS if bool(row.get(flag, False))]
    tags.extend(active_services[:2])

    return "|".join(dict.fromkeys(tags))


def generate_nearby_queries(working_df: pd.DataFrame) -> pd.DataFrame:
    valid_df = working_df.loc[working_df["is_valid_geo"]].copy().sort_values(["district_norm", "merchant_id"])
    query_specs = [
        {"radius_km": 2.5, "require_open_now": 1, "min_rating": 4.0, "service_detailing": True},
        {"radius_km": 3.5, "require_open_now": 1, "min_rating": 3.5, "service_car_supported": True},
        {"radius_km": 5.0, "require_open_now": pd.NA, "min_rating": 4.2, "service_fast_lane": True},
        {"radius_km": 4.0, "require_open_now": pd.NA, "min_rating": 3.0, "service_motorbike_supported": True},
        {"radius_km": 6.0, "require_open_now": 1, "min_rating": 3.5, "service_exterior_wash": True},
        {"radius_km": 5.5, "require_open_now": pd.NA, "min_rating": 4.0, "service_ev_safe": True},
        {"radius_km": 4.5, "require_open_now": 0, "min_rating": 2.5, "service_car_supported": True},
        {"radius_km": 3.0, "require_open_now": 1, "min_rating": 4.0, "service_interior_cleaning": True},
        {"radius_km": 7.0, "require_open_now": pd.NA, "min_rating": 3.8, "service_detailing": True},
        {"radius_km": 5.0, "require_open_now": 1, "min_rating": 3.2, "service_motorbike_supported": True},
        {"radius_km": 3.5, "require_open_now": pd.NA, "min_rating": 4.5, "service_car_supported": True},
        {"radius_km": 6.5, "require_open_now": 1, "min_rating": 3.0, "service_exterior_wash": True},
    ]

    sample_indices = [int(i) for i in pd.Series(range(len(valid_df))).quantile([x / (len(query_specs) - 1) for x in range(len(query_specs))]).round().tolist()]
    sample_indices = [min(max(index, 0), len(valid_df) - 1) for index in sample_indices]

    records: list[dict[str, object]] = []
    for idx, (sample_index, spec) in enumerate(zip(sample_indices, query_specs), start=1):
        merchant = valid_df.iloc[sample_index]
        record = {
            "query_id": f"nearby_q_{idx:03d}",
            "user_latitude": round(float(merchant["latitude"]) + ((idx % 3) - 1) * 0.0045, 6),
            "user_longitude": round(float(merchant["longitude"]) + (((idx + 1) % 3) - 1) * 0.0055, 6),
            "radius_km": spec["radius_km"],
            "require_open_now": spec["require_open_now"],
            "min_rating": spec["min_rating"],
            "anchor_district": merchant.get("district_norm"),
        }
        for service_column in SERVICE_FLAG_COLUMNS:
            record[service_column] = bool(spec.get(service_column, False))
        records.append(record)

    return pd.DataFrame(records)


def generate_on_route_queries(working_df: pd.DataFrame) -> pd.DataFrame:
    district_centers = (
        working_df.loc[working_df["is_valid_geo"]]
        .groupby("district_norm")[["latitude", "longitude"]]
        .mean()
        .sort_index()
        .reset_index()
    )
    route_specs = [
        ("quan 1", "thu duc", 2.5, 1, 4.0, {"service_car_supported": True}),
        ("tan binh", "quan 7", 3.0, pd.NA, 3.5, {"service_exterior_wash": True}),
        ("go vap", "binh tan", 2.8, 1, 3.8, {"service_fast_lane": True}),
        ("phu nhuan", "quan 12", 2.5, pd.NA, 3.0, {"service_motorbike_supported": True}),
        ("quan 6", "binh thanh", 3.5, 1, 4.2, {"service_detailing": True}),
        ("hoc mon", "tan phu", 3.0, pd.NA, 3.2, {"service_car_supported": True}),
        ("quan 3", "nha be", 4.0, 1, 3.5, {"service_ev_safe": True}),
        ("quan 8", "thu duc", 3.5, pd.NA, 4.0, {"service_exterior_wash": True}),
    ]

    center_lookup = {
        row["district_norm"]: row
        for _, row in district_centers.iterrows()
    }

    records: list[dict[str, object]] = []
    for idx, (origin_district, destination_district, corridor_km, require_open_now, min_rating, filters) in enumerate(route_specs, start=1):
        if origin_district not in center_lookup or destination_district not in center_lookup:
            continue
        origin = center_lookup[origin_district]
        destination = center_lookup[destination_district]
        record = {
            "query_id": f"route_q_{idx:03d}",
            "origin_latitude": round(float(origin["latitude"]), 6),
            "origin_longitude": round(float(origin["longitude"]), 6),
            "destination_latitude": round(float(destination["latitude"]), 6),
            "destination_longitude": round(float(destination["longitude"]), 6),
            "max_corridor_km": corridor_km,
            "require_open_now": require_open_now,
            "min_rating": min_rating,
            "origin_district": origin_district,
            "destination_district": destination_district,
        }
        for service_column in SERVICE_FLAG_COLUMNS:
            record[service_column] = bool(filters.get(service_column, False))
        records.append(record)

    return pd.DataFrame(records)


def apply_common_filters(candidates: pd.DataFrame, query: pd.Series) -> pd.DataFrame:
    filtered = candidates.copy()
    filtered = filtered.loc[filtered["is_valid_geo"]].copy()

    require_open_now = query.get("require_open_now")
    if pd.notna(require_open_now):
        filtered = filtered.loc[filtered["is_open_now_proxy"] == require_open_now].copy()

    min_rating = query.get("min_rating")
    if pd.notna(min_rating):
        filtered = filtered.loc[pd.to_numeric(filtered["rating"], errors="coerce").fillna(0) >= float(min_rating)].copy()

    for service_column in SERVICE_FLAG_COLUMNS:
        if bool_from_mixed(query.get(service_column, False)):
            filtered = filtered.loc[filtered[service_column]].copy()

    return filtered


def retrieve_nearby_candidates(working_df: pd.DataFrame, query: pd.Series) -> pd.DataFrame:
    candidates = working_df.copy()
    candidates["distance_km"] = candidates.apply(
        lambda row: haversine_distance_km(
            float(query["user_latitude"]),
            float(query["user_longitude"]),
            float(row["latitude"]),
            float(row["longitude"]),
        ) if row["is_valid_geo"] else pd.NA,
        axis=1,
    )
    candidates = candidates.loc[pd.to_numeric(candidates["distance_km"], errors="coerce") <= float(query["radius_km"])].copy()
    candidates = apply_common_filters(candidates, query)
    candidates["query_id"] = query["query_id"]
    candidates["search_mode"] = "nearby"
    candidates["radius_km"] = float(query["radius_km"])
    return candidates


def retrieve_route_candidates(working_df: pd.DataFrame, query: pd.Series) -> pd.DataFrame:
    route_length_km = haversine_distance_km(
        float(query["origin_latitude"]),
        float(query["origin_longitude"]),
        float(query["destination_latitude"]),
        float(query["destination_longitude"]),
    )

    candidates = working_df.copy()
    metrics = candidates.apply(
        lambda row: point_to_segment_distance_km(
            float(row["latitude"]),
            float(row["longitude"]),
            float(query["origin_latitude"]),
            float(query["origin_longitude"]),
            float(query["destination_latitude"]),
            float(query["destination_longitude"]),
        ) if row["is_valid_geo"] else (pd.NA, pd.NA),
        axis=1,
    )
    candidates["route_distance_proxy"] = [item[0] for item in metrics]
    candidates["route_progress_km"] = [item[1] for item in metrics]
    candidates["origin_distance_km"] = candidates.apply(
        lambda row: haversine_distance_km(
            float(query["origin_latitude"]),
            float(query["origin_longitude"]),
            float(row["latitude"]),
            float(row["longitude"]),
        ) if row["is_valid_geo"] else pd.NA,
        axis=1,
    )
    candidates["destination_distance_km"] = candidates.apply(
        lambda row: haversine_distance_km(
            float(query["destination_latitude"]),
            float(query["destination_longitude"]),
            float(row["latitude"]),
            float(row["longitude"]),
        ) if row["is_valid_geo"] else pd.NA,
        axis=1,
    )
    candidates["detour_proxy"] = (
        pd.to_numeric(candidates["origin_distance_km"], errors="coerce")
        + pd.to_numeric(candidates["destination_distance_km"], errors="coerce")
        - route_length_km
    ).clip(lower=0)
    candidates["route_length_km"] = route_length_km

    candidates = candidates.loc[
        pd.to_numeric(candidates["route_distance_proxy"], errors="coerce") <= float(query["max_corridor_km"])
    ].copy()
    candidates = apply_common_filters(candidates, query)
    candidates["query_id"] = query["query_id"]
    candidates["search_mode"] = "on_route"
    candidates["max_corridor_km"] = float(query["max_corridor_km"])
    return candidates


def rank_nearby_candidates(candidates: pd.DataFrame) -> pd.DataFrame:
    if candidates.empty:
        return candidates.copy()

    ranked = candidates.copy()
    ranked["distance_score"] = normalize_inverse_distance(ranked["distance_km"], ranked["radius_km"])
    ranked["final_rank_score"] = (
        ranked["distance_score"] * 0.35
        + ranked["rating_score"] * 0.20
        + ranked["review_volume_score"] * 0.10
        + ranked["trust_score"] * 0.10
        + ranked["open_score"] * 0.10
        + ranked["service_richness_score"] * 0.10
        + pd.to_numeric(ranked["unclaimed_penalty"], errors="coerce").fillna(0.0)
    ).round(6)
    ranked["reason_tags"] = ranked.apply(lambda row: generate_reason_tags(row, "nearby"), axis=1)
    ranked = ranked.sort_values(["query_id", "final_rank_score", "base_rank_score", "distance_km"], ascending=[True, False, False, True]).copy()
    ranked["rank_position"] = ranked.groupby("query_id").cumcount() + 1
    return ranked


def rank_route_candidates(candidates: pd.DataFrame) -> pd.DataFrame:
    if candidates.empty:
        return candidates.copy()

    ranked = candidates.copy()
    ranked["route_match_score"] = normalize_inverse_distance(
        ranked["route_distance_proxy"],
        ranked["max_corridor_km"],
    )
    ranked["detour_score"] = normalize_inverse_by_max(ranked["detour_proxy"])
    ranked["final_rank_score"] = (
        ranked["route_match_score"] * 0.30
        + ranked["detour_score"] * 0.20
        + ranked["rating_score"] * 0.15
        + ranked["review_volume_score"] * 0.10
        + ranked["trust_score"] * 0.10
        + ranked["open_score"] * 0.10
        + ranked["service_richness_score"] * 0.05
    ).round(6)
    ranked["reason_tags"] = ranked.apply(lambda row: generate_reason_tags(row, "on_route"), axis=1)
    ranked = ranked.sort_values(
        ["query_id", "final_rank_score", "base_rank_score", "route_distance_proxy", "detour_proxy"],
        ascending=[True, False, False, True, True],
    ).copy()
    ranked["rank_position"] = ranked.groupby("query_id").cumcount() + 1
    return ranked


def build_retrieval_and_ranking_outputs(
    working_df: pd.DataFrame,
    nearby_queries: pd.DataFrame,
    route_queries: pd.DataFrame,
) -> tuple[pd.DataFrame, pd.DataFrame, pd.DataFrame, pd.DataFrame]:
    nearby_candidates = [retrieve_nearby_candidates(working_df, query) for _, query in nearby_queries.iterrows()]
    route_candidates = [retrieve_route_candidates(working_df, query) for _, query in route_queries.iterrows()]

    retrieval_nearby = pd.concat(nearby_candidates, ignore_index=True) if nearby_candidates else pd.DataFrame()
    retrieval_on_route = pd.concat(route_candidates, ignore_index=True) if route_candidates else pd.DataFrame()

    ranking_nearby = rank_nearby_candidates(retrieval_nearby)
    ranking_on_route = rank_route_candidates(retrieval_on_route)

    return retrieval_nearby, retrieval_on_route, ranking_nearby, ranking_on_route


def select_retrieval_columns(df: pd.DataFrame, mode: str) -> pd.DataFrame:
    if df.empty:
        if mode == "nearby":
            return pd.DataFrame(columns=["query_id", "merchant_id", "merchant_name", "distance_km", "base_rank_score"])
        return pd.DataFrame(columns=["query_id", "merchant_id", "merchant_name", "route_distance_proxy", "detour_proxy", "base_rank_score"])

    shared = ["query_id", "merchant_id", "merchant_name", "base_rank_score"]
    if mode == "nearby":
        columns = shared + ["distance_km", "rating_score", "open_score"]
    else:
        columns = shared + ["route_distance_proxy", "detour_proxy", "rating_score", "open_score"]
    existing = [column for column in columns if column in df.columns]
    return df[existing].copy()


def select_ranking_columns(df: pd.DataFrame, mode: str) -> pd.DataFrame:
    if df.empty:
        base_columns = ["query_id", "merchant_id", "merchant_name", "base_rank_score", "final_rank_score", "rank_position", "reason_tags"]
        if mode == "nearby":
            return pd.DataFrame(columns=base_columns + ["distance_km"])
        return pd.DataFrame(columns=base_columns + ["route_distance_proxy", "detour_proxy"])

    if mode == "nearby":
        columns = [
            "query_id",
            "merchant_id",
            "merchant_name",
            "distance_km",
            "base_rank_score",
            "final_rank_score",
            "rank_position",
            "reason_tags",
        ]
    else:
        columns = [
            "query_id",
            "merchant_id",
            "merchant_name",
            "route_distance_proxy",
            "detour_proxy",
            "base_rank_score",
            "final_rank_score",
            "rank_position",
            "reason_tags",
        ]
    existing = [column for column in columns if column in df.columns]
    return df[existing].copy()


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


def average_candidates_per_query(results_df: pd.DataFrame, queries_df: pd.DataFrame) -> float:
    if queries_df.empty:
        return 0.0
    if results_df.empty:
        return 0.0
    counts = results_df.groupby("query_id").size().reindex(queries_df["query_id"], fill_value=0)
    return float(counts.mean())


def write_report(
    working_df: pd.DataFrame,
    nearby_queries: pd.DataFrame,
    route_queries: pd.DataFrame,
    ranking_nearby: pd.DataFrame,
    ranking_on_route: pd.DataFrame,
) -> None:
    REPORT_DIR.mkdir(parents=True, exist_ok=True)

    nearby_avg_candidates = average_candidates_per_query(ranking_nearby, nearby_queries)
    route_avg_candidates = average_candidates_per_query(ranking_on_route, route_queries)

    merchant_frequency = pd.concat(
        [
            ranking_nearby[["merchant_id", "merchant_name"]],
            ranking_on_route[["merchant_id", "merchant_name"]],
        ],
        ignore_index=True,
    )
    top_merchants = (
        merchant_frequency.groupby(["merchant_id", "merchant_name"]).size().sort_values(ascending=False).head(10)
        if not merchant_frequency.empty
        else pd.Series(dtype="int64")
    )

    score_distribution = pd.DataFrame()
    if not ranking_nearby.empty or not ranking_on_route.empty:
        score_distribution = pd.DataFrame(
            {
                "nearby_final_rank_score": ranking_nearby.get("final_rank_score", pd.Series(dtype="float64")),
                "on_route_final_rank_score": ranking_on_route.get("final_rank_score", pd.Series(dtype="float64")),
            }
        ).describe().round(6)

    lines = [
        "# Phase 4 Retrieval And Ranking Report",
        "",
        "## Volume Summary",
        f"- Total merchants loaded: {len(working_df)}",
        f"- Total nearby queries: {len(nearby_queries)}",
        f"- Total on-route queries: {len(route_queries)}",
        f"- Average candidate count per nearby query: {nearby_avg_candidates:.2f}",
        f"- Average candidate count per on-route query: {route_avg_candidates:.2f}",
        "",
        "## Top Merchants By Appearance",
    ]

    if top_merchants.empty:
        lines.append("- No ranked merchants generated.")
    else:
        for (merchant_id, merchant_name), count in top_merchants.items():
            lines.append(f"- `{merchant_id}` / {merchant_name}: {int(count)} appearances")

    lines.extend(["", "## Ranking Score Distribution"])
    if score_distribution.empty:
        lines.append("- No ranking score distribution available.")
    else:
        lines.extend([""] + dataframe_to_markdown_table(score_distribution))

    lines.extend(
        [
            "",
            "## Route Approximation Assumptions",
            "- Route search uses a straight-line corridor between origin and destination because no routing engine is available in this phase.",
            "- Point-to-route distance uses a local kilometer projection around the route segment midpoint for a lightweight corridor approximation.",
            "- Detour proxy is estimated as origin-to-merchant plus merchant-to-destination minus direct origin-to-destination distance.",
            "",
            "## Known Limitations",
            "- Synthetic queries are representative but not grounded in real user logs, so demand patterns and filter combinations may differ from production behavior.",
            "- Straight-line routing ignores road topology, traffic flow, bridges, rivers, and one-way constraints.",
            "- Rule-based service tagging inherits Phase 3 heuristic limitations and may under-detect niche services like ceramic or EV-safe handling.",
            "- Nearby and route rankers are deterministic baselines and do not yet use clickthrough, booking conversion, or personalized preferences.",
        ]
    )

    REPORT_OUTPUT_PATH.write_text("\n".join(lines) + "\n", encoding="utf-8")


def print_terminal_summary(
    nearby_queries: pd.DataFrame,
    route_queries: pd.DataFrame,
    ranking_nearby: pd.DataFrame,
    ranking_on_route: pd.DataFrame,
) -> None:
    nearby_avg = average_candidates_per_query(ranking_nearby, nearby_queries)
    route_avg = average_candidates_per_query(ranking_on_route, route_queries)
    print(f"nearby queries: {len(nearby_queries)}")
    print(f"on-route queries: {len(route_queries)}")
    print(f"nearby ranked rows: {len(ranking_nearby)}")
    print(f"on-route ranked rows: {len(ranking_on_route)}")
    print(f"avg nearby candidates: {nearby_avg:.2f}")
    print(f"avg on-route candidates: {route_avg:.2f}")


def main() -> None:
    working_df = load_merchant_working_frame()
    nearby_queries = generate_nearby_queries(working_df)
    route_queries = generate_on_route_queries(working_df)

    retrieval_nearby, retrieval_on_route, ranking_nearby, ranking_on_route = build_retrieval_and_ranking_outputs(
        working_df,
        nearby_queries,
        route_queries,
    )

    nearby_queries.to_csv(QUERIES_NEARBY_OUTPUT_PATH, index=False, encoding="utf-8")
    route_queries.to_csv(QUERIES_ON_ROUTE_OUTPUT_PATH, index=False, encoding="utf-8")
    select_retrieval_columns(retrieval_nearby, "nearby").to_csv(
        RETRIEVAL_RESULTS_NEARBY_OUTPUT_PATH,
        index=False,
        encoding="utf-8",
    )
    select_retrieval_columns(retrieval_on_route, "on_route").to_csv(
        RETRIEVAL_RESULTS_ON_ROUTE_OUTPUT_PATH,
        index=False,
        encoding="utf-8",
    )
    select_ranking_columns(ranking_nearby, "nearby").to_csv(
        RANKING_RESULTS_NEARBY_OUTPUT_PATH,
        index=False,
        encoding="utf-8",
    )
    select_ranking_columns(ranking_on_route, "on_route").to_csv(
        RANKING_RESULTS_ON_ROUTE_OUTPUT_PATH,
        index=False,
        encoding="utf-8",
    )

    write_report(working_df, nearby_queries, route_queries, ranking_nearby, ranking_on_route)
    print_terminal_summary(nearby_queries, route_queries, ranking_nearby, ranking_on_route)


if __name__ == "__main__":
    main()
