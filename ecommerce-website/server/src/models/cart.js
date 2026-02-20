const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema({
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Product'
    },
    quantity: {
        type: Number,
        required: true,
        min: 1
    }
});

const cartSchema = new mongoose.Schema({
    items: [cartItemSchema],
    totalPrice: {
        type: Number,
        default: 0
    }
});

cartSchema.methods.calculateTotalPrice = function() {
    this.totalPrice = this.items.reduce((total, item) => {
        return total + (item.quantity * item.product.price);
    }, 0);
};

const Cart = mongoose.model('Cart', cartSchema);

module.exports = Cart;