import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Link,
  Typography,
  CircularProgress,
} from '@mui/material';
import { QRCodeSVG as QRCode } from 'qrcode.react';
import { useQrCodeSettings } from '../hooks/useQrCodeSettings';
import { useAuth } from '../hooks/useAuth';

interface QrCodeModalProps {
  open: boolean;
  onClose: () => void;
}

export default function QrCodeModal({ open, onClose }: QrCodeModalProps) {
  const { user } = useAuth();
  const { settings, loading } = useQrCodeSettings();
  const [color, setColor] = useState('#000000');

  const customerMenuUrl = `${window.location.origin}/menu/${user?.uid}`;

  useEffect(() => {
    if (settings) {
      setColor(settings.color || '#000000');
    }
  }, [settings]);

  const handleDownload = async () => {
    const svgElement = document.getElementById('qr-code-svg');
    if (!svgElement) {
      console.error('QR code SVG element not found');
      return;
    }

    // Clone the SVG to avoid modifying the original DOM
    const clonedSvg = svgElement.cloneNode(true) as SVGElement;

    // Handle logo image if it exists
    if (settings?.logoUrl) {
      const imageElement = clonedSvg.querySelector('image');
      if (imageElement) {
        try {
          // Fetch the image and convert to base64
          const response = await fetch(settings.logoUrl);
          const blob = await response.blob();
          const base64 = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.readAsDataURL(blob);
          });

          // Replace the href with the base64 data
          imageElement.setAttribute('href', base64);
        } catch (error) {
          console.warn('Failed to embed logo:', error);
        }
      }
    }

    const svgData = new XMLSerializer().serializeToString(clonedSvg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx?.drawImage(img, 0, 0);

      const pngFile = canvas.toDataURL('image/png');
      const downloadLink = document.createElement('a');
      downloadLink.download = 'qr-code.png';
      downloadLink.href = pngFile;
      downloadLink.click();
    };

    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>お客様用メニューQRコード</DialogTitle>
      <DialogContent>
        <Box sx={{ textAlign: 'center', my: 2, minHeight: 256 }}>
          {loading ? (
            <CircularProgress />
          ) : (
            <QRCode
              id="qr-code-svg"
              value={customerMenuUrl}
              size={256}
              fgColor={color}
              imageSettings={
                settings?.logoUrl
                  ? {
                    src: settings.logoUrl,
                    height: 48,
                    width: 48,
                    excavate: true,
                  }
                  : undefined
              }
              style={{ height: 'auto', maxWidth: '100%', width: '100%' }}
            />
          )}
        </Box>
        <Typography variant="caption" display="block" gutterBottom align="center">
          QRコードを読み取ってメニューにアクセス
        </Typography>
        <Link href={customerMenuUrl} target="_blank" rel="noopener noreferrer" sx={{ display: 'block', textAlign: 'center', mb: 3 }}>
          {customerMenuUrl}
        </Link>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleDownload}>PNGダウンロード</Button>
        <Button onClick={onClose}>閉じる</Button>
      </DialogActions>
    </Dialog>
  );
}
