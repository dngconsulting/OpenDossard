/* OpenDossard v2 — Main JS */

document.addEventListener('DOMContentLoaded', function () {
  // 1. Lucide icons
  if (window.lucide) {
    lucide.createIcons();
  }

  // 2. Navbar scroll effect
  var nav = document.querySelector('.nav-main');
  if (nav) {
    function onScroll() {
      if (window.scrollY > 40) {
        nav.classList.add('scrolled');
      } else {
        nav.classList.remove('scrolled');
      }
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  // 3. Mobile nav toggle
  var burger = document.getElementById('nav-burger');
  var mobileNav = document.getElementById('mobile-nav');
  var closeBtn = document.getElementById('nav-close');
  if (burger && mobileNav) {
    burger.addEventListener('click', function () {
      mobileNav.classList.add('open');
      document.body.style.overflow = 'hidden';
    });
    function closeMobileNav() {
      mobileNav.classList.remove('open');
      document.body.style.overflow = '';
    }
    if (closeBtn) closeBtn.addEventListener('click', closeMobileNav);
    mobileNav.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', closeMobileNav);
    });
  }

  // 4. Intersection Observer — fade-in-up
  var els = document.querySelectorAll('.fade-in-up');
  if (els.length && 'IntersectionObserver' in window) {
    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) {
            e.target.classList.add('visible');
            observer.unobserve(e.target);
          }
        });
      },
      { threshold: 0.12 }
    );
    els.forEach(function (el) { observer.observe(el); });
  } else {
    els.forEach(function (el) { el.classList.add('visible'); });
  }
});
