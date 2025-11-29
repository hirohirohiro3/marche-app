console.log("JULES_BUILD_V6_ROBUST_ORDERING_LOGS");
import { useEffect, lazy, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import { createBrowserRouter, RouterProvider, useNavigate, Navigate } from 'react-router-dom';
import { CircularProgress, Box } from '@mui/material';
import './index.css';

import RootLayout from './pages/RootLayout';
// Lazy load pages
const LoginPage = lazy(() => import('./pages/LoginPage'));
const AdminLayout = lazy(() => import('./pages/admin/AdminLayout'));
const MenuAdminPage = lazy(() => import('./pages/admin/menu'));
const DashboardPage = lazy(() => import('./pages/admin/DashboardPage'));
const AnalyticsPage = lazy(() => import('./pages/admin/AnalyticsPage'));
const OptionsAdminPage = lazy(() => import('./pages/admin/options'));
const PaymentSettingsPage = lazy(() => import('./pages/admin/settings/PaymentSettingsPage'));
const QrCodeSettingsPage = lazy(() => import('./pages/admin/settings/QrCodeSettingsPage'));
const ProtectedRoute = lazy(() => import('./components/ProtectedRoute'));
const MenuListPage = lazy(() => import('./pages/MenuListPage'));
const CheckoutPage = lazy(() => import('./pages/CheckoutPage'));
const OrderSummaryPage = lazy(() => import('./pages/OrderSummaryPage'));
const TermsPage = lazy(() => import('./pages/TermsPage'));
const PrivacyPage = lazy(() => import('./pages/PrivacyPage'));
const SignupPage = lazy(() => import('./pages/SignupPage'));
const PaymentPage = lazy(() => import('./pages/PaymentPage'));
const PaymentCompletePage = lazy(() => import('./pages/PaymentCompletePage'));
const BusinessPage = lazy(() => import('./pages/BusinessPage'));

// Loading component
const Loading = () => (
  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
    <CircularProgress />
  </Box>
);

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
      { path: 'menu/:storeId', element: <Suspense fallback={<Loading />}><MenuListPage /></Suspense> },
      { path: 'login', element: <Suspense fallback={<Loading />}><LoginPage /></Suspense> },
      { path: 'signup', element: <Suspense fallback={<Loading />}><SignupPage /></Suspense> },
      { path: 'checkout/:storeId', element: <Suspense fallback={<Loading />}><CheckoutPage /></Suspense> },
      { path: 'order/:orderId', element: <Suspense fallback={<Loading />}><OrderSummaryPage /></Suspense> },
      { path: 'payment/:orderId', element: <Suspense fallback={<Loading />}><PaymentPage /></Suspense> },
      { path: 'payment-complete', element: <Suspense fallback={<Loading />}><PaymentCompletePage /></Suspense> },
      { path: 'terms', element: <Suspense fallback={<Loading />}><TermsPage /></Suspense> },
      { path: 'privacy', element: <Suspense fallback={<Loading />}><PrivacyPage /></Suspense> },
      { path: 'about', element: <Suspense fallback={<Loading />}><BusinessPage /></Suspense> },
    ],
  },
  {
    path: '/admin',
    element: (
      <Suspense fallback={<Loading />}>
        <ProtectedRoute>
          <AdminLayout />
        </ProtectedRoute>
      </Suspense>
    ),
    children: [
      { index: true, element: <Navigate to="/admin/dashboard" replace /> },
      { path: 'dashboard', element: <Suspense fallback={<Loading />}><DashboardPage /></Suspense> },
      { path: 'menu', element: <Suspense fallback={<Loading />}><MenuAdminPage /></Suspense> },
      { path: 'options', element: <Suspense fallback={<Loading />}><OptionsAdminPage /></Suspense> },
      { path: 'analytics', element: <Suspense fallback={<Loading />}><AnalyticsPage /></Suspense> },
      { path: 'settings/payment', element: <Suspense fallback={<Loading />}><PaymentSettingsPage /></Suspense> },
      { path: 'settings/qrcode', element: <Suspense fallback={<Loading />}><QrCodeSettingsPage /></Suspense> },
    ],
  },
]);

createRoot(document.getElementById('root')!).render(
  // Temporarily disabled StrictMode for Stripe compatibility testing
  // <StrictMode>
  <RouterProvider router={router} />
  // </StrictMode>
);
