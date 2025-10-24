import { test, expect } from '@playwright/test';

test.describe('Analytics Page', () => {
  test.beforeEach(async ({ page }) => {
    // Log in and navigate to the analytics page
    await page.goto('/login');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password');
    await page.click('button[type="submit"]');
    await page.goto('/admin/analytics');
    await expect(page.locator('h4:has-text("Sales Analytics")')).toBeVisible();
  });

  test('should display correct summary for "Today"', async ({ page }) => {
    await page.click('button:has-text("Today")');

    // Based on seed data for today:
    // - Total Sales: 1700 (Latte*2, Tea*1) + 500 (Espresso*1) = 2200
    // - Total Orders: 2
    // - QR Orders: 1
    // - Manual Orders: 1
    await expect(page.locator('p:has-text("Total Sales") + h4')).toContainText('¥2,200');
    await expect(page.locator('p:has-text("Total Orders") + h4')).toContainText('2');
    await expect(page.locator('p:has-text("QR Orders") + h4')).toContainText('1');
    await expect(page.locator('p:has-text("Manual Orders") + h4')).toContainText('1');

    // Best Sellers (Today): Latte x2, Espresso x1, Tea x1
    const latteRow = page.locator('tr:has-text("Latte")');
    await expect(latteRow).toContainText('2');
  });

  test('should display correct summary for "All Time"', async ({ page }) => {
    await page.click('button:has-text("All Time")');

    // Based on seed data for all time (today + yesterday):
    // - Total Sales: 2200 (today) + 1100 (yesterday) = 3300
    // - Total Orders: 2 (today) + 1 (yesterday) = 3
    // - QR Orders: 1 (today)
    // - Manual Orders: 1 (today) + 1 (yesterday) = 2
    await expect(page.locator('p:has-text("Total Sales") + h4')).toContainText('¥3,300');
    await expect(page.locator('p:has-text("Total Orders") + h4')).toContainText('3');
    await expect(page.locator('p:has-text("QR Orders") + h4')).toContainText('1');
    await expect(page.locator('p:has-text("Manual Orders") + h4')).toContainText('2');

    // Best Sellers (All Time): Latte x3, Espresso x2, Tea x1
    const latteRow = page.locator('tr:has-text("Latte")');
    await expect(latteRow).toContainText('3');
  });
});
