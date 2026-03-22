import React from 'react';
import { Button } from 'primereact/button';
import { Dropdown } from 'primereact/dropdown';
import { useAuth } from '../../auth/AuthContext';

const bookingStateOptions: {
  label: string;
  value: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show';
}[] = [
  { label: 'pending', value: 'pending' },
  { label: 'confirmed', value: 'confirmed' },
  { label: 'in_progress', value: 'in_progress' },
  { label: 'completed', value: 'completed' },
  { label: 'cancelled', value: 'cancelled' },
  { label: 'no_show', value: 'no_show' },
];
import { useMockData } from '../../hooks/useMockData';
import { patchProviderBookingState, useProviderBookings } from '../../hooks/useProviderApi';

export const ProviderBookings = () => {
  const { user, activeRole } = useAuth();
  const { data: mockData } = useMockData();
  const providerApiId =
    activeRole === 'provider' ? (user?.providerAccountId ?? user?.id) : undefined;
  const { bookings, loading, error, reload } = useProviderBookings(providerApiId);
  const [busyId, setBusyId] = React.useState<string | null>(null);

  const updateBookingState = async (
    bookingId: string,
    state: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show'
  ) => {
    if (!providerApiId) return;
    setBusyId(bookingId);
    try {
      await patchProviderBookingState(providerApiId, bookingId, state);
      await reload();
    } finally {
      setBusyId(null);
    }
  };

  const ownerLabel = React.useCallback(
    (ownerId: string) => mockData?.users.find((u) => u.id === ownerId)?.name ?? ownerId,
    [mockData?.users]
  );

  if (!providerApiId) {
    return (
      <div className="rounded-3xl bg-surface-container-low p-6 text-sm text-slate-500">
        Switch to the provider role to manage bookings.
      </div>
    );
  }

  if (loading) return <div className="rounded-3xl bg-surface-container-low p-6 text-sm text-slate-500">Loading booking queue...</div>;
  if (error) return <div className="rounded-3xl bg-red-50 p-6 text-sm text-red-600">{error}</div>;
  if (bookings.length === 0)
    return (
      <div className="space-y-4">
        <header>
          <h2 className="font-headline text-3xl font-extrabold">Booking Queue</h2>
          <p className="mt-1 text-slate-500">No bookings yet for this provider account.</p>
        </header>
        <Button
          type="button"
          label="Refresh"
          onClick={() => void reload()}
          className="rounded-full bg-primary px-4 py-2 text-xs font-bold text-white border-none"
        />
      </div>
    );

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="font-headline text-3xl font-extrabold">Booking Queue</h2>
          <p className="mt-1 text-slate-500">Update booking status and process service orders.</p>
        </div>
        <Button
          type="button"
          label="Refresh"
          onClick={() => void reload()}
          text
          className="w-fit rounded-full border border-outline-variant px-4 py-2 text-xs font-bold text-slate-600 hover:bg-surface-container-low"
        />
      </header>
      <div className="overflow-hidden rounded-3xl bg-surface-container-lowest shadow-sm">
        <div className="grid grid-cols-1 gap-2 bg-surface-container-low px-6 py-4 text-xs font-bold uppercase tracking-widest text-slate-400 sm:grid-cols-[1fr_1fr_auto]">
          <span>Owner</span>
          <span>Service</span>
          <span className="text-right sm:text-right">Status</span>
        </div>
        <div className="divide-y divide-slate-100">
          {bookings.map((booking) => (
            <div key={booking.id} className="grid grid-cols-1 items-start gap-3 px-6 py-4 sm:grid-cols-[1fr_1fr_auto] sm:items-center">
              <span className="font-semibold">{ownerLabel(booking.owner)}</span>
              <span className="text-slate-600">{booking.service}</span>
              <div className="flex flex-wrap items-center justify-end gap-2">
                <span className="text-sm font-bold text-primary">{booking.state}</span>
                <Dropdown
                  aria-label={`Update status for booking ${booking.id}`}
                  disabled={busyId === booking.id}
                  value={booking.state}
                  options={bookingStateOptions}
                  optionLabel="label"
                  optionValue="value"
                  onChange={(e) =>
                    void updateBookingState(
                      booking.id,
                      e.value as 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show'
                    )
                  }
                  className="max-w-[11rem] text-xs font-bold"
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
