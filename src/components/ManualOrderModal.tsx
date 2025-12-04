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
  FormControlLabel,
  Switch,
  Divider,
} from '@mui/material';
import Close from '@mui/icons-material/Close';
import {
  collection,
  serverTimestamp,
  runTransaction,
  doc,
  DocumentReference,
} from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../hooks/useAuth';
import { MenuItem, SelectedOptionInfo } from '../types';
import AddToCartModal from './AddToCartModal';
import { useOptionGroups } from '../hooks/useOptionGroups';
import { COLLECTIONS } from '../constants';
import { SelectedOptions } from '../store/cartStore';

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
  lowStockThreshold?: number;
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
  lowStockThreshold = 5,
}: ManualOrderModalProps) {
  const { user } = useAuth();
  const { optionGroups } = useOptionGroups(user?.uid);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAddToCartModalOpen, setIsAddToCartModalOpen] = useState(false);
  const [selectedMenuItem, setSelectedMenuItem] = useState<MenuItem | null>(null);
  const [groupSoldOut, setGroupSoldOut] = useState(false);

  const totalPrice = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }, [cart]);

  // Group menu items by sold-out status
  const groupedMenuItems = useMemo(() => {
    const available = menuItems.filter(item => !item.isSoldOut);
    const soldOut = menuItems.filter(item => item.isSoldOut);
    return { available, soldOut };
  }, [menuItems]);

  // Group available items by category
  const categorizedItems = useMemo(() => {
    const categories = new Map<string, MenuItem[]>();
    groupedMenuItems.available.forEach(item => {
      const category = item.category || 'その他';
      if (!categories.has(category)) {
        categories.set(category, []);
      }
      categories.get(category)!.push(item);
    });
    return Array.from(categories.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [groupedMenuItems.available]);


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
    selectedOptions?: SelectedOptions
  ) => {
    // Convert SelectedOptions to SelectedOptionInfo[]
    const optionInfoArray: SelectedOptionInfo[] = [];
    if (selectedOptions) {
      Object.entries(selectedOptions).forEach(([groupId, selection]) => {
        const group = optionGroups.find(g => g.id === groupId);
        if (!group) return;

        if (Array.isArray(selection)) {
          selection.forEach((choice) => {
            optionInfoArray.push({
              groupName: group.name,
              choiceName: choice.name,
              priceModifier: choice.priceModifier,
            });
          });
        } else {
          optionInfoArray.push({
            groupName: group.name,
            choiceName: selection.name,
            priceModifier: selection.priceModifier,
          });
        }
      });
    }

    // Add to manual order cart
    setCart((prevCart) => [
      ...prevCart,
      {
        id: `${menuItem.id}-${Date.now()}-${Math.random()}`,
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
        const settingsRef = doc(db, COLLECTIONS.SYSTEM_SETTINGS, 'orderNumbers');
        const storeRef = doc(db, COLLECTIONS.STORES, user.uid);

        // Get settings and store info
        const settingsDoc = await transaction.get(settingsRef);
        const storeDoc = await transaction.get(storeRef);

        // Get all relevant menu items for stock checking
        const menuReads: { cartItem: CartItem; menuItem: MenuItem; menuRef: DocumentReference }[] = [];
        const menuItemsToUpdate: { ref: DocumentReference; newStock: number; isSoldOut?: boolean }[] = [];

        for (const cartItem of cart) {
          // Extract original menu ID from cart item ID (format: menuId-timestamp)
          const originalMenuId = cartItem.id.split('-')[0];
          const menuItem = menuItems.find((mi) => mi.id === originalMenuId);

          if (menuItem && menuItem.manageStock) {
            const menuRef = doc(db, COLLECTIONS.MENUS, menuItem.id);
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

          const updateData: { ref: DocumentReference; newStock: number; isSoldOut?: boolean } = { ref: menuRef, newStock };
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
        const newOrderRef = doc(collection(db, COLLECTIONS.ORDERS));
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
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">メニュー</Typography>
                <FormControlLabel
                  control={
                    <Switch
                      checked={groupSoldOut}
                      onChange={(e) => setGroupSoldOut(e.target.checked)}
                      size="small"
                    />
                  }
                  label="売り切れを表示"
                  sx={{ m: 0 }}
                />
              </Box>

              {/* Available Items - Grouped by Category */}
              {categorizedItems.map(([category, items], categoryIndex) => (
                <Box key={category}>
                  {categoryIndex > 0 && <Divider sx={{ my: 2 }} />}
                  <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1, fontWeight: 'bold' }}>
                    {category}
                  </Typography>
                  <Grid container spacing={1}>
                    {items.map((item) => (
                      <Grid item xs={6} sm={4} md={3} key={item.id}>
                        <Box sx={{ position: 'relative', width: '100%' }}>
                          <Button
                            variant="contained"
                            onClick={() => handleOpenAddToCartModal(item)}
                            disabled={item.isSoldOut}
                            sx={{
                              width: '100%',
                              height: '100px',
                              textTransform: 'none',
                              position: 'relative',
                              color: item.isSoldOut ? '#000000 !important' : 'inherit',
                              '&.Mui-disabled': {
                                color: '#000000 !important',
                              },
                            }}
                            data-testid={`menu-item-${item.id}`}
                          >
                            {item.name}
                          </Button>
                          {item.isSoldOut && (
                            <Box
                              sx={{
                                position: 'absolute',
                                top: -8,
                                right: -8,
                                zIndex: 1,
                                backgroundColor: 'error.main',
                                color: 'white',
                                borderRadius: '50%',
                                width: 24,
                                height: 24,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '0.75rem',
                                fontWeight: 'bold',
                                boxShadow: 2,
                              }}
                            >
                              0
                            </Box>
                          )}
                          {item.manageStock && item.stock !== null && !item.isSoldOut && (
                            <Box
                              sx={{
                                position: 'absolute',
                                top: -8,
                                right: -8,
                                zIndex: 1,
                                backgroundColor:
                                  (item.stock || 0) <= lowStockThreshold
                                    ? 'error.main'
                                    : 'success.main',
                                color: 'white',
                                borderRadius: '50%',
                                width: 24,
                                height: 24,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '0.75rem',
                                fontWeight: 'bold',
                                boxShadow: 2,
                              }}
                            >
                              {item.stock}
                            </Box>
                          )}
                        </Box>
                      </Grid>
                    ))}
                  </Grid>
                </Box>
              ))}

              {/* Sold Out Items */}
              {groupSoldOut && groupedMenuItems.soldOut.length > 0 && (
                <>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1, fontWeight: 'bold' }}>
                    売り切れ ({groupedMenuItems.soldOut.length}件)
                  </Typography>
                  <Grid container spacing={1}>
                    {groupedMenuItems.soldOut.map((item) => (
                      <Grid item xs={6} sm={4} md={3} key={item.id}>
                        <Box sx={{ position: 'relative', width: '100%' }}>
                          <Button
                            variant="contained"
                            onClick={() => handleOpenAddToCartModal(item)}
                            disabled={item.isSoldOut}
                            sx={{
                              width: '100%',
                              height: '100px',
                              textTransform: 'none',
                              position: 'relative',
                              color: item.isSoldOut ? '#000000 !important' : 'inherit',
                              '&.Mui-disabled': {
                                color: '#000000 !important',
                              },
                            }}
                            data-testid={`menu-item-${item.id}`}
                          >
                            {item.name}
                          </Button>
                          {item.isSoldOut && (
                            <Box
                              sx={{
                                position: 'absolute',
                                top: -8,
                                right: -8,
                                zIndex: 1,
                                backgroundColor: 'error.main',
                                color: 'white',
                                borderRadius: '50%',
                                width: 24,
                                height: 24,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '0.75rem',
                                fontWeight: 'bold',
                                boxShadow: 2,
                              }}
                            >
                              0
                            </Box>
                          )}
                          {item.manageStock && item.stock !== null && !item.isSoldOut && (
                            <Box
                              sx={{
                                position: 'absolute',
                                top: -8,
                                right: -8,
                                zIndex: 1,
                                backgroundColor:
                                  (item.stock || 0) <= lowStockThreshold
                                    ? 'error.main'
                                    : 'success.main',
                                color: 'white',
                                borderRadius: '50%',
                                width: 24,
                                height: 24,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '0.75rem',
                                fontWeight: 'bold',
                                boxShadow: 2,
                              }}
                            >
                              {item.stock}
                            </Box>
                          )}
                        </Box>
                      </Grid>
                    ))}
                  </Grid>
                </>
              )}
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
