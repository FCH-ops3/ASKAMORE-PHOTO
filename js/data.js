/* ============================================================
   ASKAMORE — couche de données partagée
   Les photos ajoutées via l'espace admin sont enregistrées dans
   le navigateur (localStorage). Pour les publier pour tous les
   visiteurs : Espace admin → Publication → Exporter, puis
   remplacer le fichier data/photos.json dans le dépôt GitHub.
   ============================================================ */

window.ASKAMORE = (function () {
  const CONTENT_KEY = "askamore_content_v1";
  const REVIEWS_KEY = "askamore_reviews_v1";
  const PASS_KEY    = "askamore_admin_pass_v1";
  const SESSION_KEY = "askamore_admin_session";
  const DEFAULT_PASSWORD = "askamore2026"; // modifiable depuis l'espace admin

  const CATEGORIES = {
    mariage:     { label: "Mariage",         page: "mariage.html",      numeral: "I"   },
    fiancailles: { label: "Fiançailles",     page: "fiancailles.html",  numeral: "II"  },
    evenement:   { label: "Autre événement", page: "gender-reveal.html", numeral: "III" },
    seance:      { label: "Séance photo",    page: "seance-photo.html", numeral: "IV"  }
  };

  const PLACEHOLDERS = {
    mariage:     ["Préparatifs", "Cérémonie", "Échange des vœux", "Portrait des mariés", "Cocktail", "Réception", "Première danse", "Détails"],
    fiancailles: ["Balade", "Regards", "Rires", "Duo", "Portrait", "Détails de la bague", "Coucher de soleil", "Nature"],
    evenement:   ["Surprise", "Explosion de couleurs", "Émotion", "Réactions", "Famille", "Fête", "Détails", "Souvenirs"],
    seance:      ["Portrait", "Couple", "Famille", "Lifestyle", "Studio", "Extérieur", "Lumière naturelle", "Détails"]
  };

  function emptyContent() {
    return {
      photos: { mariage: [], fiancailles: [], evenement: [], seance: [] },
      aboutPhoto: null,
      reviews: []
    };
  }

  function normalize(raw) {
    const out = emptyContent();
    if (!raw || typeof raw !== "object") return out;
    if (raw.photos && typeof raw.photos === "object") {
      for (const key of Object.keys(out.photos)) {
        if (Array.isArray(raw.photos[key])) {
          out.photos[key] = raw.photos[key]
            .filter(p => p && typeof p.src === "string")
            .map(p => ({ id: p.id || uid(), src: p.src, caption: typeof p.caption === "string" ? p.caption : "" }));
        }
      }
    }
    if (typeof raw.aboutPhoto === "string") out.aboutPhoto = raw.aboutPhoto;
    if (Array.isArray(raw.reviews)) {
      out.reviews = raw.reviews.filter(r => r && r.name && r.text).map(r => ({
        id: r.id || uid(),
        name: String(r.name),
        service: String(r.service || ""),
        rating: Math.min(5, Math.max(1, parseInt(r.rating, 10) || 5)),
        text: String(r.text),
        date: r.date || new Date().toISOString()
      }));
    }
    return out;
  }

  /* Contenu du site : localStorage (admin) sinon data/photos.json (publié) */
  async function loadContent() {
    try {
      const raw = localStorage.getItem(CONTENT_KEY);
      if (raw) return normalize(JSON.parse(raw));
    } catch (e) { /* ignoré */ }
    try {
      const res = await fetch("data/photos.json", { cache: "no-store" });
      if (res.ok) return normalize(await res.json());
    } catch (e) { /* fichier absent ou ouverture locale */ }
    return emptyContent();
  }

  function saveContent(content) {
    localStorage.setItem(CONTENT_KEY, JSON.stringify(content)); // peut lever une erreur de quota
  }

  /* Avis déposés depuis ce navigateur (visiteurs) */
  function localReviews() {
    try {
      const arr = JSON.parse(localStorage.getItem(REVIEWS_KEY) || "[]");
      return Array.isArray(arr) ? arr : [];
    } catch (e) { return []; }
  }
  function saveLocalReviews(arr) {
    localStorage.setItem(REVIEWS_KEY, JSON.stringify(arr));
  }
  function mergedReviews(content) {
    const seen = new Set();
    return [...(content.reviews || []), ...localReviews()]
      .filter(r => {
        if (!r || !r.id || seen.has(r.id)) return false;
        seen.add(r.id);
        return true;
      })
      .sort((a, b) => String(b.date || "").localeCompare(String(a.date || "")));
  }

  /* Mot de passe admin (haché, propre à ce navigateur) */
  async function sha256(str) {
    if (!(window.crypto && crypto.subtle)) return "plain:" + str;
    const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(str));
    return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, "0")).join("");
  }
  async function checkPassword(pw) {
    const stored = localStorage.getItem(PASS_KEY);
    if (stored) return (await sha256(pw)) === stored;
    return pw === DEFAULT_PASSWORD;
  }
  async function setPassword(pw) {
    localStorage.setItem(PASS_KEY, await sha256(pw));
  }

  function uid() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  }

  /* Compression d'image côté navigateur avant enregistrement */
  function compressImage(file, maxDim = 1600, quality = 0.82) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error("Lecture du fichier impossible."));
      reader.onload = () => {
        const img = new Image();
        img.onerror = () => reject(new Error("Ce fichier n'est pas une image valide."));
        img.onload = () => {
          const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
          const w = Math.max(1, Math.round(img.width * scale));
          const h = Math.max(1, Math.round(img.height * scale));
          const canvas = document.createElement("canvas");
          canvas.width = w; canvas.height = h;
          canvas.getContext("2d").drawImage(img, 0, 0, w, h);
          resolve(canvas.toDataURL("image/jpeg", quality));
        };
        img.src = reader.result;
      };
      reader.readAsDataURL(file);
    });
  }

  return {
    CONTENT_KEY, REVIEWS_KEY, SESSION_KEY, DEFAULT_PASSWORD,
    CATEGORIES, PLACEHOLDERS,
    emptyContent, normalize, loadContent, saveContent,
    localReviews, saveLocalReviews, mergedReviews,
    sha256, checkPassword, setPassword, uid, compressImage
  };
})();
