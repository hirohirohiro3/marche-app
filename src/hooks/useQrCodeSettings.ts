import { useState, useEffect, useCallback } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../firebase';
import { useAuth } from './useAuth';
import { z } from 'zod';

export const qrSettingsSchema = z.object({
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, '有効なカラーコードを入力してください。'),
  logoFile: z.any().optional().nullable(),
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
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          console.error("Full Error Details:", JSON.stringify(error as any, null, 2));
          console.error("Current storeId:", storeId);
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

  const uploadLogoImage = useCallback(async (imageFile: File): Promise<string> => {
    if (!storeId) {
      throw new Error("ストアIDが取得できません。");
    }

    try {
      console.log(`[useQrCodeSettings:uploadLogoImage] Starting upload for file: ${imageFile.name}`);

      const fileName = `${Date.now()}_${imageFile.name}`;
      const filePath = `qr-code-logos/${storeId}/${fileName}`;
      const storageRef = ref(storage, filePath);

      // Upload the file directly
      const snapshot = await uploadBytes(storageRef, imageFile);
      console.log('[useQrCodeSettings:uploadLogoImage] Upload successful:', snapshot);

      // Get the public URL
      const downloadURL = await getDownloadURL(snapshot.ref);
      console.log(`[useQrCodeSettings:uploadLogoImage] Got download URL: ${downloadURL}`);

      return downloadURL;
    } catch (error) {
      console.error('[useQrCodeSettings:uploadLogoImage] Image upload failed:', error);
      throw new Error('ロゴ画像のアップロードに失敗しました。');
    }
  }, [storeId]);

  const saveQrCodeSettings = useCallback(async (values: QrSettingsFormValues) => {
    console.log('[useQrCodeSettings] saveQrCodeSettings started.', values);
    if (!storeId) {
      throw new Error("ストアIDが取得できません。ログイン状態を確認してください。");
    }
    try {
      let logoUrl = settings?.logoUrl || '';
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
  }, [storeId]);

  return { settings, loading, saveQrCodeSettings };
};
