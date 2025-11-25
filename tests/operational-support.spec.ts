import { test, expect, Page } from '@playwright/test';

// Helper function to create a simple manual order with the first available menu item
async function createManualOrder(page: Page) {
  const manualOrderButton = page.getByTestId('manual-order-button');
  await expect(manualOrderButton).toBeVisible();
  await expect(manualOrderButton).toBeEnabled();
  await manualOrderButton.click();

  const modal = page.getByTestId('manual-order-modal');
  await expect(modal).toBeVisible();

  // Wait for the first menu item to be visible and click it
  const firstMenuItem = modal.locator('[data-testid^="menu-item-"]').first();
  await expect(firstMenuItem).toBeVisible({ timeout: 30000 });
  await firstMenuItem.click();

  // Wait for AddToCartModal to appear by waiting for the "カートに入れる" button
  const addToCartButton = page.getByRole('button', { name: 'カートに入れる' });
  await expect(addToCartButton).toBeVisible({ timeout: 30000 });
  await addToCartButton.click();

  // Wait for AddToCartModal to close (button should disappear)
  await expect(addToCartButton).not.toBeVisible({ timeout: 5000 });

  // Now click create order button
  await page.getByTestId('create-order-button').click();

  // Wait for modal to disappear, ensuring the transaction is complete
  await expect(modal).not.toBeVisible();
}

test.describe('Operational Support Features', () => {
  test.setTimeout(120000); // Increase timeout to 120s for real environment latency

  test.beforeEach(async ({ page }) => {
    // 1. Log in using a robust polling strategy
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

    // 3. Reset the state before each test to ensure independence
    // Check if an event is currently running
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

    // 4. Wait for the active columns to be empty, confirming the reset
    const newOrdersLocator = page.getByTestId('new-orders-column').locator('[data-testid^="order-card-"]');
    await expect(newOrdersLocator).toHaveCount(0);
    const paidOrdersLocator = page.getByTestId('paid-orders-column').locator('[data-testid^="order-card-"]');
    await expect(paidOrdersLocator).toHaveCount(0);
  });

  test('should cancel an order from the paid column', async ({ page }) => {
    const paidColumn = page.getByTestId('paid-orders-column');
    const orderCards = paidColumn.locator('[data-testid^="order-card-"]');

    // Pre-condition: Ensure there are no orders
    await expect(orderCards).toHaveCount(0);

    // 1. Create a new order and wait for it to appear
    await createManualOrder(page);
    await expect(orderCards).toHaveCount(1, { timeout: 15000 });

    // 2. Click the cancel button on the first (and only) order card
    const firstCard = orderCards.first();
    const cancelButton = firstCard.locator('[data-testid^="cancel-button-"]');
    await expect(cancelButton).toBeVisible();
    await cancelButton.click();

    // 3. Verify the order disappears and the count returns to 0
    // Increase timeout to handle potential latency in real environment
    await expect(orderCards).toHaveCount(0, { timeout: 15000 });
  });

  test('should reset order numbers after End Event', async ({ page }) => {
    const paidColumn = page.getByTestId('paid-orders-column');
    const orderCards = paidColumn.locator('[data-testid^="order-card-"]');

    // 1. Create a first manual order and wait for it to appear
    await createManualOrder(page);
    await expect(orderCards).toHaveCount(1);
    const firstOrderCard = orderCards.first();
    await expect(firstOrderCard).toContainText('#1'); // The first order should be #1

    // 2. Click End Event button and confirm.
    await page.getByTestId('end-event-button').click();
    await page.getByTestId('end-of-day-confirm-button').click();

    // Wait for the paid column to clear, ensuring the order moved to "completed"
    await expect(paidColumn.locator('[data-testid^="order-card-"]')).toHaveCount(0, { timeout: 15000 });

    // Hard wait to ensure Firestore transaction propagates
    await page.waitForTimeout(5000);

    // 3. Start a new event to verify reset
    await page.getByTestId('start-event-button').click();
    await page.getByLabel('イベント名').fill('Next Event');
    await page.getByRole('button', { name: '開始する' }).click();
    await expect(page.getByText('開催中: Next Event')).toBeVisible();

    // 4. Create a second manual order
    await createManualOrder(page);

    // 5. Verify the new order appears and its number is also #1, confirming the reset
    await expect(orderCards).toHaveCount(1, { timeout: 15000 });
    const secondOrderCard = orderCards.first();
    await expect(secondOrderCard).toContainText('#1');
  });
});
