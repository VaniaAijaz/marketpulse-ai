/**
 * segmentCron.js
 * Daily job — sweeps all non-blocked customers and re-evaluates their segment.
 * Runs at 01:00 AM Pakistan time (after dailyAnalytics at midnight).
 *
 * Uses bulk updateOne operations for efficiency — no full document loads.
 * Idempotent: only writes when the segment actually needs to change.
 */

const cron       = require('node-cron');
const mongoose   = require('mongoose');
const { calculateSegment } = require('../utils/customerSegment');

async function runSegmentSweep() {
  const Customer = mongoose.model('Customer');
  console.log('[SegmentCron] Starting customer segment sweep...');

  const now = Date.now();
  let updated = 0;
  let skipped = 0;

  // Stream customers in batches — never load all into memory at once
  const cursor = Customer
    .find({ isBlocked: false })
    .select('segment isBlocked stats lastOrderDate lastVisit')
    .lean()
    .cursor();

  const bulkOps = [];

  for await (const doc of cursor) {
    const newSegment = calculateSegment({
      isBlocked:     doc.isBlocked,
      totalOrders:   doc.stats?.totalOrders  ?? 0,
      totalSpent:    doc.stats?.totalSpent   ?? 0,
      lastOrderDate: doc.lastOrderDate       ?? doc.lastVisit ?? null,
    });

    if (doc.segment === newSegment) {
      skipped++;
      continue; // idempotent — no unnecessary write
    }

    bulkOps.push({
      updateOne: {
        filter: { _id: doc._id },
        update: { $set: { segment: newSegment } },
      },
    });
    updated++;

    // Flush every 500 ops to avoid oversized bulk writes
    if (bulkOps.length >= 500) {
      await Customer.bulkWrite(bulkOps.splice(0));
    }
  }

  // Flush remaining
  if (bulkOps.length > 0) {
    await Customer.bulkWrite(bulkOps);
  }

  console.log(`[SegmentCron] Done — updated: ${updated}, unchanged: ${skipped}`);
  return { updated, skipped };
}

// Daily at 01:00 AM Pakistan time
cron.schedule('0 1 * * *', async () => {
  try {
    await runSegmentSweep();
  } catch (err) {
    console.error('[SegmentCron] Error:', err.message);
  }
}, { timezone: 'Asia/Karachi' });

module.exports = { runSegmentSweep };
