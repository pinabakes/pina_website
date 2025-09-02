// app.js
class PinaBakesApp {
  constructor() {
    this.config = {
      // Google Apps Script "Web App" endpoint (Deploy > Test deployments OR Manage deployments)
      orderWebhook: 'https://script.google.com/macros/s/AKfycbwR_3cz5m-FOJertmmRos7-Zc7nundBbNTJ0HuZoLPZ9gHuDwxNO9Th4ThXIru_Kztc/exec',
      whatsappNumber: '917678506669',
      storageKeys: {
        cart: 'pinabakes_cart',
        user: 'pinabakes_user',
        preferences: 'pinabakes_preferences',
        orders: 'pinabakes_orders',
        wishlist: 'pinabakes_wishlist'
      },
      apiEndpoints: {
        // If your file lives elsewhere, change to 'assets/data/products.json' (example)
        products: 'products.json'
      },
      coupons: { PINA10: { type: 'percent', value: 10 } },
      shippingCharge: 60,
      freeShippingThreshold: 999
    };

    this.state = {
      products: [],
      cart: [],
      wishlist: [],
      user: null,
      currentProduct: null,
      isLoading: false,
      isMobileMenuOpen: false,
      isCartOpen: false,
      isWishlistOpen: false,
      currentImageIndex: 0,
      appliedCoupon: null,
      isDragging: false,
      dragStartX: 0,
      dragDeltaX: 0
    };

    this.elements = {};
    this.init();
  }

  async init() {
    try {
      this.cacheElements();
      this.telemetry.ensureSession();
      this.backend.sendVisit();

      this.setupEventListeners();
      this.loadUserData();
      this.cart.load();
      this.wishlist.load();

      await this.loadProducts();
      this.router.handleRoute();
      this.updateCurrentYear();
      this.setupIntersectionObserver();
      this.setupHeaderScrollEffect();
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
      shippingNote: document.getElementById('shipping-note'),

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
      addToWishlistDetail: document.getElementById('add-to-wishlist-detail'),

      toast: document.getElementById('toast'),
      currentYear: document.getElementById('current-year'),

      wishlistModal: document.getElementById('wishlist-modal'),
      wishlistOverlay: document.getElementById('wishlist-overlay'),
      wishlistCount: document.getElementById('wishlist-count'),
      wishlistItems: document.getElementById('wishlist-items')
    };
  }

  setupEventListeners() {
    window.addEventListener('hashchange', () => this.router.handleRoute());
    window.addEventListener('popstate', () => this.router.handleRoute());
    document.addEventListener('keydown', this.handleKeyboardShortcuts.bind(this));
    document.addEventListener('click', this.handleOutsideClick.bind(this));
    window.addEventListener('resize', this.debounce(this.handleResize.bind(this), 250));

    if (this.elements.checkoutForm) {
      this.elements.checkoutForm.addEventListener('submit', this.checkout.handleFormSubmit.bind(this));
    }

    if (this.elements.productsGrid) {
      this.elements.productsGrid.addEventListener('click', (e) => {
        const link = e.target.closest('a[href^="#/product/"]');
        if (!link) return;
        e.preventDefault();
        const slug = link.getAttribute('href').split('/').pop();
        this.router.navigate(`#/product/${slug}`);
      });
    }

    if (this.elements.couponCode) {
      this.elements.couponCode.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') { e.preventDefault(); this.cart.applyCoupon(); }
      });
    }

    if (this.elements.productMainImage) {
      const img = this.elements.productMainImage;
      img.style.touchAction = 'pan-y';
      img.addEventListener('pointerdown', this.gallery.onPointerDown.bind(this));
      img.addEventListener('pointermove', this.gallery.onPointerMove.bind(this));
      img.addEventListener('pointerup', this.gallery.onPointerUp.bind(this));
      img.addEventListener('pointercancel', this.gallery.onPointerUp.bind(this));
      img.addEventListener('dragstart', (e) => e.preventDefault());
    }
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
        !this.elements.mobileMenuToggle.contains(e.target)) {
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

  handleResize() {
    if (window.innerWidth > 768 && this.state.isMobileMenuOpen) this.ui.closeMobileMenu();
  }

  updateCurrentYear() {
    if (this.elements.currentYear) this.elements.currentYear.textContent = new Date().getFullYear();
  }

  debounce(func, wait) {
    let timeout;
    return (...args) => { clearTimeout(timeout); timeout = setTimeout(() => func(...args), wait); };
  }

  throttle(func, limit) {
    let inThrottle;
    return (...args) => {
      if (!inThrottle) { func(...args); inThrottle = true; setTimeout(() => inThrottle = false, limit); }
    };
  }

  formatPrice(price) {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(price);
  }

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
      const url = this.config.apiEndpoints.products;
      const res = await fetch(url, { cache: 'no-store', headers: { 'Cache-Control': 'no-cache' } });
      if (!res.ok) throw new Error(`Fetch ${url} failed: ${res.status} ${res.statusText}`);

      const data = await res.json();
      const arr = Array.isArray(data) ? data : (Array.isArray(data.products) ? data.products : []);
      if (!arr.length) throw new Error('No products found in JSON. Expected an array or { "products": [...] }.');

      this.state.products = arr.map((p, idx) => ({
        name: p.name ?? `Product ${idx + 1}`,
        price: Number(p.price ?? 0),
        tagline: p.tagline ?? '',
        img: p.img ?? p.image ?? (Array.isArray(p.images) ? p.images[0] : ''),
        images: p.images ?? [],
        slug: p.slug ?? (p.name ? p.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9\-]/g,'') : `p-${idx}`),
        bullets: p.bullets ?? [],
        ingredients: p.ingredients ?? [],
        nutrition: p.nutrition ?? undefined,
      }));

      this.ui.renderProducts();
    } catch (error) {
      console.error('Failed to load products:', error);
      this.ui.showError(String(error));
      if (this.elements.productsGrid) {
        this.elements.productsGrid.innerHTML =
          `<div style="padding:1rem;color:#b91c1c;background:#fee2e2;border:1px solid #fecaca;border-radius:8px;">
             Could not load products: ${String(error)}
           </div>`;
      }
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
      this.ui.lockScroll();
      if (this.elements.mobileNavOverlay) this.elements.mobileNavOverlay.style.pointerEvents = 'auto';
    },
    closeMobileMenu: () => {
      this.state.isMobileMenuOpen = false;
      this.elements.mobileNav.classList.remove('active');
      this.elements.mobileNavOverlay.classList.remove('active');
      this.elements.mobileMenuToggle.classList.remove('active');
      this.elements.mobileMenuToggle.setAttribute('aria-expanded', 'false');
      this.ui.unlockScroll();
      if (this.elements.mobileNavOverlay) this.elements.mobileNavOverlay.style.pointerEvents = 'none';
    },
    closeAllModals: () => { this.ui.closeMobileMenu(); this.cart.close(); this.wishlist.close(); },

    lockScroll: () => {
      if (document.body.dataset.locked === '1') return;
      const scrollY = window.scrollY || document.documentElement.scrollTop || 0;
      document.body.dataset.locked = '1';
      document.body.dataset.scrollY = String(scrollY);
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.left = '0';
      document.body.style.right = '0';
      document.body.style.width = '100%';
    },
    unlockScroll: () => {
      if (document.body.dataset.locked !== '1') return;
      const y = parseInt(document.body.dataset.scrollY || '0', 10);
      document.body.dataset.locked = '0';
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.left = '';
      document.body.style.right = '';
      document.body.style.width = '';
      window.scrollTo(0, y);
    },

    updateActiveNavLink: (activeId) => {
      this.elements.navLinks.forEach(link => {
        const href = link.getAttribute('href').substring(1);
        link.classList.toggle('active', href === activeId);
      });
    },

    renderProducts: () => {
      if (!this.elements.productsGrid) return;
      const productsHTML = this.state.products.map(product => {
        const images = this.normalizeImages(product);
        const coverImage = images[0] || product.img;
        const isNew = this.isNewProduct(product);
        const isPremium = product.price >= 300;
        return `
          <article class="product-card" data-product-id="${product.slug}">
            <div class="product-image-container">
              <img src="${coverImage}" alt="${product.name} cookies by PiNa Bakes" class="product-image" loading="lazy" decoding="async">
              ${isNew ? '<span class="product-badge">New</span>' : ''}
              ${isPremium ? '<span class="product-badge" style="top: 3rem;">Premium</span>' : ''}
            </div>
            <div class="product-content">
              <h3 class="product-title">${product.name}</h3>
              <div class="product-price">${this.formatPrice(product.price)}</div>
              <p class="product-tagline">${product.tagline}</p>
              <div class="product-actions">
                <a href="#/product/${product.slug}" class="btn btn-secondary">View Details</a>
                <button class="btn btn-primary" onclick="App.cart.add('${product.slug}')" aria-label="Add ${product.name} to cart">Add to Cart</button>
                <button class="btn btn-outline" onclick="App.wishlist.add('${product.slug}')" aria-label="Add ${product.name} to wishlist">Wishlist</button>
              </div>
            </div>
          </article>
        `;
      }).join('');
      this.elements.productsGrid.innerHTML = productsHTML;
    },

    renderProductDetail: (product) => {
      if (!product || !this.elements.productDetail) return;
      this.state.currentProduct = product;

      this.elements.productTitle.textContent = product.name;
      this.elements.productPrice.textContent = this.formatPrice(product.price);
      this.elements.productTagline.textContent = product.tagline;

      this.gallery.setup(product);

      if (product.bullets && product.bullets.length > 0) {
        this.elements.productFeatures.innerHTML =
          `<h3>Key Features</h3><ul>${product.bullets.map(b => `<li>${b}</li>`).join('')}</ul>`;
      } else { this.elements.productFeatures.innerHTML = ''; }

      if (product.ingredients && product.ingredients.length > 0) {
        this.elements.productIngredients.innerHTML = product.ingredients.map(ing => `<li>${ing}</li>`).join('');
      }

      this.ui.renderNutritionInfo(product);

      if (this.elements.addToCartDetail) this.elements.addToCartDetail.onclick = () => this.cart.add(product.slug);
      if (this.elements.addToWishlistDetail) this.elements.addToWishlistDetail.onclick = () => this.wishlist.add(product.slug);

      this.elements.productDetail.style.display = 'block';
      document.querySelectorAll('main > section').forEach(s => { if (s.id !== 'product-detail') s.style.display = 'none'; });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },

    renderNutritionInfo: (product) => {
      const n = product.nutrition || { energy:'— kcal', protein:'— g', fat:'— g', carbs:'— g', sugar:'— g', fibre:'— g', sodium:'— mg' };
      const rows = [['Energy', n.energy],['Protein', n.protein],['Total Fat', n.fat],['Carbohydrates', n.carbs],['Added Sugar', n.sugar],['Dietary Fibre', n.fibre],['Sodium', n.sodium]];
      this.elements.nutritionTable.innerHTML = rows.map(([k,v]) =>
        `<tr><td style="padding: .75rem; border: 1px solid #dee2e6;">${k}</td><td style="padding: .75rem; border: 1px solid #dee2e6;">${v}</td></tr>`
      ).join('');
    },

    hideProductDetail: () => {
      document.querySelectorAll('main > section').forEach(s => { if (s.id !== 'product-detail') s.style.display = 'block'; });
      if (this.elements.productDetail) this.elements.productDetail.style.display = 'none';
      this.state.currentProduct = null;
    },

    _applyOverlayPointerSafety: () => {
      if (this.elements.mobileNavOverlay && !this.state.isMobileMenuOpen) this.elements.mobileNavOverlay.style.pointerEvents = 'none';
      if (this.elements.cartOverlay && !this.state.isCartOpen) this.elements.cartOverlay.style.pointerEvents = 'none';
      if (this.elements.wishlistOverlay && !this.state.isWishlistOpen) this.elements.wishlistOverlay.style.pointerEvents = 'none';
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
      img.style.transform = direction === 'next' ? 'translateX(40px)' :
                            direction === 'prev' ? 'translateX(-40px)' : 'translateX(0)';
      img.style.opacity = '0.1';
      requestAnimationFrame(() => {
        img.src = src;
        img.alt = `${productName} cookies - Image ${this.state.currentImageIndex + 1}`;
        img.style.transition = 'transform 250ms ease, opacity 250ms ease';
        img.style.transform = 'translateX(0)';
        img.style.opacity = '1';
      });
    },

    renderThumbnails: (images, productName) => {
      if (!this.elements.productThumbnails) return;
      this.elements.productThumbnails.innerHTML = images.map((image, index) => `
        <img src="${image}" alt="${productName} - Thumbnail ${index + 1}"
             class="product-thumbnail ${index === 0 ? 'active' : ''}"
             onclick="App.gallery.selectImage(${index})" loading="lazy">
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
      } catch (error) {
        console.error('Failed to load cart:', error);
        this.state.cart = [];
      }
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

    remove: (slug) => {
      this.state.cart = this.state.cart.filter(i => i.slug !== slug);
      this.cart.save(); this.cart.render();
      this.ui.showToast('Item removed from cart');
    },

    updateQuantity: (slug, qty) => {
      if (qty <= 0) return this.cart.remove(slug);
      const item = this.state.cart.find(i => i.slug === slug);
      if (item) { item.quantity = qty; this.cart.save(); this.cart.render(); }
    },

    clear: () => {
      this.state.cart = [];
      this.cart.save();
      this.cart.render();
      this.ui.showToast('Cart cleared');
    },

    getSubtotal: () => this.state.cart.reduce((t, i) => t + (i.price * i.quantity), 0),

    getDiscount: (subtotal) => {
      const c = this.state.appliedCoupon;
      if (!c) return 0;
      if (c.type === 'percent') return Math.round((subtotal * c.value) / 100);
      return 0;
    },

    getShipping: (subtotalAfterDiscount) => {
      if (subtotalAfterDiscount >= this.config.freeShippingThreshold) return 0;
      return this.state.cart.length > 0 ? this.config.shippingCharge : 0;
    },

    getTotal: () => {
      const sub = this.cart.getSubtotal();
      const disc = this.cart.getDiscount(sub);
      const subAfter = Math.max(0, sub - disc);
      const ship = this.cart.getShipping(subAfter);
      return Math.max(0, subAfter + ship);
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
              <img src="${item.img}" alt="${item.name}" class="cart-item-image">
              <div class="cart-item-details">
                <div class="cart-item-title">${item.name}</div>
                <div class="cart-item-price">${this.formatPrice(item.price)}</div>
                <div class="cart-item-actions">
                  <button class="quantity-btn" onclick="App.cart.updateQuantity('${item.slug}', ${item.quantity - 1})" aria-label="Decrease quantity">-</button>
                  <span style="min-width:2rem; text-align:center;">${item.quantity}</span>
                  <button class="quantity-btn" onclick="App.cart.updateQuantity('${item.slug}', ${item.quantity + 1})" aria-label="Increase quantity">+</button>
                </div>
              </div>
              <div style="text-align:right;">
                <div style="font-weight:600;">${this.formatPrice(item.price * item.quantity)}</div>
                <button onclick="App.cart.remove('${item.slug}')" style="color:#dc2626; background:none; border:none; cursor:pointer; margin-top:.5rem; font-size:.875rem;" aria-label="Remove ${item.name} from cart">Remove</button>
              </div>
            </div>
          `).join('');
        }
      }

      const subtotal = this.cart.getSubtotal();
      const discount = this.cart.getDiscount(subtotal);
      const afterDiscount = Math.max(0, subtotal - discount);
      const shipping = this.cart.getShipping(afterDiscount);
      const total = afterDiscount + shipping;

      if (this.elements.cartSubtotal) this.elements.cartSubtotal.textContent = this.formatPrice(subtotal);
      if (this.elements.cartDiscount) this.elements.cartDiscount.textContent = discount > 0 ? `- ${this.formatPrice(discount)} (${this.state.appliedCoupon?.code})` : this.formatPrice(0);
      if (this.elements.cartShipping) this.elements.cartShipping.textContent = this.formatPrice(shipping);
      if (this.elements.shippingNote) this.elements.shippingNote.textContent =
        `Shipping ₹${this.config.shippingCharge} applies below ₹${this.config.freeShippingThreshold}. Free shipping on orders ₹${this.config.freeShippingThreshold}+`;
      if (this.elements.cartTotal) this.elements.cartTotal.textContent = this.formatPrice(total);
      if (this.elements.checkoutForm) this.elements.checkoutForm.style.display = this.state.cart.length > 0 ? 'block' : 'none';
    },

    toggle: () => this.state.isCartOpen ? this.cart.close() : this.cart.open(),

    open: () => {
      this.state.isCartOpen = true;
      this.elements.cartModal.classList.add('active');
      this.elements.cartOverlay.classList.add('active');
      if (this.elements.cartOverlay) this.elements.cartOverlay.style.pointerEvents = 'auto';
      this.ui.lockScroll();
    },

    close: () => {
      this.state.isCartOpen = false;
      this.elements.cartModal.classList.remove('active');
      this.elements.cartOverlay.classList.remove('active');
      if (this.elements.cartOverlay) this.elements.cartOverlay.style.pointerEvents = 'none';
      this.ui.unlockScroll();
    },

    animateCartButton: () => {
      if (this.elements.cartCount) {
        this.elements.cartCount.style.animation = 'none';
        setTimeout(() => { this.elements.cartCount.style.animation = 'cartBounce 0.3s ease'; }, 10);
      }
    }
  };

  wishlist = {
    load: () => {
      try {
        const saved = localStorage.getItem(this.config.storageKeys.wishlist);
        this.state.wishlist = saved ? JSON.parse(saved) : [];
        this.wishlist.render();
      } catch (e) {
        console.error('Failed to load wishlist:', e);
        this.state.wishlist = [];
      }
    },

    save: () => {
      try { localStorage.setItem(this.config.storageKeys.wishlist, JSON.stringify(this.state.wishlist)); }
      catch (e) { console.error('Failed to save wishlist:', e); }
    },

    add: (productSlug) => {
      const product = this.state.products.find(p => p.slug === productSlug);
      if (!product) return this.ui.showError('Product not found');
      const exists = this.state.wishlist.find(i => i.slug === productSlug);
      if (exists) { this.ui.showToast('Already in wishlist'); return; }
      this.state.wishlist.push({ ...product });
      this.wishlist.save();
      this.wishlist.render();
      this.ui.showToast(`${product.name} added to wishlist`);
      this.wishlist.animateWishlistButton();
    },

    remove: (slug) => {
      this.state.wishlist = this.state.wishlist.filter(i => i.slug !== slug);
      this.wishlist.save();
      this.wishlist.render();
      this.ui.showToast('Removed from wishlist');
    },

    moveToCart: (slug) => {
      const item = this.state.wishlist.find(i => i.slug === slug);
      if (!item) return;
      this.cart.add(slug, 1);
      this.wishlist.remove(slug);
    },

    moveAllToCart: () => {
      this.state.wishlist.forEach(i => this.cart.add(i.slug, 1));
      this.state.wishlist = [];
      this.wishlist.save();
      this.wishlist.render();
      this.ui.showToast('Moved all to cart');
    },

    render: () => {
      const count = this.state.wishlist.length;
      if (this.elements.wishlistCount) {
        this.elements.wishlistCount.textContent = count;
        this.elements.wishlistCount.style.display = count > 0 ? 'flex' : 'none';
      }

      if (this.elements.wishlistItems) {
        if (count === 0) {
          this.elements.wishlistItems.innerHTML = `
            <div style="text-align:center; padding:3rem 1rem; color:var(--text-secondary);">
              <svg width="64" height="64" viewBox="0 0 24 24" style="margin-bottom:1rem; opacity:.5;">
                <path d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 8.25 12 9 12 .75 0 9-4.78 9-12z" fill="currentColor"/>
              </svg>
              <p>Your wishlist is empty</p>
              <button class="btn btn-primary" onclick="App.wishlist.close(); App.router.navigate('products');">Browse Products</button>
            </div>`;
        } else {
          this.elements.wishlistItems.innerHTML = this.state.wishlist.map(item => `
            <div class="wishlist-item">
              <img src="${item.img}" alt="${item.name}" class="wishlist-item-image">
              <div class="wishlist-item-details">
                <div class="wishlist-item-title">${item.name}</div>
                <div class="cart-item-price">${this.formatPrice(item.price)}</div>
                <div class="wishlist-item-actions">
                  <button class="btn btn-primary" onclick="App.wishlist.moveToCart('${item.slug}')">Move to Cart</button>
                  <a class="btn btn-secondary" href="#/product/${item.slug}" onclick="App.wishlist.close()">View Details</a>
                  <button class="btn btn-outline" onclick="App.wishlist.remove('${item.slug}')">Remove</button>
                </div>
              </div>
            </div>
          `).join('');
        }
      }
    },

    toggle: () => this.state.isWishlistOpen ? this.wishlist.close() : this.wishlist.open(),

    open: () => {
      this.state.isWishlistOpen = true;
      this.elements.wishlistModal.classList.add('active');
      this.elements.wishlistOverlay.classList.add('active');
      if (this.elements.wishlistOverlay) this.elements.wishlistOverlay.style.pointerEvents = 'auto';
      this.ui.lockScroll();
    },

    close: () => {
      this.state.isWishlistOpen = false;
      this.elements.wishlistModal.classList.remove('active');
      this.elements.wishlistOverlay.classList.remove('active');
      if (this.elements.wishlistOverlay) this.elements.wishlistOverlay.style.pointerEvents = 'none';
      this.ui.unlockScroll();
    },

    animateWishlistButton: () => {
      if (this.elements.wishlistCount) {
        this.elements.wishlistCount.style.animation = 'none';
        setTimeout(() => { this.elements.wishlistCount.style.animation = 'cartBounce 0.3s ease'; }, 10);
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
        if (digits && (digits.length < 10 || digits.length > 12)) this.ui.showToast('Phone looks unusual (optional): please check.', 'info');
      }
      const pincodeField = document.getElementById('customer-pincode');
      if (pincodeField) {
        const pin = pincodeField.value.trim();
        if (pin && !/^\d{6}$/.test(pin)) this.ui.showToast('Pincode format looks unusual (optional).', 'info');
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
      const subtotalAfter = Math.max(0, subtotal - discount);
      const shipping = this.cart.getShipping(subtotalAfter);
      const total = subtotalAfter + shipping;

      const itemsList = this.state.cart
        .map(i => `• ${i.name} (×${i.quantity}) - ${this.formatPrice(i.price * i.quantity)}`)
        .join('\n');

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

      // Persist locally (optional)
      try {
        const key = this.config.storageKeys.orders;
        const prev = JSON.parse(localStorage.getItem(key) || '[]');
        prev.push(order);
        localStorage.setItem(key, JSON.stringify(prev));
      } catch (e) { console.warn('Could not persist orders locally:', e); }

      // Fire-and-forget webhook to Google Apps Script
      this.backend.sendOrder(order);

      // WhatsApp handoff for quick confirmation
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
      if (order.shipping > 0) lines.push(`*Shipping:* ${this.formatPrice(order.shipping)}`);
      else lines.push(`*Shipping:* Free`);
      lines.push(`*Total Amount:* ${this.formatPrice(order.total)}`, ``);
      const c = order.customer;
      lines.push(
        `*Customer Details:*`,
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
      if (!Array.isArray(this.state.products) || !this.state.products.length) {
        return this.ui.showError('Products not loaded yet.');
      }
      const product = this.state.products.find(p => String(p.slug) === String(slug));
      if (!product) { this.ui.showError(`Product not found: ${slug}`); this.router.navigate('products'); return; }
      this.ui.renderProductDetail(product);
    },

    showSection: (id) => {
      this.ui.hideProductDetail();
      if (id && id !== 'home') {
        const el = document.getElementById(id);
        el ? el.scrollIntoView({ behavior: 'smooth' }) : window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  };

  backend = {
    sendVisit: async () => {
      if (!this.config.orderWebhook) return;
      try {
        const payload = {
          kind: 'visit',
          session: this.telemetry.sessionSnapshot(),
          meta: this.telemetry.metaSnapshot(),
          utm: this.telemetry.utmSnapshot()
        };
        await fetch(this.config.orderWebhook, {
          method: 'POST',
          mode: 'no-cors', // we don't need the response; keeps it "simple request"
          headers: { 'Content-Type': 'text/plain' },
          body: JSON.stringify(payload)
        });
      } catch (e) { console.warn('visit webhook failed', e); }
    },

    sendOrder: async (order) => {
      if (!this.config.orderWebhook) return;
      try {
        const payload = {
          kind: 'order',
          order,
          session: this.telemetry.sessionSnapshot(),
          meta: this.telemetry.metaSnapshot()
        };
        await fetch(this.config.orderWebhook, {
          method: 'POST',
          mode: 'no-cors', // avoids CORS preflight on GitHub Pages
          headers: { 'Content-Type': 'text/plain' },
          body: JSON.stringify(payload)
        });
      } catch (e) { console.warn('order webhook failed', e); }
    }
  };

  telemetry = {
    key: 'pb_session',

    ensureSession: () => {
      try {
        const now = new Date().toISOString();
        const raw = localStorage.getItem('pb_session');
        if (raw) {
          const s = JSON.parse(raw);
          s.lastVisitAt = now;
          localStorage.setItem('pb_session', JSON.stringify(s));
        } else {
          const s = { id: 'pb_' + Math.random().toString(36).slice(2) + Date.now(), firstVisitAt: now, lastVisitAt: now };
          localStorage.setItem('pb_session', JSON.stringify(s));
        }
      } catch {}
    },

    sessionSnapshot: () => {
      try { return JSON.parse(localStorage.getItem('pb_session') || '{}'); } catch { return {}; }
    },

    metaSnapshot: () => ({
      page: location.href,
      referrer: document.referrer || '',
      userAgent: navigator.userAgent || '',
      screen: `${window.screen?.width || 0}x${window.screen?.height || 0}`,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || ''
    }),

    utmSnapshot: () => {
      const p = new URLSearchParams(location.search);
      return {
        utm_source: p.get('utm_source') || '',
        utm_medium: p.get('utm_medium') || '',
        utm_campaign: p.get('utm_campaign') || ''
      };
    }
  };

  isNewProduct(product) {
    return product.price >= 300 ||
           product.name?.toLowerCase().includes('new') ||
           product.tagline?.toLowerCase().includes('new');
  }
}

// Boot the app
const App = new PinaBakesApp();
window.App = App;

// (Optional) Service Worker for offline/caching; comment out if debugging stale caches
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('./sw.js')
      .then(reg => console.log('SW registered:', reg))
      .catch(err => console.log('SW registration failed:', err));
  });
}
