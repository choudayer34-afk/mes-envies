/*
 Tests du lot 1 « le voyage au bon moment ».
 Lancer depuis le dossier worker : node --test tests/voyage.test.mjs
 Données factices uniquement.
*/

import test from "node:test";
import assert from "node:assert/strict";
import { planifier, besoins } from "../rappels.js";
import { nettoyerReglages, reglagesParDefaut } from "../reglages.js";
import { voyagesDe, premierTransport, programmeDuJour, voyageProche } from "../voyage.js";
import { instantParis } from "../temps.js";

const UID = "utilisateur-test";

function appareil(reglages = {}) {
    return { uid: UID, reglages, envoyes: {} };
}

function voyage(extra = {}) {
    return {
        id: "v1", titre: "Lisbonne", contexte: "voyage",
        date: { start: "2026-10-16", end: "2026-10-20" },
        personnesIds: ["p1", "p2"],
        documentRequis: "passeport",
        checklist: [
            { id: "c1", texte: "Chargeurs", checked: false, categorieId: "cat-depart" },
            { id: "c2", texte: "Clés", checked: false, categorieId: "cat-depart" },
            { id: "c3", texte: "Maillot", checked: true, categorieId: "cat-valise" },
            { id: "c4", texte: "Crème solaire", checked: false, categorieId: "cat-valise" }
        ],
        billets: [
            {
                id: "b1", type: "avion", compagnie: "Exemple Air", numeroVol: "EX123",
                dateDepart: "2026-10-16", heureDepart: "10:30",
                lieuDepart: "Paris", destination: "Lisbonne",
                retour: { dateDepart: "2026-10-20", heureDepart: "18:00" }
            },
            { id: "b2", type: "logement", dateDepart: "2026-10-16", heureDepart: "15:00" }
        ],
        ...extra
    };
}

const etapes = [
    { id: "e1", voyageId: "v1", titre: "Tram 28", date: { start: "2026-10-17" }, moment: "matin" },
    { id: "e2", voyageId: "v1", titre: "Dîner fado", date: { start: "2026-10-17" }, moment: "soir" }
];

const donnees = {
    envies: [voyage(), ...etapes],
    conteneurs: null,
    personnes: [
        { id: "p1", nom: "Adulte A", documentsIdentite: { passeport: { dateExpiration: "2027-01-10" } } },
        { id: "p2", nom: "Adulte B", documentsIdentite: { passeport: { dateExpiration: "2030-01-10" } } }
    ],
    categoriesListes: [{ id: "cat-depart", nom: "Le jour du départ" }, { id: "cat-valise", nom: "Valise" }]
};

const a = (dateIso, heure) => instantParis(dateIso, heure);
const cles = liste => liste.map(n => n.cle);

test("réglages : valeurs par défaut et nettoyage", () => {
    const r = nettoyerReglages({ voyage: { depart: false, heureProgramme: "07:30", heureDepenses: "99:00", inconnu: true } });
    assert.equal(r.voyage.actif, true);
    assert.equal(r.voyage.depart, false);
    assert.equal(r.voyage.heureProgramme, "07:30");
    assert.equal(r.voyage.heureDepenses, "20:00");
    assert.equal(reglagesParDefaut().voyage.heureProgramme, "08:00");
});

test("un voyage est reconnu, une étape ne l'est pas", () => {
    const ids = voyagesDe(donnees.envies, UID).map(v => v.id);
    assert.deepEqual(ids, ["v1"]);
});

test("enregistrement : 24 h avant le vol aller, ouvre le billet", () => {
    const liste = planifier(appareil(), donnees, a("2026-10-15", "10:45"));
    const n = liste.find(x => x.cle.startsWith("ve:"));
    assert.ok(n);
    assert.equal(n.charge.billetId, "b1");
    assert.match(n.charge.titre, /Enregistrement ouvert/);
});

test("enregistrement : aussi pour le vol retour", () => {
    const liste = planifier(appareil(), donnees, a("2026-10-19", "18:10"));
    assert.ok(liste.some(x => x.cle === "ve:v1:b1#retour:2026-10-20:18:00"));
});

test("jour du départ : avant le rappel du billet, liste les éléments de la catégorie départ", () => {
    /* vol 10:30, rappel avion 180 min, marge 120 min -> 05:30 */
    assert.equal(planifier(appareil(), donnees, a("2026-10-16", "05:15")).some(x => x.cle.startsWith("vd:")), false);
    const n = planifier(appareil(), donnees, a("2026-10-16", "05:35")).find(x => x.cle.startsWith("vd:"));
    assert.ok(n);
    assert.equal(n.charge.vue, "listes");
    assert.equal(n.charge.corps, "Chargeurs, Clés");
});

test("jour du départ : sans billet de transport, le matin du départ", () => {
    const sansBillet = { ...donnees, envies: [voyage({ billets: [] }), ...etapes] };
    const n = planifier(appareil(), sansBillet, a("2026-10-16", "08:05")).find(x => x.cle.startsWith("vd:"));
    assert.ok(n);
});

test("jour du départ : sans catégorie départ, cite les éléments non cochés de toutes les listes", () => {
    const sansCategorie = { ...donnees, categoriesListes: [] };
    const n = planifier(appareil(), sansCategorie, a("2026-10-16", "05:35")).find(x => x.cle.startsWith("vd:"));
    assert.equal(n.charge.corps, "Chargeurs, Clés, Crème solaire");
});

test("jour du départ : plus de 5 éléments, les autres sont comptés", () => {
    const items = Array.from({ length: 7 }, (_, i) => ({ id: `i${i}`, texte: `Objet ${i + 1}`, checked: false }));
    const plein = { ...donnees, categoriesListes: [], envies: [voyage({ checklist: items })] };
    const n = planifier(appareil(), plein, a("2026-10-16", "05:35")).find(x => x.cle.startsWith("vd:"));
    assert.equal(n.charge.corps, "Objet 1, Objet 2, Objet 3, Objet 4, Objet 5 et 2 autres");
});

test("jour du départ : tout est coché, rappel fixe", () => {
    const fait = { ...donnees, envies: [voyage({ checklist: [{ id: "x", texte: "ok", checked: true }] })] };
    const n = planifier(appareil(), fait, a("2026-10-16", "05:35")).find(x => x.cle.startsWith("vd:"));
    assert.equal(n.charge.corps, "Clés, chargeurs, papiers, billets : dernière vérification");
});

test("premier transport : le logement est ignoré", () => {
    assert.equal(premierTransport(voyage()).id, "b1");
});

test("valise à J-2 : s'il reste des éléments non cochés", () => {
    const n = planifier(appareil(), donnees, a("2026-10-14", "08:10")).find(x => x.cle.startsWith("vv:"));
    assert.ok(n);
    assert.match(n.charge.corps, /^3 choses/);
    const tout = { ...donnees, envies: [voyage({ checklist: [{ id: "x", texte: "ok", checked: true }] })] };
    assert.equal(planifier(appareil(), tout, a("2026-10-14", "08:10")).some(x => x.cle.startsWith("vv:")), false);
});

test("papiers : passeport trop juste, 7 jours avant", () => {
    const sept = { ...donnees, envies: [voyage({ date: { start: "2026-10-22", end: "2026-10-26" } })] };
    const n = planifier(appareil(), sept, a("2026-10-15", "08:20")).find(x => x.cle.startsWith("vp:"));
    assert.ok(n);
    assert.match(n.charge.corps, /Adulte A/);
    assert.doesNotMatch(n.charge.corps, /Adulte B/);
    assert.equal(n.charge.vue, "voyageurs");
});

test("programme du matin : étapes du jour dans l'ordre des moments", () => {
    assert.deepEqual(programmeDuJour(voyage(), donnees.envies, "2026-10-17"), ["Matin : Tram 28", "Soir : Dîner fado"]);
    const n = planifier(appareil(), donnees, a("2026-10-17", "08:00")).find(x => x.cle.startsWith("vg:"));
    assert.ok(n);
    assert.equal(n.charge.vue, "programme");
});

test("programme : heure réglable, rien si la journée est vide", () => {
    const tot = appareil({ voyage: { heureProgramme: "07:00" } });
    assert.ok(planifier(tot, donnees, a("2026-10-17", "07:05")).some(x => x.cle.startsWith("vg:")));
    assert.equal(planifier(appareil(), donnees, a("2026-10-18", "08:00")).some(x => x.cle.startsWith("vg:")), false);
});

test("programme : le jour du départ montre le vol mais pas le logement", () => {
    assert.deepEqual(programmeDuJour(voyage(), donnees.envies, "2026-10-16"), ["10:30 Paris → Lisbonne"]);
});

test("dépenses : chaque soir du voyage à 20 h, pas avant ni après", () => {
    assert.ok(planifier(appareil(), donnees, a("2026-10-18", "20:05")).some(x => x.cle === "vm:v1:2026-10-18"));
    assert.equal(planifier(appareil(), donnees, a("2026-10-21", "20:05")).some(x => x.cle.startsWith("vm:")), false);
});

test("retour : 2 jours après la fin", () => {
    const n = planifier(appareil(), donnees, a("2026-10-22", "08:00")).find(x => x.cle.startsWith("vr:"));
    assert.ok(n);
    assert.equal(n.charge.vue, "souvenirs");
});

test("tout désactivé : aucune notification voyage", () => {
    const off = appareil({ voyage: { actif: false } });
    const toutes = [
        ...planifier(off, donnees, a("2026-10-16", "05:35")),
        ...planifier(off, donnees, a("2026-10-17", "08:00")),
        ...planifier(off, donnees, a("2026-10-18", "20:05"))
    ];
    assert.equal(toutes.some(x => /^v[pedvgmr]:/.test(x.cle)), false);
});

test("déjà envoyé : pas de doublon", () => {
    const app = appareil();
    app.envoyes = { "vg:v1:2026-10-17": 1 };
    assert.equal(planifier(app, donnees, a("2026-10-17", "08:00")).some(x => x.cle === "vg:v1:2026-10-17"), false);
});

test("voyage privé d'un autre membre : rien", () => {
    const prive = { ...donnees, envies: [voyage({ visibilite: "prive", proprietaireId: "autre" }), ...etapes] };
    assert.equal(planifier(appareil(), prive, a("2026-10-17", "08:00")).some(x => x.cle.startsWith("vg:")), false);
});

test("besoins et lecture des personnes", () => {
    assert.equal(besoins([appareil()], a("2026-10-15", "12:00")).voyage, true);
    assert.equal(voyageProche(donnees.envies, UID, "2026-10-15"), true);
    assert.equal(voyageProche(donnees.envies, UID, "2026-12-15"), false);
});

test("anciens rappels inchangés : billet et date", () => {
    const liste = cles(planifier(appareil(), donnees, a("2026-10-16", "07:35")));
    assert.ok(liste.some(c => c.startsWith("b:v1:b1:")));
});

/* ---------- Lot 2 : relances et « Plus tard » ---------- */

import { rappelsRelances } from "../rappels.js";

test("relance : les idées en pause ne comptent pas, revueLe remet l'ancienneté à zéro", () => {
    const lundi = a("2026-10-19", "08:05");
    const vieux = lundi - 60 * 86400000;
    const envies = [
        { id: "i1", titre: "Idée 1", contexte: "voyage", createdAt: vieux },
        { id: "i2", titre: "Idée 2", contexte: "voyage", createdAt: vieux, revoirLe: "2026-10-25" },
        { id: "i3", titre: "Idée 3", contexte: "voyage", createdAt: vieux, revueLe: lundi - 86400000 },
        { id: "i4", titre: "Idée 4", contexte: "voyage", createdAt: vieux, revoirLe: "2026-10-19" }
    ];
    const r = rappelsRelances({ uid: UID, reglages: nettoyerReglages({}) }, envies, new Set(), lundi);
    const voyage = r.find(n => n.cle.startsWith("r:voyage"));
    assert.equal(voyage.charge.corps, "3 éléments à trier, dont 2 sans date depuis plus de 30 jours");
});

/* ---------- Lot 4 : Maison ---------- */

import { rappelsRendezVous, suiviMaison, joursRdvACherche } from "../maison.js";

test("rendez-vous : la veille et le jour même, à l'heure des dates", () => {
    const app = { uid: UID, reglages: nettoyerReglages({}) };
    const envies = [{ id: "t1", titre: "Salle de bain", contexte: "maison", devis: { entries: [{ id: "d1", societe: "Plombier Exemple", statut: "rdv_planifie", dateRdv: "2026-10-16" }] } }];
    const veille = rappelsRendezVous(app, envies, a("2026-10-15", "08:05"));
    assert.equal(veille.length, 1);
    assert.equal(veille[0].charge.titre, "🛠️ Rendez-vous demain : Plombier Exemple");
    assert.equal(veille[0].charge.vue, "projet");
    assert.equal(rappelsRendezVous(app, envies, a("2026-10-16", "08:05"))[0].charge.titre, "🛠️ Rendez-vous aujourd'hui : Plombier Exemple");
    assert.equal(rappelsRendezVous(app, envies, a("2026-10-15", "12:30")).length, 0);
    const sansVeille = { uid: UID, reglages: nettoyerReglages({ dates: { veille: false } }) };
    assert.equal(rappelsRendezVous(sansVeille, envies, a("2026-10-15", "08:05")).length, 0);
});

test("rendez-vous : recherche seulement à l'heure des rappels", () => {
    const apps = [{ reglages: nettoyerReglages({}) }];
    assert.deepEqual(joursRdvACherche(apps, a("2026-10-15", "08:05")), ["2026-10-15", "2026-10-16"]);
    assert.deepEqual(joursRdvACherche(apps, a("2026-10-15", "14:00")), []);
});

test("suivi Maison : devis à suivre et projets en sommeil dans la relance", () => {
    const lundi = a("2026-10-19", "08:05");
    const vieux = lundi - 30 * 86400000;
    const envies = [
        { id: "p1", titre: "Mur", contexte: "maison", categorie: "projet", updatedAt: vieux },
        { id: "t1", contexte: "maison", voyageId: "p1", updatedAt: vieux, devis: { entries: [{ statut: "a_contacter" }, { statut: "devis_recu" }] } },
        { id: "p2", titre: "Cuisine", contexte: "maison", categorie: "projet", updatedAt: lundi - 86400000 },
        { id: "t2", contexte: "maison", voyageId: "p2", updatedAt: lundi - 86400000 }
    ];
    const conteneurs = new Set(["projet"]);
    assert.deepEqual(suiviMaison(envies, conteneurs, UID, lundi), { devis: 2, sommeil: 1 });
    const r = rappelsRelances({ uid: UID, reglages: nettoyerReglages({}) }, envies, conteneurs, lundi);
    const maison = r.find(n => n.cle.startsWith("r:maison"));
    assert.equal(maison.charge.titre, "🏠 Maison : à suivre");
    assert.equal(maison.charge.corps, "2 devis à suivre · 1 projet en sommeil");
});
