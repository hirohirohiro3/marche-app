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
    TextField,
} from '@mui/material';
import { Add, Remove, Close } from '@mui/icons-material';
import { MenuItem, OptionGroup, OptionChoice } from '../types';
import { useCartStore, SelectedOptions } from '../store/cartStore';

interface AddToCartModalProps {
    open: boolean;
    onClose: () => void;
    menuItem: MenuItem | null;
    optionGroups: OptionGroup[];
    onAddToCart?: (menuItem: MenuItem, quantity: number, totalPrice: number, selectedOptions: SelectedOptions | undefined) => void;
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
    overflow: 'auto',
};

export default function AddToCartModal({
    open,
    onClose,
    menuItem,
    optionGroups,
    onAddToCart: customOnAddToCart,
}: AddToCartModalProps) {
    const [quantity, setQuantity] = useState(1);
    const [selectedOptions, setSelectedOptions] = useState<Record<string, string | string[]>>({});
    const { addItem } = useCartStore();

    const basePrice = menuItem?.price || 0;

    // Calculate total price including options
    const totalPrice = useMemo(() => {
        let price = basePrice;

        optionGroups.forEach((group) => {
            const selection = selectedOptions[group.id];
            if (!selection) return;

            if (Array.isArray(selection)) {
                // Multiple selection
                selection.forEach((choiceId) => {
                    const choice = group.choices.find((c) => c.id === choiceId);
                    if (choice) price += choice.priceModifier;
                });
            } else {
                // Single selection
                const choice = group.choices.find((c) => c.id === selection);
                if (choice) price += choice.priceModifier;
            }
        });

        return price * quantity;
    }, [basePrice, selectedOptions, optionGroups, quantity]);

    useEffect(() => {
        if (open) {
            setQuantity(1);
            setSelectedOptions({});
        }
    }, [open]);

    if (!menuItem) return null;

    const handleOptionChange = (groupId: string, choiceId: string, isMultiple: boolean) => {
        setSelectedOptions((prev) => {
            if (isMultiple) {
                const current = (prev[groupId] as string[]) || [];
                const newSelection = current.includes(choiceId)
                    ? current.filter((id) => id !== choiceId)
                    : [...current, choiceId];
                return { ...prev, [groupId]: newSelection };
            } else {
                return { ...prev, [groupId]: choiceId };
            }
        });
    };

    const handleAddToCart = () => {
        if (!menuItem) return;

        // Convert selectedOptions to SelectedOptions format for cartStore
        const mappedOptions: SelectedOptions = {};
        optionGroups.forEach((group) => {
            const selection = selectedOptions[group.id];
            if (!selection) return;

            if (Array.isArray(selection)) {
                const choices = selection
                    .map((choiceId) => group.choices.find((c) => c.id === choiceId))
                    .filter((c): c is OptionChoice => c !== undefined);
                if (choices.length > 0) {
                    mappedOptions[group.id] = choices;
                }
            } else {
                const choice = group.choices.find((c) => c.id === selection);
                if (choice) {
                    mappedOptions[group.id] = choice;
                }
            }
        });

        const finalOptions = Object.keys(mappedOptions).length > 0 ? mappedOptions : undefined;

        // Use custom callback if provided, otherwise use default cart store
        if (customOnAddToCart) {
            customOnAddToCart(menuItem, quantity, totalPrice, finalOptions);
        } else {
            // Add to cart with the specified quantity
            for (let i = 0; i < quantity; i++) {
                addItem(menuItem, finalOptions);
            }
        }

        onClose();
    };

    return (
        <Modal open={open} onClose={onClose}>
            <Box sx={style}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6">{menuItem.name}</Typography>
                    <IconButton onClick={onClose}>
                        <Close />
                    </IconButton>
                </Box>

                {/* Quantity Selector */}
                <Box sx={{ mb: 3 }}>
                    <Typography variant="subtitle1" gutterBottom>
                        個数
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <IconButton
                            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                            disabled={quantity <= 1}
                            color="primary"
                        >
                            <Remove />
                        </IconButton>
                        <TextField
                            type="number"
                            value={quantity}
                            onChange={(e) => {
                                const val = parseInt(e.target.value);
                                if (!isNaN(val) && val >= 1) setQuantity(val);
                            }}
                            inputProps={{ min: 1, style: { textAlign: 'center' } }}
                            sx={{ width: '80px' }}
                        />
                        <IconButton onClick={() => setQuantity((q) => q + 1)} color="primary">
                            <Add />
                        </IconButton>
                    </Box>
                </Box>

                {/* Options */}
                {optionGroups.length > 0 && (
                    <Box sx={{ mb: 2 }}>
                        {optionGroups.map((group) => (
                            <Box key={group.id} sx={{ mb: 2 }}>
                                <Typography variant="subtitle1" gutterBottom>
                                    {group.name}
                                </Typography>
                                {group.selectionType === 'single' ? (
                                    <RadioGroup
                                        value={selectedOptions[group.id] || ''}
                                        onChange={(e) => handleOptionChange(group.id, e.target.value, false)}
                                    >
                                        {group.choices.map((choice) => (
                                            <FormControlLabel
                                                key={choice.id}
                                                value={choice.id}
                                                control={<Radio />}
                                                label={`${choice.name} ${choice.priceModifier > 0 ? `(+¥${choice.priceModifier})` : ''}`}
                                            />
                                        ))}
                                    </RadioGroup>
                                ) : (
                                    <FormGroup>
                                        {group.choices.map((choice) => (
                                            <FormControlLabel
                                                key={choice.id}
                                                control={
                                                    <Checkbox
                                                        checked={((selectedOptions[group.id] as string[]) || []).includes(choice.id)}
                                                        onChange={() => handleOptionChange(group.id, choice.id, true)}
                                                    />
                                                }
                                                label={`${choice.name} ${choice.priceModifier > 0 ? `(+¥${choice.priceModifier})` : ''}`}
                                            />
                                        ))}
                                    </FormGroup>
                                )}
                            </Box>
                        ))}
                    </Box>
                )}

                {/* Total and Add Button */}
                <Box sx={{ mt: 'auto', pt: 2, borderTop: '1px solid #e0e0e0' }}>
                    <Typography variant="h5" align="right" gutterBottom>
                        合計: ¥{totalPrice.toLocaleString()}
                    </Typography>
                    <Button variant="contained" fullWidth onClick={handleAddToCart} size="large">
                        カートに入れる
                    </Button>
                </Box>
            </Box>
        </Modal>
    );
}
