# EnVie : service d'envoi des notifications

Petit service Cloudflare (un « Worker ») qui, toutes les 15 minutes, regarde les envies du foyer et envoie les notifications dues aux téléphones abonnés : rappels de dates, billets, relances « à trier ».

- Il vit dans le dossier `worker/` du dépôt `mes-envies` ; le site (Cloudflare Pages) ne change pas.
- Heure de Paris pour toutes les heures.
- Aucun secret dans les fichiers : deux secrets se saisissent dans Cloudflare (voir ci-dessous).

## Ce qu'il envoie

- Dates : une semaine avant, la veille, le jour J, et le délai propre à chaque envie, à l'heure choisie sur l'appareil.
- Billets : avant l'heure de départ, selon le type (avion, train, bus/ferry, voiture, parking, restaurant, activité, autre). Un toucher ouvre le billet.
- Relances : chaque lundi (hebdo) ou chaque 1er du mois (mensuel), séparément pour Voyages et Maison. Un toucher ouvre « Trier les idées » du bon côté.
- Une envie privée n'est notifiée qu'à son propriétaire.

## Mise en route (une seule fois)

1. Clé du compte de service
   - Console Firebase, projet EnVie, engrenage « Paramètres du projet », onglet « Comptes de service », bouton « Générer une nouvelle clé privée ».
   - Un fichier .json se télécharge. Ne le dépose ni sur GitHub, ni dans une conversation.
2. Créer le projet Cloudflare
   - Cloudflare, « Workers et Pages », « Créer », « Importer un dépôt Git », choisir `mes-envies`.
   - Nom du projet : `mes-envies-notifications`.
   - Répertoire racine (ou « Root directory ») : `worker`.
   - Commande de build : vide. Commande de déploiement : celle proposée par défaut (`npx wrangler deploy`).
3. Ajouter les deux secrets
   - Dans le projet : « Paramètres », « Variables et secrets », « Ajouter », type « Secret ».
   - `FIREBASE_SERVICE_ACCOUNT` : tout le contenu du fichier .json de l'étape 1 (ouvert dans un éditeur de texte, copier-coller en entier).
   - `VAPID_PRIVATE` : la clé privée VAPID qui va avec la clé publique déjà présente dans l'application.
4. Vérifier
   - Ouvrir l'adresse `https://mes-envies-notifications.<ton-sous-domaine>.workers.dev` : le texte « EnVie : service de notifications actif » doit s'afficher.
   - Onglet « Déclencheurs » : le déclencheur `*/15 * * * *` doit apparaître.
   - Onglet « Journaux » : toutes les 15 minutes une ligne « Passe terminée » avec le bilan.

## Lectures Firestore

Pour rester dans le quota gratuit, une passe ne lit que ce qui est utile : les appareils, puis uniquement les envies datées des 60 derniers jours (ou tout le foyer le matin d'une relance). Aucune lecture d'envies si aucun appareil n'a de rappel actif.

## Fichiers

- `index.js` : déclencheur et point d'entrée `/test`.
- `executer.js` : une passe complète.
- `rappels.js` : décide quoi envoyer.
- `firebase.js`, `idtoken.js` : accès à Firestore et vérification de la connexion.
- `webpush.js` : chiffrement et envoi (VAPID).
- `temps.js`, `reglages.js` : heure de Paris et réglages (identiques à l'application).
