import { test, expect, Page } from '@playwright/test';
import { db, teardown } from './test-utils';

test.describe('画像アップロード機能 (クロッピングと圧縮)', () => {
  let page: Page;
  let storeId: string;

  test.beforeAll(async ({ browser }) => {
    const context = await browser.newContext();
    page = await context.newPage();

    // Get storeId from the seeded data. We use the Admin SDK here.
    const userDocRef = db.collection('users').doc('test-user');
    const userDoc = await userDocRef.get();

    if (userDoc.exists) {
        storeId = userDoc.data()!.storeId;
    } else {
        // Fallback for local testing if seed is different
        const testUser = {
          email: 'test@test.test',
          password: 'password',
        };
        await page.goto('/login');
        await page.fill('input[name="email"]', testUser.email);
        await page.fill('input[name="password"]', testUser.password);
        await page.click('button[type="submit"]');
        await page.waitForURL('/admin/dashboard');

        const url = page.url();
        const match = url.match(/admin\/dashboard\/(.*)/);
        if (match) {
            storeId = match[1];
        } else {
            // If still not found, we have to fail.
            throw new Error("Could not determine storeId for tests.");
        }
    }
  });

  test.afterAll(async () => {
    await teardown();
  });

  test('メニュー管理で画像を選択するとクロッピングUIが表示され、保存できること', async () => {
    await page.goto(`/admin/menu`);

    // Open the "新規追加" dialog
    await page.getByRole('button', { name: '新規追加' }).click();

    // The form is in a dialog. We need to target it.
    const dialog = page.getByRole('dialog');

    // Check that the cropper component is there
    const imageSelectButton = dialog.getByRole('button', { name: '画像を選択' });
    await expect(imageSelectButton).toBeVisible();

    // Set up a file chooser handler
    const fileChooserPromise = page.waitForEvent('filechooser');
    await imageSelectButton.click();
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles('./public/vite.svg'); // Use a test image

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

  test('QRコード設定で画像を選択するとクロッピングUIが表示され、保存できること', async () => {
    await page.goto(`/admin/settings/qrcode`);

    const imageSelectButton = page.getByRole('button', { name: '画像を選択' });
    await expect(imageSelectButton).toBeVisible();

    // Set up a file chooser handler
    const fileChooserPromise = page.waitForEvent('filechooser');
    await imageSelectButton.click();
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles('./public/vite.svg');

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
