import { useState } from 'react';
import { Alert, Typography, IconButton, Collapse, Box } from '@mui/material';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';

interface HelpSectionProps {
    title: string;
    children: React.ReactNode;
}

export default function HelpSection({ title, children }: HelpSectionProps) {
    const [open, setOpen] = useState(false);

    return (
        <Box sx={{ mb: 3 }}>
            <Alert
                severity="info"
                icon={<HelpOutlineIcon />}
                action={
                    <IconButton
                        aria-label="close"
                        color="inherit"
                        size="small"
                        onClick={() => setOpen(!open)}
                    >
                        {open ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                    </IconButton>
                }
                sx={{
                    '& .MuiAlert-message': { width: '100%' },
                    alignItems: open ? 'flex-start' : 'center',
                }}
            >
                <Box sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }} onClick={() => setOpen(!open)}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                        {title}
                    </Typography>
                </Box>
                <Collapse in={open}>
                    <Box sx={{ mt: 1 }}>
                        {children}
                    </Box>
                </Collapse>
            </Alert>
        </Box>
    );
}
