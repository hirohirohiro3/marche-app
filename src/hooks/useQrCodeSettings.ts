import { useState, useEffect, useCallback } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { db } from '../firebase';
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
    if (!storeId) {
      throw new Error("ストアIDが取得できませんでした。");
    }

    // Helper function to convert File to Base64
    const toBase64 = (file: File): Promise<string> =>
      new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = (error) => reject(error);
      });

    try {
      // 1. Convert the file to a Base64 string.
      const base64String = await toBase64(imageFile);

      // 2. Get a reference to the Firebase Function.
      const functions = getFunctions();
      const uploadFunction = httpsCallable(functions, 'uploadQrCodeLogo');

      console.log('[useQrCodeSettings] Calling "uploadQrCodeLogo" function...');

      // 3. Call the function with the file data.
      const result = await uploadFunction({
        file: base64String,
        fileType: imageFile.type,
      });

      // 4. Extract the URL from the result.
      const { url } = result.data as { url: string };

      if (!url) {
        throw new Error('Function did not return a URL.');
      }

      console.log(`[useQrCodeSettings] Got URL from function: ${url}`);
      return url;

    } catch (error) {
      console.error('Error calling uploadQrCodeLogo function:', error);
      throw new Error(`ロゴ画像のアップロード中にエラーが発生しました。: ${error}`);
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
