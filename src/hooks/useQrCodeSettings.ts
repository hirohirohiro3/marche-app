import { useState, useEffect, useCallback } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, functions } from '../firebase';
import { useAuth } from './useAuth';
import { z } from 'zod';

export const qrSettingsSchema = z.object({
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, '有効なカラーコードを入力してください。'),
  logoFile: z.any().optional().nullable(),
  logoUrl: z.string().url().optional().nullable(),
});

export type QrSettingsFormValues = z.infer<typeof qrSettingsSchema>;

export interface QrCodeSettings {
  color: string;
  logoUrl?: string;
}

export const useQrCodeSettings = () => {
  const { user } = useAuth();
  const [settings, setSettings] = useState<QrCodeSettings | null>(null);
  const [loading, setLoading] = useState(true);

  const storeId = user?.uid;

  useEffect(() => {
    const fetchQrCodeSettings = async () => {
      if (storeId) {
        setLoading(true);
        try {
          const storeRef = doc(db, 'stores', storeId);
          const storeDoc = await getDoc(storeRef);
          if (storeDoc.exists() && storeDoc.data().qrCodeSettings) {
            setSettings(storeDoc.data().qrCodeSettings);
          } else {
            setSettings({ color: '#000000' }); // Default settings
          }
        } catch (error) {
          console.error("Failed to fetch QR code settings:", error);
          setSettings({ color: '#000000' }); // Fallback on error
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    };

    fetchQrCodeSettings();
  }, [storeId]);

// Reusable utility to convert File to Base64 Data URL
const fileToDataUrl = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

  const uploadLogoImage = useCallback(async (imageFile: File): Promise<string> => {
    if (!storeId) {
      throw new Error("ストアIDが取得できません。");
    }

    try {
      console.log(`[useQrCodeSettings:uploadLogoImage] Starting upload for file: ${imageFile.name}`);
      const imageDataUrl = await fileToDataUrl(imageFile);

      const uploadImageFunction = httpsCallable(functions, 'uploadImage');
      const result = await uploadImageFunction({
        imageDataUrl,
        path: 'qr-code-logos',
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const data = result.data as { imageUrl: string };

      if (!data.imageUrl) {
        throw new Error('Function returned an invalid image URL.');
      }

      console.log(`[useQrCodeSettings:uploadLogoImage] Upload successful. URL: ${data.imageUrl}`);
      return data.imageUrl;
    } catch (error) {
      console.error('[useQrCodeSettings:uploadLogoImage] Image upload via function failed:', error);
      throw new Error('ロゴ画像のアップロードに失敗しました。');
    }
  }, [storeId]);

  const saveQrCodeSettings = useCallback(async (values: QrSettingsFormValues) => {
    console.log('[useQrCodeSettings] saveQrCodeSettings started.', values);
    if (!storeId) {
      throw new Error("ストアIDが取得できません。ログイン状態を確認してください。");
    }
    try {
      let logoUrl = values.logoUrl || '';
      if (values.logoFile) {
        console.log('[useQrCodeSettings] New logo file found, starting upload...');
        logoUrl = await uploadLogoImage(values.logoFile);
        console.log('[useQrCodeSettings] Logo upload finished, URL:', logoUrl);
      }

      const { logoFile, ...valuesForDb } = values;

      const settingsToSave: QrCodeSettings = {
        ...valuesForDb,
        logoUrl,
      };
      console.log('[useQrCodeSettings] Data prepared for Firestore:', settingsToSave);


      const storeRef = doc(db, 'stores', storeId);
      console.log(`[useQrCodeSettings] Updating/creating settings for storeId: ${storeId}`);
      try {
        // Use setDoc with merge: true to create or update the document
        await setDoc(storeRef, { qrCodeSettings: settingsToSave }, { merge: true });
        console.log('[useQrCodeSettings] Firestore setDoc successful.');
        setSettings(settingsToSave);
      } catch (dbError) {
        console.error('[useQrCodeSettings] Firestore setDoc ERROR:', dbError);
        throw dbError;
      }

    } catch (error) {
      console.error('Failed to save QR code settings with detailed error:', error);
      throw error;
    }
  }, [storeId, uploadLogoImage]);

  return { settings, loading, saveQrCodeSettings };
};
