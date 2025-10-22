import { useState } from 'react';
import { Container, Typography, List, ListItem, ListItemText, Button, Paper, Divider, CircularProgress } from '@mui/material';
import { useCartStore } from '../store/cartStore';
import { useNavigate } from 'react-router-dom';
import { collection, addDoc, serverTimestamp, doc, runTransaction } from "firebase/firestore";
import { db } from '../firebase';
import { uid } from 'uid'; // A library to generate unique IDs

export default function CheckoutPage() {
  const { items, totalPrice, clearCart } = useCartStore();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleConfirmOrder = async () => {
    setIsSubmitting(true);
    try {
      const settingsRef = doc(db, "system_settings", "orderNumbers");

      // Use a transaction to atomically get and increment the order number
      const newOrderId = await runTransaction(db, async (transaction) => {
        const settingsDoc = await transaction.get(settingsRef);
        if (!settingsDoc.exists()) {
          throw "System settings not found!";
        }
        const newOrderNumber = settingsDoc.data().nextQrOrderNumber;
        transaction.update(settingsRef, { nextQrOrderNumber: newOrderNumber + 1 });

        const newOrderRef = doc(collection(db, "orders"));
        transaction.set(newOrderRef, {
          orderNumber: newOrderNumber,
          uid: localStorage.getItem('customerUid') || uid(16), // Get or create a customer UID
          items: items.map(i => ({ name: i.item.name, quantity: i.quantity, price: i.item.price })),
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
      // TODO: Show an error message
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Container maxWidth="sm" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        ご注文内容の確認
      </Typography>
      <Paper elevation={3}>
        <List>
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
              <Typography variant="h6">
                合計: ¥{totalPrice().toLocaleString()}
              </Typography>
            </ListItemText>
          </ListItem>
        </List>
      </Paper>
      <Button
        variant="contained"
        size="large"
        fullWidth
        sx={{ mt: 4 }}
        onClick={handleConfirmOrder}
        disabled={isSubmitting}
      >
        {isSubmitting ? <CircularProgress size={24} color="inherit" /> : "注文を確定する"}
      </Button>
    </Container>
  );
}
