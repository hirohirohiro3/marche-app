
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Link,
  Typography,
} from '@mui/material';
import { QRCodeSVG as QRCode } from 'qrcode.react';

interface QrCodeModalProps {
  open: boolean;
  onClose: () => void;
}

export default function QrCodeModal({ open, onClose }: QrCodeModalProps) {
  const customerMenuUrl = `${window.location.origin}/menu`;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>お客様用メニューQRコード</DialogTitle>
      <DialogContent sx={{ textAlign: 'center' }}>
        <Box sx={{ my: 2 }}>
          <QRCode
            value={customerMenuUrl}
            size={256}
            style={{ height: 'auto', maxWidth: '100%', width: '100%' }}
          />
        </Box>
        <Typography variant="caption" display="block" gutterBottom>
          上記のQRコードを読み取ってメニューにアクセスしてください。
        </Typography>
        <Link href={customerMenuUrl} target="_blank" rel="noopener noreferrer">
          {customerMenuUrl}
        </Link>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>閉じる</Button>
      </DialogActions>
    </Dialog>
  );
}
