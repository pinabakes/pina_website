class PinaBakesApp {
  constructor() {
    this.config = {
      whatsappNumber: '917678506669',
      storageKeys: { cart: 'pinabakes_cart', user: 'pinabakes_user', preferences: 'pinabakes_preferences', orders: 'pinabakes_orders' },
      apiEndpoints: { products: 'products.json' },
      coupons: { 'PINA10': { type: 'percent', value: 10 } },
      shippingCharge: 60,
      freeShippingThreshold: 999
    };

    this.state = {
      products: [],
      cart: [],
      user: null,
      currentProduct: null,
      isLoading: false,
      isMobileMenuOpen: false,
      isCartOpen: false,
      currentImageIndex: 0,
      appliedCoupon: null,
      isDragging: false,
      dragStartX: 0,
      dragDeltaX: 0
    };

    this.elements = {};
    this._trapHandler = null;
    this._savedFocus = null;

    this.init();
  }

  async init() {
    try {
      this.cacheElements();
      this.setupEventListeners();
      this.loadUserData();
      this.cart.load();
      await this.loadProducts();
      this.router.handleRoute();
      this.updateCurrentYear();
      this.setupIntersectionObserver();
      this.setupHeaderScrollEffect();
      this.setupYouTubeLazyLoad();
      this.ui.hideLoader();
      this.ui._applyOverlayPointerSafety();
    } catch (error) {
      console.error('App initialization failed:', error);
      this.ui.showToast('Failed to load application. Please refresh the page.', 'error');
    }
  }

  cacheElements() {
    this.elements = {
      header: document.getElementById('header'),
      mobileMenuToggle: document.querySelector('.mobile-menu-toggle'),
      mobileNav: document.querySelector('.mobile-nav'),
      mobileNavOverlay: document.querySelector('.mobile-nav-overlay'),
      navLinks: document.querySelectorAll('.nav-link'),
      cartButton: document.querySelector('.cart-button'),
      cartModal: document.getElementById('cart-modal'),
      cartOverlay: document.getElementById('cart-overlay'),
      cartCount: document.getElementById('cart-count'),
      cartItems: document.getElementById('cart-items'),
      cartTotal: document.getElementById('cart-total'),
      checkoutForm: document.getElementById('checkout-form'),
      couponCode: document.getElementById('coupon-code'),
      couponMsg: document.getElementById('coupon-msg'),
      cartSubtotal: document.getElementById('cart-subtotal'),
      cartDiscount: document.getElementById('cart-discount'),
      cartShipping: document.getElementById('cart-shipping'),
      productsGrid: document.getElementById('products-grid'),
      productDetail: document.getElementById('product-detail'),
      productMainImage: document.getElementById('product-main-image'),
      productThumbnails: document.getElementById('product-thumbnails'),
      productTitle: document.getElementById('product-title'),
      productPrice: document.getElementById('product-price'),
      productTagline: document.getElementById('product-tagline'),
      productFeatures: document.getElementById('product-features'),
      productIngredients: document.getElementById('product-ingredients'),
      nutritionTable: document.getElementById('nutrition-table'),
      addToCartDetail: document.getElementById('add-to-cart-detail'),
      toast: document.getElementById('toast'),
      currentYear: document.getElementById('current-year')
    };
  }

  setupEventListeners() {
    window.addEventListener('hashchange', () => this.router.handleRoute());
    window.addEventListener('popstate', () => this.router.handleRoute());
    document.addEventListener('keydown', this.handleKeyboardShortcuts.bind(this));
    if (this.elements.checkoutForm) {
      this.elements.checkoutForm.addEventListener('submit', (e) => { e.preventDefault(); this.checkout.proceed(); });
    }
    document.addEventListener('click', this.handleOutsideClick.bind(this));
    window.addEventListener('resize', this.debounce(this.handleResize.bind(this), 250));

    if (this.elements.productsGrid) {
      this.elements.productsGrid.addEventListener('click', (e) => {
        const viewLink = e.target.closest('a[href^="#/product/"]');
        if (viewLink) {
          e.preventDefault();
          const slug = viewLink.getAttribute('href').split('/').pop();
          this.router.navigate(`#/product/${slug}`);
          return;
        }
        const addBtn = e.target.closest('button[data-add-to-cart]');
        if (addBtn) {
          e.preventDefault();
          const slug = addBtn.getAttribute('data-slug');
          this.cart.add(slug);
        }
      });
    }

    if (this.elements.couponCode) {
      this.elements.couponCode.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') { e.preventDefault(); this.cart.applyCoupon(); }
      });
    }
    const couponBtn = document.getElementById('coupon-apply-btn');
    couponBtn?.addEventListener('click', (e) => { e.preventDefault(); this.cart.applyCoupon(); });

    const proceedBtn = document.getElementById('proceed-checkout');
    proceedBtn?.addEventListener('click', (e) => { e.preventDefault(); this.checkout.proceed(); });

    this.elements.productMainImage?.addEventListener('pointerdown', this.gallery.onPointerDown.bind(this));
    this.elements.productMainImage?.addEventListener('pointermove', this.gallery.onPointerMove.bind(this));
    this.elements.productMainImage?.addEventListener('pointerup', this.gallery.onPointerUp.bind(this));
    this.elements.productMainImage?.addEventListener('pointercancel', this.gallery.onPointerUp.bind(this));
    this.elements.productMainImage?.addEventListener('dragstart', (e) => e.preventDefault());
    if (this.elements.productMainImage) this.elements.productMainImage.style.touchAction = 'pan-y';

    this.elements.cartButton?.addEventListener('click', () => this.cart.toggle());
    document.querySelector('.cart-close')?.addEventListener('click', () => this.cart.close());
    this.elements.cartOverlay?.addEventListener('click', () => this.cart.close());

    this.elements.mobileMenuToggle?.addEventListener('click', () => this.ui.toggleMobileMenu());
    this.elements.mobileNavOverlay?.addEventListener('click', () => this.ui.closeMobileMenu());
    document.querySelector('.mobile-nav-close')?.addEventListener('click', () => this.ui.closeMobileMenu());
    document.querySelectorAll('.mobile-nav-link').forEach(a => a.addEventListener('click', () => this.ui.closeMobileMenu()));
  }

  handleKeyboardShortcuts(e) {
    if (e.key === 'Escape') this.ui.closeAllModals();
    if (this.state.currentProduct) {
      if (e.key === 'ArrowLeft') { e.preventDefault(); this.gallery.previousImage(); }
      if (e.key === 'ArrowRight') { e.preventDefault(); this.gallery.nextImage(); }
    }
  }

  handleOutsideClick(e) {
    if (this.state.isMobileMenuOpen &&
        !this.elements.mobileNav.contains(e.target) &&
        !this.elements.mobileMenuToggle.contains(e.target) &&
        !e.target.closest('.mobile-menu-toggle')) {
      this.ui.closeMobileMenu();
    }
  }

  setupIntersectionObserver() {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => { if (entry.isIntersecting) this.ui.updateActiveNavLink(entry.target.id); });
    }, { threshold: 0.1, rootMargin: '-50px' });
    document.querySelectorAll('section[id]').forEach(section => observer.observe(section));
  }

  setupHeaderScrollEffect() {
    window.addEventListener('scroll', this.throttle(() => {
      const y = window.scrollY;
      if (y > 100) this.elements.header.classList.add('scrolled');
      else this.elements.header.classList.remove('scrolled');
    }, 10));
  }

  setupYouTubeLazyLoad() {
    const wrappers = document.querySelectorAll('.video-wrapper[data-yt]');
    if (!wrappers.length) return;
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (!e.isIntersecting) return;
        const el = e.target;
        const id = el.dataset.yt;
        el.innerHTML = `<iframe src="https://www.youtube.com/embed/${id}" allowfullscreen loading="lazy" title="PiNa Bakes baking process" referrerpolicy="strict-origin-when-cross-origin"></iframe>`;
        io.unobserve(el);
      });
    }, { rootMargin: '200px' });
    wrappers.forEach(el => io.observe(el));
  }

  handleResize() {
    if (window.innerWidth > 768 && this.state.isMobileMenuOpen) this.ui.closeMobileMenu();
  }

  updateCurrentYear() {
    if (this.elements.currentYear) this.elements.currentYear.textContent = new Date().getFullYear();
  }

  debounce(func, wait) { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => func(...a), wait); }; }
  throttle(func, limit) { let inT; return (...a) => { if (!inT) { func(...a); inT = true; setTimeout(() => inT = false, limit); } }; }
  formatPrice(price) { return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(price); }
  esc(s) { return String(s).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])); }

  normalizeImages(product) {
    const out = [];
    if (Array.isArray(product.images)) out.push(...product.images.filter(Boolean));
    if (typeof product.images === 'string') out.push(...product.images.split(',').map(s => s.trim()).filter(Boolean));
    ['img','image','image1','image2','image3','image4','image5','image6'].forEach(k => { const v = product[k]; if (v && !out.includes(v)) out.push(v); });
    return out.length ? out : [product.img].filter(Boolean);
  }

  async loadProducts() {
    if (this.state.products.length > 0) return;
    this.state.isLoading = true;
    try {
      const response = await fetch(this.config.apiEndpoints.products, { headers: { 'Cache-Control': 'no-cache' } });
      if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      this.state.products = await response.json();
      this.ui.renderProducts();
    } catch (error) {
      console.error('Failed to load products:', error);
      this.ui.showError('Failed to load products. Please refresh the page to try again.');
    } finally {
      this.state.isLoading = false;
    }
  }

  loadUserData() {
    try {
      const userData = localStorage.getItem(this.config.storageKeys.user);
      if (userData) { this.state.user = JSON.parse(userData); this.checkout.populateForm(); }
    } catch (error) { console.error('Failed to load user data:', error); }
  }
  saveUserData(userData) {
    try { this.state.user = userData; localStorage.setItem(this.config.storageKeys.user, JSON.stringify(userData)); }
    catch (error) { console.error('Failed to save user data:', error); }
  }

  ui = {
    showToast: (message, type = 'info', duration = 3000) => {
      const toast = this.elements.toast; if (!toast) return;
      toast.textContent = message; toast.className = `toast show ${type}`;
      clearTimeout(this.toastTimeout);
      this.toastTimeout = setTimeout(() => toast.classList.remove('show'), duration);
    },
    hideLoader: () => { document.querySelectorAll('.skeleton').forEach(n => n.classList.remove('skeleton')); },
    showError: (m) => this.ui.showToast(m, 'error', 5000),
    toggleMobileMenu: () => this.state.isMobileMenuOpen ? this.ui.closeMobileMenu() : this.ui.openMobileMenu(),
    openMobileMenu: () => {
      this.state.isMobileMenuOpen = true;
      this.elements.mobileNav.classList.add('active');
      this.elements.mobileNavOverlay.classList.add('active');
      this.elements.mobileMenuToggle.classList.add('active');
      this.elements.mobileMenuToggle.setAttribute('aria-expanded', 'true');
      document.body.style.overflow = 'hidden';
      if (this.elements.mobileNavOverlay) this.elements.mobileNavOverlay.style.pointerEvents = 'auto';
    },
    closeMobileMenu: () => {
      this.state.isMobileMenuOpen = false;
      this.elements.mobileNav.classList.remove('active');
      this.elements.mobileNavOverlay.classList.remove('active');
      this.elements.mobileMenuToggle.classList.remove('active');
      this.elements.mobileMenuToggle.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
      if (this.elements.mobileNavOverlay) this.elements.mobileNavOverlay.style.pointerEvents = 'none';
    },
    closeAllModals: () => { this.ui.closeMobileMenu(); this.cart.close(); },
    updateActiveNavLink: (activeId) => {
      this.elements.navLinks.forEach(link => {
        const href = link.getAttribute('href').substring(1);
        link.classList.toggle('active', href === activeId);
      });
    },
    _applyOverlayPointerSafety: () => {
      if (this.elements.mobileNavOverlay && !this.state.isMobileMenuOpen) this.elements.mobileNavOverlay.style.pointerEvents = 'none';
      if (this.elements.cartOverlay && !this.state.isCartOpen) this.elements.cartOverlay.style.pointerEvents = 'none';
    }
  };

  gallery = {
    setup: (product) => {
      const images = this.normalizeImages(product);
      this.state.currentImageIndex = 0;
      this.gallery.updateMainImage(images[0], product.name, null);
      this.gallery.renderThumbnails(images, product.name);
    },
    updateMainImage: (src, productName, direction) => {
      const img = this.elements.productMainImage;
      if (!img) return;
      img.style.transition = 'none';
      img.style.transform = direction === 'next' ? 'translateX(40px)' : direction === 'prev' ? 'translateX(-40px)' : 'translateX(0)';
      img.style.opacity = '0.1';
      requestAnimationFrame(() => {
        img.src = src;
        img.alt = `${productName} cookies - Image ${this.state.currentImageIndex + 1}`;
        img.width = 800; img.height = 800;
        img.style.transition = 'transform 250ms ease, opacity 250ms ease';
        img.style.transform = 'translateX(0)';
        img.style.opacity = '1';
      });
    },
    renderThumbnails: (images, productName) => {
      if (!this.elements.productThumbnails) return;
      this.elements.productThumbnails.innerHTML = images.map((image, index) => `
        <img src="${image}" alt="${this.esc(productName)} - Thumbnail ${index + 1}"
             class="product-thumbnail ${index === 0 ? 'active' : ''}"
             loading="lazy" width="80" height="80"
             onclick="App.gallery.selectImage(${index})">
      `).join('');
    },
    selectImage: (index) => {
      if (!this.state.currentProduct) return;
      const images = this.normalizeImages(this.state.currentProduct);
      if (index >= 0 && index < images.length) {
        const dir = index > this.state.currentImageIndex ? 'next' : 'prev';
        this.state.currentImageIndex = index;
        this.gallery.updateMainImage(images[index], this.state.currentProduct.name, dir);
        this.gallery.updateActiveThumbnail(index);
      }
    },
    updateActiveThumbnail: (activeIndex) => {
      const thumbs = this.elements.productThumbnails?.querySelectorAll('.product-thumbnail') || [];
      thumbs.forEach((t, i) => t.classList.toggle('active', i === activeIndex));
    },
    nextImage: () => {
      if (!this.state.currentProduct) return;
      const images = this.normalizeImages(this.state.currentProduct);
      const nextIndex = (this.state.currentImageIndex + 1) % images.length;
      this.state.currentImageIndex = nextIndex;
      this.gallery.updateMainImage(images[nextIndex], this.state.currentProduct.name, 'next');
      this.gallery.updateActiveThumbnail(nextIndex);
    },
    previousImage: () => {
      if (!this.state.currentProduct) return;
      const images = this.normalizeImages(this.state.currentProduct);
      const prevIndex = (this.state.currentImageIndex - 1 + images.length) % images.length;
      this.state.currentImageIndex = prevIndex;
      this.gallery.updateMainImage(images[prevIndex], this.state.currentProduct.name, 'prev');
      this.gallery.updateActiveThumbnail(prevIndex);
    },
    onPointerDown: (e) => {
      if (!this.elements.productMainImage) return;
      this.state.isDragging = true;
      this.state.dragStartX = e.clientX;
      this.state.dragDeltaX = 0;
      this.elements.productMainImage.setPointerCapture?.(e.pointerId);
      document.body.style.userSelect = 'none';
    },
    onPointerMove: (e) => {
      if (!this.state.isDragging || !this.elements.productMainImage) return;
      this.state.dragDeltaX = e.clientX - this.state.dragStartX;
      const t = Math.max(-80, Math.min(80, this.state.dragDeltaX));
      this.elements.productMainImage.style.transform = `translateX(${t}px)`;
      this.elements.productMainImage.style.transition = 'none';
    },
    onPointerUp: () => {
      if (!this.elements.productMainImage) return;
      const threshold = 60;
      const delta = this.state.dragDeltaX;
      this.state.isDragging = false;
      document.body.style.userSelect = '';
      if (delta > threshold) this.gallery.previousImage();
      else if (delta < -threshold) this.gallery.nextImage();
      this.elements.productMainImage.style.transition = 'transform 200ms ease';
      this.elements.productMainImage.style.transform = 'translateX(0)';
      this.state.dragDeltaX = 0;
    }
  };

  cart = {
    load: () => {
      try {
        const savedCart = localStorage.getItem(this.config.storageKeys.cart);
        this.state.cart = savedCart ? JSON.parse(savedCart) : [];
        this.cart.render();
      } catch (error) { console.error('Failed to load cart:', error); this.state.cart = []; }
    },
    save: () => {
      try { localStorage.setItem(this.config.storageKeys.cart, JSON.stringify(this.state.cart)); }
      catch (error) { console.error('Failed to save cart:', error); }
    },
    add: (productSlug, quantity = 1) => {
      const product = this.state.products.find(p => p.slug === productSlug);
      if (!product) return this.ui.showError('Product not found');
      const existing = this.state.cart.find(i => i.slug === productSlug);
      if (existing) existing.quantity += quantity;
      else this.state.cart.push({ ...product, quantity });
      this.cart.save(); this.cart.render();
      this.ui.showToast(`${product.name} added to cart!`);
      this.cart.animateCartButton();
    },
    remove: (slug) => { this.state.cart = this.state.cart.filter(i => i.slug !== slug); this.cart.save(); this.cart.render(); this.ui.showToast('Item removed from cart'); },
    updateQuantity: (slug, qty) => {
      if (qty <= 0) return this.cart.remove(slug);
      const item = this.state.cart.find(i => i.slug === slug);
      if (item) { item.quantity = qty; this.cart.save(); this.cart.render(); }
    },
    clear: () => { this.state.cart = []; this.cart.save(); this.cart.render(); this.ui.showToast('Cart cleared'); },
    getSubtotal: () => this.state.cart.reduce((t, i) => t + (i.price * i.quantity), 0),
    getDiscount: (subtotal) => {
      const c = this.state.appliedCoupon;
      if (!c) return 0;
      if (c.type === 'percent') return Math.round((subtotal * c.value) / 100);
      return 0;
    },
    getShipping: (subtotalAfterDiscount) => {
      return subtotalAfterDiscount >= this.config.freeShippingThreshold ? 0 : this.config.shippingCharge;
    },
    getTotal: () => {
      const sub = this.cart.getSubtotal();
      const disc = this.cart.getDiscount(sub);
      const ship = this.cart.getShipping(Math.max(0, sub - disc));
      return Math.max(0, sub - disc + ship);
    },
    applyCoupon: () => {
      const input = this.elements.couponCode;
      const code = (input?.value || '').trim().toUpperCase();
      if (!code) { this.state.appliedCoupon = null; this.cart.render(); return; }
      const def = this.config.coupons[code];
      if (!def) {
        this.state.appliedCoupon = null;
        this.cart.render();
        this.ui.showToast('Invalid coupon code', 'error');
        if (this.elements.couponMsg) this.elements.couponMsg.textContent = 'Invalid code';
        return;
      }
      this.state.appliedCoupon = { code, ...def };
      this.cart.render();
      this.ui.showToast(`Coupon applied: ${code} (${def.value}% off)`, 'success');
      if (this.elements.couponMsg) this.elements.couponMsg.textContent = `Applied ${code}: ${def.value}% off`;
    },
    render: () => {
      const itemCount = this.state.cart.reduce((c, i) => c + i.quantity, 0);
      if (this.elements.cartCount) {
        this.elements.cartCount.textContent = itemCount;
        this.elements.cartCount.style.display = itemCount > 0 ? 'flex' : 'none';
      }
      if (this.elements.cartItems) {
        if (this.state.cart.length === 0) {
          this.elements.cartItems.innerHTML = `
            <div style="text-align:center; padding:3rem 1rem; color:var(--text-secondary);">
              <svg width="64" height="64" fill="none" stroke="currentColor" viewBox="0 0 24 24" style="margin-bottom:1rem; opacity:.5;">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5m6.5-5v6a2 2 0 11-4 0v-6m4 0V9a2 2 0 10-4 0v4.01"/>
              </svg>
              <p>Your cart is empty</p>
              <button class="btn btn-primary" onclick="App.cart.close(); App.router.navigate('products');">Browse Products</button>
            </div>`;
        } else {
          this.elements.cartItems.innerHTML = this.state.cart.map(item => `
            <div class="cart-item">
              <img src="${item.img}" alt="${this.esc(item.name)}" class="cart-item-image" width="60" height="60">
              <div class="cart-item-details">
                <div class="cart-item-title">${this.esc(item.name)}</div>
                <div class="cart-item-price">${this.formatPrice(item.price)}</div>
                <div class="cart-item-actions">
                  <button class="quantity-btn" onclick="App.cart.updateQuantity('${this.esc(item.slug)}', ${item.quantity - 1})" aria-label="Decrease quantity">-</button>
                  <span style="min-width:2rem; text-align:center;">${item.quantity}</span>
                  <button class="quantity-btn" onclick="App.cart.updateQuantity('${this.esc(item.slug)}', ${item.quantity + 1})" aria-label="Increase quantity">+</button>
                </div>
              </div>
              <div style="text-align:right;">
                <div style="font-weight:600;">${this.formatPrice(item.price * item.quantity)}</div>
                <button onclick="App.cart.remove('${this.esc(item.slug)}')" style="color:#dc2626; background:none; border:none; cursor:pointer; margin-top:.5rem; font-size:.875rem;" aria-label="Remove ${this.esc(item.name)} from cart">Remove</button>
              </div>
            </div>
          `).join('');
        }
      }
      const subtotal = this.cart.getSubtotal();
      const discount = this.cart.getDiscount(subtotal);
      const shipping = this.cart.getShipping(Math.max(0, subtotal - discount));
      const total = Math.max(0, subtotal - discount + shipping);

      if (this.elements.cartSubtotal) this.elements.cartSubtotal.textContent = this.formatPrice(subtotal);
      if (this.elements.cartDiscount) {
        this.elements.cartDiscount.textContent = discount > 0
          ? `- ${this.formatPrice(discount)} (${this.state.appliedCoupon?.code})` : this.formatPrice(0);
      }
      if (this.elements.cartShipping) {
        this.elements.cartShipping.textContent = shipping === 0 ? 'Free' : this.formatPrice(shipping);
      }
      if (this.elements.cartTotal) this.elements.cartTotal.textContent = this.formatPrice(total);

      if (this.elements.checkoutForm) {
        this.elements.checkoutForm.style.display = this.state.cart.length > 0 ? 'block' : 'none';
      }
    },
    toggle: () => this.state.isCartOpen ? this.cart.close() : this.cart.open(),
    open: () => {
      this.state.isCartOpen = true;
      this.elements.cartModal.classList.add('active');
      this.elements.cartOverlay.classList.add('active');
      if (this.elements.cartOverlay) this.elements.cartOverlay.style.pointerEvents = 'auto';
      document.body.style.overflow = 'hidden';
      this._savedFocus = document.activeElement;
      const focusable = this.elements.cartModal.querySelector('button, a, input, textarea, [tabindex]:not([tabindex="-1"])');
      focusable?.focus();
      this._trapHandler = (e) => {
        if (e.key !== 'Tab') return;
        const nodes = [...this.elements.cartModal.querySelectorAll('button, a, input, textarea, [tabindex]:not([tabindex="-1"])')].filter(n => !n.disabled && n.offsetParent);
        if (!nodes.length) return;
        let i = nodes.indexOf(document.activeElement);
        if (e.shiftKey && (i <= 0)) { nodes[nodes.length - 1].focus(); e.preventDefault(); }
        else if (!e.shiftKey && (i === nodes.length - 1)) { nodes[0].focus(); e.preventDefault(); }
      };
      document.addEventListener('keydown', this._trapHandler);
    },
    close: () => {
      this.state.isCartOpen = false;
      this.elements.cartModal.classList.remove('active');
      this.elements.cartOverlay.classList.remove('active');
      if (this.elements.cartOverlay) this.elements.cartOverlay.style.pointerEvents = 'none';
      document.body.style.overflow = '';
      if (this._trapHandler) document.removeEventListener('keydown', this._trapHandler);
      if (this._savedFocus) this._savedFocus.focus();
    },
    animateCartButton: () => {
      if (this.elements.cartCount) {
        this.elements.cartCount.style.animation = 'none';
        setTimeout(() => { this.elements.cartCount.style.animation = 'cartBounce 0.3s ease'; }, 10);
      }
    }
  };

  checkout = {
    populateForm: () => {
      if (!this.state.user || !this.elements.checkoutForm) return;
      ['name', 'phone', 'pincode', 'city', 'address', 'notes'].forEach(field => {
        const el = document.getElementById(`customer-${field}`);
        if (el && this.state.user[field]) el.value = this.state.user[field];
      });
    },
    validateForm: () => {
      const phoneField = document.getElementById('customer-phone');
      if (phoneField) {
        const digits = phoneField.value.replace(/\D/g, '');
        if (digits && (digits.length < 10 || digits.length > 12)) {
          this.ui.showToast('Phone looks unusual (optional): please check.', 'info');
        }
      }
      const pincodeField = document.getElementById('customer-pincode');
      if (pincodeField) {
        const pin = pincodeField.value.trim();
        if (pin && !/^\d{6}$/.test(pin)) {
          this.ui.showToast('Pincode format looks unusual (optional).', 'info');
        }
      }
      return true;
    },
    clearErrors: () => {},
    handleFormSubmit: (e) => { e.preventDefault(); this.checkout.proceed(); },
    proceed: () => {
      if (this.state.cart.length === 0) return this.ui.showToast('Your cart is empty!', 'error');
      if (!this.checkout.validateForm()) return;

      const formData = {
        name: document.getElementById('customer-name')?.value.trim() || '',
        phone: document.getElementById('customer-phone')?.value.trim() || '',
        pincode: document.getElementById('customer-pincode')?.value.trim() || '',
        city: document.getElementById('customer-city')?.value.trim() || '',
        address: document.getElementById('customer-address')?.value.trim() || '',
        notes: document.getElementById('customer-notes')?.value.trim() || ''
      };
      this.saveUserData(formData);

      const subtotal = this.cart.getSubtotal();
      const discount = this.cart.getDiscount(subtotal);
      const shipping = this.cart.getShipping(Math.max(0, subtotal - discount));
      const total = this.cart.getTotal();
      const itemsList = this.state.cart.map(i => `• ${i.name} (×${i.quantity}) - ${this.formatPrice(i.price * i.quantity)}`).join('\n');

      const order = {
        id: `PIN${Date.now()}`,
        createdAt: new Date().toISOString(),
        coupon: this.state.appliedCoupon?.code || '',
        subtotal,
        discount,
        shipping,
        total,
        customer: formData,
        items: this.state.cart.map(i => ({ slug: i.slug, name: i.name, qty: i.quantity, price: i.price }))
      };

      try {
        const key = this.config.storageKeys.orders;
        const prev = JSON.parse(localStorage.getItem(key) || '[]');
        prev.push(order);
        localStorage.setItem(key, JSON.stringify(prev));
      } catch (e) { console.warn('Could not persist orders locally:', e); }

      this.checkout.downloadOrderCSV(order);

      const message = this.checkout.generateWhatsAppMessage(order, itemsList);
      const whatsappUrl = `https://wa.me/${this.config.whatsappNumber}?text=${encodeURIComponent(message)}`;
      window.open(whatsappUrl, '_blank');
      this.ui.showToast('Redirecting to WhatsApp...', 'success');
    },
    generateWhatsAppMessage: (order, itemsList) => {
      const lines = [
        `🍪 *PiNa Bakes Order Request*`,
        ``,
        `*Items Ordered:*`,
        itemsList,
        ``,
        `*Subtotal:* ${this.formatPrice(order.subtotal)}`
      ];
      if (order.discount > 0) lines.push(`*Discount (${order.coupon}):* -${this.formatPrice(order.discount)}`);
      lines.push(`*Shipping:* ${order.shipping === 0 ? 'Free' : this.formatPrice(order.shipping)}`);
      lines.push(`*Total Amount:* ${this.formatPrice(order.total)}`, ``);
      const c = order.customer;
      lines.push(`*Customer Details:*`,
        `👤 Name: ${c.name || '—'}`,
        `📱 Phone: ${c.phone || '—'}`,
        `📮 Pincode: ${c.pincode || '—'}`,
        `🏙️ City: ${c.city || '—'}`,
        `🏠 Address: ${c.address || '—'}`,
        `📝 Notes: ${c.notes || '—'}`,
        ``,
        `Thank you for choosing PiNa Bakes! 🙏`,
        `Please confirm the order and let me know the delivery timeline.`
      );
      return lines.join('\n');
    },
    downloadOrderCSV: (order) => {
      const headers = [
        'OrderID','DateTimeISO','Coupon','Subtotal','Discount','Shipping','Total',
        'CustName','CustPhone','CustPincode','CustCity','CustAddress','CustNotes',
        'Items'
      ];
      const itemsStr = order.items.map(i => `${i.name} x${i.qty} @ ${i.price}`).join(' | ');
      const row = [
        order.id, order.createdAt, order.coupon, order.subtotal, order.discount, order.shipping, order.total,
        order.customer.name, order.customer.phone, order.customer.pincode, order.customer.city,
        order.customer.address, order.customer.notes, itemsStr
      ];
      const esc = (v) => { const s = String(v ?? ''); return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
      const csv = headers.join(',') + '\n' + row.map(esc).join(',');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const stamp = new Date().toISOString().replace(/[:.]/g,'-');
      a.href = url; a.download = `pina-order-${stamp}.csv`;
      document.body.appendChild(a); a.click(); a.remove();
      URL.revokeObjectURL(url);
    }
  };

  router = {
    handleRoute: () => {
      const hash = window.location.hash || '#home';
      const m = hash.match(/^#\/product\/([^?#]+)/);
      if (m && m[1]) { this.router.showProduct(decodeURIComponent(m[1])); return; }
      const sectionId = hash.replace(/^#/, '') || 'home';
      this.router.showSection(sectionId);
    },
    navigate: (path) => {
      if (path.startsWith('#')) window.location.hash = path;
      else if (path.startsWith('/')) window.location.hash = `#${path}`;
      else window.location.hash = `#${path}`;
    },
    showProduct: async (slug) => {
      await this.loadProducts();
      if (!Array.isArray(this.state.products) || !this.state.products.length) return this.ui.showError('Products not loaded yet.');
      const product = this.state.products.find(p => String(p.slug) === String(slug));
      if (!product) { this.ui.showError(`Product not found: ${slug}`); this.router.navigate('products'); return; }
      this.ui.renderProductDetail(product);
      this.injectProductSchemas(product);
    },
    showSection: (id) => {
      this.ui.hideProductDetail();
      if (id && id !== 'home') {
        const el = document.getElementById(id);
        el ? el.scrollIntoView({ behavior: 'smooth' }) : window.scrollTo({ top: 0, behavior: 'smooth' });
      } else { window.scrollTo({ top: 0, behavior: 'smooth' }); }
    }
  };

  isNewProduct(product) { return !!product.isNew; }

  uiRenderProductsSchema() {
    const itemList = {
      "@context": "https://schema.org",
      "@type": "ItemList",
      "itemListElement": this.state.products.map((p, idx) => ({
        "@type": "Product",
        "name": p.name,
        "image": this.normalizeImages(p).map(src => new URL(src, location.href).href),
        "description": p.tagline,
        "brand": {"@type":"Brand","name":"PiNa Bakes"},
        "sku": p.slug,
        "offers": {
          "@type":"Offer",
          "priceCurrency":"INR",
          "price": String(p.price),
          "availability":"https://schema.org/InStock",
          "url": `${location.origin}${location.pathname}#/product/${encodeURIComponent(p.slug)}`
        },
        "position": idx + 1
      }))
    };
    const n = document.getElementById('schema-products');
    if (n) n.textContent = JSON.stringify(itemList);
  }

  injectProductSchemas(product) {
    const productSchema = {
      "@context":"https://schema.org",
      "@type":"Product",
      "name": product.name,
      "image": this.normalizeImages(product).map(src => new URL(src, location.href).href),
      "description": product.tagline,
      "brand": {"@type":"Brand","name":"PiNa Bakes"},
      "sku": product.slug,
      "offers": {
        "@type":"Offer",
        "priceCurrency":"INR",
        "price": String(product.price),
        "availability":"https://schema.org/InStock",
        "url": `${location.origin}${location.pathname}#/product/${encodeURIComponent(product.slug)}`
      }
    };
    const breadcrumbs = {
      "@context":"https://schema.org",
      "@type":"BreadcrumbList",
      "itemListElement":[
        {"@type":"ListItem","position":1,"name":"Products","item":`${location.origin}${location.pathname}#products`},
        {"@type":"ListItem","position":2,"name":product.name,"item":`${location.origin}${location.pathname}#/product/${encodeURIComponent(product.slug)}`}
      ]
    };
    const ps = document.getElementById('schema-product');
    const bc = document.getElementById('schema-breadcrumbs');
    if (ps) ps.textContent = JSON.stringify(productSchema);
    if (bc) bc.textContent = JSON.stringify(breadcrumbs);
  }

  ui = { ...this.ui, ...{
    renderProducts: () => {
      if (!this.elements.productsGrid) return;
      const html = this.state.products.map(product => {
        const images = this.normalizeImages(product);
        const coverImage = images[0] || product.img;
        const isNew = this.isNewProduct(product);
        const isPremium = product.price >= 300;
        const name = this.esc(product.name);
        const tagline = this.esc(product.tagline);
        const slug = this.esc(product.slug);
        const price = this.formatPrice(product.price);
        const alt = `${name} cookies by PiNa Bakes`;
        return `
          <article class="product-card" data-product-id="${slug}">
            <div class="product-image-container">
              <img src="${coverImage}" alt="${alt}" class="product-image" loading="lazy" decoding="async" width="600" height="600">
              ${isNew ? '<span class="product-badge">New</span>' : ''}
              ${isPremium ? '<span class="product-badge" style="top: 3rem;">Premium</span>' : ''}
            </div>
            <div class="product-content">
              <h3 class="product-title">${name}</h3>
              <div class="product-price">${price}</div>
              <p class="product-tagline">${tagline}</p>
              <div class="product-actions">
                <a href="#/product/${slug}" class="btn btn-secondary">View Details</a>
                <button class="btn btn-primary" data-add-to-cart data-slug="${slug}" aria-label="Add ${name} to cart">Add to Cart</button>
              </div>
            </div>
          </article>
        `;
      }).join('');
      this.elements.productsGrid.innerHTML = html;
      this.uiRenderProductsSchema();
    },
    renderProductDetail: (product) => {
      if (!product || !this.elements.productDetail) return;
      this.state.currentProduct = product;
      this.elements.productTitle.textContent = product.name;
      this.elements.productPrice.textContent = this.formatPrice(product.price);
      this.elements.productTagline.textContent = product.tagline;
      this.gallery.setup(product);
      if (product.bullets && product.bullets.length > 0) {
        this.elements.productFeatures.innerHTML = `
          <h3>Key Features</h3>
          <ul>${product.bullets.map(b => `<li>${this.esc(b)}</li>`).join('')}</ul>`;
      } else { this.elements.productFeatures.innerHTML = ''; }
      if (product.ingredients && product.ingredients.length > 0) {
        this.elements.productIngredients.innerHTML = product.ingredients.map(ing => `<li>${this.esc(ing)}</li>`).join('');
      }
      this.ui.renderNutritionInfo(product);
      if (this.elements.addToCartDetail) {
        this.elements.addToCartDetail.replaceWith(this.elements.addToCartDetail.cloneNode(true));
        const btn = document.getElementById('add-to-cart-detail');
        btn.addEventListener('click', () => this.cart.add(product.slug));
      }
      this.elements.productDetail.style.display = 'block';
      document.querySelectorAll('main > section').forEach(s => { if (s.id !== 'product-detail') s.style.display = 'none'; });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    renderNutritionInfo: (product) => {
      const n = product.nutrition || { energy:'— kcal', protein:'— g', fat:'— g', carbs:'— g', sugar:'— g', fibre:'— g', sodium:'— mg' };
      const rows = [['Energy', n.energy],['Protein', n.protein],['Total Fat', n.fat],['Carbohydrates', n.carbs],['Added Sugar', n.sugar],['Dietary Fibre', n.fibre],['Sodium', n.sodium]];
      this.elements.nutritionTable.innerHTML = rows.map(([k,v]) => `
        <tr><td style="padding: .75rem; border: 1px solid #dee2e6;">${this.esc(k)}</td>
            <td style="padding: .75rem; border: 1px solid #dee2e6;">${this.esc(v)}</td></tr>`).join('');
    },
    hideProductDetail: () => {
      document.querySelectorAll('main > section').forEach(s => { if (s.id !== 'product-detail') s.style.display = 'block'; });
      if (this.elements.productDetail) this.elements.productDetail.style.display = 'none';
      this.state.currentProduct = null;
    }
  }};
}

const App = new PinaBakesApp();
window.App = App;

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js')
      .then(reg => console.log('SW registered:', reg))
      .catch(err => console.log('SW registration failed:', err));
  });
}
