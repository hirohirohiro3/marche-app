import {
    Dialog,
    DialogTitle,
    DialogContent,
    Box,
    Typography,
    IconButton,
    Container,
    Paper,
    Stack,
    Alert
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import StorefrontIcon from '@mui/icons-material/Storefront';
import AppleIcon from '@mui/icons-material/Apple';
import SmartphoneIcon from '@mui/icons-material/Smartphone';
import CreditCardIcon from '@mui/icons-material/CreditCard';

interface PaymentPreviewDialogProps {
    open: boolean;
    onClose: () => void;
    otherPaymentMethods: {
        message: string;
    };
    guidanceMessage: {
        enabled: boolean;
        message: string;
    };
}

export default function PaymentPreviewDialog({
    open,
    onClose,
    otherPaymentMethods,
    guidanceMessage
}: PaymentPreviewDialogProps) {
    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="xs"
            fullWidth
            PaperProps={{
                sx: {
                    borderRadius: 4,
                    bgcolor: 'background.default',
                    overflow: 'hidden'
                }
            }}
        >
            <DialogTitle sx={{ bgcolor: 'background.paper', borderBottom: 1, borderColor: 'divider' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Typography variant="subtitle1" fontWeight="bold">決済画面プレビュー</Typography>
                    <IconButton onClick={onClose} size="small">
                        <CloseIcon />
                    </IconButton>
                </Box>
            </DialogTitle>
            <DialogContent sx={{ p: 2, bgcolor: 'background.default' }}>
                {/* 実際の画面構成を模したプレビュー */}
                <Container maxWidth="xs" sx={{ p: 0 }}>
                    <Typography variant="h6" component="h1" gutterBottom align="center" sx={{ fontWeight: 'bold', mb: 3, mt: 2 }}>
                        お支払い方法の選択
                    </Typography>

                    {/* 注文概要（ダミー） */}
                    <Paper sx={{ p: 4, mb: 3, borderRadius: 3, textAlign: 'center', bgcolor: 'action.hover' }}>
                        <Typography variant="subtitle1" color="text.secondary" gutterBottom>
                            お支払い金額
                        </Typography>
                        <Typography variant="h3" component="div" sx={{ fontWeight: 'bold', color: 'primary.main', my: 1 }}>
                            ¥1,500
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                            注文番号: #123
                        </Typography>
                    </Paper>

                    <Stack spacing={2}>
                        {/* 対面支払いボタン（プレビュー） */}
                        <Paper
                            elevation={0}
                            sx={{
                                p: 2,
                                border: '2px solid',
                                borderColor: 'primary.main', // 選択されている想定
                                borderRadius: 3,
                                bgcolor: 'action.hover',
                                display: 'flex',
                                alignItems: 'center'
                            }}
                        >
                            <Box sx={{
                                width: 48, height: 48,
                                borderRadius: '50%',
                                bgcolor: 'action.selected',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                mr: 2,
                                flexShrink: 0
                            }}>
                                <StorefrontIcon color="action" fontSize="large" />
                            </Box>
                            <Box>
                                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>対面で支払う</Typography>
                                <Typography variant="body2" sx={{ color: 'text.primary', fontWeight: 500 }}>
                                    {otherPaymentMethods.message || '現金、PayPayでのお支払いはこちら'}
                                </Typography>
                            </Box>
                        </Paper>

                        {/* Apple Pay (プレビュー) */}
                        <Paper
                            elevation={0}
                            sx={{
                                p: 2,
                                border: '2px solid',
                                borderColor: 'divider',
                                borderRadius: 3,
                                display: 'flex', alignItems: 'center',
                                bgcolor: 'background.paper'
                            }}
                        >
                            <Box sx={{
                                width: 48, height: 48,
                                borderRadius: '50%',
                                bgcolor: 'action.selected',
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

                        {/* Google Pay (プレビュー) */}
                        <Paper
                            elevation={0}
                            sx={{
                                p: 2,
                                border: '2px solid',
                                borderColor: 'divider',
                                borderRadius: 3,
                                display: 'flex', alignItems: 'center',
                                bgcolor: 'background.paper'
                            }}
                        >
                            <Box sx={{
                                width: 48, height: 48,
                                borderRadius: '50%',
                                bgcolor: 'action.selected',
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

                        {/* クレジットカード（プレビュー用ダミー） */}
                        <Paper
                            elevation={0}
                            sx={{
                                p: 2,
                                border: '2px solid',
                                borderColor: 'divider',
                                borderRadius: 3,
                                display: 'flex',
                                alignItems: 'center',
                                bgcolor: 'background.paper'
                            }}
                        >
                            <Box sx={{
                                width: 48, height: 48,
                                borderRadius: '50%',
                                bgcolor: '#e0e6ff',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                mr: 2
                            }}>
                                <CreditCardIcon sx={{ color: '#6772e5' }} fontSize="large" />
                            </Box>
                            <Box>
                                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>クレジットカード</Typography>
                                <Typography variant="body2" sx={{ color: 'text.primary', fontWeight: 500 }}>Visa, Master, Amex, JCB</Typography>
                            </Box>
                        </Paper>
                    </Stack>

                    {/* メッセージプレビュー */}
                    {guidanceMessage.enabled && (
                        <Box sx={{ mt: 4 }}>
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
                                    {guidanceMessage.message || 'メッセージ内容'}
                                </Typography>
                            </Alert>
                        </Box>
                    )}
                </Container>
            </DialogContent>
        </Dialog>
    );
}
