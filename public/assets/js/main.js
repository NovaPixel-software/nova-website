(function () {
  'use strict';
  var nav = document.querySelector('.nav');
  var toggle = document.getElementById('navToggle');
  var links = document.getElementById('navLinks');

  // Sticky nav border on scroll
  function onScroll() { nav.classList.toggle('is-scrolled', window.scrollY > 10); }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // Mobile menu
  function setMenu(open) {
    nav.classList.toggle('is-open', open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  }
  toggle.addEventListener('click', function () { setMenu(!nav.classList.contains('is-open')); });
  links.addEventListener('click', function (e) { if (e.target.closest('a')) setMenu(false); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') setMenu(false); });

  // Reveal on scroll
  var items = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('is-visible'); io.unobserve(en.target); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    items.forEach(function (el) { io.observe(el); });
  } else {
    items.forEach(function (el) { el.classList.add('is-visible'); });
  }

  document.getElementById('year').textContent = new Date().getFullYear();

  // Contact form: posts to contact.php (Hostinger PHP hosting).
  // If PHP isn't available, falls back to opening the visitor's email app.
  var form = document.getElementById('contactForm');
  var status = document.getElementById('formStatus');
  var TO = 'support@novapixelsoftware.com';

  function mailtoFallback(d) {
    var body = 'Name: ' + d.name + '\nPhone: ' + d.phone + '\nEmail: ' + d.email +
      '\nService: ' + d.service + '\n\n' + d.message;
    window.location.href = 'mailto:' + TO + '?subject=' + encodeURIComponent('Website enquiry: ' + d.service) +
      '&body=' + encodeURIComponent(body);
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var ok = true;
    ['name', 'phone', 'message'].forEach(function (n) {
      var f = form.elements[n];
      var bad = !f.value.trim();
      f.classList.toggle('is-invalid', bad);
      if (bad) ok = false;
    });
    var em = form.elements.email;
    if (em.value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em.value)) { em.classList.add('is-invalid'); ok = false; }
    else em.classList.remove('is-invalid');
    if (!ok) { status.className = 'form__status err'; status.textContent = 'Please fill in your name, phone and requirement.'; return; }

    var d = {
      name: form.elements.name.value.trim(), phone: form.elements.phone.value.trim(),
      email: em.value.trim(), service: form.elements.service.value, message: form.elements.message.value.trim()
    };
    var btn = form.querySelector('button[type=submit]');
    btn.disabled = true; btn.textContent = 'Sending…';
    status.className = 'form__status'; status.textContent = '';

    fetch(form.action, { method: 'POST', body: new FormData(form), headers: { 'Accept': 'application/json' } })
      .then(function (r) { return r.ok ? r.json() : Promise.reject(r.status); })
      .then(function (res) {
        if (!res || !res.ok) throw new Error('send failed');
        status.className = 'form__status ok';
        status.textContent = 'Thank you! We\'ve received your enquiry and will reply within one working day.';
        form.reset();
      })
      .catch(function () {
        status.className = 'form__status';
        status.textContent = 'Opening your email app to send the enquiry…';
        mailtoFallback(d);
      })
      .finally(function () { btn.disabled = false; btn.textContent = 'Send enquiry'; });
  });
})();
