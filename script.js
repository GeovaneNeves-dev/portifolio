(() => {
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isTouch = window.matchMedia('(hover: none)').matches;

  /* =========================================================
     1. BOOT SCREEN
  ========================================================== */
  const boot = document.getElementById('boot');
  if (prefersReduced) boot.remove();
  else setTimeout(() => boot.remove(), 2200);

  /* =========================================================
     2. NAV — scroll state, progress, mobile toggle, scroll-spy
  ========================================================== */
  const nav = document.getElementById('nav');
  const navToggle = document.getElementById('navToggle');
  const navLinks = document.getElementById('navLinks');
  const navAnchors = document.querySelectorAll('[data-nav]');
  const navProgress = document.getElementById('navProgress');

  navToggle.addEventListener('click', () => {
    const open = navLinks.classList.toggle('open');
    navToggle.classList.toggle('open', open);
    navToggle.setAttribute('aria-expanded', String(open));
  });
  navAnchors.forEach(a => a.addEventListener('click', () => {
    navLinks.classList.remove('open');
    navToggle.classList.remove('open');
  }));

  const sections = ['skills', 'sobre', 'projetos', 'contato'].map(id => document.getElementById(id));

  function onScroll(){
    nav.classList.toggle('scrolled', window.scrollY > 20);
    const doc = document.documentElement;
    const scrollTop = doc.scrollTop || document.body.scrollTop;
    const scrollHeight = doc.scrollHeight - doc.clientHeight;
    navProgress.style.width = (scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0) + '%';

    let current = null;
    const trigger = window.scrollY + window.innerHeight * 0.35;
    sections.forEach(sec => { if (sec && sec.offsetTop <= trigger) current = sec.id; });
    navAnchors.forEach(a => a.classList.toggle('active', a.getAttribute('href') === '#' + current));
  }
  document.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* =========================================================
     3. INTERACTIVE BACKGROUND — floating points, mouse connects nearby ones
  ========================================================== */
  const canvas = document.getElementById('net');
  if (canvas && !prefersReduced) {
    const ctx = canvas.getContext('2d');
    const hero = document.querySelector('.hero');
    let w, h, points, mouse = { x: -9999, y: -9999 };

    function resize(){
      w = canvas.width = hero.offsetWidth;
      h = canvas.height = hero.offsetHeight;
      const count = Math.min(80, Math.floor((w * h) / 18000));
      points = Array.from({ length: count }, () => ({
        x: Math.random() * w, y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.35, vy: (Math.random() - 0.5) * 0.35,
      }));
    }

    function step(){
      ctx.clearRect(0, 0, w, h);
      points.forEach(p => {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0 || p.x > w) p.vx *= -1;
        if (p.y < 0 || p.y > h) p.vy *= -1;
      });

      // point-to-point faint links
      for (let i = 0; i < points.length; i++) {
        for (let j = i + 1; j < points.length; j++) {
          const dist = Math.hypot(points[i].x - points[j].x, points[i].y - points[j].y);
          if (dist < 120) {
            ctx.strokeStyle = `rgba(0,229,255,${0.1 * (1 - dist / 120)})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(points[i].x, points[i].y);
            ctx.lineTo(points[j].x, points[j].y);
            ctx.stroke();
          }
        }
        // mouse-to-point links (the interactive part)
        const distM = Math.hypot(points[i].x - mouse.x, points[i].y - mouse.y);
        if (distM < 180) {
          ctx.strokeStyle = `rgba(177,90,255,${0.55 * (1 - distM / 180)})`;
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.moveTo(points[i].x, points[i].y);
          ctx.lineTo(mouse.x, mouse.y);
          ctx.stroke();
        }
        ctx.fillStyle = 'rgba(0,229,255,0.55)';
        ctx.beginPath();
        ctx.arc(points[i].x, points[i].y, 1.5, 0, Math.PI * 2);
        ctx.fill();
      }

      // mouse marker
      if (mouse.x > -999) {
        ctx.beginPath();
        ctx.stroke();
      }

      requestAnimationFrame(step);
    }

    hero.addEventListener('mousemove', e => {
      const rect = hero.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
    });
    hero.addEventListener('mouseleave', () => { mouse.x = -9999; mouse.y = -9999; });
    hero.addEventListener('touchmove', e => {
      const rect = hero.getBoundingClientRect();
      const t = e.touches[0];
      if (t) { mouse.x = t.clientX - rect.left; mouse.y = t.clientY - rect.top; }
    }, { passive: true });

    window.addEventListener('resize', resize);
    resize();
    requestAnimationFrame(step);
  }

  /* =========================================================
     4. REVEAL ON SCROLL + STAT COUNTERS
  ========================================================== */
  const revealEls = document.querySelectorAll('.reveal');

  function animateCounters(container){
    container.querySelectorAll('.stat-number').forEach(el => {
      const target = parseInt(el.dataset.count, 10) || 0;
      let cur = 0;
      const step = Math.max(1, Math.round(target / 24));
      const timer = setInterval(() => {
        cur = Math.min(target, cur + step);
        el.textContent = cur;
        if (cur >= target) clearInterval(timer);
      }, 40);
    });
  }

  if ('IntersectionObserver' in window && !prefersReduced) {
    const io = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
          if (entry.target.querySelector('.stat-number')) animateCounters(entry.target);
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.2 });
    revealEls.forEach(el => io.observe(el));
  } else {
    revealEls.forEach(el => {
      el.classList.add('in-view');
      if (el.querySelector('.stat-number')) animateCounters(el);
    });
  }

  /* =========================================================
     5. CUSTOM CROSSHAIR CURSOR
  ========================================================== */
  const crosshair = document.getElementById('crosshair');
  if (!isTouch && !prefersReduced) {
    document.addEventListener('mousemove', e => {
      crosshair.style.left = e.clientX + 'px';
      crosshair.style.top = e.clientY + 'px';
    });
    const hoverables = 'a, button, .hex-card, .project-card';
    document.addEventListener('mouseover', e => { if (e.target.closest(hoverables)) crosshair.classList.add('hovering'); });
    document.addEventListener('mouseout', e => { if (e.target.closest(hoverables)) crosshair.classList.remove('hovering'); });
  } else {
    crosshair.remove();
  }

  /* =========================================================
     6. COPY EMAIL
  ========================================================== */
  const toast = document.getElementById('toast');
  function showToast(msg){
    toast.textContent = msg;
    toast.classList.add('show');
    clearTimeout(showToast._t);
    showToast._t = setTimeout(() => toast.classList.remove('show'), 2400);
  }
  document.getElementById('copyEmailBtn').addEventListener('click', async () => {
    const email = 'Geovaneneves068@gmail.com';
    try { await navigator.clipboard.writeText(email); showToast('e-mail copiado: ' + email); }
    catch { showToast('copie manualmente: ' + email); }
  });
})();