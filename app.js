// Simplified PiNa Bakes App - Bug-free version
class PinaBakesApp {
  constructor() {
    // Embedded product data (no external JSON dependency)
    this.products = [
      {
        slug: "nutty-coco",
        name: "Nutty-Coco Delight",
        price: 199,
        tagline: "Real coconut flakes meet wholesome jowar",
        img: "assets/products/nutty-coco/pina-bakes-nutty-coco-1.jpg",
        images: [
          "assets/products/nutty-coco/pina-bakes-nutty-coco-1.jpg",
          "assets/products/nutty-coco/pina-bakes-nutty-coco-2.jpg",
          "assets/products/nutty-coco/pina-bakes-nutty-coco-3.jpg"
        ],
        bullets: [
          "Crisp edges with soft, chewy center",
          "Made with authentic coconut flakes",
          "Rich in dietary fiber from jowar",
          "No artificial coconut flavoring"
        ],
        ingredients: [
          "Jowar (sorghum) flour",
          "Oats flour",
          "Fresh coconut flakes",
          "Pure butter",
          "Natural jaggery",
          "Baking powder",
          "Pure vanilla extract"
        ],
        nutrition: {
          energy: "445 kcal",
          protein: "8.2 g",
          fat: "18.5 g",
          carbs: "62.3 g",
          sugar: "22.1 g",
          fibre: "4.8 g",
          sodium: "156 mg"
        },
        tags: ["gluten-friendly", "high-fiber", "natural-sweetener"]
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
          "assets/products/jowar-peanut-butter/pina-bakes-jowar-peanut-butter-7.jpg"
        ],
        bullets: [
          "High in plant-based protein",
          "Made with pure peanut butter",
          "Zero refined flour (maida-free)",
          "Perfect post-workout snack"
        ],
        ingredients: [
          "Jowar (sorghum) flour",
          "Natural peanut butter",
          "Organic jaggery",
          "Pure butter",
          "Aluminum-free baking powder"
        ],
        nutrition: {
          energy: "468 kcal",
          protein: "12.4 g",
          fat: "22.8 g",
          carbs: "54.7 g",
          sugar: "18.9 g",
          fibre: "5.2 g",
          sodium: "142 mg"
        },
        tags: ["high-protein", "maida-free", "post-workout"]
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
          "assets/products/lemon-blueberry/pina-bakes-lemon-blueberry-4.jpg"
        ],
        bullets: [
          "Fresh lemon zest for natural tanginess",
          "Real blueberry pieces (not artificial)",
          "Antioxidant-rich superfruit combination",
          "Refreshing citrus aroma"
        ],
        ingredients: [
          "Bajra (pearl millet) flour",
          "Rolled oats flour",
          "Fresh blueberries",
          "Pure butter",
          "Organic sugar",
          "Fresh lemon zest",
          "Natural lemon extract"
        ],
        nutrition: {
          energy: "421 kcal",
          protein: "7.8 g",
          fat: "16.2 g",
          carbs: "65.4 g",
          sugar: "26.8 g",
          fibre: "4.1 g",
          sodium: "128 mg"
        },
        tags: ["antioxidant-rich", "citrusy", "superfruit"]
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
          "assets/products/quinoa-walnut/pina-bakes-quinoa-walnut-7.jpg"
        ],
        bullets: [
          "Quinoa - complete protein superfood",
          "Premium California walnuts",
          "Satisfying nutty crunch texture",
          "Rich in omega-3 fatty acids"
        ],
        ingredients: [
          "Quinoa flour",
          "Jowar (sorghum) flour",
          "Premium walnut pieces",
          "Pure butter",
          "Natural jaggery"
        ],
        nutrition: {
          energy: "486 kcal",
          protein: "11.6 g",
          fat: "26.4 g",
          carbs: "52.8 g",
          sugar: "19.3 g",
          fibre: "6.8 g",
          sodium: "98 mg"
        },
        tags: ["superfood", "complete-protein", "omega-3", "premium"]
      },
      {
        slug: "richie-pistachio",
        name: "Richie-Pistachio Premium",
        price: 349,
        tagline: "Luxuriously loaded with premium pistachios",
        img: "assets/products/richie-pistachio/pina-bakes-Richie-Pistachio-1.jpg",
        images: [
          "assets/products/richie-pistachio/pina-bakes-Richie-Pistachio-1.jpg",
          "assets/products/richie-pistachio/pina-bakes-Richie-Pistachio-2.jpg",
          "assets/products/richie-pistachio/pina-bakes-Richie-Pistachio-3.jpg"
        ],
        bullets: [
          "Generously loaded with pistachios",
          "Premium Iranian pistachios",
          "Signature PiNa Bakes recipe",
          "Luxury treat for special occasions"
        ],
        ingredients: [
          "Premium pistachio kernels",
          "Bajra (pearl millet) flour",
          "Pure butter",
          "Fine sugar",
          "Natural cardamom"
        ],
        nutrition: {
          energy: "524 kcal",
          protein: "14.2 g",
          fat: "32.6 g",
          carbs: "48.1 g",
          sugar: "21.4 g",
          fibre: "7.2 g",
          sodium: "106 mg"
        },
        tags: ["premium", "luxury", "pistachio-loaded", "signature"]
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
          "assets/products/foxtail-true-chocolate/pina-bakes-foxtail-true-chocolate-5.jpg"
        ],
        bullets: [
          "Belgian cocoa for deep chocolate flavor",
          "Foxtail millet - ancient superfood grain",
          "Rich, fudgy texture",
          "No artificial chocolate flavoring"
        ],
        ingredients: [
          "Foxtail millet flour",
          "Premium Belgian cocoa powder",
          "Pure butter",
          "Organic sugar",
          "Aluminum-free baking powder"
        ],
        nutrition: {
          energy: "456 kcal",
          protein: "9.8 g",
          fat: "19.4 g",
          carbs: "63.2 g",
          sugar: "28.6 g",
          fibre: "8.4 g",
          sodium: "164 mg"
        },
        tags: ["premium", "belgian-cocoa", "ancient-grain", "fudgy"]
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
          "assets/products/ragi-millet/pina-bakes-ragi-millet-6.jpg"
        ],
        bullets: [
          "High in natural calcium from ragi",
          "Perfect with tea or coffee",
          "Naturally gluten-free",
          "Traditional South Indian superfood"
        ],
        ingredients: [
          "Ragi (finger millet) flour",
          "Rolled oats flour",
          "Pure butter",
          "Natural jaggery"
        ],
        nutrition: {
          energy: "412 kcal",
          protein: "9.4 g",
          fat: "15.8 g",
          carbs: "58.2 g",
          sugar: "20.6 g",
          fibre: "6.2 g",
          sodium: "118 mg"
        },
        tags: ["high-calcium", "gluten-free", "traditional"]
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
          "assets/products/bajra-almond/pina-bakes-bajra-almond-5.jpg"
        ],
        bullets: [
          "Crunchy almond pieces in every bite",
          "Hearty bajra millet base",
          "Rich in healthy fats",
          "Perfect energy snack"
        ],
        ingredients: [
          "Bajra (pearl millet) flour",
          "Roasted almond pieces",
          "Pure butter",
          "Organic sugar"
        ],
        nutrition: {
          energy: "458 kcal",
          protein: "10.8 g",
          fat: "21.4 g",
          carbs: "56.8 g",
          sugar: "24.2 g",
          fibre: "5.4 g",
          sodium: "134 mg"
        },
        tags: ["almond-rich", "energy-boost", "healthy-fats"]
      }
    ];

    this.cart = [];
    this.currentProduct = null;
    this.currentImageIndex = 0;
    this.appliedCoupon = null;
    this.coupons = { PINA10: { type: "percent", value: 10 } };
    this.shippingCharge = 60;
    this.freeShippingThreshold = 999;

    this.init();
  }

  init() {
    this.setupEventListeners();
    this.renderProducts();
    this.updateCurrentYear();
    this.cart.render();
  }

  setupEventListeners() {
    // Navigation
    document.querySelectorAll('a[href^="#"]').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const target = link.getAttribute('href').substring(1);
        if (target) {
          document.getElementById(target)?.scrollIntoView({ behavior: 'smooth' });
        }
      });
    });

    // Search
    const searchInput = document.getElementById('site-search');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.search(e.target.value);
      });
    }

    // Header scroll effect
    window.addEventListener('scroll', () => {
      const header = document.getElementById('header');
      if (window.scrollY > 100) {
        header.classList.add('scrolled');
      } else {
        header.classList.remove('scrolled');
      }
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.closeAllModals();
      }
    });
  }

  renderProducts() {
    const grid = document.getElementById('products-grid');
    if (!grid) return;

    const html = this.products.map(product => {
      const isNew = product.price >= 300;
      const isPremium = product.price >= 300;
      
      return `
        <article class="product-card" data-product-id="${product.slug}">
          <div class="product-image-container">
            <img src="${product.img}" 
                 alt="${product.name} cookies by PiNa Bakes" 
                 class="product-image" 
                 loading="lazy" 
                 onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDMwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0xNTAgMTIwQzE2NS4xIDEyMCAxNzcuNSAxMzIuNCAxNzcuNSAxNDcuNUMxNzcuNSAxNjIuNiAxNjUuMSAxNzUgMTUwIDE3NUMxMzQuOSAxNzUgMTIyLjUgMTYyLjYgMTIyLjUgMTQ3LjVDMTIyLjUgMTMyLjQgMTM0LjkgMTIwIDE1MCAxMjBaIiBmaWxsPSIjRDFENUQ5Ii8+CjwvU3ZnPgo='">
            ${isNew ? '<span class="product-badge">New</span>' : ''}
            ${isPremium ? '<span class="product-badge" style="top: 3rem;">Premium</span>' : ''}
          </div>
          <div class="product-content">
            <h3 class="product-title">${product.name}</h3>
            <div class="product-price">${this.formatPrice(product.price)}</div>
            <p class="product-tagline">${product.tagline}</p>
            <div class="product-actions">
              <button class="btn btn-secondary" onclick="app.router.showProduct('${product.slug}')">View Details</button>
              <button class="btn btn-primary" onclick="app.cart.add('${product.slug}')" aria-label="Add ${product.name} to cart">Add to Cart</button>
            </div>
          </div>
        </article>
      `;
    }).join('');

    grid.innerHTML = html;
  }

  search(query) {
    const suggestions = document.getElementById('search-suggestions');
    if (!suggestions) return;

    if (!query.trim()) {
      suggestions.classList.remove('active');
      return;
    }

    const results = this.products.filter(product => 
      product.name.toLowerCase().includes(query.toLowerCase()) ||
      product.tagline.toLowerCase().includes(query.toLowerCase()) ||
      product.ingredients.some(ing => ing.toLowerCase().includes(query.toLowerCase()))
    ).slice(0, 5);

    if (results.length === 0) {
      suggestions.classList.remove('active');
      return;
    }

    suggestions.innerHTML = results.map(product => 
      `<div class="search-suggestion" onclick="app.router.showProduct('${product.slug}'); app.closeSuggestions();">
        ${product.name} · ${this.formatPrice(product.price)}
      </div>`
    ).join('');

    suggestions.classList.add('active');
  }

  closeSuggestions() {
    const suggestions = document.getElementById('search-suggestions');
    if (suggestions) {
      suggestions.classList.remove('active');
    }
  }

  formatPrice(price) {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(price);
  }

  updateCurrentYear() {
    const yearElement = document.getElementById('current-year');
    if (yearElement) {
      yearElement.textContent = new Date().getFullYear();
    }
  }

  closeAllModals() {
    this.cart.close();
    this.gallery.closeLightbox();
    this.closeSuggestions();
  }

  showToast(message, type = 'info', duration = 3000) {
    const toast = document.getElementById('toast');
    if (!toast) return;

    toast.textContent = message;
    toast.className = `toast show ${type}`;
    
    setTimeout(() => {
      toast.classList.remove('show');
    }, duration);
  }

  // Router object
  router = {
    showProduct: (slug) => {
      const product = app.products.find(p => p.slug === slug);
      if (!product) {
        app.showToast('Product not found', 'error');
        return;
      }

      app.currentProduct = product;
      app.currentImageIndex = 0;

      // Update product detail page
      document.getElementById('product-title').textContent = product.name;
      document.getElementById('product-price').textContent = app.formatPrice(product.price);
      document.getElementById('product-tagline').textContent = product.tagline;

      // Setup gallery
      app.gallery.setup(product);

      // Features
      const featuresEl = document.getElementById('product-features');
      if (product.bullets && product.bullets.length > 0) {
        featuresEl.innerHTML = `
          <h3>Key Features</h3>
          <ul>${product.bullets.map(bullet => `<li>${bullet}</li>`).join('')}</ul>
        `;
      } else {
        featuresEl.innerHTML = '';
      }

      // Ingredients
      const ingredientsEl = document.getElementById('product-ingredients');
      if (product.ingredients && product.ingredients.length > 0) {
        ingredientsEl.innerHTML = product.ingredients.map(ing => `<li>${ing}</li>`).join('');
      } else {
        ingredientsEl.innerHTML = '';
      }

      // Nutrition
      app.renderNutritionTable(product);

      // Setup buttons
      document.getElementById('add-to-cart-detail').onclick = () => app.cart.add(product.slug);

      // Show product detail
      document.getElementById('products').style.display = 'none';
      document.getElementById('product-detail').style.display = 'block';
      window.scrollTo(0, 0);
    },

    showProducts: () => {
      document.getElementById('product-detail').style.display = 'none';
      document.getElementById('products').style.display = 'block';
      app.currentProduct = null;
    }
  };

  renderNutritionTable(product) {
    const table = document.getElementById('nutrition-table');
    if (!table || !product.nutrition) return;

    const nutrition = product.nutrition;
    const rows = [
      ['Energy', nutrition.energy || '— kcal'],
      ['Protein', nutrition.protein || '— g'],
      ['Total Fat', nutrition.fat || '— g'],
      ['Carbohydrates', nutrition.carbs || '— g'],
      ['Added Sugar', nutrition.sugar || '— g'],
      ['Dietary Fibre', nutrition.fibre || '— g'],
      ['Sodium', nutrition.sodium || '— mg']
    ];

    table.innerHTML = rows.map(([nutrient, amount]) => 
      `<tr>
        <td style="padding:.75rem;border:1px solid #dee2e6;">${nutrient}</td>
        <td style="padding:.75rem;border:1px solid #dee2e6;">${amount}</td>
      </tr>`
    ).join('');
  }

  // Gallery object
  gallery = {
    setup: (product) => {
      const images = product.images || [product.img];
      const mainImage = document.getElementById('product-main-image');
      const thumbnails = document.getElementById('product-thumbnails');

      if (mainImage) {
        mainImage.src = images[0];
        mainImage.alt = `${product.name} - Main image`;
      }

      if (thumbnails) {
        thumbnails.innerHTML = images.map((image, index) => 
          `<img src="${image}" 
                alt="${product.name} - Image ${index + 1}" 
                class="product-thumbnail ${index === 0 ? 'active' : ''}"
                onclick="app.gallery.selectImage(${index})"
                onerror="this.style.display='none'">`
        ).join('');
      }
    },

    selectImage: (index) => {
      if (!app.currentProduct) return;
      
      const images = app.currentProduct.images || [app.currentProduct.img];
      if (index >= 0 && index < images.length) {
        app.currentImageIndex = index;
        
        const mainImage = document.getElementById('product-main-image');
        if (mainImage) {
          mainImage.src = images[index];
        }

        // Update active thumbnail
        document.querySelectorAll('.product-thumbnail').forEach((thumb, i) => {
          thumb.classList.toggle('active', i === index);
        });
      }
    },

    openLightbox: () => {
      if (!app.currentProduct) return;
      
      const images = app.currentProduct.images || [app.currentProduct.img];
      const currentImage = images[app.currentImageIndex];
      
      const lightbox = document.getElementById('lightbox');
      const lightboxImage = document.getElementById('lightbox-image');
      
      if (lightbox && lightboxImage) {
        lightboxImage.src = currentImage;
        lightbox.classList.add('active');
      }
    },

    closeLightbox: () => {
      const lightbox = document.getElementById('lightbox');
      if (lightbox) {
        lightbox.classList.remove('active');
      }
    }
  };

  // Cart object  
  cart = {
    add: (productSlug, quantity = 1) => {
      const product = app.products.find(p => p.slug === productSlug);
      if (!product) {
        app.showToast('Product not found', 'error');
        return;
      }

      const existingItem = app.cart.find(item => item.slug === productSlug);
      if (existingItem) {
        existingItem.quantity += quantity;
      } else {
        app.cart.push({
          ...product,
          quantity
        });
      }

      app.cart.render();
      app.showToast(`${product.name} added to cart!`, 'success');
      
      // Animate cart button
      const cartCount = document.getElementById('cart-count');
      if (cartCount) {
        cartCount.classList.add('bounce');
        setTimeout(() => cartCount.classList.remove('bounce'), 300);
      }
    },

    remove: (slug) => {
      app.cart = app.cart.filter(item => item.slug !== slug);
      app.cart.render();
      app.showToast('Item removed from cart');
    },

    updateQuantity: (slug, newQuantity) => {
      if (newQuantity <= 0) {
        app.cart.remove(slug);
        return;
      }

      const item = app.cart.find(item => item.slug === slug);
      if (item) {
        item.quantity = newQuantity;
        app.cart.render();
      }
    },

    getSubtotal: () => {
      return app.cart.reduce((total, item) => total + (item.price * item.quantity), 0);
    },

    getDiscount: (subtotal) => {
      if (!app.appliedCoupon) return 0;
      
      if (app.appliedCoupon.type === 'percent') {
        return Math.round((subtotal * app.appliedCoupon.value) / 100);
      }
      return 0;
    },

    getShipping: (subtotalAfterDiscount) => {
      if (subtotalAfterDiscount >= app.freeShippingThreshold) return 0;
      return app.cart.length > 0 ? app.shippingCharge : 0;
    },

    getTotal: () => {
      const subtotal = app.cart.getSubtotal();
      const discount = app.cart.getDiscount(subtotal);
      const subtotalAfterDiscount = Math.max(0, subtotal - discount);
      const shipping = app.cart.getShipping(subtotalAfterDiscount);
      return subtotalAfterDiscount + shipping;
    },

    applyCoupon: () => {
      const input = document.getElementById('coupon-code');
      const code = (input?.value || '').trim().toUpperCase();
      
      if (!code) {
        app.appliedCoupon = null;
        app.cart.render();
        return;
      }

      const coupon = app.coupons[code];
      if (!coupon) {
        app.showToast('Invalid coupon code', 'error');
        document.getElementById('coupon-msg').textContent = 'Invalid coupon code';
        return;
      }

      app.appliedCoupon = { code, ...coupon };
      app.cart.render();
      app.showToast(`Coupon applied: ${code} (${coupon.value}% off)`, 'success');
      document.getElementById('coupon-msg').textContent = `Applied ${code}: ${coupon.value}% off`;
    },

    render: () => {
      const itemCount = app.cart.reduce((count, item) => count + item.quantity, 0);
      const cartCount = document.getElementById('cart-count');
      if (cartCount) {
        cartCount.textContent = itemCount;
        cartCount.style.display = itemCount > 0 ? 'flex' : 'none';
      }

      const cartItems = document.getElementById('cart-items');
      if (!cartItems) return;

      if (app.cart.length === 0) {
        cartItems.innerHTML = `
          <div style="text-align:center; padding:3rem 1rem; color:var(--text-secondary);">
            <svg width="64" height="64" fill="none" stroke="currentColor" viewBox="0 0 24 24" style="margin-bottom:1rem; opacity:.5;">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5m6.5-5v6a2 2 0 11-4 0v-6m4 0V9a2 2 0 10-4 0v4.01"/>
            </svg>
            <p>Your cart is empty</p>
            <button class="btn btn-primary" onclick="app.cart.close(); document.getElementById('products').scrollIntoView({behavior:'smooth'});">Browse Products</button>
          </div>
        `;
      } else {
        cartItems.innerHTML = app.cart.map(item => `
          <div class="cart-item">
            <img src="${item.img}" alt="${item.name}" class="cart-item-image" onerror="this.style.display='none'">
            <div class="cart-item-details" style="flex: 1;">
              <div class="cart-item-title">${item.name}</div>
              <div class="cart-item-price">${app.formatPrice(item.price)}</div>
              <div class="cart-item-actions">
                <button class="quantity-btn" onclick="app.cart.updateQuantity('${item.slug}', ${item.quantity - 1})" aria-label="Decrease quantity">-</button>
                <span style="min-width:2rem; text-align:center;">${item.quantity}</span>
                <button class="quantity-btn" onclick="app.cart.updateQuantity('${item.slug}', ${item.quantity + 1})" aria-label="Increase quantity">+</button>
              </div>
            </div>
            <div style="text-align:right;">
              <div style="font-weight:600;">${app.formatPrice(item.price * item.quantity)}</div>
              <button onclick="app.cart.remove('${item.slug}')" style="color:#dc2626; background:none; border:none; cursor:pointer; margin-top:.5rem; font-size:.875rem;" aria-label="Remove ${item.name} from cart">Remove</button>
            </div>
          </div>
        `).join('');
      }

      // Update totals
      const subtotal = app.cart.getSubtotal();
      const discount = app.cart.getDiscount(subtotal);
      const subtotalAfterDiscount = Math.max(0, subtotal - discount);
      const shipping = app.cart.getShipping(subtotalAfterDiscount);
      const total = subtotalAfterDiscount + shipping;

      document.getElementById('cart-subtotal').textContent = app.formatPrice(subtotal);
      document.getElementById('cart-discount').textContent = discount > 0 ? `- ${app.formatPrice(discount)}` : app.formatPrice(0);
      document.getElementById('cart-shipping').textContent = app.formatPrice(shipping);
      document.getElementById('cart-total').textContent = app.formatPrice(total);

      // Show/hide checkout form
      const checkoutForm = document.getElementById('checkout-form');
      if (checkoutForm) {
        checkoutForm.style.display = app.cart.length > 0 ? 'block' : 'none';
      }
    },

    toggle: () => {
      const modal = document.getElementById('cart-modal');
      const overlay = document.getElementById('cart-overlay');
      
      if (modal.classList.contains('active')) {
        app.cart.close();
      } else {
        app.cart.open();
      }
    },

    open: () => {
      const modal = document.getElementById('cart-modal');
      const overlay = document.getElementById('cart-overlay');
      
      modal.classList.add('active');
      overlay.classList.add('active');
    },

    close: () => {
      const modal = document.getElementById('cart-modal');
      const overlay = document.getElementById('cart-overlay');
      
      modal.classList.remove('active');
      overlay.classList.remove('active');
    }
  };

  // Checkout object
  checkout = {
    proceed: () => {
      if (app.cart.length === 0) {
        app.showToast('Your cart is empty!', 'error');
        return;
      }

      // Get form data
      const formData = {
        name: document.getElementById('customer-name')?.value?.trim() || '',
        phone: document.getElementById('customer-phone')?.value?.trim() || '',
        pincode: document.getElementById('customer-pincode')?.value?.trim() || '',
        city: document.getElementById('customer-city')?.value?.trim() || '',
        address: document.getElementById('customer-address')?.value?.trim() || ''
      };

      // Basic validation
      if (!formData.name || !formData.phone || !formData.address) {
        app.showToast('Please fill in all required fields', 'error');
        return;
      }

      const subtotal = app.cart.getSubtotal();
      const discount = app.cart.getDiscount(subtotal);
      const subtotalAfterDiscount = Math.max(0, subtotal - discount);
      const shipping = app.cart.getShipping(subtotalAfterDiscount);
      const total = subtotalAfterDiscount + shipping;

      const itemsList = app.cart
        .map(item => `• ${item.name} (×${item.quantity}) - ${app.formatPrice(item.price * item.quantity)}`)
        .join('\n');

      const order = {
        id: `PIN${Date.now()}`,
        createdAt: new Date().toISOString(),
        coupon: app.appliedCoupon?.code || '',
        subtotal,
        discount,
        shipping,
        total,
        customer: formData,
        items: app.cart.map(item => ({
          slug: item.slug,
          name: item.name,
          qty: item.quantity,
          price: item.price
        }))
      };

      // Generate WhatsApp message
      const message = app.checkout.generateWhatsAppMessage(order, itemsList);
      const whatsappUrl = `https://wa.me/917678506669?text=${encodeURIComponent(message)}`;
      
      window.open(whatsappUrl, '_blank');
      app.showToast('Redirecting to WhatsApp...', 'success');
    },

    generateWhatsAppMessage: (order, itemsList) => {
      const lines = [
        '🍪 *PiNa Bakes Order Request*',
        '',
        '*Items Ordered:*',
        itemsList,
        '',
        `*Subtotal:* ${app.formatPrice(order.subtotal)}`
      ];

      if (order.discount > 0) {
        lines.push(`*Discount${order.coupon ? ` (${order.coupon})` : ''}:* -${app.formatPrice(order.discount)}`);
      }

      if (order.shipping > 0) {
        lines.push(`*Shipping:* ${app.formatPrice(order.shipping)}`);
      } else {
        lines.push('*Shipping:* Free');
      }

      lines.push(`*Total Amount:* ${app.formatPrice(order.total)}`, '');

      const c = order.customer;
      lines.push(
        '*Customer Details:*',
        `👤 Name: ${c.name || '—'}`,
        `📱 Phone: ${c.phone || '—'}`,
        `📮 Pincode: ${c.pincode || '—'}`,
        `🏙️ City: ${c.city || '—'}`,
        `🏠 Address: ${c.address || '—'}`,
        '',
        'Thank you for choosing PiNa Bakes! 🙏',
        'Please confirm the order and let me know the delivery timeline.'
      );

      return lines.join('\n');
    }
  };

  // UI object
  ui = {
    toggleMobileMenu: () => {
      // Mobile menu toggle logic would go here
      // For simplicity, we'll just show a toast
      app.showToast('Mobile menu feature coming soon!');
    }
  };
}

// Initialize the app
const app = new PinaBakesApp();

// Make app globally accessible for onclick handlers
window.app = app;
