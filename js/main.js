/* ============================================================
   FIT2TRADE — main.js v2
   ============================================================ */
(function () {
  'use strict';

  /* ── Copyright year ───────────────────────────────────────── */
  const yr = document.getElementById('year');
  if (yr) yr.textContent = new Date().getFullYear();

  /* ── Sticky header ────────────────────────────────────────── */
  const header = document.getElementById('site-header');

  function tickHeader() {
    header.classList.toggle('scrolled', window.scrollY > 56);
  }
  window.addEventListener('scroll', tickHeader, { passive: true });
  tickHeader();

  /* ── Mobile nav ───────────────────────────────────────────── */
  const toggle    = document.getElementById('nav-toggle');
  const mobileNav = document.getElementById('mobile-nav');

  toggle.addEventListener('click', function () {
    const open = mobileNav.classList.toggle('open');
    toggle.classList.toggle('active', open);
    toggle.setAttribute('aria-expanded', String(open));
    document.body.style.overflow = open ? 'hidden' : '';
  });

  // Accordion sub-menus (data-mob attribute)
  document.querySelectorAll('[data-mob]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      const id   = btn.dataset.mob;
      const sub  = document.getElementById(id);
      if (!sub) return;
      const open = sub.classList.toggle('open');
      const ind  = btn.querySelector('span');
      if (ind) ind.textContent = open ? '−' : '+';
    });
  });

  // Close nav on any link tap
  mobileNav.querySelectorAll('a').forEach(function (a) {
    a.addEventListener('click', closeNav);
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeNav();
  });

  function closeNav() {
    mobileNav.classList.remove('open');
    toggle.classList.remove('active');
    toggle.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  }

  /* ── Scroll reveal ────────────────────────────────────────── */
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          e.target.classList.add('visible');
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

    document.querySelectorAll('.reveal').forEach(function (el) { io.observe(el); });
  } else {
    document.querySelectorAll('.reveal').forEach(function (el) {
      el.classList.add('visible');
    });
  }

  /* ── Netlify form — AJAX submission ──────────────────────── */
  const form    = document.getElementById('contact-form');
  const success = document.getElementById('form-success');

  if (form && success) {
    form.addEventListener('submit', async function (e) {
      e.preventDefault();

      const btn   = form.querySelector('[type="submit"]');
      const label = btn.textContent;
      btn.textContent = 'Sending…';
      btn.disabled    = true;

      try {
        const res = await fetch('/', {
          method:  'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body:    new URLSearchParams(new FormData(form)).toString()
        });

        if (res.ok) {
          form.style.display    = 'none';
          success.style.display = 'block';
        } else {
          throw new Error();
        }
      } catch {
        btn.textContent = label;
        btn.disabled    = false;
        alert('Something went wrong — please try again or email info@fit2trade.com');
      }
    });
  }

  /* ── Smooth scroll for # links ────────────────────────────── */
  document.querySelectorAll('a[href^="#"]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      const target = document.querySelector(this.getAttribute('href'));
      if (!target) return;
      e.preventDefault();
      const navH = parseInt(
        getComputedStyle(document.documentElement).getPropertyValue('--nav-h'), 10
      ) || 68;
      window.scrollTo({
        top:      target.getBoundingClientRect().top + window.scrollY - navH - 12,
        behavior: 'smooth'
      });
    });
  });

})();
