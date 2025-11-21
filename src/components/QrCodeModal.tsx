import { useState, useEffect, useRef } from 'react';
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
  TextField,
  Grid,
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
  const { settings, loading, saveQrCodeSettings } = useQrCodeSettings();
  const [color, setColor] = useState('#000000');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const customerMenuUrl = `${window.location.origin}/menu/${user?.uid}`;

  // Update local state when settings are fetched
  useEffect(() => {
    if (settings) {
      setColor(settings.color || '#000000');
    }
  }, [settings]);


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

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setImageFile(event.target.files[0]);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await saveQrCodeSettings({
        color,
        logoFile: imageFile,
      });
      setImageFile(null);
    } catch (error) {
      console.error("Failed to save settings:", error);
      // Add user-facing error notification here
    } finally {
      setIsSaving(false);
    }
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
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6}>
            <TextField
              label="QRコードの色"
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              fullWidth
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <Button variant="outlined" component="label" fullWidth>
              ロゴ画像を選択
              <input
                type="file"
                hidden
                accept="image/png, image/jpeg"
                onChange={handleFileChange}
                ref={fileInputRef}
              />
            </Button>
            {imageFile && (
              <Typography variant="caption" display="block" sx={{ mt: 1, textAlign: 'center' }}>
                選択中: {imageFile.name}
              </Typography>
            )}
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleDownload}>PNGダウンロード</Button>
        <Button onClick={handleSave} variant="contained" disabled={isSaving}>
          {isSaving ? <CircularProgress size={24} /> : '設定を保存'}
        </Button>
        <Button onClick={onClose}>閉じる</Button>
      </DialogActions>
    </Dialog>
  );
}
