/**
 * OCH! SUSHI – Stripe Checkout Integration (Payment Element)
 */

const stripePublicKey = 'pk_live_51TgXcXRxRXOvvDzX65X8JjryJ4rguNg7p8WmtJX9roYnwY5FELXQR6SFMcFZxsPzErGGGWcDXp3QwZkbzOrav5OB006HVoBXtU';
let stripe, elements, paymentElement;
let currentClientSecret = null;
let currentPaymentIntentId = null;
let currentOrderId = null;

document.addEventListener('DOMContentLoaded', () => {
  initCheckout();
  checkPaymentStatus();
});

function initCheckout() {
  const checkoutBtn = document.getElementById('checkout-btn');
  const checkoutClose = document.getElementById('checkout-close');
  const checkoutBackdrop = document.getElementById('checkout-backdrop');
  const checkoutForm = document.getElementById('checkout-form');
  const successClose = document.getElementById('success-close');

  if (checkoutBtn) {
    checkoutBtn.addEventListener('click', () => {
      if (Cart.items.length === 0) return;
      Cart.closeSidebar();
      openCheckoutModal();
    });
  }

  if (checkoutClose) checkoutClose.addEventListener('click', closeCheckoutModal);
  if (checkoutBackdrop) checkoutBackdrop.addEventListener('click', closeCheckoutModal);
  if (checkoutForm) checkoutForm.addEventListener('submit', handlePayment);
  if (successClose) successClose.addEventListener('click', closeSuccessModal);

  // Zmiana opcji dostawy aktualizuje kwotę
  const deliveryRadios = document.querySelectorAll('input[name="deliveryMethod"]');
  deliveryRadios.forEach(radio => {
    radio.addEventListener('change', updatePaymentIntentAmount);
  });

  try {
    if (stripePublicKey !== 'pk_test_XXXX') {
      stripe = Stripe(stripePublicKey);
    }
  } catch (e) {
    console.log('Stripe initialization failed.');
  }
}

async function openCheckoutModal() {
  const modal = document.getElementById('checkout-modal');
  const backdrop = document.getElementById('checkout-backdrop');
  const checkoutTotal = document.getElementById('checkout-total');
  const payBtnText = document.getElementById('pay-btn-text');
  const cardContainer = document.getElementById('card-element');

  if (modal) modal.style.display = 'block';
  if (backdrop) backdrop.style.display = 'block';
  document.body.classList.add('modal-open');

  const total = Cart.getTotal();
  if (checkoutTotal) checkoutTotal.textContent = total + ' PLN';
  if (payBtnText) payBtnText.textContent = `Zapłać ${total} PLN`;

  if (!stripe) {
    if (cardContainer) cardContainer.innerHTML = '<p style="color:#999;font-size:0.9rem;padding:4px 0;">⚙️ Konfiguracja Stripe (DEMO MODE)</p>';
    return;
  }

  const deliveryMethod = document.querySelector('input[name="deliveryMethod"]:checked').value;
  const orderItems = Cart.items.map(i => ({ id: i.id, name: i.name, price: i.price, quantity: i.quantity }));

  // Blokujemy przycisk póki element się ładuje
  const payBtn = document.getElementById('pay-btn');
  if (payBtn) payBtn.disabled = true;

  try {
    // Jeśli nie mamy jeszcze elementu, to pobieramy intent
    if (!paymentElement) {
      if (cardContainer) cardContainer.innerHTML = '<p>Ładowanie metod płatności...</p>';
      
      const response = await fetch('/api/create-payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: orderItems, deliveryMethod })
      });
      const data = await response.json();
      
      currentClientSecret = data.clientSecret;
      currentPaymentIntentId = data.paymentIntentId;
      currentOrderId = data.orderId;

      if (currentClientSecret) {
        elements = stripe.elements({ 
          clientSecret: currentClientSecret,
          appearance: {
            theme: 'stripe',
            variables: { colorPrimary: '#C4878E', fontFamily: 'Inter, sans-serif' }
          },
          locale: 'pl'
        });
        
        paymentElement = elements.create('payment', { layout: 'tabs' });
        if (cardContainer) cardContainer.innerHTML = '';
        paymentElement.mount('#card-element');
      }
    } else {
      // Mamy już element, uaktualnijmy tylko kwotę
      await updatePaymentIntentAmount();
    }
  } catch (e) {
    console.error(e);
    if (cardContainer) cardContainer.innerHTML = '<p style="color:red;">Błąd ładowania płatności.</p>';
  } finally {
    if (payBtn) payBtn.disabled = false;
  }
}

async function updatePaymentIntentAmount() {
  if (!currentPaymentIntentId) return;

  const checkoutTotal = document.getElementById('checkout-total');
  const payBtnText = document.getElementById('pay-btn-text');
  
  Cart.render(); 
  const total = Cart.getTotal();
  if (checkoutTotal) checkoutTotal.textContent = total + ' PLN';
  if (payBtnText) payBtnText.textContent = `Zapłać ${total} PLN`;

  const deliveryMethod = document.querySelector('input[name="deliveryMethod"]:checked').value;
  const orderItems = Cart.items.map(i => ({ id: i.id, name: i.name, price: i.price, quantity: i.quantity }));

  try {
    await fetch('/api/update-payment-intent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        paymentIntentId: currentPaymentIntentId,
        items: orderItems,
        deliveryMethod
      })
    });
  } catch(e) {
    console.error('Failed to update intent amount');
  }
}

function closeCheckoutModal() {
  const modal = document.getElementById('checkout-modal');
  const backdrop = document.getElementById('checkout-backdrop');
  if (modal) modal.style.display = 'none';
  if (backdrop) backdrop.style.display = 'none';
  document.body.classList.remove('modal-open');
}

async function handlePayment(e) {
  e.preventDefault();

  const payBtn = document.getElementById('pay-btn');
  const payBtnText = document.getElementById('pay-btn-text');
  const payBtnSpinner = document.getElementById('pay-btn-spinner');
  const errorEl = document.getElementById('card-errors');

  // Walidacja
  const name = document.getElementById('checkout-name').value.trim();
  const phone = document.getElementById('checkout-phone').value.trim();
  const email = document.getElementById('checkout-email').value.trim();
  const deliveryMethod = document.querySelector('input[name="deliveryMethod"]:checked').value;
  const address = document.getElementById('checkout-address').value.trim();
  const notes = document.getElementById('checkout-notes').value.trim();
  const termsAccepted = document.getElementById('checkout-terms').checked;

  if (!name || !phone || !email) {
    if (errorEl) errorEl.textContent = 'Wypełnij wszystkie wymagane pola.';
    return;
  }
  if (deliveryMethod === 'delivery' && !address) {
    if (errorEl) errorEl.textContent = 'Podaj adres dostawy.';
    return;
  }
  if (!termsAccepted) {
    if (errorEl) errorEl.textContent = 'Musisz zaakceptować regulamin.';
    return;
  }

  if (payBtn) payBtn.disabled = true;
  if (payBtnText) payBtnText.textContent = 'Przetwarzanie...';
  if (payBtnSpinner) payBtnSpinner.style.display = 'inline-block';
  if (errorEl) errorEl.textContent = '';

  const customerData = { name, phone, email, address, deliveryMethod, notes };
  const orderItems = Cart.items.map(i => ({ id: i.id, name: i.name, price: i.price, quantity: i.quantity }));
  const total = Cart.getTotal();

  try {
    if (stripe && elements) {
      // Zapisujemy stan na wypadek przekierowania w localStorage (lepsze wsparcie mobile)
      localStorage.setItem('pendingOrderCustomer', JSON.stringify(customerData));
      localStorage.setItem('pendingOrderItems', JSON.stringify(orderItems));
      localStorage.setItem('pendingOrderId', currentOrderId);
      localStorage.setItem('pendingOrderTotal', total);

      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: window.location.href.split('?')[0],
          payment_method_data: {
            billing_details: { name, email, phone }
          }
        },
        redirect: 'if_required'
      });

      if (error) {
        if (error.type === 'card_error' || error.type === 'validation_error') {
          throw new Error(error.message);
        } else {
          throw new Error('Wystąpił nieoczekiwany błąd. Spróbuj ponownie.');
        }
      } else if (paymentIntent && (paymentIntent.status === 'succeeded' || paymentIntent.status === 'processing')) {
        // Płatność udana bez przeładowania strony! Natychmiastowy sukces.
        await fetch('/api/confirm-order', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            orderId: currentOrderId,
            paymentIntentId: paymentIntent.id,
            items: orderItems,
            customer: customerData,
            total: total
          })
        }).catch(() => {});
        showSuccess(currentOrderId);
      }
    } else {
      // Tryb DEMO
      await fetch('/api/confirm-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: currentOrderId || 'DEMO-' + Date.now().toString(36).toUpperCase(),
          paymentIntentId: 'demo_' + Date.now(),
          items: orderItems,
          customer: customerData,
          total
        })
      }).catch(() => {});
      showSuccess(currentOrderId || 'DEMO');
    }
  } catch (err) {
    if (errorEl) errorEl.textContent = err.message || 'Wystąpił błąd podczas płatności.';
  } finally {
    if (payBtn) payBtn.disabled = false;
    if (payBtnText) payBtnText.textContent = `Zapłać ${total} PLN`;
    if (payBtnSpinner) payBtnSpinner.style.display = 'none';
  }
}

async function checkPaymentStatus() {
  const urlParams = new URLSearchParams(window.location.search);
  const paymentIntentId = urlParams.get('payment_intent');
  const redirectStatus = urlParams.get('redirect_status');

  if (paymentIntentId && (redirectStatus === 'succeeded' || redirectStatus === 'processing')) {
    const customerDataStr = localStorage.getItem('pendingOrderCustomer');
    const orderItemsStr = localStorage.getItem('pendingOrderItems');
    const orderId = localStorage.getItem('pendingOrderId');
    const total = localStorage.getItem('pendingOrderTotal');

    if (customerDataStr && orderItemsStr) {
      try {
        await fetch('/api/confirm-order', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            orderId: orderId,
            paymentIntentId: paymentIntentId,
            items: JSON.parse(orderItemsStr),
            customer: JSON.parse(customerDataStr),
            total: total
          })
        });

        window.history.replaceState({}, document.title, window.location.pathname);
        showSuccess(orderId);
      } catch (err) {
        console.error('Błąd potwierdzania po powrocie ze Stripe:', err);
      } finally {
        localStorage.removeItem('pendingOrderCustomer');
        localStorage.removeItem('pendingOrderItems');
        localStorage.removeItem('pendingOrderId');
        localStorage.removeItem('pendingOrderTotal');
      }
    }
  }
}

function showSuccess(orderId) {
  closeCheckoutModal();
  Cart.clear();

  const successModal = document.getElementById('success-modal');
  const orderIdEl = document.getElementById('success-order-id');

  if (orderIdEl) orderIdEl.textContent = orderId;
  if (successModal) successModal.style.display = 'flex';
}

function closeSuccessModal() {
  const successModal = document.getElementById('success-modal');
  if (successModal) successModal.style.display = 'none';
  document.body.classList.remove('modal-open');
}
