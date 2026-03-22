import { apiJson } from './apiClient';

export interface CreateBookingPayload {
  id: string;
  providerId: string | null;
  provider: string;
  service: string;
  /** Display / fallback slot label when no ISO time */
  slot: string;
  /** ISO8601 slot start — used for uniqueness (same day + same time in VN) */
  slot_time?: string | null;
  merchant_id?: string;
  vehicle_id?: string | null;
  price: number;
}

export async function createOwnerBooking(ownerId: string, payload: CreateBookingPayload) {
  return apiJson<Record<string, unknown>>(`/api/owners/${encodeURIComponent(ownerId)}/bookings`, {
    method: 'POST',
    userId: ownerId,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

export async function updateOwnerBookingState(
  ownerId: string,
  bookingId: string,
  state: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show'
) {
  return apiJson<Record<string, unknown>>(`/api/owners/${encodeURIComponent(ownerId)}/bookings/${encodeURIComponent(bookingId)}`, {
    method: 'PATCH',
    userId: ownerId,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ state }),
  });
}
