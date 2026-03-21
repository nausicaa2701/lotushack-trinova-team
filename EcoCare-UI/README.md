# EcoCare-UI

## Overview

EcoCare-UI is a React 19 + Vite frontend for the EcoCare platform. It provides role-based flows for owners, providers, and admins, and consumes backend APIs for auth, search, platform bootstrap, slot recommendations, and analytics-oriented data.

## Tech Stack

- React 19
- TypeScript
- Vite
- React Router
- PrimeReact
- Leaflet / React Leaflet
- Tailwind CSS 4
- Motion

## Main Features

- Login and role-aware routing
- Owner dashboard, bookings, explore, and vehicles views
- Provider dashboard, bookings, and campaigns
- Admin dashboard, merchant approvals, campaigns, disputes, and AI rollout views
- Search and explore flows backed by backend APIs with mock fallback support
- Session persistence through browser storage

## Project Structure

- `src/App.tsx`: app routes and protected layout
- `src/auth`: auth context and session state
- `src/components`: shared UI layout and navigation
- `src/screens`: screen-level pages
- `src/hooks/useMockData.ts`: platform bootstrap loading with backend-first fallback
- `src/lib`: API helpers and platform data utilities
- `public/mock`: static mock JSON used as fallback/demo content

## Environment Variables

Typical frontend env values:

```dotenv
VITE_API_BASE_URL=http://localhost:8000
```

Production note:

- Set `VITE_API_BASE_URL` to the API host only
- Do not append `/api` because the frontend already calls endpoints like `/api/auth/login`

Example production value:

```dotenv
VITE_API_BASE_URL=https://api.trinova.it.com
```

## Run Locally

Install dependencies:

```bash
npm install
```

Start the dev server:

```bash
npm run dev
```

Default local URL:

```text
http://localhost:3000
```

## Build and Validate

Type-check the frontend:

```bash
npm run lint
```

Build production assets:

```bash
npm run build
```

Preview the production build:

```bash
npm run preview
```

## Backend Integration

The frontend primarily depends on these endpoints:

- `POST /api/auth/login`
- `GET /api/platform/bootstrap`
- `POST /api/routes/preview`
- `POST /api/search/nearby`
- `POST /api/search/on-route`
- `POST /api/search/logs`
- `POST /api/slots/recommend`

If backend APIs are unavailable, some screens fall back to mock data from `public/mock`.

## Authentication Behavior

- Auth state is stored in browser storage
- Active role is restored on reload
- Protected routes redirect unauthenticated users to `/login`

## Recommended Workflow

For normal development, run the full stack from the repository root with Docker Compose. This keeps frontend, backend, database, and seed flow aligned.