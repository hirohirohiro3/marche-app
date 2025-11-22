import { useState } from 'react';
import { Container, Typography, List, ListItem, ListItemText, Button, Paper, Divider, CircularProgress, Box } from '@mui/material';
import { useCartStore } from '../store/cartStore';
import { useNavigate, useParams } from 'react-router-dom';
import { collection, serverTimestamp, doc, runTransaction } from "firebase/firestore";
import { db } from '../firebase';
import { uid } from 'uid'; // A library to generate unique IDs
import { Alert } from '@mui/material';

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
      console.log("[CheckoutPage] Starting handleConfirmOrder...");
      const settingsRef = doc(db, "system_settings", "orderNumbers");

      // Use a transaction to atomically get and increment the order number
      const newOrderId = await runTransaction(db, async (transaction) => {
        console.log("[CheckoutPage] Inside runTransaction. Getting settings doc...");
        const settingsDoc = await transaction.get(settingsRef);
        let newOrderNumber;
        if (settingsDoc.exists()) {
          newOrderNumber = settingsDoc.data().nextQrOrderNumber;
          transaction.update(settingsRef, { nextQrOrderNumber: newOrderNumber + 1 });
        } else {
          newOrderNumber = 101; // Start from 101 if document doesn't exist
          transaction.set(settingsRef, {
            nextQrOrderNumber: newOrderNumber + 1,
            nextManualOrderNumber: 1, // Also initialize the manual order number
          });
        }

        const newOrderRef = doc(collection(db, "orders"));
        transaction.set(newOrderRef, {
          orderNumber: newOrderNumber,
          storeId: storeId, // Add storeId so the order appears in the correct dashboard
          uid: localStorage.getItem('customerUid') || uid(16), // Get or create a customer UID
          items: items.map(i => {
            const orderItem: any = {
              name: i.item.name,
              quantity: i.quantity,
              price: i.itemPriceWithOptions,
            };

            if (i.selectedOptions) {
              const options = Object.values(i.selectedOptions).flat().map(choice => ({
                groupName: '', // We don't have group name in cart, will need to enhance later
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

      // After successful order creation
      if (!localStorage.getItem('customerUid')) {
        localStorage.setItem('customerUid', uid(16));
      }
      clearCart();
      navigate(`/order/${newOrderId}`);

    } catch (error) {
      console.error("Order confirmation failed:", error);
      setError("注文の作成に失敗しました。時間をおいて再度お試しください。");
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
