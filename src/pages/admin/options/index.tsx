
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
} from '@mui/material';
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
