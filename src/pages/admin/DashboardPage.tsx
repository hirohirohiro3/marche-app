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
import HelpSection from '../../components/HelpSection';
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
  limit,
} from 'firebase/firestore';
import { db } from '../../firebase';
import { MenuItem } from '../../types';
import { keyframes } from '@emotion/react';
import ManualOrderModal from '../../components/ManualOrderModal';
import QrCodeModal from '../../components/QrCodeModal';
import { useOrders } from '../../hooks/useOrders';
import { useAuth } from '../../hooks/useAuth';
import OrderColumn from '../../components/OrderColumn';
import StockStatusWidget from '../../components/StockStatusWidget';

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
  const [isReuseConfirmOpen, setIsReuseConfirmOpen] = useState(false);

  // Fetch menu items
  useEffect(() => {
    if (!user) return;

    const fetchMenuItems = () => {
      const menuCollection = collection(db, 'menus');
      const q = query(
        menuCollection,
        where('storeId', '==', user.uid),
        orderBy('sortOrder')
      );

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const menuList = snapshot.docs.map(
          (doc) => ({ id: doc.id, ...doc.data() } as MenuItem)
        );
        setMenuItems(menuList);
      });

      return unsubscribe;
    };

    const unsubscribe = fetchMenuItems();
    return () => unsubscribe();
  }, [user]);

  const [lowStockThreshold, setLowStockThreshold] = useState<number>(5);

  // Fetch current event name and settings
  useEffect(() => {
    if (!user) return;
    const fetchStoreData = async () => {
      const storeRef = doc(db, 'stores', user.uid);
      const unsubscribe = onSnapshot(storeRef, (doc) => {
        if (doc.exists()) {
          const data = doc.data();
          setEventName(data.currentEventName || '');
          if (data.lowStockThreshold !== undefined) {
            setLowStockThreshold(data.lowStockThreshold);
          }
        }
      });
      return () => unsubscribe();
    };
    fetchStoreData();
  }, [user]);

  const handleStartEvent = async () => {
    if (!user || !newEventName.trim()) return;

    // Check if event name has been used before
    try {
      const ordersRef = collection(db, 'orders');
      const q = query(
        ordersRef,
        where('storeId', '==', user.uid),
        where('eventName', '==', newEventName.trim()),
        limit(1)
      );
      const snapshot = await getDocs(q);

      if (!snapshot.empty) {
        setIsReuseConfirmOpen(true);
        return;
      }
    } catch (error) {
      console.error("Error checking event name:", error);
    }

    executeStartEvent();
  };

  const executeStartEvent = async () => {
    if (!user) return;
    setIsSavingEventName(true);
    try {
      await processEndOfDay();
      const storeRef = doc(db, 'stores', user.uid);
      await setDoc(storeRef, { currentEventName: newEventName }, { merge: true });
      setEventName(newEventName);
      setIsStartEventDialogOpen(false);
      setIsReuseConfirmOpen(false);
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
      alert('イベントの終了に失敗しました。もう一度お試しください。');
    }
  };

  return (
    <>
      <ManualOrderModal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        menuItems={menuItems}
        lowStockThreshold={lowStockThreshold}
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

      {/* Reuse Event Name Confirmation Dialog */}
      <Dialog
        open={isReuseConfirmOpen}
        onClose={() => setIsReuseConfirmOpen(false)}
      >
        <DialogTitle>イベント名の確認</DialogTitle>
        <DialogContent>
          <DialogContentText>
            イベント名「{newEventName}」は過去に使用されています。
            <br />
            <br />
            このまま開始すると、<strong>売上分析で過去の同名イベントのデータと合算されます</strong>。
            <br />
            （ダッシュボード上の注文はリセットされるため、日々の運用には影響ありません）
            <br />
            <br />
            よろしいですか？
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsReuseConfirmOpen(false)}>キャンセル</Button>
          <Button onClick={executeStartEvent} variant="contained" color="warning" autoFocus>
            合算して開始
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
        <HelpSection title="ダッシュボードの機能">
          <ul style={{ margin: 0, paddingLeft: '1.5rem' }}>
            <li><strong>イベントを開始</strong>: 新しいイベントを開始し、注文番号を1番にリセットします。</li>
            <li><strong>手動注文</strong>: 店頭で受けた注文をスタッフが直接入力するための画面を開きます（注文番号は1〜100番を使用）。</li>
            <li><strong>QRコード</strong>: お客さまに読み取ってもらうための注文用QRコードを表示・印刷できます（注文番号は101番〜を使用）。</li>
          </ul>
        </HelpSection>

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
        <StockStatusWidget menuItems={menuItems} lowStockThreshold={lowStockThreshold} />
      </Container>
    </>
  );
}
