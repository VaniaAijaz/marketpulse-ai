const generateOrderNo = (shopId = '') => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.floor(Math.random() * 10000).toString(36).toUpperCase();
  const shopSuffix = shopId? shopId.slice(-4).toUpperCase() : 'GEN';

  return `ORD-${shopSuffix}-${timestamp}-${random}`;
};

// Example: ORD-A1B2-K2M9X7-3F8G
module.exports = generateOrderNo;