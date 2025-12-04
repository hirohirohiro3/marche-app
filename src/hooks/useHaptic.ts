import { useCallback } from 'react';

type HapticType = 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error';


export const useHaptic = () => {
    const triggerHaptic = useCallback((type: HapticType = 'light') => {
        try {
            // Skip in automation environments (like Playwright) to prevent hanging
            if (typeof navigator === 'undefined' || navigator.webdriver) return;

            if (navigator.vibrate) {
                switch (type) {
                    case 'light':
                        navigator.vibrate(20); // Increased from 10
                        break;
                    case 'medium':
                        navigator.vibrate(40); // Increased from 20
                        break;
                    case 'heavy':
                        navigator.vibrate(70); // Increased from 40
                        break;
                    case 'success':
                        navigator.vibrate([30, 50, 30]); // Stronger double tap
                        break;
                    case 'warning':
                        navigator.vibrate([50, 100, 50]);
                        break;
                    case 'error':
                        navigator.vibrate([100, 50, 100, 50, 100]);
                        break;
                    default:
                        navigator.vibrate(20);
                }
            }
        } catch (e) {
            console.warn('Haptic feedback failed:', e);
        }
    }, []);

    return { triggerHaptic };
};
