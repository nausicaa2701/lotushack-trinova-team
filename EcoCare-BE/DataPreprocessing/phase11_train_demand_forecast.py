from __future__ import annotations

import math
from pathlib import Path

import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error


ROOT_DIR = Path(__file__).resolve().parents[2]
INPUT_DIR = ROOT_DIR / "Dataset" / "ProcessedData"
MODEL_DIR = INPUT_DIR / "models"
REPORT_DIR = ROOT_DIR / ".prompt" / "reports"

DEMAND_DATASET_PATH = INPUT_DIR / "demand_timeseries_dataset.csv"
PREDICTIONS_OUTPUT_PATH = MODEL_DIR / "demand_forecast_predictions.csv"
EVAL_OUTPUT_PATH = MODEL_DIR / "demand_forecast_eval.csv"
REPORT_OUTPUT_PATH = REPORT_DIR / "phase11_demand_forecasting_report.md"

RANDOM_STATE = 20260322
PRIMARY_TARGET = "booking_count"
SECONDARY_TARGET = "search_count"


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


def load_dataset() -> pd.DataFrame:
    df = safe_read_csv(DEMAND_DATASET_PATH)
    df["event_hour_ts"] = pd.to_datetime(df["event_hour_ts"], errors="coerce", utc=True)
    df["event_date"] = pd.to_datetime(df["event_date"], errors="coerce")
    return df.sort_values(["event_hour_ts", "zone"]).reset_index(drop=True)


def get_feature_columns(df: pd.DataFrame) -> list[str]:
    numeric_features = [
        "search_count",
        "unique_queries",
        "unique_merchants_booked",
        "weekday",
        "is_weekend",
        "hour_of_day",
        "month",
        "is_peak_hour",
        "lag_search_count_1",
        "lag_search_count_24",
        "lag_booking_count_1",
        "rolling_search_mean_3",
        "rolling_booking_mean_3",
        "rolling_search_mean_24",
        "rolling_booking_mean_24",
    ]
    available = [column for column in numeric_features if column in df.columns]
    return available


def train_validation_split(df: pd.DataFrame) -> tuple[pd.DataFrame, pd.DataFrame]:
    unique_times = sorted(df["event_hour_ts"].dropna().unique())
    if len(unique_times) < 2:
        raise ValueError("Not enough time periods to build a train/validation split.")
    validation_time_count = max(1, math.ceil(len(unique_times) * 0.34))
    validation_times = set(unique_times[-validation_time_count:])
    train_df = df.loc[~df["event_hour_ts"].isin(validation_times)].copy()
    validation_df = df.loc[df["event_hour_ts"].isin(validation_times)].copy()
    if train_df.empty or validation_df.empty:
        raise ValueError("Time split produced an empty train or validation set.")
    return train_df, validation_df


def prepare_model_matrix(df: pd.DataFrame, feature_columns: list[str], zone_columns: list[str] | None = None) -> tuple[pd.DataFrame, list[str]]:
    working = df.copy()
    for column in feature_columns:
        working[column] = pd.to_numeric(working[column], errors="coerce")
        working[f"{column}_missing"] = working[column].isna().astype(int)
        non_null = working[column].dropna()
        default = non_null.median() if not non_null.empty else 0.0
        if pd.isna(default):
            default = 0.0
        working[column] = working[column].fillna(default)

    zone_dummies = pd.get_dummies(working["zone"], prefix="zone", dtype=int)
    if zone_columns is not None:
        zone_dummies = zone_dummies.reindex(columns=zone_columns, fill_value=0)

    matrix = pd.concat([working[feature_columns + [f"{column}_missing" for column in feature_columns]], zone_dummies], axis=1)
    return matrix, zone_dummies.columns.tolist()


def train_model(train_df: pd.DataFrame, feature_columns: list[str]):
    X_train, zone_columns = prepare_model_matrix(train_df, feature_columns)
    y_train = pd.to_numeric(train_df[PRIMARY_TARGET], errors="coerce").fillna(0.0)

    model = RandomForestRegressor(
        n_estimators=300,
        max_depth=8,
        min_samples_leaf=2,
        random_state=RANDOM_STATE,
        n_jobs=1,
    )
    model.fit(X_train, y_train)
    return model, zone_columns


def predict(model, df: pd.DataFrame, feature_columns: list[str], zone_columns: list[str]) -> pd.Series:
    X, _ = prepare_model_matrix(df, feature_columns, zone_columns=zone_columns)
    predictions = model.predict(X)
    return pd.Series(np.maximum(predictions, 0.0), index=df.index, dtype="float64")


def baseline_prediction(df: pd.DataFrame) -> pd.Series:
    baseline = pd.to_numeric(df.get("lag_booking_count_1", 0), errors="coerce")
    if baseline.notna().sum() == 0:
        baseline = pd.to_numeric(df.get("rolling_booking_mean_3", 0), errors="coerce")
    baseline = baseline.fillna(pd.to_numeric(df.get("rolling_booking_mean_3", 0), errors="coerce").fillna(0))
    return baseline.fillna(0.0)


def mape_safe(y_true: pd.Series, y_pred: pd.Series) -> float:
    actual = pd.Series(y_true).astype(float)
    pred = pd.Series(y_pred).astype(float)
    non_zero = actual != 0
    if non_zero.sum() == 0:
        return float("nan")
    return float((np.abs((actual[non_zero] - pred[non_zero]) / actual[non_zero])).mean() * 100)


def wape_safe(y_true: pd.Series, y_pred: pd.Series) -> float:
    actual = pd.Series(y_true).astype(float)
    pred = pd.Series(y_pred).astype(float)
    denominator = np.abs(actual).sum()
    if denominator == 0:
        return float("nan")
    return float(np.abs(actual - pred).sum() / denominator * 100)


def peak_hour_hit_rate(df: pd.DataFrame, prediction_column: str, target_column: str) -> float:
    hits = []
    for zone, group in df.groupby("zone", sort=True):
        if len(group) == 0:
            continue
        actual_peak_idx = group[target_column].astype(float).idxmax()
        pred_peak_idx = group[prediction_column].astype(float).idxmax()
        hits.append(int(actual_peak_idx == pred_peak_idx))
    return float(np.mean(hits)) if hits else float("nan")


def evaluate(df: pd.DataFrame, prediction_column: str) -> dict[str, float]:
    y_true = pd.to_numeric(df[PRIMARY_TARGET], errors="coerce").fillna(0.0)
    y_pred = pd.to_numeric(df[prediction_column], errors="coerce").fillna(0.0)
    mae = float(mean_absolute_error(y_true, y_pred))
    rmse = float(math.sqrt(mean_squared_error(y_true, y_pred)))
    return {
        "mae": mae,
        "rmse": rmse,
        "mape": mape_safe(y_true, y_pred),
        "wape": wape_safe(y_true, y_pred),
        "peak_hour_hit_rate": peak_hour_hit_rate(df, prediction_column, PRIMARY_TARGET),
    }


def evaluate_by_zone(df: pd.DataFrame) -> pd.DataFrame:
    records = []
    for zone, group in df.groupby("zone", sort=True):
        ml_metrics = evaluate(group, "prediction_booking_count")
        baseline_metrics = evaluate(group, "baseline_booking_count")
        records.append(
            {
                "zone": zone,
                "row_count": len(group),
                "actual_booking_sum": float(group[PRIMARY_TARGET].sum()),
                "mae_ml": ml_metrics["mae"],
                "rmse_ml": ml_metrics["rmse"],
                "mape_ml": ml_metrics["mape"],
                "wape_ml": ml_metrics["wape"],
                "peak_hour_hit_rate_ml": ml_metrics["peak_hour_hit_rate"],
                "mae_baseline": baseline_metrics["mae"],
                "rmse_baseline": baseline_metrics["rmse"],
                "mape_baseline": baseline_metrics["mape"],
                "wape_baseline": baseline_metrics["wape"],
                "peak_hour_hit_rate_baseline": baseline_metrics["peak_hour_hit_rate"],
            }
        )
    return pd.DataFrame(records).sort_values("mae_ml", ascending=False).reset_index(drop=True)


def write_outputs(predictions_df: pd.DataFrame, eval_by_zone_df: pd.DataFrame) -> None:
    MODEL_DIR.mkdir(parents=True, exist_ok=True)
    predictions_df.to_csv(PREDICTIONS_OUTPUT_PATH, index=False, encoding="utf-8")
    eval_by_zone_df.to_csv(EVAL_OUTPUT_PATH, index=False, encoding="utf-8")


def write_report(
    train_df: pd.DataFrame,
    validation_df: pd.DataFrame,
    feature_columns: list[str],
    method_used: str,
    ml_metrics: dict[str, float],
    baseline_metrics: dict[str, float],
    eval_by_zone_df: pd.DataFrame,
) -> None:
    REPORT_DIR.mkdir(parents=True, exist_ok=True)

    top_error_zones = eval_by_zone_df.head(10)
    warnings = []
    if train_df["event_hour_ts"].nunique() < 3:
        warnings.append("- Training history spans fewer than three hourly timestamps, so lag-based learning is extremely limited.")
    if validation_df["event_hour_ts"].nunique() < 2:
        warnings.append("- Validation covers only one hourly timestamp, so forecast evaluation is highly unstable.")
    sparse_zones = int((train_df.groupby("zone").size() < 2).sum())
    if sparse_zones > 0:
        warnings.append(f"- {sparse_zones} zones have fewer than two training rows, so the model falls back to a global pattern with zone indicators.")
    if not warnings:
        warnings.append("- Sparse-history warnings were not triggered, but this remains a tiny synthetic prototype.")

    lines = [
        "# Phase 11 Demand Forecasting Report",
        "",
        "## Training Setup",
        f"- Train row count: {len(train_df)}",
        f"- Validation row count: {len(validation_df)}",
        f"- Target used: `{PRIMARY_TARGET}`",
        f"- Secondary target available: `{SECONDARY_TARGET}`",
        f"- Forecasting method used: `{method_used}`",
        "",
        "## Feature List Used",
    ]
    lines.extend([f"- `{feature}`" for feature in feature_columns])
    lines.extend(
        [
            "",
            "## Validation Metrics",
            f"- MAE: {ml_metrics['mae']:.4f}",
            f"- RMSE: {ml_metrics['rmse']:.4f}",
            f"- MAPE: {ml_metrics['mape']:.4f}",
            f"- WAPE: {ml_metrics['wape']:.4f}",
            f"- Peak-hour detection hit rate: {ml_metrics['peak_hour_hit_rate']:.4f}",
            "",
            "## Baseline Comparison",
            f"- Baseline MAE: {baseline_metrics['mae']:.4f}",
            f"- Baseline RMSE: {baseline_metrics['rmse']:.4f}",
            f"- Baseline MAPE: {baseline_metrics['mape']:.4f}",
            f"- Baseline WAPE: {baseline_metrics['wape']:.4f}",
            f"- Baseline peak-hour detection hit rate: {baseline_metrics['peak_hour_hit_rate']:.4f}",
            f"- MAE delta (ML - baseline): {ml_metrics['mae'] - baseline_metrics['mae']:+.4f}",
            f"- RMSE delta (ML - baseline): {ml_metrics['rmse'] - baseline_metrics['rmse']:+.4f}",
            "",
            "## Top Zones By Forecast Error",
        ]
    )
    for _, row in top_error_zones.iterrows():
        lines.append(
            f"- `{row['zone']}`: MAE={row['mae_ml']:.4f}, baseline_MAE={row['mae_baseline']:.4f}, actual_booking_sum={row['actual_booking_sum']:.1f}"
        )
    lines.extend(["", "## Warnings"])
    lines.extend(warnings)
    lines.extend(
        [
            "",
            "## Prototype Limitations",
            "- The demand history contains only three hourly timestamps, so meaningful time-series generalization is not possible yet.",
            "- Search and booking counts are synthetic and concentrated in a narrow window, which makes both lag features and zone effects unusually brittle.",
            "- A global model with zone one-hot features is used because per-zone forecasting would be too sparse for this dataset.",
            "",
            "## Recommendation",
            "- This forecasting setup is prototype-ready only. It is useful for validating data flow and metric computation, but it is not operationally useful until much longer real history is collected.",
        ]
    )

    REPORT_OUTPUT_PATH.write_text("\n".join(lines) + "\n", encoding="utf-8")


def print_terminal_summary(method_used: str, ml_metrics: dict[str, float], baseline_metrics: dict[str, float], train_df: pd.DataFrame, validation_df: pd.DataFrame) -> None:
    print(f"method: {method_used}")
    print(f"train rows: {len(train_df)}")
    print(f"validation rows: {len(validation_df)}")
    print(f"mae: {ml_metrics['mae']:.4f}")
    print(f"rmse: {ml_metrics['rmse']:.4f}")
    print(f"mape: {ml_metrics['mape']:.4f}")
    print(f"peak-hour hit rate: {ml_metrics['peak_hour_hit_rate']:.4f}")
    print(f"baseline mae delta: {ml_metrics['mae'] - baseline_metrics['mae']:+.4f}")


def main() -> None:
    dataset = load_dataset()
    feature_columns = get_feature_columns(dataset)
    train_df, validation_df = train_validation_split(dataset)

    model, zone_columns = train_model(train_df, feature_columns)
    method_used = "random_forest_global_with_zone_dummies"

    train_df = train_df.copy()
    validation_df = validation_df.copy()
    train_df["prediction_booking_count"] = predict(model, train_df, feature_columns, zone_columns)
    validation_df["prediction_booking_count"] = predict(model, validation_df, feature_columns, zone_columns)
    train_df["baseline_booking_count"] = baseline_prediction(train_df)
    validation_df["baseline_booking_count"] = baseline_prediction(validation_df)

    predictions_df = validation_df[
        [
            "zone",
            "event_hour_ts",
            "event_date",
            "event_hour",
            "search_count",
            "booking_count",
            "prediction_booking_count",
            "baseline_booking_count",
            "is_peak_hour",
            "lag_search_count_1",
            "lag_booking_count_1",
            "rolling_search_mean_3",
            "rolling_booking_mean_3",
        ]
    ].copy()

    ml_metrics = evaluate(predictions_df, "prediction_booking_count")
    baseline_metrics = evaluate(predictions_df, "baseline_booking_count")
    eval_by_zone_df = evaluate_by_zone(predictions_df)

    write_outputs(predictions_df, eval_by_zone_df)
    write_report(train_df, validation_df, feature_columns, method_used, ml_metrics, baseline_metrics, eval_by_zone_df)
    print_terminal_summary(method_used, ml_metrics, baseline_metrics, train_df, validation_df)


if __name__ == "__main__":
    main()
