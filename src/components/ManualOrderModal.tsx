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
import Close from '@mui/icons-material/Close';
import {
  collection,
  serverTimestamp,
  runTransaction,
  doc,
} from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../hooks/useAuth';
import { MenuItem, SelectedOptionInfo } from '../types';
import AddToCartModal from './AddToCartModal';
import { useOptionGroups } from '../hooks/useOptionGroups';

type CartItem = {
  id: string;
  name: string;
  quantity: number;
  price: number;
  selectedOptions?: SelectedOptionInfo[];
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
  const { user } = useAuth();
  const { optionGroups } = useOptionGroups(user?.uid);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAddToCartModalOpen, setIsAddToCartModalOpen] = useState(false);
  const [selectedMenuItem, setSelectedMenuItem] = useState<MenuItem | null>(null);

  const totalPrice = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }, [cart]);


  const handleOpenAddToCartModal = (item: MenuItem) => {
    setSelectedMenuItem(item);
    setIsAddToCartModalOpen(true);
  };

  const handleCloseAddToCartModal = () => {
    setIsAddToCartModalOpen(false);
    setSelectedMenuItem(null);
  };

  const handleManualAddToCart = (
    menuItem: MenuItem,
    quantity: number,
    totalPrice: number,
    selectedOptions?: any
  ) => {
    // Convert SelectedOptions to SelectedOptionInfo[]
    const optionInfoArray: SelectedOptionInfo[] = [];
    if (selectedOptions) {
      Object.values(selectedOptions).flat().forEach((choice: any) => {
        optionInfoArray.push({
          groupName: '', // TODO: Add group name
          choiceName: choice.name,
          priceModifier: choice.priceModifier,
        });
      });
    }

    // Add to manual order cart
    setCart((prevCart) => [
      ...prevCart,
      {
        id: `${menuItem.id}-${Date.now()}`,
        name: menuItem.name,
        price: totalPrice / quantity, // Price per item including options
        quantity,
        selectedOptions: optionInfoArray.length > 0 ? optionInfoArray : undefined,
      },
    ]);
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
    if (cart.length === 0 || !user) return;
    setIsLoading(true);

    try {
      await runTransaction(db, async (transaction) => {
        // 1. Perform ALL reads first
        const settingsRef = doc(db, 'system_settings', 'orderNumbers');
        const storeRef = doc(db, 'stores', user.uid);

        // Get settings and store info
        const settingsDoc = await transaction.get(settingsRef);
        const storeDoc = await transaction.get(storeRef);

        // Get all relevant menu items for stock checking
        const menuReads = [];
        const menuItemsToUpdate: { ref: any, newStock: number, isSoldOut?: boolean }[] = [];

        for (const cartItem of cart) {
          const menuItem = menuItems.find((mi) => mi.id === cartItem.id);
          if (menuItem && menuItem.manageStock) {
            const menuRef = doc(db, 'menus', menuItem.id);
            menuReads.push({ cartItem, menuItem, menuRef });
          }
        }

        // Execute menu reads
        const menuDocs = await Promise.all(menuReads.map(item => transaction.get(item.menuRef)));

        // 2. Perform logic and calculations

        // Calculate new order number
        let newOrderNumber;
        if (settingsDoc.exists()) {
          newOrderNumber = settingsDoc.data().nextManualOrderNumber;
        } else {
          newOrderNumber = 1;
        }

        // Get event name
        const eventName = storeDoc.exists() ? storeDoc.data().currentEventName : null;

        // Check stock and prepare updates
        for (let i = 0; i < menuReads.length; i++) {
          const { cartItem, menuItem, menuRef } = menuReads[i];
          const menuDoc = menuDocs[i];

          if (!menuDoc.exists()) {
            throw new Error(`Menu item ${menuItem.name} not found!`);
          }
          const currentStock = menuDoc.data().stock;
          if (currentStock < cartItem.quantity) {
            throw new Error(`Insufficient stock for ${menuItem.name}.`);
          }
          const newStock = currentStock - cartItem.quantity;

          const updateData: { ref: any, newStock: number, isSoldOut?: boolean } = { ref: menuRef, newStock };
          if (newStock <= 0) {
            updateData.isSoldOut = true;
          }
          menuItemsToUpdate.push(updateData);
        }

        // 3. Perform ALL writes

        // Update order number settings
        if (settingsDoc.exists()) {
          transaction.update(settingsRef, { nextManualOrderNumber: newOrderNumber + 1 });
        } else {
          transaction.set(settingsRef, {
            nextManualOrderNumber: newOrderNumber + 1,
            nextQrOrderNumber: 101,
          });
        }

        // Update menu stocks
        for (const update of menuItemsToUpdate) {
          transaction.update(update.ref, { stock: update.newStock, isSoldOut: update.isSoldOut });
        }

        // Create new order
        const newOrderRef = doc(collection(db, 'orders'));
        const orderItems = cart.map(({ id, selectedOptions, ...rest }) => ({
          ...rest,
          selectedOptions: selectedOptions || [],
        }));

        transaction.set(newOrderRef, {
          orderNumber: newOrderNumber,
          items: orderItems,
          totalPrice: totalPrice,
          status: 'paid',
          orderType: 'manual',
          createdAt: serverTimestamp(),
          storeId: user.uid,
          eventName: eventName,
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
    <>
      <Modal open={open} onClose={handleClose}>
        <Box sx={style} data-testid="manual-order-modal">
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              mb: 2,
            }}
          >
            <Typography variant="h6">手動注文 (POS)</Typography>
            <IconButton onClick={handleClose} data-testid="close-modal-button">
              <Close />
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
              <Typography variant="h6" gutterBottom>メニュー</Typography>
              <Grid container spacing={1}>
                {menuItems.map((item) => (
                  <Grid item xs={6} sm={4} md={3} key={item.id}>
                    <Button
                      variant="contained"
                      onClick={() => handleOpenAddToCartModal(item)}
                      sx={{ width: '100%', height: '100px', textTransform: 'none' }}
                      data-testid={`menu-item-${item.id}`}
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
              <Paper sx={{ p: 2, flexGrow: 1, overflowY: 'auto' }} data-testid="cart-section">
                <Typography variant="h6" gutterBottom>
                  現在の注文
                </Typography>
                {cart.length === 0 ? (
                  <Typography>商品が追加されていません。</Typography>
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
                      data-testid={`cart-item-${item.id}`}
                    >
                      <Typography>
                        {item.name} x {item.quantity}
                      </Typography>
                      <Button
                        size="small"
                        variant="outlined"
                        color="error"
                        onClick={() => handleRemoveFromCart(item.id)}
                        data-testid={`remove-from-cart-${item.id}`}
                      >
                        削除
                      </Button>
                    </Box>
                  ))
                )}
              </Paper>
              <Box sx={{ mt: 'auto', pt: 2 }}>
                <Typography variant="h5" align="right" gutterBottom data-testid="total-price">
                  合計: ¥{totalPrice}
                </Typography>
                <Button
                  variant="contained"
                  color="primary"
                  fullWidth
                  onClick={handleCreateOrder}
                  disabled={cart.length === 0 || isLoading}
                  data-testid="create-order-button"
                >
                  {isLoading ? (
                    <CircularProgress size={24} color="inherit" />
                  ) : (
                    '支払い済みとして注文を作成'
                  )}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Box>
      </Modal>
      <AddToCartModal
        open={isAddToCartModalOpen}
        onClose={handleCloseAddToCartModal}
        menuItem={selectedMenuItem}
        optionGroups={optionGroups.filter(
          (og) => selectedMenuItem?.optionGroupIds?.includes(og.id)
        )}
        onAddToCart={handleManualAddToCart}
      />
    </>
  );
}
