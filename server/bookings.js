/**
 * Booking store — a JSON file the server owns.
 *
 * Deliberately simple: the project has no database and the spec rules out
 * creating tables. A single JSON file is the right size for a venue taking
 * dozens of bookings a day.
 *
 * LIMITATION: the write queue below is process-local. It serialises concurrent
 * requests inside one Node process, which is what we have. It is NOT safe across
 * multiple processes or machines — migrate to a real database before running
 * more than one instance.
 */

import { promises as fs } from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'bookings.json');

/**
 * All writes funnel through this chain so two concurrent requests can never
 * interleave a read-modify-write and lose a booking.
 */
let queue = Promise.resolve();

function serialize(task) {
  const result = queue.then(task, task);
  // Swallow rejections on the chain itself so one failure doesn't poison the
  // queue; the caller still sees the real rejection via `result`.
  queue = result.then(
    () => undefined,
    () => undefined,
  );
  return result;
}

async function readAll() {
  try {
    const raw = await fs.readFile(DATA_FILE, 'utf8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    if (err.code === 'ENOENT') return [];
    throw err;
  }
}

async function writeAll(bookings) {
  await fs.mkdir(DATA_DIR, { recursive: true });
  const tmp = `${DATA_FILE}.${process.pid}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(bookings, null, 2), 'utf8');
  // rename is atomic within a volume, so a crash mid-write cannot truncate the
  // real file — we either have the old contents or the new ones.
  await fs.rename(tmp, DATA_FILE);
}

/** No I/L/O/0/1 — these get read aloud over a phone at a front desk. */
const REF_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

function makeReference() {
  const bytes = crypto.randomBytes(6);
  let out = '';
  for (const b of bytes) out += REF_ALPHABET[b % REF_ALPHABET.length];
  return `BS-${out}`;
}

/**
 * @param {object} draft  Already validated and priced by the caller.
 * @returns {Promise<object>} the stored booking, including id and reference.
 */
export function createBooking(draft) {
  return serialize(async () => {
    const bookings = await readAll();

    let reference = makeReference();
    while (bookings.some((b) => b.reference === reference)) {
      reference = makeReference();
    }

    const booking = {
      id: crypto.randomUUID(),
      reference,
      paymentStatus: 'unpaid',
      paidAt: null,
      orderId: null,
      paymentId: null,
      createdAt: new Date().toISOString(),
      ...draft,
    };

    bookings.push(booking);
    await writeAll(bookings);
    return booking;
  });
}

export function getBooking(id) {
  return serialize(async () => {
    if (!id) return null;
    const bookings = await readAll();
    return bookings.find((b) => b.id === id || b.reference === id) || null;
  });
}

/** Records the Razorpay order against the booking so verify can cross-check it. */
export function attachOrder(id, orderId) {
  return updateBooking(id, (b) => ({ ...b, orderId }));
}

/**
 * Flips a booking to paid. Idempotent — re-marking an already-paid booking is a no-op.
 *
 * `source` records *how* we learned it was paid, which matters for the
 * reconciliation path where there is no payment id to point at.
 */
export function markPaid(id, { paymentId = null, source = 'razorpay-checkout' } = {}) {
  return updateBooking(id, (b) => {
    if (b.paymentStatus === 'paid') return b;
    return {
      ...b,
      paymentStatus: 'paid',
      paymentId,
      paymentSource: source,
      paidAt: new Date().toISOString(),
    };
  });
}

function updateBooking(id, mutate) {
  return serialize(async () => {
    const bookings = await readAll();
    const index = bookings.findIndex((b) => b.id === id || b.reference === id);
    if (index === -1) return null;

    bookings[index] = mutate(bookings[index]);
    await writeAll(bookings);
    return bookings[index];
  });
}
