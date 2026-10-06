/*
==========================================================
 EnVie - Nouvelle interface
 jours.js : libellé court d'un jour dans les sélecteurs.
 Le mois est ajouté dès que le voyage s'étale sur plusieurs mois.
==========================================================
*/

export function etaleSurPlusieursMois(jours) {
    return new Set(jours.map(j => j.slice(0, 7))).size > 1;
}

export function libelleJourCourt(iso, jours) {
    const options = { weekday: "short", day: "numeric" };
    if (etaleSurPlusieursMois(jours)) options.month = "short";
    return new Date(iso + "T12:00:00").toLocaleDateString("fr-FR", options);
}

const MOIS = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];

/* Calendrier limité aux mois du voyage : seuls les jours du voyage sont choisissables.
   occupes : Map jour -> nombre d'éléments déjà prévus (petit point sous le jour). */
export function calendrierVoyage(jours, choix, occupes = new Map()) {

    if (!jours.length) return "";
    const dansVoyage = new Set(jours);
    const [a1, m1] = jours[0].split("-").map(Number);
    const [a2, m2] = jours[jours.length - 1].split("-").map(Number);

    let html = '<div class="niCal">';
    for (let a = a1, m = m1; a < a2 || (a === a2 && m <= m2); m === 12 ? (a++, m = 1) : m++) {

        const nbJours = new Date(a, m, 0).getDate();
        const decalage = (new Date(a, m - 1, 1).getDay() + 6) % 7;   /* lundi = 0 */

        html += `<div class="niCalMois"><span class="niCalTitre">${MOIS[m - 1]} ${a}</span><div class="niCalGrille">`;
        ["L", "M", "M", "J", "V", "S", "D"].forEach(j => { html += `<span class="niCalEntete" aria-hidden="true">${j}</span>`; });

        /* Cases du mois, par semaines ; une semaine sans aucun jour du voyage n'est pas affichée. */
        const cases = [...Array(decalage).fill(null)];
        for (let d = 1; d <= nbJours; d++) cases.push(`${a}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`);
        while (cases.length % 7) cases.push(null);

        for (let i = 0; i < cases.length; i += 7) {
            const semaine = cases.slice(i, i + 7);
            if (!semaine.some(iso => iso && dansVoyage.has(iso))) continue;
            semaine.forEach(iso => {
                if (!iso) { html += "<span></span>"; return; }
                const d = Number(iso.slice(8));
                if (!dansVoyage.has(iso)) {
                    html += `<span class="niCalJour niCalHors" aria-hidden="true">${d}</span>`;
                    return;
                }
                const n = occupes.get(iso) || 0;
                html += `<button type="button" class="niCalJour${iso === choix ? " niCalChoix" : ""}" data-j="${iso}" aria-pressed="${iso === choix}" aria-label="J${jours.indexOf(iso) + 1}, ${d} ${MOIS[m - 1]}${n ? `, ${n} prévu${n > 1 ? "s" : ""}` : ""}">${d}${n ? '<i class="niCalPoint"></i>' : ""}</button>`;
            });
        }
        html += "</div></div>";
    }
    return html + "</div>";
}

/* Feuille « Aller au jour » : le calendrier du voyage, pour les longs séjours. */
export function ouvrirCalendrierJour({ jours, courant, occupes, surChoix }) {

    document.getElementById("niCalendrierJour")?.remove();

    const fond = document.createElement("div");
    fond.id = "niCalendrierJour";
    fond.className = "niFeuilleFond";
    fond.innerHTML = `
        <div class="niFeuille" role="dialog" aria-label="Choisir un jour">
            <div class="niPoignee"></div>
            <h2 class="niTitreSection" style="font-size:22px">Aller au jour</h2>
            ${calendrierVoyage(jours, courant, occupes)}
        </div>`;
    document.body.appendChild(fond);

    fond.addEventListener("click", e => {
        if (e.target === fond) { fond.remove(); return; }
        const b = e.target.closest("[data-j]");
        if (!b) return;
        fond.remove();
        surChoix(b.dataset.j);
    });
    fond.querySelector(".niCalChoix")?.scrollIntoView({ block: "center" });
}

export const SEUIL_CALENDRIER = 10;   /* au-delà de 10 jours, le bouton calendrier apparaît */

export function boutonCalendrier(jours, courant) {
    if (jours.length <= SEUIL_CALENDRIER) return "";
    return `<button type="button" class="niBouton niBoutonCalendrier" id="niJourCalendrier">📅 Calendrier · ${libelleJourCourt(courant, [...jours, "0000-00"])}</button>`;
}
