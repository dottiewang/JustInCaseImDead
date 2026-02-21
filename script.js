const cartButtons = document.querySelectorAll('button[data-plan]');

if (cartButtons.length > 0) {
    cartButtons.forEach((button) => {
        button.addEventListener('click', () => {
            const plan = button.dataset.plan || 'Premium Plan';
            const price = button.dataset.price || '$0';
            const billing = button.dataset.billing || '';

            const query = new URLSearchParams({
                plan,
                price,
                billing,
            });

            window.location.href = `checkout.html?${query.toString()}`;
        });
    });
}

const checkoutPlan = document.getElementById('checkout-plan');
const checkoutPrice = document.getElementById('checkout-price');
const checkoutBilling = document.getElementById('checkout-billing');

if (checkoutPlan && checkoutPrice && checkoutBilling) {
    const params = new URLSearchParams(window.location.search);
    checkoutPlan.textContent = params.get('plan') || 'Premium Plan';
    checkoutPrice.textContent = params.get('price') || '$0';
    checkoutBilling.textContent = params.get('billing') || 'per billing cycle';
}
