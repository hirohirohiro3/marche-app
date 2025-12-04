import { useState, useMemo, useEffect, useRef } from 'react';
import {
    Paper,
    Typography,
    List,
    ListItem,
    ListItemText,
    IconButton,
    Badge,
    Box,
    Chip,
    useTheme,
} from '@mui/material';
import InventoryIcon from '@mui/icons-material/Inventory';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { MenuItem } from '../types';

interface StockStatusWidgetProps {
    menuItems: MenuItem[];
    lowStockThreshold?: number;
}

export default function StockStatusWidget({ menuItems, lowStockThreshold = 5 }: StockStatusWidgetProps) {
    const theme = useTheme();
    const [isExpanded, setIsExpanded] = useState(false);
    const initialCheckDone = useRef(false);

    // Auto-expand if there are low stock items on initial load
    useEffect(() => {
        if (initialCheckDone.current || menuItems.length === 0) return;

        const hasLowStock = menuItems.some(item => item.manageStock && (item.stock || 0) <= lowStockThreshold);
        if (hasLowStock) {
            setIsExpanded(true);
        }
        initialCheckDone.current = true;
    }, [menuItems, lowStockThreshold]);

    // Filter only items with stock management enabled
    const stockItems = useMemo(() => {
        return menuItems.filter((item) => item.manageStock);
    }, [menuItems]);

    // If no items have stock management, don't render anything
    if (stockItems.length === 0) {
        return null;
    }

    const lowStockCount = stockItems.filter((item) => (item.stock || 0) <= lowStockThreshold).length;

    const getStockColor = (stock: number) => {
        if (stock <= lowStockThreshold) return theme.palette.error.main;
        return theme.palette.success.main;
    };



    if (!isExpanded) {
        return (
            <Box
                sx={{
                    position: 'fixed',
                    bottom: 24,
                    right: 24,
                    zIndex: 1000,
                }}
            >
                <Badge
                    badgeContent={lowStockCount}
                    color="error"
                    invisible={lowStockCount === 0}
                >
                    <Paper
                        elevation={6}
                        sx={{
                            width: 56,
                            height: 56,
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            bgcolor: 'background.paper',
                            '&:hover': {
                                bgcolor: 'action.hover',
                            },
                        }}
                        onClick={() => setIsExpanded(true)}
                    >
                        <InventoryIcon color="primary" />
                    </Paper>
                </Badge>
            </Box>
        );
    }

    return (
        <Paper
            elevation={6}
            sx={{
                position: 'fixed',
                bottom: 24,
                right: 24,
                width: 320,
                maxHeight: 400,
                display: 'flex',
                flexDirection: 'column',
                zIndex: 1000,
                overflow: 'hidden',
                borderRadius: 2,
            }}
        >
            <Box
                sx={{
                    p: 2,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    bgcolor: 'primary.main',
                    color: 'primary.contrastText',
                }}
            >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <InventoryIcon fontSize="small" />
                    <Typography variant="subtitle1" fontWeight="bold">
                        在庫状況
                    </Typography>
                </Box>
                <IconButton
                    size="small"
                    onClick={() => setIsExpanded(false)}
                    sx={{ color: 'inherit' }}
                >
                    <ExpandMoreIcon />
                </IconButton>
            </Box>

            <List sx={{ overflowY: 'auto', flexGrow: 1, p: 0 }}>
                {stockItems.map((item) => {
                    const stock = item.stock || 0;
                    return (
                        <ListItem
                            key={item.id}
                            divider
                            sx={{
                                bgcolor: stock <= lowStockThreshold ? 'error.50' : 'transparent',
                            }}
                        >
                            <ListItemText
                                primary={item.name}
                                primaryTypographyProps={{
                                    variant: 'body2',
                                    fontWeight: 'medium',
                                }}
                            />
                            <Chip
                                label={`${stock}個`}
                                size="small"
                                sx={{
                                    bgcolor: getStockColor(stock),
                                    color: 'white',
                                    fontWeight: 'bold',
                                    minWidth: 60,
                                }}
                            />
                        </ListItem>
                    );
                })}
            </List>
        </Paper>
    );
}
