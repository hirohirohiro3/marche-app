import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, CollectionReference } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

// Initialize Firebase Admin SDK
const serviceAccount = JSON.parse(process.env.GOOGLE_CREDENTIALS);
initializeApp({ credential: cert(serviceAccount) });

const db = getFirestore();
const auth = getAuth();

const TEST_USER_EMAIL = 'test@example.com';
const TEST_USER_PASSWORD = 'password';

// Helper function to delete all documents in a collection
async function deleteCollection(collectionRef: CollectionReference, batchSize: number) {
  const query = collectionRef.limit(batchSize);
  let snapshot;

  while ((snapshot = await query.get()).size > 0) {
    const batch = db.batch();
    snapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });
    await batch.commit();
  }
}

async function seed() {
  try {
    console.log('Starting database seeding...');

    // 1. Completely clear existing data and wait for it to finish
    console.log('Clearing existing data...');
    const collectionsToClear = [db.collection('menus'), db.collection('orders')];
    await Promise.all(collectionsToClear.map(ref => deleteCollection(ref, 50)));
    console.log('Data cleared successfully.');

    // 2. Prepare all seeding promises
    console.log('Preparing new seed data...');

    // User creation promise
    const userCreationPromise = auth.createUser({
      email: TEST_USER_EMAIL,
      password: TEST_USER_PASSWORD,
    }).catch(error => {
      if (error.code === 'auth/email-already-exists') {
        return auth.getUserByEmail(TEST_USER_EMAIL); // User already exists, which is fine
      }
      throw error;
    });

    // Menu items creation promise
    const menuItems = [
      { id: 'espresso', name: 'Espresso', price: 500, category: 'Coffee', isSoldOut: false, sortOrder: 1 },
      { id: 'latte', name: 'Latte', price: 600, category: 'Coffee', isSoldOut: false, sortOrder: 2 },
      { id: 'cappuccino', name: 'Cappuccino', price: 650, category: 'Coffee', isSoldOut: true, sortOrder: 3 },
      { id: 'tea', name: 'Tea', price: 400, category: 'Tea', isSoldOut: false, sortOrder: 4 },
    ];
    const menuPromises = menuItems.map(item => db.collection('menus').doc(item.id).set(item));

    // System settings reset promise
    const systemSettingsPromise = db.doc('system_settings/single_doc').set({
      nextQrOrderNumber: 101,
      nextManualOrderNumber: 1,
    });

    // Completed orders creation promise
    const now = new Date();
    const yesterday = new Date();
    yesterday.setDate(now.getDate() - 1);
    const ordersToSeed = [
      { orderNumber: 1, orderType: 'manual', status: 'completed', totalPrice: 1100, items: [{name: 'Espresso', quantity: 1}, {name: 'Latte', quantity: 1}], createdAt: yesterday },
      { orderNumber: 101, orderType: 'qr', status: 'completed', totalPrice: 1700, items: [{name: 'Latte', quantity: 2}, {name: 'Tea', quantity: 1}], createdAt: now },
      { orderNumber: 2, orderType: 'manual', status: 'completed', totalPrice: 500, items: [{name: 'Espresso', quantity: 1}], createdAt: now },
      { orderNumber: 102, orderType: 'qr', status: 'paid', totalPrice: 650, items: [{name: 'Cappuccino', quantity: 1}], createdAt: now },
    ];
    const orderPromises = ordersToSeed.map(order => db.collection('orders').add(order));

    // 3. Execute all seeding promises in parallel and wait for all to complete
    console.log('Waiting for all data to be seeded...');
    await Promise.all([
      userCreationPromise,
      ...menuPromises,
      systemSettingsPromise,
      ...orderPromises
    ]);

    console.log('Database seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
}

seed();
