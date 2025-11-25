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
import { useOptionGroups } from "../../../hooks/useOptionGroups";
import { MenuItem } from "../../../types";
import MenuFormDialog from "../../../components/MenuFormDialog";

export default function MenuAdminPage() {
  const { menus, loading: menuLoading, saveMenuItem, deleteMenuItem, toggleSoldOut } = useMenu();
  const { optionGroups, loading: optionsLoading } = useOptionGroups();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingMenuItem, setEditingMenuItem] = useState<MenuItem | null>(null);
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [deletingMenuItem, setDeletingMenuItem] = useState<MenuItem | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const loading = menuLoading || optionsLoading;

  const handleOpenForm = (menuItem: MenuItem | null) => {
    setEditingMenuItem(menuItem);
    setFormError(null); // Clear previous errors when opening
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingMenuItem(null);
    setFormError(null); // Also clear errors on close
  };

  const handleFormSubmit = async (values: MenuFormValues) => {
    console.log('[MenuAdminPage] handleFormSubmit started.', values);
    setFormError(null);
    try {
      console.log('[MenuAdminPage] Calling saveMenuItem...');
      await saveMenuItem(values, editingMenuItem);
      console.log('[MenuAdminPage] saveMenuItem finished. Closing form.');
      handleCloseForm();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '不明なエラーが発生しました。';
      console.error("[MenuAdminPage] Failed to save menu item:", errorMessage);
      setFormError(errorMessage);
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
        optionGroups={optionGroups}
        error={formError}
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
