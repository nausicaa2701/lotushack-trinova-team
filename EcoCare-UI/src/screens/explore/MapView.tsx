import React, { useEffect } from 'react';
import { MapContainer, Marker, Popup, TileLayer, Polyline, useMap } from 'react-leaflet';
import type { LatLng, Merchant } from './types';
import 'leaflet/dist/leaflet.css';

interface Props {
  center: LatLng;
  merchants: Merchant[];
  routeLine: LatLng[];
  selectedMerchantId: string | null;
  onSelectMerchant: (merchantId: string) => void;
}

const FitToData = ({ center, merchants, routeLine }: { center: LatLng; merchants: Merchant[]; routeLine: LatLng[] }) => {
  const map = useMap();
  useEffect(() => {
    const points = [
      ...merchants.map((m) => [m.lat, m.lng] as [number, number]),
      ...routeLine.map((p) => [p.lat, p.lng] as [number, number]),
    ];
    if (points.length >= 2) {
      map.fitBounds(points, { padding: [30, 30] });
    } else {
      map.setView([center.lat, center.lng], 13);
    }
  }, [map, center.lat, center.lng, merchants, routeLine]);
  return null;
};

export const MapView: React.FC<Props> = ({ center, merchants, routeLine, selectedMerchantId, onSelectMerchant }) => (
  <div className="h-[420px] overflow-hidden rounded-3xl border border-outline-variant/20 bg-surface-container-lowest shadow-sm lg:h-[640px]">
    <MapContainer center={[center.lat, center.lng]} zoom={13} className="h-full w-full">
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <FitToData center={center} merchants={merchants} routeLine={routeLine} />
      {routeLine.length > 1 && <Polyline positions={routeLine.map((p) => [p.lat, p.lng])} color="#005bc1" weight={4} opacity={0.7} />}
      {merchants.map((merchant) => (
        <Marker key={merchant.merchantId} position={[merchant.lat, merchant.lng]} eventHandlers={{ click: () => onSelectMerchant(merchant.merchantId) }}>
          <Popup>
            <div className="text-sm">
              <p className="font-bold">{merchant.name}</p>
              <p>Rating: {merchant.rating}</p>
              <p className={selectedMerchantId === merchant.merchantId ? 'text-primary font-bold' : ''}>
                {selectedMerchantId === merchant.merchantId ? 'Selected' : 'Click to select'}
              </p>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  </div>
);
