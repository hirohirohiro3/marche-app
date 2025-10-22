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
    // Clear existing menus
    const snapshot = await db.collection('menus').get();
    const batch = db.batch();
    snapshot.forEach((doc) => {
      batch.delete(doc.ref);
    });
    await batch.commit();

    // Add a test menu item
    const menuRef = db.collection('menus').doc('test-item');
    await menuRef.set({
      name: 'Test Coffee',
      price: 300,
      description: 'A delicious test coffee.',
      category: 'Hot',
      imageUrl: '',
      isSoldOut: false,
      sortOrder: 1,
    });

    console.log('Database seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
}

seed();
