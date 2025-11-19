import { useState, useEffect } from 'react';
import {
  Container, Typography, Paper, Button, Box, TextField,
  Grid, CircularProgress, Alert,
} from '@mui/material';
import {
  useQrCodeSettings,
  qrSettingsSchema,
  QrSettingsFormValues,
} from '../../../hooks/useQrCodeSettings';
import { useForm, Controller, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { QRCodeSVG as QRCode } from 'qrcode.react';

const colorPalette = ['#000000', '#4a4a4a', '#003366', '#b30000', '#006400', '#4b0082'];

export default function QrCodeSettingsPage() {
  const { settings, loading: hookLoading, saveQrCodeSettings } = useQrCodeSettings();
  const [pageError, setPageError] = useState<string | null>(null);
  const [pageSuccess, setPageSuccess] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting, isValid },
  } = useForm<QrSettingsFormValues>({
    resolver: zodResolver(qrSettingsSchema),
    mode: 'onChange',
    defaultValues: {
      color: '#000000',
      // logoFile: null, // Temporarily disabled
      // logoUrl: null, // Temporarily disabled
    },
  });

  const watchColor = watch('color');
  // const watchLogoUrl = watch('logoUrl');


  useEffect(() => {
    if (settings) {
      reset({
        color: settings.color || '#000000',
        // logoUrl: settings.logoUrl || null, // Temporarily disabled
        // logoFile: null, // Temporarily disabled
      });
    }
  }, [settings, reset]);

  const onSubmit: SubmitHandler<QrSettingsFormValues> = async (data) => {
    console.log('[QrCodeSettingsPage] onSubmit started.', data);
    setPageError(null);
    setPageSuccess(null);
    try {
      console.log('[QrCodeSettingsPage] Calling saveQrCodeSettings...');
      await saveQrCodeSettings(data);
      console.log('[QrCodeSettingsPage] saveQrCodeSettings finished.');
      setPageSuccess('設定を保存しました。');
      // After successful save, reset the file input in the form state
      // setValue('logoFile', null, { shouldValidate: true }); // Temporarily disabled
    } catch (err) {
      console.error('[QrCodeSettingsPage] Failed to save settings:', err);
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
            {/* Logo Upload and Preview - Temporarily Disabled
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>ロゴ画像 (1:1)</Typography>
              <ImageCropCompressor
                aspect={1}
                onCropped={async (file) => {
                  setValue('logoFile', file, { shouldDirty: true });
                  await trigger('logoFile');
                }}
                initialImageUrl={watchLogoUrl}
              />
            </Grid>
            */}

            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>最終プレビュー</Typography>
              <Box sx={{ position: 'relative', width: 256, height: 256, border: '1px solid #ccc' }}>
                <QRCode
                  value={`https://yourapp.com/menu/${settings ? 'your-store-id' : 'preview'}`} // Use a real URL structure
                  size={256}
                  fgColor={watchColor}
                  level="H" // High error correction for logo
                  // imageSettings={watchLogoUrl ? { // Temporarily disabled
                  //   src: watchLogoUrl,
                  //   x: undefined,
                  //   y: undefined,
                  //   height: 80,
                  //   width: 80,
                  //   excavate: true,
                  // } : undefined}
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
                  disabled={!isValid || isSubmitting}
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
