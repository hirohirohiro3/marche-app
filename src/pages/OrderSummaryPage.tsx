import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import {
  Container,
  Typography,
  Box,
  Paper,
  Button,
  CircularProgress,
  Alert,
  Stack
} from '@mui/material';
import StorefrontIcon from '@mui/icons-material/Storefront';
import AppleIcon from '@mui/icons-material/Apple';
import SmartphoneIcon from '@mui/icons-material/Smartphone';
import CreditCardIcon from '@mui/icons-material/CreditCard';

// Define the Order type
interface Order {
  id: string;
  totalPrice: number;
  status: string;
  orderNumber?: number;
  items: any[];
}

// Define Store Settings type
interface StoreSettings {
  paymentMethod: 'cash_only' | 'cash_and_online' | 'online_only';
  otherPaymentMethods?: {
    enabled: boolean;
    message: string;
  };
  guidanceMessage?: {
    enabled: boolean;
    message: string;
  };
}

export default function OrderSummaryPage() {
  // const [searchParams] = useSearchParams(); // Removed as we use useParams now
  const navigate = useNavigate();
  const { orderId } = useParams<{ orderId: string }>();
  // const orderId = searchParams.get('orderId'); // Removed

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [storeSettings, setStoreSettings] = useState<StoreSettings | null>(null);

  // Device detection state
  const [isAppleDevice, setIsAppleDevice] = useState(false);
  const [isAndroidDevice, setIsAndroidDevice] = useState(false);

  useEffect(() => {
    // Detect device type
    const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
    if (/iPad|iPhone|iPod/.test(userAgent) && !(window as any).MSStream) {
      setIsAppleDevice(true);
    } else if (/android/i.test(userAgent)) {
      setIsAndroidDevice(true);
    }

    if (!orderId) {
      setError('注文IDが見つかりません。');
      setLoading(false);
      return;
    }

    // Fetch Order
    const orderRef = doc(db, 'orders', orderId);
    const unsubscribeOrder = onSnapshot(orderRef, (docSnap) => {
      if (docSnap.exists()) {
        const orderData = { id: docSnap.id, ...docSnap.data() } as Order;
        setOrder(orderData);

        // Fetch Store Settings using the storeId from the order
        const storeId = (docSnap.data() as any).storeId;
        if (storeId) {
          const storeRef = doc(db, 'stores', storeId);
          getDoc(storeRef).then(storeSnap => {
            if (storeSnap.exists()) {
              setStoreSettings(storeSnap.data() as StoreSettings);
            }
          });
        }
      } else {
        setError('注文が見つかりません。');
      }
      setLoading(false);
    }, (err) => {
      console.error("Error fetching order:", err);
      setError('注文情報の取得に失敗しました。');
      setLoading(false);
    });

    return () => unsubscribeOrder();
  }, [orderId]);

  const handleOnlinePayment = () => {
    if (orderId) {
      navigate(`/payment/${orderId}`);
    }
  };

  const setPaymentMethod = async (method: string) => {
    navigate(`/payment-complete?orderId=${orderId}&method=${method}`);
  };

  if (loading) {
    return (
      <Container sx={{ mt: 4, textAlign: 'center' }}>
        <CircularProgress />
        <Typography sx={{ mt: 2 }}>注文情報を読み込んでいます...</Typography>
      </Container>
    );
  }

  if (error || !order) {
    return (
      <Container sx={{ mt: 4 }}>
        <Alert severity="error">{error || 'エラーが発生しました'}</Alert>
        <Paper sx={{ p: 3, mt: 3, textAlign: 'center' }}>
          <Typography variant="body1" paragraph>
            注文情報の取得に失敗しました。
            QRコードをもう一度読み直すか、スタッフにお声がけください。
          </Typography>
          <Button variant="contained" onClick={() => window.location.reload()}>
            再読み込み
          </Button>
        </Paper>
      </Container>
    );
  }

  // Determine which payment methods to show based on settings
  const paymentMethodSetting = storeSettings?.paymentMethod || 'cash_only';
  const allowInPerson = paymentMethodSetting === 'cash_only' || paymentMethodSetting === 'cash_and_online';
  const allowOnline = paymentMethodSetting === 'online_only' || paymentMethodSetting === 'cash_and_online';

  // Get custom message for in-person payment
  const inPersonMessage = storeSettings?.otherPaymentMethods?.message || '現金、PayPayでのお支払いはこちら';

  // 支払い完了・キャンセル等のステータス表示
  if (order?.status === 'paid' || order?.status === 'completed') {
    return (
      <Container maxWidth="sm" sx={{ py: 4, textAlign: 'center' }}>
        <Alert severity="success" sx={{ mb: 2 }}>
          お支払いは完了しています
        </Alert>
        <Typography variant="h4" gutterBottom>
          注文番号: #{order?.orderNumber}
        </Typography>
        <Typography variant="body1">
          商品が出来上がりましたら、注文番号でお呼びします。
        </Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="sm" sx={{ mt: 4, pb: 8 }}>
      <Typography variant="h5" component="h1" gutterBottom align="center" sx={{ fontWeight: 'bold', mb: 3 }}>
        お支払い方法の選択
      </Typography>

      <Paper sx={{ p: 4, mb: 3, borderRadius: 3, textAlign: 'center', bgcolor: '#f8f9fa' }}>
        <Typography variant="subtitle1" color="text.secondary" gutterBottom>
          お支払い金額
        </Typography>
        <Typography variant="h2" component="div" sx={{ fontWeight: 'bold', color: 'primary.main', my: 1 }}>
          ¥{order.totalPrice.toLocaleString()}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          注文番号: #{order.orderNumber}
        </Typography>
      </Paper>

      <Stack spacing={2}>
        {/* Pay in Person Button */}
        {allowInPerson && (
          <Paper
            elevation={0}
            onClick={() => setPaymentMethod('in_person')}
            sx={{
              p: 2,
              border: '2px solid',
              borderColor: 'grey.300',
              borderRadius: 3,
              cursor: 'pointer',
              transition: 'all 0.2s',
              '&:hover': {
                borderColor: 'primary.main',
                bgcolor: 'grey.50',
                transform: 'translateY(-2px)',
                boxShadow: 2
              },
              display: 'flex',
              alignItems: 'center'
            }}
          >
            <Box sx={{
              width: 56, height: 56,
              borderRadius: '50%',
              bgcolor: 'grey.200',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              mr: 2,
              flexShrink: 0
            }}>
              <StorefrontIcon color="action" fontSize="large" />
            </Box>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 'bold' }}>対面で支払う</Typography>
              <Typography variant="body2" sx={{ color: 'text.primary', fontWeight: 500 }}>
                {inPersonMessage}
              </Typography>
            </Box>
          </Paper>
        )}

        {/* Online Payment Buttons */}
        {allowOnline && (
          <>
            {/* Apple Pay (Only on Apple devices) */}
            {isAppleDevice && (
              <Paper
                elevation={0}
                onClick={handleOnlinePayment}
                sx={{
                  p: 2,
                  border: '2px solid',
                  borderColor: 'grey.300',
                  borderRadius: 3,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  '&:hover': {
                    borderColor: 'black',
                    bgcolor: 'grey.50',
                    transform: 'translateY(-2px)',
                    boxShadow: 2
                  },
                  display: 'flex', alignItems: 'center'
                }}
              >
                <Box sx={{
                  width: 56, height: 56,
                  borderRadius: '50%',
                  bgcolor: 'grey.200',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  mr: 2,
                  flexShrink: 0
                }}>
                  <AppleIcon fontSize="large" />
                </Box>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 'bold' }}>Apple Pay</Typography>
                </Box>
              </Paper>
            )}

            {/* Google Pay (Only on Android) */}
            {isAndroidDevice && (
              <Paper
                elevation={0}
                onClick={handleOnlinePayment}
                sx={{
                  p: 2,
                  border: '2px solid',
                  borderColor: 'grey.300',
                  borderRadius: 3,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  '&:hover': {
                    borderColor: 'black',
                    bgcolor: 'grey.50',
                    transform: 'translateY(-2px)',
                    boxShadow: 2
                  },
                  display: 'flex', alignItems: 'center'
                }}
              >
                <Box sx={{
                  width: 56, height: 56,
                  borderRadius: '50%',
                  bgcolor: 'grey.200',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  mr: 2,
                  flexShrink: 0
                }}>
                  <SmartphoneIcon fontSize="large" />
                </Box>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 'bold' }}>Google Pay</Typography>
                </Box>
              </Paper>
            )}

            {/* Credit Card (Always visible) */}
            <Paper
              elevation={0}
              onClick={handleOnlinePayment}
              sx={{
                p: 2,
                border: '2px solid',
                borderColor: 'grey.300',
                borderRadius: 3,
                cursor: 'pointer',
                transition: 'all 0.2s',
                '&:hover': {
                  borderColor: '#6772e5',
                  bgcolor: '#f0f4ff',
                  transform: 'translateY(-2px)',
                  boxShadow: 2
                },
                display: 'flex', alignItems: 'center'
              }}
            >
              <Box sx={{
                width: 56, height: 56,
                borderRadius: '50%',
                bgcolor: '#e0e6ff',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                mr: 2,
                flexShrink: 0
              }}>
                <CreditCardIcon sx={{ color: '#6772e5' }} fontSize="large" />
              </Box>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>クレジットカード</Typography>
                <Typography variant="body2" sx={{ color: 'text.primary', fontWeight: 500 }}>
                  Visa, Master, Amex, JCB
                </Typography>
              </Box>
            </Paper>
          </>
        )}

        {/* Customer Guidance Message */}
        {storeSettings?.guidanceMessage?.enabled && storeSettings.guidanceMessage.message && (
          <Box sx={{ mt: 4, mb: 2 }}>
            <Alert
              severity="info"
              icon={false}
              sx={{
                borderRadius: 2,
                bgcolor: 'info.lighter',
                color: 'info.dark'
              }}
            >
              <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', fontWeight: 500 }}>
                {storeSettings.guidanceMessage.message}
              </Typography>
            </Alert>
          </Box>
        )}
      </Stack>
    </Container>
  );
}
