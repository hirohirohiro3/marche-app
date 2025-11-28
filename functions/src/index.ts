import * as admin from "firebase-admin";
import * as dotenv from "dotenv";

/**
 * Load environment variables from a .env file if it exists.
 * This is for local development and testing.
 * In the deployed environment, Firebase sets the environment variables.
 */
dotenv.config();

/**
 * Initialize the Firebase Admin SDK.
 * It automatically uses the service account credentials from the environment.
 */
admin.initializeApp();

/**
 * Import and export the Cloud Functions.
 * This pattern helps keep the index file clean and organizes functions into
 * their own files based on functionality.
 */
export { createPaymentIntent } from "./createPaymentIntent";
export { handleStripeWebhook } from "./handleStripeWebhook";
export { createStripeAccountLink } from "./createStripeAccountLink";
export { sendReceipt } from "./sendReceipt";
