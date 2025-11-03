import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

/**
 * Initializes the Firebase Admin SDK.
 * This function ensures that the SDK is initialized only once.
 * It requires the GOOGLE_CREDENTIALS environment variable to be set,
 * typically in the CI/CD environment.
 */
export function initializeTestEnvironment() {
  // Check if the app is already initialized to prevent duplicate initialization errors.
  if (getApps().length === 0) {
    try {
      const serviceAccount = JSON.parse(
        Buffer.from(process.env.GOOGLE_CREDENTIALS, 'base64').toString('utf-8')
      );

      initializeApp({
        credential: cert(serviceAccount),
      });

      console.log('Firebase Admin SDK initialized for tests.');
    } catch (error) {
      console.error('Failed to initialize Firebase Admin SDK:', error);
      // Throw the error to ensure any process that depends on this fails clearly.
      throw new Error('Could not initialize Firebase Admin SDK. Ensure GOOGLE_CREDENTIALS are set and valid.');
    }
  }

  // Return the initialized services for use in test setup.
  return {
    db: getFirestore(),
    auth: getAuth(),
  };
}
