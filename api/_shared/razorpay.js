/**
 * Razorpay helpers — shared across all serverless API routes.
 */

import crypto from 'node:crypto';
import RazorpayModule from 'razorpay';

const Razorpay = RazorpayModule?.default ?? RazorpayModule;

let _client = null;

export function razorpayConfigured() {
  return Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET);
}

export function assertConfigured() {
  if (!razorpayConfigured()) {
    throw new Error('Razorpay is not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in Vercel environment variables.');
  }
}

function getClient() {
  assertConfigured();
  if (!_client) {
    _client = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
  }
  return _client;
}

export function getKeyId() {
  return process.env.RAZORPAY_KEY_ID || null;
}

export async function createOrder({ amountPaise, receipt, notes }) {
  return getClient().orders.create({ amount: amountPaise, currency: 'INR', receipt, notes });
}

export function verifySignature({ orderId, paymentId, signature }) {
  if (!orderId || !paymentId || !signature) return false;
  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!secret) return false;
  const expected = crypto.createHmac('sha256', secret).update(`${orderId}|${paymentId}`).digest('hex');
  const a = Buffer.from(expected, 'utf8');
  const b = Buffer.from(String(signature), 'utf8');
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

export function describeError(err) {
  return err?.error?.description || err?.description || err?.message || 'Unknown Razorpay error';
}
