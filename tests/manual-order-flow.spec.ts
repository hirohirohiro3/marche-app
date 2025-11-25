import { test, expect } from '@playwright/test';

test.describe('Manual Order Flow', () => {
  // Before each test, log in using a robust polling strategy with data-testid selectors.
  test.beforeEach(async ({ page }) => {
    test.setTimeout(120000); // Increase timeout for the whole test

    // 1. Log in
    await expect(async () => {
      await page.goto('/login');
      await page.getByTestId('email-input').fill('test.test@test.test');
      await page.getByTestId('password-input').fill('112233');
      await page.getByTestId('login-button').click();
      await expect(page).toHaveURL('/admin/dashboard', { timeout: 10000 });
    }).toPass({
      timeout: 60000,
    });

    // 2. Ensure the main dashboard container is visible
    await expect(page.getByTestId('dashboard-container')).toBeVisible();

    // 3. Reset/Start Event
    const endEventButton = page.getByTestId('end-event-button');
    if (await endEventButton.isVisible()) {
      await endEventButton.click();
      await page.getByTestId('end-of-day-confirm-button').click();
      await expect(endEventButton).not.toBeVisible();
    }

    // Start a new event for the test
    await page.getByTestId('start-event-button').click();
    await page.getByLabel('イベント名').fill('Test Event');
    await page.getByRole('button', { name: '開始する' }).click();
    await expect(page.getByText('開催中: Test Event')).toBeVisible();
  });

  test('should create a manual order and see it in the paid column', async ({ page }) => {
    // 1. Open the manual order modal
    await page.getByTestId('manual-order-button').click();

    // Wait for the modal to be fully visible before interacting with its contents.
    const modal = page.getByTestId('manual-order-modal');
    await expect(modal).toBeVisible();

    // Wait for the first menu item button to be visible
    const firstMenuItem = modal.locator('[data-testid^="menu-item-"]').first();
    await expect(firstMenuItem).toBeVisible({ timeout: 30000 });

    // Get the name of the item
    const firstItemName = (await firstMenuItem.textContent()) as string;

    // 2. Add items to the cart
    // Click the first item
    await firstMenuItem.click();

    // Wait for AddToCartModal and click "Add to Cart"
    const addToCartButton = page.getByRole('button', { name: 'カートに入れる' });
    await expect(addToCartButton).toBeVisible({ timeout: 30000 });
    await addToCartButton.click();
    await expect(addToCartButton).not.toBeVisible({ timeout: 5000 });

    // Verify item is in the cart (in the manual order modal)
    const cartSection = modal.getByTestId('cart-section');
    await expect(cartSection.getByText(`${firstItemName} x 1`)).toBeVisible();

    // 3. Create the order
    await page.getByTestId('create-order-button').click();

    // Wait for the modal to disappear, indicating the order was submitted.
    await expect(modal).not.toBeVisible();

    // 4. Verify the order appears in the "Paid" column
    const paidColumn = page.getByTestId('paid-orders-column');
    await expect(paidColumn).toBeVisible();

    // Assert that a new card appears and contains the item we added.
    const newOrderCard = paidColumn.locator('[data-testid^="order-card-"]').first();
    await expect(newOrderCard).toBeVisible({ timeout: 15000 });
    await expect(newOrderCard).toContainText(`${firstItemName} x 1`);
  });
});
