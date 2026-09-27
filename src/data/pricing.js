/**
 * Pricing authority — shared by the browser UI and the Express server.
 *
 * This module is imported by BOTH `src/components/*` (to preview a price) and
 * `server/*` (to charge it). Keeping one implementation is the point: the number
 * shown in the UI is computed by the same code that computes the number sent to
 * Razorpay, so they cannot drift apart.
 *
 * Pure functions only. No React, no Node APIs, no I/O.
 */

import { GAMES } from './games.js';
import { PASSES } from './passes.js';

/** Synthetic id for the user-composed squad bundle. Not a row in GAMES or PASSES. */
export const CUSTOM_PASS_ID = 'custom-pass';

export const CURRENCY = 'INR';

/** Razorpay rejects orders below this. */
export const MIN_AMOUNT_PAISE = 100;

/**
 * Custom squad bundle discounts, keyed by how many games are selected.
 * Highest matching tier wins. A single game gets no discount.
 */
export const DISCOUNT_TIERS = [
  { minGames: 4, rate: 0.25 },
  { minGames: 3, rate: 0.20 },
  { minGames: 2, rate: 0.15 },
];

export function discountRateFor(gameCount) {
  const tier = DISCOUNT_TIERS.find((t) => gameCount >= t.minGames);
  return tier ? tier.rate : 0;
}

export function findGame(id) {
  return GAMES.find((g) => g.id === id) || null;
}

export function findPass(id) {
  return PASSES.find((p) => p.id === id) || null;
}

/**
 * Look up a bookable item.
 * Returns null for the custom pass (computed, not stored) and for unknown ids.
 */
export function resolveItem(itemId) {
  if (!itemId || itemId === CUSTOM_PASS_ID) return null;

  const game = findGame(itemId);
  if (game) return { ...game, kind: 'game' };

  const pass = findPass(itemId);
  if (pass) return { ...pass, kind: 'pass' };

  return null;
}

/**
 * Per-person price of a custom bundle, after the volume discount.
 * Unknown game ids are ignored rather than throwing, so a stale id in a saved
 * form degrades to a lower price instead of a 500.
 */
export function customPassPerPerson(selectedGameIds = []) {
  const games = selectedGameIds.map(findGame).filter(Boolean);
  const base = games.reduce((sum, g) => sum + g.price, 0);
  const rate = discountRateFor(games.length);
  return {
    perPerson: Math.round(base * (1 - rate)),
    base,
    rate,
    gameCount: games.length,
  };
}

/**
 * Authoritative booking total, in whole rupees.
 * Returns null if the item cannot be priced.
 *
 * `pricingUnit` decides whether the player count multiplies:
 *   'person' → price × players   (single arenas, custom bundle)
 *   'pass'   → price             (a pass admits the whole squad; players is
 *                                 descriptive, not a multiplier)
 */
export function computeAmountRupees({ itemId, players = 1, selectedGameIds = [] }) {
  if (itemId === CUSTOM_PASS_ID) {
    const { perPerson } = customPassPerPerson(selectedGameIds);
    if (perPerson <= 0) return null;
    return perPerson * players;
  }

  const item = resolveItem(itemId);
  if (!item) return null;

  return item.pricingUnit === 'pass' ? item.price : item.price * players;
}

export function toPaise(rupees) {
  return Math.round(rupees * 100);
}

/**
 * The single entry point both sides call.
 * Returns null when the item is unpriceable, or when the total falls below
 * Razorpay's floor — the caller decides how to report that.
 */
export function computeAmountPaise(input) {
  const rupees = computeAmountRupees(input);
  if (rupees == null) return null;
  const paise = toPaise(rupees);
  return paise < MIN_AMOUNT_PAISE ? null : paise;
}

/** Human-readable name for a booking confirmation. */
export function describeItem({ itemId, selectedGameIds = [] }) {
  if (itemId === CUSTOM_PASS_ID) {
    const { gameCount } = customPassPerPerson(selectedGameIds);
    return `Custom ${gameCount}-Game Squad Pass`;
  }
  const item = resolveItem(itemId);
  return item ? item.title || item.name : null;
}
