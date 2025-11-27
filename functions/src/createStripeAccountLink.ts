import * as functions from "firebase-functions/v1";
import * as admin from "firebase-admin";
import Stripe from "stripe";

const db = admin.firestore();

export const createStripeAccountLink = functions.https.onCall(
  async (data: any, context: functions.https.CallableContext) => {
    // 1. Authentication check
    if (!context.auth) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "The function must be called while authenticated."
      );
    }

    const uid = context.auth.uid;

    // Initialize Stripe
    // Initialize Stripe
    const stripeKey = functions.config().stripe?.secret_key || process.env.STRIPE_SECRET_KEY;
    if (!stripeKey) {
      throw new functions.https.HttpsError(
        "internal",
        "Stripe secret key is not configured."
      );
    }
    const stripe = new Stripe(stripeKey, {
      // apiVersion: "2025-10-29.clover", // Removed invalid version
    });

    try {
      // 2. Check if the store already has a Stripe Connect Account ID
      const storeRef = db.collection("stores").doc(uid);
      const storeDoc = await storeRef.get();

      if (!storeDoc.exists) {
        throw new functions.https.HttpsError("not-found", "Store not found.");
      }

      let stripeAccountId = storeDoc.data()?.stripeAccountId;

      // 3. If not, create a new Express account
      if (!stripeAccountId) {
        const account = await stripe.accounts.create({
          type: "express",
          country: "JP", // Assuming Japan based on the context
          email: context.auth.token.email,
          capabilities: {
            card_payments: { requested: true },
            transfers: { requested: true },
          },
        });
        stripeAccountId = account.id;

        // Save the new account ID to Firestore
        await storeRef.update({ stripeAccountId });
      }

      // 4. Create an Account Link for onboarding
      // The return_url and refresh_url should point to your frontend
      // You might need to pass the base URL from the client or configure it in env vars
      // For now, we'll assume a standard path on the frontend
      const baseUrl = data.baseUrl || "http://localhost:5173"; // Default to local for dev, client should send this

      const accountLink = await stripe.accountLinks.create({
        account: stripeAccountId,
        refresh_url: `${baseUrl}/admin/settings/payment?refresh=true`,
        return_url: `${baseUrl}/admin/settings/payment?success=true`,
        type: "account_onboarding",
      });

      return {
        url: accountLink.url,
      };
    } catch (error: any) {
      console.error("Error creating Stripe account link:", error);
      throw new functions.https.HttpsError(
        "internal",
        `Unable to create Stripe account link: ${error.message}`
      );
    }
  }
);
