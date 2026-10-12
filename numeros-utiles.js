/*
==========================================================
 EnVie - Nouvelle interface
 numeros-utiles.js : numéros d'urgence indicatifs par pays
 Détection du pays d'après le lieu du voyage et les destinations des billets.
 Numéros indicatifs : à vérifier avant le départ.
==========================================================
*/

const UE = [{ nom: "Urgences (police, pompiers, SAMU)", tel: "112" }];

const PAYS = [
    { pays: "France", noms: ["france"], numeros: [{ nom: "SAMU", tel: "15" }, { nom: "Police secours", tel: "17" }, { nom: "Pompiers", tel: "18" }, { nom: "Urgence européenne", tel: "112" }] },
    { pays: "Portugal", noms: ["portugal"], numeros: UE },
    { pays: "Espagne", noms: ["espagne", "spain"], numeros: UE },
    { pays: "Italie", noms: ["italie", "italy"], numeros: UE },
    { pays: "Allemagne", noms: ["allemagne", "germany", "deutschland"], numeros: UE },
    { pays: "Belgique", noms: ["belgique", "belgium"], numeros: UE },
    { pays: "Pays-Bas", noms: ["pays-bas", "netherlands", "hollande"], numeros: UE },
    { pays: "Grèce", noms: ["grece", "greece"], numeros: UE },
    { pays: "Croatie", noms: ["croatie", "croatia"], numeros: UE },
    { pays: "Autriche", noms: ["autriche", "austria"], numeros: UE },
    { pays: "Irlande", noms: ["irlande", "ireland"], numeros: [{ nom: "Urgences", tel: "112" }, { nom: "Urgences (aussi)", tel: "999" }] },
    { pays: "Royaume-Uni", noms: ["royaume-uni", "united kingdom", "angleterre", "england", "ecosse", "scotland", "pays de galles"], numeros: [{ nom: "Urgences", tel: "999" }, { nom: "Urgence européenne", tel: "112" }] },
    { pays: "Suisse", noms: ["suisse", "switzerland"], numeros: [{ nom: "Ambulance", tel: "144" }, { nom: "Police", tel: "117" }, { nom: "Pompiers", tel: "118" }, { nom: "Urgence européenne", tel: "112" }] },
    { pays: "États-Unis", noms: ["etats-unis", "united states", "usa"], numeros: [{ nom: "Urgences", tel: "911" }] },
    { pays: "Canada", noms: ["canada"], numeros: [{ nom: "Urgences", tel: "911" }] },
    { pays: "Mexique", noms: ["mexique", "mexico"], numeros: [{ nom: "Urgences", tel: "911" }] },
    { pays: "Maroc", noms: ["maroc", "morocco"], numeros: [{ nom: "Police", tel: "19" }, { nom: "Gendarmerie royale", tel: "177" }, { nom: "Protection civile, ambulance", tel: "15" }] },
    { pays: "Tunisie", noms: ["tunisie", "tunisia"], numeros: [{ nom: "Police", tel: "197" }, { nom: "SAMU", tel: "190" }, { nom: "Protection civile", tel: "198" }] },
    { pays: "Turquie", noms: ["turquie", "turkey", "turkiye"], numeros: UE },
    { pays: "Japon", noms: ["japon", "japan"], numeros: [{ nom: "Police", tel: "110" }, { nom: "Ambulance, pompiers", tel: "119" }] },
    { pays: "Thaïlande", noms: ["thailande", "thailand"], numeros: [{ nom: "Police", tel: "191" }, { nom: "Urgence médicale", tel: "1669" }] },
    { pays: "Chine", noms: ["chine", "china"], numeros: [{ nom: "Police", tel: "110" }, { nom: "Ambulance", tel: "120" }, { nom: "Pompiers", tel: "119" }] },
    { pays: "Inde", noms: ["inde", "india"], numeros: [{ nom: "Urgences", tel: "112" }] },
    { pays: "Australie", noms: ["australie", "australia"], numeros: [{ nom: "Urgences", tel: "000" }] },
    { pays: "Nouvelle-Zélande", noms: ["nouvelle-zelande", "new zealand"], numeros: [{ nom: "Urgences", tel: "111" }] },
    { pays: "Brésil", noms: ["bresil", "brazil"], numeros: [{ nom: "Police", tel: "190" }, { nom: "SAMU", tel: "192" }, { nom: "Pompiers", tel: "193" }] },
    { pays: "Islande", noms: ["islande", "iceland"], numeros: UE }
];

const normaliser = t => String(t ?? "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

/* Pays reconnus dans une liste de textes (lieu du voyage, destinations…). */
export function paysDetectes(textes) {
    const texte = normaliser(textes.filter(Boolean).join(" | "));
    const motif = n => new RegExp(`(^|[^a-z])${n.replace(/[.*+?^${}()|[\]\\-]/g, "\\$&")}([^a-z]|$)`);
    return PAYS.filter(p => p.noms.some(n => motif(n).test(texte)));
}

export const NUMERO_GENERAL = { pays: "Partout en Europe", numeros: UE };
