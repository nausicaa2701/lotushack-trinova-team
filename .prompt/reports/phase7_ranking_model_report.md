# Phase 7 Ranking Model Report

## Split Summary
- Train query count: 16
- Validation query count: 4
- Train row count: 4816
- Validation row count: 1204

## Model Features Used
- `has_destination`
- `is_valid_geo`
- `service_exterior_wash`
- `service_interior_cleaning`
- `service_detailing`
- `service_ceramic`
- `service_ev_safe`
- `service_fast_lane`
- `service_car_supported`
- `service_motorbike_supported`
- `route_query_flag`
- `nearby_query_flag`
- `top_3_flag`
- `top_5_flag`
- `high_rating_flag`
- `open_and_high_rating_flag`
- `require_open_now_missing`
- `require_open_now_filled`
- `min_rating_missing`
- `min_rating_filled`
- `radius_km_missing`
- `radius_km_filled`
- `max_corridor_km_missing`
- `max_corridor_km_filled`
- `latitude_missing`
- `latitude_filled`
- `longitude_missing`
- `longitude_filled`
- `rating_missing`
- `rating_filled`
- `review_count_source_missing`
- `review_count_source_filled`
- `is_open_now_proxy_missing`
- `is_open_now_proxy_filled`
- `rating_score_missing`
- `rating_score_filled`
- `review_volume_score_missing`
- `review_volume_score_filled`
- `trust_score_missing`
- `trust_score_filled`
- `open_score_missing`
- `open_score_filled`
- `service_richness_score_missing`
- `service_richness_score_filled`
- `unclaimed_penalty_missing`
- `unclaimed_penalty_filled`
- `base_rank_score_missing`
- `base_rank_score_filled`
- `rank_position_missing`
- `rank_position_filled`
- `final_rank_score_missing`
- `final_rank_score_filled`
- `distance_km_missing`
- `distance_km_filled`
- `route_distance_proxy_missing`
- `route_distance_proxy_filled`
- `detour_proxy_missing`
- `detour_proxy_filled`
- `reciprocal_rank_missing`
- `reciprocal_rank_filled`

## Train Label Distribution
- Label 0: 4343
- Label 1: 322
- Label 2: 101
- Label 3: 50

## Validation Label Distribution
- Label 0: 974
- Label 1: 167
- Label 2: 45
- Label 3: 18

## Validation Metrics
- NDCG@3: 0.6316
- NDCG@5: 0.6056
- NDCG@10: 0.6222
- Recall@3: 0.2966
- Recall@5: 0.3277
- Recall@10: 0.4053
- MRR: 1.0000
- Average label of top-1 prediction: 1.7500
- Average label of top-3 predictions: 1.6667

## Baseline Vs ML Comparison
- ML does not outperform the baseline overall on this validation split.
- `ndcg@3`: ML=0.6316, baseline=0.6440, delta=-0.0124
- `ndcg@5`: ML=0.6056, baseline=0.6132, delta=-0.0075
- `ndcg@10`: ML=0.6222, baseline=0.6091, delta=+0.0131
- `mrr`: ML=1.0000, baseline=1.0000, delta=+0.0000
- `avg_label_top1`: ML=1.7500, baseline=1.7500, delta=+0.0000
- `avg_label_top3`: ML=1.6667, baseline=1.8333, delta=-0.1667

## Top Feature Importances
- `rank_position_filled`: gain=1533.2042, split=163
- `rank_position_missing`: gain=331.3165, split=66
- `reciprocal_rank_filled`: gain=225.4777, split=131
- `final_rank_score_filled`: gain=149.8879, split=167
- `final_rank_score_missing`: gain=134.0700, split=1
- `longitude_filled`: gain=57.2471, split=173
- `detour_proxy_filled`: gain=42.8284, split=134
- `latitude_filled`: gain=41.6212, split=121
- `distance_km_filled`: gain=38.4228, split=103
- `base_rank_score_filled`: gain=34.4427, split=131
- `route_distance_proxy_filled`: gain=30.0844, split=120
- `trust_score_filled`: gain=28.5118, split=111
- `review_count_source_filled`: gain=16.3736, split=59
- `rating_filled`: gain=13.8234, split=50
- `service_richness_score_filled`: gain=11.1719, split=28

## Small-Data Warnings
- Validation has only 4 query groups, so metric variance is high and conclusions are unstable.

## Caveats Due To Synthetic Interaction Data
- Labels, exposures, clicks, and bookings come from synthetic seeded interactions, so gains over baseline reflect pipeline learnability rather than real market behavior.
- Query count is very small for a ranking model, and all query groups have the same size, which limits generalization signals.
- Baseline features are intentionally included, so this model should be interpreted as a baseline-enhancement prototype rather than a de novo learned ranker.

## Recommendation
- This model is prototype-ready only. It is suitable for validating training, inference, and evaluation plumbing, but it is not production-ready until it is retrained on real traffic and booking outcomes.
