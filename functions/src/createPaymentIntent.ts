import * as functions from "firebase-functions/v1";
import * as admin from "firebase-admin";
import Stripe from "stripe";
import { stripeSecretKey } from "./config";

// Initialize Stripe with the secret key from the securely stored parameter
const stripe = new Stripe(stripeSecretKey.value(), {
  apiVersion: "2025-10-29.clover",
});

const db = admin.firestore();

export const createPaymentIntent = functions.https.onCall(
  async (data: { orderId: string }, context: functions.https.CallableContext) => {
    // 1. Check for authentication
    if (!context.auth) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "The function must be called while authenticated."
      );
    }

    const { orderId } = data;
    if (!orderId) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        'The function must be called with an "orderId".'
      );
    }

    try {
      // 2. Get order details from Firestore
      const orderRef = db.collection("orders").doc(orderId);
      const orderDoc = await orderRef.get();

      if (!orderDoc.exists) {
        throw new functions.https.HttpsError("not-found", "Order not found.");
      }

      const orderData = orderDoc.data();
      if (!orderData) {
        throw new functions.https.HttpsError(
          "internal",
          "Order data is missing."
        );
      }
      const totalPrice = orderData.totalPrice;

      // 3. Get the store's Stripe Account ID
      const storeId = orderData.storeId;
      if (!storeId) {
        throw new functions.https.HttpsError(
          "failed-precondition",
          "The order is not associated with a store."
        );
      }
      const storeRef = db.collection("stores").doc(storeId);
      const storeDoc = await storeRef.get();
      const stripeAccountId = storeDoc.data()?.stripeAccountId;

      if (!stripeAccountId) {
        throw new functions.https.HttpsError(
          "failed-precondition",
          "The store is not connected to Stripe."
        );
      }

      // 4. Create a Payment Intent with Stripe
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

      // 5. Return the client secret to the client
      return {
        clientSecret: paymentIntent.client_secret,
      };
    } catch (error) {
      console.error("Error creating Payment Intent:", error);
      if (error instanceof functions.https.HttpsError) {
        throw error;
      }
      throw new functions.https.HttpsError(
        "internal",
        "Unable to create payment intent."
      );
    }
  }
);
