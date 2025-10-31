/**
 * This is a boilerplate for the `createPaymentIntent` Firebase Function.
 * It is not intended to be run directly in this environment.
 * The logic should be migrated to a proper Firebase Functions setup.
 */
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
// It's assumed that the Stripe Node.js library is installed in the Functions environment.
// const stripe = require('stripe')(functions.config().stripe.secret_key);

// This would be initialized in your functions index file
// admin.initializeApp();
const db = admin.firestore();

// A placeholder for the actual Stripe logic.
const stripe = {
  paymentIntents: {
    create: async (params: any) => {
      console.log('Mock Stripe API: Creating PaymentIntent with params:', params);
      return {
        client_secret: `pi_${Math.random().toString(36).substr(2)}_secret_${Math.random().toString(36).substr(2)}`,
      };
    },
  },
};


export const createPaymentIntent = functions.https.onCall(async (data, context) => {
  // 1. Check for authentication
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'The function must be called while authenticated.');
  }

  const { orderId } = data;
  if (!orderId) {
    throw new functions.https.HttpsError('invalid-argument', 'The function must be called with an "orderId".');
  }

  try {
    // 2. Get order details from Firestore
    const orderRef = db.collection('orders').doc(orderId);
    const orderDoc = await orderRef.get();

    if (!orderDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Order not found.');
    }

    const orderData = orderDoc.data();
    const totalPrice = orderData?.totalPrice; // Assume price is in the smallest currency unit (e.g., JPY)

    // Security check: Ensure the user owns this order
    if (orderData?.uid !== context.auth.uid) {
       throw new functions.https.HttpsError('permission-denied', 'You do not have permission to process this order.');
    }

    // 3. Get the store's Stripe Account ID
    const storeId = orderData?.storeId;
    if (!storeId) {
        throw new functions.https.HttpsError('failed-precondition', 'The order is not associated with a store.');
    }
    const storeRef = db.collection('stores').doc(storeId);
    const storeDoc = await storeRef.get();
    const stripeAccountId = storeDoc.data()?.stripeAccountId;

    if (!stripeAccountId) {
        throw new functions.https.HttpsError('failed-precondition', 'The store is not connected to Stripe.');
    }

    // 4. Create a Payment Intent with Stripe
    const paymentIntent = await stripe.paymentIntents.create({
      amount: totalPrice,
      currency: 'jpy',
      automatic_payment_methods: {
        enabled: true,
      },
      // The application fee is charged from the connected account
      application_fee_amount: Math.round(totalPrice * 0.05), // Example: 5% fee
      // The `transfer_data` parameter directs the payment to the connected account
      transfer_data: {
        destination: stripeAccountId,
      },
    });

    // 5. Return the client secret to the client
    return {
      clientSecret: paymentIntent.client_secret,
    };

  } catch (error) {
    console.error('Error creating Payment Intent:', error);
    throw new functions.https.HttpsError('internal', 'Unable to create payment intent.');
  }
});
