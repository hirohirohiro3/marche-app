import { test, expect } from '@playwright/test';

test.describe('Analytics Page', () => {
test.describe('Analytics Page', () => {
  // No beforeEach reset needed here, as the global `npm run seed` handles it.

  test.beforeEach(async ({ page }) => {
    // Log in and navigate to the analytics page
    await page.goto('/login');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/admin/dashboard');
    await page.click('a:has-text("Analytics")');
    await expect(page.locator('h4:has-text("Sales Analytics")')).toBeVisible();
  });

  test('should display correct summary for "Today"', async ({ page }) => {
    await page.click('button:has-text("Today")');

    const totalSalesCard = page.locator('.MuiPaper-root:has-text("Total Sales")');
    await expect(totalSalesCard.locator('h4')).toContainText('¥2,200'); // 1700 + 500

    const totalOrdersCard = page.locator('.MuiPaper-root:has-text("Total Orders")');
    await expect(totalOrdersCard.locator('h4')).toContainText('2');

    const bestSellersTable = page.locator('table');
    await expect(bestSellersTable.locator('tr:has-text("Latte")')).toContainText('2');
    await expect(bestSellersTable.locator('tr:has-text("Espresso")')).toContainText('1');
  });

  test('should display correct summary for "All Time"', async ({ page }) => {
    await page.click('button:has-text("All Time")');

    const totalSalesCard = page.locator('.MuiPaper-root:has-text("Total Sales")');
    await expect(totalSalesCard.locator('h4')).toContainText('¥3,300'); // 2200 + 1100

    const totalOrdersCard = page.locator('.MuiPaper-root:has-text("Total Orders")');
    await expect(totalOrdersCard.locator('h4')).toContainText('3');

    const bestSellersTable = page.locator('table');
    await expect(bestSellersTable.locator('tr:has-text("Latte")')).toContainText('3'); // 1 (yesterday) + 2 (today)
  });
});
