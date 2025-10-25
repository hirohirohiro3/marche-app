
import { useEffect, useState } from 'react';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../../firebase';
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

export default function AnalyticsPage() {
  const [summary, setSummary] = useState<SalesSummary | null>(null);
  const [topProducts, setTopProducts] = useState<ProductSales[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSalesData = async () => {
      setLoading(true);
      setError(null);
      try {
        const q = query(
          collection(db, 'orders'),
          where('status', '==', 'completed'),
          orderBy('createdAt', 'desc')
        );
        const querySnapshot = await getDocs(q);
        const orders = querySnapshot.docs.map(doc => doc.data() as Order);

        if (orders.length === 0) {
          setSummary({ totalRevenue: 0, totalOrders: 0, averageOrderValue: 0, qrOrdersCount: 0, manualOrdersCount: 0 });
          setTopProducts([]);
          setLoading(false);
          return;
        }

        const totalRevenue = orders.reduce((acc, order) => acc + order.totalPrice, 0);
        const totalOrders = orders.length;
        const averageOrderValue = totalRevenue / totalOrders;
        const qrOrdersCount = orders.filter(o => o.orderType === 'qr').length;
        const manualOrdersCount = orders.filter(o => o.orderType === 'manual').length;

        const productCounts: { [key: string]: number } = {};
        orders.forEach(order => {
          order.items.forEach(item => {
            productCounts[item.name] = (productCounts[item.name] || 0) + item.quantity;
          });
        });

        const sortedProducts = Object.entries(productCounts)
          .map(([name, quantity]) => ({ name, quantity }))
          .sort((a, b) => b.quantity - a.quantity)
          .slice(0, 10); // Top 10 products

        setSummary({ totalRevenue, totalOrders, averageOrderValue, qrOrdersCount, manualOrdersCount });
        setTopProducts(sortedProducts);
      } catch (err) {
        console.error("Error fetching sales data: ", err);
        setError('売上データの取得に失敗しました。');
      } finally {
        setLoading(false);
      }
    };

    fetchSalesData();
  }, []);

  if (loading) {
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
      <Typography variant="h4" component="h1" gutterBottom>
        売上分析
      </Typography>

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
