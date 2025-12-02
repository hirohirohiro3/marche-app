import { useState, useCallback, memo } from 'react';
import { useParams } from 'react-router-dom';
import { Typography, Container, Grid, Card, CardMedia, CardContent, CardActions, Button, Box, Alert, Skeleton } from "@mui/material";
import { MenuItem } from '../types';
import { useMenu } from '../hooks/useMenu';
import { useOptionGroups } from '../hooks/useOptionGroups';
import AddToCartModal from '../components/AddToCartModal';

// Memoized MenuCard Component to prevent unnecessary re-renders
const MenuCard = memo(({ menu, onOpenModal }: { menu: MenuItem; onOpenModal: (item: MenuItem) => void }) => (
  <Grid item xs={12} sm={6} md={4}>
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
          onClick={() => onOpenModal(menu)}
          fullWidth
          data-testid={`add-to-cart-button-${menu.id}`}
        >
          カートに追加
        </Button>
      </CardActions>
    </Card>
  </Grid>
));

// Skeleton Component for loading state
const MenuSkeleton = () => (
  <Grid item xs={12} sm={6} md={4}>
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Skeleton variant="rectangular" height={140} animation="wave" />
      <CardContent sx={{ flexGrow: 1 }}>
        <Skeleton variant="text" height={32} width="80%" animation="wave" />
        <Skeleton variant="text" height={20} width="100%" animation="wave" />
        <Skeleton variant="text" height={20} width="60%" animation="wave" />
        <Skeleton variant="text" height={32} width="40%" sx={{ mt: 1 }} animation="wave" />
      </CardContent>
      <CardActions>
        <Skeleton variant="rectangular" height={36} width="100%" animation="wave" />
      </CardActions>
    </Card>
  </Grid>
);

export default function MenuListPage() {
  const { storeId } = useParams<{ storeId: string }>();
  const { menus, loading: menuLoading, error: menuError } = useMenu(storeId);
  const { optionGroups, loading: optionsLoading, error: optionsError } = useOptionGroups(storeId);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedMenuItem, setSelectedMenuItem] = useState<MenuItem | null>(null);

  const loading = menuLoading || optionsLoading;
  const error = menuError || optionsError;

  // Memoized callback to ensure stable identity for MenuCard props
  const handleOpenModal = useCallback((item: MenuItem) => {
    setSelectedMenuItem(item);
    setIsModalOpen(true);
  }, []);

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
    return (
      <Container sx={{ py: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          <Skeleton width={200} />
        </Typography>
        <Typography variant="h5" component="h2" sx={{ mt: 4, mb: 2 }}>
          <Skeleton width={150} />
        </Typography>
        <Grid container spacing={4}>
          {[...Array(6)].map((_, index) => (
            <MenuSkeleton key={index} />
          ))}
        </Grid>
      </Container>
    );
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
                <MenuCard
                  key={menu.id}
                  menu={menu}
                  onOpenModal={handleOpenModal}
                />
              ))}
            </Grid>
          </div >
        ))
        }
      </Container >
      <AddToCartModal
        open={isModalOpen}
        onClose={handleCloseModal}
        menuItem={selectedMenuItem}
        optionGroups={optionGroups.filter(
          (og) => selectedMenuItem?.optionGroupIds?.includes(og.id)
        )}
      />
    </Box >
  );
}
