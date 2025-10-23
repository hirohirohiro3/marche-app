import { useState, useMemo, useEffect } from 'react';
import {
  Modal,
  Box,
  Typography,
  Grid,
  Button,
  Paper,
  IconButton,
  CircularProgress,
} from '@mui/material';
import CloseIcon from '@mui-icons-material/Close';
import {
  collection,
  serverTimestamp,
  runTransaction,
  doc,
} from 'firebase/firestore';
import { db } from '../firebase';
import { MenuItem } from '../types';

type CartItem = {
  id: string;
  name: string;
  quantity: number;
  price: number;
};

interface ManualOrderModalProps {
  open: boolean;
  onClose: () => void;
  menuItems: MenuItem[];
}

const style = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: '90vw',
  maxWidth: '1200px',
  bgcolor: 'background.paper',
  boxShadow: 24,
  p: 4,
  borderRadius: 2,
  maxHeight: '90vh',
  display: 'flex',
  flexDirection: 'column',
};

export default function ManualOrderModal({
  open,
  onClose,
  menuItems,
}: ManualOrderModalProps) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const totalPrice = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }, [cart]);

  const handleAddToCart = (item: MenuItem) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find((cartItem) => cartItem.id === item.id);
      if (existingItem) {
        return prevCart.map((cartItem) =>
          cartItem.id === item.id
            ? { ...cartItem, quantity: cartItem.quantity + 1 }
            : cartItem
        );
      }
      return [...prevCart, { id: item.id, name: item.name, price: item.price, quantity: 1 }];
    });
  };

  const handleRemoveFromCart = (itemId: string) => {
     setCart((prevCart) => {
      const existingItem = prevCart.find((cartItem) => cartItem.id === itemId);
      if (existingItem && existingItem.quantity > 1) {
        return prevCart.map((cartItem) =>
          cartItem.id === itemId
            ? { ...cartItem, quantity: cartItem.quantity - 1 }
            : cartItem
        );
      }
      return prevCart.filter((cartItem) => cartItem.id !== itemId);
    });
  };

  const resetCart = () => {
    setCart([]);
  }

  const handleClose = () => {
    resetCart();
    onClose();
  }

  const handleCreateOrder = async () => {
    if (cart.length === 0) return;
    setIsLoading(true);

    try {
      await runTransaction(db, async (transaction) => {
        const settingsRef = doc(db, 'system_settings', 'single_doc');
        const settingsDoc = await transaction.get(settingsRef);

        if (!settingsDoc.exists()) {
          throw 'System settings not found!';
        }

        const newOrderNumber = settingsDoc.data().nextManualOrderNumber;
        transaction.update(settingsRef, { nextManualOrderNumber: newOrderNumber + 1 });

        const newOrderRef = doc(collection(db, 'orders'));
        const orderItems = cart.map(({ id, ...rest }) => rest);

        transaction.set(newOrderRef, {
          orderNumber: newOrderNumber,
          items: orderItems,
          totalPrice: totalPrice,
          status: 'paid',
          orderType: 'manual',
          createdAt: serverTimestamp(),
          // uid is not required for manual orders
        });
      });
      handleClose();
    } catch (error) {
      console.error('Error creating order: ', error);
      // TODO: Show user-friendly error message
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      resetCart();
    }
  }, [open]);

  return (
    <Modal open={open} onClose={handleClose}>
      <Box sx={style}>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 2,
          }}
        >
          <Typography variant="h6">Manual POS</Typography>
          <IconButton onClick={handleClose}>
            <CloseIcon />
          </IconButton>
        </Box>

        <Grid container spacing={2} sx={{ flexGrow: 1, overflow: 'hidden' }}>
          {/* Menu Items */}
          <Grid
            item
            xs={12}
            md={7}
            sx={{ overflowY: 'auto', maxHeight: 'calc(90vh - 200px)' }}
          >
            <Typography variant="h6" gutterBottom>Menu</Typography>
            <Grid container spacing={1}>
              {menuItems.map((item) => (
                <Grid item xs={6} sm={4} md={3} key={item.id}>
                  <Button
                    variant="contained"
                    onClick={() => handleAddToCart(item)}
                    sx={{ width: '100%', height: '100px', textTransform: 'none' }}
                  >
                    {item.name}
                  </Button>
                </Grid>
              ))}
            </Grid>
          </Grid>

          {/* Cart */}
          <Grid
            item
            xs={12}
            md={5}
            sx={{
              display: 'flex',
              flexDirection: 'column',
              maxHeight: 'calc(90vh - 150px)',
            }}
          >
            <Paper sx={{ p: 2, flexGrow: 1, overflowY: 'auto' }}>
              <Typography variant="h6" gutterBottom>
                Current Order
              </Typography>
              {cart.length === 0 ? (
                <Typography>No items added.</Typography>
              ) : (
                cart.map((item) => (
                  <Box
                    key={item.id}
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      mb: 1,
                    }}
                  >
                    <Typography>
                      {item.name} x {item.quantity}
                    </Typography>
                    <Button
                      size="small"
                      variant="outlined"
                      color="error"
                      onClick={() => handleRemoveFromCart(item.id)}
                    >
                      Remove
                    </Button>
                  </Box>
                ))
              )}
            </Paper>
            <Box sx={{ mt: 'auto', pt: 2 }}>
              <Typography variant="h5" align="right" gutterBottom>
                Total: ¥{totalPrice}
              </Typography>
              <Button
                variant="contained"
                color="primary"
                fullWidth
                onClick={handleCreateOrder}
                disabled={cart.length === 0 || isLoading}
              >
                {isLoading ? (
                  <CircularProgress size={24} color="inherit" />
                ) : (
                  'Create Order & Mark as Paid'
                )}
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Box>
    </Modal>
  );
}
