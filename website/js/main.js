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

  // 4. Lightbox — click-to-zoom screenshots
  var lightbox = document.createElement('div');
  lightbox.className = 'lightbox';
  lightbox.innerHTML = '<button class="lightbox-close" aria-label="Fermer">&times;</button><img src="" alt="">';
  document.body.appendChild(lightbox);
  var lbImg = lightbox.querySelector('img');
  var lbClose = lightbox.querySelector('.lightbox-close');

  function openLightbox(src, alt) {
    lbImg.src = src;
    lbImg.alt = alt || '';
    requestAnimationFrame(function () { lightbox.classList.add('open'); });
    document.body.style.overflow = 'hidden';
  }
  function closeLightbox() {
    lightbox.classList.remove('open');
    document.body.style.overflow = '';
  }

  document.querySelectorAll('.screenshot').forEach(function (img) {
    img.addEventListener('click', function () { openLightbox(img.src, img.alt); });
  });
  lightbox.addEventListener('click', function (e) {
    if (e.target !== lbImg) closeLightbox();
  });
  lbClose.addEventListener('click', closeLightbox);
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeLightbox();
  });

  // 5. Intersection Observer — fade-in-up
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
