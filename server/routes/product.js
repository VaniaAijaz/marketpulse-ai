const express = require('express');
const router = express.Router();
const {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  updateStock,
  getLowStockProducts,
  toggleProductStatus,
  deleteProduct
} = require('../controllers/productController');
const auth = require('../middleware/auth');

router.use(auth);

router.post('/create', createProduct);
router.get('/:shopId', getProducts);
router.get('/lowstock/:shopId', getLowStockProducts);
router.get('/product/:id', getProductById);
router.put('/:id', updateProduct);
router.patch('/:id/stock', updateStock);
router.patch('/:id/toggle', toggleProductStatus);
router.delete('/:id', deleteProduct);

module.exports = router;