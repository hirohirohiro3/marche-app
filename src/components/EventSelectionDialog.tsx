import { useState, useMemo } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    TextField,
    Box,
    Typography,
    TableSortLabel,
    IconButton,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

interface EventData {
    name: string;
    dateRange: string;
    totalRevenue: number;
    orderCount: number;
    lastDate: Date;
}

interface EventSelectionDialogProps {
    open: boolean;
    onClose: () => void;
    onSelect: (eventName: string) => void;
    events: EventData[];
}

type Order = 'asc' | 'desc';
type OrderBy = 'lastDate' | 'totalRevenue' | 'orderCount';

export default function EventSelectionDialog({
    open,
    onClose,
    onSelect,
    events,
}: EventSelectionDialogProps) {
    const [searchTerm, setSearchTerm] = useState('');
    const [order, setOrder] = useState<Order>('desc');
    const [orderBy, setOrderBy] = useState<OrderBy>('lastDate');

    const handleRequestSort = (property: OrderBy) => {
        const isAsc = orderBy === property && order === 'asc';
        setOrder(isAsc ? 'desc' : 'asc');
        setOrderBy(property);
    };

    const filteredEvents = useMemo(() => {
        return events.filter((event) =>
            event.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [events, searchTerm]);

    const sortedEvents = useMemo(() => {
        return [...filteredEvents].sort((a, b) => {
            let comparison = 0;
            if (orderBy === 'lastDate') {
                comparison = a.lastDate.getTime() - b.lastDate.getTime();
            } else if (orderBy === 'totalRevenue') {
                comparison = a.totalRevenue - b.totalRevenue;
            } else if (orderBy === 'orderCount') {
                comparison = a.orderCount - b.orderCount;
            }
            return order === 'asc' ? comparison : -comparison;
        });
    }, [filteredEvents, order, orderBy]);

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitle sx={{ m: 0, p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                イベントを選択
                <IconButton
                    aria-label="close"
                    onClick={onClose}
                    sx={{
                        color: (theme) => theme.palette.grey[500],
                    }}
                >
                    <CloseIcon />
                </IconButton>
            </DialogTitle>
            <DialogContent dividers>
                <Box sx={{ mb: 2 }}>
                    <TextField
                        fullWidth
                        label="イベント名を検索"
                        variant="outlined"
                        size="small"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </Box>
                <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 400 }}>
                    <Table stickyHeader size="small">
                        <TableHead>
                            <TableRow>
                                <TableCell>イベント名</TableCell>
                                <TableCell>開催期間</TableCell>
                                <TableCell align="right">
                                    <TableSortLabel
                                        active={orderBy === 'totalRevenue'}
                                        direction={orderBy === 'totalRevenue' ? order : 'asc'}
                                        onClick={() => handleRequestSort('totalRevenue')}
                                    >
                                        総売上
                                    </TableSortLabel>
                                </TableCell>
                                <TableCell align="right">
                                    <TableSortLabel
                                        active={orderBy === 'orderCount'}
                                        direction={orderBy === 'orderCount' ? order : 'asc'}
                                        onClick={() => handleRequestSort('orderCount')}
                                    >
                                        注文数
                                    </TableSortLabel>
                                </TableCell>
                                <TableCell align="right">
                                    <TableSortLabel
                                        active={orderBy === 'lastDate'}
                                        direction={orderBy === 'lastDate' ? order : 'asc'}
                                        onClick={() => handleRequestSort('lastDate')}
                                    >
                                        最終更新
                                    </TableSortLabel>
                                </TableCell>
                                <TableCell />
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {sortedEvents.map((event) => (
                                <TableRow key={event.name} hover>
                                    <TableCell component="th" scope="row" sx={{ fontWeight: 'bold' }}>
                                        {event.name}
                                    </TableCell>
                                    <TableCell>{event.dateRange}</TableCell>
                                    <TableCell align="right">¥{event.totalRevenue.toLocaleString()}</TableCell>
                                    <TableCell align="right">{event.orderCount}件</TableCell>
                                    <TableCell align="right">{event.lastDate.toLocaleDateString()}</TableCell>
                                    <TableCell>
                                        <Button
                                            variant="contained"
                                            size="small"
                                            onClick={() => {
                                                onSelect(event.name);
                                                onClose();
                                            }}
                                        >
                                            選択
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {sortedEvents.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                                        <Typography variant="body2" color="text.secondary">
                                            該当するイベントがありません
                                        </Typography>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>キャンセル</Button>
            </DialogActions>
        </Dialog>
    );
}
