from __future__ import annotations

import math
import sys
from pathlib import Path
from typing import Iterable

import pandas as pd


ROOT_DIR = Path(__file__).resolve().parents[2]
INPUT_DIR = ROOT_DIR / "Dataset" / "ProcessedData"
MODEL_DIR = INPUT_DIR / "models"
REPORT_DIR = ROOT_DIR / ".prompt" / "reports"

TRAINING_DATASET_PATH = INPUT_DIR / "ranking_training_dataset.csv"
GROUP_SIZES_PATH = INPUT_DIR / "ranking_group_sizes.csv"
FEATURE_DICTIONARY_PATH = INPUT_DIR / "ranking_feature_dictionary.csv"

MODEL_OUTPUT_PATH = MODEL_DIR / "ranking_model_lightgbm.txt"
FEATURE_IMPORTANCE_OUTPUT_PATH = MODEL_DIR / "ranking_model_feature_importance.csv"
VALIDATION_PREDICTIONS_OUTPUT_PATH = MODEL_DIR / "ranking_validation_predictions.csv"
EVAL_BY_QUERY_OUTPUT_PATH = MODEL_DIR / "ranking_eval_by_query.csv"
REPORT_OUTPUT_PATH = REPORT_DIR / "phase7_ranking_model_report.md"

RANDOM_STATE = 20260322
VALIDATION_FRACTION = 0.2
NDCG_AT = (3, 5, 10)
RECALL_AT = (3, 5, 10)


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
    if "lightgbm" in sys.modules:
        return
    venv_root = ROOT_DIR / ".venv_phase7"
    if not venv_root.exists():
        return
    for site_packages in venv_root.glob("lib/python*/site-packages"):
        sys.path.insert(0, str(site_packages))


def load_lightgbm():
    ensure_local_lightgbm_on_path()
    try:
        import lightgbm as lgb  # type: ignore

        return lgb
    except ModuleNotFoundError as exc:
        raise RuntimeError(
            "LightGBM is not available. Install it with "
            "`python3 -m venv .venv_phase7 && .venv_phase7/bin/python -m pip install lightgbm`, "
            "or activate a Python environment that already has LightGBM."
        ) from exc


def load_inputs() -> tuple[pd.DataFrame, pd.DataFrame, pd.DataFrame]:
    training_df = safe_read_csv(TRAINING_DATASET_PATH)
    group_sizes_df = safe_read_csv(GROUP_SIZES_PATH)
    feature_dict_df = safe_read_csv(FEATURE_DICTIONARY_PATH)
    return training_df, group_sizes_df, feature_dict_df


def get_feature_columns(training_df: pd.DataFrame, feature_dict_df: pd.DataFrame) -> list[str]:
    requested = feature_dict_df.loc[feature_dict_df["used_for_model"] == "yes", "column_name"].tolist()
    feature_columns = [column for column in requested if column in training_df.columns]
    if not feature_columns:
        raise ValueError("No model feature columns were found from ranking_feature_dictionary.csv.")
    return feature_columns


def summarize_queries(training_df: pd.DataFrame) -> pd.DataFrame:
    summary = (
        training_df.groupby("query_id", as_index=False)
        .agg(
            group_size=("merchant_id", "size"),
            max_label=("relevance_label", "max"),
            positive_count=("relevance_label", lambda values: int((pd.Series(values) > 0).sum())),
            booked_count=("relevance_label", lambda values: int((pd.Series(values) >= 3).sum())),
            clicked_or_better_count=("relevance_label", lambda values: int((pd.Series(values) >= 2).sum())),
            mean_label=("relevance_label", "mean"),
        )
        .sort_values(
            ["max_label", "booked_count", "clicked_or_better_count", "positive_count", "query_id"],
            ascending=[False, False, False, False, True],
        )
        .reset_index(drop=True)
    )
    return summary


def grouped_train_validation_split(training_df: pd.DataFrame) -> tuple[pd.DataFrame, pd.DataFrame, list[str], list[str]]:
    query_summary = summarize_queries(training_df)
    total_queries = len(query_summary)
    validation_query_count = max(1, int(round(total_queries * VALIDATION_FRACTION)))

    validation_queries = query_summary.iloc[:: max(1, total_queries // validation_query_count)].head(validation_query_count)["query_id"].tolist()
    if len(validation_queries) < validation_query_count:
        remaining = [query for query in query_summary["query_id"].tolist() if query not in validation_queries]
        validation_queries.extend(remaining[: validation_query_count - len(validation_queries)])

    validation_query_set = set(validation_queries)
    train_queries = [query for query in query_summary["query_id"].tolist() if query not in validation_query_set]
    if not train_queries:
        train_queries = validation_queries[:-1]
        validation_queries = validation_queries[-1:]
        validation_query_set = set(validation_queries)

    train_df = training_df.loc[training_df["query_id"].isin(train_queries)].copy()
    validation_df = training_df.loc[training_df["query_id"].isin(validation_queries)].copy()
    return train_df, validation_df, train_queries, validation_queries


def build_group_array(df: pd.DataFrame) -> list[int]:
    return df.groupby("query_id").size().tolist()


def ndcg_at_k(labels: list[float], scores: list[float], k: int) -> float:
    paired = sorted(zip(scores, labels), key=lambda item: item[0], reverse=True)
    ideal = sorted(labels, reverse=True)

    def dcg(values: Iterable[float]) -> float:
        total = 0.0
        for idx, label in enumerate(list(values)[:k], start=1):
            gain = (2**label) - 1
            total += gain / math.log2(idx + 1)
        return total

    ideal_dcg = dcg(ideal)
    if ideal_dcg == 0:
        return 0.0
    predicted_dcg = dcg([label for _, label in paired])
    return predicted_dcg / ideal_dcg


def recall_at_k(labels: list[float], scores: list[float], k: int) -> float:
    relevant_total = sum(1 for label in labels if label > 0)
    if relevant_total == 0:
        return 0.0
    paired = sorted(zip(scores, labels), key=lambda item: item[0], reverse=True)[:k]
    hits = sum(1 for _, label in paired if label > 0)
    return hits / relevant_total


def mean_reciprocal_rank(labels: list[float], scores: list[float]) -> float:
    paired = sorted(zip(scores, labels), key=lambda item: item[0], reverse=True)
    for idx, (_, label) in enumerate(paired, start=1):
        if label > 0:
            return 1.0 / idx
    return 0.0


def average_label_at_k(labels: list[float], scores: list[float], k: int) -> float:
    paired = sorted(zip(scores, labels), key=lambda item: item[0], reverse=True)[:k]
    if not paired:
        return 0.0
    return float(sum(label for _, label in paired) / len(paired))


def evaluate_predictions(
    df: pd.DataFrame,
    score_column: str,
    baseline_column: str | None = None,
) -> tuple[pd.DataFrame, dict[str, float], dict[str, float] | None]:
    per_query_records: list[dict[str, float | str | int]] = []

    for query_id, group in df.groupby("query_id", sort=True):
        labels = group["relevance_label"].astype(float).tolist()
        scores = group[score_column].astype(float).tolist()
        record: dict[str, float | str | int] = {
            "query_id": query_id,
            "group_size": len(group),
            "positive_count": int((group["relevance_label"] > 0).sum()),
        }
        for k in NDCG_AT:
            record[f"ndcg@{k}_ml"] = ndcg_at_k(labels, scores, k)
        for k in RECALL_AT:
            record[f"recall@{k}_ml"] = recall_at_k(labels, scores, k)
        record["mrr_ml"] = mean_reciprocal_rank(labels, scores)
        record["avg_label_top1_ml"] = average_label_at_k(labels, scores, 1)
        record["avg_label_top3_ml"] = average_label_at_k(labels, scores, 3)

        if baseline_column is not None:
            baseline_scores = group[baseline_column].astype(float).tolist()
            for k in NDCG_AT:
                record[f"ndcg@{k}_baseline"] = ndcg_at_k(labels, baseline_scores, k)
            for k in RECALL_AT:
                record[f"recall@{k}_baseline"] = recall_at_k(labels, baseline_scores, k)
            record["mrr_baseline"] = mean_reciprocal_rank(labels, baseline_scores)
            record["avg_label_top1_baseline"] = average_label_at_k(labels, baseline_scores, 1)
            record["avg_label_top3_baseline"] = average_label_at_k(labels, baseline_scores, 3)

        per_query_records.append(record)

    per_query_df = pd.DataFrame(per_query_records)
    ml_summary = {
        metric: float(per_query_df[metric].mean())
        for metric in per_query_df.columns
        if metric.endswith("_ml")
    }
    baseline_summary = None
    if baseline_column is not None:
        baseline_summary = {
            metric: float(per_query_df[metric].mean())
            for metric in per_query_df.columns
            if metric.endswith("_baseline")
        }
    return per_query_df, ml_summary, baseline_summary


def train_lightgbm_ranker(
    train_df: pd.DataFrame,
    validation_df: pd.DataFrame,
    feature_columns: list[str],
):
    lgb = load_lightgbm()

    X_train = train_df[feature_columns]
    y_train = train_df["relevance_label"]
    X_valid = validation_df[feature_columns]
    y_valid = validation_df["relevance_label"]

    train_group = build_group_array(train_df)
    valid_group = build_group_array(validation_df)

    model = lgb.LGBMRanker(
        objective="lambdarank",
        metric="ndcg",
        learning_rate=0.05,
        n_estimators=120,
        num_leaves=15,
        min_data_in_leaf=10,
        subsample=1.0,
        colsample_bytree=0.9,
        n_jobs=1,
        force_row_wise=True,
        verbosity=-1,
        random_state=RANDOM_STATE,
    )
    model.fit(
        X_train,
        y_train,
        group=train_group,
        eval_set=[(X_valid, y_valid)],
        eval_group=[valid_group],
        eval_at=list(NDCG_AT),
    )
    return model


def export_feature_importance(model, feature_columns: list[str]) -> pd.DataFrame:
    booster = model.booster_
    importance_df = pd.DataFrame(
        {
            "feature_name": feature_columns,
            "importance_gain": booster.feature_importance(importance_type="gain"),
            "importance_split": booster.feature_importance(importance_type="split"),
        }
    ).sort_values(["importance_gain", "importance_split"], ascending=[False, False]).reset_index(drop=True)
    importance_df.to_csv(FEATURE_IMPORTANCE_OUTPUT_PATH, index=False, encoding="utf-8")
    return importance_df


def write_model(model) -> None:
    MODEL_DIR.mkdir(parents=True, exist_ok=True)
    model.booster_.save_model(str(MODEL_OUTPUT_PATH))


def build_validation_predictions(
    validation_df: pd.DataFrame,
    ml_scores: pd.Series,
    baseline_column: str,
) -> pd.DataFrame:
    selected_columns = [
        "query_id",
        "merchant_id",
        "merchant_name",
        "relevance_label",
        "rank_position",
        baseline_column,
    ]
    existing_columns = []
    for column in selected_columns:
        if column in validation_df.columns and column not in existing_columns:
            existing_columns.append(column)
    predictions_df = validation_df[existing_columns].copy()
    predictions_df["ml_prediction_score"] = ml_scores
    predictions_df["baseline_prediction_score"] = validation_df[baseline_column]
    predictions_df = predictions_df.sort_values(
        ["query_id", "ml_prediction_score", "baseline_prediction_score"],
        ascending=[True, False, False],
    ).copy()
    predictions_df["ml_rank_position"] = predictions_df.groupby("query_id").cumcount() + 1

    baseline_sorted = predictions_df.sort_values(
        ["query_id", "baseline_prediction_score", "rank_position"],
        ascending=[True, False, True],
    ).copy()
    baseline_sorted["baseline_rank_position"] = baseline_sorted.groupby("query_id").cumcount() + 1
    predictions_df = predictions_df.merge(
        baseline_sorted[["query_id", "merchant_id", "baseline_rank_position"]],
        on=["query_id", "merchant_id"],
        how="left",
    )
    predictions_df.to_csv(VALIDATION_PREDICTIONS_OUTPUT_PATH, index=False, encoding="utf-8")
    return predictions_df


def write_report(
    train_df: pd.DataFrame,
    validation_df: pd.DataFrame,
    feature_columns: list[str],
    train_queries: list[str],
    validation_queries: list[str],
    ml_summary: dict[str, float],
    baseline_summary: dict[str, float] | None,
    importance_df: pd.DataFrame,
) -> None:
    REPORT_DIR.mkdir(parents=True, exist_ok=True)

    def label_distribution_text(df: pd.DataFrame) -> list[str]:
        distribution = df["relevance_label"].value_counts().sort_index()
        return [f"- Label {int(label)}: {int(count)}" for label, count in distribution.items()]

    baseline_vs_ml_lines: list[str] = []
    headline = "Baseline comparison was not available."
    if baseline_summary:
        improvement_score = sum(
            (
                ml_summary.get(f"{metric}_ml", 0.0) - baseline_summary.get(f"{metric}_baseline", 0.0)
            )
            for metric in ["ndcg@3", "ndcg@5", "ndcg@10"]
        )
        headline = (
            "ML slightly outperforms the baseline on average NDCG across the tracked cutoffs."
            if improvement_score > 0
            else "ML does not outperform the baseline overall on this validation split."
        )
        for metric in ["ndcg@3", "ndcg@5", "ndcg@10", "mrr", "avg_label_top1", "avg_label_top3"]:
            ml_key = f"{metric}_ml"
            baseline_key = f"{metric}_baseline"
            ml_value = ml_summary.get(ml_key, 0.0)
            baseline_value = baseline_summary.get(baseline_key, 0.0)
            delta = ml_value - baseline_value
            baseline_vs_ml_lines.append(
                f"- `{metric}`: ML={ml_value:.4f}, baseline={baseline_value:.4f}, delta={delta:+.4f}"
            )

    warning_lines: list[str] = []
    if len(validation_queries) < 5:
        warning_lines.append(
            f"- Validation has only {len(validation_queries)} query groups, so metric variance is high and conclusions are unstable."
        )
    if (validation_df.groupby("query_id")["relevance_label"].nunique() <= 1).any():
        warning_lines.append(
            "- Some validation queries contain only one label class, which weakens pairwise ranking signal and reduces metric sensitivity."
        )
    if not warning_lines:
        warning_lines.append("- Validation split size is small but acceptable for this synthetic prototype run.")

    top_features = importance_df.head(15)

    lines = [
        "# Phase 7 Ranking Model Report",
        "",
        "## Split Summary",
        f"- Train query count: {len(train_queries)}",
        f"- Validation query count: {len(validation_queries)}",
        f"- Train row count: {len(train_df)}",
        f"- Validation row count: {len(validation_df)}",
        "",
        "## Model Features Used",
    ]
    lines.extend([f"- `{feature}`" for feature in feature_columns])
    lines.extend(["", "## Train Label Distribution"])
    lines.extend(label_distribution_text(train_df))
    lines.extend(["", "## Validation Label Distribution"])
    lines.extend(label_distribution_text(validation_df))
    lines.extend(
        [
            "",
            "## Validation Metrics",
            f"- NDCG@3: {ml_summary.get('ndcg@3_ml', 0.0):.4f}",
            f"- NDCG@5: {ml_summary.get('ndcg@5_ml', 0.0):.4f}",
            f"- NDCG@10: {ml_summary.get('ndcg@10_ml', 0.0):.4f}",
            f"- Recall@3: {ml_summary.get('recall@3_ml', 0.0):.4f}",
            f"- Recall@5: {ml_summary.get('recall@5_ml', 0.0):.4f}",
            f"- Recall@10: {ml_summary.get('recall@10_ml', 0.0):.4f}",
            f"- MRR: {ml_summary.get('mrr_ml', 0.0):.4f}",
            f"- Average label of top-1 prediction: {ml_summary.get('avg_label_top1_ml', 0.0):.4f}",
            f"- Average label of top-3 predictions: {ml_summary.get('avg_label_top3_ml', 0.0):.4f}",
            "",
            "## Baseline Vs ML Comparison",
            f"- {headline}",
        ]
    )
    lines.extend(baseline_vs_ml_lines)
    lines.extend(["", "## Top Feature Importances"])
    for _, row in top_features.iterrows():
        lines.append(
            f"- `{row['feature_name']}`: gain={float(row['importance_gain']):.4f}, split={int(row['importance_split'])}"
        )
    lines.extend(["", "## Small-Data Warnings"])
    lines.extend(warning_lines)
    lines.extend(
        [
            "",
            "## Caveats Due To Synthetic Interaction Data",
            "- Labels, exposures, clicks, and bookings come from synthetic seeded interactions, so gains over baseline reflect pipeline learnability rather than real market behavior.",
            "- Query count is very small for a ranking model, and all query groups have the same size, which limits generalization signals.",
            "- Baseline features are intentionally included, so this model should be interpreted as a baseline-enhancement prototype rather than a de novo learned ranker.",
            "",
            "## Recommendation",
            "- This model is prototype-ready only. It is suitable for validating training, inference, and evaluation plumbing, but it is not production-ready until it is retrained on real traffic and booking outcomes.",
        ]
    )

    REPORT_OUTPUT_PATH.write_text("\n".join(lines) + "\n", encoding="utf-8")


def print_terminal_summary(
    train_queries: list[str],
    validation_queries: list[str],
    ml_summary: dict[str, float],
    baseline_summary: dict[str, float] | None,
) -> None:
    print(f"train queries: {len(train_queries)}")
    print(f"validation queries: {len(validation_queries)}")
    print(f"ndcg@3: {ml_summary.get('ndcg@3_ml', 0.0):.4f}")
    print(f"ndcg@5: {ml_summary.get('ndcg@5_ml', 0.0):.4f}")
    print(f"ndcg@10: {ml_summary.get('ndcg@10_ml', 0.0):.4f}")
    print(f"mrr: {ml_summary.get('mrr_ml', 0.0):.4f}")
    if baseline_summary is not None:
        print(
            "baseline delta ndcg@5:",
            f"{ml_summary.get('ndcg@5_ml', 0.0) - baseline_summary.get('ndcg@5_baseline', 0.0):+.4f}",
        )


def main() -> None:
    training_df, group_sizes_df, feature_dict_df = load_inputs()
    feature_columns = get_feature_columns(training_df, feature_dict_df)
    train_df, validation_df, train_queries, validation_queries = grouped_train_validation_split(training_df)

    if validation_df.empty:
        raise ValueError("Validation split is empty; cannot train or evaluate ranking model.")

    model = train_lightgbm_ranker(train_df, validation_df, feature_columns)
    write_model(model)
    importance_df = export_feature_importance(model, feature_columns)

    validation_df = validation_df.copy()
    validation_df["ml_prediction_score"] = model.predict(validation_df[feature_columns])
    baseline_column = "final_rank_score_filled" if "final_rank_score_filled" in validation_df.columns else "base_rank_score_filled"
    if baseline_column not in validation_df.columns:
        raise ValueError("No baseline ranking score column found for comparison.")

    validation_predictions_df = build_validation_predictions(validation_df, validation_df["ml_prediction_score"], baseline_column)
    eval_by_query_df, ml_summary, baseline_summary = evaluate_predictions(
        validation_predictions_df,
        score_column="ml_prediction_score",
        baseline_column="baseline_prediction_score",
    )
    eval_by_query_df.to_csv(EVAL_BY_QUERY_OUTPUT_PATH, index=False, encoding="utf-8")

    write_report(
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
