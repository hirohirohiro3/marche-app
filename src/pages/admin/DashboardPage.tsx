import { useEffect, useState, useRef } from 'react';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  CardActions,
  Button,
  Box,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from '@mui/material';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import PowerSettingsNewIcon from '@mui/icons-material/PowerSettingsNew';
import {
  collection,
  onSnapshot,
  query,
  orderBy,
  doc,
  updateDoc,
  getDocs,
  runTransaction,
} from 'firebase/firestore';
import { db } from '../../firebase';
import { Order, MenuItem } from '../../types';
import { keyframes } from '@emotion/react';
import ManualOrderModal from '../../components/ManualOrderModal';

const flash = keyframes`
  0% { background-color: inherit; }
  50% { background-color: #ffc; }
  100% { background-color: inherit; }
`;

export default function DashboardPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [isNewOrder, setIsNewOrder] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const prevNewOrderCount = useRef(0);

  useEffect(() => {
    // Note: A specific sound file is not required. A generic browser sound is sufficient.
    audioRef.current = new Audio(
      'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA'
    );
  }, []);

  // Fetch menu items
  useEffect(() => {
    const fetchMenuItems = async () => {
      const menuCollection = collection(db, 'menus');
      const menuSnapshot = await getDocs(query(menuCollection, orderBy('sortOrder')));
      const menuList = menuSnapshot.docs.map(
        (doc) => ({ id: doc.id, ...doc.data() } as MenuItem)
      );
      setMenuItems(menuList);
    };
    fetchMenuItems();
  }, []);

  useEffect(() => {
    const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const ordersData = snapshot.docs.map(
        (doc) => ({ id: doc.id, ...doc.data() } as Order)
      );
      setOrders(ordersData);

      const newOrderCount = ordersData.filter(o => o.status === 'new').length;
      if (newOrderCount > prevNewOrderCount.current) {
        setIsNewOrder(true);
        audioRef.current?.play();
        setTimeout(() => setIsNewOrder(false), 2000); // Animation duration
      }
      prevNewOrderCount.current = newOrderCount;
    });
    return () => unsubscribe();
  }, []);

  const filterOrdersByStatus = (status: Order['status']) =>
    orders.filter((order) => order.status === status);

  const handleUpdateStatus = async (
    orderId: string,
    newStatus: Order['status']
  ) => {
    const orderRef = doc(db, 'orders', orderId);
    await updateDoc(orderRef, { status: newStatus });
  };

  const handleEndOfDay = async () => {
    setIsConfirmOpen(false);
    const settingsRef = doc(db, 'system_settings', 'single_doc');
    try {
      await runTransaction(db, async (transaction) => {
        transaction.update(settingsRef, {
          nextQrOrderNumber: 101,
          nextManualOrderNumber: 1,
        });
      });
      // Optionally, add a success notification
    } catch (error) {
      console.error('Failed to reset order numbers:', error);
      // Optionally, add an error notification
    }
  };


  return (
    <>
      <ManualOrderModal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        menuItems={menuItems}
      />
       <Dialog
        open={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
      >
        <DialogTitle>営業を終了しますか？</DialogTitle>
        <DialogContent>
          <DialogContentText>
            全ての注文番号が初期値にリセットされます。この操作は元に戻せません。
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsConfirmOpen(false)}>いいえ</Button>
          <Button onClick={handleEndOfDay} autoFocus>
            はい
          </Button>
        </DialogActions>
      </Dialog>
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, gap: 2 }}>
          <Typography variant="h4" component="h1" sx={{ flexGrow: 1 }}>
            Order Dashboard
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddCircleOutlineIcon />}
            onClick={() => setIsModalOpen(true)}
          >
            Manual Order
          </Button>
           <Button
            variant="outlined"
            color="error"
            startIcon={<PowerSettingsNewIcon />}
            onClick={() => setIsConfirmOpen(true)}
          >
            End of Day
          </Button>
        </Box>
        <Grid container spacing={3}>
          {/* New Orders Column */}
          <Grid item xs={12} md={4}>
          <Paper
            sx={{
              p: 2,
              animation: isNewOrder ? `${flash} 2s ease-out` : 'none',
            }}
          >
            <Typography variant="h6">New</Typography>
            {filterOrdersByStatus('new').map((order) => (
              <Card key={order.id} sx={{ mt: 2 }}>
                <CardContent>
                  <Typography variant="h5">#{order.orderNumber}</Typography>
                  {order.items.map((item, index) => (
                    <Typography key={index}>
                      {item.name} x {item.quantity}
                    </Typography>
                  ))}
                  <Box sx={{ mt: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                      Total: ¥{order.totalPrice}
                    </Typography>
                  </Box>
                </CardContent>
                <CardActions>
                  <Button
                    size="small"
                    onClick={() => handleUpdateStatus(order.id, 'paid')}
                  >
                    Mark as Paid
                  </Button>
                  <Button
                    size="small"
                    color="error"
                    onClick={() => handleUpdateStatus(order.id, 'cancelled')}
                  >
                    Cancel
                  </Button>
                </CardActions>
              </Card>
            ))}
          </Paper>
        </Grid>
        {/* Paid Orders Column */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6">Paid</Typography>
            {filterOrdersByStatus('paid').map((order) => (
              <Card key={order.id} sx={{ mt: 2 }}>
                <CardContent>
                  <Typography variant="h5">#{order.orderNumber}</Typography>
                  {order.items.map((item, index) => (
                    <Typography key={index}>
                      {item.name} x {item.quantity}
                    </Typography>
                  ))}
                   <Typography variant="body2" color="text.secondary">
                    Total: ¥{order.totalPrice}
                  </Typography>
                </CardContent>
                <CardActions>
                  <Button
                    size="small"
                    onClick={() => handleUpdateStatus(order.id, 'completed')}
                  >
                    Mark as Completed
                  </Button>
                   <Button
                    size="small"
                    color="error"
                    onClick={() => handleUpdateStatus(order.id, 'cancelled')}
                  >
                    Cancel
                  </Button>
                </CardActions>
              </Card>
            ))}
          </Paper>
        </Grid>
        {/* Completed Orders Column */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6">Completed</Typography>
            {filterOrdersByStatus('completed').map((order) => (
              <Card key={order.id} sx={{ mt: 2 }}>
                <CardContent>
                  <Typography variant="h5">#{order.orderNumber}</Typography>
                  {order.items.map((item, index) => (
                    <Typography key={index}>
                      {item.name} x {item.quantity}
                    </Typography>
                  ))}
                   <Typography variant="body2" color="text.secondary">
                    Total: ¥{order.totalPrice}
                  </Typography>
                </CardContent>
              </Card>
            ))}
          </Paper>
        </Grid>
      </Grid>
    </Container>
    </>
  );
}
