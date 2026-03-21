import React from 'react';
import { Sidebar } from 'primereact/sidebar';
import type { Merchant } from './types';

interface Props {
  merchant: Merchant | null;
  visible: boolean;
  onHide: () => void;
  onBook: () => void;
}

export const MerchantDetailDrawer: React.FC<Props> = ({ merchant, visible, onHide, onBook }) => (
  <Sidebar visible={visible} onHide={onHide} position="right" className="w-full max-w-md">
    {!merchant ? (
      <p className="text-sm text-slate-500">Select a merchant to view details.</p>
    ) : (
      <div className="space-y-4">
        <h3 className="font-headline text-2xl font-extrabold">{merchant.name}</h3>
        <p className="text-sm text-slate-500">Rating {merchant.rating.toFixed(1)} • {merchant.successfulOrders} successful orders</p>
        <div className="flex flex-wrap gap-2">
          {merchant.reasonTags.map((tag) => (
            <span key={tag} className="rounded-full bg-primary-container/20 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-primary">
              {tag}
            </span>
          ))}
        </div>
        <button type="button" onClick={onBook} className="rounded-full bg-primary px-5 py-2.5 text-sm font-bold text-white">
          Continue Booking
        </button>
      </div>
    )}
  </Sidebar>
);
