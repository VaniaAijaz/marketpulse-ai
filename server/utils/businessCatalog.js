/**
 * Business-type scoped catalog — inventory categories & AI context per shop type.
 */
const BUSINESS_TYPES = ['grocery', 'clothing', 'pharmacy', 'restaurant', 'electronics', 'other'];

const CATALOG = {
  grocery: {
    label: 'Grocery / General Store',
    productCategories: ['grocery', 'beverage', 'food', 'other'],
    aiFocus:
      'Pakistani neighborhood grocery: staples, snacks, beverages, daily essentials. Suggest items shoppers buy on the way home.',
    sampleProducts: ['Rice 5kg', 'Cooking Oil 1L', 'Tea Pack', 'Biscuits', 'Soft Drinks'],
  },
  clothing: {
    label: 'Clothing & Fashion',
    productCategories: ['clothing', 'other'],
    aiFocus:
      'Clothing retail: seasonal fashion, sizes, fabric. Suggest outfits for weather and nearby offices/schools — no food or pharmacy items.',
    sampleProducts: ['Men Kurta', 'Jeans', 'Kids School Uniform', 'Sandals', 'Winter Shawl'],
  },
  pharmacy: {
    label: 'Pharmacy / Medical Store',
    productCategories: ['other'],
    aiFocus:
      'Pharmacy: OTC medicines, vitamins, first-aid, hygiene. Never suggest food or clothing. Mention health seasons.',
    sampleProducts: ['Panadol', 'ORS', 'Vitamin C', 'Hand Sanitizer', 'Cough Syrup'],
  },
  restaurant: {
    label: 'Restaurant / Food',
    productCategories: ['food', 'beverage', 'other'],
    aiFocus:
      'Restaurant / food outlet: meals, combos, delivery. Suggest dishes for weather and lunch/dinner rush near offices.',
    sampleProducts: ['Chicken Biryani', 'Karahi', 'Cold Drink', 'Naan', 'BBQ Platter'],
  },
  electronics: {
    label: 'Electronics & Mobile',
    productCategories: ['mobile', 'other'],
    aiFocus:
      'Electronics shop: mobiles, accessories, chargers, small appliances. Tech-focused promotions only.',
    sampleProducts: ['USB Cable', 'Earphones', 'Power Bank', 'Phone Cover', 'LED Bulb'],
  },
  other: {
    label: 'Other Retail',
    productCategories: ['other', 'grocery', 'food', 'beverage', 'clothing', 'mobile'],
    aiFocus: 'General Pakistani retail shop. Match suggestions to listed inventory only.',
    sampleProducts: ['Product A', 'Product B', 'Product C'],
  },
};

function getBusinessConfig(type) {
  return CATALOG[type] || CATALOG.other;
}

function getProductCategories(type) {
  return getBusinessConfig(type).productCategories;
}

function isCategoryAllowed(businessType, category) {
  return getProductCategories(businessType).includes(category);
}

module.exports = {
  BUSINESS_TYPES,
  CATALOG,
  getBusinessConfig,
  getProductCategories,
  isCategoryAllowed,
};
