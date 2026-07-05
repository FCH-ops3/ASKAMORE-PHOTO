/* ============================================================
   ASKAMORE — pages galerie (grille + visionneuse)
   ============================================================ */
(function () {
  const $  = (sel, root) => (root || document).querySelector(sel);
  const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));

  let photos = [];
  let current = 0;

  function renderGrid(content, cat) {
    const grid = $("#gallery-grid");
    const note = $("#gallery-note");
    if (!grid) return;
    photos = content.photos[cat] || [];
    grid.innerHTML = "";

    if (!photos.length) {
      (ASKAMORE.PLACEHOLDERS[cat] || []).forEach(label => {
        const slot = document.createElement("div");
        slot.className = "ph-slot";
        slot.innerHTML = '<span class="t"></span><span>Photo à venir</span>';
        $(".t", slot).textContent = label;
        grid.appendChild(slot);
      });
      if (note) note.textContent = "Espace prêt à accueillir vos visuels — les photos ajoutées depuis l'espace admin s'afficheront ici.";
      return;
    }

    photos.forEach((p, i) => {
      const item = document.createElement("button");
      item.type = "button";
      item.className = "ph-item";
      item.setAttribute("aria-label", "Agrandir la photo " + (i + 1) + (p.caption ? " — " + p.caption : ""));
      const img = document.createElement("img");
      img.src = p.src;
      img.alt = p.caption || "Photo " + (i + 1);
      img.loading = i < 4 ? "eager" : "lazy";
      item.appendChild(img);
      if (p.caption) {
        const cap = document.createElement("span");
        cap.className = "cap";
        cap.textContent = p.caption;
        item.appendChild(cap);
      }
      item.addEventListener("click", () => openLightbox(i));
      grid.appendChild(item);
    });
    if (note) note.textContent = "Cliquez sur une photo pour l'agrandir.";
  }

  /* ---------- Visionneuse ---------- */
  function openLightbox(i) {
    current = i;
    const lb = $("#lightbox");
    lb.classList.add("open");
    document.body.style.overflow = "hidden";
    show();
  }
  function closeLightbox() {
    $("#lightbox").classList.remove("open");
    document.body.style.overflow = "";
  }
  function show() {
    const p = photos[current];
    if (!p) return;
    $("#lb-img").src = p.src;
    $("#lb-img").alt = p.caption || "Photo " + (current + 1);
    $("#lb-cap").textContent = p.caption || "";
    $("#lb-count").textContent = (current + 1) + " / " + photos.length;
  }
  function step(dir) {
    current = (current + dir + photos.length) % photos.length;
    show();
  }

  document.addEventListener("DOMContentLoaded", async () => {
    const cat = document.body.dataset.cat;
    if (!cat) return;
    const content = await ASKAMORE.loadContent();
    renderGrid(content, cat);

    $("#lb-close").addEventListener("click", closeLightbox);
    $("#lb-prev").addEventListener("click", () => step(-1));
    $("#lb-next").addEventListener("click", () => step(1));
    $("#lightbox").addEventListener("click", e => {
      if (e.target === e.currentTarget) closeLightbox();
    });
    document.addEventListener("keydown", e => {
      if (!$("#lightbox").classList.contains("open")) return;
      if (e.key === "Escape") closeLightbox();
      if (e.key === "ArrowLeft") step(-1);
      if (e.key === "ArrowRight") step(1);
    });
  });
})();
