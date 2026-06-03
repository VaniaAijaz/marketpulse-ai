/**
 * customerSegment.js
 * Pure, idempotent customer segmentation logic.
 *
 * Rules (priority order — highest wins):
 *  1. blocked   → admin/fraud only, NEVER overridden by system
 *  2. vip       → totalSpent >= VIP_SPEND_THRESHOLD OR totalOrders >= VIP_ORDER_THRESHOLD
 *  3. inactive  → lastOrderDate > INACTIVE_DAYS ago (and not vip/blocked)
 *  4. regular   → totalOrders 2–9 AND lastOrderDate within REGULAR_WINDOW_DAYS
 *  5. active    → lastOrderDate within ACTIVE_WINDOW_DAYS (1–14 days)
 *  6. new       → default / first purchase only
 */

const VIP_SPEND_THRESHOLD  = 5000;  // Rs. — tune per business
const VIP_ORDER_THRESHOLD  = 10;    // orders
const INACTIVE_DAYS        = 30;    // no purchase in 30 days → inactive
const ACTIVE_MAX_DAYS      = 14;    // last purchase within 14 days → active
const REGULAR_MIN_ORDERS   = 2;
const REGULAR_MAX_ORDERS   = 9;
const REGULAR_WINDOW_DAYS  = 30;    // must have ordered within 30 days to be regular

/**
 * Calculate the correct segment for a customer.
 * Idempotent — same inputs always produce same output.
 *
 * @param {object} params
 * @param {boolean} params.isBlocked
 * @param {number}  params.totalOrders
 * @param {number}  params.totalSpent
 * @param {Date|null} params.lastOrderDate  — null if never ordered
 * @returns {'blocked'|'vip'|'inactive'|'regular'|'active'|'new'}
 */
function calculateSegment({ isBlocked, totalOrders, totalSpent, lastOrderDate }) {
  // Rule 1 — blocked is sacred, never auto-changed
  if (isBlocked) return 'blocked';

  const now        = Date.now();
  const daysSince  = lastOrderDate
    ? (now - new Date(lastOrderDate).getTime()) / (1000 * 60 * 60 * 24)
    : Infinity;

  // Rule 2 — VIP overrides everything else when active
  const isVip = totalSpent >= VIP_SPEND_THRESHOLD || totalOrders >= VIP_ORDER_THRESHOLD;
  if (isVip && daysSince <= INACTIVE_DAYS) return 'vip';

  // Rule 3 — inactive (no purchase in INACTIVE_DAYS)
  if (daysSince > INACTIVE_DAYS) return 'inactive';

  // Rule 4 — regular (2–9 orders, ordered within REGULAR_WINDOW_DAYS)
  if (
    totalOrders >= REGULAR_MIN_ORDERS &&
    totalOrders <= REGULAR_MAX_ORDERS &&
    daysSince   <= REGULAR_WINDOW_DAYS
  ) return 'regular';

  // Rule 5 — active (recent purchase, 1–14 days)
  if (totalOrders >= 1 && daysSince <= ACTIVE_MAX_DAYS) return 'active';

  // Rule 6 — new (default)
  return 'new';
}

/**
 * Apply segment to a Mongoose Customer document.
 * Only writes if the segment actually changed (idempotent).
 * Returns true if a save was performed.
 *
 * @param {import('mongoose').Document} customer
 * @returns {Promise<boolean>}
 */
async function applySegment(customer) {
  const newSegment = calculateSegment({
    isBlocked:     customer.isBlocked,
    totalOrders:   customer.stats?.totalOrders  ?? 0,
    totalSpent:    customer.stats?.totalSpent   ?? 0,
    lastOrderDate: customer.lastOrderDate       ?? customer.lastVisit ?? null,
  });

  if (customer.segment === newSegment) return false; // no change — skip write

  customer.segment = newSegment;
  await customer.save();
  return true;
}

module.exports = { calculateSegment, applySegment, VIP_SPEND_THRESHOLD, VIP_ORDER_THRESHOLD };
