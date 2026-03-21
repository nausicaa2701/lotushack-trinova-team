# Phase 8 Slot Dataset Report

## Dataset Summary
- Total rows: 642
- Unique queries: 16
- Unique merchants: 157
- Unique slots: 471
- Positive rate: 0.0966

## Label Distribution
- Label 0: 580
- Label 1: 62

## Missing Value Summary
- `distance_km_missing`: 351
- `radius_km_missing`: 351
- `require_open_now_missing`: 342
- `detour_proxy_missing`: 291
- `route_distance_proxy_missing`: 291
- `max_corridor_km_missing`: 291
- `is_open_now_proxy_missing`: 30
- `review_count_source_missing`: 0
- `slot_minute_missing`: 0
- `rating_missing`: 0
- `merchant_final_rank_score_missing`: 0
- `merchant_rank_position_missing`: 0
- `slot_position_if_available_missing`: 0
- `lead_time_hours_missing`: 0
- `slot_hour_missing`: 0
- `base_rank_score_missing`: 0
- `min_rating_missing`: 0
- `open_score_missing`: 0
- `trust_score_missing`: 0
- `review_volume_score_missing`: 0

## Final Model Feature List
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

## Assumptions Used For Slot Parsing And Feature Engineering
- Slot rows are built from unique `query_id + merchant_id + slot_id` combinations, with `slot_selected = 1` if any matching slot_selected event exists.
- Slot start time comes from `slot_start_ts`; if `slot_id` were missing, the pipeline would rebuild it deterministically from `merchant_id + slot_start_ts`.
- Search timestamps and slot timestamps are parsed in UTC and used directly for lead-time and weekday features.
- Impression, click, and booking context is joined at the `query_id + merchant_id` grain and reused across all slots for that merchant within the query.
- Missing numeric values are converted to model-safe `_filled` features with paired `_missing` indicators.

## Synthetic Data Warnings
- Slot events are synthetic and inherit the behavioral assumptions from Phase 5, so this dataset is suitable for pipeline prototyping but not production learning.
- Merchant-level and ranking-level context may dominate slot behavior because true user calendar constraints, merchant capacity, and historical slot occupancy are not present.
- A future production dataset should add real slot availability, merchant operating calendars, and actual appointment acceptance outcomes.
