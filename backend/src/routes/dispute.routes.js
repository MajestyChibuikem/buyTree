const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const {
  createDispute, getBuyerDisputes, getDispute, addSellerResponse,
} = require('../controllers/disputeController');

router.use(authenticateToken);

router.post('/', createDispute);
router.get('/my', getBuyerDisputes);
router.get('/:id', getDispute);
router.put('/:id/seller-response', addSellerResponse);

module.exports = router;
