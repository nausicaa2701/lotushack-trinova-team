# Dataset → PostgreSQL (EcoCare-BE) — layout & column mapping

This document explains **how to organize data** when loading `Dataset/` into Postgres for the **EcoCare** stack (`EcoCare-BE` SQLAlchemy models). It maps **CSV columns → DB columns** and flags rows that are **ML/offline-only** (not represented in the current API schema).

---

## 1. Two layers (what goes in Postgres vs what stays on disk)

| Layer | Purpose | In Postgres today? |
|--------|---------|---------------------|
| **A. Operational (OLTP)** | Login, search, bookings, merchants for the live API | **Yes** — tables in `EcoCare-BE/app/models/entities.py` |
| **B. Analytics / ML** | Ranking/slot training, eval CSVs, pickles | **Mostly no** — keep as files under `Dataset/ProcessedData/` (or load into separate **analytics** tables if you build a warehouse) |

**Practical approach:** load **(A)** from the Dataset files that align with operational entities; keep **(B)** for notebooks/pipelines unless you add new tables.

---

## 2. Recommended database organization

- **Single database** (e.g. `ecocare`), default schema **`public`** — matches current FastAPI models.
- **Import order** (respects foreign keys):

  1. `users`
  2. `merchants`
  3. `vehicles` (→ `users.id`)
  4. `bookings` (→ `users.id` for `owner_id` / `provider_id`)
  5. `campaign_requests`, `merchant_approvals`, `disputes`
  6. `ranking_rules`, `ai_rollout` (singleton rows `id = 1`)
  7. `search_logs` (no FK to merchants/users in schema — store JSON as-is)

- **Optional future:** schema `analytics` with tables `dim_search_event`, `fact_booking_event`, etc., fed from `search_events.csv` / `booking_events.csv` if you need full event history in SQL.

---

## 3. Core tables ↔ Dataset sources

### 3.1 `merchants`

**Best CSV sources:** `ProcessedData/merchant_clean.csv` or `merchant_geo_ready.csv` (same core columns; geo_ready adds geo flags).

| DB column (`merchants`) | Type | Dataset column | Notes |
|---------------------------|------|------------------|--------|
| `merchant_id` | `VARCHAR(64)` PK | `merchant_id` | Google-style IDs can be long; **verify length** — extend column if any ID &gt; 64 chars. |
| `name` | `VARCHAR(255)` | `merchant_name` | |
| `address` | `VARCHAR(255)` | `address` | Truncate or widen if addresses exceed 255. |
| `lat` | `FLOAT` | `latitude` | |
| `lng` | `FLOAT` | `longitude` | |
| `rating` | `FLOAT` | `rating` | |
| `review_count` | `INTEGER` | `review_count_source` | Or `review_row_count` where more accurate. |
| `successful_orders` | `INTEGER` | — | **No direct column** — default `0` or derive from bookings later. |
| `price_from` | `NUMERIC(10,2)` | `price` | Parse/clean; use default (e.g. `0` or median) if empty. |
| `is_ev_safe` | `BOOLEAN` | — | Infer from `merchant_types` / `service_options_on_site` text (e.g. contains EV keywords) or default `true`. |
| `open_now` | `BOOLEAN` | `is_open_now_proxy` (geo_ready) or `open_state` | Map business rules (e.g. open_state → bool). |
| `service_types` | `JSON` (list of strings) | `merchant_types`, `merchant_type_id` | Split / normalize to a list of tags (e.g. `["car_wash", "detailing"]`). |

**Not loaded into `merchants`:** `phone`, `website`, `hours`, `data_id`, `normalized_*`, duplicate flags — keep in CSV or a future `merchant_attributes` table.

---

### 3.2 `users`

**Dataset** uses synthetic IDs like `user_001` in event CSVs. The API expects **`users.id`** to exist for `bookings.owner_id` / `provider_id`.

| Strategy | Description |
|----------|-------------|
| **A. Seed users first** | Generate one `users` row per distinct `user_id` in `search_events.csv` / `booking_events.csv` (synthetic emails `user_001@dataset.local`). |
| **B. Map to existing demo users** | Maintain a sidecar CSV `user_id_map.csv`: `dataset_user_id → ecocare_user_id`. |

| DB column | Dataset / source |
|-----------|------------------|
| `id` | Distinct `user_id` from events, or mapped ID |
| `name` | Synthetic: `Dataset user {id}` |
| `email` | Unique: `{id}@dataset.local` |
| `roles` | JSON list, e.g. `["owner"]` |
| `default_role` | `"owner"` |
| `password_hash` | `NULL` or bcrypt if you enable password login |

---

### 3.3 `bookings`

**CSV:** `ProcessedData/booking_events.csv`

| DB column | Dataset column | Notes |
|-----------|------------------|--------|
| `id` | `booking_event_id` | |
| `owner_id` | `user_id` | Must exist in `users` (see §3.2). |
| `provider_id` | — | **Not** `merchant_id`. Schema FK targets **`users.id`** (provider account). Resolve via: map `merchant_name` / business rules to a provider user, or `NULL` if unknown. |
| `provider` | `merchant_name` | Display name of the service location. |
| `service` | — | Constant e.g. `"wash"` or derive from dataset if you add a column. |
| `slot` | — | e.g. `"synthetic"` or parse from `event_ts` if you add slot logic. |
| `state` | `booking_status` | Align enum with API: `pending`, `confirmed`, `in_progress`, `completed`, `cancelled`, `no_show`. |
| `price` | — | Default `0` or map from `booking_value_band` (low/medium/high → numeric). |
| `created_at` | `event_ts` | Parse ISO-8601 to `timestamp`. |

---

### 3.4 `search_logs`

**CSV:** `ProcessedData/search_events.csv` (one row per search; **shown merchants** may require joining `retrieval_results_*.csv` / `impression_events.csv`).

| DB column | Dataset column | Notes |
|-----------|----------------|--------|
| `id` | `search_event_id` | |
| `user_id_anonymized` | `user_id` or `hash(user_id)` | API uses anonymized string. |
| `mode` | `search_mode` | `nearby` \| `on-route` |
| `origin_lat` / `origin_lng` | `origin_latitude`, `origin_longitude` | |
| `destination_lat` / `destination_lng` | `destination_latitude`, `destination_longitude` | Nullable for nearby. |
| `route_polyline` | — | Empty string `""` if not in CSV. |
| `filters_json` | `require_open_now`, `min_rating`, `radius_km`, `max_corridor_km` | Build JSON object matching FE/API expectations. |
| `shown_merchants_json` | Join from `retrieval_results_nearby.csv` / `impression_events.csv` | List of `{merchant_id, rank, ...}`. |
| `clicked_merchant_id` | — | From `click_events.csv` if joined. |
| `booked_merchant_id` | — | From `booking_events.csv` if joined. |
| `merchant_rank_position` | — | Optional. |
| `detour_minutes` | — | Optional. |
| `created_at` | `event_ts` | |

---

## 4. Other Dataset files — how they relate

| File | Role | Maps to current Postgres? |
|------|------|-----------------------------|
| `merchant_master.csv` | Richer merchant listing | Same mapping as §3.1 |
| `merchant_review_agg.csv` | Aggregates for ML | **No** table — use for features or future `merchant_stats` |
| `search_events.csv` | Search funnel | **`search_logs`** (partial; see §3.4) |
| `booking_events.csv` | Booking funnel | **`bookings`** |
| `impression_events.csv`, `click_events.csv`, `relevance_labels.csv` | Ranking labels | **No** — ML; optional analytics tables |
| `slot_events.csv` | Slot UI / model | **No** — offline; slot API uses AI artifacts |
| `retrieval_results_nearby.csv` / `on_route` | Retrieval debug | Populate `shown_merchants_json` for logs |
| `demand_zone_summary.csv`, `demand_timeseries_dataset.csv` | Demand forecasting | **No** — API reads forecast from AI layer / files |
| `ranking_training_dataset.csv`, `slot_training_dataset.csv`, `*.pkl`, `*.txt` | Training | **Never** load pickles into Postgres as blobs without a clear ops story |
| `RawData/*.csv` | Source scrapes | ETL into `merchant_clean` first, then §3.1 |

---

## 5. Vehicles, campaigns, admin — Dataset coverage

- **`vehicles`:** No dedicated Dataset CSV in `ProcessedData/` aligned 1:1 — continue from **`EcoCare-UI/public/mock/platform-data.json`** via existing `seed_from_mock.py`, or add a custom `vehicles.csv` that matches model fields.
- **`campaign_requests`, `merchant_approvals`, `disputes`:** Same — mock JSON seed, or add CSVs later.
- **`ranking_rules`, `ai_rollout`:** Defaults or single-row seed — not driven by Dataset CSVs today.

---

## 6. Deployment checklist

1. Run migrations / `Base.metadata.create_all` (as in FastAPI startup) on the target Postgres instance.
2. **Truncate order** (if re-importing): children first (`bookings`, `vehicles`, `search_logs`, …) then `users` / `merchants` as needed.
3. Load **`users`** (synthetic or mapped).
4. Load **`merchants`** from `merchant_clean.csv` / `merchant_geo_ready.csv` with §3.1 transforms.
5. Load **`bookings`** from `booking_events.csv` with §3.3.
6. Load **`search_logs`** from `search_events.csv` + optional joins for `shown_merchants_json`.
7. Re-run **`seed_from_mock.py`** for JSON-only entities (vehicles, admin ops) if you still rely on mock JSON — or replace with Dataset-driven scripts later.

---

## 7. Column quick reference — `booking_events.csv`

| CSV column | Sample |
|------------|--------|
| `booking_event_id`, `click_event_id`, `query_id`, `search_event_id`, `user_id`, `session_id`, `event_ts`, `search_mode`, `merchant_id`, `merchant_name`, `booking_value_band`, `booking_status` |

## 8. Column quick reference — `search_events.csv`

| CSV column | Sample |
|------------|--------|
| `search_event_id`, `query_id`, `user_id`, `session_id`, `event_ts`, `search_mode`, `query_index`, `query_source`, `query_context`, `origin_latitude`, `origin_longitude`, `destination_latitude`, `destination_longitude`, `radius_km`, `max_corridor_km`, `require_open_now`, `min_rating` |

---

*Generated for repo `lotushack-trinova-team` — align with `EcoCare-BE/app/models/entities.py` whenever models change.*
