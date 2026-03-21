# Phase 9 Slot Model Report

## Split Summary
- Model type used: `lightgbm`
- Train query count: 12
- Validation query count: 4
- Train row count: 417
- Validation row count: 225

## Feature List Used
- `weekday`
- `hour_of_day`
- `is_weekend`
- `has_destination`
- `service_exterior_wash`
- `service_interior_cleaning`
- `service_detailing`
- `service_ceramic`
- `service_ev_safe`
- `service_fast_lane`
- `service_car_supported`
- `service_motorbike_supported`
- `was_clicked_for_query`
- `was_booked_for_query`
- `slot_is_same_day`
- `slot_is_next_day`
- `slot_is_weekend`
- `slot_is_business_hour`
- `slot_is_evening`
- `slot_is_morning`
- `short_lead_time_flag`
- `medium_lead_time_flag`
- `long_lead_time_flag`
- `high_trust_evening_flag`
- `open_and_top_ranked_flag`
- `nearby_query_flag`
- `route_query_flag`
- `require_open_now_missing`
- `require_open_now_filled`
- `min_rating_missing`
- `min_rating_filled`
- `radius_km_missing`
- `radius_km_filled`
- `max_corridor_km_missing`
- `max_corridor_km_filled`
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
- `base_rank_score_missing`
- `base_rank_score_filled`
- `slot_hour_missing`
- `slot_hour_filled`
- `slot_minute_missing`
- `slot_minute_filled`
- `lead_time_hours_missing`
- `lead_time_hours_filled`
- `slot_position_if_available_missing`
- `slot_position_if_available_filled`
- `merchant_rank_position_missing`
- `merchant_rank_position_filled`
- `merchant_final_rank_score_missing`
- `merchant_final_rank_score_filled`
- `distance_km_missing`
- `distance_km_filled`
- `detour_proxy_missing`
- `detour_proxy_filled`
- `route_distance_proxy_missing`
- `route_distance_proxy_filled`

## Train Label Distribution
- Label 0: 376
- Label 1: 41

## Validation Label Distribution
- Label 0: 204
- Label 1: 21

## Validation Metrics
- Accuracy: 0.8054
- Balanced Accuracy: 0.5156
- Precision: 0.1000
- Recall: 0.0500
- F1: 0.0667
- ROC-AUC: 0.6388
- PR-AUC: 0.3994
- Top-3 slot hit rate: 1.0000
- Average rank of selected slot: 1.9625

## Baseline Vs ML Comparison
- ML does not outperform the heuristic baseline overall on this validation split.
- `balanced_accuracy`: ML=0.5156, baseline=0.5114, delta=+0.0042
- `f1`: ML=0.0667, baseline=0.2061, delta=-0.1394
- `roc_auc`: ML=0.6388, baseline=0.6543, delta=-0.0154
- `pr_auc`: ML=0.3994, baseline=0.4027, delta=-0.0033
- `top3_hit_rate`: ML=1.0000, baseline=1.0000, delta=+0.0000
- `avg_selected_rank`: ML=1.9625, baseline=1.9250, delta=+0.0375

## Top Feature Importances
- `lead_time_hours_filled`: gain=1231.8285, split=487
- `merchant_rank_position_filled`: gain=1030.4143, split=177
- `merchant_final_rank_score_filled`: gain=997.8214, split=263
- `review_count_source_filled`: gain=802.8276, split=144
- `trust_score_filled`: gain=749.6223, split=149
- `base_rank_score_filled`: gain=690.5470, split=112
- `rating_filled`: gain=541.3974, split=112
- `detour_proxy_filled`: gain=520.1614, split=130
- `route_distance_proxy_filled`: gain=507.5494, split=113
- `min_rating_filled`: gain=420.6115, split=42
- `slot_hour_filled`: gain=363.7457, split=93
- `distance_km_filled`: gain=299.8342, split=113
- `slot_is_morning`: gain=279.7106, split=55
- `service_richness_score_filled`: gain=199.8822, split=56
- `rating_score_filled`: gain=150.8651, split=15

## Robustness Warnings
- Validation has only 4 query groups, so metrics may vary substantially across reruns.
- Top-3 slot hit rate is nearly saturated because the synthetic setup exposes at most three slots per query-merchant group.

## Caveats Due To Synthetic Slot Data
- Slot selections are generated from synthetic click-to-slot behavior, so this model validates pipeline quality rather than real customer preference learning.
- Availability, capacity, real merchant calendars, and user schedule constraints are not present, which limits real-world usefulness.
- Merchant-level ranking context is reused across all slots for a merchant within a query, so slot choices may be more predictable than they would be with production data.

## Recommendation
- This model is prototype-ready only. It is useful for testing feature generation, model training, and evaluation flow, but it is not production-ready until trained on real slot selection data.
