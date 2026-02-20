const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cartController');

// Route to get the cart items
router.get('/', cartController.getCartItems);

// Route to add an item to the cart
router.post('/add', cartController.addItemToCart);

// Route to remove an item from the cart
router.delete('/remove/:id', cartController.removeItemFromCart);

// Route to clear the cart
router.delete('/clear', cartController.clearCart);

module.exports = router;