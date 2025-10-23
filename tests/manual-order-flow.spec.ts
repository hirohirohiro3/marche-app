import { test, expect } from '@playwright/test';

test.describe('Manual Order Flow', () => {
  // Before each test, log in.
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/admin/dashboard');
  });

  test('should create a manual order and see it in the paid column', async ({ page }) => {
    // 1. Open the manual order modal
    await page.click('button:has-text("Manual Order")');
    await expect(page.locator('h6:has-text("Manual POS")')).toBeVisible();

    // 2. Add items to the cart
    // Note: This assumes menu items are seeded. We will select the first two.
    await page.locator('button:has-text("Espresso")').click();
    await page.locator('button:has-text("Latte")').click();
    await page.locator('button:has-text("Espresso")').click(); // Add one more espresso

    // 3. Verify the total price
    // This depends on the seeded prices. Assuming Espresso=500, Latte=600. Total = 500*2 + 600 = 1600
    await expect(page.locator('h5:has-text("Total: ¥1600")')).toBeVisible();

    // 4. Create the order
    await page.click('button:has-text("Create Order & Mark as Paid")');

    // 5. Verify the order appears in the "Paid" column
    // The order number depends on the state of the database.
    // We will look for a card in the "Paid" column containing the items.
    const paidColumn = page.locator('div.MuiPaper-root:has(h6:has-text("Paid"))');
    await expect(paidColumn).toBeVisible();

    const newOrderCard = paidColumn.locator('.MuiCard-root', { hasText: 'Espresso x 2' });
    await expect(newOrderCard).toBeVisible();
    await expect(newOrderCard).toContainText('Latte x 1');
    await expect(newOrderCard).toContainText('Total: ¥1600');
  });
});
