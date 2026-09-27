# Battleship Arena — API server

Two jobs: **persist bookings**, and **create/verify Razorpay orders** for the
optional pay-online path. It exists because Razorpay's key secret can never ship
to a browser, and because a booking that lives only in React state is not a
booking.

## Running it

```bash
npm install
cp .env.example .env     # then paste real keys into .env
```

**Development** — two processes:

```bash
npm run dev:server       # Express on :5175
npm run dev              # Vite on :5174, proxies /api → :5175
```

Open <http://localhost:5174>. The browser stays same-origin; Vite forwards
`/api/*` to Express.

**Production** — one process:

```bash
npm run build            # emits dist/
npm start                # Express serves dist/ and /api on :5175
```

If you skip `npm run build`, `/` returns a 503 explaining exactly that rather
than a blank page.

## Trust model

The browser may say **what** it wants to book. It never says **what that costs**.

`src/data/pricing.js` is imported by *both* the UI (to preview a price) and the
server (to charge it), so the number on the button is computed by the same code
that computes the number sent to Razorpay. `POST /api/create-order` accepts only
a `bookingId` and reads the amount stored on that booking — posting
`{ bookingId, amount: 100 }` for the ₹4,999 Party Bay still charges ₹4,999.

## Endpoints

| Endpoint | Body | Returns |
|---|---|---|
| `GET /api/health` | — | `{ ok, razorpayConfigured, time }` |
| `POST /api/bookings` | `{ itemId, players, date, timeSlot, guestName, guestPhone, selectedGameIds? }` | `201` booking |
| `GET /api/bookings/:id` | — | the booking (guest phone omitted) |
| `POST /api/create-order` | `{ bookingId }` | `{ orderId, amountPaise, currency, keyId }` |
| `POST /api/verify-payment` | `{ bookingId, razorpay_order_id, razorpay_payment_id, razorpay_signature }` | `{ verified, paymentStatus, reference }` |

`GET /api/bookings/:id` accepts either the UUID or the `BS-XXXXXX` reference,
and strips `guestPhone` — a booking reference is short and guessable, so it must
not be a way to harvest phone numbers.

## Payment is optional, by design

A booking is created and persisted **before** any payment is attempted. Every
failure path — modal dismissed, card declined, signature mismatch, network drop
— leaves a valid unpaid booking and tells the customer their slot is held. A
Razorpay outage cannot stop the venue from taking reservations.

`POST /api/verify-payment` runs three checks, all of which must pass:

1. **The order belongs to this booking.** A signature proves *an* order was
   paid; it does not prove it was *this* booking's order. Without this check, a
   valid signature from a ₹299 order could be replayed against a ₹4,999 one.
2. **The signature is authentic** — HMAC-SHA256 over `orderId|paymentId`, keyed
   by the secret, compared with `crypto.timingSafeEqual`. A signature mismatch
   returns 400 and **never** marks the booking paid.
3. **The booking is not already paid** — idempotent.

`POST /api/create-order` reuses a booking's existing order instead of minting a
second one, and if Razorpay reports that order as already paid it marks the
booking paid and returns 409. That is a partial substitute for a webhook: it
recovers the "customer paid, then the callback never reached us" case the next
time they press *Pay*.

## Operating limits — read before deploying

- **Single process only.** The booking store is `data/bookings.json`, and the
  write queue that prevents interleaved read-modify-write is process-local.
  Running two instances against the same file will lose bookings. Migrate to a
  real database before scaling past one process.
- **`data/` is gitignored.** It is live customer data, not source. Back it up.
- **No webhook handler.** Signature verification on the client callback covers
  the normal path. It does not cover a customer who pays and closes the tab
  before the callback fires — they will be marked unpaid until someone
  reconciles. Add `/api/razorpay/webhook` before taking significant volume.
- **Nobody is notified of a new booking.** It persists, and that is all. An
  email or WhatsApp alert to the front desk is the highest-value next addition.
- **Test keys cannot accept real money.** Going live requires Razorpay KYC and
  activation — a business process, not a code change.

## Environment

| Variable | Purpose |
|---|---|
| `RAZORPAY_KEY_ID` | Server-side key id. Also returned to the browser via `create-order`. |
| `RAZORPAY_KEY_SECRET` | **Server-side only.** Must never be given a `VITE_` prefix — Vite inlines those into the browser bundle. |
| `PORT` | Express port. Default 5175. |

Loaded with Node's native `--env-file`, so there is no `dotenv` dependency.
