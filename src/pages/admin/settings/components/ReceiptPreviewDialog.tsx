import {
    Dialog,
    DialogTitle,
    DialogContent,
    Box,
    Typography,
    IconButton,
    Divider,
    List,
    ListItem
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

interface ReceiptPreviewDialogProps {
    open: boolean;
    onClose: () => void;
    storeName: string;
    invoiceNumber: string;
}

export default function ReceiptPreviewDialog({
    open,
    onClose,
    storeName,
    invoiceNumber
}: ReceiptPreviewDialogProps) {
    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="sm"
            fullWidth
            PaperProps={{
                sx: { borderRadius: 2 }
            }}
        >
            <DialogTitle sx={{ borderBottom: '1px solid #eee' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Typography variant="subtitle1" fontWeight="bold">レシートメール（プレビュー）</Typography>
                    <IconButton onClick={onClose} size="small">
                        <CloseIcon />
                    </IconButton>
                </Box>
            </DialogTitle>
            <DialogContent sx={{ p: 4, bgcolor: '#fff' }}>
                {/* メール本文のプレビュー */}
                <Box sx={{ fontFamily: 'sans-serif', maxWidth: '600px', margin: '0 auto', color: '#333' }}>
                    <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>ご注文ありがとうございます</Typography>
                    <Typography variant="body2" paragraph>以下の内容でご注文を承りました。</Typography>

                    <Divider sx={{ my: 2 }} />

                    <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>店舗名: {storeName || 'Marche App'}</Typography>
                    {invoiceNumber && (
                        <Typography variant="body2">登録番号: {invoiceNumber}</Typography>
                    )}
                    <Typography variant="body2">発行日: 2023/10/01</Typography>

                    <Divider sx={{ my: 2 }} />

                    <Typography variant="subtitle2" gutterBottom>注文番号: #123</Typography>
                    <List disablePadding>
                        <ListItem sx={{ px: 0, py: 1, display: 'block' }}>
                            <Typography variant="body1">カフェラテ x 1 - ¥550</Typography>
                            <Box component="ul" sx={{ m: 0, pl: 2, fontSize: '0.9em', color: '#666' }}>
                                <li>サイズ: L (+¥50)</li>
                                <li>トッピング: ホイップ (+¥0)</li>
                            </Box>
                        </ListItem>
                        <ListItem sx={{ px: 0, py: 1, display: 'block' }}>
                            <Typography variant="body1">ドリップバッグ x 1 - ¥600</Typography>
                        </ListItem>
                    </List>

                    <Divider sx={{ my: 2 }} />

                    <Typography variant="h6" align="right" sx={{ fontWeight: 'bold' }}>合計金額: ¥1,150 (税込)</Typography>
                    <Typography variant="caption" display="block" align="right" color="text.secondary">
                        (内消費税等(10%): ¥104)
                    </Typography>

                    <Typography variant="body2" sx={{ mt: 3 }}>またのご利用をお待ちしております。</Typography>
                </Box>
            </DialogContent>
        </Dialog>
    );
}
