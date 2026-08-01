 # Changelog

## [0.1.0] - Sprint 2 (en cours)

### Ajouté

- Architecture orientée composants UI
- Concept de boîte de réception « À trier »
- Modale réutilisable EnVie
- Système de notifications Toast
- Service de stockage local
- Bouton flottant (FAB)

### Décisions d'architecture

- Abandon des fonctions natives alert(), confirm() et prompt()
- Développement UX-first avant intégration Firebase
- Adoption d'un modèle unique « Envie »
- Toutes les nouvelles envies arrivent dans l'état `inbox`
- Capture d'une idée optimisée pour une utilisation mobile à une main

### Prochaine étape

- Capture locale d'une envie
- Modification
- Suppression
- Archivage local