# Mock Data Pack

This folder contains operational mock JSON files for FE development in `EcoCare-UI`.

## Core Files

- `platform-data.json`  
  Legacy aggregate mock used by existing screens/hooks.

- `auth-users.json`  
  Login identities and role sets.

- `merchants.json`  
  Merchant master records with geolocation and service metadata.

- `routes-preview.json`  
  Mock contract for `POST /api/routes/preview`.

- `search-nearby.json`  
  Mock contract for `POST /api/search/nearby`.

- `search-on-route.json`  
  Mock contract for `POST /api/search/on-route`.

- `owner-bookings.json`  
  Owner booking history and states.

- `provider-ops.json`  
  Provider booking queue, campaigns, reputation metrics.

- `admin-ops.json`  
  Merchant approval, campaign moderation, disputes, AI rollout/ranking config.

- `ai-search-logs.json`  
  AI event logging schema and sample records.

## Notes

- Keep IDs consistent across files (`merchantId`, booking IDs, user IDs).
- All payloads follow the map + search contracts from `.temp/map_implement.md`.
- You can split `platform-data.json` usage gradually to domain files above.
