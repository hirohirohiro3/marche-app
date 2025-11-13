import { useState, useEffect, useCallback } from 'react';
import {
  collection,
  onSnapshot,
  query,
  orderBy,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  where,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../firebase';
import { MenuItem } from '../types';
import * as z from 'zod';
import { useAuth } from './useAuth';

// Zod schema and type definition co-located with the hook
export const menuFormSchema = z
  .object({
    name: z.string().min(1, '商品名は必須です'),
    price: z.preprocess(
      (val) => (val === '' ? null : Number(val)),
      z.number({ invalid_type_error: '価格は数値を入力してください' }).min(0, '価格は0以上で入力してください')
    ),
    category: z.string().min(1, 'カテゴリは必須です'),
    description: z.string().optional(),
    sortOrder: z.preprocess(
      (val) => (val === '' ? 0 : Number(val)),
      z.number({ invalid_type_error: '表示順は数値を入力してください' }).min(0)
    ).default(0),
    manageStock: z.boolean().default(false),
    stock: z.preprocess(
      (val) => (val === '' ? null : Number(val)),
      z.number({ invalid_type_error: '在庫数は数値を入力してください' }).min(0, '在庫数は0以上で入力してください').nullable()
    ),
    optionGroupIds: z.array(z.string()).default([]),
    // For handling the uploaded file object
    imageFile: z.any().optional().nullable(),
    // For displaying the existing image URL
    imageUrl: z.string().url().optional().nullable(),
  })
  .refine(
    (data) => {
      if (data.manageStock) {
        // nullでもなくundefinedでもないことを確認
        return data.stock != null;
      }
      return true;
    },
    {
      message: '在庫管理を有効にする場合は在庫数の入力が必須です',
      path: ['stock'],
    }
  );
export type MenuFormValues = z.infer<typeof menuFormSchema>;

export const useMenu = (storeId?: string) => {
  const [menus, setMenus] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const effectiveStoreId = storeId || user?.uid;

  useEffect(() => {
    if (!effectiveStoreId) {
      setLoading(false);
      return;
    };

    setLoading(true);
    setError(null);
    const q = query(
      collection(db, 'menus'),
      where('storeId', '==', effectiveStoreId),
      orderBy('sortOrder', 'asc')
    );
    const unsubscribe = onSnapshot(q,
      (snapshot) => {
        const menusData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as MenuItem[];
        setMenus(menusData);
        setLoading(false);
      },
      (err) => {
        console.error(err);
        setError("メニューの読み込みに失敗しました。");
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, [effectiveStoreId]);

  const uploadImage = useCallback(async (imageFile: File): Promise<string> => {
    if (!user || !effectiveStoreId) {
      console.error('[useMenu:uploadImage] User or store ID is not available.', { uid: user?.uid, effectiveStoreId });
      throw new Error("ユーザー情報またはストアIDが取得できません。");
    }
    // Deep log of the storage object's configuration right before usage
    console.log('[useMenu:uploadImage] Storage object config:', JSON.stringify(storage.app.options, null, 2));
    const storageRef = ref(storage, `menu-images/${effectiveStoreId}/${Date.now()}_${imageFile.name}`);
    console.log(`[useMenu:uploadImage] Uploading to gs://${storage.app.options.storageBucket}/${storageRef.fullPath}`);
    try {
      // Re-create a clean File object from ArrayBuffer to ensure compatibility
      const buffer = await imageFile.arrayBuffer();
      const blob = new Blob([buffer], { type: imageFile.type });
      const cleanFile = new File([blob], imageFile.name, {
        type: imageFile.type,
      });
      const snapshot = await uploadBytes(storageRef, cleanFile);
      return getDownloadURL(snapshot.ref);
    } catch (error) {
      console.error('[useMenu:uploadImage] Image upload failed with detailed error:', JSON.stringify(error, null, 2));
      throw error;
    }
  }, [effectiveStoreId, user]);

  const saveMenuItem = useCallback(async (
    values: MenuFormValues,
    editingMenuItem: MenuItem | null
  ) => {
    console.log('[useMenu] saveMenuItem started.', { values, editingMenuItem });
    try {
      // Use the imageUrl from the form state, which could be the initial URL or null
      let imageUrl = values.imageUrl || '';
      // If a new image file is uploaded, upload it and update the URL
      if (values.imageFile) {
        try {
          console.log('[useMenu] New image file found, starting upload...');
          imageUrl = await uploadImage(values.imageFile);
          console.log('[useMenu] Image upload finished, URL:', imageUrl);
        } catch (uploadError) {
          console.error('[useMenu] Image upload failed within saveMenuItem:', uploadError);
          // Throw a more specific error for the UI to catch.
          throw new Error('画像のアップロードに失敗しました。ネットワーク接続を確認するか、別の画像でお試しください。');
        }
      }

      // Prepare data for Firestore, excluding the client-side 'imageFile'
      const { imageFile, ...valuesForDb } = values;
      const dataToSave = {
        ...valuesForDb,
        stock: values.stock ?? 0,
        imageUrl,
      };
      console.log('[useMenu] Data prepared for Firestore:', dataToSave);

      if (editingMenuItem) {
        console.log(`[useMenu] Updating existing menu item with id: ${editingMenuItem.id}`);
        try {
          await updateDoc(doc(db, 'menus', editingMenuItem.id), dataToSave);
          console.log('[useMenu] Firestore updateDoc successful.');
        } catch (dbError) {
          console.error('[useMenu] Firestore updateDoc ERROR:', dbError);
          throw dbError;
        }
      } else {
        if (!effectiveStoreId) {
          throw new Error("ストアIDが取得できません。ログイン状態を確認してください。");
        }
        console.log('[useMenu] Creating new menu item.');
        try {
          await addDoc(collection(db, 'menus'), {
            ...dataToSave,
            storeId: effectiveStoreId,
            isSoldOut: false,
          });
          console.log('[useMenu] Firestore addDoc successful.');
        } catch (dbError) {
          console.error('[useMenu] Firestore addDoc ERROR:', dbError);
          throw dbError;
        }
      }
    } catch (error) {
      console.error('Failed to save menu item with detailed error:', error);
      throw error;
    }
  }, [uploadImage, effectiveStoreId, user]);

  const deleteMenuItem = useCallback(async (menuItemId: string) => {
    try {
      await deleteDoc(doc(db, 'menus', menuItemId));
    } catch (error) {
      console.error('Failed to delete menu item:', error);
      throw error;
    }
  }, []);

  const toggleSoldOut = useCallback(async (item: MenuItem) => {
    const menuRef = doc(db, 'menus', item.id);
    try {
      await updateDoc(menuRef, {
        isSoldOut: !item.isSoldOut,
      });
    } catch (error) {
      console.error('Failed to toggle sold out status:', error);
      throw error;
    }
  }, []);

  return {
    menus,
    loading,
    error,
    saveMenuItem,
    deleteMenuItem,
    toggleSoldOut,
  };
};
