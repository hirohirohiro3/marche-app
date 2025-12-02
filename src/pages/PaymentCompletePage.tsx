import { useState, useEffect } from 'react';
import { useStripe } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import {
  Container,
  CircularProgress,
  Alert,
} from '@mui/material';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { PaymentSuccessView } from '../components/PaymentSuccessView';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '');

// In-Person Payment Handler
function InPersonPaymentContent({ orderId }: { orderId: string }) {
  const [orderNumber, setOrderNumber] = useState<number | null>(null);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const orderRef = doc(db, 'orders', orderId);
        const orderDoc = await getDoc(orderRef);
        if (orderDoc.exists()) {
          const data = orderDoc.data();
          if (data.orderNumber) {
            setOrderNumber(data.orderNumber);
          }
        }
      } catch (err) {
        console.error("Error fetching order details:", err);
      }
    };
    fetchOrder();
  }, [orderId]);

  return (
    <Container maxWidth="sm" sx={{ mt: 4 }}>
      <PaymentSuccessView message="ご注文ありがとうございます！" orderNumber={orderNumber} orderId={orderId} />
    </Container>
  );
}

function StripePaymentContent() {
  const stripe = useStripe();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState<string | null>(null);
  const [orderNumber, setOrderNumber] = useState<number | null>(null);
  const [orderId, setOrderId] = useState<string | null>(null);

  useEffect(() => {
    if (!stripe) return;

    const searchParams = new URLSearchParams(window.location.search);
    const clientSecret = searchParams.get('payment_intent_client_secret');
    const urlOrderId = searchParams.get('orderId');

    if (!clientSecret) {
      setStatus('error');
      setMessage('決済情報が見つかりません。');
      return;
    }

    stripe.retrievePaymentIntent(clientSecret).then(async ({ paymentIntent, error }) => {
      if (error) {
        console.error("Error retrieving PaymentIntent:", error);
        setStatus('error');
        setMessage(error.message || '決済情報の取得に失敗しました。');
        return;
      }

      if (!paymentIntent) {
        setStatus('error');
        setMessage('決済情報が見つかりません。');
        return;
      }

      const pi = paymentIntent as any;
      const metadataOrderId = pi.metadata?.orderId;
      const targetOrderId = metadataOrderId || urlOrderId;
      setOrderId(targetOrderId);

      switch (paymentIntent.status) {
        case 'succeeded':
          setStatus('success');
          setMessage('お支払いが完了しました！');

          if (targetOrderId) {
            try {
              const orderRef = doc(db, 'orders', targetOrderId);
              const orderDoc = await getDoc(orderRef);
              if (orderDoc.exists()) {
                const data = orderDoc.data();
                if (data.orderNumber) {
                  setOrderNumber(data.orderNumber);
                }
              }
            } catch (err) {
              console.error("Error fetching order details:", err);
            }
          }
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

  if (status === 'loading') {
    return (
      <Container maxWidth="sm" sx={{ mt: 4, textAlign: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  if (status === 'success') {
    return <PaymentSuccessView message={message || 'お支払いが完了しました！'} orderNumber={orderNumber} orderId={orderId} />;
  }

  return (
    <Container maxWidth="sm" sx={{ mt: 4 }}>
      <Alert severity="error">{message}</Alert>
    </Container>
  );
}

export default function PaymentCompletePage() {
  const searchParams = new URLSearchParams(window.location.search);
  const clientSecret = searchParams.get('payment_intent_client_secret');
  const method = searchParams.get('method');
  const orderId = searchParams.get('orderId');

  // Case 1: In-Person Payment
  if (method === 'in_person' && orderId) {
    return <InPersonPaymentContent orderId={orderId} />;
  }

  // Case 2: Stripe Payment (requires clientSecret)
  if (clientSecret) {
    return (
      <Elements stripe={stripePromise} options={{ clientSecret }}>
        <StripePaymentContent />
      </Elements>
    );
  }

  // Case 3: Error / Invalid Access
  return (
    <Container maxWidth="sm" sx={{ mt: 4 }}>
      <Alert severity="error">決済情報が見つかりません。</Alert>
    </Container>
  );
}
