/*
 Tests de js/prochaine-etape.js. Lancer depuis la racine : node --test tests/prochaine-etape.test.mjs
 Données factices uniquement.
*/

import test from "node:test";
import assert from "node:assert/strict";
import { prochaineEtape } from "../js/prochaine-etape.js";

const J = "2026-10-15";

test("priorité à la tâche en retard la plus ancienne", () => {
    const r = prochaineEtape([
        { id: "a", date: { start: "2026-10-10" } },
        { id: "b", date: { start: "2026-10-01" } },
        { id: "c", date: { start: J } }
    ], J);
    assert.equal(r.envie.id, "b");
    assert.equal(r.raison, "En retard");
});

test("puis la tâche du jour", () => {
    const r = prochaineEtape([{ id: "c", date: { start: J } }, { id: "d", date: { start: "2026-10-20" } }], J);
    assert.equal(r.envie.id, "c");
});

test("puis la suivante du projet le plus avancé", () => {
    const r = prochaineEtape([
        { id: "p1a", voyageId: "p1", realise: true }, { id: "p1b", voyageId: "p1", ordre: 2 }, { id: "p1c", voyageId: "p1", ordre: 1 },
        { id: "p2a", voyageId: "p2", realise: true }, { id: "p2b", voyageId: "p2", realise: true }, { id: "p2c", voyageId: "p2" }
    ], J);
    assert.equal(r.envie.id, "p2c");
    assert.equal(r.raison, "Projet le plus avancé");
});

test("« Pas maintenant » passe à la suivante, puis rien", () => {
    const taches = [{ id: "a", date: { start: "2026-10-10" } }, { id: "b", date: { start: "2026-10-20" } }];
    assert.equal(prochaineEtape(taches, J, new Set(["a"])).envie.id, "b");
    assert.equal(prochaineEtape(taches, J, new Set(["a", "b"])), null);
});

test("les tâches faites et les listes libres sont ignorées", () => {
    assert.equal(prochaineEtape([{ id: "x", realise: true, date: { start: "2026-10-01" } }, { id: "l", listeLibre: true, date: { start: J } }], J), null);
});
