import {
  Paper,
  Typography,
  Card,
  CardContent,
  CardActions,
  Button,
  Box,
  Chip,
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
          <Button
            size="small"
            onClick={() => onUpdateStatus(order.id, 'paid')}
            data-testid={`mark-as-paid-button-${order.id}`}
          >
            支払い済みにする
          </Button>
          <Button
            size="small"
            color="error"
            onClick={() => onUpdateStatus(order.id, 'cancelled')}
            data-testid={`cancel-button-${order.id}`}
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
            data-testid={`mark-as-completed-button-${order.id}`}
          >
            完了にする
          </Button>
          <Button
            size="small"
            color="error"
            onClick={() => onUpdateStatus(order.id, 'cancelled')}
            data-testid={`cancel-button-${order.id}`}
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
        <Card key={order.id} sx={{ mt: 2 }} data-testid={`order-card-${order.id}`}>
          <CardContent>
            <Typography variant="h5">#{order.orderNumber}</Typography>
            {order.items.map((item, index) => (
              <Box key={index} sx={{ mb: 1.5 }}>
                <Typography variant="body1" fontWeight="bold">
                  {item.name} x {item.quantity}
                </Typography>
                {item.selectedOptions && item.selectedOptions.length > 0 && (
                  <Box
                    sx={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: 0.75,
                      mt: 0.75,
                      pl: 2,
                      py: 0.5,
                      backgroundColor: 'rgba(255, 152, 0, 0.12)',
                      borderRadius: 1,
                    }}
                  >
                    {item.selectedOptions.map((opt, optIndex) => (
                      <Chip
                        key={optIndex}
                        label={opt.choiceName}
                        size="small"
                        color="warning"
                        sx={{
                          fontWeight: 'medium',
                          fontSize: '0.8rem',
                        }}
                      />
                    ))}
                  </Box>
                )}
              </Box>
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
