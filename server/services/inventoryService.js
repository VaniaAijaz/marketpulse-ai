const Product = require('../models/Product');

/**
 * Inventory snapshot for AI + dashboard
 */
async function getInventorySummary(shopId) {
  const products = await Product.find({ shopId, isActive: true })
    .select('name category pricing.sellingPrice stock.quantity stock.lowStockThreshold')
    .lean();

  const inStock = products.filter((p) => (p.stock?.quantity ?? 0) > 0);
  const lowStock = products.filter(
    (p) => (p.stock?.quantity ?? 0) > 0 && (p.stock?.quantity ?? 0) <= (p.stock?.lowStockThreshold ?? 5)
  );
  const outOfStock = products.filter((p) => (p.stock?.quantity ?? 0) === 0);

  return {
    total: products.length,
    inStockCount: inStock.length,
    lowStockCount: lowStock.length,
    outOfStockCount: outOfStock.length,
    aiReady: inStock.length > 0,
    lowStockNames: lowStock.map((p) => p.name).slice(0, 5),
    topInStock: inStock
      .sort((a, b) => (b.stock?.quantity ?? 0) - (a.stock?.quantity ?? 0))
      .slice(0, 10)
      .map((p) => ({
        id: p._id,
        name: p.name,
        category: p.category,
        quantity: p.stock?.quantity,
        price: p.pricing?.sellingPrice,
      })),
  };
}

/**
 * Products available for AI recommendations (in stock only)
 */
async function getAiEligibleProducts(shopId, limit = 25) {
  return Product.find({
    shopId,
    isActive: true,
    'stock.quantity': { $gt: 0 },
  })
    .select('_id name category pricing.sellingPrice stock.quantity stock.lowStockThreshold')
    .sort({ 'stock.quantity': -1 })
    .limit(limit);
}

/**
 * Map AI recommendations to valid in-stock product IDs only.
 * Tries: exact ID match → exact name match → partial name match
 */
async function sanitizeAiRecommendations(shopId, recommendations = []) {
  const eligible = await getAiEligibleProducts(shopId, 50);
  const byId   = new Map(eligible.map((p) => [p._id.toString(), p]));
  const byName = new Map(eligible.map((p) => [p.name.toLowerCase().trim(), p]));

  return recommendations
    .map((rec) => {
      // 1. Exact ID match
      let product = byId.get(String(rec.productId || '').trim());

      // 2. Exact name match
      if (!product && rec.productName) {
        product = byName.get(rec.productName.toLowerCase().trim());
      }

      // 3. Partial name match (AI sometimes truncates names)
      if (!product && rec.productName) {
        const needle = rec.productName.toLowerCase().trim();
        for (const [key, p] of byName) {
          if (key.includes(needle) || needle.includes(key)) {
            product = p;
            break;
          }
        }
      }

      if (!product) return null;
      return {
        productId: product._id,
        productName: product.name,
        reason: rec.reason,
        expectedUplift: rec.expectedUplift || '+10%',
        status: 'pending',
      };
    })
    .filter(Boolean)
    .slice(0, 3);
}

module.exports = {
  getInventorySummary,
  getAiEligibleProducts,
  sanitizeAiRecommendations,
};
