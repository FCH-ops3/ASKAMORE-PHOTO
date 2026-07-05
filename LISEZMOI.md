# Askamore Photography — nouveau site

Base propre du site, avec les trois évolutions demandées :

1. **Galerie de l'accueil en grand format avec défilement automatique** — la section
   « Galerie / Un aperçu de notre travail » affiche désormais quatre grandes vitrines
   (Mariage, Fiançailles, Autre événement, Séance photo). Chaque vitrine fait défiler
   automatiquement les photos de sa galerie (fondu toutes les ~4 secondes) et mène à la
   page complète de la catégorie.
2. **Onglet « Admin » sur la page d'accueil** — dans le menu de navigation (et le pied de
   page), il ouvre la page de connexion de l'espace admin.
3. **Nouvelle catégorie dans l'espace admin : « À propos — photo »** — pour ajouter,
   remplacer ou supprimer la photo affichée dans la section « À propos de nous » de
   l'accueil.

## Contenu du dossier

| Fichier / dossier      | Rôle |
|------------------------|------|
| `index.html`           | Page d'accueil |
| `mariage.html`         | Galerie Mariage |
| `fiancailles.html`     | Galerie Fiançailles |
| `gender-reveal.html`   | Galerie Autre événement |
| `seance-photo.html`    | Galerie Séance photo |
| `admin.html`           | Espace admin (connexion + gestion) |
| `css/style.css`        | Styles de tout le site |
| `js/data.js`           | Stockage des données (photos, avis, mot de passe) |
| `js/main.js`           | Accueil : défilement automatique, avis, contact |
| `js/gallery.js`        | Pages galerie : grille + visionneuse |
| `js/admin.js`          | Logique de l'espace admin |
| `data/photos.json`     | Photos publiées, visibles par tous les visiteurs |

## Mise en ligne sur GitHub Pages

1. Ouvrez votre dépôt `ASKAMORE-PHOTOGRAPHY` sur GitHub.
2. Supprimez les anciens fichiers (ou créez un nouveau dépôt pour repartir de zéro).
3. `Add file → Upload files` : déposez **tout le contenu** de ce dossier en conservant
   la structure (`css/`, `js/`, `data/`).
4. Vérifiez que GitHub Pages est activé (Settings → Pages → branche `main`).
5. Le site est en ligne à la même adresse qu'avant.

## Espace admin

- Accès : lien **Admin** dans le menu, ou directement `admin.html`.
- **Mot de passe par défaut : `askamore2026`** — changez-le dès la première connexion
  (onglet Sécurité). Pour changer le mot de passe par défaut de façon permanente,
  modifiez la ligne `DEFAULT_PASSWORD` dans `js/data.js`.
- Les photos ajoutées sont automatiquement compressées (côté navigateur) pour rester
  légères.

### Publier les photos pour tous les visiteurs (important)

Les photos ajoutées dans l'admin sont d'abord enregistrées **dans votre navigateur
uniquement**. Les visiteurs ne les voient pas encore. Pour les publier :

1. Espace admin → onglet **Publication** → **Exporter (photos.json)**.
2. Sur GitHub, ouvrez le dossier `data` du dépôt.
3. Remplacez `photos.json` par le fichier téléchargé (`Add file → Upload files`, puis
   valider le commit).
4. Après quelques minutes, les photos apparaissent pour tout le monde : dans les
   galeries, dans le défilement automatique de l'accueil et dans « À propos de nous ».

Ce même fichier sert de **sauvegarde** : conservez-en une copie, il peut être réimporté
depuis l'onglet Publication sur n'importe quel navigateur.

## Limites à connaître (site statique)

- Le mot de passe admin est une protection de confort côté navigateur, pas une sécurité
  forte : toute personne à l'aise techniquement pourrait la contourner. Ne stockez rien
  de sensible dans l'espace admin. Les visiteurs normaux, eux, ne verront jamais vos
  modifications non publiées.
- Le formulaire de contact ouvre l'application e-mail du visiteur avec la demande
  pré-remplie (pas d'envoi automatique possible sans serveur).
- Les avis déposés par un visiteur ne sont visibles que sur son propre navigateur, tant
  qu'ils ne sont pas repris dans `photos.json`. Astuce : si un client vous envoie son
  avis, vous pouvez le saisir vous-même via le formulaire depuis votre navigateur, puis
  l'inclure à la prochaine publication.
