import { test, expect } from '@playwright/test';

test.describe('Analytics Page', () => {
  test.beforeEach(async ({ page }) => {
    // Log in
    await page.goto('/login');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/admin/dashboard');

    // IMPORTANT: Reset state before each test
    await page.click('button:has-text("End of Day")');
    await page.locator('button:has-text("はい")').click();
    await expect(page.locator('.MuiCard-root')).toHaveCount(0);

    // Navigate to the analytics page via UI
    await page.click('a:has-text("Analytics")');
    await expect(page.locator('h4:has-text("Sales Analytics")')).toBeVisible();
  });

  // Note: beforeEach resets the data, so 'Today' and 'All Time' will show the same data
  // as the seed script only creates orders for 'today' and 'yesterday'.
  // After reset, only seeded orders remain. The test now checks 'All Time'
  // to be more robust against date changes during test runs.
  test('should display correct summary for all seeded orders', async ({ page }) => {
    await page.click('button:has-text("All Time")');

    // Let's use a more robust selector that finds the card by its title
    const totalSalesCard = page.locator('.MuiPaper-root:has-text("Total Sales")');
    const totalOrdersCard = page.locator('.MuiPaper-root:has-text("Total Orders")');
    const qrOrdersCard = page.locator('.MuiPaper-root:has-text("QR Orders")');
    const manualOrdersCard = page.locator('.MuiPaper-root:has-text("Manual Orders")');

    // Based on seed data (1 yesterday, 2 today = 3 total completed orders)
    // Total Sales: 1100 (y) + 1700 (t) + 500 (t) = 3300
    // Total Orders: 3
    // QR Orders: 1
    // Manual Orders: 2
    await expect(totalSalesCard.locator('h4')).toContainText('¥3,300');
    await expect(totalOrdersCard.locator('h4')).toContainText('3');
    await expect(qrOrdersCard.locator('h4')).toContainText('1');
    await expect(manualOrdersCard.locator('h4')).toContainText('2');

    // Best Sellers (All Time): Latte x3, Espresso x2, Tea x1
    const latteRow = page.locator('table tbody tr:has-text("Latte")');
    const espressoRow = page.locator('table tbody tr:has-text("Espresso")');

    await expect(latteRow.locator('td').last()).toContainText('3');
    await expect(espressoRow.locator('td').last()).toContainText('2');
  });
});
