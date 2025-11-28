import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { getApp } from 'firebase/app';
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
      console.log('PaymentPage v2.2 loaded - Region: asia-northeast1'); // Version check v2.2

      if (!orderId) {
        setError('注文IDが見つかりません。');
        setLoading(false);
        return;
      }

      try {
        // Explicitly use asia-northeast1 region with app instance
        const functions = getFunctions(getApp(), 'asia-northeast1');
        const createPaymentIntent = httpsCallable(functions, 'createPaymentIntent');

        console.log(`Calling createPaymentIntent for orderId: ${orderId}`);
        const result = await createPaymentIntent({ orderId });
        console.log('createPaymentIntent result:', result);

        const data = result.data as any;

        // Check for custom error response
        if (data.error) {
          console.error('Server returned error:', data);
          throw new Error(`Server Error: ${data.error} (Step: ${data.step})`);
        }

        const { clientSecret } = data;

        if (!clientSecret) {
          throw new Error('Client secret not returned from function.');
        }

        setClientSecret(clientSecret);
      } catch (e: any) {
        console.error('Error calling createPaymentIntent:', e);
        if (e.details) {
          console.error('Error details:', e.details);
        }
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
