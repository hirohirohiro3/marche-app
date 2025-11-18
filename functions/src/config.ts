import { defineString } from "firebase-functions/v2/params";

// Define Stripe secret key as a string parameter.
// The value will be sourced from the environment variable STRIPE_SECRET_KEY.
export const stripeSecretKey = defineString("STRIPE_SECRET_KEY");

// Define Stripe webhook secret as a string parameter.
// The value will be sourced from the environment variable STRIPE_WEBHOOK_SECRET.
export const stripeWebhookSecret = defineString("STRIPE_WEBHOOK_SECRET");
