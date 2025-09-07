// Fixed PiNa Bakes App - Working version with embedded products
class PinaBakesApp {
  constructor() {
    this.config = {
      whatsappNumber: "917678506669",
      coupons: { PINA10: { type: "percent", value: 10 } },
      shippingCharge: 60,
      freeShippingThreshold: 999,
    };

    // EMBEDDED PRODUCTS DATA (no external JSON needed)
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

    this.init();
  }

  init() {
    this.setupEventListeners();
    this.renderProducts();
    this.updateCurrentYear();
    this.setupSearch();
    this.renderCart();
  }

  setupEventListeners() {
    // Smooth scrolling for navigation
    document.querySelectorAll('a[href^="#"]').forEach(link => {
      link.addEventListener('click', (e) => {
        const href = link.getAttribute('href');
        if (href.startsWith('#/product/')) return; // Let router handle product links
        
        e.preventDefault();
        const target = href.substring(1);
        const element = document.getElementById(target);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      });
    });

    // Header scroll effect
    window.addEventListener('scroll', () => {
      const header = document.getElementById('header');
      if (window.scrollY > 100) {
        header.classList.add('scrolled');
      } else {
        header.classList.remove('scrolled');
      }
    });

    // Hash change for routing
    window.addEventListener('hashchange', () => {
      this.handleRoute();
    });

    // Initial route
    this.handleRoute();
  }

  handleRoute() {
    const hash = window.location.hash;
    if (hash.startsWith('#/product/')) {
      const slug = hash.replace('#/product/', '');
      this.showProductDetail(slug);
    } else {
      this.hideProductDetail();
    }
  }

  setupSearch() {
    const searchInput = document.getElementById('site-search');
    const suggestions = document.getElementById('search-suggestions');
    
    if (searchInput && suggestions) {
      searchInput.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase().trim();
        if (!query) {
          suggestions.classList.remove('active');
          return;
        }

        const results = this.products.filter(product => 
          product.name.toLowerCase().includes(query) ||
          product.tagline.toLowerCase().includes(query) ||
          product.ingredients.some(ing => ing.toLowerCase().includes(query))
        ).slice(0, 5);

        if (results.length === 0) {
          suggestions.classList.remove('active');
          return;
        }

        suggestions.innerHTML = results.map(product => 
          `<div class="search-suggestion" onclick="app.showProductDetail('${product.slug}'); app.closeSuggestions();">
            ${product.name} · ${this.formatPrice(product.price)}
          </div>`
        ).join('');

        suggestions.classList.add('active');
      });

      // Close suggestions when clicking outside
      document.addEventListener('click', (e) => {
        if (!searchInput.contains(e.target) && !suggestions.contains(e.target)) {
          suggestions.classList.remove('active');
        }
      });
    }
  }

  closeSuggestions() {
    const suggestions = document.getElementById('search-suggestions');
    if (suggestions) {
      suggestions.classList.remove('active');
    }
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
                 onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDMwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0xNTAgMTIwQzE2NS4xIDEyMCAxNzcuNSAxMzIuNCAxNzcuNSAxNDcuNUMxNzcuNSAxNjIuNiAxNjUuMSAxNzUgMTUwIDE75XkMxMzQuOSAxNzUgMTIyLjUgMTYyLjYgMTIyLjUgMTQ3LjVDMTIyLjUgMTMyLjQgMTM0LjkgMTIwIDE1MCAxMjBaIiBmaWxsPSIjRDFENUQ5Ii8+Cjwvc3ZnPgo='">
            ${isNew ? '<span class="product-badge">New</span>' : ''}
            ${isPremium ? '<span class="product-badge" style="top: 3rem;">Premium</span>' : ''}
          </div>
          <div class="product-content">
            <h3 class="product-title">${product.name}</h3>
            <div class="product-price">${this.formatPrice(product.price)}</div>
            <p class="product-tagline">${product.tagline}</p>
            <div class="product-actions">
              <button class="btn btn-secondary" onclick="app.showProductDetail('${product.slug}')">View Details</button>
              <button class="btn btn-primary" onclick="app.addToCart('${product.slug}')" aria-label="Add ${product.name} to cart">Add to Cart</button>
            </div>
          </div>
        </article>
      `;
    }).join('');

    grid.innerHTML = html;
  }

  showProductDetail(slug) {
    const product = this.products.find(p => p.slug === slug);
    if (!product) {
      this.showToast('Product not found', 'error');
      return;
    }

    this.currentProduct = product;
    this.currentImageIndex = 0;

    // Update URL
    window.location.hash = `#/product/${slug}`;

    // Update product detail page
    document.getElementById('product-title').textContent = product.name;
    document.getElementById('product-price').textContent = this.formatPrice(product.price);
    document.getElementById('product-tagline').textContent = product.tagline;

    // Setup gallery
    this.setupGallery(product);

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
    this.renderNutritionTable(product);

    // Setup buttons
    document.getElementById('add-to-cart-detail').onclick = () => this.addToCart(product.slug);

    // Show product detail
    document.getElementById('products').style.display = 'none';
    document.getElementById('product-detail').style.display = 'block';
    window.scrollTo(0, 0);
  }

  hideProductDetail() {
    document.getElementById('product-detail').style.display = 'none';
    document.getElementById('products').style.display = 'block';
    this.currentProduct = null;
  }

  setupGallery(product) {
    const images = product.images || [product.img];
    const mainImage = document.getElementById('product-main-image');
    const thumbnails = document.getElementById('product-thumbnails');

    if (mainImage) {
      mainImage.src = images[0];
      mainImage.alt = `${product.name} - Main image`;
      mainImage.onclick = () => this.openLightbox();
    }

    if (thumbnails) {
      thumbnails.innerHTML = images.map((image, index) => 
        `<img src="${image}" 
              alt="${product.name} - Image ${index + 1}" 
              class="product-thumbnail ${index === 0 ? 'active' : ''}"
              onclick="app.selectImage(${index})"
              onerror="this.style.display='none'">`
      ).join('');
    }
  }

  selectImage(index) {
    if (!this.currentProduct) return;
    
    const images = this.currentProduct.images || [this.currentProduct.img];
    if (index >= 0 && index < images.length) {
      this.currentImageIndex = index;
      
      const mainImage = document.getElementById('product-main-image');
      if (mainImage) {
        mainImage.src = images[index];
      }

      // Update active thumbnail
      document.querySelectorAll('.product-thumbnail').forEach((thumb, i) => {
        thumb.classList.toggle('active', i === index);
      });
    }
  }

  openLightbox() {
    if (!this.currentProduct) return;
    
    const images = this.currentProduct.images || [this.currentProduct.img];
    const currentImage = images[this.currentImageIndex];
    
    // Create simple lightbox
    const lightbox = document.getElementById('lightbox') || this.createLightbox();
    const lightboxImage = document.getElementById('lightbox-image');
    
    if (lightboxImage) {
      lightboxImage.src = currentImage;
      lightbox.classList.add('active');
    }
  }

  createLightbox() {
    const lightbox = document.createElement('div');
    lightbox.id = 'lightbox';
    lightbox.className = 'overlay';
    lightbox.onclick = () => lightbox.classList.remove('active');
    
    lightbox.innerHTML = `
      <img id="lightbox-image" style="max-width:90vw;max-height:85vh;border-radius:12px;" onclick="event.stopPropagation()">
    `;
    
    document.body.appendChild(lightbox);
    return lightbox;
  }

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

  addToCart(productSlug, quantity = 1) {
    const product = this.products.find(p => p.slug === productSlug);
    if (!product) {
      this.showToast('Product not found', 'error');
      return;
    }

    const existingItem = this.cart.find(item => item.slug === productSlug);
    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      this.cart.push({
        ...product,
        quantity
      });
    }

    this.renderCart();
    this.showToast(`${product.name} added to cart!`, 'success');
    
    // Animate cart button
    const cartCount = document.getElementById('cart-count');
    if (cartCount) {
      cartCount.classList.add('bounce');
      setTimeout(() => cartCount.classList.remove('bounce'), 300);
    }
  }

  removeFromCart(slug) {
    this.cart = this.cart.filter(item => item.slug !== slug);
    this.renderCart();
    this.showToast('Item removed from cart');
  }

  updateQuantity(slug, newQuantity) {
    if (newQuantity <= 0) {
      this.removeFromCart(slug);
      return;
    }

    const item = this.cart.find(item => item.slug === slug);
    if (item) {
      item.quantity = newQuantity;
      this.renderCart();
    }
  }

  renderCart() {
    const itemCount = this.cart.reduce((count, item) => count + item.quantity, 0);
    const cartCount = document.getElementById('cart-count');
    if (cartCount) {
      cartCount.textContent = itemCount;
      cartCount.style.display = itemCount > 0 ? 'flex' : 'none';
    }

    const cartItems = document.getElementById('cart-items');
    if (!cartItems) return;

    if (this.cart.length === 0) {
      cartItems.innerHTML = `
        <div style="text-align:center; padding:3rem 1rem; color:var(--text-secondary);">
          <svg width="64" height="64" fill="none" stroke="currentColor" viewBox="0 0 24 24" style="margin-bottom:1rem; opacity:.5;">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5m6.5-5v6a2 2 0 11-4 0v-6m4 0V9a2 2 0 10-4 0v4.01"/>
          </svg>
          <p>Your cart is empty</p>
          <button class="btn btn-primary" onclick="app.closeCart(); document.getElementById('products').scrollIntoView({behavior:'smooth'});">Browse Products</button>
        </div>
      `;
    } else {
      cartItems.innerHTML = this.cart.map(item => `
        <div class="cart-item">
          <img src="${item.img}" alt="${item.name}" class="cart-item-image" onerror="this.style.display='none'">
          <div class="cart-item-details" style="flex: 1;">
            <div class="cart-item-title">${item.name}</div>
            <div class="cart-item-price">${this.formatPrice(item.price)}</div>
            <div class="cart-item-actions">
              <button class="quantity-btn" onclick="app.updateQuantity('${item.slug}', ${item.quantity - 1})" aria-label="Decrease quantity">-</button>
              <span style="min-width:2rem; text-align:center;">${item.quantity}</span>
              <button class="quantity-btn" onclick="app.updateQuantity('${item.slug}', ${item.quantity + 1})" aria-label="Increase quantity">+</button>
            </div>
          </div>
          <div style="text-align:right;">
            <div style="font-weight:600;">${this.formatPrice(item.price * item.quantity)}</div>
            <button onclick="app.removeFromCart('${item.slug}')" style="color:#dc2626; background:none; border:none; cursor:pointer; margin-top:.5rem; font-size:.875rem;" aria-label="Remove ${item.name} from cart">Remove</button>
          </div>
        </div>
      `).join('');
    }

    // Update totals
    const subtotal = this.cart.reduce((total, item) => total + (item.price * item.quantity), 0);
    const discount = this.getDiscount(subtotal);
    const shipping = this.getShipping(subtotal - discount);
    const total = Math.max(0, subtotal - discount + shipping);

    document.getElementById('cart-subtotal').textContent = this.formatPrice(subtotal);
    document.getElementById('cart-discount').textContent = discount > 0 ? `- ${this.formatPrice(discount)}` : this.formatPrice(0);
    document.getElementById('cart-shipping').textContent = this.formatPrice(shipping);
    document.getElementById('cart-total').textContent = this.formatPrice(total);

    // Show/hide checkout form
    const checkoutForm = document.getElementById('checkout-form');
    if (checkoutForm) {
      checkoutForm.style.display = this.cart.length > 0 ? 'block' : 'none';
    }
  }

  getDiscount(subtotal) {
    if (!this.appliedCoupon) return 0;
    if (this.appliedCoupon.type === 'percent') {
      return Math.round((subtotal * this.appliedCoupon.value) / 100);
    }
    return 0;
  }

  getShipping(subtotalAfterDiscount) {
    if (subtotalAfterDiscount >= this.config.freeShippingThreshold) return 0;
    return this.cart.length > 0 ? this.config.shippingCharge : 0;
  }

  applyCoupon() {
    const input = document.getElementById('coupon-code');
    const code = (input?.value || '').trim().toUpperCase();
    
    if (!code) {
      this.appliedCoupon = null;
      this.renderCart();
      return;
    }

    const coupon = this.config.coupons[code];
    if (!coupon) {
      this.showToast('Invalid coupon code', 'error');
      document.getElementById('coupon-msg').textContent = 'Invalid coupon code';
      return;
    }

    this.appliedCoupon = { code, ...coupon };
    this.renderCart();
    this.showToast(`Coupon applied: ${code} (${coupon.value}% off)`, 'success');
    document.getElementById('coupon-msg').textContent = `Applied ${code}: ${coupon.value}% off`;
  }

  toggleCart() {
    const modal = document.getElementById('cart-modal');
    const overlay = document.getElementById('cart-overlay');
    
    if (modal.classList.contains('active')) {
      this.closeCart();
    } else {
      this.openCart();
    }
  }

  openCart() {
    const modal = document.getElementById('cart-modal');
    const overlay = document.getElementById('cart-overlay');
    
    modal.classList.add('active');
    overlay.classList.add('active');
  }

  closeCart() {
    const modal = document.getElementById('cart-modal');
    const overlay = document.getElementById('cart-overlay');
    
    modal.classList.remove('active');
    overlay.classList.remove('active');
  }

  proceedToCheckout() {
    if (this.cart.length === 0) {
      this.showToast('Your cart is empty!', 'error');
      return;
    }

    // Get form data
    const formData = {
      name: document.getElementById('customer-name')?.value?.trim() || '',
      phone: document.getElementById('customer-phone')?.value?.trim() || '',
      pincode: document.getElementById('customer-pincode')?.value?.trim() || '',
      city: document.getElementById('customer-city')?.value?.trim() || '',
      address: document.getElementById('customer-address')?.value?.trim() || '',
      notes: document.getElementById('customer-notes')?.value?.trim() || ''
    };

    // Basic validation
    if (!formData.name || !formData.phone || !formData.address) {
      this.showToast('Please fill in all required fields', 'error');
      return;
    }

    const subtotal = this.cart.reduce((total, item) => total + (item.price * item.quantity), 0);
    const discount = this.getDiscount(subtotal);
    const shipping = this.getShipping(subtotal - discount);
    const total = Math.max(0, subtotal - discount + shipping);

    const itemsList = this.cart
      .map(item => `• ${item.name} (×${item.quantity}) - ${this.formatPrice(item.price * item.quantity)}`)
      .join('\n');

    const order = {
      id: `PIN${Date.now()}`,
      createdAt: new Date().toISOString(),
      coupon: this.appliedCoupon?.code || '',
      subtotal,
      discount,
      shipping,
      total,
      customer: formData,
      items: this.cart.map(item => ({
        slug: item.slug,
        name: item.name,
        qty: item.quantity,
        price: item.price
      }))
    };

    // Generate WhatsApp message
    const message = this.generateWhatsAppMessage(order, itemsList);
    const whatsappUrl = `https://wa.me/${this.config.whatsappNumber}?text=${encodeURIComponent(message)}`;
    
    window.open(whatsappUrl, '_blank');
    this.showToast('Redirecting to WhatsApp...', 'success');
  }

  generateWhatsAppMessage(order, itemsList) {
    const lines = [
      '🍪 *PiNa Bakes Order Request*',
      '',
      '*Items Ordered:*',
      itemsList,
      '',
      `*Subtotal:* ${this.formatPrice(order.subtotal)}`
    ];

    if (order.discount > 0) {
      lines.push(`*Discount${order.coupon ? ` (${order.coupon})` : ''}:* -${this.formatPrice(order.discount)}`);
    }

    if (order.shipping > 0) {
      lines.push(`*Shipping:* ${this.formatPrice(order.shipping)}`);
    } else {
      lines.push('*Shipping:* Free');
    }

    lines.push(`*Total Amount:* ${this.formatPrice(order.total)}`, '');

    const c = order.customer;
    lines.push(
      '*Customer Details:*',
      `👤 Name: ${c.name || '—'}`,
      `📱 Phone: ${c.phone || '—'}`,
      `📮 Pincode: ${c.pincode || '—'}`,
      `🏙️ City: ${c.city || '—'}`,
      `🏠 Address: ${c.address || '—'}`,
      `📝 Notes: ${c.notes || '—'}`,
      '',
      'Thank you for choosing PiNa Bakes! 🙏',
      'Please confirm the order and let me know the delivery timeline.'
    );

    return lines.join('\n');
  }

  formatPrice(price) {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(price);
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

  updateCurrentYear() {
    const yearElement = document.getElementById('current-year');
    if (yearElement) {
      yearElement.textContent = new Date().getFullYear();
    }
  }

  toggleMobileMenu() {
    this.showToast('Mobile menu feature coming soon!');
  }

  toggleWishlist() {
    this.showToast('Wishlist feature coming soon!');
  }
}

// Initialize the app and make it globally accessible
const app = new PinaBakesApp();
window.app = app;
window.App = app; // Also expose as App for compatibility
