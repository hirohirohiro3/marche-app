import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../../firebase';
import { useAuth } from '../../../hooks/useAuth';
import {
  Button,
  Container,
  Typography,
  Box,
  Paper,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  FormLabel,
  CircularProgress,
  Alert,
} from '@mui/material';

// Define the type for payment settings
type PaymentMethod = 'cash_only' | 'cash_and_online' | 'online_only';

export default function PaymentSettingsPage() {
  const { user } = useAuth();
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash_only');
  const [stripeConnected, setStripeConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const checkStripeConnection = async () => {
      if (!user) return;

      try {
        const storeRef = doc(db, 'stores', user.uid);
        const storeDoc = await getDoc(storeRef);

        if (storeDoc.exists()) {
          const data = storeDoc.data();
          // Check if stripeAccountId exists
          if (data.stripeAccountId) {
            setStripeConnected(true);
          }
          // Load saved payment method
          if (data.paymentMethod) {
            setPaymentMethod(data.paymentMethod as PaymentMethod);
          }
        }
      } catch (err) {
        console.error("Error checking Stripe connection:", err);
      }
    };

    checkStripeConnection();
  }, [user]);

  // Handle return from Stripe
  useEffect(() => {
    if (searchParams.get('success')) {
      // Ideally, we should verify the account status with another cloud function here
      // For now, we assume success if the param is present and we have an ID
      setStripeConnected(true);
    }
  }, [searchParams]);

  const handlePaymentMethodChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const newMethod = event.target.value as PaymentMethod;
    setPaymentMethod(newMethod);

    if (user) {
      try {
        const storeRef = doc(db, 'stores', user.uid);
        await updateDoc(storeRef, { paymentMethod: newMethod });
      } catch (err) {
        console.error("Error updating payment method:", err);
        setError("支払い方法の保存に失敗しました。");
      }
    }
  };

  const handleStripeConnect = async () => {
    setLoading(true);
    setError(null);
    try {
      const functions = getFunctions();
      const createStripeAccountLink = httpsCallable(functions, 'createStripeAccountLink');

      // Pass the current window location origin as the base URL
      const baseUrl = window.location.origin;

      const result = await createStripeAccountLink({ baseUrl });
      const { url } = result.data as { url: string };

      // Redirect to Stripe
      window.location.href = url;
    } catch (err) {
      console.error("Error connecting to Stripe:", err);
      setError("Stripeとの連携に失敗しました。もう一度お試しください。");
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="md">
      <Typography variant="h4" component="h1" gutterBottom>
        決済設定
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Paper sx={{ p: 3, mt: 2 }}>
        <Box component="form">
          <FormControl component="fieldset">
            <FormLabel component="legend">支払い方法の選択</FormLabel>
            <RadioGroup
              aria-label="payment-method"
              name="payment-method"
              value={paymentMethod}
              onChange={handlePaymentMethodChange}
            >
              <FormControlLabel value="cash_only" control={<Radio />} label="レジでの支払いのみ" />
              <FormControlLabel value="cash_and_online" control={<Radio />} label="アプリ内決済 と レジでの支払いの両方" />
              <FormControlLabel value="online_only" control={<Radio />} label="アプリ内決済のみ" />
            </RadioGroup>
          </FormControl>
        </Box>
      </Paper>

      <Paper sx={{ p: 3, mt: 4 }}>
        <Typography variant="h6" gutterBottom>
          Stripeアカウント連携
        </Typography>
        {stripeConnected ? (
          <Box>
            <Typography color="green" gutterBottom sx={{ fontWeight: 'bold' }}>
              ✓ Stripeアカウントと連携済みです
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              アプリ内決済を利用できます。
            </Typography>
            {/* 
            <Button variant="outlined" color="secondary" sx={{ mt: 1 }}>
              連携を解除する
            </Button> 
            */}
          </Box>
        ) : (
          <Box>
            <Typography gutterBottom>
              アプリ内決済を利用するには、Stripeアカウントを連携する必要があります。
            </Typography>
            <Typography variant="caption" display="block" sx={{ mb: 2, color: 'text.secondary' }}>
              ※現在はテストモードです。実際の登録は行われません。
            </Typography>
            <Button
              variant="contained"
              onClick={handleStripeConnect}
              disabled={loading}
            >
              {loading ? <CircularProgress size={24} /> : 'Stripeアカウントを連携'}
            </Button>
          </Box>
        )}
      </Paper>
    </Container>
  );
}
