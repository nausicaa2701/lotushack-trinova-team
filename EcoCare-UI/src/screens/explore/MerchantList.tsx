import React from 'react';
import type { Merchant } from './types';
import { MerchantCard } from './MerchantCard';

interface Props {
  merchants: Merchant[];
  selectedMerchantId: string | null;
  onSelectMerchant: (merchantId: string) => void;
  onBookMerchant: (merchant: Merchant) => void;
}

export const MerchantList: React.FC<Props> = ({ merchants, selectedMerchantId, onSelectMerchant, onBookMerchant }) => {
  if (merchants.length === 0) {
    return <div className="rounded-3xl bg-surface-container-low p-6 text-sm text-slate-500">No merchants match current filters.</div>;
  }

  return (
    <div className="space-y-3">
      {merchants.map((merchant) => (
        <MerchantCard
          key={merchant.merchantId}
          merchant={merchant}
          selected={selectedMerchantId === merchant.merchantId}
          onSelect={() => onSelectMerchant(merchant.merchantId)}
          onBook={() => onBookMerchant(merchant)}
        />
      ))}
    </div>
  );
};
