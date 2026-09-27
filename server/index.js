/**
 * Battleship Arena — API server.
 *
 * Two jobs:
 *   1. Persist bookings (the thing the site never did).
 *   2. Create and verify Razorpay orders for the optional "pay online" path.
 *
 * Trust model: the browser may say WHAT it wants to book, never WHAT IT COSTS.
 * Every amount is computed here from src/data/ and stored on the booking, then
 * reused verbatim when the Razorpay order is created.
 *
 * Run:
 *   dev   node --env-file=.env --watch server/index.js
 *   prod  node --env-file=.env server/index.js
 */

import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { promises as fs } from 'node:fs';
import express from 'express';

import { validateBookingRequest } from './catalog.js';
import { attachOrder, createBooking, getBooking, markPaid } from './bookings.js';
import {
  assertConfigured,
  createOrder,
  describeError,
  fetchOrder,
  getKeyId,
  razorpayConfigured,
  statusForError,
  verifySignature,
} from './razorpay.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIST_DIR = path.resolve(__dirname, '..', 'dist');
const PORT = Number(process.env.PORT || 5175);

const app = express();
app.disable('x-powered-by');
app.use(express.json({ limit: '32kb' }));

/** Wraps an async handler so a rejected promise reaches the error middleware. */
const route = (handler) => (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);

// ---------------------------------------------------------------------------
// API
// ---------------------------------------------------------------------------

app.get('/api/health', (req, res) => {
  res.json({
    ok: true,
    razorpayConfigured: razorpayConfigured(),
    time: new Date().toISOString(),
  });
});

/**
 * Creates a booking. Payment is optional — this succeeds on its own and the
 * customer can pay at the venue, or pay online afterwards.
 */
app.post(
  '/api/bookings',
  route(async (req, res) => {
    const { errors, value } = validateBookingRequest(req.body);
    if (errors.length) return res.status(400).json({ error: 'Validation failed', details: errors });

    const booking = await createBooking(value);

    res.status(201).json({
      bookingId: booking.id,
      reference: booking.reference,
      itemName: booking.itemName,
      pricingUnit: booking.pricingUnit,
      players: booking.players,
      date: booking.date,
      timeSlot: booking.timeSlot,
      amountPaise: booking.amountPaise,
      currency: booking.currency,
      paymentStatus: booking.paymentStatus,
    });
  }),
);

app.get(
  '/api/bookings/:id',
  route(async (req, res) => {
    const booking = await getBooking(req.params.id);
    if (!booking) return res.status(404).json({ error: 'Booking not found' });

    // The stored guest phone is not needed by the confirmation screen; omit it
    // so a guessed reference can't be used to harvest contact details.
    const { guestPhone, ...safe } = booking;
    res.json(safe);
  }),
);

/**
 * Creates a Razorpay order for an existing booking.
 *
 * Takes only a bookingId. The amount comes from the stored booking — a client
 * that posts `{ bookingId, amount: 100 }` still gets charged the real price.
 *
 * Retrying reuses the booking's existing order rather than creating a second
 * one. Without that, a customer who pays but whose callback fails would get a
 * fresh order on "try again" and could be charged twice.
 */
app.post(
  '/api/create-order',
  route(async (req, res) => {
    assertConfigured();

    const bookingId = req.body?.bookingId;
    if (!bookingId) return res.status(400).json({ error: 'bookingId is required' });

    const booking = await getBooking(bookingId);
    if (!booking) return res.status(404).json({ error: 'Booking not found' });

    if (booking.paymentStatus === 'paid') {
      return res.status(409).json({ error: 'This booking is already paid', reference: booking.reference });
    }

    // Reuse the order if one was already opened for this booking.
    if (booking.orderId) {
      let existing = null;
      try {
        existing = await fetchOrder(booking.orderId);
      } catch (err) {
        console.error('[create-order] Razorpay lookup failed:', describeError(err));
        return res.status(statusForError(err)).json({ error: 'Could not create payment order' });
      }

      if (existing) {
        // The order was paid but our callback never landed — self-heal instead
        // of charging again. (A webhook covers the rest of this gap; see
        // server/README.md.)
        if (existing.status === 'paid') {
          await markPaid(booking.id, { paymentId: null, source: 'order-reconciliation' });
          return res.status(409).json({
            error: 'This booking was already paid',
            reference: booking.reference,
            paymentStatus: 'paid',
          });
        }

        return res.json({
          bookingId: booking.id,
          reference: booking.reference,
          orderId: existing.id,
          amountPaise: existing.amount,
          currency: existing.currency,
          keyId: getKeyId(),
          reused: true,
        });
      }
      // Order vanished on Razorpay's side — fall through and make a new one.
    }

    let order;
    try {
      order = await createOrder({
        amountPaise: booking.amountPaise,
        receipt: booking.reference,
        notes: { bookingId: booking.id, itemName: booking.itemName || '' },
      });
    } catch (err) {
      console.error('[create-order] Razorpay error:', describeError(err));
      return res.status(statusForError(err)).json({ error: 'Could not create payment order' });
    }

    await attachOrder(booking.id, order.id);

    res.json({
      bookingId: booking.id,
      reference: booking.reference,
      orderId: order.id,
      amountPaise: order.amount,
      currency: order.currency,
      keyId: getKeyId(),
    });
  }),
);

/**
 * Verifies the checkout callback signature and marks the booking paid.
 *
 * Three independent checks, all of which must pass:
 *   1. the order referenced belongs to this booking (blocks replaying a valid
 *      signature from a cheap order against an expensive booking)
 *   2. the signature is authentic (constant-time HMAC comparison)
 *   3. the booking is not already paid (idempotent)
 */
app.post(
  '/api/verify-payment',
  route(async (req, res) => {
    const {
      bookingId,
      razorpay_order_id: orderId,
      razorpay_payment_id: paymentId,
      razorpay_signature: signature,
    } = req.body ?? {};

    const missing = [];
    if (!bookingId) missing.push('bookingId');
    if (!orderId) missing.push('razorpay_order_id');
    if (!paymentId) missing.push('razorpay_payment_id');
    if (!signature) missing.push('razorpay_signature');
    if (missing.length) {
      return res.status(400).json({ error: 'Missing fields', details: missing });
    }

    const booking = await getBooking(bookingId);
    if (!booking) return res.status(404).json({ error: 'Booking not found' });

    if (booking.paymentStatus === 'paid') {
      return res.json({
        verified: true,
        alreadyPaid: true,
        paymentStatus: 'paid',
        reference: booking.reference,
      });
    }

    // The signature proves *an* order was paid. It does not prove it was THIS
    // booking's order — so bind the two together explicitly.
    if (!booking.orderId || booking.orderId !== orderId) {
      console.warn('[verify-payment] order/booking mismatch', {
        bookingId: booking.id,
        expected: booking.orderId,
        received: orderId,
      });
      return res.status(400).json({ error: 'Order does not belong to this booking' });
    }

    if (!verifySignature({ orderId, paymentId, signature })) {
      // Do NOT mark paid. This is the one branch that must never be optimistic.
      console.warn('[verify-payment] signature mismatch', { bookingId: booking.id, orderId });
      return res.status(400).json({ error: 'Payment signature verification failed' });
    }

    const updated = await markPaid(booking.id, { paymentId });

    res.json({
      verified: true,
      paymentStatus: updated.paymentStatus,
      reference: updated.reference,
    });
  }),
);

app.use('/api', (req, res) => res.status(404).json({ error: 'Unknown API route' }));

// ---------------------------------------------------------------------------
// Static build + SPA fallback
// ---------------------------------------------------------------------------

app.use(express.static(DIST_DIR, { index: false }));

app.use(
  route(async (req, res, next) => {
    if (req.method !== 'GET' && req.method !== 'HEAD') return next();

    const indexFile = path.join(DIST_DIR, 'index.html');
    try {
      await fs.access(indexFile);
    } catch {
      if (req.path === '/') {
        return res
          .status(503)
          .type('text/plain')
          .send(
            'No production build found.\n\n' +
              'Run `npm run build` first, then `npm start`.\n' +
              'For development, use `npm run dev` (Vite on :5174 proxies /api here).\n',
          );
      }
      return next();
    }

    res.sendFile(indexFile);
  }),
);

// eslint-disable-next-line no-unused-vars -- Express identifies error handlers by arity
app.use((err, req, res, next) => {
  console.error('[unhandled]', err);
  res.status(500).json({ error: 'Internal server error' });
});

// ---------------------------------------------------------------------------
// Start
// ---------------------------------------------------------------------------

app.listen(PORT, () => {
  const configured = razorpayConfigured();
  console.log(`\n  Battleship API  →  http://localhost:${PORT}`);
  console.log(`  Razorpay        →  ${configured ? `configured (${getKeyId()})` : 'NOT CONFIGURED'}`);
  if (!configured) {
    console.warn('  ⚠  Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in .env — /api/create-order will 401 until then.');
  }
  console.log('');
});
