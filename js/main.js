/* ============================================================
   ASKAMORE — script des pages publiques
   ============================================================ */
(function () {
  const $  = (sel, root) => (root || document).querySelector(sel);
  const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Navigation ---------- */
  function initNav() {
    const nav = $(".nav");
    const toTop = $(".to-top");
    const onScroll = () => {
      const y = window.scrollY;
      if (nav) nav.classList.toggle("scrolled", y > 30);
      if (toTop) toTop.classList.toggle("show", y > 600);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    const burger = $(".burger");
    const menu = $(".mobile-menu");
    if (burger && menu) {
      burger.addEventListener("click", () => {
        const open = menu.classList.toggle("open");
        burger.setAttribute("aria-expanded", open ? "true" : "false");
      });
      $$("a", menu).forEach(a => a.addEventListener("click", () => {
        menu.classList.remove("open");
        burger.setAttribute("aria-expanded", "false");
      }));
    }
  }

  /* ---------- Apparition au défilement ---------- */
  function initReveal() {
    const items = $$(".reveal");
    if (!items.length) return;
    if (!("IntersectionObserver" in window) || reduceMotion) {
      items.forEach(el => el.classList.add("in"));
      return;
    }
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
      });
    }, { threshold: 0.12 });
    items.forEach(el => io.observe(el));
  }

  /* ---------- Galerie vivante : défilement automatique ---------- */
  function initLivePanels(content) {
    const panels = $$(".live-panel");
    panels.forEach((panel, index) => {
      const cat = panel.dataset.cat;
      const meta = ASKAMORE.CATEGORIES[cat];
      const photos = (content.photos[cat] || []);
      const counter = $(".live-counter", panel);

      if (!photos.length) {
        const empty = document.createElement("div");
        empty.className = "live-empty";
        empty.innerHTML = '<span>Photos à venir</span>';
        panel.insertBefore(empty, panel.firstChild);
        if (counter) counter.remove();
        return;
      }

      const slides = photos.map((p, i) => {
        const s = document.createElement("div");
        s.className = "slide" + (i === 0 ? " active" : "");
        const img = document.createElement("img");
        img.src = p.src;
        img.alt = p.caption || (meta.label + " — photo " + (i + 1));
        img.loading = i === 0 ? "eager" : "lazy";
        s.appendChild(img);
        return s;
      });
      slides.slice().reverse().forEach(s => panel.insertBefore(s, panel.firstChild));

      let current = 0;
      const setCounter = () => {
        if (counter) counter.textContent = (current + 1) + " / " + photos.length;
      };
      setCounter();

      if (photos.length < 2 || reduceMotion) return;

      let timer = null;
      let visible = true;
      let hovered = false;
      const next = () => {
        slides[current].classList.remove("active");
        current = (current + 1) % slides.length;
        slides[current].classList.add("active");
        setCounter();
      };
      const start = () => {
        if (timer || !visible || hovered) return;
        timer = setInterval(next, 4200);
      };
      const stop = () => { clearInterval(timer); timer = null; };

      panel.addEventListener("mouseenter", () => { hovered = true; stop(); });
      panel.addEventListener("mouseleave", () => { hovered = false; start(); });

      if ("IntersectionObserver" in window) {
        new IntersectionObserver(entries => {
          entries.forEach(e => {
            visible = e.isIntersecting;
            visible ? start() : stop();
          });
        }, { threshold: 0.2 }).observe(panel);
      }
      /* Départ décalé pour que les quatre vitrines ne changent pas en même temps */
      setTimeout(start, 400 + index * 900);
    });
  }

  /* ---------- Photo « À propos de nous » ---------- */
  function initAboutPhoto(content) {
    const holder = $("#about-photo");
    if (!holder) return;
    if (content.aboutPhoto) {
      holder.innerHTML = "";
      const img = document.createElement("img");
      img.src = content.aboutPhoto;
      img.alt = "Flavie et Gökan — Askamore Photography";
      holder.appendChild(img);
    }
  }

  /* ---------- Avis ---------- */
  const SERVICE_LABELS = {
    mariage: "Mariage", fiancailles: "Fiançailles",
    evenement: "Autre événement", seance: "Séance photo"
  };

  function renderReviews(content) {
    const list = $("#avis-list");
    const scoreEl = $("#avis-score");
    const starsEl = $("#avis-stars");
    const countEl = $("#avis-count");
    const emptyEl = $("#avis-empty");
    if (!list) return;

    const reviews = content.reviews || [];
    const n = reviews.length;
    const avg = n ? reviews.reduce((s, r) => s + r.rating, 0) / n : 5;
    if (scoreEl) scoreEl.textContent = avg.toFixed(1);
    if (starsEl) starsEl.textContent = "★".repeat(Math.round(avg)) + "☆".repeat(5 - Math.round(avg));
    if (countEl) countEl.textContent = n + (n > 1 ? " avis" : " avis");
    if (emptyEl) emptyEl.style.display = n ? "none" : "";

    list.innerHTML = "";
    reviews.forEach(r => {
      const card = document.createElement("article");
      card.className = "avis-card";
      const date = r.date ? new Date(r.date).toLocaleDateString("fr-FR", { year: "numeric", month: "long" }) : "";
      card.innerHTML =
        '<div class="top"><span class="who"></span><span class="avis-stars"></span></div>' +
        '<div class="meta"></div><p class="txt"></p>';
      $(".who", card).textContent = r.name;
      $(".avis-stars", card).textContent = "★".repeat(r.rating) + "☆".repeat(5 - r.rating);
      $(".meta", card).textContent = [SERVICE_LABELS[r.service] || r.service, date].filter(Boolean).join(" · ");
      $(".txt", card).textContent = r.text;
      list.appendChild(card);
    });
  }

  function initReviewForm(content) {
    const form = $("#avis-form");
    if (!form) return;
    let rating = 5;
    const starBtns = $$(".stars-input button", form);
    const paint = () => starBtns.forEach((b, i) => b.classList.toggle("on", i < rating));
    starBtns.forEach((b, i) => b.addEventListener("click", () => { rating = i + 1; paint(); }));
    paint();

    form.addEventListener("submit", async e => {
      e.preventDefault();
      const name = $("#avis-name").value.trim();
      const service = $("#avis-service").value;
      const text = $("#avis-text").value.trim();
      const ok = $("#avis-merci");
      if (!name || !text) return;
      const btn = form.querySelector('button[type="submit"]');
      btn.disabled = true;
      try {
        await ASKAMORE.addReview({ name, service, rating, text });
        content.reviews.unshift({ id: "tmp-" + Date.now(), name, service, rating, text, date: new Date().toISOString() });
        renderReviews(content);
        form.reset();
        rating = 5; paint();
        if (ok) {
          ok.textContent = "Merci pour votre avis !";
          ok.style.color = "var(--champagne)";
          ok.style.display = "block";
          setTimeout(() => ok.style.display = "none", 5000);
        }
      } catch (err) {
        if (ok) {
          ok.textContent = "Impossible d'envoyer l'avis pour le moment. Réessayez plus tard.";
          ok.style.color = "#b0503c";
          ok.style.display = "block";
        }
      } finally {
        btn.disabled = false;
      }
    });
  }

  /* ---------- Formulaire de contact (ouvre l'application e-mail) ---------- */
  function initContactForm() {
    const form = $("#contact-form");
    if (!form) return;
    form.addEventListener("submit", e => {
      e.preventDefault();
      const v = id => ($("#" + id) ? $("#" + id).value.trim() : "");
      const subject = "Demande de renseignement — " + (v("c-type") || "Prestation");
      const body =
        "Nom : " + v("c-name") +
        "\nE-mail : " + v("c-email") +
        "\nPrestation : " + v("c-type") +
        "\nDate de l'événement : " + v("c-date") +
        "\nLocalisation : " + v("c-lieu") +
        "\n\nMessage :\n" + v("c-msg");
      window.location.href = "mailto:askamorephotography@outlook.fr" +
        "?subject=" + encodeURIComponent(subject) +
        "&body=" + encodeURIComponent(body);
    });
  }

  /* ---------- Démarrage ---------- */
  document.addEventListener("DOMContentLoaded", async () => {
    initNav();
    initReveal();
    initContactForm();
    if (document.body.dataset.page === "home") {
      const content = await ASKAMORE.loadContent();
      initAboutPhoto(content);
      initLivePanels(content);
      renderReviews(content);
      initReviewForm(content);
    }
  });
})();
