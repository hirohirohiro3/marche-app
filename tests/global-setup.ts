import { db, TEST_USER_UID } from './test-utils';
import { FullConfig } from '@playwright/test';

async function globalSetup(config: FullConfig) {
  console.log('--- Starting global setup for tests ---');

  try {
    // Use Firebase Admin SDK to set up the test data.
    // This bypasses security rules for reliable test setup.

    // Create a store for the test user
    const storeRef = db.collection('stores').doc(TEST_USER_UID);
    await storeRef.set({
      name: 'Test Store',
      ownerId: TEST_USER_UID,
      qrCodeSettings: {
        color: '#000000',
        logoUrl: null
      }
    });
    console.log(`Global setup: Created or updated store for user ID: ${TEST_USER_UID}`);

    // Create a sample menu item to ensure the menu page is not empty
    const menuRef = db.collection('menus').doc('initial-item');
    await menuRef.set({
      name: 'Initial Espresso',
      price: 500,
      category: 'Drinks',
      storeId: TEST_USER_UID,
      isSoldOut: false,
      sortOrder: 1,
    });
    console.log('Global setup: Created initial menu item.');

  } catch (error) {
    console.error('--- ERROR IN GLOBAL SETUP ---');
    console.error(error);
    // We throw the error to prevent tests from running in a broken state.
    throw new Error('Global setup failed, aborting tests.');
  }

  console.log('--- Global setup complete ---');
}

export default globalSetup;
