import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import MainLayout from '@/app/components/layouts/MainLayout';

// Lazy load route components for code splitting
const Home = lazy(() => import('@/app/components/pages/Home'));
const Fleet = lazy(() => import('@/app/components/pages/Fleet'));
const RiskDashboard = lazy(() => import('@/app/components/pages/RiskDashboard'));
const LocationMonitor = lazy(() => import('@/app/components/pages/LocationMonitor'));

// Loading fallback component
function LoadingFallback() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<Navigate to="/home" replace />} />
          <Route 
            path="home" 
            element={
              <Suspense fallback={<LoadingFallback />}>
                <Home />
              </Suspense>
            } 
          />
          <Route 
            path="fleet" 
            element={
              <Suspense fallback={<LoadingFallback />}>
                <Fleet />
              </Suspense>
            } 
          />
          <Route 
            path="risk" 
            element={
              <Suspense fallback={<LoadingFallback />}>
                <RiskDashboard />
              </Suspense>
            } 
          />
          <Route 
            path="locations" 
            element={
              <Suspense fallback={<LoadingFallback />}>
                <LocationMonitor />
              </Suspense>
            } 
          />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
