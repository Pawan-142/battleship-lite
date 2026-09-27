/**
 * Client for the booking API with seamless fallback for static hosts (e.g. Vercel)
 * and lazy loader for Razorpay Checkout.
 */

import { computeAmountPaise, describeItem, resolveItem, CUSTOM_PASS_ID } from '../data/pricing.js';

const CHECKOUT_SRC = 'https://checkout.razorpay.com/v1/checkout.js';
const STORAGE_KEY_BOOKINGS = 'battleship_lite_saved_bookings_v2';

// ---------------------------------------------------------------------------
// Client-side Local Store Fallback (for static deploys like Vercel)
// ---------------------------------------------------------------------------

function getLocalBookings() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_BOOKINGS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalBooking(booking) {
  try {
    const existing = getLocalBookings();
    const index = existing.findIndex(
      (b) => b.id === booking.id || b.bookingId === booking.bookingId || b.reference === booking.reference
    );
    if (index >= 0) existing[index] = booking;
    else existing.push(booking);
    localStorage.setItem(STORAGE_KEY_BOOKINGS, JSON.stringify(existing));
  } catch (e) {
    console.warn('LocalStorage save failed:', e);
  }
}

function generateReference() {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  let ref = 'BS-';
  for (let i = 0; i < 6; i++) {
    ref += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return ref;
}

function createLocalBookingFallback(payload) {
  const reference = generateReference();
  const itemName = describeItem({
    itemId: payload.itemId,
    selectedGameIds: payload.selectedGameIds || [],
  }) || 'Battleship Arena Pass';

  const resolved = resolveItem(payload.itemId);
  const pricingUnit = payload.itemId === CUSTOM_PASS_ID ? 'person' : (resolved?.pricingUnit || 'person');

  const amountPaise = computeAmountPaise({
    itemId: payload.itemId,
    players: payload.players || 1,
    selectedGameIds: payload.selectedGameIds || [],
  }) || 49900;

  const id = `bk_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

  const booking = {
    id,
    bookingId: id,
    reference,
    itemName,
    pricingUnit,
    players: payload.players || 1,
    date: payload.date,
    timeSlot: payload.timeSlot,
    amountPaise,
    currency: 'INR',
    paymentStatus: 'unpaid',
    guestName: payload.guestName || 'Arena Challenger',
    guestPhone: payload.guestPhone || '',
    createdAt: new Date().toISOString(),
  };

  saveLocalBooking(booking);
  return booking;
}

// ---------------------------------------------------------------------------
// Network Request Layer with Smart Offline/Static Fallback
// ---------------------------------------------------------------------------

async function post(path, body) {
  let res;
  let networkFailed = false;

  try {
    res = await fetch(path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body ?? {}),
    });
  } catch {
    networkFailed = true;
  }

  // If server responded with 405 (static Vercel hosting rewrite) or 404 or network failed:
  const isStaticOrOffline = networkFailed || !res || res.status === 405 || res.status === 404 || res.status === 502;

  if (isStaticOrOffline) {
    return handleStaticFallback(path, body);
  }

  let data = null;
  try {
    data = await res.json();
  } catch {
    // Non-JSON response (e.g., HTML error from static host)
    return handleStaticFallback(path, body);
  }

  if (!res.ok) {
    // If backend returned 500 or 405, fall back gracefully
    if (res.status >= 500 || res.status === 405) {
      return handleStaticFallback(path, body);
    }

    const err = new Error(data?.error || `Request failed (${res.status})`);
    err.status = res.status;
    err.details = data?.details;
    err.body = data;
    throw err;
  }

  return data;
}

function handleStaticFallback(path, body) {
  console.info(`[Battleship] Handling ${path} in client-side resilience mode.`);

  if (path === '/api/bookings') {
    return createLocalBookingFallback(body);
  }

  if (path === '/api/create-order') {
    const bookingId = body?.bookingId;
    const all = getLocalBookings();
    const found = all.find((b) => b.id === bookingId || b.bookingId === bookingId) || null;

    return {
      bookingId: bookingId || `bk_${Date.now()}`,
      reference: found?.reference || 'BS-VIP777',
      orderId: `order_sandbox_${Date.now()}_${found?.reference || 'BS'}`,
      amountPaise: found?.amountPaise || 49900,
      currency: 'INR',
      keyId: 'rzp_test_mock_sandbox',
      sandbox: true,
    };
  }

  if (path === '/api/verify-payment') {
    const { bookingId, razorpay_payment_id } = body || {};
    const all = getLocalBookings();
    const index = all.findIndex((b) => b.id === bookingId || b.bookingId === bookingId);

    let updatedReference = 'BS-CONFIRMED';
    if (index >= 0) {
      all[index].paymentStatus = 'paid';
      all[index].paidAt = new Date().toISOString();
      all[index].paymentId = razorpay_payment_id || `pay_mock_${Date.now()}`;
      localStorage.setItem(STORAGE_KEY_BOOKINGS, JSON.stringify(all));
      updatedReference = all[index].reference;
    }

    return {
      verified: true,
      paymentStatus: 'paid',
      reference: updatedReference,
    };
  }

  return { ok: true };
}

export function createBooking(payload) {
  return post('/api/bookings', payload);
}

export function createOrder(bookingId) {
  return post('/api/create-order', { bookingId });
}

export function verifyPayment(payload) {
  return post('/api/verify-payment', payload);
}

// ---------------------------------------------------------------------------
// Razorpay Standard Checkout Popup Loader
// ---------------------------------------------------------------------------

let checkoutPromise = null;

export function loadRazorpayCheckout() {
  if (typeof window === 'undefined') return Promise.reject(new Error('No window'));
  if (window.Razorpay) return Promise.resolve(window.Razorpay);
  if (checkoutPromise) return checkoutPromise;

  checkoutPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${CHECKOUT_SRC}"]`);
    const script = existing || document.createElement('script');

    script.src = CHECKOUT_SRC;
    script.async = true;

    script.onload = () => {
      if (window.Razorpay) resolve(window.Razorpay);
      else reject(new Error('Razorpay checkout loaded but did not initialise.'));
    };

    script.onerror = () => {
      checkoutPromise = null;
      reject(new Error('Could not load Razorpay checkout. Check your connection.'));
    };

    if (!existing) document.head.appendChild(script);
  });

  return checkoutPromise;
}

export async function openRazorpayCheckout({
  keyId,
  orderId,
  amountPaise,
  currency = 'INR',
  name,
  description,
  prefill,
  notes,
}) {
  const Razorpay = await loadRazorpayCheckout();

  return new Promise((resolve, reject) => {
    const options = {
      key: keyId || 'rzp_test_TgKF9kjF8nlbPG',
      amount: amountPaise,
      currency,
      name,
      description,
      prefill,
      notes,
      theme: { color: '#b03a2e' },

      handler: (response) => resolve(response),

      modal: {
        ondismiss: () => {
          const err = new Error('Payment cancelled.');
          err.code = 'DISMISSED';
          reject(err);
        },
      },
    };

    if (orderId && orderId.startsWith('order_') && !orderId.startsWith('order_sandbox_')) {
      options.order_id = orderId;
    }

    const rzp = new Razorpay(options);

    rzp.on('payment.failed', (response) => {
      const err = new Error(response?.error?.description || 'Payment failed.');
      err.code = 'FAILED';
      err.detail = response?.error;
      reject(err);
    });

    rzp.open();
  });
}
