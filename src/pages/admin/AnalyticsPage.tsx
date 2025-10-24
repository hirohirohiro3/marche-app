import { useState, useEffect, useMemo } from 'react';
import {
  Container, Typography, Box, Button, Grid, Paper,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, CircularProgress
} from '@mui/material';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '../../firebase';
import { Order } from '../../types';
import AdminNav from '../../components/AdminNav';

type Period = 'today' | 'month' | 'all';

export default function AnalyticsPage() {
  const [period, setPeriod] = useState<Period>('today');
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true);
      const now = new Date();
      let startDate: Date;

      switch (period) {
        case 'today':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          break;
        case 'month':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        case 'all':
        default:
          // A very old date to signify all time
          startDate = new Date(0);
          break;
      }

      const ordersQuery = query(
        collection(db, 'orders'),
        where('status', '==', 'completed'),
        where('createdAt', '>=', Timestamp.fromDate(startDate))
      );

      const querySnapshot = await getDocs(ordersQuery);
      const fetchedOrders = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));
      setOrders(fetchedOrders);
      setLoading(false);
    };

    fetchOrders();
  }, [period]);

  const { totalSales, totalOrders, qrOrders, manualOrders, bestSellers } = useMemo(() => {
    const summary = {
      totalSales: 0,
      totalOrders: orders.length,
      qrOrders: 0,
      manualOrders: 0,
      bestSellers: new Map<string, number>(),
    };

    for (const order of orders) {
      summary.totalSales += order.totalPrice;
      if (order.orderType === 'qr') {
        summary.qrOrders++;
      } else {
        summary.manualOrders++;
      }
      for (const item of order.items) {
        summary.bestSellers.set(
          item.name,
          (summary.bestSellers.get(item.name) || 0) + item.quantity
        );
      }
    }

    const sortedBestSellers = Array.from(summary.bestSellers.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([name, quantity]) => ({ name, quantity }));

    return { ...summary, bestSellers: sortedBestSellers };
  }, [orders]);

  return (
    <>
      <AdminNav />
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Sales Analytics
        </Typography>

        <Box sx={{ mb: 4 }}>
          <Button variant={period === 'today' ? 'contained' : 'outlined'} onClick={() => setPeriod('today')}>
            Today
          </Button>
          <Button variant={period === 'month' ? 'contained' : 'outlined'} onClick={() => setPeriod('month')} sx={{ ml: 1 }}>
            This Month
          </Button>
          <Button variant={period === 'all' ? 'contained' : 'outlined'} onClick={() => setPeriod('all')} sx={{ ml: 1 }}>
            All Time
          </Button>
        </Box>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Grid container spacing={3}>
            {/* Summary Cards */}
            <Grid item xs={12} sm={6} md={3}>
              <Paper sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="h6">Total Sales</Typography>
                <Typography variant="h4">¥{totalSales.toLocaleString()}</Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Paper sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="h6">Total Orders</Typography>
                <Typography variant="h4">{totalOrders}</Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Paper sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="h6">QR Orders</Typography>
                <Typography variant="h4">{qrOrders}</Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Paper sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="h6">Manual Orders</Typography>
                <Typography variant="h4">{manualOrders}</Typography>
              </Paper>
            </Grid>

            {/* Best Sellers Chart */}
            <Grid item xs={12} md={8}>
              <Paper sx={{ p: 2, height: 400 }}>
                <Typography variant="h6" gutterBottom>Best Selling Items</Typography>
                <ResponsiveContainer width="100%" height="90%">
                  <BarChart data={bestSellers.slice(0, 10)} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" interval={0} angle={-45} textAnchor="end" />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="quantity" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </Paper>
            </Grid>

            {/* Best Sellers Table */}
            <Grid item xs={12} md={4}>
              <TableContainer component={Paper} sx={{ maxHeight: 400 }}>
                <Table stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell>Item</TableCell>
                      <TableCell align="right">Quantity</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {bestSellers.map((item) => (
                      <TableRow key={item.name}>
                        <TableCell>{item.name}</TableCell>
                        <TableCell align="right">{item.quantity}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Grid>
          </Grid>
        )}
      </Container>
    </>
  );
}
