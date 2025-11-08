import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { Firestore } from 'firebase-admin/firestore';
import { Auth } from 'firebase-admin/auth';

let db: Firestore;
let auth: Auth;

/**
 * Initializes the Firebase Admin SDK for the test environment.
 * This function ensures that the SDK is initialized only once and should be
 * called from the global setup file.
 */
function initializeTestEnvironment() {
  if (getApps().length === 0) {
    try {
      const serviceAccount = JSON.parse(
        Buffer.from(process.env.GOOGLE_CREDENTIALS!, 'base64').toString('utf-8')
      );
      initializeApp({ credential: cert(serviceAccount) });
      console.log('Firebase Admin SDK initialized for tests.');
    } catch (error) {
      console.error('Failed to initialize Firebase Admin SDK:', error);
      throw new Error('Could not initialize Firebase Admin SDK. Ensure GOOGLE_CREDENTIALS are set and valid.');
    }
  }
  // Assign the initialized services to the exported constants.
  db = getFirestore();
  auth = getAuth();
}

// Initialize the environment right away, assuming this file is imported by global setup.
initializeTestEnvironment();

// Export the initialized services for use in test files.
export { db, auth };

/**
 * A dummy teardown function.
 * In a real-world scenario, you might add logic here to clean up
 * test data from the emulator.
 */
export async function teardown() {
  // Currently does nothing.
}
