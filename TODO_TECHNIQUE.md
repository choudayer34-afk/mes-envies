# TODO technique eProtec — synthèse des 8 audits

Créé le 2026-10-12 ; mis à jour le 2026-10-12 (décisions D-01 à D-21 reportées et conséquences propagées). Sources : AUDIT_SECURITE, AUDIT_RGPD, AUDIT_CICD, AUDIT_PWA, AUDIT_PERFORMANCE, AUDIT_REFACTO, AUDIT_QUALITE, AUDIT_UX_UI (préfixes SEC, RGPD, CICD, PWA, PERF, REF, QUA, UX).

## 1. Mode d'emploi et règle de mise à jour

- Ce fichier est la seule liste de travail. Les audits restent la référence des preuves (fichier:ligne) ; ne pas les modifier.
- Une tâche = un bloc `T-xxx` avec : sources (IDs des constats), criticité retenue, effort (S = moins d'une demi-journée, M = 1 à 3 sessions, L = plus), prérequis, critère de réussite vérifiable, case à cocher.
- Statuts autorisés : `À faire`, `En cours`, `Fait`, `Écarté`. Rien d'autre.
  - Une tâche reportée garde le statut `À faire` et porte une ligne `Report` (raison, condition de reprise) ; elle est listée en section 7 et exclue du décompte des tâches actives.
- Règle de mise à jour, à chaque changement :
  - cocher la case (`[x]`) seulement quand le critère de réussite a été vérifié ;
  - changer la ligne `Statut` et inscrire la date (AAAA-MM-JJ) ;
  - ajouter une ligne dans l'historique (section 8) : date, tâche, ancien statut, nouveau statut, remarque d'une ligne ;
  - mettre à jour le tableau de bord (section 2) : tâches faites, constats couverts ;
  - une tâche `Écarté` garde son bloc et reçoit la raison ; une tâche ne se supprime jamais.
- Respecter l'ordre des vagues et les prérequis. Une seule tâche `En cours` à la fois par session de travail.
- Aucune suppression de contenu existant sans accord explicite de Charles-Henri (voir section 5, points D-xx). Accord donné le 2026-10-12 pour la liste de D-08 ; revérifier les références de chaque fichier avant de le supprimer.
- Livraison : c'est Charles-Henri qui livre (poussée sur GitHub, mise en ligne). Claude ne pousse rien sur GitHub : il prépare les modifications dans le dossier de travail et indique les fichiers touchés et la vérification à faire (D-21).
- Contenu de secourisme : fiches et quiz personnels, jamais validés par un formateur (D-09, D-10). Aucune tâche ni critère de réussite n'exige cette validation.
- Les décomptes (tableau de bord) sont recalculés par script à chaque mise à jour, pas à la main.
- Aucune valeur de secret dans ce fichier : seulement des noms de clés et des emplacements.
- Avant chaque tâche qui touche `index.html`, `sw.js` ou `data/` : point de retour (étiquette Git) puis vérification manuelle de 5 minutes (accueil, un événement, une fiche, le quiz, mode avion, écran Rappels).

## 2. Tableau de bord

Avancement global : 5 % (4 tâches faites sur 75 tâches actives ; 81 tâches au total dont 6 reportées et 0 écartée ; 0 constat résolu sur 116).

| Audit | Fort | Moyen | Faible | Total |
|---|---|---|---|---|
| SEC (sécurité) | 3 | 4 | 7 | 14 |
| RGPD | 1 | 9 | 2 | 12 |
| CICD | 1 | 8 | 6 | 15 |
| PWA | 2 | 6 | 7 | 15 |
| PERF | 2 | 5 | 5 | 12 |
| REF | 2 | 7 | 7 | 16 |
| QUA | 1 | 8 | 10 | 19 |
| UX | 3 | 7 | 3 | 13 |
| **Total** | **15** | **54** | **47** | **116** |

- Écart noté : la synthèse de AUDIT_UX_UI annonçait 3 / 6 / 4 ; la liste des constats donne 3 / 7 / 3 (UX-04 à UX-10 sont Moyen). La synthèse de l'audit a été corrigée à la relecture ; le tableau suit la liste.
- Après fusion des doublons : 72 tâches initiales (T-001 à T-072) pour 116 constats, puis 7 tâches ajoutées le 2026-10-12 (T-073 à T-079 : mention secourisme, logos, alternative gratuite au déclencheur, groupe TESTS) = 79 tâches ; 22 groupes de doublons (34 constats absorbés, y compris la ligne « Styles en ligne » écartée) ; 5 constats écartés ou reportés en totalité (REF-14, UX-12, UX-11, RGPD-10, REF-10) et 5 volets partiels reportés (section 7).

Statut des vagues : vague 0 = Partiellement terminé (clôturée le 2026-10-12, validations restantes dans T-001, T-004, T-007, T-008) ; vague 1 = En cours ; vagues 2 à 5 = À faire.

| Vague | Thème | Tâches | Faites |
|---|---|---|---|
| 0 | Urgences : exposition, jetons, base ouverte | T-001 à T-008 (8) | 4 |
| 1 | Filet de sécurité, flux quotidien, fermeture de la base | T-009 à T-026, T-073, T-074, T-076, T-077, T-080, T-081 (24) | 0 |
| 2 | Terrain : hors-ligne, performance, accessibilité vitale | T-027 à T-047, T-078 (22) | 0 |
| 3 | Conformité RGPD (usage personnel, ouverture limitée) ; T-048, T-050, T-051, T-055, T-056 reportées | T-048 à T-056 (9, dont 5 reportées) | 0 |
| 4 | Dette technique et découpage | T-057 à T-066, T-075, T-079 (12) | 0 |
| 5 | Accessibilité et confort d'usage | T-067 à T-072 (6) | 0 |

## 3. Matrice de compatibilité

### 3.1 Doublons entre audits (à traiter une seule fois)

| Sujet | Constats fusionnés | Tâche |
|---|---|---|
| Jeton GitHub dans le navigateur | SEC-03, PWA-15 | T-003, T-026 |
| Base Firebase ouverte | SEC-01, RGPD-03 | T-024, T-025 |
| Règles Firebase absentes du dépôt | CICD-15, REF-16 | T-006 |
| Affichage sans échappement | SEC-02, SEC-07, QUA-19 | T-007, T-023 |
| Sujet ntfy en dur | SEC-05, RGPD-05 | T-005 |
| Données personnelles dans le dépôt | SEC-06, RGPD-01 | T-004, T-008, T-054 |
| Chaîne d'exécution non figée (verrouillage, actions, Node, droits) | SEC-09, SEC-10, CICD-07, CICD-10, QUA-18 | T-016 |
| Concurrence, attente de 120 s, commentaire périmé | CICD-03, CICD-11, REF-13 | T-014 |
| Heure du contrôle quotidien | CICD-02, QUA-08 | T-002, T-015 |
| Alertes perdues sans trace | CICD-01, QUA-05 | T-012 |
| Erreurs silencieuses des scripts | QUA-04, CICD-08 | T-013 |
| Cache qui grossit (`?t=`) et données anciennes hors ligne | PWA-06, PERF-03, PERF-12 | T-031 |
| Page d'erreur copiée dans le cache | PWA-04, QUA-09 | T-031 |
| Images non préchargées, liste manuelle, installation lourde | PWA-03, PERF-04, QUA-11 (images), REF-12, PWA-13 | T-037 |
| Fichiers en double ou inutiles dans `data/` | PERF-09, REF-09, PWA-12, RGPD-11 | T-034 |
| Fonctions définies deux fois | REF-04, QUA-14 | T-057 |
| `bilan.html` orphelin | REF-11, PWA-14 (partie) | T-043 |
| Démarrage en série et changelog dans la file | PERF-02, PERF-08 | T-036 |
| Erreurs de chargement invisibles et alertes bloquantes | QUA-06, UX-09 | T-041 |
| Absence de tests et de garde-fous | QUA-01, REF-03 (partie), CICD-06 (partie) | T-009, T-063, T-076 à T-079 |
| Worker de traduction hors dépôt | REF-15, RGPD-09 (partie) | T-010, T-053 |
| Styles en ligne | REF-14, UX-12 | écartés (section 7) |
| En-têtes HTTP (`_headers`) | SEC-08, PERF-06 | T-046 |

### 3.2 Conflits entre recommandations et résolution retenue

Vérifications faites dans le code pour C-01, C-02, C-05, C-13, C-20.

| N° | Conflit | Résolution retenue | Pourquoi |
|---|---|---|---|
| C-01 | RGPD-01 et SEC-06 : retirer les fichiers `data/` de la publication ; CICD-05 : ne pas exclure ceux que l'application lit | L'application lit `events`, `suggestions`, `status`, `registrations-history`, `changelog`, `favoris-seed` et le fichier `.md` (`index.html:1293`, `14065-14067`, `14122-14124`) ; le Worker lit `pending-notification` et `status` par `env.ASSETS` (`worker/rappels.js:100-108`). Seuls `known-uids`, `geocache`, `dps-history`, `recent-new` ne sont lus par aucun code servi : exclure ceux-là (T-018). `registrations-history` reste servi jusqu'à T-054 | Exclure un fichier lu casse l'application ou les rappels |
| C-02 | RGPD-01 : retirer `dejaInscrit` de `events.json` ; l'application s'en sert | L'application recalcule le champ en ligne (`index.html:14135`) et le force à faux hors ligne (`14074`) ; les scripts l'utilisent en interne (`check-events.js:425`, `571`, `639`). Retirer le champ des fichiers écrits seulement (T-054), pas des objets internes | Aucun écran ne lit la valeur publiée |
| C-03 | RGPD-01 : purge d'historique (`git filter-repo`) contre SEC §5 (aucun secret, copies déjà hors de contrôle), CICD-13 (sauvegardes), étiquettes de retour (REF), commits automatiques quotidiens, lien Cloudflare | Purge non faite pour l'instant (D-02 décidé le 2026-10-12 : réévaluer après T-004 ; T-055 reportée). Si reprise : après dépôt privé, après arrêt des flux, avant toute étiquette de retour, et destruction de toute sauvegarde `git bundle` antérieure | La purge change tous les identifiants de commits (étiquettes, Cloudflare, sauvegardes invalides) pour un gain limité (copies existantes) |
| C-04 | Ordre privé / purge : RGPD-01 dit purger puis privé ; CICD-12 et SEC disent privé tout de suite | Privé d'abord (T-004), purge éventuelle ensuite ; date du passage en privé : D-01 (décidé : après les corrections ; recommandation Claude à valider : dès T-003) | Le passage en privé est immédiat et réversible ; la purge est lourde |
| C-05 | SEC-03 : révoquer le jeton à droits larges ; QUA-08 : exécutions à 17:02 UTC que le fichier du flux ne peut pas produire | Hypothèse vérifiée dans le code : le message d'aide cite un jeton « créé pour cron-job.org » (`index.html:13347`) ; le filtre d'heure ne s'applique qu'aux déclenchements `schedule` (`daily-check.yml:22-29`), donc un déclenchement manuel externe le contourne. Identifier le déclencheur (T-002), créer les jetons de remplacement (déclencheur restreint ; application : un seul dépôt, expiration courte, car elle écrit dans `data/` par `index.html:12328-12330` et déclenche le flux par `13435`), les installer, puis révoquer l'ancien (T-003) | Révoquer avant remplacement coupe le contrôle quotidien et l'envoi de fichiers sans bruit |
| C-06 | PWA-02 (cache d'abord, rapide hors ligne) contre PERF-12 et fraîcheur des données | `index.html` et fichiers statiques : cache d'abord avec mise à jour en arrière-plan, versionnés. `data/*.json` : réseau avec délai de 3 s puis cache, clé sans `?t=` | Les données doivent rester à jour, le code peut être servi du cache |
| C-07 | PERF-06 : cache HTTP long ; remplacement d'images sous le même nom (`index.html:12575-12588`) | Pas de `immutable` ni durée d'un an ; un jour avec revalidation pour les images, `no-cache` pour `index.html` et `data/*.json` | Les téléphones garderaient l'ancienne image |
| C-08 | PERF-04 : tout précharger ; PWA-13 et PWA-08 : ménager forfait et stockage | Précharger les images seulement après conversion (environ 1,3 Mo au lieu de 25 Mo), en second lot après le noyau (T-035 puis T-037) | Le préchargement actuel de 11,8 Mo est le problème |
| C-09 | PERF-05 : charger `chart.umd.min.js` à la demande ; hors ligne | Le fichier reste dans le préchargement ; le chargement dynamique passe par le service worker (T-033) | Le graphique reste disponible sans réseau |
| C-10 | PERF-01 : convertir en WebP ; noms `.png` écrits en dur (`index.html:10095-10407`) et dans les fiches Firebase ; REF-09 et PERF-09 : suppressions | Garder les noms existants dans les données ; ajouter une correspondance `.png` vers `.webp` à l'affichage (point d'affichage : `index.html:12900` ; le sélecteur d'envoi force aussi `.png` aux nouveaux noms, `12519`, à traiter en T-035) ; garder les `.png` d'origine jusqu'à vérification des fiches Firebase (T-034 avant T-035) | Sinon les fiches existantes perdent leur image |
| C-11 | REF-01 et PERF-07 : découper `index.html` ; REF-12, PWA-02, PWA-07 : service worker | Version de cache automatique et liste de préchargement générée avant tout découpage (T-037) ; cache d'abord seulement après (T-039) ; chaque nouveau fichier ajouté au préchargement dans la même tâche que son extraction | Un `index.html` ancien avec des fichiers nouveaux casserait l'application |
| C-12 | SEC-02 (corriger maintenant) contre REF-01 (découper d'abord) | Corriger l'échappement sur le monolithe tout de suite (T-007) ; ne pas attendre le découpage | Faille exploitable aujourd'hui |
| C-13 | SEC-08 : CSP stricte ; code intégré et 23 `onclick=` en ligne (REF-14) | `_headers` avec anti-cadre, `nosniff`, `Referrer-Policy` et CSP en mode rapport seulement (T-046) ; CSP stricte reportée après découpage et retrait des `onclick` | Une CSP stricte casserait l'application |
| C-14 | SEC-08 et PERF-06 : deux fichiers `_headers` | Un seul fichier ; ne pas le lister dans `.assetsignore` ; `connect-src` mis à jour après T-026 (GitHub retiré) et T-053 (QR tiers retiré) | Les en-têtes ne se cumulent pas par fichier |
| C-15 | SEC-01 (jeton par personne) ajoute un aller-retour au démarrage ; PERF-02 veut en retirer | Obtenir le jeton juste après l'identité, en parallèle des lectures publiques ; conserver le jeton pour sa durée de validité (T-025 pose l'obtention du jeton, T-036 la place dans le démarrage en parallèle ; T-036 vient après T-025, sans aller-retour supplémentaire au final) ; T-025 étant reportée (D-17), T-036 ne dépend plus d'elle et le jeton y sera ajouté à la reprise | Le gain de PERF-02 reste net |
| C-16 | PWA-01 et QUA-11 : copie locale des données Firebase ; RGPD-06 et SEC-01 : limiter les données personnelles | Copie locale du contenu partagé (non personnel) et de ses propres inscriptions ; contacts SOS sur l'appareil seulement (décision D-06 du 2026-10-12, migration en T-024) ; jamais de copie des données d'autres personnes | Hors ligne utile sans multiplier les copies de données |
| C-17 | RGPD-07 (suppression, durées) contre CICD-13 et QUA-02 (sauvegardes) | Sauvegarde de `users/` à rotation de 30 jours maximum, dans un stockage privé gratuit (D-16) ; `contenu-partage/` (sans donnée personnelle) conservé plus longtemps ; une suppression de compte est répercutée en moins de 30 jours (T-020 ; T-051 reportée, D-17 ; durées D-04 : 12 mois sans ouverture, historique 24 mois) | Une sauvegarde sans limite annule l'effacement |
| C-18 | SEC-03 : route d'écriture GitHub dans le Worker ; les routes d'administration sont aujourd'hui en lecture seule (point positif SEC) | Nouvelle route en POST : jeton Access vérifié, e-mail administrateur, contrôle d'origine, chemins limités à `data/` et extensions d'images, taille plafonnée, jeton GitHub restreint en secret Cloudflare (T-026) ; volet dépôt de fichiers à confirmer avec T-019 (D-11) | La surface d'écriture nouvelle doit être aussi stricte que `/api/push/*` |
| C-19 | CICD-06 : protection de `main` ; le flux quotidien et les envois web commitent directement sur `main` (`daily-check.yml:47-51`) | Protection de `main` avec exception pour le compte du flux automatique, ou commits de données hors `main` ; D-11 décidé (2026-10-12) : protection de `main` acceptée ; l'envoi direct de fichiers par le web cesse, Charles-Henri livre par demande de fusion | Une protection stricte bloquerait le contrôle quotidien |
| C-20 | CICD-04 : commiter seulement si le contenu change ; `status.json` (`lastUpdate`) lu par le Worker (`worker/rappels.js:108`), la page (`index.html:14207`) et le préchargement | Garder un commit quotidien limité à `status.json` ; ne commiter les autres fichiers que s'ils changent (T-017). Sortir les données du dépôt reste reporté | `lastUpdate` sert de preuve de fraîcheur (T-015, T-041) |
| C-21 | CICD-01 : envoyer avant de commiter ; QUA-03 : garde sur le flux ; CICD-03 : verrou | Ordre : garde ICS (T-011), puis envoi avant validation des connus (T-012), puis verrou et reprise de poussée (T-014) | Chaque étape suppose la précédente |
| C-22 | CICD-05 : dossier `public/` ; REF-10 : sous-dossiers de `data/` ; sw.js, scripts, flux, build Cloudflare | Version simple d'abord (T-018). Un seul déplacement ultérieur, reporté (section 7) | Les chemins sont écrits dans cinq endroits |
| C-23 | SEC-02 : DOMPurify local ; règle « pas de dépendance sans nécessité » ; hors ligne | Échapper seulement ; assainissement par bibliothèque uniquement si les fiches doivent contenir du balisage (D-13 décidé : échapper seulement) | Moins de code à maintenir et à mettre en cache |
| C-24 | UX-01 (zoom) et UX-06 (champs à 14 px) | Même tâche : champs à 16 px et zoom rétabli ensemble (T-027) | Sinon zoom automatique non annulable sur iPhone |
| C-25 | UX-02 (historique de navigation) et UX-07 (fermeture des fenêtres par Retour) | UX-02 d'abord avec une petite fonction d'historique réutilisable ; la fabrique de fenêtres (T-069) s'y branche | Évite de refaire la navigation deux fois |
| C-26 | UX-05, UX-11, UX-12, REF-14 : variables CSS, thème clair, styles en ligne | Corriger les contrastes ciblés maintenant (T-030) ; variables CSS lors de l'extraction du style (T-064) ; thème clair et chantier de styles reportés | Pas de chantier dédié (règle du scout, REF-14) |
| C-27 | SEC-05 : changer le sujet ntfy ; téléphone de l'administrateur abonné à l'ancien | Réabonner l'appareil avec le nouveau sujet dans la même tâche (T-005) | Sinon les notifications cessent sans alerte |
| C-28 | SEC-01 et RGPD-03 : fermer toute la base ; D-17 : pas d'ouverture à tous (une ou deux personnes) | T-024 conservée (chemins sensibles fermés) ; T-025 (jeton par personne) reportée et remise en cause après T-024, d'après le tableau de T-006 | L'exposition résiduelle est limitée et le coût (effort L) disproportionné pour un usage personnel |
| C-29 | Tests bloquants (T-076 à T-078) ; flux quotidien qui commite sur `main` (C-19) ; minutes d'Actions limitées en dépôt privé (D-01) | Les tests de code bloquent la fusion (T-019, T-077) ; le flux quotidien lance seulement les vérificateurs de données (T-076) avant son commit et reste exempté de la protection ; minutes consommées notées | Un test bloquant ne doit pas arrêter le contrôle quotidien ni épuiser le quota gratuit |
| C-30 | QUA-10 et T-035 : validation par un formateur ; D-09 et D-10 : jamais de validation (refus de la Protection Civile) | Validation externe retirée des tâches ; compensation : mention visible « notes personnelles non validées » (T-073), vérification des logos (T-074), cohérence interne (T-061) | Aucune relecture externe possible ; le risque est réduit par l'information de l'utilisateur |

### 3.3 Dépendances d'ordre (chaînes)

- Vérifier Access (T-001) avant toute décision sur `data/` (T-018, T-054).
- Déclencheur (T-002) puis jeton (T-003) puis route Worker (T-026).
- Règles Firebase (T-006) puis sauvegarde (T-020) puis couche commune (T-021) puis fermeture (T-024) puis jetons par personne (T-025, reportée par D-17 : reprise à décider après T-024).
- Filet de vérification (T-009) avant toute modification large de `index.html` ou `sw.js`.
- Images : nettoyage (T-034) puis conversion (T-035) puis version de cache et préchargement (T-037) puis stratégie de cache (T-039).
- Version de cache automatique (T-037) puis mise à jour visible (T-038) puis découpage du monolithe (T-064 à T-066).
- Garde ICS (T-011) puis envoi fiable (T-012) puis verrou (T-014).
- Couche commune (T-021) avant démarrage en parallèle (T-036), écritures protégées (T-022) et contenus locaux (T-040).
- T-036 ne dépend plus de T-025 (reportée) ; l'obtention du jeton sera intégrée à la reprise de T-025.
- Tests : T-009 puis T-076 puis (T-016, T-019) puis T-077 (fumée) puis T-078 ; T-063 après T-077 ; T-079 au fil de T-064 à T-066.
- Mention secourisme (T-073) avant vérification des logos (T-074).
- Décisions D-03, D-04, D-17 prises le 2026-10-12 : vague 3 limitée à T-049, T-052, T-053, T-054 ; T-048, T-050, T-051, T-055, T-056 reportées.

## 4. Plan d'exécution par vagues

Légende : criticité retenue = la plus haute justifiée parmi les sources ; effort S / M / L.

### Vague 0 — Urgences (exposition, jetons, base ouverte)

- [ ] **T-001** Vérifier que Cloudflare Access couvre toutes les adresses du site (principale, `workers.dev`, aperçus) — Statut : En cours — Date : 2026-10-12
  - Sources : SEC-13 ; Criticité : Faible selon SEC-13, relevée à Fort si l'accès n'est pas couvert (`data/` et le site seraient publics) ; Effort : S ; Prérequis : aucun
  - Réussite : requête sans session sur chaque adresse = redirection de connexion ou 403 ; aperçus désactivés si inutiles (`preview_urls`) ; résultat noté dans l'historique.
  - Décision D-20 (2026-10-12) : le site est derrière Cloudflare Access (le désaccord CICD/SEC est tranché) ; cette tâche vérifie seulement que toutes les adresses sont couvertes.
  - Avancement (2026-10-12) : testé en navigation privée par Charles-Henri : `/`, `/data/events.json` et `/api/…` renvoient vers la connexion Access (adresse principale couverte). Aperçus (`Preview URLs`) et `workers.dev` activés dans Cloudflare : `"preview_urls": false` ajouté à `wrangler.jsonc` (branche `vague-0`). Après livraison (2026-10-12) : « Preview URLs » désactivé et toujours désactivé après déploiement. Reste : vérifier que les adresses d'aperçu ne répondent plus (test sur une adresse d'aperçu, si on en connaît une).
- [x] **T-002** Identifier le déclencheur réel du contrôle quotidien (hypothèse : service externe de planification appelant GitHub) — Statut : Fait — Date : 2026-10-12
  - Sources : QUA-08 ; Criticité : Moyen ; Effort : S ; Prérequis : aucun
  - Réussite : origine des exécutions de 17:02 UTC identifiée dans l'onglet Actions de GitHub (événement `schedule` ou `workflow_dispatch`) et documentée ; D-12 décidé (service externe conservé avec jeton restreint) ; alternative gratuite évaluée en T-075.
  - Constat (2026-10-12) : confirmé par Charles-Henri depuis la configuration du service : cron-job.org appelle le point d'entrée `workflow_dispatch` du workflow `daily-check.yml` de l'API GitHub (hypothèse confirmée). Le jeton utilisé y est un jeton à droits larges : à remplacer en T-003.
- [x] **T-003** Remplacer le jeton GitHub à droits larges : jeton restreint pour le déclencheur externe (un seul dépôt, droit Actions en écriture) et jeton temporaire à un seul dépôt (Contenu et Actions en écriture, expiration 30 jours) pour l'écran d'administration, puis révoquer l'ancien — Statut : Fait — Date : 2026-10-12
  - Sources : SEC-03 (volet immédiat), PWA-15 ; Criticité : Fort ; Effort : S ; Prérequis : T-002
  - Ordre imposé : 1) créer les deux jetons ; 2) mettre le nouveau jeton dans le service externe et vérifier une exécution ; 3) le coller dans l'application sur les appareils de l'administrateur (l'application s'en sert pour l'envoi de fichiers, `index.html:12328-12330`, et pour le déclenchement manuel, `13435`) ; 4) seulement alors révoquer l'ancien. Révoquer avant coupe le contrôle quotidien et l'envoi de fichiers.
  - Réussite : ancien jeton de type « classic » absent de la liste GitHub ; une exécution quotidienne et un envoi de fichier réussis après révocation ; jeton temporaire retiré par T-026. D-12 : le service externe est conservé, avec le jeton restreint (un seul dépôt, droit Actions en écriture).
  - Constat (2026-10-12, confirmé par Charles-Henri) : le déclencheur utilisait déjà un jeton à granularité fine (Actions en écriture, Metadata en lecture, un seul dépôt) nommé `eprotec-trigger`, sans date d'expiration ; aucun jeton « classic » restant ; jeton temporaire de l'application (Contenu et Actions, 30 jours) créé et saisi, envoi de fichier réussi. Point d'attention : donner une expiration (1 an) à `eprotec-trigger`. L'écran d'aide de l'application (`index.html:12290-12297`) explique encore comment créer un jeton « classic » avec `repo` : à corriger en T-026.
- [ ] **T-004** Passer le dépôt en privé, avec la préparation décrite par CICD-12 — Statut : En cours — Date : 2026-10-12
  - Sources : CICD-12, SEC §5, RGPD-01 (volet dépôt), RGPD-12 (volet journaux) ; Criticité : Moyen (selon CICD-12, RGPD-01, RGPD-12), placé en vague 0 car coordonnées de domicile, planning et journaux sont lisibles par tous si le dépôt est public ; Effort : S ; Prérequis : T-002, D-01
  - Calendrier (D-01) : décidé = après finalisation des corrections. Recommandation Claude à valider : passer en privé plus tôt, dès T-003 fait, car l'historique public contient déjà des données personnelles. Tant qu'elle n'est pas validée, T-004 s'exécute après les corrections.
  - Réussite : liste des copies (forks) consultée ; secrets GitHub listés par nom ; exécution manuelle du contrôle quotidien OK ; commit de test construit par Cloudflare ; alerte d'échec de flux reçue par e-mail ; analyse de secrets GitHub activée.
  - Avancement (2026-10-12, déclaré par Charles-Henri) : dépôt passé en privé ; aucune copie (fork) ; secrets listés par nom : les 16 utilisés par les workflows sont présents, aucun secret obsolète (`NTFY_TOPIC` absent) ; déploiement Cloudflare validé après livraison. « Secret scanning » non proposé par GitHub pour ce dépôt privé : critère non applicable (alternative possible : analyse par un outil gratuit dans le flux de vérification, à décider). Reste : exécution manuelle du contrôle quotidien confirmée, alerte d'échec de flux reçue par e-mail (Settings, Notifications, Actions).
- [x] **T-005** Changer le sujet ntfy partagé, le retirer du code, réabonner l'appareil — Statut : Fait — Date : 2026-10-12
  - Sources : SEC-05, RGPD-05 ; Criticité : Moyen ; Effort : S ; Prérequis : aucun
  - Réussite : secret `NTFY_TOPIC` remplacé ; plus aucune valeur de sujet dans `index.html` (recherche vide) ; une notification de test reçue sur le téléphone de l'administrateur. Le QR par service tiers est traité en T-053.
  - Décision D-22 (2026-10-12) : ntfy est retiré globalement (les rappels directs de l'application sont fonctionnels). La tâche devient : retirer ntfy de l'interface, du script d'envoi et du workflow, puis supprimer le secret `NTFY_TOPIC` et se désabonner de l'ancien sujet (plus de nouveau sujet ni de réabonnement). Le retrait côté Worker est la tâche T-080.
  - Avancement (2026-10-12, branche locale `vague-0`) : retirés de `index.html` les tuiles « Notifications (ntfy) » et « Partager les notifs (QR) », la fenêtre de partage (qui contenait le sujet en dur), le bloc « Complément : ntfy » et les actions associées ; retirés de `scripts/send-notifications.js` l'envoi ntfy et de `daily-check.yml` la variable `NTFY_TOPIC`. Vérifié : syntaxe, chargement sans erreur, tuiles absentes, plus aucune occurrence de ntfy dans `index.html` ni dans les scripts. Non vérifié : affichage de la fenêtre des notifications (non rendue dans le test). Reste : supprimer le secret `NTFY_TOPIC` dans GitHub, se désabonner dans l'application ntfy, vérifier la fenêtre des notifications sur l'appareil, puis T-080.
  - Vérifié après livraison (2026-10-12, par Charles-Henri) : ntfy supprimé (secret et abonnement) ; les notifications directes de l'application fonctionnent toujours. Le retrait côté Worker est la tâche T-080.
- [x] **T-006** Exporter et versionner les règles Firebase (dossier `regles-firebase/`), puis tester sans jeton la lecture et l'écriture de chaque chemin — Statut : Fait — Date : 2026-10-12
  - Sources : CICD-15, REF-16, SEC-01 (volet visibilité) ; Criticité : Fort (rend l'exposition réelle mesurable) ; Effort : S ; Prérequis : aucun
  - Réussite : fichier de règles présent (sans secret) ; tableau « chemin / lecture anonyme / écriture anonyme » consigné ; `.assetsignore` cohérent avec le dossier.
  - Résultat (2026-10-12) : fichier `regles-firebase/database.rules.json` et tableau d'accès dans `regles-firebase/LISEZMOI.md`. Constats : lecture et écriture anonymes ouvertes sur `/users/{uid}/…` (dont `sos-contacts`, `email`, `favoris`) et sur 9 sous-chemins de `/contenu-partage` ; `/users` (liste), `/` et `/notifs` fermés. Identifiants dérivés de l'e-mail, donc devinables. À traiter par T-024 (fermeture courte). T-025 (fermeture complète) est reportée par D-17 : à reconsidérer à la lumière de ce résultat (décision de Charles-Henri).
- [ ] **T-007** Échapper les contenus partagés affichés : lexique, titre et clé des fiches, recherche globale — Statut : En cours — Date : 2026-10-12
  - Sources : SEC-02 ; Criticité : Fort ; Effort : M ; Prérequis : aucun (ne pas attendre le découpage, C-12)
  - Réussite : un lexique ou une fiche contenant `<img src=x onerror=…>` s'affiche en texte (`index.html:12239-12240`, `6472-6483`, `6519-6520`) ; test ajouté à T-009.
  - Avancement (2026-10-12, branche locale `vague-0`) : code modifié aux 4 emplacements (lexique, recherche globale, recherche secourisme) et, par prudence, identifiants des boutons du lexique. Vérifié par navigateur automatisé : avant correctif 4 déclenchements, après 0, sur le lexique et la recherche globale. Vérifié sur appareil après livraison (2026-10-12) : une entrée de lexique `<b>test</b>` s'affiche telle quelle. Reste : cas d'une fiche personnalisée au titre piégé (non testé), test à reprendre dans T-009.
- [ ] **T-008** Sortir du code et des journaux les coordonnées de domicile, l'e-mail et l'identifiant de l'administrateur — Statut : En cours — Date : 2026-10-12
  - Sources : SEC-06, RGPD-01 (volet code), RGPD-12 ; Criticité : Moyen ; Effort : S ; Prérequis : aucun (indépendant du calendrier du passage en privé, D-01)
  - Réussite : coordonnées lues depuis une variable d'environnement (`check-events.js:124`) ; identifiant en dur retiré (`check-events.js:153`, `325`) ; journaux sans adresse (`send-notifications.js:94`, `96` ; `check-events.js:207`, `316`, `318`) ; anciens journaux d'exécution supprimés.
  - Avancement (2026-10-12, branche locale `vague-0`) : code modifié ; secrets GitHub attendus `EPROTEC_HOME_LAT`, `EPROTEC_HOME_LON`, `EPROTEC_ADMIN_UID` déclarés dans `daily-check.yml` ; journaux remplacés par un pseudonyme de 6 caractères ; repli e-mail retiré de `scripts/envoi-push.js`. Vérifié : syntaxe, exécution à vide sans variables (avertissements, aucun fichier `data/` modifié). Après livraison (2026-10-12) : 3 secrets créés ; exécution manuelle du workflow sans avertissement « absent ». Reste : suppression des anciens journaux d'exécution (geste manuel).

### Vague 1 — Filet de sécurité, flux quotidien, fermeture de la base

- [ ] **T-009** Vérification automatique avant mise en ligne : syntaxe de tous les scripts et des blocs de `index.html`, validité des JSON, noms de fonctions en double, `wrangler deploy --dry-run` — Statut : À faire — Date : —
  - Sources : QUA-01 (étapes 1 à 3), REF-03 (volet vérification), CICD-06 (volet vérification) ; Criticité : Fort ; Effort : S ; Prérequis : aucun
  - Réussite : `npm test` passe ; un flux GitHub s'exécute à chaque envoi et échoue si on casse la syntaxe volontairement (essai puis retour).
  - Périmètre : vérification 1 (syntaxe), doublons de fonctions, `--dry-run` ; les vérificateurs de données et de cohérence complets sont dans T-076 (groupe TESTS).
- [ ] **T-010** Documentation minimale : README (architecture, dossiers, noms des secrets sans valeur, mise en ligne et retour arrière Cloudflare), fichier d'instructions pour l'assistant, liste de contrôle manuelle ; documenter le Worker de traduction — Statut : À faire — Date : —
  - Sources : REF-03 (volet documentation), CICD-09 (documentation), REF-15 (documentation) ; Criticité : Fort ; Effort : S ; Prérequis : aucun
  - Réussite : README de plus de 40 lignes ; fichier d'instructions à la racine ; retour arrière testé une fois à blanc.
- [ ] **T-011** Garde sur le flux de calendrier : refuser une réponse vide, sans `BEGIN:VCALENDAR` ou en chute de plus de 50 % ; conserver les identifiants connus ; plafonner le courriel de nouveautés — Statut : À faire — Date : —
  - Sources : QUA-03 ; Criticité : Fort ; Effort : S ; Prérequis : T-009
  - Réussite : test avec texte vide = échec du contrôle et fichiers inchangés ; courriel limité à 20 éléments avec « et N autres ».
- [ ] **T-012** Envoi fiable des alertes : compter les envois, faire échouer l'étape si aucun destinataire n'est servi, contrôler la réponse ntfy, valider les connus après l'envoi, garder l'envoi sur l'application avec `if: always()` — Statut : À faire — Date : —
  - Sources : CICD-01, QUA-05 ; Criticité : Fort ; Effort : M ; Prérequis : T-011
  - Réussite : simulation d'échec de mail = flux en rouge, alerte reçue, nouveautés ré-annoncées au passage suivant.
- [ ] **T-013** Scripts : contrôler `res.ok` et la forme des réponses (lectures et écritures Firebase, jeton Google), délais et nouvelles tentatives sur les `fetch`, plafond de géocodages — Statut : À faire — Date : —
  - Sources : QUA-04, CICD-08 ; Criticité : Moyen ; Effort : M ; Prérequis : T-009
  - Réussite : lecture en erreur = utilisateur ignoré sans réécriture de son historique ; aucune statistique enregistrée à 0 sur erreur ; `timeout-minutes` posé sur les jobs.
- [ ] **T-014** Flux GitHub : groupe `concurrency` commun, `git pull --rebase` avant commit, suppression de l'attente de 120 s et du commentaire « GitHub Pages » — Statut : À faire — Date : —
  - Sources : CICD-03, CICD-11, REF-13 ; Criticité : Moyen ; Effort : S ; Prérequis : T-012
  - Réussite : deux exécutions simultanées ne se rejettent plus ; durée du flux réduite de 2 minutes.
- [ ] **T-015** Planification robuste du contrôle quotidien : remplacer « heure == 20 » par « dernier passage réussi il y a plus de 20 h » ou plage 20 h à 23 h ; corriger l'heure « Prochaine » affichée ; alerte du Worker si `lastUpdate` a plus de 36 h — Statut : À faire — Date : —
  - Sources : CICD-02, QUA-08 ; Criticité : Moyen ; Effort : S ; Prérequis : T-002
  - Réussite : un déclenchement retardé à 21 h Paris produit quand même le passage ; l'écran affiche la vraie prochaine heure.
- [ ] **T-016** Chaîne d'exécution figée : `package-lock.json` et `npm ci`, Node 22 ou 24, nodemailer à jour (après `npm audit`), actions épinglées par empreinte, `persist-credentials: false`, droits d'écriture limités à l'étape de commit, Dependabot — Statut : À faire — Date : —
  - Sources : SEC-09, SEC-10, CICD-07, CICD-10, QUA-18 ; Criticité : Moyen ; Effort : M ; Prérequis : T-009
  - Réussite : `npm ci` réussit ; envoi de mail de test OK après montée de version ; plus d'action référencée par étiquette seule.
- [ ] **T-017** Limiter les commits automatiques : commiter seulement les fichiers dont le contenu métier a changé ; garder `status.json` quotidien — Statut : À faire — Date : —
  - Sources : CICD-04 ; Criticité : Moyen ; Effort : S ; Prérequis : T-014
  - Réussite : un jour sans changement produit un seul commit (`status.json`) ; `events.json` non réécrit si identique.
- [ ] **T-018** Publication par exclusion complétée : `.gitignore` (`node_modules`, `.env*`, `*.local`, `.dev.vars`) et `.assetsignore` complété (`README.md`, `known-uids.json`, `geocache.json`, `dps-history.json`, `recent-new.json`) — Statut : À faire — Date : —
  - Sources : CICD-05, SEC-06 (volet publication) ; Criticité : Moyen ; Effort : S ; Prérequis : T-001
  - Réussite : ces fichiers renvoient une erreur 404 sur le site ; l'application et les rappels fonctionnent encore (C-01) ; `data/prompt-universel-generation-fiches.md`, `status.json`, `pending-notification.json` toujours servis.
- [ ] **T-019** Circuit de mise en ligne : branche de travail, demande de fusion avec vérification (T-009), protection de `main`, versions de prévisualisation Cloudflare — Statut : À faire — Date : —
  - Sources : CICD-06 ; Criticité : Moyen ; Effort : M ; Prérequis : T-009, D-11
  - D-11 décidé : protection de `main` acceptée ; Charles-Henri livre par demande de fusion ; la vérification (T-009, T-076, T-077) devient condition de fusion.
  - Réussite : un envoi direct sur `main` est refusé, le flux quotidien continue de commiter (C-19).
- [ ] **T-020** Sauvegarde hebdomadaire automatique : archive du dépôt et export Firebase en lecture seule vers un stockage gratuit distinct (D-16 : aucune solution payante ; étudier les quotas gratuits des artefacts GitHub Actions, d'un second dépôt privé, de l'export manuel local), rotation de 30 jours pour `users/` — Statut : À faire — Date : —
  - Sources : CICD-13 (et QUA-02, volet sauvegarde) ; Criticité : Moyen ; Effort : M ; Prérequis : T-006, D-16
  - Réussite : une restauration d'essai de `contenu-partage/` réussie ; étiquette Git de version stable posée ; coût nul vérifié (quotas gratuits notés par écrit).
- [ ] **T-021** Couche Firebase commune (`lireFirebase`, `ecrireFirebase`), migrée domaine par domaine sans changer le comportement — Statut : À faire — Date : —
  - Sources : REF-08 ; Criticité : Moyen ; Effort : M ; Prérequis : T-009
  - Réussite : plus aucune construction directe d'adresse `FIREBASE_URL` pour les domaines migrés ; vérification manuelle de 5 minutes OK après chaque domaine.
- [ ] **T-022** Écritures protégées : distinguer lecture réussie et lecture échouée, bloquer l'écriture après échec, contrôler la réponse des `PUT`, écritures ciblées — Statut : À faire — Date : —
  - Sources : QUA-02 ; Criticité : Moyen ; Effort : M ; Prérequis : T-021, T-020
  - Réussite : en simulant une lecture en erreur 401, aucune fiche partagée ni favori n'est écrasé (`index.html:5294-5301`, `5418-5423`, `1278-1300`) ; message d'échec affiché.
- [ ] **T-023** Échapper le reste : titres d'activités, journal des versions, courriels (titre, lieu, motifs, lien limité au domaine de l'application) — Statut : À faire — Date : —
  - Sources : SEC-07, QUA-19, SEC-04 (volet échappement) ; Criticité : Moyen ; Effort : S ; Prérequis : T-007
  - Réussite : un titre `<b>x</b> & y` ne produit aucune balise dans l'écran ni dans le courriel (test automatique).
- [ ] **T-024** Fermeture de la base, étape courte : déplacer `eprotec-cid`, `notif-prefs` et la liste des destinataires derrière des routes `/api/*` du Worker ; `sos-contacts` : migrer vers le stockage de l'appareil (D-06) puis supprimer le chemin côté serveur ; fermer ces chemins dans les règles ; encoder `cid` et valider les clés — Statut : À faire — Date : —
  - Sources : SEC-01 (volet court terme), RGPD-03, RGPD-06 (volet stockage), SEC-04 (liste côté Worker, plafond d'envois), SEC-11 ; Criticité : Fort ; Effort : M ; Prérequis : T-006, T-020, T-021, T-001, D-06 (décidé)
  - Réussite : lecture et écriture anonymes de ces chemins refusées (tableau de T-006 mis à jour) ; chaque écran concerné testé à la main ; envoi de mails limité par exécution ; contacts SOS existants migrés sur l'appareil avant la fermeture, puis absents de Firebase.
- [ ] **T-025** Fermeture de la base, étape complète (ancien « Temps 2 ») : jeton Firebase par personne émis par le Worker, règles `auth.uid === $uid`, `contenu-partage` en lecture seule côté client et écriture administrateur par le Worker ; identité inconnue = lecture seule — Statut : À faire — Date : —
  - Sources : SEC-01, RGPD-03, QUA-07 ; Criticité : Fort ; Effort : L ; Prérequis : T-024, T-020, T-021 (le jeton est obtenu juste après l'identité ; T-036, en vague 2, intègre ensuite cette obtention dans le démarrage en parallèle, C-15)
  - Découpage (D-23, 2026-10-12) : le volet `contenu-partage` en écriture réservée à l'administrateur est sorti dans T-081 (« T-025a »). T-025 ne porte plus que le jeton par personne et `auth.uid === $uid` (« T-025b »), toujours reporté.
  - Report : D-17 (2026-10-12), pas d'ouverture à tous (lui seul, une ou deux personnes) : à remettre en cause après T-024. Reprise si l'exposition résiduelle du tableau de T-006 est jugée inacceptable ou si plus de deux personnes sont invitées. En attendant : `NOTIFS_OUVERTES_A_TOUS` reste `"false"`.
  - Réussite : lecture et écriture anonymes refusées sur tous les chemins ; un utilisateur ne lit pas l'espace d'un autre (test avec deux comptes) ; plus d'écriture sous `users/default`.
- [ ] **T-081** (« T-025a ») `contenu-partage` en écriture réservée à l'administrateur : route du Worker vérifiant l'identité Cloudflare Access, écriture par le compte de service, règles Firebase `.write: false` côté client sur les 9 sous-chemins ; lecture inchangée — Statut : À faire — Date : —
  - Sources : SEC-01 (volet contenu partagé), RGPD-03 ; Criticité : Moyen (une fiche, un quiz ou un lexique modifié par un tiers est dangereux dans une application de secourisme) ; Effort : M ; Prérequis : T-024, T-021, T-001
  - Réussite : écriture anonyme sur `contenu-partage` refusée (simulateur et tableau de `regles-firebase/LISEZMOI.md` mis à jour) ; l'administrateur modifie lexique, quiz et fiches depuis l'application comme avant ; une tentative d'écriture sans identité Access est refusée par le Worker ; sauvegarde (T-020) faite avant la fermeture.
  - Raison du découpage : réduit l'exposition qui touche le contenu de secourisme sans imposer le jeton par personne (D-17 : usage personnel).
- [ ] **T-026** Route Worker réservée à l'administrateur pour déclencher le flux (dépôt de fichiers dans `data/` : à confirmer avec T-019, D-11) ; retirer le jeton GitHub de l'application — Statut : À faire — Date : —
  - Sources : SEC-03 (volet durable), PWA-15 ; Criticité : Fort ; Effort : M ; Prérequis : T-003, T-001
  - Réussite : plus aucune occurrence de `GH_TOKEN_KEY` ni d'appel à `api.github.com` dans `index.html` ; dernier jeton révoqué ; contrôles de C-18 en place.

- [ ] **T-073** Mention visible dans la section Secourisme et sur le quiz : « notes personnelles non validées, ne remplacent ni la formation ni les protocoles officiels » — Statut : À faire — Date : —
  - Sources : décisions D-09 et D-10 (pas de validation par un formateur), QUA-10 (volet contenu) ; Criticité : Moyen ; Effort : S ; Prérequis : validation par Charles-Henri de la recommandation D-10
  - Réussite : mention lisible en haut de la section Secourisme, sur chaque fiche (ou en pied) et sur l'écran du quiz ; contraste conforme (T-030) ; vérifiée sur écran de téléphone.
- [ ] **T-074** Vérifier que les logos de la Protection Civile n'induisent pas l'idée d'un contenu officiel — Statut : À faire — Date : —
  - Sources : décisions D-09 et D-10 ; Criticité : Moyen ; Effort : S ; Prérequis : T-073
  - Réussite : liste des emplacements des logos (écrans, icônes, manifeste, aperçu de partage) ; chacun retiré, remplacé ou accompagné de la mention de T-073 ; choix noté dans l'historique.
- [ ] **T-076** TESTS (a) — Vérificateurs de données et de cohérence en `node:test`, sans dépendance, lancés par `npm test` et par le flux quotidien avant le commit des données : vérifications 2 (données) et 3 (contenu) de AUDIT_QUALITE section 4 — Statut : À faire — Date : —
  - Sources : QUA-01 (vérifications 2 et 3), QUA-03, QUA-08, QUA-10, QUA-14, QUA-15 ; Criticité : Moyen ; Effort : S ; Prérequis : T-009
  - Contenu : `data/*.json` valides ; `events.json` sans doublon d'identifiant, dates ISO, `dateFin` ≥ `dateDebut` ; `known-uids.json` = identifiants des événements ; `suggestions.json` inclus dans `events.json` ; `status.json.lastUpdate` de moins de 36 h ; `changelog.json` sans version en double ; clés de fiches uniques, catégories cohérentes, quiz (`correctIndex`, options sans doublon, `explication`).
  - Réussite : `npm test` passe sur les données actuelles (exceptions connues datées : 5 explications manquantes jusqu'à T-061, 3 fonctions en double jusqu'à T-057) ; un fichier volontairement corrompu le fait échouer ; `package.json` sans nouvelle dépendance ; la mise en ligne est bloquée si un test échoue (condition de fusion, T-019).
- [ ] **T-077** TESTS (c), volet 1 — Test de fumée de bout en bout avec Playwright dans GitHub Actions : chargement de la page sans erreur, accueil affiché, services réels bloqués ou simulés ; exécuté à chaque modification, gratuit — Statut : À faire — Date : —
  - Sources : QUA-01 (test de bout en bout, élément « plus tard »), CICD-06 (volet vérification) ; Criticité : Moyen ; Effort : M ; Prérequis : T-009, T-016, T-019, T-076
  - Réussite : le flux de vérification lance le test à chaque poussée et demande de fusion ; une erreur volontaire dans `index.html` le fait échouer ; la mise en ligne est bloquée si un test échoue (vérification obligatoire sur `main`, T-019) ; aucun appel vers Firebase, GitHub, ntfy ni service tiers réel (réseau intercepté) ; outil installé en dépendance de développement épinglée (nom exact `@playwright/test`, existence et maintenance vérifiées, jamais publiée sur le site) ; coût nul : minutes d'Actions consommées notées (C-29).
- [ ] **T-080** Retirer le canal ntfy du Worker (`worker/notifs.js` : route `/api/push/ntfy`, envoi `envoyerNtfy`, identifiant `ntfy` ; `worker/rappels.js` ; commentaires de `worker/index.js`) et purger les appareils `ntfy` déjà enregistrés dans Firebase — Statut : À faire — Date : —
  - Sources : D-22 (décision de Charles-Henri), SEC-05, RGPD-05 ; Criticité : Faible ; Effort : S ; Prérequis : T-005
  - Réussite : plus aucune occurrence de `ntfy` dans `worker/` ; test des rappels sur l'application (test d'envoi) avant et après ; entrée `ntfy` supprimée dans `notifs/{uid}/appareils/` ; le Worker se déploie sans erreur.
  - Raison de la séparation : le Worker ne peut pas être testé ici de bout en bout ; il touche les rappels qui fonctionnent aujourd'hui.


### Vague 2 — Terrain : hors-ligne, performance, accessibilité vitale

- [ ] **T-027** Rétablir le zoom et passer les champs de saisie à 16 px — Statut : À faire — Date : —
  - Sources : UX-01, UX-06 (taille des champs) ; Criticité : Fort ; Effort : S ; Prérequis : aucun
  - Réussite : `maximum-scale` et `user-scalable=no` absents (`index.html:5`) ; pas de zoom automatique à la saisie sur iPhone.
- [ ] **T-028** Historique de navigation : une entrée par écran, réaction à Retour, défilement remis en haut — Statut : À faire — Date : —
  - Sources : UX-02 ; Criticité : Fort ; Effort : M ; Prérequis : T-009
  - Réussite : sur Android, Retour depuis une fiche revient à la liste puis à « Plus », et ne quitte l'application qu'à l'accueil.
- [ ] **T-029** Zones tactiles de 44 px et noms accessibles des boutons-icônes (34 boutons « ‹ », étoile, effacement, 🔊)  ; l'alternative visible au geste caché est reportée (D-14 : geste conservé, alternative à confirmer plus tard) — Statut : À faire — Date : —
  - Sources : UX-03 ; Criticité : Fort ; Effort : M ; Prérequis : D-14
  - Réussite : aucun bouton-icône sans `aria-label` ; cibles mesurées à 44 px minimum.
- [ ] **T-030** Contrastes corrigés (texte `#6F86AD`, étoile inactive, orange sur fond bleu, jours passés du calendrier) — Statut : À faire — Date : —
  - Sources : UX-05 ; Criticité : Moyen ; Effort : S ; Prérequis : aucun
  - Réussite : rapports recalculés d'au moins 4,5:1 pour le texte, 3:1 pour l'étoile.
- [ ] **T-031** Correctifs immédiats du service worker : ne cacher la navigation que si réponse correcte, exclure `/cdn-cgi/`, cacher les JSON sans `?t=` (et retirer `?t=` côté application), refuser les adresses de notification d'une autre origine — Statut : À faire — Date : —
  - Sources : PWA-04, QUA-09, SEC-12, PWA-06, PERF-03, PERF-12, PWA-10 ; Criticité : Moyen ; Effort : M ; Prérequis : T-009
  - Réussite : simulation d'une navigation en erreur 500 ne remplace pas la copie hors ligne ; une journée d'usage n'ajoute pas d'entrée par appel de `status.json` ; hors ligne, la dernière version de `events.json` s'affiche ; `CACHE_NAME` incrémenté.
- [ ] **T-032** Images de fiches : `loading="lazy"`, `decoding="async"`, largeur et hauteur — Statut : À faire — Date : —
  - Sources : PERF-11 ; Criticité : Moyen ; Effort : S ; Prérequis : aucun
  - Réussite : l'ouverture d'une catégorie ne télécharge que les images visibles (onglet réseau du navigateur).
- [ ] **T-033** Charger `chart.umd.min.js` à la demande (ou `defer`) — Statut : À faire — Date : —
  - Sources : PERF-05 ; Criticité : Moyen ; Effort : S ; Prérequis : aucun
  - Réussite : le fichier n'est plus dans l'en-tête de `index.html` ; l'écran de rapport affiche toujours le graphique, y compris hors ligne.
- [ ] **T-034** Nettoyage des fichiers de `data/` : `img-7992.jpeg` (image véhicule, plaque lisible), `autodefense-poignet-2mains.png.png`, doublon de l'image « rachis » (laquelle garder : reste à choisir avec Charles-Henri), vérification préalable des fiches Firebase — Statut : À faire — Date : —
  - Sources : PERF-09, REF-09, PWA-12, RGPD-11 ; Criticité : Moyen ; Effort : S ; Prérequis : D-08, T-006
  - Réussite : liste des images réellement citées par les fiches Firebase établie ; fichiers validés supprimés du dépôt et de la copie du projet ; une seule image « rachis » conservée (choix noté dans l'historique).
- [ ] **T-035** Optimiser les images (WebP, 1000 px, environ 80 % de qualité), étendre le redimensionnement au sélecteur de fichier, correspondance `.png` vers `.webp` à l'affichage — Statut : À faire — Date : —
  - Sources : PERF-01 ; Criticité : Fort ; Effort : M ; Prérequis : T-034, D-09 (décidé : validation visuelle par Charles-Henri)
  - Réussite : ensemble des images sous 2 Mo ; aucune fiche existante sans image ; schémas relus visuellement par Charles-Henri, texte lisible (aucune validation de formateur, D-09).
- [ ] **T-036** Démarrage en parallèle : identité d'abord, puis lectures partagées, données `data/` et changelog dans un `Promise.all` ; lancer l'affichage des événements dès qu'ils arrivent — Statut : À faire — Date : —
  - Sources : PERF-02, PERF-08 ; Criticité : Fort ; Effort : M ; Prérequis : T-021 (T-025 reportée : l'obtention du jeton y sera intégrée à la reprise, C-15)
  - Réussite : plus de 14 appels en série dans `loadData` (`index.html:14100-14115`) ; premiers événements affichés plus vite (mesure avant/après sur réseau lent).
- [ ] **T-037** Version de cache automatique et liste de préchargement générée ; noyau bloquant (page, manifeste, graphique) puis images en second lot ; images de fiches prioritaires incluses — Statut : À faire — Date : —
  - Sources : REF-12, PWA-03, PERF-04, PWA-13, QUA-11 (images) ; Criticité : Moyen ; Effort : M ; Prérequis : T-035, T-009
  - Réussite : plus de numéro de cache à la main ; toutes les images de fiches ouvrables hors ligne sans visite préalable ; installation signale un cache partiel.
- [ ] **T-038** Mise à jour visible : bandeau « nouvelle version disponible », fin du rechargement automatique pendant une saisie — Statut : À faire — Date : —
  - Sources : PWA-07 ; Criticité : Moyen ; Effort : M ; Prérequis : T-037
  - Réussite : plus de `window.location.reload()` automatique sur changement de `status.json` ; bandeau affiché après déploiement de test.
- [ ] **T-039** Stratégie de cache : page et statiques « cache d'abord + mise à jour en arrière-plan », `data/*.json` « réseau 3 s puis cache », délai maximal de 5 s sur les appels de démarrage — Statut : À faire — Date : —
  - Sources : PWA-02 ; Criticité : Fort ; Effort : M ; Prérequis : T-037, T-038, T-031
  - Réussite : avec une connexion simulée très lente, l'application s'affiche en moins de 5 s à partir du cache.
- [ ] **T-040** Copie locale des contenus partagés (fiches ajoutées, quiz, lexique, classement) et de ses propres inscriptions, avec date affichée — Statut : À faire — Date : —
  - Sources : PWA-01, QUA-11 (inscriptions) ; Criticité : Fort ; Effort : M ; Prérequis : T-021, D-06
  - Réussite : en mode avion, les fiches ajoutées et le lexique s'affichent avec « contenu du jj/mm » ; « Mes inscriptions » non vide.
- [ ] **T-041** Messages d'erreur et état des données : bandeau « données non à jour », validation de forme, gestionnaire global d'erreurs, bouton « Réessayer », fin des `alert()` et du jargon Firebase — Statut : À faire — Date : —
  - Sources : QUA-06, UX-09 ; Criticité : Moyen ; Effort : M ; Prérequis : T-015
  - Réussite : un `events.json` invalide affiche un message clair ; aucune occurrence de « règles de la base Firebase » à l'écran ; 16 `alert(` remplacés.
- [ ] **T-042** Stockage persistant (`navigator.storage.persist()`), invitation à installer l'application, date de dernière synchronisation dans les réglages — Statut : À faire — Date : —
  - Sources : PWA-08 ; Criticité : Moyen ; Effort : S ; Prérequis : aucun
  - Réussite : appel présent ; message d'installation affiché hors mode installé.
- [ ] **T-043** Page hors ligne dédiée et suppression de `bilan.html` (D-08) — Statut : À faire — Date : —
  - Sources : PWA-14, REF-11 ; Criticité : Faible ; Effort : S ; Prérequis : D-08
  - Réussite : premier lancement sans réseau = message clair ; `bilan.html` supprimé du dépôt, de la copie du projet et du préchargement, après vérification qu'aucun code ne le référence.
- [ ] **T-044** Renouvellement automatique de l'abonnement de notification (`pushsubscriptionchange`) et revalidation à l'ouverture — Statut : À faire — Date : —
  - Sources : PWA-09 ; Criticité : Faible ; Effort : S ; Prérequis : T-031
  - Réussite : gestionnaire présent ; abonnement refait sans action après invalidation simulée.
- [ ] **T-045** Icônes statiques (dont « maskable » plein cadre, icône iOS fixe) et manifeste complété (`id`, raccourcis, catégories, orientation) — Statut : À faire — Date : —
  - Sources : PWA-05, PWA-11 ; Criticité : Faible ; Effort : S ; Prérequis : T-037
  - Réussite : Lighthouse ou PWABuilder sans avertissement d'icône ; fichiers ajoutés au préchargement.
- [ ] **T-046** Fichier `_headers` : anti-cadre, `nosniff`, `Referrer-Policy`, cache HTTP modéré, CSP en mode rapport seulement — Statut : À faire — Date : —
  - Sources : SEC-08, PERF-06 ; Criticité : Faible ; Effort : M ; Prérequis : T-007, T-035
  - Réussite : en-têtes présents sur le site ; rapport CSP relu sans blocage de l'application ; pas de `immutable` (C-07).
- [ ] **T-047** Recherche d'événements : délai anti-rebond de 150 à 200 ms et précalcul du tri — Statut : À faire — Date : —
  - Sources : PERF-10 ; Criticité : Faible ; Effort : S ; Prérequis : aucun
  - Réussite : un seul rendu par saisie rapide.
- [ ] **T-078** TESTS (c), volet 2 — Tests de bout en bout Playwright complétés : navigation entre onglets, ouverture d'une fiche de secourisme, mode hors ligne avec le service worker (premier chargement puis rechargement sans réseau), sans accès aux services réels — Statut : À faire — Date : —
  - Sources : QUA-01 (vérification 7 et test de bout en bout), QUA-09 ; Criticité : Moyen ; Effort : M ; Prérequis : T-077, T-031
  - Réussite : 3 scénarios verts dans le flux de vérification ; le test hors ligne échoue si la copie hors ligne est remplacée par une page d'erreur (simulation 500) ; durée totale sous 5 minutes ; tests relus après T-037 et T-039 (changement de stratégie de cache) ; la mise en ligne est bloquée si un test échoue (T-019).

### Vague 3 — Conformité RGPD (usage personnel, ouverture limitée)

Condition de la vague : `NOTIFS_OUVERTES_A_TOUS` reste `"false"` (pas d'ouverture à tous, D-17). Avant d'inviter une ou deux personnes : reprendre T-048 (version courte), T-051 (version simple) et réévaluer T-025. Les tâches conditionnées à l'ouverture sont reportées et remises en cause une à une (section 7).

- [ ] **T-048** Texte d'information (écran À propos / Confidentialité), acceptation datée, registre des traitements d'une page, inventaire des sous-traitants — Statut : À faire — Date : —
  - Sources : RGPD-02, RGPD-09 (inventaire) ; Criticité : Moyen (bloquant avant ouverture) ; Effort : M ; Prérequis : D-03, D-17
  - Report : D-17 (2026-10-12). Si une ou deux personnes sont invitées : note d'information d'une page (responsable de traitement : Charles-Henri, D-03) et accord noté ; registre et inventaire complets seulement si l'ouverture s'élargit.
  - Réussite : texte affiché au premier lancement ; date d'acceptation journalisée ; liste des sous-traitants avec finalité et localisation.
- [ ] **T-049** E-mails seulement pour les personnes ayant activé l'option, avec lien de désinscription — Statut : À faire — Date : —
  - Sources : RGPD-04 ; Criticité : Moyen ; Effort : S ; Prérequis : T-024, D-07
  - Réussite : un utilisateur sans préférence ne reçoit rien ; chaque courriel contient un lien de désinscription fonctionnel.
- [ ] **T-050** Contacts SOS : stockage sur l'appareil (ou espace protégé), information sur l'envoi des coordonnées à OpenStreetMap — Statut : À faire — Date : —
  - Sources : RGPD-06 ; Criticité : Moyen ; Effort : S ; Prérequis : T-024, D-06 (décidé)
  - Report : D-17 ; le volet stockage est transféré à T-024 (D-06 décidé : contacts SOS sur l'appareil seulement). Reste la mention de l'envoi des coordonnées à OpenStreetMap, à porter par la note d'information de T-048 à sa reprise.
  - Réussite : plus de contacts SOS lisibles côté serveur sans jeton (vérifié en T-024) ; mention dans le texte d'information.
- [ ] **T-051** Durées de conservation et droits : suppression de compte inactif, « Supprimer mes données », « Exporter mes données » — Statut : À faire — Date : —
  - Sources : RGPD-07 ; Criticité : Moyen ; Effort : M ; Prérequis : T-025 (reportée), T-020, D-04 (décidé)
  - Report : D-17 (2026-10-12). Durées retenues (D-04) : compte supprimé après 12 mois sans ouverture, historique limité à 24 mois ; pour une ou deux personnes, suppression et export faits à la demande par Charles-Henri tant que la tâche n'est pas reprise.
  - Réussite : suppression d'un compte d'essai effective en moins de 30 jours y compris sauvegardes (C-17) ; export obtenu.
- [ ] **T-052** Bilan victime conservé pour usage personnel (D-05) : stockage uniquement sur l'appareil, suppression automatique après export ou délai court, accès par le geste caché, avertissement avant partage — Statut : À faire — Date : —
  - Sources : RGPD-08 ; Criticité : Moyen ; Effort : S ; Prérequis : D-05
  - Réussite : aucune écriture du bilan dans Firebase ni dans un fichier partagé (recherche dans le code et contrôle du réseau) ; suppression automatique effective après export ou au délai fixé (24 h proposé) ; accès uniquement par le geste caché ; aucune ouverture à d'autres utilisateurs sans nouvelle décision. Hors condition de la vague : à traiter dès que possible.
- [ ] **T-053** Services tiers : QR codes générés dans le navigateur, retrait de `api.qrserver.com`, versionner le Worker de traduction et vérifier sa conservation de données — Statut : À faire — Date : —
  - Sources : RGPD-09 (actions), REF-15 (versionner), SEC-05 (volet QR) ; Criticité : Moyen ; Effort : M ; Prérequis : T-010
  - Réussite : plus d'appel vers `api.qrserver.com` (`index.html:12639`, `12658`) ; code du Worker de traduction dans le dépôt ; `connect-src` de T-046 mis à jour (QR tiers retiré).
- [ ] **T-054** Fichier partagé d'inscriptions (D-19 : probablement inutile) : 1) vérifier par recherche qu'aucun code ne le lit (page `index.html:14067`, `14124`, `sw.js:30`, Worker, scripts ; la page lit aussi la version personnelle Firebase, `index.html:14130`) ; 2) si aucune lecture ne subsiste : le retirer de la publication et du suivi, et retirer `dejaInscrit` des fichiers écrits — Statut : À faire — Date : —
  - Sources : RGPD-01, SEC-06 ; Criticité : Moyen ; Effort : M ; Prérequis : T-001, T-004, D-19
  - Réussite : `registrations-history.json` et `dps-history.json` plus servis ni versionnés ; l'application, « Mes inscriptions » et les rappels fonctionnent (C-01, C-02) ; entrée retirée du préchargement ; liste des lecteurs du fichier établie avant retrait (vide ou corrigée).
- [ ] **T-055** Purge de l'historique Git des fichiers personnels et photo — Statut : À faire — Date : — (reportée, D-02)
  - Sources : RGPD-01 (purge), RGPD-11 ; Criticité : Moyen ; Effort : M ; Prérequis : D-02, T-004, T-054, T-034, flux automatiques arrêtés ; Report : D-02 (2026-10-12), à réévaluer après T-004
  - Réussite : recherche des fichiers dans l'historique vide ; nouveau clonage fait ; sauvegardes antérieures détruites ; lien Cloudflare reconfirmé. D-02 décidé le 2026-10-12 : pas de purge pour l'instant ; tâche reportée, à réévaluer après T-004 ; si non retenue à cette date, passer en `Écarté`.
- [ ] **T-056** Rappels : réservation du marquage avant l'envoi, lecture groupée des utilisateurs, plafond et pagination — Statut : À faire — Date : —
  - Sources : QUA-17 ; Criticité : Faible aujourd'hui, Moyen avant ouverture ; Effort : M ; Prérequis : T-025 (reportée)
  - Report : D-17 (2026-10-12) ; Faible aujourd'hui (usage personnel). Reprise avec T-025 ou si le nombre d'utilisateurs augmente.
  - Réussite : deux exécutions croisées n'envoient pas deux fois ; 200 utilisateurs traités sans dépasser la limite de sous-requêtes.

### Vague 4 — Dette technique et découpage

- [ ] **T-057** Supprimer le code mort et les doublons : `escapeHtml` (garder la version qui échappe les guillemets), `showEditFicheModal`, `setupConseilsProdigues`, 8 fonctions jamais appelées — Statut : À faire — Date : —
  - Sources : REF-04, REF-05, QUA-14 ; Criticité : Moyen ; Effort : S ; Prérequis : T-009, T-007, D-08
  - Réussite : contrôle « aucune fonction définie deux fois » vert ; comparaison de la version morte de `setupConseilsProdigues` faite avant suppression.
- [ ] **T-058** Contrôle quotidien : jour et heure forcés en `Europe/Paris`, critère « Mois sans DPS planifié » décidé, dates nulles ignorées, départage des scores — Statut : À faire — Date : —
  - Sources : QUA-12, QUA-13 ; Criticité : Faible ; Effort : S ; Prérequis : T-009
  - Réussite : tests sur les changements d'heure OK ; plus de suggestion avec écart de 1970.
- [ ] **T-059** Journal des versions : version dérivée du dépôt, retrait de `scripts/**` du déclencheur, message d'erreur explicite — Statut : À faire — Date : —
  - Sources : QUA-15, CICD-14 ; Criticité : Faible ; Effort : S ; Prérequis : T-037
  - Réussite : version affichée = version déployée ; commits « Add files via upload » produisent une entrée.
- [ ] **T-060** Observabilité : `observability` dans `wrangler.jsonc`, route d'administration de santé détaillée, dernier bilan d'envoi affiché — Statut : À faire — Date : —
  - Sources : QUA-16, CICD-09 (journaux) ; Criticité : Faible ; Effort : M ; Prérequis : T-024 (T-025 reportée)
  - Réussite : un arrêt des rappels devient visible dans l'écran d'administration.
- [ ] **T-061** Cohérence interne des fiches et du quiz, sans validation externe (D-10) : question q15, seuils, tranches d'hypothermie, 5 explications manquantes, puis table de seuils unique — Statut : À faire — Date : —
  - Sources : QUA-10 ; Criticité : Moyen ; Effort : S puis M ; Prérequis : D-10 (décidé), T-073
  - Réussite : incohérences de QUA-10 corrigées, ou signalées dans la fiche, par Charles-Henri à partir de sources officielles qu'il choisit ; contrôle « toute question a une explication » vert (T-076) ; seuils définis une seule fois. Aucune validation de formateur exigée ; la mention de T-073 reste affichée.
- [ ] **T-062** Configuration unique (adresse Firebase, domaine, e-mail administrateur) ; retrait de l'identifiant de compte Cloudflare des liens publics — Statut : À faire — Date : —
  - Sources : REF-07, SEC-14 ; Criticité : Faible ; Effort : S ; Prérequis : T-008, T-021
  - Réussite : chaque valeur définie à un seul endroit par couche.
- [ ] **T-063** TESTS (b), partie 1 — Tests unitaires de la logique pure hors `index.html` (fonctions du Worker, analyse ICS et regroupements du contrôle quotidien, service worker, échappement) avec le lanceur intégré à Node (`node:test`, sans dépendance) — Statut : À faire — Date : —
  - Sources : QUA-01 (étapes 5 à 9, vérifications 5, 6, 7, 8, 9) ; Criticité : Moyen ; Effort : M ; Prérequis : T-009, T-076, T-077 (ordre : vérificateurs de données et test de fumée d'abord)
  - Réussite : `npm test` couvre les cas listés dans AUDIT_QUALITE section 4 ; la mise en ligne est bloquée si l'un de ces tests échoue (T-019).
- [ ] **T-064** Sortir du script les données statiques et le style (`BILAN_CATEGORIES`, `CONSEILS_PAR_PROBLEME`, `GESTE_ILLUSTRATIONS`, bloc CSS) ; variables CSS ; chaque fichier ajouté au préchargement — Statut : À faire — Date : —
  - Sources : REF-01 (étapes 4 et 5), PERF-07 (partie) ; Criticité : Fort (REF-01) ; Effort : M ; Prérequis : T-037, T-039, T-057, T-009
  - Réussite : `index.html` allégé ; application identique ; hors ligne OK.
- [ ] **T-065** Regrouper l'état global par domaine (`etatUtilisateur`, `etatCalendrier`, `etatBilan`, `etatFiches`) — Statut : À faire — Date : —
  - Sources : REF-02 ; Criticité : Moyen ; Effort : M ; Prérequis : T-064
  - Réussite : plus de variable globale modifiable hors de son domaine pour les domaines migrés.
- [ ] **T-066** Découpage par écran (un écran par session) et réduction des fonctions de plus de 100 lignes, en commençant par `loadData` et le bilan ; code administrateur isolé — Statut : À faire — Date : —
  - Sources : REF-01, REF-06, PERF-07 ; Criticité : Fort (REF-01) ; Effort : L ; Prérequis : T-065, T-021, T-039
  - Réussite : un fichier par écran, tous dans le préchargement généré ; vérification manuelle de 5 minutes après chaque écran.
- [ ] **T-075** Évaluer une alternative gratuite au service externe de planification du contrôle quotidien (déclencheur planifié Cloudflare sur le Worker, ou `schedule` GitHub) ; le service externe reste en place en attendant — Statut : À faire — Date : —
  - Sources : QUA-08, CICD-02, décision D-12 (un service doit analyser chaque jour) ; Criticité : Faible ; Effort : S ; Prérequis : T-003, T-015
  - Réussite : tableau comparatif consigné (gratuité, ponctualité mesurée sur 7 jours, droits et jeton nécessaires, panne visible) ; recommandation écrite et soumise à Charles-Henri ; si une alternative est retenue : bascule faite et jeton du service externe révoqué ; sinon service externe conservé avec jeton restreint (T-003).
- [ ] **T-079** TESTS (b), partie 2 — Tests unitaires sur les fonctions extraites de `index.html`, ajoutés progressivement : à chaque extraction d'une fonction pure (échappement, calculs de dates, regroupements, seuils du bilan), son test `node:test` est créé dans la même tâche — Statut : À faire — Date : —
  - Sources : QUA-01, REF-03 (partie), REF-01 ; Criticité : Moyen ; Effort : L (progressif, au fil des extractions) ; Prérequis : T-063, T-057, T-064 (puis T-065, T-066 écran par écran)
  - Réussite : chaque fonction extraite a son test ; aucun test ne charge le monolithe entier ; liste des fonctions testées dans le README (T-010) ; la mise en ligne est bloquée si un test échoue.

### Vague 5 — Accessibilité et confort d'usage

- [ ] **T-067** Taille du texte : plancher de 12 px pour les métadonnées, 14 à 16 px pour le contenu des fiches, réglage « taille du texte » — Statut : À faire — Date : —
  - Sources : UX-04 ; Criticité : Moyen ; Effort : M ; Prérequis : T-027, T-064
  - Réussite : plus de `font-size` inférieur à 12 px hors icônes.
- [ ] **T-068** Formulaires : libellés reliés (`for`/`id`), `inputmode` numérique ou décimal, `autocomplete` — Statut : À faire — Date : —
  - Sources : UX-06 ; Criticité : Moyen ; Effort : M ; Prérequis : T-027
  - Réussite : 0 `<label>` sans champ associé ; clavier numérique sur les 14 champs concernés.
- [ ] **T-069** Fabrique de fenêtres : `role="dialog"`, `aria-modal`, focus, Échap, fermeture par Retour — Statut : À faire — Date : —
  - Sources : UX-07 ; Criticité : Moyen ; Effort : M ; Prérequis : T-028
  - Réussite : 35 fenêtres construites par une seule fonction.
- [ ] **T-070** Clavier et aides techniques : `aria-current`, `aria-label` sur la navigation, cartes cliquables en boutons, `:focus-visible` global — Statut : À faire — Date : —
  - Sources : UX-08 ; Criticité : Moyen ; Effort : M ; Prérequis : T-069
  - Réussite : navigation complète au clavier sur accueil, fiches, bilan.
- [ ] **T-071** Fiches : résumé express ouvert par défaut en 15-16 px, étapes numérotées, état d'ouverture conservé, bouton « Écouter » de 48 px — Statut : À faire — Date : —
  - Sources : UX-10 ; Criticité : Moyen ; Effort : M ; Prérequis : T-029, T-067, D-18
  - Réussite : contenu complet d'un geste atteint en 2 appuis au plus.
- [ ] **T-072** Alternatives textuelles des 13 SVG et de l'image d'aperçu — Statut : À faire — Date : —
  - Sources : UX-13 ; Criticité : Faible ; Effort : S ; Prérequis : aucun
  - Réussite : 0 `<svg>` sans `role="img"` + `aria-label` ou `aria-hidden`.

## 5. Points à décider par Charles-Henri

Statuts : `Décidé` (par Charles-Henri) ; `Recommandation Claude à valider`. Mise à jour du 2026-10-12.

- D-01 : date du passage en privé et acceptation de ses effets (minutes d'Actions limitées, aucune page publique GitHub).
  - Décidé (2026-10-12) : passage en privé après finalisation des corrections.
  - Recommandation Claude à valider (2026-10-12) : passer en privé plus tôt, dès T-003 fait, car l'historique public contient déjà des données personnelles (T-004 en vague 0).
- D-02 : purge de l'historique Git oui ou non (e-mail personnel, coordonnées de domicile, planning d'activités, photo avec plaque).
  - Décidé (2026-10-12) : pas de purge pour l'instant ; réévaluer après T-004 (T-055 reportée).
- D-03 : qui est responsable de traitement (toi ou la Protection Civile) ; accord de la hiérarchie pour traiter des données de bénévoles ; référent RGPD à solliciter.
  - Décidé (2026-10-12) : responsable de traitement = Charles-Henri.
- D-04 : durées de conservation.
  - Décidé (2026-10-12) : propositions acceptées (compte supprimé après 12 mois sans ouverture, historique limité à 24 mois) ; mise en oeuvre dans T-051 (reportée).
- D-05 : le bilan victime (nom, prénom, date de naissance) est-il autorisé dans cette application ? Sinon retrait ; sinon suppression automatique après mission.
  - Décidé (2026-10-12) : conservé pour usage personnel (intervention dans la rue), accès caché.
  - Recommandation Claude à valider (2026-10-12) : garder ; stockage uniquement sur l'appareil (jamais Firebase, jamais fichier partagé) ; suppression automatique après export ou délai court ; accès par le geste caché ; jamais ouvert à d'autres utilisateurs sans nouvelle décision. Cacher ne rend pas conforme : c'est la limitation à l'appareil et à lui seul qui réduit le risque (T-052).
- D-06 : contacts SOS conservés sur l'appareil seulement, ou synchronisés entre appareils.
  - Décidé (2026-10-12) : sur l'appareil seulement (migration dans T-024).
- D-07 : e-mails de nouveautés : passer à l'accord préalable (changement de comportement) ou garder le retrait.
  - Décidé (2026-10-12) : accord préalable accepté (T-049).
- D-08 : liste exacte des suppressions : `img-7992.jpeg`, `autodefense-poignet-2mains.png.png`, image « rachis » (laquelle est la bonne), `bilan.html`, 8 fonctions mortes, doublons de fonctions.
  - Décidé (2026-10-12) : suppressions acceptées. Reste à choisir : laquelle des deux images « rachis » garder (T-034).
- D-09 : qualité des images après conversion.
  - Décidé (2026-10-12) : jamais de validation par un formateur (refus de la Protection Civile) ; validation visuelle par Charles-Henri (T-035).
- D-10 : validation par un formateur du contenu des fiches et du quiz.
  - Décidé (2026-10-12) : fiches et quiz personnels, jamais validés par un formateur ; aucune tâche ne l'exige.
  - Recommandation Claude à valider (2026-10-12) : mention visible dans la section Secourisme « notes personnelles non validées, ne remplacent ni la formation ni les protocoles officiels » (T-073) ; vérifier que les logos de la Protection Civile n'induisent pas l'idée d'un contenu officiel (T-074).
- D-11 : protection de `main` : accepter de ne plus envoyer de fichiers directement par le web, ou garder le flux actuel.
  - Décidé (2026-10-12) : recommandation des audits suivie (protection de `main`, T-019).
- D-12 : conserver ou non le service externe de planification du contrôle quotidien.
  - Décidé (2026-10-12) : un service doit analyser chaque jour ; service externe conservé avec jeton restreint (T-003) ; évaluation d'une alternative gratuite (déclencheur Cloudflare ou GitHub planifié) en T-075.
- D-13 : les fiches partagées doivent-elles contenir du balisage (gras, listes) ? Si oui, assainissement par bibliothèque locale.
  - Décidé (2026-10-12) : recommandation suivie (échapper seulement, pas de bibliothèque).
- D-14 : conserver le geste caché (3 appuis sur « Accueil ») pour l'entrée « Secourisme », avec une alternative visible dans les paramètres.
  - Décidé (2026-10-12) : geste caché conservé selon les décisions précédentes ; alternative visible dans les paramètres à confirmer plus tard (volet reporté de T-029).
- D-15 : budget pour un thème clair haut contraste (effort L).
  - Décidé (2026-10-12) : reporté.
- D-16 : lieu et coût du stockage des sauvegardes.
  - Décidé (2026-10-12) : sauvegardes gratuites uniquement ; toute solution payante écartée ; quotas gratuits à étudier (T-020).
- D-17 : calendrier d'ouverture aux autres bénévoles (conditionne T-025, T-048 à T-056).
  - Décidé (2026-10-12) : pas d'ouverture à tous ; lui seul ou une ou deux personnes. Tâches conditionnées reportées ou simplifiées, à remettre en cause une à une (T-025, T-048, T-050, T-051, T-056).
- D-18 : fiches ouvertes par défaut sur le résumé express (choix produit).
  - Décidé (2026-10-12) : recommandation suivie (T-071).
- D-19 : le fichier partagé d'inscriptions est-il encore utile (la version personnelle existe dans Firebase) ?
  - Décidé (2026-10-12) : probablement plus utile ; vérifier qu'aucun code ne le lit, puis le retirer (T-054).
- D-20 : le site est-il derrière Cloudflare Access (désaccord CICD/SEC, section 6) ?
  - Décidé (2026-10-12) : oui, derrière Cloudflare Access ; T-001 vérifie que toutes les adresses sont couvertes.
- D-21 : qui livre sur GitHub ?
  - Décidé (2026-10-12) : Charles-Henri livre ; Claude ne pousse rien sur GitHub (section 1).
- D-22 : que faire de ntfy ?
  - Décidé (2026-10-12) : retiré globalement, les rappels directs de l'application suffisent (T-005, T-080).
- D-23 : report de T-025 à reconsidérer (dépôt devenu privé) ?
  - Décidé (2026-10-12) : découpage accepté : T-081 (`contenu-partage` en écriture réservée à l'administrateur) est ajoutée ; T-025 (jeton par personne) reste reportée.

## 6. Vérifications faites en rouvrant le code (contradictions entre audits)

- CICD-05 et CICD-12 écrivent que le site reste public ; SEC et RGPD écrivent qu'il est derrière Cloudflare Access. Le code ne tranche pas (configuration dans le tableau de bord) : T-001. Tranché le 2026-10-12 (D-20) : derrière Access ; T-001 vérifie la couverture de toutes les adresses.
- QUA-08 cite les lignes 13-14 du flux pour les déclencheurs ; ils sont aux lignes 11-12 (`daily-check.yml`). Sans effet sur la conclusion.
- RGPD-01 propose de retirer `registrations-history.json` : le fichier est lu par la page (`index.html:14067`, `14124`) et préchargé (`sw.js:30`) : retrait conditionné à T-054.
- SEC-06 propose d'exclure des fichiers de `data/` : confirmé sûr pour 4 fichiers seulement ; le Worker lit `pending-notification` et `status` (`worker/rappels.js:108`).
- Fichier partagé d'inscriptions : D-19 le juge probablement inutile alors que la page le lit (`index.html:14067`, `14124`) ; T-054 vérifie les lectures avant retrait.
- AUDIT_UX_UI : synthèse 3 / 6 / 4 contre liste 3 / 7 / 3 (synthèse de l'audit corrigée à la relecture, seul son décompte).

## 7. Tâches écartées ou reportées

- REF-14 (styles en ligne) et UX-12 (composants hétérogènes) : écartés comme chantier dédié ; appliquer la règle du scout (améliorer ce qu'on touche), les variables CSS viennent avec T-064.
- UX-11 (thème clair, mouvement réduit) : reporté, effort L, après variables CSS (T-064) ; décision D-15. Le clignotement du chronomètre peut être traité avec T-070.
- RGPD-10 (adresse de messagerie fonctionnelle de l'organisation dans les événements) : écarté, adresse publique à l'origine ; surveiller l'apparition d'adresses nominatives.
- REF-10 (sous-dossiers de `data/`) et CICD-05 version `public/` : reportés ; un seul déplacement ultérieur, après T-066 (C-22).
- CICD-04 (sortir les données du dépôt vers Firebase, KV ou R2) : reporté, effort L, T-017 suffit pour l'instant.
- PERF-07 (code administrateur chargé à part) : reporté dans T-066 ; gain non mesuré.
- SEC-08 (CSP stricte) : reportée après T-066 et retrait des `onclick` ; seule la CSP en mode rapport est faite (T-046).
- SEC-02 volet bibliothèque d'assainissement : écarté sauf si D-13 = oui.
- PERF-06 volet `immutable` : écarté (C-07).
- Décisions du 2026-10-12, tâches reportées (statut `À faire`, ligne `Report`) :
  - T-025 (jeton Firebase par personne) : D-17, à remettre en cause après T-024.
  - T-048 (texte d'information, registre) : D-17 ; version courte si une ou deux personnes invitées.
  - T-050 (contacts SOS) : D-17 ; volet stockage transféré à T-024 (D-06) ; reste la mention OpenStreetMap.
  - T-051 (durées et droits) : D-17 ; durées D-04 retenues pour la reprise.
  - T-055 (purge de l'historique) : D-02, réévaluation après T-004.
  - T-056 (rappels, réservation du marquage) : D-17.
- Volets reportés ou écartés par les décisions du 2026-10-12 : alternative visible au geste caché dans T-029 (D-14, à confirmer plus tard) ; dépôt de fichiers par le web dans T-026 (D-11, à confirmer avec T-019) ; thème clair (D-15) ; validation par un formateur (D-09, D-10, retirée de T-035 et T-061) ; solutions de sauvegarde payantes (D-16, écartées).

## 8. Historique des changements

| Date | Tâche | Ancien statut | Nouveau statut | Remarque |
|---|---|---|---|---|
| 2026-10-12 | — | — | — | Création du fichier à partir des 8 audits : 72 tâches, 0 faite |
| 2026-10-12 | D-01 à D-21 | — | — | Décisions de Charles-Henri reportées en section 5 ; recommandations Claude à valider : D-01 (privé plus tôt), D-05, D-10 |
| 2026-10-12 | T-001 | À faire | À faire | D-20 : site derrière Access, T-001 vérifie la couverture |
| 2026-10-12 | T-004, T-008 | À faire | À faire | D-01 : privé après les corrections (recommandation : plus tôt) ; T-008 ne dépend plus de T-004 |
| 2026-10-12 | T-020 | À faire | À faire | D-16 : sauvegardes gratuites uniquement |
| 2026-10-12 | T-024 | À faire | À faire | D-06 : contacts SOS migrés sur l'appareil au lieu d'une route Worker |
| 2026-10-12 | T-025 | À faire | À faire | Reportée (D-17) |
| 2026-10-12 | T-036 | À faire | À faire | Ne dépend plus de T-025 |
| 2026-10-12 | T-048, T-050, T-051, T-056 | À faire | À faire | Reportées (D-17) ; T-050 réduite à la mention OpenStreetMap |
| 2026-10-12 | T-055 | À faire | À faire | Reportée (D-02) |
| 2026-10-12 | T-052 | À faire | À faire | D-05 : bilan conservé, appareil seul, suppression automatique |
| 2026-10-12 | T-054 | À faire | À faire | D-19 : vérification des lectures puis retrait |
| 2026-10-12 | T-034, T-043, T-057 | À faire | À faire | D-08 : suppressions acceptées |
| 2026-10-12 | T-035, T-061 | À faire | À faire | D-09, D-10 : validation de formateur retirée |
| 2026-10-12 | T-029 | À faire | À faire | D-14 : alternative visible reportée |
| 2026-10-12 | T-019, T-060, T-063 | À faire | À faire | D-11 suivie ; T-060 dépend de T-024 ; T-063 rattachée au groupe TESTS |
| 2026-10-12 | T-073, T-074 | — | À faire | Ajoutées : mention secourisme, vérification des logos (D-10) |
| 2026-10-12 | T-075 | — | À faire | Ajoutée : alternative gratuite au déclencheur (D-12) |
| 2026-10-12 | T-076 à T-079 | — | À faire | Ajoutées : groupe TESTS (données, fumée Playwright, bout en bout, monolithe) |
| 2026-10-12 | Tableau de bord | — | — | Décomptes recalculés par script : 79 tâches, 6 reportées, 73 actives |
| 2026-10-12 | T-001 | À faire | En cours | Adresse principale vérifiée ; aperçus à désactiver (tableau de bord + `wrangler.jsonc`) |
| 2026-10-12 | Vague 0 | — | — | Clôture : Partiellement terminé (4 tâches faites sur 8) ; T-001, T-004, T-007, T-008 restent « En cours » avec leurs validations listées dans chaque tâche ; passage à la vague 1 à la demande de Charles-Henri |
| 2026-10-12 | T-004 | À faire | En cours | Dépôt privé, aucun fork, 16 secrets présents et utilisés, déploiement validé ; reste exécution manuelle et alerte e-mail ; secret scanning non proposé |
| 2026-10-12 | T-081 | — | À faire | Ajoutée (D-23) : `contenu-partage` en écriture réservée à l'administrateur ; T-025 réduite au jeton par personne, reportée |
| 2026-10-12 | T-006 | À faire | Fait | Règles exportées et versionnées ; accès anonyme mesuré : écriture ouverte sur `users/{uid}/…` et `contenu-partage`, lecture ouverte sur `users/{uid}` ; T-025 à reconsidérer |
| 2026-10-12 | T-005 | En cours | Fait | Vérifié après livraison : ntfy supprimé, notifications de l'application fonctionnelles |
| 2026-10-12 | Vague 0 | — | — | Diagnostic version : `data/changelog.json` reste à v24.7 (dernière entrée du 2026-07-31) ; le script n'ajoute une entrée que si le message de commit a un corps (titre + description) |
| 2026-10-12 | T-005 | À faire | En cours | D-22 : ntfy retiré globalement ; interface, script d'envoi et workflow modifiés sur `vague-0` ; reste secret, désabonnement, vérification sur appareil |
| 2026-10-12 | T-080 | — | À faire | Ajoutée (D-22) : retrait du canal ntfy côté Worker |
| 2026-10-12 | T-003 | À faire | Fait | Jeton du déclencheur déjà restreint, aucun jeton classic, jeton temporaire saisi, envoi de fichier OK ; aide de l'application à corriger en T-026 |
| 2026-10-12 | T-002 | À faire | Fait | Déclencheur confirmé : cron-job.org appelle `workflow_dispatch` de `daily-check.yml` |
| 2026-10-12 | T-001, T-007, T-008 | En cours | En cours | Vérifications après livraison : aperçus toujours désactivés ; `<b>test</b>` affiché tel quel ; workflow sans « absent » ; version restée à v24.7 (à diagnostiquer) |
| 2026-10-12 | T-007 | À faire | En cours | Code et test navigateur faits sur `vague-0` ; reste test fiche personnalisée, T-009, vérification sur appareil |
| 2026-10-12 | T-008 | À faire | En cours | Code fait sur `vague-0` ; reste 3 secrets GitHub, exécution manuelle, suppression des anciens journaux |
| 2026-10-12 | Vague 0 | — | — | Numéro de version : produit automatiquement par `changelog.yml` à la poussée sur `main`, seulement si le message de commit a un corps ; aucune modification manuelle de `changelog.json` |

## 9. Relecture

Relecture indépendante du 2026-10-12 (décomptes recalculés par script, preuves rouvertes dans le code).

- Décomptes : tableau de bord confirmé (116 constats, 15 / 54 / 47, 72 tâches, vagues 8 / 18 / 21 / 9 / 10 / 6). Corrigé : 22 groupes de doublons et 34 constats absorbés (au lieu de 23 et 35).
- Couverture : 111 constats sur 116 sont cités par au moins une tâche ; les 5 autres (REF-10, REF-14, RGPD-10, UX-11, UX-12) sont écartés ou reportés avec raison (section 7).
- AUDIT_UX_UI.md : synthèse corrigée de 3 / 6 / 4 à 3 / 7 / 3 (seul ce décompte modifié).
- Criticités : T-001 ramenée à Faible (SEC-13), relevée à Fort seulement si l'accès n'est pas couvert ; T-004 ramenée à Moyen (CICD-12, RGPD-01, RGPD-12), vague 0 maintenue pour l'urgence.
- Ordre des vagues : T-025 dépendait de T-036 (vague 2) ; remplacé par T-021, T-036 dépend désormais de T-025 (C-15 et chaîne 3.3 alignés). T-038 dépendait de T-039 placé après lui : les deux identifiants ont été échangés (mise à jour visible = T-038, stratégie de cache = T-039), références mises à jour partout.
- Jeton GitHub (C-05, T-003) : l'ancien jeton sert aussi à l'envoi de fichiers (`index.html:12328-12330`) et au déclenchement manuel (`13435`) ; la révocation aurait coupé ces fonctions jusqu'à T-026. T-003 impose maintenant : créer les jetons de remplacement, les installer, vérifier, puis révoquer.
- Conflits rouverts dans le code et confirmés : C-01, C-02, C-05, C-07, C-13 (23 `onclick=`), C-20, C-24. C-10 précisé (le sélecteur d'envoi force `.png`, `index.html:12519`). C-19 vérifié (étape de commit `daily-check.yml:47-51`).
- T-053 : ajout de la mise à jour de `connect-src` de T-046.
- Secrets et données personnelles : aucune valeur, adresse ni identifiant dans le fichier.
