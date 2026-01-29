import { Database, AlertCircle, CheckCircle, XCircle, Activity } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { mockPipelines, mockDataQualityChecks } from '@/app/data/mockData';

export default function Pipelines() {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Running':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'Warning':
        return <AlertCircle className="w-5 h-5 text-amber-500" />;
      case 'Error':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Activity className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const classes = {
      Running: 'bg-green-100 text-green-700',
      Warning: 'bg-amber-100 text-amber-700',
      Error: 'bg-red-100 text-red-700',
    };
    return classes[status as keyof typeof classes] || 'bg-gray-100 text-gray-700';
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Data Pipelines & Quality
        </h1>
        <p className="text-gray-600">
          Monitor real-time data ingestion, transformation, and quality metrics
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-2">
            <Database className="w-8 h-8 text-[#FF7900]" />
            <div>
              <div className="text-2xl font-bold text-gray-900">6</div>
              <div className="text-sm text-gray-600">Active Pipelines</div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-2">
            <CheckCircle className="w-8 h-8 text-green-500" />
            <div>
              <div className="text-2xl font-bold text-gray-900">4</div>
              <div className="text-sm text-gray-600">Running</div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-2">
            <AlertCircle className="w-8 h-8 text-amber-500" />
            <div>
              <div className="text-2xl font-bold text-gray-900">1</div>
              <div className="text-sm text-gray-600">Warning</div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-2">
            <XCircle className="w-8 h-8 text-red-500" />
            <div>
              <div className="text-2xl font-bold text-gray-900">1</div>
              <div className="text-sm text-gray-600">Error</div>
            </div>
          </div>
        </div>
      </div>

      {/* Pipelines Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Data Pipelines</h2>
          <p className="text-sm text-gray-600 mt-1">
            Real-time status of all ingestion and transformation workflows
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Pipeline
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Run
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Data Quality
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Records Processed
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {mockPipelines.map((pipeline) => (
                <tr key={pipeline.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(pipeline.status)}
                      <span className="font-medium text-gray-900">{pipeline.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadge(pipeline.status)}`}>
                      {pipeline.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {pipeline.lastRun}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-gray-200 rounded-full h-2 w-24">
                        <div
                          className={`h-2 rounded-full ${
                            pipeline.dataQuality >= 95
                              ? 'bg-green-500'
                              : pipeline.dataQuality >= 85
                              ? 'bg-amber-500'
                              : 'bg-red-500'
                          }`}
                          style={{ width: `${pipeline.dataQuality}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium text-gray-900">
                        {pipeline.dataQuality}%
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                    {pipeline.recordsProcessed}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Data Quality Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quality Checks Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">Data Quality Checks</h2>
            <p className="text-sm text-gray-600 mt-1">Last 24 hours validation results</p>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {mockDataQualityChecks.map((check, idx) => (
                <div key={idx} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-gray-900">{check.check}</span>
                    <span className={`font-semibold ${check.passRate >= 98 ? 'text-green-600' : check.passRate >= 95 ? 'text-amber-600' : 'text-red-600'}`}>
                      {check.passRate}%
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-600">
                    <span className="text-green-600">✓ {check.passed.toLocaleString()}</span>
                    <span className="text-red-600">✗ {check.failed.toLocaleString()}</span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${check.passRate >= 98 ? 'bg-green-500' : check.passRate >= 95 ? 'bg-amber-500' : 'bg-red-500'}`}
                      style={{ width: `${check.passRate}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Quality Score Chart */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Quality Score Distribution</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={mockDataQualityChecks}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="check"
                stroke="#6b7280"
                style={{ fontSize: '10px' }}
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis stroke="#6b7280" style={{ fontSize: '12px' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                }}
              />
              <Bar dataKey="passRate" radius={[8, 8, 0, 0]}>
                {mockDataQualityChecks.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.passRate >= 98 ? '#10b981' : entry.passRate >= 95 ? '#f59e0b' : '#ef4444'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Why This Matters */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100 p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
            <Database className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              Why Data Quality Matters for Ace
            </h3>
            <p className="text-gray-700">
              Reliable supply chain decisions depend on accurate, timely data. These pipelines process millions of GPS coordinates, ETAs, and inventory signals daily. High-quality data directly translates to better routing decisions, accurate delivery predictions, and ultimately, happier customers across all 5,000+ Ace Hardware stores.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
