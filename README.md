# lotushack-trinova-team

## Environment Setup Guideline

This project contains:

- `EcoCare-UI`: React + Vite frontend
- `EcoCare-BE`: FastAPI backend
- PostgreSQL database (via Docker Compose)

## Prerequisites

- Docker Desktop 4.x+
- Docker Compose v2 (`docker compose version`)

## Local Development Setup (Recommended)

From repository root, start all services:

```bash
docker compose up --build -d
```

Check running services:

```bash
docker compose ps
```

View logs:

```bash
docker compose logs -f
```

Stop services:

```bash
docker compose down
```

## Environment Variables

### Backend env

Use `EcoCare-BE/.env.example` as reference:

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

In Docker local mode, these are already injected by `docker-compose.yml`.

### Frontend env

For production frontend values, configure `EcoCare-UI/.env.prod`.

Important:

- Keep `VITE_API_BASE_URL` as the API host only (without trailing `/api`)
- Example: `VITE_API_BASE_URL=https://api.trinova.it.com`

## Initialize Database Data (Including Vehicles)

Run seed script after containers are up:

```bash
docker compose exec backend python scripts/seed_from_mock.py
```

What this seeds:

- Base users from mock files
- 100 synthetic random users
- Merchants
- Bookings and operations data
- Search logs
- Vehicles from `EcoCare-UI/public/mock/platform-data.json`

## Verify Setup

Open these URLs:

- Frontend: `http://localhost:3000`
- Backend health: `http://localhost:8000/health`
- Backend docs: `http://localhost:8000/docs`
- Platform bootstrap: `http://localhost:8000/api/platform/bootstrap`

Quick API check (PowerShell):

```powershell
Invoke-RestMethod -Method Get -Uri "http://localhost:8000/api/platform/bootstrap"
```

## Production Compose Notes

Use production file:

```bash
docker compose -f docker-compose.prod.yml up --build -d
```

`docker-compose.prod.yml` expects reverse proxy labels and external `web` network.

If needed, create external network first:

```bash
docker network create web
```