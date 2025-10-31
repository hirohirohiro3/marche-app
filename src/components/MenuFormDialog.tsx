import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Button,
  Box,
  Typography,
  Switch,
  FormControlLabel,
} from '@mui/material';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { menuFormSchema, MenuFormValues } from '../hooks/useMenu';
import { MenuItem } from '../types';

interface MenuFormDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (values: MenuFormValues, imageFile: File | null) => void;
  editingMenuItem: MenuItem | null;
}

export default function MenuFormDialog({
  open,
  onClose,
  onSubmit,
  editingMenuItem,
}: MenuFormDialogProps) {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const {
    register,
    handleSubmit,
    reset,
    control,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<MenuFormValues>({
    resolver: zodResolver(menuFormSchema),
    defaultValues: {
      manageStock: false,
    },
  });

  const watchManageStock = watch('manageStock');

  useEffect(() => {
    if (open) {
      if (editingMenuItem) {
        reset({
          ...editingMenuItem,
          price: String(editingMenuItem.price),
          sortOrder: String(editingMenuItem.sortOrder),
          stock: String(editingMenuItem.stock ?? ''),
        });
      } else {
        reset({
          name: '',
          price: '0',
          category: '',
          description: '',
          sortOrder: '0',
          manageStock: false,
          stock: '0',
        });
      }
      setImageFile(null);
    }
  }, [open, editingMenuItem, reset]);

  const handleFormSubmit = (values: MenuFormValues) => {
    onSubmit(values, imageFile);
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>
        {editingMenuItem ? 'メニューを編集' : 'メニューを追加'}
      </DialogTitle>
      <DialogContent>
        <Box
          component="form"
          onSubmit={handleSubmit(handleFormSubmit)}
          sx={{ mt: 2 }}
        >
          <TextField
            {...register('name')}
            label="商品名"
            fullWidth
            margin="dense"
            error={!!errors.name}
            helperText={errors.name?.message}
          />
          <TextField
            {...register('price')}
            label="価格"
            type="number"
            fullWidth
            margin="dense"
            error={!!errors.price}
            helperText={errors.price?.message}
          />
          <TextField
            {...register('category')}
            label="カテゴリ"
            fullWidth
            margin="dense"
            error={!!errors.category}
            helperText={errors.category?.message}
          />
          <TextField
            {...register('description')}
            label="商品説明"
            multiline
            rows={3}
            fullWidth
            margin="dense"
          />
          <TextField
            {...register('sortOrder')}
            label="表示順"
            type="number"
            fullWidth
            margin="dense"
          />
          <Controller
            name="manageStock"
            control={control}
            render={({ field }) => (
              <FormControlLabel
                control={<Switch {...field} checked={field.value} />}
                label="在庫を管理する"
                sx={{ mt: 1 }}
              />
            )}
          />
          {watchManageStock && (
            <TextField
              {...register('stock')}
              label="在庫数"
              type="number"
              fullWidth
              margin="dense"
              error={!!errors.stock}
              helperText={errors.stock?.message}
            />
          )}
          <Button variant="contained" component="label" sx={{ mt: 2 }}>
            画像を選択
            <input
              type="file"
              hidden
              accept="image/*"
              onChange={(e) =>
                setImageFile(e.target.files ? e.target.files[0] : null)
              }
            />
          </Button>
          {imageFile && (
            <Typography sx={{ ml: 1, display: 'inline' }}>
              {imageFile.name}
            </Typography>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>キャンセル</Button>
        <Button
          onClick={handleSubmit(handleFormSubmit)}
          variant="contained"
          disabled={isSubmitting}
        >
          {isSubmitting ? '保存中...' : '保存'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
