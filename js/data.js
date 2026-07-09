/* ============================================================
   ASKAMORE — couche de données (Supabase)
   Photos et avis sont enregistrés en ligne : toute modification
   faite dans l'espace admin est immédiatement visible par tous
   les visiteurs, depuis n'importe quel appareil.
   ============================================================ */

window.ASKAMORE = (function () {

  const CATEGORIES = {
    mariage:     { label: "Mariage",         page: "mariage.html",       numeral: "I"   },
    fiancailles: { label: "Fiançailles",     page: "fiancailles.html",   numeral: "II"  },
    evenement:   { label: "Autre événement", page: "gender-reveal.html", numeral: "III" },
    seance:      { label: "Séance photo",    page: "seance-photo.html",  numeral: "IV"  }
  };

  const PLACEHOLDERS = {
    mariage:     ["Préparatifs", "Cérémonie", "Échange des vœux", "Portrait des mariés", "Cocktail", "Réception", "Première danse", "Détails"],
    fiancailles: ["Balade", "Regards", "Rires", "Duo", "Portrait", "Détails de la bague", "Coucher de soleil", "Nature"],
    evenement:   ["Surprise", "Explosion de couleurs", "Émotion", "Réactions", "Famille", "Fête", "Détails", "Souvenirs"],
    seance:      ["Portrait", "Couple", "Famille", "Lifestyle", "Studio", "Extérieur", "Lumière naturelle", "Détails"]
  };

  let client = null;

  /* Client Supabase (null si la configuration n'est pas remplie) */
  function sb() {
    if (client) return client;
    const cfg = window.ASKAMORE_CONFIG || {};
    if (!window.supabase || !cfg.url || !cfg.anonKey ||
        cfg.url.indexOf("A-REMPLACER") !== -1 || cfg.anonKey.indexOf("A-REMPLACER") !== -1) {
      return null;
    }
    client = window.supabase.createClient(cfg.url, cfg.anonKey);
    return client;
  }

  function emptyContent() {
    return {
      photos: { mariage: [], fiancailles: [], evenement: [], seance: [] },
      aboutPhoto: null,
      aboutPath: null,
      reviews: []
    };
  }

  /* Charge tout le contenu du site depuis Supabase */
  async function loadContent() {
    const out = emptyContent();
    const s = sb();
    if (!s) {
      console.warn("Askamore : configuration Supabase manquante (js/config.js).");
      return out;
    }
    try {
      const [ph, st, rv] = await Promise.all([
        s.from("photos").select("*").order("position", { ascending: true }).order("created_at", { ascending: true }),
        s.from("settings").select("*"),
        s.from("reviews").select("*").order("created_at", { ascending: false })
      ]);
      if (ph.data) {
        ph.data.forEach(p => {
          if (out.photos[p.category]) {
            out.photos[p.category].push({
              id: p.id, src: p.url, path: p.path || "",
              caption: p.caption || "", position: p.position || 0
            });
          }
        });
      }
      if (st.data) {
        const photo = st.data.find(x => x.key === "about_photo");
        const path  = st.data.find(x => x.key === "about_photo_path");
        if (photo && photo.value) out.aboutPhoto = photo.value;
        if (path && path.value) out.aboutPath = path.value;
      }
      if (rv.data) {
        out.reviews = rv.data.map(r => ({
          id: r.id, name: r.name, service: r.service || "",
          rating: Math.min(5, Math.max(1, r.rating || 5)),
          text: r.text, date: r.created_at
        }));
      }
    } catch (e) {
      console.warn("Askamore : lecture Supabase impossible.", e);
    }
    return out;
  }

  /* Dépôt d'un avis par un visiteur */
  async function addReview(review) {
    const s = sb();
    if (!s) throw new Error("Connexion à la base impossible.");
    const { error } = await s.from("reviews").insert({
      name: review.name, service: review.service,
      rating: review.rating, text: review.text
    });
    if (error) throw error;
  }

  /* Compte une visite (anonyme : ni cookie, ni identifiant personnel) */
  function trackVisit() {
    try {
      const s = sb();
      if (!s) return;
      if (sessionStorage.getItem("askamore_visit")) return;
      sessionStorage.setItem("askamore_visit", "1");
      const page = location.pathname.split("/").pop() || "index.html";
      s.from("visits").insert({ page: page }).then(function () {});
    } catch (e) { /* jamais bloquant */ }
  }

  function uid() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  }

  /* Compression d'image côté navigateur avant envoi (renvoie un Blob JPEG) */
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
          canvas.toBlob(
            b => b ? resolve(b) : reject(new Error("Compression impossible.")),
            "image/jpeg", quality
          );
        };
        img.src = reader.result;
      };
      reader.readAsDataURL(file);
    });
  }

  return { CATEGORIES, PLACEHOLDERS, sb, emptyContent, loadContent, addReview, trackVisit, uid, compressImage };
})();
