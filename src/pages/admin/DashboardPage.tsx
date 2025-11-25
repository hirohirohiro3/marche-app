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
  TextField,
  Paper,
  Snackbar,
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
  doc,
  setDoc,
  onSnapshot,
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
  const [eventName, setEventName] = useState('');
  const [isSavingEventName, setIsSavingEventName] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isStartEventDialogOpen, setIsStartEventDialogOpen] = useState(false);
  const [newEventName, setNewEventName] = useState('');

  // Fetch menu items
  useEffect(() => {
    if (!user) return;

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

  // Fetch current event name
  useEffect(() => {
    if (!user) return;
    const fetchEventName = async () => {
      const storeRef = doc(db, 'stores', user.uid);
      const unsubscribe = onSnapshot(storeRef, (doc) => {
        if (doc.exists()) {
          setEventName(doc.data().currentEventName || '');
        }
      });
      return () => unsubscribe();
    };
    fetchEventName();
  }, [user]);

  const handleStartEvent = async () => {
    if (!user || !newEventName.trim()) return;
    setIsSavingEventName(true);
    try {
      await processEndOfDay();
      const storeRef = doc(db, 'stores', user.uid);
      await setDoc(storeRef, { currentEventName: newEventName }, { merge: true });
      setEventName(newEventName);
      setIsStartEventDialogOpen(false);
      setNewEventName('');
      setSaveSuccess(true);
    } catch (error) {
      console.error("Error starting event:", error);
    } finally {
      setIsSavingEventName(false);
    }
  };

  const handleEndEvent = async () => {
    if (!user) return;
    try {
      await processEndOfDay();
      const storeRef = doc(db, 'stores', user.uid);
      await setDoc(storeRef, { currentEventName: '' }, { merge: true });
      setEventName('');
      setIsConfirmOpen(false);
    } catch (error) {
      console.error("Error ending event:", error);
    }
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

      {/* Start Event Dialog */}
      <Dialog open={isStartEventDialogOpen} onClose={() => setIsStartEventDialogOpen(false)}>
        <DialogTitle>イベントを開始</DialogTitle>
        <DialogContent>
          <DialogContentText>
            新しいイベントを開始します。
            <br />
            これまでの注文はアーカイブされ、注文番号は1番にリセットされます。
          </DialogContentText>
          <TextField
            autoFocus
            margin="dense"
            label="イベント名"
            fullWidth
            variant="outlined"
            value={newEventName}
            onChange={(e) => setNewEventName(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsStartEventDialogOpen(false)}>キャンセル</Button>
          <Button onClick={handleStartEvent} variant="contained" disabled={!newEventName.trim() || isSavingEventName}>
            開始する
          </Button>
        </DialogActions>
      </Dialog>

      {/* End Event Dialog */}
      <Dialog
        open={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
      >
        <DialogTitle>イベントを終了しますか？</DialogTitle>
        <DialogContent>
          <DialogContentText>
            現在のイベント「{eventName}」を終了します。
            <br />
            現在の注文はアーカイブされ、注文番号はリセットされます。
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsConfirmOpen(false)} data-testid="end-of-day-cancel-button">キャンセル</Button>
          <Button onClick={handleEndEvent} color="error" autoFocus data-testid="end-of-day-confirm-button">
            終了する
          </Button>
        </DialogActions>
      </Dialog>

      <Container data-testid="dashboard-container" maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, gap: 2, flexWrap: 'wrap' }}>
          <Typography variant="h4" component="h1" sx={{ flexGrow: 1 }}>
            注文ダッシュボード
          </Typography>

          {/* Event Management UI */}
          {eventName ? (
            <Paper
              elevation={0}
              variant="outlined"
              sx={{
                p: 1,
                px: 2,
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                bgcolor: 'primary.50',
                borderColor: 'primary.main',
              }}
            >
              <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                開催中: {eventName}
              </Typography>
              <Button
                variant="outlined"
                color="error"
                size="small"
                onClick={() => setIsConfirmOpen(true)}
                data-testid="end-event-button"
              >
                イベント終了
              </Button>
            </Paper>
          ) : (
            <Button
              variant="contained"
              color="primary"
              startIcon={<PowerSettingsNewIcon />}
              onClick={() => setIsStartEventDialogOpen(true)}
              data-testid="start-event-button"
            >
              イベントを開始
            </Button>
          )}

          <Snackbar
            open={saveSuccess}
            autoHideDuration={3000}
            onClose={() => setSaveSuccess(false)}
            message="イベントを開始しました"
          />

          <Box sx={{ flexGrow: 0, display: 'flex', gap: 1 }}>
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
              QRコード
            </Button>
          </Box>
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
