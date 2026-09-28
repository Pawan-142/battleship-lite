/**
 * Booking store for Vercel serverless.
 *
 * Uses Upstash Redis (UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN env vars).
 * Falls back to in-process Map if Redis is not configured (useful for local dev/preview).
 *
 * Set these in Vercel Project Settings → Environment Variables:
 *   UPSTASH_REDIS_REST_URL   https://xxx.upstash.io
 *   UPSTASH_REDIS_REST_TOKEN AXxx...
 */

import crypto from 'node:crypto';

const REF_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
function makeReference() {
  const bytes = crypto.randomBytes(6);
  let out = '';
  for (const b of bytes) out += REF_ALPHABET[b % REF_ALPHABET.length];
  return `BS-${out}`;
}

// --------------------------------------------------------------------------
// Redis helpers (Upstash HTTP REST API — no extra npm package needed)
// --------------------------------------------------------------------------

async function redisGet(key) {
  const { UPSTASH_REDIS_REST_URL: url, UPSTASH_REDIS_REST_TOKEN: token } = process.env;
  if (!url || !token) return null;
  const res = await fetch(`${url}/get/${encodeURIComponent(key)}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const json = await res.json();
  if (json.result == null) return null;
  return JSON.parse(json.result);
}

async function redisSet(key, value) {
  const { UPSTASH_REDIS_REST_URL: url, UPSTASH_REDIS_REST_TOKEN: token } = process.env;
  if (!url || !token) return;
  await fetch(`${url}/set/${encodeURIComponent(key)}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(JSON.stringify(value)),
  });
}

// In-memory fallback (single warm instance, fine for demo/dev)
const _mem = new Map();

async function dbGet(id) {
  const fromRedis = await redisGet(`booking:${id}`);
  if (fromRedis) return fromRedis;
  return _mem.get(id) || null;
}

async function dbSet(booking) {
  await redisSet(`booking:${booking.id}`, booking);
  _mem.set(booking.id, booking);
}

// --------------------------------------------------------------------------
// Public API
// --------------------------------------------------------------------------

export async function createBooking(draft) {
  const booking = {
    id: crypto.randomUUID(),
    reference: makeReference(),
    paymentStatus: 'unpaid',
    paidAt: null,
    orderId: null,
    paymentId: null,
    createdAt: new Date().toISOString(),
    ...draft,
  };
  await dbSet(booking);
  return booking;
}

export async function getBooking(id) {
  if (!id) return null;
  return dbGet(id);
}

export async function attachOrder(id, orderId) {
  const booking = await dbGet(id);
  if (!booking) return null;
  const updated = { ...booking, orderId };
  await dbSet(updated);
  return updated;
}

export async function markPaid(id, { paymentId = null, source = 'razorpay-checkout', payMode = 'full', paidAmountPaise, balanceDuePaise } = {}) {
  const booking = await dbGet(id);
  if (!booking) return null;
  if (booking.paymentStatus === 'paid') return booking;
  const updated = {
    ...booking,
    paymentStatus: 'paid',
    paymentId,
    paymentSource: source,
    payMode,
    paidAmountPaise,
    balanceDuePaise,
    paidAt: new Date().toISOString(),
  };
  await dbSet(updated);
  return updated;
}
