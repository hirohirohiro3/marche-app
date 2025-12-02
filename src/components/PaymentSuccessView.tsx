import { useState, useEffect, useRef } from 'react';
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
import SendIcon from '@mui/icons-material/Send';
import ReceiptIcon from '@mui/icons-material/Receipt';
import EmailIcon from '@mui/icons-material/Email';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import DownloadIcon from '@mui/icons-material/Download';
import { doc, getDoc } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import html2canvas from 'html2canvas';
import { db } from '../firebase';
import { ReceiptTemplate } from './ReceiptTemplate';

interface PaymentSuccessViewProps {
    message: string;
    orderNumber: number | null;
    orderId: string | null;
}

export function PaymentSuccessView({ message, orderNumber, orderId }: PaymentSuccessViewProps) {
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
                            if (sData.emailReceipt?.enabled !== false) {
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
