import { test, expect } from '@playwright/test';

test('Admin Dashboard Verification', async ({ page }) => {
  // 1. Navigate to the login page
  await page.goto('/login');

  // 2. Fill in the login form and submit
  await page.getByLabel('Email Address').fill('test@example.com');
  await page.getByLabel('Password').fill('password');
  await page.getByRole('button', { name: 'Login' }).click();

  // 3. Wait for navigation to the dashboard and verify the title
  await expect(page).toHaveURL('/admin/dashboard');
  await expect(page.getByRole('heading', { name: 'Order Dashboard' })).toBeVisible();

  // 4. Verify that the three columns are present
  await expect(page.getByRole('heading', { name: 'New' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Paid' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Completed' })).toBeVisible();

  // 5. Take a screenshot of the dashboard
  await page.screenshot({ path: 'jules-scratch/verification/dashboard.png' });
});
