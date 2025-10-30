import { test, expect, Page } from '@playwright/test';

// Helper function to create a simple manual order with the first available menu item
async function createManualOrder(page: Page) {
  await page.getByTestId('manual-order-button').click();

  const modal = page.getByTestId('manual-order-modal');
  await expect(modal).toBeVisible();

  // Wait for the first menu item to be visible and click it
  const firstMenuItem = modal.locator('[data-testid^="menu-item-"]').first();
  await expect(firstMenuItem).toBeVisible();
  await firstMenuItem.click();

  await page.getByTestId('create-order-button').click();

  // Wait for modal to disappear, ensuring the transaction is complete
  await expect(modal).not.toBeVisible();
}

test.describe('Operational Support Features', () => {
  test.beforeEach(async ({ page }) => {
    // 1. Log in using a robust polling strategy
    await expect(async () => {
      await page.goto('/login');
      await page.getByTestId('email-input').fill('test@test.test');
      await page.getByTestId('password-input').fill('112233');
      await page.getByTestId('login-button').click();
      await expect(page).toHaveURL('/admin/dashboard', { timeout: 2000 });
    }).toPass({
      timeout: 20000,
    });

    // 2. Ensure the main dashboard container is visible
    await expect(page.getByTestId('dashboard-container')).toBeVisible();

    // 3. Reset the state before each test to ensure independence
    await page.getByTestId('end-of-day-button').click();
    await page.getByTestId('end-of-day-confirm-button').click();

    // 4. Wait for all columns to be empty, confirming the reset
    await expect(page.locator('[data-testid^="order-card-"]')).toHaveCount(0);
  });

  test('should cancel an order from the paid column', async ({ page }) => {
    const paidColumn = page.getByTestId('paid-orders-column');
    const orderCards = paidColumn.locator('[data-testid^="order-card-"]');

    // Pre-condition: Ensure there are no orders
    await expect(orderCards).toHaveCount(0);

    // 1. Create a new order and wait for it to appear
    await createManualOrder(page);
    await expect(orderCards).toHaveCount(1);

    // 2. Click the cancel button on the first (and only) order card
    const firstCard = orderCards.first();
    const cancelButtton = firstCard.locator('[data-testid^="cancel-button-"]');
    await cancelButtton.click();


    // 3. Verify the order disappears and the count returns to 0
    await expect(orderCards).toHaveCount(0);
  });

  test('should reset order numbers after End of Day', async ({ page }) => {
    const paidColumn = page.getByTestId('paid-orders-column');
    const orderCards = paidColumn.locator('[data-testid^="order-card-"]');

    // 1. Create a first manual order and wait for it to appear
    await createManualOrder(page);
    await expect(orderCards).toHaveCount(1);
    const firstOrderCard = orderCards.first();
    await expect(firstOrderCard).toContainText('#1'); // The first order should be #1

    // 2. Click End of Day button and confirm.
    await page.getByTestId('end-of-day-button').click();
    await page.getByTestId('end-of-day-confirm-button').click();
    await expect(orderCards).toHaveCount(0); // Wait for the paid column to clear

    // 3. Create a second manual order
    await createManualOrder(page);

    // 4. Verify the new order appears and its number is also #1, confirming the reset
    await expect(orderCards).toHaveCount(1);
    const secondOrderCard = orderCards.first();
    await expect(secondOrderCard).toContainText('#1');
  });
});
