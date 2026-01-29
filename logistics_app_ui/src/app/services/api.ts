/**
 * API Client for ACE Hardware Logistics Dashboard
 * Connects React frontend to backend server
 */

// When deployed as Databricks App, API is served from same origin
// For local dev, use VITE_API_URL or default to localhost:5001
const API_BASE_URL = import.meta.env.VITE_API_URL || (
  window.location.origin.includes('databricksapps.com') ? '' : 'http://localhost:5001'
);

/**
 * Generic fetch wrapper with error handling
 */
async function fetchAPI<T>(endpoint: string): Promise<T> {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`);
    
    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`Failed to fetch ${endpoint}:`, error);
    throw error;
  }
}

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface KPIData {
  network_throughput: number;
  late_arrivals: number;
  late_arrivals_percent: number;
  avg_delay: number;
  data_quality_score: number;
}

export interface RegionalStatus {
  name: string;
  trucks: number;
  utilization: number;
  status: 'normal' | 'warning' | 'critical';
}

export interface ThroughputData {
  hour: string;
  trucks: number;
}

export interface FleetTruck {
  id: string;
  origin: string;
  destination: string;
  eta: string;
  delay: number;
  status: 'on-time' | 'minor-delay' | 'delayed';
  productCategory: string;
  shipmentValue: number;
}

export interface RiskStore {
  storeId: string;
  location: string;
  riskScore: number;
  primaryDelay: string;
  revenueAtRisk: number;
  riskTier: 'CRITICAL' | 'HIGH' | 'MEDIUM';
}

export interface DelayCause {
  cause: string;
  count: number;
  percentage: number;
}

export interface ETAAccuracy {
  time: string;
  actual: number;
  predicted: number;
}

export interface TruckLocation {
  id: string;
  lat: number;
  lng: number;
  status: 'on-time' | 'minor-delay' | 'delayed';
  eta: string;
  region: string;
}

export interface RSCLocation {
  name: string;
  city: string;
  state: string;
  lat: number;
  lng: number;
  shipment_count: number;
}

export interface StoreLocation {
  store_id: number;
  city: string;
  state: string;
  lat: number;
  lng: number;
  weekly_revenue: number;
  status: 'active' | 'inactive';
}

export interface Alert {
  id: number;
  type: 'critical' | 'warning' | 'info';
  title: string;
  description: string;
  timestamp: string;
  actionRequired: boolean;
}

export interface RSCStats {
  name: string;
  activeRoutes: number;
  storesServed: number;
  avgDistance: number;
  status: string;
}

export interface NetworkStats {
  totalStores: number;
  activeStores: number;
  statesCovered: number;
  atRiskStores: number;
  majorRSCs: number;  // Major distribution centers (high volume)
  totalRSCs: number;  // Total RSCs shown on map
  coveragePercent: number;
  avgDeliveryDays: number;
}

// ============================================================================
// API FUNCTIONS
// ============================================================================

/**
 * Fetch all overview data in a single optimized request
 * Combines KPIs, throughput, regional status, and location data
 */
export interface OverviewData {
  kpis: KPIData;
  throughput: ThroughputData[];
  regional: RegionalStatus[];
  rscLocations: RSCLocation[];
  storeLocations: StoreLocation[];
}

export async function getOverviewData(): Promise<OverviewData> {
  return fetchAPI<OverviewData>('/api/overview');
}

/**
 * Fetch executive KPIs for home dashboard
 */
export async function getKPIs(): Promise<KPIData> {
  return fetchAPI<KPIData>('/api/kpis');
}

/**
 * Fetch regional performance status
 */
export async function getRegionalStatus(): Promise<RegionalStatus[]> {
  return fetchAPI<RegionalStatus[]>('/api/regions');
}

/**
 * Fetch 24-hour throughput trend data
 */
export async function getThroughputData(): Promise<ThroughputData[]> {
  return fetchAPI<ThroughputData[]>('/api/throughput');
}

/**
 * Fetch active fleet tracking data
 */
export async function getFleetData(limit: number = 50): Promise<FleetTruck[]> {
  return fetchAPI<FleetTruck[]>(`/api/fleet?limit=${limit}`);
}

/**
 * Fetch store risk assessment data
 */
export async function getRiskStores(limit: number = 20): Promise<RiskStore[]> {
  return fetchAPI<RiskStore[]>(`/api/risk-stores?limit=${limit}`);
}

/**
 * Fetch delay root cause analysis
 */
export async function getDelayCauses(days: number = 7): Promise<DelayCause[]> {
  const data = await fetchAPI<any[]>(`/api/delay-causes?days=${days}`);
  // Convert string values to numbers (SQL connector returns strings)
  return data.map(item => ({
    cause: item.cause,
    count: Number(item.count),
    percentage: Number(item.percentage)
  }));
}

/**
 * Fetch ETA prediction accuracy data
 */
export async function getETAAccuracy(): Promise<ETAAccuracy[]> {
  return fetchAPI<ETAAccuracy[]>('/api/eta-accuracy');
}

/**
 * Fetch truck GPS locations for live map
 */
export async function getTruckLocations(): Promise<TruckLocation[]> {
  return fetchAPI<TruckLocation[]>('/api/truck-locations');
}

/**
 * Fetch RSC (Retail Support Center) locations
 */
export async function getRSCLocations(): Promise<RSCLocation[]> {
  return fetchAPI<RSCLocation[]>('/api/rsc-locations');
}

/**
 * Fetch store locations
 */
export async function getStoreLocations(): Promise<StoreLocation[]> {
  return fetchAPI<StoreLocation[]>('/api/store-locations');
}

/**
 * Fetch RSC statistics (routes, stores served, avg distance)
 */
export async function getRSCStats(): Promise<RSCStats[]> {
  return fetchAPI<RSCStats[]>('/api/rsc-stats');
}

/**
 * Fetch network-wide statistics
 */
export async function getNetworkStats(): Promise<NetworkStats> {
  return fetchAPI<NetworkStats>('/api/network-stats');
}

/**
 * OPTIMIZED: Fetch both RSC stats and network stats in a single API call
 */
export interface LocationMonitorData {
  rscStats: RSCStats[];
  networkStats: NetworkStats;
}

export async function getLocationMonitorData(): Promise<LocationMonitorData> {
  return fetchAPI<LocationMonitorData>('/api/location-monitor-data');
}

/**
 * Fetch generated alerts from delay data
 */
export async function getAlerts(): Promise<Alert[]> {
  return fetchAPI<Alert[]>('/api/alerts');
}

/**
 * Health check
 */
export async function healthCheck(): Promise<{ status: string; timestamp: string; service: string }> {
  return fetchAPI('/health');
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Format currency values
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

/**
 * Format percentage values
 */
export function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`;
}

/**
 * Get status color class
 */
export function getStatusColor(status: 'on-time' | 'minor-delay' | 'delayed'): string {
  const colors = {
    'on-time': 'text-green-600',
    'minor-delay': 'text-amber-600',
    'delayed': 'text-red-600',
  };
  return colors[status];
}

/**
 * Get risk tier badge class
 */
export function getRiskTierBadge(tier: 'CRITICAL' | 'HIGH' | 'MEDIUM'): { text: string; class: string } {
  const badges = {
    CRITICAL: { text: 'Critical', class: 'bg-red-100 text-red-700' },
    HIGH: { text: 'High', class: 'bg-amber-100 text-amber-700' },
    MEDIUM: { text: 'Medium', class: 'bg-green-100 text-green-700' },
  };
  return badges[tier];
}

export default {
  getKPIs,
  getRegionalStatus,
  getThroughputData,
  getFleetData,
  getRiskStores,
  getDelayCauses,
  getETAAccuracy,
  getTruckLocations,
  getRSCLocations,
  getStoreLocations,
  getAlerts,
  healthCheck,
  formatCurrency,
  formatPercent,
  getStatusColor,
  getRiskTierBadge,
};
