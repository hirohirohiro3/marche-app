import { useEffect, useState } from 'react';
import {
  Container,
  Grid,
  Typography,
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
import QrCodeIcon from '@mui/icons-material/QrCode';
import {
  collection,
  query,
  orderBy,
  getDocs,
  where,
} from 'firebase/firestore';
import { db } from '../../firebase';
import { MenuItem } from '../../types';
import { keyframes } from '@emotion/react';
import ManualOrderModal from '../../components/ManualOrderModal';
import QrCodeModal from '../../components/QrCodeModal';
import { useOrders } from '../../hooks/useOrders';
import { useAuth } from '../../hooks/useAuth';
import OrderColumn from '../../components/OrderColumn';

const flash = keyframes`
  0% { background-color: inherit; }
  50% { background-color: #ffc; }
  100% { background-color: inherit; }
`;

export default function DashboardPage() {
  const { user } = useAuth();
  const {
    isNewOrder,
    filterOrdersByStatus,
    updateOrderStatus,
    handleEndOfDay: processEndOfDay,
  } = useOrders(user?.uid);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  // Fetch menu items
  useEffect(() => {
    if (!user) return; // Wait for user to be authenticated

    const fetchMenuItems = async () => {
      const menuCollection = collection(db, 'menus');
      const q = query(
        menuCollection,
        where('storeId', '==', user.uid),
        orderBy('sortOrder')
      );
      const menuSnapshot = await getDocs(q);
      const menuList = menuSnapshot.docs.map(
        (doc) => ({ id: doc.id, ...doc.data() } as MenuItem)
      );
      setMenuItems(menuList);
    };
    fetchMenuItems();
  }, [user]);

  const handleConfirmEndOfDay = async () => {
    await processEndOfDay();
    setIsConfirmOpen(false);
  };


  return (
    <>
      <ManualOrderModal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        menuItems={menuItems}
      />
      <QrCodeModal
        open={isQrModalOpen}
        onClose={() => setIsQrModalOpen(false)}
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
          <Button onClick={() => setIsConfirmOpen(false)} data-testid="end-of-day-cancel-button">いいえ</Button>
          <Button onClick={handleConfirmEndOfDay} autoFocus data-testid="end-of-day-confirm-button">
            はい
          </Button>
        </DialogActions>
      </Dialog>
      <Container data-testid="dashboard-container" maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, gap: 2 }}>
          <Typography variant="h4" component="h1" sx={{ flexGrow: 1 }}>
            注文ダッシュボード
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddCircleOutlineIcon />}
            onClick={() => setIsModalOpen(true)}
            data-testid="manual-order-button"
          >
            手動注文
          </Button>
          <Button
            variant="contained"
            startIcon={<QrCodeIcon />}
            onClick={() => setIsQrModalOpen(true)}
            color="secondary"
            data-testid="qr-code-button"
          >
            QRコード表示
          </Button>
           <Button
            variant="outlined"
            color="error"
            startIcon={<PowerSettingsNewIcon />}
            onClick={() => setIsConfirmOpen(true)}
            data-testid="end-of-day-button"
          >
            営業終了
          </Button>
        </Box>
        <Grid container spacing={3}>
          <Grid item xs={12} md={4} data-testid="new-orders-column">
            <OrderColumn
              title="新規"
              orders={filterOrdersByStatus('new')}
              onUpdateStatus={updateOrderStatus}
              animation={isNewOrder ? `${flash} 2s ease-out` : 'none'}
            />
          </Grid>
          <Grid item xs={12} md={4} data-testid="paid-orders-column">
            <OrderColumn
              title="支払い済み"
              orders={filterOrdersByStatus('paid')}
              onUpdateStatus={updateOrderStatus}
            />
          </Grid>
          <Grid item xs={12} md={4} data-testid="completed-orders-column">
            <OrderColumn
              title="完了済み"
              orders={filterOrdersByStatus('completed')}
              onUpdateStatus={updateOrderStatus}
            />
          </Grid>
        </Grid>
    </Container>
    </>
  );
}
