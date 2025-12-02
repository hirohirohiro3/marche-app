// import { useState, useEffect } from 'react';
// import { registerSW } from 'virtual:pwa-register';
import { Snackbar, Alert } from '@mui/material';

export default function ReloadPrompt() {
    // PWA functionality temporarily disabled due to build issues with virtual module resolution
    return (
        <>
            <Snackbar
                open={false}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert severity="info">
                    PWA Update
                </Alert>
            </Snackbar>
        </>
    );
}
