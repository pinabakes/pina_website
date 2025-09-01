const App = {
  // CONFIG
  config: {
    whatsappNumber: '917678506669',
    saveUserKey: 'pina_checkout_user',
    productsUrl: 'products.json'
  },

  // STATE
  state: {
    products: [],
    cart: [],
    galleryImgs: [],
    galleryIndex: 0
  },
  _loadPromise: null,

  // DOM
  elements: {
    drawer: document.getElementById('drawer'),
    backdrop: document.getElementById('backdrop'),
    burger: document.querySelector('.burger'),
    cartModal: document.getElementById('cart-modal'),
    productGrid: document.getElementById('product-grid'),
    productPage: document.getElementById('product-page'),
    hero: document.getElementById('home'),
    mainSections: document.querySelectorAll('main > .section:not(#product-page)'),
    toast: document.getElementById('toast-notification')
  },

  // INIT
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

    // Start loading products with skeletons
    this.ui.showSkeletonLoader();
    this.loadProducts();     // grid will be rendered once fetched

    // Handle initial route (deep links supported)
    this.router.renderRoute();
  },

  // PRODUCT LOADING
  async ensureProductsLoaded() {
    if (this.state.products.length) return;
    if (this._loadPromise) { await this._loadPromise; return; }
    this._loadPromise = this.loadProducts();
    await this._loadPromise;
    this._loadPromise = null;
  },

  async loadProducts() {
    try {
      const response = await fetch(this.config.productsUrl, { cache: 'no-store' });
      if (!response.ok) throw new Error('HTTP ' + response.status);
      this.state.products = await response.json();
      this.ui.renderProductGrid();
      // (Optional) Inject JSON-LD for products here if desired.
    } catch (error) {
      console.error('Failed to load products:', error);
      this.elements.productGrid.innerHTML = '<p>Error loading products. Please try again later.</p>';
    }
  },

  // HELPERS (image)
  helpers: {
    productImageHTML(src, alt){
      // Graceful AVIF/WebP; browsers skip unsupported types
      // (If .avif/.webp don’t exist, browser falls back to <img src>)
      const base = src.replace(/\.(jpe?g|png|webp|avif)$/i,'');
      return `
        <picture>
          <source srcset="${base}.avif" type="image/avif">
          <source srcset="${base}.webp" type="image/webp">
          <img class="thumb" loading="lazy" decoding="async" src="${src}" alt="${alt}">
        </picture>`;
    }
  },

  // UI & UX
  ui: {
    showToast(message) {
      const { toast } = App.elements;
      toast.textContent = message;
      toast.classList.add('show');
      clearTimeout(this._toastTimer);
      this._toastTimer = setTimeout(() => toast.classList.remove('show'), 3000);
    },

    showSkeletonLoader() {
      const { productGrid } = App.elements;
      productGrid.innerHTML = Array.from({ length: 8 }).map(() => `
        <article class="card">
          <div class="skeleton" style="aspect-ratio:1/1;"></div>
          <div class="card-body" style="gap:1rem;">
            <div class="skeleton" style="height:1.2rem;width:60%;"></div>
            <div class="skeleton" style="height:1rem;width:30%;"></div>
            <div class="skeleton" style="height:1rem;width:80%;"></div>
            <div class="skeleton" style="height:2.5rem;width:100%;margin-top:auto;"></div>
          </div>
        </article>
      `).join('');
    },

    renderProductGrid() {
      const { productGrid } = App.elements;
      productGrid.innerHTML = App.state.products.map(p => `
        <article class="card">
          <a href="#/product/${p.slug}" aria-label="View ${p.name}">
            ${App.helpers.productImageHTML((p.images && p.images[0]) || p.img, `PiNa Bakes ${p.name} cookies`)}
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

    // Load the big product image with a skeleton wrapper that clears on load
    loadMainProductImage(src, alt) {
      const mainImg = document.getElementById('product-image');
      const shell   = mainImg ? mainImg.closest('.img-shell') : null;

      // Re-apply skeleton while loading the new src
      if (shell) shell.classList.add('skeleton');
      else mainImg && mainImg.classList.add('skeleton'); // fallback if no wrapper

      // Assign handlers BEFORE setting src
      if (mainImg) {
        mainImg.onload = () => {
          if (shell) shell.classList.remove('skeleton');
          else mainImg.classList.remove('skeleton');
        };
        mainImg.onerror = () => {
          if (shell) shell.classList.remove('skeleton');
          else mainImg.classList.remove('skeleton');
          mainImg.alt = 'Image not available';
        };
        mainImg.alt = alt || '';
        mainImg.src = src;
      }
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
      const focusable = modal.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
      const first = focusable[0];
      const last  = focusable[focusable.length - 1];
      this._focusHandler = (e) => {
        if (e.key !== 'Tab') return;
        if (e.shiftKey) {
          if (document.activeElement === first) { last.focus(); e.preventDefault(); }
        } else {
          if (document.activeElement === last) { first.focus(); e.preventDefault(); }
        }
      };
      this._lastFocused = document.activeElement;
      modal.addEventListener('keydown', this._focusHandler);
      this._trapEl = modal;
      if (first) first.focus();
    },

    releaseFocus() {
      if (this._trapEl && this._focusHandler) {
        this._trapEl.removeEventListener('keydown', this._focusHandler);
        this._trapEl = null;
      }
      if (this._lastFocused) this._lastFocused.focus();
    }
  },

  // CART
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
        if (!p) return; // safety
        App.state.cart.push({ ...p, quantity: 1 });
      }
      this.save();
      this.render();
      const pName = (App.state.products.find(p => p.slug === slug) || {}).name || 'Item';
      App.ui.showToast(`${pName} added to cart`);
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
      const cartBody   = document.getElementById('cart-items');
      const cartTotalEl= document.getElementById('cart-total');
      const cartCountEl= document.getElementById('cart-count');

      if (App.state.cart.length === 0) {
        cartBody.innerHTML = `
          <div class="empty-cart">
            <p>Your cart is empty.</p>
            <a class="btn" href="#products" onclick="App.ui.closeAll()">Browse Our Cookies</a>
          </div>`;
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

      const total = App.state.cart.reduce((s,i)=>s+i.price*i.quantity,0);
      cartTotalEl.textContent = `₹${total}`;
      const count = App.state.cart.reduce((s,i)=>s+i.quantity,0);
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
    }
  },

  // CHECKOUT
  checkout: {
    loadUserDetails() {
      try {
        const saved = JSON.parse(localStorage.getItem(App.config.saveUserKey) || 'null');
        if (!saved) return;
        const map = {name:'name',phone:'phone',pincode:'pincode',city:'city',address:'address',notes:'notes'};
        Object.keys(map).forEach(k=>{
          const el = document.getElementById(`cf-${k}`);
          if (el && typeof saved[map[k]] !== 'undefined') el.value = saved[map[k]];
        });
      } catch(e){}
    },
    validate() {
      this.clearErrors();
      let ok = true;
      const fields = [
        { id: 'cf-name',    err: 'err-name',    check: val => val.trim().length > 1 },
        { id: 'cf-phone',   err: 'err-phone',   check: val => {
            const digits = val.replace(/\D/g,''); // keep digits only
            return (digits.length===10) || (digits.length===11 && digits.startsWith('0')) || (digits.length===12 && digits.startsWith('91'));
          } },
        { id: 'cf-pincode', err: 'err-pincode', check: val => /^\d{6}$/.test(val.trim()) },
        { id: 'cf-address', err: 'err-address', check: val => val.trim().length > 5 }
      ];
      fields.forEach(({ id, err, check }) => {
        const el = document.getElementById(id);
        if (!check(el.value)) {
          document.getElementById(err).style.display = 'block';
          el.style.borderColor = '#b00020';
          ok = false;
        }
      });
      return ok;
    },
    clearErrors() {
      document.querySelectorAll('.err').forEach(el => el.style.display = 'none');
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

      const total = App.state.cart.reduce((s,i)=>s+i.price*i.quantity,0);
      const lines = App.state.cart.map(i=>`${i.name} (x${i.quantity}) - ₹${i.price * i.quantity}`).join('\n');
      const userBlock =
`Customer: ${user.name}
Phone: ${user.phone}
City: ${user.city || '-'}
Pincode: ${user.pincode}
Address: ${user.address}
Notes: ${user.notes || '-'}`;

      const message = `Hi PiNa Bakes! I would like to place an order:\n\n${lines}\n\n*Total: ₹${total}*\n\n${userBlock}\n\nThank you!`;
      const url = `https://wa.me/${App.config.whatsappNumber}?text=${encodeURIComponent(message)}`;
      window.open(url, '_blank');
    }
  },

  // GALLERY
  gallery: {
    set(i){
      if(!App.state.galleryImgs.length) return;
      App.state.galleryIndex = (i + App.state.galleryImgs.length) % App.state.galleryImgs.length;
      const src = App.state.galleryImgs[App.state.galleryIndex];
      App.ui.loadMainProductImage(src, document.getElementById('product-title')?.textContent + ' cookies');
      const buttons = document.querySelectorAll('#product-thumbs button');
      buttons.forEach((b,bi)=> b.classList.toggle('active', bi===App.state.galleryIndex));
    },
    next(){ this.set(App.state.galleryIndex + 1); },
    prev(){ this.set(App.state.galleryIndex - 1); }
  },

  // ROUTER
  router: {
    async renderRoute(){
      const hash = location.hash || '#home';
      const { productPage, mainSections, hero } = App.elements;

      if (hash.startsWith('#/product/')) {
        const slug = hash.split('/')[2];

        // Ensure products are loaded before attempting to render
        await App.ensureProductsLoaded();

        const product = App.state.products.find(x => x.slug === slug);
        if (!product) { location.hash = '#home'; return; }

        App.state.galleryImgs = (product.images && product.images.length) ? product.images.slice() : [product.img];
        App.state.galleryIndex = 0;

        // MAIN IMAGE — use wrapper skeleton that clears AFTER load
        App.ui.loadMainProductImage(App.state.galleryImgs[0], `${product.name} cookies`);

        // Bind swipe once
        const mainImg = document.getElementById('product-image');
        if (mainImg && !mainImg.dataset.swipeBound) {
          mainImg.addEventListener('touchstart', (e) => { App.touchStartX = e.changedTouches[0].clientX; }, { passive: true });
          mainImg.addEventListener('touchend', (e) => {
            if (App.touchStartX == null) return;
            const dx = e.changedTouches[0].clientX - App.touchStartX;
            if (Math.abs(dx) > 35) { dx < 0 ? App.gallery.next() : App.gallery.prev(); }
            App.touchStartX = null;
          }, { passive: true });
          mainImg.dataset.swipeBound = '1';
        }

        document.getElementById('prev-btn').onclick = () => App.gallery.prev();
        document.getElementById('next-btn').onclick = () => App.gallery.next();

        const thumbs = document.getElementById('product-thumbs');
        thumbs.innerHTML = App.state.galleryImgs.map((src,i)=>`
          <button aria-label="View image ${i+1}" ${i===0?'class="active"':''}>
            <img loading="lazy" src="${src}" alt="">
          </button>`).join('');
        thumbs.querySelectorAll('button').forEach((btn,i)=>btn.addEventListener('click', ()=> App.gallery.set(i)));

        document.getElementById('product-title').textContent = product.name;
        document.getElementById('product-price').textContent = `₹${product.price}`;
        document.getElementById('product-tagline').textContent = product.tagline;
        document.getElementById('product-bullets').innerHTML = product.bullets ? `<ul>${product.bullets.map(b=>`<li>${b}</li>`).join('')}</ul>` : '';
        document.getElementById('product-ingredients').innerHTML = (product.ingredients||[]).map(i=>`<li>${i}</li>`).join('');
        document.getElementById('detail-add-to-cart-btn').onclick = () => App.cart.add(product.slug);

        // Nutrition placeholders (per 100g)
        const nut = product.nutrition || { energy:'— kcal', protein:'— g', fat:'— g', carbs:'— g', sugar:'— g', fibre:'— g', sodium:'— mg' };
        const rows = [
          ['Energy',nut.energy||'— kcal'],
          ['Protein',nut.protein||'— g'],
          ['Total Fat',nut.fat||'— g'],
          ['Carbohydrates',nut.carbs||'— g'],
          ['Added Sugar',nut.sugar||'— g'],
          ['Dietary Fibre',nut.fibre||'— g'],
          ['Sodium',nut.sodium||'— mg']
        ].map(([k,v])=>`<tr><td style="padding:.65rem .75rem;border-bottom:1px solid var(--ring)">${k}</td><td style="padding:.65rem .75rem;border-bottom:1px solid var(--ring)">${v}</td></tr>`).join('');
        document.getElementById('product-nutrition').innerHTML = rows;

        productPage.hidden = false;
        mainSections.forEach(sec => sec.hidden = true);
        hero.hidden = true;
        window.scrollTo(0, 0);
        return;
      }

      // Home / other sections
      productPage.hidden = true;
      mainSections.forEach(sec => sec.hidden = false);
      hero.hidden = false;
    }
  }
};

// Boot
document.addEventListener('DOMContentLoaded', () => App.init());
