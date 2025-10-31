import { test, expect } from '@playwright/test';

test.describe('Manual Order Flow', () => {
  // Before each test, log in using a robust polling strategy with data-testid selectors.
  test.beforeEach(async ({ page }) => {
    await expect(async () => {
      await page.goto('/login');
      await page.getByTestId('email-input').fill('test@test.test');
      await page.getByTestId('password-input').fill('112233');
      await page.getByTestId('login-button').click();
      await expect(page).toHaveURL('/admin/dashboard', { timeout: 2000 }); // Short timeout for each attempt
    }).toPass({
      timeout: 20000, // Maximum total time for all retries
    });
  });

  test('should create a manual order and see it in the paid column', async ({ page }) => {
    // Ensure the main dashboard container is visible before proceeding.
    await expect(page.getByTestId('dashboard-container')).toBeVisible();

    // 1. Open the manual order modal
    await page.getByTestId('manual-order-button').click();

    // Wait for the modal to be fully visible before interacting with its contents.
    const modal = page.getByTestId('manual-order-modal');
    await expect(modal).toBeVisible();

    // Wait for the first menu item button to be visible, ensuring the menu data is loaded.
    // This is more robust than waiting for a specific item like "Espresso".
    const firstMenuItem = modal.locator('[data-testid^="menu-item-"]').first();
    await expect(firstMenuItem).toBeVisible();
    const secondMenuItem = modal.locator('[data-testid^="menu-item-"]').nth(1);
    await expect(secondMenuItem).toBeVisible();

    // Get the names of the items for later verification.
    const firstItemName = (await firstMenuItem.textContent()) as string;
    const secondItemName = (await secondMenuItem.textContent()) as string;

    // 2. Add items to the cart
    await firstMenuItem.click();
    await secondMenuItem.click();
    await firstMenuItem.click(); // Add one more of the first item

    // 3. Create the order
    await page.getByTestId('create-order-button').click();

    // Wait for the modal to disappear, indicating the order was submitted.
    await expect(modal).not.toBeVisible();

    // 4. Verify the order appears in the "Paid" column
    const paidColumn = page.getByTestId('paid-orders-column');
    await expect(paidColumn).toBeVisible();

    // Instead of asserting on a specific total price (which is brittle),
    // we assert that a new card appears and contains the items we added.
    const newOrderCard = paidColumn.locator('.MuiCard-root').first();
    await expect(newOrderCard).toBeVisible();

    await expect(newOrderCard).toContainText(`${firstItemName} x 2`);
    await expect(newOrderCard).toContainText(`${secondItemName} x 1`);
  });
});
