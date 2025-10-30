
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

  const handleDownload = () => {
    const svgElement = document.getElementById('qr-code-svg');
    if (!svgElement) {
      console.error('Could not find SVG element for QR code.');
      return;
    }

    const svgXml = new XMLSerializer().serializeToString(svgElement);
    const dataUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(
      svgXml,
    )}`;

    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const size = 256; // Based on the QRCode size prop
      const scale = 2; // Render at 2x resolution for better quality
      canvas.width = size * scale;
      canvas.height = size * scale;
      const ctx = canvas.getContext('2d');

      if (ctx) {
        // Fill background with white, as transparent PNGs can be problematic for QR codes
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        const pngUrl = canvas.toDataURL('image/png');
        const downloadLink = document.createElement('a');
        downloadLink.href = pngUrl;
        downloadLink.download = 'qr-code.png';
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
      }
    };
    img.src = dataUrl;
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>お客様用メニューQRコード</DialogTitle>
      <DialogContent sx={{ textAlign: 'center' }}>
        <Box sx={{ my: 2 }}>
          <QRCode
            id="qr-code-svg" // Add id for easy DOM selection
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
        <Button onClick={handleDownload} color="primary">
          PNGでダウンロード
        </Button>
        <Button onClick={onClose}>閉じる</Button>
      </DialogActions>
    </Dialog>
  );
}
