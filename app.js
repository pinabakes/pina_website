// PiNa Bakes - COMPLETE FIXED VERSION WITH ALL UPDATES
class PinaBakesApp {
  constructor() {
    this.config = {
      orderWebhook: "https://script.google.com/macros/s/AKfycbwR_3cz5m-FOJertmmRos7-Zc7nundBbNTJ0HuZoLPZ9gHuDwxNO9Th4ThXIru_Kztc/exec",
      whatsappNumber: "917678506669",
      storageKeys: {
        cart: "pinabakes_cart",
        user: "pinabakes_user",
        wishlist: "pinabakes_wishlist",
        orders: "pinabakes_orders",
      },
      apiEndpoints: {
        products: "products.json",
      },
      coupons: { PINA10: { type: "percent", value: 10 } },
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
    };

    this.elements = {};
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
          setTimeout(() => reject(new Error('Loading timeout after 10 seconds')), 10000)
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
        headers: { "Cache-Control": "no-cache" },
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
        images: this.normalizeImages(p)
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
  }

  ui = {
    showToast: (message, type = "info", duration = 3000) => {
      const toast = this.elements.toast;
      if (!toast) return;
      toast.textContent = message;
      toast.className = `toast show ${type}`;
      clearTimeout(this.toastTimeout);
      this.toastTimeout = setTimeout(() => toast.classList.remove("show"), duration);
    },

    hideLoader: () => {
      document.querySelectorAll(".skeleton, .skeleton-product").forEach(el => {
        el.classList.remove("skeleton", "skeleton-product");
        el.style.display = "none";
      });
    },

    showError: (message) => this.ui.showToast(message, "error", 5000),

    toggleMobileMenu: () => {
      this.state.isMobileMenuOpen ? this.ui.closeMobileMenu() : this.ui.openMobileMenu();
    },

    openMobileMenu: () => {
      this.state.isMobileMenuOpen = true;
      this.elements.mobileNav.classList.add("active");
      this.elements.modalOverlay.classList.add("active");
      this.elements.mobileMenuToggle.setAttribute("aria-expanded", "true");
      document.body.style.overflow = "hidden";
    },

    closeMobileMenu: () => {
      this.state.isMobileMenuOpen = false;
      this.elements.mobileNav.classList.remove("active");
      if (!this.state.isCartOpen && !this.state.isWishlistOpen) {
        this.elements.modalOverlay.classList.remove("active");
      }
      this.elements.mobileMenuToggle.setAttribute("aria-expanded", "false");
      document.body.style.overflow = "";
    },

    closeAllModals: () => {
      this.ui.closeMobileMenu();
      this.cart.close();
      this.wishlist.close();
    },

    renderSkeletonProducts: () => {
      if (!this.elements.productsGrid) return;
      const skeletons = Array(6).fill().map(() => '<div class="skeleton-product"></div>').join('');
      this.elements.productsGrid.innerHTML = skeletons;
    },

    renderProductError: (errorMessage) => {
      if (!this.elements.productsGrid) return;
      this.elements.productsGrid.innerHTML = `
        <div style="grid-column:1/-1;padding:2rem;text-align:center;border:1px solid #fecaca;background:#fee2e2;border-radius:12px;color:#b91c1c;">
          <h3>Could not load products</h3>
          <p><strong>Error:</strong> ${errorMessage}</p>
          <p style="margin-top:1rem;"><strong>Please check:</strong></p>
          <ul style="text-align:left;max-width:400px;margin:1rem auto 0;">
            <li>• products.json file exists in same folder as index.html</li>
            <li>• JSON file is valid and not corrupted</li>
            <li>• You're running on a web server (not file://)</li>
          </ul>
          <button onclick="location.reload()" class="btn btn-primary" style="margin-top:1rem;">Reload Page</button>
        </div>
      `;
    },

    renderProducts: () => {
      if (!this.elements.productsGrid) return;
      const products = this.state.filteredProducts || this.state.products;

      if (!products.length) {
        this.elements.productsGrid.innerHTML = `
          <div style="grid-column:1/-1;padding:2rem;text-align:center;color:var(--text-secondary);">
            <p>No products found.</p>
          </div>`;
        return;
      }

      const html = products.map(product => `
        <article class="product-card" data-product-id="${product.slug}">
          <div class="product-image-container">
            <img src="${product.img}"
                alt="${product.name} cookies by PiNa Bakes"
                class="product-image"
                loading="lazy"
                width="600" height="600"
                onerror="this.src='https://via.placeholder.com/600x600/f3f4f6/9ca3af?text=No+Image';">
            ${product.price >= 300 ? '<span class="product-badge">Premium</span>' : ''}
          </div>
          <div class="product-content">
            <h3 class="product-title">${product.name}</h3>
            <div class="product-price">${this.formatPrice(product.price)}</div>
            <p class="product-tagline">${product.tagline}</p>
            <div class="product-actions">
              <a href="#/product/${product.slug}" class="btn btn-secondary">View Details</a>
              <button class="btn btn-primary" onclick="App.cart.add('${product.slug}')">Add to Cart</button>
              <button class="btn btn-outline" onclick="App.wishlist.add('${product.slug}')">♡</button>
            </div>
          </div>
        </article>
      `).join('');
      
      this.elements.productsGrid.innerHTML = html;
    },

    renderProductDetail: (product) => {
      if (!product || !this.elements.productDetail) return;
      this.state.currentProduct = product;

      this.elements.productTitle.textContent = product.name;
      this.elements.productPrice.textContent = this.formatPrice(product.price);
      this.elements.productTagline.textContent = product.tagline;

      this.gallery.setup(product);

      if (product.bullets && product.bullets.length > 0) {
        this.elements.productFeatures.innerHTML = `<h3>Key Features</h3><ul>${product.bullets
          .map((b) => `<li>${b}</li>`)
          .join("")}</ul>`;
      } else {
        this.elements.productFeatures.innerHTML = "";
      }

      if (product.ingredients && product.ingredients.length > 0) {
        this.elements.productIngredients.innerHTML = product.ingredients
          .map((ing) => `<li>${ing}</li>`)
          .join("");
      } else {
        this.elements.productIngredients.innerHTML = "";
      }

      this.ui.renderNutritionInfo(product);

      if (this.elements.addToCartDetail)
        this.elements.addToCartDetail.onclick = () => this.cart.add(product.slug);
      if (this.elements.addToWishlistDetail)
        this.elements.addToWishlistDetail.onclick = () => this.wishlist.add(product.slug);

      this.elements.productDetail.style.display = "block";
      document.querySelectorAll("main > section").forEach((s) => {
        if (s.id !== "product-detail") s.style.display = "none";
      });

      window.scrollTo({ top: 0, behavior: "smooth" });
    },

    renderNutritionInfo: (product) => {
      const n = product.nutrition || {
        energy: "— kcal", protein: "— g", fat: "— g", carbs: "— g",
        sugar: "— g", fibre: "— g", sodium: "— mg",
      };
      const rows = [
        ["Energy", n.energy], ["Protein", n.protein], ["Total Fat", n.fat],
        ["Carbohydrates", n.carbs], ["Added Sugar", n.sugar], 
        ["Dietary Fibre", n.fibre], ["Sodium", n.sodium],
      ];
      this.elements.nutritionTable.innerHTML = rows
        .map(([k, v]) => 
          `<tr><td style="padding: .75rem; border: 1px solid #dee2e6;">${k}</td><td style="padding: .75rem; border: 1px solid #dee2e6;">${v}</td></tr>`
        ).join("");
    },

    hideProductDetail: () => {
      document.querySelectorAll("main > section").forEach((s) => {
        if (s.id !== "product-detail") s.style.display = ""; // ← revert to CSS default
      });
      if (this.elements.productDetail) this.elements.productDetail.style.display = "none";
      this.state.currentProduct = null;
    },
  };

  gallery = {
    setup: (product) => {
      const images = this.normalizeImages(product);
      this.state.currentImageIndex = 0;
      this.gallery.updateMainImage(images[0], product.name);
      this.gallery.renderThumbnails(images, product.name);
    },

    updateMainImage: (src, productName) => {
      const img = this.elements.productMainImage;
      if (!img) return;
      img.src = src;
      img.alt = `${productName} cookies - Main image`;
    },

    renderThumbnails: (images, productName) => {
      if (!this.elements.productThumbnails) return;
      this.elements.productThumbnails.innerHTML = images
        .map((image, index) => 
          `<img src="${image}" 
                alt="${productName} - Thumbnail ${index + 1}"
                class="product-thumbnail ${index === 0 ? "active" : ""}"
                loading="lazy"
                width="80" height="80"
                onclick="App.gallery.selectImage(${index})">`
        ).join("");
    },

    selectImage: (index) => {
      if (!this.state.currentProduct) return;
      const images = this.normalizeImages(this.state.currentProduct);
      if (index >= 0 && index < images.length) {
        this.state.currentImageIndex = index;
        this.gallery.updateMainImage(images[index], this.state.currentProduct.name);
        this.gallery.updateActiveThumbnail(index);
      }
    },

    updateActiveThumbnail: (activeIndex) => {
      const thumbs = this.elements.productThumbnails?.querySelectorAll(".product-thumbnail") || [];
      thumbs.forEach((t, i) => t.classList.toggle("active", i === activeIndex));
    },
  };

  cart = {
    load: () => {
      try {
        const saved = localStorage.getItem(this.config.storageKeys.cart);
        this.state.cart = saved ? JSON.parse(saved) : [];
        this.cart.render();
      } catch (error) {
        console.error("Failed to load cart:", error);
        this.state.cart = [];
      }
    },

    save: () => {
      try {
        localStorage.setItem(this.config.storageKeys.cart, JSON.stringify(this.state.cart));
      } catch (error) {
        console.error("Failed to save cart:", error);
      }
    },

    add: (productSlug, quantity = 1) => {
      const product = this.state.products.find(p => p.slug === productSlug);
      if (!product) {
        this.ui.showError("Product not found");
        return;
      }
      
      const existing = this.state.cart.find(item => item.slug === productSlug);
      if (existing) {
        existing.quantity += quantity;
      } else {
        this.state.cart.push({ ...product, quantity });
      }

      this.cart.save();
      this.cart.render();
      this.ui.showToast(`${product.name} added to cart!`, "success");
    },

    remove: (slug) => {
      this.state.cart = this.state.cart.filter(item => item.slug !== slug);
      this.cart.save();
      this.cart.render();
      this.ui.showToast("Item removed from cart");
    },

    updateQuantity: (slug, newQuantity) => {
      if (newQuantity <= 0) {
        return this.cart.remove(slug);
      }
      
      const item = this.state.cart.find(item => item.slug === slug);
      if (item) {
        item.quantity = newQuantity;
        this.cart.save();
        this.cart.render();
      }
    },

    getSubtotal: () => this.state.cart.reduce((total, item) => total + (item.price * item.quantity), 0),

    getDiscount: (subtotal) => {
      const c = this.state.appliedCoupon;
      if (c && c.type === "percent") {
        return Math.round((subtotal * c.value) / 100);
      }
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
      const code = (input?.value || "").trim().toUpperCase();
      if (!code) {
        this.state.appliedCoupon = null;
        this.cart.render();
        return;
      }
      const def = this.config.coupons[code];
      if (!def) {
        this.state.appliedCoupon = null;
        this.cart.render();
        this.ui.showToast("Invalid coupon code", "error");
        if (this.elements.couponMsg) this.elements.couponMsg.textContent = "Invalid code";
        return;
      }
      this.state.appliedCoupon = { code, ...def };
      this.cart.render();
      this.ui.showToast(`Coupon applied: ${code} (${def.value}% off)`, "success");
      if (this.elements.couponMsg)
        this.elements.couponMsg.textContent = `Applied ${code}: ${def.value}% off`;
    },

    render: () => {
      const totalItems = this.state.cart.reduce((count, item) => count + item.quantity, 0);
      if (this.elements.cartCount) {
        this.elements.cartCount.textContent = totalItems;
        this.elements.cartCount.style.display = totalItems > 0 ? "flex" : "none";
      }

      if (this.elements.cartItems) {
        if (this.state.cart.length === 0) {
          this.elements.cartItems.innerHTML = `
            <div style="text-align:center;padding:3rem 1rem;color:var(--text-secondary);">
              <svg width="64" height="64" fill="none" stroke="currentColor" viewBox="0 0 24 24" style="margin-bottom:1rem;opacity:.5;">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5m6.5-5v6a2 2 0 11-4 0v-6m4 0V9a2 2 0 10-4 0v4.01"/>
              </svg>
              <p>Your cart is empty</p>
              <button class="btn btn-primary" onclick="App.cart.close(); App.router.navigate('#products');">Browse Products</button>
            </div>`;
        } else {
          this.elements.cartItems.innerHTML = this.state.cart
            .map((item) => `
            <div class="cart-item">
              <img src="${item.img}" alt="${item.name}" class="cart-item-image">
              <div class="cart-item-details" style="flex: 1;">
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
          `).join("");
        }
      }

      const subtotal = this.cart.getSubtotal();
      const discount = this.cart.getDiscount(subtotal);
      const afterDiscount = Math.max(0, subtotal - discount);
      const shipping = this.cart.getShipping(afterDiscount);
      const total = afterDiscount + shipping;

      if (this.elements.cartSubtotal)
        this.elements.cartSubtotal.textContent = this.formatPrice(subtotal);
      if (this.elements.cartDiscount)
        this.elements.cartDiscount.textContent = discount > 0 ? `- ${this.formatPrice(discount)}` : this.formatPrice(0);
      if (this.elements.cartShipping)
        this.elements.cartShipping.textContent = this.formatPrice(shipping);
      if (this.elements.shippingNote)
        this.elements.shippingNote.textContent = `Shipping ₹${this.config.shippingCharge} applies below ₹${this.config.freeShippingThreshold}. Free shipping on orders ₹${this.config.freeShippingThreshold}+`;
      if (this.elements.cartTotal)
        this.elements.cartTotal.textContent = this.formatPrice(total);
      if (this.elements.checkoutForm)
        this.elements.checkoutForm.style.display = this.state.cart.length > 0 ? "block" : "none";
    },

    toggle: () => (this.state.isCartOpen ? this.cart.close() : this.cart.open()),

    open: () => {
      this.state.isCartOpen = true;
      this.elements.cartModal.classList.add("active");
      this.elements.modalOverlay.classList.add("active");
      document.body.style.overflow = "hidden";
    },

    close: () => {
      this.state.isCartOpen = false;
      this.elements.cartModal.classList.remove("active");
      if (!this.state.isMobileMenuOpen && !this.state.isWishlistOpen) {
        this.elements.modalOverlay.classList.remove("active");
      }
      document.body.style.overflow = "";
    },
  };

  wishlist = {
    load: () => {
      try {
        const saved = localStorage.getItem(this.config.storageKeys.wishlist);
        this.state.wishlist = saved ? JSON.parse(saved) : [];
        this.wishlist.render();
      } catch (e) {
        console.error("Failed to load wishlist:", e);
        this.state.wishlist = [];
      }
    },

    save: () => {
      try {
        localStorage.setItem(this.config.storageKeys.wishlist, JSON.stringify(this.state.wishlist));
      } catch (e) {
        console.error("Failed to save wishlist:", e);
      }
    },

    add: (productSlug) => {
      const product = this.state.products.find((p) => p.slug === productSlug);
      if (!product) return this.ui.showError("Product not found");
      
      const exists = this.state.wishlist.find((i) => i.slug === productSlug);
      if (exists) {
        this.ui.showToast("Already in wishlist");
        return;
      }
      
      this.state.wishlist.push({ ...product });
      this.wishlist.save();
      this.wishlist.render();
      this.ui.showToast(`${product.name} added to wishlist`);
    },

    remove: (slug) => {
      this.state.wishlist = this.state.wishlist.filter((i) => i.slug !== slug);
      this.wishlist.save();
      this.wishlist.render();
      this.ui.showToast("Removed from wishlist");
    },

    moveToCart: (slug) => {
      const item = this.state.wishlist.find((i) => i.slug === slug);
      if (!item) return;
      this.cart.add(slug, 1);
      this.wishlist.remove(slug);
    },

    moveAllToCart: () => {
      this.state.wishlist.forEach((i) => this.cart.add(i.slug, 1));
      this.state.wishlist = [];
      this.wishlist.save();
      this.wishlist.render();
      this.ui.showToast("Moved all to cart");
    },

    render: () => {
      const count = this.state.wishlist.length;
      if (this.elements.wishlistCount) {
        this.elements.wishlistCount.textContent = count;
        this.elements.wishlistCount.style.display = count > 0 ? "flex" : "none";
      }

      if (this.elements.wishlistItems) {
        if (count === 0) {
          this.elements.wishlistItems.innerHTML = `
            <div style="text-align:center; padding:3rem 1rem; color:var(--text-secondary);">
              <svg width="64" height="64" viewBox="0 0 24 24" style="margin-bottom:1rem; opacity:.5;">
                <path d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 8.25 12 9 12 .75 0 9-4.78 9-12z" fill="currentColor"/>
              </svg>
              <p>Your wishlist is empty</p>
              <button class="btn btn-primary" onclick="App.wishlist.close(); App.router.navigate('#products');">Browse Products</button>
            </div>`;
        } else {
          this.elements.wishlistItems.innerHTML = this.state.wishlist
            .map((item) => `
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
          `).join("");
        }
      }
    },

    toggle: () => (this.state.isWishlistOpen ? this.wishlist.close() : this.wishlist.open()),

    open: () => {
      this.state.isWishlistOpen = true;
      this.elements.wishlistModal.classList.add("active");
      this.elements.modalOverlay.classList.add("active");
      document.body.style.overflow = "hidden";
    },

    close: () => {
      this.state.isWishlistOpen = false;
      this.elements.wishlistModal.classList.remove("active");
      if (!this.state.isMobileMenuOpen && !this.state.isCartOpen) {
        this.elements.modalOverlay.classList.remove("active");
      }
      document.body.style.overflow = "";
    },
  };

  checkout = {
    populateForm: () => {
      if (!this.state.user || !this.elements.checkoutForm) return;
      ["name", "phone", "pincode", "city", "address", "notes"].forEach((field) => {
        const el = document.getElementById(`customer-${field}`);
        if (el && this.state.user[field]) el.value = this.state.user[field];
      });
    },

    handleFormSubmit: (e) => {
      e.preventDefault();
      this.checkout.proceed();
    },

    proceed: () => {
      if (this.state.cart.length === 0) {
        return this.ui.showToast("Your cart is empty!", "error");
      }

      const formData = {
        name: (document.getElementById("customer-name")?.value || "").trim(),
        phone: (document.getElementById("customer-phone")?.value || "").trim(),
        pincode: (document.getElementById("customer-pincode")?.value || "").trim(),
        city: (document.getElementById("customer-city")?.value || "").trim(),
        address: (document.getElementById("customer-address")?.value || "").trim(),
        notes: (document.getElementById("customer-notes")?.value || "").trim(),
      };

      if (!formData.name || !formData.phone || !formData.address) {
        return this.ui.showToast("Please fill in required fields", "error");
      }

      this.saveUserData(formData);

      const subtotal = this.cart.getSubtotal();
      const discount = this.cart.getDiscount(subtotal);
      const subtotalAfter = Math.max(0, subtotal - discount);
      const shipping = this.cart.getShipping(subtotalAfter);
      const total = subtotalAfter + shipping;

      const itemsList = this.state.cart
        .map((i) => `• ${i.name} (×${i.quantity}) - ${this.formatPrice(i.price * i.quantity)}`)
        .join("\n");

      const order = {
        id: `PIN${Date.now()}`,
        createdAt: new Date().toISOString(),
        coupon: this.state.appliedCoupon?.code || "",
        subtotal,
        discount,
        shipping,
        total,
        customer: formData,
        items: this.state.cart.map((i) => ({
          slug: i.slug,
          name: i.name,
          qty: i.quantity,
          price: i.price,
        })),
      };

      try {
        const key = this.config.storageKeys.orders;
        const prev = JSON.parse(localStorage.getItem(key) || "[]");
        prev.push(order);
        localStorage.setItem(key, JSON.stringify(prev));
      } catch (e) {
        console.warn("Could not persist orders locally:", e);
      }

      const message = this.checkout.generateWhatsAppMessage(order, itemsList);
      const whatsappUrl = `https://wa.me/${this.config.whatsappNumber}?text=${encodeURIComponent(message)}`;
      
      this.state.cart = [];
      this.cart.save();
      this.cart.render();
      
      window.open(whatsappUrl, "_blank");
      this.ui.showToast("Order placed! Redirecting to WhatsApp...", "success");
      this.cart.close();
    },

    generateWhatsAppMessage: (order, itemsList) => {
      const lines = [
        `🍪 *PiNa Bakes Order Request*`,
        ``,
        `*Items Ordered:*`,
        itemsList,
        ``,
        `*Subtotal:* ${this.formatPrice(order.subtotal)}`,
      ];
      if (order.discount > 0) {
        lines.push(`*Discount${order.coupon ? ` (${order.coupon})` : ""}:* -${this.formatPrice(order.discount)}`);
      }
      if (order.shipping > 0) lines.push(`*Shipping:* ${this.formatPrice(order.shipping)}`);
      else lines.push(`*Shipping:* Free`);
      lines.push(`*Total Amount:* ${this.formatPrice(order.total)}`, ``);
      
      const c = order.customer;
      lines.push(
        `*Customer Details:*`,
        `👤 Name: ${c.name || "—"}`,
        `📱 Phone: ${c.phone || "—"}`,
        `📮 Pincode: ${c.pincode || "—"}`,
        `🏙️ City: ${c.city || "—"}`,
        `🏠 Address: ${c.address || "—"}`,
        `📝 Notes: ${c.notes || "—"}`,
        ``,
        `Thank you for choosing PiNa Bakes! 🙏`,
        `Please confirm the order and let me know the delivery timeline.`
      );
      return lines.join("\n");
    },
  };

  router = {
    handleRoute: () => {
      const hash = window.location.hash || "#home";
      const m = hash.match(/^#\/product\/([^?#]+)/);
      if (m && m[1]) {
        this.router.showProduct(decodeURIComponent(m[1]));
        return;
      }
      const sectionId = hash.replace(/^#/, "") || "home";
      this.router.showSection(sectionId);
    },

    navigate: (path) => {
      if (path.startsWith("#")) window.location.hash = path;
      else if (path.startsWith("/")) window.location.hash = `#${path}`;
      else window.location.hash = `#${path}`;
    },

    showProduct: (slug) => {
      if (!Array.isArray(this.state.products) || !this.state.products.length) {
        return this.ui.showError("Products not loaded yet.");
      }
      const product = this.state.products.find((p) => String(p.slug) === String(slug));
      if (!product) {
        this.ui.showError(`Product not found: ${slug}`);
        this.router.navigate("#products");
        return;
      }
      this.ui.renderProductDetail(product);
    },

    showSection: (id) => {
      this.ui.hideProductDetail();
      if (id && id !== "home") {
        const el = document.getElementById(id);
        el ? el.scrollIntoView({ behavior: "smooth" }) : window.scrollTo({ top: 0, behavior: "smooth" });
      } else {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    },
  };

  search = {
    init: () => {
      const searchInput = this.elements.searchInput;
      const suggestions = this.elements.searchSuggest;
      
      if (searchInput && suggestions) {
        searchInput.addEventListener('input', (e) => {
          const query = e.target.value.toLowerCase().trim();
          if (!query) {
            suggestions.classList.remove('active');
            return;
          }

          const results = this.state.products.filter(product => 
            product.name.toLowerCase().includes(query) ||
            product.tagline.toLowerCase().includes(query) ||
            product.ingredients.some(ing => ing.toLowerCase().includes(query))
          ).slice(0, 5);

          if (results.length === 0) {
            suggestions.classList.remove('active');
            return;
          }

          suggestions.innerHTML = results.map(product => 
            `<div class="search-suggestion" onclick="App.router.navigate('#/product/${product.slug}'); App.search.closeSuggestions();">
              ${product.name} · ${this.formatPrice(product.price)}
            </div>`
          ).join('');

          suggestions.classList.add('active');
        });

        document.addEventListener('click', (e) => {
          if (!searchInput.contains(e.target) && !suggestions.contains(e.target)) {
            suggestions.classList.remove('active');
          }
        });
      }
    },

    setupSearchIndex: () => {
      console.log("Search index ready");
    },

    closeSuggestions: () => {
      const suggestions = this.elements.searchSuggest;
      if (suggestions) {
        suggestions.classList.remove('active');
      }
    },
  };

  formatPrice(price) {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(price);
  }

  normalizeImages(product) {
    const out = [];
    if (Array.isArray(product.images)) out.push(...product.images.filter(Boolean));
    if (typeof product.images === "string") {
      out.push(...product.images.split(",").map((s) => s.trim()).filter(Boolean));
    }
    ["img", "image", "image1", "image2", "image3", "image4", "image5", "image6"].forEach((k) => {
      const v = product[k];
      if (v && !out.includes(v)) out.push(v);
    });
    return out.length ? out : [product.img].filter(Boolean);
  }

  loadUserData() {
    try {
      const userData = localStorage.getItem(this.config.storageKeys.user);
      if (userData) {
        this.state.user = JSON.parse(userData);
        this.checkout.populateForm();
      }
    } catch (error) {
      console.error("Failed to load user data:", error);
    }
  }

  saveUserData(userData) {
    try {
      this.state.user = userData;
      localStorage.setItem(this.config.storageKeys.user, JSON.stringify(userData));
    } catch (error) {
      console.error("Failed to save user data:", error);
    }
  }

  updateCurrentYear() {
    if (this.elements.currentYear) {
      this.elements.currentYear.textContent = new Date().getFullYear();
    }
  }

  setupHeaderScrollEffect() {
    window.addEventListener("scroll", this.throttle(() => {
      const y = window.scrollY;
      if (y > 100) this.elements.header.classList.add("scrolled");
      else this.elements.header.classList.remove("scrolled");
    }, 10));
  }

  handleKeyboardShortcuts(e) {
    if (e.key === "Escape") this.ui.closeAllModals();
  }

  handleResize() {
    if (window.innerWidth > 768 && this.state.isMobileMenuOpen) this.ui.closeMobileMenu();
  }

  debounce(func, wait) {
    let timeout;
    return (...args) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    };
  }

  throttle(func, limit) {
    let inThrottle;
    return (...args) => {
      if (!inThrottle) {
        func(...args);
        inThrottle = true;
        setTimeout(() => (inThrottle = false), limit);
      }
    };
  }
}

// Initialize the app
const App = new PinaBakesApp();
window.App = App;

console.log("PiNa Bakes app loaded successfully!");
