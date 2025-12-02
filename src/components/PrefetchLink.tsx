import { Link, LinkProps } from 'react-router-dom';
import { forwardRef } from 'react';

// Map of routes to their dynamic import functions
const routeMap: Record<string, () => Promise<any>> = {
    '/admin/dashboard': () => import('../pages/admin/DashboardPage'),
    '/admin/menu': () => import('../pages/admin/menu'),
    '/admin/analytics': () => import('../pages/admin/AnalyticsPage'),
    '/admin/options': () => import('../pages/admin/options'),
    '/admin/settings/payment': () => import('../pages/admin/settings/PaymentSettingsPage'),
    '/admin/settings/qrcode': () => import('../pages/admin/settings/QrCodeSettingsPage'),
};

export const PrefetchLink = forwardRef<HTMLAnchorElement, LinkProps>(
    ({ to, onClick, onMouseEnter, onFocus, ...rest }, ref) => {
        const handlePrefetch = () => {
            const path = typeof to === 'string' ? to : to.pathname;
            if (path && routeMap[path]) {
                routeMap[path]();
            }
        };

        return (
            <Link
                ref={ref}
                to={to}
                onClick={onClick}
                onMouseEnter={(e) => {
                    handlePrefetch();
                    if (onMouseEnter) onMouseEnter(e);
                }}
                onFocus={(e) => {
                    handlePrefetch();
                    if (onFocus) onFocus(e);
                }}
                {...rest}
            />
        );
    }
);

export default PrefetchLink;
