import { useState, useEffect, useCallback } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { getIdToken } from 'firebase/auth';
import { db, storage } from '../firebase';
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

  const uploadLogoImage = useCallback(async (imageFile: File): Promise<string> => {
    if (!user || !storeId) {
      console.error('[useQrCodeSettings:uploadLogoImage] User or store ID is not available.');
      throw new Error("ユーザー情報またはストアIDが取得できません。");
    }

    try {
      const token = await getIdToken(user);
      const fileName = `qr-code-logos/${storeId}/${Date.now()}_${imageFile.name}`;
      const bucket = storage.app.options.storageBucket;
      const url = `https://firebasestorage.googleapis.com/v0/b/${bucket}/o?name=${encodeURIComponent(fileName)}`;

      console.log(`[useQrCodeSettings:uploadLogoImage] Uploading via REST API to: ${url}`);

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': imageFile.type,
          'Authorization': `Firebase ${token}`,
        },
        body: imageFile,
      });

      if (!response.ok) {
        const errorBody = await response.text();
        console.error('[useQrCodeSettings:uploadLogoImage] REST API upload failed. Status:', response.status, 'Body:', errorBody);
        throw new Error(`ロゴ画像のアップロードに失敗しました (HTTP ${response.status})`);
      }

      const data = await response.json();
      const downloadToken = data.downloadTokens;
      const downloadUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket}/o/${encodeURIComponent(fileName)}?alt=media&token=${downloadToken}`;

      console.log(`[useQrCodeSettings:uploadLogoImage] REST API upload successful. URL: ${downloadUrl}`);
      return downloadUrl;

    } catch (error) {
      console.error('[useQrCodeSettings:uploadLogoImage] Image upload failed with detailed error:', error);
      throw error;
    }
  }, [storeId, user]);

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
  }, [storeId, uploadLogoImage, user]);

  return { settings, loading, saveQrCodeSettings };
};
