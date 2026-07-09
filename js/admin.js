/* ============================================================
   ASKAMORE — espace admin (Supabase)
   Connexion par e-mail + mot de passe. Toute modification est
   enregistrée en ligne et visible immédiatement par tous.
   ============================================================ */
(function () {
  const $  = (sel, root) => (root || document).querySelector(sel);
  const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));

  let content = ASKAMORE.emptyContent();
  let activeTab = "dash";
  const sb = () => ASKAMORE.sb();
  const BUCKET = "photos";

  /* ---------- Notifications ---------- */
  let toastTimer = null;
  function toast(msg, isError) {
    const el = $("#toast");
    el.textContent = msg;
    el.classList.toggle("err", !!isError);
    el.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove("show"), 3600);
  }
  function failMsg(error, fallback) {
    return (error && error.message) ? fallback + " (" + error.message + ")" : fallback;
  }

  /* ---------- Aides Supabase ---------- */
  async function uploadBlob(path, blob) {
    const up = await sb().storage.from(BUCKET).upload(path, blob, { contentType: "image/jpeg" });
    if (up.error) throw up.error;
    return sb().storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
  }
  async function removeFile(path) {
    if (!path) return;
    try { await sb().storage.from(BUCKET).remove([path]); } catch (e) { /* non bloquant */ }
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
    render();
  }
  function configMissing() {
    if (sb()) return false;
    $("#login-error").textContent =
      "Configuration manquante : renseignez l'adresse du projet et la clé dans le fichier js/config.js.";
    return true;
  }

  function initLogin() {
    $("#login-form").addEventListener("submit", async e => {
      e.preventDefault();
      const err = $("#login-error");
      err.textContent = "";
      if (configMissing()) return;
      const { error } = await sb().auth.signInWithPassword({
        email: $("#login-email").value.trim(),
        password: $("#login-pass").value
      });
      if (error) {
        err.textContent = "E-mail ou mot de passe incorrect.";
        return;
      }
      $("#login-pass").value = "";
      showDashboard();
    });
    $("#btn-logout").addEventListener("click", async () => {
      try { await sb().auth.signOut(); } catch (e) { /* ignoré */ }
      showLogin();
    });
  }

  async function checkSession() {
    if (!sb()) { showLogin(); configMissing(); return; }
    try {
      const { data } = await sb().auth.getSession();
      data && data.session ? showDashboard() : showLogin();
    } catch (e) { showLogin(); }
  }

  /* ---------- Onglets ---------- */
  function initTabs() {
    $$(".admin-nav button").forEach(btn => {
      btn.addEventListener("click", () => { activeTab = btn.dataset.tab; render(); });
    });
  }
  function render() {
    $$(".admin-nav button").forEach(b => b.classList.toggle("active", b.dataset.tab === activeTab));
    $$(".admin-panel").forEach(p => p.style.display = p.dataset.panel === activeTab ? "" : "none");
    if (activeTab === "dash") renderDash();
    else if (activeTab === "about") renderAbout();
    else if (ASKAMORE.CATEGORIES[activeTab]) renderGalleryTab(activeTab);
    else if (activeTab === "avis") renderAvis();
  }

  /* ---------- Tableau de bord ---------- */
  function renderDash() {
    const counts = {
      mariage: content.photos.mariage.length,
      fiancailles: content.photos.fiancailles.length,
      seance: content.photos.seance.length,
      evenement: content.photos.evenement.length
    };
    $("#ph-mariage").textContent = counts.mariage;
    $("#ph-fiancailles").textContent = counts.fiancailles;
    $("#ph-seance").textContent = counts.seance;
    $("#ph-evenement").textContent = counts.evenement;
    $("#ph-total").textContent = counts.mariage + counts.fiancailles + counts.seance + counts.evenement;
    $("#n-avis").textContent = content.reviews.length;
    $("#about-state").textContent = content.aboutPhoto ? "✓" : "—";
    loadVisitStats();
  }

  async function loadVisitStats() {
    const note = $("#visits-note");
    note.textContent = "";
    try {
      const now = new Date();
      const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
      const d7 = new Date(now.getTime() - 7 * 86400000).toISOString();
      const d30 = new Date(now.getTime() - 30 * 86400000).toISOString();
      const q = gte => {
        let r = sb().from("visits").select("id", { count: "exact", head: true });
        if (gte) r = r.gte("created_at", gte);
        return r;
      };
      const [t, dj, w, m] = await Promise.all([q(null), q(startToday), q(d7), q(d30)]);
      if (t.error || dj.error || w.error || m.error) throw (t.error || dj.error || w.error || m.error);
      $("#v-today").textContent = dj.count || 0;
      $("#v-week").textContent = w.count || 0;
      $("#v-month").textContent = m.count || 0;
      $("#v-total").textContent = t.count || 0;
      note.textContent = "Comptage anonyme : une visite = un navigateur par session, depuis l'activation du compteur.";
    } catch (err) {
      ["v-today", "v-week", "v-month", "v-total"].forEach(id => $("#" + id).textContent = "—");
      note.textContent = "Compteur non activé : exécutez le script visites.sql dans Supabase (SQL Editor) pour créer la table des visites.";
      note.style.color = "#b0503c";
    }
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
      holder.innerHTML = '<div class="about-photo-empty">' +
        '<span class="mono">F · G</span>' +
        '<span>Aucune photo</span></div>';
      $("#btn-about-delete").style.display = "none";
    }
  }

  function initAbout() {
    $("#input-about").addEventListener("change", async e => {
      const file = e.target.files[0];
      e.target.value = "";
      if (!file) return;
      toast("Envoi de la photo en cours…");
      try {
        const blob = await ASKAMORE.compressImage(file, 1400, 0.84);
        const path = "about/about-" + ASKAMORE.uid() + ".jpg";
        const url = await uploadBlob(path, blob);
        const { error } = await sb().from("settings").upsert([
          { key: "about_photo", value: url },
          { key: "about_photo_path", value: path }
        ]);
        if (error) throw error;
        await removeFile(content.aboutPath);
        content.aboutPhoto = url;
        content.aboutPath = path;
        toast("Photo « À propos » mise à jour — visible par tous.");
        renderAbout();
      } catch (err) {
        toast(failMsg(err, "Impossible d'envoyer cette photo."), true);
      }
    });
    $("#btn-about-delete").addEventListener("click", async () => {
      if (!confirm("Supprimer la photo de la section « À propos de nous » ?")) return;
      try {
        const { error } = await sb().from("settings").upsert([
          { key: "about_photo", value: null },
          { key: "about_photo_path", value: null }
        ]);
        if (error) throw error;
        await removeFile(content.aboutPath);
        content.aboutPhoto = null;
        content.aboutPath = null;
        toast("Photo supprimée.");
        renderAbout();
      } catch (err) {
        toast(failMsg(err, "Suppression impossible."), true);
      }
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
      input.addEventListener("change", async () => {
        try {
          const { error } = await sb().from("photos").update({ caption: input.value.trim() }).eq("id", p.id);
          if (error) throw error;
          p.caption = input.value.trim();
          toast("Légende enregistrée.");
        } catch (err) {
          toast(failMsg(err, "Enregistrement impossible."), true);
        }
      });
      mid.appendChild(input);
      row.appendChild(mid);

      const actions = document.createElement("div");
      actions.className = "item-actions";
      actions.appendChild(iconBtn("↑", "Monter", () => move(cat, i, -1)));
      actions.appendChild(iconBtn("↓", "Descendre", () => move(cat, i, 1)));
      actions.appendChild(iconBtn("✕", "Supprimer", async () => {
        if (!confirm("Supprimer cette photo ?")) return;
        try {
          const { error } = await sb().from("photos").delete().eq("id", p.id);
          if (error) throw error;
          await removeFile(p.path);
          photos.splice(i, 1);
          toast("Photo supprimée.");
          renderGalleryTab(cat);
        } catch (err) {
          toast(failMsg(err, "Suppression impossible."), true);
        }
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

  async function move(cat, i, dir) {
    const arr = content.photos[cat];
    const j = i + dir;
    if (j < 0 || j >= arr.length) return;
    const a = arr[i], b = arr[j];
    const posA = a.position, posB = b.position;
    try {
      const r1 = await sb().from("photos").update({ position: posB }).eq("id", a.id);
      const r2 = await sb().from("photos").update({ position: posA }).eq("id", b.id);
      if (r1.error || r2.error) throw (r1.error || r2.error);
      a.position = posB; b.position = posA;
      [arr[i], arr[j]] = [arr[j], arr[i]];
      renderGalleryTab(cat);
    } catch (err) {
      toast(failMsg(err, "Déplacement impossible."), true);
    }
  }

  async function addPhotoToCategory(cat, blob, caption) {
    const path = cat + "/" + ASKAMORE.uid() + ".jpg";
    const url = await uploadBlob(path, blob);
    const arr = content.photos[cat];
    const position = arr.length ? Math.max.apply(null, arr.map(p => p.position || 0)) + 1 : 1;
    const ins = await sb().from("photos")
      .insert({ category: cat, url: url, path: path, caption: caption || "", position: position })
      .select().single();
    if (ins.error) throw ins.error;
    arr.push({ id: ins.data.id, src: url, path: path, caption: caption || "", position: position });
  }

  function initGalleryInputs() {
    Object.keys(ASKAMORE.CATEGORIES).forEach(cat => {
      const input = $("#input-" + cat);
      if (!input) return;
      input.addEventListener("change", async e => {
        const files = Array.from(e.target.files || []);
        e.target.value = "";
        if (!files.length) return;
        let added = 0;
        for (const file of files) {
          toast("Envoi " + (added + 1) + " / " + files.length + "…");
          try {
            const blob = await ASKAMORE.compressImage(file, 1600, 0.82);
            await addPhotoToCategory(cat, blob, "");
            added++;
            renderGalleryTab(cat);
          } catch (err) {
            toast(failMsg(err, "Une photo n'a pas pu être envoyée."), true);
          }
        }
        if (added) toast(added + " photo(s) en ligne dans « " + ASKAMORE.CATEGORIES[cat].label + " » — visibles par tous.");
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
      actions.appendChild(iconBtn("✕", "Supprimer cet avis", async () => {
        if (!confirm("Supprimer cet avis ?")) return;
        try {
          const { error } = await sb().from("reviews").delete().eq("id", r.id);
          if (error) throw error;
          content.reviews.splice(i, 1);
          toast("Avis supprimé.");
          renderAvis();
        } catch (err) {
          toast(failMsg(err, "Suppression impossible."), true);
        }
      }, true));
      row.appendChild(actions);
      list.appendChild(row);
    });
  }

  /* ---------- Onglet Sauvegarde : import de l'ancienne version ---------- */
  function setBackupStatus(msg, isError) {
    const el = $("#backup-status");
    el.textContent = msg;
    el.style.color = isError ? "#b0503c" : "var(--champagne)";
  }

  async function importLegacy(data) {
    const normPhotos = (data && data.photos && typeof data.photos === "object") ? data.photos : {};
    const cats = Object.keys(ASKAMORE.CATEGORIES);
    let total = 0;
    cats.forEach(c => { total += Array.isArray(normPhotos[c]) ? normPhotos[c].length : 0; });
    if (data && typeof data.aboutPhoto === "string" && data.aboutPhoto) total++;
    const reviews = Array.isArray(data && data.reviews) ? data.reviews : [];
    if (!total && !reviews.length) {
      setBackupStatus("Aucune photo ni avis trouvés dans cette sauvegarde.", true);
      return;
    }
    if (!confirm("Envoyer en ligne " + total + " photo(s) et " + reviews.length + " avis ? Les photos déjà en ligne sont conservées.")) return;

    let done = 0, failed = 0;
    for (const cat of cats) {
      const arr = Array.isArray(normPhotos[cat]) ? normPhotos[cat] : [];
      for (const p of arr) {
        if (!p || typeof p.src !== "string") continue;
        setBackupStatus("Envoi des photos : " + (done + 1) + " / " + total + "…");
        try {
          const blob = await (await fetch(p.src)).blob();
          await addPhotoToCategory(cat, blob, p.caption || "");
          done++;
        } catch (e) { failed++; }
      }
    }
    if (data && typeof data.aboutPhoto === "string" && data.aboutPhoto) {
      setBackupStatus("Envoi de la photo « À propos »…");
      try {
        const blob = await (await fetch(data.aboutPhoto)).blob();
        const path = "about/about-" + ASKAMORE.uid() + ".jpg";
        const url = await uploadBlob(path, blob);
        await sb().from("settings").upsert([
          { key: "about_photo", value: url },
          { key: "about_photo_path", value: path }
        ]);
        content.aboutPhoto = url;
        content.aboutPath = path;
        done++;
      } catch (e) { failed++; }
    }
    for (const r of reviews) {
      if (!r || !r.name || !r.text) continue;
      try {
        await sb().from("reviews").insert({
          name: String(r.name), service: String(r.service || ""),
          rating: Math.min(5, Math.max(1, parseInt(r.rating, 10) || 5)),
          text: String(r.text)
        });
      } catch (e) { /* avis ignoré */ }
    }
    content = await ASKAMORE.loadContent();
    render();
    setBackupStatus(failed
      ? done + " élément(s) importé(s), " + failed + " en échec."
      : "Import terminé : tout est en ligne et visible par les visiteurs.", failed > 0);
    toast("Import terminé.");
  }

  function initBackup() {
    $("#btn-import-local").addEventListener("click", () => {
      let old = null;
      try { old = JSON.parse(localStorage.getItem("askamore_content_v1") || "null"); } catch (e) { old = null; }
      if (!old) {
        setBackupStatus("Aucune donnée de l'ancienne version dans ce navigateur.", true);
        return;
      }
      importLegacy(old);
    });
    $("#input-import").addEventListener("change", e => {
      const file = e.target.files[0];
      e.target.value = "";
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        try { importLegacy(JSON.parse(reader.result)); }
        catch (err) { setBackupStatus("Fichier invalide : impossible de le lire.", true); }
      };
      reader.readAsText(file);
    });
    $("#btn-export").addEventListener("click", () => {
      const data = {
        photos: content.photos, aboutPhoto: content.aboutPhoto,
        reviews: content.reviews, exportedAt: new Date().toISOString()
      };
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "sauvegarde-askamore.json";
      a.click();
      URL.revokeObjectURL(a.href);
      toast("Copie de secours téléchargée.");
    });
  }

  /* ---------- Onglet Sécurité ---------- */
  function initSecurity() {
    $("#pass-form").addEventListener("submit", async e => {
      e.preventDefault();
      const n1 = $("#pass-new").value;
      const n2 = $("#pass-new2").value;
      const err = $("#pass-error");
      err.textContent = "";
      if (n1.length < 8) { err.textContent = "Le mot de passe doit contenir au moins 8 caractères."; return; }
      if (n1 !== n2) { err.textContent = "Les deux saisies ne correspondent pas."; return; }
      const { error } = await sb().auth.updateUser({ password: n1 });
      if (error) { err.textContent = "Modification impossible : " + error.message; return; }
      e.target.reset();
      toast("Mot de passe modifié.");
    });
  }

  /* ---------- Démarrage ---------- */
  document.addEventListener("DOMContentLoaded", () => {
    initLogin();
    initTabs();
    initAbout();
    initGalleryInputs();
    initBackup();
    initSecurity();
    checkSession();
  });
})();
