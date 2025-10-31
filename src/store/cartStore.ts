import { create } from 'zustand';
import { MenuItem, OptionChoice } from '../types';
import { uid } from 'uid';

// Represents the selected options for a specific cart item
export type SelectedOptions = Record<string, OptionChoice | OptionChoice[]>;

export type CartItem = {
  cartItemId: string; // Unique ID for this specific cart entry
  item: MenuItem;
  quantity: number;
  selectedOptions?: SelectedOptions;
  itemPriceWithOptions: number;
};

interface CartState {
  items: CartItem[];
  // `addItem` now accepts optional selected options
  addItem: (item: MenuItem, selectedOptions?: SelectedOptions) => void;
  removeItem: (cartItemId: string) => void;
  updateQuantity: (cartItemId: string, quantity: number) => void;
  clearCart: () => void;
  totalPrice: () => number;
  totalItems: () => number;
}

// Helper to calculate price with options
const calculateItemPrice = (item: MenuItem, selectedOptions?: SelectedOptions): number => {
  let price = item.price;
  if (selectedOptions) {
    for (const group of Object.values(selectedOptions)) {
      if (Array.isArray(group)) {
        price += group.reduce((sum, choice) => sum + choice.priceModifier, 0);
      } else {
        price += group.priceModifier;
      }
    }
  }
  return price;
};

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  addItem: (item, selectedOptions) =>
    set((state) => {
      // For items without options, check if it already exists and increment quantity
      if (!selectedOptions) {
        const existingItem = state.items.find(
          (cartItem) => cartItem.item.id === item.id && !cartItem.selectedOptions
        );
        if (existingItem) {
          return {
            items: state.items.map((cartItem) =>
              cartItem.cartItemId === existingItem.cartItemId
                ? { ...cartItem, quantity: cartItem.quantity + 1 }
                : cartItem
            ),
          };
        }
      }
      // For items with options, or new items without options, add as a new entry
      const newItem: CartItem = {
        cartItemId: uid(),
        item,
        quantity: 1,
        selectedOptions,
        itemPriceWithOptions: calculateItemPrice(item, selectedOptions),
      };
      return { items: [...state.items, newItem] };
    }),
  removeItem: (cartItemId) =>
    set((state) => ({
      items: state.items.filter((cartItem) => cartItem.cartItemId !== cartItemId),
    })),
  updateQuantity: (cartItemId, quantity) =>
    set((state) => {
      if (quantity <= 0) {
        return { items: state.items.filter((cartItem) => cartItem.cartItemId !== cartItemId) };
      }
      return {
        items: state.items.map((cartItem) =>
          cartItem.cartItemId === cartItemId ? { ...cartItem, quantity } : cartItem
        ),
      };
    }),
  clearCart: () => set({ items: [] }),
  totalPrice: () => {
    return get().items.reduce((total, cartItem) => total + cartItem.itemPriceWithOptions * cartItem.quantity, 0);
  },
  totalItems: () => {
    return get().items.reduce((total, cartItem) => total + cartItem.quantity, 0);
  },
}));
