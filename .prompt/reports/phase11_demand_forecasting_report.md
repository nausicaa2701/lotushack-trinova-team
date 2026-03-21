# Phase 11 Demand Forecasting Report

## Training Setup
- Train row count: 17
- Validation row count: 34
- Target used: `booking_count`
- Secondary target available: `search_count`
- Forecasting method used: `random_forest_global_with_zone_dummies`

## Feature List Used
- `search_count`
- `unique_queries`
- `unique_merchants_booked`
- `weekday`
- `is_weekend`
- `hour_of_day`
- `month`
- `is_peak_hour`
- `lag_search_count_1`
- `lag_search_count_24`
- `lag_booking_count_1`
- `rolling_search_mean_3`
- `rolling_booking_mean_3`
- `rolling_search_mean_24`
- `rolling_booking_mean_24`

## Validation Metrics
- MAE: 0.6020
- RMSE: 1.3315
- MAPE: 25.5117
- WAPE: 35.9082
- Peak-hour detection hit rate: 0.8824

## Baseline Comparison
- Baseline MAE: 1.8235
- Baseline RMSE: 2.6346
- Baseline MAPE: 105.5556
- Baseline WAPE: 108.7719
- Baseline peak-hour detection hit rate: 0.2941
- MAE delta (ML - baseline): -1.2215
- RMSE delta (ML - baseline): -1.3031

## Top Zones By Forecast Error
- `tan binh`: MAE=3.0592, baseline_MAE=7.5000, actual_booking_sum=9.0
- `tan phu`: MAE=2.8762, baseline_MAE=4.0000, actual_booking_sum=10.0
- `quan 8`: MAE=1.0053, baseline_MAE=3.0000, actual_booking_sum=6.0
- `quan 6`: MAE=0.5579, baseline_MAE=2.0000, actual_booking_sum=4.0
- `quan 3`: MAE=0.5579, baseline_MAE=2.5000, actual_booking_sum=4.0
- `phu nhuan`: MAE=0.5053, baseline_MAE=1.5000, actual_booking_sum=5.0
- `quan 1`: MAE=0.4545, baseline_MAE=2.0000, actual_booking_sum=3.0
- `quan 12`: MAE=0.2474, baseline_MAE=0.5000, actual_booking_sum=2.0
- `quan 10`: MAE=0.2474, baseline_MAE=0.5000, actual_booking_sum=2.0
- `quan 11`: MAE=0.1830, baseline_MAE=0.5000, actual_booking_sum=3.0

## Warnings
- Training history spans fewer than three hourly timestamps, so lag-based learning is extremely limited.
- 17 zones have fewer than two training rows, so the model falls back to a global pattern with zone indicators.

## Prototype Limitations
- The demand history contains only three hourly timestamps, so meaningful time-series generalization is not possible yet.
- Search and booking counts are synthetic and concentrated in a narrow window, which makes both lag features and zone effects unusually brittle.
- A global model with zone one-hot features is used because per-zone forecasting would be too sparse for this dataset.

## Recommendation
- This forecasting setup is prototype-ready only. It is useful for validating data flow and metric computation, but it is not operationally useful until much longer real history is collected.
