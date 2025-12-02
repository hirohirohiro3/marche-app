import * as functions from "firebase-functions/v1";
import * as admin from "firebase-admin";
import Stripe from "stripe";
import { Request, Response } from "express";

const db = admin.firestore();

export const handleStripeWebhook = functions.https.onRequest(
  async (req: Request, res: Response) => {
    // Stripe initialization is moved inside the function handler.
    // Stripe initialization is moved inside the function handler.
    const stripeKey = functions.config().stripe?.secret_key || process.env.STRIPE_SECRET_KEY;
    if (!stripeKey) {
      console.error("Stripe secret key is not configured.");
      res.status(500).send("Internal Server Error: Stripe secret key not configured.");
      return;
    }
    const stripe = new Stripe(stripeKey, {
      // apiVersion: "2025-10-29.clover", // Removed invalid version
    });

    const sig = req.headers["stripe-signature"] as string;

    const endpointSecret = functions.config().stripe?.webhook_secret || process.env.STRIPE_WEBHOOK_SECRET;
    if (!endpointSecret) {
      console.error("Stripe webhook secret is not configured.");
      res
        .status(500)
        .send("Internal Server Error: Stripe webhook secret not configured.");
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


        try {
          const orderId = paymentIntent.metadata.orderId;
          if (orderId) {
            const orderRef = db.collection("orders").doc(orderId);
            // 3. Update the order status to 'paid'
            await orderRef.update({ status: "paid" });

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

    }

    // 4. Return a 200 response to acknowledge receipt of the event
    res.status(200).send();
  }
);
