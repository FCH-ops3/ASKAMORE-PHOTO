/* ============================================================
   ASKAMORE — espace admin
   Onglets : Accueil (photo À propos), 4 galeries, Avis,
   Publication & sauvegarde, Sécurité.
   ============================================================ */
(function () {
  const $  = (sel, root) => (root || document).querySelector(sel);
  const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));

  let content = ASKAMORE.emptyContent();
  let activeTab = "about";

  /* ---------- Notifications ---------- */
  let toastTimer = null;
  function toast(msg, isError) {
    const el = $("#toast");
    el.textContent = msg;
    el.classList.toggle("err", !!isError);
    el.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove("show"), 3200);
  }

  function persist() {
    try {
      ASKAMORE.saveContent(content);
      return true;
    } catch (e) {
      toast("Stockage du navigateur plein : supprimez quelques photos ou exportez vos données.", true);
      return false;
    }
  }

  /* ---------- Connexion ---------- */
  function showLogin() {
    $("#admin-login").style.display = "";
    $("#admin-shell").classList.remove("on");
  }
  async function showDashboard() {
    $("#admin-login").style.display = "none";
    $("#admin-shell").classList.add("on");
    content = await ASKAMORE.loadContent();
    /* Intègre les avis déposés depuis ce navigateur dans le contenu géré */
    const merged = ASKAMORE.mergedReviews(content);
    if (merged.length !== (content.reviews || []).length) {
      content.reviews = merged;
    }
    render();
  }

  function initLogin() {
    const form = $("#login-form");
    form.addEventListener("submit", async e => {
      e.preventDefault();
      const pw = $("#login-pass").value;
      const err = $("#login-error");
      err.textContent = "";
      if (await ASKAMORE.checkPassword(pw)) {
        sessionStorage.setItem(ASKAMORE.SESSION_KEY, "1");
        $("#login-pass").value = "";
        showDashboard();
      } else {
        err.textContent = "Mot de passe incorrect.";
      }
    });
    $("#btn-logout").addEventListener("click", () => {
      sessionStorage.removeItem(ASKAMORE.SESSION_KEY);
      showLogin();
    });
  }

  /* ---------- Onglets ---------- */
  function initTabs() {
    $$(".admin-nav button").forEach(btn => {
      btn.addEventListener("click", () => {
        activeTab = btn.dataset.tab;
        render();
      });
    });
  }

  function render() {
    $$(".admin-nav button").forEach(b => b.classList.toggle("active", b.dataset.tab === activeTab));
    $$(".admin-panel").forEach(p => p.style.display = p.dataset.panel === activeTab ? "" : "none");
    if (activeTab === "about") renderAbout();
    else if (ASKAMORE.CATEGORIES[activeTab]) renderGalleryTab(activeTab);
    else if (activeTab === "avis") renderAvis();
    else if (activeTab === "publish") renderPublish();
  }

  /* ---------- Onglet Accueil : photo « À propos de nous » ---------- */
  function renderAbout() {
    const holder = $("#about-admin-photo");
    holder.innerHTML = "";
    if (content.aboutPhoto) {
      const img = document.createElement("img");
      img.src = content.aboutPhoto;
      img.alt = "Photo de la section À propos";
      holder.appendChild(img);
      $("#btn-about-delete").style.display = "";
    } else {
      holder.innerHTML = '<div class="about-photo-empty" style="border-color:var(--line)">' +
        '<span class="mono" style="color:var(--champagne)">F · G</span>' +
        '<span style="color:var(--stone)">Aucune photo</span></div>';
      $("#btn-about-delete").style.display = "none";
    }
  }

  function initAbout() {
    $("#input-about").addEventListener("change", async e => {
      const file = e.target.files[0];
      e.target.value = "";
      if (!file) return;
      try {
        content.aboutPhoto = await ASKAMORE.compressImage(file, 1400, 0.84);
        if (persist()) toast("Photo « À propos » mise à jour.");
        renderAbout();
      } catch (err) {
        toast(err.message || "Impossible de lire cette image.", true);
      }
    });
    $("#btn-about-delete").addEventListener("click", () => {
      if (!confirm("Supprimer la photo de la section « À propos de nous » ?")) return;
      content.aboutPhoto = null;
      if (persist()) toast("Photo supprimée.");
      renderAbout();
    });
  }

  /* ---------- Onglets galeries ---------- */
  function renderGalleryTab(cat) {
    const panel = $('.admin-panel[data-panel="' + cat + '"]');
    const list = $(".admin-items", panel);
    const photos = content.photos[cat];
    list.innerHTML = "";

    if (!photos.length) {
      list.innerHTML = '<div class="admin-empty">Aucune photo pour le moment.<br>' +
        'Utilisez « Ajouter des photos » ci-dessus — elles apparaîtront dans la galerie ' +
        ASKAMORE.CATEGORIES[cat].label + ' et dans le défilement de la page d\'accueil.</div>';
      return;
    }

    photos.forEach((p, i) => {
      const row = document.createElement("div");
      row.className = "admin-item";

      const img = document.createElement("img");
      img.src = p.src;
      img.alt = p.caption || "Photo " + (i + 1);
      row.appendChild(img);

      const mid = document.createElement("div");
      mid.innerHTML = '<span class="cap-lbl">Légende (facultative)</span>';
      const input = document.createElement("input");
      input.type = "text";
      input.value = p.caption || "";
      input.placeholder = "Ex. : Première danse";
      input.addEventListener("change", () => {
        p.caption = input.value.trim();
        if (persist()) toast("Légende enregistrée.");
      });
      mid.appendChild(input);
      row.appendChild(mid);

      const actions = document.createElement("div");
      actions.className = "item-actions";
      actions.appendChild(iconBtn("↑", "Monter", () => move(cat, i, -1)));
      actions.appendChild(iconBtn("↓", "Descendre", () => move(cat, i, 1)));
      actions.appendChild(iconBtn("✕", "Supprimer", () => {
        if (!confirm("Supprimer cette photo ?")) return;
        photos.splice(i, 1);
        if (persist()) toast("Photo supprimée.");
        renderGalleryTab(cat);
      }, true));
      row.appendChild(actions);

      list.appendChild(row);
    });
  }

  function iconBtn(txt, label, onClick, danger) {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "icon-btn" + (danger ? " danger" : "");
    b.textContent = txt;
    b.title = label;
    b.setAttribute("aria-label", label);
    b.addEventListener("click", onClick);
    return b;
  }

  function move(cat, i, dir) {
    const arr = content.photos[cat];
    const j = i + dir;
    if (j < 0 || j >= arr.length) return;
    [arr[i], arr[j]] = [arr[j], arr[i]];
    if (persist()) renderGalleryTab(cat);
  }

  function initGalleryInputs() {
    Object.keys(ASKAMORE.CATEGORIES).forEach(cat => {
      const input = $("#input-" + cat);
      if (!input) return;
      input.addEventListener("change", async e => {
        const files = Array.from(e.target.files || []);
        e.target.value = "";
        if (!files.length) return;
        toast("Ajout de " + files.length + " photo(s) en cours…");
        let added = 0;
        for (const file of files) {
          try {
            const src = await ASKAMORE.compressImage(file, 1600, 0.82);
            content.photos[cat].push({ id: ASKAMORE.uid(), src, caption: "" });
            added++;
          } catch (err) { /* fichier ignoré */ }
        }
        if (persist()) toast(added + " photo(s) ajoutée(s) à « " + ASKAMORE.CATEGORIES[cat].label + " ».");
        renderGalleryTab(cat);
      });
    });
  }

  /* ---------- Onglet Avis ---------- */
  function renderAvis() {
    const list = $("#admin-avis-list");
    list.innerHTML = "";
    if (!content.reviews.length) {
      list.innerHTML = '<div class="admin-empty">Aucun avis pour le moment.</div>';
      return;
    }
    content.reviews.forEach((r, i) => {
      const row = document.createElement("div");
      row.className = "admin-item";
      row.style.gridTemplateColumns = "1fr auto";
      const mid = document.createElement("div");
      const date = r.date ? new Date(r.date).toLocaleDateString("fr-FR") : "";
      mid.innerHTML = '<span class="cap-lbl"></span><div style="color:var(--ink-soft);font-size:.92rem"></div>';
      $(".cap-lbl", mid).textContent = r.name + " · " + "★".repeat(r.rating) + " · " + date;
      $("div", mid).textContent = r.text;
      row.appendChild(mid);
      const actions = document.createElement("div");
      actions.className = "item-actions";
      actions.appendChild(iconBtn("✕", "Supprimer cet avis", () => {
        if (!confirm("Supprimer cet avis ?")) return;
        content.reviews.splice(i, 1);
        /* retire aussi l'avis de la liste locale du navigateur */
        ASKAMORE.saveLocalReviews(ASKAMORE.localReviews().filter(x => x.id !== r.id));
        if (persist()) toast("Avis supprimé.");
        renderAvis();
      }, true));
      row.appendChild(actions);
      list.appendChild(row);
    });
  }

  /* ---------- Onglet Publication & sauvegarde ---------- */
  function renderPublish() {
    const size = new Blob([JSON.stringify(content)]).size;
    const max = 5 * 1024 * 1024;
    const pct = Math.min(100, Math.round((size / max) * 100));
    $("#gauge-fill").style.width = pct + "%";
    $("#gauge-txt").textContent =
      (size / (1024 * 1024)).toFixed(2) + " Mo utilisés sur environ 5 Mo de stockage navigateur (" + pct + " %).";
  }

  function initPublish() {
    ghFillInputs();
    ["gh-owner", "gh-repo", "gh-branch", "gh-token"].forEach(id => {
      $("#" + id).addEventListener("change", ghReadInputs);
    });
    $("#btn-publish").addEventListener("click", publishOnline);
    $("#btn-pull").addEventListener("click", pullOnline);

    $("#btn-export").addEventListener("click", () => {
      const data = { ...content, updatedAt: new Date().toISOString() };
      const blob = new Blob([JSON.stringify(data)], { type: "application/json" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "photos.json";
      a.click();
      URL.revokeObjectURL(a.href);
      toast("Fichier photos.json téléchargé.");
    });

    $("#input-import").addEventListener("change", e => {
      const file = e.target.files[0];
      e.target.value = "";
      if (!file) return;
      if (!confirm("Importer ce fichier remplacera les photos et avis actuels de ce navigateur. Continuer ?")) return;
      const reader = new FileReader();
      reader.onload = () => {
        try {
          content = ASKAMORE.normalize(JSON.parse(reader.result));
          if (persist()) toast("Données importées.");
          render();
        } catch (err) {
          toast("Fichier invalide : impossible de l'importer.", true);
        }
      };
      reader.readAsText(file);
    });
  }

  /* ---------- Publication en ligne (GitHub) ---------- */
  const GH_KEY = "askamore_github_cfg_v1";

  function ghLoad() {
    try {
      const c = JSON.parse(localStorage.getItem(GH_KEY) || "{}");
      return c && typeof c === "object" ? c : {};
    } catch (e) { return {}; }
  }
  function ghDetect() {
    const out = { owner: "", repo: "", branch: "main" };
    const host = location.hostname;
    if (host.endsWith(".github.io")) {
      out.owner = host.replace(".github.io", "");
      const segs = location.pathname.split("/").filter(Boolean);
      if (segs.length > 1) out.repo = segs[0];
    }
    return out;
  }
  function ghFillInputs() {
    const cfg = Object.assign(ghDetect(), ghLoad());
    $("#gh-owner").value = cfg.owner || "";
    $("#gh-repo").value = cfg.repo || "";
    $("#gh-branch").value = cfg.branch || "main";
    $("#gh-token").value = cfg.token || "";
  }
  function ghReadInputs() {
    const cfg = {
      owner: $("#gh-owner").value.trim(),
      repo: $("#gh-repo").value.trim(),
      branch: $("#gh-branch").value.trim() || "main",
      token: $("#gh-token").value.trim()
    };
    localStorage.setItem(GH_KEY, JSON.stringify(cfg));
    return cfg;
  }
  function blobToBase64(blob) {
    return new Promise((resolve, reject) => {
      const r = new FileReader();
      r.onerror = () => reject(new Error("Encodage impossible."));
      r.onload = () => resolve(String(r.result).split(",")[1]);
      r.readAsDataURL(blob);
    });
  }
  function setPubStatus(msg, isError) {
    const el = $("#publish-status");
    el.textContent = msg;
    el.style.color = isError ? "#b0503c" : "var(--champagne)";
  }

  async function publishOnline() {
    const cfg = ghReadInputs();
    if (!cfg.owner || !cfg.repo || !cfg.token) {
      setPubStatus("Renseignez le compte GitHub, le nom du dépôt et la clé d'accès.", true);
      return;
    }
    const headers = { "Authorization": "Bearer " + cfg.token, "Accept": "application/vnd.github+json" };
    const base = "https://api.github.com/repos/" + cfg.owner + "/" + cfg.repo;
    const btn = $("#btn-publish");
    btn.disabled = true;
    setPubStatus("Publication en cours\u2026");
    try {
      /* 1. Récupère l'empreinte (sha) du fichier photos.json actuel */
      let sha = null;
      const list = await fetch(base + "/contents/data?ref=" + encodeURIComponent(cfg.branch), { headers });
      if (list.ok) {
        const arr = await list.json();
        const f = Array.isArray(arr) ? arr.find(x => x.name === "photos.json") : null;
        if (f) sha = f.sha;
      } else if (list.status === 401) {
        throw new Error("Clé d'accès refusée : vérifiez le jeton collé ci-dessus.");
      } else if (list.status === 404) {
        throw new Error("Dépôt ou dossier data introuvable : vérifiez le compte, le dépôt et l'accès de la clé.");
      } else {
        throw new Error("Impossible de lire le dépôt (code " + list.status + ").");
      }
      /* 2. Envoie la nouvelle version */
      const payload = Object.assign({}, content, { updatedAt: new Date().toISOString() });
      const b64 = await blobToBase64(new Blob([JSON.stringify(payload)]));
      const body = { message: "Mise à jour des photos depuis l'espace admin", content: b64, branch: cfg.branch };
      if (sha) body.sha = sha;
      const res = await fetch(base + "/contents/data/photos.json", {
        method: "PUT", headers, body: JSON.stringify(body)
      });
      if (!res.ok) {
        if (res.status === 401) throw new Error("Clé d'accès refusée : vérifiez le jeton.");
        if (res.status === 404) throw new Error("La clé n'a pas accès en écriture à ce dépôt (permission Contents : Read and write).");
        if (res.status === 409) throw new Error("Conflit de version : cliquez sur « Récupérer la version en ligne » puis republiez.");
        throw new Error("Échec de la publication (code " + res.status + ").");
      }
      setPubStatus("Publié ! Les photos seront visibles par tous les visiteurs dans 1 à 2 minutes.");
      toast("Photos publiées en ligne.");
    } catch (err) {
      setPubStatus(err.message || "Échec de la publication.", true);
      toast("Échec de la publication.", true);
    } finally {
      btn.disabled = false;
    }
  }

  async function pullOnline() {
    if (!confirm("Remplacer les photos de ce navigateur par la version en ligne du site ?")) return;
    try {
      const res = await fetch("data/photos.json?t=" + Date.now(), { cache: "no-store" });
      if (!res.ok) throw new Error();
      content = ASKAMORE.normalize(await res.json());
      if (persist()) toast("Version en ligne récupérée.");
      render();
    } catch (e) {
      toast("Impossible de récupérer la version en ligne.", true);
    }
  }

  /* ---------- Onglet Sécurité ---------- */
  function initSecurity() {
    $("#pass-form").addEventListener("submit", async e => {
      e.preventDefault();
      const cur = $("#pass-current").value;
      const n1 = $("#pass-new").value;
      const n2 = $("#pass-new2").value;
      const err = $("#pass-error");
      err.textContent = "";
      if (!(await ASKAMORE.checkPassword(cur))) { err.textContent = "Mot de passe actuel incorrect."; return; }
      if (n1.length < 6) { err.textContent = "Le nouveau mot de passe doit contenir au moins 6 caractères."; return; }
      if (n1 !== n2) { err.textContent = "Les deux saisies ne correspondent pas."; return; }
      await ASKAMORE.setPassword(n1);
      e.target.reset();
      toast("Mot de passe modifié pour ce navigateur.");
    });
  }

  /* ---------- Démarrage ---------- */
  document.addEventListener("DOMContentLoaded", () => {
    initLogin();
    initTabs();
    initAbout();
    initGalleryInputs();
    initPublish();
    initSecurity();
    if (sessionStorage.getItem(ASKAMORE.SESSION_KEY) === "1") showDashboard();
    else showLogin();
  });
})();
