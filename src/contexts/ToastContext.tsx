import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { Alert } from '@mui/material';
import { AnimatePresence, motion } from 'framer-motion';

interface ToastContextType {
    showToast: (message: string, severity?: 'success' | 'error' | 'info') => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider = ({ children }: { children: ReactNode }) => {
    const [open, setOpen] = useState(false);
    const [message, setMessage] = useState('');
    const [severity, setSeverity] = useState<'success' | 'error' | 'info'>('success');

    const showToast = (msg: string, sev: 'success' | 'error' | 'info' = 'success') => {
        setMessage(msg);
        setSeverity(sev);
        setOpen(true);
    };

    useEffect(() => {
        if (open) {
            const timer = setTimeout(() => {
                setOpen(false);
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [open]);

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            {children}
            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ opacity: 0, y: -20, x: '-50%' }}
                        animate={{ opacity: 1, y: 0, x: '-50%' }}
                        exit={{ opacity: 0, y: -20, x: '-50%' }}
                        transition={{ duration: 0.25, ease: "backOut" }}
                        style={{
                            position: 'fixed',
                            top: 24,
                            left: '50%',
                            zIndex: 2000,
                            width: '90%',
                            maxWidth: '400px'
                        }}
                    >
                        <Alert
                            onClose={() => setOpen(false)}
                            severity={severity}
                            sx={{
                                width: '100%',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                                borderRadius: 2,
                                fontWeight: 'bold'
                            }}
                        >
                            {message}
                        </Alert>
                    </motion.div>
                )}
            </AnimatePresence>
        </ToastContext.Provider>
    );
};

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) throw new Error('useToast must be used within ToastProvider');
    return context;
};
