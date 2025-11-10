import { useState } from "react";
import {
  Button,
  Container,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Box,
  CircularProgress,
  Switch,
} from "@mui/material";
import { Edit, Delete } from "@mui/icons-material";
import { useMenu, MenuFormValues } from "../../../hooks/useMenu";
import { MenuItem, OptionGroup } from "../../../types";
import MenuFormDialog from "../../../components/MenuFormDialog";
import { getStorage, ref, uploadBytes, listAll, getDownloadURL } from "firebase/storage";
import { useAuth } from "../../../hooks/useAuth";

// --- STORAGE CONNECTION TEST ---
const StorageConnectionTest = () => {
  const { user } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [message, setMessage] = useState('');
  const [fileList, setFileList] = useState<string[]>([]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) setFile(e.target.files[0]);
  };

  const handleUpload = async () => {
    if (!file || !user?.uid) {
      setMessage('File not selected or user not logged in.');
      return;
    }
    setMessage('Uploading...');
    try {
      const storage = getStorage();
      const storageRef = ref(storage, `connection-test/${user.uid}/${file.name}`);
      const snapshot = await uploadBytes(storageRef, file);
      setMessage(`Upload SUCCESS! Path: ${snapshot.ref.fullPath}`);
    } catch (e: any) {
      console.error('[StorageConnectionTest] Upload failed:', e);
      setMessage(`Upload FAILED: ${e.message}`);
    }
  };

  const handleListFiles = async () => {
    if (!user?.uid) {
      setMessage('User not logged in.');
      return;
    }
    setMessage('Listing files...');
    setFileList([]);
    try {
      const storage = getStorage();
      const listRef = ref(storage, `connection-test/${user.uid}`);
      const res = await listAll(listRef);

      const urls = await Promise.all(res.items.map(itemRef => getDownloadURL(itemRef)));

      setFileList(urls);
      setMessage(`Found ${urls.length} files.`);
    } catch (e: any) {
      console.error('[StorageConnectionTest] List files failed:', e);
      setMessage(`List files FAILED: ${e.message}`);
    }
  };

  return (
    <Box sx={{ border: '2px dashed blue', p: 2, mb: 2 }}>
      <Typography variant="h6">Storage Connection Test</Typography>
      <input type="file" onChange={handleFileChange} />
      <Button onClick={handleUpload} variant="contained" sx={{ ml: 2 }}>Test Upload</Button>
      <Button onClick={handleListFiles} variant="outlined" sx={{ ml: 2 }}>Test List Files</Button>
      <Typography sx={{ mt: 1, whiteSpace: 'pre-wrap' }}>
        {message}
      </Typography>
      {fileList.length > 0 && (
        <Box>
          <Typography>Files:</Typography>
          <ul>
            {fileList.map((url, i) => <li key={i}><a href={url} target="_blank" rel="noopener noreferrer">File {i+1}</a></li>)}
          </ul>
        </Box>
      )}
    </Box>
  );
};
// --- END STORAGE CONNECTION TEST ---

// Dummy data for initial layout - to be replaced with a hook
const dummyOptionGroups: OptionGroup[] = [
  {
    id: '1',
    storeId: 'dummy-store-id',
    name: 'サイズ',
    selectionType: 'single',
    choices: [
      { id: 's', name: 'S', priceModifier: 0 },
      { id: 'm', name: 'M', priceModifier: 50 },
      { id: 'l', name: 'L', priceModifier: 100 },
    ],
  },
  {
    id: '2',
    storeId: 'dummy-store-id',
    name: 'トッピング',
    selectionType: 'multiple',
    choices: [
      { id: 'cheese', name: 'チーズ', priceModifier: 100 },
      { id: 'bacon', name: 'ベーコン', priceModifier: 150 },
    ],
  },
];

export default function MenuAdminPage() {
  const { menus, loading, saveMenuItem, deleteMenuItem, toggleSoldOut } = useMenu();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingMenuItem, setEditingMenuItem] = useState<MenuItem | null>(null);
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [deletingMenuItem, setDeletingMenuItem] = useState<MenuItem | null>(null);

  const handleOpenForm = (menuItem: MenuItem | null) => {
    setEditingMenuItem(menuItem);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingMenuItem(null);
  };

  const handleFormSubmit = async (values: MenuFormValues) => {
    console.log('[MenuAdminPage] handleFormSubmit started.', values);
    try {
      console.log('[MenuAdminPage] Calling saveMenuItem...');
      await saveMenuItem(values, editingMenuItem);
      console.log('[MenuAdminPage] saveMenuItem finished. Closing form.');
      handleCloseForm();
    } catch (error) {
      console.error("[MenuAdminPage] Failed to save menu item:", error);
      // ここでユーザーにエラーを通知するUI（Snackbarなど）を表示することも可能
    }
  };

  const handleOpenDeleteAlert = (menuItem: MenuItem) => {
    setDeletingMenuItem(menuItem);
    setIsAlertOpen(true);
  };

  const handleCloseDeleteAlert = () => {
    setIsAlertOpen(false);
    setDeletingMenuItem(null);
  };

  const handleDeleteConfirm = async () => {
    if (deletingMenuItem) {
      await deleteMenuItem(deletingMenuItem.id);
      handleCloseDeleteAlert();
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <StorageConnectionTest />
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
        <Typography variant="h4" component="h1">
          メニュー管理
        </Typography>
        <Button variant="contained" onClick={() => handleOpenForm(null)}>
          新規追加
        </Button>
      </Box>

      {loading ? (
        <CircularProgress />
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>商品名</TableCell>
                <TableCell align="right">価格</TableCell>
                <TableCell>カテゴリ</TableCell>
                <TableCell>売り切れ</TableCell>
                <TableCell align="center">アクション</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {menus.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>{row.name}</TableCell>
                  <TableCell align="right">¥{row.price.toLocaleString()}</TableCell>
                  <TableCell>{row.category}</TableCell>
                  <TableCell>
                    <Switch
                      checked={row.isSoldOut}
                      onChange={() => toggleSoldOut(row)}
                    />
                  </TableCell>
                  <TableCell align="center">
                    <IconButton onClick={() => handleOpenForm(row)}><Edit /></IconButton>
                    <IconButton onClick={() => handleOpenDeleteAlert(row)}><Delete /></IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <MenuFormDialog
        open={isFormOpen}
        onClose={handleCloseForm}
        onSubmit={handleFormSubmit}
        editingMenuItem={editingMenuItem}
        optionGroups={dummyOptionGroups}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={isAlertOpen} onClose={handleCloseDeleteAlert}>
        <DialogTitle>本当に削除しますか？</DialogTitle>
        <DialogContent>
          <Typography>「{deletingMenuItem?.name}」をメニューから完全に削除します。この操作は元に戻せません。</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteAlert}>キャンセル</Button>
          <Button onClick={handleDeleteConfirm} color="error">
            削除
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
