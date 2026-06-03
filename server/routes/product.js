const express = require('express');
const router = express.Router();
const {
  createProduct,
  getInventorySummaryHandler,
  getProducts,
  getProductById,
  updateProduct,
  updateStock,
  getLowStockProducts,
  toggleProductStatus,
  deleteProduct,
} = require('../controllers/productController');
const auth = require('../middleware/auth');
const { assertShopIdAccess, assertProductIdAccess } = require('../middleware/productAccess');

router.use(auth);

router.post('/create', assertShopIdAccess, createProduct);
router.get('/summary/:shopId', assertShopIdAccess, getInventorySummaryHandler);
router.get('/lowstock/:shopId', assertShopIdAccess, getLowStockProducts);
router.get('/shop/:shopId', assertShopIdAccess, getProducts);
router.get('/product/:id', assertProductIdAccess, getProductById);

router.put('/:id', assertProductIdAccess, updateProduct);
router.patch('/:id/stock', assertProductIdAccess, updateStock);
router.patch('/:id/toggle', assertProductIdAccess, toggleProductStatus);
router.delete('/:id', assertProductIdAccess, deleteProduct);

// Legacy path — keep for older clients
router.get('/:shopId', assertShopIdAccess, getProducts);

module.exports = router;
