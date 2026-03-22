import type { AuthUser } from '../auth/AuthContext';
import type { Merchant } from '../screens/explore/types';

export interface PlatformUser extends AuthUser {
  vehiclePlate?: string;
}

export interface ProviderRecord {
  id: string;
  name: string;
  branch?: string;
  city?: string;
  address?: string;
  lat: number;
  lng: number;
  rating: number;
  successfulOrders: number;
  distanceKm: number;
  detourMin?: number;
  priceFrom?: number;
  openNow: boolean;
  evSafe: boolean;
  boosted: boolean;
  serviceTypes?: string[];
  reasonCodes: string[];
}

export interface VehicleRecord {
  id: string;
  ownerId: string;
  make: string;
  model: string;
  trim: string;
  year: number;
  color: string;
  plateNumber: string;
  status: 'active' | 'charging' | 'service_due';
  mileageMiles: number;
  batteryHealthPct: number;
  nextServiceDue: string;
  nextServiceLabel: string;
  lastWashLabel: string;
  imageUrl: string;
  waterSavedLiters: number;
  co2OffsetKg: number;
  loyaltyPoints: number;
  rewardsProgressPct: number;
  subscription: string;
  rangeKm?: number;
  upcomingWash?: {
    dateLabel: string;
    provider: string;
    location: string;
    service: string;
  };
}

export interface SlotRecommendationRecord {
  providerId: string;
  slots: Array<{
    time: string;
    reason: string;
  }>;
}

export interface OwnerBookingRecord {
  id: string;
  vehicleId: string;
  plateNumber: string;
  provider: string;
  slot: string;
  state: string;
  price: number;
}

export interface PlatformData {
  users: PlatformUser[];
  providers: ProviderRecord[];
  vehicles: VehicleRecord[];
  slotRecommendations: SlotRecommendationRecord[];
  ownerBookings: OwnerBookingRecord[];
  providerBookings: Array<Record<string, unknown>>;
  campaignRequests: Array<Record<string, unknown>>;
  merchantApprovals: Array<Record<string, unknown>>;
  disputes: Array<Record<string, unknown>>;
  rankingRules: Record<string, number>;
  aiRollout: Record<string, unknown>;
  forecast: Array<Record<string, unknown>>;
}

export type SearchHit =
  | {
      id: string;
      type: 'service-center';
      title: string;
      subtitle: string;
      providerId: string;
      score: number;
    }
  | {
      id: string;
      type: 'vehicle';
      title: string;
      subtitle: string;
      vehicleId: string;
      plateNumber: string;
      score: number;
    };

const PLATFORM_MOCK_PATH = '/mock/platform-data.json';

function normalizeText(value: string) {
  return value
    .normalize('NFKD')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizePlate(value: string) {
  return value
    .normalize('NFKD')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '');
}

function scoreTextMatch(query: string, candidate: string) {
  if (!query || !candidate) return 0;
  if (candidate === query) return 520;
  if (candidate.startsWith(query)) return 420;
  if (candidate.includes(query)) return 320;

  const queryTokens = query.split(' ').filter((token) => token.length > 1);
  const candidateTokens = candidate.split(' ').filter(Boolean);

  if (queryTokens.length === 0) return 0;

  let tokenScore = 0;

  queryTokens.forEach((token) => {
    if (candidateTokens.some((candidateToken) => candidateToken === token)) {
      tokenScore += 90;
      return;
    }

    if (candidateTokens.some((candidateToken) => candidateToken.startsWith(token))) {
      tokenScore += 60;
      return;
    }

    if (candidate.includes(token)) {
      tokenScore += 35;
    }
  });

  if (tokenScore > 0) {
    return tokenScore;
  }

  return 0;
}

function scorePlateMatch(query: string, plate: string) {
  if (!query || !plate) return 0;
  if (plate === query) return 520;
  if (plate.startsWith(query)) return 420;
  if (plate.includes(query)) return 320;
  return 0;
}

export async function fetchPlatformMockData(): Promise<PlatformData> {
  const response = await fetch(PLATFORM_MOCK_PATH);
  if (!response.ok) {
    throw new Error('Unable to load local catalog');
  }

  return (await response.json()) as PlatformData;
}

export function formatVehicleName(vehicle: VehicleRecord) {
  return `${vehicle.make} ${vehicle.model}`;
}

export function formatVehicleHeadline(vehicle: VehicleRecord) {
  return `${vehicle.year} ${vehicle.make} ${vehicle.model}`;
}

export function formatVehicleSubtitle(vehicle: VehicleRecord) {
  return `${vehicle.trim} · ${vehicle.color}`;
}

export function filterVehiclesByQuery(vehicles: VehicleRecord[], query: string) {
  const normalizedTextQuery = normalizeText(query);
  const normalizedPlateQuery = normalizePlate(query);

  if (!normalizedTextQuery && !normalizedPlateQuery) {
    return vehicles;
  }

  return [...vehicles]
    .map((vehicle) => {
      const textCandidate = normalizeText(
        [
          vehicle.make,
          vehicle.model,
          vehicle.trim,
          vehicle.color,
          vehicle.plateNumber,
          vehicle.subscription,
        ]
          .filter(Boolean)
          .join(' ')
      );
      const plateCandidate = normalizePlate(vehicle.plateNumber);
      const score = Math.max(
        scoreTextMatch(normalizedTextQuery, textCandidate),
        scorePlateMatch(normalizedPlateQuery, plateCandidate)
      );

      return { score, vehicle };
    })
    .filter((entry) => entry.score > 0)
    .sort((left, right) => right.score - left.score || left.vehicle.plateNumber.localeCompare(right.vehicle.plateNumber))
    .map((entry) => entry.vehicle);
}

export function filterMerchantsByQuery(merchants: Merchant[], query: string) {
  const normalizedQuery = normalizeText(query);

  if (!normalizedQuery) {
    return merchants;
  }

  return [...merchants]
    .map((merchant) => ({
      merchant,
      score: scoreTextMatch(normalizedQuery, normalizeText(merchant.name)),
    }))
    .filter((entry) => entry.score > 0)
    .sort((left, right) => right.score - left.score || left.merchant.name.localeCompare(right.merchant.name))
    .map((entry) => entry.merchant);
}

export function searchPlatformData(
  data: PlatformData,
  query: string,
  options?: {
    ownerId?: string;
    includeVehicles?: boolean;
  }
): SearchHit[] {
  const normalizedTextQuery = normalizeText(query);
  const normalizedPlateQuery = normalizePlate(query);

  if (!normalizedTextQuery && !normalizedPlateQuery) {
    return [];
  }

  const providers = data.providers ?? [];
  const vehicles = data.vehicles ?? [];

  const providerHits = providers
    .map((provider) => {
      const haystack = normalizeText(
        [provider.name, provider.branch, provider.city, provider.address, ...(provider.serviceTypes ?? [])]
          .filter(Boolean)
          .join(' ')
      );
      const score = scoreTextMatch(normalizedTextQuery, haystack);

      if (score === 0) return null;

      return {
        id: `provider:${provider.id}`,
        type: 'service-center' as const,
        title: provider.name,
        subtitle: [provider.branch, provider.city].filter(Boolean).join(' · '),
        providerId: provider.id,
        score,
      };
    })
    .filter((item): item is Extract<SearchHit, { type: 'service-center' }> => Boolean(item));

  const scopedVehicles =
    options?.includeVehicles === false
      ? []
      : vehicles.filter((vehicle) => (options?.ownerId ? vehicle.ownerId === options.ownerId : true));

  const vehicleHits = scopedVehicles
    .map((vehicle) => {
      const textCandidate = normalizeText(
        [vehicle.make, vehicle.model, vehicle.trim, vehicle.color, vehicle.plateNumber].join(' ')
      );
      const plateCandidate = normalizePlate(vehicle.plateNumber);
      const score = Math.max(
        scoreTextMatch(normalizedTextQuery, textCandidate),
        scorePlateMatch(normalizedPlateQuery, plateCandidate)
      );

      if (score === 0) return null;

      return {
        id: `vehicle:${vehicle.id}`,
        type: 'vehicle' as const,
        title: `${formatVehicleName(vehicle)} · ${vehicle.plateNumber}`,
        subtitle: `${vehicle.year} ${vehicle.trim} · ${vehicle.color}`,
        vehicleId: vehicle.id,
        plateNumber: vehicle.plateNumber,
        score,
      };
    })
    .filter((item): item is Extract<SearchHit, { type: 'vehicle' }> => Boolean(item));

  return [...vehicleHits, ...providerHits]
    .sort((left, right) => right.score - left.score || left.title.localeCompare(right.title))
    .slice(0, 8);
}

export function mapProviderToMerchant(provider: ProviderRecord): Merchant {
  return {
    merchantId: provider.id,
    name: provider.name,
    lat: provider.lat,
    lng: provider.lng,
    rating: provider.rating,
    successfulOrders: provider.successfulOrders,
    priceFrom: Math.round(provider.priceFrom ?? 35),
    distanceFromRouteKm: provider.distanceKm,
    detourMin: provider.detourMin ?? 4,
    availableNow: provider.openNow,
    reasonTags: (provider.reasonCodes ?? []).map((code) =>
      code.replaceAll('_', ' ').replace(/\b\w/g, (char) => char.toUpperCase())
    ),
  };
}

export function getMockSearchKeyterms(data: PlatformData) {
  const keyterms = new Set<string>();

  (data.providers ?? []).forEach((provider) => {
    keyterms.add(provider.name);
    if (provider.branch) keyterms.add(provider.branch);
  });

  (data.vehicles ?? []).forEach((vehicle) => {
    keyterms.add(vehicle.plateNumber);
    keyterms.add(formatVehicleName(vehicle));
  });

  return [...keyterms].filter((term) => term.length <= 50).slice(0, 100);
}
