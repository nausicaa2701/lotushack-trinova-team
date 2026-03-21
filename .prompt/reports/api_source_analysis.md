**Backend Architecture**

- Framework: FastAPI application in [main.py](/Users/nausicaa/Documents/GitHub/lotushack-trinova-team/EcoCare-BE/app/main.py).
- Entrypoint behavior: creates SQLAlchemy tables on startup, exposes `/health`, and mounts a central API router under `settings.api_prefix` which currently defaults to `/api`.
- Router structure: feature routers live in [app/api/routes](/Users/nausicaa/Documents/GitHub/lotushack-trinova-team/EcoCare-BE/app/api/routes) and are registered centrally in [router.py](/Users/nausicaa/Documents/GitHub/lotushack-trinova-team/EcoCare-BE/app/api/router.py).
- Service layer: there is no real service layer yet; most route modules contain direct business logic plus DB access.
- Config/env handling: [config.py](/Users/nausicaa/Documents/GitHub/lotushack-trinova-team/EcoCare-BE/app/core/config.py) uses `pydantic-settings` with `.env` loading.
- DB/session pattern: [database.py](/Users/nausicaa/Documents/GitHub/lotushack-trinova-team/EcoCare-BE/app/core/database.py) provides a global SQLAlchemy engine and `SessionLocal`, with request-scoped DB injection from [deps.py](/Users/nausicaa/Documents/GitHub/lotushack-trinova-team/EcoCare-BE/app/api/deps.py).
- Schema/DTO style: lightweight Pydantic models in [app/schemas/__init__.py](/Users/nausicaa/Documents/GitHub/lotushack-trinova-team/EcoCare-BE/app/schemas/__init__.py); response payloads are mostly direct FE-friendly JSON objects, often camelCase, not a wrapped `data/meta/message` envelope.
- Logging pattern: no dedicated structured logging layer was found; current routes mostly return responses or raise `HTTPException`.
- Health/CORS: `/health` already exists and CORS is configured in [main.py](/Users/nausicaa/Documents/GitHub/lotushack-trinova-team/EcoCare-BE/app/main.py) for local FE origins.
- Docker/runtime assumptions: [docker-compose.yml](/Users/nausicaa/Documents/GitHub/lotushack-trinova-team/EcoCare-BE/docker-compose.yml) currently provisions PostgreSQL only. Backend dependencies in [requirements.txt](/Users/nausicaa/Documents/GitHub/lotushack-trinova-team/EcoCare-BE/requirements.txt) are intentionally minimal and do not currently include `pandas`.

**Current Integration Attach Points**

- Nearby search and on-route search already exist in [search.py](/Users/nausicaa/Documents/GitHub/lotushack-trinova-team/EcoCare-BE/app/api/routes/search.py). These are the safest endpoints to extend so FE contracts remain stable.
- Merchant detail should be added as a new merchant-focused route module and registered in the central router.
- Slot recommendation should be added as a new route module because no slot-serving endpoint exists yet.
- Forecast endpoints should be added as a new route module using prediction artifacts from `Dataset/ProcessedData/models`.
- File-backed artifact loading should be encapsulated behind a small repository/service module so later PostgreSQL migration only swaps the data source, not the route contracts.

**Files That Should Be Extended**

- [app/api/routes/search.py](/Users/nausicaa/Documents/GitHub/lotushack-trinova-team/EcoCare-BE/app/api/routes/search.py)
  Use existing `/search/nearby` and `/search/on-route` endpoints as the production-safe attachment point for baseline ranking logic.
- [app/api/router.py](/Users/nausicaa/Documents/GitHub/lotushack-trinova-team/EcoCare-BE/app/api/router.py)
  Register any new merchant/slot/forecast routers.
- [app/schemas/__init__.py](/Users/nausicaa/Documents/GitHub/lotushack-trinova-team/EcoCare-BE/app/schemas/__init__.py)
  Add only the request/response models needed for new endpoints while keeping naming and validation style consistent.
- [app/core/config.py](/Users/nausicaa/Documents/GitHub/lotushack-trinova-team/EcoCare-BE/app/core/config.py)
  Add small compatible settings for processed-data/model artifact paths.

**New Files Needed**

- A small file-backed AI repository/service module under `app/` to:
  - lazily load processed merchant and forecast artifacts
  - merge merchant geo and ranking fields
  - expose nearby search, on-route search, merchant detail, slot recommendation, and forecast helpers
  - keep startup safe when optional files are missing
- New route modules for:
  - merchant detail
  - slot recommendation
  - forecast access
- A Phase B summary report at `.prompt/reports/api_integration_summary.md`

**What Must Not Be Touched**

- Existing startup DB table creation in [main.py](/Users/nausicaa/Documents/GitHub/lotushack-trinova-team/EcoCare-BE/app/main.py)
- Current PostgreSQL configuration and session pattern in [config.py](/Users/nausicaa/Documents/GitHub/lotushack-trinova-team/EcoCare-BE/app/core/config.py) and [database.py](/Users/nausicaa/Documents/GitHub/lotushack-trinova-team/EcoCare-BE/app/core/database.py)
- Existing Docker strategy in [docker-compose.yml](/Users/nausicaa/Documents/GitHub/lotushack-trinova-team/EcoCare-BE/docker-compose.yml)
- Existing auth and non-AI route behavior unless a minimal compatibility adjustment is required
- Existing FE-facing `/api` base path and current JSON response style

**Recommended Integration Strategy**

- Keep `/api/search/nearby` and `/api/search/on-route` as the serving endpoints and make them smarter internally.
- Prefer file-backed processed datasets for the new AI-adjacent features because the current database schema does not yet store the richer Phase 3 to Phase 11 artifacts.
- Keep all artifact reads lazy and request-time safe; missing files should raise controlled `HTTPException` errors instead of failing app startup.
- Avoid introducing a heavy new architecture. A thin repository/service layer is enough to separate route handling from file access and ranking heuristics.
