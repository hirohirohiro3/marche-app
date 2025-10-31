import { useState } from 'react';
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
} from '@mui/material';

// Define the type for payment settings
type PaymentMethod = 'cash_only' | 'cash_and_online' | 'online_only';

export default function PaymentSettingsPage() {
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash_only');
  const [stripeConnected, setStripeConnected] = useState(false); // Dummy state

  const handlePaymentMethodChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setPaymentMethod(event.target.value as PaymentMethod);
  };

  const handleStripeConnect = () => {
    // Logic to redirect to Stripe Connect Onboarding will be added here
    console.log('Redirecting to Stripe to connect account...');
  };

  return (
    <Container maxWidth="md">
      <Typography variant="h4" component="h1" gutterBottom>
        決済設定
      </Typography>

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
            <Button variant="contained" onClick={handleStripeConnect}>
              Stripeアカウントを連携
            </Button>
          </Box>
        )}
      </Paper>
    </Container>
  );
}
