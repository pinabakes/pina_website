// app.js (enhanced)
// Implements search + filters, image zoom & lightbox, recommendations,
// haptics, analytics hooks, validation helpers, skeletons, and small UX polish.
// Excludes: low stock/high demand banners, subscriptions/loyalty, abandoned-cart email,
// build tool scripts, and Background Sync (as requested).

class PinaBakesApp {
  constructor() {
    this.config = {
      orderWebhook:
        "https://script.google.com/macros/s/AKfycbwR_3cz5m-FOJertmmRos7-Zc7nundBbNTJ0HuZoLPZ9gHuDwxNO9Th4ThXIru_Kztc/exec",
      whatsappNumber: "917678506669",
      storageKeys: {
        cart: "pinabakes_cart",
        user: "pinabakes_user",
        preferences: "pinabakes_preferences",
        orders: "pinabakes_orders",
        wishlist: "pinabakes_wishlist",
      },
      apiEndpoints: {
        products: "products.json",
      },
      coupons: { PINA10: { type: "percent", value: 10 } },
      shippingCharge: 60,
      freeShippingThreshold: 999,
      sw: { path: "./sw.js" },
    };

    this.state = {
      products: [],
      filteredProducts: null, // populated by search/filters; falls back to products
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
      dragDeltaX: 0,
      discountDetails: "",
    };

    this.elements = {};
    this.lightbox = { el: null, img: null, scale: 1, origin: { x: 0, y: 0 }, pan: { x: 0, y: 0 }, pointers: new Map() };

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

      // Show skeletons immediately for perceived speed
      this.ui.renderSkeletonProducts();

      await this.loadProducts();

      this.search.init();         // search bar + filters
      this.analytics.init();      // GA events
      this.router.handleRoute();  // render route/section
      this.updateCurrentYear();
      this.setupIntersectionObserver();
      this.setupHeaderScrollEffect();
      this.ui.hideLoader();
      this.ui._applyOverlayPointerSafety();
      this._registerServiceWorker();
    } catch (error) {
      console.error("App initialization failed:", error);
      this.ui.showToast(
        "Failed to load application. Please refresh the page.",
        "error"
      );
      if (window.Sentry?.captureException) Sentry.captureException(error);
    }
  }

  cacheElements() {
    this.elements = {
      header: document.getElementById("header"),
      mobileMenuToggle: document.querySelector(".mobile-menu-toggle"),
      mobileNav: document.querySelector(".mobile-nav"),
      mobileNavOverlay: document.querySelector(".mobile-nav-overlay"),
      navLinks: document.querySelectorAll(".nav-link"),

      // Search (desktop + mobile)
      searchInput: document.getElementById("site-search"),
      searchSuggest: document.getElementById("search-suggestions"),
      searchInputMobile: document.getElementById("site-search-mobile"),

      // Cart
      cartModal: document.getElementById("cart-modal"),
      cartOverlay: document.getElementById("cart-overlay"),
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

      // Filters
      productsGrid: document.getElementById("products-grid"),
      filterQuery: document.getElementById("filter-query"),
      filterDiet: document.getElementById("filter-diet"),
      priceMin: document.getElementById("price-min"),
      priceMax: document.getElementById("price-max"),
      sortOrder: document.getElementById("sort-order"),

      // Product detail
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

      // Wishlist
      wishlistModal: document.getElementById("wishlist-modal"),
      wishlistOverlay: document.getElementById("wishlist-overlay"),
      wishlistCount: document.getElementById("wishlist-count"),
      wishlistItems: document.getElementById("wishlist-items"),
    };
  }

  setupEventListeners() {
    window.addEventListener("hashchange", () => this.router.handleRoute());
    window.addEventListener("popstate", () => this.router.handleRoute());
    document.addEventListener("keydown", this.handleKeyboardShortcuts.bind(this));
    document.addEventListener("click", this.handleOutsideClick.bind(this));
    window.addEventListener("resize", this.debounce(this.handleResize.bind(this), 250));

    if (this.elements.checkoutForm) {
      this.elements.checkoutForm.addEventListener(
        "submit",
        this.checkout.handleFormSubmit.bind(this)
      );
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

    // Product gallery swipe + lightbox
    if (this.elements.productMainImage) {
      const img = this.elements.productMainImage;
      img.style.touchAction = "pan-y";
      img.addEventListener("pointerdown", this.gallery.onPointerDown.bind(this));
      img.addEventListener("pointermove", this.gallery.onPointerMove.bind(this));
      img.addEventListener("pointerup", this.gallery.onPointerUp.bind(this));
      img.addEventListener("pointercancel", this.gallery.onPointerUp.bind(this));
      img.addEventListener("dragstart", (e) => e.preventDefault());

      // Lightbox / zoom
      img.addEventListener("click", () => this.gallery.openLightbox());
      img.addEventListener("dblclick", () => this.gallery.openLightbox(true));
    }
  }

  handleKeyboardShortcuts(e) {
    if (e.key === "Escape") this.ui.closeAllModals();
    if (this.state.currentProduct) {
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        this.gallery.previousImage();
      }
      if (e.key === "ArrowRight") {
        e.preventDefault();
        this.gallery.nextImage();
      }
    }
  }

  handleOutsideClick(e) {
    if (
      this.state.isMobileMenuOpen &&
      !this.elements.mobileNav.contains(e.target) &&
      !this.elements.mobileMenuToggle.contains(e.target)
    ) {
      this.ui.closeMobileMenu();
    }
  }

  setupIntersectionObserver() {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) this.ui.updateActiveNavLink(entry.target.id);
        });
      },
      { threshold: 0.1, rootMargin: "-50px" }
    );
    document.querySelectorAll("section[id]").forEach((section) => observer.observe(section));
  }

  setupHeaderScrollEffect() {
    window.addEventListener(
      "scroll",
      this.throttle(() => {
        const y = window.scrollY;
        if (y > 100) this.elements.header.classList.add("scrolled");
        else this.elements.header.classList.remove("scrolled");
      }, 10)
    );
  }

  handleResize() {
    if (window.innerWidth > 768 && this.state.isMobileMenuOpen) this.ui.closeMobileMenu();
  }

  updateCurrentYear() {
    if (this.elements.currentYear)
      this.elements.currentYear.textContent = new Date().getFullYear();
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
    if (typeof product.images === "string")
      out.push(
        ...product.images
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
      );
    [
      "img",
      "image",
      "image1",
      "image2",
      "image3",
      "image4",
      "image5",
      "image6",
    ].forEach((k) => {
      const v = product[k];
      if (v && !out.includes(v)) out.push(v);
    });
    return out.length ? out : [product.img].filter(Boolean);
  }

  async loadProducts() {
    if (this.state.products.length > 0) {
      this.search.setupSearchIndex();
      this.ui.renderProducts();
      return;
    }
    this.state.isLoading = true;
    try {
      const url = this.config.apiEndpoints.products;
      const res = await fetch(url, {
        cache: "no-store",
        headers: { "Cache-Control": "no-cache" },
      });
      if (!res.ok) throw new Error(`Fetch ${url} failed: ${res.status} ${res.statusText}`);

      const data = await res.json();
      const arr = Array.isArray(data)
        ? data
        : Array.isArray(data.products)
        ? data.products
        : [];
      if (!arr.length)
        throw new Error('No products found in JSON. Expected an array or { "products": [...] }.');

      // Normalize + enrich
      this.state.products = arr.map((p, idx) => {
        const name = p.name ?? `Product ${idx + 1}`;
        const slug =
          p.slug ??
          (name
            ? name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9\-]/g, "")
            : `p-${idx}`);
        const tags = Array.isArray(p.tags) ? p.tags : [];
        const images = this.normalizeImages(p);
        return {
          name,
          price: Number(p.price ?? 0),
          tagline: p.tagline ?? "",
          img: images[0] || p.img || p.image || "",
          images,
          slug,
          bullets: p.bullets ?? [],
          ingredients: Array.isArray(p.ingredients) ? p.ingredients : [],
          nutrition: p.nutrition ?? undefined,
          tags, // used by search/filters/recommendations
        };
      });

      this.state.filteredProducts = null;
      this.search.setupSearchIndex();
      this.ui.renderProducts();
    } catch (error) {
      console.error("Failed to load products:", error);
      this.ui.showError(String(error));
      if (this.elements.productsGrid) {
        this.elements.productsGrid.innerHTML = `<div style="padding:1rem;color:#b91c1c;background:#fee2e2;border:1px solid #fecaca;border-radius:8px;">Could not load products: ${String(
          error
        )}</div>`;
      }
    } finally {
      this.state.isLoading = false;
      this.ui.hideLoader();
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
      document.querySelectorAll(".skeleton, .skeleton-product").forEach((n) =>
        n.classList.remove("skeleton", "skeleton-product")
      );
    },
    showError: (m) => this.ui.showToast(m, "error", 5000),

    toggleMobileMenu: () =>
      this.state.isMobileMenuOpen ? this.ui.closeMobileMenu() : this.ui.openMobileMenu(),
    openMobileMenu: () => {
      this.state.isMobileMenuOpen = true;
      this.elements.mobileNav.classList.add("active");
      this.elements.mobileNavOverlay.classList.add("active");
      this.elements.mobileMenuToggle.classList.add("active");
      this.elements.mobileMenuToggle.setAttribute("aria-expanded", "true");
      this.ui.lockScroll();
      if (this.elements.mobileNavOverlay)
        this.elements.mobileNavOverlay.style.pointerEvents = "auto";
    },
    closeMobileMenu: () => {
      this.state.isMobileMenuOpen = false;
      this.elements.mobileNav.classList.remove("active");
      this.elements.mobileNavOverlay.classList.remove("active");
      this.elements.mobileMenuToggle.classList.remove("active");
      this.elements.mobileMenuToggle.setAttribute("aria-expanded", "false");
      this.ui.unlockScroll();
      if (this.elements.mobileNavOverlay)
        this.elements.mobileNavOverlay.style.pointerEvents = "none";
    },
    closeAllModals: () => {
      this.ui.closeMobileMenu();
      this.cart.close();
      this.wishlist.close();
      this.gallery.closeLightbox();
    },

    lockScroll: () => {
      if (document.body.dataset.locked === "1") return;
      const scrollY = window.scrollY || document.documentElement.scrollTop || 0;
      document.body.dataset.locked = "1";
      document.body.dataset.scrollY = String(scrollY);
      document.body.style.position = "fixed";
      document.body.style.top = `-${scrollY}px`;
      document.body.style.left = "0";
      document.body.style.right = "0";
      document.body.style.width = "100%";
    },
    unlockScroll: () => {
      if (document.body.dataset.locked !== "1") return;
      const y = parseInt(document.body.dataset.scrollY || "0", 10);
      document.body.dataset.locked = "0";
      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.left = "";
      document.body.style.right = "";
      document.body.style.width = "";
      window.scrollTo(0, y);
    },

    updateActiveNavLink: (activeId) => {
      this.elements.navLinks.forEach((link) => {
        const href = link.getAttribute("href").substring(1);
        link.classList.toggle("active", href === activeId);
      });
    },

    renderSkeletonProducts: () => {
      if (!this.elements.productsGrid) return;
      const count = 6;
      this.elements.productsGrid.innerHTML = Array.from({ length: count })
        .map(() => `<div class="skeleton-product"></div>`)
        .join("");
    },

    renderProducts: () => {
      if (!this.elements.productsGrid) return;
      const list =
        this.state.filteredProducts && this.state.filteredProducts.length >= 0
          ? this.state.filteredProducts
          : this.state.products;

      if (!Array.isArray(list) || list.length === 0) {
        this.elements.productsGrid.innerHTML =
          `<div style="padding:1rem; border: 1px dashed var(--border-medium); border-radius:12px; text-align:center; color:var(--text-secondary)">No products found. Try adjusting filters.</div>`;
        return;
      }

      const productsHTML = list
        .map((product) => {
          const images = this.normalizeImages(product);
          const coverImage = images[0] || product.img;
          const isNew = this.isNewProduct(product);
          const isPremium = product.price >= 300;
          return `
          <article class="product-card" data-product-id="${product.slug}">
            <div class="product-image-container">
              <img src="${coverImage}" alt="${product.name} cookies by PiNa Bakes" class="product-image" loading="lazy" decoding="async">
              ${isNew ? '<span class="product-badge">New</span>' : ""}
              ${isPremium ? '<span class="product-badge" style="top: 3rem;">Premium</span>' : ""}
            </div>
            <div class="product-content">
              <h3 class="product-title">${product.name}</h3>
              <div class="product-price">${this.formatPrice(product.price)}</div>
              <p class="product-tagline">${product.tagline}</p>
              <div class="trust-signals">
                <span class="trust-badge">🌾 100% Natural Millets</span>
                <span class="trust-badge">🏆 FSSAI Certified</span>
                <span class="trust-badge">📦 Safe Packaging</span>
              </div>
              <div class="product-actions" style="margin-top:.75rem;">
                <a href="#/product/${product.slug}" class="btn btn-secondary">View Details</a>
                <button class="btn btn-primary" onclick="App.cart.add('${product.slug}')" aria-label="Add ${product.name} to cart">Add to Cart</button>
                <button class="btn btn-outline" onclick="App.wishlist.add('${product.slug}')" aria-label="Add ${product.name} to wishlist">Wishlist</button>
              </div>
            </div>
          </article>
        `;
        })
        .join("");
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
      
      this.reviews.mount(product);
      
      // Recommendations
      this.ui.renderRecommendations(product);

      this.elements.productDetail.style.display = "block";
      document
        .querySelectorAll("main > section")
        .forEach((s) => {
          if (s.id !== "product-detail") s.style.display = "none";
        });

      window.scrollTo({ top: 0, behavior: "smooth" });

      // track view
      this.analytics.trackEvent("view_item", {
        item_id: product.slug,
        item_name: product.name,
        value: product.price,
        currency: "INR",
      });
    },

    renderRecommendations: (product) => {
      // Remove prior blocks if any
      const container = document.querySelector(".product-detail-container");
      if (!container) return;
      container.querySelectorAll(".reco-block").forEach((n) => n.remove());

      // Similar products
      const similar = App.recommendations.getSimilarProducts(product);
      if (similar.length) {
        const block = document.createElement("section");
        block.className = "reco-block";
        block.style.marginTop = "2rem";
        block.innerHTML = `
          <h3 style="margin-bottom: .5rem;">You may also like</h3>
          <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:1rem;">
            ${similar
              .map(
                (p) => `
              <article class="product-card" data-product-id="${p.slug}">
                <div class="product-image-container" style="aspect-ratio:1.6/1">
                  <img src="${p.img}" alt="${p.name}" class="product-image" loading="lazy">
                </div>
                <div class="product-content">
                  <h4 class="product-title" style="font-size:1rem">${p.name}</h4>
                  <div class="product-price" style="font-size:1.1rem">${App.formatPrice(p.price)}</div>
                  <div class="product-actions" style="margin-top:.5rem;">
                    <a href="#/product/${p.slug}" class="btn btn-secondary">View</a>
                    <button class="btn btn-primary" onclick="App.cart.add('${p.slug}')">Add</button>
                  </div>
                </div>
              </article>`
              )
              .join("")}
          </div>
        `;
        container.appendChild(block);
      }

      // FBT (Frequently bought together)
      const fbt = App.recommendations.getFrequentlyBoughtTogether(product.slug);
      if (fbt.length) {
        const block = document.createElement("section");
        block.className = "reco-block";
        block.style.marginTop = "1.5rem";
        block.innerHTML = `
          <h3 style="margin-bottom: .5rem;">Frequently bought together</h3>
          <div style="display:flex;flex-wrap:wrap;gap:.5rem;">
            ${fbt
              .map(
                (p) => `
            <button class="btn btn-outline" onclick="App.cart.add('${p.slug}')">+ ${p.name}</button>
          `
              )
              .join("")}
          </div>
        `;
        container.appendChild(block);
      }
    },

    renderNutritionInfo: (product) => {
      const n =
        product.nutrition || {
          energy: "— kcal",
          protein: "— g",
          fat: "— g",
          carbs: "— g",
          sugar: "— g",
          fibre: "— g",
          sodium: "— mg",
        };
      const rows = [
        ["Energy", n.energy],
        ["Protein", n.protein],
        ["Total Fat", n.fat],
        ["Carbohydrates", n.carbs],
        ["Added Sugar", n.sugar],
        ["Dietary Fibre", n.fibre],
        ["Sodium", n.sodium],
      ];
      this.elements.nutritionTable.innerHTML = rows
        .map(
          ([k, v]) =>
            `<tr><td style="padding: .75rem; border: 1px solid #dee2e6;">${k}</td><td style="padding: .75rem; border: 1px solid #dee2e6;">${v}</td></tr>`
        )
        .join("");
    },

    hideProductDetail: () => {
      document
        .querySelectorAll("main > section")
        .forEach((s) => {
          if (s.id !== "product-detail") s.style.display = "block";
        });
      if (this.elements.productDetail) this.elements.productDetail.style.display = "none";
      this.state.currentProduct = null;
    },

    _applyOverlayPointerSafety: () => {
      if (this.elements.mobileNavOverlay && !this.state.isMobileMenuOpen)
        this.elements.mobileNavOverlay.style.pointerEvents = "none";
      if (this.elements.cartOverlay && !this.state.isCartOpen)
        this.elements.cartOverlay.style.pointerEvents = "none";
      if (this.elements.wishlistOverlay && !this.state.isWishlistOpen)
        this.elements.wishlistOverlay.style.pointerEvents = "none";
    },
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
      img.style.transition = "none";
      img.style.transform =
        direction === "next"
          ? "translateX(40px)"
          : direction === "prev"
          ? "translateX(-40px)"
          : "translateX(0)";
      img.style.opacity = "0.1";
      requestAnimationFrame(() => {
        img.src = src;
        img.alt = `${productName} cookies - Image ${this.state.currentImageIndex + 1}`;
        img.style.transition = "transform 250ms ease, opacity 250ms ease";
        img.style.transform = "translateX(0)";
        img.style.opacity = "1";
      });
    },

    renderThumbnails: (images, productName) => {
      if (!this.elements.productThumbnails) return;
      this.elements.productThumbnails.innerHTML = images
        .map(
          (image, index) => `
        <img src="${image}" alt="${productName} - Thumbnail ${index + 1}"
             class="product-thumbnail ${index === 0 ? "active" : ""}"
             loading="lazy"
             onclick="App.gallery.selectImage(${index})">
      `
        )
        .join("");
    },

    selectImage: (index) => {
      if (!this.state.currentProduct) return;
      const images = this.normalizeImages(this.state.currentProduct);
      if (index >= 0 && index < images.length) {
        const dir = index > this.state.currentImageIndex ? "next" : "prev";
        this.state.currentImageIndex = index;
        this.gallery.updateMainImage(
          images[index],
          this.state.currentProduct.name,
          dir
        );
        this.gallery.updateActiveThumbnail(index);
      }
    },

    updateActiveThumbnail: (activeIndex) => {
      const thumbs =
        this.elements.productThumbnails?.querySelectorAll(".product-thumbnail") || [];
      thumbs.forEach((t, i) => t.classList.toggle("active", i === activeIndex));
    },

    nextImage: () => {
      if (!this.state.currentProduct) return;
      const images = this.normalizeImages(this.state.currentProduct);
      const nextIndex = (this.state.currentImageIndex + 1) % images.length;
      this.state.currentImageIndex = nextIndex;
      this.gallery.updateMainImage(
        images[nextIndex],
        this.state.currentProduct.name,
        "next"
      );
      this.gallery.updateActiveThumbnail(nextIndex);
    },

    previousImage: () => {
      if (!this.state.currentProduct) return;
      const images = this.normalizeImages(this.state.currentProduct);
      const prevIndex = (this.state.currentImageIndex - 1 + images.length) % images.length;
      this.state.currentImageIndex = prevIndex;
      this.gallery.updateMainImage(
        images[prevIndex],
        this.state.currentProduct.name,
        "prev"
      );
      this.gallery.updateActiveThumbnail(prevIndex);
    },

    onPointerDown: (e) => {
      if (!this.elements.productMainImage) return;
      this.state.isDragging = true;
      this.state.dragStartX = e.clientX;
      this.state.dragDeltaX = 0;
      this.elements.productMainImage.setPointerCapture?.(e.pointerId);
      document.body.style.userSelect = "none";
    },

    onPointerMove: (e) => {
      if (!this.state.isDragging || !this.elements.productMainImage) return;
      this.state.dragDeltaX = e.clientX - this.state.dragStartX;
      const t = Math.max(-80, Math.min(80, this.state.dragDeltaX));
      this.elements.productMainImage.style.transform = `translateX(${t}px)`;
      this.elements.productMainImage.style.transition = "none";
    },

    onPointerUp: () => {
      if (!this.elements.productMainImage) return;
      const threshold = 60;
      const delta = this.state.dragDeltaX;
      this.state.isDragging = false;
      document.body.style.userSelect = "";
      if (delta > threshold) this.gallery.previousImage();
      else if (delta < -threshold) this.gallery.nextImage();
      this.elements.productMainImage.style.transition = "transform 200ms ease";
      this.elements.productMainImage.style.transform = "translateX(0)";
      this.state.dragDeltaX = 0;
    },

    // --------- LIGHTBOX / ZOOM ----------
    _ensureLightbox: () => {
      if (this.lightbox.el) return;
      const overlay = document.createElement("div");
      overlay.style.cssText =
        "position:fixed;inset:0;background:rgba(0,0,0,.9);display:none;z-index:500;cursor:grab;";
      overlay.setAttribute("role", "dialog");
      overlay.setAttribute("aria-modal", "true");
      const img = document.createElement("img");
      img.style.cssText =
        "position:absolute;top:50%;left:50%;transform:translate(-50%,-50%) scale(1);max-width:90vw;max-height:85vh;user-select:none;touch-action:none;border-radius:12px;";
      overlay.appendChild(img);

      // Close on backdrop click or ESC
      overlay.addEventListener("click", (e) => {
        if (e.target === overlay) this.gallery.closeLightbox();
      });
      document.addEventListener("keydown", (e) => {
        if (overlay.style.display !== "none" && e.key === "Escape") this.gallery.closeLightbox();
      });

      // Wheel zoom
      overlay.addEventListener("wheel", (e) => {
        e.preventDefault();
        const delta = -e.deltaY;
        const factor = delta > 0 ? 1.08 : 0.92;
        this.gallery._zoomAtPointer(img, factor, e.clientX, e.clientY);
      }, { passive: false });

      // Pointer (pan + pinch)
      overlay.addEventListener("pointerdown", (e) => {
        overlay.setPointerCapture?.(e.pointerId);
        this.lightbox.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
        if (this.lightbox.pointers.size === 1) overlay.style.cursor = "grabbing";
      });

      overlay.addEventListener("pointermove", (e) => {
        const points = this.lightbox.pointers;
        if (!points.has(e.pointerId)) return;

        const old = points.get(e.pointerId);
        points.set(e.pointerId, { x: e.clientX, y: e.clientY });

        if (points.size === 1) {
          // Pan
          const dx = e.clientX - old.x;
          const dy = e.clientY - old.y;
          this.lightbox.pan.x += dx;
          this.lightbox.pan.y += dy;
          this.gallery._applyTransform(img);
        } else if (points.size === 2) {
          // Pinch-zoom
          const arr = Array.from(points.values());
          const [p1, p2] = arr;
          const dist = Math.hypot(p2.x - p1.x, p2.y - p1.y);
          if (!this.lightbox._lastDist) this.lightbox._lastDist = dist;
          const factor = dist / this.lightbox._lastDist;
          // Zoom around midpoint
          const midX = (p1.x + p2.x) / 2;
          const midY = (p1.y + p2.y) / 2;
          this.gallery._zoomAtPointer(img, factor, midX, midY);
          this.lightbox._lastDist = dist;
        }
      });

      const endPointer = (e) => {
        this.lightbox.pointers.delete(e.pointerId);
        this.lightbox._lastDist = null;
        if (this.lightbox.pointers.size === 0) overlay.style.cursor = "grab";
      };
      overlay.addEventListener("pointerup", endPointer);
      overlay.addEventListener("pointercancel", endPointer);
      overlay.addEventListener("pointerleave", endPointer);

      // Double click to reset zoom
      overlay.addEventListener("dblclick", () => {
        this.lightbox.scale = 1;
        this.lightbox.pan = { x: 0, y: 0 };
        this.gallery._applyTransform(img);
      });

      document.body.appendChild(overlay);
      this.lightbox.el = overlay;
      this.lightbox.img = img;
    },

    openLightbox: (zoomIn = false) => {
      if (!this.state.currentProduct) return;
      this.gallery._ensureLightbox();
      const images = this.normalizeImages(this.state.currentProduct);
      const src = images[this.state.currentImageIndex] || images[0];
      this.lightbox.img.src = src;
      this.lightbox.scale = zoomIn ? 1.5 : 1;
      this.lightbox.pan = { x: 0, y: 0 };
      this.gallery._applyTransform(this.lightbox.img);
      this.lightbox.el.style.display = "block";
      this.haptics.vibrate("light");
    },

    closeLightbox: () => {
      if (!this.lightbox.el) return;
      this.lightbox.el.style.display = "none";
    },

    _applyTransform: (img) => {
      img.style.transform = `translate(calc(-50% + ${this.lightbox.pan.x}px), calc(-50% + ${this.lightbox.pan.y}px)) scale(${this.lightbox.scale})`;
    },

    _zoomAtPointer: (img, factor, clientX, clientY) => {
      const rect = img.getBoundingClientRect();
      const offsetX = clientX - rect.left - rect.width / 2 - this.lightbox.pan.x;
      const offsetY = clientY - rect.top - rect.height / 2 - this.lightbox.pan.y;

      // Update pan to zoom around cursor
      this.lightbox.pan.x -= offsetX * (factor - 1);
      this.lightbox.pan.y -= offsetY * (factor - 1);

      // Clamp scale
      const newScale = Math.max(1, Math.min(5, this.lightbox.scale * factor));
      this.lightbox.scale = newScale;
      this.gallery._applyTransform(img);
    },
  };

  cart = {
    load: () => {
      try {
        const savedCart = localStorage.getItem(this.config.storageKeys.cart);
        this.state.cart = savedCart ? JSON.parse(savedCart) : [];
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
      const product = this.state.products.find((p) => p.slug === productSlug);
      if (!product) return this.ui.showError("Product not found");
      const existing = this.state.cart.find((i) => i.slug === productSlug);
      if (existing) existing.quantity += quantity;
      else this.state.cart.push({ ...product, quantity });

      this.cart.save();
      this.cart.render();
      this.ui.showToast(`${product.name} added to cart!`);
      this.cart.animateCartButton();
      this.haptics.vibrate("light");

      // analytics
      this.analytics.trackEvent("add_to_cart", {
        item_id: product.slug,
        item_name: product.name,
        quantity,
        value: product.price * quantity,
        currency: "INR",
      });

      // Abandonment reminder (toast only; no email)
      this.cart.startAbandonmentTimer();
    },

    remove: (slug) => {
      this.state.cart = this.state.cart.filter((i) => i.slug !== slug);
      this.cart.save();
      this.cart.render();
      this.ui.showToast("Item removed from cart");
      this.haptics.vibrate("light");
    },

    updateQuantity: (slug, qty) => {
      if (qty <= 0) return this.cart.remove(slug);
      const item = this.state.cart.find((i) => i.slug === slug);
      if (item) {
        item.quantity = qty;
        this.cart.save();
        this.cart.render();
        this.haptics.vibrate("light");
      }
    },

    clear: () => {
      this.state.cart = [];
      this.cart.save();
      this.cart.render();
      this.ui.showToast("Cart cleared");
    },

    getSubtotal: () =>
      this.state.cart.reduce((t, i) => t + i.price * i.quantity, 0),

    calculateBulkDiscountRate: (quantity) => {
      if (quantity >= 5) return 0.15; // 15%
      if (quantity >= 3) return 0.1;  // 10%
      return 0;
    },

    // Returns number; sets this.state.discountDetails for UI
    getDiscount: (subtotal) => {
      let details = [];
      // Coupon
      const c = this.state.appliedCoupon;
      let couponAmt = 0;
      if (c && c.type === "percent") {
        couponAmt = Math.round((subtotal * c.value) / 100);
        if (couponAmt > 0) details.push(`coupon ${c.code}`);
      }

      // Bulk discount (per item)
      let bulkAmt = 0;
      for (const item of this.state.cart) {
        const rate = this.cart.calculateBulkDiscountRate(item.quantity);
        if (rate > 0) {
          const amt = Math.round(item.price * item.quantity * rate);
          bulkAmt += amt;
        }
      }
      if (bulkAmt > 0) details.push("bulk");

      const totalDisc = Math.max(0, couponAmt + bulkAmt);
      this.state.discountDetails = totalDisc > 0 ? details.join(" + ") : "";
      return totalDisc;
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
      const code = this.util.sanitizeInput((input?.value || "")).trim().toUpperCase();
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
      const itemCount = this.state.cart.reduce((c, i) => c + i.quantity, 0);
      if (this.elements.cartCount) {
        this.elements.cartCount.textContent = itemCount;
        this.elements.cartCount.style.display = itemCount > 0 ? "flex" : "none";
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
          this.elements.cartItems.innerHTML = this.state.cart
            .map(
              (item) => `
            <div class="cart-item">
              <img src="${item.img}" alt="${item.name}" class="cart-item-image">
              <div class="cart-item-details">
                <div class="cart-item-title">${item.name}</div>
                <div class="cart-item-price">${this.formatPrice(item.price)}</div>
                <div class="cart-item-actions">
                  <button class="quantity-btn" onclick="App.cart.updateQuantity('${item.slug}', ${item.quantity - 1})" aria-label="Decrease quantity">-</button>
                  <span style="min-width:2rem; text-align:center;">${item.quantity}</span>
                  <button class="quantity-btn" onclick="App.cart.updateQuantity('${item.slug}', ${item.quantity + 1})" aria-label="Increase quantity">+</button>
                  <button class="btn btn-outline" style="margin-left:.5rem" onclick="App.cart.saveForLater('${item.slug}')">Save for later</button>
                </div>
                ${(() => {
                  const rate = this.cart.calculateBulkDiscountRate(item.quantity);
                  if (!rate) return "";
                  return `<div style="margin-top:.35rem; font-size:.85rem; color:var(--text-secondary)">Bulk discount applied: ${Math.round(rate * 100)}% on this item</div>`;
                })()}
              </div>
              <div style="text-align:right;">
                <div style="font-weight:600;">${this.formatPrice(item.price * item.quantity)}</div>
                <button onclick="App.cart.remove('${item.slug}')" style="color:#dc2626; background:none; border:none; cursor:pointer; margin-top:.5rem; font-size:.875rem;" aria-label="Remove ${item.name} from cart">Remove</button>
              </div>
            </div>
          `
            )
            .join("");
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
        this.elements.cartDiscount.textContent =
          discount > 0
            ? `- ${this.formatPrice(discount)}${this.state.discountDetails ? ` (${this.state.discountDetails})` : ""}`
            : this.formatPrice(0);
      if (this.elements.cartShipping)
        this.elements.cartShipping.textContent = this.formatPrice(shipping);
      if (this.elements.shippingNote)
        this.elements.shippingNote.textContent = `Shipping ₹${this.config.shippingCharge} applies below ₹${this.config.freeShippingThreshold}. Free shipping on orders ₹${this.config.freeShippingThreshold}+`;
      if (this.elements.cartTotal)
        this.elements.cartTotal.textContent = this.formatPrice(total);
      if (this.elements.checkoutForm)
        this.elements.checkoutForm.style.display =
          this.state.cart.length > 0 ? "block" : "none";
    },

    toggle: () => (this.state.isCartOpen ? this.cart.close() : this.cart.open()),

    open: () => {
      this.state.isCartOpen = true;
      this.elements.cartModal.classList.add("active");
      this.elements.cartOverlay.classList.add("active");
      if (this.elements.cartOverlay)
        this.elements.cartOverlay.style.pointerEvents = "auto";
      this.ui.lockScroll();
    },

    close: () => {
      this.state.isCartOpen = false;
      this.elements.cartModal.classList.remove("active");
      this.elements.cartOverlay.classList.remove("active");
      if (this.elements.cartOverlay)
        this.elements.cartOverlay.style.pointerEvents = "none";
      this.ui.unlockScroll();
    },

    animateCartButton: () => {
      if (this.elements.cartCount) {
        this.elements.cartCount.style.animation = "none";
        setTimeout(() => {
          this.elements.cartCount.style.animation = "cartBounce 0.3s ease";
        }, 10);
      }
    },

    startAbandonmentTimer: () => {
      clearTimeout(this._abandonTimer);
      this._abandonTimer = setTimeout(() => {
        if (this.state.cart.length > 0 && !this.state.isCartOpen) {
          this.ui.showToast("Complete your order for fresh cookies! 🍪", "info");
        }
      }, 5 * 60 * 1000);
    },

    saveForLater: (productSlug) => {
      const item = this.state.cart.find((i) => i.slug === productSlug);
      if (!item) return;
      // Move to wishlist (acts as "save for later")
      this.wishlist.add(productSlug);
      this.cart.remove(productSlug);
      this.ui.showToast("Moved to Saved (Wishlist)");
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
        localStorage.setItem(
          this.config.storageKeys.wishlist,
          JSON.stringify(this.state.wishlist)
        );
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
      this.wishlist.animateWishlistButton();
      this.haptics.vibrate("light");
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
              <button class="btn btn-primary" onclick="App.wishlist.close(); App.router.navigate('products');">Browse Products</button>
            </div>`;
        } else {
          this.elements.wishlistItems.innerHTML = this.state.wishlist
            .map(
              (item) => `
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
          `
            )
            .join("");
        }
      }
    },

    toggle: () =>
      this.state.isWishlistOpen ? this.wishlist.close() : this.wishlist.open(),

    open: () => {
      this.state.isWishlistOpen = true;
      this.elements.wishlistModal.classList.add("active");
      this.elements.wishlistOverlay.classList.add("active");
      if (this.elements.wishlistOverlay)
        this.elements.wishlistOverlay.style.pointerEvents = "auto";
      this.ui.lockScroll();
    },

    close: () => {
      this.state.isWishlistOpen = false;
      this.elements.wishlistModal.classList.remove("active");
      this.elements.wishlistOverlay.classList.remove("active");
      if (this.elements.wishlistOverlay)
        this.elements.wishlistOverlay.style.pointerEvents = "none";
      this.ui.unlockScroll();
    },

    animateWishlistButton: () => {
      if (this.elements.wishlistCount) {
        this.elements.wishlistCount.style.animation = "none";
        setTimeout(() => {
          this.elements.wishlistCount.style.animation = "cartBounce 0.3s ease";
        }, 10);
      }
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

    validateForm: () => {
      const phoneField = document.getElementById("customer-phone");
      const pincodeField = document.getElementById("customer-pincode");

      if (phoneField) {
        const digits = phoneField.value.replace(/\D/g, "");
        if (digits && !this.validation.validatePhone(digits)) {
          this.ui.showToast("Phone looks unusual (10 digits expected).", "info");
        }
      }
      if (pincodeField) {
        const pin = pincodeField.value.trim();
        if (pin && !this.validation.validatePincode(pin)) {
          this.ui.showToast("Pincode format looks unusual (6 digits).", "info");
        }
      }
      return true;
    },

    clearErrors: () => {},

    handleFormSubmit: (e) => {
      e.preventDefault();
      this.checkout.proceed();
    },

    proceed: () => {
      if (this.state.cart.length === 0)
        return this.ui.showToast("Your cart is empty!", "error");
      if (!this.checkout.validateForm()) return;

      // sanitize inputs
      const formData = {
        name: this.util.sanitizeInput(
          document.getElementById("customer-name")?.value || ""
        ).trim(),
        phone: this.util.sanitizeInput(
          document.getElementById("customer-phone")?.value || ""
        ).trim(),
        pincode: this.util.sanitizeInput(
          document.getElementById("customer-pincode")?.value || ""
        ).trim(),
        city: this.util.sanitizeInput(
          document.getElementById("customer-city")?.value || ""
        ).trim(),
        address: this.util.sanitizeInput(
          document.getElementById("customer-address")?.value || ""
        ).trim(),
        notes: this.util.sanitizeInput(
          document.getElementById("customer-notes")?.value || ""
        ).trim(),
      };

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

      // Persist locally
      try {
        const key = this.config.storageKeys.orders;
        const prev = JSON.parse(localStorage.getItem(key) || "[]");
        prev.push(order);
        localStorage.setItem(key, JSON.stringify(prev));
      } catch (e) {
        console.warn("Could not persist orders locally:", e);
      }

      // Fire-and-forget webhook to Google Apps Script
      this.backend.sendOrder(order);

      // Analytics
      this.analytics.trackEvent("begin_checkout", {
        value: total,
        currency: "INR",
        coupon: order.coupon || undefined,
        items: order.items.map((it) => ({ item_id: it.slug, item_name: it.name, quantity: it.qty, price: it.price })),
      });

      // WhatsApp handoff for quick confirmation
      const message = this.checkout.generateWhatsAppMessage(order, itemsList);
      const whatsappUrl = `https://wa.me/${this.config.whatsappNumber}?text=${encodeURIComponent(
        message
      )}`;
      window.open(whatsappUrl, "_blank");
      this.ui.showToast("Redirecting to WhatsApp...", "success");
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
      if (order.discount > 0)
        lines.push(`*Discount${order.coupon ? ` (${order.coupon})` : ""}:* -${this.formatPrice(order.discount)}`);
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

    showProduct: async (slug) => {
      await this.loadProducts();
      if (!Array.isArray(this.state.products) || !this.state.products.length) {
        return this.ui.showError("Products not loaded yet.");
      }
      const product = this.state.products.find((p) => String(p.slug) === String(slug));
      if (!product) {
        this.ui.showError(`Product not found: ${slug}`);
        this.router.navigate("products");
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

  backend = {
    sendVisit: async () => {
      if (!this.config.orderWebhook) return;
      try {
        const payload = {
          kind: "visit",
          session: this.telemetry.sessionSnapshot(),
          meta: this.telemetry.metaSnapshot(),
          utm: this.telemetry.utmSnapshot(),
        };
        await fetch(this.config.orderWebhook, {
          method: "POST",
          mode: "no-cors",
          headers: { "Content-Type": "text/plain" },
          body: JSON.stringify(payload),
        });
      } catch (e) {
        console.warn("visit webhook failed", e);
      }
    },

    sendOrder: async (order) => {
      if (!this.config.orderWebhook) return;
      try {
        const payload = {
          kind: "order",
          order,
          session: this.telemetry.sessionSnapshot(),
          meta: this.telemetry.metaSnapshot(),
        };
        await fetch(this.config.orderWebhook, {
          method: "POST",
          mode: "no-cors",
          headers: { "Content-Type": "text/plain" },
          body: JSON.stringify(payload),
        });
      } catch (e) {
        console.warn("order webhook failed", e);
      }
    },

    sendEvent: async (eventName, parameters) => {
      if (!this.config.orderWebhook) return;
      try {
        const payload = {
          kind: "event",
          event: { name: eventName, parameters, at: new Date().toISOString() },
          session: this.telemetry.sessionSnapshot(),
          meta: this.telemetry.metaSnapshot(),
        };
        await fetch(this.config.orderWebhook, {
          method: "POST",
          mode: "no-cors",
          headers: { "Content-Type": "text/plain" },
          body: JSON.stringify(payload),
        });
      } catch (e) {
        console.warn("event webhook failed", e);
      }
    },
  };

  telemetry = {
    key: "pb_session",

    ensureSession: () => {
      try {
        const now = new Date().toISOString();
        const raw = localStorage.getItem("pb_session");
        if (raw) {
          const s = JSON.parse(raw);
          s.lastVisitAt = now;
          localStorage.setItem("pb_session", JSON.stringify(s));
        } else {
          const s = {
            id: "pb_" + Math.random().toString(36).slice(2) + Date.now(),
            firstVisitAt: now,
            lastVisitAt: now,
          };
          localStorage.setItem("pb_session", JSON.stringify(s));
        }
      } catch {}
    },

    sessionSnapshot: () => {
      try {
        return JSON.parse(localStorage.getItem("pb_session") || "{}");
      } catch {
        return {};
      }
    },

    metaSnapshot: () => ({
      page: location.href,
      referrer: document.referrer || "",
      userAgent: navigator.userAgent || "",
      screen: `${window.screen?.width || 0}x${window.screen?.height || 0}`,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "",
    }),

    utmSnapshot: () => {
      const p = new URLSearchParams(location.search);
      return {
        utm_source: p.get("utm_source") || "",
        utm_medium: p.get("utm_medium") || "",
        utm_campaign: p.get("utm_campaign") || "",
      };
    },
  };

  // ---------- SEARCH + FILTERS ----------
  search = {
    index: [],

    init: () => {
      const i = this.elements.searchInput;
      const im = this.elements.searchInputMobile;
      const suggest = this.elements.searchSuggest;

      const bindCommon = (inputEl) => {
        if (!inputEl) return;
        inputEl.addEventListener(
          "input",
          this.debounce(() => {
            const q = this.util.sanitizeInput(inputEl.value || "");
            if (inputEl === i) this.search.showSuggestions(q);
            this.search.applyFilters(); // also filters on the products grid
          }, 150)
        );
        inputEl.addEventListener("keydown", (e) => {
          if (e.key === "Enter") {
            const q = this.util.sanitizeInput(inputEl.value || "");
            this.search.applyFilters();
            this.analytics.trackEvent("search", { search_term: q });
            // if suggestion exists, navigate first result
            const results = this.search.searchProducts(q).slice(0, 1);
            if (results.length) {
              this.router.navigate(`#/product/${results[0].slug}`);
              suggest?.classList.remove("active");
            }
          }
        });
        inputEl.addEventListener("focus", () => {
          if (inputEl === i && inputEl.value) this.search.showSuggestions(inputEl.value);
        });
        inputEl.addEventListener("blur", () => {
          setTimeout(() => suggest?.classList.remove("active"), 120);
        });
      };

      bindCommon(i);
      bindCommon(im);

      // Filters in Products section
      this.elements.filterQuery?.addEventListener(
        "input",
        this.debounce(() => this.search.applyFilters(), 150)
      );
      this.elements.filterDiet?.addEventListener("change", () =>
        this.search.applyFilters()
      );
      this.elements.priceMin?.addEventListener(
        "input",
        this.debounce(() => this.search.applyFilters(), 200)
      );
      this.elements.priceMax?.addEventListener(
        "input",
        this.debounce(() => this.search.applyFilters(), 200)
      );
      this.elements.sortOrder?.addEventListener("change", () =>
        this.search.applyFilters()
      );
    },

    setupSearchIndex: () => {
      const products = this.state.products || [];
      this.search.index = products.map((p) => {
        const hay =
          [p.name, p.tagline, ...(p.ingredients || []), ...(p.tags || [])]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();
        return { slug: p.slug, name: p.name, price: p.price, hay };
      });
    },

    showSuggestions: (query) => {
      const suggest = this.elements.searchSuggest;
      if (!suggest) return;
      const q = (query || "").trim().toLowerCase();
      if (!q) {
        suggest.classList.remove("active");
        suggest.innerHTML = "";
        return;
      }
      const results = this.search.searchProducts(q).slice(0, 6);
      if (!results.length) {
        suggest.classList.remove("active");
        suggest.innerHTML = "";
        return;
      }
      suggest.innerHTML = results
        .map(
          (r) =>
            `<div class="search-suggestion" role="option" onclick="App.router.navigate('#/product/${r.slug}'); App.elements.searchSuggest.classList.remove('active');">${r.name} · ${this.formatPrice(
              r.price
            )}</div>`
        )
        .join("");
      suggest.classList.add("active");
    },

    searchProducts: (query) => {
      const q = (query || "").toLowerCase().trim();
      const tokens = q.split(/\s+/).filter(Boolean);
      const products = this.state.products || [];
      if (!q) return products;

      // basic ranking: count token matches across fields
      const scored = products
        .map((p) => {
          const fields = [
            p.name?.toLowerCase() || "",
            p.tagline?.toLowerCase() || "",
            (p.ingredients || []).join(" ").toLowerCase(),
            (p.tags || []).join(" ").toLowerCase(),
          ];
          const hay = fields.join(" ");
          const score = tokens.reduce((s, t) => (hay.includes(t) ? s + 1 : s), 0);
          return { p, score };
        })
        .filter((r) => r.score > 0)
        .sort((a, b) => b.score - a.score)
        .map((r) => r.p);

      return scored;
    },

    applyFilters: () => {
      const qHeader = (this.elements.searchInput?.value || "").trim();
      const qPanel = (this.elements.filterQuery?.value || "").trim();
      const query = this.util.sanitizeInput((qPanel || qHeader)).toLowerCase();

      const diet = (this.elements.filterDiet?.value || "").toLowerCase();
      const min = parseInt(this.elements.priceMin?.value || "0", 10) || 0;
      const max = parseInt(this.elements.priceMax?.value || "0", 10) || Infinity;
      const sort = this.elements.sortOrder?.value || "";

      let list = this.state.products.slice();

      // search filter
      if (query) {
        const qTokens = query.split(/\s+/).filter(Boolean);
        list = list.filter((p) => {
          const hay =
            [p.name, p.tagline, ...(p.ingredients || []), ...(p.tags || [])]
              .filter(Boolean)
              .join(" ")
              .toLowerCase();
          return qTokens.every((t) => hay.includes(t));
        });
      }

      // diet filter (match in tags or tagline)
      if (diet) {
        list = list.filter((p) => {
          const tagStr = [...(p.tags || []), p.tagline || ""]
            .join(" ")
            .toLowerCase();
          return tagStr.includes(diet);
        });
      }

      // price range
      list = list.filter((p) => p.price >= min && p.price <= max);

      // sort
      if (sort === "price-asc") list.sort((a, b) => a.price - b.price);
      else if (sort === "price-desc") list.sort((a, b) => b.price - a.price);
      else if (sort === "newest")
        list.sort((a, b) => (this.isNewProduct(b) ? 1 : 0) - (this.isNewProduct(a) ? 1 : 0));
      else if (sort === "popular") {
        // naive popularity: by price desc (as placeholder), or by name
        list.sort((a, b) => b.price - a.price || a.name.localeCompare(b.name));
      }

      this.state.filteredProducts = list;
      this.ui.renderProducts();
    },
  };

  // ---------- RECOMMENDATIONS ----------
  recommendations = {
    getSimilarProducts: (currentProduct) => {
      const tset = new Set((currentProduct.tags || []).map((t) => t.toLowerCase()));
      const minPrice = currentProduct.price * 0.7;
      const maxPrice = currentProduct.price * 1.3;
      const filtered = this.state.products
        .filter(
          (p) =>
            p.slug !== currentProduct.slug &&
            p.price >= minPrice &&
            p.price <= maxPrice &&
            (p.tags || []).some((tag) => tset.has(String(tag).toLowerCase()))
        )
        .slice(0, 3);

      // fallback if no tag match
      if (filtered.length === 0) {
        return this.state.products
          .filter((p) => p.slug !== currentProduct.slug)
          .sort((a, b) => Math.abs(a.price - currentProduct.price) - Math.abs(b.price - currentProduct.price))
          .slice(0, 3);
      }
      return filtered;
    },

    getFrequentlyBoughtTogether: (productSlug) => {
      try {
        const key = this.config.storageKeys.orders;
        const orders = JSON.parse(localStorage.getItem(key) || "[]");
        const counter = new Map();
        orders.forEach((o) => {
          const slugs = (o.items || []).map((it) => it.slug);
          if (!slugs.includes(productSlug)) return;
          slugs
            .filter((s) => s !== productSlug)
            .forEach((s) => counter.set(s, (counter.get(s) || 0) + 1));
        });
        const ranked = Array.from(counter.entries())
          .sort((a, b) => b[1] - a[1])
          .map(([slug]) => this.state.products.find((p) => p.slug === slug))
          .filter(Boolean)
          .slice(0, 3);
        return ranked;
      } catch {
        return [];
      }
    },
  };

  // ---------- ANALYTICS ----------
  analytics = {
    init: () => {
      // Hook basic events if needed
      // page_view (GA script already in HTML head initializes)
      this.analytics.trackEvent("page_view", { page_location: location.href });
    },

    trackEvent: (eventName, parameters = {}) => {
      try {
        if (typeof window.gtag === "function") {
          window.gtag("event", eventName, parameters);
        }
        this.backend.sendEvent(eventName, parameters);
      } catch (e) {
        console.warn("analytics event failed", e);
      }
    },
  };

  // ---------- VALIDATION / UTILS ----------
  validation = {
    validatePhone: (phone) => {
      const indianMobileRegex = /^[6-9]\d{9}$/;
      return indianMobileRegex.test(String(phone).replace(/\D/g, "").slice(-10));
    },
    validatePincode: (pincode) => /^[1-9][0-9]{5}$/.test(String(pincode).trim()),
  };
  reviews = {
    key: 'pinabakes_reviews',

    _readAll() { try { return JSON.parse(localStorage.getItem(this.key) || '{}'); } catch { return {}; } },
    _writeAll(db) { try { localStorage.setItem(this.key, JSON.stringify(db)); } catch {} },

    list(slug) {
      const db = this._readAll();
      return Array.isArray(db[slug]) ? db[slug] : [];
    },

    add(slug, review) {
      const db = this._readAll();
      const arr = this.list(slug).concat([{ ...review, id: 'r' + Date.now(), createdAt: new Date().toISOString() }]);
      db[slug] = arr;
      this._writeAll(db);
    },

    average(slug) {
      const arr = this.list(slug);
      if (!arr.length) return 0;
      const sum = arr.reduce((t, r) => t + (Number(r.rating) || 0), 0);
      return Math.round((sum / arr.length) * 10) / 10;
    },

    escape(s) { return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); },

    template() {
      return `
        <section id="reviews-section" class="reviews" style="margin-top:2rem;">
          <h3 style="margin-bottom:.5rem;">Customer Reviews</h3>
          <div id="reviews-average" style="font-weight:600; margin-bottom:.75rem;"></div>
          <div id="reviews-list" style="display:flex; flex-direction:column; gap:1rem;"></div>

          <div class="add-review" style="margin-top:1.5rem;">
            <h4 style="margin-bottom:.5rem;">Add a Review</h4>
            <form id="review-form" class="review-form">
              <div style="display:flex; gap:.75rem; align-items:center; margin:.5rem 0;">
                <span>Rating:</span>
                <div class="stars-input">
                  ${[5,4,3,2,1].map(v => `
                    <input type="radio" id="star${v}" name="review-rating" value="${v}">
                    <label for="star${v}" title="${v} star${v>1?'s':''}">★</label>
                  `).join('')}
                </div>
              </div>

              <div class="form-group">
                <label class="form-label" for="review-name">Name (optional)</label>
                <input type="text" id="review-name" class="form-input" placeholder="Your name">
              </div>

              <div class="form-group">
                <label class="form-label" for="review-comment">Your review</label>
                <textarea id="review-comment" class="form-textarea" rows="3" placeholder="What did you like?"></textarea>
              </div>

              <button class="btn btn-primary" type="submit">Submit Review</button>
            </form>
          </div>
        </section>
      `;
    },

    mount(product) {
      const info = document.querySelector('.product-info');
      if (!info) return;

      // create once per product view
      let existing = info.querySelector('#reviews-section');
      if (!existing) {
        info.insertAdjacentHTML('beforeend', this.template());
        existing = info.querySelector('#reviews-section');
      }

      // render list + average
      this.render(product.slug);

      // bind form
      const form = existing.querySelector('#review-form');
      form.onsubmit = (e) => {
        e.preventDefault();
        const name = existing.querySelector('#review-name').value.trim() || 'Anonymous';
        const rating = Number(existing.querySelector('input[name="review-rating"]:checked')?.value || 0);
        const comment = existing.querySelector('#review-comment').value.trim();

        if (rating < 1) { App.ui.showToast('Please select a rating.', 'error'); return; }
        if (comment.length < 3) { App.ui.showToast('Please write a short review.', 'error'); return; }

        this.add(product.slug, { name: this.escape(name), rating, comment: this.escape(comment) });
        form.reset();
        this.render(product.slug);
        App.ui.showToast('Thanks for your review!', 'success');
      };
    },

    render(slug) {
      const section = document.querySelector('#reviews-section');
      if (!section) return;

      const listEl = section.querySelector('#reviews-list');
      const avgEl = section.querySelector('#reviews-average');
      const list = this.list(slug).slice().sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt));

      avgEl.textContent = list.length ? `${this.average(slug)} ★ (${list.length})` : 'No reviews yet';
      listEl.innerHTML = list.length
        ? list.map(r => `
            <div class="review-item">
              <div class="review-header">
                <strong>${this.escape(r.name)}</strong>
                <span class="stars">${'★'.repeat(r.rating)}${'☆'.repeat(5 - r.rating)}</span>
              </div>
              <p>${this.escape(r.comment)}</p>
              <div class="review-date">${new Date(r.createdAt).toLocaleDateString()}</div>
            </div>
          `).join('')
        : `<p style="color:var(--text-secondary)">Be the first to review.</p>`;
    }
  };

  util = {
    sanitizeInput: (input) =>
      String(input)
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
        .replace(/on\w+="[^"]*"/gi, "")
        .replace(/javascript:/gi, "")
        .trim(),
  };

  // ---------- HAPTICS ----------
  haptics = {
    vibrate: (type = "light") => {
      if (!navigator.vibrate) return;
      const patterns = { light: [10], medium: [20], heavy: [30] };
      navigator.vibrate(patterns[type] || patterns.light);
    },
  };

  isNewProduct(product) {
    return (
      product.price >= 300 ||
      product.name?.toLowerCase().includes("new") ||
      product.tagline?.toLowerCase().includes("new")
    );
  }

  _registerServiceWorker() {
    if (!("serviceWorker" in navigator)) return;
    window.addEventListener("load", () => {
      navigator.serviceWorker
        .register(this.config.sw.path)
        .then((reg) => {
          console.log("SW registered:", reg);

          // Auto-refresh when a new SW takes control
          if (reg.waiting) {
            this.ui.showToast("Site updated. Refreshing…", "info", 1500);
            reg.waiting.postMessage({ type: "SKIP_WAITING" });
          }
          reg.addEventListener("updatefound", () => {
            const newWorker = reg.installing;
            newWorker?.addEventListener("statechange", () => {
              if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
                this.ui.showToast("New version available. Refreshing…", "info", 1500);
                newWorker.postMessage({ type: "SKIP_WAITING" });
              }
            });
          });
          navigator.serviceWorker.addEventListener("controllerchange", () => {
            window.location.reload();
          });
        })
        .catch((err) => console.log("SW registration failed:", err));
    });
  }
}

// Boot the app
const App = new PinaBakesApp();
window.App = App;

// Note: Service worker registration handled inside class (_registerServiceWorker).
