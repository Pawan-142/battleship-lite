import { getBooking, attachOrder } from './_shared/bookings.js';
import { assertConfigured, createOrder, getKeyId, describeError, razorpayConfigured } from './_shared/razorpay.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

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
    console.warn('[create-order] Razorpay unavailable, using sandbox:', describeError(err));
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
}
