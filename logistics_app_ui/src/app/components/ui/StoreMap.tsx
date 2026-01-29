import { Store } from 'lucide-react';
import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import * as api from '@/app/services/api';

// Custom store icon
const storeIcon = new L.DivIcon({
  html: `<div style="background-color: #10b981; width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 2px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.3);">
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
      <path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7"></path>
      <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"></path>
      <path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4"></path>
      <path d="M2 7h20"></path>
      <path d="M22 7v3a2 2 0 0 1-2 2v0a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 16 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 12 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 8 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 4 12v0a2 2 0 0 1-2-2V7"></path>
    </svg>
  </div>`,
  className: 'custom-store-marker',
  iconSize: [24, 24],
  iconAnchor: [12, 24],
  popupAnchor: [0, -24]
});

// Component to fit map bounds to markers
function FitBounds({ locations }: { locations: api.StoreLocation[] }) {
  const map = useMap();
  
  useEffect(() => {
    if (locations.length > 0) {
      const bounds = L.latLngBounds(
        locations.map(loc => [Number(loc.lat), Number(loc.lng)])
      );
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [locations, map]);
  
  return null;
}

export default function StoreMap({ enabled = true }: { enabled?: boolean }) {
  const [storeLocations, setStoreLocations] = useState<api.StoreLocation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // OPTIMIZED: Only fetch data when map is visible (enabled=true)
    if (!enabled) {
      return;
    }
    
    async function fetchLocations() {
      try {
        const locations = await api.getStoreLocations();
        setStoreLocations(locations);
      } catch (error) {
        console.error('Failed to fetch store locations:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchLocations();
  }, [enabled]);

  if (loading) {
    return (
      <div className="relative w-full h-96 bg-gray-100 rounded-lg flex items-center justify-center">
        <div className="text-gray-600 text-sm">Loading store network map...</div>
      </div>
    );
  }

  // Default center (US geographic center)
  const defaultCenter: [number, number] = [39.8283, -98.5795];

  return (
    <div className="relative w-full h-96 rounded-lg overflow-hidden border border-gray-200">
      <MapContainer
        center={defaultCenter}
        zoom={4}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {storeLocations.map((store) => (
          <Marker
            key={store.store_id}
            position={[Number(store.lat), Number(store.lng)]}
            icon={storeIcon}
          >
            <Popup>
              <div className="p-2">
                <div className="flex items-center gap-2 mb-2">
                  <Store className="w-4 h-4 text-green-600" />
                  <div className="font-semibold text-gray-900">{store.city}, {store.state}</div>
                </div>
                <div className="text-sm text-gray-600 space-y-1">
                  <div>Store ID: <span className="font-medium">{store.store_id}</span></div>
                  <div>Weekly Revenue: <span className="font-medium text-green-600">
                    ${Number(store.weekly_revenue).toLocaleString()}
                  </span></div>
                  <div>
                    Status: <span className={`font-medium ${
                      store.status === 'active' ? 'text-green-600' : 'text-gray-400'
                    }`}>
                      {store.status === 'active' ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
        
        <FitBounds locations={storeLocations} />
      </MapContainer>
      
      {/* Legend overlay */}
      <div className="absolute top-4 right-4 bg-white rounded-lg shadow-lg p-3 text-sm border border-gray-200 z-[1000]">
        <div className="flex items-center gap-2 mb-1">
          <Store className="w-4 h-4 text-green-600" />
          <div className="font-semibold text-gray-900">Store Network</div>
        </div>
        <div className="text-xs text-gray-600">
          {storeLocations.length} retail locations
        </div>
      </div>
    </div>
  );
}
