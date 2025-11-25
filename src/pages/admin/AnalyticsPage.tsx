
import { useEffect, useState, useMemo } from 'react';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../hooks/useAuth';
import { Order } from '../../types';
import {
  Typography,
  Container,
  Grid,
  Paper,
  Box,
  CircularProgress,
  Alert,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  ButtonGroup,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface SalesSummary {
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
  qrOrdersCount: number;
  manualOrdersCount: number;
}

interface ProductSales {
  name: string;
  quantity: number;
}

type TimeRange = 'today' | 'this_month' | 'all_time';

export default function AnalyticsPage() {
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<TimeRange>('all_time');
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<string>('all');

  useEffect(() => {
    const fetchSalesData = async () => {
      if (!user) {
        setLoading(false);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const now = new Date();
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);

        let q = query(
          collection(db, 'orders'),
          where('status', 'in', ['completed', 'archived']),
          where('storeId', '==', user.uid)
        );

        if (timeRange === 'today') {
          q = query(q, where('createdAt', '>=', todayStart));
        } else if (timeRange === 'this_month') {
          q = query(q, where('createdAt', '>=', thisMonthStart));
        }

        q = query(q, orderBy('createdAt', 'desc'));

        const querySnapshot = await getDocs(q);
        const fetchedOrders = querySnapshot.docs.map(doc => doc.data() as Order);
        setOrders(fetchedOrders);
      } catch (err) {
        console.error("Error fetching sales data: ", err);
        setError('売上データの取得に失敗しました。');
      } finally {
        setLoading(false);
      }
    };

    fetchSalesData();
  }, [timeRange, user]);

  // Filter orders based on selected event
  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      if (selectedEvent === 'all') return true;
      if (selectedEvent === 'none') return !order.eventName;
      return order.eventName === selectedEvent;
    });
  }, [orders, selectedEvent]);

  // Extract unique event names
  const eventNames = useMemo(() => {
    return Array.from(new Set(orders.map(o => o.eventName).filter(Boolean))) as string[];
  }, [orders]);

  // Calculate summary and top products using useMemo
  const { summary, topProducts } = useMemo(() => {
    if (filteredOrders.length === 0) {
      return {
        summary: { totalRevenue: 0, totalOrders: 0, averageOrderValue: 0, qrOrdersCount: 0, manualOrdersCount: 0 },
        topProducts: []
      };
    }

    const totalRevenue = filteredOrders.reduce((acc, order) => acc + order.totalPrice, 0);
    const totalOrders = filteredOrders.length;
    const averageOrderValue = totalRevenue / totalOrders;
    const qrOrdersCount = filteredOrders.filter(o => o.orderType === 'qr').length;
    const manualOrdersCount = filteredOrders.filter(o => o.orderType === 'manual').length;

    const productCounts: { [key: string]: number } = {};
    filteredOrders.forEach(order => {
      order.items.forEach(item => {
        productCounts[item.name] = (productCounts[item.name] || 0) + item.quantity;
      });
    });

    const sortedProducts = Object.entries(productCounts)
      .map(([name, quantity]) => ({ name, quantity }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 10);

    return {
      summary: { totalRevenue, totalOrders, averageOrderValue, qrOrdersCount, manualOrdersCount },
      topProducts: sortedProducts
    };
  }, [filteredOrders]);

  if (loading || authLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          売上分析
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel id="event-select-label">イベント</InputLabel>
            <Select
              labelId="event-select-label"
              value={selectedEvent}
              label="イベント"
              onChange={(e) => setSelectedEvent(e.target.value)}
            >
              <MenuItem value="all">全てのイベント</MenuItem>
              <MenuItem value="none">イベントなし</MenuItem>
              {eventNames.map(name => (
                <MenuItem key={name} value={name}>{name}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <ButtonGroup variant="outlined" aria-label="time range button group">
            <Button onClick={() => setTimeRange('today')} variant={timeRange === 'today' ? 'contained' : 'outlined'}>今日</Button>
            <Button onClick={() => setTimeRange('this_month')} variant={timeRange === 'this_month' ? 'contained' : 'outlined'}>今月</Button>
            <Button onClick={() => setTimeRange('all_time')} variant={timeRange === 'all_time' ? 'contained' : 'outlined'}>全期間</Button>
          </ButtonGroup>
        </Box>
      </Box>

      {summary && (
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Paper sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="h6">総売上高</Typography>
              <Typography variant="h4">¥{summary.totalRevenue.toLocaleString()}</Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Paper sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="h6">総注文件数</Typography>
              <Typography variant="h4">{summary.totalOrders}</Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Paper sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="h6">平均注文単価</Typography>
              <Typography variant="h4">¥{Math.round(summary.averageOrderValue).toLocaleString()}</Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Paper sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="h6">注文種別 (QR/手動)</Typography>
              <Typography variant="h4">{summary.qrOrdersCount} / {summary.manualOrdersCount}</Typography>
            </Paper>
          </Grid>
        </Grid>
      )}

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 2, height: '400px' }}>
            <Typography variant="h6" gutterBottom>売れ筋商品ランキング (Top 10)</Typography>
            <ResponsiveContainer width="100%" height="90%">
              <BarChart data={topProducts} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Bar dataKey="quantity" fill="#8884d8" name="販売数" />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>商品名</TableCell>
                  <TableCell align="right">販売数</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {topProducts.map((product) => (
                  <TableRow key={product.name}>
                    <TableCell>{product.name}</TableCell>
                    <TableCell align="right">{product.quantity}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Grid>
      </Grid>
    </Container>
  );
}
