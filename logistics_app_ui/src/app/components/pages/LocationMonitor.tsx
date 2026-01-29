import { MapPin, Building2, Store, Network, TrendingUp, AlertCircle } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import LiveMap from '@/app/components/ui/LiveMap';
import StoreMap from '@/app/components/ui/StoreMap';
import { KPICardSkeleton, MapSkeleton } from '@/app/components/ui/LoadingSkeleton';
import * as api from '@/app/services/api';

export default function LocationMonitor() {
  const [activeView, setActiveView] = useState<'distribution' | 'stores'>('distribution');
  const [showContent, setShowContent] = useState(false);

  // OPTIMIZED: Use combined endpoint - single API call instead of 2
  const { data: locationData, isLoading, error } = useQuery({
    queryKey: ['locationMonitorData'],
    queryFn: api.getLocationMonitorData,
    staleTime: 2 * 60 * 1000,
  });

  const rscStats = locationData?.rscStats || [];
  const networkStats = locationData?.networkStats || null;

  // Add minimum display time for skeletons (500ms) to prevent flashing
  useEffect(() => {
    if (!isLoading && locationData) {
      const timer = setTimeout(() => {
        setShowContent(true);
      }, 500);
      return () => clearTimeout(timer);
    } else {
      setShowContent(false);
    }
  }, [isLoading, locationData]);

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <h3 className="text-red-800 font-semibold mb-2">Unable to Load Location Data</h3>
        <p className="text-red-600 text-sm">
          {error instanceof Error ? error.message : 'Failed to load location monitoring data'}
        </p>
        <button 
          onClick={() => window.location.reload()} 
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Location Monitor</h1>
          <p className="text-gray-600 mt-1">Network-wide distribution and store coverage</p>
        </div>
      </div>

      {/* Network Overview Stats with Loading Animation */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {isLoading || !showContent ? (
          <>
            <KPICardSkeleton />
            <KPICardSkeleton />
            <KPICardSkeleton />
            <KPICardSkeleton />
          </>
        ) : (
          <>
            <div className="bg-white rounded-lg border border-gray-200 p-5 animate-fade-in stagger-1">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Building2 className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Distribution Centers</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {networkStats?.majorRSCs || 0}
                    <span className="text-lg text-gray-500 ml-1">/ {networkStats?.totalRSCs || 0}</span>
                  </p>
                  <p className="text-xs text-gray-500">Major / Total RSCs</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-5 animate-fade-in stagger-2">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Store className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Active Stores</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {networkStats?.activeStores || 0}
                    <span className="text-sm text-gray-500 ml-1">
                      / {networkStats?.totalStores || 0}
                    </span>
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-5 animate-fade-in stagger-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Network className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Coverage</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {networkStats?.coveragePercent || 0}%
                  </p>
                  <p className="text-xs text-gray-500">{networkStats?.statesCovered || 0} states</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-5 animate-fade-in stagger-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <AlertCircle className="w-6 h-6 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">At-Risk Stores</p>
                  <p className="text-2xl font-bold text-gray-900">{networkStats?.atRiskStores || 0}</p>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Map View Tabs */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveView('distribution')}
            className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
              activeView === 'distribution'
                ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-700'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <Building2 className="w-5 h-5" />
              Distribution Network
            </div>
          </button>
          <button
            onClick={() => setActiveView('stores')}
            className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
              activeView === 'stores'
                ? 'bg-green-50 text-green-700 border-b-2 border-green-700'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <Store className="w-5 h-5" />
              Store Network
            </div>
          </button>
        </div>

        {/* Map Container - Larger height for better visibility */}
        <div className="p-6">
          {isLoading || !showContent ? (
            <MapSkeleton />
          ) : (
            <>
              {activeView === 'distribution' ? (
                <div className="h-[500px] animate-fade-in stagger-5">
                  <LiveMap enabled={activeView === 'distribution'} />
                </div>
              ) : (
                <div className="h-[500px] animate-fade-in stagger-5">
                  <StoreMap enabled={activeView === 'stores'} />
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* RSC Statistics */}
      {activeView === 'distribution' && rscStats.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Building2 className="w-6 h-6 text-blue-600" />
            Distribution Center Performance
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {rscStats.map((rsc) => (
              <div key={rsc.name} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-gray-900">{rsc.name}</h3>
                    <span className={`inline-block mt-1 px-2 py-0.5 text-xs font-medium rounded-full ${
                      rsc.status === 'active' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {rsc.status}
                    </span>
                  </div>
                  <MapPin className="w-5 h-5 text-blue-600" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Active Routes</span>
                    <span className="font-semibold text-gray-900">{rsc.activeRoutes}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Stores Served</span>
                    <span className="font-semibold text-gray-900">{rsc.storesServed}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Avg Distance</span>
                    <span className="font-semibold text-gray-900">{rsc.avgDistance} km</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Store Network Health */}
      {activeView === 'stores' && networkStats && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Store className="w-6 h-6 text-green-600" />
            Store Network Health
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-gray-700">Network Status</h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm text-gray-600">Total Stores</span>
                  <span className="font-semibold text-gray-900">{networkStats.totalStores}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <span className="text-sm text-gray-600">Active Stores</span>
                  <span className="font-semibold text-green-700">
                    {networkStats.activeStores} ({Math.round((networkStats.activeStores / networkStats.totalStores) * 100)}%)
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-sm font-medium text-gray-700">Geographic Coverage</h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm text-gray-600">States Covered</span>
                  <span className="font-semibold text-gray-900">{networkStats.statesCovered}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                  <span className="text-sm text-gray-600">Coverage Rate</span>
                  <span className="font-semibold text-purple-700">{networkStats.coveragePercent}%</span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-sm font-medium text-gray-700">Performance Metrics</h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm text-gray-600">Avg Delivery Time</span>
                  <span className="font-semibold text-gray-900">{networkStats.avgDeliveryDays} days</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                  <span className="text-sm text-gray-600">At-Risk Stores</span>
                  <span className="font-semibold text-orange-700">{networkStats.atRiskStores}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
