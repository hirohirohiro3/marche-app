import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Container, Typography, Paper, CircularProgress, Alert, Button, Box } from '@mui/material';
import { doc, onSnapshot, getDoc } from "firebase/firestore";
import { db } from "../firebase";

// A simplified order type for this page
type Order = {
  orderNumber: number;
  totalPrice: number;
  status: 'new' | 'paid' | 'completed' | 'cancelled';
  items: { name: string; quantity: number }[];
  storeId?: string;
};

export default function OrderSummaryPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'cash_only' | 'cash_and_online' | 'online_only'>('cash_only');
  const [storeId, setStoreId] = useState<string | null>(null);

  useEffect(() => {
    if (!orderId) {
      setError("注文IDが見つかりません。");
      setLoading(false);
      return;
    }

    const docRef = doc(db, "orders", orderId);
    const unsubscribe = onSnapshot(docRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data() as Order;
          setOrder(data);
          if (data.storeId) {
            setStoreId(data.storeId);
          }
        } else {
          setError("注文が見つかりません。");
        }
        setLoading(false);
      },
      (err) => {
        console.error(err);
        setError("注文の読み込みに失敗しました。");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [orderId]);

  useEffect(() => {
    const fetchStoreSettings = async () => {
      if (!storeId) return;
      try {
        const storeRef = doc(db, 'stores', storeId);
        const storeDoc = await getDoc(storeRef);
        if (storeDoc.exists()) {
          const data = storeDoc.data();
          if (data.paymentMethod) {
            setPaymentMethod(data.paymentMethod as any);
          }
        }
      } catch (err) {
        console.error("Error fetching store settings:", err);
      }
    };
    fetchStoreSettings();
  }, [storeId]);

  if (loading) {
    return <Container sx={{ py: 4, textAlign: 'center' }}><CircularProgress /></Container>;
  }

  if (error) {
    return <Container sx={{ py: 4 }}><Alert severity="error">{error}</Alert></Container>;
  }

  const renderContentByStatus = () => {
    switch (order?.status) {
      case 'paid':
        return {
          title: "お渡し待ち",
          message: "お会計ありがとうございました。商品が出来上がりましたら、注文番号でお呼びします。",
        };
      case 'completed':
        return {
          title: "お渡し完了",
          message: "ありがとうございました！",
        };
      case 'new':
      default:
        return {
          title: "お会計サマリー",
          message: "この画面をレジでスタッフに見せて、先に会計してください。",
        };
    }
  };

  const { title, message } = renderContentByStatus();
  const showOnlinePayment = order?.status === 'new' && (paymentMethod === 'online_only' || paymentMethod === 'cash_and_online');

  return (
    <Container maxWidth="sm" sx={{ py: 4, textAlign: 'center' }}>
      <Typography variant="h4" component="h1" gutterBottom>
        {title}
      </Typography>
      <Typography variant="body1" gutterBottom>
        {message}
      </Typography>
      <Paper elevation={3} sx={{ p: 3, mt: 4 }}>
        <Typography variant="h5" gutterBottom>
          注文番号
        </Typography>
        <Typography variant="h2" component="p" gutterBottom color="primary">
          {order?.orderNumber}
        </Typography>
        {order?.status === 'new' && (
          <Typography variant="h6">
            合計金額: ¥{order?.totalPrice.toLocaleString()}
          </Typography>
        )}
      </Paper>

      {showOnlinePayment && (
        <Box sx={{ mt: 4 }}>
          <Button
            variant="contained"
            color="primary"
            size="large"
            fullWidth
            href={`/payment/${orderId}`}
          >
            オンラインで支払う
          </Button>
          {paymentMethod === 'cash_and_online' && (
            <Typography variant="caption" display="block" sx={{ mt: 1, color: 'text.secondary' }}>
              または、レジで現金でお支払いください。
            </Typography>
          )}
        </Box>
      )}
    </Container>
  );
}
