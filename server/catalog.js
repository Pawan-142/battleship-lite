/**
 * Validates an incoming booking request and prices it from the catalog.
 *
 * This is the trust boundary. Everything the browser sends is treated as a
 * claim to be checked, not a fact — in particular the price, which is computed
 * here from `src/data/` and never accepted from the request body.
 */

import {
  CURRENCY,
  CUSTOM_PASS_ID,
  MIN_AMOUNT_PAISE,
  computeAmountPaise,
  describeItem,
  resolveItem,
} from '../src/data/pricing.js';

export { CURRENCY, CUSTOM_PASS_ID, MIN_AMOUNT_PAISE };

/** Must match the <option> values rendered in the booking UI. */
export const ALLOWED_SLOTS = ['12:00', '15:00', '18:00', '20:00', '21:30'];

const MAX_PLAYERS = 50;
const MAX_NAME_LENGTH = 80;
const MAX_GAMES_PER_BUNDLE = 6;

/**
 * Today's date in IST, as YYYY-MM-DD.
 * The server may run in any timezone; the venue does not. Without this, a
 * booking made at 2am IST would validate against the previous UTC day.
 */
export function todayIST() {
  const IST_OFFSET_MS = (5 * 60 + 30) * 60 * 1000;
  return new Date(Date.now() + IST_OFFSET_MS).toISOString().slice(0, 10);
}

/** Indian mobile: 10 digits starting 6-9, tolerating +91 / 0 prefixes. */
export function normalizePhone(raw) {
  const digits = String(raw ?? '').replace(/\D/g, '');
  const local = digits.length > 10 ? digits.slice(-10) : digits;
  return /^[6-9]\d{9}$/.test(local) ? local : null;
}

function isPlainDate(value) {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

/**
 * @returns {{ errors: string[], value: object|null }}
 */
export function validateBookingRequest(body) {
  const errors = [];
  const src = body ?? {};

  const itemId = typeof src.itemId === 'string' ? src.itemId.trim() : '';
  if (!itemId) {
    errors.push('itemId is required');
  } else if (itemId !== CUSTOM_PASS_ID && !resolveItem(itemId)) {
    errors.push(`Unknown itemId: ${itemId}`);
  }

  const players = Number(src.players);
  if (!Number.isInteger(players) || players < 1 || players > MAX_PLAYERS) {
    errors.push(`players must be a whole number between 1 and ${MAX_PLAYERS}`);
  }

  const selectedGameIds = Array.isArray(src.selectedGameIds)
    ? src.selectedGameIds.filter((id) => typeof id === 'string')
    : [];

  if (itemId === CUSTOM_PASS_ID) {
    if (selectedGameIds.length === 0) {
      errors.push('selectedGameIds is required for a custom pass');
    } else if (selectedGameIds.length > MAX_GAMES_PER_BUNDLE) {
      errors.push(`A custom pass can include at most ${MAX_GAMES_PER_BUNDLE} games`);
    } else {
      const unknown = selectedGameIds.filter((id) => !resolveItem(id));
      if (unknown.length) errors.push(`Unknown games in bundle: ${unknown.join(', ')}`);
    }
  }

  const date = typeof src.date === 'string' ? src.date.trim() : '';
  if (!isPlainDate(date)) {
    errors.push('date must be in YYYY-MM-DD format');
  } else if (date < todayIST()) {
    errors.push('date cannot be in the past');
  }

  const timeSlot = typeof src.timeSlot === 'string' ? src.timeSlot.trim() : '';
  if (!ALLOWED_SLOTS.includes(timeSlot)) {
    errors.push(`timeSlot must be one of: ${ALLOWED_SLOTS.join(', ')}`);
  }

  const guestName = typeof src.guestName === 'string' ? src.guestName.trim() : '';
  if (!guestName) {
    errors.push('guestName is required');
  } else if (guestName.length > MAX_NAME_LENGTH) {
    errors.push(`guestName must be ${MAX_NAME_LENGTH} characters or fewer`);
  }

  const guestPhone = normalizePhone(src.guestPhone);
  if (!guestPhone) {
    errors.push('guestPhone must be a valid 10-digit Indian mobile number');
  }

  if (errors.length) return { errors, value: null };

  // Price is derived here, from the catalog — not read from the request.
  const amountPaise = computeAmountPaise({ itemId, players, selectedGameIds });
  if (amountPaise == null) {
    return { errors: ['Could not price this selection'], value: null };
  }
  if (amountPaise < MIN_AMOUNT_PAISE) {
    return { errors: [`Order total is below the ₹${MIN_AMOUNT_PAISE / 100} minimum`], value: null };
  }

  const item = resolveItem(itemId);

  return {
    errors: [],
    value: {
      itemId,
      itemName: describeItem({ itemId, selectedGameIds }),
      pricingUnit: item?.pricingUnit ?? 'person',
      players,
      selectedGameIds: itemId === CUSTOM_PASS_ID ? selectedGameIds : [],
      date,
      timeSlot,
      guestName,
      guestPhone,
      amountPaise,
      currency: CURRENCY,
      paymentMode: 'venue',
    },
  };
}
