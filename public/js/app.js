/**
 * OCH! SUSHI – Main Application Logic
 * Navigation, scroll animations, menu rendering, gallery lightbox, cookies
 */

let currentCategory = 'wszystko';
let isMenuExpanded = false;

document.addEventListener('DOMContentLoaded', () => {
  initNavbar();
  initScrollAnimations();
  initMenuFilters();
  
  // Attach menu grid delegation once
  const grid = document.getElementById('menu-grid');
  if (grid) {
    grid.addEventListener('click', function(e) {
      const btn = e.target.closest('.menu-card__add-btn');
      if (!btn) return;
      const id = parseInt(btn.dataset.id);
      const item = window.menuData.find(i => i.id === id);
      if (item) Cart.add(item);
    });
  }

  // Attach menu expand listener
  const expandBtn = document.getElementById('menu-expand-btn');
  if (expandBtn) {
    expandBtn.addEventListener('click', () => {
      isMenuExpanded = true;
      renderMenu(currentCategory);
      // Hide the expand container
      document.getElementById('menu-expand').style.display = 'none';
    });
  }

  renderMenu('wszystko');
  initGalleryLightbox();
  initCookieBanner();
  initDeliveryToggle();
});

/* ========== NAVBAR ========== */
function initNavbar() {
  const navbar = document.getElementById('navbar');
  const hamburger = document.getElementById('hamburger');
  const navLinks = document.getElementById('nav-links');

  // Scroll effect
  window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 50);
  });

  // Hamburger toggle
  hamburger.addEventListener('click', () => {
    hamburger.classList.toggle('active');
    navLinks.classList.toggle('open');
  });

  // Close mobile nav on link click
  navLinks.querySelectorAll('.navbar__link').forEach(link => {
    link.addEventListener('click', () => {
      hamburger.classList.remove('active');
      navLinks.classList.remove('open');
    });
  });

  // Smooth scroll for all anchor links
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', (e) => {
      const target = document.querySelector(anchor.getAttribute('href'));
      if (target) {
        e.preventDefault();
        const offset = 80;
        const top = target.getBoundingClientRect().top + window.scrollY - offset;
        window.scrollTo({ top, behavior: 'smooth' });
      }
    });
  });
}

/* ========== SCROLL ANIMATIONS ========== */
function initScrollAnimations() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('animate-in');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

  document.querySelectorAll('.animate-on-scroll').forEach(el => observer.observe(el));
}

/* ========== MENU FILTERS & RENDERING ========== */
function initMenuFilters() {
  const filtersContainer = document.getElementById('menu-filters');
  if (!filtersContainer || !window.menuCategories) return;

  window.menuCategories.forEach(cat => {
    const btn = document.createElement('button');
    btn.className = `menu-filter-btn${cat.id === 'wszystko' ? ' active' : ''}`;
    btn.textContent = cat.label;
    btn.dataset.category = cat.id;
    btn.addEventListener('click', () => {
      filtersContainer.querySelectorAll('.menu-filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      isMenuExpanded = false; // reset when changing category
      renderMenu(cat.id);
    });
    filtersContainer.appendChild(btn);
  });
}

function renderMenu(category) {
  currentCategory = category;
  const grid = document.getElementById('menu-grid');
  if (!grid || !window.menuData) return;

  const allItems = category === 'wszystko'
    ? window.menuData
    : window.menuData.filter(item => item.category === category);

  const showExpandBtn = !isMenuExpanded && allItems.length > 6;
  const items = showExpandBtn ? allItems.slice(0, 6) : allItems;

  const expandContainer = document.getElementById('menu-expand');
  if (expandContainer) {
    expandContainer.style.display = showExpandBtn ? 'block' : 'none';
  }

  grid.innerHTML = items.map(item => {
    const hasImg = item.image && item.image !== 'null';
    const imgBlock = hasImg ? `
      <div class="menu-card__img-wrap">
        <img src="${item.image}" alt="${item.name}" class="menu-card__img" loading="lazy">
        <span class="menu-card__category">${item.category}</span>
      </div>` : '';
    return `
    <div class="menu-card animate-on-scroll animate-in${hasImg ? '' : ' menu-card--no-img'}" data-id="${item.id}">
      ${imgBlock}
      <div class="menu-card__body">
        <div class="menu-card__header">
          <h3 class="menu-card__name">
            ${item.name}
            ${!hasImg ? `<span class="menu-card__category-inline">${item.category.replace('-', ' ')}</span>` : ''}
          </h3>
          <span class="menu-card__price">${item.price} PLN</span>
        </div>
        <p class="menu-card__desc">${item.description}</p>
        <div class="menu-card__footer">
          <button class="menu-card__add-btn" data-id="${item.id}">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Dodaj
          </button>
        </div>
      </div>
    </div>`;
  }).join('');
}

/* ========== GALLERY LIGHTBOX ========== */
function initGalleryLightbox() {
  const lightbox = document.getElementById('lightbox');
  const lightboxImg = document.getElementById('lightbox-img');
  const lightboxClose = document.getElementById('lightbox-close');

  document.querySelectorAll('.gallery-item').forEach(item => {
    item.addEventListener('click', () => {
      const src = item.dataset.full || item.querySelector('img').src;
      lightboxImg.src = src;
      lightbox.style.display = 'flex';
      document.body.style.overflow = 'hidden';
    });
  });

  const closeLightbox = () => {
    lightbox.style.display = 'none';
    document.body.style.overflow = '';
  };

  lightboxClose.addEventListener('click', closeLightbox);
  lightbox.addEventListener('click', (e) => {
    if (e.target === lightbox) closeLightbox();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (lightbox.style.display === 'flex') closeLightbox();
      if (document.body.classList.contains('cart-open')) Cart.closeSidebar();
      const checkoutModal = document.getElementById('checkout-modal');
      if (checkoutModal && checkoutModal.style.display === 'block') closeCheckoutModal();
    }
  });
}

/* ========== COOKIE BANNER ========== */
function initCookieBanner() {
  const banner = document.getElementById('cookie-banner');
  const acceptBtn = document.getElementById('cookie-accept');

  if (!localStorage.getItem('ochsushi_cookies_accepted')) {
    banner.style.display = 'block';
  }

  acceptBtn.addEventListener('click', () => {
    localStorage.setItem('ochsushi_cookies_accepted', 'true');
    banner.style.display = 'none';
  });
}

/* ========== DELIVERY TOGGLE ========== */
function initDeliveryToggle() {
  const radios = document.querySelectorAll('input[name="deliveryMethod"]');
  const addressGroup = document.getElementById('address-group');

  radios.forEach(radio => {
    radio.addEventListener('change', () => {
      if (addressGroup) {
        addressGroup.style.display = radio.value === 'delivery' ? 'block' : 'none';
      }
    });
  });
}
