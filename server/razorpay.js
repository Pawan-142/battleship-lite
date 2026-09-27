/**
 * Razorpay integration surface.
 *
 * The key secret is read from the environment and stays here — it is never
 * returned to the client and never prefixed with `VITE_`, so Vite cannot inline
 * it into the browser bundle.
 */

import crypto from 'node:crypto';
import RazorpayModule from 'razorpay';

// The SDK is CommonJS; tolerate either export shape.
const Razorpay = RazorpayModule?.default ?? RazorpayModule;

let client = null;

export function razorpayConfigured() {
  return Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET);
}

/** Throws rather than returning a half-configured client. */
export function assertConfigured() {
  if (!razorpayConfigured()) {
    throw new Error(
      'Razorpay is not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in .env',
    );
  }
}

function getClient() {
  assertConfigured();
  if (!client) {
    client = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
  }
  return client;
}

export function getKeyId() {
  return process.env.RAZORPAY_KEY_ID || null;
}

/**
 * Creates a Razorpay order.
 * `amountPaise` must already be the server-computed authoritative amount —
 * never a value that arrived from the browser.
 */
export async function createOrder({ amountPaise, receipt, notes }) {
  return getClient().orders.create({
    amount: amountPaise,
    currency: 'INR',
    receipt,
    notes,
  });
}

/**
 * Fetches an existing order, so a retry can reuse it instead of creating a
 * second one against the same booking. Returns null if it no longer exists.
 */
export async function fetchOrder(orderId) {
  try {
    return await getClient().orders.fetch(orderId);
  } catch (err) {
    if (err?.statusCode === 404) return null;
    throw err;
  }
}

/**
 * Verifies the checkout callback signature.
 *
 * HMAC-SHA256 over "<order_id>|<payment_id>" keyed by the secret. Compared in
 * constant time — a plain === leaks timing information about how many leading
 * characters matched, which is enough to forge a signature byte by byte.
 */
export function verifySignature({ orderId, paymentId, signature }) {
  if (!orderId || !paymentId || !signature) return false;

  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!secret) return false;

  const expected = crypto
    .createHmac('sha256', secret)
    .update(`${orderId}|${paymentId}`)
    .digest('hex');

  const expectedBuf = Buffer.from(expected, 'utf8');
  const givenBuf = Buffer.from(String(signature), 'utf8');

  // timingSafeEqual throws on length mismatch, so guard first. The lengths
  // themselves are not secret — they are always 64 hex chars when well-formed.
  if (expectedBuf.length !== givenBuf.length) return false;

  return crypto.timingSafeEqual(expectedBuf, givenBuf);
}

/**
 * Maps a thrown Razorpay SDK error to an HTTP status.
 * Auth problems are the operator's fault (bad/rotated key) and must not be
 * reported to the customer as a bad request.
 */
export function statusForError(err) {
  const status = err?.statusCode ?? err?.status;
  if (status === 401 || status === 403) return 401;
  return 500;
}

/** Safe-to-log description. Never includes the secret. */
export function describeError(err) {
  const description =
    err?.error?.description || err?.description || err?.message || 'Unknown Razorpay error';
  return description;
}
