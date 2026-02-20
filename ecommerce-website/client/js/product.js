// This file contains JavaScript functions for handling product-related actions, such as adding a product to the cart and updating the product display.

document.addEventListener('DOMContentLoaded', () => {
    const addToCartButton = document.getElementById('add-to-cart');
    const productId = document.getElementById('product-id').value;

    addToCartButton.addEventListener('click', () => {
        addToCart(productId);
    });
});

function addToCart(productId) {
    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    const productExists = cart.find(item => item.id === productId);

    if (productExists) {
        productExists.quantity += 1;
    } else {
        const product = { id: productId, quantity: 1 };
        cart.push(product);
    }

    localStorage.setItem('cart', JSON.stringify(cart));
    alert('Product added to cart!');
}

function updateProductDisplay(product) {
    document.getElementById('product-name').innerText = product.name;
    document.getElementById('product-price').innerText = `$${product.price.toFixed(2)}`;
    document.getElementById('product-description').innerText = product.description;
}