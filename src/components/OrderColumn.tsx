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

import React from 'react';

// ... (imports)

// Extracted and Memoized OrderCard Component
const OrderCard = React.memo(({ order, onUpdateStatus }: { order: Order; onUpdateStatus: (id: string, status: Order['status']) => void }) => {
  return (
    <Card sx={{ mt: 2 }} data-testid={`order-card-${order.id}`}>
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
  );
});

import { Virtuoso } from 'react-virtuoso';

export default function OrderColumn({ title, orders, onUpdateStatus, animation }: OrderColumnProps) {
  return (
    <Paper
      sx={{
        p: 2,
        height: orders.length > 0 ? 'calc(100vh - 200px)' : 'auto', // Fixed height only when there are orders
        display: 'flex',
        flexDirection: 'column',
        animation: animation || 'none',
      }}
    >
      <Typography variant="h6" gutterBottom>{title} ({orders.length})</Typography>
      <Box sx={{ flexGrow: 1 }}>
        {orders.length > 0 ? (
          <Virtuoso
            data={orders}
            itemContent={(_index, order) => (
              <Box sx={{ pb: 2 }}> {/* Add padding bottom for spacing between cards */}
                <OrderCard order={order} onUpdateStatus={onUpdateStatus} />
              </Box>
            )}
          />
        ) : (
          <Box sx={{ py: 4, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              注文はありません
            </Typography>
          </Box>
        )}
      </Box>
    </Paper>
  );
}
