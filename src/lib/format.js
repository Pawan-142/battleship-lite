/** Small formatting helpers shared by the booking UI. */

const IST_OFFSET_MS = (5 * 60 + 30) * 60 * 1000;

/**
 * Today's date in IST as YYYY-MM-DD, for pre-filling date inputs.
 *
 * `new Date().toISOString()` is UTC — before 5:30am IST that yields *yesterday*,
 * which would pre-fill a past date and fail server validation.
 */
export function todayIST() {
  return new Date(Date.now() + IST_OFFSET_MS).toISOString().slice(0, 10);
}

/** Paise → "₹1,399". Returns '' for a missing value so callers can render nothing. */
export function formatINR(paise) {
  if (paise == null || Number.isNaN(paise)) return '';
  return `₹${Math.round(paise / 100).toLocaleString('en-IN')}`;
}

/** "18:00" → "06:00 PM" */
export function formatSlot(slot) {
  if (!slot || !/^\d{2}:\d{2}$/.test(slot)) return slot || '';
  const [h, m] = slot.split(':').map(Number);
  const suffix = h >= 12 ? 'PM' : 'AM';
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${String(hour12).padStart(2, '0')}:${String(m).padStart(2, '0')} ${suffix}`;
}
