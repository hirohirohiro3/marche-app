import { test, expect } from '@playwright/test';

test.describe('Manual Order Flow', () => {
  test.beforeEach(async ({ page }) => {
    // 1. Log in
    await page.goto('/login');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password');
    // Using a more robust role selector instead of type="submit"
    await page.getByRole('button', { name: 'Login' }).click();
    await expect(page).toHaveURL('/admin/dashboard');

    // 2. Reset database state via "End of Day" button
    await page.getByRole('button', { name: 'End of Day' }).click();
    // Use getByRole for the confirmation dialog button
    await page.getByRole('button', { name: 'はい' }).click();

    // 3. Wait for all order cards to disappear to confirm reset, as per E2E stabilization rules
    await expect(page.locator('[data-testid="order-kanban-column-new"] .MuiCard-root')).toHaveCount(0);
    await expect(page.locator('[data-testid="order-kanban-column-paid"] .MuiCard-root')).toHaveCount(0);
    await expect(page.locator('[data-testid="order-kanban-column-completed"] .MuiCard-root')).toHaveCount(0);
  });

  test('should create a manual order and see it in the paid column', async ({ page }) => {
    // 1. Open the manual order modal
    await page.getByRole('button', { name: 'Manual Order' }).click();
    await expect(page.getByRole('heading', { name: 'Manual POS' })).toBeVisible();

    // 2. Add items to the cart
    await page.getByRole('button', { name: 'Espresso' }).click();
    await page.getByRole('button', { name: 'Latte' }).click();
    await page.getByRole('button', { name: 'Espresso' }).click(); // Add one more espresso

    // 3. Verify the total price
    await expect(page.getByRole('heading', { name: 'Total: ¥1600' })).toBeVisible();

    // 4. Create the order
    await page.getByRole('button', { name: 'Create Order & Mark as Paid' }).click();

    // 5. Verify the order appears in the "Paid" column
    const paidColumn = page.locator('[data-testid="order-kanban-column-paid"]');

    // Locate the specific card within the column.
    const newOrderCard = paidColumn.locator('.MuiCard-root', { hasText: 'Espresso x 2' });
    await expect(newOrderCard).toBeVisible();
    await expect(newOrderCard).toContainText('Latte x 1');
    await expect(newOrderCard).toContainText('Total: ¥1600');
  });
});
