# Phase 3 Feature Report

## Row Counts
- Input row count: 539
- Output row count: 539
- Geo-valid merchant count: 539

## Merchant Count By District
- `binh tan`: 23
- `binh thanh`: 46
- `cu chi`: 1
- `go vap`: 45
- `hoc mon`: 39
- `nha be`: 10
- `phu nhuan`: 31
- `quan 1`: 44
- `quan 10`: 13
- `quan 11`: 17
- `quan 12`: 43
- `quan 3`: 14
- `quan 4`: 6
- `quan 5`: 4
- `quan 6`: 37
- `quan 7`: 25
- `quan 8`: 35
- `tan binh`: 48
- `tan phu`: 37
- `thu duc`: 21

## Service Flag Counts
- `service_exterior_wash`: 513
- `service_interior_cleaning`: 4
- `service_detailing`: 41
- `service_ceramic`: 0
- `service_ev_safe`: 2
- `service_fast_lane`: 17
- `service_car_supported`: 462
- `service_motorbike_supported`: 61

## Ranking Feature Summary Stats

| metric | rating_score | review_volume_score | trust_score | open_score | service_richness_score | unclaimed_penalty | base_rank_score |
| --- | --- | --- | --- | --- | --- | --- | --- |
| count | 539.0 | 539.0 | 539.0 | 539.0 | 539.0 | 539.0 | 539.0 |
| mean | 0.705269 | 0.282694 | 0.463822 | 0.864564 | 0.255102 | -0.031076 | 0.486239 |
| std | 0.356904 | 0.211278 | 0.237599 | 0.249956 | 0.078301 | 0.024273 | 0.173784 |
| min | 0.0 | 0.0 | 0.0 | 0.0 | 0.0 | -0.05 | 0.075 |
| 25% | 0.6 | 0.100549 | 0.408852 | 1.0 | 0.25 | -0.05 | 0.39008 |
| 50% | 0.86 | 0.259914 | 0.535192 | 1.0 | 0.25 | -0.05 | 0.539296 |
| 75% | 1.0 | 0.41928 | 0.605424 | 1.0 | 0.25 | 0.0 | 0.612103 |
| max | 1.0 | 1.0 | 0.95771 | 1.0 | 0.5 | 0.0 | 0.849357 |

## Assumptions And Fallback Rules
- CSV loading tries utf-8, utf-8-sig, cp1258, then latin1 to reduce encoding failures.
- Location text normalization trims whitespace and builds ASCII-friendly normalized keys for search and grouping.
- Open-state proxy maps phrases like 'Dang mo cua' and 'Mo ca ngay' to open=1, phrases containing closed states to open=0, and unknown or scheduled states to a neutral score of 0.5.
- Service taxonomy flags are keyword-based heuristics across normalized merchant_name, merchant_type, and merchant_types.
- Review volume uses the larger of review_row_count and review_count_source before applying log normalization.
- Base ranking score uses a weighted blend of trust, open status, service richness, rating, review volume, and a small penalty for unclaimed listings.
- Missing optional columns are created with safe defaults so the script completes without critical crashes.
