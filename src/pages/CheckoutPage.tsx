import { useState } from 'react';
import { Container, Typography, List, ListItem, ListItemText, Button, Paper, Divider, CircularProgress, Box, Alert } from '@mui/material';
import { useCartStore } from '../store/cartStore';
import { useNavigate, useParams } from 'react-router-dom';
import { collection, serverTimestamp, doc, runTransaction } from "firebase/firestore";
import { db } from '../firebase';
import { uid } from 'uid'; // A library to generate unique IDs

export default function CheckoutPage() {
  const { storeId } = useParams<{ storeId: string }>();
  const { items, totalPrice, clearCart } = useCartStore();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConfirmOrder = async () => {
    setIsSubmitting(true);
    setError(null);
    try {
      console.log('[CheckoutPage] Starting handleConfirmOrder...');
      if (!storeId) {
        throw new Error('storeId is missing from URL parameters.');
      }
      const settingsRef = doc(db, "system_settings", "orderNumbers");

      const newOrderId = await runTransaction(db, async (transaction) => {
        const settingsDoc = await transaction.get(settingsRef);
        let newOrderNumber: number;
        if (settingsDoc.exists()) {
          newOrderNumber = settingsDoc.data().nextQrOrderNumber;
          transaction.update(settingsRef, { nextQrOrderNumber: newOrderNumber + 1 });
        } else {
          newOrderNumber = 101;
          transaction.set(settingsRef, {
            nextQrOrderNumber: newOrderNumber + 1,
            nextManualOrderNumber: 1,
          });
        }

        const newOrderRef = doc(collection(db, "orders"));
        transaction.set(newOrderRef, {
          orderNumber: newOrderNumber,
          storeId: storeId,
          uid: localStorage.getItem('customerUid') || uid(16),
          items: items.map(i => {
            const orderItem: any = {
              name: i.item.name,
              quantity: i.quantity,
              price: i.itemPriceWithOptions ?? i.item.price,
            };
            if (i.selectedOptions) {
              const options = Object.values(i.selectedOptions).flat().map(choice => ({
                groupName: '',
                choiceName: choice.name,
                priceModifier: choice.priceModifier,
              }));
              if (options.length > 0) {
                orderItem.selectedOptions = options;
              }
            }
            return orderItem;
          }),
          totalPrice: totalPrice(),
          status: "new",
          orderType: "qr",
          createdAt: serverTimestamp(),
        });
        return newOrderRef.id;
      });

      // Persist a customer UID for future orders
      if (!localStorage.getItem('customerUid')) {
        localStorage.setItem('customerUid', uid(16));
      }
      clearCart();
      navigate(`/order/${newOrderId}`);
    } catch (e: any) {
      console.error('Order confirmation failed:', e);
      setError('注文の作成に失敗しました。時間をおいて再度お試しください。');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Container data-testid="checkout-container" maxWidth="sm" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        ご注文内容の確認
      </Typography>
      <Paper elevation={3}>
        <List data-testid="order-items-list">
          {items.map(cartItem => (
            <ListItem key={cartItem.item.id}>
              <ListItemText
                primary={`${cartItem.item.name} x ${cartItem.quantity}`}
                secondary={`¥${(cartItem.item.price * cartItem.quantity).toLocaleString()}`}
              />
            </ListItem>
          ))}
          <Divider />
          <ListItem>
            <ListItemText>
              <Typography variant="h6" data-testid="total-price">
                合計: ¥{totalPrice().toLocaleString()}
              </Typography>
            </ListItemText>
          </ListItem>
        </List>
      </Paper>
      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}
      <Box sx={{ mt: 4, display: 'flex', gap: 2 }}>
        <Button
          variant="outlined"
          size="large"
          fullWidth
          onClick={() => navigate(`/menu/${storeId}`)}
          disabled={isSubmitting}
        >
          戻る
        </Button>
        <Button
          variant="contained"
          size="large"
          fullWidth
          onClick={handleConfirmOrder}
          disabled={isSubmitting}
          data-testid="confirm-order-button"
        >
          {isSubmitting ? <CircularProgress size={24} color="inherit" /> : "注文を確定する"}
        </Button>
      </Box>
    </Container>
  );
}
