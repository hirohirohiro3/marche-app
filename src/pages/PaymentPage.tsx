import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { loadStripe, StripeElementsOptions } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import {
  Container,
  Typography,
  Box,
  CircularProgress,
  Alert,
} from '@mui/material';
import CheckoutForm from '../components/CheckoutForm'; // This component will contain the actual form

// Make sure to call `loadStripe` outside of a component’s render to avoid
// recreating the `Stripe` object on every render.
// TODO: Replace with your actual publishable key
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_test_...key_goes_here');

export default function PaymentPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const [clientSecret, setClientSecret] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // This is where we would fetch the `clientSecret` from our backend (Firebase Function)
    // For now, we'll simulate it.
    const fetchPaymentIntent = async () => {
      try {
        // In a real app, you'd make a request to a server endpoint.
        // const response = await fetch('/api/create-payment-intent', {
        //   method: 'POST',
        //   headers: { 'Content-Type': 'application/json' },
        //   body: JSON.stringify({ orderId }),
        // });
        // const { clientSecret } = await response.json();

        // --- Dummy Data for UI Layout ---
        const dummyClientSecret = 'pi_..._secret_...'; // This is a fake client secret
        setClientSecret(dummyClientSecret);
        // --- End of Dummy Data ---

      } catch (e) {
        setError('決済の準備に失敗しました。');
        console.error(e);
      } finally {
        setLoading(false);
      }
    };

    fetchPaymentIntent();
  }, [orderId]);

  const options: StripeElementsOptions = {
    clientSecret,
    appearance: {
      theme: 'stripe',
    },
  };

  if (loading) {
    return <Container sx={{ textAlign: 'center', mt: 4 }}><CircularProgress /></Container>;
  }

  if (error) {
    return <Container sx={{ mt: 4 }}><Alert severity="error">{error}</Alert></Container>;
  }

  return (
    <Container maxWidth="sm" sx={{ mt: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        お支払い
      </Typography>
      {clientSecret && (
        <Elements options={options} stripe={stripePromise}>
          <CheckoutForm />
        </Elements>
      )}
    </Container>
  );
}
