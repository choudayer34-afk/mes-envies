# PROJECT STATE

Mis à jour le 2026-10-15 (lot 4 : Maison au bon moment).

## Version

- Version du cache du service worker : `envie-cache-v283` (à incrémenter à chaque livraison).

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

## Le voyage au bon moment (lot 1, 2026-10-15)

- Worker : `worker/voyage.js` (fonctions pures), appelé par `planifier` de `worker/rappels.js`. Outils partagés dans `worker/commun.js`.
- Notifications : papiers (30 et 7 jours avant), enregistrement des vols (24 h avant, aller et retour, ouvre le billet), valise (J-2 s'il reste des éléments non cochés), « Le jour du départ » (2 h avant le rappel du premier billet de transport du jour du départ, sinon le matin du départ à l'heure des dates), programme du jour (chaque matin du voyage, 08:00 réglable), dépenses du soir (20:00 réglable), retour (2 jours après la fin).
- Liste du départ (automatique, rien à saisir) : éléments non cochés des catégories de liste dont le nom contient « départ » ou « jour J » ; à défaut, tous les éléments non cochés des listes du voyage (5 cités, les autres comptés) ; si tout est coché, rappel fixe « Clés, chargeurs, papiers, billets ».
- Réglages de l'appareil : bloc `voyage` { actif, papiers, enregistrement, depart, valise, programme, heureProgramme, depenses, heureDepenses, retour }, identique dans `js/notifications.js` et `worker/reglages.js`.
- Lectures en plus : `personnes` et `checklistCategories` du foyer, seulement si un voyage commence dans les 31 jours ou est en cours.
- Ouverture : charge `voyageId` + `vue` (listes, programme, depense, souvenirs, voyageurs) ; `sw.js` transmet `vue` ; `ouvrirEcranVoyage` dans `js/notifications.js`.
- Clés d'envoi : `vp:`, `ve:`, `vd:`, `vv:`, `vg:`, `vm:`, `vr:`.
- Tests : `cd worker && node --test tests/voyage.test.mjs` (données factices).
- Écartés : date limite d'annulation (pas de nouveau champ), capture par Siri.

## Ne rien perdre (lot 2, 2026-10-15)

- `js/tri-outils.js` (fonctions pures) : dates « Plus tard », idée en pause, idée dormante (plus de 30 jours), doublons de titre.
- Trier les idées (`js/trier.js`) : affichage « Une à la fois » (par défaut, glisser à droite = Retenir, à gauche = Plus tard) ou « Toutes » (mémorisé sur l'appareil) ; Plus tard = Demain, Ce week-end (samedi suivant), Dans 1 semaine, Dans 1 mois ; section repliable « En pause » avec « Maintenant » ; « Toujours envie ? » sur les idées de plus de 30 jours : garder (`revueLe`) ou corbeille.
- Champs d'envie facultatifs : `revoirLe` (AAAA-MM-JJ, l'idée sort d'À trier jusqu'à cette date), `revueLe` (horodatage de la dernière réponse « oui, toujours envie »). Fonctions `updateEnvieRevoirLe`, `marquerEnvieRevue` dans `js/storage.js`.
- « Annuler » 5 s à la place des confirmations : `showToast(message, { action, surAction })` dans `js/toast.js` ; utilisé dans Trier (retenir, plus tard, corbeille) et Listes (suppression d'un article, remis à sa place).
- Capturer : doublon repéré (idée active ou corbeille) ; « Ouvrir l'existante » / « La restaurer » ou « Noter quand même ».
- Worker : les relances ignorent les idées en pause et comptent l'ancienneté depuis `revueLe` si plus récent (aucune lecture en plus).
- Tests : `node --test tests/tri-outils.test.mjs` (racine) et `cd worker && node --test tests/voyage.test.mjs`.
- Choix : une idée abandonnée va dans la corbeille (pas d'espace « Idées écartées »).

## Se recentrer (lot 3, 2026-10-15)

- `js/prochaine-etape.js` : choix de la prochaine étape Maison (fonction pure : en retard la plus ancienne, puis du jour, puis la suivante du projet le plus avancé, puis à venir) ; « Pas maintenant » mémorisé pour la session ; dernière fiche ouverte (`envie_derniere_fiche`, 7 jours) ; `basculerVersMode`.
- Aujourd'hui Maison (`js/maison.js`) : bouton ✈️ Voyages et loupe dans l'en-tête ; ligne « Reprendre » (dernier projet ouvert) ; carte « Prochaine étape » (Fait, Pas maintenant, Découper : une étape par ligne, remplace la tâche dans le même projet, Annuler 5 s) ; « Reporter » sur chaque tâche en retard (Demain, Ce week-end, Dans 1 semaine) et « Tout à demain ».
- Aujourd'hui Voyages (`js/aujourdhui.js`) : bouton 🛠️ Maison ; ligne « Reprendre » si le dernier voyage ouvert n'est pas celui affiché.
- Dernière fiche notée par `ouvrirHub` (`js/fiche-hub.js`) et `openMaisonFiche` (`js/maison-fiche.js`).
- Recherche (`js/recherche.js`) : aussi les projets et tâches Maison.
- Menu Plus : visibles = mode, Notifications, Urgence, Corbeille, Jeux, Administration ; le reste dans « Autres » repliable (rangement refait à chaque ouverture, rien supprimé) : `rangerMenuPlus` dans `js/nouvelle-interface.js`.
- Tests : `node --test tests/prochaine-etape.test.mjs`.

## Maison au bon moment (lot 4, 2026-10-15)

- Rendez-vous d'artisan (devis `rdv_planifie` avec `dateRdv`, non retenu) : notification la veille et le jour même à l'heure des dates (réglages « La veille », « Le jour même »). Toucher ouvre la fiche du projet Maison (`vue: "projet"`, bascule en mode Maison si besoin).
- Champ d'envie `datesRdv` (tableau de dates AAAA-MM-JJ) tenu à jour par `updateEnvieDevis` (`datesRdvDe` dans `js/storage.js`) ; rattrapage des anciens devis par `synchroniserDatesRdv` à la première ouverture d'Aujourd'hui Maison (sans toucher `updatedAt`). Le Worker lit seulement les envies `datesRdv` ARRAY_CONTAINS_ANY [aujourd'hui, demain], et seulement à l'heure des rappels.
- Relance Maison : ajoute les devis à suivre (à contacter, reçus sans choix) et les projets en sommeil ; part aussi s'il n'y a rien à trier (« Maison : à suivre »). Calcul dans `worker/maison.js` (aucune lecture en plus : la relance lit déjà tout le foyer).
- Projet en sommeil : tâches ouvertes et aucune activité (`updatedAt` du projet et de ses tâches, `revueLe`) depuis 21 jours. Étiquette « en sommeil » dans Projets ; section « En sommeil » dans Aujourd'hui Maison (Ouvrir, Plus tard = `revueLe`).
- En magasin (`js/magasin.js`) : produits retenus des comparateurs (par magasin), planches, peinture à prévoir ; cocher « acheté » enregistre `achete` sur le produit ou la planche (la peinture : session seulement). Accès : ligne « 🛒 En magasin » d'Aujourd'hui Maison.
- Bonne météo : bandeau dans Aujourd'hui Maison si le prochain week-end est sec (code météo ≤ 3, pluie ≤ 30 %) et qu'un projet d'une zone extérieure a des tâches ouvertes. Open-Meteo appelé par l'appli (`fetchMeteoSemaine` dans `js/meteo.js`), une fois par jour et par session ; position de la maison mémorisée sur l'appareil (`envie_position_maison`, arrondie au centième) à la première ouverture.

## Règles de livraison

- Tests avant livraison.
- Incrémenter `CACHE_NAME` dans `sw.js` à chaque livraison.
- Zip des seuls fichiers modifiés, avec leur chemin exact (modules dans `js/`).
- Aucun secret dans les fichiers versionnés.
