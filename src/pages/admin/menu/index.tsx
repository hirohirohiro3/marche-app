import { useState, useEffect } from "react";
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
  Chip,
  TextField,
  InputAdornment,
} from "@mui/material";
import { Edit, Delete, Settings } from "@mui/icons-material";
import { useMenu, MenuFormValues } from "../../../hooks/useMenu";
import { useOptionGroups } from "../../../hooks/useOptionGroups";
import { MenuItem } from "../../../types";
import MenuFormDialog from "../../../components/MenuFormDialog";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../../../firebase";
import { useAuth } from "../../../hooks/useAuth";

import HelpSection from "../../../components/HelpSection";

export default function MenuAdminPage() {
  const { menus, loading: menuLoading, saveMenuItem, deleteMenuItem, toggleSoldOut } = useMenu();
  const { optionGroups, loading: optionsLoading } = useOptionGroups();
  const { user } = useAuth();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingMenuItem, setEditingMenuItem] = useState<MenuItem | null>(null);
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [deletingMenuItem, setDeletingMenuItem] = useState<MenuItem | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  // Stock Alert Settings
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [lowStockThreshold, setLowStockThreshold] = useState<number>(5);
  const [lowStockThresholdInput, setLowStockThresholdInput] = useState<string>("5");
  const [categoryIcons, setCategoryIcons] = useState<Record<string, string>>({});
  const [settingsLoading, setSettingsLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    const fetchSettings = async () => {
      try {
        const storeRef = doc(db, 'stores', user.uid);
        const storeDoc = await getDoc(storeRef);
        if (storeDoc.exists()) {
          const data = storeDoc.data();
          if (data.lowStockThreshold !== undefined) {
            setLowStockThreshold(data.lowStockThreshold);
          }
          if (data.categoryIcons) {
            setCategoryIcons(data.categoryIcons);
          }
        }
      } catch (error) {
        console.error("Error fetching settings:", error);
      }
    };
    fetchSettings();
  }, [user]);

  const handleOpenSettings = () => {
    setLowStockThresholdInput(String(lowStockThreshold));
    setIsSettingsOpen(true);
  };

  const handleSaveSettings = async () => {
    if (!user) return;
    const threshold = parseInt(lowStockThresholdInput, 10);
    if (isNaN(threshold) || threshold < 0) {
      alert("有効な数値を入力してください。");
      return;
    }

    setSettingsLoading(true);
    try {
      const storeRef = doc(db, 'stores', user.uid);
      await setDoc(storeRef, {
        lowStockThreshold: threshold,
        categoryIcons: categoryIcons
      }, { merge: true });
      setLowStockThreshold(threshold);
      setIsSettingsOpen(false);
    } catch (error) {
      console.error("Error saving settings:", error);
      alert("設定の保存に失敗しました。");
    } finally {
      setSettingsLoading(false);
    }
  };

  const loading = menuLoading || optionsLoading;

  const handleOpenForm = (menuItem: MenuItem | null) => {
    setEditingMenuItem(menuItem);
    setFormError(null); // Clear previous errors when opening
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingMenuItem(null);
  };

  const handleFormSubmit = async (data: MenuFormValues) => {
    try {
      await saveMenuItem(data, editingMenuItem);
      handleCloseForm();
    } catch (error) {
      console.error("Failed to save menu item:", error);
      setFormError("保存に失敗しました。");
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
      <HelpSection title="メニュー管理について">
        <ul style={{ margin: 0, paddingLeft: '1.5rem' }}>
          <li>右上の「商品を追加」ボタンから商品を登録できます。</li>
          <li>商品をクリックすると編集・削除が可能です。</li>
          <li><strong>オプション設定</strong>: 商品編集画面で、作成したオプショングループ（サイズやトッピングなど）を紐付けることができます。</li>
          <li>「在庫管理」を有効にすると、在庫が0になった際に自動で「売り切れ」になります。</li>
        </ul>
      </HelpSection>

      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
        <Typography variant="h4" component="h1">
          メニュー管理
        </Typography>
        <Box>
          <Button
            variant="outlined"
            startIcon={<Settings />}
            onClick={handleOpenSettings}
            sx={{ mr: 2 }}
          >
            メニュー設定
          </Button>
          <Button variant="contained" onClick={() => handleOpenForm(null)}>
            新規追加
          </Button>
        </Box>
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
                <TableCell align="center">在庫数</TableCell>
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
                  <TableCell align="center">
                    {row.manageStock ? (
                      <Chip
                        label={`${row.stock || 0}個`}
                        size="small"
                        sx={{
                          bgcolor:
                            (row.stock || 0) <= lowStockThreshold
                              ? 'error.main'
                              : 'success.main',
                          color: 'white',
                          fontWeight: 'bold',
                        }}
                      />
                    ) : (
                      <Typography variant="body2" color="text.secondary">-</Typography>
                    )}
                  </TableCell>
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

      {/* Menu Settings Dialog */}
      <Dialog open={isSettingsOpen} onClose={() => setIsSettingsOpen(false)}>
        <DialogTitle>メニュー設定</DialogTitle>
        <DialogContent>
          <Box sx={{ mb: 4, pt: 1 }}>
            <Typography variant="h6" gutterBottom>
              在庫アラート設定
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              商品の在庫数がこの値を下回ると、管理画面で赤色のアラートが表示されます。
              また、顧客画面では自動的に「売り切れ」として表示されます。
            </Typography>
            <TextField
              autoFocus
              margin="dense"
              id="lowStockThreshold"
              label="在庫アラート閾値"
              type="number"
              fullWidth
              variant="outlined"
              value={lowStockThresholdInput}
              onChange={(e) => setLowStockThresholdInput(e.target.value)}
              InputProps={{
                endAdornment: <InputAdornment position="end">個以下</InputAdornment>,
              }}
              disabled={settingsLoading}
            />
          </Box>

          <Box>
            <Typography variant="h6" gutterBottom>
              カテゴリーアイコン設定
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              顧客画面のカテゴリータブやヘッダーに表示されるアイコンを設定できます。
              絵文字（例：🍔, ☕️, 🍰）や短いテキストを入力してください。
              設定しない場合は、デフォルトのアイコンが表示されます。
            </Typography>

            {Array.from(new Set(menus.map(m => m.category))).sort().map(category => (
              <Box key={category} sx={{ display: 'flex', alignItems: 'center', mb: 2, gap: 2 }}>
                <Typography sx={{ minWidth: 120, fontWeight: 'bold' }}>
                  {category}
                </Typography>
                <TextField
                  size="small"
                  placeholder="例: 🍔"
                  value={categoryIcons[category] || ''}
                  onChange={(e) => setCategoryIcons(prev => ({
                    ...prev,
                    [category]: e.target.value
                  }))}
                  fullWidth
                  disabled={settingsLoading}
                />
              </Box>
            ))}
            {menus.length === 0 && (
              <Typography variant="body2" color="text.secondary">
                カテゴリーが表示されません。まずはメニュー商品を登録してください。
              </Typography>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsSettingsOpen(false)} disabled={settingsLoading}>
            キャンセル
          </Button>
          <Button onClick={handleSaveSettings} variant="contained" disabled={settingsLoading}>
            保存
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
