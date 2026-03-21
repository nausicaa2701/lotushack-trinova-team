**Detected Backend Architecture**

- FastAPI app with a central router mounted under `/api` via [main.py](/Users/nausicaa/Documents/GitHub/lotushack-trinova-team/EcoCare-BE/app/main.py) and [router.py](/Users/nausicaa/Documents/GitHub/lotushack-trinova-team/EcoCare-BE/app/api/router.py).
- Lightweight route-first structure: most business logic currently lives directly inside route modules.
- SQLAlchemy session injection from [deps.py](/Users/nausicaa/Documents/GitHub/lotushack-trinova-team/EcoCare-BE/app/api/deps.py) is unchanged.
- Existing `/api` contract and FE-friendly JSON shape were preserved instead of introducing a new `/api/v1` stack.

**Files Created**

- [ai_serving.py](/Users/nausicaa/Documents/GitHub/lotushack-trinova-team/EcoCare-BE/app/services/ai_serving.py)
- [__init__.py](/Users/nausicaa/Documents/GitHub/lotushack-trinova-team/EcoCare-BE/app/services/__init__.py)
- [merchants.py](/Users/nausicaa/Documents/GitHub/lotushack-trinova-team/EcoCare-BE/app/api/routes/merchants.py)
- [slots.py](/Users/nausicaa/Documents/GitHub/lotushack-trinova-team/EcoCare-BE/app/api/routes/slots.py)
- [forecast.py](/Users/nausicaa/Documents/GitHub/lotushack-trinova-team/EcoCare-BE/app/api/routes/forecast.py)
- [api_source_analysis.md](/Users/nausicaa/Documents/GitHub/lotushack-trinova-team/.prompt/reports/api_source_analysis.md)

**Files Modified**

- [search.py](/Users/nausicaa/Documents/GitHub/lotushack-trinova-team/EcoCare-BE/app/api/routes/search.py)
- [router.py](/Users/nausicaa/Documents/GitHub/lotushack-trinova-team/EcoCare-BE/app/api/router.py)
- [config.py](/Users/nausicaa/Documents/GitHub/lotushack-trinova-team/EcoCare-BE/app/core/config.py)
- [geo.py](/Users/nausicaa/Documents/GitHub/lotushack-trinova-team/EcoCare-BE/app/core/geo.py)
- [__init__.py](/Users/nausicaa/Documents/GitHub/lotushack-trinova-team/EcoCare-BE/app/schemas/__init__.py)

**Endpoints Added Or Upgraded**

- `POST /api/search/nearby`
  Upgraded to use processed artifact baseline ranking first, with DB fallback to the previous simple merchant search logic.
- `POST /api/search/on-route`
  Upgraded to use processed artifact corridor ranking first, with DB fallback to the previous simple route-proxy search logic.
- `GET /api/merchants/{merchant_id}`
  New merchant detail endpoint.
- `POST /api/slots/recommend`
  New heuristic slot recommendation endpoint.
- `GET /api/forecast/zones/{zone_id}`
  New zone-level forecast endpoint.
- `GET /api/forecast/summary`
  New dashboard-style forecast summary endpoint.

**Data Sources Used Per Endpoint**

- Nearby search:
  - Primary: `Dataset/ProcessedData/merchant_ranking_features.csv`
  - Fallback: PostgreSQL `merchants` table
- On-route search:
  - Primary: `Dataset/ProcessedData/merchant_ranking_features.csv`
  - Fallback: PostgreSQL `merchants` table
- Merchant detail:
  - Primary: `Dataset/ProcessedData/merchant_ranking_features.csv`
  - Fallback: PostgreSQL `merchants` table
- Slot recommendation:
  - Merchant context: `Dataset/ProcessedData/merchant_ranking_features.csv`
  - Slot history/templates: `Dataset/ProcessedData/slot_events.csv`
- Forecast by zone / summary:
  - Primary: `Dataset/ProcessedData/models/demand_forecast_predictions.csv`

**Fallback Behavior**

- Ranking/search:
  - File-backed baseline ranking is the default serving path.
  - If processed artifacts are unavailable, search endpoints fall back to the previously working DB merchant logic.
- Merchant detail:
  - Uses artifact-backed richer merchant data when available.
  - Falls back to DB merchant data if artifacts are missing.
- Slot recommendation:
  - Heuristic slot scoring only.
  - If historical slot rows for a merchant are sparse or absent, deterministic demo-safe slot templates are generated.
- Forecast:
  - Uses forecast prediction file only.
  - Missing forecast artifacts return a controlled `503` response instead of breaking startup.
- Optional ML models:
  - No model artifact is required at startup.
  - Primary logic stays rule-based and file-backed as requested.

**Assumptions**

- Existing FE compatibility matters more than introducing `/api/v1`, so all new work stays under the current `/api` prefix.
- `merchant_ranking_features.csv` is the richest artifact and is safe to treat as the primary merchant-serving dataset.
- `slot_events.csv` is sufficient to derive stable slot-time templates for a heuristic recommender.
- Forecast dashboard consumers can work from `demand_forecast_predictions.csv` without requiring a database table yet.

**TODOs For Future DB Migration**

- Move Phase 3 to Phase 11 artifact fields into stable PostgreSQL tables or materialized views so serving does not depend on CSV access.
- Add a real repository abstraction if both file and DB sources must coexist for longer.
- Replace heuristic slot recommendation with a model toggle only after online inventory and real labels exist.
- Revisit admin ranking rules if they should eventually drive the new baseline weights.
- Add authenticated/provider-safe access controls if merchant detail, slot, or forecast endpoints become tenant-sensitive.

**Local Verification Guide**

- Syntax check:
  - `python3 -m py_compile EcoCare-BE/app/core/config.py EcoCare-BE/app/core/geo.py EcoCare-BE/app/services/ai_serving.py EcoCare-BE/app/api/routes/search.py EcoCare-BE/app/api/routes/merchants.py EcoCare-BE/app/api/routes/slots.py EcoCare-BE/app/api/routes/forecast.py EcoCare-BE/app/api/router.py EcoCare-BE/app/schemas/__init__.py`
- Artifact-backed service smoke check:
  - Import `app.services.ai_serving` and run nearby search, on-route search, merchant detail, slot recommendations, and forecast summary against `Dataset/ProcessedData`.
- Repo note:
  - No backend test suite was present in `EcoCare-BE`, so no existing pytest pattern was extended in this change.
