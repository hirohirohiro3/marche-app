// src/hooks/useMenu.test.ts
import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useMenu } from './useMenu';
import * as firebaseFirestore from 'firebase/firestore';
import * as useAuthHook from './useAuth';
import { MenuItem } from '../types';

// Mock Firebase services and hooks
vi.mock('../firebase');
vi.mock('firebase/firestore');
vi.mock('firebase/storage');
vi.mock('./useAuth');

describe('useMenu hook', () => {
  const mockStoreId = 'test-store-id';
  const mockMenuItems: MenuItem[] = [
    { id: '1', storeId: mockStoreId, name: 'Coffee', price: 500, category: 'Drinks', description: '', imageUrl: '', isSoldOut: false, sortOrder: 1, manageStock: false },
    { id: '2', storeId: mockStoreId, name: 'Cake', price: 700, category: 'Desserts', description: '', imageUrl: '', isSoldOut: false, sortOrder: 2, manageStock: false },
  ];

  beforeEach(() => {
    // Reset mocks before each test
    vi.resetAllMocks();

    // Mock useAuth
    vi.spyOn(useAuthHook, 'useAuth').mockReturnValue({
      user: { uid: mockStoreId } as any,
      loading: false,
    });

    // Mock Firestore functions
    vi.spyOn(firebaseFirestore, 'collection').mockReturnValue({} as any);
    vi.spyOn(firebaseFirestore, 'where').mockReturnValue({} as any);
    vi.spyOn(firebaseFirestore, 'orderBy').mockReturnValue({} as any);
    vi.spyOn(firebaseFirestore, 'query').mockReturnValue({} as any);
    vi.spyOn(firebaseFirestore, 'doc').mockReturnValue({} as any);

    // Mock onSnapshot
    vi.spyOn(firebaseFirestore, 'onSnapshot').mockImplementation((query, optionsOrObserver, observer) => {
      const callback = typeof optionsOrObserver === 'function' ? optionsOrObserver : observer;
      const snapshot = {
        docs: mockMenuItems.map(item => ({ id: item.id, data: () => item })),
      };
      if (callback) {
        callback(snapshot as any);
      }
      return () => {}; // unsubscribe function
    });
  });

  it('should fetch menus for the correct storeId', async () => {
    const { result } = renderHook(() => useMenu());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.menus).toEqual(mockMenuItems);
      expect(firebaseFirestore.query).toHaveBeenCalledWith(
        expect.anything(), // collection ref
        expect.anything(), // where constraint
        expect.anything()  // orderBy constraint
      );
    });
  });

  it('should add a new menu item', async () => {
    const { result } = renderHook(() => useMenu());
    const addDocMock = vi.spyOn(firebaseFirestore, 'addDoc').mockResolvedValue({} as any);

    const newItem = { name: 'Tea', price: '400', category: 'Drinks' };
    await result.current.saveMenuItem(newItem as any, null, null);

    expect(addDocMock).toHaveBeenCalledWith(
      expect.anything(), // collection ref
      expect.objectContaining({
        name: 'Tea',
        price: 400,
        storeId: mockStoreId,
      })
    );
  });

  it('should update an existing menu item', async () => {
    const { result } = renderHook(() => useMenu());
    const updateDocMock = vi.spyOn(firebaseFirestore, 'updateDoc').mockResolvedValue();
    const existingItem = mockMenuItems[0];
    const updatedData = { ...existingItem, name: 'Super Coffee', price: '600' };

    await result.current.saveMenuItem(updatedData as any, null, existingItem);

    expect(updateDocMock).toHaveBeenCalledWith(
      expect.anything(), // doc ref
      expect.objectContaining({
        name: 'Super Coffee',
        price: 600,
      })
    );
  });

});
