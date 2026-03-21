# EcoCare-BE

Backend starter document for EcoCare platform APIs.

This document defines an initial REST API structure based on FE mock contracts in `EcoCare-UI/public/mock` and current FE API calls.

## 1) API Conventions

- Base URL: `/api`
- Versioning (recommended): `/api/v1/...` (FE currently calls `/api/...`)
- Content type: `application/json`
- Time format: ISO-8601 UTC (example: `2026-03-21T10:30:00Z`)
- Auth: Bearer JWT (except login endpoint)

### Standard Success Envelope

```json
{
	"data": {},
	"meta": {
		"requestId": "req_123",
		"timestamp": "2026-03-21T10:30:00Z"
	}
}
```

Note: For MVP compatibility, keep existing direct-response contracts for FE-called endpoints where needed.

### Standard Error Envelope

```json
{
	"error": {
		"code": "VALIDATION_ERROR",
		"message": "Invalid request payload",
		"details": [
			{
				"field": "filters.minRating",
				"issue": "Must be between 0 and 5"
			}
		]
	},
	"meta": {
		"requestId": "req_123",
		"timestamp": "2026-03-21T10:30:00Z"
	}
}
```

### Common HTTP Statuses

- `200` success
- `201` created
- `400` validation error
- `401` unauthorized
- `403` forbidden
- `404` not found
- `409` conflict
- `422` semantic validation error
- `500` internal error

## 2) Domain Models (Initial)

### User

```json
{
	"id": "owner-01",
	"name": "Alex Rivera",
	"email": "alex@washnet.app",
	"roles": ["owner", "provider"],
	"defaultRole": "owner"
}
```

### Merchant

```json
{
	"merchantId": "m_001",
	"name": "EcoGloss Elite",
	"address": "1422 Marina Blvd, San Francisco",
	"lat": 37.8062,
	"lng": -122.4371,
	"rating": 4.9,
	"reviewCount": 1240,
	"successfulOrders": 1420,
	"priceFrom": 45,
	"isEvSafe": true,
	"openNow": true,
	"serviceTypes": ["ceramic", "interior", "express"]
}
```

### Booking

```json
{
	"id": "b-1001",
	"ownerId": "owner-01",
	"providerId": "provider-02",
	"service": "Premium Exterior",
	"slot": "09:30",
	"state": "confirmed",
	"price": 45
}
```

## 3) REST API Structure

## 3.1 Authentication

### POST `/api/auth/login`

- Purpose: authenticate user by email and return available roles.

Request:

```json
{
	"email": "alex@washnet.app",
	"password": "demo-password"
}
```

Response:

```json
{
	"token": "jwt_token_here",
	"refreshToken": "refresh_token_here",
	"user": {
		"id": "owner-01",
		"name": "Alex Rivera",
		"email": "alex@washnet.app",
		"roles": ["owner", "provider"],
		"defaultRole": "owner"
	}
}
```

### GET `/api/auth/me`

- Purpose: fetch current user profile and role set.

### POST `/api/auth/switch-role`

- Purpose: switch active role if user has multiple roles.

Request:

```json
{
	"role": "provider"
}
```

## 3.2 Route and Discovery (required by FE)

These are already consumed by FE in `exploreApi.ts`.

### POST `/api/routes/preview`

Request:

```json
{
	"origin": { "lat": 10.776, "lng": 106.7 },
	"destination": { "lat": 10.801, "lng": 106.66 }
}
```

Response:

```json
{
	"distanceKm": 8.4,
	"durationMin": 24,
	"polyline": "encoded_polyline_mock",
	"bounds": {
		"north": 10.81,
		"south": 10.75,
		"east": 106.71,
		"west": 106.65
	}
}
```

### POST `/api/search/nearby`

Request:

```json
{
	"location": { "lat": 10.776, "lng": 106.7 },
	"radiusKm": 5,
	"filters": {
		"openNow": true,
		"evSafe": true,
		"minRating": 4,
		"serviceTypes": ["ceramic"]
	}
}
```

Response:

```json
{
	"results": [
		{
			"merchantId": "m_001",
			"name": "EcoGloss Elite",
			"lat": 10.785,
			"lng": 106.684,
			"rating": 4.9,
			"successfulOrders": 1240,
			"priceFrom": 45,
			"distanceFromRouteKm": 0.8,
			"detourMin": 4,
			"availableNow": true,
			"reasonTags": ["Near You", "Top Rated", "Available Now"]
		}
	]
}
```

### POST `/api/search/on-route`

Request:

```json
{
	"origin": { "lat": 10.776, "lng": 106.7 },
	"destination": { "lat": 10.801, "lng": 106.66 },
	"polyline": "encoded_polyline_mock",
	"maxDetourKm": 2,
	"filters": {
		"openNow": true,
		"evSafe": true,
		"minRating": 4,
		"serviceTypes": ["ceramic", "interior"]
	}
}
```

Response:

```json
{
	"results": [
		{
			"merchantId": "m_001",
			"name": "EcoGloss Elite",
			"lat": 10.785,
			"lng": 106.684,
			"rating": 4.9,
			"successfulOrders": 1240,
			"priceFrom": 45,
			"distanceFromRouteKm": 0.8,
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