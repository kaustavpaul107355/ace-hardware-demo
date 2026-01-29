import { Bell, AlertCircle, Info, XCircle, CheckCircle } from 'lucide-react';
import { mockAlerts } from '@/app/data/mockData';

export default function Alerts() {
  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'critical':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'warning':
        return <AlertCircle className="w-5 h-5 text-amber-500" />;
      case 'info':
        return <Info className="w-5 h-5 text-blue-500" />;
      default:
        return <Bell className="w-5 h-5 text-gray-500" />;
    }
  };

  const getAlertStyle = (type: string) => {
    switch (type) {
      case 'critical':
        return 'border-red-200 bg-red-50';
      case 'warning':
        return 'border-amber-200 bg-amber-50';
      case 'info':
        return 'border-blue-200 bg-blue-50';
      default:
        return 'border-gray-200 bg-gray-50';
    }
  };

  const criticalAlerts = mockAlerts.filter(a => a.type === 'critical').length;
  const warningAlerts = mockAlerts.filter(a => a.type === 'warning').length;
  const actionRequired = mockAlerts.filter(a => a.actionRequired).length;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Alerts & Notifications
        </h1>
        <p className="text-gray-600">
          Real-time system alerts and operational notifications
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-2">
            <Bell className="w-8 h-8 text-[#FF7900]" />
            <div>
              <div className="text-2xl font-bold text-gray-900">{mockAlerts.length}</div>
              <div className="text-sm text-gray-600">Total Alerts</div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-2">
            <XCircle className="w-8 h-8 text-red-500" />
            <div>
              <div className="text-2xl font-bold text-gray-900">{criticalAlerts}</div>
              <div className="text-sm text-gray-600">Critical</div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-2">
            <AlertCircle className="w-8 h-8 text-amber-500" />
            <div>
              <div className="text-2xl font-bold text-gray-900">{warningAlerts}</div>
              <div className="text-sm text-gray-600">Warnings</div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-2">
            <CheckCircle className="w-8 h-8 text-green-500" />
            <div>
              <div className="text-2xl font-bold text-gray-900">{actionRequired}</div>
              <div className="text-sm text-gray-600">Action Required</div>
            </div>
          </div>
        </div>
      </div>

      {/* Alerts List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Recent Alerts</h2>
              <p className="text-sm text-gray-600 mt-1">
                Notifications from the last 24 hours
              </p>
            </div>
            <button className="px-4 py-2 bg-[#FF7900] text-white rounded-lg hover:bg-[#E66D00] transition-colors text-sm font-medium">
              Mark All as Read
            </button>
          </div>
        </div>
        <div className="divide-y divide-gray-200">
          {mockAlerts.map((alert) => (
            <div
              key={alert.id}
              className={`p-6 hover:bg-gray-50 transition-colors border-l-4 ${getAlertStyle(alert.type)}`}
            >
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 mt-1">
                  {getAlertIcon(alert.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="text-base font-semibold text-gray-900 mb-1">
                        {alert.title}
                      </h3>
                      <p className="text-sm text-gray-600 mb-3">
                        {alert.description}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span>{alert.timestamp}</span>
                        {alert.actionRequired && (
                          <span className="px-2 py-1 bg-red-100 text-red-700 rounded font-medium">
                            Action Required
                          </span>
                        )}
                      </div>
                    </div>
                    {alert.actionRequired && (
                      <button className="px-4 py-2 bg-[#FF7900] text-white rounded-lg hover:bg-[#E66D00] transition-colors text-sm font-medium whitespace-nowrap">
                        View Details
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Alert Configuration */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Alert Thresholds</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <div className="font-medium text-gray-900">Delay Threshold</div>
                <div className="text-sm text-gray-600">Trigger alert when truck is delayed by:</div>
              </div>
              <div className="text-lg font-bold text-[#FF7900]">2 hours</div>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <div className="font-medium text-gray-900">Data Quality Floor</div>
                <div className="text-sm text-gray-600">Alert when quality drops below:</div>
              </div>
              <div className="text-lg font-bold text-[#FF7900]">95%</div>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <div className="font-medium text-gray-900">Stockout Risk</div>
                <div className="text-sm text-gray-600">Critical threshold:</div>
              </div>
              <div className="text-lg font-bold text-[#FF7900]">80+</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Notification Channels</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <div className="font-medium text-gray-900">Email Notifications</div>
                  <div className="text-sm text-gray-600">ops@acehardware.com</div>
                </div>
              </div>
              <div className="text-sm text-green-600 font-medium">Active</div>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <div className="font-medium text-gray-900">Slack Integration</div>
                  <div className="text-sm text-gray-600">#logistics-alerts</div>
                </div>
              </div>
              <div className="text-sm text-green-600 font-medium">Active</div>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                  <Info className="w-5 h-5 text-gray-400" />
                </div>
                <div>
                  <div className="font-medium text-gray-900">SMS Alerts</div>
                  <div className="text-sm text-gray-600">Emergency only</div>
                </div>
              </div>
              <div className="text-sm text-gray-400 font-medium">Inactive</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
