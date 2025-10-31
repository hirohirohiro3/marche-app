import { useState, useEffect } from 'react';
import { useStripe } from '@stripe/react-stripe-js';
import {
  Container,
  Typography,
  CircularProgress,
  Alert,
  Paper,
} from '@mui/material';

export default function PaymentCompletePage() {
  const stripe = useStripe();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!stripe) {
      return;
    }

    const clientSecret = new URLSearchParams(window.location.search).get(
      'payment_intent_client_secret'
    );

    if (!clientSecret) {
      setStatus('error');
      setMessage('決済情報が見つかりません。');
      return;
    }

    stripe.retrievePaymentIntent(clientSecret).then(({ paymentIntent }) => {
      switch (paymentIntent?.status) {
        case 'succeeded':
          setStatus('success');
          setMessage('お支払いが完了しました！');
          break;
        case 'processing':
          setStatus('loading');
          setMessage('支払いを処理中です。');
          break;
        case 'requires_payment_method':
          setStatus('error');
          setMessage('支払いに失敗しました。もう一度お試しください。');
          break;
        default:
          setStatus('error');
          setMessage('予期せぬエラーが発生しました。');
          break;
      }
    });
  }, [stripe]);

  return (
    <Container maxWidth="sm" sx={{ mt: 4 }}>
      {status === 'loading' && <CircularProgress />}
      {status === 'success' && (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="h4" color="primary" gutterBottom>
            {message}
          </Typography>
          <Typography variant="h6">
            この画面をスタッフに見せて、注文を確定させてください。
          </Typography>
        </Paper>
      )}
      {status === 'error' && <Alert severity="error">{message}</Alert>}
    </Container>
  );
}
