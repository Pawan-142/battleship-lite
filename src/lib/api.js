/**
 * Client for the booking API, plus a lazy loader for Razorpay Checkout.
 *
 * Note there is no `amount` field anywhere in this file. The server owns
 * pricing; the browser only ever names what it wants to book.
 */

const CHECKOUT_SRC = 'https://checkout.razorpay.com/v1/checkout.js';

async function post(path, body) {
  let res;
  try {
    res = await fetch(path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body ?? {}),
    });
  } catch {
    // Network-level failure — server down, offline, DNS.
    const err = new Error('Could not reach the booking server. Please try again.');
    err.code = 'NETWORK';
    throw err;
  }

  let data = null;
  try {
    data = await res.json();
  } catch {
    // Non-JSON response (a proxy error page, for instance).
  }

  if (!res.ok) {
    const err = new Error(data?.error || `Request failed (${res.status})`);
    err.status = res.status;
    err.details = data?.details;
    err.body = data; // some failures carry useful state (e.g. already-paid)
    throw err;
  }
  return data;
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

/**
 * Loads checkout.js on first use and resolves with window.Razorpay.
 *
 * Deliberately not a <script> tag in index.html: that would add a third-party
 * request to every page view for a button most visitors never click.
 */
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
      // Reset so a later retry can attempt the load again.
      checkoutPromise = null;
      reject(new Error('Could not load Razorpay checkout. Check your connection.'));
    };

    if (!existing) document.head.appendChild(script);
  });

  return checkoutPromise;
}

/**
 * Opens the Razorpay modal and resolves with the success payload
 * ({ razorpay_order_id, razorpay_payment_id, razorpay_signature }).
 *
 * Rejects with `err.code === 'DISMISSED'` if the user closes the modal, or
 * `'FAILED'` if the payment itself fails — the caller distinguishes these to
 * give an accurate message.
 */
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
    const rzp = new Razorpay({
      key: keyId,
      order_id: orderId,
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
    });

    rzp.on('payment.failed', (response) => {
      const err = new Error(response?.error?.description || 'Payment failed.');
      err.code = 'FAILED';
      err.detail = response?.error;
      reject(err);
    });

    rzp.open();
  });
}
