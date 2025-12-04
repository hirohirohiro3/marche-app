import { useState } from 'react';
import { Paper, Typography, Button, Box, List, ListItem, ListItemText, IconButton, Divider, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions } from '@mui/material';
import { motion } from 'framer-motion';
import { ShoppingCart, Delete as DeleteIcon } from '@mui/icons-material';
import { useCartStore } from '../store/cartStore';
import { useNavigate, useParams } from 'react-router-dom';
import { useHaptic } from '../hooks/useHaptic';

export default function CartSummary() {
  const { storeId } = useParams<{ storeId: string }>();
  const { items, totalItems, totalPrice, removeItem } = useCartStore();
  const navigate = useNavigate();
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const { triggerHaptic } = useHaptic();

  const itemsCount = totalItems();
  const price = totalPrice();

  if (itemsCount === 0) {
    return null; // Don't show if cart is empty
  }

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

  return (
    <>
      <Paper
        data-testid="cart-summary"
        elevation={3}
        sx={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 1000, // Ensure it stays on top
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '40vh', // Limit height to avoid covering too much
        }}
      >
        {/* Scrollable Item List */}
        <Box sx={{ overflowY: 'auto', flexGrow: 1, px: 2, pt: 1 }}>
          <List dense>
            {items.map((cartItem) => (
              <ListItem
                key={cartItem.cartItemId}
                secondaryAction={
                  <IconButton edge="end" aria-label="delete" size="small" onClick={() => handleDeleteClick(cartItem.cartItemId)}>
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                }
                sx={{ py: 0 }}
              >
                <ListItemText
                  primary={`${cartItem.item.name} x ${cartItem.quantity}`}
                  secondary={
                    cartItem.selectedOptions
                      ? `+ ${Object.values(cartItem.selectedOptions).flat().map(o => o.name).join(', ')}`
                      : null
                  }
                  primaryTypographyProps={{ variant: 'body2', noWrap: true }}
                  secondaryTypographyProps={{ variant: 'caption', noWrap: true }}
                />
              </ListItem>
            ))}
          </List>
        </Box>

        <Divider />

        {/* Footer Actions */}
        <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: 'background.paper' }}>
          <Box>
            <Typography variant="subtitle1" fontWeight="bold">合計: ¥{price.toLocaleString()}</Typography>
            <Typography variant="caption" color="text.secondary">{itemsCount}点の商品</Typography>
          </Box>
          <Button
            variant="contained"
            size="large"
            startIcon={
              <motion.div
                key={itemsCount}
                initial={{ scale: 1 }}
                animate={{ scale: [1, 1.3, 1], rotate: [0, -15, 15, 0] }}
                transition={{ duration: 0.4 }}
              >
                <ShoppingCart />
              </motion.div>
            }
            onClick={() => {
              triggerHaptic('light');
              navigate(`/checkout/${storeId}`);
            }}
            data-testid="checkout-button"
          >
            注文へ進む
          </Button>
        </Box>
      </Paper>

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
    </>
  );
}
