
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
import { db } from '../firebase';
import { OptionGroup } from '../types';
import * as z from 'zod';
import { useAuth } from './useAuth';

// Zod schema for the option choice
const optionChoiceSchema = z.object({
  id: z.string().optional(), // ID will be generated for new choices
  name: z.string().min(1, '選択肢名は必須です'),
  priceModifier: z.preprocess(
    (val) => (val === '' ? 0 : Number(val)),
    z.number({ invalid_type_error: '価格は数値を入力してください' })
  ),
});

// Zod schema for the option group form
export const optionGroupFormSchema = z.object({
  name: z.string().min(1, 'オプション名は必須です'),
  selectionType: z.enum(['single', 'multiple']),
  choices: z.array(optionChoiceSchema).min(1, '選択肢を1つ以上追加してください'),
});

export type OptionGroupFormValues = z.infer<typeof optionGroupFormSchema>;

export const useOptionGroups = (storeId?: string) => {
  const [optionGroups, setOptionGroups] = useState<OptionGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const effectiveStoreId = storeId || user?.uid;

  useEffect(() => {
    if (!effectiveStoreId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    const q = query(
      collection(db, 'optionGroups'),
      where('storeId', '==', effectiveStoreId),
      orderBy('name', 'asc')
    );

    const unsubscribe = onSnapshot(q,
      (snapshot) => {
        const groupsData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as OptionGroup[];
        setOptionGroups(groupsData);
        setLoading(false);
      },
      (err) => {
        console.error("Failed to load option groups:", err);
        setError("オプションの読み込みに失敗しました。");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [effectiveStoreId]);

  const saveOptionGroup = useCallback(async (
    values: OptionGroupFormValues,
    editingOptionGroup: OptionGroup | null
  ) => {
    if (!effectiveStoreId) {
      throw new Error("ストアIDが取得できません。ログイン状態を確認してください。");
    }

    // Add unique IDs to new choices
    const processedChoices = values.choices.map(choice => ({
      ...choice,
      id: choice.id || `choice_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    }));

    const dataToSave = {
      ...values,
      choices: processedChoices,
    };

    try {
      if (editingOptionGroup) {
        await updateDoc(doc(db, 'optionGroups', editingOptionGroup.id), dataToSave);
      } else {
        await addDoc(collection(db, 'optionGroups'), {
          ...dataToSave,
          storeId: effectiveStoreId,
        });
      }
    } catch (error) {
      console.error('Failed to save option group:', error);
      throw error;
    }
  }, [effectiveStoreId]);

  const deleteOptionGroup = useCallback(async (optionGroupId: string) => {
    try {
      await deleteDoc(doc(db, 'optionGroups', optionGroupId));
    } catch (error) {
      console.error('Failed to delete option group:', error);
      throw error;
    }
  }, []);

  return {
    optionGroups,
    loading,
    error,
    saveOptionGroup,
    deleteOptionGroup,
  };
};
