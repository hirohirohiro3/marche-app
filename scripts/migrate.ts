import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

// IMPORTANT: Replace with your actual service account credentials
if (getApps().length === 0) {
  const serviceAccount = JSON.parse(
    Buffer.from(process.env.GOOGLE_CREDENTIALS, 'base64').toString('utf-8')
  );
  initializeApp({
    credential: cert(serviceAccount),
  });
}

const db = getFirestore();
const auth = getAuth();

// --- Configuration ---
// The email of the user who owns the v1.5 data.
const V1_5_OWNER_EMAIL = 'test@test.test';

async function migrate() {
  console.log('Starting data migration for multi-tenancy...');

  try {
    // 1. Get the UID of the v1.5 owner.
    console.log(`Fetching user data for ${V1_5_OWNER_EMAIL}...`);
    const user = await auth.getUserByEmail(V1_5_OWNER_EMAIL);
    const storeId = user.uid;
    console.log(`Found user. The storeId for migration will be: ${storeId}`);

    // Collections to migrate
    const collectionsToMigrate = ['menus', 'orders'];

    for (const collectionName of collectionsToMigrate) {
      console.log(`\nProcessing collection: ${collectionName}...`);
      const collectionRef = db.collection(collectionName);
      const snapshot = await collectionRef.get();

      if (snapshot.empty) {
        console.log(`Collection '${collectionName}' is empty. Skipping.`);
        continue;
      }

      const batch = db.batch();
      let updatedCount = 0;

      snapshot.docs.forEach((doc) => {
        // Check if storeId already exists to prevent re-running
        if (!doc.data().storeId) {
          batch.update(doc.ref, { storeId: storeId });
          updatedCount++;
        }
      });

      if (updatedCount > 0) {
        await batch.commit();
        console.log(`Successfully updated ${updatedCount} documents in '${collectionName}' with storeId.`);
      } else {
        console.log(`All documents in '${collectionName}' already have a storeId. No updates needed.`);
      }
    }

    console.log('\nData migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('\nError during data migration:', error);
    process.exit(1);
  }
}

migrate();
