import { create } from 'zustand';
import { MenuItem } from '../types';

export type CartItem = {
  item: MenuItem;
  quantity: number;
};

interface CartState {
  items: CartItem[];
  addItem: (item: MenuItem) => void;
  removeItem: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => void;
  totalPrice: () => number;
  totalItems: () => number;
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  addItem: (item) =>
    set((state) => {
      const existingItem = state.items.find((cartItem) => cartItem.item.id === item.id);
      if (existingItem) {
        return {
          items: state.items.map((cartItem) =>
            cartItem.item.id === item.id
              ? { ...cartItem, quantity: cartItem.quantity + 1 }
              : cartItem
          ),
        };
      }
      return { items: [...state.items, { item, quantity: 1 }] };
    }),
  removeItem: (itemId) =>
    set((state) => ({
      items: state.items.filter((cartItem) => cartItem.item.id !== itemId),
    })),
  updateQuantity: (itemId, quantity) =>
    set((state) => {
      if (quantity <= 0) {
        return { items: state.items.filter((cartItem) => cartItem.item.id !== itemId) };
      }
      return {
        items: state.items.map((cartItem) =>
          cartItem.item.id === itemId ? { ...cartItem, quantity } : cartItem
        ),
      };
    }),
  clearCart: () => set({ items: [] }),
  totalPrice: () => {
    return get().items.reduce((total, cartItem) => total + cartItem.item.price * cartItem.quantity, 0);
  },
  totalItems: () => {
    return get().items.reduce((total, cartItem) => total + cartItem.quantity, 0);
  },
}));
