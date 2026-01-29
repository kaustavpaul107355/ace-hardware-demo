import { Warehouse } from 'lucide-react';
import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import * as api from '@/app/services/api';

// Fix for default marker icon in production
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

// Custom warehouse icon
const warehouseIcon = new L.DivIcon({
  html: `<div style="background-color: #dc2626; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3);">
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M22 8.35V20a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8.35A2 2 0 0 1 3.26 6.5l8-3.2a2 2 0 0 1 1.48 0l8 3.2A2 2 0 0 1 22 8.35Z"></path>
      <path d="M6 18h12"></path>
      <path d="M6 14h12"></path>
      <path d="m6 10 6-3 6 3"></path>
    </svg>
  </div>`,
  className: 'custom-warehouse-marker',
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32]
});

// Component to fit map bounds to markers
function FitBounds({ locations }: { locations: api.RSCLocation[] }) {
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

export default function LiveMap({ enabled = true }: { enabled?: boolean }) {
  const [rscLocations, setRscLocations] = useState<api.RSCLocation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // OPTIMIZED: Only fetch data when map is visible (enabled=true)
    if (!enabled) {
      return;
    }
    
    async function fetchLocations() {
      try {
        const locations = await api.getRSCLocations();
        setRscLocations(locations);
      } catch (error) {
        console.error('Failed to fetch RSC locations:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchLocations();
  }, [enabled]);

  if (loading) {
    return (
      <div className="relative w-full h-96 bg-gray-100 rounded-lg flex items-center justify-center">
        <div className="text-gray-600 text-sm">Loading distribution network map...</div>
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
        
        {rscLocations.map((rsc) => (
          <Marker
            key={rsc.name}
            position={[Number(rsc.lat), Number(rsc.lng)]}
            icon={warehouseIcon}
          >
            <Popup>
              <div className="p-2">
                <div className="flex items-center gap-2 mb-2">
                  <Warehouse className="w-4 h-4 text-red-600" />
                  <div className="font-semibold text-gray-900">{rsc.city}, {rsc.state}</div>
                </div>
                <div className="text-sm text-gray-600">
                  <div className="mb-1">Retail Support Center</div>
                  <div className="text-xs text-gray-500">
                    {Number(rsc.shipment_count).toLocaleString()} shipments processed
                  </div>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
        
        <FitBounds locations={rscLocations} />
      </MapContainer>
      
      {/* Legend overlay */}
      <div className="absolute top-4 right-4 bg-white rounded-lg shadow-lg p-3 text-sm border border-gray-200 z-[1000]">
        <div className="flex items-center gap-2 mb-1">
          <Warehouse className="w-4 h-4 text-red-600" />
          <div className="font-semibold text-gray-900">Distribution Network</div>
        </div>
        <div className="text-xs text-gray-600">
          {rscLocations.length} RSC locations
        </div>
      </div>
    </div>
  );
}
