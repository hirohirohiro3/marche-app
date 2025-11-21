import { Paper, Typography, Button, Box } from '@mui/material';
import { ShoppingCart } from '@mui/icons-material';
import { useCartStore } from '../store/cartStore';
import { useNavigate, useParams } from 'react-router-dom';

export default function CartSummary() {
  const { storeId } = useParams<{ storeId: string }>();
  const { totalItems, totalPrice } = useCartStore();
  const navigate = useNavigate();

  const itemsCount = totalItems();
  const price = totalPrice();

  if (itemsCount === 0) {
    return null; // Don't show if cart is empty
  }

  return (
    <Paper
      data-testid="cart-summary"
      elevation={3}
      sx={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        p: 2,
        display: 'flex',
        justifyContent: 'space-around',
        alignItems: 'center',
      }}
    >
      <Box>
        <Typography variant="h6">{itemsCount}点の商品</Typography>
        <Typography variant="h5">合計: ¥{price.toLocaleString()}</Typography>
      </Box>
      <Button
        variant="contained"
        size="large"
        startIcon={<ShoppingCart />}
        onClick={() => navigate(`/checkout/${storeId}`)} // Navigate to checkout page with storeId
        data-testid="checkout-button"
      >
        注文へ進む
      </Button>
    </Paper>
  );
}
