# Epic: EV/Hybrid Car Wash Recommendation & Booking Platform

## 1. Epic Overview

Build a multi-role platform for **EV/Hybrid car wash discovery, recommendation, ranking, booking, and partner operations**.

The platform serves 3 user groups:

1. **Vehicle Owners**
   - Find nearby car wash providers
   - Find car wash providers along a travel route
   - Receive recommended providers and suggested booking time slots
   - Book, pay, track, and review service

2. **Car Wash Service Providers**
   - Join the Tasco ecosystem
   - Manage store profile, services, pricing, schedules, bookings
   - Improve visibility through boosted display / pop-up campaigns
   - Track ratings, successful orders, and conversion performance

3. **Platform Admin**
   - Manage users, merchants, campaigns, bookings, disputes
   - Monitor marketplace health and service quality
   - Configure ranking/recommendation rules
   - Oversee analytics and AI model rollout

This epic focuses on **car wash only**, with AI centered on:
- recommendation by current location and route
- provider ranking
- time slot recommendation
- optional demand forecasting

### 1.1 Current implementation snapshot (this repository)

The sections below remain the **product / architecture target**. This subsection records **what exists today** in `lotushack-trinova-team` so planning stays aligned with code.

**Monorepo layout (actual paths)**

| Area | Location | Notes |
|------|----------|--------|
| Frontend | `EcoCare-UI/` | Product UI brand **WashNet**; folder name legacy **EcoCare-UI**. |
| Backend API | `EcoCare-BE/` | **FastAPI** + SQLAlchemy + PostgreSQL (not NestJS). |
| Datasets & artifacts | `Dataset/ProcessedData/` | Cleaned merchants, interaction CSVs, training data, `models/*.pkl` / `*.txt`, eval CSVs. |
| Preprocessing / ML scripts | `EcoCare-BE/DataPreprocessing/` | Phased pipelines (e.g. cleaning, retrieval, ranking/slot/demand training). |
| Phase reports | `.prompt/reports/` | Markdown reports per pipeline phase. |
| Container orchestration | `docker-compose.yml` (repo root) | `db` (Postgres 16), `backend` (:8000), `frontend` (:3000); `VITE_API_BASE_URL` points at backend. |
| n8n | `n8n_workflow/*.json` | **Exported workflows only**; not wired into `docker-compose` for booking/reminder automation yet. |

**Frontend (`EcoCare-UI`) — implemented**

- Stack: **Vite, React, TypeScript, PrimeReact, Tailwind**; **React Router**; **Leaflet** (react-leaflet) for map explore; **lucide-react** icons; mock data under `public/mock/*.json` and aggregate `platform-data.json`.
- Single app shell with **nested routes** and **role-based screens**: owner (`/owner/*`), provider (`/provider/*`), admin (`/admin/*`); public **Landing** and **Login**.
- **Auth**: `AuthContext` + `ProtectedRoute`; client-side role guards; **Login** may call `POST {API}/api/auth/login` and merge with mock user list when API is available.
- **Explore**: nearby / on-route search UI with filters; API base from `VITE_API_BASE_URL` with mock fallback.
- **Global search / location**: TopBar search (incl. voice UI with placeholder transcription), browser geolocation handling.
- **Not fully aligned with epic “recommended FE libs”**: TanStack Query, Zustand, React Hook Form, Zod are **not** adopted as the default stack-wide pattern yet.

**Backend (`EcoCare-BE`) — implemented**

- **FastAPI** app: `GET /health`, API under configurable prefix (e.g. `/api`).
- **Database**: PostgreSQL; SQLAlchemy models in `app/models/`; `create_all` on startup (no Alembic called out in epic doc).
- **Auth**: `POST /api/auth/login` returns opaque `token_*` / `refresh_*` strings; `GET /api/auth/me` and role switch; **`get_current_user` uses `X-User-Id` header** (not JWT Bearer) — differs from epic’s JWT-first security story.
- **Domains (routers)**: `auth`, `routes` (preview), `search`, `merchants`, `slots`, `forecast`, `platform`, `owners`, `providers`, `admin`.
- **Search**: Haversine / in-process geo filtering (not PostGIS in DB).
- **AI serving**: `app/services/ai_serving.py` loads **offline artifacts** from `Dataset/ProcessedData/models/` where available, with **rule / DB fallback** on failure.
- **Seed**: `scripts/seed_from_mock.py` loads JSON from `EcoCare-UI/public/mock` (or `/mock` in container).

**Data / AI pipeline — implemented (offline)**

- Raw → processed: e.g. `merchant_master.csv`, `merchant_clean.csv`, retrieval/ranking/slot/demand CSVs and model files under `Dataset/ProcessedData/`.
- Phases in code: e.g. `phase2_cleaning.py`, retrieval/ranking/slot/demand scripts — see `EcoCare-BE/DataPreprocessing/`.

**Gaps vs this epic (honest delta)**

- **Not implemented or partial**: payment, production-grade JWT + RBAC on every route, PostGIS, Redis/BullMQ workers, n8n-driven notifications, full booking state machine + notifications end-to-end, separate `apps/owner-web` style repos.
- **Ahead of “no ML first” for demos**: ranking/slot/demand **artifacts and training scripts** exist; product integration and online metrics still catch up.

---

## 2. Product Goals

### Business Goals
- Help EV/Hybrid owners find the most suitable car wash provider quickly
- Improve booking conversion through location-aware recommendation
- Enable merchants to join and grow within the Tasco ecosystem
- Create a scalable platform with measurable ranking and booking performance
- Prepare a clean foundation for future AI expansion

### User Goals
- Owners can discover the right car wash with minimal effort
- Providers can manage bookings and promote visibility
- Admin can operate the marketplace with quality control and insight

---

## 3. In Scope

### Core Scope
- Search nearby car wash providers
- Search providers along a route
- Recommendation engine for candidate providers
- Ranking engine for ordered provider results
- Time slot recommendation
- Booking flow
- Merchant onboarding and portal
- Admin monitoring dashboard
- Rating and review system
- Boosted visibility / pop-up campaign support
- Data logging for AI training

### Optional Scope
- Demand forecasting by area and time
- Loyalty / subscription
- Dynamic pricing
- Fraud detection
- Chatbot / voice assistant

---

## 4. Out of Scope

- Full vehicle maintenance ecosystem
- Charging station booking
- Insurance and repair workflows
- Native mobile app in first release
- Advanced personalization based on sensitive personal data
- Real-time bidding ads marketplace in MVP

---

## 5. User Roles and Permissions

## 5.1 Vehicle Owner
### Permissions
- Register / sign in
- Manage profile and vehicles
- Search nearby providers
- Search providers along route
- View provider details
- Book services
- Cancel / reschedule based on policy
- Pay for bookings
- View booking history
- Rate and review providers

### Core Features
- Current-location search
- Route-based search
- Recommended nearby provider
- Recommended on-route provider
- View rating and successful order count
- View available time slots
- Receive top-3 recommended slots
- Booking confirmation and reminders

---

## 5.2 Car Wash Service Provider
### Permissions
- Register as merchant
- Manage branch/store profile
- Manage services and pricing
- Manage operating hours and available slots
- Receive and process bookings
- Update booking status
- Upload before/after images
- View ratings, reviews, successful orders
- Create boosted visibility campaign request
- View campaign analytics

### Core Features
- Merchant onboarding
- Store profile management
- Service catalog management
- Slot and schedule management
- Booking operations dashboard
- Store reputation panel
- Visibility boost / pop-up registration
- Conversion and performance analytics

---

## 5.3 Admin
### Permissions
- Manage all users and merchants
- Approve / suspend merchants
- Monitor bookings and complaints
- Manage campaigns and visibility rules
- Configure ranking/recommendation weights
- View analytics dashboards
- Trigger manual review and fallback operations

### Core Features
- Merchant approval workflow
- Booking and dispute monitoring
- Campaign approval / moderation
- Marketplace health analytics
- Search behavior analytics
- Demand/supply overview
- AI rollout monitoring
- Audit and logging dashboard

---

## 6. Feature Breakdown

## 6.1 Vehicle Owner Features
- Sign up / login
- Profile and vehicle management
- Current GPS-based search
- Route-based search
- Provider detail view
- Filtering by:
  - distance
  - price
  - rating
  - EV-safe
  - open now
  - available slots
- Recommendation cards:
  - nearest
  - on route
  - top rated nearby
  - available now
- Booking flow
- Payment flow
- Booking history
- Review and rating
- Notifications and reminders

## 6.2 Service Provider Features
- Merchant registration
- Merchant approval status tracking
- Branch/store management
- Service package management
- Schedule/slot management
- Booking processing
- Status updates
- Before/after photo upload
- Reputation dashboard:
  - rating
  - successful orders
  - review count
- Boost campaign request
- Campaign performance dashboard

## 6.3 Admin Features
- User management
- Merchant management
- Merchant approval and suspension
- Booking monitoring
- Dispute management
- Review moderation
- Campaign moderation
- Ranking rule configuration
- AI metrics dashboard
- Analytics and reporting

---

## 7. Functional Requirements

## 7.1 Search and Recommendation
The system must:
- allow owners to search providers near their current location
- allow owners to search providers along a route from origin to destination
- retrieve eligible providers within configured geographic thresholds
- exclude providers that are closed or unavailable
- return recommended providers with clear reason codes
- support filtering and sorting

### Reason Codes
- nearest_to_you
- on_your_route
- top_rated_nearby
- available_now
- best_time_fit

---

## 7.2 Ranking
The system must:
- rank provider candidates after retrieval
- support baseline rule-based ranking
- support future ML ranking model
- consider features such as:
  - distance
  - route match
  - ETA
  - rating
  - review count
  - successful order count
  - cancellation rate
  - on-time rate
  - slot availability
  - price fit
  - boost score

---

## 7.3 Time Slot Recommendation
The system must:
- display available slots for each provider
- recommend top-3 slots
- support rule-based scoring in MVP
- log shown vs selected slots for future model training

---

## 7.4 Booking
The system must:
- allow owners to create booking requests
- allow providers to confirm / reject / reschedule bookings
- notify owners of booking changes
- update booking states consistently

### Booking States
- pending
- confirmed
- in_progress
- completed
- cancelled
- rejected
- refunded

---

## 7.5 Ratings and Reviews
The system must:
- allow owners to rate providers after completed bookings
- calculate average rating per provider
- expose successful completed order count
- store review text and moderation status

---

## 7.6 Campaign Boost
The system must:
- allow providers to request boosted visibility
- support configuration by:
  - area
  - time range
  - keyword or segment
- expose campaign performance metrics
- allow admin approval / rejection / suspension

---

## 8. Non-Functional Requirements

### Responsiveness
- FE must be responsive across desktop, tablet, and mobile browsers
- layouts must remain usable on common breakpoints
- map, cards, filters, and tables must adapt gracefully

### Performance
- search response should be fast enough for interactive use
- ranking and recommendation APIs must support caching and fallback
- booking flow must be reliable under concurrent usage

### Security
- RBAC by role
- secure authentication and token handling
- anonymization for owner data used in AI
- audit trail for admin and merchant actions

### Reliability
- fallback from ML model to rule engine
- retry-safe booking and notification flow
- observability for FE, BE, and AI services

### Maintainability
- modular architecture
- separate FE portals by role
- BE service separation by domain
- model versioning and data versioning

---

## 9. Tech Stack

> **Note:** Subsections below list **epic target** first; **Implemented in this repo** bullets reflect `EcoCare-UI` / `EcoCare-BE` as of the snapshot in §1.1.

## 9.1 Frontend
**Mandatory Stack (epic)**
- Vite
- React
- TypeScript
- PrimeReact
- Tailwind CSS

**Implemented in this repo**
- Vite + React + TypeScript + PrimeReact + Tailwind
- React Router (nested routes, `Layout` + `Outlet`)
- Leaflet via react-leaflet (map explore)
- lucide-react icons; motion (animations) where used
- Mock JSON under `public/mock/`; `VITE_API_BASE_URL` for API calls

**Recommended Supporting Libraries (epic — optional / not default yet)**
- TanStack Query
- Zustand
- React Hook Form
- Zod
- Leaflet or Google Maps SDK *(Leaflet in use)*
- Chart.js or ECharts

### FE Requirements
- must support 3 role-based portals:
  - owner
  - provider
  - admin
- must use reusable shared components
- must support responsive design on multiple devices
- must implement route guards and role-based access
- must provide map-based search and list-based search views
- must provide loading, error, and empty states
- must be production-ready in UI structure, not demo-only

---

## 9.2 Backend
**Recommended Stack (epic — reference architecture)**
- Node.js
- NestJS
- TypeScript
- PostgreSQL
- Prisma ORM
- Redis
- BullMQ
- JWT auth
- REST API
- PostGIS for geospatial queries

**Implemented in this repo**
- **Python 3.12** + **FastAPI** + **Uvicorn**
- **PostgreSQL 16** (Docker service `db`; SQLAlchemy 2.x ORM)
- **REST** under `/api` (see `app/api/router.py`)
- **Geospatial**: application-level Haversine / route helpers in `app/core/geo.py` — **not** PostGIS types in the database
- **Auth**: email login endpoint; protected routes often use **`X-User-Id`** header — **not** full JWT validation as in epic §8
- **Redis / BullMQ**: **not** present in root `docker-compose.yml`

### BE Requirements
- modular domain-based services
- support geospatial search
- support route-based candidate retrieval
- support booking and campaign workflows
- expose analytics endpoints
- log all AI-relevant events
- support fallback ranking logic when AI service is unavailable

### Suggested Modules
- auth
- users
- vehicles
- merchants
- services
- bookings
- reviews
- campaigns
- notifications
- analytics
- recommendation
- admin

---

## 9.3 AI / Data
**Recommended Stack (epic)**
- Python
- FastAPI
- pandas
- numpy
- scikit-learn
- LightGBM and/or XGBoost
- Prophet for optional forecasting

**Implemented in this repo**
- **FastAPI** serves ranking / slot / forecast **inference** paths; training is **offline** in `EcoCare-BE/DataPreprocessing/` (pandas / ML libs per scripts).
- **Artifacts**: e.g. `Dataset/ProcessedData/models/` (LightGBM `.txt` / `.pkl`, eval CSVs); feature dictionaries and training CSVs alongside.
- **Input data**: `Dataset/RawData/`, `Dataset/ProcessedData/` (merchant tables, search/impression/click/booking/slot event CSVs where generated).

### AI Requirements
- start with rule-based baseline
- evolve to trainable ranking/slot models
- support offline evaluation and online fallback
- store features, predictions, explanations, and model version metadata

---

## 9.4 Workflow Automation
**Recommended Stack (epic)**
- n8n

**Implemented in this repo**
- **n8n**: workflow JSON exports under `n8n_workflow/` (e.g. crawlers); **no** n8n service in `docker-compose.yml` and **no** hard dependency from FastAPI for notifications yet.

### n8n Responsibilities
- booking notifications
- reminder workflows
- post-service review requests
- merchant onboarding approvals
- admin escalation workflows
- campaign approval notifications
- scheduled report delivery

---

## 10. High-Level Workflow

## 10.1 Owner Search Workflow
1. Owner opens search
2. System gets current location or route input
3. FE calls BE search API
4. BE retrieves candidate merchants by geo/routing rules
5. BE applies ranking
6. FE displays map + list + recommendation cards
7. Owner views details and books

## 10.2 Booking Workflow
1. Owner selects merchant and slot
2. FE sends booking request
3. BE validates slot and creates booking
4. Provider receives booking
5. Provider confirms / rejects / reschedules
6. n8n sends notifications
7. Owner receives update
8. After completion, owner is prompted for rating

## 10.3 Merchant Visibility Workflow
1. Merchant submits boosted visibility request
2. Admin reviews request or auto-approval rule applies
3. Approved campaign contributes boost score in ranking
4. Merchant sees impressions, clicks, and bookings

## 10.4 AI Training Workflow
1. FE and BE log search, click, slot, booking, and review events
2. Data pipeline validates and aggregates events
3. Training datasets are generated
4. Models are trained offline
5. Metrics are validated
6. Approved models are deployed behind fallback
7. Performance is monitored

---

## 11. AI Scope

## 11.1 Required Models
1. **Recommendation Model by Location and Route**
2. **Ranking Model for Car Wash Providers**
3. **Time Slot Recommendation Model**

## 11.2 Optional Model
4. **Demand Forecasting Model**

---

## 12. Data Requirements

## 12.1 Merchant Dataset
### Required Fields
- merchant_id
- name
- address
- district
- province
- latitude
- longitude
- operating_hours
- service_types
- price_range
- EV_safe_flag
- rating_avg
- review_count
- successful_order_count
- cancellation_rate
- response_rate
- on_time_rate
- slot_availability
- campaign_boost_score

### Source
- crawled merchant data
- manually verified merchant data
- internal booking and review logs
- geocoding and map enrichment

### Current repository outputs (reference)
- Processed merchant tables and features: `Dataset/ProcessedData/` (e.g. `merchant_master.csv`, `merchant_clean.csv`, `merchant_geo_ready.csv`, review aggregates).
- Cleaning / feature pipelines: `EcoCare-BE/DataPreprocessing/` (e.g. `phase2_cleaning.py` and later phases).
- Quality sign-off: see phase markdown reports under `.prompt/reports/` (not all epic §15 thresholds may be met yet).

### Quality Rules
- latitude/longitude valid for >= 95% of records
- duplicate merchant rate <= 2%
- required fields completeness >= 90%
- operating_hours parse success >= 95%

---

## 12.2 Owner/Event Dataset
### Required Fields
- anonymized_user_id
- vehicle_type
- home_area
- work_area
- search_timestamp
- current_lat
- current_lng
- origin
- destination
- route_id or route_polyline_ref
- merchant_impressions
- merchant_clicks
- booking_created
- booking_completed
- slot_shown
- slot_selected
- review_submitted
- weather_context
- holiday_flag
- weekday
- ETA

### Source
- internal event logging
- booking records
- map/routing service outputs
- weather API
- optional synthetic data only for prototyping

### Rule for Sensitive Data
- do not store direct personal identifiers in AI training dataset
- anonymize user IDs
- generalize home/work into zones, not exact addresses
- use synthetic owner data only for:
  - schema test
  - integration test
  - pipeline dry run
- do not use synthetic-only results as final production KPI evidence

---

## 12.3 Public / External Datasets
### Recommended Use
- map and routing foundation
- baseline experimentation
- temporal pattern benchmarking

### Accepted Sources
- OpenStreetMap / Overpass / OSRM for map and route logic
- public temporal demand datasets for forecasting experiments
- public location/check-in datasets only for non-production experimentation

### Rule
- public datasets may support experimentation
- final production model tuning must rely on internal merchant and interaction logs

---

## 13. Model Requirements

## 13.1 Recommendation Model by Location and Route
### Goal
Retrieve relevant candidate merchants based on current location or travel route.

### Inputs
- current location
- origin/destination
- route geometry
- merchant geolocation
- operating hours
- slot availability
- ETA
- route distance match

### Output
- candidate merchant list
- reason codes

### MVP Implementation
- rule-based retrieval using geo radius and route corridor
- no ML required initially

### Completion Metrics
- candidate coverage >= 95%
- retrieval latency p95 < 500 ms
- Recall@20 >= 0.80 on internal validation set

### Completion Rules
- closed/unavailable merchants excluded correctly
- route-based retrieval returns on-route candidates consistently
- result reason codes visible in API response

---

## 13.2 Ranking Model
### Goal
Sort candidate merchants by relevance and expected booking utility.

### Inputs
- distance score
- route match score
- ETA
- rating
- review count
- successful orders
- cancellation rate
- on-time rate
- price fit
- slot availability
- campaign boost
- repeat affinity

### Labels
- booked = highest relevance
- clicked = medium relevance
- impression = low relevance

### MVP Implementation
- weighted scoring formula

### Advanced Implementation
- LightGBM Ranker or XGBoost LambdaMART

### Completion Metrics
- baseline phase: Recall@10 >= 0.60
- ML phase: NDCG@10 >= 0.80
- ML phase: Recall@10 >= 0.80
- online CTR uplift >= 10% over baseline in controlled test

### Completion Rules
- model must outperform baseline before rollout
- fallback to weighted score must exist
- top features or reason codes must be explainable

---

## 13.3 Time Slot Recommendation Model
### Goal
Recommend top-3 booking slots most likely to be accepted by user.

### Inputs
- available slots
- search timestamp
- weekday/weekend
- ETA
- lead time
- weather
- user historical preferred time bucket
- merchant fill-rate by hour

### Labels
- selected slot = positive
- shown but not selected = negative

### MVP Implementation
- rule-based slot scoring

### Advanced Implementation
- LightGBMClassifier or ranking-based slot model

### Completion Metrics
- baseline phase: top-3 slot hit rate >= 0.60
- ML phase: balanced accuracy >= 0.80
- ML phase: AUC >= 0.85
- ML phase: top-3 slot hit rate >= 0.80

### Completion Rules
- API returns top-3 slots with reasons
- slot_shown and slot_selected logging must be complete
- if real slot logs are insufficient, keep rule engine in production

---

## 13.4 Demand Forecasting Model (Optional)
### Goal
Forecast booking/search demand by zone and hour/day.

### Inputs
- search counts
- booking counts
- zone
- time
- holiday flag
- weather
- campaign periods
- merchant capacity

### MVP Implementation
- Prophet baseline

### Completion Metrics
- MAPE <= 20%
- peak-hour detection success >= 80%

### Completion Rules
- dashboard must show predicted vs actual
- forecast must trigger alert when capacity threshold risk is exceeded

---

## 14. Implementation Phases

## Phase 0 — Foundation
### Goals
- establish FE/BE skeleton
- establish core datasets and logging
- establish merchant crawl and geo enrichment

### FE Deliverables
- project bootstrap with Vite + React + PrimeReact + Tailwind CSS
- responsive shell layouts for 3 roles
- auth flow and route guards
- shared design tokens and components
- **Implemented:** single `EcoCare-UI` app with owner/provider/admin route groups (not three separate `apps/*` packages).

### BE Deliverables
- **Implemented:** FastAPI bootstrap (`EcoCare-BE/app/main.py`), PostgreSQL + SQLAlchemy models, modular API routers (auth, search, merchants, slots, forecast, admin, …), `SearchLog` and related entities for AI-relevant logging.
- **Epic reference (not chosen for this repo):** NestJS bootstrap.
- **Partial vs epic:** RBAC as **header-based user context** (`X-User-Id`), not full JWT on all routes; **PostGIS not used** — geo in application code.
- **Not in default compose:** Redis, BullMQ, dedicated notification worker.
- **notification hooks:** defer to future integration (e.g. n8n or worker service).

### AI/Data Deliverables
- merchant dataset schema
- event schema
- route and geo retrieval prototype
- data validation rules

### Completion Metrics
- FE responsive score acceptable on desktop/tablet/mobile manually validated
- BE core API health checks pass
- merchant data completeness >= 90%
- AI event logging coverage >= 95% for required events

### Rule Check
- no phase exit until all required schemas are versioned
- no phase exit until role-based access works end-to-end

---

## Phase 1 — MVP Rule-Based Platform
### Goals
- ship working product with no mandatory ML
- enable search, booking, merchant operations, and admin monitoring

### FE Deliverables
- owner search page with map + list + filters
- provider dashboard with bookings and ratings
- admin dashboard with merchant approval and booking overview
- responsive booking flow
- **Implemented (partial vs full payment):** explore map, role dashboards, mock-backed flows; **payment** and **production booking** may still be incomplete — verify against latest `EcoCare-UI` screens and `EcoCare-BE` booking APIs.

### BE Deliverables
- nearby search endpoint
- route-based search endpoint
- weighted ranking endpoint
- slot recommendation endpoint
- booking workflow
- review workflow
- campaign request workflow

### AI/Data Deliverables
- rule-based recommendation retrieval
- weighted ranking
- rule-based slot recommendation
- logging for impressions/clicks/slot selection/bookings

### Completion Metrics
- search API p95 < 700 ms
- booking success rate >= 99% in QA
- baseline ranking Recall@10 >= 0.60
- baseline slot top-3 hit rate >= 0.60
- responsive UI validated on multiple devices/breakpoints

### Rule Check
- owner must complete search to booking flow without blocker
- provider must complete booking status updates without blocker
- admin must approve merchant and campaign without blocker

---

## Phase 2 — Ranking Model v1
### Goals
- replace or augment weighted ranking with ML ranking

### Data Preconditions
- sufficient search sessions collected
- impression/click/booking logs validated
- feature table versioned

### FE Deliverables
- ranking reason display
- experiment flag support if needed

### BE Deliverables
- feature extraction endpoint or batch pipeline
- model inference integration
- fallback strategy
- experiment logging

### AI Deliverables
- training pipeline
- offline evaluation
- deployment artifact
- monitoring dashboard

### Completion Metrics
- NDCG@10 >= 0.80
- Recall@10 >= 0.80
- CTR uplift >= 10% vs baseline
- fallback success 100% when model unavailable

### Rule Check
- no rollout unless model beats baseline offline
- no rollout unless online shadow mode is stable

---

## Phase 3 — Time Slot Model v1
### Goals
- improve slot acceptance through personalized recommendation

### Data Preconditions
- slot_shown and slot_selected logs available
- class balance reviewed
- enough real interactions collected

### FE Deliverables
- top-3 slot recommendation with reason labels
- slot feedback-ready UI

### BE Deliverables
- slot feature service
- slot inference endpoint
- slot decision logging completeness

### AI Deliverables
- slot model training
- balanced evaluation
- confidence thresholding

### Completion Metrics
- balanced accuracy >= 0.80
- AUC >= 0.85
- top-3 hit rate >= 0.80

### Rule Check
- remain on rule engine if real data is insufficient
- no production claim from synthetic-only dataset

---

## Phase 4 — Demand Forecasting (Optional)
### Goals
- support admin and merchant planning

### FE Deliverables
- demand forecast charts
- zone heatmap widgets

### BE Deliverables
- forecast serving endpoints
- zone-hour aggregation jobs

### AI Deliverables
- Prophet baseline
- forecast validation jobs
- alert thresholds

### Completion Metrics
- MAPE <= 20%
- peak detection success >= 80%

### Rule Check
- forecasts must be versioned and backtested
- alerts must be testable in staging

---

## 15. Dataset Completion Rules

## Merchant Dataset
A merchant dataset is considered complete when:
- required fields completeness >= 90%
- geo fields valid >= 95%
- duplicate rate <= 2%
- service catalog normalization completed
- operating hours parsable >= 95%

## Owner/Event Dataset
An interaction dataset is considered AI-ready when:
- all required event types are present
- event timestamp consistency >= 99%
- anonymization completed
- missing critical fields <= 5%
- event-to-booking linkage available

## Slot Dataset
A slot dataset is considered trainable when:
- slot_shown exists
- slot_selected exists
- merchant and search context are linkable
- positive and negative samples exist in sufficient quantity

---

## 16. FE Completion Rules

Frontend is considered complete for a phase when:
- all assigned role flows are implemented
- responsive layouts work on desktop/tablet/mobile
- loading/error/empty states exist
- forms include validation
- map and list views are usable
- accessibility basics are respected
- route guards and role guards work
- core screens match business workflow

### FE Quality Metrics
- no critical blocking bug in core flow
- Lighthouse responsive/usability quality acceptable in QA
- no layout breaking on target breakpoints
- API integration errors handled gracefully

---

## 17. BE Completion Rules

Backend is considered complete for a phase when:
- all phase APIs are implemented and documented
- auth and RBAC are enforced
- booking state transitions are valid
- search/ranking APIs meet latency targets
- logging and audit are enabled
- background jobs are idempotent where needed
- failure fallback exists for AI-dependent endpoints

### BE Quality Metrics
- API success rate in QA >= 99%
- p95 latency targets met
- no inconsistent booking transition
- no critical unhandled exception in logs during test cycles

---

## 18. AI Completion Rules

AI work is considered complete for a phase when:
- dataset schema is fixed and versioned
- offline training/evaluation is reproducible
- metrics meet threshold for that phase
- model artifacts are versioned
- inference contract is documented
- fallback rule engine exists
- monitoring logs are enabled

### AI Quality Metrics
- recommendation retrieval: Recall@20 >= 0.80
- ranking model: NDCG@10 >= 0.80, Recall@10 >= 0.80
- slot model: balanced accuracy >= 0.80, AUC >= 0.85
- forecasting: MAPE <= 20%

---

## 19. Suggested Directory / Ownership Structure

### Epic-style split (reference — multi-app monorepo)
- apps/owner-web
- apps/provider-portal
- apps/admin-portal
- packages/ui, packages/hooks, packages/types, packages/api-client
- services/api, services/worker, services/notification
- services/ai-recommendation, ai-ranking, ai-slot, ai-forecast-optional
- data/contracts, data/pipelines, data/validation, data/features

### Current repository (this project)
- **Frontend (single app, multi-role routes):** `EcoCare-UI/`
- **Backend API:** `EcoCare-BE/` (`app/` = API, models, services; `scripts/` = seed; `DataPreprocessing/` = offline ML/data)
- **Datasets & model artifacts:** `Dataset/RawData/`, `Dataset/ProcessedData/` (including `models/`)
- **Infra:** `docker-compose.yml`, `Dockerfile.backend`, `Dockerfile.frontend`
- **Optional automation exports:** `n8n_workflow/`

---

## 20. Final Delivery Rule

This epic is considered successfully delivered when:
1. all 3 roles can complete their primary workflows
2. FE is responsive and stable across target devices
3. BE APIs are stable, secure, and observable
4. merchant and interaction datasets are AI-ready
5. rule-based recommendation works end-to-end
6. ranking/slot AI phases only go live after metric thresholds are met
7. each phase has measurable acceptance criteria and fallback behavior

---

## 21. Execution Priority

### Highest Priority
- FE responsive shell and core pages
- BE merchant/search/booking foundation
- merchant crawl and geo normalization
- rule-based recommendation and ranking
- event logging

### Medium Priority
- provider analytics
- admin campaign controls
- ML ranking
- ML slot recommendation

### Lower Priority
- demand forecasting
- advanced personalization
- loyalty/subscription
- anomaly detection

---

## 22. Notes for Agent Execution

- Do not start with ML-first implementation.
- Start with reliable data contracts, logging, and rule-based flows.
- Treat synthetic owner data as bootstrap only, not final production evidence.
- Keep FE production-structured from day one.
- Every AI endpoint must have a deterministic fallback.
- Every phase must end with metric verification and documented pass/fail result.
- **When editing this epic:** reconcile claims with **§1.1 Current implementation snapshot** and the actual paths under `EcoCare-UI`, `EcoCare-BE`, and `Dataset/`.