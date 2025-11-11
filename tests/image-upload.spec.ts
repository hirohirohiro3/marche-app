import { test, expect } from '@playwright/test';

test.describe('画像アップロード機能 (クロッピングと圧縮)', () => {

  // Run signup before each test to ensure a clean, authenticated state.
  test.beforeEach(async ({ page }) => {
    const uniqueEmail = `test-user-${Date.now()}@example.com`;
    const password = 'password123';

    await page.goto('/signup');

    // Fill out the signup form
    await page.getByLabel('店舗名').fill('テスト店舗');
    await page.getByLabel('メールアドレス').fill(uniqueEmail);
    await page.getByLabel('パスワード').fill(password);
    await page.getByRole('button', { name: '登録して開始' }).click();

    // After signup, user should be redirected to the admin dashboard
    await expect(page).toHaveURL('/admin/dashboard', { timeout: 10000 });
    // Ensure the dashboard is loaded before proceeding
    await expect(page.getByRole('heading', { name: 'ダッシュボード' })).toBeVisible();
  });


  test('メニュー管理で画像を選択するとクロッピングUIが表示され、保存できること', async ({ page }) => {
    await page.goto(`/admin/menu`);

    // Wait for auth to be restored by waiting for the account icon to be visible
    await expect(page.getByLabel('account of current user')).toBeVisible();

    // Now, wait for the page-specific content to load
    await expect(page.getByRole('button', { name: '新規追加' })).toBeVisible();

    // Open the "新規追加" dialog
    await page.getByRole('button', { name: '新規追加' }).click();

    // The form is in a dialog. We need to target it.
    const dialog = page.getByRole('dialog');

    // Check that the cropper component is there
    const imageSelectButton = dialog.getByRole('button', { name: '画像を選択' });
    await expect(imageSelectButton).toBeVisible();

    // Use setInputFiles for robustness, bypassing the file chooser dialog.
    const fileInput = dialog.getByTestId('file-input');
    await fileInput.setInputFiles('./public/vite.svg');

    // After selecting a file, the cropper UI should appear.
    // We can verify this by checking for the "切り抜きを決定" button.
    const cropButton = dialog.getByRole('button', { name: '切り抜きを決定' });
    await expect(cropButton).toBeVisible();

    // Click the crop button to process the image
    await cropButton.click();

    // After cropping, the final preview should be visible.
    await expect(dialog.getByAltText('Final preview')).toBeVisible();

    // Fill in other required fields
    await dialog.fill('input[name="name"]', 'テスト商品');
    await dialog.fill('input[name="price"]', '100');
    await dialog.fill('input[name="category"]', 'テスト');

    // Save
    await dialog.getByRole('button', { name: '保存' }).click();

    // The dialog should close, and we should see the new item (or a success message, if implemented)
    await expect(dialog).not.toBeVisible();
    await expect(page.getByText('テスト商品')).toBeVisible();
  });

  test('QRコード設定で画像を選択するとクロッピングUIが表示され、保存できること', async ({ page }) => {
    await page.goto(`/admin/settings/qrcode`);

    // Wait for auth to be restored by waiting for the account icon to be visible
    await expect(page.getByLabel('account of current user')).toBeVisible();

    // Now, wait for the page-specific content to load by checking for the page title
    await expect(page.getByRole('heading', { name: 'QRコード設定' })).toBeVisible();

    const imageSelectButton = page.getByRole('button', { name: '画像を選択' });
    await expect(imageSelectButton).toBeVisible();

    // Use setInputFiles for robustness, bypassing the file chooser dialog.
    const fileInput = page.getByTestId('file-input');
    await fileInput.setInputFiles('./public/vite.svg');

    const cropButton = page.getByRole('button', { name: '切り抜きを決定' });
    await expect(cropButton).toBeVisible();
    await cropButton.click();

    // The final preview inside the dummy QR code should be visible.
    // The QR code component might render as a canvas or SVG.
    // Let's check for the container holding our preview image.
    const qrPreviewImage = page.locator('div[role="img"] image'); // A bit fragile, but works for qrcode.react's SVG output
    await expect(qrPreviewImage).toBeVisible();
    await expect(qrPreviewImage).toHaveAttribute('href', /blob:/);

    // Save
    await page.getByRole('button', { name: '保存する' }).click();

    // Check for success message
    await expect(page.getByText('設定を保存しました。')).toBeVisible();
  });
});
