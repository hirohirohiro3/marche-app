import { IconButton, Tooltip, Snackbar } from '@mui/material';
import { useState } from 'react';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import { useThemeContext } from '../contexts/ThemeContext';

export default function ThemeToggle() {
    const { mode, toggleTheme } = useThemeContext();
    const [open, setOpen] = useState(false);
    const [message, setMessage] = useState('');

    const handleToggle = () => {
        toggleTheme();
        const newMode = mode === 'light' ? 'dark' : 'light';
        setMessage(newMode === 'dark' ? 'ダークモードに切り替えました' : 'ライトモードに切り替えました');
        setOpen(true);
    };

    const handleClose = () => {
        setOpen(false);
    };

    return (
        <>
            <Tooltip title={mode === 'light' ? 'ダークモードに切り替え' : 'ライトモードに切り替え'}>
                <IconButton onClick={handleToggle} color="inherit">
                    {mode === 'light' ? <Brightness4Icon /> : <Brightness7Icon />}
                </IconButton>
            </Tooltip>
            <Snackbar
                open={open}
                autoHideDuration={2000}
                onClose={handleClose}
                message={message}
                anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
                sx={{ mt: 8 }}
            />
        </>
    );
}
