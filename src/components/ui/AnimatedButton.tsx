import { Button, ButtonProps } from '@mui/material';
import { motion } from 'framer-motion';
import { forwardRef } from 'react';

// Create a motion component from the MUI Button
// Cast to any to avoid prop type conflicts between MUI and Framer Motion (specifically onDrag)
const MotionButton = motion(Button) as any;

export const AnimatedButton = forwardRef<HTMLButtonElement, ButtonProps>((props, ref) => {
    return (
        <MotionButton
            ref={ref}
            whileTap={{ scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
            {...props}
        />
    );
});

AnimatedButton.displayName = 'AnimatedButton';
