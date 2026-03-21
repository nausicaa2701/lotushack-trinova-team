# EcoCare / WashNet — Monorepo

Full-stack demo for a sustainable car-care marketplace: **React + Vite** frontend, **FastAPI + PostgreSQL** backend, and **Dataset** assets for search/ranking/slot/forecast pipelines.

| Area | Path | Stack |
|------|------|--------|
| Frontend | [`EcoCare-UI/`](EcoCare-UI/) | React 19, TypeScript, Vite 6, Tailwind 4, React Router 7, PrimeReact, Leaflet |
| Backend | [`EcoCare-BE/`](EcoCare-BE/) | FastAPI, SQLAlchemy 2, Pydantic v2, PostgreSQL (psycopg3) |
| Data | [`Dataset/`](Dataset/) | Processed CSVs / models consumed by the API and offline ML |
| Automation | [`n8n_workflow/`](n8n_workflow/) | Exported [n8n](https://n8n.io/) workflows (data collection → Google Sheets) |
| Containers | repo root | `docker-compose.yml` (dev), `docker-compose.prod.yml` (prod-oriented) |

**Docs:** [EcoCare-UI README](EcoCare-UI/README.md) · [EcoCare-BE README](EcoCare-BE/README.md) · [Dataset → PostgreSQL mapping](Dataset/POSTGRES_MAPPING.md)

---

## n8n workflows (`n8n_workflow/`)

These JSON exports are **n8n workflow definitions** used to gather location and review data (HCMC car wash, EV charging) and sync into Google Sheets—upstream of cleaning steps that may land in [`Dataset/`](Dataset/).

| File | Purpose |
|------|---------|
| [`Google Maps Crawler - Car Wash HCMC (SerpAPI).json`](n8n_workflow/Google%20Maps%20Crawler%20-%20Car%20Wash%20HCMC%20(SerpAPI).json) | Schedule trigger → build district queries (`rua xe oto … ho chi minh`) → **SerpAPI** Google Maps local results → normalize rows → **Google Sheets** append/update (e.g. sheet `TPHCM`, key `record_key`). |
| [`Google Maps Crawler - Car Wash HCMC (SerpAPI) - Review.json`](n8n_workflow/Google%20Maps%20Crawler%20-%20Car%20Wash%20HCMC%20(SerpAPI)%20-%20Review.json) | Manual or scheduled run → read locations from the same workbook → **SerpAPI** `google_maps_reviews` per `place_id` → one row per review → append/update review sheet (e.g. `TPHCM_Reviews`, key `review_id`). Sticky note inside the workflow documents fields and flow. |
| [`eSKYCorp - All Charging Stations (66 locations).json`](n8n_workflow/eSKYCorp%20-%20All%20Charging%20Stations%20(66%20locations).json) | Schedule + **webhook** (`export-esky-all-stations`) → HTTP GET `eskycorp.vn` map JSON → flatten stations → append to Sheets. |

**Import:** In n8n: *Workflows* → *Import from File* → pick a JSON from [`n8n_workflow/`](n8n_workflow/).

**Configure before running**

- **SerpAPI:** [serpapi.com](https://serpapi.com/) API key on the SerpAPI node(s); quotas apply (workflow notes mention free-tier limits).
- **Google Sheets:** OAuth2 credential in n8n; point **document** and **sheet** IDs at *your* spreadsheet (exports may still reference a team sheet—replace them).
- **Webhook:** For the eSKY workflow, register the webhook URL your n8n instance exposes after activation.

These workflows are **not** started by the Docker stack in this repo; run them on your own n8n (cloud or self-hosted).

---

## Prerequisites

- **Docker** + Docker Compose (recommended), or local **Node 20+**, **Python 3.11+**, and **PostgreSQL 16**
- Clone with **`Dataset/`** present if you need ranking/slot/forecast features (backend copies it into the image per `Dockerfile.backend`)

---

## Quick start (Docker, dev)

From the **repository root**:

```bash
docker compose up --build -d
```

| Service | Port | Role |
|---------|------|------|
| `frontend` | **3000** | Vite dev server (`npm run dev` in container) |
| `backend` | **8000** | Uvicorn / FastAPI |
| `db` | **5432** | PostgreSQL (`ecocare` / `ecocare` credentials in compose) |

**Frontend env:** compose sets `VITE_API_BASE_URL=http://localhost:8000` (API **origin only** — paths already include `/api/...`).

**Useful URLs**

- App: <http://localhost:3000>
- API health: <http://localhost:8000/health>
- OpenAPI: <http://localhost:8000/docs>
- Bootstrap JSON: <http://localhost:8000/api/platform/bootstrap>

**Stop**

```bash
docker compose down
```

---

## Database seeding

**1) Demo / mock JSON (good for UI + quick API checks)**

Runs inside the backend container (working dir `/app` = `EcoCare-BE`):

```bash
docker compose exec backend python scripts/seed_from_mock.py
```

Loads users, merchants, vehicles, bookings, admin/provider ops, etc. from [`EcoCare-UI/public/mock/`](EcoCare-UI/public/mock/) (also baked into the backend image as `/mock`).

**2) Operational data from `Dataset/ProcessedData` (CSV → Postgres)**

```bash
docker compose exec backend python scripts/seed_from_processed_data.py --truncate
```

The `--truncate` flag clears selected operational tables before import. Column mapping and load order are described in [`Dataset/POSTGRES_MAPPING.md`](Dataset/POSTGRES_MAPPING.md).

---

## Production-oriented compose

[`docker-compose.prod.yml`](docker-compose.prod.yml) uses env-based DB credentials and extra labels (e.g. reverse proxy). Adjust variables to match your deployment; see comments in that file and [`EcoCare-BE/README.md`](EcoCare-BE/README.md).

---

## Local development without Docker (outline)

1. **PostgreSQL** running and reachable.
2. **Backend:** `cd EcoCare-BE` → create venv → `pip install -r requirements.txt` → copy `.env.example` → `uvicorn app.main:app --reload --port 8000`.
3. **Frontend:** `cd EcoCare-UI` → `npm install` → set `EcoCare-UI/.env` (`VITE_API_BASE_URL=http://127.0.0.1:8000`) → `npm run dev` (default port **3000** per `package.json`).

Vite dev server can proxy `/api` to the backend when `VITE_API_BASE_URL` is empty; see [`EcoCare-UI/vite.config.ts`](EcoCare-UI/vite.config.ts).

---

## Repository layout (summary)

```text
.
├── EcoCare-UI/          # SPA (WashNet UI)
├── EcoCare-BE/          # FastAPI app (`app/`), scripts, requirements
├── Dataset/             # ProcessedData + RawData + ML artifacts
├── n8n_workflow/        # exported n8n JSON (crawlers → Sheets)
├── Dockerfile.backend   # copies EcoCare-BE + EcoCare-UI/mock + Dataset
├── Dockerfile.frontend  # EcoCare-UI dev server
├── docker-compose.yml
└── docker-compose.prod.yml
```

---

## License

Add a `LICENSE` at the repo root if you publish this project publicly.
