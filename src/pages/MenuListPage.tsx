import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Typography, Container, Grid, Card, CardMedia, CardContent, CardActions, Button, Box, CircularProgress, Alert } from "@mui/material";
import { MenuItem } from '../types';
import { useMenu } from '../hooks/useMenu';
import { useOptionGroups } from '../hooks/useOptionGroups';
import AddToCartModal from '../components/AddToCartModal';
import CartSummary from '../components/CartSummary';

export default function MenuListPage() {
  const { storeId } = useParams<{ storeId: string }>();
  const { menus, loading: menuLoading, error: menuError } = useMenu(storeId);
  const { optionGroups, loading: optionsLoading, error: optionsError } = useOptionGroups(storeId);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedMenuItem, setSelectedMenuItem] = useState<MenuItem | null>(null);

  const loading = menuLoading || optionsLoading;
  const error = menuError || optionsError;

  const handleOpenModal = (item: MenuItem) => {
    setSelectedMenuItem(item);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
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
                      <Button
                        variant="contained"
                        onClick={() => handleOpenModal(menu)}
                        fullWidth
                        data-testid={`add-to-cart-button-${menu.id}`}
                      >
                        カートに追加
                      </Button>
                    </CardActions>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </div>
        ))}
      </Container>
      <AddToCartModal
        open={isModalOpen}
        onClose={handleCloseModal}
        menuItem={selectedMenuItem}
        optionGroups={optionGroups.filter(
          (og) => selectedMenuItem?.optionGroupIds?.includes(og.id)
        )}
      />
      <CartSummary />
    </Box>
  );
}
