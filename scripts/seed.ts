import * as admin from 'firebase-admin';

// Initialize Firebase Admin SDK
const serviceAccount = JSON.parse(process.env.GOOGLE_CREDENTIALS);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();
const auth = admin.auth();

const TEST_USER_EMAIL = 'test@test.test';
const TEST_USER_PASSWORD = '112233';

async function seed() {
  console.log('Seeding database...');

  try {
    // 4. Seed Test User
    console.log('Seeding test user...');
    try {
      const user = await auth.getUserByEmail(TEST_USER_EMAIL);
      await auth.deleteUser(user.uid);
      console.log(`Successfully deleted existing user: ${TEST_USER_EMAIL}`);
    } catch (error) {
      if (error.code === 'auth/user-not-found') {
        // User doesn't exist, which is fine.
      } else {
        throw error;
      }
    }
    const userRecord = await auth.createUser({
      email: TEST_USER_EMAIL,
      password: TEST_USER_PASSWORD,
    });
    console.log(`Successfully created test user: ${TEST_USER_EMAIL} with UID: ${userRecord.uid}`);
    const storeId = userRecord.uid; // Use the new user's UID as the storeId

    const menusCollection = db.collection('menus');
    const ordersCollection = db.collection('orders');
    const systemSettingsRef = db.doc('system_settings/orderNumbers');

    // 1. Clear existing data
    console.log('Clearing existing data...');
    const collectionsToClear = [menusCollection, ordersCollection];
    for (const collectionRef of collectionsToClear) {
      const snapshot = await collectionRef.get();
      if (snapshot.empty) continue;
      const batch = db.batch();
      snapshot.docs.forEach((doc) => batch.delete(doc.ref));
      await batch.commit();
    }

    // 2. Seed Menu Items
    console.log('Seeding menu items...');
    const menuItems = [
      { id: 'espresso', name: 'Espresso', price: 500, category: 'Coffee', isSoldOut: false, sortOrder: 1 },
      { id: 'latte', name: 'Latte', price: 600, category: 'Coffee', isSoldOut: false, sortOrder: 2 },
      { id: 'cappuccino', name: 'Cappuccino', price: 650, category: 'Coffee', isSoldOut: true, sortOrder: 3 },
      { id: 'tea', name: 'Tea', price: 400, category: 'Tea', isSoldOut: false, sortOrder: 4 },
    ];
    const menuBatch = db.batch();
    menuItems.forEach((item) => {
      const { id, ...data } = item;
      menuBatch.set(menusCollection.doc(id), { ...data, storeId });
    });
    await menuBatch.commit();

    // 3. Reset System Settings
    console.log('Resetting system settings...');
    await systemSettingsRef.set({
      nextQrOrderNumber: 101,
      nextManualOrderNumber: 1,
    });

    console.log('Database seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
}

seed();
