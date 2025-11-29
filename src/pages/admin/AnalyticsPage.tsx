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

type TimeRange = 'today' | 'this_month' | 'all_time';

import HelpSection from '../../components/HelpSection';

export default function AnalyticsPage() {
  const { user, loading: authLoading } = useAuth();
  // ... (lines 42-148)
  return (
    <Container maxWidth="lg">
      <HelpSection title="売上分析について">
        <ul style={{ margin: 0, paddingLeft: '1.5rem' }}>
          <li>日別、月別の売上合計と注文数を確認できます。</li>
          <li><strong>イベント別売上</strong>: 開催したイベントごとの売上実績も確認可能です。</li>
          <li>期間を指定してデータを絞り込むことができます。</li>
        </ul>
      </HelpSection>

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
