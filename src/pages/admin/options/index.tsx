import { useState } from 'react';
import {
  Button,
  Container,
  Typography,
  Box,
  Paper,
  List,
  ListItem,
  ListItemText,
  IconButton,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert
} from '@mui/material';
import HelpSection from '../../../components/HelpSection';
import { Edit, Delete } from '@mui/icons-material';
import { useOptionGroups, OptionGroupFormValues } from '../../../hooks/useOptionGroups';
import { OptionGroup } from '../../../types';
import OptionGroupFormDialog from '../../../components/OptionGroupFormDialog';

export default function OptionsAdminPage() {
  const { optionGroups, loading, saveOptionGroup, deleteOptionGroup } = useOptionGroups();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingOptionGroup, setEditingOptionGroup] = useState<OptionGroup | null>(null);
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [deletingOptionGroup, setDeletingOptionGroup] = useState<OptionGroup | null>(null);

  const handleOpenForm = (group: OptionGroup | null) => {
    setEditingOptionGroup(group);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingOptionGroup(null);
  };

  const handleFormSubmit = async (values: OptionGroupFormValues) => {
    try {
      await saveOptionGroup(values, editingOptionGroup);
      handleCloseForm();
    } catch (error) {
      console.error("オプションの保存に失敗しました:", error);
    }
  };

  const handleOpenDeleteAlert = (group: OptionGroup) => {
    setDeletingOptionGroup(group);
    setIsAlertOpen(true);
  };

  const handleCloseDeleteAlert = () => {
    setIsAlertOpen(false);
    setDeletingOptionGroup(null);
  };

  const handleDeleteConfirm = async () => {
    if (deletingOptionGroup) {
      await deleteOptionGroup(deletingOptionGroup.id);
      handleCloseDeleteAlert();
    }
  };

  return (
    <Container maxWidth="lg">
      <HelpSection title="オプション管理について">
        <Box sx={{ '& h3': { fontSize: '1rem', fontWeight: 'bold', mt: 2, mb: 1 }, '& p': { mb: 1 }, '& ul': { pl: 3 } }}>
          <Typography variant="body2" paragraph>
            お客様が商品を注文する時に、サイズやトッピングを選べるようにする機能です。
          </Typography>

          <h3>設定例</h3>
          <ul>
            <li>
              <strong>サイズ変更（1つだけ選択）</strong><br />
              選択タイプ: 「ラジオボタン」<br />
              選択肢: S (+0円), M (+100円), L (+200円)
            </li>
            <li>
              <strong>トッピング（複数選択可）</strong><br />
              選択タイプ: 「チェックボックス」<br />
              選択肢: チーズ (+100円), ベーコン (+150円)
            </li>
          </ul>

          <h3>作成の流れ</h3>
          <ol style={{ paddingLeft: '1.5rem' }}>
            <li>右上の「新規追加」ボタンをクリック</li>
            <li>グループ名（例：「サイズ」）と選択タイプを入力</li>
            <li>「選択肢を追加」ボタンで、S, M, Lなどの項目を追加</li>
            <li>保存後、<strong>メニュー管理画面で商品に紐付ける</strong>と有効になります。</li>
          </ol>

          <Alert severity="info" sx={{ mt: 1, py: 0 }}>
            <Typography variant="caption">
              <strong>💡 よくある質問</strong><br />
              Q: 1つの商品に複数のオプションを設定できる？<br />
              A: はい！例えば「サイズ」と「トッピング」の両方を設定できます。
            </Typography>
          </Alert>
        </Box>
      </HelpSection>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4" component="h1">
          オプション管理
        </Typography>
        <Button variant="contained" onClick={() => handleOpenForm(null)}>
          新規追加
        </Button>
      </Box>

      {loading ? (
        <CircularProgress />
      ) : (
        <Paper>
          <List>
            {optionGroups.map((group) => (
              <ListItem
                key={group.id}
                secondaryAction={
                  <>
                    <IconButton edge="end" aria-label="edit" onClick={() => handleOpenForm(group)}>
                      <Edit />
                    </IconButton>
                    <IconButton edge="end" aria-label="delete" onClick={() => handleOpenDeleteAlert(group)}>
                      <Delete />
                    </IconButton>
                  </>
                }
              >
                <ListItemText
                  primary={group.name}
                  secondary={`タイプ: ${group.selectionType === 'single' ? '1つ選択' : '複数選択'} | 選択肢: ${group.choices.map(c => c.name).join(', ')}`}
                />
              </ListItem>
            ))}
          </List>
        </Paper>
      )}

      <OptionGroupFormDialog
        open={isFormOpen}
        onClose={handleCloseForm}
        onSubmit={handleFormSubmit}
        editingOptionGroup={editingOptionGroup}
      />

      <Dialog open={isAlertOpen} onClose={handleCloseDeleteAlert}>
        <DialogTitle>本当に削除しますか？</DialogTitle>
        <DialogContent>
          <Typography>「{deletingOptionGroup?.name}」を完全に削除します。この操作は元に戻せません。</Typography>
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
