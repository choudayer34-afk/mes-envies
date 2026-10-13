# PROJECT STATE

Mis à jour le 2026-10-13.

## Version

- Version du cache du service worker : `envie-cache-v269` (à incrémenter à chaque livraison).

## Architecture

- Application web installable (PWA), JavaScript sans framework, hébergée sur Cloudflare Pages.
- Racine : `index.html`, `app.js`, `sw.js`, `styles.css`, `ni.css`, `manifest.json`, pages de partage (`partage.html`, `photo-partage.html`, `share-target.html`).
- Tous les modules sont dans `js/` ; `app.js` les importe depuis `./js/`.
- `functions/` : fonctions Cloudflare Pages. `services/` : géocodage. `vendor/` : bibliothèque Firebase.
- Authentification : Firebase Authentication (e-mail et mot de passe).
- Données : Firestore par foyer (`foyers/{foyerId}/...`), avec cache hors ligne.
- Photos : Cloudinary.
- Nouvelle interface : active par défaut ; un réglage de secours dans Plus permet de revenir à l'ancien affichage.
- Changelog : publié automatiquement dans Firestore par `.github/workflows/changelog.yml` à chaque envoi sur `main` ayant une description détaillée.

## Règles Firestore (publiées le 2026-10-13)

- Accès limité aux membres du foyer.
- Envies « privées » réservées à leur propriétaire.
- Partages publics (`partagePublic`, `collecteActivee`) en lecture.
- `changelog` : création ouverte, limitée aux champs `titre`, `items`, `date`, `version`.
- Abonnements d'appareil : `users/{uid}/appareils/{id}`, propriétaire seul.

## Rappels existants

- `rappels.js` : rappels de voyage calculés à l'ouverture (papiers, départ proche, billets hors ligne).
- `rappels-calendrier.js` : fichier `.ics` dont les alarmes sont déclenchées par le calendrier du téléphone.
- Aucun gestionnaire `push` ni `notificationclick` dans `sw.js`.

## Évolution en cours : notifications sur téléphone

Décisions du 2026-10-13 :

- Voie retenue : Firestore + Worker Cloudflare séparé (déclencheur horaire) + Web Push. Pas de ntfy.
- Appareils : iPhone (application installée sur l'écran d'accueil obligatoire, iOS 16.4 minimum).
- Destinataires : tous les membres du foyer, réglages par appareil.
- Rappels de dates : veille, jour J, une semaine avant, délai réglable par envie.
- Relances périodiques : hebdomadaires, mensuelles ou désactivées, au choix par appareil.
- Écarté : rappel par lieu proche en arrière-plan (impossible pour une page web).
- Une envie privée ne notifie que son propriétaire.

Livraisons prévues :

1. Règles Firestore et nettoyage du dépôt (fait).
2. Abonnement push par appareil, gestionnaires `push` et `notificationclick`, guide d'installation iPhone, correction des deux chemins erronés de `sw.js`.
3. Réglages par appareil et champ « me prévenir X jours avant » dans la fiche d'envie.
4. Worker Cloudflare : déclencheur horaire, compte de service en secret, envoi Web Push (VAPID), suppression des abonnements périmés.
5. Bouton « Envoyer un test », numéro de version affiché, mode d'emploi.

## Règles de livraison

- Tests avant livraison.
- Incrémenter `CACHE_NAME` dans `sw.js` à chaque livraison.
- Zip des seuls fichiers modifiés, avec leur chemin exact (modules dans `js/`).
- Aucun secret dans les fichiers versionnés.
