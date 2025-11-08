
import { useEffect } from 'react';
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Button,
  Box,
  RadioGroup,
  FormControlLabel,
  Radio,
  Typography,
  IconButton,
} from '@mui/material';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { optionGroupFormSchema, OptionGroupFormValues } from '../hooks/useOptionGroups';
import { OptionGroup } from '../types';
import { AddCircleOutline, DeleteOutline } from '@mui/icons-material';

interface OptionGroupFormDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (values: OptionGroupFormValues) => void;
  editingOptionGroup: OptionGroup | null;
}

export default function OptionGroupFormDialog({
  open,
  onClose,
  onSubmit,
  editingOptionGroup,
}: OptionGroupFormDialogProps) {
  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors, isSubmitting },
  } = useForm<OptionGroupFormValues>({
    resolver: zodResolver(optionGroupFormSchema),
    defaultValues: {
      name: '',
      selectionType: 'single',
      choices: [{ name: '', priceModifier: 0 }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "choices",
  });

  useEffect(() => {
    if (open) {
      if (editingOptionGroup) {
        reset(editingOptionGroup);
      } else {
        reset({
          name: '',
          selectionType: 'single',
          choices: [{ name: '', priceModifier: 0 }],
        });
      }
    }
  }, [open, editingOptionGroup, reset]);

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>
        {editingOptionGroup ? 'オプションを編集' : 'オプションを追加'}
      </DialogTitle>
      <Box component="form" onSubmit={handleSubmit(onSubmit)}>
        <DialogContent>
          <TextField
            {...register('name')}
            label="オプション名"
            fullWidth
            margin="normal"
            error={!!errors.name}
            helperText={errors.name?.message}
          />
          <Controller
            name="selectionType"
            control={control}
            render={({ field }) => (
              <RadioGroup {...field} row sx={{ mt: 1 }}>
                <FormControlLabel value="single" control={<Radio />} label="1つ選択 (ラジオボタン)" />
                <FormControlLabel value="multiple" control={<Radio />} label="複数選択 (チェックボックス)" />
              </RadioGroup>
            )}
          />

          <Typography variant="h6" sx={{ mt: 3, mb: 1 }}>
            選択肢
          </Typography>
          {fields.map((item, index) => (
            <Box key={item.id} sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <TextField
                {...register(`choices.${index}.name`)}
                label="選択肢名"
                size="small"
                sx={{ flexGrow: 1, mr: 1 }}
                error={!!errors.choices?.[index]?.name}
                helperText={errors.choices?.[index]?.name?.message}
              />
              <TextField
                {...register(`choices.${index}.priceModifier`)}
                label="価格変更 (円)"
                type="number"
                size="small"
                sx={{ width: 120, mr: 1 }}
                error={!!errors.choices?.[index]?.priceModifier}
                helperText={errors.choices?.[index]?.priceModifier?.message}
              />
              <IconButton onClick={() => remove(index)} color="error">
                <DeleteOutline />
              </IconButton>
            </Box>
          ))}
          {errors.choices?.root && (
            <Typography color="error" variant="body2" sx={{ mt: 1 }}>
              {errors.choices.root.message}
            </Typography>
          )}

          <Button
            startIcon={<AddCircleOutline />}
            onClick={() => append({ name: '', priceModifier: 0 })}
            sx={{ mt: 1 }}
          >
            選択肢を追加
          </Button>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>キャンセル</Button>
          <Button type="submit" variant="contained" disabled={isSubmitting}>
            {isSubmitting ? '保存中...' : '保存'}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
}
