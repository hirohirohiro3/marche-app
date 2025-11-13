console.log("JULES_BUILD_V5_DEPLOYMENT_VERIFICATION");
import { StrictMode, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { createBrowserRouter, RouterProvider, useNavigate, Navigate } from 'react-router-dom';
import './index.css';

import RootLayout from './pages/RootLayout';
import LoginPage from './pages/LoginPage';
import AdminLayout from './pages/admin/AdminLayout';
import MenuAdminPage from './pages/admin/menu';
import DashboardPage from './pages/admin/DashboardPage';
import AnalyticsPage from './pages/admin/AnalyticsPage';
import OptionsAdminPage from './pages/admin/options';
import PaymentSettingsPage from './pages/admin/settings/PaymentSettingsPage';
import QrCodeSettingsPage from './pages/admin/settings/QrCodeSettingsPage';
import ProtectedRoute from './components/ProtectedRoute';
import MenuListPage from './pages/MenuListPage';
import CheckoutPage from './pages/CheckoutPage';
import OrderSummaryPage from './pages/OrderSummaryPage';
import TermsPage from './pages/TermsPage';
import PrivacyPage from './pages/PrivacyPage';
import SignupPage from './pages/SignupPage';
import PaymentPage from './pages/PaymentPage';
import PaymentCompletePage from './pages/PaymentCompletePage';

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
      { path: 'signup', element: <SignupPage /> },
      { path: 'checkout', element: <CheckoutPage /> },
      { path: 'order/:orderId', element: <OrderSummaryPage /> },
      { path: 'payment/:orderId', element: <PaymentPage /> },
      { path: 'payment-complete', element: <PaymentCompletePage /> },
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
      { path: 'options', element: <OptionsAdminPage /> },
      { path: 'analytics', element: <AnalyticsPage /> },
      { path: 'settings/payment', element: <PaymentSettingsPage /> },
      { path: 'settings/qrcode', element: <QrCodeSettingsPage /> },
    ],
  },
]);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>
);
