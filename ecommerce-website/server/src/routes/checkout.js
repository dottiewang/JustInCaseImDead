const express = require('express');
const router = express.Router();
const checkoutController = require('../controllers/checkoutController');

// Route to handle order submission
router.post('/submit', checkoutController.submitOrder);

// Route to get order details (if needed)
router.get('/order/:id', checkoutController.getOrderDetails);

module.exports = router;