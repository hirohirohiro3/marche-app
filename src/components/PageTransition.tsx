import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface PageTransitionProps {
    children: ReactNode;
    className?: string;
}

const pageVariants = {
    initial: {
        opacity: 0,
        x: 20, // Slightly larger offset for better visibility of motion
    },
    animate: {
        opacity: 1,
        x: 0,
    },
    exit: {
        opacity: 0,
        x: -20,
    },
};

const pageTransition: any = {
    type: 'tween',
    ease: 'easeOut',
    duration: 0.25,
};

export default function PageTransition({ children, className }: PageTransitionProps) {
    return (
        <motion.div
            initial="initial"
            animate="animate"
            exit="exit"
            variants={pageVariants}
            transition={pageTransition}
            className={className}
            style={{ width: '100%', height: '100%' }}
        >
            {children}
        </motion.div>
    );
}
