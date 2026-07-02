const planConfigs = {
    monthly: {
        plan: 'Premium Plan - Monthly',
        price: '$9.99',
        billing: 'per month',
    },
    quarterly: {
        plan: 'Premium Plan - Quarterly',
        price: '$27.99',
        billing: 'per quarter (billed every 3 months)',
    },
    yearly: {
        plan: 'Premium Plan - Yearly',
        price: '$100',
        billing: 'per year (billed annually in advance)',
    },
};

const cartButtons = document.querySelectorAll('button[data-plan-key]');

if (cartButtons.length > 0) {
    cartButtons.forEach((button) => {
        button.addEventListener('click', () => {
            const planKey = button.dataset.planKey;
            const selectedPlan = planConfigs[planKey];

            if (!selectedPlan) {
                return;
            }

            const query = new URLSearchParams({
                planKey,
                plan: selectedPlan.plan,
                price: selectedPlan.price,
                billing: selectedPlan.billing,
            });

            window.location.href = `checkout.html?${query.toString()}`;
        });
    });
}

const checkoutPlan = document.getElementById('checkout-plan');
const checkoutPrice = document.getElementById('checkout-price');
const checkoutBilling = document.getElementById('checkout-billing');
const checkoutButton = document.getElementById('stripe-checkout-button');
const stripeSetupMessage = document.getElementById('stripe-setup-message');

if (checkoutPlan && checkoutPrice && checkoutBilling && checkoutButton) {
    const params = new URLSearchParams(window.location.search);
    const planKey = params.get('planKey') || 'monthly';
    const selectedPlan = planConfigs[planKey] || planConfigs.monthly;

    checkoutPlan.textContent = params.get('plan') || selectedPlan.plan;
    checkoutPrice.textContent = params.get('price') || selectedPlan.price;
    checkoutBilling.textContent = params.get('billing') || selectedPlan.billing;

    checkoutButton.addEventListener('click', async () => {
        checkoutButton.disabled = true;
        checkoutButton.textContent = 'Starting secure checkout...';

        if (stripeSetupMessage) {
            stripeSetupMessage.textContent = 'Redirecting to Stripe...';
        }

        try {
            const response = await fetch('/api/create-checkout-session', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ planKey }),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Unable to start checkout.');
            }

            window.location.href = result.url;
        } catch (error) {
            checkoutButton.disabled = false;
            checkoutButton.textContent = 'Continue to Stripe checkout';

            if (stripeSetupMessage) {
                stripeSetupMessage.textContent = error instanceof Error ? error.message : 'Unable to start Stripe checkout.';
            }
        }
    });
}
