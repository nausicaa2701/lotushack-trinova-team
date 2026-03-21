# Phase 6 Ranking Dataset Report

## Dataset Summary
- Total rows: 6020
- Total unique queries: 20
- Total unique merchants: 301
- Average group size: 301.00
- Min group size: 301
- Max group size: 301

## Label Distribution
- Label 0: 5317
- Label 1: 489
- Label 2: 146
- Label 3: 68

## Final Model Features
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

## Missing Value Summary
- `distance_km_missing`: 5679
- `detour_proxy_missing`: 5658
- `route_distance_proxy_missing`: 5658
- `final_rank_score_missing`: 5317
- `rank_position_missing`: 5317
- `max_corridor_km_missing`: 3612
- `require_open_now_missing`: 2709
- `radius_km_missing`: 2408
- `is_open_now_proxy_missing`: 800
- `service_richness_score_missing`: 0
- `base_rank_score_missing`: 0
- `unclaimed_penalty_missing`: 0
- `trust_score_missing`: 0
- `open_score_missing`: 0
- `min_rating_missing`: 0
- `review_volume_score_missing`: 0
- `rating_score_missing`: 0
- `review_count_source_missing`: 0
- `rating_missing`: 0
- `longitude_missing`: 0

## Leakage Prevention Notes
- `query_id` and `merchant_id` are kept only as grouping and join identifiers, not model features.
- Raw event identifiers such as `search_event_id` are retained for traceability but excluded from model features.
- Post-label interaction indicators `was_impressed`, `was_clicked`, and `was_booked` remain in the dataset for audit and analysis but are marked `used_for_model = no` in the feature dictionary.
- Baseline `rank_position` and `final_rank_score` are intentionally retained through their filled variants because this dataset is for baseline-enhancement ranking experiments.

## Assumptions And Synthetic Data Limitations
- Query and interaction behavior comes from synthetic seeded data, so feature-label relationships are useful for pipeline validation but not representative of production demand.
- Missing numeric values are converted into `_filled` features plus `_missing` indicators so the exported table is safe for LightGBM or XGBoost ranking inputs.
- Merchant features are joined from Phase 3 outputs and interaction context is joined from Phase 5 logs using the `query_id + merchant_id` grain.
