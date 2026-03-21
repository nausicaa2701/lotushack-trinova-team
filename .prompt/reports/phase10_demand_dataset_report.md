# Phase 10 Demand Dataset Report

## Dataset Summary
- Total rows: 51
- Total unique zones: 17
- Total date/hour combinations: 3

## Search Count Summary
- `count`: 51.0
- `mean`: 0.3922
- `std`: 0.5321
- `min`: 0.0
- `25%`: 0.0
- `50%`: 0.0
- `75%`: 1.0
- `max`: 2.0

## Booking Count Summary
- `count`: 51.0
- `mean`: 1.3333
- `std`: 1.6573
- `min`: 0.0
- `25%`: 0.0
- `50%`: 1.0
- `75%`: 2.0
- `max`: 8.0

## Top Zones By Demand
- `tan binh`: searches=2, bookings=9
- `quan 6`: searches=2, bookings=7
- `quan 1`: searches=2, bookings=5
- `go vap`: searches=2, bookings=2
- `hoc mon`: searches=2, bookings=2
- `tan phu`: searches=1, bookings=10
- `quan 8`: searches=1, bookings=6
- `phu nhuan`: searches=1, bookings=5
- `binh thanh`: searches=1, bookings=4
- `quan 3`: searches=1, bookings=4

## Missing Value Summary
- `lag_search_count_24`: 51
- `rolling_booking_mean_24`: 17
- `rolling_search_mean_24`: 17
- `rolling_booking_mean_3`: 17
- `rolling_search_mean_3`: 17
- `lag_booking_count_1`: 17
- `lag_search_count_1`: 17
- `month`: 0
- `is_peak_hour`: 0
- `hour_bucket`: 0
- `zone`: 0
- `event_hour_ts`: 0
- `is_weekend`: 0
- `weekday`: 0
- `event_hour`: 0
- `event_date`: 0
- `unique_merchants_booked`: 0
- `booking_count`: 0
- `unique_queries`: 0
- `search_count`: 0

## Assumptions And Limitations
- Search zones are derived from `query_context` because the synthetic search events do not store a dedicated district column.
- Route queries are assigned to their origin district as the zone proxy for this phase.
- Booking zones are assigned from the booked merchant's `district_norm`, with fallback to `district` and then `unknown`.
- The time-series grid is expanded to every observed hour between the minimum and maximum event timestamps for each observed zone.
- Lag and rolling features are zone-specific and rely on the synthetic event horizon, which is very short and therefore sparse.
- Because search and booking logs are synthetic and concentrated in a narrow time window, this dataset is suitable for forecasting experiments but not for production-quality demand modeling.
