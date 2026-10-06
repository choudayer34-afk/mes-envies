/*
==========================================================
 EnVie - Nouvelle interface
 types-reservation.js : types de réservation (source unique)
 Un billet garde son champ "type" ; les anciens types
 (avion, train, autre) restent valables.
==========================================================
*/

export const TYPES_RESERVATION = [
    { id: "avion",     emoji: "✈️", libelle: "Avion",              groupe: "transport", mot: "Vol" },
    { id: "train",     emoji: "🚆", libelle: "Train",              groupe: "transport", mot: "Train" },
    { id: "busferry",  emoji: "🚌", libelle: "Bus / ferry",        groupe: "transport", mot: "Trajet" },
    { id: "voiture",   emoji: "🚗", libelle: "Location de voiture", groupe: "transport", mot: "Location" },
    { id: "parking",   emoji: "🅿️", libelle: "Parking",            groupe: "transport", mot: "Parking" },
    { id: "logement",  emoji: "🛏️", libelle: "Logement",           groupe: "logement",  mot: "Logement" },
    { id: "restaurant", emoji: "🍽️", libelle: "Restaurant",        groupe: "sorties",   mot: "Restaurant" },
    { id: "activite",  emoji: "🎟️", libelle: "Activité / entrée",  groupe: "sorties",   mot: "Activité" },
    { id: "assurance", emoji: "🛡️", libelle: "Assurance",          groupe: "autres",    mot: "Assurance" },
    { id: "autre",     emoji: "🎫", libelle: "Autre",              groupe: "autres",    mot: "Réservation" }
];

export const GROUPES_RESERVATION = [
    { id: "transport", libelle: "Transport" },
    { id: "logement", libelle: "Logement" },
    { id: "sorties", libelle: "Sorties" },
    { id: "autres", libelle: "Autres" }
];

export function typeReservation(id) {
    return TYPES_RESERVATION.find(t => t.id === id) || TYPES_RESERVATION[TYPES_RESERVATION.length - 1];
}

export function emojiType(id) {
    return typeReservation(id).emoji;
}

// Libellé de repli quand ni compagnie, ni numéro, ni trajet ne sont renseignés
export function motType(id) {
    return typeReservation(id).mot;
}

// Titre court d'un billet : nom saisi (compagnie + numéro), sinon le type
export function titreCourtBillet(billet) {
    const saisi = [billet.compagnie, billet.numeroVol].filter(Boolean).join(" ");
    return saisi || motType(billet.type);
}

// Objet { id: emoji } pour le code ancien
export const EMOJI_PAR_TYPE = Object.fromEntries(TYPES_RESERVATION.map(t => [t.id, t.emoji]));

/* Aller-retour sur un même billet : le champ optionnel billet.retour
   { dateDepart, heureDepart, heureArrivee, numeroVol } est lu comme une
   seconde étape (lieux inversés, mêmes fichiers). Les billets sans retour
   sont renvoyés tels quels. */
export function etapesBillets(billets) {
    const etapes = [];
    (billets || []).forEach(b => {
        if (!b.retour) { etapes.push(b); return; }
        etapes.push({ ...b, _sens: "aller", _idOrigine: b.id });
        etapes.push({
            ...b,
            id: `${b.id}#retour`,
            _idOrigine: b.id,
            _sens: "retour",
            dateDepart: b.retour.dateDepart || null,
            heureDepart: b.retour.heureDepart || null,
            heureArrivee: b.retour.heureArrivee || null,
            numeroVol: b.retour.numeroVol || b.numeroVol || null,
            lieuDepart: b.destination ? (typeof b.destination === "string" ? { nom: b.destination } : b.destination) : null,
            destination: b.lieuDepart || null,
            retour: null
        });
    });
    return etapes;
}

/* Nom d'un lieu de billet : objet {nom, …} (autocomplétion) ou simple texte */
export function nomLieu(lieu) {
    if (!lieu) return "";
    return typeof lieu === "string" ? lieu : (lieu.nom || "");
}
