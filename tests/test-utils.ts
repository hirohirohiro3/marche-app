import * as admin from 'firebase-admin';
import { v4 as uuidv4 } from 'uuid';

// Initialize Firebase Admin SDK
// This requires the GOOGLE_CREDENTIALS environment variable to be set in the CI environment.
if (!admin.apps.length) {
  const serviceAccount = JSON.parse(
    Buffer.from(process.env.GOOGLE_CREDENTIALS, 'base64').toString('utf-8')
  );
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const auth = admin.auth();
const db = admin.firestore();

/**
 * Creates a new user in Firebase Authentication and a corresponding store document in Firestore.
 * This function operates on the backend and is independent of the frontend UI,
 * making it a reliable way to set up test prerequisites.
 *
 * @param {string} storeName - The name for the new store.
 * @returns {Promise<{uid: string, email: string, password: string}>} - The created user's details.
 */
export async function createTestUser(storeName = 'E2E Test Store') {
  const uniqueId = uuidv4();
  const email = `test-user-${uniqueId}@example.com`;
  const password = 'password123';

  // 1. Create user in Firebase Authentication
  const userRecord = await auth.createUser({
    email,
    password,
    emailVerified: true,
  });
  const { uid } = userRecord;

  // 2. Create a corresponding store document in Firestore
  await db.collection('stores').doc(uid).set({
    name: storeName,
    ownerId: uid,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  return { uid, email, password };
}

/**
 * Deletes a user from Firebase Authentication and their corresponding store document from Firestore.
 * This is used for cleaning up after tests are complete.
 *
 * @param {string} uid - The UID of the user to delete.
 */
export async function deleteTestUser(uid: string) {
  try {
    // Delete from Firestore first
    await db.collection('stores').doc(uid).delete();
    // Then delete from Authentication
    await auth.deleteUser(uid);
  } catch (error) {
    console.error(`Failed to delete test user ${uid}:`, error);
  }
}
