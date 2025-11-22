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
          const data = settingsDoc.data();
          // Defensive check for nextQrOrderNumber
          newOrderNumber = data.nextQrOrderNumber !== undefined ? data.nextQrOrderNumber : 101;
          transaction.update(settingsRef, { nextQrOrderNumber: newOrderNumber + 1 });
        } else {
          newOrderNumber = 101;
          transaction.set(settingsRef, {
            nextQrOrderNumber: newOrderNumber + 1,
            nextManualOrderNumber: 1,
          });
        }

        // Prepare items with defensive checks
        const orderItems = items.map(i => {
          // Defensive coding: Ensure no field is undefined
          const name = i.item.name || '不明な商品';
          const quantity = i.quantity || 1;
          const price = (i.itemPriceWithOptions ?? i.item.price) || 0;

          const orderItem: any = {
            name,
            quantity,
            price,
          };

          if (i.selectedOptions) {
            const options = Object.values(i.selectedOptions).flat().map(choice => ({
              groupName: '', // Assuming empty string is acceptable if not available
              choiceName: choice.name || '不明なオプション',
              priceModifier: choice.priceModifier || 0,
            }));
            if (options.length > 0) {
              orderItem.selectedOptions = options;
            }
          }
          return orderItem;
        });

        const orderData = {
          orderNumber: newOrderNumber,
          storeId: storeId,
          uid: localStorage.getItem('customerUid') || uid(16),
          items: orderItems,
          totalPrice: totalPrice() || 0,
          status: "new",
          orderType: "qr",
          createdAt: serverTimestamp(),
        };

        // Log the exact data being sent to Firestore for debugging
        console.log('[CheckoutPage] Attempting to set order with data:', JSON.stringify(orderData, null, 2));

        const newOrderRef = doc(collection(db, "orders"));
        transaction.set(newOrderRef, orderData);
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
      // Detailed error logging for undefined values
      if (e.message && e.message.includes('undefined')) {
         console.error('Undefined value detected in transaction payload. See previous logs for payload details.');
      }
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
