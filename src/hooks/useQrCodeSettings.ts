import { useState, useEffect, useCallback } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../firebase';
import { useAuth } from './useAuth';
import { z } from 'zod';

export const qrSettingsSchema = z.object({
  color: z.string().min(1, '色は必須です'),
  logoFile: z.any().optional(),
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

  const fetchSettings = useCallback(async () => {
    if (!user?.uid) return;
    try {
      const docRef = doc(db, 'stores', user.uid, 'settings', 'qrcode');
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setSettings(docSnap.data() as QrCodeSettings);
      } else {
        setSettings({ color: '#000000' });
      }
    } catch (error) {
      console.error("Error fetching QR settings:", error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const saveQrCodeSettings = async (data: QrSettingsFormValues) => {
    if (!user?.uid) return;
    setLoading(true);
    try {
      console.log('saveQrCodeSettings called with:', data);
      let logoUrl = settings?.logoUrl;
      let shouldDeleteLogo = false;

      if (data.logoFile) {
        const file = data.logoFile as File;
        const storageRef = ref(storage, `stores/${user.uid}/qrcode_logo_${Date.now()}`);
        await uploadBytes(storageRef, file);
        logoUrl = await getDownloadURL(storageRef);
      } else if (data.logoFile === null) {
        // Explicitly removed
        console.log('Logo explicitly removed (data.logoFile is null)');
        shouldDeleteLogo = true;
        logoUrl = undefined;
      }
      const updateData: any = {
        color: data.color,
      };

      if (shouldDeleteLogo) {
        updateData.logoUrl = null;
      } else if (logoUrl) {
        updateData.logoUrl = logoUrl;
      }

      const docRef = doc(db, 'stores', user.uid, 'settings', 'qrcode');
      await setDoc(docRef, updateData, { merge: true });

      // Update local state
      setSettings({
        color: data.color,
        logoUrl: shouldDeleteLogo ? undefined : logoUrl,
      });
    } catch (error) {
      console.error("Error saving QR settings:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return { settings, loading, saveQrCodeSettings };
};
