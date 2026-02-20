// This file contains JavaScript functions for handling the checkout process, including form validation and submitting order details to the server.

document.addEventListener('DOMContentLoaded', function() {
    const checkoutForm = document.getElementById('checkout-form');
    
    checkoutForm.addEventListener('submit', function(event) {
        event.preventDefault();
        
        if (validateForm()) {
            const formData = new FormData(checkoutForm);
            const data = Object.fromEntries(formData.entries());

            fetch('/api/checkout', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    alert('Order placed successfully!');
                    window.location.href = '/pages/confirmation.html';
                } else {
                    alert('Error placing order: ' + data.message);
                }
            })
            .catch((error) => {
                console.error('Error:', error);
                alert('An error occurred while placing the order.');
            });
        }
    });

    function validateForm() {
        const name = document.getElementById('name').value;
        const address = document.getElementById('address').value;
        const paymentInfo = document.getElementById('payment-info').value;

        if (!name || !address || !paymentInfo) {
            alert('Please fill in all fields.');
            return false;
        }
        return true;
    }
});