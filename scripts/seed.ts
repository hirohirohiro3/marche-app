import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Initialize Firebase Admin SDK
const serviceAccount = JSON.parse(process.env.GOOGLE_CREDENTIALS);

initializeApp({
  credential: cert(serviceAccount),
});

const db = getFirestore();

async function seed() {
  console.log('Seeding database...');

  try {
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

    console.log('Database seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
}

seed();
