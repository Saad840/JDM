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

  // Contact form handling (frontend only)
  const form = document.getElementById('contact-form');
  form.addEventListener('submit', async (e)=>{
    e.preventDefault();
    const data = new FormData(form);
    const payload = Object.fromEntries(data.entries());
    // Basic validation
    if(!payload.name || !payload.phone || !payload.email){
      alert('Please fill Name, Phone and Email.');
      return;
    }

    // NOTE: This site is static. Configure a real endpoint here.
    // <!-- CONTACT FORM ENDPOINT / EMAIL SERVICE GOES HERE -->
    // Example (do not include API keys in frontend):
    // await fetch('https://your-form-endpoint.example/submit', {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});

    // Fallback: open mail client with mailto (best-effort, not secure server send)
    const mailto = `mailto:nehalagct@gmail.com?subject=${encodeURIComponent('Website Enquiry from '+payload.name)}&body=${encodeURIComponent('Phone: '+payload.phone+'\n\nMessage:\n'+(payload.message||''))}`;
    window.location.href = mailto;
  });
});
