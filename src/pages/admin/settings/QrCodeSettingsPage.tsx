import { useState, useEffect } from 'react';
import {
  Container, Typography, Paper, Button, Box, TextField,
  Grid, CircularProgress, Alert,
} from '@mui/material';
import { useQrCodeSettings } from '../../../hooks/useQrCodeSettings';
import { useForm, Controller, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import ImageCropCompressor from '../../../components/ImageCropCompressor';
import { QRCodeSVG as QRCode } from 'qrcode.react';

// Zod schema now only validates the color, as file is handled by the cropper
const qrSettingsSchema = z.object({
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, '有効なカラーコードを入力してください。'),
});

type QrSettingsForm = z.infer<typeof qrSettingsSchema>;

const colorPalette = ['#000000', '#4a4a4a', '#003366', '#b30000', '#006400', '#4b0082'];

export default function QrCodeSettingsPage() {
  const { settings, loading: hookLoading, saveQrCodeSettings } = useQrCodeSettings();
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [pageError, setPageError] = useState<string | null>(null);
  const [pageSuccess, setPageSuccess] = useState<string | null>(null);
  const [finalPreviewUrl, setFinalPreviewUrl] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    reset,
    watch,
    trigger,
    formState: { errors, isSubmitting },
  } = useForm<QrSettingsForm>({
    resolver: zodResolver(qrSettingsSchema),
    defaultValues: { color: '#000000' },
  });

  const watchColor = watch('color');

  useEffect(() => {
    if (settings) {
      reset({ color: settings.color || '#000000' });
      if (settings.logoUrl) {
        setFinalPreviewUrl(settings.logoUrl);
      }
    }
  }, [settings, reset]);

  const handleCroppedImage = (file: File) => {
    setImageFile(file);
    const previewUrl = URL.createObjectURL(file);
    setFinalPreviewUrl(previewUrl);
  };

  const onSubmit: SubmitHandler<QrSettingsForm> = async (data) => {
    setPageError(null);
    setPageSuccess(null);
    try {
      await saveQrCodeSettings({ color: data.color }, imageFile);
      setPageSuccess('設定を保存しました。');
      setImageFile(null); // Clear file state after saving
    } catch (err) {
      console.error(err);
      setPageError('設定の保存に失敗しました。');
    }
  };

  if (hookLoading) {
    return <CircularProgress />;
  }

  return (
    <Container maxWidth="md">
      <Paper sx={{ p: 3, mt: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          QRコード設定
        </Typography>

        <form onSubmit={handleSubmit(onSubmit)}>
          <Grid container spacing={4}>
            {/* Logo Upload and Preview */}
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>ロゴ画像 (1:1)</Typography>
              <ImageCropCompressor
                aspect={1}
                onCropped={(file) => {
                  handleCroppedImage(file);
                  trigger();
                }}
                initialImageUrl={settings?.logoUrl}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>最終プレビュー</Typography>
              <Box sx={{ position: 'relative', width: 256, height: 256, border: '1px solid #ccc' }}>
                <QRCode
                  value="DUMMY_QR_CODE_DATA" // Dummy data for preview
                  size={256}
                  fgColor={watchColor}
                  level="H" // High error correction for logo
                  imageSettings={finalPreviewUrl ? {
                    src: finalPreviewUrl,
                    x: undefined,
                    y: undefined,
                    height: 80,
                    width: 80,
                    excavate: true,
                  } : undefined}
                />
              </Box>
            </Grid>

            {/* Color Palette */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>QRコードの色</Typography>
              <Controller
                name="color"
                control={control}
                render={({ field }) => (
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    {colorPalette.map((color) => (
                      <Box
                        key={color}
                        onClick={() => field.onChange(color)}
                        sx={{
                          width: 40,
                          height: 40,
                          backgroundColor: color,
                          borderRadius: '50%',
                          cursor: 'pointer',
                          border: field.value === color ? '3px solid' : '1px solid grey',
                          borderColor: 'primary.main',
                        }}
                      />
                    ))}
                  </Box>
                )}
              />
              <Controller
                name="color"
                control={control}
                render={({ field }) => (
                    <TextField
                        {...field}
                        variant="outlined"
                        size="small"
                        sx={{ mt: 2, width: 120 }}
                        error={!!errors.color}
                        helperText={errors.color?.message}
                    />
                )}
              />
            </Grid>

            <Grid item xs={12}>
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? <CircularProgress size={24} /> : '保存する'}
                </Button>
            </Grid>
          </Grid>
        </form>

        {pageError && <Alert severity="error" sx={{ mt: 2 }}>{pageError}</Alert>}
        {pageSuccess && <Alert severity="success" sx={{ mt: 2 }}>{pageSuccess}</Alert>}
      </Paper>
    </Container>
  );
}
