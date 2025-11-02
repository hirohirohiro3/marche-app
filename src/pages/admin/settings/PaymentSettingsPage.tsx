import { useState, useEffect } from 'react';
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
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../../firebase';
import { useAuth } from '../../../hooks/useAuth';

// Define the type for payment settings
export type PaymentMethod = 'cash_only' | 'cash_and_online' | 'online_only';

export default function PaymentSettingsPage() {
  const { user } = useAuth();
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(null);
  const [initialPaymentMethod, setInitialPaymentMethod] = useState<PaymentMethod | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [stripeConnected] = useState(false); // Dummy state for Stripe Connect UI

  useEffect(() => {
    const fetchPaymentSettings = async () => {
      if (!user) return;
      try {
        const storeRef = doc(db, 'stores', user.uid);
        const storeDoc = await getDoc(storeRef);
        if (storeDoc.exists() && storeDoc.data()?.paymentSettings?.method) {
          const method = storeDoc.data().paymentSettings.method as PaymentMethod;
          setPaymentMethod(method);
          setInitialPaymentMethod(method);
        } else {
          // Default to 'cash_only' if no setting is found
          setPaymentMethod('cash_only');
          setInitialPaymentMethod('cash_only');
        }
      } catch (err) {
        console.error(err);
        setError('決済設定の読み込みに失敗しました。');
      } finally {
        setLoading(false);
      }
    };

    fetchPaymentSettings();
  }, [user]);

  const handlePaymentMethodChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setPaymentMethod(event.target.value as PaymentMethod);
    setSuccess(null); // Clear success message on change
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user || !paymentMethod) {
      setError('ユーザー情報または設定が不正です。');
      return;
    }

    setIsSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const storeRef = doc(db, 'stores', user.uid);
      await setDoc(storeRef, {
        paymentSettings: {
          method: paymentMethod,
        }
      }, { merge: true }); // Use merge to avoid overwriting other store data

      setInitialPaymentMethod(paymentMethod);
      setSuccess('決済設定を更新しました。');
    } catch (err) {
      console.error(err);
      setError('設定の保存に失敗しました。');
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <Container maxWidth="md">
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  const isChanged = paymentMethod !== initialPaymentMethod;

  return (
    <Container maxWidth="md">
      <Typography variant="h4" component="h1" gutterBottom>
        決済設定
      </Typography>

      <Paper sx={{ p: 3, mt: 2 }}>
        <Box component="form" onSubmit={handleSubmit}>
          <FormControl component="fieldset" disabled={isSaving}>
            <FormLabel component="legend">支払い方法の選択</FormLabel>
            <RadioGroup
              aria-label="payment-method"
              name="payment-method"
              value={paymentMethod || ''}
              onChange={handlePaymentMethodChange}
            >
              <FormControlLabel value="cash_only" control={<Radio />} label="レジでの支払いのみ" />
              <FormControlLabel value="cash_and_online" control={<Radio />} label="アプリ内決済 と レジでの支払いの両方" />
              <FormControlLabel value="online_only" control={<Radio />} label="アプリ内決済のみ" />
            </RadioGroup>
          </FormControl>

          <Box sx={{ mt: 3, position: 'relative' }}>
            <Button
              type="submit"
              variant="contained"
              disabled={!isChanged || isSaving}
            >
              保存
            </Button>
            {isSaving && (
              <CircularProgress
                size={24}
                sx={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  marginTop: '-12px',
                  marginLeft: '-12px',
                }}
              />
            )}
          </Box>
        </Box>
      </Paper>

      {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mt: 2 }}>{success}</Alert>}

      <Paper sx={{ p: 3, mt: 4 }}>
        <Typography variant="h6" gutterBottom>
          Stripeアカウント連携
        </Typography>
        {stripeConnected ? (
          <Box>
            <Typography color="green" gutterBottom>連携済みです。</Typography>
            <Button variant="outlined" color="secondary">
              連携を解除する
            </Button>
          </Box>
        ) : (
          <Box>
            <Typography gutterBottom>
              アプリ内決済を利用するには、Stripeアカウントを連携する必要があります。
            </Typography>
            <Button variant="contained">
              Stripeアカウントを連携
            </Button>
          </Box>
        )}
      </Paper>
    </Container>
  );
}
