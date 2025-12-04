import { useState, useEffect } from 'react';
import {
  Container, Typography, Paper, Button, Box, TextField,
  Grid, CircularProgress, Alert,
} from '@mui/material';
import ImageCropCompressor from '../../../components/ImageCropCompressor';
import {
  useQrCodeSettings,
  qrSettingsSchema,
  QrSettingsFormValues,
} from '../../../hooks/useQrCodeSettings';
import { useForm, Controller, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { QRCodeSVG as QRCode } from 'qrcode.react';
import { ChromePicker } from 'react-color';
import HelpSection from '../../../components/HelpSection';

const colorPalette = ['#000000', '#4a4a4a', '#003366', '#b30000', '#006400', '#4b0082'];

export default function QrCodeSettingsPage() {
  const { settings, loading: hookLoading, saveQrCodeSettings } = useQrCodeSettings();
  const [pageError, setPageError] = useState<string | null>(null);
  const [pageSuccess, setPageSuccess] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const [resetKey, setResetKey] = useState(0);

  const {
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    trigger,
    formState: { errors, isSubmitting, isValid },
  } = useForm<QrSettingsFormValues>({
    resolver: zodResolver(qrSettingsSchema),
    mode: 'onChange',
    defaultValues: {
      color: '#000000',
      logoFile: null,
    },
  });

  const watchColor = watch('color');
  const watchLogoFile = watch('logoFile');

  useEffect(() => {
    if (watchLogoFile) {
      const url = URL.createObjectURL(watchLogoFile);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setPreviewUrl(null);
    }
  }, [watchLogoFile]);

  useEffect(() => {
    if (settings) {
      reset({
        color: settings.color,
        logoFile: null, // Reset file input
      });
    }
  }, [settings, reset]);

  const onSubmit: SubmitHandler<QrSettingsFormValues> = async (data) => {
    setPageError(null);
    setPageSuccess(null);
    try {
      await saveQrCodeSettings(data);
      setPageSuccess('QRコード設定を保存しました。');
    } catch (err: any) {
      console.error(err);
      setPageError('設定の保存に失敗しました。');
    }
  };

  const downloadQrCodeAsSVG = () => {
    const svg = document.getElementById('qr-code-svg');
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'qrcode.svg';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadQrCodeAsPNG = () => {
    const svg = document.getElementById('qr-code-svg');
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    // Set canvas size (larger for better quality)
    canvas.width = 1024;
    canvas.height = 1024;

    img.onload = () => {
      if (ctx) {
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const pngFile = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.download = 'qrcode.png';
        link.href = pngFile;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    };

    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  };

  if (hookLoading) {
    return <CircularProgress />;
  }

  return (
    <Container maxWidth="md">
      <HelpSection title="QRコード設定について">
        <Box sx={{ '& h3': { fontSize: '1rem', fontWeight: 'bold', mt: 2, mb: 1 }, '& p': { mb: 1 }, '& ul': { pl: 3 } }}>
          <Typography variant="body2" paragraph>
            お客さまが読み取る注文用QRコードのデザインをカスタマイズできます。
          </Typography>

          <h3>QRコードのダウンロード方法</h3>
          <ol style={{ paddingLeft: '1.5rem' }}>
            <li>下のプレビューで色やロゴを調整</li>
            <li>「SVGでダウンロード」または「PNGでダウンロード」をクリック</li>
            <li>イラストレーター、Canvaなどで装飾して印刷</li>
          </ol>

          <h3>ファイル形式の選び方</h3>
          <ul>
            <li>
              <strong>SVG形式（推奨）</strong><br />
              拡大しても画質が劣化しないベクター形式です。イラストレーターなどで編集する場合に最適です。
            </li>
            <li>
              <strong>PNG形式</strong><br />
              一般的な画像形式です。CanvaやWordなどで手軽に使いたい場合におすすめです。
            </li>
          </ul>

          <h3>カスタマイズのヒント</h3>
          <ul>
            <li><strong>色設定</strong>: ブランドカラーに合わせて変更できます。<br />
              <Typography variant="caption" color="text.secondary">⚠️ 薄い色（黄色やピンク）は読み取りにくいので、濃い色（黒、紺、茶色など）がおすすめです。</Typography>
            </li>
            <li><strong>ロゴ設定</strong>: QRコードの中央にお店のロゴを配置できます。<br />
              <Typography variant="caption" color="text.secondary">推奨サイズ: 200×200px以上の正方形の画像</Typography>
            </li>
          </ul>
        </Box>
      </HelpSection>

      <Paper sx={{ p: 3, mt: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          QRコード設定
        </Typography>

        <form onSubmit={handleSubmit(onSubmit)}>
          <Grid container spacing={4}>
            {/* Left Column: Logo & Preview */}
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>ロゴ画像 (1:1)</Typography>
              <Box sx={{ mb: 2 }}>
                <ImageCropCompressor
                  key={`${settings?.logoUrl || 'no-image'}-${resetKey}`}
                  aspect={1}
                  onCropped={async (file) => {
                    setValue('logoFile', file, { shouldDirty: true });
                    await trigger('logoFile');
                  }}
                  initialImageUrl={settings?.logoUrl}
                />
                {(watchLogoFile || settings?.logoUrl) && (
                  <Button
                    variant="outlined"
                    color="error"
                    onClick={() => {
                      setValue('logoFile', null, { shouldDirty: true });
                      setPreviewUrl(null);
                      setResetKey(prev => prev + 1);
                    }}
                    sx={{ mt: 2 }}
                  >
                    画像を削除
                  </Button>
                )}
              </Box>

              <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>最終プレビュー</Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                <Box sx={{
                  width: '100%',
                  maxWidth: 320,
                  aspectRatio: '1/1',
                  border: '1px solid #ccc',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  bgcolor: 'white',
                  p: 2
                }}>
                  <QRCode
                    id="qr-code-svg"
                    value={`https://yourapp.com/menu/${settings ? 'your-store-id' : 'preview'}`}
                    size={280}
                    fgColor={watchColor}
                    level="H"
                    imageSettings={(previewUrl || settings?.logoUrl) ? {
                      src: previewUrl || settings?.logoUrl || '',
                      x: undefined,
                      y: undefined,
                      height: 80,
                      width: 80,
                      excavate: true,
                    } : undefined}
                  />
                </Box>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Button variant="outlined" onClick={downloadQrCodeAsSVG}>
                    SVGで保存
                  </Button>
                  <Button variant="outlined" onClick={downloadQrCodeAsPNG}>
                    PNGで保存
                  </Button>
                </Box>
              </Box>
            </Grid>

            {/* Right Column: Color Picker */}
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>QRコードの色</Typography>
              <Controller
                name="color"
                control={control}
                render={({ field }) => (
                  <Box>
                    {/* Main Color Picker (Always Visible & Large) */}
                    <Box sx={{ mb: 4 }}>
                      <ChromePicker
                        color={field.value}
                        onChange={(color) => field.onChange(color.hex)}
                        disableAlpha={true}
                        styles={{
                          default: {
                            picker: {
                              width: '100%',
                              boxShadow: 'none',
                              border: '1px solid #e0e0e0',
                              borderRadius: '8px',
                            },
                          },
                        }}
                      />
                      <TextField
                        {...field}
                        variant="outlined"
                        size="small"
                        label="カラーコード"
                        sx={{ mt: 2, width: '100%' }}
                        error={!!errors.color}
                        helperText={errors.color?.message}
                      />
                    </Box>

                    {/* Quick Preset Colors (Subtle) */}
                    <Box>
                      <Typography variant="caption" color="text.secondary" gutterBottom display="block">
                        プリセットから選ぶ
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                        {colorPalette.map((color) => (
                          <Box
                            key={color}
                            onClick={() => field.onChange(color)}
                            sx={{
                              width: 32,
                              height: 32,
                              backgroundColor: color,
                              borderRadius: '50%',
                              cursor: 'pointer',
                              border: field.value === color ? '2px solid' : '1px solid #e0e0e0',
                              borderColor: field.value === color ? 'primary.main' : '#e0e0e0',
                              boxShadow: field.value === color ? 2 : 0,
                              transition: 'all 0.2s',
                              '&:hover': {
                                transform: 'scale(1.1)',
                              }
                            }}
                          />
                        ))}
                      </Box>
                    </Box>
                  </Box>
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
