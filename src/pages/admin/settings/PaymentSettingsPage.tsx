import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth';
import { doc, getDoc, updateDoc, deleteField } from 'firebase/firestore';
import { db } from '../../../firebase';
import { getFunctions, httpsCallable } from 'firebase/functions';
import {
  Container,
  Typography,
  Paper,
  Box,
  Button,
  FormControl,
  FormControlLabel,
  RadioGroup,
  Radio,
  CircularProgress,
  Alert,
  TextField,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Switch,
  Grid,
  Stepper,
  Step,
  StepLabel
} from '@mui/material';
import SmartphoneIcon from '@mui/icons-material/Smartphone';
import AppleIcon from '@mui/icons-material/Apple';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import StorefrontIcon from '@mui/icons-material/Storefront';
import ReceiptIcon from '@mui/icons-material/Receipt';
import SaveIcon from '@mui/icons-material/Save';
import InfoIcon from '@mui/icons-material/Info';
import PaymentIcon from '@mui/icons-material/Payment';

import PaymentPreviewDialog from './components/PaymentPreviewDialog';
import ReceiptPreviewDialog from './components/ReceiptPreviewDialog';

// Define the type for payment settings
type PaymentMethod = 'cash_only' | 'cash_and_online' | 'online_only';

export default function PaymentSettingsPage() {
  const { user } = useAuth();
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash_only');
  const [stripeConnected, setStripeConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchParams] = useSearchParams();

  // New Settings State
  const [otherPaymentMethods, setOtherPaymentMethods] = useState({
    enabled: true, // Default to true for "Pay in Person" concept
    message: ''
  });

  // Guidance Message State (formerly Other Payment Methods)
  const [guidanceMessage, setGuidanceMessage] = useState({
    enabled: false,
    message: ''
  });

  // Receipt Settings State
  const [emailReceipt, setEmailReceipt] = useState({ enabled: true });
  const [storeName, setStoreName] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');

  const [previewOpen, setPreviewOpen] = useState(false);
  const [receiptPreviewOpen, setReceiptPreviewOpen] = useState(false);

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
          // Load other payment methods settings (now used for Pay in Person subtext)
          if (data.otherPaymentMethods) {
            setOtherPaymentMethods(data.otherPaymentMethods);
          }
          // Load guidance message settings
          if (data.guidanceMessage) {
            setGuidanceMessage(data.guidanceMessage);
          }
          // Load email receipt settings
          if (data.emailReceipt) {
            setEmailReceipt(data.emailReceipt);
          }
          // Load store profile info
          if (data.storeName) {
            setStoreName(data.storeName);
          }
          if (data.invoiceNumber) {
            setInvoiceNumber(data.invoiceNumber);
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
      setStripeConnected(true);
    }
  }, [searchParams]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    setError(null);
    try {
      const storeRef = doc(db, 'stores', user.uid);
      await updateDoc(storeRef, {
        paymentMethod,
        otherPaymentMethods,
        guidanceMessage,
        emailReceipt,
        storeName,
        invoiceNumber
      });
      alert('設定を保存しました');
    } catch (err) {
      console.error("Error updating settings:", err);
      setError("設定の保存に失敗しました。");
    } finally {
      setSaving(false);
    }
  };

  const handlePaymentMethodChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setPaymentMethod(event.target.value as PaymentMethod);
  };

  const handleStripeConnect = async () => {
    setLoading(true);
    setError(null);
    try {
      const functions = getFunctions();
      const createStripeAccountLink = httpsCallable(functions, 'createStripeAccountLink');
      const baseUrl = window.location.origin;
      const result = await createStripeAccountLink({ baseUrl });
      const { url } = result.data as { url: string };
      window.location.href = url;
    } catch (err) {
      console.error("Error connecting to Stripe:", err);
      setError("Stripeとの連携に失敗しました。もう一度お試しください。");
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="md" sx={{ pb: 8 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          決済・レシート設定
        </Typography>
        <Button
          variant="contained"
          size="large"
          startIcon={<SaveIcon />}
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? '保存中...' : '設定を保存'}
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {/* ==================================================================================
          SECTION 1: 決済画面の設定
      ================================================================================== */}
      <Typography variant="h5" sx={{ mt: 4, mb: 2, display: 'flex', alignItems: 'center', gap: 1, fontWeight: 'bold', color: 'primary.main' }}>
        <PaymentIcon /> 決済画面の設定
      </Typography>
      <Divider sx={{ mb: 3 }} />

      {/* 1. 基本設定 */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>基本設定</Typography>
        <FormControl component="fieldset">
          <RadioGroup
            value={paymentMethod}
            onChange={handlePaymentMethodChange}
          >
            <FormControlLabel value="cash_only" control={<Radio />} label="対面支払いのみ" />
            <FormControlLabel value="online_only" control={<Radio />} label="アプリ内決済のみ" />
            <FormControlLabel value="cash_and_online" control={<Radio />} label="両方対応（推奨）" />
          </RadioGroup>
        </FormControl>

        {(paymentMethod !== 'cash_only') && (
          <Box sx={{ mt: 2, bgcolor: 'action.hover', p: 2, borderRadius: 1 }}>
            <Typography variant="subtitle2" gutterBottom>📱 アプリ内決済で対応する支払い方法：</Typography>
            <List dense>
              <ListItem>
                <ListItemIcon><AppleIcon /></ListItemIcon>
                <ListItemText primary="Apple Pay" secondary="iPhone/Macのお客様に自動表示" />
              </ListItem>
              <ListItem>
                <ListItemIcon><SmartphoneIcon /></ListItemIcon>
                <ListItemText primary="Google Pay" secondary="Android/Chromeのお客様に自動表示" />
              </ListItem>
              <ListItem>
                <ListItemIcon><CreditCardIcon /></ListItemIcon>
                <ListItemText primary="クレジットカード" secondary="Visa, Mastercard, Amex, JCBなど" />
              </ListItem>
            </List>
            <Alert severity="info" sx={{ mt: 1 }}>
              これらの支払い方法は、お客様のデバイス環境に応じて自動的に表示/非表示が切り替わります。設定は不要です。
            </Alert>
          </Box>
        )}
      </Paper>

      {/* 対面支払い設定 */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <StorefrontIcon /> 対面支払い（現金・その他）の設定
        </Typography>
        <Divider sx={{ my: 2 }} />

        <Alert severity="info" sx={{ mb: 3 }}>
          「対面で支払う」ボタンのサブテキスト（補足説明）を設定できます。<br />
          お店で対応している決済方法（PayPay、LINE Payなど）を入力してください。
        </Alert>

        <Box sx={{ mb: 3 }}>
          <TextField
            fullWidth
            label="サブテキスト（支払い方法の案内）"
            placeholder="例：現金、PayPayでのお支払いはこちら"
            value={otherPaymentMethods.message}
            onChange={(e) => setOtherPaymentMethods(prev => ({ ...prev, message: e.target.value }))}
            helperText="ボタンの下に表示されます。空欄の場合は「現金、PayPayでのお支払いはこちら」と表示されます。"
          />
        </Box>
      </Paper>

      {/* お客様へのメッセージ設定 */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <InfoIcon /> お客様へのメッセージ設定
        </Typography>
        <Divider sx={{ my: 2 }} />

        <Alert severity="info" sx={{ mb: 3 }}>
          支払い選択画面の一番下に表示するメッセージを設定できます。<br />
          「操作が分からない場合はスタッフにお声がけください」などの案内にご利用ください。
        </Alert>

        <FormControlLabel
          control={
            <Switch
              checked={guidanceMessage.enabled}
              onChange={(e) => setGuidanceMessage(prev => ({ ...prev, enabled: e.target.checked }))}
            />
          }
          label="メッセージを表示する"
        />

        {guidanceMessage.enabled && (
          <Box sx={{ mt: 2, ml: 4 }}>
            <TextField
              fullWidth
              label="メッセージ内容"
              placeholder="例：操作が分からない場合は、遠慮なくスタッフにお声がけください！"
              value={guidanceMessage.message}
              onChange={(e) => setGuidanceMessage(prev => ({ ...prev, message: e.target.value }))}
              multiline
              rows={2}
            />
          </Box>
        )}
      </Paper>

      {/* 決済画面プレビューボタン */}
      <Box sx={{ display: 'flex', justifyContent: 'center', mb: 6 }}>
        <Button
          variant="outlined"
          size="large"
          startIcon={<SmartphoneIcon />}
          onClick={() => setPreviewOpen(true)}
          sx={{ px: 4, py: 1.5 }}
        >
          決済画面のプレビューを確認
        </Button>
      </Box>


      {/* ==================================================================================
          SECTION 2: レシートの設定
      ================================================================================== */}
      <Typography variant="h5" sx={{ mt: 6, mb: 2, display: 'flex', alignItems: 'center', gap: 1, fontWeight: 'bold', color: 'primary.main' }}>
        <ReceiptIcon /> レシートの設定
      </Typography>
      <Divider sx={{ mb: 3 }} />

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          レシート機能
        </Typography>
        <FormControlLabel
          control={
            <Switch
              checked={emailReceipt.enabled}
              onChange={(e) => setEmailReceipt(prev => ({ ...prev, enabled: e.target.checked }))}
            />
          }
          label="レシート機能を有効にする"
        />
        <Typography variant="body2" color="text.secondary" sx={{ ml: 4, mt: 1 }}>
          有効にすると、お客様が支払い完了後にレシート画像の保存やメール送信ができるようになります。
        </Typography>
      </Paper>

      {emailReceipt.enabled && (
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            店舗情報・インボイス設定
          </Typography>
          <Divider sx={{ my: 2 }} />
          <Alert severity="info" sx={{ mb: 3 }}>
            レシートメールに記載される情報を設定します。<br />
            インボイス制度に対応した「適格簡易請求書」として発行する場合は、登録番号を入力してください。
          </Alert>

          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="店舗名（レシート表示用）"
                placeholder="例：Marche Coffee"
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                helperText="空欄の場合は「Marche App」と表示されます。"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="インボイス登録番号"
                placeholder="例：T1234567890123"
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
                helperText="Tから始まる13桁の番号を入力してください。空欄の場合は表示されません。"
              />
            </Grid>
          </Grid>
        </Paper>
      )}

      {/* レシートプレビューボタン */}
      {emailReceipt.enabled && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 6 }}>
          <Button
            variant="outlined"
            size="large"
            startIcon={<ReceiptIcon />}
            onClick={() => setReceiptPreviewOpen(true)}
            sx={{ px: 4, py: 1.5 }}
          >
            レシートのプレビューを確認
          </Button>
        </Box>
      )}


      {/* ==================================================================================
          SECTION 3: Stripe連携 (システム設定)
      ================================================================================== */}
      <Typography variant="h5" sx={{ mt: 6, mb: 2, display: 'flex', alignItems: 'center', gap: 1, fontWeight: 'bold', color: 'text.secondary' }}>
        システム設定
      </Typography>
      <Divider sx={{ mb: 3 }} />

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Stripeアカウント連携
        </Typography>

        {stripeConnected ? (
          <Box>
            <Typography color="green" gutterBottom sx={{ fontWeight: 'bold' }}>
              ✓ Stripeアカウントと連携済みです
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              アプリ内決済（クレジットカード、Apple Pay、Google Pay）が利用可能です。
            </Typography>
            <Button
              variant="outlined"
              color="error"
              size="small"
              onClick={async () => {
                if (!window.confirm('本当に連携を解除しますか？\n解除すると、アプリ内決済が利用できなくなります。')) return;
                setLoading(true);
                try {
                  const storeRef = doc(db, 'stores', user!.uid);
                  await updateDoc(storeRef, {
                    stripeAccountId: deleteField()
                  });
                  setStripeConnected(false);
                } catch (err) {
                  console.error(err);
                  alert('解除に失敗しました');
                } finally {
                  setLoading(false);
                }
              }}
              disabled={loading}
            >
              連携を解除
            </Button>
          </Box>
        ) : (
          <Box>
            <Alert severity="info" sx={{ mb: 3 }}>
              アプリ内決済を利用するには、Stripeアカウントの連携が必要です。<br />
              以下の手順で設定を行います。
            </Alert>

            <Box sx={{ width: '100%', mb: 4 }}>
              <Stepper activeStep={0} alternativeLabel>
                <Step>
                  <StepLabel>連携ボタンを押す</StepLabel>
                </Step>
                <Step>
                  <StepLabel>Stripeの画面で<br />口座情報などを入力</StepLabel>
                </Step>
                <Step>
                  <StepLabel>アプリに戻って<br />連携完了！</StepLabel>
                </Step>
              </Stepper>
            </Box>

            <Box sx={{ textAlign: 'center' }}>
              <Button
                variant="contained"
                size="large"
                onClick={handleStripeConnect}
                disabled={loading}
                sx={{ px: 4, py: 1.5, fontWeight: 'bold' }}
              >
                {loading ? <CircularProgress size={24} color="inherit" /> : 'Stripeアカウントを連携する'}
              </Button>
              <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 1 }}>
                ※ Stripeのサイトへ移動します
              </Typography>
            </Box>
          </Box>
        )}
      </Paper>

      {/* 画面下部の保存ボタン（念のため） */}
      <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end' }}>
        <Button
          variant="contained"
          size="large"
          startIcon={<SaveIcon />}
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? '保存中...' : '設定を保存'}
        </Button>
      </Box>

      {/* ==================================================================================
          DIALOGS
      ================================================================================== */}

      <PaymentPreviewDialog
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        otherPaymentMethods={otherPaymentMethods}
        guidanceMessage={guidanceMessage}
      />

      <ReceiptPreviewDialog
        open={receiptPreviewOpen}
        onClose={() => setReceiptPreviewOpen(false)}
        storeName={storeName}
        invoiceNumber={invoiceNumber}
      />

    </Container>
  );
}
