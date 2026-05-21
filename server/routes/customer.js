const express = require('express');
const router = express.Router();
const {
  upsertCustomer,
  getCustomers,
  getCustomerById,
  updateCustomerActivity,
  getInactiveCustomers,
  getTopCustomers,
  addCustomerTag,
  toggleBlockCustomer
} = require('../controllers/customerController');
const auth = require('../middleware/auth');

router.use(auth);

router.post('/upsert', upsertCustomer);
router.get('/:shopId', getCustomers);
router.get('/inactive/:shopId', getInactiveCustomers);
router.get('/top/:shopId', getTopCustomers);
router.get('/:id', getCustomerById);
router.post('/:id/activity', updateCustomerActivity);
router.post('/:id/tag', addCustomerTag);
router.patch('/:id/block', toggleBlockCustomer);

module.exports = router;