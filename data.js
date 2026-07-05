/* Askamore — couche de données locale (localStorage, 100% navigateur, aucun serveur) */
const Askamore = (() => {
  const K = {
    cats: 'aska_categories',
    photos: 'aska_photos_',   // + catId
    about: 'aska_about',
    auth: 'aska_auth',
    creds: 'aska_creds'
  };

  const defaultCats = [
    { id: 'mariage',     name: 'Mariage',     cover: '' },
    { id: 'fiancailles', name: 'Fiançailles', cover: '' },
    { id: 'evenement',   name: 'Événement',   cover: '' }
  ];

  const read = (k, fb) => { try { return JSON.parse(localStorage.getItem(k)) ?? fb; } catch { return fb; } };
  const write = (k, v) => localStorage.setItem(k, JSON.stringify(v));

  // ---- Catégories ----
  function getCategories() {
    let c = read(K.cats, null);
    if (!c) { write(K.cats, defaultCats); c = defaultCats; }
    return c;
  }
  function addCategory(name) {
    const cats = getCategories();
    const id = name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
                   .replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || ('cat-' + Date.now());
    if (cats.some(c => c.id === id)) return null;
    cats.push({ id, name, cover: '' });
    write(K.cats, cats);
    return id;
  }
  function removeCategory(id) {
    write(K.cats, getCategories().filter(c => c.id !== id));
    localStorage.removeItem(K.photos + id);
  }

  // ---- Photos par catégorie (tableau de dataURL) ----
  function getPhotos(catId) { return read(K.photos + catId, []); }
  function addPhotos(catId, dataUrls) {
    const arr = getPhotos(catId).concat(dataUrls);
    write(K.photos + catId, arr);
    return arr;
  }
  function removePhoto(catId, index) {
    const arr = getPhotos(catId);
    arr.splice(index, 1);
    write(K.photos + catId, arr);
    return arr;
  }

  // ---- À propos ----
  function getAbout() { return read(K.about, { text: '', photo: '' }); }
  function setAbout(obj) { write(K.about, { ...getAbout(), ...obj }); }

  // ---- Auth (démo) ----
  function creds() { return read(K.creds, { user: 'admin', pass: 'admin' }); }
  function login(u, p) {
    const c = creds();
    if (u === c.user && p === c.pass) { write(K.auth, { ok: true, t: Date.now() }); return true; }
    return false;
  }
  function isLogged() { return read(K.auth, { ok: false }).ok === true; }
  function logout() { localStorage.removeItem(K.auth); }
  function setPassword(newPass) { const c = creds(); write(K.creds, { ...c, pass: newPass }); }

  return {
    getCategories, addCategory, removeCategory,
    getPhotos, addPhotos, removePhoto,
    getAbout, setAbout,
    login, isLogged, logout, setPassword
  };
})();
