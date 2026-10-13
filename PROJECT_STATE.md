# PROJECT STATE

Mis à jour le 2026-10-13 (livraison 5 : notifications terminées).

## Version

- Version du cache du service worker : `envie-cache-v274` (à incrémenter à chaque livraison).

## Architecture

- Application web installable (PWA), JavaScript sans framework, hébergée sur Cloudflare Pages.
- Racine : `index.html`, `app.js`, `sw.js`, `styles.css`, `ni.css`, `manifest.json`, pages de partage (`partage.html`, `photo-partage.html`, `share-target.html`).
- Tous les modules sont dans `js/` ; `app.js` les importe depuis `./js/`.
- `functions/` : fonctions Cloudflare Pages. `services/` : géocodage. `vendor/` : bibliothèque Firebase.
- `worker/` : service d'envoi des notifications (Worker Cloudflare, projet séparé `mes-envies-notifications` relié au même dépôt, répertoire racine `worker`). Adresse : `https://mes-envies.choudayer34.workers.dev`. Voir `worker/LISEZMOI.md`.
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

## Notifications sur téléphone (terminé le 2026-10-13)

Décisions :

- Voie retenue : Firestore + Worker Cloudflare (déclencheur natif toutes les 15 minutes) + Web Push (VAPID). Pas de ntfy.
- Appareils : iPhone (application installée sur l'écran d'accueil obligatoire, iOS 16.4 minimum).
- Destinataires : tous les membres du foyer, réglages par appareil, heure de Paris pour tout.
- Une envie privée (`visibilite: "prive"`, `proprietaireId`) ne notifie que son propriétaire.
- Écarté : rappel par lieu proche en arrière-plan (impossible pour une page web).

Fonctionnement :

- Application : `js/notifications.js` (abonnement, réglages, tests, mode d'emploi, version, ouverture au toucher), gestionnaires `push` et `notificationclick` dans `sw.js`, menu « Me prévenir avant » dans `js/fiche-hub.js`.
- Appareil : document `users/{uid}/appareils/{idAppareil}` avec `uid`, `foyerId`, `endpoint`, `cles {p256dh, auth}`, `reglages`, `majLe`, `creeLe`, et `envoyes` (écrit par le Worker, empêche les doublons).
- Envie : champ optionnel `rappelAvantJours` (entier, absent si aucun rappel supplémentaire).
- Charge d'une notification : `titre`, `corps`, `tag`, `voyageId` (id de l'envie), `billetId`, `vue`, `mode`. Ouverture : `?ouvrir=&billet=` ou `?vue=trier&mode=voyage|maison`.
- Worker : dates (semaine, veille, jour J, délai propre), billets (délai par type avant le départ), relances (lundi ou 1er du mois, Voyages et Maison séparés). Secrets Cloudflare : `FIREBASE_SERVICE_ACCOUNT`, `VAPID_PRIVATE`. Variables publiques dans `worker/wrangler.jsonc`.
- Point d'entrée `POST /test` : jeton Firebase de l'utilisateur, envoi d'un test à son appareil (boutons de l'écran Notifications).
- Quota : une passe ne lit que les envies utiles (datées des 60 derniers jours, ou tout le foyer le matin d'une relance) ; 30 envois maximum par passe.

## Règles de livraison

- Tests avant livraison.
- Incrémenter `CACHE_NAME` dans `sw.js` à chaque livraison.
- Zip des seuls fichiers modifiés, avec leur chemin exact (modules dans `js/`).
- Aucun secret dans les fichiers versionnés.
