const Cart = require('../models/cart');

// Add item to cart
exports.addToCart = async (req, res) => {
    const { productId, quantity } = req.body;
    try {
        const cart = await Cart.findOne({ userId: req.user.id });
        if (cart) {
            const itemIndex = cart.items.findIndex(item => item.productId === productId);
            if (itemIndex > -1) {
                cart.items[itemIndex].quantity += quantity;
            } else {
                cart.items.push({ productId, quantity });
            }
            cart.totalPrice += quantity * (await getProductPrice(productId));
            await cart.save();
        } else {
            const newCart = new Cart({
                userId: req.user.id,
                items: [{ productId, quantity }],
                totalPrice: quantity * (await getProductPrice(productId))
            });
            await newCart.save();
        }
        res.status(200).json({ message: 'Item added to cart' });
    } catch (error) {
        res.status(500).json({ message: 'Error adding item to cart', error });
    }
};

// Remove item from cart
exports.removeFromCart = async (req, res) => {
    const { productId } = req.body;
    try {
        const cart = await Cart.findOne({ userId: req.user.id });
        if (cart) {
            const itemIndex = cart.items.findIndex(item => item.productId === productId);
            if (itemIndex > -1) {
                cart.totalPrice -= cart.items[itemIndex].quantity * (await getProductPrice(productId));
                cart.items.splice(itemIndex, 1);
                await cart.save();
                res.status(200).json({ message: 'Item removed from cart' });
            } else {
                res.status(404).json({ message: 'Item not found in cart' });
            }
        } else {
            res.status(404).json({ message: 'Cart not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Error removing item from cart', error });
    }
};

// Helper function to get product price
const getProductPrice = async (productId) => {
    // This function should fetch the product price from the database
    // Placeholder implementation
    return 10; // Replace with actual price fetching logic
};