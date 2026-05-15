/* ============================================================
   FIT2TRADE — main.js
   Handles: sticky nav, mobile menu, scroll reveals, year
   ============================================================ */

(function () {
  'use strict';

  /* ── Year ─────────────────────────────────────────────────── */
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ── Sticky header ────────────────────────────────────────── */
  const header = document.getElementById('site-header');
  const SCROLL_THRESHOLD = 60;

  function updateHeader() {
    if (window.scrollY > SCROLL_THRESHOLD) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  }

  window.addEventListener('scroll', updateHeader, { passive: true });
  updateHeader(); // Run on load

  /* ── Mobile nav ───────────────────────────────────────────── */
  const toggle    = document.getElementById('nav-toggle');
  const mobileNav = document.getElementById('mobile-nav');

  toggle.addEventListener('click', function () {
    const isOpen = mobileNav.classList.toggle('open');
    toggle.classList.toggle('active', isOpen);
    toggle.setAttribute('aria-expanded', String(isOpen));
    document.body.style.overflow = isOpen ? 'hidden' : '';
  });

  // Mobile accordion sub-menus
  document.querySelectorAll('[data-toggle]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      const targetId = btn.dataset.toggle;
      const sub = document.getElementById(targetId);
      if (!sub) return;
      const isOpen = sub.classList.toggle('open');
      const indicator = btn.querySelector('span');
      if (indicator) indicator.textContent = isOpen ? '−' : '+';
    });
  });

  // Close mobile nav on link click
  mobileNav.querySelectorAll('a').forEach(function (link) {
    link.addEventListener('click', function () {
      mobileNav.classList.remove('open');
      toggle.classList.remove('active');
      toggle.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
    });
  });

  // Close on Escape key
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && mobileNav.classList.contains('open')) {
      mobileNav.classList.remove('open');
      toggle.classList.remove('active');
      toggle.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
      toggle.focus();
    }
  });

  /* ── Scroll reveal (IntersectionObserver) ─────────────────── */
  if ('IntersectionObserver' in window) {
    const revealEls = document.querySelectorAll('.reveal');

    const observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target); // Fire once
        }
      });
    }, {
      threshold: 0.12,
      rootMargin: '0px 0px -40px 0px'
    });

    revealEls.forEach(function (el) { observer.observe(el); });
  } else {
    // Fallback: show everything immediately
    document.querySelectorAll('.reveal').forEach(function (el) {
      el.classList.add('visible');
    });
  }

  /* ── Netlify form handling ────────────────────────────────── */
  // Netlify handles form submission natively when JS is off.
  // This progressive enhancement prevents a full page reload
  // and shows the success message inline instead.
  const form        = document.getElementById('contact-form');
  const successMsg  = document.getElementById('form-success');

  if (form && successMsg) {
    form.addEventListener('submit', async function (e) {
      e.preventDefault();

      const submitBtn = form.querySelector('[type="submit"]');
      const original  = submitBtn.textContent;
      submitBtn.textContent = 'Sending…';
      submitBtn.disabled    = true;

      try {
        const data = new FormData(form);

        const response = await fetch('/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams(data).toString()
        });

        if (response.ok) {
          form.style.display        = 'none';
          successMsg.style.display  = 'block';
        } else {
          throw new Error('Network response was not ok');
        }
      } catch (err) {
        console.error('Form error:', err);
        submitBtn.textContent = original;
        submitBtn.disabled    = false;
        alert('Something went wrong. Please try again or email us directly at info@fit2trade.com');
      }
    });
  }

  /* ── Smooth scroll for anchor links ──────────────────────── */
  document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
    anchor.addEventListener('click', function (e) {
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        e.preventDefault();
        const offset = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--nav-h'), 10) || 72;
        const top    = target.getBoundingClientRect().top + window.scrollY - offset - 16;
        window.scrollTo({ top: top, behavior: 'smooth' });
      }
    });
  });

})();
