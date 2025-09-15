// PiNa Bakes - COMPLETE ENHANCED APPLICATION
class PinaBakesApp {
  static CONSTANTS = {
    TIMEOUTS: {
      LOAD_PRODUCTS: 10000,
      TOAST_DEFAULT: 3000,
      TOAST_ERROR: 5000,
      DEBOUNCE_RESIZE: 250,
      NETWORK_REQUEST: 8000
    },
    LIMITS: {
      MAX_CART_ITEMS: 50,
      MAX_SEARCH_RESULTS: 20,
      MIN_SEARCH_LENGTH: 2
    },
    STORAGE: {
      VERSION: '2.0',
      PREFIX: 'pinabakes_v2_'
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
    };

    this.elements = {};
    this.eventListeners = new Map();
    this.init();
  }

  async init() {
    try {
      console.log("Loading PiNa Bakes app...");
      this.cacheElements();
      this.setupEventListeners();
      this.loadUserData();
      this.cart.load();
      this.wishlist.load();
      this.ui.renderSkeletonProducts();

      await Promise.race([
        this.loadProducts(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Loading timeout after 10 seconds')), 
          PinaBakesApp.CONSTANTS.TIMEOUTS.LOAD_PRODUCTS)
        )
      ]);

      this.search.init();
      this.router.handleRoute();
      this.updateCurrentYear();
      this.setupHeaderScrollEffect();
      this.ui.hideLoader();
      
      console.log("PiNa Bakes app initialized successfully!");
    } catch (error) {
      console.error("App initialization failed:", error);
      this.ui.showToast("Failed to load application. Please refresh the page.", "error");
      this.ui.hideLoader();
    }
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
      const response = await fetch("products.json", {
        cache: "no-store",
        headers: {
          "Cache-Control": "no-cache",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const products = await response.json();
      console.log("Raw JSON data:", products);

      if (!Array.isArray(products) || !products.length) {
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

      console.log(`Loaded ${this.state.products.length} products successfully!`);
    } catch (error) {
      console.error("Failed to load products:", error);
      this.ui.showError(`Could not load products: ${error.message}`);
      this.ui.renderProductError(error.message);
    } finally {
      this.state.isLoading = false;
      this.ui.hideLoader();
    }
  }

  normalizeImages(product) {
    if (product.images && Array.isArray(product.images)) {
      return product.images;
    }
    return product.img ? [product.img] : [];
  }

  sanitizeInput(input) {
    if (typeof input !== 'string') return '';
    return input
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '');
  }

  formatPrice(price) {
    return `₹${price}`;
  }

  cacheElements() {
    this.elements = {
      header: document.getElementById("header"),
      mobileMenuToggle: document.querySelector(".mobile-menu-toggle"),
      mobileNav: document.querySelector(".mobile-nav"),
      modalOverlay: document.getElementById("modal-overlay"),
      navLinks: document.querySelectorAll(".nav-link"),
      searchInput: document.getElementById("site-search"),
      searchSuggest: document.getElementById("search-suggestions"),
      searchInputMobile: document.getElementById("site-search-mobile"),
      cartModal: document.getElementById("cart-modal"),
      cartCount: document.getElementById("cart-count"),
      cartItems: document.getElementById("cart-items"),
      cartTotal: document.getElementById("cart-total"),
      checkoutForm: document.getElementById("checkout-form"),
      couponCode: document.getElementById("coupon-code"),
      couponMsg: document.getElementById("coupon-msg"),
      cartSubtotal: document.getElementById("cart-subtotal"),
      cartDiscount: document.getElementById("cart-discount"),
      cartShipping: document.getElementById("cart-shipping"),
      shippingNote: document.getElementById("shipping-note"),
      productsGrid: document.getElementById("products-grid"),
      productDetail: document.getElementById("product-detail"),
      productMainImage: document.getElementById("product-main-image"),
      productThumbnails: document.getElementById("product-thumbnails"),
      productTitle: document.getElementById("product-title"),
      productPrice: document.getElementById("product-price"),
      productTagline: document.getElementById("product-tagline"),
      productFeatures: document.getElementById("product-features"),
      productIngredients: document.getElementById("product-ingredients"),
      nutritionTable: document.getElementById("nutrition-table"),
      addToCartDetail: document.getElementById("add-to-cart-detail"),
      addToWishlistDetail: document.getElementById("add-to-wishlist-detail"),
      toast: document.getElementById("toast"),
      currentYear: document.getElementById("current-year"),
      wishlistModal: document.getElementById("wishlist-modal"),
      wishlistCount: document.getElementById("wishlist-count"),
      wishlistItems: document.getElementById("wishlist-items"),
    };
  }

  setupEventListeners() {
    window.addEventListener("hashchange", () => this.router.handleRoute());
    window.addEventListener("popstate", () => this.router.handleRoute());
    document.addEventListener("keydown", this.handleKeyboardShortcuts.bind(this));
    window.addEventListener("resize", this.debounce(this.handleResize.bind(this), 250));

    if (this.elements.checkoutForm) {
      this.elements.checkoutForm.addEventListener("submit", this.checkout.handleFormSubmit.bind(this));
    }

    if (this.elements.productsGrid) {
      this.elements.productsGrid.addEventListener("click", (e) => {
        const link = e.target.closest('a[href^="#/product/"]');
        if (!link) return;
        e.preventDefault();
        const slug = link.getAttribute("href").split("/").pop();
        this.router.navigate(`#/product/${slug}`);
      });
    }

    if (this.elements.couponCode) {
      this.elements.couponCode.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          this.cart.applyCoupon();
        }
      });
    }

    if (this.elements.mobileMenuToggle) {
      this.elements.mobileMenuToggle.addEventListener("click", this.ui.toggleMobileMenu.bind(this));
    }

    if (this.elements.modalOverlay) {
      this.elements.modalOverlay.addEventListener("click", (e) => {
        if (e.target === this.elements.modalOverlay) {
          this.ui.closeAllModals();
        }
      });
    }

    if (this.elements.searchInput) {
      this.elements.searchInput.addEventListener("input", this.debounce(this.search.handleInput.bind(this), 300));
      this.elements.searchInput.addEventListener("focus", this.search.handleFocus.bind(this));
      this.elements.searchInput.addEventListener("blur", this.search.handleBlur.bind(this));
    }

    // Cart and wishlist buttons
    document.addEventListener('click', (e) => {
      if (e.target.matches('[data-action="toggle-cart"]')) {
        this.cart.toggle();
      }
      if (e.target.matches('[data-action="toggle-wishlist"]')) {
        this.wishlist.toggle();
      }
    });
  }

  handleKeyboardShortcuts(e) {
    if (e.key === 'Escape') {
      this.ui.closeAllModals();
    }
    if (e.ctrlKey && e.key === '/') {
      e.preventDefault();
      if (this.elements.searchInput) {
        this.elements.searchInput.focus();
      }
    }
  }

  handleResize() {
    if (window.innerWidth > 768 && this.state.isMobileMenuOpen) {
      this.ui.closeMobileMenu();
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

    hideLoader: () => {
      document.querySelectorAll(".skeleton, .skeleton-product").forEach(el => {
        el.classList.remove("skeleton", "skeleton-product");
        el.style.display = "none";
      });
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
    },

    closeMobileMenu: () => {
      this.state.isMobileMenuOpen = false;
      this.elements.mobileNav?.classList.remove("active");
      if (!this.state.isCartOpen && !this.state.isWishlistOpen) {
        this.elements.modalOverlay?.classList.remove("active");
      }
      this.elements.mobileMenuToggle?.setAttribute("aria-expanded", "false");
      document.body.style.overflow = "";
    },

    closeAllModals: () => {
      this.ui.closeMobileMenu();
      this.cart.close();
      this.wishlist.close();
    },

    renderSkeletonProducts: () => {
      if (!this.elements.productsGrid) return;
      
      const skeletons = Array(6).fill().map(() => `
        <div class="product-card skeleton-product" aria-hidden="true">
          <div class="skeleton-img"></div>
          <div class="skeleton-content">
            <div class="skeleton-text"></div>
            <div class="skeleton-text"></div>
          </div>
        </div>
      `).join('');
      
      this.elements.productsGrid.innerHTML = skeletons;
    },

    renderProductError: (errorMessage) => {
      if (!this.elements.productsGrid) return;
      
      this.elements.productsGrid.innerHTML = `
        <div class="product-error" role="alert">
          <div class="error-icon">⚠️</div>
          <h3>Unable to Load Products</h3>
          <p><strong>Error:</strong> ${this.sanitizeInput(errorMessage)}</p>
          <div class="error-actions">
            <button onclick="window.location.reload()" class="retry-btn">
              Refresh Page
            </button>
            <button onclick="window.pinaBakesApp.loadProducts()" class="retry-btn secondary">
              Try Again
            </button>
          </div>
        </div>
      `;
    },

    renderProducts: () => {
      if (!this.elements.productsGrid || !this.state.products.length) return;

      const products = this.state.filteredProducts || this.state.products;
      
      if (products.length === 0) {
        this.elements.productsGrid.innerHTML = `
          <div class="no-products">
            <h3>No products found</h3>
            <p>Try adjusting your search or browse all products.</p>
          </div>
        `;
        return;
      }

      const productsHtml = products.map(product => `
        <div class="product-card" data-slug="${product.slug}">
          <div class="product-image-container">
            <img 
              src="${product.images[0]}" 
              alt="${product.sanitizedName}"
              loading="lazy"
              onerror="this.src='assets/images/placeholder.jpg'"
              class="product-image"
            />
            <div class="product-tags">
              ${product.tags ? product.tags.slice(0, 2).map(tag => `<span class="tag">${tag}</span>`).join('') : ''}
            </div>
          </div>
          <div class="product-info">
            <h3 class="product-name">${product.sanitizedName}</h3>
            <p class="product-tagline">${product.sanitizedTagline}</p>
            <div class="product-price-container">
              <span class="product-price">${product.priceFormatted}</span>
            </div>
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
        </div>
      `).join('');

      this.elements.productsGrid.innerHTML = productsHtml;
      
      // Setup product action listeners
      this.setupProductActionListeners();
    }
  };

  setupProductActionListeners() {
    // Add to cart buttons
    document.querySelectorAll('[data-action="add-to-cart"]').forEach(button => {
      button.addEventListener('click', (e) => {
        e.preventDefault();
        const slug = button.dataset.slug;
        this.cart.addItem(slug);
      });
    });

    // Add to wishlist buttons
    document.querySelectorAll('[data-action="add-to-wishlist"]').forEach(button => {
      button.addEventListener('click', (e) => {
        e.preventDefault();
        const slug = button.dataset.slug;
        this.wishlist.addItem(slug);
      });
    });
  }

  // Cart functionality
  cart = {
    load: () => {
      const cartData = localStorage.getItem(this.config.storageKeys.cart);
      this.state.cart = cartData ? JSON.parse(cartData) : [];
      this.cart.updateUI();
    },

    save: () => {
      localStorage.setItem(this.config.storageKeys.cart, JSON.stringify(this.state.cart));
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

    getTotal: () => {
      return this.state.cart.reduce((total, item) => total + (item.price * item.quantity), 0);
    },

    getItemCount: () => {
      return this.state.cart.reduce((count, item) => count + item.quantity, 0);
    },

    updateUI: () => {
      const count = this.cart.getItemCount();
      if (this.elements.cartCount) {
        this.elements.cartCount.textContent = count;
        this.elements.cartCount.style.display = count > 0 ? 'inline' : 'none';
      }
    },

    toggle: () => {
      this.state.isCartOpen ? this.cart.close() : this.cart.open();
    },

    open: () => {
      this.state.isCartOpen = true;
      this.elements.cartModal?.classList.add('active');
      this.elements.modalOverlay?.classList.add('active');
      document.body.style.overflow = 'hidden';
    },

    close: () => {
      this.state.isCartOpen = false;
      this.elements.cartModal?.classList.remove('active');
      if (!this.state.isMobileMenuOpen && !this.state.isWishlistOpen) {
        this.elements.modalOverlay?.classList.remove('active');
      }
      document.body.style.overflow = '';
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
      this.ui.showToast(`Coupon applied! ${coupon.value}% off`, 'success');
    }
  };

  // Wishlist functionality
  wishlist = {
    load: () => {
      const wishlistData = localStorage.getItem(this.config.storageKeys.wishlist);
      this.state.wishlist = wishlistData ? JSON.parse(wishlistData) : [];
      this.wishlist.updateUI();
    },

    save: () => {
      localStorage.setItem(this.config.storageKeys.wishlist, JSON.stringify(this.state.wishlist));
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
      document.title = 'PiNa Bakes - Premium Millet Cookies';
    },

    showProduct: (slug) => {
      const product = this.state.products.find(p => p.slug === slug);
      
      if (!product) {
        this.router.show404();
        return;
      }

      this.state.currentProduct = product;
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

  // Checkout functionality
  checkout = {
    handleFormSubmit: async (e) => {
      e.preventDefault();
      this.ui.showToast('Processing your order...', 'info');
      // Add checkout logic here
    }
  };

  // Utility methods
  loadUserData() {
    // Load user data implementation
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

    window.addEventListener('scroll', handleScroll);
  }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  console.log('Initializing PiNa Bakes app...');
  window.pinaBakesApp = new PinaBakesApp();
});

// Handle service worker updates
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js')
      .then(registration => {
        console.log('SW registered: ', registration);
      })
      .catch(registrationError => {
        console.log('SW registration failed: ', registrationError);
      });
  });
}
