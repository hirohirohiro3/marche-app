import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Typography, Container, Grid, Card, CardMedia, CardContent, CardActions, Button, Box, CircularProgress, Alert, IconButton } from "@mui/material";
import { AddCircleOutline, RemoveCircleOutline } from '@mui/icons-material';
import { MenuItem, OptionGroup } from '../types';
import { useCartStore } from '../store/cartStore';
import { useMenu } from '../hooks/useMenu';
import OptionSelectModal from '../components/OptionSelectModal';

// Dummy data - will be replaced with data fetching later
const dummyOptionGroups: OptionGroup[] = [
  {
    id: '1',
    storeId: 'dummy-store-id',
    name: 'サイズ',
    selectionType: 'single',
    choices: [
      { id: 's', name: 'S', priceModifier: 0 },
      { id: 'm', name: 'M', priceModifier: 50 },
      { id: 'l', name: 'L', priceModifier: 100 },
    ],
  },
  {
    id: '2',
    storeId: 'dummy-store-id',
    name: 'トッピング',
    selectionType: 'multiple',
    choices: [
      { id: 'cheese', name: 'チーズ', priceModifier: 100 },
      { id: 'bacon', name: 'ベーコン', priceModifier: 150 },
    ],
  },
];

// Component to control item quantity in cart
const ItemQuantityControl = ({ item, onOpenOptions }: { item: MenuItem; onOpenOptions: (item: MenuItem) => void; }) => {
  const { items, addItem, updateQuantity } = useCartStore();
  const cartItem = items.find(ci => ci.item.id === item.id);
  const quantity = cartItem ? cartItem.quantity : 0;

  const hasOptions = item.optionGroupIds && item.optionGroupIds.length > 0;

  if (quantity === 0) {
    return (
      <Button
        variant="contained"
        onClick={() => hasOptions ? onOpenOptions(item) : addItem(item)}
        fullWidth
        data-testid={`add-to-cart-button-${item.id}`}
      >
        {hasOptions ? 'オプションを選択' : 'カートに追加'}
      </Button>
    );
  }

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
      <IconButton
        onClick={() => updateQuantity(item.id, quantity - 1)}
        color="primary"
        data-testid={`remove-one-button-${item.id}`}
      >
        <RemoveCircleOutline />
      </IconButton>
      <Typography variant="h6" data-testid={`quantity-display-${item.id}`}>{quantity}</Typography>
      <IconButton
        onClick={() => updateQuantity(item.id, quantity + 1)}
        color="primary"
        data-testid={`add-one-button-${item.id}`}
      >
        <AddCircleOutline />
      </IconButton>
    </Box>
  );
};


export default function MenuListPage() {
  const { storeId } = useParams<{ storeId: string }>();
  const { menus, loading, error } = useMenu(storeId);
  const [isOptionModalOpen, setIsOptionModalOpen] = useState(false);
  const [selectedMenuItem, setSelectedMenuItem] = useState<MenuItem | null>(null);

  const handleOpenOptions = (item: MenuItem) => {
    setSelectedMenuItem(item);
    setIsOptionModalOpen(true);
  };

  const handleCloseOptions = () => {
    setIsOptionModalOpen(false);
    setSelectedMenuItem(null);
  };

  const menusByCategory = menus
    .filter(menu => !menu.isSoldOut)
    .reduce((acc, menu) => {
      const { category } = menu;
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(menu);
      return acc;
    }, {} as Record<string, MenuItem[]>);


  if (loading) {
    return <Container sx={{ py: 4, textAlign: 'center' }}><CircularProgress /></Container>;
  }

  if (error) {
    return <Container sx={{ py: 4 }}><Alert severity="error">{error}</Alert></Container>;
  }

  return (
    <Box sx={{ pb: 10 }}> {/* Add padding-bottom for the cart summary */}
      <Container sx={{ py: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          メニュー
        </Typography>
        {Object.keys(menusByCategory).sort().map(category => (
          <div key={category}>
            <Typography variant="h5" component="h2" sx={{ mt: 4, mb: 2 }}>
              {category}
            </Typography>
            <Grid container spacing={4}>
              {menusByCategory[category].map(menu => (
                <Grid item key={menu.id} xs={12} sm={6} md={4}>
                  <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                    <CardMedia
                      component="img"
                      height="140"
                      image={menu.imageUrl || 'https://via.placeholder.com/150'}
                      alt={menu.name}
                    />
                    <CardContent sx={{ flexGrow: 1 }}>
                      <Typography gutterBottom variant="h6" component="h3">
                        {menu.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {menu.description}
                      </Typography>
                      <Typography variant="h6" component="p" sx={{ mt: 1 }}>
                        ¥{menu.price.toLocaleString()}
                      </Typography>
                    </CardContent>
                    <CardActions>
                      <ItemQuantityControl item={menu} onOpenOptions={handleOpenOptions} />
                    </CardActions>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </div>
        ))}
      </Container>
      <OptionSelectModal
        open={isOptionModalOpen}
        onClose={handleCloseOptions}
        menuItem={selectedMenuItem}
        optionGroups={dummyOptionGroups.filter(
          (og) => selectedMenuItem?.optionGroupIds?.includes(og.id)
        )}
      />
    </Box>
  );
}
