import { getBooking } from './_shared/bookings.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { id } = req.query;
  const booking = await getBooking(id);
  if (!booking) return res.status(404).json({ error: 'Booking not found' });

  const { guestPhone, ...safe } = booking;
  res.json(safe);
}
