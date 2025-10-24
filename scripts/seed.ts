import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

// Initialize Firebase Admin SDK
const serviceAccount = JSON.parse(process.env.GOOGLE_CREDENTIALS);

initializeApp({
  credential: cert(serviceAccount),
});

const db = getFirestore();
const auth = getAuth();

const TEST_USER_EMAIL = 'test@example.com';
const TEST_USER_PASSWORD = 'password';

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
    await auth.createUser({
      email: TEST_USER_EMAIL,
      password: TEST_USER_PASSWORD,
    });
    console.log(`Successfully created test user: ${TEST_USER_EMAIL}`);
    const menusCollection = db.collection('menus');
    const ordersCollection = db.collection('orders');
    const systemSettingsRef = db.doc('system_settings/single_doc');

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
      menuBatch.set(menusCollection.doc(id), data);
    });
    await menuBatch.commit();

    // 3. Reset System Settings
    console.log('Resetting system settings...');
    await systemSettingsRef.set({
      nextQrOrderNumber: 101,
      nextManualOrderNumber: 1,
    });

    // 5. Seed Completed Orders for Analytics
    console.log('Seeding completed orders...');
    const completedOrdersBatch = db.batch();
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);

    const ordersToSeed = [
      // Yesterday's orders
      { orderNumber: 1, orderType: 'manual', status: 'completed', totalPrice: 1100, items: [{name: 'Espresso', quantity: 1}, {name: 'Latte', quantity: 1}], createdAt: yesterday },
      // Today's orders
      { orderNumber: 101, orderType: 'qr', status: 'completed', totalPrice: 1700, items: [{name: 'Latte', quantity: 2}, {name: 'Tea', quantity: 1}], createdAt: now },
      { orderNumber: 2, orderType: 'manual', status: 'completed', totalPrice: 500, items: [{name: 'Espresso', quantity: 1}], createdAt: now },
      { orderNumber: 102, orderType: 'qr', status: 'paid', totalPrice: 650, items: [{name: 'Cappuccino', quantity: 1}], createdAt: now }, // Should not be in analytics
    ];

    ordersToSeed.forEach(order => {
      const newOrderRef = ordersCollection.doc();
      completedOrdersBatch.set(newOrderRef, order);
    });
    await completedOrdersBatch.commit();

    console.log('Database seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
}

seed();
