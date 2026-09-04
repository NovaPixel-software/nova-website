/* =========================================================
   Nova Pixel Software Pvt Ltd — interactions
   ========================================================= */
(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- current year in footer ---------- */
  var year = document.getElementById("year");
  if (year) year.textContent = new Date().getFullYear();

  /* ---------- sticky nav shadow + back-to-top ---------- */
  var nav = document.getElementById("nav");
  var toTop = document.getElementById("toTop");

  function onScroll() {
    var y = window.scrollY;
    if (nav) nav.classList.toggle("is-stuck", y > 10);
    if (toTop) toTop.classList.toggle("is-on", y > 600);
  }
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  /* ---------- mobile menu ---------- */
  var toggle = document.getElementById("navToggle");
  var links = document.getElementById("navLinks");

  function closeMenu() {
    if (!links || !toggle) return;
    links.classList.remove("is-open");
    toggle.setAttribute("aria-expanded", "false");
  }

  if (toggle && links) {
    toggle.addEventListener("click", function () {
      var open = links.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
    links.addEventListener("click", function (e) {
      if (e.target.closest("a")) closeMenu();
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") closeMenu();
    });
  }

  /* ---------- scroll reveal ---------- */
  var revealables = document.querySelectorAll(".reveal");

  if (reduceMotion || !("IntersectionObserver" in window)) {
    revealables.forEach(function (el) { el.classList.add("is-in"); });
  } else {
    var revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry, i) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        setTimeout(function () { el.classList.add("is-in"); }, i * 70);
        revealObserver.unobserve(el);
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -60px" });

    revealables.forEach(function (el) { revealObserver.observe(el); });
  }

  /* ---------- animated stat counters ---------- */
  var counters = document.querySelectorAll(".stat__n[data-count]");

  function runCounter(el) {
    var target = parseInt(el.getAttribute("data-count"), 10) || 0;
    var suffix = el.getAttribute("data-suffix") || "";
    if (reduceMotion) {
      el.textContent = target + suffix;
      return;
    }
    var duration = 1400;
    var start = null;

    function frame(ts) {
      if (start === null) start = ts;
      var p = Math.min((ts - start) / duration, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(target * eased) + suffix;
      if (p < 1) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  if ("IntersectionObserver" in window) {
    var countObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        runCounter(entry.target);
        countObserver.unobserve(entry.target);
      });
    }, { threshold: 0.5 });
    counters.forEach(function (el) { countObserver.observe(el); });
  } else {
    counters.forEach(runCounter);
  }

  /* ---------- contact form ---------- */
  var form = document.getElementById("contactForm");
  var status = document.getElementById("formStatus");

  function setStatus(msg, kind) {
    if (!status) return;
    status.textContent = msg;
    status.className = "form__status" + (kind ? " is-" + kind : "");
  }

  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();

      // basic validation
      var invalid = null;
      Array.prototype.forEach.call(form.querySelectorAll("[required]"), function (f) {
        var bad = !f.value.trim() || (f.type === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(f.value));
        f.setAttribute("aria-invalid", bad ? "true" : "false");
        if (bad && !invalid) invalid = f;
      });

      if (invalid) {
        setStatus("Please fill the highlighted fields correctly.", "err");
        invalid.focus();
        return;
      }

      // Not configured yet -> fall back to a mailto draft so no enquiry is lost.
      if (form.action.indexOf("YOUR_FORM_ID") !== -1) {
        var data = new FormData(form);
        var body = [
          "Name: " + (data.get("name") || ""),
          "Email: " + (data.get("email") || ""),
          "Phone: " + (data.get("phone") || ""),
          "Service: " + (data.get("service") || ""),
          "Budget: " + (data.get("budget") || ""),
          "",
          data.get("message") || ""
        ].join("\n");

        window.location.href =
          "mailto:hello@novapixelsoftware.com" +
          "?subject=" + encodeURIComponent("New enquiry from website - " + (data.get("name") || "")) +
          "&body=" + encodeURIComponent(body);

        setStatus("Opening your email app… (set up Formspree to receive these directly)", "ok");
        return;
      }

      var btn = form.querySelector("button[type=submit]");
      var label = btn ? btn.textContent : "";
      if (btn) { btn.disabled = true; btn.textContent = "Sending…"; }
      setStatus("Sending your enquiry…");

      fetch(form.action, {
        method: "POST",
        body: new FormData(form),
        headers: { Accept: "application/json" }
      })
        .then(function (res) {
          if (!res.ok) throw new Error("Request failed");
          form.reset();
          setStatus("Thanks! We received your enquiry and will reply within one working day.", "ok");
        })
        .catch(function () {
          setStatus("Something went wrong. Please email hello@novapixelsoftware.com directly.", "err");
        })
        .finally(function () {
          if (btn) { btn.disabled = false; btn.textContent = label; }
        });
    });
  }
})();
