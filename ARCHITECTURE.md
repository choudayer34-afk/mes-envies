# Architecture

## Principes

- Une fonction = une responsabilité
- Un fichier = un domaine fonctionnel
- Pas de framework JavaScript
- Pas de bibliothèque CSS
- Mobile First
- PWA native

## Structure

envie/

├── index.html
│
├── css/
│   ├── variables.css
│   ├── styles.css
│   └── components.css
│
├── js/
│   ├── app.js
│   ├── ui.js
│   ├── storage.js
│   ├── modal.js
│   ├── toast.js
│   │
│   ├── services/
│   │   └── envies.js
│   │
│   └── components/
│       ├── card.js
│       ├── fab.js
│       ├── navbar.js
│       └── input.js
│
├── assets/
│   ├── icons/
│   └── images/
│
├── manifest.json
├── sw.js
│
├── PROJECT_STATE.md
├── ARCHITECTURE.md
├── VISION.md
├── BACKLOG.md
└── CHANGELOG.md

## Flux de données V0

Utilisateur
↓
Modal
↓
Storage
↓
Liste À trier

## Modèle Envie

{
  id: string,
  titre: string,
  statut: "inbox",
  createdAt: number,
  updatedAt: number
}

Ce modèle sera enrichi progressivement sans être remplacé.