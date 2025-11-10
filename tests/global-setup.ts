import { db, auth, TEST_USER_EMAIL, TEST_USER_PASSWORD, TEST_USER_UID } from './test-utils';
import { FullConfig } from '@playwright/test';
import { signInWithEmailAndPassword, UserCredential } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';

async function globalSetup(config: FullConfig) {
  console.log('--- Starting global setup for tests ---');

  try {
    // Authenticate as a user to get permissions if needed, though Admin SDK should bypass rules.
    // Re-authenticating here ensures we have a valid session.
    await signInWithEmailAndPassword(auth, TEST_USER_EMAIL, TEST_USER_PASSWORD);
    console.log('Global setup: Signed in as test user.');

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
