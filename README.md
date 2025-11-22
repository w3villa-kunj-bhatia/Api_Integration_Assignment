# Vite React Concert Ticket (Stripe Checkout)

## Setup

1. Clone or create the project files as above.
2. Install dependencies:

```bash
npm install
```

3. Create a `.env` file in the project root (or in `server/`) using `.env.example` and set your Stripe secret key.

4. Start the dev server and backend server in separate terminals:

```bash
npm run dev # starts Vite frontend at http://localhost:5173
npm run start:server # starts express backend at http://localhost:4242
```

5. Open `http://localhost:5173` and click Buy. The frontend calls `POST http://localhost:4242/create-checkout-session`, the server creates a Stripe Checkout session and returns a `url` — the browser is redirected to Stripe's hosted checkout.

## Notes

- This example uses Stripe Checkout (hosted) — safer and easier than handling card details directly.
- Replace `STRIPE_SECRET_KEY` with your real secret key for real charges; for testing use `sk_test_...` and the Stripe test card `4242 4242 4242 4242`.
- Add server-side record-keeping (orders, tickets issued) and webhook handling to finalize orders once Stripe reports successful payments.

## Next steps (recommended)

- Add `webhook` endpoint to confirm payment intent and create tickets only after verification.
- Add server-side ticket id generation & email sending for delivered tickets/QR codes.
- Deploy server to a secure host (make sure env variables are set) and update `SUCCESS_URL`/`CANCEL_URL` to production URLs.