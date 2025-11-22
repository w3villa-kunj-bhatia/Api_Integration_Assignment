import dotenv from "dotenv";
dotenv.config();

import express from "express";
import Stripe from "stripe";
import cors from "cors";

const app = express();

const stripeKey = process.env.STRIPE_SECRET_KEY;
if (!stripeKey) {
  console.error("Missing STRIPE_SECRET_KEY in environment. See .env.example");
  process.exit(1);
}

const stripe = new Stripe(stripeKey, { apiVersion: "2023-08-16" });

app.use(cors({ origin: "http://localhost:5173" }));
app.use(express.json());

app.post("/create-checkout-session", async (req, res) => {
  try {
    const {
      price_cents,
      currency = "usd",
      quantity = 1,
      name = "Ticket",
      metadata = {},
    } = req.body;

    if (!price_cents) {
      return res.status(400).json({ error: "price_cents required" });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency,
            product_data: { name },
            unit_amount: price_cents,
          },
          quantity,
        },
      ],
      mode: "payment",
      success_url: `${
        process.env.SUCCESS_URL || "http://localhost:5173"
      }/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.CANCEL_URL || "http://localhost:5173"}/cancel`,
      metadata,
    });

    res.json({ url: session.url });
  } catch (err) {
    console.error("Stripe error:", err);
    res.status(500).json({ error: { message: err.message } });
  }
});

const PORT = process.env.PORT || 4242;
app.listen(PORT, () =>
  console.log(`Server listening on http://localhost:${PORT}`)
);