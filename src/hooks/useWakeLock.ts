import { useState, useEffect, useCallback } from 'react';

export const useWakeLock = () => {
    const [isLocked, setIsLocked] = useState(false);
    const [wakeLock, setWakeLock] = useState<WakeLockSentinel | null>(null);
    const [isSupported, setIsSupported] = useState(true);

    useEffect(() => {
        if (!('wakeLock' in navigator)) {
            setIsSupported(false);
        }
    }, []);

    const requestWakeLock = useCallback(async () => {
        if (!isSupported) return;
        try {
            const lock = await navigator.wakeLock.request('screen');
            setWakeLock(lock);
            setIsLocked(true);

            lock.addEventListener('release', () => {
                setIsLocked(false);
                setWakeLock(null);
            });
        } catch (err) {
            const error = err as Error;
            console.error(`${error.name}, ${error.message}`);
        }
    }, [isSupported]);

    const releaseWakeLock = useCallback(async () => {
        if (wakeLock) {
            await wakeLock.release();
            setWakeLock(null);
            setIsLocked(false);
        }
    }, [wakeLock]);

    const toggleWakeLock = useCallback(() => {
        if (isLocked) {
            releaseWakeLock();
        } else {
            requestWakeLock();
        }
    }, [isLocked, requestWakeLock, releaseWakeLock]);

    // Re-acquire lock when tab becomes visible
    useEffect(() => {
        const handleVisibilityChange = async () => {
            if (wakeLock !== null && document.visibilityState === 'visible') {
                await requestWakeLock();
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [wakeLock, requestWakeLock]);

    return { isLocked, toggleWakeLock, isSupported };
};
