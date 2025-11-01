import { useState, useEffect } from 'react';
import {
  Container, Typography, Paper, Button, Box, TextField,
  Grid, Avatar, CircularProgress, Alert, FormControl, FormHelperText,
} from '@mui/material';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../../firebase';
import { useAuth } from '../../../hooks/useAuth';
import { useForm, Controller, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

// Zod schema for form validation
const qrSettingsSchema = z.object({
  logoFile: z.any() // Optional file upload
    .refine((files) => !files || files.length === 0 || files[0]?.size <= 1024 * 1024, {
      message: 'ファイルサイズは1MB以下にしてください。',
    })
    .refine((files) => !files || files.length === 0 || ['image/jpeg', 'image/png'].includes(files[0]?.type), {
      message: 'JPEGまたはPNG形式の画像を選択してください。',
    }),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, '有効なカラーコードを入力してください。'),
});

type QrSettingsForm = z.infer<typeof qrSettingsSchema>;

const colorPalette = [
  '#000000', // Black
  '#4a4a4a', // Dark Gray
  '#003366', // Dark Blue
  '#b30000', // Dark Red
  '#006400', // Dark Green
  '#4b0082', // Indigo
];

export default function QrCodeSettingsPage() {
  const { user } = useAuth();
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(true); // Start with loading true
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    reset, // Use reset to set form values
    formState: { errors, isSubmitting },
  } = useForm<QrSettingsForm>({
    resolver: zodResolver(qrSettingsSchema),
    defaultValues: {
      color: '#000000',
      logoFile: null,
    },
  });

  const logoFile = watch('logoFile');

  // Effect to load existing settings
  useEffect(() => {
    const fetchSettings = async () => {
      if (!user) return;
      try {
        const storeRef = doc(db, 'stores', user.uid);
        const storeDoc = await getDoc(storeRef);
        if (storeDoc.exists()) {
          const settings = storeDoc.data()?.qrCodeSettings;
          if (settings) {
            reset({ color: settings.color || '#000000' });
            if (settings.logoUrl) {
              setPreview(settings.logoUrl);
            }
          }
        }
      } catch (err) {
        setError('設定の読み込みに失敗しました。');
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, [user, reset]);

  // Effect to update preview from file input
  useEffect(() => {
    if (logoFile && logoFile.length > 0) {
      const file = logoFile[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
    // Note: We don't clear the preview if the file is removed,
    // to allow users to see the previously saved logo.
  }, [logoFile]);

  const onSubmit: SubmitHandler<QrSettingsForm> = async (data) => {
    if (!user) {
      setError('ユーザー認証が必要です。');
      return;
    }
    setError(null);
    setSuccess(null);

    try {
      const storage = getStorage();
      let logoUrl = preview; // Start with the existing preview URL

      // 1. If a new file is uploaded, upload it to Storage
      if (data.logoFile && data.logoFile.length > 0) {
        const file = data.logoFile[0];
        const storageRef = ref(storage, `stores/${user.uid}/qr_logo.png`);
        await uploadBytes(storageRef, file);
        logoUrl = await getDownloadURL(storageRef);
      }

      // 2. Save the settings to Firestore
      const storeRef = doc(db, 'stores', user.uid);
      await setDoc(storeRef, {
        qrCodeSettings: {
          logoUrl: logoUrl,
          color: data.color,
        }
      }, { merge: true }); // Use merge to avoid overwriting other store data

      setSuccess('設定を保存しました。');
    } catch (err) {
      console.error(err);
      setError('設定の保存に失敗しました。');
    }
  };

  return (
    <Container maxWidth="md">
      <Paper sx={{ p: 3, mt: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          QRコード設定
        </Typography>

        <form onSubmit={handleSubmit(onSubmit)}>
          <Grid container spacing={3}>
            {/* Logo Upload */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>ロゴ画像</Typography>
              <FormControl fullWidth error={!!errors.logoFile}>
                <Controller
                  name="logoFile"
                  control={control}
                  render={({ field }) => (
                    <Button
                      variant="contained"
                      component="label"
                    >
                      ファイルを選択
                      <input
                        type="file"
                        hidden
                        accept="image/jpeg,image/png"
                        onChange={(e) => field.onChange(e.target.files)}
                      />
                    </Button>
                  )}
                />
                {preview && <Avatar src={preview} sx={{ width: 100, height: 100, mt: 2 }} />}
                <FormHelperText>{errors.logoFile?.message}</FormHelperText>
              </FormControl>
            </Grid>

            {/* Color Palette */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>QRコードの色</Typography>
              <Controller
                name="color"
                control={control}
                render={({ field }) => (
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    {colorPalette.map((color) => (
                      <Box
                        key={color}
                        onClick={() => setValue('color', color, { shouldValidate: true })}
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
              <TextField
                value={watch('color')}
                onChange={(e) => setValue('color', e.target.value, { shouldValidate: true })}
                variant="outlined"
                size="small"
                sx={{ mt: 1, width: 120 }}
                error={!!errors.color}
                helperText={errors.color?.message}
              />
            </Grid>

            <Grid item xs={12}>
              <Box sx={{ position: 'relative' }}>
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  disabled={loading}
                >
                  保存する
                </Button>
                {loading && <CircularProgress size={24} sx={{ position: 'absolute', top: '50%', left: '50%', mt: -1.5, ml: -8 }} />}
              </Box>
            </Grid>
          </Grid>
        </form>

        {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mt: 2 }}>{success}</Alert>}
      </Paper>
    </Container>
  );
}
