import { test, expect, Page } from '@playwright/test';

// Helper function to create a manual order using robust selectors
async function createManualOrder(page: Page) {
  await page.getByRole('button', { name: 'Manual Order' }).click();
  await page.getByRole('button', { name: 'Espresso' }).click();
  await page.getByRole('button', { name: 'Create Order & Mark as Paid' }).click();
  // Wait for modal to disappear
  await expect(page.getByRole('heading', { name: 'Manual POS' })).not.toBeVisible();
}

test.describe('Operational Support Features', () => {
  test.beforeEach(async ({ page }) => {
    // 1. Log in
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password');
    await page.getByRole('button', { name: 'Login' }).click();
    await expect(page).toHaveURL('/admin/dashboard');

    // 2. Reset database state via "End of Day" button
    await page.getByRole('button', { name: 'End of Day' }).click();
    await page.getByRole('button', { name: 'はい' }).click();

    // 3. Wait for all order cards to disappear to confirm reset
    await expect(page.locator('[data-testid="order-kanban-column-new"] .MuiCard-root')).toHaveCount(0);
    await expect(page.locator('[data-testid="order-kanban-column-paid"] .MuiCard-root')).toHaveCount(0);
    await expect(page.locator('[data-testid="order-kanban-column-completed"] .MuiCard-root')).toHaveCount(0);
  });

  test('should cancel an order from the paid column', async ({ page }) => {
    const paidColumn = page.locator('[data-testid="order-kanban-column-paid"]');
    const orderCards = paidColumn.locator('.MuiCard-root');

    // Pre-condition check is implicitly handled by beforeEach, but an explicit check is fine.
    await expect(orderCards).toHaveCount(0);

    // 1. Create a new order and wait for it to appear
    await createManualOrder(page);
    await expect(orderCards).toHaveCount(1);

    // 2. Click the cancel button on the order using a more robust selector
    await orderCards.first().getByRole('button', { name: 'Cancel' }).click();

    // 3. Verify the order disappears
    await expect(orderCards).toHaveCount(0);
  });

  test('should create a new manual order with order number #1', async ({ page }) => {
    const paidColumn = page.locator('[data-testid="order-kanban-column-paid"]');

    // 1. Create a first manual order. `beforeEach` ensures a clean state.
    await createManualOrder(page);

    // 2. Verify the new order number is #1, confirming the reset logic.
    const newOrderCard = paidColumn.locator('.MuiCard-root', { hasText: '#1' });
    await expect(newOrderCard).toBeVisible();
    await expect(paidColumn.locator('.MuiCard-root')).toHaveCount(1);
  });
});
