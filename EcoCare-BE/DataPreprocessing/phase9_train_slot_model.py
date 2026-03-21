from __future__ import annotations

import math
import sys
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, average_precision_score, f1_score, precision_score, recall_score, roc_auc_score


ROOT_DIR = Path(__file__).resolve().parents[2]
INPUT_DIR = ROOT_DIR / "Dataset" / "ProcessedData"
MODEL_DIR = INPUT_DIR / "models"
REPORT_DIR = ROOT_DIR / ".prompt" / "reports"

SLOT_TRAINING_DATASET_PATH = INPUT_DIR / "slot_training_dataset.csv"
SLOT_FEATURE_DICTIONARY_PATH = INPUT_DIR / "slot_feature_dictionary.csv"

MODEL_OUTPUT_PATH = MODEL_DIR / "slot_model_lightgbm.pkl"
VALIDATION_PREDICTIONS_OUTPUT_PATH = MODEL_DIR / "slot_validation_predictions.csv"
FEATURE_IMPORTANCE_OUTPUT_PATH = MODEL_DIR / "slot_feature_importance.csv"
EVAL_BY_QUERY_OUTPUT_PATH = MODEL_DIR / "slot_eval_by_query.csv"
REPORT_OUTPUT_PATH = REPORT_DIR / "phase9_slot_model_report.md"

RANDOM_STATE = 20260322
VALIDATION_FRACTION = 0.2


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


def ensure_local_lightgbm_on_path() -> None:
    venv_root = ROOT_DIR / ".venv_phase7"
    if not venv_root.exists():
        return
    for site_packages in venv_root.glob("lib/python*/site-packages"):
        if str(site_packages) not in sys.path:
            sys.path.insert(0, str(site_packages))


def load_lightgbm():
    ensure_local_lightgbm_on_path()
    try:
        import lightgbm as lgb  # type: ignore

        return lgb
    except ModuleNotFoundError:
        return None


def load_xgboost():
    try:
        import xgboost as xgb  # type: ignore

        return xgb
    except ModuleNotFoundError:
        return None


def load_inputs() -> tuple[pd.DataFrame, pd.DataFrame]:
    dataset = safe_read_csv(SLOT_TRAINING_DATASET_PATH)
    feature_dictionary = safe_read_csv(SLOT_FEATURE_DICTIONARY_PATH)
    return dataset, feature_dictionary


def get_feature_columns(dataset: pd.DataFrame, feature_dictionary: pd.DataFrame) -> list[str]:
    feature_columns = feature_dictionary.loc[feature_dictionary["used_for_model"] == "yes", "column_name"].tolist()
    feature_columns = [column for column in feature_columns if column in dataset.columns]
    if not feature_columns:
        raise ValueError("No model features found in slot_feature_dictionary.csv.")
    return feature_columns


def summarize_queries(dataset: pd.DataFrame) -> pd.DataFrame:
    summary = (
        dataset.groupby("query_id", as_index=False)
        .agg(
            row_count=("slot_id", "size"),
            positive_count=("slot_selected", "sum"),
            unique_merchants=("merchant_id", "nunique"),
            mean_label=("slot_selected", "mean"),
        )
        .sort_values(
            ["positive_count", "unique_merchants", "row_count", "query_id"],
            ascending=[False, False, False, True],
        )
        .reset_index(drop=True)
    )
    return summary


def grouped_train_validation_split(dataset: pd.DataFrame) -> tuple[pd.DataFrame, pd.DataFrame, list[str], list[str]]:
    query_summary = summarize_queries(dataset)
    total_queries = len(query_summary)
    validation_query_count = max(1, math.ceil(total_queries * VALIDATION_FRACTION))

    step = max(1, total_queries // validation_query_count)
    validation_queries = query_summary.iloc[::step].head(validation_query_count)["query_id"].tolist()
    if len(validation_queries) < validation_query_count:
        remaining = [query for query in query_summary["query_id"].tolist() if query not in validation_queries]
        validation_queries.extend(remaining[: validation_query_count - len(validation_queries)])

    validation_set = set(validation_queries)
    train_queries = [query for query in query_summary["query_id"].tolist() if query not in validation_set]
    if not train_queries:
        train_queries = validation_queries[:-1]
        validation_queries = validation_queries[-1:]
        validation_set = set(validation_queries)

    train_df = dataset.loc[dataset["query_id"].isin(train_queries)].copy()
    validation_df = dataset.loc[dataset["query_id"].isin(validation_queries)].copy()
    return train_df, validation_df, train_queries, validation_queries


def balanced_accuracy_safe(y_true: pd.Series, y_pred: pd.Series) -> float:
    y_true = pd.Series(y_true).astype(int)
    y_pred = pd.Series(y_pred).astype(int)
    recalls = []
    for label in [0, 1]:
        mask = y_true == label
        if mask.sum() == 0:
            continue
        recalls.append(float((y_pred[mask] == label).mean()))
    return float(np.mean(recalls)) if recalls else 0.0


def classification_metrics(y_true: pd.Series, y_score: pd.Series, threshold: float = 0.5) -> dict[str, float]:
    y_true = pd.Series(y_true).astype(int)
    y_score = pd.Series(y_score).astype(float)
    y_pred = (y_score >= threshold).astype(int)

    metrics = {
        "accuracy": float(accuracy_score(y_true, y_pred)),
        "balanced_accuracy": balanced_accuracy_safe(y_true, y_pred),
        "precision": float(precision_score(y_true, y_pred, zero_division=0)),
        "recall": float(recall_score(y_true, y_pred, zero_division=0)),
        "f1": float(f1_score(y_true, y_pred, zero_division=0)),
        "roc_auc": float("nan"),
        "pr_auc": float("nan"),
    }
    if y_true.nunique() > 1:
        metrics["roc_auc"] = float(roc_auc_score(y_true, y_score))
        metrics["pr_auc"] = float(average_precision_score(y_true, y_score))
    return metrics


def add_group_ranks(df: pd.DataFrame, score_column: str, rank_column: str) -> pd.DataFrame:
    ranked = df.sort_values(
        ["query_id", "merchant_id", score_column, "slot_position_if_available"],
        ascending=[True, True, False, True],
    ).copy()
    ranked[rank_column] = ranked.groupby(["query_id", "merchant_id"]).cumcount() + 1
    return ranked


def top_k_slot_hit_rate(df: pd.DataFrame, rank_column: str, k: int = 3) -> float:
    positive_groups = []
    hits = []
    for (_, _), group in df.groupby(["query_id", "merchant_id"], sort=True):
        positives = group.loc[group["slot_selected"] == 1]
        if positives.empty:
            continue
        positive_groups.append(1)
        hits.append(int((positives[rank_column] <= k).any()))
    if not positive_groups:
        return 0.0
    return float(np.mean(hits))


def average_selected_slot_rank(df: pd.DataFrame, rank_column: str) -> float:
    ranks = []
    for (_, _), group in df.groupby(["query_id", "merchant_id"], sort=True):
        positives = group.loc[group["slot_selected"] == 1, rank_column]
        if positives.empty:
            continue
        ranks.append(float(positives.min()))
    return float(np.mean(ranks)) if ranks else float("nan")


def heuristic_baseline_score(df: pd.DataFrame) -> pd.Series:
    lead_time = pd.to_numeric(df.get("lead_time_hours_filled", 24.0), errors="coerce").fillna(24.0)
    lead_time_score = 1 / (1 + (lead_time / 24.0))
    same_day = pd.to_numeric(df.get("slot_is_same_day", 0), errors="coerce").fillna(0.0)
    business_hour = pd.to_numeric(df.get("slot_is_business_hour", 0), errors="coerce").fillna(0.0)
    open_score = pd.to_numeric(df.get("open_score_filled", 0.5), errors="coerce").fillna(0.5)
    merchant_score = pd.to_numeric(df.get("merchant_final_rank_score_filled", 0.0), errors="coerce").fillna(0.0)

    baseline = (
        lead_time_score * 0.30
        + same_day * 0.15
        + business_hour * 0.15
        + open_score * 0.20
        + merchant_score * 0.20
    )
    return baseline.clip(lower=0.0, upper=1.0)


def train_model(train_df: pd.DataFrame, feature_columns: list[str]):
    X_train = train_df[feature_columns].apply(pd.to_numeric, errors="coerce").fillna(0.0)
    y_train = train_df["slot_selected"].astype(int)

    positive_count = int((y_train == 1).sum())
    negative_count = int((y_train == 0).sum())
    scale_pos_weight = (negative_count / positive_count) if positive_count > 0 else 1.0

    lgb = load_lightgbm()
    if lgb is not None:
        model = lgb.LGBMClassifier(
            objective="binary",
            n_estimators=160,
            learning_rate=0.05,
            num_leaves=15,
            min_data_in_leaf=8,
            subsample=1.0,
            colsample_bytree=0.9,
            scale_pos_weight=scale_pos_weight,
            force_row_wise=True,
            n_jobs=1,
            verbosity=-1,
            random_state=RANDOM_STATE,
        )
        model.fit(X_train, y_train)
        return "lightgbm", model

    xgb = load_xgboost()
    if xgb is not None:
        model = xgb.XGBClassifier(
            objective="binary:logistic",
            n_estimators=200,
            max_depth=4,
            learning_rate=0.05,
            subsample=1.0,
            colsample_bytree=0.9,
            scale_pos_weight=scale_pos_weight,
            random_state=RANDOM_STATE,
            eval_metric="logloss",
        )
        model.fit(X_train, y_train)
        return "xgboost", model

    model = RandomForestClassifier(
        n_estimators=300,
        max_depth=8,
        class_weight="balanced",
        random_state=RANDOM_STATE,
        n_jobs=1,
    )
    model.fit(X_train, y_train)
    return "random_forest", model


def predict_scores(model_type: str, model, df: pd.DataFrame, feature_columns: list[str]) -> pd.Series:
    X = df[feature_columns].apply(pd.to_numeric, errors="coerce").fillna(0.0)
    if hasattr(model, "predict_proba"):
        probabilities = model.predict_proba(X)[:, 1]
    else:
        raw_scores = model.predict(X)
        probabilities = np.asarray(raw_scores, dtype=float)
    return pd.Series(probabilities, index=df.index, dtype="float64")


def export_feature_importance(model_type: str, model, feature_columns: list[str]) -> pd.DataFrame:
    if model_type == "lightgbm":
        booster = model.booster_
        importance_df = pd.DataFrame(
            {
                "feature_name": feature_columns,
                "importance_gain": booster.feature_importance(importance_type="gain"),
                "importance_split": booster.feature_importance(importance_type="split"),
            }
        )
    elif model_type == "xgboost":
        importance_values = model.feature_importances_
        importance_df = pd.DataFrame(
            {
                "feature_name": feature_columns,
                "importance_gain": importance_values,
                "importance_split": 0,
            }
        )
    else:
        importance_values = model.feature_importances_
        importance_df = pd.DataFrame(
            {
                "feature_name": feature_columns,
                "importance_gain": importance_values,
                "importance_split": 0,
            }
        )

    importance_df = importance_df.sort_values(["importance_gain", "importance_split"], ascending=[False, False]).reset_index(drop=True)
    importance_df.to_csv(FEATURE_IMPORTANCE_OUTPUT_PATH, index=False, encoding="utf-8")
    return importance_df


def build_validation_predictions(validation_df: pd.DataFrame, ml_scores: pd.Series, baseline_scores: pd.Series) -> pd.DataFrame:
    predictions = validation_df[
        [
            "query_id",
            "merchant_id",
            "slot_id",
            "merchant_name",
            "slot_time",
            "slot_selected",
            "slot_position_if_available",
        ]
    ].copy()
    predictions["ml_prediction_score"] = ml_scores
    predictions["baseline_heuristic_score"] = baseline_scores
    predictions["ml_predicted_label"] = (predictions["ml_prediction_score"] >= 0.5).astype(int)
    predictions["baseline_predicted_label"] = (predictions["baseline_heuristic_score"] >= 0.5).astype(int)
    predictions = add_group_ranks(predictions, "ml_prediction_score", "ml_slot_rank")
    predictions = add_group_ranks(predictions, "baseline_heuristic_score", "baseline_slot_rank")
    predictions.to_csv(VALIDATION_PREDICTIONS_OUTPUT_PATH, index=False, encoding="utf-8")
    return predictions


def evaluate_by_query(predictions: pd.DataFrame) -> tuple[pd.DataFrame, dict[str, float], dict[str, float]]:
    per_query_records: list[dict[str, float | str]] = []

    for query_id, group in predictions.groupby("query_id", sort=True):
        ml_metrics = classification_metrics(group["slot_selected"], group["ml_prediction_score"])
        baseline_metrics = classification_metrics(group["slot_selected"], group["baseline_heuristic_score"])
        query_record: dict[str, float | str] = {"query_id": query_id}

        for metric_name, metric_value in ml_metrics.items():
            query_record[f"{metric_name}_ml"] = metric_value
        for metric_name, metric_value in baseline_metrics.items():
            query_record[f"{metric_name}_baseline"] = metric_value

        query_record["top3_hit_rate_ml"] = top_k_slot_hit_rate(group, "ml_slot_rank", k=3)
        query_record["top3_hit_rate_baseline"] = top_k_slot_hit_rate(group, "baseline_slot_rank", k=3)
        query_record["avg_selected_rank_ml"] = average_selected_slot_rank(group, "ml_slot_rank")
        query_record["avg_selected_rank_baseline"] = average_selected_slot_rank(group, "baseline_slot_rank")
        per_query_records.append(query_record)

    per_query_df = pd.DataFrame(per_query_records)
    per_query_df.to_csv(EVAL_BY_QUERY_OUTPUT_PATH, index=False, encoding="utf-8")

    ml_summary = {
        metric: float(per_query_df[metric].mean(skipna=True))
        for metric in per_query_df.columns
        if metric.endswith("_ml")
    }
    baseline_summary = {
        metric: float(per_query_df[metric].mean(skipna=True))
        for metric in per_query_df.columns
        if metric.endswith("_baseline")
    }
    return per_query_df, ml_summary, baseline_summary


def save_model(model_type: str, model, feature_columns: list[str]) -> None:
    MODEL_DIR.mkdir(parents=True, exist_ok=True)
    artifact = {
        "model_type": model_type,
        "model": model,
        "feature_columns": feature_columns,
        "random_state": RANDOM_STATE,
    }
    joblib.dump(artifact, MODEL_OUTPUT_PATH)


def write_report(
    model_type: str,
    train_df: pd.DataFrame,
    validation_df: pd.DataFrame,
    feature_columns: list[str],
    train_queries: list[str],
    validation_queries: list[str],
    ml_summary: dict[str, float],
    baseline_summary: dict[str, float],
    importance_df: pd.DataFrame,
) -> None:
    REPORT_DIR.mkdir(parents=True, exist_ok=True)

    def label_lines(df: pd.DataFrame) -> list[str]:
        distribution = df["slot_selected"].value_counts().sort_index()
        return [f"- Label {int(label)}: {int(count)}" for label, count in distribution.items()]

    comparison_lines = []
    headline_score = 0.0
    for metric in ["balanced_accuracy", "f1", "roc_auc", "pr_auc", "top3_hit_rate"]:
        ml_key = f"{metric}_ml"
        baseline_key = f"{metric}_baseline"
        ml_value = ml_summary.get(ml_key, float("nan"))
        baseline_value = baseline_summary.get(baseline_key, float("nan"))
        if pd.notna(ml_value) and pd.notna(baseline_value):
            if metric == "top3_hit_rate":
                headline_score += ml_value - baseline_value
            else:
                headline_score += ml_value - baseline_value
        comparison_lines.append(
            f"- `{metric}`: ML={ml_value:.4f}, baseline={baseline_value:.4f}, delta={(ml_value - baseline_value):+.4f}"
        )
    comparison_lines.append(
        f"- `avg_selected_rank`: ML={ml_summary.get('avg_selected_rank_ml', float('nan')):.4f}, "
        f"baseline={baseline_summary.get('avg_selected_rank_baseline', float('nan')):.4f}, "
        f"delta={(ml_summary.get('avg_selected_rank_ml', float('nan')) - baseline_summary.get('avg_selected_rank_baseline', float('nan'))):+.4f}"
    )

    headline = (
        "ML outperforms the heuristic baseline overall on the tracked slot metrics."
        if headline_score > 0
        else "ML does not outperform the heuristic baseline overall on this validation split."
    )

    warnings = []
    if len(validation_queries) < 5:
        warnings.append(f"- Validation has only {len(validation_queries)} query groups, so metrics may vary substantially across reruns.")
    if int((train_df['slot_selected'] == 1).sum()) < 40:
        warnings.append("- Positive slot selections are sparse in training data, so recall and PR-AUC are fragile.")
    if (validation_df.groupby("query_id")["slot_selected"].sum() == 0).any():
        warnings.append("- Some validation queries contain no positive slot selections, which weakens per-query ranking diagnostics.")
    if validation_df.groupby(["query_id", "merchant_id"]).size().max() <= 3:
        warnings.append("- Top-3 slot hit rate is nearly saturated because the synthetic setup exposes at most three slots per query-merchant group.")
    if not warnings:
        warnings.append("- Validation and positive class sizes are small but acceptable for a prototype run.")

    lines = [
        "# Phase 9 Slot Model Report",
        "",
        "## Split Summary",
        f"- Model type used: `{model_type}`",
        f"- Train query count: {len(train_queries)}",
        f"- Validation query count: {len(validation_queries)}",
        f"- Train row count: {len(train_df)}",
        f"- Validation row count: {len(validation_df)}",
        "",
        "## Feature List Used",
    ]
    lines.extend([f"- `{feature}`" for feature in feature_columns])
    lines.extend(["", "## Train Label Distribution"])
    lines.extend(label_lines(train_df))
    lines.extend(["", "## Validation Label Distribution"])
    lines.extend(label_lines(validation_df))
    lines.extend(
        [
            "",
            "## Validation Metrics",
            f"- Accuracy: {ml_summary.get('accuracy_ml', float('nan')):.4f}",
            f"- Balanced Accuracy: {ml_summary.get('balanced_accuracy_ml', float('nan')):.4f}",
            f"- Precision: {ml_summary.get('precision_ml', float('nan')):.4f}",
            f"- Recall: {ml_summary.get('recall_ml', float('nan')):.4f}",
            f"- F1: {ml_summary.get('f1_ml', float('nan')):.4f}",
            f"- ROC-AUC: {ml_summary.get('roc_auc_ml', float('nan')):.4f}",
            f"- PR-AUC: {ml_summary.get('pr_auc_ml', float('nan')):.4f}",
            f"- Top-3 slot hit rate: {ml_summary.get('top3_hit_rate_ml', float('nan')):.4f}",
            f"- Average rank of selected slot: {ml_summary.get('avg_selected_rank_ml', float('nan')):.4f}",
            "",
            "## Baseline Vs ML Comparison",
            f"- {headline}",
        ]
    )
    lines.extend(comparison_lines)
    lines.extend(["", "## Top Feature Importances"])
    for _, row in importance_df.head(15).iterrows():
        lines.append(
            f"- `{row['feature_name']}`: gain={float(row['importance_gain']):.4f}, split={int(row['importance_split'])}"
        )
    lines.extend(["", "## Robustness Warnings"])
    lines.extend(warnings)
    lines.extend(
        [
            "",
            "## Caveats Due To Synthetic Slot Data",
            "- Slot selections are generated from synthetic click-to-slot behavior, so this model validates pipeline quality rather than real customer preference learning.",
            "- Availability, capacity, real merchant calendars, and user schedule constraints are not present, which limits real-world usefulness.",
            "- Merchant-level ranking context is reused across all slots for a merchant within a query, so slot choices may be more predictable than they would be with production data.",
            "",
            "## Recommendation",
            "- This model is prototype-ready only. It is useful for testing feature generation, model training, and evaluation flow, but it is not production-ready until trained on real slot selection data.",
        ]
    )

    REPORT_OUTPUT_PATH.write_text("\n".join(lines) + "\n", encoding="utf-8")


def print_terminal_summary(train_queries: list[str], validation_queries: list[str], ml_summary: dict[str, float], baseline_summary: dict[str, float]) -> None:
    print(f"train queries: {len(train_queries)}")
    print(f"validation queries: {len(validation_queries)}")
    print(f"balanced accuracy: {ml_summary.get('balanced_accuracy_ml', float('nan')):.4f}")
    print(f"f1: {ml_summary.get('f1_ml', float('nan')):.4f}")
    print(f"roc_auc: {ml_summary.get('roc_auc_ml', float('nan')):.4f}")
    print(f"top3 hit rate: {ml_summary.get('top3_hit_rate_ml', float('nan')):.4f}")
    print(
        "baseline delta top3 hit rate:",
        f"{(ml_summary.get('top3_hit_rate_ml', float('nan')) - baseline_summary.get('top3_hit_rate_baseline', float('nan'))):+.4f}",
    )


def main() -> None:
    dataset, feature_dictionary = load_inputs()
    feature_columns = get_feature_columns(dataset, feature_dictionary)
    train_df, validation_df, train_queries, validation_queries = grouped_train_validation_split(dataset)

    if validation_df.empty:
        raise ValueError("Validation split is empty; cannot train slot model.")

    model_type, model = train_model(train_df, feature_columns)
    save_model(model_type, model, feature_columns)
    importance_df = export_feature_importance(model_type, model, feature_columns)

    validation_df = validation_df.copy()
    validation_df["ml_prediction_score"] = predict_scores(model_type, model, validation_df, feature_columns)
    validation_df["baseline_heuristic_score"] = heuristic_baseline_score(validation_df)

    predictions = build_validation_predictions(
        validation_df,
        validation_df["ml_prediction_score"],
        validation_df["baseline_heuristic_score"],
    )
    _, ml_summary, baseline_summary = evaluate_by_query(predictions)

    write_report(
        model_type,
        train_df,
        validation_df,
        feature_columns,
        train_queries,
        validation_queries,
        ml_summary,
        baseline_summary,
        importance_df,
    )
    print_terminal_summary(train_queries, validation_queries, ml_summary, baseline_summary)


if __name__ == "__main__":
    main()
