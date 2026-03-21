# lotushack-trinova-team

## Docker Compose Stack

The repository now includes a root Docker Compose setup for frontend, backend, and PostgreSQL.

Services:

- `frontend`: Vite app on `http://localhost:3000`
- `backend`: FastAPI app on `http://localhost:8000`
- `db`: PostgreSQL on `localhost:5432`

### Start all services

```bash
docker compose up --build -d
```

### View logs

```bash
docker compose logs -f
```

### Stop all services

```bash
docker compose down
```

### Seed backend database from mock JSON

```bash
docker compose exec backend python scripts/seed_from_mock.py
```

### Useful URLs

- Frontend: `http://localhost:3000`
- Backend health: `http://localhost:8000/health`
- Backend docs: `http://localhost:8000/docs`