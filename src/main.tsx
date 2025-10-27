import { StrictMode, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { createBrowserRouter, RouterProvider, useNavigate } from 'react-router-dom';
import './index.css';

import RootLayout from './pages/RootLayout';
import LoginPage from './pages/LoginPage';
import AdminLayout from './pages/admin/AdminLayout';
import MenuAdminPage from './pages/admin/menu';
import DashboardPage from './pages/admin/DashboardPage';
import AnalyticsPage from './pages/admin/AnalyticsPage';
import ProtectedRoute from './components/ProtectedRoute';
import MenuListPage from './pages/MenuListPage';
import CheckoutPage from './pages/CheckoutPage';
import OrderSummaryPage from './pages/OrderSummaryPage';
import TermsPage from './pages/TermsPage';
import PrivacyPage from './pages/PrivacyPage';

// A component to handle the root redirect using useEffect for robustness in tests.
function RedirectToIndex() {
  const navigate = useNavigate();
  useEffect(() => {
    navigate('/login', { replace: true });
  }, [navigate]);
  return null; // Render nothing while redirecting
}

const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    children: [
      { index: true, element: <RedirectToIndex /> },
      { path: 'menu', element: <MenuListPage /> },
      { path: 'login', element: <LoginPage /> },
      { path: 'checkout', element: <CheckoutPage /> },
      { path: 'order/:orderId', element: <OrderSummaryPage /> },
      { path: 'terms', element: <TermsPage /> },
      { path: 'privacy', element: <PrivacyPage /> },
    ],
  },
  {
    path: '/admin',
    element: (
      <ProtectedRoute>
        <AdminLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <Navigate to="/admin/dashboard" replace /> },
      { path: 'dashboard', element: <DashboardPage /> },
      { path: 'menu', element: <MenuAdminPage /> },
      { path: 'analytics', element: <AnalyticsPage /> },
    ],
  },
]);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>
);
