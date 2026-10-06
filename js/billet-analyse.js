/*
==========================================================
 EnVie - Nouvelle interface
 billet-analyse.js : devine les champs d'un billet à partir de son texte
 Fonctions pures (aucun accès à la base). Le résultat est une
 proposition : l'écran de billet la présente à vérifier.
==========================================================
*/

const COMPAGNIES = {
    AF: "Air France", TP: "TAP Air Portugal", U2: "easyJet", EZY: "easyJet", FR: "Ryanair", VY: "Vueling",
    LH: "Lufthansa", BA: "British Airways", KL: "KLM", IB: "Iberia", TO: "Transavia", HV: "Transavia",
    SN: "Brussels Airlines", LX: "Swiss", AZ: "ITA Airways", EK: "Emirates", QR: "Qatar Airways",
    TK: "Turkish Airlines", DL: "Delta", AA: "American Airlines", UA: "United", AC: "Air Canada",
    SK: "SAS", AY: "Finnair", OS: "Austrian", LO: "LOT", W6: "Wizz Air", EW: "Eurowings", AT: "Royal Air Maroc",
    TU: "Tunisair", AH: "Air Algérie", ET: "Ethiopian", SS: "Corsair", XK: "Air Corsica", A5: "HOP!", "5O": "ASL Airlines"
};

const NOMS_COMPAGNIES = [
    "Air France", "TAP Air Portugal", "TAP", "easyJet", "Ryanair", "Vueling", "Lufthansa", "British Airways", "KLM",
    "Iberia", "Transavia", "Brussels Airlines", "Swiss", "ITA Airways", "Emirates", "Qatar Airways", "Turkish Airlines",
    "Delta", "American Airlines", "United", "Air Canada", "Finnair", "Wizz Air", "Eurowings", "Royal Air Maroc",
    "Corsair", "Air Corsica", "Volotea", "Norwegian", "Binter", "Aer Lingus", "Air Europa",
    "OUIGO", "TGV INOUI", "INOUI", "SNCF", "Eurostar", "Thalys", "Trenitalia", "Italo", "Renfe", "Deutsche Bahn", "Flixbus", "FlixBus", "BlaBlaCar Bus",
    "Corsica Ferries", "Brittany Ferries", "La Méridionale", "Condor Ferries",
    "Hertz", "Avis", "Europcar", "Sixt", "Enterprise", "Ada", "Rent A Car", "Booking.com", "Airbnb", "Accor", "Ibis", "Novotel"
];

const AEROPORTS = {
    CDG: "Paris CDG", ORY: "Paris Orly", BVA: "Paris Beauvais", LYS: "Lyon", MRS: "Marseille", NCE: "Nice", TLS: "Toulouse",
    BOD: "Bordeaux", NTE: "Nantes", MPL: "Montpellier", LIL: "Lille", SXB: "Strasbourg", BIA: "Bastia", AJA: "Ajaccio",
    LIS: "Lisbonne", OPO: "Porto", FAO: "Faro", MAD: "Madrid", BCN: "Barcelone", PMI: "Palma", AGP: "Malaga", SVQ: "Séville",
    FCO: "Rome Fiumicino", CIA: "Rome Ciampino", MXP: "Milan Malpensa", VCE: "Venise", NAP: "Naples", LHR: "Londres Heathrow",
    LGW: "Londres Gatwick", STN: "Londres Stansted", DUB: "Dublin", AMS: "Amsterdam", BRU: "Bruxelles", FRA: "Francfort",
    MUC: "Munich", BER: "Berlin", ZRH: "Zurich", GVA: "Genève", VIE: "Vienne", PRG: "Prague", ATH: "Athènes", IST: "Istanbul",
    CMN: "Casablanca", RAK: "Marrakech", TUN: "Tunis", ALG: "Alger", JFK: "New York JFK", EWR: "New York Newark",
    MIA: "Miami", LAX: "Los Angeles", YUL: "Montréal", DXB: "Dubaï", DOH: "Doha", CPH: "Copenhague", ARN: "Stockholm",
    OSL: "Oslo", HEL: "Helsinki", WAW: "Varsovie", BUD: "Budapest", LUX: "Luxembourg", TNG: "Tanger", AGA: "Agadir",
    RUN: "La Réunion", PTP: "Pointe-à-Pitre", FDF: "Fort-de-France", PPT: "Papeete", NOU: "Nouméa"
};

const MOIS = {
    janvier: 1, janv: 1, jan: 1, january: 1, fevrier: 2, février: 2, fev: 2, févr: 2, feb: 2, february: 2, mars: 3, mar: 3, march: 3,
    avril: 4, avr: 4, apr: 4, april: 4, mai: 5, may: 5, juin: 6, jun: 6, june: 6, juillet: 7, juil: 7, jul: 7, july: 7,
    aout: 8, août: 8, aug: 8, august: 8, septembre: 9, sept: 9, sep: 9, september: 9, octobre: 10, oct: 10, october: 10,
    novembre: 11, nov: 11, november: 11, decembre: 12, décembre: 12, dec: 12, déc: 12, december: 12
};

function pad(n) { return String(n).padStart(2, "0"); }

function iso(annee, mois, jour) {
    if (mois < 1 || mois > 12 || jour < 1 || jour > 31) return null;
    return `${annee}-${pad(mois)}-${pad(jour)}`;
}

/* Toutes les dates trouvées, dans l'ordre du texte. refAnnee : année supposée si absente. */
export function trouverDates(texte, refAnnee) {

    const trouvees = [];
    const ajouter = (index, valeur) => { if (valeur) trouvees.push({ index, valeur }); };
    const annee2 = a => (a.length === 2 ? 2000 + Number(a) : Number(a));

    let m;
    const iso4 = /\b(20\d{2})-(\d{2})-(\d{2})\b/g;
    while ((m = iso4.exec(texte))) ajouter(m.index, iso(Number(m[1]), Number(m[2]), Number(m[3])));

    const num = /\b(\d{1,2})[\/.](\d{1,2})[\/.](\d{4}|\d{2})\b/g;
    while ((m = num.exec(texte))) ajouter(m.index, iso(annee2(m[3]), Number(m[2]), Number(m[1])));

    const lettres = /\b(\d{1,2})(?:er)?\s+(janv(?:ier)?|f[ée]vr(?:ier)?|mars|avr(?:il)?|mai|juin|juil(?:let)?|ao[uû]t|sept(?:embre)?|oct(?:obre)?|nov(?:embre)?|d[ée]c(?:embre)?|jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|october|november|december)\.?(?:\s+(\d{4}))?/gi;
    while ((m = lettres.exec(texte))) {
        const cle = m[2].toLowerCase().replace(/\.$/, "");
        const mois = MOIS[cle] || MOIS[cle.slice(0, 4)] || MOIS[cle.slice(0, 3)];
        ajouter(m.index, iso(m[3] ? Number(m[3]) : refAnnee, mois, Number(m[1])));
    }

    /* Format anglais : "Oct 20, 2026" / "October 20 2026" */
    const anglais = /\b(jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\.?\s+(\d{1,2})(?:st|nd|rd|th)?,?\s+(\d{4})\b/gi;
    while ((m = anglais.exec(texte))) ajouter(m.index, iso(Number(m[3]), MOIS[m[1].toLowerCase()], Number(m[2])));

    return trouvees.sort((a, b) => a.index - b.index);
}

export function trouverHeures(texte) {
    const heures = [];
    const re = /\b([01]?\d|2[0-3])\s?[:hH]\s?([0-5]\d)\b/g;
    let m;
    while ((m = re.exec(texte))) heures.push({ index: m.index, valeur: `${pad(m[1])}:${m[2]}` });
    return heures;
}

function detecterType(t) {
    const texte = t.toLowerCase();
    const tests = [
        ["parking", /parking|stationnement/],
        ["voiture", /location de v[ée]hicule|location de voiture|car rental|hertz|europcar|sixt|avis budget|retrait du v[ée]hicule/],
        ["avion", /\bvol\b|flight|boarding|embarquement|a[ée]roport|airport|e-?ticket|itin[ée]raire de vol|\b[A-Z]{3}\s*(?:→|->|-)\s*[A-Z]{3}\b/i],
        ["train", /sncf|tgv|inoui|ouigo|ter\b|eurostar|thalys|trenitalia|italo|renfe|deutsche bahn|\bvoiture\s+\d+\b.*place|e-billet/],
        ["busferry", /flixbus|blablacar bus|ferry|ferries|travers[ée]e|m[ée]ridionale/],
        ["logement", /h[ôo]tel|airbnb|booking\.com|h[ée]bergement|nuit[ée]e|check-?in|arriv[ée]e.*d[ée]part.*chambre|gîte|g[iî]te/],
        ["restaurant", /restaurant|table pour|couverts|thefork|lafourchette/],
        ["assurance", /assurance|insurance|n° de police|num[ée]ro de police|europ assistance/],
        ["activite", /billet d'entr[ée]e|admission|visite guid[ée]e|mus[ée]e|parc d'attractions|ticket d'entr[ée]e|spectacle/]
    ];
    for (const [type, re] of tests) if (re.test(t) || re.test(texte)) return type;
    return null;
}

function detecterCompagnie(texte) {
    const trouve = NOMS_COMPAGNIES.find(nom => new RegExp(`(^|[^A-Za-zÀ-ÿ])${nom.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}([^A-Za-zÀ-ÿ]|$)`, "i").test(texte));
    return trouve || null;
}

function detecterVol(texte) {
    /* "Vol AF 1224", "Flight TP1234", ou code compagnie connu + 2 à 4 chiffres */
    let m = texte.match(/\b(?:vol|flight|vuelo)\s*(?:n[°o]\s*)?:?\s*([A-Z0-9]{2})\s?(\d{2,4})\b/i);
    if (m) return { code: m[1].toUpperCase(), numero: m[2] };
    const codes = Object.keys(COMPAGNIES).filter(c => c.length === 2).join("|");
    m = texte.match(new RegExp(`\\b(${codes})\\s?(\\d{2,4})\\b`));
    return m ? { code: m[1], numero: m[2] } : null;
}

function detecterReference(texte) {
    const re = /(?:(?:r[ée]f[ée]rence|r[ée]servation|reservation|dossier|booking|ref|pnr|confirmation|code|de|du|n[°o]|number|numéro|numero)\s*[:#-]?\s*)+([A-Za-z0-9]{5,10})\b/gi;
    for (const m of texte.matchAll(re)) {
        const v = m[1];
        if (v !== v.toUpperCase()) continue;
        if (/\d/.test(v) || /^[A-Z]{6}$/.test(v)) return v;
    }
    return null;
}

/* Nom de lieu réservé : « Hôtel Mar », « Parking P3 Orly » */
function detecterNomLieu(texte, type) {
    const motif = {
        logement: /\b(?:H[ôo]tel|R[ée]sidence|Auberge|Camping|Appartement|G[iî]te)\s+[A-ZÀ-Ý][\wÀ-ÿ'’-]*(?:\s+[A-ZÀ-Ý][\wÀ-ÿ'’-]*){0,2}/,
        parking: /\bParking\s+[A-Z0-9][\wÀ-ÿ'’-]*(?:\s+[A-ZÀ-Ý][\wÀ-ÿ'’-]*){0,2}/,
        restaurant: /\b(?:Restaurant|Brasserie|Auberge)\s+[A-ZÀ-Ý][\wÀ-ÿ'’-]*(?:\s+[A-ZÀ-Ý][\wÀ-ÿ'’-]*){0,2}/
    }[type];
    const brut = motif ? (texte.match(motif)?.[0] || null) : null;
    if (!brut) return null;
    const stop = /^(arriv[ée]e|d[ée]part|check|confirmation|r[ée]servation|du|au|le|la|pour|date|adresse|n[°o]|num[ée]ro|total|prix|tarif)$/i;
    const mots = brut.split(/\s+/);
    while (mots.length > 1 && stop.test(mots[mots.length - 1])) mots.pop();
    return mots.join(" ");
}

function detecterTrajet(texte, type) {

    /* Aéroports : "CDG → LIS", "CDG - LIS", "(CDG) … (LIS)" */
    let m = texte.match(/\b([A-Z]{3})\s*(?:→|->|➔|>|-|–|\/|to|vers)\s*([A-Z]{3})\b/);
    if (m && AEROPORTS[m[1]] && AEROPORTS[m[2]]) return { de: AEROPORTS[m[1]], vers: AEROPORTS[m[2]] };

    const entre = [...texte.matchAll(/\(([A-Z]{3})\)/g)].map(x => x[1]).filter(c => AEROPORTS[c]);
    const uniques = [...new Set(entre)];
    if (uniques.length >= 2) return { de: AEROPORTS[uniques[0]], vers: AEROPORTS[uniques[1]] };

    const codes = [...new Set([...texte.matchAll(/\b([A-Z]{3})\b/g)].map(x => x[1]).filter(c => AEROPORTS[c]))];
    if (codes.length >= 2 && type === "avion") return { de: AEROPORTS[codes[0]], vers: AEROPORTS[codes[1]] };

    /* Villes ou gares reliées par une flèche */
    m = texte.match(/([A-ZÉÈÀ][A-Za-zÀ-ÿ'.\- ]{2,30}?)\s*(?:→|->|➔|>)\s*([A-ZÉÈÀ][A-Za-zÀ-ÿ'.\- ]{2,30}?)(?=\s{2,}|\s*\d|\s*$|\s*[,;])/);
    if (m) return { de: m[1].trim(), vers: m[2].trim() };

    /* Train : « 07h45 Paris Gare de Lyon … 10h58 Marseille St Charles » */
    if (type === "train" || type === "busferry") {
        m = texte.match(/\b\d{1,2}\s?[h:]\s?\d{2}\s+([A-ZÉÈ][A-Za-zÀ-ÿ'.\- ]{2,35}?)\s+(?:\d+\s?h\s?\d*\s+)?\d{1,2}\s?[h:]\s?\d{2}\s+([A-ZÉÈ][A-Za-zÀ-ÿ'.\- ]{2,35})/);
        if (m) return { de: m[1].trim(), vers: m[2].trim().replace(/\s+(Voiture|Place|Classe|Tarif).*$/i, "") };
    }
    return null;
}

/* Renvoie { type, compagnie, numero, date, heure, arrivee, de, vers, reference, retourDate, retourHeure }. Champs absents : non renvoyés. */
export function analyserTexte(brut, options = {}) {

    const texte = String(brut || "").replace(/ /g, " ").replace(/[ \t]+/g, " ");
    if (texte.trim().length < 15) return {};

    const refAnnee = options.refAnnee || new Date().getFullYear();
    const resultat = {};

    const type = detecterType(texte);
    if (type) resultat.type = type;

    const vol = detecterVol(texte);
    const compagnieNom = detecterCompagnie(texte);
    const nomLieu = detecterNomLieu(texte, type);
    if (nomLieu) resultat.compagnie = nomLieu;
    else if (compagnieNom) resultat.compagnie = compagnieNom;
    else if (vol && COMPAGNIES[vol.code]) resultat.compagnie = COMPAGNIES[vol.code];
    if (vol && (type === "avion" || !type)) {
        resultat.numero = `${vol.code}${vol.numero}`;
        if (!type) resultat.type = "avion";
    }

    const reference = detecterReference(texte);
    if (reference) {
        if (resultat.numero) resultat.reference = reference;
        else resultat.numero = reference;
    }

    const dates = trouverDates(texte, refAnnee);
    const distinctes = [...new Set(dates.map(d => d.valeur))];
    if (distinctes.length) resultat.date = distinctes[0];
    if (distinctes.length >= 2 && (["parking", "voiture", "logement"].includes(resultat.type) || /retour|return|inbound|aller-?retour|round.?trip/i.test(texte))) {
        resultat.retourDate = distinctes[1];
    }

    const trajetType = ["avion", "train", "busferry"].includes(resultat.type);
    const heures = trouverHeures(texte);
    if (heures.length) {
        resultat.heure = heures[0].valeur;
        if (trajetType && heures[1] && heures[1].valeur !== heures[0].valeur) resultat.arrivee = heures[1].valeur;
    }

    const trajet = detecterTrajet(texte, resultat.type);
    if (trajet && trajetType) { resultat.de = trajet.de; resultat.vers = trajet.vers; }
    else if (trajet && !trajetType) resultat.vers = trajet.vers;

    return resultat;
}
