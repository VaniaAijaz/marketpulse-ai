/**
 * orderStateMachine.js
 * Production-ready order status transition system.
 *
 * Statuses: PENDING → CONFIRMED → COMPLETED
 *           PENDING → CANCELLED
 *           CONFIRMED → CANCELLED (if not shipped)
 *
 * COMPLETED and CANCELLED are terminal — no further transitions allowed.
 * CONFIRMED cannot be skipped (PENDING cannot jump to COMPLETED directly).
 * BLOCKED status is never touched by this system.
 */

// ── Canonical status names ────────────────────────────────
const STATUS = Object.freeze({
  PENDING:   'pending',
  CONFIRMED: 'confirmed',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
});

// ── Allowed transitions map ───────────────────────────────
// Key = current status, Value = set of valid next statuses
const TRANSITIONS = Object.freeze({
  [STATUS.PENDING]:   new Set([STATUS.CONFIRMED, STATUS.CANCELLED]),
  [STATUS.CONFIRMED]: new Set([STATUS.COMPLETED, STATUS.CANCELLED]),
  [STATUS.COMPLETED]: new Set(), // terminal
  [STATUS.CANCELLED]: new Set(), // terminal
});

// ── Terminal states ───────────────────────────────────────
const TERMINAL = new Set([STATUS.COMPLETED, STATUS.CANCELLED]);

/**
 * Check whether a transition is allowed.
 * Pure function — no side effects.
 *
 * @param {string} from  current status
 * @param {string} to    requested status
 * @returns {boolean}
 */
function canTransition(from, to) {
  const allowed = TRANSITIONS[from];
  if (!allowed) return false;
  return allowed.has(to);
}

/**
 * Validate a transition and throw a descriptive error if invalid.
 * @param {string} from
 * @param {string} to
 * @throws {Error} with HTTP-friendly message
 */
function assertTransition(from, to) {
  // Unknown status
  if (!(from in TRANSITIONS)) {
    throw Object.assign(new Error(`Unknown order status: "${from}"`), { statusCode: 400 });
  }
  if (!(to in TRANSITIONS)) {
    throw Object.assign(new Error(`Unknown target status: "${to}"`), { statusCode: 400 });
  }

  // Idempotent — same status is a no-op, not an error
  if (from === to) return; // caller handles idempotency

  // Terminal state guard
  if (TERMINAL.has(from)) {
    throw Object.assign(
      new Error(`Order is already ${from.toUpperCase()} — no further changes allowed`),
      { statusCode: 409 }
    );
  }

  // Transition not in allowed set
  if (!canTransition(from, to)) {
    const allowed = [...(TRANSITIONS[from] || [])];
    throw Object.assign(
      new Error(
        `Invalid transition: ${from.toUpperCase()} → ${to.toUpperCase()}. ` +
        (allowed.length
          ? `Allowed: ${allowed.map(s => s.toUpperCase()).join(', ')}`
          : 'No transitions allowed from this state.')
      ),
      { statusCode: 422 }
    );
  }
}

/**
 * Append a status change entry to order.statusHistory.
 * Non-destructive — always pushes, never modifies existing entries.
 *
 * @param {object} order   Mongoose document
 * @param {string} from    previous status
 * @param {string} to      new status
 * @param {string} [note]  optional reason / actor note
 */
function logTransition(order, from, to, note = '') {
  if (!Array.isArray(order.statusHistory)) order.statusHistory = [];
  order.statusHistory.push({
    from,
    to,
    changedAt: new Date(),
    note: note || undefined,
  });
}

/**
 * Core transition function.
 * Validates, logs, applies side-effects, and saves the order.
 * Idempotent: if order is already in the target status, returns immediately.
 *
 * @param {object}  order            Mongoose Order document
 * @param {string}  newStatus        target status
 * @param {object}  [opts]
 * @param {string}  [opts.reason]    cancellation reason or note
 * @param {boolean} [opts.dryRun]    validate only, do not save
 * @returns {Promise<object>}        updated order document
 */
async function transitionOrderStatus(order, newStatus, opts = {}) {
  const { reason = '', dryRun = false } = opts;
  const prevStatus = order.status;

  // ── Idempotency guard ─────────────────────────────────
  if (prevStatus === newStatus) {
    return order; // already in target state — nothing to do
  }

  // ── Validate ──────────────────────────────────────────
  assertTransition(prevStatus, newStatus);

  if (dryRun) return order; // validation passed, skip persistence

  // ── Apply status ──────────────────────────────────────
  order.status = newStatus;

  // ── Status-specific side effects ──────────────────────
  if (newStatus === STATUS.COMPLETED) {
    order.completedAt = new Date();
    if (order.payment?.status !== 'paid') {
      order.payment.status = 'paid';
    }
  }

  if (newStatus === STATUS.CANCELLED) {
    order.cancelledAt  = new Date();
    order.cancelReason = reason || 'No reason provided';
    // Refund payment if it was paid
    if (order.payment?.status === 'paid') {
      order.payment.status = 'refunded';
    }
  }

  if (newStatus === STATUS.CONFIRMED) {
    order.confirmedAt = new Date();
  }

  // ── Audit log ─────────────────────────────────────────
  logTransition(order, prevStatus, newStatus, reason);

  // ── Persist ───────────────────────────────────────────
  await order.save();

  // ── Post-save downstream effects ─────────────────────
  if (newStatus === STATUS.COMPLETED && order.customerId) {
    try {
      const mongoose = require('mongoose');
      const Customer = mongoose.model('Customer');
      const customer = await Customer.findById(order.customerId);
      if (customer) await customer.updateActivity(order.pricing.total);
    } catch (err) {
      // Non-critical — log but don't fail the transition
      console.error('[OrderFSM] Customer stat update failed:', err.message);
    }
  }

  console.log(
    `[OrderFSM] ${order.orderNumber || order._id} | ` +
    `${prevStatus.toUpperCase()} → ${newStatus.toUpperCase()}` +
    (reason ? ` | "${reason}"` : '')
  );

  return order;
}

module.exports = {
  STATUS,
  canTransition,
  assertTransition,
  transitionOrderStatus,
  logTransition,
};
