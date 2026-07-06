# Askamore Photography — site avec base en ligne (Supabase)

Les photos et avis sont enregistrés dans une base Supabase : toute
modification faite dans l'espace admin est immédiatement visible par tous
les visiteurs, depuis n'importe quel appareil.

➡ Pour l'installation complète pas à pas, ouvrez **GUIDE-SUPABASE.md**.

L'essentiel :
1. Créer un projet gratuit sur supabase.com.
2. SQL Editor → coller le contenu de `supabase-setup.sql` → Run.
3. Authentication → Users → créer votre compte admin (e-mail + mot de passe),
   puis désactiver « Allow new users to sign up ».
4. Project Settings → API : copier l'URL du projet et la clé « anon public »
   dans `js/config.js`.
5. Téléverser les 6 fichiers HTML et le dossier `js` sur GitHub.

Connexion à l'espace admin : lien « Admin » du site, avec l'e-mail et le mot
de passe créés à l'étape 3.
