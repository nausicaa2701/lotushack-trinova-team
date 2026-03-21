# Phase 2 Cleaning Report

## Inputs
- Merchant input file: `Dataset/RawData/LocationCarWash - TPHCM.csv`
- Review input file: `Dataset/RawData/LocationCarWashReview - TPHCM_Reviews.csv`
- Merchant input row count: 539

## Merchant Cleaning Summary
- Cleaned row count: 539
- Rows removed for missing merchant name: 0
- Rows removed for missing address and coordinates: 0
- Invalid geo count: 0
- Invalid rating count: 0
- Duplicate count: 0
- Duplicate rows by merchant_id: 0
- Duplicate rows by normalized merchant_name + normalized address: 0

## Review Aggregation Summary
- Review aggregate row count: 47
- Merchant master row count: 539

## Missing Value Summary
- `website`: 466
- `phone`: 147
- `hours`: 112
- `merchant_name`: 0
- `address`: 0
- `latitude`: 0
- `longitude`: 0
- `rating`: 0

## Output Files
- `data/processed/merchant_clean.csv`
- `data/processed/merchant_review_agg.csv`
- `data/processed/merchant_master.csv`
