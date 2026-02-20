const Order = require('../models/order');

exports.processCheckout = async (req, res) => {
    const { items, shippingInfo, paymentInfo } = req.body;

    try {
        // Validate the input data
        if (!items || !shippingInfo || !paymentInfo) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        // Create a new order
        const newOrder = new Order({
            items,
            shippingInfo,
            paymentInfo,
            createdAt: new Date(),
        });

        // Save the order to the database
        await newOrder.save();

        // Respond with success
        res.status(201).json({ message: 'Order placed successfully', order: newOrder });
    } catch (error) {
        console.error('Error processing checkout:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};