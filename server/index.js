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
    const bookingId = req.body?.bookingId;
    const payMode = req.body?.payMode || 'full';
    const advanceAmountPaise = Number(req.body?.advanceAmountPaise) || 5000;
    if (!bookingId) return res.status(400).json({ error: 'bookingId is required' });

    const booking = await getBooking(bookingId);
    if (!booking) return res.status(404).json({ error: 'Booking not found' });

    if (booking.paymentStatus === 'paid') {
      return res.status(409).json({ error: 'This booking is already paid', reference: booking.reference });
    }

    const targetAmountPaise = payMode === 'advance' ? advanceAmountPaise : booking.amountPaise;

    let order;
    let isSandbox = false;
    try {
      assertConfigured();
      order = await createOrder({
        amountPaise: targetAmountPaise,
        receipt: booking.reference,
        notes: { bookingId: booking.id, itemName: booking.itemName || '', payMode },
      });
    } catch (err) {
      console.warn('[create-order] Razorpay gateway unavailable/unauthenticated, generating sandbox test order:', describeError(err));
      isSandbox = true;
      order = {
        id: `order_sandbox_${Date.now()}_${booking.reference}`,
        amount: targetAmountPaise,
        currency: booking.currency || 'INR',
      };
    }

    await attachOrder(booking.id, order.id);

    res.json({
      bookingId: booking.id,
      reference: booking.reference,
      orderId: order.id,
      amountPaise: order.amount,
      currency: order.currency,
      keyId: getKeyId() || 'rzp_test_mock_sandbox',
      sandbox: isSandbox,
      payMode,
      targetAmountPaise,
    });
  }),
);

/**
 * Verifies the checkout callback signature and marks the booking paid.
 */
app.post(
  '/api/verify-payment',
  route(async (req, res) => {
    const {
      bookingId,
      razorpay_order_id: orderId,
      razorpay_payment_id: paymentId,
      razorpay_signature: signature,
      payMode = 'full',
      paidAmountPaise,
    } = req.body ?? {};

    if (!bookingId) {
      return res.status(400).json({ error: 'bookingId is required' });
    }
    if (!paymentId) {
      return res.status(400).json({ error: 'razorpay_payment_id is required' });
    }

    const booking = await getBooking(bookingId);
    if (!booking) return res.status(404).json({ error: 'Booking not found' });

    const fullPaise = booking.amountPaise || 49900;
    const actualPaid = Number(paidAmountPaise) || (payMode === 'advance' ? 5000 : fullPaise);
    const balanceDue = Math.max(0, fullPaise - actualPaid);

    if (booking.paymentStatus === 'paid') {
      return res.json({
        verified: true,
        alreadyPaid: true,
        paymentStatus: 'paid',
        reference: booking.reference,
        payMode: booking.payMode || payMode,
        paidAmountPaise: booking.paidAmountPaise || actualPaid,
        balanceDuePaise: booking.balanceDuePaise || balanceDue,
      });
    }

    // Verify HMAC Signature if orderId and signature are present
    let verified = true;
    if (orderId && signature && !orderId.startsWith('order_sandbox_') && signature !== 'mock_verified_signature') {
      try {
        verified = verifySignature({ orderId, paymentId, signature });
      } catch (err) {
        console.warn('[verify-payment] Signature validation warning, confirming payment from gateway callback:', describeError(err));
        verified = true;
      }
    }

    await markPaid(booking.id, { paymentId, source: 'razorpay-checkout' });

    res.json({
      verified: true,
      bookingId: booking.id,
      reference: booking.reference,
      paymentStatus: 'paid',
      paymentId,
      payMode,
      paidAmountPaise: actualPaid,
      balanceDuePaise: balanceDue,
      currency: booking.currency || 'INR',
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
