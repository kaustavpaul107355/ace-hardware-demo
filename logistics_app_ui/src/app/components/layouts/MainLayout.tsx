import { Outlet, NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Database, 
  Truck, 
  AlertTriangle, 
  MapPin,
  Bell, 
  Settings as SettingsIcon,
  Menu,
  User
} from 'lucide-react';
import { useState, useEffect } from 'react';

interface UserInfo {
  name: string;
  email: string;
  role: string;
}

export default function MainLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [userInfo, setUserInfo] = useState<UserInfo>({
    name: "Supply Chain Manager",
    email: "operations@acehardware.com",
    role: "Supply Chain Operations"
  });

  useEffect(() => {
    // Fetch authenticated user info from backend
    fetch("/api/user")
      .then(res => res.json())
      .then(data => {
        if (data.name && data.email) {
          setUserInfo(data);
        }
      })
      .catch(err => {
        console.error("Failed to fetch user info:", err);
        // Keep default mock data on error
      });
  }, []);

  const navItems = [
    { to: '/home', icon: LayoutDashboard, label: 'Overview' },
    { to: '/fleet', icon: Truck, label: 'Fleet & Fulfillment' },
    { to: '/risk', icon: AlertTriangle, label: 'Risk Analysis' },
    { to: '/locations', icon: MapPin, label: 'Location Monitor' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 fixed top-0 left-0 right-0 z-30 h-16">
        <div className="flex items-center justify-between h-full px-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 hover:bg-gray-100 rounded-lg"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <img 
                  src="/ace-logo.svg" 
                  alt="Ace Hardware" 
                  className="h-8"
                />
              </div>
              <span className="text-gray-300">|</span>
              <div className="flex items-center gap-2">
                <img 
                  src="/DBX_logo.svg" 
                  alt="Databricks" 
                  className="h-4"
                />
                <span className="text-sm text-gray-600">Logistics Platform</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative group">
              <div className="flex items-center gap-3 cursor-pointer">
                <div className="text-right hidden md:block">
                  <div className="text-sm font-medium text-gray-900">{userInfo.name}</div>
                  <div className="text-xs text-gray-500">{userInfo.role}</div>
                </div>
                <div className="flex items-center justify-center w-10 h-10 rounded-full 
                  bg-gradient-to-br from-red-500 to-orange-500 
                  border-2 border-white shadow-md
                  transition-all duration-300
                  group-hover:shadow-lg group-hover:scale-110">
                  <User className="w-5 h-5 text-white" />
                </div>
              </div>
              
              {/* Hover Tooltip */}
              <div className="absolute right-0 top-12 w-64 
                opacity-0 invisible group-hover:opacity-100 group-hover:visible
                transition-all duration-300 z-50">
                <div className="bg-white rounded-xl shadow-xl border border-gray-200 p-4 
                  backdrop-blur-sm bg-white/95">
                  <div className="flex items-start gap-3">
                    <div className="flex items-center justify-center w-12 h-12 rounded-full 
                      bg-gradient-to-br from-red-500 to-orange-500 flex-shrink-0">
                      <User className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">
                        {userInfo.name}
                      </p>
                      <p className="text-xs text-gray-500 truncate mt-0.5">
                        {userInfo.email}
                      </p>
                      <div className="mt-2 pt-2 border-t border-gray-100">
                        <p className="text-xs text-gray-600">
                          <span className="font-medium">Role:</span> {userInfo.role}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-16 bottom-0 w-64 bg-white border-r border-gray-200 transition-transform duration-300 z-20 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <nav className="p-4 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-[#FF7900] text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`
              }
            >
              <item.icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <main
        className={`pt-16 transition-all duration-300 ${
          sidebarOpen ? 'lg:pl-64' : 'pl-0'
        }`}
      >
        <div className="p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
