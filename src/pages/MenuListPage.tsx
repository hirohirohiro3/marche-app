import { useState, useEffect } from 'react';
import { Typography, Container, Grid, Card, CardMedia, CardContent, CardActions, Button, Box, CircularProgress, Alert, IconButton } from "@mui/material";
import { AddCircleOutline, RemoveCircleOutline } from '@mui/icons-material';
import { collection, query, where, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";
import { MenuItem } from '../types';
import { useCartStore } from '../store/cartStore';

// Component to control item quantity in cart
const ItemQuantityControl = ({ item }: { item: MenuItem }) => {
  const { items, addItem, updateQuantity } = useCartStore();
  const cartItem = items.find(ci => ci.item.id === item.id);
  const quantity = cartItem ? cartItem.quantity : 0;

  if (quantity === 0) {
    return (
      <Button variant="contained" onClick={() => addItem(item)} fullWidth>
        カートに追加
      </Button>
    );
  }

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
      <IconButton onClick={() => updateQuantity(item.id, quantity - 1)} color="primary">
        <RemoveCircleOutline />
      </IconButton>
      <Typography variant="h6">{quantity}</Typography>
      <IconButton onClick={() => updateQuantity(item.id, quantity + 1)} color="primary">
        <AddCircleOutline />
      </IconButton>
    </Box>
  );
};


export default function MenuListPage() {
  const [menusByCategory, setMenusByCategory] = useState<Record<string, MenuItem[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const q = query(
      collection(db, "menus"),
      where("isSoldOut", "==", false),
      orderBy("sortOrder", "asc")
    );

    const unsubscribe = onSnapshot(q,
      (querySnapshot) => {
        const menusData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as MenuItem));

        const grouped = menusData.reduce((acc, menu) => {
          const { category } = menu;
          if (!acc[category]) {
            acc[category] = [];
          }
          acc[category].push(menu);
          return acc;
        }, {} as Record<string, MenuItem[]>);

        setMenusByCategory(grouped);
        setLoading(false);
      },
      (err) => {
        console.error(err);
        setError("メニューの読み込みに失敗しました。");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

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
                      <ItemQuantityControl item={menu} />
                    </CardActions>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </div>
        ))}
      </Container>
    </Box>
  );
}
