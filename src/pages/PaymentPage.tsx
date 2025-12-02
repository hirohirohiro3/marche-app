import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { functions } from '../firebase';
import { httpsCallable } from 'firebase/functions';
import { loadStripe, StripeElementsOptions } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import {
  Container,
  Typography,
  CircularProgress,
  Alert,
} from '@mui/material';
import CheckoutForm from '../components/CheckoutForm';

// Make sure to call `loadStripe` outside of a component's render to avoid
// recreating the `Stripe` object on every render.
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '');

export default function PaymentPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPaymentIntent = async () => {
      if (!orderId) {
        setError('注文IDが見つかりません。');
        setLoading(false);
        return;
      }

      try {
        console.log('Calling createPaymentIntent with orderId:', orderId);
        // Use the initialized functions instance from firebase.ts
        const createPaymentIntent = httpsCallable(functions, 'createPaymentIntent');
        const result = await createPaymentIntent({ orderId });
        console.log('createPaymentIntent result:', result);

        const data = result.data as any;
        if (data.error) {
          console.error('Server returned error:', data);
          throw new Error(data.error);
        }

        const clientSecret = data.clientSecret;
        if (!clientSecret) {
          console.error('Missing clientSecret in response:', data);
          throw new Error('clientSecretが取得できませんでした');
        }

        setClientSecret(clientSecret);
      } catch (e: any) {
        console.error('Error calling createPaymentIntent:', e);
        console.error('Error code:', e.code);
        console.error('Error message:', e.message);
        console.error('Error details:', e.details);
        setError(`決済の準備に失敗しました: ${e.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchPaymentIntent();
  }, [orderId]);

  if (loading) {
    return <Container sx={{ textAlign: 'center', mt: 4 }}><CircularProgress /></Container>;
  }

  if (error) {
    return <Container sx={{ mt: 4 }}><Alert severity="error">{error}</Alert></Container>;
  }

  if (!clientSecret) {
    return <Container sx={{ mt: 4 }}><Alert severity="warning">決済情報の取得中です...</Alert></Container>;
  }

  const options: StripeElementsOptions = {
    clientSecret,
    appearance: {
      theme: 'stripe',
    },
  };

  return (
    <Container maxWidth="sm" sx={{ mt: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        お支払い
      </Typography>
      <Elements options={options} stripe={stripePromise}>
        <CheckoutForm orderId={orderId!} />
      </Elements>
    </Container>
  );
}
