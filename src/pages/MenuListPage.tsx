import { useState, useCallback, memo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useHaptic } from '../hooks/useHaptic';
import { useParams } from 'react-router-dom';
import { Typography, Container, Grid, Card, CardMedia, CardContent, CardActions, Box, Alert, Skeleton, Tabs, Tab, CardActionArea } from "@mui/material";
import { LocalCafe, Restaurant, Cake, LocalBar, Category } from '@mui/icons-material';
import { MenuItem } from '../types';
import { useMenu } from '../hooks/useMenu';
import { useOptionGroups } from '../hooks/useOptionGroups';
import AddToCartModal from '../components/AddToCartModal';
import { AnimatedButton } from '../components/ui/AnimatedButton';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';

// Memoized MenuCard Component to prevent unnecessary re-renders
const MenuCard = memo(({ menu, onOpenModal }: { menu: MenuItem; onOpenModal: (item: MenuItem) => void }) => {
  // Treat as sold out if manually marked OR if stock is managed and is 0
  const isSoldOut = menu.isSoldOut || (menu.manageStock && menu.stock === 0);

  return (
    <Grid item xs={12} sm={6} md={4}>
      <Card sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative'
      }}>
        {isSoldOut && (
          <Box sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 2,
            backgroundColor: 'error.main',
            color: 'white',
            padding: '8px 16px',
            borderRadius: 1,
            fontWeight: 'bold',
            fontSize: '1.2rem'
          }}>
            SOLD OUT
          </Box>
        )}
        <CardActionArea
          onClick={() => !isSoldOut && onOpenModal(menu)}
          disabled={isSoldOut}
          sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'flex-start' }}
        >
          <CardMedia
            component="img"
            height="140"
            image={menu.imageUrl || 'https://via.placeholder.com/150'}
            alt={menu.name}
            sx={{
              opacity: isSoldOut ? 0.5 : 1,
              transition: 'opacity 0.3s ease',
              width: '100%'
            }}
          />
          <CardContent sx={{
            flexGrow: 1,
            width: '100%',
            opacity: isSoldOut ? 0.5 : 1,
            transition: 'opacity 0.3s ease'
          }}>
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
        </CardActionArea>
        <CardActions>
          <AnimatedButton
            variant="contained"
            onClick={() => onOpenModal(menu)}
            fullWidth
            disabled={isSoldOut}
            data-testid={`add-to-cart-button-${menu.id}`}
            sx={{
              '&.Mui-disabled': {
                color: 'black',
                backgroundColor: 'action.disabledBackground'
              }
            }}
          >
            {isSoldOut ? '売り切れ' : 'カートに追加'}
          </AnimatedButton>
        </CardActions>
      </Card>
    </Grid>
  );
});

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
  const { triggerHaptic } = useHaptic();

  // Check for invalid storeId
  if (!storeId || storeId === 'undefined' || storeId === 'null') {
    return (
      <Container sx={{ py: 4 }}>
        <Alert severity="error">
          <Typography variant="h6">店舗が見つかりません</Typography>
          <Typography variant="body1">
            URLが正しくありません。管理画面から再度「顧客画面を確認」ボタンを押してください。
          </Typography>
        </Alert>
      </Container>
    );
  }

  const { menus, loading: menuLoading, error: menuError } = useMenu(storeId);
  const { optionGroups, loading: optionsLoading, error: optionsError } = useOptionGroups(storeId);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedMenuItem, setSelectedMenuItem] = useState<MenuItem | null>(null);
  const [activeTab, setActiveTab] = useState(0);

  const [categoryIcons, setCategoryIcons] = useState<Record<string, string>>({});

  // Fetch store settings for category icons
  useEffect(() => {
    if (!storeId) return;
    const fetchSettings = async () => {
      try {
        const storeRef = doc(db, 'stores', storeId);
        const storeDoc = await getDoc(storeRef);
        if (storeDoc.exists()) {
          const data = storeDoc.data();
          if (data.categoryIcons) {
            setCategoryIcons(data.categoryIcons);
          }
        }
      } catch (error) {
        console.error("Error fetching store settings:", error);
      }
    };
    fetchSettings();
  }, [storeId]);

  // Icon mapping helper
  const getCategoryIcon = (categoryName: string) => {
    // 1. Check if a custom icon is set
    if (categoryIcons[categoryName]) {
      return <span style={{ fontSize: '1.5rem', lineHeight: 1 }}>{categoryIcons[categoryName]}</span>;
    }

    // 2. Fallback to default logic
    if (categoryName.includes('ドリンク') || categoryName.includes('Coffee') || categoryName.includes('Drink')) return <LocalCafe />;
    if (categoryName.includes('フード') || categoryName.includes('Food') || categoryName.includes('Meal')) return <Restaurant />;
    if (categoryName.includes('デザート') || categoryName.includes('Sweets') || categoryName.includes('Cake')) return <Cake />;
    if (categoryName.includes('アルコール') || categoryName.includes('Alcohol')) return <LocalBar />;
    return <Category />;
  };

  // Scroll to category function
  const scrollToCategory = (index: number) => {
    setActiveTab(index);
    const element = document.getElementById(`category-${index}`);
    if (element) {
      const headerOffset = 110; // Adjust for sticky header + tabs
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
      window.scrollTo({ top: offsetPosition, behavior: "smooth" });
    }
  };

  const menusByCategory = menus.reduce((acc, menu) => {
    const { category } = menu;
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(menu);
    return acc;
  }, {} as Record<string, MenuItem[]>);

  // Sort items within each category: available items first, sold-out items last
  Object.keys(menusByCategory).forEach(category => {
    menusByCategory[category].sort((a, b) => {
      const aIsSoldOut = a.isSoldOut || (a.manageStock && a.stock === 0);
      const bIsSoldOut = b.isSoldOut || (b.manageStock && b.stock === 0);

      if (aIsSoldOut === bIsSoldOut) return 0; // Keep original order if both same status
      return aIsSoldOut ? 1 : -1; // Sold out items go to the end
    });
  });

  // Track scroll position to update active tab
  useEffect(() => {
    const handleScroll = () => {
      const categories = Object.keys(menusByCategory).sort();
      const headerOffset = 120;

      for (let i = 0; i < categories.length; i++) {
        const element = document.getElementById(`category-${i}`);
        if (element) {
          const rect = element.getBoundingClientRect();
          // If the top of the element is near the top of the viewport (accounting for header)
          if (rect.top <= headerOffset + 20 && rect.bottom > headerOffset) {
            setActiveTab(i);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [menusByCategory]);

  const loading = menuLoading || optionsLoading;
  const error = menuError || optionsError;

  // Memoized callback to ensure stable identity for MenuCard props
  const handleOpenModal = useCallback((item: MenuItem) => {
    triggerHaptic('light');
    setSelectedMenuItem(item);
    setIsModalOpen(true);
  }, [triggerHaptic]);

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedMenuItem(null);
  };




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
    <Container sx={{ py: 2, pb: 8 }}>
      {/* Category Tabs */}
      <Box sx={{
        position: 'sticky',
        top: 0,
        zIndex: 1100,
        bgcolor: 'background.paper',
        mx: -2, // Extend to edges on mobile
        px: 2,
        mb: 2,
        borderBottom: 1,
        borderColor: 'divider'
      }}>
        <Tabs
          value={activeTab}
          onChange={(_, newValue) => {
            triggerHaptic('light');
            scrollToCategory(newValue);
          }}
          variant="scrollable"
          scrollButtons="auto"
          allowScrollButtonsMobile
          TabIndicatorProps={{ sx: { display: 'none' } }}
          sx={{
            '& .MuiTab-root': {
              minWidth: 'auto',
              px: 2,
              fontWeight: 'bold',
              overflow: 'visible' // Allow magic line to be visible
            }
          }}
        >
          {Object.keys(menusByCategory).sort().map((category, index) => (
            <Tab
              key={category}
              label={
                <Box sx={{ position: 'relative', zIndex: 1 }}>
                  {category}
                  {activeTab === index && (
                    <motion.div
                      layoutId="activeTab"
                      style={{
                        position: 'absolute',
                        bottom: -8,
                        left: -4,
                        right: -4,
                        height: 3,
                        backgroundColor: '#1976d2', // primary.main
                        borderRadius: 3,
                        zIndex: 0
                      }}
                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                </Box>
              }
            />
          ))}
        </Tabs>
      </Box>

      {Object.keys(menusByCategory).sort().map((category, index) => (
        <Box key={category} id={`category-${index}`} sx={{ mb: 6 }}>
          {/* Sticky Category Header */}
          <Box sx={{
            position: 'sticky',
            top: 48, // Height of Tabs (approx)
            zIndex: 1099,
            bgcolor: 'background.default',
            py: 1.5,
            mb: 2,
            borderBottom: 1,
            borderColor: 'divider',
            display: 'flex',
            alignItems: 'center',
            gap: 1.5
          }}>
            <Box sx={{ color: 'primary.main', display: 'flex' }}>
              {getCategoryIcon(category)}
            </Box>
            <Typography variant="h5" component="h2" sx={{ fontWeight: 'bold' }}>
              {category}
            </Typography>
          </Box>

          <Grid container spacing={2}>
            {menusByCategory[category].map((menu) => (
              <MenuCard
                key={menu.id}
                menu={menu}
                onOpenModal={handleOpenModal}
              />
            ))}
          </Grid>
        </Box>
      ))}

      <AddToCartModal
        open={isModalOpen}
        onClose={handleCloseModal}
        menuItem={selectedMenuItem}
        optionGroups={optionGroups.filter(
          (og) => selectedMenuItem?.optionGroupIds?.includes(og.id)
        )}
      />
    </Container>
  );
}
