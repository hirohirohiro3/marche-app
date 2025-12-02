// src/components/ManualOrderModal.test.tsx
import { render, screen, fireEvent, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import ManualOrderModal from './ManualOrderModal';
import { MenuItem } from '../types';

// Mock firebase and hooks
vi.mock('../firebase');
vi.mock('../hooks/useAuth', () => ({
  useAuth: () => ({ user: { uid: 'test-user' } }),
}));

vi.mock('../hooks/useOptionGroups', () => ({
  useOptionGroups: () => ({ optionGroups: [] }),
}));

// Mock AddToCartModal
vi.mock('./AddToCartModal', () => ({
  default: ({ open, onAddToCart, menuItem }: any) => {
    if (!open) return null;
    return (
      <div data-testid="mock-add-to-cart-modal">
        <button
          onClick={() => onAddToCart(menuItem, 1, menuItem.price, {})}
          data-testid="mock-add-button"
        >
          Add {menuItem?.name}
        </button>
      </div>
    );
  },
}));

const mockMenuItems: MenuItem[] = [
  { id: '1', name: 'Coffee', price: 500, category: 'Drinks', description: 'Hot coffee', imageUrl: '', isSoldOut: false, sortOrder: 1, storeId: 'test', manageStock: false },
  { id: '2', name: 'Tea', price: 450, category: 'Drinks', description: 'Hot tea', imageUrl: '', isSoldOut: false, sortOrder: 2, storeId: 'test', manageStock: false },
];

describe('ManualOrderModal', () => {
  it('should render menu items and add to cart on click', async () => {
    // const user = userEvent.setup();
    render(<ManualOrderModal open={true} onClose={() => { }} menuItems={mockMenuItems} />);

    // Check if modal title and menu items are rendered
    expect(screen.getByText('手動注文 (POS)')).toBeInTheDocument();
    expect(screen.getByText('Coffee')).toBeInTheDocument();
    expect(screen.getByText('Tea')).toBeInTheDocument();

    // Initially, the cart is empty
    expect(screen.getByText('商品が追加されていません。')).toBeInTheDocument();
    expect(screen.getByTestId('total-price')).toHaveTextContent('合計: ¥0');

    // Click on a menu item to open the modal
    const coffeeButton = screen.getByText('Coffee');
    fireEvent.click(coffeeButton);

    // Click the mock add button (wait for it to appear)
    const addButton = await screen.findByTestId('mock-add-button');
    fireEvent.click(addButton);

    // Verify item is added to the cart
    const cartItemText = await screen.findByText(/Coffee x 1/);
    expect(cartItemText).toBeInTheDocument();
    expect(screen.getByTestId('total-price')).toHaveTextContent('合計: ¥500');

    // Add another one
    fireEvent.click(coffeeButton);
    const addButton2 = await screen.findByTestId('mock-add-button');
    fireEvent.click(addButton2);

    expect(await screen.findByText(/Coffee x 2/)).toBeInTheDocument();
    expect(screen.getByTestId('total-price')).toHaveTextContent('合計: ¥1000');
  });

  it('should remove items from cart correctly', async () => {
    // const user = userEvent.setup();
    render(<ManualOrderModal open={true} onClose={() => { }} menuItems={mockMenuItems} />);

    const coffeeButton = screen.getByText('Coffee');

    // Add 2 items
    fireEvent.click(coffeeButton);
    let addButton = await screen.findByTestId('mock-add-button');
    fireEvent.click(addButton);

    fireEvent.click(coffeeButton);
    addButton = await screen.findByTestId('mock-add-button');
    fireEvent.click(addButton);

    const cartItemText = await screen.findByText(/Coffee x 2/);
    expect(cartItemText).toBeInTheDocument();

    // Find remove button
    const removeButtons = screen.getAllByText('削除');
    fireEvent.click(removeButtons[0]); // quantity: 1

    expect(await screen.findByText(/Coffee x 1/)).toBeInTheDocument();
    expect(screen.getByTestId('total-price')).toHaveTextContent('合計: ¥500');

    fireEvent.click(removeButtons[0]); // remove completely
    expect(screen.queryByText(/Coffee/)).not.toBeInTheDocument();
    expect(screen.getByText('商品が追加されていません。')).toBeInTheDocument();
  });

  it('should call onClose when the close button is clicked', async () => {
    // const user = userEvent.setup();
    const handleClose = vi.fn();
    render(<ManualOrderModal open={true} onClose={handleClose} menuItems={mockMenuItems} />);

    const closeButton = screen.getByTestId('close-modal-button');
    fireEvent.click(closeButton);

    expect(handleClose).toHaveBeenCalledTimes(1);
  });
});
