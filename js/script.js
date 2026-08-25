/* United Japan TRD LTD — JDM Vehicle Showroom Interactions */
document.addEventListener('DOMContentLoaded', function(){
  // Mobile nav toggle
  const navToggle = document.getElementById('nav-toggle');
  const navList = document.getElementById('nav-list');
  const header = document.getElementById('site-header');

  if(navToggle && navList){
    navToggle.addEventListener('click', () => {
      const expanded = navToggle.getAttribute('aria-expanded') === 'true';
      navToggle.setAttribute('aria-expanded', String(!expanded));
      navList.style.display = !expanded ? 'flex' : '';
    });

    window.addEventListener('resize', () => {
      if(window.innerWidth > 768) navList.style.display = '';
    });
  }

  // Smooth scrolling for internal anchor links
  document.querySelectorAll('a[data-scroll]').forEach(anchor => {
    anchor.addEventListener('click', (e) => {
      const href = anchor.getAttribute('href');
      if (href && href.startsWith('#') && !href.startsWith('#car/')) {
        e.preventDefault();
        const target = document.querySelector(href);
        if (target) {
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
        if (window.innerWidth <= 768 && navList && navToggle) {
          navList.style.display = '';
          navToggle.setAttribute('aria-expanded', 'false');
        }
      }
    });
  });

  // Header scroll shadow effect
  const updateHeaderScroll = () => {
    if (header) {
      if (window.scrollY > 40) header.classList.add('scrolled');
      else header.classList.remove('scrolled');
    }
  };
  updateHeaderScroll();
  window.addEventListener('scroll', updateHeaderScroll, { passive: true });

  // IntersectionObserver for element reveals
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!prefersReduced) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1 });

    document.querySelectorAll('.section, .service-card, .about-media, .hero-content').forEach(el => {
      el.classList.add('reveal');
      observer.observe(el);
    });
  }

  // Footer dynamic year
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // Showroom Catalog State
  const vehicleGrid = document.getElementById('vehicles');
  const vehicleStatus = document.getElementById('vehicle-status');
  const productView = document.getElementById('product-view');
  const searchInput = document.getElementById('car-search');
  const clearSearchBtn = document.getElementById('clear-search');
  const sortSelect = document.getElementById('car-sort');
  const noResultsEl = document.getElementById('no-results');
  const resetFilterBtn = document.getElementById('reset-filter-btn');
  const brandButtons = document.querySelectorAll('#brand-filters .filter-pill');

  // Lightbox Elements
  const lightbox = document.getElementById('image-lightbox');
  const lightboxImg = document.getElementById('lightbox-img');
  const lightboxCaption = document.getElementById('lightbox-caption');
  const lightboxClose = document.getElementById('lightbox-close');
  const lightboxPrev = document.getElementById('lightbox-prev');
  const lightboxNext = document.getElementById('lightbox-next');

  let vehicles = [];
  let currentFilterBrand = 'all';
  let currentSearchQuery = '';
  let currentSort = 'featured';
  let companyEmail = 'unitedjapantraders@gmail.com';
  let currentCarDetail = null;
  let currentGalleryIndex = 0;

  // Complete offline / static host fallback catalog
  const FALLBACK_CATALOG = [
    {
      "folder": "Mazda Cx5",
      "name": "Mazda CX-5",
      "model": "2018",
      "color": "Gray",
      "variant": "",
      "fuel": "Petrol",
      "transmission": "Automatic",
      "drivetrain": "AWD",
      "seating": "5 Seater",
      "specs": {},
      "features": ["Push to start", "Power boot", "Electric brake", "Parking sensors", "Multimedia"],
      "mainImage": "Main_image.jpeg",
      "images": ["Main_image.jpeg", "1.jpeg", "2.jpeg", "3.jpeg", "4.jpeg", "5.jpeg", "6.jpeg", "7.jpeg", "8.jpeg"]
    },
    {
      "folder": "Subaru Forester",
      "name": "Subaru Forester",
      "model": "2014",
      "color": "Silver",
      "variant": "X Break",
      "fuel": "Petrol",
      "transmission": "Automatic",
      "drivetrain": "AWD",
      "seating": "5 Seater",
      "specs": {},
      "features": ["Sports rims", "Push to start", "Electric mirrors", "Heated seats"],
      "mainImage": "Main_image.jpeg",
      "images": ["Main_image.jpeg", "1.jpeg", "2.jpeg", "3.jpeg", "4.jpeg", "5.jpeg", "6.jpeg", "7.jpeg", "8.jpeg", "9.jpeg", "10.jpeg", "11.jpeg"]
    },
    {
      "folder": "Toyota Alphard",
      "name": "Toyota Alphard",
      "model": "2012",
      "color": "White",
      "variant": "Luxury Lounge",
      "fuel": "Petrol",
      "transmission": "Automatic",
      "drivetrain": "2WD",
      "seating": "7 Seater Luxury",
      "specs": {},
      "features": ["Push to start", "Sport rims", "Premium interior", "Reverse camera", "Electric mirrors"],
      "mainImage": "Main_image.jpeg",
      "images": ["Main_image.jpeg", "1.jpeg", "2.jpeg", "3.jpeg", "4.jpeg", "5.jpeg", "6.jpeg", "7.jpeg"]
    },
    {
      "folder": "Toyota Fielder",
      "name": "Toyota Fielder",
      "model": "2013",
      "color": "Black",
      "variant": "WXB",
      "fuel": "Petrol / Hybrid",
      "transmission": "Automatic",
      "drivetrain": "2WD",
      "seating": "5 Seater",
      "specs": {},
      "features": ["Sport lights", "Electric mirrors", "Alloy wheels"],
      "mainImage": "Main_image.jpeg",
      "images": ["Main_image.jpeg", "1.jpeg", "2.jpeg", "3.jpeg", "4.jpeg", "5.jpeg", "6.jpeg", "7.jpeg", "8.jpeg", "9.jpeg"]
    },
    {
      "folder": "Toyota Harrier",
      "name": "Toyota Harrier",
      "model": "2017",
      "color": "White",
      "variant": "Premium",
      "fuel": "Petrol",
      "transmission": "Automatic",
      "drivetrain": "2WD",
      "seating": "5 Seater",
      "specs": {},
      "features": ["Push to start", "Parking sensors", "Electric brake", "Multimedia system"],
      "mainImage": "Main_image.jpeg",
      "images": ["Main_image.jpeg", "1.jpeg", "2.jpeg", "3.jpeg", "4.jpeg", "5.jpeg", "6.jpeg"]
    },
    {
      "folder": "Toyota Land cruiser Prado",
      "name": "Toyota Land Cruiser Prado",
      "model": "2017",
      "color": "Black",
      "variant": "TX / TZ",
      "fuel": "Petrol",
      "transmission": "Automatic",
      "drivetrain": "4WD",
      "seating": "7 Seater",
      "specs": {},
      "features": ["Push to start", "4WD Low/High Range", "Alloy wheels"],
      "mainImage": "Main_image.jpeg",
      "images": ["Main_image.jpeg", "1.jpeg", "2.jpeg", "3.jpeg", "4.jpeg", "5.jpeg", "6.jpeg"]
    },
    {
      "folder": "Toyota Noah",
      "name": "Toyota Noah",
      "model": "2017",
      "color": "White",
      "variant": "Si / X",
      "fuel": "Petrol",
      "transmission": "Automatic",
      "drivetrain": "2WD",
      "seating": "8 Seater",
      "specs": {},
      "features": ["Push to start", "Sports rims", "Auto door", "Electric mirrors", "Multimedia steering"],
      "mainImage": "Main_image.jpeg",
      "images": ["Main_image.jpeg", "1.jpeg", "2.jpeg", "3.jpeg", "4.jpeg", "5.jpeg", "6.jpeg", "7.jpeg", "8.jpeg", "9.jpeg", "10.jpeg", "11.jpeg"]
    },
    {
      "folder": "Toyota Passo",
      "name": "Toyota Passo",
      "model": "2013",
      "color": "White",
      "variant": "Standard",
      "fuel": "Petrol",
      "transmission": "Automatic",
      "drivetrain": "2WD",
      "seating": "5 Seater",
      "specs": {},
      "features": ["Sofa seats", "Reverse camera", "Electric mirrors"],
      "mainImage": "Main_image.jpeg",
      "images": ["Main_image.jpeg", "1.jpeg", "2.jpeg", "3.jpeg", "4.jpeg"]
    },
    {
      "folder": "Toyota Premio",
      "name": "Toyota Premio",
      "model": "2011",
      "color": "White",
      "variant": "4WD Edition",
      "fuel": "Petrol",
      "transmission": "Automatic",
      "drivetrain": "4WD",
      "seating": "5 Seater",
      "specs": {},
      "features": ["Push to start", "Electric mirrors", "Woodgrain trim"],
      "mainImage": "Main_image.jpeg",
      "images": ["Main_image.jpeg", "1.jpeg", "2.jpeg", "3.jpeg", "4.jpeg", "5.jpeg", "6.jpeg", "7.jpeg"]
    },
    {
      "folder": "Toyota Vanguard",
      "name": "Toyota Vanguard",
      "model": "2012",
      "color": "Black",
      "variant": "240S",
      "fuel": "Petrol",
      "transmission": "Automatic",
      "drivetrain": "4WD",
      "seating": "8 Seater",
      "specs": {},
      "features": ["Push to start", "Reverse camera", "Electric mirrors"],
      "mainImage": "Main_image.jpeg",
      "images": ["Main_image.jpeg", "1.jpeg", "2.jpeg", "3.jpeg", "4.jpeg", "5.jpeg", "6.jpeg"]
    }
  ];

  const escapeHtml = (value = '') => String(value).replace(/[&<>'"]/g, char => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
  }[char]));

  // Clean, URL-encoded path resolution for images
  function getImagePath(folder, filename) {
    if (!folder || !filename) return '';
    const cleanFolder = String(folder).replace(/^[/\\]*cars[/\\]*/i, '').replace(/^[/\\]+/, '').replace(/[/\\]+$/, '').trim();
    const cleanFile = String(filename).replace(/^[/\\]+/, '').trim();
    return `cars/${encodeURIComponent(cleanFolder)}/${encodeURIComponent(cleanFile)}`;
  }

  function getSlug(name) {
    return encodeURIComponent(String(name).trim().toLowerCase().replace(/\s+/g, '-'));
  }

  // Parse structured description.txt format
  function parseDescriptionText(text) {
    const lines = text.split(/\r?\n/).map(line => line.trim()).filter(Boolean);
    const data = {
      name: '',
      model: '',
      color: '',
      variant: '',
      fuel: '',
      transmission: '',
      drivetrain: '',
      seating: '',
      specs: {},
      features: []
    };

    let inFeatures = false;

    for (const line of lines) {
      if (/^features\s*:?$/i.test(line)) {
        inFeatures = true;
        continue;
      }

      if (inFeatures) {
        const feat = line.replace(/^[-*•]\s*/, '').trim();
        if (feat) data.features.push(feat);
        continue;
      }

      const colonIndex = line.indexOf(':');
      if (colonIndex !== -1) {
        const key = line.slice(0, colonIndex).trim();
        const val = line.slice(colonIndex + 1).trim();
        const keyLower = key.toLowerCase();

        if (keyLower === 'name') data.name = val;
        else if (keyLower === 'model' || keyLower === 'year') data.model = val;
        else if (keyLower === 'color' || keyLower === 'colour') data.color = val;
        else if (keyLower === 'variant' || keyLower === 'trim' || keyLower === 'grade') data.variant = val;
        else if (keyLower === 'fuel') data.fuel = val;
        else if (keyLower === 'transmission') data.transmission = val;
        else if (keyLower === 'drivetrain' || keyLower === 'drive') data.drivetrain = val;
        else if (keyLower === 'seating' || keyLower === 'seats') data.seating = val;
        else {
          data.specs[key] = val;
        }
      } else {
        if (!data.name) data.name = line;
        else data.features.push(line);
      }
    }

    return data;
  }

  function getColorHex(colorName = '') {
    const c = colorName.toLowerCase();
    if (c.includes('black')) return '#111827';
    if (c.includes('white') || c.includes('pearl')) return '#f8fafc';
    if (c.includes('silver')) return '#cbd5e1';
    if (c.includes('gray') || c.includes('grey')) return '#6b7280';
    if (c.includes('red') || c.includes('wine')) return '#dc2626';
    if (c.includes('blue') || c.includes('navy')) return '#2563eb';
    return '#94a3b8';
  }

  function getBrandFromCar(car) {
    const name = (car.name || car.folder || '').toLowerCase();
    if (name.includes('toyota')) return 'toyota';
    if (name.includes('mazda')) return 'mazda';
    if (name.includes('subaru')) return 'subaru';
    return 'other';
  }

  // Filter and Sort Vehicles
  function getFilteredVehicles() {
    return vehicles.filter(car => {
      // Brand filter
      if (currentFilterBrand !== 'all') {
        const brand = getBrandFromCar(car);
        if (brand !== currentFilterBrand) return false;
      }

      // Search query filter
      if (currentSearchQuery.trim()) {
        const q = currentSearchQuery.trim().toLowerCase();
        const searchPool = [
          car.name,
          car.folder,
          car.model,
          car.color,
          car.variant,
          car.fuel,
          car.transmission,
          car.drivetrain,
          car.seating,
          ...(car.features || [])
        ].filter(Boolean).join(' ').toLowerCase();

        if (!searchPool.includes(q)) return false;
      }

      return true;
    }).sort((a, b) => {
      if (currentSort === 'year-desc') {
        const yA = parseInt(a.model, 10) || 0;
        const yB = parseInt(b.model, 10) || 0;
        return yB - yA;
      }
      if (currentSort === 'year-asc') {
        const yA = parseInt(a.model, 10) || 0;
        const yB = parseInt(b.model, 10) || 0;
        return yA - yB;
      }
      if (currentSort === 'name-asc') {
        return (a.name || '').localeCompare(b.name || '');
      }
      return 0; // featured default
    });
  }

  function updateCounts() {
    const allCount = vehicles.length;
    const toyotaCount = vehicles.filter(c => getBrandFromCar(c) === 'toyota').length;
    const mazdaCount = vehicles.filter(c => getBrandFromCar(c) === 'mazda').length;
    const subaruCount = vehicles.filter(c => getBrandFromCar(c) === 'subaru').length;

    const elAll = document.getElementById('count-all');
    const elToyota = document.getElementById('count-toyota');
    const elMazda = document.getElementById('count-mazda');
    const elSubaru = document.getElementById('count-subaru');

    if (elAll) elAll.textContent = allCount;
    if (elToyota) elToyota.textContent = toyotaCount;
    if (elMazda) elMazda.textContent = mazdaCount;
    if (elSubaru) elSubaru.textContent = subaruCount;
  }

  // Render Product Cards Grid
  function renderVehicleCards() {
    const list = getFilteredVehicles();

    if (vehicleStatus) {
      vehicleStatus.textContent = `${list.length} vehicle${list.length === 1 ? '' : 's'} available`;
    }

    if (list.length === 0) {
      vehicleGrid.innerHTML = '';
      if (noResultsEl) noResultsEl.hidden = false;
      return;
    }

    if (noResultsEl) noResultsEl.hidden = true;

    vehicleGrid.innerHTML = list.map(car => {
      const carSlug = getSlug(car.name);
      const mainImgSrc = getImagePath(car.folder, car.mainImage || 'Main_image.jpeg');
      const photoCount = (car.images && car.images.length) || 1;
      const brand = getBrandFromCar(car).toUpperCase();

      // Spec Chips
      const chips = [];
      if (car.model) chips.push(`<span class="spec-chip">📅 ${escapeHtml(car.model)}</span>`);
      if (car.color) {
        chips.push(`<span class="spec-chip"><span class="color-dot" style="background-color: ${getColorHex(car.color)}"></span> ${escapeHtml(car.color)}</span>`);
      }
      if (car.variant) chips.push(`<span class="spec-chip">🏷️ ${escapeHtml(car.variant)}</span>`);
      if (car.drivetrain) chips.push(`<span class="spec-chip">🚙 ${escapeHtml(car.drivetrain)}</span>`);
      if (car.seating) chips.push(`<span class="spec-chip">💺 ${escapeHtml(car.seating)}</span>`);

      // Top 3 features preview
      const topFeatures = (car.features || []).slice(0, 3);
      const remainingCount = (car.features || []).length - 3;
      const featuresHtml = topFeatures.length > 0 ? `
        <div class="features-preview">
          ${topFeatures.map(f => `<span class="feature-tag">✓ ${escapeHtml(f)}</span>`).join('')}
          ${remainingCount > 0 ? `<span class="feature-tag more">+${remainingCount} more</span>` : ''}
        </div>
      ` : '';

      return `
        <a class="car-card product-card" href="#car/${carSlug}" data-slug="${carSlug}" aria-label="View details for ${escapeHtml(car.name)}">
          <div class="car-media">
            <div class="media-badges-left">
              <span class="badge-year">${escapeHtml(car.model || 'JDM')}</span>
              <span class="badge-brand">${escapeHtml(brand)}</span>
            </div>
            <span class="badge-photos">📸 ${photoCount} Photos</span>
            <img src="${mainImgSrc}" alt="${escapeHtml(car.name)}" loading="lazy" onerror="this.src='cars/Subaru%20Forester/Main_image.jpeg'">
          </div>
          <div class="car-body">
            <div class="car-header-row">
              <h3 class="car-name">${escapeHtml(car.name)}</h3>
            </div>
            <div class="spec-chips">
              ${chips.join('')}
            </div>
            ${featuresHtml}
            <div class="car-footer">
              <span class="price-status">Available at Nakawa Bond</span>
              <span class="car-card-cta">
                <span>View Details & Gallery</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
              </span>
            </div>
          </div>
        </a>
      `;
    }).join('');

    // Attach click listeners to cards
    vehicleGrid.querySelectorAll('.product-card').forEach(card => {
      card.addEventListener('click', (e) => {
        e.preventDefault();
        const slug = card.getAttribute('data-slug');
        window.location.hash = `car/${slug}`;
        renderProductFromHash();
      });
    });

    // Reveal animations on cards
    if (!prefersReduced) {
      document.querySelectorAll('#vehicles .car-card').forEach(card => {
        card.classList.add('reveal');
        requestAnimationFrame(() => card.classList.add('visible'));
      });
    }
  }

  // Update gallery image in product view
  function updateProductGalleryImage(index) {
    if (!currentCarDetail || !currentCarDetail.images || currentCarDetail.images.length === 0) return;
    const total = currentCarDetail.images.length;
    currentGalleryIndex = (index + total) % total;
    const activeImageFile = currentCarDetail.images[currentGalleryIndex];
    const imagePath = getImagePath(currentCarDetail.folder, activeImageFile);

    const mainImgEl = document.getElementById('gallery-active-img');
    const counterEl = document.getElementById('gallery-counter-num');
    if (mainImgEl) {
      mainImgEl.src = imagePath;
      mainImgEl.alt = `${currentCarDetail.name} - Photo ${currentGalleryIndex + 1}`;
    }
    if (counterEl) {
      counterEl.textContent = `${currentGalleryIndex + 1} / ${total}`;
    }

    // Update active state in thumbnail strip
    document.querySelectorAll('.gallery-thumb-item').forEach((thumb, idx) => {
      if (idx === currentGalleryIndex) {
        thumb.classList.add('active');
        thumb.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      } else {
        thumb.classList.remove('active');
      }
    });
  }

  // Open Fullscreen Lightbox
  function openLightbox(index) {
    if (!currentCarDetail || !currentCarDetail.images || currentCarDetail.images.length === 0) return;
    currentGalleryIndex = index;
    const activeImageFile = currentCarDetail.images[currentGalleryIndex];
    const imagePath = getImagePath(currentCarDetail.folder, activeImageFile);

    if (lightboxImg) lightboxImg.src = imagePath;
    if (lightboxCaption) {
      lightboxCaption.textContent = `${currentCarDetail.name} (${currentCarDetail.model}) — Photo ${currentGalleryIndex + 1} of ${currentCarDetail.images.length}`;
    }
    if (lightbox) {
      lightbox.hidden = false;
      lightbox.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
    }
  }

  function closeLightbox() {
    if (lightbox) {
      lightbox.hidden = true;
      lightbox.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
    }
  }

  function stepLightbox(delta) {
    if (!currentCarDetail || !currentCarDetail.images) return;
    const total = currentCarDetail.images.length;
    currentGalleryIndex = (currentGalleryIndex + delta + total) % total;
    const activeImageFile = currentCarDetail.images[currentGalleryIndex];
    const imagePath = getImagePath(currentCarDetail.folder, activeImageFile);
    if (lightboxImg) lightboxImg.src = imagePath;
    if (lightboxCaption) {
      lightboxCaption.textContent = `${currentCarDetail.name} (${currentCarDetail.model}) — Photo ${currentGalleryIndex + 1} of ${total}`;
    }
    updateProductGalleryImage(currentGalleryIndex);
  }

  // Lightbox event listeners
  if (lightboxClose) lightboxClose.addEventListener('click', closeLightbox);
  if (lightboxPrev) lightboxPrev.addEventListener('click', () => stepLightbox(-1));
  if (lightboxNext) lightboxNext.addEventListener('click', () => stepLightbox(1));
  if (lightbox) {
    const backdrop = lightbox.querySelector('.lightbox-backdrop');
    if (backdrop) backdrop.addEventListener('click', closeLightbox);
  }

  // Global Keyboard Navigation (Left / Right / Esc)
  window.addEventListener('keydown', (e) => {
    if (lightbox && !lightbox.hidden) {
      if (e.key === 'Escape') closeLightbox();
      else if (e.key === 'ArrowLeft') stepLightbox(-1);
      else if (e.key === 'ArrowRight') stepLightbox(1);
    } else if (productView && !productView.hidden && currentCarDetail) {
      if (e.key === 'ArrowLeft') updateProductGalleryImage(currentGalleryIndex - 1);
      else if (e.key === 'ArrowRight') updateProductGalleryImage(currentGalleryIndex + 1);
      else if (e.key === 'Escape') {
        window.location.hash = 'cars';
        renderProductFromHash();
      }
    }
  });

  // Render Product Detail View from URL Hash
  function renderProductFromHash() {
    const match = window.location.hash.match(/^#car\/(.+)$/);
    const catalogToolbar = document.getElementById('catalog-toolbar');

    if (!match) {
      if (productView) productView.hidden = true;
      if (vehicleGrid) vehicleGrid.hidden = false;
      if (catalogToolbar) catalogToolbar.hidden = false;
      currentCarDetail = null;
      return;
    }

    const requestedSlug = match[1];
    const car = vehicles.find(v => getSlug(v.name) === requestedSlug || getSlug(v.folder) === requestedSlug);

    if (!car) {
      window.location.hash = 'cars';
      return;
    }

    currentCarDetail = car;
    currentGalleryIndex = 0;

    if (vehicleGrid) vehicleGrid.hidden = true;
    if (catalogToolbar) catalogToolbar.hidden = true;
    if (noResultsEl) noResultsEl.hidden = true;
    if (productView) productView.hidden = false;

    const imagesList = car.images && car.images.length ? car.images : [car.mainImage || 'Main_image.jpeg'];
    const activeMainImg = getImagePath(car.folder, imagesList[0]);
    const whatsappText = encodeURIComponent(`Hello United Japan TRD, I am interested in the ${car.name} (${car.model || 'JDM'}). Please share pricing and inspection sheets.`);

    // Build specs tiles
    const specTiles = [];
    if (car.model) specTiles.push({ label: 'Model Year', value: car.model });
    if (car.color) specTiles.push({ label: 'Exterior Color', value: car.color });
    if (car.variant) specTiles.push({ label: 'Variant / Trim', value: car.variant });
    if (car.fuel) specTiles.push({ label: 'Fuel Type', value: car.fuel });
    if (car.transmission) specTiles.push({ label: 'Transmission', value: car.transmission });
    if (car.drivetrain) specTiles.push({ label: 'Drivetrain', value: car.drivetrain });
    if (car.seating) specTiles.push({ label: 'Seating Capacity', value: car.seating });
    specTiles.push({ label: 'Location', value: 'Nakawa Bond, Kampala' });
    specTiles.push({ label: 'Country of Origin', value: 'Japan (Direct JDM)' });

    // Build features items
    const features = car.features && car.features.length ? car.features : ['Japan Auction Inspection Verified', 'Genuine Mileage Certified', 'Push to Start', 'Power Steering & Windows'];

    productView.innerHTML = `
      <button type="button" class="back-link-btn" id="product-back-btn">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
        <span>Back to All Vehicles</span>
      </button>

      <div class="product-detail-layout">
        <!-- Interactive Multi-Image Gallery -->
        <div class="gallery-section">
          <div class="gallery-main-frame" id="gallery-main-frame" title="Click to view fullscreen">
            <button type="button" class="gallery-arrow-btn gallery-arrow-prev" id="gallery-prev-btn" aria-label="Previous photo">&#10094;</button>
            <button type="button" class="gallery-arrow-btn gallery-arrow-next" id="gallery-next-btn" aria-label="Next photo">&#10095;</button>
            <img id="gallery-active-img" class="gallery-main-img" src="${activeMainImg}" alt="${escapeHtml(car.name)}">
            <span class="gallery-counter-tag"><span id="gallery-counter-num">1 / ${imagesList.length}</span> Photos</span>
            <span class="gallery-zoom-hint">🔍 Click to zoom</span>
          </div>

          <div class="gallery-thumbnails-strip" id="gallery-thumbs-strip">
            ${imagesList.map((img, idx) => `
              <div class="gallery-thumb-item ${idx === 0 ? 'active' : ''}" data-index="${idx}" role="button" aria-label="View photo ${idx + 1}">
                <img src="${getImagePath(car.folder, img)}" alt="${escapeHtml(car.name)} thumbnail ${idx + 1}" loading="lazy">
              </div>
            `).join('')}
          </div>
        </div>

        <!-- Product Information & Specifications -->
        <div class="product-info-section">
          <div class="product-verified-badge">
            <span>✓ Verified Japan Inspection • Ready for Delivery</span>
          </div>

          <div>
            <h2 class="product-detail-title">${escapeHtml(car.name)}</h2>
            <p class="section-lead">${escapeHtml(car.model ? `${car.model} Model` : '')} ${car.variant ? `• ${escapeHtml(car.variant)}` : ''} • Available at Future Holding Bond Nakawa</p>
          </div>

          <div class="detail-specs-grid">
            ${specTiles.map(tile => `
              <div class="detail-spec-card">
                <div class="spec-card-label">${escapeHtml(tile.label)}</div>
                <div class="spec-card-value">${escapeHtml(tile.value)}</div>
              </div>
            `).join('')}
          </div>

          <div class="detail-features-wrapper">
            <div class="detail-section-subtitle">Vehicle Equipment & Key Features</div>
            <div class="detail-features-grid">
              ${features.map(f => `
                <div class="detail-feature-pill">
                  <span class="check-icon">✓</span>
                  <span>${escapeHtml(f)}</span>
                </div>
              `).join('')}
            </div>
          </div>

          <div class="detail-action-box">
            <a href="https://wa.me/256746838390?text=${whatsappText}" class="btn-whatsapp" target="_blank" rel="noopener noreferrer">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.711 2.598 2.664-.698c.969.53 2.052.81 3.19.81h.005c3.18 0 5.767-2.587 5.768-5.766.001-3.181-2.586-5.767-5.767-5.767zm7.558 5.765c0 4.17-3.393 7.563-7.563 7.563-1.328 0-2.576-.347-3.666-.954l-4.085 1.07 1.09-3.985c-.694-1.135-1.095-2.469-1.095-3.894 0-4.17 3.393-7.563 7.564-7.563 4.17 0 7.563 3.393 7.563 7.563zm-3.167 3.67c-.201-.1-.703-.347-1.162-.647-.46-.301-.796-.445-.964-.199-.168.246-.647.81-.793.978-.146.168-.291.19-.571.05-.28-.14-1.183-.436-2.253-1.39-.832-.742-1.394-1.658-1.558-1.939-.164-.28-.018-.432.122-.572.127-.126.28-.328.42-.492.14-.164.187-.28.28-.466.094-.187.047-.35-.023-.49-.07-.14-.647-1.558-.887-2.134-.233-.56-.47-.484-.647-.493-.168-.009-.36-.01-.552-.01-.192 0-.503.072-.766.36-.264.288-1.009.986-1.009 2.404 0 1.418 1.033 2.788 1.177 2.98.144.192 2.033 3.104 4.925 4.354.688.297 1.226.474 1.644.607.691.22 1.32.189 1.817.115.554-.083 1.706-.697 1.947-1.369.24-.672.24-1.248.168-1.369-.072-.121-.264-.192-.544-.332z"/></svg>
              <span>Enquire on WhatsApp (Abdul Rehman)</span>
            </a>

            <div class="detail-call-row">
              <a href="tel:0746838390" class="btn-call">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
                <span>Call 0746-838390</span>
              </a>
              <a href="tel:0703605000" class="btn-call">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
                <span>Official: 0703-605000</span>
              </a>
            </div>

            <button type="button" class="btn btn-outline btn-block" id="fill-enquiry-form-btn">
              <span>Send Website Enquiry Message</span>
            </button>
          </div>
        </div>
      </div>
    `;

    // Attach Gallery Interaction Event Listeners
    const backBtn = document.getElementById('product-back-btn');
    if (backBtn) {
      backBtn.addEventListener('click', () => {
        window.location.hash = 'cars';
        renderProductFromHash();
      });
    }

    const prevBtn = document.getElementById('gallery-prev-btn');
    const nextBtn = document.getElementById('gallery-next-btn');
    if (prevBtn) prevBtn.addEventListener('click', (e) => { e.stopPropagation(); updateProductGalleryImage(currentGalleryIndex - 1); });
    if (nextBtn) nextBtn.addEventListener('click', (e) => { e.stopPropagation(); updateProductGalleryImage(currentGalleryIndex + 1); });

    const mainFrame = document.getElementById('gallery-main-frame');
    if (mainFrame) {
      mainFrame.addEventListener('click', () => openLightbox(currentGalleryIndex));
    }

    const thumbs = productView.querySelectorAll('.gallery-thumb-item');
    thumbs.forEach(thumb => {
      thumb.addEventListener('click', () => {
        const idx = parseInt(thumb.getAttribute('data-index'), 10);
        updateProductGalleryImage(idx);
      });
    });

    const fillEnquiryBtn = document.getElementById('fill-enquiry-form-btn');
    if (fillEnquiryBtn) {
      fillEnquiryBtn.addEventListener('click', () => {
        const contactSection = document.getElementById('contact');
        const messageInput = document.getElementById('message');
        if (messageInput) {
          messageInput.value = `Hello United Japan TRD LTD, I am inquiring about the ${car.name} (${car.model || 'JDM'}). Please contact me with pricing and viewing schedules at Nakawa Bond.`;
          messageInput.focus();
        }
        if (contactSection) {
          contactSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
    }

    productView.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  // Load Vehicles from catalog.json or fallback
  async function loadVehicles() {
    try {
      const response = await fetch('cars/catalog.json');
      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data) && data.length > 0) {
          // Normalize entries
          vehicles = data.map(item => {
            const cleanFolder = String(item.folder || item.name).replace(/^[/\\]*cars[/\\]*/i, '').replace(/^[/\\]+/, '').replace(/[/\\]+$/, '').trim();
            const mainImg = item.mainImage || (item.images && item.images.find(img => /^main_image\./i.test(img))) || (item.images && item.images[0]) || 'Main_image.jpeg';
            return {
              ...item,
              folder: cleanFolder,
              name: item.name || cleanFolder,
              mainImage: mainImg,
              images: item.images && item.images.length ? item.images : [mainImg]
            };
          }).filter(c => c.folder && c.folder.toLowerCase() !== 'cars');
        }
      }
    } catch (err) {
      console.warn('Live catalog fetch failed, loading embedded catalog fallback:', err);
    }

    // Use embedded fallback if fetch was not successful
    if (!vehicles || vehicles.length === 0) {
      vehicles = FALLBACK_CATALOG;
    }

    updateCounts();
    renderVehicleCards();
    renderProductFromHash();
  }

  loadVehicles();
  window.addEventListener('hashchange', renderProductFromHash);

  // Search, Filter & Sort Event Handlers
  brandButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      brandButtons.forEach(b => {
        b.classList.remove('active');
        b.setAttribute('aria-selected', 'false');
      });
      btn.classList.add('active');
      btn.setAttribute('aria-selected', 'true');
      currentFilterBrand = btn.getAttribute('data-brand') || 'all';
      renderVehicleCards();
    });
  });

  if (searchInput) {
    searchInput.addEventListener('input', () => {
      currentSearchQuery = searchInput.value;
      if (clearSearchBtn) clearSearchBtn.hidden = !currentSearchQuery;
      renderVehicleCards();
    });
  }

  if (clearSearchBtn) {
    clearSearchBtn.addEventListener('click', () => {
      if (searchInput) searchInput.value = '';
      currentSearchQuery = '';
      clearSearchBtn.hidden = true;
      renderVehicleCards();
      if (searchInput) searchInput.focus();
    });
  }

  if (sortSelect) {
    sortSelect.addEventListener('change', () => {
      currentSort = sortSelect.value;
      renderVehicleCards();
    });
  }

  if (resetFilterBtn) {
    resetFilterBtn.addEventListener('click', () => {
      currentFilterBrand = 'all';
      currentSearchQuery = '';
      currentSort = 'featured';
      if (searchInput) searchInput.value = '';
      if (clearSearchBtn) clearSearchBtn.hidden = true;
      if (sortSelect) sortSelect.value = 'featured';
      brandButtons.forEach(b => {
        b.classList.toggle('active', b.getAttribute('data-brand') === 'all');
        b.setAttribute('aria-selected', String(b.getAttribute('data-brand') === 'all'));
      });
      renderVehicleCards();
    });
  }

  // Load Company Info from company_info.txt
  async function loadCompanyInfo() {
    try {
      const response = await fetch('company_info.txt');
      if (!response.ok) return;
      const text = await response.text();
      const nameMatch = text.match(/Company Name:\s*(.+)/i);
      const emailMatch = text.match(/email:\s*(\S+)/i);

      if (nameMatch) {
        document.querySelectorAll('[data-company="name"]').forEach(el => el.textContent = nameMatch[1].trim());
      }
      if (emailMatch) {
        companyEmail = emailMatch[1].trim();
        document.querySelectorAll('[data-company="email"]').forEach(el => {
          el.textContent = companyEmail;
          el.href = `mailto:${companyEmail}`;
        });
      }
    } catch (e) {
      // Keep existing valid default HTML values
    }
  }
  loadCompanyInfo();

  // Contact Form Submission Handling
  const contactForm = document.getElementById('contact-form');
  if (contactForm) {
    contactForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const statusEl = document.getElementById('form-status');
      const formData = new FormData(contactForm);
      const payload = Object.fromEntries(formData.entries());

      if (!payload.name || !payload.phone || !payload.email) {
        if (statusEl) {
          statusEl.hidden = false;
          statusEl.style.backgroundColor = '#fef2f2';
          statusEl.style.color = '#991b1b';
          statusEl.style.borderColor = '#fecaca';
          statusEl.textContent = 'Please provide your Full Name, Phone Number, and Email.';
        }
        return;
      }

      if (statusEl) {
        statusEl.hidden = false;
        statusEl.style.backgroundColor = '#ecfdf5';
        statusEl.style.color = '#065f46';
        statusEl.style.borderColor = '#a7f3d0';
        statusEl.textContent = 'Sending enquiry...';
      }

      const enquiryEmail = (contactForm.dataset.enquiryEmail && contactForm.dataset.enquiryEmail.trim()) || companyEmail;
      const endpoint = (contactForm.dataset.endpoint && contactForm.dataset.endpoint.trim()) || `https://formsubmit.co/${enquiryEmail}`;

      try {
        if (endpoint.includes('formsubmit.co')) {
          const bodyParams = new URLSearchParams();
          for (const [k, v] of formData.entries()) bodyParams.append(k, v);
          const res = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: bodyParams.toString()
          });
          if (res.ok || res.status === 302 || res.type === 'opaque') {
            if (statusEl) statusEl.textContent = `Thank you! Your enquiry has been sent to ${enquiryEmail}. We will contact you shortly.`;
            contactForm.reset();
            return;
          }
        }
      } catch (err) {
        // Fallback below
      }

      // WhatsApp / Mailto fallback
      const mailtoSubject = encodeURIComponent(`Website Vehicle Enquiry from ${payload.name}`);
      const mailtoBody = encodeURIComponent(`Name: ${payload.name}\nPhone: ${payload.phone}\nEmail: ${payload.email}\n\nMessage:\n${payload.message || 'No additional message.'}`);
      const mailtoUrl = `mailto:${enquiryEmail}?subject=${mailtoSubject}&body=${mailtoBody}`;

      window.open(mailtoUrl, '_blank');
      if (statusEl) {
        statusEl.textContent = 'Thank you! Your enquiry is prepared. If your mail client did not open, please chat with us on WhatsApp or call 0746-838390.';
      }
      contactForm.reset();
    });
  }
});

