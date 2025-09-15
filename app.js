// PiNa Bakes - ENHANCED VERSION WITH ALL IMPROVEMENTS
class PinaBakesApp {
  // Constants for magic numbers and configuration
  static CONSTANTS = {
    TIMEOUTS: {
      LOAD_PRODUCTS: 10000,
      TOAST_DEFAULT: 3000,
      TOAST_ERROR: 5000,
      DEBOUNCE_RESIZE: 250,
      NETWORK_REQUEST: 8000,
      CHECKOUT_SUBMIT: 15000
    },
    LIMITS: {
      MAX_CART_ITEMS: 50,
      MAX_SEARCH_RESULTS: 20,
      MIN_SEARCH_LENGTH: 2,
      MAX_RETRY_ATTEMPTS: 3
    },
    STORAGE: {
      VERSION: '2.0',
      PREFIX: 'pinabakes_v2_'
    },
    VALIDATION: {
      MIN_NAME_LENGTH: 2,
      PHONE_PATTERN: /^[0-9]{10}$/,
      EMAIL_PATTERN: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      MIN_ADDRESS_LENGTH: 10
    }
  };

  constructor() {
    this.config = {
      orderWebhook: "https://script.google.com/macros/s/AKfycbwR_3cz5m-FOJertmmRos7-Zc7nundBbNTJ0HuZoLPZ9gHuDwxNO9Th4ThXIru_Kztc/exec",
      whatsappNumber: "917678506669",
      storageKeys: {
        cart: PinaBakesApp.CONSTANTS.STORAGE.PREFIX + "cart",
        user: PinaBakesApp.CONSTANTS.STORAGE.PREFIX + "user",
        wishlist: PinaBakesApp.CONSTANTS.STORAGE.PREFIX + "wishlist",
        orders: PinaBakesApp.CONSTANTS.STORAGE.PREFIX + "orders",
      },
      apiEndpoints: {
        products: "products.json",
      },
      coupons: {
        PINA10: { type: "percent", value: 10 }
      },
      shippingCharge: 60,
      freeShippingThreshold: 999,
    };

    this.state = {
      products: [],
      filteredProducts: null,
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
      searchIndex: null,
      retryCount: 0,
      lastError: null
    };

    this.elements = {};
    this.eventListeners = new Map();
    this.abortController = null;
    this.searchTimeout = null;

    // Bind methods for proper cleanup and context
    this.boundHandlers = {
      hashchange: this.router.handleRoute.bind(this),
      popstate: this.router.handleRoute.bind(this),
      keydown: this.handleKeyboardShortcuts.bind(this),
      resize: this.debounce(this.handleResize.bind(this), PinaBakesApp.CONSTANTS.TIMEOUTS.DEBOUNCE_RESIZE),
      visibilitychange: this.handleVisibilityChange.bind(this)
    };

    this.init();
  }

  async init() {
    try {
      console.log("Loading PiNa Bakes app...");
      this.ui.showLoader();
      
      this.cacheElements();
      this.setupEventListeners();
      this.loadUserData();
      this.cart.load();
      this.wishlist.load();
      this.ui.renderSkeletonProducts();

      await this.loadProductsWithTimeout();
      
      this.search.init();
      this.router.handleRoute();
      this.updateCurrentYear();
      this.setupHeaderScrollEffect();
      this.ui.hideLoader();
      
      console.log("PiNa Bakes app initialized successfully!");
      this.ui.showToast("Welcome to PiNa Bakes!", "success");
      
    } catch (error) {
      this.handleError(error, "App initialization failed");
      this.ui.hideLoader();
      this.ui.showRetryOption();
    }
  }

  async loadProductsWithTimeout() {
    this.abortController = new AbortController();
    
    try {
      await Promise.race([
        this.loadProducts(),
        this.createTimeoutPromise(PinaBakesApp.CONSTANTS.TIMEOUTS.LOAD_PRODUCTS)
      ]);
    } catch (error) {
      if (error.name === 'AbortError') {
        throw new Error('Loading was cancelled');
      }
      throw error;
    } finally {
      this.abortController = null;
    }
  }

  createTimeoutPromise(ms) {
    return new Promise((_, reject) => {
      const timeout = setTimeout(() => reject(new Error(`Loading timeout after ${ms / 1000} seconds`)), ms);
      if (this.abortController) {
        this.abortController.signal.addEventListener('abort', () => {
          clearTimeout(timeout);
          reject(new Error('AbortError'));
        });
      }
    });
  }

  async loadProducts() {
    if (this.state.products.length > 0) {
      console.log("Products already loaded, skipping...");
      this.search.setupSearchIndex();
      this.ui.renderProducts();
      return;
    }

    this.state.isLoading = true;

    try {
      console.log("Loading products from products.json...");
      const response = await this.fetchWithTimeout("products.json", {
        cache: "no-store",
        headers: { "Cache-Control": "no-cache" },
        signal: this.abortController?.signal
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const products = await response.json();
      
      if (!this.validateProductsData(products)) {
        throw new Error('Invalid products.json format');
      }

      this.state.products = products.map(p => ({
        ...p,
        images: this.normalizeImages(p),
        sanitizedName: this.sanitizeInput(p.name),
        sanitizedTagline: this.sanitizeInput(p.tagline),
        priceFormatted: this.formatPrice(p.price)
      }));
      
      this.state.filteredProducts = null;
      this.search.setupSearchIndex();
      this.ui.renderProducts();
      this.state.retryCount = 0;

      console.log(`Loaded ${this.state.products.length} products successfully!`);
    } catch (error) {
      this.handleError(error, "Failed to load products");
      this.ui.renderProductError(error.message);
      
      // Retry logic
      if (this.state.retryCount < PinaBakesApp.CONSTANTS.LIMITS.MAX_RETRY_ATTEMPTS) {
        this.state.retryCount++;
        console.log(`Retrying product load (${this.state.retryCount}/${PinaBakesApp.CONSTANTS.LIMITS.MAX_RETRY_ATTEMPTS})`);
        setTimeout(() => this.loadProducts(), 2000 * this.state.retryCount);
      }
    } finally {
      this.state.isLoading = false;
    }
  }

  async fetchWithTimeout(url, options = {}) {
    const timeout = PinaBakesApp.CONSTANTS.TIMEOUTS.NETWORK_REQUEST;
    const controller = new AbortController();
    
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  validateProductsData(products) {
    if (!Array.isArray(products) || products.length === 0) {
      return false;
    }

    return products.every(p => 
      p.slug && 
      p.name && 
      typeof p.price === 'number' && 
      p.price > 0 &&
      p.tagline &&
      Array.isArray(p.ingredients) &&
      Array.isArray(p.bullets)
    );
  }

  sanitizeInput(input) {
    if (typeof input !== 'string') return '';
    return input
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '')
      .replace(/[<>]/g, '');
  }

  formatPrice(price) {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(price);
  }

  normalizeImages(product) {
    if (product.images && Array.isArray(product.images)) {
      return product.images;
    }
    return product.img ? [product.img] : [];
  }

  cacheElements() {
    const elementIds = [
      'header', 'modal-overlay', 'site-search', 'search-suggestions', 'site-search-mobile',
      'cart-modal', 'cart-count', 'cart-items', 'cart-total', 'checkout-form',
      'coupon-code', 'coupon-msg', 'cart-subtotal', 'cart-discount', 'cart-shipping',
      'shipping-note', 'products-grid', 'product-detail', 'product-main-image',
      'product-thumbnails', 'product-title', 'product-price', 'product-tagline',
      'product-features', 'product-ingredients', 'nutrition-table',
      'add-to-cart-detail', 'add-to-wishlist-detail', 'toast', 'current-year',
      'wishlist-modal', 'wishlist-count', 'wishlist-items'
    ];

    this.elements = {};
    elementIds.forEach(id => {
      const element = document.getElementById(id);
      if (element) {
        this.elements[id.replace(/-([a-z])/g, (g) => g[1].toUpperCase())] = element;
      }
    });

    // Cache commonly used selectors with null checks
    this.elements.mobileMenuToggle = document.querySelector(".mobile-menu-toggle");
    this.elements.mobileNav = document.querySelector(".mobile-nav");
    this.elements.navLinks = document.querySelectorAll(".nav-link");
  }

  setupEventListeners() {
    // Global event listeners with cleanup tracking
    this.addEventListener(window, "hashchange", this.boundHandlers.hashchange);
    this.addEventListener(window, "popstate", this.boundHandlers.popstate);
    this.addEventListener(document, "keydown", this.boundHandlers.keydown);
    this.addEventListener(window, "resize", this.boundHandlers.resize);
    this.addEventListener(document, "visibilitychange", this.boundHandlers.visibilitychange);

    // Form event listeners
    if (this.elements.checkoutForm) {
      this.addEventListener(this.elements.checkoutForm, "submit", this.checkout.handleFormSubmit.bind(this));
    }

    // Product grid navigation
    if (this.elements.productsGrid) {
      this.addEventListener(this.elements.productsGrid, "click", (e) => {
        const link = e.target.closest('a[href^="#/product/"]');
        if (!link) return;
        e.preventDefault();
        const slug = link.getAttribute("href").split("/").pop();
        this.router.navigate(`#/product/${slug}`);
      });
    }

    // Search functionality
    if (this.elements.searchInput) {
      this.addEventListener(this.elements.searchInput, "input", this.debounce(this.search.handleInput.bind(this), 300));
      this.addEventListener(this.elements.searchInput, "focus", this.search.handleFocus.bind(this));
      this.addEventListener(this.elements.searchInput, "blur", this.search.handleBlur.bind(this));
    }

    // Coupon code handling
    if (this.elements.couponCode) {
      this.addEventListener(this.elements.couponCode, "keydown", (e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          this.cart.applyCoupon();
        }
      });
    }

    // Mobile menu toggle
    if (this.elements.mobileMenuToggle) {
      this.addEventListener(this.elements.mobileMenuToggle, "click", this.ui.toggleMobileMenu.bind(this));
    }

    // Modal overlay
    if (this.elements.modalOverlay) {
      this.addEventListener(this.elements.modalOverlay, "click", (e) => {
        if (e.target === this.elements.modalOverlay) {
          this.ui.closeAllModals();
        }
      });
    }

    // Cart and wishlist buttons
    this.setupCartWishlistListeners();
  }

  setupCartWishlistListeners() {
    // Cart toggle button
    const cartToggle = document.querySelector('[data-action="toggle-cart"]');
    if (cartToggle) {
      this.addEventListener(cartToggle, "click", this.cart.toggle.bind(this));
    }

    // Wishlist toggle button
    const wishlistToggle = document.querySelector('[data-action="toggle-wishlist"]');
    if (wishlistToggle) {
      this.addEventListener(wishlistToggle, "click", this.wishlist.toggle.bind(this));
    }
  }

  addEventListener(element, event, handler) {
    if (!element) return;
    
    element.addEventListener(event, handler);
    
    // Track for cleanup
    const key = `${element.constructor.name}-${event}`;
    if (!this.eventListeners.has(key)) {
      this.eventListeners.set(key, []);
    }
    this.eventListeners.get(key).push({ element, event, handler });
  }

  removeAllEventListeners() {
    this.eventListeners.forEach(listeners => {
      listeners.forEach(({ element, event, handler }) => {
        element.removeEventListener(event, handler);
      });
    });
    this.eventListeners.clear();
  }

  handleError(error, context = '') {
    console.error(`${context}:`, error);
    this.state.lastError = { error, context, timestamp: Date.now() };
    
    // Error categorization for better handling
    let message = 'An unexpected error occurred';
    let isRetryable = false;

    if (error.name === 'NetworkError' || error.message.includes('fetch')) {
      message = 'Network connection failed. Please check your internet connection.';
      isRetryable = true;
    } else if (error.message.includes('timeout')) {
      message = 'Request timed out. Please try again.';
      isRetryable = true;
    } else if (error.message.includes('Invalid')) {
      message = 'Invalid data format. Please refresh the page.';
      isRetryable = false;
    } else if (error.message.includes('AbortError')) {
      message = 'Request was cancelled.';
      isRetryable = true;
    }

    this.ui.showToast(message, "error");
    
    if (isRetryable) {
      this.ui.showRetryOption();
    }
  }

  handleKeyboardShortcuts(e) {
    // Accessibility: ESC to close modals
    if (e.key === 'Escape') {
      this.ui.closeAllModals();
    }
    
    // Accessibility: Ctrl+/ to focus search
    if (e.ctrlKey && e.key === '/') {
      e.preventDefault();
      if (this.elements.searchInput) {
        this.elements.searchInput.focus();
      }
    }

    // Accessibility: Enter to activate buttons/links with focus
    if (e.key === 'Enter' && e.target.matches('button, a, [role="button"]')) {
      e.target.click();
    }
  }

  handleResize() {
    // Close mobile menu on desktop resize
    if (window.innerWidth > 768 && this.state.isMobileMenuOpen) {
      this.ui.closeMobileMenu();
    }

    // Recalculate product grid if needed
    if (this.elements.productsGrid) {
      this.ui.adjustProductGrid();
    }
  }

  handleVisibilityChange() {
    if (document.hidden) {
      // Page is hidden - cleanup any ongoing operations
      if (this.abortController) {
        this.abortController.abort();
      }
    } else {
      // Page is visible - refresh data if stale
      this.refreshDataIfStale();
    }
  }

  refreshDataIfStale() {
    const now = Date.now();
    const lastUpdate = localStorage.getItem(this.config.storageKeys.cart + '_timestamp');
    const staleThreshold = 5 * 60 * 1000; // 5 minutes

    if (!lastUpdate || now - parseInt(lastUpdate) > staleThreshold) {
      console.log('Data is stale, refreshing...');
      this.cart.load();
      this.wishlist.load();
    }
  }

  debounce(func, wait) {
    let timeout;
    return (...args) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(this, args), wait);
    };
  }

  // UI Management
  ui = {
    showToast: (message, type = "info", duration = PinaBakesApp.CONSTANTS.TIMEOUTS.TOAST_DEFAULT) => {
      const toast = this.elements.toast;
      if (!toast) return;
      
      // Sanitize message for XSS protection
      toast.textContent = this.sanitizeInput(message);
      toast.className = `toast show ${type}`;
      toast.setAttribute('role', 'alert');
      toast.setAttribute('aria-live', 'polite');
      
      clearTimeout(this.toastTimeout);
      this.toastTimeout = setTimeout(() => {
        toast.classList.remove("show");
        toast.removeAttribute('role');
        toast.removeAttribute('aria-live');
      }, duration);
    },

    showError: (message) => {
      this.ui.showToast(message, "error", PinaBakesApp.CONSTANTS.TIMEOUTS.TOAST_ERROR);
    },

    showLoader: () => {
      document.body.classList.add('loading');
      document.body.setAttribute('aria-busy', 'true');
      
      const loader = document.querySelector('.loader');
      if (loader) {
        loader.setAttribute('aria-hidden', 'false');
        loader.setAttribute('aria-label', 'Loading content...');
      }
    },

    hideLoader: () => {
      document.body.classList.remove('loading');
      document.body.setAttribute('aria-busy', 'false');
      
      const loader = document.querySelector('.loader');
      if (loader) {
        loader.setAttribute('aria-hidden', 'true');
        loader.removeAttribute('aria-label');
      }
      
      document.querySelectorAll(".skeleton, .skeleton-product").forEach(el => {
        el.classList.remove("skeleton", "skeleton-product");
        el.style.display = "none";
        el.setAttribute('aria-hidden', 'true');
      });
    },

    showRetryOption: () => {
      const retryHtml = `
        <div class="retry-container" role="alert">
          <p>Something went wrong. Would you like to try again?</p>
          <button class="retry-btn" onclick="location.reload()" aria-label="Retry loading page">
            Retry
          </button>
        </div>
      `;
      
      if (this.elements.productsGrid) {
        this.elements.productsGrid.innerHTML = retryHtml;
      }
    },

    toggleMobileMenu: () => {
      this.state.isMobileMenuOpen ? this.ui.closeMobileMenu() : this.ui.openMobileMenu();
    },

    openMobileMenu: () => {
      this.state.isMobileMenuOpen = true;
      this.elements.mobileNav?.classList.add("active");
      this.elements.modalOverlay?.classList.add("active");
      this.elements.mobileMenuToggle?.setAttribute("aria-expanded", "true");
      document.body.style.overflow = "hidden";
      
      // Focus management for accessibility
      const firstFocusable = this.elements.mobileNav?.querySelector('a, button');
      if (firstFocusable) {
        setTimeout(() => firstFocusable.focus(), 100);
      }

      // Announce to screen readers
      this.ui.announceToScreenReader("Mobile menu opened");
    },

    closeMobileMenu: () => {
      this.state.isMobileMenuOpen = false;
      this.elements.mobileNav?.classList.remove("active");
      if (!this.state.isCartOpen && !this.state.isWishlistOpen) {
        this.elements.modalOverlay?.classList.remove("active");
      }
      this.elements.mobileMenuToggle?.setAttribute("aria-expanded", "false");
      document.body.style.overflow = "";
      
      // Return focus to menu toggle
      if (this.elements.mobileMenuToggle) {
        this.elements.mobileMenuToggle.focus();
      }

      // Announce to screen readers
      this.ui.announceToScreenReader("Mobile menu closed");
    },

    closeAllModals: () => {
      this.ui.closeMobileMenu();
      this.cart.close();
      this.wishlist.close();
    },

    announceToScreenReader: (message) => {
      const announcement = document.createElement('div');
      announcement.setAttribute('aria-live', 'polite');
      announcement.setAttribute('aria-atomic', 'true');
      announcement.className = 'sr-only';
      announcement.textContent = message;
      
      document.body.appendChild(announcement);
      
      setTimeout(() => {
        document.body.removeChild(announcement);
      }, 1000);
    },

    renderSkeletonProducts: () => {
      if (!this.elements.productsGrid) return;
      
      const skeletons = Array(6).fill().map((_, index) => `
        <div class="skeleton-product" aria-hidden="true" role="presentation">
          <div class="skeleton-img" aria-label="Loading product image"></div>
          <div class="skeleton-content">
            <div class="skeleton-text skeleton-title"></div>
            <div class="skeleton-text skeleton-price"></div>
            <div class="skeleton-text skeleton-tagline"></div>
          </div>
        </div>
      `).join('');
      
      this.elements.productsGrid.innerHTML = skeletons;
    },

    renderProductError: (errorMessage) => {
      if (!this.elements.productsGrid) return;
      
      this.elements.productsGrid.innerHTML = `
        <div class="product-error" role="alert">
          <div class="error-icon" aria-hidden="true">⚠️</div>
          <h3>Unable to Load Products</h3>
          <p>${this.sanitizeInput(errorMessage)}</p>
          <div class="error-actions">
            <button onclick="window.location.reload()" class="retry-btn" aria-label="Refresh page to retry">
              Refresh Page
            </button>
            <button onclick="window.pinaBakesApp.loadProducts()" class="retry-btn secondary" aria-label="Retry loading products">
              Try Again
            </button>
          </div>
        </div>
      `;
    },

    renderProducts: () => {
      if (!this.elements.productsGrid || !this.state.products.length) return;

      const products = this.state.filteredProducts || this.state.products;
      
      const productsHtml = products.map(product => `
        <div class="product-card" data-slug="${product.slug}">
          <a href="#/product/${product.slug}" class="product-link" aria-label="View ${product.sanitizedName}">
            <div class="product-image-container">
              <img 
                src="${product.images[0]}" 
                alt="${product.sanitizedName}"
                loading="lazy"
                onerror="this.src='assets/images/placeholder.jpg'"
                class="product-image"
              />
              <div class="product-tags" aria-label="Product tags">
                ${product.tags ? product.tags.slice(0, 2).map(tag => `<span class="tag">${tag}</span>`).join('') : ''}
              </div>
            </div>
            <div class="product-info">
              <h3 class="product-name">${product.sanitizedName}</h3>
              <p class="product-tagline">${product.sanitizedTagline}</p>
              <div class="product-price-container">
                <span class="product-price" aria-label="Price ${product.priceFormatted}">${product.priceFormatted}</span>
              </div>
            </div>
          </a>
          <div class="product-actions">
            <button 
              class="btn btn-cart" 
              data-action="add-to-cart" 
              data-slug="${product.slug}"
              aria-label="Add ${product.sanitizedName} to cart"
            >
              Add to Cart
            </button>
            <button 
              class="btn btn-wishlist" 
              data-action="add-to-wishlist" 
              data-slug="${product.slug}"
              aria-label="Add ${product.sanitizedName} to wishlist"
            >
              ♡
            </button>
          </div>
        </div>
      `).join('');

      this.elements.productsGrid.innerHTML = productsHtml;
      
      // Setup product action listeners
      this.setupProductActionListeners();
    },

    adjustProductGrid: () => {
      // Responsive grid adjustments
      if (!this.elements.productsGrid) return;
      
      const containerWidth = this.elements.productsGrid.offsetWidth;
      const cardWidth = 280; // Base card width
      const gap = 20; // Gap between cards
      
      const columns = Math.floor((containerWidth + gap) / (cardWidth + gap));
      this.elements.productsGrid.style.setProperty('--grid-columns', Math.max(1, columns));
    }
  };

  setupProductActionListeners() {
    // Add to cart buttons
    document.querySelectorAll('[data-action="add-to-cart"]').forEach(button => {
      this.addEventListener(button, 'click', (e) => {
        e.preventDefault();
        const slug = button.dataset.slug;
        this.cart.addItem(slug);
      });
    });

    // Add to wishlist buttons
    document.querySelectorAll('[data-action="add-to-wishlist"]').forEach(button => {
      this.addEventListener(button, 'click', (e) => {
        e.preventDefault();
        const slug = button.dataset.slug;
        this.wishlist.addItem(slug);
      });
    });
  }

  // Form Validation
  validation = {
    validateCheckoutForm: () => {
      const form = this.elements.checkoutForm;
      if (!form) return false;

      let isValid = true;
      const fields = {
        name: { 
          required: true, 
          minLength: PinaBakesApp.CONSTANTS.VALIDATION.MIN_NAME_LENGTH,
          label: 'Full Name'
        },
        email: { 
          required: true, 
          pattern: PinaBakesApp.CONSTANTS.VALIDATION.EMAIL_PATTERN,
          label: 'Email Address'
        },
        phone: { 
          required: true, 
          pattern: PinaBakesApp.CONSTANTS.VALIDATION.PHONE_PATTERN,
          label: 'Phone Number'
        },
        address: { 
          required: true, 
          minLength: PinaBakesApp.CONSTANTS.VALIDATION.MIN_ADDRESS_LENGTH,
          label: 'Delivery Address'
        }
      };

      // Clear previous errors
      form.querySelectorAll('.error-message').forEach(el => el.remove());
      form.querySelectorAll('.field-error').forEach(el => {
        el.classList.remove('field-error');
        el.removeAttribute('aria-invalid');
        el.removeAttribute('aria-describedby');
      });

      Object.entries(fields).forEach(([fieldName, rules]) => {
        const field = form.querySelector(`[name="${fieldName}"]`);
        if (!field) return;

        const value = field.value.trim();
        let errorMessage = '';

        if (rules.required && !value) {
          errorMessage = `${rules.label} is required`;
        } else if (rules.minLength && value.length < rules.minLength) {
          errorMessage = `${rules.label} must be at least ${rules.minLength} characters`;
        } else if (rules.pattern && !rules.pattern.test(value)) {
          if (fieldName === 'email') {
            errorMessage = 'Please enter a valid email address';
          } else if (fieldName === 'phone') {
            errorMessage = 'Please enter a valid 10-digit phone number';
          } else {
            errorMessage = `Please enter a valid ${rules.label.toLowerCase()}`;
          }
        }

        if (errorMessage) {
          this.validation.showFieldError(field, errorMessage);
          isValid = false;
        }
      });

      // Validate cart is not empty
      if (this.state.cart.length === 0) {
        this.ui.showError('Your cart is empty. Please add items before checkout.');
        isValid = false;
      }

      return isValid;
    },

    showFieldError: (field, message) => {
      field.classList.add('field-error');
      field.setAttribute('aria-invalid', 'true');
      
      const errorEl = document.createElement('div');
      errorEl.className = 'error-message';
      errorEl.textContent = message;
      errorEl.setAttribute('role', 'alert');
      
      // Insert error message after the field
      field.parentElement.appendChild(errorEl);
      
      // Associate error with field for screen readers
      const errorId = `error-${field.name}-${Date.now()}`;
      errorEl.id = errorId;
      field.setAttribute('aria-describedby', errorId);
      
      // Focus the first invalid field
      if (!document.querySelector('.field-error:focus')) {
        field.focus();
      }
    }
  };

  // Enhanced Storage Management
  storage = {
    save: (key, data) => {
      try {
        const payload = {
          version: PinaBakesApp.CONSTANTS.STORAGE.VERSION,
          timestamp: Date.now(),
          data: data
        };
        
        localStorage.setItem(key, JSON.stringify(payload));
        localStorage.setItem(key + '_timestamp', Date.now().toString());
        
      } catch (error) {
        console.error('Storage save failed:', error);
        
        if (error.name === 'QuotaExceededError') {
          this.storage.cleanup();
          this.ui.showToast('Storage limit reached. Some data has been cleared.', 'warning');
        } else {
          this.ui.showToast('Unable to save data locally', 'warning');
        }
      }
    },

    load: (key) => {
      try {
        const item = localStorage.getItem(key);
        if (!item) return null;

        const parsed = JSON.parse(item);
        
        // Check version compatibility
        if (parsed.version !== PinaBakesApp.CONSTANTS.STORAGE.VERSION) {
          console.warn('Storage version mismatch, clearing data');
          localStorage.removeItem(key);
          localStorage.removeItem(key + '_timestamp');
          return null;
        }

        // Check if data is too old (30 days)
        const age = Date.now() - parsed.timestamp;
        const maxAge = 30 * 24 * 60 * 60 * 1000; // 30 days
        
        if (age > maxAge) {
          console.warn('Data is too old, clearing');
          localStorage.removeItem(key);
          localStorage.removeItem(key + '_timestamp');
          return null;
        }

        return parsed.data;
        
      } catch (error) {
        console.error('Storage load failed:', error);
        localStorage.removeItem(key);
        localStorage.removeItem(key + '_timestamp');
        return null;
      }
    },

    remove: (key) => {
      try {
        localStorage.removeItem(key);
        localStorage.removeItem(key + '_timestamp');
      } catch (error) {
        console.error('Storage remove failed:', error);
      }
    },

    cleanup: () => {
      try {
        // Remove old PiNa Bakes data
        const keys = Object.keys(localStorage);
        keys.forEach(key => {
          if (key.startsWith('pinabakes_') && !key.startsWith(PinaBakesApp.CONSTANTS.STORAGE.PREFIX)) {
            localStorage.removeItem(key);
          }
        });
        console.log('Storage cleanup completed');
      } catch (error) {
        console.error('Storage cleanup failed:', error);
      }
    }
  };

  // Search functionality
  search = {
    init: () => {
      this.search.setupSearchIndex();
    },

    setupSearchIndex: () => {
      if (!this.state.products.length) return;
      
      this.state.searchIndex = this.state.products.map(product => ({
        slug: product.slug,
        searchText: [
          product.name,
          product.tagline,
          ...product.ingredients,
          ...product.bullets,
          ...product.tags
        ].join(' ').toLowerCase()
      }));
    },

    handleInput: (e) => {
      const query = e.target.value.trim();
      
      if (query.length < PinaBakesApp.CONSTANTS.LIMITS.MIN_SEARCH_LENGTH) {
        this.search.clearResults();
        this.state.filteredProducts = null;
        this.ui.renderProducts();
        return;
      }

      const results = this.search.performSearch(query);
      this.search.showSuggestions(results);
      
      // Filter products
      this.state.filteredProducts = this.state.products.filter(p => 
        results.some(r => r.slug === p.slug)
      );
      
      this.ui.renderProducts();
    },

    performSearch: (query) => {
      if (!this.state.searchIndex || !query) return [];
      
      const searchTerms = query.toLowerCase().split(' ').filter(term => term.length > 1);
      
      return this.state.searchIndex
        .filter(item => 
          searchTerms.some(term => item.searchText.includes(term))
        )
        .slice(0, PinaBakesApp.CONSTANTS.LIMITS.MAX_SEARCH_RESULTS);
    },

    showSuggestions: (results) => {
      if (!this.elements.searchSuggest) return;
      
      if (results.length === 0) {
        this.search.clearResults();
        return;
      }

      const suggestions = results.map(result => {
        const product = this.state.products.find(p => p.slug === result.slug);
        return `
          <div class="search-suggestion" data-slug="${product.slug}">
            <img src="${product.images[0]}" alt="${product.name}" class="suggestion-image" loading="lazy">
            <div class="suggestion-content">
              <div class="suggestion-name">${product.name}</div>
              <div class="suggestion-price">${product.priceFormatted}</div>
            </div>
          </div>
        `;
      }).join('');

      this.elements.searchSuggest.innerHTML = suggestions;
      this.elements.searchSuggest.classList.add('active');
      
      // Add click listeners to suggestions
      this.elements.searchSuggest.querySelectorAll('.search-suggestion').forEach(suggestion => {
        this.addEventListener(suggestion, 'click', (e) => {
          const slug = suggestion.dataset.slug;
          this.router.navigate(`#/product/${slug}`);
          this.search.clearResults();
        });
      });
    },

    clearResults: () => {
      if (this.elements.searchSuggest) {
        this.elements.searchSuggest.innerHTML = '';
        this.elements.searchSuggest.classList.remove('active');
      }
    },

    handleFocus: () => {
      if (this.elements.searchInput.value.trim().length >= PinaBakesApp.CONSTANTS.LIMITS.MIN_SEARCH_LENGTH) {
        this.elements.searchSuggest?.classList.add('active');
      }
    },

    handleBlur: () => {
      // Delay clearing to allow click on suggestions
      setTimeout(() => {
        this.elements.searchSuggest?.classList.remove('active');
      }, 200);
    }
  };

  // Router functionality
  router = {
    handleRoute: () => {
      const hash = window.location.hash;
      const route = hash.replace('#/', '');
      
      if (!route || route === '') {
        this.router.showHome();
      } else if (route.startsWith('product/')) {
        const slug = route.replace('product/', '');
        this.router.showProduct(slug);
      } else if (route === 'cart') {
        this.cart.open();
      } else if (route === 'wishlist') {
        this.wishlist.open();
      } else {
        this.router.show404();
      }
    },

    navigate: (route) => {
      window.location.hash = route;
    },

    showHome: () => {
      this.state.filteredProducts = null;
      this.ui.renderProducts();
      this.ui.closeAllModals();
      
      // Update page title
      document.title = 'PiNa Bakes - Premium Millet Cookies';
    },

    showProduct: (slug) => {
      const product = this.state.products.find(p => p.slug === slug);
      
      if (!product) {
        this.router.show404();
        return;
      }

      this.state.currentProduct = product;
      this.ui.renderProductDetail(product);
      
      // Update page title
      document.title = `${product.name} - PiNa Bakes`;
    },

    show404: () => {
      if (this.elements.productsGrid) {
        this.elements.productsGrid.innerHTML = `
          <div class="not-found" role="alert">
            <h2>Page Not Found</h2>
            <p>The page you're looking for doesn't exist.</p>
            <button onclick="window.location.hash = ''" class="btn btn-primary">
              Go Home
            </button>
          </div>
        `;
      }
      
      document.title = 'Page Not Found - PiNa Bakes';
    }
  };

  // Cart functionality
  cart = {
    load: () => {
      const cartData = this.storage.load(this.config.storageKeys.cart);
      this.state.cart = cartData || [];
      this.cart.updateUI();
    },

    save: () => {
      this.storage.save(this.config.storageKeys.cart, this.state.cart);
      this.cart.updateUI();
    },

    addItem: (slug, quantity = 1) => {
      const product = this.state.products.find(p => p.slug === slug);
      if (!product) return;

      const existingItem = this.state.cart.find(item => item.slug === slug);
      
      if (existingItem) {
        existingItem.quantity += quantity;
      } else {
        this.state.cart.push({
          slug: slug,
          name: product.name,
          price: product.price,
          image: product.images[0],
          quantity: quantity
        });
      }

      this.cart.save();
      this.ui.showToast(`${product.name} added to cart`, 'success');
    },

    removeItem: (slug) => {
      this.state.cart = this.state.cart.filter(item => item.slug !== slug);
      this.cart.save();
    },

    updateQuantity: (slug, quantity) => {
      const item = this.state.cart.find(item => item.slug === slug);
      if (!item) return;

      if (quantity <= 0) {
        this.cart.removeItem(slug);
      } else {
        item.quantity = Math.min(quantity, 10); // Max 10 per item
        this.cart.save();
      }
    },

    getTotal: () => {
      return this.state.cart.reduce((total, item) => total + (item.price * item.quantity), 0);
    },

    getItemCount: () => {
      return this.state.cart.reduce((count, item) => count + item.quantity, 0);
    },

    clear: () => {
      this.state.cart = [];
      this.cart.save();
    },

    toggle: () => {
      this.state.isCartOpen ? this.cart.close() : this.cart.open();
    },

    open: () => {
      this.state.isCartOpen = true;
      this.elements.cartModal?.classList.add('active');
      this.elements.modalOverlay?.classList.add('active');
      document.body.style.overflow = 'hidden';
      
      // Focus management
      const firstInput = this.elements.cartModal?.querySelector('input, button');
      if (firstInput) {
        setTimeout(() => firstInput.focus(), 100);
      }

      this.cart.renderCartItems();
    },

    close: () => {
      this.state.isCartOpen = false;
      this.elements.cartModal?.classList.remove('active');
      if (!this.state.isMobileMenuOpen && !this.state.isWishlistOpen) {
        this.elements.modalOverlay?.classList.remove('active');
      }
      document.body.style.overflow = '';
    },

    updateUI: () => {
      const count = this.cart.getItemCount();
      if (this.elements.cartCount) {
        this.elements.cartCount.textContent = count;
        this.elements.cartCount.style.display = count > 0 ? 'inline' : 'none';
      }
    },

    renderCartItems: () => {
      if (!this.elements.cartItems) return;

      if (this.state.cart.length === 0) {
        this.elements.cartItems.innerHTML = `
          <div class="empty-cart">
            <p>Your cart is empty</p>
            <button onclick="window.pinaBakesApp.cart.close()" class="btn btn-primary">
              Continue Shopping
            </button>
          </div>
        `;
        return;
      }

      const cartHtml = this.state.cart.map(item => `
        <div class="cart-item" data-slug="${item.slug}">
          <img src="${item.image}" alt="${item.name}" class="cart-item-image">
          <div class="cart-item-details">
            <h4>${item.name}</h4>
            <div class="cart-item-controls">
              <button class="quantity-btn" data-action="decrease" data-slug="${item.slug}" aria-label="Decrease quantity">-</button>
              <span class="quantity">${item.quantity}</span>
              <button class="quantity-btn" data-action="increase" data-slug="${item.slug}" aria-label="Increase quantity">+</button>
              <button class="remove-btn" data-action="remove" data-slug="${item.slug}" aria-label="Remove item">×</button>
            </div>
            <div class="cart-item-price">${this.formatPrice(item.price * item.quantity)}</div>
          </div>
        </div>
      `).join('');

      this.elements.cartItems.innerHTML = cartHtml;
      this.cart.updateCartTotal();
      this.cart.setupCartItemListeners();
    },

    setupCartItemListeners: () => {
      // Quantity controls
      document.querySelectorAll('.quantity-btn').forEach(btn => {
        this.addEventListener(btn, 'click', (e) => {
          const slug = btn.dataset.slug;
          const action = btn.dataset.action;
          const currentItem = this.state.cart.find(item => item.slug === slug);
          
          if (!currentItem) return;
          
          let newQuantity = currentItem.quantity;
          if (action === 'increase') {
            newQuantity += 1;
          } else if (action === 'decrease') {
            newQuantity -= 1;
          }
          
          this.cart.updateQuantity(slug, newQuantity);
          this.cart.renderCartItems();
        });
      });

      // Remove buttons
      document.querySelectorAll('.remove-btn').forEach(btn => {
        this.addEventListener(btn, 'click', (e) => {
          const slug = btn.dataset.slug;
          this.cart.removeItem(slug);
          this.cart.renderCartItems();
          this.ui.showToast('Item removed from cart', 'info');
        });
      });
    },

    updateCartTotal: () => {
      const subtotal = this.cart.getTotal();
      const shipping = subtotal >= this.config.freeShippingThreshold ? 0 : this.config.shippingCharge;
      const total = subtotal + shipping;

      if (this.elements.cartSubtotal) {
        this.elements.cartSubtotal.textContent = this.formatPrice(subtotal);
      }
      if (this.elements.cartShipping) {
        this.elements.cartShipping.textContent = shipping === 0 ? 'FREE' : this.formatPrice(shipping);
      }
      if (this.elements.cartTotal) {
        this.elements.cartTotal.textContent = this.formatPrice(total);
      }
      if (this.elements.shippingNote) {
        if (subtotal < this.config.freeShippingThreshold) {
          const remaining = this.config.freeShippingThreshold - subtotal;
          this.elements.shippingNote.textContent = `Add ${this.formatPrice(remaining)} more for free shipping`;
        } else {
          this.elements.shippingNote.textContent = 'You qualify for free shipping!';
        }
      }
    },

    applyCoupon: () => {
      if (!this.elements.couponCode) return;
      
      const code = this.elements.couponCode.value.trim().toUpperCase();
      const coupon = this.config.coupons[code];
      
      if (!coupon) {
        this.ui.showToast('Invalid coupon code', 'error');
        return;
      }

      this.state.appliedCoupon = coupon;
      this.elements.couponCode.disabled = true;
      this.cart.updateCartTotal();
      this.ui.showToast(`Coupon applied! ${coupon.value}% off`, 'success');
    }
  };

  // Wishlist functionality
  wishlist = {
    load: () => {
      const wishlistData = this.storage.load(this.config.storageKeys.wishlist);
      this.state.wishlist = wishlistData || [];
      this.wishlist.updateUI();
    },

    save: () => {
      this.storage.save(this.config.storageKeys.wishlist, this.state.wishlist);
      this.wishlist.updateUI();
    },

    addItem: (slug) => {
      const product = this.state.products.find(p => p.slug === slug);
      if (!product) return;

      if (this.wishlist.hasItem(slug)) {
        this.ui.showToast('Item already in wishlist', 'info');
        return;
      }

      this.state.wishlist.push({
        slug: slug,
        name: product.name,
        price: product.price,
        image: product.images[0],
        addedAt: Date.now()
      });

      this.wishlist.save();
      this.ui.showToast(`${product.name} added to wishlist`, 'success');
    },

    removeItem: (slug) => {
      this.state.wishlist = this.state.wishlist.filter(item => item.slug !== slug);
      this.wishlist.save();
    },

    hasItem: (slug) => {
      return this.state.wishlist.some(item => item.slug === slug);
    },

    toggle: () => {
      this.state.isWishlistOpen ? this.wishlist.close() : this.wishlist.open();
    },

    open: () => {
      this.state.isWishlistOpen = true;
      this.elements.wishlistModal?.classList.add('active');
      this.elements.modalOverlay?.classList.add('active');
      document.body.style.overflow = 'hidden';
      
      this.wishlist.renderWishlistItems();
    },

    close: () => {
      this.state.isWishlistOpen = false;
      this.elements.wishlistModal?.classList.remove('active');
      if (!this.state.isMobileMenuOpen && !this.state.isCartOpen) {
        this.elements.modalOverlay?.classList.remove('active');
      }
      document.body.style.overflow = '';
    },

    updateUI: () => {
      const count = this.state.wishlist.length;
      if (this.elements.wishlistCount) {
        this.elements.wishlistCount.textContent = count;
        this.elements.wishlistCount.style.display = count > 0 ? 'inline' : 'none';
      }
    },

    renderWishlistItems: () => {
      if (!this.elements.wishlistItems) return;

      if (this.state.wishlist.length === 0) {
        this.elements.wishlistItems.innerHTML = `
          <div class="empty-wishlist">
            <p>Your wishlist is empty</p>
            <button onclick="window.pinaBakesApp.wishlist.close()" class="btn btn-primary">
              Continue Shopping
            </button>
          </div>
        `;
        return;
      }

      const wishlistHtml = this.state.wishlist.map(item => `
        <div class="wishlist-item" data-slug="${item.slug}">
          <img src="${item.image}" alt="${item.name}" class="wishlist-item-image">
          <div class="wishlist-item-details">
            <h4>${item.name}</h4>
            <div class="wishlist-item-price">${this.formatPrice(item.price)}</div>
            <div class="wishlist-item-actions">
              <button class="btn btn-primary btn-sm" data-action="add-to-cart" data-slug="${item.slug}">
                Add to Cart
              </button>
              <button class="btn btn-secondary btn-sm" data-action="remove" data-slug="${item.slug}">
                Remove
              </button>
            </div>
          </div>
        </div>
      `).join('');

      this.elements.wishlistItems.innerHTML = wishlistHtml;
      this.wishlist.setupWishlistItemListeners();
    },

    setupWishlistItemListeners: () => {
      // Add to cart buttons
      document.querySelectorAll('[data-action="add-to-cart"]').forEach(btn => {
        this.addEventListener(btn, 'click', (e) => {
          const slug = btn.dataset.slug;
          this.cart.addItem(slug);
        });
      });

      // Remove buttons
      document.querySelectorAll('[data-action="remove"]').forEach(btn => {
        this.addEventListener(btn, 'click', (e) => {
          const slug = btn.dataset.slug;
          this.wishlist.removeItem(slug);
          this.wishlist.renderWishlistItems();
          this.ui.showToast('Item removed from wishlist', 'info');
        });
      });
    }
  };

  // Checkout functionality
  checkout = {
    handleFormSubmit: async (e) => {
      e.preventDefault();
      
      if (!this.validation.validateCheckoutForm()) {
        this.ui.showToast('Please correct the errors in the form', 'error');
        return;
      }

      this.ui.showLoader();
      this.ui.showToast('Processing your order...', 'info');
      
      try {
        const orderData = this.checkout.prepareOrderData();
        await this.checkout.submitOrder(orderData);
        
        this.checkout.handleSuccessfulOrder();
        
      } catch (error) {
        this.handleError(error, 'Order submission failed');
        this.ui.showToast('Order submission failed. Please try again.', 'error');
      } finally {
        this.ui.hideLoader();
      }
    },

    prepareOrderData: () => {
      const form = this.elements.checkoutForm;
      const formData = new FormData(form);
      
      return {
        customer: {
          name: formData.get('name'),
          email: formData.get('email'),
          phone: formData.get('phone'),
          address: formData.get('address')
        },
        items: this.state.cart.map(item => ({
          name: item.name,
          slug: item.slug,
          quantity: item.quantity,
          price: item.price,
          total: item.price * item.quantity
        })),
        totals: {
          subtotal: this.cart.getTotal(),
          shipping: this.cart.getTotal() >= this.config.freeShippingThreshold ? 0 : this.config.shippingCharge,
          discount: this.state.appliedCoupon ? this.cart.getTotal() * (this.state.appliedCoupon.value / 100) : 0,
          total: this.cart.getTotal() + (this.cart.getTotal() >= this.config.freeShippingThreshold ? 0 : this.config.shippingCharge)
        },
        coupon: this.state.appliedCoupon,
        orderDate: new Date().toISOString(),
        orderId: this.generateOrderId()
      };
    },

    submitOrder: async (orderData) => {
      const response = await this.fetchWithTimeout(this.config.orderWebhook, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData)
      });

      if (!response.ok) {
        throw new Error(`Order submission failed: ${response.status}`);
      }

      return response.json();
    },

    handleSuccessfulOrder: () => {
      // Clear cart
      this.cart.clear();
      
      // Close modals
      this.ui.closeAllModals();
      
      // Reset form
      this.elements.checkoutForm?.reset();
      
      // Show success message
      this.ui.showToast('Order placed successfully! You will receive a confirmation shortly.', 'success', 5000);
      
      // Navigate to home
      this.router.navigate('#/');
    },

    generateOrderId: () => {
      const timestamp = Date.now().toString(36);
      const random = Math.random().toString(36).substring(2);
      return `PB-${timestamp}-${random}`.toUpperCase();
    }
  };

  // Utility methods
  loadUserData() {
    const userData = this.storage.load(this.config.storageKeys.user);
    if (userData) {
      this.state.user = userData;
    }
  }

  updateCurrentYear() { 
    if (this.elements.currentYear) {
      this.elements.currentYear.textContent = new Date().getFullYear();
    }
  }

  setupHeaderScrollEffect() {
    let lastScrollY = window.scrollY;
    
    const handleScroll = this.debounce(() => {
      const currentScrollY = window.scrollY;
      const header = this.elements.header;
      
      if (!header) return;
      
      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        header.classList.add('header-hidden');
      } else {
        header.classList.remove('header-hidden');
      }
      
      lastScrollY = currentScrollY;
    }, 10);

    this.addEventListener(window, 'scroll', handleScroll);
  }

  // Cleanup method for proper disposal
  destroy() {
    // Remove all event listeners
    this.removeAllEventListeners();
    
    // Cancel any ongoing requests
    if (this.abortController) {
      this.abortController.abort();
    }
    
    // Clear timeouts
    clearTimeout(this.toastTimeout);
    clearTimeout(this.searchTimeout);
    
    // Clear DOM references
    this.elements = {};
    
    // Clear state
    this.state = {};
    
    console.log('PiNa Bakes app destroyed');
  }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  console.log('Initializing PiNa Bakes app...');
  window.pinaBakesApp = new PinaBakesApp();
});

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
  if (window.pinaBakesApp) {
    window.pinaBakesApp.destroy();
  }
});

// Handle service worker updates
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js')
      .then(registration => {
        console.log('SW registered: ', registration);
        
        // Listen for SW updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New SW is available, show update prompt
              if (window.pinaBakesApp) {
                window.pinaBakesApp.ui.showToast('New version available! Refresh to update.', 'info', 10000);
              }
            }
          });
        });
      })
      .catch(registrationError => {
        console.log('SW registration failed: ', registrationError);
      });
  });
}

// Global error handling
window.addEventListener('error', (event) => {
  console.error('Global error:', event.error);
  if (window.pinaBakesApp) {
    window.pinaBakesApp.handleError(event.error, 'Global error');
  }
});

// Global promise rejection handling
window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
  if (window.pinaBakesApp) {
    window.pinaBakesApp.handleError(event.reason, 'Unhandled promise rejection');
  }
});
