import dotenv from "dotenv";
dotenv.config();

import express from "express";
import Stripe from "stripe";
import cors from "cors";
import path from "path";
import process from "process";

const app = express();

// --- Configuration ---------------------------------------------------------

const stripeKey = process.env.STRIPE_SECRET_KEY;
if (!stripeKey) {
  console.error("Missing STRIPE_SECRET_KEY in environment. See .env.example");
  process.exit(1);
}

const stripe = new Stripe(stripeKey, { apiVersion: "2023-08-16" });

// FRONTEND_ORIGIN can be a single origin or a comma-separated list of origins.
// Example:
//   FRONTEND_ORIGIN=http://localhost:5173,https://your-frontend.vercel.app
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || "http://localhost:5173";
const allowedOrigins = FRONTEND_ORIGIN.split(",")
  .map((s) => s.trim())
  .filter(Boolean);

// --- Middleware ------------------------------------------------------------

// Allow JSON request bodies
app.use(express.json());

// CORS: allow only configured origins, and allow requests with no origin (like curl)
app.use(
  cors({
    origin: (origin, callback) => {
      // If no origin (curl, server-to-server), allow it
      if (!origin) return callback(null, true);
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

// --- Routes ---------------------------------------------------------------

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
      return res
        .status(400)
        .json({
          error: "price_cents (number, in smallest currency unit) required",
        });
    }

    // Create a Stripe Checkout Session
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
        (process.env.SUCCESS_URL || "").replace(/\/$/, "") ||
        "http://localhost:5173"
      }/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${
        (process.env.CANCEL_URL || "").replace(/\/$/, "") ||
        "http://localhost:5173"
      }/cancel`,
      metadata,
    });

    // Return the hosted checkout URL to the client
    res.json({ url: session.url });
  } catch (err) {
    // Log full error server-side, but return safe message client-side
    console.error("Stripe error:", err);
    res
      .status(500)
      .json({
        error: { message: (err && err.message) || "Internal Server Error" },
      });
  }
});

// Optionally serve the built frontend (if you build the Vite app and want Express to serve it)
// This is useful when deploying a single Render service that hosts both backend and frontend.
if (process.env.SERVE_STATIC === "true") {
  const __dirname = path.resolve();
  const staticPath = path.join(__dirname, "dist");
  app.use(express.static(staticPath));
  app.get("/", (req, res) => res.sendFile(path.join(staticPath, "index.html")));
}

// --- Start ----------------------------------------------------------------

const PORT = process.env.PORT || 4242;
app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
  console.log(`Allowed CORS origins: ${allowedOrigins.join(", ")}`);
});