import { db } from './test-utils';
import { FullConfig } from '@playwright/test';
import { doc, setDoc } from 'firebase/firestore';

// This UID should correspond to the user used in the E2E tests.
// The user is expected to be created via the Firebase console or a separate seeding script
// with this specific UID for test predictability.
const TEST_USER_UID = 'gOCluucPI5hzje5lVgLXj7BJQAu1';

async function globalSetup(config: FullConfig) {
  console.log('--- Starting global setup for tests ---');

  try {
    // NOTE: We are using the CLIENT SDK here with Admin credentials.
    // This setup bypasses security rules and writes directly to Firestore.
    // No client-side authentication is needed in this setup script.

    // Create a store for the test user
    const storeRef = doc(db, 'stores', TEST_USER_UID);
    await setDoc(storeRef, {
      name: 'Test Store',
      ownerId: TEST_USER_UID,
      qrCodeSettings: {
        color: '#000000',
        logoUrl: null
      }
    });
    console.log(`Global setup: Created or updated store for user ID: ${TEST_USER_UID}`);

    // Create a sample menu item to ensure the menu page is not empty
    const menuRef = doc(db, 'menus', 'initial-item');
    await setDoc(menuRef, {
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
