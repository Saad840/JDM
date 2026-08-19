/* Core interactions: mobile menu, smooth scroll, reveal animations, contact form handling */
document.addEventListener('DOMContentLoaded',function(){
  const navToggle = document.getElementById('nav-toggle');
  const navList = document.getElementById('nav-list');
  const header = document.getElementById('site-header');

  // Mobile nav toggle
  navToggle.addEventListener('click',()=>{
    const expanded = navToggle.getAttribute('aria-expanded') === 'true';
    navToggle.setAttribute('aria-expanded', String(!expanded));
    if(!expanded){
      navList.style.display = 'flex';
    } else {
      navList.style.display = '';
    }
  });

  // Close mobile menu on resize large
  window.addEventListener('resize', ()=>{
    if(window.innerWidth > 720) navList.style.display = '';
  });

  // Smooth scroll for internal links
  document.querySelectorAll('a[data-scroll]').forEach(a=>{
    a.addEventListener('click', (e)=>{
      e.preventDefault();
      const target = document.querySelector(a.getAttribute('href'));
      if(target){
        target.scrollIntoView({behavior:'smooth',block:'start'});
      }
      // close mobile menu after navigation
      if(window.innerWidth <= 720){
        navList.style.display = '';
        navToggle.setAttribute('aria-expanded','false');
      }
    });
  });

  // Header scroll appearance
  const setHeader = ()=>{
    if(window.scrollY > 60) header.classList.add('scrolled'); else header.classList.remove('scrolled');
  };
  setHeader();
  window.addEventListener('scroll', setHeader);

  // IntersectionObserver reveal
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if(!prefersReduced){
    const io = new IntersectionObserver((entries)=>{
      entries.forEach(e=>{
        if(e.isIntersecting){
          e.target.classList.add('visible');
          io.unobserve(e.target);
        }
      });
    },{threshold:0.12});

    document.querySelectorAll('.section, .car-card, .service-card, .about-media, .hero-content').forEach(el=>{
      el.classList.add('reveal');
      io.observe(el);
    });
  }

  // Footer year
  const y = document.getElementById('year'); if(y) y.textContent = new Date().getFullYear();

  const vehicleGrid = document.getElementById('vehicles');
  const vehicleStatus = document.getElementById('vehicle-status');
  const productView = document.getElementById('product-view');
  let vehicles = [];
  let companyEmail = 'unitedjapantraders@gmail.com';

  const escapeHtml = (value='') => String(value).replace(/[&<>'"]/g, character => ({
    '&':'&amp;', '<':'&lt;', '>':'&gt;', "'":'&#39;', '"':'&quot;'
  }[character]));
  const folderPath = folder => `cars/${encodeURIComponent(folder).replace(/%2F/g, '/')}`;
  const filePath = (folder, file) => `${folderPath(folder)}/${encodeURIComponent(file).replace(/%2F/g, '/')}`;
  const slug = name => encodeURIComponent(name);

  const parseDescription = text => {
    const lines = text.split(/\r?\n/).map(line => line.trim()).filter(Boolean);
    return {summary: lines.join(' • '), lines};
  };

  async function readDirectory(folder){
    try{
      const response = await fetch(`${folderPath(folder)}/`);
      if(!response.ok) return [];
      const html = await response.text();
      const doc = new DOMParser().parseFromString(html, 'text/html');
      return [...doc.querySelectorAll('a[href]')]
        .map(link => decodeURIComponent(link.getAttribute('href').split('/').pop()))
        .filter(name => /\.(jpe?g|png|webp|gif|avif)$/i.test(name));
    } catch(error){
      return [];
    }
  }

  async function loadVehicle(entry){
    const folder = entry.folder || entry.name;
    const [descriptionResponse, directoryImages] = await Promise.all([
      fetch(filePath(folder, entry.descriptionFile || 'description.txt')),
      readDirectory(folder)
    ]);
    const descriptionText = descriptionResponse.ok ? await descriptionResponse.text() : '';
    const images = directoryImages.length ? directoryImages : [entry.mainImage].filter(Boolean);
    const mainImage = images.find(image => /^main_image\./i.test(image)) || entry.mainImage || images[0];
    return {
      ...entry,
      name: entry.name || folder,
      folder,
      description: parseDescription(descriptionText),
      images,
      mainImage
    };
  }

  async function discoverFolders(){
    try{
      const response = await fetch('cars/');
      if(response.ok){
        const doc = new DOMParser().parseFromString(await response.text(), 'text/html');
        const folders = [...doc.querySelectorAll('a[href]')]
          .map(link => link.getAttribute('href'))
          .filter(href => href && href.endsWith('/'))
          .map(href => decodeURIComponent(href.replace(/\/$/, '')))
          .filter(folder => folder && folder !== '..');
        if(folders.length) return folders.map(folder => ({name: folder, folder}));
      }
    } catch(error){
      // Static hosts generally block directory listing; use catalog.json below.
    }
    const catalogResponse = await fetch('cars/catalog.json');
    if(!catalogResponse.ok) throw new Error('Vehicle catalog could not be loaded.');
    return await catalogResponse.json();
  }

  function observeReveals(){
    if(prefersReduced) return;
    document.querySelectorAll('#vehicles .car-card').forEach(card => {
      card.classList.add('reveal');
      requestAnimationFrame(() => card.classList.add('visible'));
    });
  }

  function renderVehicleCards(){
    vehicleGrid.innerHTML = vehicles.map((car, index) => `
      <a class="car-card product-card" href="#car/${slug(car.name)}" data-car-index="${index}">
        <div class="car-media">
          <img src="${filePath(car.folder, car.mainImage)}" alt="${escapeHtml(car.name)}" loading="lazy">
        </div>
        <div class="car-body">
          <h3 class="car-name">${escapeHtml(car.name)}</h3>
          <p class="car-desc">${escapeHtml(car.description.summary || 'Contact us for full vehicle details.')}</p>
          <div class="car-footer">
            <span class="price">Enquire for Price</span>
            <span class="btn btn-sm btn-outline">View Details</span>
          </div>
        </div>
      </a>`).join('');
    vehicleGrid.querySelectorAll('.product-card').forEach(card => card.addEventListener('click', event => {
      event.preventDefault();
      window.location.hash = card.getAttribute('href').slice(1);
      renderProductFromHash();
    }));
    observeReveals();
  }

  function renderProductFromHash(){
    const match = window.location.hash.match(/^#car\/(.+)$/);
    if(!match){
      productView.hidden = true;
      vehicleGrid.hidden = false;
      vehicleStatus.hidden = false;
      return;
    }
    const car = vehicles.find(vehicle => slug(vehicle.name) === match[1]);
    if(!car) return;
    vehicleGrid.hidden = true;
    vehicleStatus.hidden = true;
    productView.hidden = false;
    productView.innerHTML = `
      <a class="back-link" href="#cars" data-scroll>← Back to vehicles</a>
      <div class="product-detail">
        <div class="product-detail-media"><img src="${filePath(car.folder, car.mainImage)}" alt="${escapeHtml(car.name)}"></div>
        <div class="product-detail-body">
          <p class="eyebrow">Available in Uganda</p>
          <h3>${escapeHtml(car.name)}</h3>
          <p>${escapeHtml(car.description.summary || 'Contact us for complete specifications and pricing.')}</p>
          <ul class="detail-list">${car.description.lines.map(line => `<li>${escapeHtml(line)}</li>`).join('')}</ul>
          <a class="btn btn-primary" href="#contact" data-scroll>Enquire Now</a>
        </div>
      </div>`;
    productView.querySelectorAll('a[data-scroll]').forEach(link => link.addEventListener('click', event => {
      event.preventDefault();
      document.querySelector(link.getAttribute('href')).scrollIntoView({behavior:'smooth'});
    }));
    productView.scrollIntoView({behavior:'smooth', block:'start'});
  }

  async function loadVehicles(){
    try{
      const entries = await discoverFolders();
      vehicles = await Promise.all(entries.map(loadVehicle));
      renderVehicleCards();
      vehicleStatus.textContent = `${vehicles.length} vehicle${vehicles.length === 1 ? '' : 's'} available`;
      renderProductFromHash();
    } catch(error){
      vehicleStatus.textContent = 'Vehicles could not be loaded. Run the site through a local web server.';
    }
  }
  loadVehicles();
  window.addEventListener('hashchange', renderProductFromHash);

  async function loadCompanyInfo(){
    try{
      const response = await fetch('company_info.txt');
      if(!response.ok) return;
      const text = await response.text();
      const phoneLines = text.split(/\r?\n/).filter(line => /^\d/.test(line.trim())).map(line => line.trim());
      const addressMatch = text.match(/Company Address:\s*\r?\n([\s\S]*)/i);
      const nameMatch = text.match(/Company Name:\s*(.+)/i);
      const emailMatch = text.match(/^email:\s*(\S+)/im);
      if(emailMatch) companyEmail = emailMatch[1].trim();
      document.querySelectorAll('[data-company="name"]').forEach(element => element.textContent = nameMatch ? nameMatch[1].trim() : element.textContent);
      document.querySelectorAll('[data-company="phones"]').forEach(element => element.innerHTML = phoneLines.map(escapeHtml).join('<br>'));
      if(addressMatch) document.querySelectorAll('[data-company="address"]').forEach(element => element.textContent = addressMatch[1].trim());
      document.querySelectorAll('[data-company="email"]').forEach(element => {
        element.textContent = companyEmail;
        element.href = `mailto:${companyEmail}`;
      });
    } catch(error){
      // Keep the safe fallback values already present in the HTML.
    }
  }
  loadCompanyInfo();

  // Contact form handling (frontend only)
  const form = document.getElementById('contact-form');
  form.addEventListener('submit', async (e)=>{
    e.preventDefault();
    const statusEl = document.getElementById('form-status');
    const data = new FormData(form);
    const payload = Object.fromEntries(data.entries());
    // Basic validation
    if(!payload.name || !payload.phone || !payload.email){
      if(statusEl){statusEl.hidden = false; statusEl.textContent = 'Please fill Name, Phone and Email.';}
      return;
    }

    // If an endpoint is configured on the form (e.g., Formspree), POST there
    const enquiryEmail = (form.dataset.enquiryEmail && form.dataset.enquiryEmail.trim()) || companyEmail;
    const endpoint = (form.dataset.endpoint && form.dataset.endpoint.trim()) || `https://formsubmit.co/${enquiryEmail}`;
    if(endpoint){
      try{
        statusEl.hidden = false; statusEl.textContent = 'Sending…';
        // Support Formsubmit and generic endpoints. For Formsubmit, send URL-encoded form data.
        if(endpoint.includes('formsubmit.co')){
          const fd = new FormData(form);
          const body = new URLSearchParams();
          for(const pair of fd.entries()) body.append(pair[0], pair[1]);
          const res = await fetch(endpoint, {method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:body.toString()});
          if(res.ok || res.status === 302){
            statusEl.textContent = `Enquiry sent — please check ${enquiryEmail} to confirm the form (Formsubmit requires verification).`;
            form.reset();
          } else {
            statusEl.textContent = `Could not send enquiry. Please try again or email ${enquiryEmail}`;
          }
          return;
        }

        // Generic JSON POST for other endpoints
        const res = await fetch(endpoint, {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
        if(res.ok){
          statusEl.textContent = 'Enquiry sent — thank you. We will respond shortly.';
          form.reset();
        } else {
          statusEl.textContent = `Could not send enquiry. Please try again or email ${enquiryEmail}`;
        }
        return;
      } catch(err){
        statusEl.textContent = `Network error. Please try again or email ${enquiryEmail}`;
        return;
      }
    }

    // Fallback: open mail client with mailto (best-effort, not secure server send)
    const subject = `Website Enquiry from ${payload.name}`;
    const body = `Phone: ${payload.phone}\n\nMessage:\n${payload.message||''}`;
    const mailto = `mailto:${enquiryEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

    // Try opening mail client
    try{
      // create a temporary anchor to ensure consistent behavior
      const a = document.createElement('a');
      a.href = mailto;
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      if(statusEl){statusEl.hidden = false; statusEl.textContent = `If your mail client did not open, please email ${enquiryEmail} with your enquiry.`;}
      form.reset();
    } catch(err){
      if(statusEl){statusEl.hidden = false; statusEl.textContent = `Unable to open mail client. Please email ${enquiryEmail}`;}
    }
  });
});
