/*
 Tests de js/tri-outils.js (tri des idées). Lancer depuis la racine : node --test tests/tri-outils.test.mjs
 Données factices uniquement.
*/

import test from "node:test";
import assert from "node:assert/strict";
import { dateRevoir, titresProches, trouverDoublon, dormante, enPause } from "../js/tri-outils.js";

test("Plus tard : dates de retour", () => {
    assert.equal(dateRevoir("demain", "2026-10-15"), "2026-10-16");
    assert.equal(dateRevoir("weekend", "2026-10-15"), "2026-10-17");   /* jeudi -> samedi */
    assert.equal(dateRevoir("weekend", "2026-10-17"), "2026-10-24");   /* samedi -> samedi suivant */
    assert.equal(dateRevoir("weekend", "2026-10-18"), "2026-10-24");   /* dimanche -> samedi */
    assert.equal(dateRevoir("semaine", "2026-12-28"), "2027-01-04");
    assert.equal(dateRevoir("mois", "2026-01-31"), "2026-02-28");
    assert.equal(dateRevoir("inconnu", "2026-10-15"), null);
});

test("en pause : seulement jusqu'à la date", () => {
    assert.ok(enPause({ revoirLe: "2026-10-16" }, "2026-10-15"));
    assert.ok(!enPause({ revoirLe: "2026-10-15" }, "2026-10-15"));
    assert.ok(!enPause({}, "2026-10-15"));
});

test("toujours envie : après 30 jours, sauf si revue récemment", () => {
    const maintenant = Date.now();
    assert.ok(dormante({ createdAt: maintenant - 31 * 864e5 }, maintenant));
    assert.ok(!dormante({ createdAt: maintenant - 31 * 864e5, revueLe: maintenant }, maintenant));
    assert.ok(!dormante({ createdAt: maintenant - 5 * 864e5 }, maintenant));
});

test("doublons : titres proches", () => {
    assert.ok(titresProches("Musée du Prado", "musee du prado"));
    assert.ok(titresProches("Musée Prado", "Visiter le musée du Prado"));
    assert.ok(titresProches("Tram 28 Lisbonne", "Lisbonne tram 28"));
    assert.ok(!titresProches("Plage de Nazaré", "Plage de Cascais"));
    assert.ok(!titresProches("Bar", "Barcelone"));
});

test("doublons : idée active d'abord, sinon corbeille", () => {
    assert.equal(trouverDoublon("tram 28 lisbonne", [{ id: "a", titre: "Lisbonne : tram 28", createdAt: 1 }])?.envie.id, "a");
    const r = trouverDoublon("Fado", [], [{ id: "c", titre: "fado", createdAt: 1 }]);
    assert.equal(r.supprimee, true);
    assert.equal(trouverDoublon("Fado", [{ id: "l", titre: "Fado", listeLibre: true }]), null);
});

import { dateSaison } from "../js/tri-outils.js";

test("envie de saison : 1er du mois, l'an prochain si le mois est commencé", () => {
    assert.equal(dateSaison(3, "2026-10-15"), "2027-03-01");
    assert.equal(dateSaison(12, "2026-10-15"), "2026-12-01");
    assert.equal(dateSaison(10, "2026-10-15"), "2027-10-01");
    assert.equal(dateSaison(13, "2026-10-15"), null);
});
