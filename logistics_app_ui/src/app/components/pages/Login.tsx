import { useNavigate } from 'react-router-dom';
import { Shield, Truck, Database, TrendingUp } from 'lucide-react';

export default function Login() {
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    navigate('/home');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Logo Section */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="w-12 h-12 bg-red-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">A</span>
              </div>
              <span className="text-gray-400">+</span>
              <div className="w-12 h-12 bg-[#FF7900] rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">D</span>
              </div>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Ace Hardware Logistics Dashboard
            </h1>
            <p className="text-gray-600">Powered by Databricks</p>
          </div>

          {/* Benefits */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6 space-y-3">
            <div className="flex items-start gap-3">
              <Truck className="w-5 h-5 text-[#FF7900] mt-0.5 flex-shrink-0" />
              <p className="text-sm text-gray-700">Track real-time truck telemetry</p>
            </div>
            <div className="flex items-start gap-3">
              <Database className="w-5 h-5 text-[#FF7900] mt-0.5 flex-shrink-0" />
              <p className="text-sm text-gray-700">Monitor fulfillment & arrival performance</p>
            </div>
            <div className="flex items-start gap-3">
              <TrendingUp className="w-5 h-5 text-[#FF7900] mt-0.5 flex-shrink-0" />
              <p className="text-sm text-gray-700">Surface stockout and delay risk metrics</p>
            </div>
          </div>

          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                placeholder="user@acehardware.com"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF7900] focus:border-transparent"
                defaultValue="admin@acehardware.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <input
                type="password"
                placeholder="••••••••"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF7900] focus:border-transparent"
                defaultValue="password"
              />
            </div>
            <button
              type="submit"
              className="w-full bg-[#FF7900] hover:bg-[#E66D00] text-white font-semibold py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <Shield className="w-5 h-5" />
              Sign In with SSO
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500">
              Secure enterprise authentication powered by Databricks
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
