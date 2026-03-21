# EcoCare Backend API

FastAPI service for the **EcoCare** marketplace: auth, platform bootstrap, merchant search, slot recommendations, demand forecasting, and owner/provider/admin operations backed by **PostgreSQL**. Optional **AI/ranking artifacts** are read from the shared [`Dataset/`](../Dataset/) tree when present.

> **Monorepo:** This folder is `EcoCare-BE/`. The companion web app lives in [`EcoCare-UI/`](../EcoCare-UI/). Root [`docker-compose.yml`](../docker-compose.yml) runs **db + backend + frontend** together.

---

## Table of contents

- [Features](#features)
- [Tech stack](#tech-stack)
- [Project layout](#project-layout)
- [Prerequisites](#prerequisites)
- [Quick start (local)](#quick-start-local)
- [Run with Docker (full stack)](#run-with-docker-full-stack)
- [Configuration](#configuration)
- [Database & seeding](#database--seeding)
- [API & documentation](#api--documentation)
- [Authentication](#authentication)
- [Dataset & AI artifacts](#dataset--ai-artifacts)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)

---

## Features

- REST API under configurable prefix (default **`/api`**)
- SQLAlchemy 2.x models with PostgreSQL
- Search (nearby / on-route), route preview, merchant detail
- Slot recommendation and zone forecast when ML artifacts are available
- Admin: merchant approvals, campaigns, disputes, ranking weights, AI rollout flags
- Search event logging for analytics / ML pipelines

---

## Tech stack

| Layer | Technology |
|--------|------------|
| Runtime | Python 3.11+ (recommended) |
| Framework | [FastAPI](https://fastapi.tiangolo.com/) |
| ORM | SQLAlchemy 2 |
| DB | PostgreSQL 16 |
| Server | Uvicorn |
| Validation | Pydantic v2 |

---

## Project layout

```text
EcoCare-BE/
├── app/
│   ├── main.py              # App entry, CORS, router mount
│   ├── api/
│   │   ├── router.py        # Registers all route modules
│   │   └── routes/          # auth, search, merchants, slots, …
│   ├── core/                # config, database
│   ├── models/              # SQLAlchemy entities
│   ├── schemas/             # Pydantic request/response models
│   └── services/
│       └── ai_serving.py    # Artifact-backed ranking/slots/forecast
├── scripts/
│   └── seed_from_mock.py    # Seed DB from EcoCare-UI mock JSON
├── requirements.txt
├── docker-compose.yml       # PostgreSQL only (dev helper)
└── .env.example
```

---

## Prerequisites

- **PostgreSQL** running and reachable (local or Docker)
- **Python 3.11+** and `pip` (or your preferred env manager)
- For AI features: **`Dataset/ProcessedData`** checked out next to this backend (see [Dataset & AI artifacts](#dataset--ai-artifacts))

---

## Quick start (local)

### 1. Start PostgreSQL

From **this directory** (`EcoCare-BE/`):

```bash
docker compose up -d
```

This uses `EcoCare-BE/docker-compose.yml` (Postgres on port **5432**).

Or use the repo root stack (see below) which names the DB service `db`.

### 2. Install dependencies

```bash
cd EcoCare-BE
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

### 3. Configure environment

```bash
cp .env.example .env
# Edit .env: set POSTGRES_* or DATABASE_URL to match your database
```

### 4. Run the API

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### 5. Verify

- Health: [http://localhost:8000/health](http://localhost:8000/health)
- Interactive docs: [http://localhost:8000/docs](http://localhost:8000/docs)

---

## Run with Docker (full stack)

From the **repository root** (parent of `EcoCare-BE/`):

```bash
docker compose up --build -d
```

Services:

| Service | Port | Notes |
|---------|------|--------|
| PostgreSQL (`db`) | 5432 | DB `ecocare`, user/password `ecocare` |
| Backend (`backend`) | 8000 | API |
| Frontend (`frontend`) | 3000 | Vite app; `VITE_API_BASE_URL` points at backend |

Seed the database **after** the stack is up (with Python deps available):

```bash
docker compose exec backend python scripts/seed_from_mock.py
```

---

## Configuration

Environment variables are loaded from **`.env`** (see [`.env.example`](./.env.example)).

| Variable | Description |
|----------|-------------|
| `APP_NAME` | Application title (OpenAPI) |
| `APP_ENV` | e.g. `development`, `production` |
| `API_PREFIX` | URL prefix for all routes (default `/api`) |
| `POSTGRES_HOST`, `POSTGRES_PORT`, `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD` | PostgreSQL connection |
| `DATABASE_URL` | If set, overrides the composed URL (e.g. `postgresql+psycopg://user:pass@host:5432/dbname`) |
| `PROCESSED_DATA_DIR` | Relative to `EcoCare-BE/` — default `../Dataset/ProcessedData` |
| `PROCESSED_MODELS_DIR` | Default `../Dataset/ProcessedData/models` |

Paths resolve from the backend package root so the repo’s **`Dataset/`** folder can be read for ranking/slot/forecast artifacts.

---

## Database & seeding

- Tables are created on startup (`Base.metadata.create_all`) for development convenience.
- **Seed script:** `scripts/seed_from_mock.py` loads JSON from [`EcoCare-UI/public/mock/`](../EcoCare-UI/public/mock/) (users, merchants, vehicles, bookings, admin/provider ops, search logs, etc.).

Bulk loading from **`Dataset/`** CSVs is documented separately:

- [`../Dataset/POSTGRES_MAPPING.md`](../Dataset/POSTGRES_MAPPING.md)

---

## API & documentation

All routes are mounted under **`API_PREFIX`** (default **`/api`**).

| Area | Prefix |
|------|--------|
| Auth | `/api/auth` |
| Routes | `/api/routes` |
| Search | `/api/search` |
| Merchants | `/api/merchants` |
| Slots | `/api/slots` |
| Forecast | `/api/forecast` |
| Platform | `/api/platform` |
| Owners | `/api/owners` |
| Providers | `/api/providers` |
| Admin | `/api/admin` |

**Interactive OpenAPI:** `GET /docs` (Swagger UI) and `GET /redoc` when the server is running.

---

## Authentication

- **Login:** `POST /api/auth/login` (demo/demo-style flow; see OpenAPI for body).
- **Protected routes:** the API uses header **`X-User-Id`** with a user id that exists in the `users` table (see seed data). Example:

```http
GET /api/owners/owner-02/bookings
X-User-Id: owner-02
```

Demo IDs from mock seed include: `owner-01`, `owner-02`, `provider-01`, `provider-02`, `admin-01`.

---

## Dataset & AI artifacts

Ranking, slot, and forecast endpoints may load Parquet/CSV/model files from:

- `Dataset/ProcessedData/`
- `Dataset/ProcessedData/models/`

If artifacts are missing or a merchant id is unknown to the index, the service falls back to **database-backed search** or **safe default** slot suggestions where implemented.

Ensure the **`Dataset/`** directory is available at the paths implied by `PROCESSED_DATA_DIR` (e.g. clone the full monorepo, not only `EcoCare-BE/`).

---

## Troubleshooting

| Issue | What to check |
|--------|----------------|
| DB connection errors | `POSTGRES_*` / `DATABASE_URL`, firewall, Postgres running |
| Empty search / slot results | Filters too strict; merchant ids FE vs DB; artifacts path |
| CORS from browser | `app/main.py` `allow_origins` includes your frontend origin |
| `/api/...` 404 from frontend | Frontend base URL must be **origin only** — request paths already include `/api` (see EcoCare-UI `getApiBase()`) |

---

## Contributing

1. Open an issue for larger changes.
2. Use a virtual environment; keep `requirements.txt` reproducible.
3. Run a quick smoke test: `uvicorn app.main:app` and hit `/health` and `/docs`.
4. Follow existing patterns in `app/api/routes/` and `app/schemas/`.

Add or update tests when you introduce new behavior (test layout may evolve in this repo).

---

## License

This component follows the **license of the parent repository**. If none is present yet, add a `LICENSE` file at the repo root.
