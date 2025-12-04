import { collection, serverTimestamp, doc, runTransaction } from "firebase/firestore";
import { db, auth } from '../firebase';
import { uid } from 'uid';
import {
  Container, Typography, Button, Box, Paper, List, ListItem, ListItemText,
  IconButton, Divider, Stack, Alert, Dialog, DialogActions, DialogContent,
  DialogContentText, DialogTitle, CircularProgress
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import { useParams, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useCartStore } from '../store/cartStore';
import { COLLECTIONS } from '../constants';
import {
  SwipeableList,
  SwipeableListItem,
  SwipeAction,
  TrailingActions,
} from 'react-swipeable-list';
import 'react-swipeable-list/dist/styles.css';
import { useHaptic } from '../hooks/useHaptic';
import { AnimatedButton } from '../components/ui/AnimatedButton';

export default function CheckoutPage() {
  const { storeId } = useParams<{ storeId: string }>();
  const { items, totalPrice, clearCart, updateQuantity, removeItem } = useCartStore();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const { triggerHaptic } = useHaptic();

  const handleDeleteClick = (cartItemId: string) => {
    triggerHaptic('warning');
    setItemToDelete(cartItemId);
    setDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = () => {
    triggerHaptic('medium');
    if (itemToDelete) {
      removeItem(itemToDelete);
    }
    setDeleteConfirmOpen(false);
    setItemToDelete(null);
  };

  const handleCancelDelete = () => {
    setDeleteConfirmOpen(false);
    setItemToDelete(null);
  };

  const handleConfirmOrder = async () => {
    // triggerHaptic('heavy');
    if (!storeId) {
      setError("店舗情報が見つかりません。");
      return;
    }
    if (items.length === 0) {
      setError("カートが空です。");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const newOrderId = await runTransaction(db, async (transaction) => {
        const storeRef = doc(db, COLLECTIONS.STORES, storeId);
        const settingsRef = doc(db, COLLECTIONS.SYSTEM_SETTINGS, 'orderNumbers');

        const storeDoc = await transaction.get(storeRef);
        const eventName = storeDoc.exists() ? (storeDoc.data().currentEventName || null) : null;

        const settingsDoc = await transaction.get(settingsRef);
        let newOrderNumber: number;

        if (settingsDoc.exists()) {
          const data = settingsDoc.data();
          newOrderNumber = data.nextQrOrderNumber !== undefined ? data.nextQrOrderNumber : 101;
          transaction.update(settingsRef, { nextQrOrderNumber: newOrderNumber + 1 });
        } else {
          newOrderNumber = 101;
          transaction.set(settingsRef, {
            nextQrOrderNumber: newOrderNumber + 1,
            nextManualOrderNumber: 1,
          });
        }

        // Prepare items
        const orderItems = items.map(i => {
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

        const newOrderRef = doc(collection(db, COLLECTIONS.ORDERS));
        const orderData = {
          orderNumber: newOrderNumber,
          storeId: storeId,
          uid: auth.currentUser?.uid || localStorage.getItem('customerUid') || uid(16),
          items: orderItems,
          totalPrice: totalPrice() || 0,
          status: "new",
          orderType: "qr",
          createdAt: serverTimestamp(),
          eventName: eventName,
        };

        transaction.set(newOrderRef, orderData);
        return newOrderRef.id;
      });

      clearCart();
      triggerHaptic('success');
      navigate(`/order/${newOrderId}`);
    } catch (err) {
      console.error("Order creation failed:", err);
      setError("注文の作成に失敗しました。もう一度お試しください。");
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
        <SwipeableList>
          {items.map(cartItem => (
            <SwipeableListItem
              key={cartItem.cartItemId}
              trailingActions={
                <TrailingActions>
                  <SwipeAction
                    destructive={true}
                    onClick={() => handleDeleteClick(cartItem.cartItemId)}
                  >
                    <Box
                      sx={{
                        bgcolor: 'error.main',
                        color: 'white',
                        width: 80,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        height: '100%'
                      }}
                    >
                      <DeleteIcon />
                    </Box>
                  </SwipeAction>
                </TrailingActions>
              }
            >
              <ListItem
                secondaryAction={
                  <IconButton edge="end" aria-label="delete" onClick={() => handleDeleteClick(cartItem.cartItemId)}>
                    <DeleteIcon />
                  </IconButton>
                }
                sx={{ bgcolor: 'background.paper', borderBottom: '1px solid rgba(0, 0, 0, 0.12)' }}
              >
                <ListItemText
                  primary={cartItem.item.name}
                  secondary={
                    <>
                      <Typography component="span" variant="body2" color="text.primary">
                        ¥{(cartItem.itemPriceWithOptions).toLocaleString()}
                      </Typography>
                      {cartItem.selectedOptions && Object.values(cartItem.selectedOptions).flat().map((opt, idx) => (
                        <Typography key={idx} variant="caption" display="block" color="text.secondary">
                          + {opt.name} (¥{opt.priceModifier})
                        </Typography>
                      ))}
                    </>
                  }
                />
                <Stack direction="row" alignItems="center" spacing={1} sx={{ mr: 2 }}>
                  <IconButton
                    size="small"
                    onClick={() => {
                      triggerHaptic('light');
                      updateQuantity(cartItem.cartItemId, cartItem.quantity - 1);
                    }}
                    disabled={cartItem.quantity <= 1}
                  >
                    <RemoveIcon fontSize="small" />
                  </IconButton>
                  <Typography>{cartItem.quantity}</Typography>
                  <IconButton
                    size="small"
                    onClick={() => {
                      triggerHaptic('light');
                      updateQuantity(cartItem.cartItemId, cartItem.quantity + 1);
                    }}
                  >
                    <AddIcon fontSize="small" />
                  </IconButton>
                </Stack>
              </ListItem>
            </SwipeableListItem>
          ))}
        </SwipeableList>
        <Divider />
        <List>
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

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteConfirmOpen}
        onClose={handleCancelDelete}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">
          {"商品を削除しますか？"}
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            この商品をカートから削除してもよろしいですか？
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelDelete}>キャンセル</Button>
          <Button onClick={handleConfirmDelete} color="error" autoFocus>
            削除する
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
