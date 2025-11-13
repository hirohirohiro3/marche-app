import { useEffect } from 'react';
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
  Alert,
} from '@mui/material';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { menuFormSchema, MenuFormValues } from '../hooks/useMenu';
import { MenuItem, OptionGroup } from '../types';
import {
  FormGroup,
  Checkbox,
} from '@mui/material';
import ImageCropCompressor from './ImageCropCompressor';


interface MenuFormDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (values: MenuFormValues) => void;
  editingMenuItem: MenuItem | null;
  optionGroups: OptionGroup[];
  error?: string | null;
}

export default function MenuFormDialog({
  open,
  onClose,
  onSubmit,
  editingMenuItem,
  optionGroups,
  error,
}: MenuFormDialogProps) {
  const {
    register,
    handleSubmit,
    reset,
    control,
    watch,
    setValue,
    trigger,
    formState: { errors, isSubmitting, isValid },
  } = useForm<MenuFormValues>({
    resolver: zodResolver(menuFormSchema),
    mode: 'onChange', // enable validation on change
    defaultValues: {
      name: '',
      price: 0,
      category: '',
      description: '',
      sortOrder: 0,
      manageStock: false,
      stock: null,
      optionGroupIds: [],
      imageFile: null,
      imageUrl: null,
    },
  });

  const watchManageStock = watch('manageStock');
  const watchImageUrl = watch('imageUrl');


  useEffect(() => {
    if (open) {
      if (editingMenuItem) {
        reset({
          ...editingMenuItem,
          stock: editingMenuItem.stock ?? null,
          imageFile: null, // Clear file input on open
        });
      } else {
        reset({
          name: '',
          price: 0,
          category: '',
          description: '',
          sortOrder: 0,
          manageStock: false,
          stock: null,
          optionGroupIds: [],
          imageFile: null,
          imageUrl: null,
        });
      }
    }
  }, [open, editingMenuItem, reset]);

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>
        {editingMenuItem ? 'メニューを編集' : 'メニューを追加'}
      </DialogTitle>
      <DialogContent>
        <Box
          component="form"
          noValidate
          onSubmit={handleSubmit(onSubmit)}
          sx={{ mt: 2 }}
        >
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <TextField
            {...register('name')}
            label="商品名"
            fullWidth
            margin="dense"
            required
            error={!!errors.name}
            helperText={errors.name?.message}
          />
          <TextField
            {...register('price')}
            label="価格"
            type="number"
            fullWidth
            margin="dense"
            required
            error={!!errors.price}
            helperText={errors.price?.message}
          />
          <TextField
            {...register('category')}
            label="カテゴリ"
            fullWidth
            margin="dense"
            required
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
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle1">オプション設定</Typography>
            <Controller
              name="optionGroupIds"
              control={control}
              render={({ field }) => (
                <FormGroup>
                  {optionGroups.map((group) => (
                    <FormControlLabel
                      key={group.id}
                      control={
                        <Checkbox
                          checked={field.value?.includes(group.id)}
                          onChange={(e) => {
                            const newValues = e.target.checked
                              ? [...(field.value || []), group.id]
                              : (field.value || []).filter((id) => id !== group.id);
                            field.onChange(newValues);
                          }}
                        />
                      }
                      label={group.name}
                    />
                  ))}
                </FormGroup>
              )}
            />
          </Box>
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
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle1" gutterBottom>商品画像</Typography>
            <ImageCropCompressor
              aspect={16 / 9}
              onCropped={async (file) => {
                setValue('imageFile', file, { shouldDirty: true });
                await trigger('imageFile');
              }}
              initialImageUrl={watchImageUrl}
            />
          </Box>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>キャンセル</Button>
        <Button
          onClick={handleSubmit(onSubmit)}
          variant="contained"
          disabled={!isValid || isSubmitting}
        >
          {isSubmitting ? '保存中...' : '保存'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
