// JavaScript functions for managing the shopping cart
let cart = [];

// Function to add an item to the cart
function addToCart(product) {
    const existingProduct = cart.find(item => item.id === product.id);
    if (existingProduct) {
        existingProduct.quantity += 1;
    } else {
        cart.push({ ...product, quantity: 1 });
    }
    updateCartDisplay();
}

// Function to remove an item from the cart
function removeFromCart(productId) {
    cart = cart.filter(item => item.id !== productId);
    updateCartDisplay();
}

// Function to calculate the total price of items in the cart
function calculateTotal() {
    return cart.reduce((total, item) => total + item.price * item.quantity, 0).toFixed(2);
}

// Function to update the cart display on the cart page
function updateCartDisplay() {
    const cartItemsContainer = document.getElementById('cart-items');
    cartItemsContainer.innerHTML = '';

    cart.forEach(item => {
        const itemElement = document.createElement('div');
        itemElement.className = 'cart-item';
        itemElement.innerHTML = `
            <h4>${item.name}</h4>
            <p>Price: $${item.price.toFixed(2)}</p>
            <p>Quantity: ${item.quantity}</p>
            <button onclick="removeFromCart(${item.id})">Remove</button>
        `;
        cartItemsContainer.appendChild(itemElement);
    });

    const totalElement = document.getElementById('total-price');
    totalElement.innerText = `Total: $${calculateTotal()}`;
}

// Function to clear the cart
function clearCart() {
    cart = [];
    updateCartDisplay();
}

// Function to get the cart items for checkout
function getCartItems() {
    return cart;
}