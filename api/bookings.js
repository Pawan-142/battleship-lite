import { validateBookingRequest } from '../server/catalog.js';
import { createBooking } from './_shared/bookings.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { errors, value } = validateBookingRequest(req.body);
  if (errors.length) {
    return res.status(400).json({ error: 'Validation failed', details: errors });
  }

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
}
