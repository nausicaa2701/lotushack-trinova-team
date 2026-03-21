# EcoCare-BE

## Overview

EcoCare-BE is a FastAPI backend for authentication, platform bootstrap data, merchant discovery, slot recommendation, and AI-assisted forecast services.

It serves two types of data:

- Application data stored in PostgreSQL
- AI/recommendation artifacts loaded from `Dataset/ProcessedData`

## Tech Stack

- FastAPI
- SQLAlchemy 2
- PostgreSQL
- Pydantic v2
- Uvicorn

## Project Structure

- `app/main.py`: FastAPI app entrypoint and CORS setup
- `app/api/router.py`: top-level API router registration
- `app/api/routes`: feature routes (`auth`, `search`, `slots`, `platform`, `forecast`, etc.)
- `app/models`: SQLAlchemy models
- `app/schemas`: request and response schemas
- `app/services/ai_serving.py`: AI artifact loading and recommendation logic
- `scripts/seed_from_mock.py`: database seeding from frontend mock JSON

## Environment Variables

Reference file: `.env.example`

```dotenv
APP_NAME=EcoCare Backend API
APP_ENV=development
API_PREFIX=/api
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=ecocare
POSTGRES_USER=ecocare
POSTGRES_PASSWORD=ecocare
DATABASE_URL=
```

AI artifact paths are configured through settings defaults:

- `processed_data_dir=../Dataset/ProcessedData`
- `processed_models_dir=../Dataset/ProcessedData/models`

## Run Locally Without Docker

Create and activate a Python environment, then install dependencies:

```bash
pip install -r requirements.txt
```

Start the API from `EcoCare-BE`:

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

## Run With Docker Compose

From the repository root:

```bash
docker compose up --build -d
```

This starts:

- PostgreSQL
- FastAPI backend
- React frontend

## Database Seeding

Seed the database from the repository root after containers are running:

```bash
docker compose exec backend python scripts/seed_from_mock.py
```

The seed process loads:

- auth users
- 100 generated synthetic users
- merchants
- owner/provider/admin operational data
- search logs
- vehicles from `EcoCare-UI/public/mock/platform-data.json`

## Core API Areas

Registered API groups:

- `/api/auth`
- `/api/routes`
- `/api/search`
- `/api/merchants`
- `/api/slots`
- `/api/forecast`
- `/api/platform`
- `/api/owners`
- `/api/providers`
- `/api/admin`

## Frequently Used Endpoints

- `GET /health`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `GET /api/platform/bootstrap`
- `POST /api/routes/preview`
- `POST /api/search/nearby`
- `POST /api/search/on-route`
- `POST /api/search/logs`
- `POST /api/slots/recommend`

## Notes On Slot Recommendations

Slot recommendation uses AI-serving artifacts from `Dataset/ProcessedData`.

In Docker mode, the backend image must include the `Dataset` folder so `/api/slots/recommend` and forecast services can read artifact files such as:

- `merchant_ranking_features.csv`
- `slot_events.csv`
- `demand_forecast_predictions.csv`

If a frontend mock merchant ID does not exist in the artifact merchant index, the API falls back to safe default slot recommendations instead of failing.

## Health and Validation

Useful URLs:

- Health: `http://localhost:8000/health`
- OpenAPI docs: `http://localhost:8000/docs`

Quick validation example:

```powershell
Invoke-RestMethod -Method Get -Uri "http://localhost:8000/health"
```

## Current Auth Behavior

- Login is email-based for the current demo flow
- Token format is placeholder/demo format
- Some seeded users use local-domain emails such as `@seed.ecocare.local`
- Session persistence is handled on the frontend side
			"detourMin": 4,
			"availableNow": true,
			"reasonTags": ["On Route", "Top Rated", "Available Now"]
		}
	]
}
```

### POST `/api/search/logs`

- Purpose: record AI ranking/training events (best effort from FE).

Request (minimum fields from mock schema):

```json
{
	"id": "log-001",
	"user_id_anonymized": "anon_u_1001",
	"mode": "on-route",
	"origin_lat": 10.776,
	"origin_lng": 106.7,
	"destination_lat": 10.801,
	"destination_lng": 106.66,
	"route_polyline": "encoded_polyline_mock",
	"filters_json": { "openNow": true, "evSafe": true, "minRating": 4, "serviceTypes": ["ceramic"] },
	"shown_merchants_json": [{ "merchantId": "m_001", "rank": 1 }],
	"clicked_merchant_id": "m_001",
	"booked_merchant_id": "m_001",
	"merchant_rank_position": 1,
	"detour_minutes": 4,
	"created_at": "2026-03-21T10:30:00Z"
}
```

Response:

```json
{
	"accepted": true
}
```

## 3.3 Owner APIs

### GET `/api/owners/{ownerId}/bookings`

- Returns booking history for owner.

### POST `/api/owners/{ownerId}/bookings`

- Create booking.

### PATCH `/api/owners/{ownerId}/bookings/{bookingId}`

- Update booking state (`cancelled`, reschedule slot, etc.).

Allowed states:

`pending`, `confirmed`, `in_progress`, `completed`, `cancelled`, `no_show`

## 3.4 Provider APIs

### GET `/api/providers/{providerId}/bookings`

- Returns provider queue (queued, in_progress, completed).

### PATCH `/api/providers/{providerId}/bookings/{bookingId}`

- Update provider-side booking state.

### GET `/api/providers/{providerId}/campaign-requests`

- List provider campaign submissions.

### POST `/api/providers/{providerId}/campaign-requests`

- Submit campaign request.

### GET `/api/providers/{providerId}/ratings`

- Returns summary metrics:
	- `avgRating`
	- `reviewCount`
	- `successfulOrders`

## 3.5 Admin APIs

### GET `/api/admin/merchant-approvals`

- List pending merchant approvals.

### PATCH `/api/admin/merchant-approvals/{id}`

- Approve/reject merchant.

### GET `/api/admin/campaign-moderation`

- List campaign moderation queue.

### PATCH `/api/admin/campaign-moderation/{id}`

- Moderate campaign status.

### GET `/api/admin/disputes`

- List disputes.

### PATCH `/api/admin/disputes/{id}`

- Update dispute workflow state.

### GET `/api/admin/ranking-rules`

- Fetch ranking weights configuration.

### PUT `/api/admin/ranking-rules`

- Update ranking weights.

### GET `/api/admin/ai-rollout`

- Fetch AI rollout health status/metrics.

### PATCH `/api/admin/ai-rollout`

- Toggle model rollout modes (`shadow_mode`, fallback flags, etc.).

## 4) Suggested Folder Structure (BE)

```text
EcoCare-BE/
	app/
		api/
			routes/
		core/
		models/
		schemas/
	scripts/
	openapi.yaml
	requirements.txt
	docker-compose.yml
```

## 5) MVP Delivery Order

1. Auth (`/auth/login`, `/auth/me`)
2. Explore APIs (`/routes/preview`, `/search/nearby`, `/search/on-route`)
3. Owner booking APIs
4. Provider operations APIs
5. Admin operations APIs
6. AI logging endpoint and analytics pipeline

## 6) Notes for FE-BE Compatibility

- Keep exact field names used in mock files to avoid FE mapping churn.
- Preserve current raw responses for:
	- `POST /api/routes/preview`
	- `POST /api/search/nearby`
	- `POST /api/search/on-route`
	- `POST /api/search/logs`
- IDs should remain consistent across resources (`merchantId`, booking IDs, user IDs).

## 7) Implementation Status

- FastAPI app scaffolded at `app/main.py`.
- PostgreSQL integration via SQLAlchemy configured at `app/core/database.py`.
- API routers created for auth, routes, search, owners, providers, and admin.
- OpenAPI starter file exists at `openapi.yaml`.
- Seeder script created at `scripts/seed_from_mock.py`.

## 8) Run Backend (Python + PostgreSQL)

### Step 1: Start PostgreSQL

```bash
docker compose up -d postgres
```

### Step 2: Setup Python environment and install dependencies

```bash
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
```

### Step 3: Configure environment

Create `.env` from `.env.example`.

### Step 4: Start API server

```bash
uvicorn app.main:app --reload --port 8000
```

### Step 5: Seed database from FE mock files

Run this in another terminal while server dependencies are installed:

```bash
python scripts/seed_from_mock.py
```

## 9) Auth Behavior in Current Starter

- Protected APIs expect request header: `X-User-Id`.
- Test IDs from mock users:
	- `owner-01`
	- `owner-02`
	- `provider-01`
	- `provider-02`
	- `admin-01`

Example:

```http
GET /api/auth/me
X-User-Id: admin-01
```