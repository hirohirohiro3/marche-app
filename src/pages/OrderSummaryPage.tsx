import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Container, Typography, Paper, CircularProgress, Alert } from '@mui/material';
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";

// A simplified order type for this page
type Order = {
  orderNumber: number;
  totalPrice: number;
  status: 'new' | 'paid' | 'completed' | 'cancelled';
  items: { name: string; quantity: number }[];
};

export default function OrderSummaryPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
          setOrder(docSnap.data() as Order);
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
    </Container>
  );
}
