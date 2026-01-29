import { Truck, MapPin, Clock, TrendingUp } from 'lucide-react';
import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell } from 'recharts';
import * as api from '@/app/services/api';

const COLORS = ['#FF7900', '#ef4444', '#f59e0b', '#10b981', '#6b7280'];

export default function Fleet() {
  const [fleetData, setFleetData] = useState<api.FleetTruck[]>([]);
  const [etaData, setEtaData] = useState<api.ETAAccuracy[]>([]);
  const [delayCauses, setDelayCauses] = useState<api.DelayCause[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [fleet, eta, delays] = await Promise.all([
          api.getFleetData(50),
          api.getETAAccuracy(),
          api.getDelayCauses(7)
        ]);
        setFleetData(fleet);
        setEtaData(eta);
        setDelayCauses(delays);
      } catch (error) {
        console.error('Failed to fetch fleet data:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const getStatusBadge = (status: string) => {
    const classes = {
      'on-time': 'bg-green-100 text-green-700',
      'minor-delay': 'bg-amber-100 text-amber-700',
      'delayed': 'bg-red-100 text-red-700',
    };
    return classes[status as keyof typeof classes] || 'bg-gray-100 text-gray-700';
  };

  const getStatusText = (status: string) => {
    return status === 'on-time' ? 'On Time' : status === 'minor-delay' ? 'Minor Delay' : 'Delayed';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-600">Loading fleet data...</div>
      </div>
    );
  }

  // Calculate summary stats
  const activeFleet = fleetData.length;
  const onTime = fleetData.filter(t => t.status === 'on-time').length;
  const minorDelays = fleetData.filter(t => t.status === 'minor-delay').length;
  const delayed = fleetData.filter(t => t.status === 'delayed').length;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Real-Time Fleet & Fulfillment
        </h1>
        <p className="text-gray-600">
          Live tracking of truck arrivals, ETAs, and delay attribution
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-2">
            <Truck className="w-8 h-8 text-[#FF7900]" />
            <div>
              <div className="text-2xl font-bold text-gray-900">{activeFleet}</div>
              <div className="text-sm text-gray-600">Active Trucks</div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-2">
            <Clock className="w-8 h-8 text-green-500" />
            <div>
              <div className="text-2xl font-bold text-gray-900">{onTime}</div>
              <div className="text-sm text-gray-600">On Time</div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp className="w-8 h-8 text-amber-500" />
            <div>
              <div className="text-2xl font-bold text-gray-900">{minorDelays}</div>
              <div className="text-sm text-gray-600">Minor Delays</div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-2">
            <MapPin className="w-8 h-8 text-red-500" />
            <div>
              <div className="text-2xl font-bold text-gray-900">{delayed}</div>
              <div className="text-sm text-gray-600">Delayed</div>
            </div>
          </div>
        </div>
      </div>

      {/* Analytics Charts - Compact Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Delivery Performance */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <h2 className="text-base font-semibold text-gray-900 mb-3">
            Delivery Performance by Hour
          </h2>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={etaData} margin={{ top: 5, right: 15, left: -15, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="time"
                stroke="#6b7280"
                style={{ fontSize: '10px', fontWeight: 500 }}
                tick={{ dy: 6 }}
                interval="preserveStartEnd"
              />
              <YAxis 
                stroke="#6b7280" 
                style={{ fontSize: '10px', fontWeight: 500 }}
                width={35}
                tick={{ dx: -3 }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '6px',
                  padding: '6px 10px',
                  fontSize: '12px',
                }}
              />
              <Legend 
                wrapperStyle={{ paddingTop: '10px', fontSize: '12px' }}
                iconType="line"
                iconSize={12}
              />
              <Line
                type="monotone"
                dataKey="actual"
                stroke="#10b981"
                strokeWidth={2}
                name="On-Time"
                dot={{ r: 2.5 }}
                activeDot={{ r: 4 }}
              />
              <Line
                type="monotone"
                dataKey="predicted"
                stroke="#ef4444"
                strokeWidth={2}
                name="Delayed"
                dot={{ r: 2.5 }}
                activeDot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Delay Causes */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <h2 className="text-base font-semibold text-gray-900 mb-3">
            Delay Root Causes
          </h2>
          {delayCauses.length === 0 ? (
            <div className="flex items-center justify-center h-[280px] text-sm text-gray-500">
              No delay data available
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={delayCauses}
                  cx="50%"
                  cy="50%"
                  labelLine={true}
                  label={(entry) => `${entry.cause}: ${entry.percentage}%`}
                  outerRadius={85}
                  fill="#8884d8"
                  dataKey="count"
                  style={{ fontSize: '11px', fontWeight: 500 }}
                >
                  {delayCauses.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{
                    fontSize: '12px',
                    borderRadius: '6px',
                    padding: '6px 10px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Fleet Status Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Active Fleet</h2>
          <p className="text-sm text-gray-600 mt-1">
            Real-time tracking of inbound trucks
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Truck ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Origin
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Destination
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Product Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Shipment Value
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ETA
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Delay
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {fleetData.map((truck) => (
                <tr key={truck.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {truck.id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {truck.origin}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {truck.destination}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-700 font-medium">
                      {truck.productCategory.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                    ${truck.shipmentValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {truck.eta}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {truck.delay > 0 ? (
                      <span className="text-sm font-medium text-red-600">
                        +{truck.delay}min
                      </span>
                    ) : (
                      <span className="text-sm text-gray-400">—</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadge(
                        truck.status
                      )}`}
                    >
                      {getStatusText(truck.status)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
