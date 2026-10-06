/*
==========================================================
 EnVie - Nouvelle interface
 rappels-calendrier.js : fichier .ics des rappels d'un voyage
 Le calendrier du téléphone déclenche lui-même les alarmes, même
 sans réseau et application fermée. Lecture seule : aucune donnée modifiée.
==========================================================
*/

import { getEnvies } from "./storage.js";
import { listerBillets, dateLocaleISO } from "./documents.js";
import { nomLieu, titreCourtBillet, motType } from "./types-reservation.js";
import { showToast } from "./toast.js";

const brut = iso => iso.replace(/-/g, "");
const heureBrute = h => h.replace(":", "") + "00";

function echapperIcs(t) {
    return String(t ?? "").replace(/\\/g, "\\\\").replace(/;/g, "\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
}

function jourPlus(iso, n) {
    const d = new Date(iso + "T12:00:00");
    d.setDate(d.getDate() + n);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function evenement({ uid, titre, description, jour, heure, alarmes }) {
    const lignes = ["BEGIN:VEVENT", `UID:${uid}@envie`, `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, "").slice(0, 15)}Z`];
    if (heure) {
        lignes.push(`DTSTART:${brut(jour)}T${heureBrute(heure)}`, `DTEND:${brut(jour)}T${heureBrute(heure)}`);
    } else {
        lignes.push(`DTSTART;VALUE=DATE:${brut(jour)}`, `DTEND;VALUE=DATE:${brut(jourPlus(jour, 1))}`);
    }
    lignes.push(`SUMMARY:${echapperIcs(titre)}`);
    if (description) lignes.push(`DESCRIPTION:${echapperIcs(description)}`);
    alarmes.forEach(a => lignes.push("BEGIN:VALARM", "ACTION:DISPLAY", `DESCRIPTION:${echapperIcs(titre)}`, `TRIGGER:${a}`, "END:VALARM"));
    lignes.push("END:VEVENT");
    return lignes.join("\r\n");
}

export function construireIcs(voyageId) {

    const v = getEnvies().find(e => e.id === voyageId);
    if (!v) return { ics: "", nb: 0 };

    const aujourdhui = dateLocaleISO();
    const evenements = [];

    listerBillets(voyageId).filter(b => b.dateDepart && b.dateDepart >= aujourdhui).forEach(b => {
        const lieux = [nomLieu(b.lieuDepart), nomLieu(b.destination)].filter(Boolean).join(" → ");
        const titre = b.type === "logement"
            ? `🛏️ Arrivée : ${b.compagnie || "logement"}${nomLieu(b.destination) && nomLieu(b.destination) !== b.compagnie ? " (" + nomLieu(b.destination) + ")" : ""}`
            : `${titreCourtBillet(b) || motType(b.type)}${lieux ? " : " + lieux : ""}`;
        evenements.push(evenement({
            uid: `billet-${b.id}`, titre, description: `${v.titre || "Voyage"}${b.numeroVol ? " · " + b.numeroVol : ""}`,
            jour: b.dateDepart, heure: b.heureDepart || null,
            alarmes: b.heureDepart ? ["-P1D", "-PT3H"] : ["-PT15H"]
        }));
    });

    if (v.date?.start && v.date.start > aujourdhui) {
        [[7, "dans 7 jours"], [1, "demain"]].forEach(([n, mot]) => {
            const jour = jourPlus(v.date.start, -n);
            if (jour >= aujourdhui) evenements.push(evenement({
                uid: `depart-${v.id}-${n}`, titre: `🧳 ${v.titre || "Voyage"} : départ ${mot}`,
                description: "Vérifie les papiers d'identité, les billets et les valises dans EnVie.",
                jour, heure: null, alarmes: ["PT9H"]
            }));
        });
    }

    if (!evenements.length) return { ics: "", nb: 0 };

    const ics = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//EnVie//Rappels//FR", "CALSCALE:GREGORIAN", ...evenements, "END:VCALENDAR"].join("\r\n");
    return { ics, nb: evenements.length };
}

export function exporterRappels(voyageId) {

    const { ics, nb } = construireIcs(voyageId);
    if (!nb) { showToast("Aucun rappel à ajouter : pas de billet daté à venir"); return; }

    const v = getEnvies().find(e => e.id === voyageId);
    const nom = (v?.titre || "voyage").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    const lien = document.createElement("a");
    lien.href = URL.createObjectURL(new Blob([ics], { type: "text/calendar;charset=utf-8" }));
    lien.download = `rappels-${nom || "voyage"}.ics`;
    document.body.appendChild(lien);
    lien.click();
    lien.remove();
    setTimeout(() => URL.revokeObjectURL(lien.href), 4000);
    showToast(`📅 ${nb} rappel${nb > 1 ? "s" : ""} prêt${nb > 1 ? "s" : ""} : ouvre le fichier pour l'ajouter au calendrier`);
}
