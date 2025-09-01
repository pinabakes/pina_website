// Enhanced PiNa Bakes Application
class PinaBakesApp {
  constructor() {
    this.config = {
      whatsappNumber: '917678506669',
      storageKeys: {
        cart: 'pinabakes_cart',
        user: 'pinabakes_user',
        preferences: 'pinabakes_preferences'
      },
      apiEndpoints: {
        products: 'products.json'
      }
    };

    this.state = {
      products: [],
      cart: [],
      user: null,
      currentProduct: null,
      isLoading: false,
      isMobileMenuOpen: false,
      isCartOpen: false,
      currentImageIndex: 0
    };

    this.elements = {};
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
      this.ui.hideLoader();

      // Ensure hidden overlays never block clicks
      this.ui._applyOverlayPointerSafety();
    } catch (error) {
      console.error('App initialization failed:', error);
      this.ui.showToast('Failed to load application. Please refresh the page.', 'error');
    }
  }

  cacheElements() {
    this.elements = {
      // Header
      header: document.getElementById('header'),
      mobileMenuToggle: document.querySelector('.mobile-menu-toggle'),
      mobileNav: document.querySelector('.mobile-nav'),
      mobileNavOverlay: document.querySelector('.mobile-nav-overlay'),
      navLinks: document.querySelectorAll('.nav-link'),
      
      // Cart
      cartButton: document.querySelector('.cart-button'),
      cartModal: document.getElementById('cart-modal'),
      cartOverlay: document.getElementById('cart-overlay'),
      cartCount: document.getElementById('cart-count'),
      cartItems: document.getElementById('cart-items'),
      cartTotal: document.getElementById('cart-total'),
      checkoutForm: document.getElementById('checkout-form'),
      
      // Products
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
      
      // UI
      toast: document.getElementById('toast'),
      currentYear: document.getElementById('current-year')
    };
  }

  setupEventListeners() {
    // Navigation
    window.addEventListener('hashchange', () => this.router.handleRoute());
    window.addEventListener('popstate', () => this.router.handleRoute());
    
    // Keyboard shortcuts
    document.addEventListener('keydown', this.handleKeyboardShortcuts.bind(this));
    
    // Form submissions
    if (this.elements.checkoutForm) {
      this.elements.checkoutForm.addEventListener('submit', this.checkout.handleFormSubmit.bind(this));
    }
    
    // Click outside to close modals
    document.addEventListener('click', this.handleOutsideClick.bind(this));
    
    // Touch events for mobile swipe
    this.setupTouchEvents();
    
    // Resize handling
    window.addEventListener('resize', this.debounce(this.handleResize.bind(this), 250));

    // 🔒 Bulletproof routing: delegate clicks on product "View Details"
    if (this.elements.productsGrid) {
      this.elements.productsGrid.addEventListener('click', (e) => {
        const link = e.target.closest('a[href^="#/product/"]');
        if (!link) return;
        e.preventDefault();
        const slug = link.getAttribute('href').split('/').pop();
        this.router.navigate(`/product/${slug}`);
      });
    }
  }

  handleKeyboardShortcuts(e) {
    // Escape key closes modals
    if (e.key === 'Escape') {
      this.ui.closeAllModals();
    }
    
    // Product gallery navigation
    if (this.state.currentProduct) {
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        this.gallery.previousImage();
      }
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        this.gallery.nextImage();
      }
    }
  }

  handleOutsideClick(e) {
    // Close mobile menu if clicking outside
    if (this.state.isMobileMenuOpen && 
        !this.elements.mobileNav.contains(e.target) && 
        !this.elements.mobileMenuToggle.contains(e.target)) {
      this.ui.closeMobileMenu();
    }
  }

  setupTouchEvents() {
    let startX = 0;
    let endX = 0;
    
    if (this.elements.productMainImage) {
      this.elements.productMainImage.addEventListener('touchstart', (e) => {
        startX = e.touches[0].clientX;
      }, { passive: true });
      
      this.elements.productMainImage.addEventListener('touchend', (e) => {
        endX = e.changedTouches[0].clientX;
        this.handleSwipe(startX, endX);
      }, { passive: true });
    }
  }

  handleSwipe(startX, endX) {
    const threshold = 50;
    const diff = startX - endX;
    
    if (Math.abs(diff) > threshold) {
      if (diff > 0) {
        this.gallery.nextImage();
      } else {
        this.gallery.previousImage();
      }
    }
  }

  setupIntersectionObserver() {
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '-50px'
    };
    
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const id = entry.target.id;
          this.ui.updateActiveNavLink(id);
        }
      });
    }, observerOptions);
    
    // Observe all main sections
    document.querySelectorAll('section[id]').forEach(section => {
      observer.observe(section);
    });
  }

  setupHeaderScrollEffect() {
    let lastScrollY = window.scrollY;
    
    window.addEventListener('scroll', this.throttle(() => {
      const currentScrollY = window.scrollY;
      
      if (currentScrollY > 100) {
        this.elements.header.classList.add('scrolled');
      } else {
        this.elements.header.classList.remove('scrolled');
      }
      
      lastScrollY = currentScrollY;
    }, 10));
  }

  handleResize() {
    // Close mobile menu on resize to desktop
    if (window.innerWidth > 768 && this.state.isMobileMenuOpen) {
      this.ui.closeMobileMenu();
    }
  }

  updateCurrentYear() {
    if (this.elements.currentYear) {
      this.elements.currentYear.textContent = new Date().getFullYear();
    }
  }

  // Utility functions
  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  throttle(func, limit) {
    let inThrottle;
    return function() {
      const args = arguments;
      const context = this;
      if (!inThrottle) {
        func.apply(context, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  }

  formatPrice(price) {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(price);
  }

  // Data Management
  async loadProducts() {
    if (this.state.products.length > 0) return;
    
    this.state.isLoading = true;
    
    try {
      const response = await fetch(this.config.apiEndpoints.products, {
        headers: {
          'Cache-Control': 'no-cache'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
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
      if (userData) {
        this.state.user = JSON.parse(userData);
        this.checkout.populateForm();
      }
    } catch (error) {
      console.error('Failed to load user data:', error);
    }
  }

  saveUserData(userData) {
    try {
      this.state.user = userData;
      localStorage.setItem(this.config.storageKeys.user, JSON.stringify(userData));
    } catch (error) {
      console.error('Failed to save user data:', error);
    }
  }

  // UI Management
  ui = {
    showToast: (message, type = 'info', duration = 3000) => {
      const toast = this.elements.toast;
      if (!toast) return;
      
      toast.textContent = message;
      toast.className = `toast show ${type}`;
      
      clearTimeout(this.toastTimeout);
      this.toastTimeout = setTimeout(() => {
        toast.classList.remove('show');
      }, duration);
    },

    hideLoader: () => {
      const loaders = document.querySelectorAll('.skeleton');
      loaders.forEach(loader => loader.classList.remove('skeleton'));
    },

    showError: (message) => {
      this.ui.showToast(message, 'error', 5000);
    },

    toggleMobileMenu: () => {
      if (this.state.isMobileMenuOpen) {
        this.ui.closeMobileMenu();
      } else {
        this.ui.openMobileMenu();
      }
    },

    openMobileMenu: () => {
      this.state.isMobileMenuOpen = true;
      this.elements.mobileNav.classList.add('active');
      this.elements.mobileNavOverlay.classList.add('active');
      this.elements.mobileMenuToggle.classList.add('active');
      this.elements.mobileMenuToggle.setAttribute('aria-expanded', 'true');
      // prevent scroll
      document.body.style.overflow = 'hidden';
      // overlay should capture clicks only when active
      if (this.elements.mobileNavOverlay) {
        this.elements.mobileNavOverlay.style.pointerEvents = 'auto';
      }
    },

    closeMobileMenu: () => {
      this.state.isMobileMenuOpen = false;
      this.elements.mobileNav.classList.remove('active');
      this.elements.mobileNavOverlay.classList.remove('active');
      this.elements.mobileMenuToggle.classList.remove('active');
      this.elements.mobileMenuToggle.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
      // make overlay non-clickable when hidden
      if (this.elements.mobileNavOverlay) {
        this.elements.mobileNavOverlay.style.pointerEvents = 'none';
      }
    },

    closeAllModals: () => {
      this.ui.closeMobileMenu();
      this.cart.close();
    },

    updateActiveNavLink: (activeId) => {
      this.elements.navLinks.forEach(link => {
        const href = link.getAttribute('href').substring(1);
        if (href === activeId) {
          link.classList.add('active');
        } else {
          link.classList.remove('active');
        }
      });
    },

    renderProducts: () => {
      if (!this.elements.productsGrid) return;
      
      const productsHTML = this.state.products.map(product => {
        const coverImage = (product.images && product.images.length > 0) 
          ? product.images[0] 
          : product.img;
        
        const isNew = this.isNewProduct(product);
        const isPremium = product.price >= 300;
        
        return `
          <article class="product-card" data-product-id="${product.slug}">
            <div class="product-image-container">
              <img 
                src="${coverImage}" 
                alt="${product.name} cookies by PiNa Bakes"
                class="product-image"
                loading="lazy"
                decoding="async"
              >
              ${isNew ? '<span class="product-badge">New</span>' : ''}
              ${isPremium ? '<span class="product-badge" style="top: 3rem;">Premium</span>' : ''}
            </div>
            <div class="product-content">
              <h3 class="product-title">${product.name}</h3>
              <div class="product-price">${this.formatPrice(product.price)}</div>
              <p class="product-tagline">${product.tagline}</p>
              <div class="product-actions">
                <a href="#/product/${product.slug}" class="btn btn-secondary">View Details</a>
                <button 
                  class="btn btn-primary" 
                  onclick="App.cart.add('${product.slug}')"
                  aria-label="Add ${product.name} to cart"
                >
                  Add to Cart
                </button>
              </div>
            </div>
          </article>
        `;
      }).join('');
      
      this.elements.productsGrid.innerHTML = productsHTML;
      // (No need to reattach the delegated click; we attached it once in setupEventListeners)
    },

    renderProductDetail: (product) => {
      if (!product || !this.elements.productDetail) return;
      
      this.state.currentProduct = product;
      
      // Update product information
      this.elements.productTitle.textContent = product.name;
      this.elements.productPrice.textContent = this.formatPrice(product.price);
      this.elements.productTagline.textContent = product.tagline;
      
      // Setup image gallery
      this.gallery.setup(product);
      
      // Render features
      if (product.bullets && product.bullets.length > 0) {
        this.elements.productFeatures.innerHTML = `
          <h3>Key Features</h3>
          <ul>
            ${product.bullets.map(bullet => `<li>${bullet}</li>`).join('')}
          </ul>
        `;
      } else {
        this.elements.productFeatures.innerHTML = '';
      }
      
      // Render ingredients
      if (product.ingredients && product.ingredients.length > 0) {
        this.elements.productIngredients.innerHTML = 
          product.ingredients.map(ingredient => `<li>${ingredient}</li>`).join('');
      }
      
      // Render nutrition information (placeholder data)
      this.renderNutritionInfo(product);
      
      // Setup add to cart button
      if (this.elements.addToCartDetail) {
        this.elements.addToCartDetail.onclick = () => {
          this.cart.add(product.slug);
        };
      }
      
      // Show product detail section
      this.elements.productDetail.style.display = 'block';
      document.querySelectorAll('section:not(#product-detail)').forEach(section => {
        section.style.display = 'none';
      });
      
      // Scroll to top
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },

    renderNutritionInfo: (product) => {
      const nutritionData = product.nutrition || {
        energy: '— kcal',
        protein: '— g',
        fat: '— g',
        carbs: '— g',
        sugar: '— g',
        fibre: '— g',
        sodium: '— mg'
      };
      
      const nutritionRows = [
        ['Energy', nutritionData.energy],
        ['Protein', nutritionData.protein],
        ['Total Fat', nutritionData.fat],
        ['Carbohydrates', nutritionData.carbs],
        ['Added Sugar', nutritionData.sugar],
        ['Dietary Fibre', nutritionData.fibre],
        ['Sodium', nutritionData.sodium]
      ];
      
      this.elements.nutritionTable.innerHTML = nutritionRows.map(([nutrient, value]) => `
        <tr>
          <td style="padding: 0.75rem; border: 1px solid #dee2e6;">${nutrient}</td>
          <td style="padding: 0.75rem; border: 1px solid #dee2e6;">${value}</td>
        </tr>
      `).join('');
    },

    hideProductDetail: () => {
      this.elements.productDetail.style.display = 'none';
      document.querySelectorAll('section:not(#product-detail)').forEach(section => {
        section.style.display = 'block';
      });
      this.state.currentProduct = null;
    },

    // Ensures overlays never block clicks when hidden
    _applyOverlayPointerSafety: () => {
      if (this.elements.mobileNavOverlay && !this.state.isMobileMenuOpen) {
        this.elements.mobileNavOverlay.style.pointerEvents = 'none';
      }
      if (this.elements.cartOverlay && !this.state.isCartOpen) {
        this.elements.cartOverlay.style.pointerEvents = 'none';
      }
    }
  };

  // Gallery Management
  gallery = {
    setup: (product) => {
      const images = (product.images && product.images.length > 0) 
        ? product.images 
        : [product.img];
      
      this.state.currentImageIndex = 0;
      this.gallery.updateMainImage(images[0], product.name);
      this.gallery.renderThumbnails(images, product.name);
    },

    updateMainImage: (imageSrc, productName) => {
      if (this.elements.productMainImage) {
        this.elements.productMainImage.src = imageSrc;
        this.elements.productMainImage.alt = `${productName} cookies - Image ${this.state.currentImageIndex + 1}`;
      }
    },

    renderThumbnails: (images, productName) => {
      if (!this.elements.productThumbnails || images.length <= 1) return;
      
      this.elements.productThumbnails.innerHTML = images.map((image, index) => `
        <img 
          src="${image}"
          alt="${productName} - Thumbnail ${index + 1}"
          class="product-thumbnail ${index === 0 ? 'active' : ''}"
          onclick="App.gallery.selectImage(${index})"
          loading="lazy"
        >
      `).join('');
    },

    selectImage: (index) => {
      if (!this.state.currentProduct) return;
      
      const images = (this.state.currentProduct.images && this.state.currentProduct.images.length > 0) 
        ? this.state.currentProduct.images 
        : [this.state.currentProduct.img];
      
      if (index >= 0 && index < images.length) {
        this.state.currentImageIndex = index;
        this.gallery.updateMainImage(images[index], this.state.currentProduct.name);
        this.gallery.updateActiveThumbnail(index);
      }
    },

    updateActiveThumbnail: (activeIndex) => {
      const thumbnails = this.elements.productThumbnails.querySelectorAll('.product-thumbnail');
      thumbnails.forEach((thumbnail, index) => {
        thumbnail.classList.toggle('active', index === activeIndex);
      });
    },

    nextImage: () => {
      if (!this.state.currentProduct) return;
      
      const images = (this.state.currentProduct.images && this.state.currentProduct.images.length > 0) 
        ? this.state.currentProduct.images 
        : [this.state.currentProduct.img];
      
      const nextIndex = (this.state.currentImageIndex + 1) % images.length;
      this.gallery.selectImage(nextIndex);
    },

    previousImage: () => {
      if (!this.state.currentProduct) return;
      
      const images = (this.state.currentProduct.images && this.state.currentProduct.images.length > 0) 
        ? this.state.currentProduct.images 
        : [this.state.currentProduct.img];
      
      const prevIndex = (this.state.currentImageIndex - 1 + images.length) % images.length;
      this.gallery.selectImage(prevIndex);
    }
  };

  // Shopping Cart Management
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
      try {
        localStorage.setItem(this.config.storageKeys.cart, JSON.stringify(this.state.cart));
      } catch (error) {
        console.error('Failed to save cart:', error);
      }
    },

    add: (productSlug, quantity = 1) => {
      const product = this.state.products.find(p => p.slug === productSlug);
      if (!product) {
        this.ui.showError('Product not found');
        return;
      }
      
      const existingItem = this.state.cart.find(item => item.slug === productSlug);
      
      if (existingItem) {
        existingItem.quantity += quantity;
      } else {
        this.state.cart.push({
          ...product,
          quantity: quantity
        });
      }
      
      this.cart.save();
      this.cart.render();
      this.ui.showToast(`${product.name} added to cart!`);
      
      // Animate cart button
      this.cart.animateCartButton();
    },

    remove: (productSlug) => {
      this.state.cart = this.state.cart.filter(item => item.slug !== productSlug);
      this.cart.save();
      this.cart.render();
      this.ui.showToast('Item removed from cart');
    },

    updateQuantity: (productSlug, newQuantity) => {
      if (newQuantity <= 0) {
        this.cart.remove(productSlug);
        return;
      }
      
      const item = this.state.cart.find(item => item.slug === productSlug);
      if (item) {
        item.quantity = newQuantity;
        this.cart.save();
        this.cart.render();
      }
    },

    clear: () => {
      this.state.cart = [];
      this.cart.save();
      this.cart.render();
      this.ui.showToast('Cart cleared');
    },

    getTotal: () => {
      return this.state.cart.reduce((total, item) => total + (item.price * item.quantity), 0);
    },

    getItemCount: () => {
      return this.state.cart.reduce((count, item) => count + item.quantity, 0);
    },

    render: () => {
      const itemCount = this.cart.getItemCount();
      
      // Update cart count badge
      if (this.elements.cartCount) {
        this.elements.cartCount.textContent = itemCount;
        this.elements.cartCount.style.display = itemCount > 0 ? 'flex' : 'none';
      }
      
      // Update cart total
      if (this.elements.cartTotal) {
        this.elements.cartTotal.textContent = this.formatPrice(this.cart.getTotal());
      }
      
      // Render cart items
      if (this.elements.cartItems) {
        if (this.state.cart.length === 0) {
          this.elements.cartItems.innerHTML = `
            <div style="text-align: center; padding: 3rem 1rem; color: var(--text-secondary);">
              <svg width="64" height="64" fill="none" stroke="currentColor" viewBox="0 0 24 24" style="margin-bottom: 1rem; opacity: 0.5;">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5m6.5-5v6a2 2 0 11-4 0v-6m4 0V9a2 2 0 10-4 0v4.01" />
              </svg>
              <p>Your cart is empty</p>
              <button class="btn btn-primary" onclick="App.cart.close(); App.router.navigate('products');">
                Browse Products
              </button>
            </div>
          `;
        } else {
          this.elements.cartItems.innerHTML = this.state.cart.map(item => `
            <div class="cart-item">
              <img src="${item.img}" alt="${item.name}" class="cart-item-image">
              <div class="cart-item-details">
                <div class="cart-item-title">${item.name}</div>
                <div class="cart-item-price">${this.formatPrice(item.price)}</div>
                <div class="cart-item-actions">
                  <button 
                    class="quantity-btn" 
                    onclick="App.cart.updateQuantity('${item.slug}', ${item.quantity - 1})"
                    aria-label="Decrease quantity"
                  >-</button>
                  <span style="min-width: 2rem; text-align: center;">${item.quantity}</span>
                  <button 
                    class="quantity-btn" 
                    onclick="App.cart.updateQuantity('${item.slug}', ${item.quantity + 1})"
                    aria-label="Increase quantity"
                  >+</button>
                </div>
              </div>
              <div style="text-align: right;">
                <div style="font-weight: 600;">${this.formatPrice(item.price * item.quantity)}</div>
                <button 
                  onclick="App.cart.remove('${item.slug}')"
                  style="color: #dc2626; background: none; border: none; cursor: pointer; margin-top: 0.5rem; font-size: 0.875rem;"
                  aria-label="Remove ${item.name} from cart"
                >Remove</button>
              </div>
            </div>
          `).join('');
        }
      }
      
      // Show/hide checkout form based on cart contents
      if (this.elements.checkoutForm) {
        this.elements.checkoutForm.style.display = this.state.cart.length > 0 ? 'block' : 'none';
      }
    },

    toggle: () => {
      if (this.state.isCartOpen) {
        this.cart.close();
      } else {
        this.cart.open();
      }
    },

    open: () => {
      this.state.isCartOpen = true;
      this.elements.cartModal.classList.add('active');
      this.elements.cartOverlay.classList.add('active');
      // capture clicks only when active
      if (this.elements.cartOverlay) {
        this.elements.cartOverlay.style.pointerEvents = 'auto';
      }
      document.body.style.overflow = 'hidden';
    },

    close: () => {
      this.state.isCartOpen = false;
      this.elements.cartModal.classList.remove('active');
      this.elements.cartOverlay.classList.remove('active');
      // disable click interception when hidden
      if (this.elements.cartOverlay) {
        this.elements.cartOverlay.style.pointerEvents = 'none';
      }
      document.body.style.overflow = '';
    },

    animateCartButton: () => {
      if (this.elements.cartCount) {
        this.elements.cartCount.style.animation = 'none';
        setTimeout(() => {
          this.elements.cartCount.style.animation = 'cartBounce 0.3s ease';
        }, 10);
      }
    }
  };

  // Checkout Management
  checkout = {
    populateForm: () => {
      if (!this.state.user || !this.elements.checkoutForm) return;
      
      const formFields = ['name', 'phone', 'pincode', 'city', 'address', 'notes'];
      formFields.forEach(field => {
        const element = document.getElementById(`customer-${field}`);
        if (element && this.state.user[field]) {
          element.value = this.state.user[field];
        }
      });
    },

    validateForm: () => {
      const form = this.elements.checkoutForm;
      if (!form) return false;
      
      let isValid = true;
      const errors = {};
      
      // Required fields validation
      const requiredFields = {
        'customer-name': 'Please enter your full name',
        'customer-phone': 'Please enter a valid phone number',
        'customer-pincode': 'Please enter a valid 6-digit pincode',
        'customer-address': 'Please enter your complete address'
      };
      
      Object.entries(requiredFields).forEach(([fieldId, errorMessage]) => {
        const field = document.getElementById(fieldId);
        const value = field.value.trim();
        
        if (!value) {
          errors[fieldId] = errorMessage;
          isValid = false;
        }
      });
      
      // Phone number validation
      const phoneField = document.getElementById('customer-phone');
      const phoneValue = phoneField.value.replace(/\D/g, '');
      if (phoneValue && (phoneValue.length < 10 || phoneValue.length > 12)) {
        errors['customer-phone'] = 'Please enter a valid 10-digit phone number';
        isValid = false;
      }
      
      // Pincode validation
      const pincodeField = document.getElementById('customer-pincode');
      const pincodeValue = pincodeField.value.trim();
      if (pincodeValue && !/^\d{6}$/.test(pincodeValue)) {
        errors['customer-pincode'] = 'Pincode must be exactly 6 digits';
        isValid = false;
      }
      
      // Display errors
      this.checkout.clearErrors();
      Object.entries(errors).forEach(([fieldId, errorMessage]) => {
        this.checkout.showFieldError(fieldId, errorMessage);
      });
      
      return isValid;
    },

    showFieldError: (fieldId, message) => {
      const field = document.getElementById(fieldId);
      const errorElement = field.parentNode.querySelector('.form-error');
      
      if (errorElement) {
        errorElement.textContent = message;
        errorElement.classList.add('show');
      }
      
      field.style.borderColor = '#dc2626';
    },

    clearErrors: () => {
      const form = this.elements.checkoutForm;
      if (!form) return;
      
      form.querySelectorAll('.form-error').forEach(error => {
        error.classList.remove('show');
      });
      
      form.querySelectorAll('.form-input, .form-textarea').forEach(field => {
        field.style.borderColor = '';
      });
    },

    handleFormSubmit: (e) => {
      e.preventDefault();
      this.checkout.proceed();
    },

    proceed: () => {
      if (this.state.cart.length === 0) {
        this.ui.showToast('Your cart is empty!', 'error');
        return;
      }
      
      if (!this.checkout.validateForm()) {
        this.ui.showToast('Please fill in all required fields correctly.', 'error');
        return;
      }
      
      // Collect form data
      const formData = {
        name: document.getElementById('customer-name').value.trim(),
        phone: document.getElementById('customer-phone').value.trim(),
        pincode: document.getElementById('customer-pincode').value.trim(),
        city: document.getElementById('customer-city').value.trim(),
        address: document.getElementById('customer-address').value.trim(),
        notes: document.getElementById('customer-notes').value.trim()
      };
      
      // Save user data
      this.saveUserData(formData);
      
      // Generate WhatsApp message
      const message = this.checkout.generateWhatsAppMessage(formData);
      
      // Open WhatsApp
      const whatsappUrl = `https://wa.me/${this.config.whatsappNumber}?text=${encodeURIComponent(message)}`;
      window.open(whatsappUrl, '_blank');
      
      // Show success message
      this.ui.showToast('Redirecting to WhatsApp...', 'success');
    },

    generateWhatsAppMessage: (customerData) => {
      const total = this.cart.getTotal();
      const itemsList = this.state.cart.map(item => 
        `• ${item.name} (×${item.quantity}) - ${this.formatPrice(item.price * item.quantity)}`
      ).join('\n');
      
      const message = `🍪 *PiNa Bakes Order Request*

*Items Ordered:*
${itemsList}

*Total Amount: ${this.formatPrice(total)}*

*Customer Details:*
👤 Name: ${customerData.name}
📱 Phone: ${customerData.phone}
📮 Pincode: ${customerData.pincode}
🏙️ City: ${customerData.city || 'Not specified'}
🏠 Address: ${customerData.address}
📝 Notes: ${customerData.notes || 'None'}

Thank you for choosing PiNa Bakes! 🙏

Please confirm the order and let me know the delivery timeline.`;

      return message;
    }
  };

  // Router Management
  router = {
    handleRoute: () => {
      const hash = window.location.hash || '#home';
      // console.log('route →', hash); // uncomment for debugging

      if (hash.startsWith('#/product/')) {
        const productSlug = hash.split('/')[2];
        this.router.showProduct(productSlug);
      } else {
        this.router.showSection(hash.substring(1));
      }
    },

    navigate: (path) => {
      window.location.hash = path;
    },

    showProduct: async (slug) => {
      await this.loadProducts();
      
      const product = this.state.products.find(p => p.slug === slug);
      if (!product) {
        this.router.navigate('products');
        this.ui.showError('Product not found');
        return;
      }
      
      this.ui.renderProductDetail(product);
    },

    showSection: (sectionId) => {
      this.ui.hideProductDetail();
      
      // Scroll to section if not home
      if (sectionId && sectionId !== 'home') {
        const section = document.getElementById(sectionId);
        if (section) {
          section.scrollIntoView({ behavior: 'smooth' });
        }
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  };

  // Utility methods
  isNewProduct(product) {
    // Consider products as "new" if they're in the premium range or have special keywords
    return product.price >= 300 || 
           product.name.toLowerCase().includes('new') ||
           product.tagline.toLowerCase().includes('new');
  }
}

// Initialize the application
const App = new PinaBakesApp();

// Export for global access (for onclick handlers in HTML)
window.App = App;

// Service Worker Registration (optional, safer path for GitHub Pages subfolder)
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js')
      .then(registration => {
        console.log('SW registered: ', registration);
      })
      .catch(registrationError => {
        console.log('SW registration failed: ', registrationError);
      });
  });
}
