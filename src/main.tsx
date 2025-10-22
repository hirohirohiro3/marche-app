import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import './index.css';

import RootLayout from './pages/RootLayout';
import LoginPage from './pages/LoginPage';
import MenuAdminPage from './pages/admin/menu';
import ProtectedRoute from './components/ProtectedRoute';

const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    children: [
      // TODO: Add customer-facing routes here later
    ],
  },
  {
    path: '/login',
    element: <LoginPage />,
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
