import { IconButton, Tooltip, Snackbar } from '@mui/material';
import { useState } from 'react';
import WbIncandescentIcon from '@mui/icons-material/WbIncandescent';
import WbIncandescentOutlinedIcon from '@mui/icons-material/WbIncandescentOutlined';
import { useWakeLock } from '../hooks/useWakeLock';

export default function WakeLockToggle() {
    const { isLocked, toggleWakeLock, isSupported } = useWakeLock();
    const [open, setOpen] = useState(false);
    const [message, setMessage] = useState('');

    if (!isSupported) {
        return null;
    }

    const handleToggle = async () => {
        await toggleWakeLock();
        // Note: isLocked might not be updated immediately here depending on implementation,
        // but typically we toggle to the opposite state.
        // However, to be safe and accurate to the *result*, we should ideally check the result.
        // Assuming toggleWakeLock toggles the state:
        const willBeLocked = !isLocked;
        setMessage(willBeLocked
            ? '操作しなくても、画面が暗くならないように設定しました'
            : '通常通り、一定時間で画面が暗くなるように戻しました'
        );
        setOpen(true);
    };

    const handleClose = () => {
        setOpen(false);
    };

    return (
        <>
            <Tooltip title={isLocked ? '画面スリープ無効中 (クリックで解除)' : '画面スリープを防止する'}>
                <IconButton onClick={handleToggle} color={isLocked ? 'warning' : 'inherit'}>
                    {isLocked ? <WbIncandescentIcon /> : <WbIncandescentOutlinedIcon />}
                </IconButton>
            </Tooltip>
            <Snackbar
                open={open}
                autoHideDuration={4000} // Slightly longer for longer text
                onClose={handleClose}
                message={message}
                anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
                sx={{ mt: 8 }}
            />
        </>
    );
}
