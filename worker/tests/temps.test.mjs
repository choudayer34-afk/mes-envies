/*
 Le calcul de l'heure de Paris sans Intl doit donner exactement le même résultat qu'Intl.
 Lancer depuis le dossier worker : node --test tests/temps.test.mjs
*/
import test from "node:test";
import assert from "node:assert/strict";
import { partiesParis, instantParis } from "../temps.js";

const FORMAT = new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Paris", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" });

function reference(instant) {
    const v = {};
    for (const m of FORMAT.formatToParts(new Date(instant))) if (m.type !== "literal") v[m.type] = Number(m.value);
    return `${v.year}-${String(v.month).padStart(2, "0")}-${String(v.day).padStart(2, "0")} ${v.hour}:${v.minute}`;
}

test("partiesParis = Intl, toutes les 37 minutes de 2025 à 2030 (changements d'heure compris)", () => {
    const debut = Date.UTC(2025, 0, 1), fin = Date.UTC(2031, 0, 1);
    for (let t = debut; t < fin; t += 37 * 60000) {
        const p = partiesParis(t);
        assert.equal(`${p.iso} ${p.heure}:${p.minute}`, reference(t), new Date(t).toISOString());
    }
});

test("instantParis : aller-retour, changements d'heure compris", () => {
    for (const [d, h] of [["2026-03-29", "03:30"], ["2026-03-28", "08:00"], ["2026-10-25", "08:00"], ["2026-10-24", "23:59"], ["2026-07-14", "10:30"], ["2026-12-31", "00:00"]]) {
        const p = partiesParis(instantParis(d, h));
        assert.equal(`${p.iso} ${String(p.heure).padStart(2, "0")}:${String(p.minute).padStart(2, "0")}`, `${d} ${h}`);
    }
});
