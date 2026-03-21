
# Map + Route Search Technical Spec

## Goal
Implement map embedding and advanced route-based search for WashNet Explore page.

## Scope
- Embed interactive map
- Support nearby search
- Support route-based search
- Show merchant markers and synced result cards
- Return ranked merchants on/near route
- Prepare logging for future AI models

## Frontend Stack
- React
- Vite
- PrimeReact
- Tailwind CSS
- React Leaflet

## Backend Stack
- NestJS
- PostgreSQL
- PostGIS
- Redis optional

## FE Requirements
### Main page
Create `ExplorePage` with:
- left filter/search panel
- right map panel
- synced merchant list and markers

### Components
- `ExplorePage`
- `SearchModeToggle`
- `RouteSearchForm`
- `AdvancedFilterPanel`
- `MapView`
- `MerchantList`
- `MerchantCard`
- `MerchantDetailDrawer`

### Search modes
- nearby
- on-route

### Nearby search
Inputs:
- current location
- filters

Actions:
- get current location
- call nearby search API
- render markers and cards

### Route search
Inputs:
- origin
- destination
- max detour km
- filters

Actions:
- call route preview API
- render route polyline
- call on-route search API
- render markers and ranked merchant cards

### UX behavior
- clicking marker highlights merchant card
- clicking merchant card highlights marker
- map fits bounds after route search
- show loading, empty, and error states
- mobile: filter panel becomes drawer

## BE Requirements
### Modules
- `maps`
- `search`
- `merchants`

### APIs
#### Route preview
`POST /api/routes/preview`

Request:
```json
{
  "origin": { "lat": 10.776, "lng": 106.700 },
  "destination": { "lat": 10.801, "lng": 106.660 }
}
````

Response:

```json
{
  "distanceKm": 8.4,
  "durationMin": 24,
  "polyline": "encoded_polyline",
  "bounds": {
    "north": 10.81,
    "south": 10.75,
    "east": 106.71,
    "west": 106.65
  }
}
```

#### Nearby search

`POST /api/search/nearby`

Request:

```json
{
  "location": { "lat": 10.776, "lng": 106.700 },
  "radiusKm": 5,
  "filters": {
    "openNow": true,
    "evSafe": true,
    "minRating": 4,
    "serviceTypes": ["ceramic"]
  }
}
```

#### On-route search

`POST /api/search/on-route`

Request:

```json
{
  "origin": { "lat": 10.776, "lng": 106.700 },
  "destination": { "lat": 10.801, "lng": 106.660 },
  "polyline": "encoded_polyline",
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

## Search Logic

### Nearby search

* query merchants within radius
* filter by:

  * open now
  * EV safe
  * min rating
  * service type
* sort by rule-based score

### On-route search

* decode polyline
* build route corridor buffer
* query merchants inside corridor
* filter by availability and filters
* compute score for ranking

### Ranking formula

Use weighted rule-based scoring first:

* route match: 30%
* distance/detour: 25%
* rating: 15%
* successful orders: 10%
* slot availability: 10%
* price fit: 10%

Return reason tags:

* Near You
* On Route
* Top Rated
* Available Now

## Database Requirements

### merchants

Fields:

* id
* name
* address
* lat
* lng
* location geography(Point, 4326)
* rating
* successful_orders
* price_from
* is_ev_safe
* opening_hours
* service_types

### search logs

Fields:

* id
* user_id_anonymized
* mode
* origin_lat
* origin_lng
* destination_lat
* destination_lng
* route_polyline
* filters_json
* shown_merchants_json
* clicked_merchant_id
* booked_merchant_id
* created_at

## AI Logging Requirements

Log:

* search mode
* origin
* destination
* route distance
* merchants shown
* merchant clicked
* merchant booked
* merchant rank position
* filters selected
* detour minutes

## Done Criteria

### FE

* map renders correctly
* nearby search works
* route search works
* markers and cards sync
* responsive on desktop/tablet/mobile

### BE

* route preview API works
* nearby search API works
* on-route search API works
* geo queries return valid merchants
* ranking returns sorted results with reason tags

### Data

* merchant geolocation valid
* search logs stored correctly
* required request/response contracts stable

## Phase Order

1. Embed map and render markers
2. Build nearby search
3. Build route preview and polyline rendering
4. Build on-route search
5. Add filters and ranking
6. Add AI logging

```
```
