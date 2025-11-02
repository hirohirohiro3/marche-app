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
import { auth } from "../../../firebase";
import { signOut } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { useMenu, MenuFormValues } from "../../../hooks/useMenu";
import { MenuItem, OptionGroup } from "../../../types";
import MenuFormDialog from "../../../components/MenuFormDialog";

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
  const navigate = useNavigate();
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

  const handleFormSubmit = async (values: MenuFormValues, imageFile: File | null) => {
    try {
      await saveMenuItem(values, imageFile, editingMenuItem);
      handleCloseForm(); // Close form only on success
    } catch (error) {
      console.error("Error saving menu item:", error);
      // Optionally: display an error message to the user in the UI
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

  const handleLogout = () => {
    signOut(auth).then(() => navigate("/login"));
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
        <Typography variant="h4" component="h1">
          メニュー管理
        </Typography>
        <div>
          <Button
            variant="contained"
            onClick={() => handleOpenForm(null)}
            sx={{ mr: 2 }}
            data-testid="add-menu-item-button"
          >
            新規追加
          </Button>
          <Button variant="outlined" onClick={handleLogout}>
            ログアウト
          </Button>
        </div>
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
