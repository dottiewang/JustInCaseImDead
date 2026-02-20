const express = require('express');
const router = express.Router();
const productsController = require('../controllers/productsController');

// Route to get all products
router.get('/', productsController.getAllProducts);

// Route to get a single product by ID
router.get('/:id', productsController.getProductById);

module.exports = router;