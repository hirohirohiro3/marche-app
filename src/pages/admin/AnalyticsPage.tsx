import { useEffect, useState, useMemo } from 'react';
import { collection, query, where, getDocs, orderBy, Timestamp } from 'firebase/firestore';
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
  useTheme,
} from '@mui/material';
import EventIcon from '@mui/icons-material/Event';
import EventSelectionDialog from '../../components/EventSelectionDialog';
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

type TimeRange = 'today' | 'this_month' | 'all_time';

import HelpSection from '../../components/HelpSection';

export default function AnalyticsPage() {
  const theme = useTheme();
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<TimeRange>('today');
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<string>('all');
  const [isEventSelectionOpen, setIsEventSelectionOpen] = useState(false);

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
          where('storeId', '==', user!.uid)
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

  // Process events for Dialog
  const eventOptions = useMemo(() => {
    const eventMap = new Map<string, { lastDate: Date, firstDate: Date, totalRevenue: number, orderCount: number }>();

    orders.forEach(order => {
      if (!order.eventName) return;
      const date = new Timestamp(order.createdAt.seconds, order.createdAt.nanoseconds).toDate();
      const current = eventMap.get(order.eventName);
      if (!current) {
        eventMap.set(order.eventName, {
          lastDate: date,
          firstDate: date,
          totalRevenue: order.totalPrice,
          orderCount: 1
        });
      } else {
        if (date > current.lastDate) current.lastDate = date;
        if (date < current.firstDate) current.firstDate = date;
        current.totalRevenue += order.totalPrice;
        current.orderCount += 1;
      }
    });

    const events = Array.from(eventMap.entries()).map(([name, data]) => {
      const startStr = `${data.firstDate.getMonth() + 1}/${data.firstDate.getDate()}`;
      const endStr = `${data.lastDate.getMonth() + 1}/${data.lastDate.getDate()}`;
      const dateRange = startStr === endStr ? `(${startStr})` : `(${startStr} ~ ${endStr})`;

      return {
        name,
        dateRange,
        totalRevenue: data.totalRevenue,
        orderCount: data.orderCount,
        lastDate: data.lastDate,
      };
    });

    // Sort by last active date (newest first)
    events.sort((a, b) => b.lastDate.getTime() - a.lastDate.getTime());

    return events;
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
      <HelpSection title="売上分析について">
        <Box sx={{ '& h3': { fontSize: '1rem', fontWeight: 'bold', mt: 2, mb: 1 }, '& p': { mb: 1 }, '& ul': { pl: 3 } }}>
          <h3>売上分析の見方</h3>
          <Typography variant="body2" paragraph>
            このページでは、イベントごとの売上データを確認できます。<br />
            上部のドロップダウンで、見たいイベントを選択してください。
          </Typography>

          <h3>各項目の説明</h3>
          <ul>
            <li><strong>売上サマリー</strong>: 総売上、注文数、平均客単価を一目で確認できます。</li>
            <li><strong>商品別売上グラフ</strong>: どの商品がよく売れたか（人気商品）を把握できます。</li>
            <li><strong>時間帯別売上グラフ</strong>: 何時頃に注文が多かったかを確認でき、人員配置の参考に役立ちます。</li>
          </ul>

          <Alert severity="info" sx={{ mt: 1, py: 0 }}>
            <Typography variant="caption">
              <strong>💡 データの活用方法</strong><br />
              ・売れ筋商品を増産する<br />
              ・売れない商品を見直す<br />
              ・忙しい時間帯のスタッフを増やす
            </Typography>
          </Alert>

          <Typography variant="caption" display="block" sx={{ mt: 1, color: 'text.secondary' }}>
            ※「CSVダウンロード」ボタンで、Excelで開けるデータをダウンロードできます。
          </Typography>
        </Box>
      </HelpSection>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          売上分析
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {selectedEvent !== 'all' && selectedEvent !== 'none' && (
            <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mr: 1 }}>
              表示中: {selectedEvent}
            </Typography>
          )}
          <Button
            variant="outlined"
            startIcon={<EventIcon />}
            onClick={() => setIsEventSelectionOpen(true)}
          >
            イベントを選択
          </Button>
          {selectedEvent !== 'all' && (
            <Button onClick={() => setSelectedEvent('all')}>
              全解除
            </Button>
          )}
        </Box>
        <EventSelectionDialog
          open={isEventSelectionOpen}
          onClose={() => setIsEventSelectionOpen(false)}
          onSelect={setSelectedEvent}
          events={eventOptions}
        />
      </Box>

      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
        <ButtonGroup variant="outlined" aria-label="time range button group">
          <Button onClick={() => setTimeRange('today')} variant={timeRange === 'today' ? 'contained' : 'outlined'}>今日</Button>
          <Button onClick={() => setTimeRange('this_month')} variant={timeRange === 'this_month' ? 'contained' : 'outlined'}>今月</Button>
          <Button onClick={() => setTimeRange('all_time')} variant={timeRange === 'all_time' ? 'contained' : 'outlined'}>全期間</Button>
        </ButtonGroup>
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
                <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
                <XAxis
                  dataKey="name"
                  tick={{ fill: theme.palette.text.secondary, fontSize: 12 }}
                  stroke={theme.palette.divider}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fill: theme.palette.text.secondary, fontSize: 12 }}
                  stroke={theme.palette.divider}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: theme.palette.background.paper,
                    color: theme.palette.text.primary,
                    border: `1px solid ${theme.palette.divider}`
                  }}
                />
                <Legend wrapperStyle={{ color: theme.palette.text.primary }} />
                <Bar dataKey="quantity" fill={theme.palette.primary.main} name="販売数" />
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
