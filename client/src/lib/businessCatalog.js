/** Client mirror of server business catalog — keep in sync with server/utils/businessCatalog.js */

export const BUSINESS_TYPES = [
  { id: 'grocery', label: 'Grocery / General Store', icon: 'local_grocery_store' },
  { id: 'clothing', label: 'Clothing & Fashion', icon: 'checkroom' },
  { id: 'pharmacy', label: 'Pharmacy / Medical', icon: 'local_pharmacy' },
  { id: 'restaurant', label: 'Restaurant / Food', icon: 'restaurant' },
  { id: 'electronics', label: 'Electronics & Mobile', icon: 'devices' },
  { id: 'other', label: 'Other Retail', icon: 'storefront' },
]

const CATALOG = {
  grocery: {
    productCategories: ['grocery', 'beverage', 'food', 'other'],
    aiHint: 'Grocery & daily essentials only',
  },
  clothing: {
    productCategories: ['clothing', 'other'],
    aiHint: 'Fashion & apparel only — no food or medicine',
  },
  pharmacy: {
    productCategories: ['other'],
    aiHint: 'Medicines & health products only',
  },
  restaurant: {
    productCategories: ['food', 'beverage', 'other'],
    aiHint: 'Food & beverages only',
  },
  electronics: {
    productCategories: ['mobile', 'other'],
    aiHint: 'Electronics & accessories only',
  },
  other: {
    productCategories: ['other', 'grocery', 'food', 'beverage', 'clothing', 'mobile'],
    aiHint: 'General retail',
  },
}

export function getProductCategories(businessType) {
  return CATALOG[businessType]?.productCategories || CATALOG.other.productCategories
}

export function getBusinessHint(businessType) {
  return CATALOG[businessType]?.aiHint || ''
}

export const CATEGORY_LABELS = {
  food: 'Food',
  beverage: 'Beverage',
  grocery: 'Grocery',
  mobile: 'Mobile / Electronics',
  clothing: 'Clothing',
  other: 'Other',
}
