import dotenv from "dotenv";
dotenv.config();

import express from "express";
import Stripe from "stripe";
import cors from "cors";
import path from "path";
import process from "process";

const app = express();

const stripeKey = process.env.STRIPE_SECRET_KEY;
if (!stripeKey) {
  console.error("Missing STRIPE_SECRET_KEY in environment. See .env.example");
  process.exit(1);
}

const stripe = new Stripe(stripeKey, { apiVersion: "2023-08-16" });

// Use environment variable for deployed frontend URL, fallback to local
// This is used for CORS control and setting Stripe redirect URLs.
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || "http://localhost:5173";
const allowedOrigins = FRONTEND_ORIGIN.split(",")
  .map((s) => s.trim())
  .filter(Boolean);

app.use(express.json());
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);

      // FIX: Check if the request origin matches the deployed Vercel domain
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error(`CORS policy: origin ${origin} not allowed`));
    },
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: false,
  })
);

app.get("/health", (req, res) => {
  res.json({ status: "ok", env: process.env.NODE_ENV || "development" });
});

app.post("/create-checkout-session", async (req, res) => {
  try {
    const {
      price_cents,
      currency = "usd",
      quantity = 1,
      name = "Ticket",
      metadata = {},
    } = req.body ?? {};

    if (!price_cents || typeof price_cents !== "number") {
      return res.status(400).json({
        error: "price_cents (number, in smallest currency unit) required",
      });
    }

    // Use FRONTEND_ORIGIN for Stripe redirect URLs
    const baseUrl = (
      process.env.SUCCESS_URL ||
      process.env.FRONTEND_ORIGIN ||
      "http://localhost:5173"
    ).replace(/\/$/, "");

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
      success_url: `${baseUrl}/success?session_id={CHECKOUT_SESSION_ID}`, // Redirects to Vercel URL
      cancel_url: `${baseUrl}/cancel`, // Redirects to Vercel URL
      metadata,
    });

    res.json({ url: session.url });
  } catch (err) {
    console.error("Stripe error:", err);
    res.status(500).json({
      error: { message: (err && err.message) || "Internal Server Error" },
    });
  }
});

// MISSING ENDPOINT ADDED: Retrieve session status for success page verification
app.get("/session-status", async (req, res) => {
  try {
    const sessionId = req.query.session_id;

    if (!sessionId) {
      return res
        .status(400)
        .json({ error: "Missing session_id query parameter" });
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["line_items.data.price.product"],
    });

    // Extract item name from expanded line_items
    const firstLineItem = session.line_items?.data?.[0];
    const itemName =
      firstLineItem?.description ||
      firstLineItem?.price?.product?.name ||
      "Ticket";

    res.json({
      status: session.payment_status, // should be 'paid' on success
      customer_email: session.customer_details?.email,
      line_items: [{ description: itemName }], // Return simplified item detail
    });
  } catch (err) {
    console.error("Stripe error retrieving session:", err);
    res
      .status(500)
      .json({ error: { message: "Failed to retrieve session status" } });
  }
});

if (process.env.SERVE_STATIC === "true") {
  const __dirname = path.resolve();
  const staticPath = path.join(__dirname, "dist");
  app.use(express.static(staticPath));
  app.get("/", (req, res) => res.sendFile(path.join(staticPath, "index.html")));
}

const PORT = process.env.PORT || 4242;
app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
  console.log(`Allowed CORS origins: ${allowedOrigins.join(", ")}`);
});
