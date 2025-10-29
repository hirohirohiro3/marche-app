import {
  Paper,
  Typography,
  Card,
  CardContent,
  CardActions,
  Button,
  Box,
} from '@mui/material';
import { Order } from '../types';

interface OrderColumnProps {
  title: string;
  orders: Order[];
  onUpdateStatus: (orderId: string, newStatus: Order['status']) => void;
  animation?: string;
}

const getActions = (
  order: Order,
  onUpdateStatus: (orderId: string, newStatus: Order['status']) => void
) => {
  switch (order.status) {
    case 'new':
      return (
        <>
          <Button size="small" onClick={() => onUpdateStatus(order.id, 'paid')}>
            支払い済みにする
          </Button>
          <Button
            size="small"
            color="error"
            onClick={() => onUpdateStatus(order.id, 'cancelled')}
          >
            キャンセル
          </Button>
        </>
      );
    case 'paid':
      return (
        <>
          <Button
            size="small"
            onClick={() => onUpdateStatus(order.id, 'completed')}
          >
            完了にする
          </Button>
          <Button
            size="small"
            color="error"
            onClick={() => onUpdateStatus(order.id, 'cancelled')}
          >
            キャンセル
          </Button>
        </>
      );
    default:
      return null;
  }
};

export default function OrderColumn({ title, orders, onUpdateStatus, animation }: OrderColumnProps) {
  return (
    <Paper
      sx={{
        p: 2,
        animation: animation || 'none',
      }}
    >
      <Typography variant="h6">{title}</Typography>
      {orders.map((order) => (
        <Card key={order.id} sx={{ mt: 2 }}>
          <CardContent>
            <Typography variant="h5">#{order.orderNumber}</Typography>
            {order.items.map((item, index) => (
              <Typography key={index}>
                {item.name} x {item.quantity}
              </Typography>
            ))}
            <Box sx={{ mt: 1 }}>
              <Typography variant="body2" color="text.secondary">
                合計: ¥{order.totalPrice}
              </Typography>
            </Box>
          </CardContent>
          <CardActions>{getActions(order, onUpdateStatus)}</CardActions>
        </Card>
      ))}
    </Paper>
  );
}
