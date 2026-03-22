import React from 'react';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { Dropdown } from 'primereact/dropdown';
import type { AuthUser } from '../../auth/AuthContext';
import type { Merchant } from './types';
import type { SlotRecommendationUi } from '../../lib/slotsApi';
import type { VehicleRecord } from '../../lib/platformMock';
import { ApiError } from '../../lib/apiClient';

const NEXT_VALUE = '__NEXT_AVAILABLE__';

type SlotOption = {
  label: string;
  shortLabel: string;
  reason: string;
  value: string;
};

export interface BookingConfirmResult {
  slotLabel: string;
  slotTimeIso: string | null;
  vehicleId: string | null;
}

interface Props {
  visible: boolean;
  onHide: () => void;
  merchant: Merchant | null;
  user: AuthUser | null;
  vehicles: VehicleRecord[];
  slots: SlotRecommendationUi[];
  submitting: boolean;
  onConfirm: (result: BookingConfirmResult) => Promise<void>;
}

export const BookingConfirmDialog: React.FC<Props> = ({
  visible,
  onHide,
  merchant,
  user,
  vehicles,
  slots,
  submitting,
  onConfirm,
}) => {
  const ownerVehicles = React.useMemo(() => vehicles.filter((v) => v.ownerId === user?.id), [vehicles, user?.id]);

  const slotOptions = React.useMemo((): SlotOption[] => {
    const fromApi = slots.map((s) => ({
      label: `${s.timeLabel} · ${s.reason}`,
      shortLabel: s.timeLabel,
      reason: s.reason,
      value: s.slotTime,
    }));
    return [
      ...fromApi,
      {
        label: 'Next available (any slot)',
        shortLabel: 'Next available',
        reason: '',
        value: NEXT_VALUE,
      },
    ];
  }, [slots]);

  const [selectedSlot, setSelectedSlot] = React.useState<string | null>(null);
  const [selectedVehicleId, setSelectedVehicleId] = React.useState<string | null>(null);
  const [localError, setLocalError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!visible || !merchant) return;
    setLocalError(null);
    if (slots.length > 0) {
      const firstWithTime = slots.find((s) => (s.slotTime ?? '').trim().length > 0);
      setSelectedSlot(firstWithTime?.slotTime ?? NEXT_VALUE);
    } else {
      setSelectedSlot(NEXT_VALUE);
    }
    if (ownerVehicles.length === 1) {
      setSelectedVehicleId(ownerVehicles[0].id);
    } else if (ownerVehicles.length === 0) {
      setSelectedVehicleId(null);
    } else {
      setSelectedVehicleId((prev) => prev ?? ownerVehicles[0]?.id ?? null);
    }
  }, [visible, merchant, slots, ownerVehicles]);

  const handleConfirm = async () => {
    if (!merchant || !user) return;
    setLocalError(null);
    if (ownerVehicles.length >= 2 && !selectedVehicleId) {
      setLocalError('Select which vehicle to service.');
      return;
    }
    let slotLabel = 'Next available';
    let slotTimeIso: string | null = null;
    if (selectedSlot && selectedSlot !== NEXT_VALUE) {
      const pick = slots.find((s) => s.slotTime === selectedSlot);
      slotTimeIso = selectedSlot;
      slotLabel = pick ? pick.timeLabel : selectedSlot;
    }
    try {
      await onConfirm({
        slotLabel,
        slotTimeIso,
        vehicleId: ownerVehicles.length >= 2 ? selectedVehicleId : ownerVehicles[0]?.id ?? null,
      });
    } catch (e) {
      const msg =
        e instanceof ApiError
          ? e.message
          : e instanceof Error
            ? e.message
            : 'Could not complete booking';
      setLocalError(msg);
    }
  };

  const slotValueTemplate = (option: SlotOption | null) => {
    if (!option) {
      return <span className="text-slate-500">Choose a slot</span>;
    }
    return (
      <span className="block min-w-0 whitespace-normal break-words text-left leading-snug text-slate-900">
        {option.shortLabel}
      </span>
    );
  };

  const slotItemTemplate = (option: SlotOption) => (
    <div className="flex flex-col gap-0.5 py-1 text-left">
      <span className="font-semibold text-slate-900">{option.shortLabel}</span>
      {option.reason ? (
        <span className="text-xs font-medium leading-snug text-slate-500">{option.reason}</span>
      ) : null}
    </div>
  );

  return (
    <Dialog
      header="Confirm booking"
      visible={visible}
      onHide={onHide}
      className="booking-confirm-dialog w-[min(100vw-1.5rem,36rem)] max-w-[min(100vw-1.5rem,36rem)] sm:w-full"
      contentClassName="booking-confirm-dialog-content overflow-visible"
      draggable={false}
      dismissableMask
      blockScroll
    >
      {merchant && user ? (
        <div className="flex min-w-0 flex-col gap-4 pt-1">
          <div className="rounded-2xl bg-surface-container-low p-4 text-sm">
            <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Service center</p>
            <p className="mt-1 font-headline text-lg font-bold text-slate-900">{merchant.name}</p>
            <p className="mt-3 text-[11px] font-bold uppercase tracking-widest text-slate-400">Owner</p>
            <p className="font-semibold text-slate-800">{user.name}</p>
            <p className="text-slate-500">{user.email}</p>
          </div>

          <div className="min-w-0">
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500" htmlFor="book-slot">
              Wash slot
            </label>
            <div className="relative w-full min-w-0">
              <Dropdown
                inputId="book-slot"
                value={selectedSlot}
                options={slotOptions}
                optionLabel="label"
                optionValue="value"
                valueTemplate={slotValueTemplate}
                itemTemplate={slotItemTemplate}
                onChange={(e) => setSelectedSlot(e.value as string)}
                className="w-full min-w-0"
                panelClassName="booking-confirm-slot-panel"
                appendTo="self"
                placeholder="Choose a slot"
              />
            </div>
          </div>

          {ownerVehicles.length >= 2 ? (
            <div className="min-w-0">
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500" htmlFor="book-vehicle">
                Vehicle
              </label>
              <div className="relative w-full min-w-0">
                <Dropdown
                  inputId="book-vehicle"
                  value={selectedVehicleId}
                  options={ownerVehicles.map((v) => ({
                    label: `${v.plateNumber} · ${v.year} ${v.make} ${v.model}`,
                    value: v.id,
                  }))}
                  optionLabel="label"
                  optionValue="value"
                  onChange={(e) => setSelectedVehicleId(e.value as string)}
                  className="w-full min-w-0"
                  panelClassName="booking-confirm-vehicle-panel"
                  appendTo="self"
                  placeholder="Select vehicle"
                />
              </div>
            </div>
          ) : ownerVehicles.length === 1 ? (
            <p className="text-xs text-slate-500">
              Vehicle:{' '}
              <span className="font-semibold text-slate-700">
                {ownerVehicles[0].plateNumber} · {ownerVehicles[0].make} {ownerVehicles[0].model}
              </span>
            </p>
          ) : null}

          {localError ? <p className="text-sm font-medium text-red-600">{localError}</p> : null}

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" label="Cancel" text onClick={onHide} disabled={submitting} className="border-none" />
            <Button
              type="button"
              label={submitting ? 'Booking…' : 'Confirm'}
              onClick={() => void handleConfirm()}
              disabled={submitting}
              className="border-none"
            />
          </div>
        </div>
      ) : null}
    </Dialog>
  );
};
