Load the files:
- LocationCarWash - TPHCM.csv
- LocationCarWashReview - TPHCM_Reviews.csv

Build a Phase 2 data cleaning pipeline in Python.

Tasks:
1. Rename merchant and review columns to normalized snake_case names.
2. Drop irrelevant crawl/debug columns.
3. Clean text fields by trimming spaces and creating normalized versions for merchant_name and address.
4. Convert latitude, longitude, and rating from Vietnamese decimal strings to numeric values.
5. Validate geo coordinates and rating ranges.
6. Remove rows missing merchant_name or both address and coordinates.
7. Detect duplicate merchants by merchant_id and by normalized merchant_name + normalized address.
8. Aggregate review data by merchant_id:
   - review_row_count
   - review_rating_avg_from_reviews
   - review_text_count
   - has_review_text
9. Join merchant_clean with merchant_review_agg into merchant_master.
10. Save outputs:
   - data/processed/merchant_clean.csv
   - data/processed/merchant_review_agg.csv
   - data/processed/merchant_master.csv
   - reports/phase2_cleaning_report.md

Also print a summary:
- input row count
- cleaned row count
- duplicate count
- invalid geo count
- missing value summary

You are implementing Phase 3 for the EcoCare project.

Project context:
- Input data is already cleaned from Phase 2.
- Input folder: Dataset/ProcessedData
- Python scripts for this phase must be placed in: EcoCare-BE/DataPreprocessing
- Reports for this phase must be placed in: .prompt/reports

Goal of Phase 3:
Build geo-ready and ranking-ready merchant datasets from the existing merchant master data.

Input files:
- Dataset/ProcessedData/merchant_master.csv

Required outputs:
- Dataset/ProcessedData/merchant_geo_ready.csv
- Dataset/ProcessedData/merchant_ranking_features.csv
- .prompt/reports/phase3_feature_report.md

Tasks:
1. Load merchant_master.csv safely with proper encoding handling.
2. Normalize location-related text fields:
   - district
   - address
   - merchant_name
3. Create geo-ready fields:
   - is_valid_geo
   - geo_point_wkt using POINT(longitude latitude)
   - searchable_location_text by combining merchant_name, address, district
   - district_norm
4. Create availability proxy features:
   - is_open_info_available
   - is_open_now_proxy
   - hours_text_clean
   Rules:
   - if open_state contains text meaning "open now", set is_open_now_proxy = 1
   - if open_state contains text meaning "closed", set is_open_now_proxy = 0
   - otherwise set null or unknown-safe default
5. Build service taxonomy flags using keyword rules from:
   - merchant_name
   - merchant_type
   - merchant_types
   Create these boolean columns:
   - service_exterior_wash
   - service_interior_cleaning
   - service_detailing
   - service_ceramic
   - service_ev_safe
   - service_fast_lane
   - service_car_supported
   - service_motorbike_supported
6. Create ranking baseline features:
   - rating_score
   - review_volume_score
   - trust_score
   - open_score
   - service_richness_score
   - unclaimed_penalty
   - base_rank_score
   Suggested rules:
   - rating_score: normalize rating to 0-1
   - review_volume_score: log-scaled normalized review count
   - trust_score: combine rating_score, review_volume_score, and review text availability
   - open_score: 1 if open, 0.5 if unknown, 0 if closed
   - service_richness_score: normalized count of active service_* flags
   - unclaimed_penalty: small negative adjustment if unclaimed listing is true
   - base_rank_score: weighted combination of the above
7. Save:
   - merchant_geo_ready.csv
   - merchant_ranking_features.csv
8. Generate a report at .prompt/reports/phase3_feature_report.md containing:
   - input row count
   - output row count
   - geo-valid merchant count
   - merchant count by district
   - counts of each service_* flag
   - summary stats for ranking features
   - any assumptions and fallback rules used
9. Print a concise terminal summary after execution.

Implementation requirements:
- Use Python and pandas
- Keep code modular and readable
- Put the main script in EcoCare-BE/DataPreprocessing
- Prefer creating:
  - EcoCare-BE/DataPreprocessing/phase3_feature_engineering.py
- Add helper functions for:
  - text normalization
  - open_state parsing
  - service taxonomy mapping
  - feature scoring
- Handle missing columns gracefully
- Do not overwrite source files
- Use relative paths exactly as specified

Success criteria:
- merchant_geo_ready.csv is created successfully
- merchant_ranking_features.csv is created successfully
- phase3_feature_report.md is created successfully
- no critical crash on missing optional columns

You are implementing Phase 4 for the EcoCare project.

Project context:
- Phase 3 output already exists in Dataset/ProcessedData
- Input folder: Dataset/ProcessedData
- Python scripts for this phase must be placed in: EcoCare-BE/DataPreprocessing
- Reports for this phase must be placed in: .prompt/reports

Goal of Phase 4:
Build retrieval and rule-based ranking baseline for nearby search and route-based search.

Input files:
- Dataset/ProcessedData/merchant_geo_ready.csv
- Dataset/ProcessedData/merchant_ranking_features.csv

Required outputs:
- Dataset/ProcessedData/queries_nearby_sample.csv
- Dataset/ProcessedData/queries_on_route_sample.csv
- Dataset/ProcessedData/retrieval_results_nearby.csv
- Dataset/ProcessedData/retrieval_results_on_route.csv
- Dataset/ProcessedData/ranking_results_nearby.csv
- Dataset/ProcessedData/ranking_results_on_route.csv
- .prompt/reports/phase4_retrieval_ranking_report.md

Tasks:
1. Load merchant_geo_ready.csv and merchant_ranking_features.csv.
2. Merge them into a single working dataframe for retrieval and ranking.
3. Implement nearby search baseline:
   - input: user latitude, longitude, radius_km, optional filters
   - compute haversine distance from user to merchant
   - keep merchants within radius
   - filter by:
     - is_valid_geo
     - optional is_open_now_proxy
     - optional service_* flags
     - optional min rating
   - return candidate list
4. Implement route-based search baseline:
   - input: origin lat/lng, destination lat/lng, max corridor distance threshold
   - simulate route with a straight-line baseline if routing engine is not available
   - compute merchant distance to route corridor approximately
   - keep merchants within route corridor threshold
   - compute approximate detour proxy
   - filter by optional service/rating/open flags
   - return candidate list
5. Create sample query datasets:
   - queries_nearby_sample.csv
   - queries_on_route_sample.csv
   If no real user queries exist, generate synthetic but realistic sample queries using the geographic spread of merchants.
6. Build rule-based ranking baseline for candidate merchants.

Nearby ranking formula:
- distance score: 35%
- rating score: 20%
- review_volume_score: 10%
- trust_score: 10%
- open_score: 10%
- service_richness_score: 10%
- unclaimed_penalty: 5%

On-route ranking formula:
- route match / route distance score: 30%
- detour proxy score: 20%
- rating score: 15%
- review_volume_score: 10%
- trust_score: 10%
- open_score: 10%
- service_richness_score: 5%

7. For each query, produce ranked results with:
   - query_id
   - merchant_id
   - merchant_name
   - distance_km or route_distance_proxy
   - detour_proxy if route search
   - base_rank_score
   - final_rank_score
   - rank_position
   - reason_tags
8. Save:
   - retrieval_results_nearby.csv
   - retrieval_results_on_route.csv
   - ranking_results_nearby.csv
   - ranking_results_on_route.csv
9. Generate a report at .prompt/reports/phase4_retrieval_ranking_report.md containing:
   - total merchants loaded
   - total nearby queries
   - total on-route queries
   - average candidate count per nearby query
   - average candidate count per on-route query
   - top merchants appearing most frequently
   - summary of ranking score distribution
   - assumptions for route approximation
   - known limitations before real user log data exists
10. Print a concise terminal summary after execution.

Implementation requirements:
- Use Python and pandas
- Keep code modular
- Put the main script in EcoCare-BE/DataPreprocessing
- Prefer creating:
  - EcoCare-BE/DataPreprocessing/phase4_retrieval_ranking_baseline.py
- Add helper functions for:
  - haversine distance
  - point-to-line distance approximation
  - nearby retrieval
  - route retrieval
  - score normalization
  - reason tag generation
- Use synthetic query generation if no real query file exists
- Do not require external routing API in this phase
- Do not overwrite source files

Success criteria:
- sample queries are generated
- nearby retrieval works
- on-route retrieval works with approximate corridor logic
- ranked result files are generated
- phase4 report is generated successfully