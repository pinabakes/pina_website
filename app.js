const App = {
  // CONFIGURATION
  config: {
    whatsappNumber: '917678506669',
    saveUserKey: 'pina_checkout_user',
    productsUrl: 'products.json',
  },

  // STATE
  state: {
    products: [],
    cart: [],
    galleryImgs: [],
    galleryIndex: 0,
  },

  // DOM ELEMENTS
  elements: {
    drawer: document.getElementById('drawer'),
    backdrop: document.getElementById('backdrop'),
    burger: document.querySelector('.burger'),
    cartModal: document.getElementById('cart-modal'),
    productGrid: document.getElementById('product-grid'),
    productPage: document.getElementById('product-page'),
    hero: document.getElementById('home'),
    mainSections: document.querySelectorAll('main > .section:not(#product-page)'),
    toast: document.getElementById('toast-notification'),
  },

  // INITIALIZATION
  init() {
    document.getElementById('year').textContent = new Date().getFullYear();
    window.addEventListener('hashchange', () => this.router.renderRoute());
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') this.ui.closeAll();
      if (this.state.galleryImgs.length > 0 && !this.elements.productPage.hidden) {
        if (e.key === 'ArrowRight') this.gallery.next();
        if (e.key === 'ArrowLeft') this.gallery.prev();
      }
    });
    this.cart.load();
    this.checkout.loadUserDetails();
    this.router.renderRoute();
    this.loadProducts();
  },

  // PRODUCT LOADING
  async loadProducts() {
    this.ui.showSkeletonLoader();
    try {
      const response = await fetch(this.config.productsUrl);
      if (!response.ok) throw new Error('Network response was not ok');
      this.state.products = await response.json();
      this.ui.renderProductGrid();
    } catch (error) {
      console.error('Failed to load products:', error);
      this.elements.productGrid.innerHTML = '<p>Error loading products. Please try again later.</p>';
    }
  },
  
  // UI & UX MODULE
  ui: {
    showToast(message) {
      const { toast } = App.elements;
      toast.textContent = message;
      toast.classList.add('show');
      setTimeout(() => toast.classList.remove('show'), 3000);
    },

    showSkeletonLoader() {
      const { productGrid } = App.elements;
      productGrid.innerHTML = Array.from({ length: 8 }).map(() => `
        <div class="card">
          <div class="skeleton" style="aspect-ratio:1/1;"></div>
          <div class="card-body" style="gap:1rem;">
            <div class="skeleton" style="height:1.2rem;width:80%;"></div>
            <div class="skeleton" style="height:1rem;width:40%;"></div>
            <div class="skeleton" style="height:1rem;width:90%;"></div>
            <div class="skeleton" style="height:2.5rem;width:100%;margin-top:auto;"></div>
          </div>
        </div>
      `).join('');
    },
    
    renderProductGrid() {
      const { productGrid } = App.elements;
      productGrid.innerHTML = App.state.products.map(p => `
        <article class="card">
          <a href="#/product/${p.slug}" aria-label="View ${p.name}">
            <img class="thumb" loading="lazy" src="${p.img}" alt="PiNa Bakes ${p.name} cookies">
          </a>
          <div class="card-body">
            <div class="title">${p.name}</div>
            <div class="price">₹${p.price}</div>
            <div class="tagline">${p.tagline}</div>
            <div style="display:flex;gap:.5rem;flex-wrap:wrap;margin-top:auto">
              <a class="btn" href="#/product/${p.slug}">View details</a>
              <button class="btn tertiary" onclick="App.cart.add('${p.slug}')">Add to Cart</button>
            </div>
          </div>
        </article>`).join('');
    },

    toggleDrawer() {
      const { drawer } = App.elements;
      drawer.classList.contains('open') ? this.closeAll() : this.openDrawer();
    },

    openDrawer() {
      this.closeAll(true);
      const { drawer, backdrop, burger } = App.elements;
      drawer.classList.add('open');
      backdrop.classList.add('active');
      backdrop.hidden = false;
      burger.setAttribute('aria-expanded', 'true');
      document.body.style.overflow = 'hidden';
      this.trapFocus(drawer);
    },
    
    closeAll(silent = false) {
      const { drawer, backdrop, burger, cartModal } = App.elements;
      drawer.classList.remove('open');
      cartModal.classList.remove('open');
      backdrop.classList.remove('active');
      backdrop.hidden = true;
      if (!silent) burger.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
      this.releaseFocus();
    },

    trapFocus(modal) {
      const focusableElements = modal.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      this.focusHandler = (e) => {
        if (e.key !== 'Tab') return;
        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            lastElement.focus();
            e.preventDefault();
          }
        } else {
          if (document.activeElement === lastElement) {
            firstElement.focus();
            e.preventDefault();
          }
        }
      };
      
      this.lastFocusedElement = document.activeElement;
      modal.addEventListener('keydown', this.focusHandler);
      if(firstElement) firstElement.focus();
    },

    releaseFocus() {
      const { drawer, cartModal } = App.elements;
      if (this.focusHandler) {
        drawer.removeEventListener('keydown', this.focusHandler);
        cartModal.removeEventListener('keydown', this.focusHandler);
      }
      if (this.lastFocusedElement) this.lastFocusedElement.focus();
    },
  },

  // CART MODULE
  cart: {
    load() {
      App.state.cart = JSON.parse(localStorage.getItem('pina_cart')) || [];
      this.render();
    },

    save() {
      localStorage.setItem('pina_cart', JSON.stringify(App.state.cart));
    },

    add(slug) {
      const existing = App.state.cart.find(i => i.slug === slug);
      if (existing) {
        existing.quantity++;
      } else {
        const p = App.state.products.find(x => x.slug === slug);
        App.state.cart.push({ ...p, quantity: 1 });
      }
      this.save();
      this.render();
      App.ui.showToast(`${App.state.products.find(p=>p.slug===slug).name} added to cart!`);
    },

    update(slug, change) {
      const item = App.state.cart.find(i => i.slug === slug);
      if (item) {
        item.quantity += change;
        if (item.quantity <= 0) {
          App.state.cart = App.state.cart.filter(i => i.slug !== slug);
        }
      }
      this.save();
      this.render();
    },

    render() {
      const cartBody = document.getElementById('cart-items');
      const cartTotalEl = document.getElementById('cart-total');
      const cartCountEl = document.getElementById('cart-count');
      
      if (App.state.cart.length === 0) {
        cartBody.innerHTML = '<p class="empty-cart">Your cart is empty. <br><a href="#products" onclick="App.ui.closeAll()">Browse our cookies!</a></p>';
        cartTotalEl.textContent = '₹0';
        cartCountEl.textContent = '0';
        cartCountEl.hidden = true;
        return;
      }

      cartBody.innerHTML = App.state.cart.map(item => `
        <div class="cart-item">
          <img src="${item.img}" alt="${item.name}" class="cart-item-img">
          <div class="cart-item-details">
            <p class="cart-item-title">${item.name}</p>
            <p class="cart-item-price">₹${item.price}</p>
            <div class="cart-item-actions">
              <button onclick="App.cart.update('${item.slug}', -1)">-</button>
              <span>${item.quantity}</span>
              <button onclick="App.cart.update('${item.slug}', 1)">+</button>
            </div>
          </div>
          <div>₹${item.price * item.quantity}</div>
        </div>`).join('');

      const total = App.state.cart.reduce((s, i) => s + i.price * i.quantity, 0);
      cartTotalEl.textContent = `₹${total}`;
      const count = App.state.cart.reduce((s, i) => s + i.quantity, 0);
      cartCountEl.textContent = count;
      cartCountEl.hidden = false;
    },

    toggle() {
      const { cartModal } = App.elements;
      cartModal.classList.contains('open') ? App.ui.closeAll() : this.open();
    },

    open() {
      App.ui.closeAll(true);
      const { cartModal, backdrop } = App.elements;
      cartModal.classList.add('open');
      backdrop.classList.add('active');
      backdrop.hidden = false;
      document.body.style.overflow = 'hidden';
      App.ui.trapFocus(cartModal);
    },
  },

  // CHECKOUT MODULE
  checkout: {
    loadUserDetails() {
      try {
        const saved = JSON.parse(localStorage.getItem(App.config.saveUserKey) || 'null');
        if (!saved) return;
        Object.keys(saved).forEach(key => {
          const el = document.getElementById(`cf-${key}`);
          if (el) el.value = saved[key];
        });
      } catch (e) {}
    },

    validate() {
      this.clearErrors();
      let ok = true;
      const fields = [
        { id: 'cf-name', err: 'err-name', check: val => val.length > 1 },
        { id: 'cf-phone', err: 'err-phone', check: val => /^(?:\+91)?[0]?[6-9]\d{9}$/.test(val.replace(/\s/g,'')) },
        { id: 'cf-pincode', err: 'err-pincode', check: val => /^\d{6}$/.test(val) },
        { id: 'cf-address', err: 'err-address', check: val => val.length > 5 },
      ];

      fields.forEach(({ id, err, check }) => {
        const el = document.getElementById(id);
        if (!check(el.value.trim())) {
          document.getElementById(err).classList.add('show');
          el.style.borderColor = '#b00020';
          ok = false;
        }
      });
      return ok;
    },

    clearErrors() {
      document.querySelectorAll('.err').forEach(el => el.classList.remove('show'));
      document.querySelectorAll('.cart-form input, .cart-form textarea').forEach(el => el.style.borderColor = 'var(--ring)');
    },
    
    submit() {
      if (App.state.cart.length === 0) {
        App.ui.showToast("Your cart is empty!");
        return;
      }
      if (!this.validate()) {
        App.ui.showToast("Please fix the errors in the form.");
        return;
      }
      const user = {
        name: document.getElementById('cf-name').value.trim(),
        phone: document.getElementById('cf-phone').value.trim(),
        pincode: document.getElementById('cf-pincode').value.trim(),
        city: document.getElementById('cf-city').value.trim(),
        address: document.getElementById('cf-address').value.trim(),
        notes: document.getElementById('cf-notes').value.trim()
      };
      localStorage.setItem(App.config.saveUserKey, JSON.stringify(user));

      const total = App.state.cart.reduce((s, i) => s + i.price * i.quantity, 0);
      const lines = App.state.cart.map(i => `${i.name} (x${i.quantity}) - ₹${i.price * i.quantity}`).join('\n');
      const userBlock = `Customer: ${user.name}\nPhone: ${user.phone}\nCity: ${user.city || '-'}\nPincode: ${user.pincode}\nAddress: ${user.address}\nNotes: ${user.notes || '-'}`;
      const message = `Hi PiNa Bakes! I would like to place an order:\n\n${lines}\n\n*Total: ₹${total}*\n\n${userBlock}\n\nThank you!`;
      const url = `https://wa.me/${App.config.whatsappNumber}?text=${encodeURIComponent(message)}`;
      window.open(url, '_blank');
    }
  },

  // GALLERY MODULE
  gallery: {
    set(i) {
      if (!App.state.galleryImgs.length) return;
      App.state.galleryIndex = (i + App.state.galleryImgs.length) % App.state.galleryImgs.length;
      const main = document.getElementById('product-image');
      main.src = App.state.galleryImgs[App.state.galleryIndex];
      const buttons = document.querySelectorAll('#product-thumbs button');
      buttons.forEach((b, bi) => b.classList.toggle('active', bi === App.state.galleryIndex));
    },
    next() { this.set(App.state.galleryIndex + 1); },
    prev() { this.set(App.state.galleryIndex - 1); },
  },

  // ROUTER
  router: {
    async renderRoute() {
      const hash = location.hash || '#home';
      const { productPage, mainSections, hero } = App.elements;

      if (hash.startsWith('#/product/')) {
        const slug = hash.split('/')[2];
        const p = App.state.products.find(x => x.slug === slug);
        if (p) {
          // Wait for products if they haven't loaded yet
          if (App.state.products.length === 0) {
            await App.loadProducts();
          }

          const product = App.state.products.find(x => x.slug === slug);
          if (!product) { location.hash = '#home'; return; }
          
          App.state.galleryImgs = product.images?.length ? product.images.slice() : [product.img];
          App.state.galleryIndex = 0;
          
          const mainImg = document.getElementById('product-image');
          mainImg.src = App.state.galleryImgs[0];
          mainImg.alt = `${product.name} cookies`;
          mainImg.classList.remove('skeleton');

          if (!mainImg.dataset.swipeBound) {
            mainImg.addEventListener('touchstart', (e) => { App.touchStartX = e.changedTouches[0].clientX; }, { passive: true });
            mainImg.addEventListener('touchend', (e) => {
              if (App.touchStartX === null) return;
              const dx = e.changedTouches[0].clientX - App.touchStartX;
              if (Math.abs(dx) > 35) { dx < 0 ? App.gallery.next() : App.gallery.prev(); }
              App.touchStartX = null;
            }, { passive: true });
            mainImg.dataset.swipeBound = '1';
          }

          document.getElementById('prev-btn').onclick = () => App.gallery.prev();
          document.getElementById('next-btn').onclick = () => App.gallery.next();
          
          const thumbs = document.getElementById('product-thumbs');
          thumbs.innerHTML = App.state.galleryImgs.map((src, i) => `<button aria-label="View image ${i + 1}" ${i === 0 ? 'class="active"' : ''}><img loading="lazy" src="${src}" alt=""></button>`).join('');
          thumbs.querySelectorAll('button').forEach((btn, i) => btn.addEventListener('click', () => App.gallery.set(i)));

          document.getElementById('product-title').textContent = product.name;
          document.getElementById('product-price').textContent = `₹${product.price}`;
          document.getElementById('product-tagline').textContent = product.tagline;
          document.getElementById('product-bullets').innerHTML = product.bullets ? `<ul>${product.bullets.map(b => `<li>${b}</li>`).join('')}</ul>` : '';
          document.getElementById('product-ingredients').innerHTML = (product.ingredients || []).map(i => `<li>${i}</li>`).join('');
          document.getElementById('detail-add-to-cart-btn').onclick = () => App.cart.add(product.slug);
          
          productPage.hidden = false;
          mainSections.forEach(sec => sec.hidden = true);
          hero.hidden = true;
          window.scrollTo(0, 0);
          return;
        }
      }

      productPage.hidden = true;
      mainSections.forEach(sec => sec.hidden = false);
      hero.hidden = false;
    }
  }
};

// Start the application
document.addEventListener('DOMContentLoaded', () => App.init());
