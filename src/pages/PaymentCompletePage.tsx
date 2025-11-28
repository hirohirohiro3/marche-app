import { useState, useEffect, useRef } from 'react';
import { useStripe } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import html2canvas from 'html2canvas';
import {
  Container,
  Typography,
  CircularProgress,
  Alert,
  Paper,
  Box,
  Divider,
  Button,
  TextField,
  Grid,
  Collapse
} from '@mui/material';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { getFunctions, httpsCallable } from 'firebase/functions';
import SendIcon from '@mui/icons-material/Send';
import ReceiptIcon from '@mui/icons-material/Receipt';
import EmailIcon from '@mui/icons-material/Email';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import DownloadIcon from '@mui/icons-material/Download';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '');

// Receipt Component (Hidden)
const ReceiptTemplate = ({ order, store, receiptRef }: { order: any, store: any, receiptRef: any }) => {
  if (!order || !store) return null;

  const taxAmount = Math.floor(order.totalPrice - (order.totalPrice / 1.1));
  const createdAt = order.createdAt?.toDate ? order.createdAt.toDate() : new Date();
  const formattedDate = `${createdAt.getFullYear()}/${String(createdAt.getMonth() + 1).padStart(2, '0')}/${String(createdAt.getDate()).padStart(2, '0')}`;

  return (
    <div style={{ position: 'absolute', top: -9999, left: -9999 }}>
      <div
        ref={receiptRef}
        style={{
          width: '375px', // Mobile width
          padding: '40px',
          backgroundColor: '#ffffff',
          fontFamily: 'sans-serif',
          color: '#333',
          boxSizing: 'border-box'
        }}
      >
        <h2 style={{ textAlign: 'center', margin: '0 0 20px 0', fontSize: '24px' }}>領収書</h2>

        <div style={{ marginBottom: '20px' }}>
          <h3 style={{ margin: '0 0 5px 0', fontSize: '18px' }}>{store.storeName || 'Marche App'}</h3>
          {store.invoiceNumber && (
            <p style={{ margin: '0', fontSize: '14px' }}>登録番号: {store.invoiceNumber}</p>
          )}
          <p style={{ margin: '0', fontSize: '14px' }}>発行日: {formattedDate}</p>
        </div>

        <hr style={{ border: 'none', borderTop: '1px solid #eee', margin: '20px 0' }} />

        <div style={{ marginBottom: '20px' }}>
          <h3 style={{ margin: '0 0 10px 0', fontSize: '16px' }}>注文番号: #{order.orderNumber}</h3>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {order.items?.map((item: any, index: number) => (
              <li key={index} style={{ marginBottom: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '16px' }}>
                  <span>{item.name} x {item.quantity}</span>
                  <span>¥{item.price.toLocaleString()}</span>
                </div>
                {item.selectedOptions && item.selectedOptions.length > 0 && (
                  <ul style={{ listStyle: 'none', padding: '0 0 0 15px', margin: '5px 0 0 0', fontSize: '14px', color: '#666' }}>
                    {item.selectedOptions.map((opt: any, i: number) => (
                      <li key={i}>
                        {opt.groupName}: {opt.choiceName} ({opt.priceModifier >= 0 ? '+' : ''}¥{opt.priceModifier})
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        </div>

        <hr style={{ border: 'none', borderTop: '1px solid #eee', margin: '20px 0' }} />

        <div style={{ textAlign: 'right' }}>
          <h3 style={{ margin: '0 0 5px 0', fontSize: '20px' }}>合計金額: ¥{order.totalPrice.toLocaleString()} (税込)</h3>
          <p style={{ margin: '0', fontSize: '14px', color: '#666' }}>(内消費税等(10%): ¥{taxAmount.toLocaleString()})</p>
        </div>

        <div style={{ marginTop: '40px', textAlign: 'center', fontSize: '14px', color: '#999' }}>
          またのご利用をお待ちしております。
        </div>
      </div>
    </div>
  );
};

// Reusable Success View
function PaymentSuccessView({ message, orderNumber, orderId }: { message: string, orderNumber: number | null, orderId: string | null }) {
  const [orderData, setOrderData] = useState<any>(null);
  const [storeData, setStoreData] = useState<any>(null);
  const receiptRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);

  // Email Receipt State
  const [emailReceiptEnabled, setEmailReceiptEnabled] = useState(false);
  const [showEmailInput, setShowEmailInput] = useState(false);
  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [receiptSent, setReceiptSent] = useState(false);
  const [receiptError, setReceiptError] = useState<string | null>(null);

  useEffect(() => {
    if (!orderId) return;

    const fetchData = async () => {
      try {
        const orderRef = doc(db, 'orders', orderId);
        const orderDoc = await getDoc(orderRef);
        if (orderDoc.exists()) {
          const oData = orderDoc.data();
          setOrderData(oData);

          if (oData.storeId) {
            const storeRef = doc(db, 'stores', oData.storeId);
            const storeDoc = await getDoc(storeRef);
            if (storeDoc.exists()) {
              const sData = storeDoc.data();
              setStoreData(sData);
              if (sData.emailReceipt?.enabled) {
                setEmailReceiptEnabled(true);
              }
            }
          }
        }
      } catch (err) {
        console.error("Error fetching receipt data:", err);
      }
    };
    fetchData();
  }, [orderId]);

  const handleDownloadReceipt = async () => {
    if (!receiptRef.current) return;
    setDownloading(true);
    try {
      const canvas = await html2canvas(receiptRef.current, {
        scale: 2, // High resolution
        logging: false,
        useCORS: true
      });
      const image = canvas.toDataURL("image/png");
      const link = document.createElement('a');
      link.href = image;
      link.download = `receipt_${orderNumber || 'order'}.png`;
      link.click();
    } catch (err) {
      console.error("Error generating receipt image:", err);
      alert("レシート画像の保存に失敗しました。");
    } finally {
      setDownloading(false);
    }
  };

  const handleSendReceipt = async () => {
    if (!email || !orderId) return;
    setSending(true);
    setReceiptError(null);
    try {
      const functions = getFunctions(undefined, 'asia-northeast1');
      const sendReceipt = httpsCallable(functions, 'sendReceipt');
      await sendReceipt({ orderId, email });
      setReceiptSent(true);
      setTimeout(() => {
        setShowEmailInput(false); // Close after success
        setEmail(''); // Clear email
      }, 3000);
    } catch (error) {
      console.error("Error sending receipt:", error);
      setReceiptError("レシートの送信に失敗しました。");
    } finally {
      setSending(false);
    }
  };

  return (
    <Container maxWidth="sm" sx={{ mt: 4, textAlign: 'center' }}>
      <Paper elevation={3} sx={{ p: 4, borderRadius: 4 }}>
        <Typography variant="h5" color="success.main" gutterBottom sx={{ fontWeight: 'bold' }}>
          🎉 {message}
        </Typography>

        <Divider sx={{ my: 3 }} />

        {orderNumber ? (
          <>
            <Typography variant="body1" color="text.secondary" gutterBottom>
              注文番号
            </Typography>
            <Typography variant="h1" color="primary" sx={{ fontWeight: 'bold', mb: 2, fontSize: '4rem' }}>
              #{orderNumber}
            </Typography>
          </>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', my: 2 }}>
            <CircularProgress size={30} sx={{ mb: 2 }} />
            <Typography variant="body2" color="text.secondary">
              注文情報を取得中...
            </Typography>
          </Box>
        )}

        <Alert severity="info" sx={{ mt: 3, textAlign: 'left', fontSize: '1.1rem' }}>
          <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
            スタッフにこの画面（注文番号）を提示してください。
          </Typography>
          <Typography variant="body2">
            商品が出来上がりましたら、注文番号でお呼びします。
          </Typography>
        </Alert>

        {/* Receipt Actions Section */}
        {orderData && storeData && emailReceiptEnabled && (
          <Box sx={{ mt: 4 }}>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, color: 'text.secondary' }}>
              <ReceiptIcon /> レシート
            </Typography>

            <Grid container spacing={2}>
              {/* 1. Save Image Button */}
              <Grid item xs={6}>
                <Button
                  variant="outlined"
                  startIcon={downloading ? <CircularProgress size={20} /> : <DownloadIcon />}
                  onClick={handleDownloadReceipt}
                  disabled={downloading}
                  fullWidth
                  sx={{
                    py: 1.5,
                    borderRadius: 2,
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 0.5
                  }}
                >
                  画像を保存
                </Button>
              </Grid>

              {/* 2. Email Button (Toggle) */}
              {emailReceiptEnabled && (
                <Grid item xs={6}>
                  <Button
                    variant={showEmailInput ? "contained" : "outlined"}
                    startIcon={receiptSent ? <CheckCircleIcon /> : <EmailIcon />}
                    onClick={() => setShowEmailInput(!showEmailInput)}
                    fullWidth
                    color={receiptSent ? "success" : "primary"}
                    sx={{
                      py: 1.5,
                      borderRadius: 2,
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 0.5
                    }}
                  >
                    {receiptSent ? '送信済み' : 'メールで送信'}
                  </Button>
                </Grid>
              )}
            </Grid>

            {/* Email Input Collapse */}
            <Collapse in={showEmailInput}>
              <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 2, border: '1px solid #eee' }}>
                {receiptSent ? (
                  <Alert severity="success" sx={{ mb: 0 }}>
                    レシートを送信しました！
                  </Alert>
                ) : (
                  <Box component="form" noValidate autoComplete="off">
                    <Typography variant="body2" color="text.secondary" paragraph align="left">
                      メールアドレスを入力してください。
                    </Typography>
                    <TextField
                      fullWidth
                      label="メールアドレス"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={sending}
                      size="small"
                      sx={{ mb: 2, bgcolor: 'white' }}
                    />
                    {receiptError && <Alert severity="error" sx={{ mb: 2 }}>{receiptError}</Alert>}
                    <Button
                      variant="contained"
                      fullWidth
                      onClick={handleSendReceipt}
                      disabled={!email || sending}
                      startIcon={sending ? <CircularProgress size={20} color="inherit" /> : <SendIcon />}
                    >
                      {sending ? '送信中...' : '送信する'}
                    </Button>
                  </Box>
                )}
              </Box>
            </Collapse>

            {/* Hidden Receipt Template */}
            <ReceiptTemplate order={orderData} store={storeData} receiptRef={receiptRef} />
          </Box>
        )}
      </Paper>
    </Container>
  );
}

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
