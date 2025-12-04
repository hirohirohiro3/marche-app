import { useState, useMemo, useEffect } from 'react';
import {
    Modal,
    Box,
    Typography,
    Button,
    IconButton,
    RadioGroup,
    Radio,
    FormGroup,
    Checkbox,
    TextField,
} from '@mui/material';
import { Add, Remove, Close } from '@mui/icons-material';
import { MenuItem, OptionGroup, OptionChoice } from '../types';
import { useCartStore, SelectedOptions } from '../store/cartStore';
import { useToast } from '../contexts/ToastContext';
import { useHaptic } from '../hooks/useHaptic';
import { AnimatedButton } from './ui/AnimatedButton';

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
    width: '95vw',
    maxWidth: '500px',
    bgcolor: 'background.paper',
    boxShadow: 24,
    borderRadius: 3,
    maxHeight: '90vh',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden', // Hide overflow for rounded corners
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
    const { showToast } = useToast();
    const { triggerHaptic } = useHaptic();

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
        triggerHaptic('light');
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
        triggerHaptic('success');

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

        showToast(`${menuItem.name}をカートに追加しました`);
        onClose();
    };

    return (
        <Modal open={open} onClose={onClose}>
            <Box sx={style}>
                {/* Header Image */}
                <Box sx={{ position: 'relative', width: '100%', height: '200px', bgcolor: '#f5f5f5' }}>
                    {menuItem.imageUrl ? (
                        <img
                            src={menuItem.imageUrl}
                            alt={menuItem.name}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                    ) : (
                        <Box sx={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'text.disabled' }}>
                            <Typography variant="body2">No Image</Typography>
                        </Box>
                    )}
                    <IconButton
                        onClick={onClose}
                        sx={{
                            position: 'absolute',
                            top: 8,
                            right: 8,
                            bgcolor: 'rgba(255, 255, 255, 0.8)',
                            '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.9)' },
                        }}
                    >
                        <Close />
                    </IconButton>
                </Box>

                <Box sx={{ p: 3, overflow: 'auto', flex: 1 }}>
                    <Box sx={{ mb: 3 }}>
                        <Typography variant="h5" fontWeight="bold" gutterBottom>
                            {menuItem.name}
                        </Typography>
                        <Typography variant="h6" color="primary" fontWeight="bold">
                            ¥{menuItem.price.toLocaleString()}
                        </Typography>
                        {menuItem.description && (
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 1, lineHeight: 1.6 }}>
                                {menuItem.description}
                            </Typography>
                        )}
                    </Box>

                    {/* Quantity Selector */}
                    <Box sx={{ mb: 3 }}>
                        <Typography variant="subtitle1" gutterBottom>
                            個数
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <IconButton
                                onClick={() => {
                                    triggerHaptic('light');
                                    setQuantity((q) => Math.max(1, q - 1));
                                }}
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
                            <IconButton onClick={() => {
                                triggerHaptic('light');
                                setQuantity((q) => q + 1);
                            }} color="primary">
                                <Add />
                            </IconButton>
                        </Box>
                    </Box>

                    {/* Options */}
                    {optionGroups.length > 0 && (
                        <Box sx={{ mb: 4 }}>
                            {optionGroups.map((group) => (
                                <Box key={group.id} sx={{ mb: 3 }}>
                                    <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                                        {group.name}
                                    </Typography>
                                    {group.selectionType === 'single' ? (
                                        <RadioGroup
                                            value={selectedOptions[group.id] || ''}
                                            onChange={(e) => handleOptionChange(group.id, e.target.value, false)}
                                        >
                                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                                {group.choices.map((choice) => {
                                                    const isSelected = selectedOptions[group.id] === choice.id;
                                                    return (
                                                        <Box
                                                            key={choice.id}
                                                            onClick={() => handleOptionChange(group.id, choice.id, false)}
                                                            sx={{
                                                                border: isSelected ? '2px solid #1976d2' : '1px solid #e0e0e0',
                                                                borderRadius: 2,
                                                                p: 1.5,
                                                                cursor: 'pointer',
                                                                bgcolor: isSelected ? 'rgba(25, 118, 210, 0.04)' : 'transparent',
                                                                transition: 'all 0.2s',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'space-between'
                                                            }}
                                                        >
                                                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                                <Radio
                                                                    checked={isSelected}
                                                                    value={choice.id}
                                                                    sx={{ p: 0.5, mr: 1 }}
                                                                />
                                                                <Typography variant="body1">{choice.name}</Typography>
                                                            </Box>
                                                            {choice.priceModifier > 0 && (
                                                                <Typography variant="body2" color="primary" fontWeight="bold">
                                                                    +¥{choice.priceModifier}
                                                                </Typography>
                                                            )}
                                                        </Box>
                                                    );
                                                })}
                                            </Box>
                                        </RadioGroup>
                                    ) : (
                                        <FormGroup>
                                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                                {group.choices.map((choice) => {
                                                    const isSelected = ((selectedOptions[group.id] as string[]) || []).includes(choice.id);
                                                    return (
                                                        <Box
                                                            key={choice.id}
                                                            onClick={() => handleOptionChange(group.id, choice.id, true)}
                                                            sx={{
                                                                border: isSelected ? '2px solid #1976d2' : '1px solid #e0e0e0',
                                                                borderRadius: 2,
                                                                p: 1.5,
                                                                cursor: 'pointer',
                                                                bgcolor: isSelected ? 'rgba(25, 118, 210, 0.04)' : 'transparent',
                                                                transition: 'all 0.2s',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'space-between'
                                                            }}
                                                        >
                                                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                                <Checkbox
                                                                    checked={isSelected}
                                                                    sx={{ p: 0.5, mr: 1 }}
                                                                />
                                                                <Typography variant="body1">{choice.name}</Typography>
                                                            </Box>
                                                            {choice.priceModifier > 0 && (
                                                                <Typography variant="body2" color="primary" fontWeight="bold">
                                                                    +¥{choice.priceModifier}
                                                                </Typography>
                                                            )}
                                                        </Box>
                                                    );
                                                })}
                                            </Box>
                                        </FormGroup>
                                    )}
                                </Box>
                            ))}
                        </Box>
                    )}
                </Box> {/* End of scrollable content */}

                {/* Total and Add Button */}
                <Box sx={{ p: 3, borderTop: '1px solid #f0f0f0', bgcolor: 'background.paper' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Typography variant="h6" fontWeight="bold">
                            合計
                        </Typography>
                        <Typography variant="h5" color="primary" fontWeight="bold">
                            ¥{totalPrice.toLocaleString()}
                        </Typography>
                    </Box>
                    <AnimatedButton
                        variant="contained"
                        fullWidth
                        onClick={handleAddToCart}
                        size="large"
                        sx={{
                            py: 1.5,
                            fontSize: '1.1rem',
                            fontWeight: 'bold',
                            borderRadius: 2,
                            boxShadow: '0 4px 12px rgba(25, 118, 210, 0.3)'
                        }}
                    >
                        カートに入れる
                    </AnimatedButton>
                </Box>
            </Box>
        </Modal>
    );
}
