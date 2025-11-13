import { renderHook, act, waitFor } from '@testing-library/react';
import { useMenu, MenuFormValues } from './useMenu';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
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
import { useAuth } from './useAuth';
import { MenuItem } from '../types/index';

//================================================================================
// Mocks
//================================================================================

// Mock Firebase services and custom hooks
vi.mock('../firebase', () => ({
  db: {}, // Mock db object, as it's just a dependency for firestore functions
  app: { options: { storageBucket: 'test-project-id.appspot.com' } },
  storage: {
    app: {
      options: {
        storageBucket: 'test-project-id.appspot.com',
      },
    },
  },
}));
vi.mock('firebase/auth');
vi.mock('firebase/firestore');
vi.mock('firebase/storage');
vi.mock('./useAuth');

// Cast mocks to the correct type for TypeScript intelligence
// Custom Hooks
const mockedUseAuth = useAuth as vi.Mock;

// Firestore
const mockedCollection = collection as vi.Mock;
const mockedOnSnapshot = onSnapshot as vi.Mock;
const mockedQuery = query as vi.Mock;
const mockedOrderBy = orderBy as vi.Mock;
const mockedAddDoc = addDoc as vi.Mock;
const mockedUpdateDoc = updateDoc as vi.Mock;
const mockedDeleteDoc = deleteDoc as vi.Mock;
const mockedDoc = doc as vi.Mock;
const mockedWhere = where as vi.Mock;

// Storage
const mockedRef = ref as vi.Mock;
const mockedUploadBytes = uploadBytes as vi.Mock;
const mockedGetDownloadURL = getDownloadURL as vi.Mock;


//================================================================================
// Test Data
//================================================================================

const mockMenuItems: MenuItem[] = [
  { id: 'item1', name: 'エスプレッソ', price: 500, storeId: 'test-store-id', isSoldOut: false, sortOrder: 1, description: '', category: 'ドリンク', imageUrl: '' },
  { id: 'item2', name: 'カプチーノ', price: 600, storeId: 'test-store-id', isSoldOut: true, sortOrder: 2, description: '', category: 'ドリンク', imageUrl: '' },
];

const mockNewMenuItem: MenuFormValues = {
  name: 'ラテ',
  price: 700,
  category: 'ドリンク',
  description: 'ふわふわミルク',
  sortOrder: 3,
  manageStock: false,
  stock: 0,
  optionGroupIds: [],
};

//================================================================================
// Test Suite
//================================================================================

describe('useMenuフックのテスト', () => {

  // A helper to control onSnapshot behavior for each test
  let onNextCallback: (snapshot: any) => void;
  let onErrorCallback: (error: Error) => void;

  beforeEach(() => {
    // Reset mocks before each test
    vi.clearAllMocks();

    // Mock implementations
    mockedUseAuth.mockReturnValue({
      user: { uid: 'test-user-id' },
      loading: false,
    });

    // Firestore Mocks
    mockedQuery.mockImplementation((_: any, ...args: any[]) => ['query', ...args]);
    mockedWhere.mockImplementation((...args: any[]) => ['where', ...args]);
    mockedOrderBy.mockImplementation((...args: any[]) => ['orderBy', ...args]);
    mockedCollection.mockImplementation((_: any, path: any) => `collection:${path}`);
    mockedDoc.mockImplementation((_: any, path: any, id: any) => `doc:${path}/${id}`);
    mockedAddDoc.mockResolvedValue({ id: 'newItemId' } as any);
    mockedUpdateDoc.mockResolvedValue(undefined);
    mockedDeleteDoc.mockResolvedValue(undefined);

    // Controllable onSnapshot mock
    mockedOnSnapshot.mockImplementation((_: any, onNext: any, onError: any) => {
      onNextCallback = onNext;
      onErrorCallback = onError;
      return () => {}; // unsubscribe function
    });

    // Storage Mocks
    mockedRef.mockImplementation((_: any, path: string) => `ref:${path}`);
    mockedUploadBytes.mockResolvedValue({} as any);
    mockedGetDownloadURL.mockResolvedValue('http://mock-url/image.png');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // Helper function to set up the hook and simulate initial data loading
  const setupAndFinishLoading = () => {
      const { result } = renderHook(() => useMenu('test-store-id'));
      act(() => {
        onNextCallback({ docs: mockMenuItems.map(item => ({ id: item.id, data: () => item })) });
      });
      return { result };
  }


  describe('データ読み込み', () => {
    it('初期状態でローディング中になり、正常にデータを読み込むこと', async () => {
      const { result } = renderHook(() => useMenu('test-store-id'));

      expect(result.current.loading).toBe(true);

      act(() => {
        onNextCallback({ docs: mockMenuItems.map(item => ({ id: item.id, data: () => item })) });
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
        expect(result.current.menus).toEqual(mockMenuItems);
        expect(result.current.error).toBeNull();
      });
    });

    it('データが空の場合、空の配列を返すこと', async () => {
      const { result } = renderHook(() => useMenu('test-store-id'));
      expect(result.current.loading).toBe(true);

      act(() => {
          onNextCallback({ docs: [] });
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
        expect(result.current.menus).toEqual([]);
      });
    });

    it('データ読み込みでエラーが発生した場合、エラーステートが設定されること', async () => {
      const mockError = new Error('Firestore Error');
      const { result } = renderHook(() => useMenu('test-store-id'));
      expect(result.current.loading).toBe(true);

      act(() => {
          onErrorCallback(mockError);
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
        expect(result.current.error).toBe('メニューの読み込みに失敗しました。');
      });
    });

    it('storeIdが指定されない場合、認証ユーザーのUIDを使用すること', async () => {
      renderHook(() => useMenu());

      act(() => {
        onNextCallback({ docs: [] });
      });

      await waitFor(() => {
         expect(mockedWhere).toHaveBeenCalledWith('storeId', '==', 'test-user-id');
      });
    });
  });

  describe('データ操作', () => {
    it('新しいメニュー項目を追加できること', async () => {
      const { result } = setupAndFinishLoading();
      await waitFor(() => expect(result.current.loading).toBe(false));

      await act(async () => {
        await result.current.saveMenuItem(mockNewMenuItem, null);
      });

      expect(mockedAddDoc).toHaveBeenCalledTimes(1);
      expect(mockedAddDoc).toHaveBeenCalledWith(
        'collection:menus',
        expect.objectContaining({
          name: 'ラテ',
          price: 700,
          storeId: 'test-store-id',
          isSoldOut: false,
        })
      );
    });

    it('既存のメニュー項目を更新できること', async () => {
      const { result } = setupAndFinishLoading();
      await waitFor(() => expect(result.current.loading).toBe(false));

      const editingItem = mockMenuItems[0];
      const updatedValues = { ...mockNewMenuItem, name: 'エスプレッソ（改）' };

      await act(async () => {
        await result.current.saveMenuItem(updatedValues, editingItem);
      });

      expect(mockedAddDoc).not.toHaveBeenCalled();
      expect(mockedUpdateDoc).toHaveBeenCalledTimes(1);
      expect(mockedUpdateDoc).toHaveBeenCalledWith(
        `doc:menus/${editingItem.id}`,
        expect.objectContaining({ name: 'エスプレッソ（改）' })
      );
      expect(mockedAddDoc).not.toHaveBeenCalled();
    });

    it('メニュー項目を削除できること', async () => {
      const { result } = setupAndFinishLoading();
      await waitFor(() => expect(result.current.loading).toBe(false));

      await act(async () => {
        await result.current.deleteMenuItem('item1');
      });

      expect(mockedDeleteDoc).toHaveBeenCalledTimes(1);
      expect(mockedDeleteDoc).toHaveBeenCalledWith('doc:menus/item1');
    });

    it('isSoldOutの状態を切り替えられること', async () => {
      const { result } = setupAndFinishLoading();
      await waitFor(() => expect(result.current.loading).toBe(false));

      const itemToToggle = mockMenuItems[0]; // isSoldOut: false

      await act(async () => {
        await result.current.toggleSoldOut(itemToToggle);
      });

      expect(mockedUpdateDoc).toHaveBeenCalledTimes(1);
      expect(mockedUpdateDoc).toHaveBeenCalledWith(
        `doc:menus/${itemToToggle.id}`,
        { isSoldOut: true }
      );
    });

    it('画像付きで新しいメニュー項目を追加できること', async () => {
      const { result } = setupAndFinishLoading();
      await waitFor(() => expect(result.current.loading).toBe(false));

      const mockImageFile = new File(['dummy content'], 'test.png', { type: 'image/png' });
      // Vitest/JSDOM environment's File object doesn't have arrayBuffer, so we mock it.
      mockImageFile.arrayBuffer = vi.fn().mockResolvedValue(new ArrayBuffer(0));
      const valuesWithImage: MenuFormValues = { ...mockNewMenuItem, imageFile: mockImageFile };

      await act(async () => {
        await result.current.saveMenuItem(valuesWithImage, null);
      });

      expect(mockedUploadBytes).toHaveBeenCalledTimes(1);
      expect(mockedGetDownloadURL).toHaveBeenCalledTimes(1);
      expect(mockedAddDoc).toHaveBeenCalledWith(
        'collection:menus',
        expect.objectContaining({
          name: 'ラテ',
          imageUrl: 'http://mock-url/image.png',
        })
      );
    });

    it('在庫管理を有効にしてメニュー項目を更新できること', async () => {
      const { result } = setupAndFinishLoading();
      await waitFor(() => expect(result.current.loading).toBe(false));

      const editingItem = mockMenuItems[0];
      const updatedValues: MenuFormValues = {
        ...mockNewMenuItem,
        name: '在庫管理テスト',
        manageStock: true,
        stock: 10,
      };

      await act(async () => {
        await result.current.saveMenuItem(updatedValues, editingItem);
      });

      expect(mockedAddDoc).not.toHaveBeenCalled();
      expect(mockedUpdateDoc).toHaveBeenCalledTimes(1);
      expect(mockedUpdateDoc).toHaveBeenCalledWith(
        `doc:menus/${editingItem.id}`,
        expect.objectContaining({
          name: '在庫管理テスト',
          manageStock: true,
          stock: 10,
        })
      );
    });
  });
});
