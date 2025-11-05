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
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db } from '../firebase';
import { MenuItem } from '../types';
import * as z from 'zod';
import { useAuth } from './useAuth';

// Zod schema and type definition co-located with the hook
export const menuFormSchema = z
  .object({
    name: z.string().min(1, '商品名は必須です'),
    price: z.string().min(1, '価格は必須です'),
    category: z.string().min(1, 'カテゴリは必須です'),
    description: z.string().optional(),
    sortOrder: z.string().optional(),
    manageStock: z.boolean().default(false),
    stock: z.string().optional(),
    optionGroupIds: z.array(z.string()).default([]),
  })
  .refine(
    (data) => {
      if (data.manageStock) {
        return data.stock !== undefined && data.stock.trim() !== '';
      }
      return true;
    },
    {
      message: '在庫管理を有効にする場合は在庫数の入力が必須です',
      path: ['stock'], // エラーメッセージを表示するフィールド
    }
  );
export type MenuFormValues = z.infer<typeof menuFormSchema>;

export const useMenu = (storeId?: string) => {
  const [menus, setMenus] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const effectiveStoreId = storeId || user?.uid;

  useEffect(() => {
    if (!effectiveStoreId) {
      setLoading(false);
      return;
    };

    setLoading(true);
    const q = query(
      collection(db, 'menus'),
      where('storeId', '==', effectiveStoreId),
      orderBy('sortOrder', 'asc')
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const menusData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as MenuItem[];
      setMenus(menusData);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [effectiveStoreId]);

  const uploadImage = useCallback(async (imageFile: File): Promise<string> => {
    if (!effectiveStoreId) {
      throw new Error("ストアIDが取得できません。ログイン状態を確認してください。");
    }
    const storage = getStorage();
    const storageRef = ref(storage, `menu-images/${effectiveStoreId}/${Date.now()}_${imageFile.name}`);
    const snapshot = await uploadBytes(storageRef, imageFile);
    return getDownloadURL(snapshot.ref);
  }, [effectiveStoreId]);

  const saveMenuItem = useCallback(async (
    values: MenuFormValues,
    imageFile: File | null,
    editingMenuItem: MenuItem | null
  ) => {
    try {
      let imageUrl = editingMenuItem?.imageUrl || '';
      if (imageFile) {
        imageUrl = await uploadImage(imageFile);
      }

      const dataToSave = {
        ...values,
        price: parseInt(values.price, 10) || 0,
        sortOrder: parseInt(values.sortOrder || '0', 10) || 0,
        stock: parseInt(values.stock || '0', 10) || 0,
        imageUrl,
      };

      if (editingMenuItem) {
        // For updates, storeId is already part of the document
        await updateDoc(doc(db, 'menus', editingMenuItem.id), dataToSave);
      } else {
        // For new items, add the storeId
        if (!effectiveStoreId) {
          throw new Error("ストアIDが取得できません。ログイン状態を確認してください。");
        }
        await addDoc(collection(db, 'menus'), {
          ...dataToSave,
          storeId: effectiveStoreId,
          isSoldOut: false,
        });
      }
    } catch (error) {
      console.error('Failed to save menu item:', error);
      throw error;
    }
  }, [uploadImage, effectiveStoreId]);

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
    saveMenuItem,
    deleteMenuItem,
    toggleSoldOut,
  };
};
