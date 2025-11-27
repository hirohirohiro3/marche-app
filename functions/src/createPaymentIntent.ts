import * as functions from "firebase-functions/v1";
import * as admin from "firebase-admin";
import Stripe from "stripe";

const db = admin.firestore();

// Explicitly set region to asia-northeast1 to match Firestore
export const createPaymentIntent = functions.region('asia-northeast1').https.onCall(
  async (data, context) => {
    try {
      // Check for authentication
      if (!context.auth) {
        functions.logger.warn("Unauthenticated call to createPaymentIntent");
        throw new functions.https.HttpsError(
          'unauthenticated',
          'The function must be called while authenticated.'
        );
      }

      const { orderId } = data;

      functions.logger.info("Processing createPaymentIntent", { orderId, uid: context.auth.uid });

      if (!orderId) {
        functions.logger.error("Missing orderId");
        throw new functions.https.HttpsError(
          'invalid-argument',
          'The function must be called with an "orderId".'
        );
      }

      // Stripe initialization
      const stripeKey = functions.config().stripe?.secret_key || process.env.STRIPE_SECRET_KEY;
      functions.logger.info("Stripe Key configured:", { configured: !!stripeKey });

      if (!stripeKey) {
        functions.logger.error("Stripe secret key missing");
        throw new functions.https.HttpsError(
          'failed-precondition',
          'Stripe secret key is not configured.'
        );
      }

      const stripe = new Stripe(stripeKey, {});

      // Get order details from Firestore
      const orderRef = db.collection("orders").doc(orderId);
      const orderDoc = await orderRef.get();

      if (!orderDoc.exists) {
        functions.logger.error("Order not found", { orderId });
        throw new functions.https.HttpsError(
          'not-found',
          'Order not found.'
        );
      }

      const orderData = orderDoc.data();
      if (!orderData) {
        functions.logger.error("Order data missing", { orderId });
        throw new functions.https.HttpsError(
          'internal',
          'Order data is missing.'
        );
      }
      const totalPrice = orderData.totalPrice;

      // Get the store's Stripe Account ID
      const storeId = orderData.storeId;
      functions.logger.info("Store ID retrieved", { storeId });

      if (!storeId) {
        functions.logger.error("Store ID missing in order", { orderId });
        throw new functions.https.HttpsError(
          'failed-precondition',
          'The order is not associated with a store.'
        );
      }

      const storeRef = db.collection("stores").doc(storeId);
      const storeDoc = await storeRef.get();
      const stripeAccountId = storeDoc.data()?.stripeAccountId;
      functions.logger.info("Stripe Account ID retrieved", { stripeAccountId });

      if (!stripeAccountId) {
        functions.logger.error("Stripe Account ID missing for store", { storeId });
        throw new functions.https.HttpsError(
          'failed-precondition',
          'The store is not connected to Stripe.'
        );
      }

      // Create a Payment Intent with Stripe
      try {
        const paymentIntent = await stripe.paymentIntents.create({
          amount: totalPrice,
          currency: "jpy",
          automatic_payment_methods: {
            enabled: true,
          },
          application_fee_amount: Math.round(totalPrice * 0.05),
          transfer_data: {
            destination: stripeAccountId,
          },
          metadata: {
            orderId: orderId,
          },
        });

        functions.logger.info("Payment Intent created successfully", { paymentIntentId: paymentIntent.id });

        // Return the client secret to the client
        return {
          clientSecret: paymentIntent.client_secret,
        };
      } catch (stripeError: any) {
        functions.logger.error("Stripe API Error", { error: stripeError });
        // Return error details to client for debugging
        return {
          error: stripeError.message || "Stripe API Error",
          details: stripeError,
          step: "stripe.paymentIntents.create"
        };
      }
    } catch (error: any) {
      functions.logger.error("Error creating Payment Intent", { error });

      // Return error details to client for debugging
      return {
        error: error.message || "Unknown error",
        details: error,
        step: "createPaymentIntent execution"
      };
    }
  }
);