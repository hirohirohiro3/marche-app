import { useState, useEffect, useCallback } from 'react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db } from '../firebase';
import { useAuth } from './useAuth';

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
      }
    };

    fetchQrCodeSettings();
  }, [storeId]);

  const uploadLogoImage = useCallback(async (imageFile: File): Promise<string> => {
    if (!storeId) {
      throw new Error("ストアIDが取得できません。ログイン状態を確認してください。");
    }
    const storage = getStorage();
    const storageRef = ref(storage, `qr-code-logos/${storeId}/${Date.now()}_${imageFile.name}`);
    const snapshot = await uploadBytes(storageRef, imageFile);
    return getDownloadURL(snapshot.ref);
  }, [storeId]);

  const saveQrCodeSettings = useCallback(async (newSettings: Partial<QrCodeSettings>, imageFile: File | null) => {
    if (!storeId) {
      throw new Error("ストアIDが取得できません。ログイン状態を確認してください。");
    }
    try {
      let logoUrl = settings?.logoUrl || '';
      if (imageFile) {
        logoUrl = await uploadLogoImage(imageFile);
      }

      const settingsToSave = {
        ...settings,
        ...newSettings,
        logoUrl,
      };

      const storeRef = doc(db, 'stores', storeId);
      await updateDoc(storeRef, { qrCodeSettings: settingsToSave });
      setSettings(settingsToSave as QrCodeSettings);

    } catch (error) {
      console.error('Failed to save QR code settings:', error);
      throw error;
    }
  }, [storeId, settings, uploadLogoImage]);

  return { settings, loading, saveQrCodeSettings };
};
