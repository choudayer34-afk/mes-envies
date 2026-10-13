# PROJECT STATE

Mis à jour le 2026-10-13.

## Version

- Version du cache du service worker : `envie-cache-v222` (à incrémenter à chaque livraison).

## Architecture réelle

- Application web installable (PWA), JavaScript sans framework, hébergée sur Cloudflare Pages.
- Authentification : Firebase Authentication (e-mail et mot de passe).
- Données : Firestore, organisées par foyer (`foyers/{foyerId}/...` : envies, personnes, checklists, réglages).
- Cache hors ligne Firestore activé ; migration unique du stockage local vers Firestore déjà écrite.
- Photos : Cloudinary.
- Service worker : mise en cache et cible de partage ; aucun gestionnaire de notifications.

## Évolution en cours : rappels sur téléphone

Décisions du 2026-10-13 :

- Voie retenue : synchronisation Firestore + Worker Cloudflare séparé (déclencheur horaire) + Web Push.
- Pas de ntfy.
- Appareils : iPhone (application installée sur l'écran d'accueil obligatoire, iOS 16.4 minimum).
- Destinataires : tous les membres du foyer, réglages par appareil.
- Rappels de dates : veille, jour J, une semaine avant, délai réglable par envie.
- Relances périodiques : hebdomadaires, mensuelles ou désactivées, au choix par appareil.
- Écarté : rappel par lieu proche en arrière-plan (impossible pour une page web).
- Règles Firestore : accès limité aux membres du foyer.

Livraisons prévues :

1. Règles Firestore vérifiées et resserrées ; état du projet à jour.
2. Abonnement push par appareil, gestionnaires `push` et `notificationclick`, guide d'installation iPhone.
3. Réglages par appareil et champ « me prévenir X jours avant » dans la fiche d'envie.
4. Worker Cloudflare : déclencheur horaire, compte de service en secret, envoi Web Push (VAPID), suppression des abonnements périmés.
5. Bouton « Envoyer un test », numéro de version affiché, mode d'emploi.

## Règles de livraison

- Tests avant livraison.
- Incrémenter `CACHE_NAME` dans sw.js à chaque livraison.
- Zip des seuls fichiers modifiés.
- Aucun secret dans les fichiers versionnés.

## Historique

- Sprint 2 (capture rapide, stockage local) terminé, puis remplacé par la synchronisation Firestore.
