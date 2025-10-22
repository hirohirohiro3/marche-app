import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
import './index.css';

import RootLayout from './pages/RootLayout';
import LoginPage from './pages/LoginPage';
import MenuAdminPage from './pages/admin/menu';
import ProtectedRoute from './components/ProtectedRoute';
import MenuListPage from './pages/MenuListPage';
import CheckoutPage from './pages/CheckoutPage';
import OrderSummaryPage from './pages/OrderSummaryPage';

const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    children: [
      { index: true, element: <Navigate to="/menu" replace /> },
      { path: 'menu', element: <MenuListPage /> },
      { path: 'login', element: <LoginPage /> },
      { path: 'checkout', element: <CheckoutPage /> },
      { path: 'order/:orderId', element: <OrderSummaryPage /> },
    ],
  },
  {
    path: '/admin/menu',
    element: (
      <ProtectedRoute>
        <MenuAdminPage />
      </ProtectedRoute>
    ),
  },
]);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>
);
