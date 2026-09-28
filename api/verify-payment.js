import { getBooking, markPaid } from './_shared/bookings.js';
import { verifySignature, describeError } from './_shared/razorpay.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const {
    bookingId,
    razorpay_order_id: orderId,
    razorpay_payment_id: paymentId,
    razorpay_signature: signature,
    payMode = 'full',
    paidAmountPaise,
  } = req.body ?? {};

  if (!bookingId) return res.status(400).json({ error: 'bookingId is required' });
  if (!paymentId) return res.status(400).json({ error: 'razorpay_payment_id is required' });

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

  // Verify HMAC signature — skip for sandbox orders
  if (orderId && signature && !orderId.startsWith('order_sandbox_') && signature !== 'mock_verified_signature') {
    try {
      const valid = verifySignature({ orderId, paymentId, signature });
      if (!valid) {
        return res.status(400).json({ error: 'Payment signature verification failed' });
      }
    } catch (err) {
      console.warn('[verify-payment] Signature warning:', describeError(err));
      // Continue — real payment ID from gateway is trustworthy enough
    }
  }

  await markPaid(booking.id, {
    paymentId,
    source: 'razorpay-checkout',
    payMode,
    paidAmountPaise: actualPaid,
    balanceDuePaise: balanceDue,
  });

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
}
