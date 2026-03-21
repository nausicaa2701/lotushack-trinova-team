# Phase 5 Interaction Logging Report

## Event Volume
- Total search events: 20
- Total impressions: 703
- Total clicks: 214
- Total bookings: 68
- Total slot_shown: 642
- Total slot_selected: 62
- Click-through rate: 0.3044
- Booking-after-click rate: 0.3178

## Relevance Label Distribution
- Label 0: 5317
- Label 1: 489
- Label 2: 146
- Label 3: 68

## Event Schemas
- `search_events`: `search_event_id`, `query_id`, `user_id`, `session_id`, `event_ts`, `search_mode`, `query_index`, `query_source`, `query_context`, `origin_latitude`, `origin_longitude`, `destination_latitude`, `destination_longitude`, `radius_km`, `max_corridor_km`, `require_open_now`, `min_rating`
- `impression_events`: `impression_event_id`, `query_id`, `search_event_id`, `user_id`, `session_id`, `event_ts`, `search_mode`, `merchant_id`, `merchant_name`, `rank_position`, `base_rank_score`, `final_rank_score`, `distance_km`, `route_distance_proxy`, `detour_proxy`, `reason_tags`
- `click_events`: `click_event_id`, `impression_event_id`, `query_id`, `search_event_id`, `user_id`, `session_id`, `event_ts`, `search_mode`, `merchant_id`, `merchant_name`, `rank_position`, `final_rank_score`, `click_rank_bias`, `click_source`
- `booking_events`: `booking_event_id`, `click_event_id`, `query_id`, `search_event_id`, `user_id`, `session_id`, `event_ts`, `search_mode`, `merchant_id`, `merchant_name`, `booking_value_band`, `booking_status`
- `slot_events`: `slot_event_id`, `query_id`, `search_event_id`, `user_id`, `session_id`, `event_ts`, `search_mode`, `merchant_id`, `merchant_name`, `slot_event_type`, `slot_id`, `slot_start_ts`, `slot_end_ts`, `slot_rank`, `slot_selected`, `booking_event_id`

## Assumptions Used For Synthetic Behavior Generation
- Every ranked merchant becomes an impression event so the log preserves full shown-result exposure for each query.
- Click probability is biased toward better rank positions and stronger final rank scores, with small seeded noise for variation.
- Booking probability is conditioned on clicked merchants only and is slightly higher for open-now and high-rank results.
- Slot events are generated only for clicked merchants, with three candidate slots shown and an optional selected slot event.
- Relevance labels include full query-merchant combinations over the shown merchant pool so label 0 negatives are available for future training joins.
- All synthetic behavior is deterministic under seed `20260322` for reproducibility.
