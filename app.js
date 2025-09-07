/* app.js — PiNa Bakes (drop-in, no external JSON required)
   - Fixes: window.app alias, null-safe DOM refs, image case fallbacks
   - Features: product list, product detail, gallery + lightbox, cart, coupons, checkout (WhatsApp), search
*/

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
      coupons: { PINA10: { type: "percent", value: 10 } },
      shippingCharge: 60,
      freeShippingThreshold: 999,
      sw: { path: "./sw.js" },
    };

    // === Embedded Products (no fetch needed) ===
    this.embeddedProducts = [
      {
        slug: "nutty-coco",
        name: "Nutty-Coco Delight",
        price: 199,
        tagline: "Real coconut flakes meet wholesome jowar",
        img: "assets/products/nutty-coco/pina-bakes-nutty-coco-1.jpg",
        images: [
          "assets/products/nutty-coco/pina-bakes-nutty-coco-1.jpg",
          "assets/products/nutty-coco/pina-bakes-nutty-coco-2.jpg",
          "assets/products/nutty-coco/pina-bakes-nutty-coco-3.jpg",
        ],
        bullets: [
          "Crisp edges with soft, chewy center",
          "Made with authentic coconut flakes",
          "Rich in dietary fiber from jowar",
          "No artificial coconut flavoring",
        ],
        ingredients: [
          "Jowar (sorghum) flour",
          "Oats flour",
          "Fresh coconut flakes",
          "Pure butter",
          "Natural jaggery",
          "Baking powder",
          "Pure vanilla extract",
        ],
        nutrition: {
          energy: "445 kcal",
          protein: "8.2 g",
          fat: "18.5 g",
          carbs: "62.3 g",
          sugar: "22.1 g",
          fibre: "4.8 g",
          sodium: "156 mg",
        },
        tags: ["gluten-friendly", "high-fiber", "natural-sweetener"],
      },
      {
        slug: "jowar-peanut-butter",
        name: "Jowar Peanut Butter Cookies",
        price: 209,
        tagline: "Protein-rich jowar meets creamy peanut butter",
        img: "assets/products/jowar-peanut-butter/pina-bakes-jowar-peanut-butter-1.jpg",
        images: [
          "assets/products/jowar-peanut-butter/pina-bakes-jowar-peanut-butter-1.jpg",
          "assets/products/jowar-peanut-butter/pina-bakes-jowar-peanut-butter-2.jpg",
          "assets/products/jowar-peanut-butter/pina-bakes-jowar-peanut-butter-3.jpg",
          "assets/products/jowar-peanut-butter/pina-bakes-jowar-peanut-butter-4.jpg",
          "assets/products/jowar-peanut-butter/pina-bakes-jowar-peanut-butter-5.jpg",
          "assets/products/jowar-peanut-butter/pina-bakes-jowar-peanut-butter-6.jpg",
          "assets/products/jowar-peanut-butter/pina-bakes-jowar-peanut-butter-7.jpg",
        ],
        bullets: [
          "High in plant-based protein",
          "Made with pure peanut butter",
          "Zero refined flour (maida-free)",
          "Perfect post-workout snack",
        ],
        ingredients: [
          "Jowar (sorghum) flour",
          "Natural peanut butter",
          "Organic jaggery",
          "Pure butter",
          "Aluminum-free baking powder",
        ],
        nutrition: {
          energy: "468 kcal",
          protein: "12.4 g",
          fat: "22.8 g",
          carbs: "54.7 g",
          sugar: "18.9 g",
          fibre: "5.2 g",
          sodium: "142 mg",
        },
        tags: ["high-protein", "maida-free", "post-workout"],
      },
      {
        slug: "lemon-blueberry",
        name: "Lemon-Blueberry Burst",
        price: 289,
        tagline: "Zesty lemon meets antioxidant-rich blueberries",
        img: "assets/products/lemon-blueberry/pina-bakes-lemon-blueberry-1.jpg",
        images: [
          "assets/products/lemon-blueberry/pina-bakes-lemon-blueberry-1.jpg",
          "assets/products/lemon-blueberry/pina-bakes-lemon-blueberry-2.jpg",
          "assets/products/lemon-blueberry/pina-bakes-lemon-blueberry-3.jpg",
          "assets/products/lemon-blueberry/pina-bakes-lemon-blueberry-4.jpg",
        ],
        bullets: [
          "Fresh lemon zest for natural tanginess",
          "Real blueberry pieces (not artificial)",
          "Antioxidant-rich superfruit combination",
          "Refreshing citrus aroma",
        ],
        ingredients: [
          "Bajra (pearl millet) flour",
          "Rolled oats flour",
          "Fresh blueberries",
          "Pure butter",
          "Organic sugar",
          "Fresh lemon zest",
          "Natural lemon extract",
        ],
        nutrition: {
          energy: "421 kcal",
          protein: "7.8 g",
          fat: "16.2 g",
          carbs: "65.4 g",
          sugar: "26.8 g",
          fibre: "4.1 g",
          sodium: "128 mg",
        },
        tags: ["antioxidant-rich", "citrusy", "superfruit"],
      },
      {
        slug: "quinoa-walnut",
        name: "Quinoa-Walnut Crunch",
        price: 279,
        tagline: "Superfood quinoa with premium walnuts",
        img: "assets/products/quinoa-walnut/pina-bakes-quinoa-walnut-1.jpg",
        images: [
          "assets/products/quinoa-walnut/pina-bakes-quinoa-walnut-1.jpg",
          "assets/products/quinoa-walnut/pina-bakes-quinoa-walnut-2.jpg",
          "assets/products/quinoa-walnut/pina-bakes-quinoa-walnut-3.jpg",
          "assets/products/quinoa-walnut/pina-bakes-quinoa-walnut-4.jpg",
          "assets/products/quinoa-walnut/pina-bakes-quinoa-walnut-5.jpg",
          "assets/products/quinoa-walnut/pina-bakes-quinoa-walnut-6.jpg",
          "assets/products/quinoa-walnut/pina-bakes-quinoa-walnut-7.jpg",
        ],
        bullets: [
          "Quinoa - complete protein superfood",
          "Premium California walnuts",
          "Satisfying nutty crunch texture",
          "Rich in omega-3 fatty acids",
        ],
        ingredients: [
          "Quinoa flour",
          "Jowar (sorghum) flour",
          "Premium walnut pieces",
          "Pure butter",
          "Natural jaggery",
        ],
        nutrition: {
          energy: "486 kcal",
          protein: "11.6 g",
          fat: "26.4 g",
          carbs: "52.8 g",
          sugar: "19.3 g",
          fibre: "6.8 g",
          sodium: "98 mg",
        },
        tags: ["superfood", "complete-protein", "omega-3", "premium"],
      },
      {
        slug: "richie-pistachio",
        name: "Richie-Pistachio Premium",
        price: 349,
        tagline: "Luxuriously loaded with premium pistachios",
        // 👇 provide both cases to avoid 404 on case-sensitive hosts
        img: "assets/products/richie-pistachio/pina-bakes-richie-pistachio-1.jpg",
        images: [
          "assets/products/richie-pistachio/pina-bakes-richie-pistachio-1.jpg",
          "assets/products/richie-pistachio/pina-bakes-richie-pistachio-2.jpg",
          "assets/products/richie-pistachio/pina-bakes-richie-pistachio-3.jpg",
          // Fallbacks (upper-case variants) – safe if files exist; harmless if not
          "assets/products/richie-pistachio/pina-bakes-Richie-Pistachio-1.jpg",
          "assets/products/richie-pistachio/pina-bakes-Richie-Pistachio-2.jpg",
          "assets/products/richie-pistachio/pina-bakes-Richie-Pistachio-3.jpg",
        ],
        bullets: [
          "Generously loaded with pistachios",
          "Premium Iranian pistachios",
          "Signature PiNa Bakes recipe",
          "Luxury treat for special occasions",
        ],
        ingredients: [
          "Premium pistachio kernels",
          "Bajra (pearl millet) flour",
          "Pure butter",
          "Fine sugar",
          "Natural cardamom",
        ],
        nutrition: {
          energy: "524 kcal",
          protein: "14.2 g",
          fat: "32.6 g",
          carbs: "48.1 g",
          sugar: "21.4 g",
          fibre: "7.2 g",
          sodium: "106 mg",
        },
        tags: ["premium", "luxury", "pistachio-loaded", "signature"],
      },
      {
        slug: "foxtail-true-chocolate",
        name: "Foxtail True-Chocolate",
        price: 349,
        tagline: "Pure Belgian cocoa with ancient foxtail millet",
        img: "assets/products/foxtail-true-chocolate/pina-bakes-foxtail-true-chocolate-1.jpg",
        images: [
          "assets/products/foxtail-true-chocolate/pina-bakes-foxtail-true-chocolate-1.jpg",
          "assets/products/foxtail-true-chocolate/pina-bakes-foxtail-true-chocolate-2.jpg",
          "assets/products/foxtail-true-chocolate/pina-bakes-foxtail-true-chocolate-3.jpg",
          "assets/products/foxtail-true-chocolate/pina-bakes-foxtail-true-chocolate-4.jpg",
          "assets/products/foxtail-true-chocolate/pina-bakes-foxtail-true-chocolate-5.jpg",
        ],
        bullets: [
          "Belgian cocoa for deep chocolate flavor",
          "Foxtail millet - ancient superfood grain",
          "Rich, fudgy texture",
          "No artificial chocolate flavoring",
        ],
        ingredients: [
          "Foxtail millet flour",
          "Premium Belgian cocoa powder",
          "Pure butter",
          "Organic sugar",
          "Aluminum-free baking powder",
        ],
        nutrition: {
          energy: "456 kcal",
          protein: "9.8 g",
          fat: "19.4 g",
          carbs: "63.2 g",
          sugar: "28.6 g",
          fibre: "8.4 g",
          sodium: "164 mg",
        },
        tags: ["premium", "belgian-cocoa", "ancient-grain", "fudgy"],
      },
      {
        slug: "ragi-millet",
        name: "Ragi Millet Classic",
        price: 229,
        tagline: "Calcium-rich ragi in a wholesome cookie",
        img: "assets/products/ragi-millet/pina-bakes-ragi-millet-1.jpg",
        images: [
          "assets/products/ragi-millet/pina-bakes-ragi-millet-1.jpg",
          "assets/products/ragi-millet/pina-bakes-ragi-millet-2.jpg",
          "assets/products/ragi-millet/pina-bakes-ragi-millet-3.jpg",
          "assets/products/ragi-millet/pina-bakes-ragi-millet-4.jpg",
          "assets/products/ragi-millet/pina-bakes-ragi-millet-5.jpg",
          "assets/products/ragi-millet/pina-bakes-ragi-millet-6.jpg",
        ],
        bullets: [
          "High in natural calcium from ragi",
          "Perfect with tea or coffee",
          "Naturally gluten-free",
          "Traditional South Indian superfood",
        ],
        ingredients: [
          "Ragi (finger millet) flour",
          "Rolled oats flour",
          "Pure butter",
          "Natural jaggery",
        ],
        nutrition: {
          energy: "412 kcal",
          protein: "9.4 g",
          fat: "15.8 g",
          carbs: "58.2 g",
          sugar: "20.6 g",
          fibre: "6.2 g",
          sodium: "118 mg",
        },
        tags: ["high-calcium", "gluten-free", "traditional"],
      },
      {
        slug: "bajra-almond",
        name: "Bajra Millet with Almond",
        price: 199,
        tagline: "Bajra base enriched with crunchy almonds",
        img: "assets/products/bajra-almond/pina-bakes-bajra-almond-1.jpg",
        images: [
          "assets/products/bajra-almond/pina-bakes-bajra-almond-1.jpg",
          "assets/products/bajra-almond/pina-bakes-bajra-almond-2.jpg",
          "assets/products/bajra-almond/pina-bakes-bajra-almond-3.jpg",
          "assets/products/bajra-almond/pina-bakes-bajra-almond-4.jpg",
          "assets/products/bajra-almond/pina-bakes-bajra-almond-5.jpg",
        ],
        bullets: [
          "Crunchy almond pieces in every bite",
          "Hearty bajra millet base",
          "Rich in healthy fats",
          "Perfect energy snack",
        ],
        ingredients: [
          "Bajra (pearl millet) flour",
          "Roasted almond pieces",
          "Pure butter",
          "Organic sugar",
        ],
        nutrition: {
          energy: "458 kcal",
          protein: "10.8 g",
          fat: "21.4 g",
          carbs: "56.8 g",
          sugar: "24.2 g",
          fibre: "5.4 g",
          sodium: "134 mg",
        },
        tags: ["almond-rich", "energy-boost", "healthy-fats"],
      },
    ];

    // === State & references ===
    this.state = {
      products: [],
      filteredProducts: null,
      cart: [],
      wishlist: [],
      user: null,
      currentProduct: null,
      isMobileMenuOpen: false,
      isCartOpen: false,
      isWishlistOpen: false,
      currentImageIndex: 0,
      appliedCoupon: null,
      discountDetails: "",
      searchIndex: [],
    };

    this.elements = {};
    this.lightbox = { el: null, img: null };

    this.init();
  }

  // === Init ===
  async init() {
    try {
      this.cacheElements();
      this.setupEventListeners();
      this.loadUserData();
      this.cart.load();
      this.wishlist.load();

      this.ui.renderSkeletonProducts();
      await this.loadProductsFromJson('assets/products.json'); // or 'products.json' based on where you put it

      this.search.init();
      this.router.handleRoute();
      this.updateCurrentYear();
      this.setupIntersectionObserver();
      this.setupHeaderScrollEffect();
      this.ui.hideLoader();
      this.ui._applyOverlayPointerSafety();
      this._registerServiceWorker();
    } catch (err) {
      console.error("Init failed:", err);
      this.ui.showToast("Failed to load app. Please refresh.", "error");
    }
  }

  // === Boot products from embedded array ===
  loadEmbeddedProducts() {
    this.state.products = this.embeddedProducts.map((p) => ({
      ...p,
      images: this.normalizeImages(p),
    }));
    this.search.setupSearchIndex();
    this.ui.renderProducts();
  }

  // === Element cache ===
  cacheElements() {
    this.elements = {
      header: document.getElementById("header"),
      mobileMenuToggle: document.querySelector(".mobile-menu-toggle"),
      mobileNav: document.querySelector(".mobile-nav"),
      mobileNavOverlay: document.querySelector(".mobile-nav-overlay"),

      navLinks: document.querySelectorAll(".nav-link"),

      searchInput: document.getElementById("site-search"),
      searchSuggest: document.getElementById("search-suggestions"),

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

      // Products grid
      productsGrid: document.getElementById("products-grid"),

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

      // Lightbox
      lightbox: document.getElementById("lightbox"),
      lightboxImage: document.getElementById("lightbox-image"),

      // Toast / misc
      toast: document.getElementById("toast"),
      currentYear: document.getElementById("current-year"),

      // Wishlist (optional in HTML)
      wishlistModal: document.getElementById("wishlist-modal"),
      wishlistOverlay: document.getElementById("wishlist-overlay"),
      wishlistCount: document.getElementById("wishlist-count"),
      wishlistItems: document.getElementById("wishlist-items"),
    };
  }

  // === Listeners ===
  setupEventListeners() {
    window.addEventListener("hashchange", () => this.router.handleRoute());
    window.addEventListener("popstate", () => this.router.handleRoute());

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") this.ui.closeAllModals();
      if (this.state.currentProduct) {
        if (e.key === "ArrowLeft") this.gallery.previousImage();
        if (e.key === "ArrowRight") this.gallery.nextImage();
      }
    });

    document.addEventListener("click", (e) => {
      // close mobile menu if clicked outside (if it exists)
      if (
        this.state.isMobileMenuOpen &&
        this.elements.mobileNav &&
        this.elements.mobileMenuToggle &&
        !this.elements.mobileNav.contains(e.target) &&
        !this.elements.mobileMenuToggle.contains(e.target)
      ) {
        this.ui.closeMobileMenu();
      }
    });

    window.addEventListener("resize", this.debounce(() => {
      if (window.innerWidth > 768 && this.state.isMobileMenuOpen) this.ui.closeMobileMenu();
    }, 200));

    // Checkout submit
    if (this.elements.checkoutForm) {
      this.elements.checkoutForm.addEventListener("submit", (e) => {
        e.preventDefault();
        this.checkout.proceed();
      });
    }

    // Grid deep-link navigation
    if (this.elements.productsGrid) {
      this.elements.productsGrid.addEventListener("click", (e) => {
        const link = e.target.closest('a[href^="#/product/"]');
        if (!link) return;
        e.preventDefault();
        const slug = link.getAttribute("href").split("/").pop();
        this.router.navigate(`#/product/${slug}`);
      });
    }

    // Coupon enter
    if (this.elements.couponCode) {
      this.elements.couponCode.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          this.cart.applyCoupon();
        }
      });
    }

    // Main image click -> lightbox
    if (this.elements.productMainImage) {
      this.elements.productMainImage.addEventListener("click", () =>
        this.gallery.openLightbox()
      );
    }

    // Lightbox overlay click -> close
    if (this.elements.lightbox) {
      this.elements.lightbox.addEventListener("click", () =>
        this.gallery.closeLightbox()
      );
      if (this.elements.lightboxImage) {
        this.elements.lightboxImage.addEventListener("click", (ev) =>
          ev.stopPropagation()
        );
      }
    }
  }

  // === Helpers ===
  updateCurrentYear() {
    if (this.elements.currentYear)
      this.elements.currentYear.textContent = new Date().getFullYear();
  }

  debounce(fn, wait) {
    let t;
    return (...args) => {
      clearTimeout(t);
      t = setTimeout(() => fn(...args), wait);
    };
  }

  throttle(fn, limit) {
    let inThrottle;
    return (...a) => {
      if (!inThrottle) {
        fn(...a);
        inThrottle = true;
        setTimeout(() => (inThrottle = false), limit);
      }
    };
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
    document.querySelectorAll("section[id]").forEach((sec) => observer.observe(sec));
  }

  setupHeaderScrollEffect() {
    window.addEventListener(
      "scroll",
      this.throttle(() => {
        const y = window.scrollY;
        if (y > 100) this.elements.header?.classList.add("scrolled");
        else this.elements.header?.classList.remove("scrolled");
      }, 16)
    );
  }

  formatPrice(price) {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(price);
  }

  normalizeImages(product) {
    const out = new Set();
    const add = (p) => {
      if (!p) return;
      out.add(p);
      // also attempt a lowercase fallback for case-sensitive hosts
      const lower = p.toLowerCase();
      if (lower !== p) out.add(lower);
    };

    if (Array.isArray(product.images)) product.images.forEach(add);
    else if (typeof product.images === "string")
      product.images.split(",").map((s) => s.trim()).forEach(add);

    ["img", "image", "image1", "image2", "image3", "image4", "image5", "image6"].forEach((k) =>
      add(product[k])
    );

    const arr = Array.from(out).filter(Boolean);
    return arr.length ? arr : [product.img].filter(Boolean);
  }

  loadUserData() {
    try {
      const userData = localStorage.getItem(this.config.storageKeys.user);
      if (userData) {
        this.state.user = JSON.parse(userData);
        this.checkout.populateForm();
      }
    } catch {
      /* ignore */
    }
  }

  saveUserData(data) {
    try {
      this.state.user = data;
      localStorage.setItem(this.config.storageKeys.user, JSON.stringify(data));
    } catch {
      /* ignore */
    }
  }

  isNewProduct(product) {
    return product.price >= 300;
  }

  _registerServiceWorker() {
    if ("serviceWorker" in navigator) {
      // Optional, ignore errors
      navigator.serviceWorker
        .register(this.config.sw.path)
        .catch(() => void 0);
    }
  }

  // === UI ===
  ui = {
    showToast: (message, type = "info", duration = 3000) => {
      const t = this.elements.toast;
      if (!t) return;
      t.textContent = message;
      t.className = `toast show ${type}`;
      clearTimeout(this._toastTimer);
      this._toastTimer = setTimeout(() => t.classList.remove("show"), duration);
    },

    hideLoader: () => {
      document.querySelectorAll(".skeleton, .skeleton-product").forEach((n) =>
        n.classList.remove("skeleton", "skeleton-product")
      );
    },

    updateActiveNavLink: (activeId) => {
      this.elements.navLinks.forEach((link) => {
        const href = (link.getAttribute("href") || "").replace("#", "");
        link.classList.toggle("active", href === activeId);
      });
    },

    renderSkeletonProducts: () => {
      if (!this.elements.productsGrid) return;
      const count = 6;
      this.elements.productsGrid.innerHTML = Array.from({ length: count })
        .map(() => `<div class="skeleton-product" style="height:380px;border-radius:16px;background:#f3f4f6"></div>`)
        .join("");
    },

    renderProducts: () => {
      if (!this.elements.productsGrid) return;
      const list =
        Array.isArray(this.state.filteredProducts) && this.state.filteredProducts.length >= 0
          ? this.state.filteredProducts
          : this.state.products;

      if (!Array.isArray(list) || list.length === 0) {
        this.elements.productsGrid.innerHTML =
          `<div style="padding:1rem;border:1px dashed var(--border-medium);border-radius:12px;text-align:center;color:var(--text-secondary)">No products found.</div>`;
        return;
      }

      const html = list
        .map((p) => {
          const images = this.normalizeImages(p);
          const cover = images[0] || p.img;
          const isNew = this.isNewProduct(p);
          const isPremium = p.price >= 300;
          return `
          <article class="product-card" data-product-id="${p.slug}">
            <div class="product-image-container">
              <img src="${cover}" alt="${p.name} cookies by PiNa Bakes" class="product-image" loading="lazy" decoding="async"
                   onerror="this.onerror=null;this.src='data:image/svg+xml;charset=utf-8,${encodeURIComponent(
                     `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300"><rect width="100%" height="100%" fill="#F3F4F6"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="Arial" font-size="16" fill="#9CA3AF">Image not found</text></svg>`
                   )}'">
              ${isNew ? '<span class="product-badge">New</span>' : ""}
              ${isPremium ? '<span class="product-badge" style="top:3rem;">Premium</span>' : ""}
            </div>
            <div class="product-content">
              <h3 class="product-title">${p.name}</h3>
              <div class="product-price">${this.formatPrice(p.price)}</div>
              <p class="product-tagline">${p.tagline}</p>
              <div class="product-actions" style="margin-top:.75rem;">
                <a href="#/product/${p.slug}" class="btn btn-secondary">View Details</a>
                <button class="btn btn-primary" onclick="app.cart.add('${p.slug}')" aria-label="Add ${p.name} to cart">Add to Cart</button>
                <button class="btn btn-outline" onclick="app.wishlist.add('${p.slug}')" aria-label="Add ${p.name} to wishlist">Wishlist</button>
              </div>
            </div>
          </article>`;
        })
        .join("");

      this.elements.productsGrid.innerHTML = html;
    },

    renderProductDetail: (product) => {
      if (!product || !this.elements.productDetail) return;

      this.state.currentProduct = product;
      this.elements.productTitle.textContent = product.name;
      this.elements.productPrice.textContent = this.formatPrice(product.price);
      this.elements.productTagline.textContent = product.tagline;

      // Features
      if (product.bullets?.length) {
        this.elements.productFeatures.innerHTML = `<h3>Key Features</h3><ul>${product.bullets
          .map((b) => `<li>${b}</li>`)
          .join("")}</ul>`;
      } else {
        this.elements.productFeatures.innerHTML = "";
      }

      // Ingredients
      if (product.ingredients?.length) {
        this.elements.productIngredients.innerHTML = product.ingredients
          .map((ing) => `<li>${ing}</li>`)
          .join("");
      } else {
        this.elements.productIngredients.innerHTML = "";
      }

      // Nutrition
      this.ui.renderNutritionInfo(product);

      // CTA buttons
      if (this.elements.addToCartDetail)
        this.elements.addToCartDetail.onclick = () => this.cart.add(product.slug);
      if (this.elements.addToWishlistDetail)
        this.elements.addToWishlistDetail.onclick = () => this.wishlist.add(product.slug);

      // Gallery
      this.gallery.setup(product);

      // Show detail, hide other sections
      this.elements.productDetail.style.display = "block";
      document.querySelectorAll("main > section").forEach((s) => {
        if (s.id !== "product-detail") s.style.display = "none";
      });
      window.scrollTo({ top: 0, behavior: "smooth" });

      // Recommendations
      this.ui.renderRecommendations(product);
    },

    renderRecommendations: (product) => {
      const container = document.querySelector(".product-detail-container");
      if (!container) return;
      container.querySelectorAll(".reco-block").forEach((n) => n.remove());

      const similar = app.recommendations.getSimilarProducts(product);
      if (similar.length) {
        const block = document.createElement("section");
        block.className = "reco-block";
        block.style.marginTop = "2rem";
        block.innerHTML = `
          <h3 style="margin-bottom:.5rem;">You may also like</h3>
          <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:1rem;">
            ${similar
              .map(
                (p) => `
              <article class="product-card">
                <div class="product-image-container" style="aspect-ratio:1.6/1">
                  <img src="${p.img}" alt="${p.name}" class="product-image" loading="lazy">
                </div>
                <div class="product-content">
                  <h4 class="product-title" style="font-size:1rem">${p.name}</h4>
                  <div class="product-price" style="font-size:1.1rem">${app.formatPrice(p.price)}</div>
                  <div class="product-actions" style="margin-top:.5rem;">
                    <a href="#/product/${p.slug}" class="btn btn-secondary">View</a>
                    <button class="btn btn-primary" onclick="app.cart.add('${p.slug}')">Add</button>
                  </div>
                </div>
              </article>`
              )
              .join("")}
          </div>`;
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
            `<tr><td style="padding:.75rem;border:1px solid #dee2e6;">${k}</td><td style="padding:.75rem;border:1px solid #dee2e6;">${v}</td></tr>`
        )
        .join("");
    },

    hideProductDetail: () => {
      // show all sections, hide detail
      document.querySelectorAll("main > section").forEach((s) => (s.style.display = "block"));
      if (this.elements.productDetail) this.elements.productDetail.style.display = "none";
      this.state.currentProduct = null;
    },

    // Mobile menu controls (null-safe)
    toggleMobileMenu: () =>
      this.state.isMobileMenuOpen ? this.ui.closeMobileMenu() : this.ui.openMobileMenu(),
    openMobileMenu: () => {
      this.state.isMobileMenuOpen = true;
      this.elements.mobileNav?.classList.add("active");
      this.elements.mobileNavOverlay?.classList.add("active");
      this.elements.mobileMenuToggle?.classList.add("active");
      this.elements.mobileMenuToggle?.setAttribute("aria-expanded", "true");
      this.ui.lockScroll();
      if (this.elements.mobileNavOverlay) this.elements.mobileNavOverlay.style.pointerEvents = "auto";
    },
    closeMobileMenu: () => {
      this.state.isMobileMenuOpen = false;
      this.elements.mobileNav?.classList.remove("active");
      this.elements.mobileNavOverlay?.classList.remove("active");
      this.elements.mobileMenuToggle?.classList.remove("active");
      this.elements.mobileMenuToggle?.setAttribute("aria-expanded", "false");
      this.ui.unlockScroll();
      if (this.elements.mobileNavOverlay) this.elements.mobileNavOverlay.style.pointerEvents = "none";
    },

    closeAllModals: () => {
      this.ui.closeMobileMenu();
      this.cart.close();
      if (this.elements.wishlistModal || this.elements.wishlistOverlay) this.wishlist.close();
      this.gallery.closeLightbox();
    },

    lockScroll: () => {
      if (document.body.dataset.locked === "1") return;
      const y = window.scrollY || 0;
      document.body.dataset.locked = "1";
      document.body.dataset.scrollY = String(y);
      document.body.style.position = "fixed";
      document.body.style.top = `-${y}px`;
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

    _applyOverlayPointerSafety: () => {
      if (this.elements.mobileNavOverlay && !this.state.isMobileMenuOpen)
        this.elements.mobileNavOverlay.style.pointerEvents = "none";
      if (this.elements.cartOverlay && !this.state.isCartOpen)
        this.elements.cartOverlay.style.pointerEvents = "none";
      if (this.elements.wishlistOverlay && !this.state.isWishlistOpen)
        this.elements.wishlistOverlay.style.pointerEvents = "none";
    },
  };

  // === Gallery & Lightbox ===
  gallery = {
    setup: (product) => {
      const images = app.normalizeImages(product);
      if (app.elements.productMainImage) {
        app.elements.productMainImage.src = images[0] || product.img;
        app.elements.productMainImage.alt = product.name;
      }
      app.state.currentImageIndex = 0;

      if (app.elements.productThumbnails) {
        app.elements.productThumbnails.innerHTML = images
          .map(
            (src, i) => `
          <img src="${src}" class="product-thumbnail ${i === 0 ? "active" : ""}" alt="${product.name} ${i + 1}"
               onclick="app.gallery.showImage(${i})">`
          )
          .join("");
      }
    },

    showImage: (index) => {
      const product = app.state.currentProduct;
      if (!product) return;
      const images = app.normalizeImages(product);
      const i = Math.max(0, Math.min(index, images.length - 1));
      app.state.currentImageIndex = i;
      if (app.elements.productMainImage) app.elements.productMainImage.src = images[i];
      document.querySelectorAll(".product-thumbnail").forEach((t, idx) =>
        t.classList.toggle("active", idx === i)
      );
    },

    previousImage: () => {
      const product = app.state.currentProduct;
      if (!product) return;
      const images = app.normalizeImages(product);
      const i = (app.state.currentImageIndex - 1 + images.length) % images.length;
      app.gallery.showImage(i);
    },

    nextImage: () => {
      const product = app.state.currentProduct;
      if (!product) return;
      const images = app.normalizeImages(product);
      const i = (app.state.currentImageIndex + 1) % images.length;
      app.gallery.showImage(i);
    },

    openLightbox: () => {
      const product = app.state.currentProduct;
      if (!product || !app.elements.lightbox || !app.elements.lightboxImage) return;
      const images = app.normalizeImages(product);
      app.elements.lightboxImage.src = images[app.state.currentImageIndex] || product.img;
      app.elements.lightbox.classList.add("active");
    },

    closeLightbox: () => {
      app.elements.lightbox?.classList.remove("active");
    },
  };

  // === CART ===
  cart = {
    load: () => {
      try {
        const savedCart = localStorage.getItem(app.config.storageKeys.cart);
        app.state.cart = savedCart ? JSON.parse(savedCart) : [];
      } catch {
        app.state.cart = [];
      }
      app.cart.render();
    },

    save: () => {
      try {
        localStorage.setItem(
          app.config.storageKeys.cart,
          JSON.stringify(app.state.cart)
        );
      } catch {
        /* ignore */
      }
    },

    add: (slug, qty = 1) => {
      const product = app.state.products.find((p) => p.slug === slug);
      if (!product) return app.ui.showToast("Product not found", "error");

      const existing = app.state.cart.find((i) => i.slug === slug);
      if (existing) existing.quantity += qty;
      else app.state.cart.push({ ...product, quantity: qty });

      app.cart.save();
      app.cart.render();
      app.ui.showToast(`${product.name} added to cart!`);
      app.cart.animateCartButton();

      app.cart.startAbandonmentTimer();
    },

    remove: (slug) => {
      app.state.cart = app.state.cart.filter((i) => i.slug !== slug);
      app.cart.save();
      app.cart.render();
      app.ui.showToast("Item removed");
    },

    updateQuantity: (slug, qty) => {
      if (qty <= 0) return app.cart.remove(slug);
      const item = app.state.cart.find((i) => i.slug === slug);
      if (item) {
        item.quantity = qty;
        app.cart.save();
        app.cart.render();
      }
    },

    clear: () => {
      app.state.cart = [];
      app.cart.save();
      app.cart.render();
      app.ui.showToast("Cart cleared");
    },

    getSubtotal: () =>
      app.state.cart.reduce((t, i) => t + i.price * i.quantity, 0),

    calculateBulkDiscountRate: (q) => (q >= 5 ? 0.15 : q >= 3 ? 0.1 : 0),

    getDiscount: (subtotal) => {
      let details = [];
      const c = app.state.appliedCoupon;
      let couponAmt = 0;
      if (c?.type === "percent") {
        couponAmt = Math.round((subtotal * c.value) / 100);
        if (couponAmt > 0) details.push(`coupon ${c.code}`);
      }
      let bulkAmt = 0;
      for (const item of app.state.cart) {
        const rate = app.cart.calculateBulkDiscountRate(item.quantity);
        if (rate > 0) bulkAmt += Math.round(item.price * item.quantity * rate);
      }
      if (bulkAmt > 0) details.push("bulk");
      const totalDisc = Math.max(0, couponAmt + bulkAmt);
      app.state.discountDetails = totalDisc > 0 ? details.join(" + ") : "";
      return totalDisc;
    },

    getShipping: (subtotalAfterDiscount) => {
      if (subtotalAfterDiscount >= app.config.freeShippingThreshold) return 0;
      return app.state.cart.length > 0 ? app.config.shippingCharge : 0;
    },

    getTotal: () => {
      const sub = app.cart.getSubtotal();
      const disc = app.cart.getDiscount(sub);
      const after = Math.max(0, sub - disc);
      const ship = app.cart.getShipping(after);
      return Math.max(0, after + ship);
    },

    applyCoupon: () => {
      const input = app.elements.couponCode;
      const code = app.util.sanitizeInput((input?.value || "")).trim().toUpperCase();
      if (!code) {
        app.state.appliedCoupon = null;
        app.cart.render();
        return;
      }
      const def = app.config.coupons[code];
      if (!def) {
        app.state.appliedCoupon = null;
        app.cart.render();
        app.ui.showToast("Invalid coupon code", "error");
        if (app.elements.couponMsg) app.elements.couponMsg.textContent = "Invalid code";
        return;
      }
      app.state.appliedCoupon = { code, ...def };
      app.cart.render();
      app.ui.showToast(`Coupon applied: ${code} (${def.value}% off)`, "success");
      if (app.elements.couponMsg)
        app.elements.couponMsg.textContent = `Applied ${code}: ${def.value}% off`;
    },

    render: () => {
      const itemCount = app.state.cart.reduce((c, i) => c + i.quantity, 0);
      if (app.elements.cartCount) {
        app.elements.cartCount.textContent = itemCount;
        app.elements.cartCount.style.display = itemCount > 0 ? "flex" : "none";
      }

      if (app.elements.cartItems) {
        if (app.state.cart.length === 0) {
          app.elements.cartItems.innerHTML = `
            <div style="text-align:center;padding:3rem 1rem;color:var(--text-secondary);">
              <svg width="64" height="64" fill="none" stroke="currentColor" viewBox="0 0 24 24" style="margin-bottom:1rem;opacity:.5;">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5m6.5-5v6a2 2 0 11-4 0v-6m4 0V9a2 2 0 10-4 0v4.01"/>
              </svg>
              <p>Your cart is empty</p>
              <button class="btn btn-primary" onclick="app.cart.close(); app.router.navigate('products');">Browse Products</button>
            </div>`;
        } else {
          app.elements.cartItems.innerHTML = app.state.cart
            .map(
              (item) => `
            <div class="cart-item">
              <img src="${item.img}" alt="${item.name}" class="cart-item-image">
              <div class="cart-item-details">
                <div class="cart-item-title">${item.name}</div>
                <div class="cart-item-price">${app.formatPrice(item.price)}</div>
                <div class="cart-item-actions">
                  <button class="quantity-btn" onclick="app.cart.updateQuantity('${item.slug}', ${
                    item.quantity - 1
                  })" aria-label="Decrease quantity">-</button>
                  <span style="min-width:2rem;text-align:center;">${item.quantity}</span>
                  <button class="quantity-btn" onclick="app.cart.updateQuantity('${item.slug}', ${
                    item.quantity + 1
                  })" aria-label="Increase quantity">+</button>
                  <button class="btn btn-outline" style="margin-left:.5rem" onclick="app.cart.saveForLater('${
                    item.slug
                  }')">Save for later</button>
                </div>
                ${
                  (() => {
                    const rate = app.cart.calculateBulkDiscountRate(item.quantity);
                    if (!rate) return "";
                    return `<div style="margin-top:.35rem;font-size:.85rem;color:var(--text-secondary)">Bulk discount applied: ${Math.round(
                      rate * 100
                    )}% on this item</div>`;
                  })()
                }
              </div>
              <div style="text-align:right;">
                <div style="font-weight:600;">${app.formatPrice(item.price * item.quantity)}</div>
                <button onclick="app.cart.remove('${
                  item.slug
                }')" style="color:#dc2626;background:none;border:none;cursor:pointer;margin-top:.5rem;font-size:.875rem;" aria-label="Remove ${
                item.name
              } from cart">Remove</button>
              </div>
            </div>`
            )
            .join("");
        }
      }

      const subtotal = app.cart.getSubtotal();
      const discount = app.cart.getDiscount(subtotal);
      const after = Math.max(0, subtotal - discount);
      const shipping = app.cart.getShipping(after);
      const total = after + shipping;

      if (app.elements.cartSubtotal)
        app.elements.cartSubtotal.textContent = app.formatPrice(subtotal);
      if (app.elements.cartDiscount)
        app.elements.cartDiscount.textContent =
          discount > 0
            ? `- ${app.formatPrice(discount)}${
                app.state.discountDetails ? ` (${app.state.discountDetails})` : ""
              }`
            : app.formatPrice(0);
      if (app.elements.cartShipping)
        app.elements.cartShipping.textContent = app.formatPrice(shipping);
      if (app.elements.shippingNote)
        app.elements.shippingNote.textContent = `Shipping ₹${app.config.shippingCharge} applies below ₹${app.config.freeShippingThreshold}. Free shipping on orders ₹${app.config.freeShippingThreshold}+`;
      if (app.elements.cartTotal)
        app.elements.cartTotal.textContent = app.formatPrice(total);
      if (app.elements.checkoutForm)
        app.elements.checkoutForm.style.display =
          app.state.cart.length > 0 ? "block" : "none";
    },

    toggle: () => (app.state.isCartOpen ? app.cart.close() : app.cart.open()),
    open: () => {
      app.state.isCartOpen = true;
      app.elements.cartModal?.classList.add("active");
      app.elements.cartOverlay?.classList.add("active");
      if (app.elements.cartOverlay) app.elements.cartOverlay.style.pointerEvents = "auto";
      app.ui.lockScroll();
    },
    close: () => {
      app.state.isCartOpen = false;
      app.elements.cartModal?.classList.remove("active");
      app.elements.cartOverlay?.classList.remove("active");
      if (app.elements.cartOverlay) app.elements.cartOverlay.style.pointerEvents = "none";
      app.ui.unlockScroll();
    },

    animateCartButton: () => {
      if (app.elements.cartCount) {
        app.elements.cartCount.style.animation = "none";
        setTimeout(() => {
          app.elements.cartCount.style.animation = "cartBounce 0.3s ease";
        }, 10);
      }
    },

    startAbandonmentTimer: () => {
      clearTimeout(app._abandonTimer);
      app._abandonTimer = setTimeout(() => {
        if (app.state.cart.length > 0 && !app.state.isCartOpen) {
          app.ui.showToast("Complete your order for fresh cookies! 🍪", "info");
        }
      }, 5 * 60 * 1000);
    },

    saveForLater: (slug) => {
      const item = app.state.cart.find((i) => i.slug === slug);
      if (!item) return;
      app.wishlist.add(slug);
      app.cart.remove(slug);
      app.ui.showToast("Moved to Saved (Wishlist)");
    },
  };

  // === WISHLIST (modal optional) ===
  wishlist = {
    load: () => {
      try {
        const saved = localStorage.getItem(app.config.storageKeys.wishlist);
        app.state.wishlist = saved ? JSON.parse(saved) : [];
      } catch {
        app.state.wishlist = [];
      }
      app.wishlist.render();
    },

    save: () => {
      try {
        localStorage.setItem(
          app.config.storageKeys.wishlist,
          JSON.stringify(app.state.wishlist)
        );
      } catch {
        /* ignore */
      }
    },

    add: (slug) => {
      const p = app.state.products.find((x) => x.slug === slug);
      if (!p) return app.ui.showToast("Product not found", "error");
      const exists = app.state.wishlist.find((i) => i.slug === slug);
      if (exists) return app.ui.showToast("Already in wishlist");
      app.state.wishlist.push({ ...p });
      app.wishlist.save();
      app.wishlist.render();
      app.ui.showToast(`${p.name} added to wishlist`);
    },

    remove: (slug) => {
      app.state.wishlist = app.state.wishlist.filter((i) => i.slug !== slug);
      app.wishlist.save();
      app.wishlist.render();
      app.ui.showToast("Removed from wishlist");
    },

    moveToCart: (slug) => {
      const item = app.state.wishlist.find((i) => i.slug === slug);
      if (!item) return;
      app.cart.add(slug, 1);
      app.wishlist.remove(slug);
    },

    moveAllToCart: () => {
      app.state.wishlist.forEach((i) => app.cart.add(i.slug, 1));
      app.state.wishlist = [];
      app.wishlist.save();
      app.wishlist.render();
      app.ui.showToast("Moved all to cart");
    },

    render: () => {
      const count = app.state.wishlist.length;
      if (app.elements.wishlistCount) {
        app.elements.wishlistCount.textContent = count;
        app.elements.wishlistCount.style.display = count > 0 ? "flex" : "none";
      }
      if (!app.elements.wishlistItems) return; // wishlist modal not present: skip

      if (count === 0) {
        app.elements.wishlistItems.innerHTML = `
          <div style="text-align:center;padding:3rem 1rem;color:var(--text-secondary);">
            <p>Your wishlist is empty</p>
            <button class="btn btn-primary" onclick="app.wishlist.close(); app.router.navigate('products');">Browse Products</button>
          </div>`;
      } else {
        app.elements.wishlistItems.innerHTML = app.state.wishlist
          .map(
            (item) => `
          <div class="wishlist-item">
            <img src="${item.img}" alt="${item.name}" class="wishlist-item-image">
            <div class="wishlist-item-details">
              <div class="wishlist-item-title">${item.name}</div>
              <div class="cart-item-price">${app.formatPrice(item.price)}</div>
              <div class="wishlist-item-actions">
                <button class="btn btn-primary" onclick="app.wishlist.moveToCart('${item.slug}')">Move to Cart</button>
                <a class="btn btn-secondary" href="#/product/${item.slug}" onclick="app.wishlist.close()">View Details</a>
                <button class="btn btn-outline" onclick="app.wishlist.remove('${item.slug}')">Remove</button>
              </div>
            </div>
          </div>`
          )
          .join("");
      }
    },

    toggle: () => (app.state.isWishlistOpen ? app.wishlist.close() : app.wishlist.open()),
    open: () => {
      app.state.isWishlistOpen = true;
      app.elements.wishlistModal?.classList.add("active");
      app.elements.wishlistOverlay?.classList.add("active");
      if (app.elements.wishlistOverlay) app.elements.wishlistOverlay.style.pointerEvents = "auto";
      app.ui.lockScroll();
    },
    close: () => {
      app.state.isWishlistOpen = false;
      app.elements.wishlistModal?.classList.remove("active");
      app.elements.wishlistOverlay?.classList.remove("active");
      if (app.elements.wishlistOverlay) app.elements.wishlistOverlay.style.pointerEvents = "none";
      app.ui.unlockScroll();
    },
  };

  // === CHECKOUT ===
  checkout = {
    populateForm: () => {
      if (!app.state.user || !app.elements.checkoutForm) return;
      const map = {
        name: "customer-name",
        phone: "customer-phone",
        pincode: "customer-pincode",
        city: "customer-city",
        address: "customer-address",
        notes: "customer-notes",
      };
      Object.entries(map).forEach(([k, id]) => {
        const el = document.getElementById(id);
        if (el && app.state.user[k]) el.value = app.state.user[k];
      });
    },

    validateForm: () => {
      const phoneField = document.getElementById("customer-phone");
      const pincodeField = document.getElementById("customer-pincode");

      if (phoneField) {
        const digits = phoneField.value.replace(/\D/g, "");
        if (digits && !app.validation.validatePhone(digits)) {
          app.ui.showToast("Phone looks unusual (10 digits expected).", "info");
        }
      }
      if (pincodeField) {
        const pin = pincodeField.value.trim();
        if (pin && !app.validation.validatePincode(pin)) {
          app.ui.showToast("Pincode format looks unusual (6 digits).", "info");
        }
      }
      return true;
    },

    handleFormSubmit: (e) => {
      e.preventDefault();
      app.checkout.proceed();
    },

    proceed: () => {
      if (app.state.cart.length === 0) return app.ui.showToast("Your cart is empty!", "error");
      if (!app.checkout.validateForm()) return;

      const data = {
        name: app.util.sanitizeInput(document.getElementById("customer-name")?.value || "").trim(),
        phone: app.util.sanitizeInput(document.getElementById("customer-phone")?.value || "").trim(),
        pincode: app.util.sanitizeInput(document.getElementById("customer-pincode")?.value || "").trim(),
        city: app.util.sanitizeInput(document.getElementById("customer-city")?.value || "").trim(),
        address: app.util.sanitizeInput(document.getElementById("customer-address")?.value || "").trim(),
        notes: app.util.sanitizeInput(document.getElementById("customer-notes")?.value || "").trim(),
      };

      app.saveUserData(data);

      const subtotal = app.cart.getSubtotal();
      const discount = app.cart.getDiscount(subtotal);
      const after = Math.max(0, subtotal - discount);
      const shipping = app.cart.getShipping(after);
      const total = after + shipping;

      const itemsList = app.state.cart
        .map((i) => `• ${i.name} (×${i.quantity}) - ${app.formatPrice(i.price * i.quantity)}`)
        .join("\n");

      const order = {
        id: `PIN${Date.now()}`,
        createdAt: new Date().toISOString(),
        coupon: app.state.appliedCoupon?.code || "",
        subtotal,
        discount,
        shipping,
        total,
        customer: data,
        items: app.state.cart.map((i) => ({
          slug: i.slug,
          name: i.name,
          qty: i.quantity,
          price: i.price,
        })),
      };

      // persist simple order list
      try {
        const key = app.config.storageKeys.orders;
        const prev = JSON.parse(localStorage.getItem(key) || "[]");
        prev.push(order);
        localStorage.setItem(key, JSON.stringify(prev));
      } catch {
        /* ignore */
      }

      // fire-and-forget webhook (best-effort)
      app.backend.sendOrder(order);

      // open WhatsApp message
      const message = app.checkout.generateWhatsAppMessage(order, itemsList);
      const url = `https://wa.me/${app.config.whatsappNumber}?text=${encodeURIComponent(message)}`;
      window.open(url, "_blank");
      app.ui.showToast("Redirecting to WhatsApp...", "success");
    },

    generateWhatsAppMessage: (order, itemsList) => {
      const lines = [
        `🍪 *PiNa Bakes Order Request*`,
        ``,
        `*Items Ordered:*`,
        itemsList,
        ``,
        `*Subtotal:* ${app.formatPrice(order.subtotal)}`,
      ];
      if (order.discount > 0)
        lines.push(`*Discount${order.coupon ? ` (${order.coupon})` : ""}:* -${app.formatPrice(order.discount)}`);
      lines.push(`*Shipping:* ${order.shipping > 0 ? app.formatPrice(order.shipping) : "Free"}`);
      lines.push(`*Total Amount:* ${app.formatPrice(order.total)}`, ``);
      const c = order.customer;
      lines.push(
        `*Customer Details:*`,
        `👤 Name: ${c.name || "—"}`,
        `📱 Phone: ${c.phone || "—"}`,
        `📮 Pincode: ${c.pincode || "—"}`,
        `🏙️ City: ${c.city || "—"}`,
        `🏠 Address: ${c.address || "—"}`,
        c.notes ? `📝 Notes: ${c.notes}` : ``,
        ``,
        `Thank you for choosing PiNa Bakes! 🙏`,
        `Please confirm the order and share delivery timeline.`
      );
      return lines.join("\n");
    },
  };

  // === ROUTER ===
  router = {
    handleRoute: () => {
      const hash = window.location.hash || "#home";
      const m = hash.match(/^#\/product\/([^?#]+)/);
      if (m?.[1]) {
        app.router.showProduct(decodeURIComponent(m[1]));
        return;
      }
      const sectionId = hash.replace(/^#/, "") || "home";
      app.router.showSection(sectionId);
    },

    navigate: (path) => {
      if (path.startsWith("#")) window.location.hash = path;
      else if (path.startsWith("/")) window.location.hash = `#${path}`;
      else window.location.hash = `#${path}`;
    },

    showProduct: (slug) => {
      if (!Array.isArray(app.state.products) || !app.state.products.length) {
        return app.ui.showToast("Products not loaded yet.", "error");
      }
      const product = app.state.products.find((p) => String(p.slug) === String(slug));
      if (!product) {
        app.ui.showToast(`Product not found: ${slug}`, "error");
        app.router.navigate("products");
        return;
      }
      app.ui.renderProductDetail(product);
    },

    showProducts: () => {
      app.ui.hideProductDetail();
      app.router.navigate("products");
      const el = document.getElementById("products");
      if (el) el.scrollIntoView({ behavior: "smooth" });
    },

    showSection: (id) => {
      app.ui.hideProductDetail();
      const el = document.getElementById(id);
      if (el) el.scrollIntoView({ behavior: "smooth" });
      else window.scrollTo({ top: 0, behavior: "smooth" });
    },
  };

  // === SEARCH (simple, local) ===
  search = {
    init: () => {
      if (!app.elements.searchInput || !app.elements.searchSuggest) return;
      const input = app.elements.searchInput;
      const box = app.elements.searchSuggest;

      const close = () => box.classList.remove("active");
      document.addEventListener("click", (e) => {
        if (!box.contains(e.target) && e.target !== input) close();
      });

      input.addEventListener(
        "input",
        app.debounce(() => {
          const q = input.value.trim().toLowerCase();
          if (!q) {
            box.innerHTML = "";
            close();
            app.state.filteredProducts = null;
            app.ui.renderProducts();
            return;
          }
          const results = app.search.search(q).slice(0, 6);
          if (!results.length) {
            box.innerHTML = `<div class="search-suggestion">No matches</div>`;
            box.classList.add("active");
            return;
          }
          box.innerHTML = results
            .map(
              (p) => `
            <div class="search-suggestion" role="option" onclick="app.router.navigate('#/product/${p.slug}'); document.getElementById('site-search').value=''; document.getElementById('search-suggestions').classList.remove('active')">
              ${p.name} — ${app.formatPrice(p.price)}
            </div>`
            )
            .join("");
          box.classList.add("active");

          // Also filter list below
          app.state.filteredProducts = results;
          app.ui.renderProducts();
        }, 150)
      );
    },

    setupSearchIndex: () => {
      app.state.searchIndex = app.state.products.map((p) => ({
        slug: p.slug,
        name: p.name,
        text:
          `${p.name} ${p.tagline} ${p.tags?.join(" ") || ""} ${p.bullets?.join(" ") || ""}`.toLowerCase(),
      }));
    },

    search: (q) => {
      const terms = q.split(/\s+/).filter(Boolean);
      const scores = app.state.searchIndex
        .map((doc) => {
          let s = 0;
          for (const t of terms) {
            if (doc.text.includes(t)) s += 1;
            if (doc.name.toLowerCase().includes(t)) s += 2;
          }
          return { slug: doc.slug, score: s };
        })
        .filter((x) => x.score > 0)
        .sort((a, b) => b.score - a.score);

      const bySlug = new Map(app.state.products.map((p) => [p.slug, p]));
      return scores.map((s) => bySlug.get(s.slug)).filter(Boolean);
    },
  };

  // === SIMPLE RECOMMENDATIONS ===
  recommendations = {
    getSimilarProducts: (product) => {
      const tags = new Set(product.tags || []);
      const others = app.state.products.filter((p) => p.slug !== product.slug);
      const scored = others
        .map((p) => {
          const overlap = (p.tags || []).reduce((n, t) => n + (tags.has(t) ? 1 : 0), 0);
          const priceDiff = Math.abs(p.price - product.price);
          const priceScore = Math.max(0, 3 - Math.floor(priceDiff / 100)); // 0..3
          return { p, score: overlap * 3 + priceScore };
        })
        .sort((a, b) => b.score - a.score);
      return scored.slice(0, 4).map((x) => x.p);
    },
  };

  // === BACKEND (best-effort) ===
  backend = {
    sendOrder: (order) => {
      try {
        fetch(app.config.orderWebhook, {
          method: "POST",
          mode: "no-cors",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(order),
        }).catch(() => void 0);
      } catch {
        /* ignore */
      }
    },
  };

  // === Validation / Utils ===
  validation = {
    validatePhone: (digits) => /^\d{10}$/.test(digits),
    validatePincode: (pin) => /^\d{6}$/.test(pin),
  };

  util = {
    sanitizeInput: (s) =>
      String(s)
        .replace(/[<>]/g, "") // basic XSS guard
        .trim(),
  };
}

// Boot
const App = new PinaBakesApp();
window.App = App;
window.app = App; // alias so onclick="app.…" in HTML works
