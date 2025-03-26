import Stripe from "stripe";
import { NextFunction, Request, Response } from "express";
import { IUser, User } from "../models/user";
import config from "../config";
const stripe = new Stripe(config.stripeSecretKey as string, {
  apiVersion: "2025-02-24.acacia",
});
class PlanController {
  static purchasePlan = async (req: Request, res: Response) => {
    try {
      const { steamid, priceId, paymentMethodId, email } = req.body;
      const user = await User.findOne({ steamid }).exec();
      if (!user) {
        return res.status(404).json({ error: "User doesn't registered!" });
      }

      const customerId = user.customerId;
      if (!priceId || !paymentMethodId) {
        return res
          .status(400)
          .json({ error: "Price ID and Payment Method ID are required" });
      }

      let customer = null;

      // Step 1: Check if the customer ID is valid
      if (customerId) {
        try {
          customer = await stripe.customers.retrieve(customerId);
        } catch (err) {
          console.warn(
            `⚠️ Customer ID '${customerId}' not found. Creating a new one...`
          );
        }
      }

      // Step 2: Create a new customer if not found
      if (!customer) {
        if (!email) {
          return res
            .status(400)
            .json({ error: "Email is required to create a new customer." });
        }

        customer = await stripe.customers.create({
          email,
          payment_method: paymentMethodId,
          invoice_settings: { default_payment_method: paymentMethodId },
        });
      }

      // Step 3: Check if customer has an active subscription
      const subscriptions = await stripe.subscriptions.list({
        customer: customer.id,
        status: "active",
        limit: 1,
      });

      if (subscriptions.data.length > 0) {
        // ✅ Existing Subscription Found → Upgrade Plan
        const subscription: any = subscriptions.data[0];
        const currentSubscriptionItem = subscription.items.data[0];
        const updatedSubscription = await stripe.subscriptions.update(
          subscription.id,
          {
            items: [
              {
                id: currentSubscriptionItem.id,
                price: priceId,
              },
            ],
            proration_behavior: "create_prorations",
          }
        );
        user.subscription = "Learn";
        await user.save();
        return res.json({
          message: "Subscription upgraded successfully",
          subscriptionId: updatedSubscription.id,
          status: updatedSubscription.status,
        });
      } else {
        // ✅ No Active Subscription → Create New Subscription
        const subscription = await stripe.subscriptions.create({
          customer: customer.id,
          items: [{ price: priceId }],
          payment_behavior: "default_incomplete",
          expand: ["latest_invoice.payment_intent"],
        });

        let clientSecret: string | null = null;
        const latestInvoice = subscription.latest_invoice as Stripe.Invoice;

        if (
          latestInvoice &&
          typeof latestInvoice !== "string" &&
          latestInvoice.payment_intent
        ) {
          clientSecret = (latestInvoice.payment_intent as Stripe.PaymentIntent)
            .client_secret;
        }
        if (clientSecret) {
          user.customerId = customer.id;
          user.subscription = "Learn";
          await user.save();
        }
        return res.json({
          message: "New subscription created",
          subscriptionId: subscription.id,
          customerId: customer.id, // ✅ Return newly created customer ID
          status: subscription.status,
          clientSecret,
        });
      }
    } catch (error) {
      console.error("❌ Error purchasing plan:", error);
      res.status(500).json({ error: (error as Error).message });
    }
  };

  static getPrices = async (req: Request, res: Response) => {
    try {
      //   const { productId } = req.params;

      //   if (!productId) {
      //     return res.status(400).json({ error: "Product ID is required" });
      //   }
      const productId = "prod_Rxnss4INbUfiNO";

      // ✅ Fetch all prices for the product
      const prices = await stripe.prices.list({
        product: productId,
        active: true,
        expand: ["data.recurring"], // ✅ Get subscription interval (monthly/yearly)
      });

      if (!prices.data.length) {
        return res
          .status(404)
          .json({ message: "No prices found for this product" });
      }

      // ✅ Format price details
      const priceList = prices.data.map((price: any) => ({
        priceId: price.id,
        amount: price.unit_amount / 100, // Convert cents to dollars
        currency: price.currency.toUpperCase(),
        interval: price.recurring?.interval, // Monthly, yearly, etc.
      }));

      res.json({ productId, prices: priceList, data: prices });
    } catch (error) {
      console.error("❌ Error fetching prices:", error);
      res.status(500).json({ error: (error as Error).message });
    }
  };

  static webhook = (req: Request, res: Response) => {
    const sig = req.headers["stripe-signature"];
    const endpointSecret = config.stripeWebhookSecret!;

    if (!endpointSecret) {
      console.error("❌ Missing STRIPE_WEBHOOK_SECRET in .env file.");
      return res.status(500).send("Webhook secret not configured.");
    }

    let event: Stripe.Event;

    try {
      if (!sig) throw new Error("Webhook signature missing");
      event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    } catch (err) {
      console.error("❌ Webhook signature verification failed:", err);
      return res.status(400).send(`Webhook Error: ${(err as Error).message}`);
    }

    if (event.type === "invoice.payment_failed") {
      const invoice = event.data.object as Stripe.Invoice;
      const subscriptionId = invoice.subscription as string | undefined;

      if (subscriptionId) {
        stripe.subscriptions
          .update(subscriptionId, {
            items: [
              {
                price: "price_lower_tier_id", // ✅ Downgrade to a lower plan
              },
            ],
            proration_behavior: "create_prorations",
          })
          .then(() =>
            console.log("✅ Subscription downgraded due to failed payment.")
          )
          .catch(console.error);
      }
    }

    res.json({ received: true });
  };

  static cancelSubscription = async (req: Request, res: Response) => {
    try {
      const { steamid } = req.body;
      const cancelImmediately = false;
      const user = await User.findOne({ steamid }).exec();
      if (!user) {
        return res.status(404).json({ error: "User doesn't registered!" });
      }
      const customerId = user.customerId;
      if (!customerId) {
        return res.status(400).json({ error: "Customer ID is required" });
      }

      // ✅ Step 1: Retrieve active subscription
      const subscriptions = await stripe.subscriptions.list({
        customer: customerId,
        status: "active",
        limit: 1,
      });

      if (!subscriptions.data.length) {
        return res
          .status(404)
          .json({ message: "No active subscription found" });
      }

      const subscription = subscriptions.data[0];

      let canceledSubscription;

      // ✅ Step 2: Cancel subscription
      if (cancelImmediately) {
        canceledSubscription = await stripe.subscriptions.cancel(
          subscription.id
        );
      } else {
        canceledSubscription = await stripe.subscriptions.update(
          subscription.id,
          {
            cancel_at_period_end: true, // ✅ Cancels at the end of the billing cycle
          }
        );
      }
      //   user.subscription = "Free";
      user.customerId = "";
      await user.save();

      res.json({
        message: cancelImmediately
          ? "Subscription canceled immediately"
          : "Subscription will cancel at the end of the billing cycle",
        subscriptionId: subscription.id,
        status: canceledSubscription.status,
      });
    } catch (error) {
      console.error("❌ Error canceling subscription:", error);
      res.status(500).json({ error: (error as Error).message });
    }
  };
}

export default PlanController;
