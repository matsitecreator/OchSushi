/**
 * OCH! SUSHI – Shopping Cart Module
 * Handles add/remove/quantity, localStorage persistence, and sidebar rendering
 */
window.Cart = {
  items: [],

  init() {
    const saved = localStorage.getItem('ochsushi_cart');
    if (saved) {
      try { this.items = JSON.parse(saved); } catch (e) { this.items = []; }
    }
    this.render();
    this.bindEvents();
  },

  save() {
    localStorage.setItem('ochsushi_cart', JSON.stringify(this.items));
  },

  add(item) {
    const existing = this.items.find(i => i.id === item.id);
    if (existing) {
      existing.quantity++;
    } else {
      this.items.push({ id: item.id, name: item.name, price: item.price, quantity: 1, image: item.image });
    }
    this.save();
    this.render();
    this.openSidebar();
    this.showAddFeedback(item.id);
  },

  remove(id) {
    this.items = this.items.filter(i => i.id !== id);
    this.save();
    this.render();
  },

  updateQuantity(id, qty) {
    if (qty <= 0) { this.remove(id); return; }
    const item = this.items.find(i => i.id === id);
    if (item) { item.quantity = qty; this.save(); this.render(); }
  },

  getSubtotal() {
    return this.items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  },

  getDeliveryFee() {
    return this.getSubtotal() >= 100 ? 0 : 10;
  },

  getTotal() {
    return this.getSubtotal() + this.getDeliveryFee();
  },

  getItemCount() {
    return this.items.reduce((sum, i) => sum + i.quantity, 0);
  },

  clear() {
    this.items = [];
    this.save();
    this.render();
  },

  render() {
    const itemsEl = document.getElementById('cart-items');
    const footerEl = document.getElementById('cart-footer');
    const badge = document.getElementById('cart-badge');
    const subtotalEl = document.getElementById('cart-subtotal');
    const deliveryEl = document.getElementById('cart-delivery');
    const totalEl = document.getElementById('cart-total');
    const checkoutTotalEl = document.getElementById('checkout-total');

    // Badge
    const count = this.getItemCount();
    if (badge) {
      badge.textContent = count;
      badge.dataset.count = count;
      badge.style.display = count > 0 ? 'flex' : 'none';
    }

    // Mobile FAB badge
    const mobileBadge = document.getElementById('mobile-cart-badge');
    const mobileFab = document.getElementById('mobile-cart-fab');
    if (mobileBadge) {
      mobileBadge.textContent = count > 0 ? count : '';
    }
    if (mobileFab) {
      mobileFab.classList.toggle('has-items', count > 0);
    }

    // Cart items
    if (this.items.length === 0) {
      if (itemsEl) itemsEl.innerHTML = '<p class="cart-sidebar__empty">Koszyk jest pusty</p>';
      if (footerEl) footerEl.style.display = 'none';
      return;
    }

    if (footerEl) footerEl.style.display = 'block';

    if (itemsEl) {
      itemsEl.innerHTML = this.items.map(item => `
        <div class="cart-item" data-id="${item.id}">
          <img src="${item.image}" alt="${item.name}" class="cart-item__img">
          <div class="cart-item__info">
            <div class="cart-item__name">${item.name}</div>
            <div class="cart-item__price">${item.price * item.quantity} PLN</div>
            <div class="cart-item__controls">
              <button class="cart-item__qty-btn" onclick="Cart.updateQuantity(${item.id}, ${item.quantity - 1})">−</button>
              <span class="cart-item__qty">${item.quantity}</span>
              <button class="cart-item__qty-btn" onclick="Cart.updateQuantity(${item.id}, ${item.quantity + 1})">+</button>
              <button class="cart-item__remove" onclick="Cart.remove(${item.id})">Usuń</button>
            </div>
          </div>
        </div>
      `).join('');
    }

    // Totals
    const subtotal = this.getSubtotal();
    const delivery = this.getDeliveryFee();
    const total = this.getTotal();

    if (subtotalEl) subtotalEl.textContent = subtotal + ' PLN';
    if (deliveryEl) deliveryEl.textContent = delivery === 0 ? 'GRATIS!' : delivery + ' PLN';
    if (totalEl) totalEl.textContent = total + ' PLN';
    if (checkoutTotalEl) checkoutTotalEl.textContent = total + ' PLN';
  },

  openSidebar() {
    document.body.classList.add('cart-open');
  },
  closeSidebar() {
    document.body.classList.remove('cart-open');
  },

  showAddFeedback(id) {
    const btn = document.querySelector(`.menu-card__add-btn[data-id="${id}"]`);
    if (!btn) return;
    const originalText = btn.innerHTML;
    btn.innerHTML = '✓ Dodano!';
    btn.style.background = '#4CAF50';
    setTimeout(() => { btn.innerHTML = originalText; btn.style.background = ''; }, 1200);
  },

  bindEvents() {
    const toggleBtn = document.getElementById('cart-toggle');
    const closeBtn = document.getElementById('cart-close');
    const backdrop = document.getElementById('cart-backdrop');

    if (toggleBtn) toggleBtn.addEventListener('click', () => this.openSidebar());
    if (closeBtn) closeBtn.addEventListener('click', () => this.closeSidebar());
    if (backdrop) backdrop.addEventListener('click', () => this.closeSidebar());

    // Mobile FAB
    const mobileFab = document.getElementById('mobile-cart-fab');
    if (mobileFab) mobileFab.addEventListener('click', () => this.openSidebar());
  }
};

// Global function called from menu cards
function addToCart(id) {
  const item = window.menuData.find(i => i.id === id);
  if (item) Cart.add(item);
}

// Initialize cart on load
document.addEventListener('DOMContentLoaded', () => Cart.init());
