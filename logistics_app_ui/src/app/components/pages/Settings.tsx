import { Settings as SettingsIcon, Database, Bell, Users, Lock, Cloud } from 'lucide-react';

export default function Settings() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Settings & Configuration
        </h1>
        <p className="text-gray-600">
          Manage integrations, thresholds, and user access
        </p>
      </div>

      {/* Data Sources Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-6">
          <Database className="w-6 h-6 text-[#FF7900]" />
          <h2 className="text-xl font-bold text-gray-900">Data Sources & Connections</h2>
        </div>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-[#FF7900] rounded-lg flex items-center justify-center">
                <Cloud className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="font-medium text-gray-900">Azure Data Lake Storage</div>
                <div className="text-sm text-gray-600">Primary data warehouse</div>
              </div>
            </div>
            <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
              Connected
            </span>
          </div>
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                <Database className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="font-medium text-gray-900">Databricks Spark Pipelines</div>
                <div className="text-sm text-gray-600">Real-time data processing</div>
              </div>
            </div>
            <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
              Connected
            </span>
          </div>
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gray-600 rounded-lg flex items-center justify-center">
                <Cloud className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="font-medium text-gray-900">CloudFiles (Auto Loader)</div>
                <div className="text-sm text-gray-600">Telemetry ingestion</div>
              </div>
            </div>
            <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
              Connected
            </span>
          </div>
        </div>
      </div>

      {/* Notification Settings */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-6">
          <Bell className="w-6 h-6 text-[#FF7900]" />
          <h2 className="text-xl font-bold text-gray-900">Notification Preferences</h2>
        </div>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
            <div>
              <div className="font-medium text-gray-900">Delay Alerts (&gt;2 hours)</div>
              <div className="text-sm text-gray-600">Email + Slack notifications</div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" defaultChecked />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#FF7900]"></div>
            </label>
          </div>
          <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
            <div>
              <div className="font-medium text-gray-900">Data Quality Drops</div>
              <div className="text-sm text-gray-600">Alert when quality &lt; 95%</div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" defaultChecked />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#FF7900]"></div>
            </label>
          </div>
          <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
            <div>
              <div className="font-medium text-gray-900">Stockout Risk Warnings</div>
              <div className="text-sm text-gray-600">Risk score &gt; 80</div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" defaultChecked />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#FF7900]"></div>
            </label>
          </div>
          <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
            <div>
              <div className="font-medium text-gray-900">Weekly Summary Reports</div>
              <div className="text-sm text-gray-600">Sent every Monday at 8 AM</div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#FF7900]"></div>
            </label>
          </div>
        </div>
      </div>

      {/* User Management */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-6">
            <Users className="w-6 h-6 text-[#FF7900]" />
            <h2 className="text-xl font-bold text-gray-900">User Access</h2>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <div className="font-medium text-gray-900">Admin Users</div>
                <div className="text-sm text-gray-600">Full system access</div>
              </div>
              <div className="text-lg font-bold text-gray-900">3</div>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <div className="font-medium text-gray-900">Operations Team</div>
                <div className="text-sm text-gray-600">Dashboard view + alerts</div>
              </div>
              <div className="text-lg font-bold text-gray-900">12</div>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <div className="font-medium text-gray-900">Read-Only</div>
                <div className="text-sm text-gray-600">View only access</div>
              </div>
              <div className="text-lg font-bold text-gray-900">8</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-6">
            <Lock className="w-6 h-6 text-[#FF7900]" />
            <h2 className="text-xl font-bold text-gray-900">Security</h2>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <div className="font-medium text-gray-900">SSO Integration</div>
                <div className="text-sm text-gray-600">Azure Active Directory</div>
              </div>
              <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-medium">
                Enabled
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <div className="font-medium text-gray-900">2FA Required</div>
                <div className="text-sm text-gray-600">Admin accounts</div>
              </div>
              <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-medium">
                Enabled
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <div className="font-medium text-gray-900">API Key Rotation</div>
                <div className="text-sm text-gray-600">Last rotated 14 days ago</div>
              </div>
              <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                Active
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* System Info */}
      <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl border border-gray-200 p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-[#FF7900] rounded-lg flex items-center justify-center flex-shrink-0">
            <SettingsIcon className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              System Information
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <div className="text-gray-600">Version</div>
                <div className="font-semibold text-gray-900">v2.4.1</div>
              </div>
              <div>
                <div className="text-gray-600">Environment</div>
                <div className="font-semibold text-gray-900">Production</div>
              </div>
              <div>
                <div className="text-gray-600">Region</div>
                <div className="font-semibold text-gray-900">US-Central</div>
              </div>
              <div>
                <div className="text-gray-600">Last Updated</div>
                <div className="font-semibold text-gray-900">Jan 15, 2026</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
