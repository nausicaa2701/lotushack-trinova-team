export type SearchMode = 'nearby' | 'on-route';

export interface LatLng {
  lat: number;
  lng: number;
}

export interface ExploreFilters {
  openNow: boolean;
  evSafe: boolean;
  minRating: number;
  serviceTypes: string[];
  radiusKm: number;
  maxDetourKm: number;
}

export interface Merchant {
  merchantId: string;
  name: string;
  lat: number;
  lng: number;
  rating: number;
  successfulOrders: number;
  priceFrom: number;
  distanceFromRouteKm?: number;
  /** Alias used by some UI (km from search origin). */
  distanceKm?: number;
  detourMin?: number;
  availableNow: boolean;
  reasonTags: string[];
  openNow?: boolean;
  evSafe?: boolean;
  address?: string;
  serviceTypes?: string[];
}

export interface RoutePreviewResponse {
  distanceKm: number;
  durationMin: number;
  polyline?: string;
  bounds?: {
    north: number;
    south: number;
    east: number;
    west: number;
  };
}
