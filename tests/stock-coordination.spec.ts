import { test, expect, Page, Browser } from '@playwright/test';

// Extend the test timeout for this complex scenario
test.setTimeout(60000);

async function setupAdminPage(browser: Browser): Promise<Page> {
  const adminContext = await browser.newContext();
  const adminPage = await adminContext.newPage();
  await adminPage.goto('/login');
  await adminPage.fill('input[name="email"]', 'test@example.com');
  await adminPage.fill('input[name="password"]', 'password');
  await adminPage.click('button[type="submit"]');
  await expect(adminPage).toHaveURL('/admin/dashboard');

  // No reset needed here. The test will run in the state set by `npm run seed`.

  return adminPage;
}

async function setupCustomerPage(browser: Browser): Promise<Page> {
  const customerContext = await browser.newContext();
  const customerPage = await customerContext.newPage();
  await customerPage.goto('/menu');
  return customerPage;
}

test.describe('Real-time Stock Coordination', () => {
  test('marking an item as sold out should immediately hide it from the customer menu', async ({ browser }) => {
    const adminPage = await setupAdminPage(browser);
    const customerPage = await setupCustomerPage(browser);

    const espressoCard = customerPage.locator('.MuiCard-root:has-text("Espresso")');

    // 1. Verify Espresso is initially visible to the customer
    await expect(espressoCard).toBeVisible();

    // 2. Admin navigates to menu page and marks Espresso as sold out
    await adminPage.click('a:has-text("Menu")');
    await expect(adminPage).toHaveURL('/admin/menu');
    const espressoRow = adminPage.locator('tr:has-text("Espresso")');
    await espressoRow.locator('input[type="checkbox"]').click(); // Clicks the toggle switch

    // 3. Verify Espresso is now hidden from the customer
    await expect(espressoCard).not.toBeVisible();

    // 4. Admin marks Espresso as available again
    await espressoRow.locator('input[type="checkbox"]').click();

    // 5. Verify Espresso is visible again to the customer
    await expect(espressoCard).toBeVisible();

    await adminPage.context().close();
    await customerPage.context().close();
  });
});
