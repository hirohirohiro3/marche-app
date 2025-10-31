import { useState, useMemo, useEffect } from 'react';
import {
  Modal,
  Box,
  Typography,
  Button,
  IconButton,
  RadioGroup,
  FormControlLabel,
  Radio,
  FormGroup,
  Checkbox,
} from '@mui/material';
import Close from '@mui/icons-material/Close';
import { MenuItem, OptionGroup, OptionChoice } from '../types';

interface OptionSelectModalProps {
  open: boolean;
  onClose: () => void;
  menuItem: MenuItem | null;
  optionGroups: OptionGroup[];
  onAddToCart: (item: MenuItem, selectedOptions: Record<string, OptionChoice | OptionChoice[]>) => void;
}

const style = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: '90vw',
  maxWidth: '500px',
  bgcolor: 'background.paper',
  boxShadow: 24,
  p: 4,
  borderRadius: 2,
  maxHeight: '90vh',
  display: 'flex',
  flexDirection: 'column',
};

export default function OptionSelectModal({
  open,
  onClose,
  menuItem,
  optionGroups,
  onAddToCart,
}: OptionSelectModalProps) {
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string | string[]>>({});

  const basePrice = menuItem?.price || 0;

  // This is a simplified calculation logic for now
  const totalPrice = useMemo(() => {
    let price = basePrice;
    // Real logic will be more complex, involving looking up choices
    return price;
  }, [basePrice, selectedOptions]);

  useEffect(() => {
    if (open) {
      setSelectedOptions({});
    }
  }, [open]);

  if (!menuItem) return null;

  const handleAddToCartClick = () => {
    // This will be implemented later
    // onAddToCart(menuItem, mappedSelectedOptions);
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose}>
      <Box sx={style}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">{menuItem.name}</Typography>
          <IconButton onClick={onClose}><Close /></IconButton>
        </Box>

        <Box sx={{ overflowY: 'auto', mb: 2 }}>
          {optionGroups.map((group) => (
            <Box key={group.id} sx={{ mb: 2 }}>
              <Typography variant="subtitle1" gutterBottom>{group.name}</Typography>
              {group.selectionType === 'single' ? (
                <RadioGroup>
                  {group.choices.map((choice) => (
                    <FormControlLabel
                      key={choice.id}
                      value={choice.id}
                      control={<Radio />}
                      label={`${choice.name} (+¥${choice.priceModifier})`}
                    />
                  ))}
                </RadioGroup>
              ) : (
                <FormGroup>
                  {group.choices.map((choice) => (
                    <FormControlLabel
                      key={choice.id}
                      control={<Checkbox />}
                      label={`${choice.name} (+¥${choice.priceModifier})`}
                    />
                  ))}
                </FormGroup>
              )}
            </Box>
          ))}
        </Box>

        <Box sx={{ mt: 'auto' }}>
          <Typography variant="h5" align="right" gutterBottom>
            合計: ¥{totalPrice.toLocaleString()}
          </Typography>
          <Button
            variant="contained"
            fullWidth
            onClick={handleAddToCartClick}
          >
            カートに追加
          </Button>
        </Box>
      </Box>
    </Modal>
  );
}
