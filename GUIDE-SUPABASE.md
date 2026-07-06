# Passer le site sur Supabase — guide pas à pas

Avec Supabase, les photos et les avis sont enregistrés dans une base en ligne
gratuite : **toute modification faite dans l'espace admin est immédiatement
visible par tous les visiteurs, depuis n'importe quel ordinateur**. Plus rien
à publier.

## 1. Créer le projet Supabase (5 minutes)

1. Allez sur https://supabase.com → **Start your project** → créez un compte
   (le plus simple : « Continue with GitHub »).
2. **New project** : choisissez un nom (ex. `askamore`), un mot de passe de
   base de données (notez-le quelque part, il ne sert pas au quotidien) et la
   région **Europe (Paris ou Frankfurt)**. Cliquez sur **Create new project**
   et patientez 1 à 2 minutes.

## 2. Créer les tables et les règles de sécurité

1. Dans le menu de gauche : **SQL Editor** → **New query**.
2. Ouvrez le fichier `supabase-setup.sql` (fourni), copiez tout son contenu,
   collez-le dans l'éditeur, puis cliquez sur **Run**.
3. Le message « Success. No rows returned » confirme que tout est créé.

## 3. Créer votre compte admin

1. Menu de gauche : **Authentication** → **Users** → **Add user** →
   **Create new user**.
2. Saisissez votre e-mail et un mot de passe solide (8 caractères minimum) :
   ce sont vos identifiants de connexion à l'espace admin du site.
   Laissez « Auto Confirm User » coché.
3. IMPORTANT — empêcher les inscriptions extérieures : **Authentication** →
   **Sign In / Providers** (ou « Settings » selon la version) → désactivez
   l'option **Allow new users to sign up**, puis enregistrez. Sans cela,
   n'importe qui pourrait se créer un compte et modifier vos photos.

## 4. Relier le site à votre projet

1. Menu de gauche : **Project Settings** (roue dentée) → **API** (ou
   « Data API »). Vous y trouverez :
   - **Project URL** (ex. `https://abcdefgh.supabase.co`)
   - la clé **anon public** (longue chaîne de caractères)
2. Ouvrez le fichier `js/config.js` fourni avec le site et remplacez les deux
   valeurs par les vôtres, entre les guillemets. Cette clé « anon » est faite
   pour être publique : elle n'autorise que la lecture (et le dépôt d'avis),
   les règles créées à l'étape 2 protègent tout le reste.

## 5. Mettre le site à jour sur GitHub

Téléversez sur votre dépôt (Add file → Upload files) : les 6 fichiers HTML
et le dossier `js` complet (qui contient le nouveau `config.js`). Validez,
attendez 2-3 minutes, puis rechargez le site avec Ctrl+F5.

## 6. Tester

1. Site → onglet **Admin** → connectez-vous avec l'e-mail et le mot de passe
   créés à l'étape 3.
2. Ajoutez une photo dans une galerie : elle est en ligne dès le message de
   confirmation.
3. Depuis un autre PC ou un téléphone (même en navigation privée), ouvrez le
   site : la photo est là. Connectez-vous à l'admin depuis cet autre appareil
   avec les mêmes identifiants : vous pouvez ajouter, légender, réordonner ou
   supprimer des photos, tout est partagé.

## Récupérer les photos de l'ancienne version

Espace admin → onglet **Sauvegarde** :
- **Importer depuis ce navigateur** : récupère les photos ajoutées avec
  l'ancienne version sur cet ordinateur et les envoie en ligne.
- **Importer un fichier photos.json** : même chose à partir d'un export fait
  avec l'ancienne version.

## Bon à savoir

- Le plan gratuit de Supabase (1 Go de stockage, largement suffisant pour
  plusieurs centaines de photos compressées) demande une connexion au projet
  au moins une fois par semaine environ, sinon le projet est mis en pause
  après une période d'inactivité ; il se réactive en un clic depuis le
  tableau de bord.
- Le formulaire de contact, lui, continue d'ouvrir l'application e-mail du
  visiteur (inchangé).
- Pour ajouter un second administrateur : Authentication → Users → Add user.
