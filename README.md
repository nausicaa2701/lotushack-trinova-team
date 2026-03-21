# lotushack-trinova-team

## Overview

This repository contains a full-stack EcoCare demo platform:

- `EcoCare-UI`: React + Vite frontend
- `EcoCare-BE`: FastAPI + SQLAlchemy backend
- `Dataset`: AI/recommendation artifacts used by backend ranking, slots, and forecast services
- `docker-compose.yml`: local development stack
- `docker-compose.prod.yml`: production-oriented compose file

## Documentation Index

- Frontend guide: `EcoCare-UI/README.md`
- Backend guide: `EcoCare-BE/README.md`

## Quick Start

Start the full local stack from the repository root:

```bash
docker compose up --build -d
```

Seed database data:

```bash
docker compose exec backend python scripts/seed_from_mock.py
```

Import operational data from `Dataset/ProcessedData` into PostgreSQL:

```bash
docker compose exec backend python scripts/seed_from_processed_data.py --truncate
```

This loads `users`, `merchants`, `bookings`, and `search_logs` from processed CSV files.

Useful local URLs:

- Frontend: `http://localhost:3000`
- Backend health: `http://localhost:8000/health`
- Backend docs: `http://localhost:8000/docs`
- Platform bootstrap: `http://localhost:8000/api/platform/bootstrap`

Stop the stack:

```bash
docker compose down
```