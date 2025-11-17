import * as functions from "firebase-functions/v1";
import * as admin from "firebase-admin";
import Stripe from "stripe";
import { Request, Response } from "express";

// Initialize Stripe with the secret key from environment variables
if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("STRIPE_SECRET_KEY environment variable is not set.");
}
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2025-10-29.clover",
});

const db = admin.firestore();

export const handleStripeWebhook = functions.https.onRequest(
  async (req: Request, res: Response) => {
    const sig = req.headers["stripe-signature"] as string;

    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!endpointSecret) {
      console.error("STRIPE_WEBHOOK_SECRET environment variable is not set.");
      res.status(500).send("Internal Server Error: Webhook secret not configured.");
      return;
    }

    let event: Stripe.Event;

    try {
      // 1. Verify the event came from Stripe
      event = stripe.webhooks.constructEvent((req as any).rawBody, sig, endpointSecret);
    } catch (err: any) {
      console.error("Webhook signature verification failed.", err);
      res.status(400).send(`Webhook Error: ${err.message}`);
      return;
    }

    // 2. Handle the event
    switch (event.type) {
      case "payment_intent.succeeded":
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.log(`PaymentIntent for ${paymentIntent.amount} was successful!`);

        try {
          const orderId = paymentIntent.metadata.orderId;
          if (orderId) {
            const orderRef = db.collection("orders").doc(orderId);
            // 3. Update the order status to 'paid'
            await orderRef.update({ status: "paid" });
            console.log(`Order ${orderId} has been marked as paid.`);
          } else {
            console.warn(
              "Webhook received for PaymentIntent without an orderId in metadata."
            );
          }
        } catch (dbError) {
          console.error("Database error updating order status:", dbError);
          res.status(500).send("Internal server error during DB update.");
          return;
        }
        break;

      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    // 4. Return a 200 response to acknowledge receipt of the event
    res.status(200).send();
  }
);
