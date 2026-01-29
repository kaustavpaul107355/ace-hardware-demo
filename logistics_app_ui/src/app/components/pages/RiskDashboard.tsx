import { AlertTriangle, MapPin, Clock, TrendingUp, Package } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { KPICardSkeleton } from '@/app/components/ui/LoadingSkeleton';
import * as api from '@/app/services/api';

export default function RiskDashboard() {
  const [showContent, setShowContent] = useState(false);

  // Use React Query for caching and automatic refetching
  const { data: riskData = [], isLoading, error } = useQuery({
    queryKey: ['riskStores', 50],
    queryFn: () => api.getRiskStores(50),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  // Add minimum display time for skeletons (500ms) to prevent flashing
  useEffect(() => {
    if (!isLoading && riskData.length > 0) {
      const timer = setTimeout(() => {
        setShowContent(true);
      }, 500);
      return () => clearTimeout(timer);
    } else {
      setShowContent(false);
    }
  }, [isLoading, riskData]);

  const getRiskColor = (score: number) => {
    if (score >= 80) return 'bg-red-500';
    if (score >= 60) return 'bg-amber-500';
    if (score >= 40) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getRiskBadge = (tier: string) => {
    if (tier === 'CRITICAL') return { text: 'Critical', class: 'bg-red-100 text-red-700' };
    if (tier === 'HIGH') return { text: 'High', class: 'bg-amber-100 text-amber-700' };
    if (tier === 'MEDIUM') return { text: 'Medium', class: 'bg-yellow-100 text-yellow-700' };
    return { text: 'Low', class: 'bg-green-100 text-green-700' };
  };

  // Format large numbers with K/M suffix
  const formatRevenue = (value: number): string => {
    if (value >= 1_000_000) {
      return `$${(value / 1_000_000).toFixed(2)}M`;
    } else if (value >= 1_000) {
      return `$${(value / 1_000).toFixed(1)}K`;
    } else {
      return `$${value.toFixed(0)}`;
    }
  };

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <h3 className="text-red-800 font-semibold mb-2">Unable to Load Risk Data</h3>
        <p className="text-red-600 text-sm">
          {error instanceof Error ? error.message : 'Failed to load risk assessment data'}
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

  const criticalRiskStores = riskData.filter(store => store.riskTier === 'CRITICAL').length;
  const highRiskStores = riskData.filter(store => store.riskTier === 'HIGH').length;
  const totalRevenueAtRisk = riskData.reduce((sum, s) => sum + (Number(s.revenueAtRisk) || 0), 0);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Inventory Fulfillment Risk
        </h1>
        <p className="text-gray-600">
          Predictive stockout analysis and recommended actions by store
        </p>
      </div>

      {/* Summary Cards with Loading Animation */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {isLoading || !showContent ? (
          <>
            <KPICardSkeleton />
            <KPICardSkeleton />
            <KPICardSkeleton />
            <KPICardSkeleton />
          </>
        ) : (
          <>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 animate-fade-in stagger-1">
              <div className="flex items-center gap-3 mb-2">
                <AlertTriangle className="w-8 h-8 text-red-500" />
                <div>
                  <div className="text-2xl font-bold text-gray-900">{criticalRiskStores}</div>
                  <div className="text-sm text-gray-600">Critical Risk</div>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 animate-fade-in stagger-2">
              <div className="flex items-center gap-3 mb-2">
                <TrendingUp className="w-8 h-8 text-amber-500" />
                <div>
                  <div className="text-2xl font-bold text-gray-900">{highRiskStores}</div>
                  <div className="text-sm text-gray-600">High Risk</div>
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-red-50 to-orange-50 rounded-xl shadow-sm border-2 border-red-200 p-6 animate-fade-in stagger-3">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 bg-red-500 rounded-xl flex items-center justify-center">
                  <Package className="w-7 h-7 text-white" />
                </div>
                <div>
                  <div className="text-3xl font-bold text-red-700">
                    {formatRevenue(totalRevenueAtRisk)}
                  </div>
                  <div className="text-sm font-medium text-red-600">Total Revenue at Risk</div>
                  <div className="text-xs text-gray-600 mt-0.5">
                    Across {riskData.length} monitored stores
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 animate-fade-in stagger-4">
              <div className="flex items-center gap-3 mb-2">
                <Clock className="w-8 h-8 text-[#FF7900]" />
                <div>
                  <div className="text-2xl font-bold text-gray-900">{riskData.length}</div>
                  <div className="text-sm text-gray-600">Stores Monitored</div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Risk Heatmap Visual */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          Regional Risk Heatmap
        </h2>
        <p className="text-sm text-gray-600 mb-4">
          Store clusters by stockout risk level (5 rows × 10 columns)
        </p>
        <div className="grid grid-cols-5 md:grid-cols-10 gap-2">
          {riskData.map((store) => {
            const badge = getRiskBadge(store.riskTier);
            return (
              <div
                key={store.storeId}
                className={`p-2 rounded-lg ${getRiskColor(store.riskScore)} bg-opacity-10 border-2 ${
                  getRiskColor(store.riskScore).replace('bg-', 'border-')
                } hover:shadow-md transition-shadow cursor-pointer`}
                title={`${store.storeId} - ${store.location}: ${formatRevenue(Number(store.revenueAtRisk) || 0)} at risk (Score: ${store.riskScore})`}
              >
                <div className="text-xs font-medium text-gray-900 truncate">{store.storeId}</div>
                <div className={`text-xs mt-1 font-bold ${
                  store.riskTier === 'CRITICAL' ? 'text-red-700' : 
                  store.riskTier === 'HIGH' ? 'text-amber-700' : 'text-green-700'
                }`}>
                  {store.riskScore}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Risk Forecast Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Store Risk Forecast</h2>
          <p className="text-sm text-gray-600 mt-1">
            Prioritized list of stores by fulfillment risk
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Store ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Location
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Risk Score
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Primary Delay
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Revenue at Risk
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Risk Tier
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {riskData.map((store) => {
                const badge = getRiskBadge(store.riskTier);
                return (
                  <tr key={store.storeId} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {store.storeId}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-600">{store.location}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden w-24">
                          <div
                            className={`h-full ${getRiskColor(store.riskScore)}`}
                            style={{ width: `${store.riskScore}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium text-gray-900">{store.riskScore}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {store.primaryDelay}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-bold text-red-600">
                        {formatRevenue(Number(store.revenueAtRisk) || 0)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${badge.class}`}>
                        {badge.text}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Business Impact Context */}
      <div className="bg-gradient-to-r from-red-50 to-orange-50 rounded-xl border border-red-100 p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-red-600 rounded-lg flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              Proactive Inventory Management
            </h3>
            <p className="text-gray-700 mb-3">
              This dashboard uses real-time fulfillment data to predict stockout risk across Ace's network. Risk scores combine historical delivery patterns, current transit delays, and store-specific factors to prioritize intervention efforts.
            </p>
            <div className="flex items-center gap-6 text-sm text-gray-600">
              <div>
                <span className="font-semibold text-gray-900">Predictive</span> risk scoring
              </div>
              <div>
                <span className="font-semibold text-gray-900">Real-time</span> updates
              </div>
              <div>
                <span className="font-semibold text-gray-900">Actionable</span> insights
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
