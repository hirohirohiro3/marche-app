import { db, auth, TEST_USER_UID } from './test-utils';
import { FullConfig } from '@playwright/test';

async function globalSetup(config: FullConfig) {
  console.log('--- Starting global setup for tests ---');

  try {
    // Use Firebase Admin SDK to set up the test data.
    // This bypasses security rules for reliable test setup.

    // 0. Get the actual UID for the test user
    let userId = TEST_USER_UID;
    try {
      const userRecord = await auth.getUserByEmail('test.test@test.test');
      userId = userRecord.uid;
      console.log(`Global setup: Found existing user 'test.test@test.test' with UID: ${userId}`);
    } catch (e) {
      console.warn(`Global setup: Could not find user 'test.test@test.test', falling back to default UID: ${TEST_USER_UID}`);
    }

    // Create a store for the test user
    const storeRef = db.collection('stores').doc(userId);
    await storeRef.set({
      name: 'Test Store',
      ownerId: userId,
      qrCodeSettings: {
        color: '#000000',
        logoUrl: null
      }
    });
    console.log(`Global setup: Created or updated store for user ID: ${userId}`);

    // Create a sample menu item to ensure the menu page is not empty
    const menuRef = db.collection('menus').doc('initial-item');
    await menuRef.set({
      name: 'Initial Espresso',
      price: 500,
      category: 'Drinks',
      storeId: userId,
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
