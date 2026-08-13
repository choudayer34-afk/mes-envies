import { showToast } from "./toast.js";

const ONBOARDING_KEY = "envie_onboarding_vu";
const NB_SLIDES = 4;
let slideActuel = 0;

function afficherSlide(index) {

    document.querySelectorAll(".onboardingSlide").forEach(slide => {
        slide.classList.toggle("hidden", Number(slide.dataset.slide) !== index);
    });

    const dots = document.getElementById("onboardingDots");

    dots.innerHTML = Array.from({ length: NB_SLIDES }, (_, i) =>
        `<span style="width:8px;height:8px;border-radius:50%;background:${i === index ? "#6FAFC4" : "#D9E6EC"};"></span>`
    ).join("");

    document.getElementById("onboardingSuivant").textContent =
        index === NB_SLIDES - 1 ? "💡 Créer ma première envie" : "Suivant";

}

function fermerOnboarding() {

    localStorage.setItem(ONBOARDING_KEY, "true");
    document.getElementById("onboardingModal")?.classList.add("hidden");

}

export function ouvrirOnboarding() {

    slideActuel = 0;
    afficherSlide(0);

    document.getElementById("onboardingModal")?.classList.remove("hidden");

}

export function initOnboarding() {

    document.getElementById("onboardingPasser")?.addEventListener("click", fermerOnboarding);

    document.getElementById("onboardingSuivant")?.addEventListener("click", () => {

        if (slideActuel < NB_SLIDES - 1) {

            slideActuel++;
            afficherSlide(slideActuel);

        } else {

            fermerOnboarding();

            const parentVide = document.getElementById("headerAccueilVide");

            const boutonACliquer = (parentVide && !parentVide.classList.contains("hidden"))
                ? document.getElementById("btnEnvie")
                : document.getElementById("btnEnvieCompact");

            boutonACliquer?.click();

        }

    });

    document.getElementById("plusBtnRevoirOnboarding")?.addEventListener("click", () => {
        document.getElementById("plusModal")?.classList.add("hidden");
        ouvrirOnboarding();
    });

    if (!localStorage.getItem(ONBOARDING_KEY)) {
        ouvrirOnboarding();
    }

}

/* ---------- Indices contextuels (versionnés) ---------- */

const INDICES = [
    { id: "peinture", version: 1, cible: "peintureSection", message: "💡 Renseigne tes murs, on calcule les litres de peinture nécessaires pour toi." },
    { id: "bois", version: 1, cible: "boisSection", message: "💡 Indique tes découpes, on te dit comment les répartir sur tes planches brutes." },
    { id: "comparateur", version: 1, cible: "comparateurSection", message: "💡 Compare plusieurs produits, marque ton choix final avec 🏆." },
    { id: "devis", version: 1, cible: "devisSection", message: "💡 Scanne une carte de visite pour remplir automatiquement société/contact." }
];

const INDICES_VUS_KEY = "envie_indices_vus";

function getIndicesVus() {

    try {
        return JSON.parse(localStorage.getItem(INDICES_VUS_KEY) || "[]");
    } catch {
        return [];
    }

}

function marquerIndiceVu(cle) {

    const vus = getIndicesVus();

    if (!vus.includes(cle)) {
        vus.push(cle);
        localStorage.setItem(INDICES_VUS_KEY, JSON.stringify(vus));
    }

}

function afficherIndiceSiNecessaire(indice) {

    const cle = `${indice.id}_v${indice.version}`;

    if (getIndicesVus().includes(cle))
        return;

    showToast(indice.message);
    marquerIndiceVu(cle);

}

export function initIndicesContextuels() {

    const ficheOverlay = document.getElementById("ficheOverlay");

    if (!ficheOverlay || ficheOverlay.dataset.indicesInit === "true")
        return;

    ficheOverlay.dataset.indicesInit = "true";

    ficheOverlay.addEventListener("click", (event) => {

        const header = event.target.closest(".accordionHeader");

        if (!header)
            return;

        const indice = INDICES.find(i => i.cible === header.dataset.target);

        if (!indice)
            return;

        setTimeout(() => {

            const section = document.getElementById(indice.cible);

            if (section && !section.classList.contains("hidden")) {
                afficherIndiceSiNecessaire(indice);
            }

        }, 50);

    });

}

const RUBRIQUE_ONBOARDING = {

    peinture: {
        version: 1,
        titre: "🎨 Peinture",
        aQuoiCaSert: "Calcule automatiquement la quantité de peinture nécessaire à partir des dimensions de tes murs.",
        commentCaSutilise: "Ajoute chaque mur (largeur × hauteur), déduis les ouvertures (portes, fenêtres) si besoin, choisis le nombre de couches — le nombre de litres à acheter s'affiche directement."
    },

    bois: {
        version: 1,
        titre: "🪵 Bois",
        aQuoiCaSert: "T'aide à calculer combien de bois acheter et comment découper tes planches brutes sans gaspillage.",
        commentCaSutilise: "Liste les pièces à découper (longueur, largeur, épaisseur), indique les planches brutes que tu as ou comptes acheter — un schéma de découpe optimisé s'affiche."
    },

    comparateur: {
        version: 1,
        titre: "⚖️ Comparateur",
        aQuoiCaSert: "Compare plusieurs produits avant d'acheter, sans perdre le fil de tes recherches.",
        commentCaSutilise: "Ajoute chaque option avec prix, photo, avis. Marque ton choix final avec 🏆 — il passe alors automatiquement dans ta liste À acheter."
    },

    devis: {
        version: 1,
        titre: "🧾 Devis",
        aQuoiCaSert: "Suit tes demandes de devis auprès des artisans, du premier contact jusqu'à la décision.",
        commentCaSutilise: "Ajoute une société (scanne sa carte de visite pour aller plus vite), suis son statut (à contacter, RDV, devis reçu), et marque celui que tu retiens."
    },

    croquis: {
        version: 1,
        titre: "📐 Croquis",
        aQuoiCaSert: "Dessine un mur ou une pièce à l'échelle réelle, même si les angles ne sont pas droits, pour y positionner des éléments avec leurs vraies dimensions.",
        commentCaSutilise: "Ajoute tes murs un par un avec leur longueur. Pour un coin qui n'est pas droit, indique la diagonale mesurée plutôt qu'un angle. Place ensuite tes éléments par clic ou par distance précise."
    },

    simulationIA: {
        version: 1,
        titre: "🪄 Simulation IA",
        aQuoiCaSert: "Prépare tout ce qu'il faut (photo + description + éventuels produits) pour demander à une IA (ChatGPT, Gemini...) de visualiser un changement avant de te lancer.",
        commentCaSutilise: "Choisis une photo de base, coche éventuellement des produits/photos à intégrer en précisant où, décris ce que tu veux changer — le prompt et les images à envoyer sont générés pour toi."
    },

    checklist: {
        version: 1,
        titre: "☐ Checklist",
        aQuoiCaSert: "Ta liste d'achats ou de tâches pour ce projet, organisée par catégorie ou par personne.",
        commentCaSutilise: "Ajoute des éléments un par un ou depuis un modèle réutilisable. Coche au fur et à mesure — les éléments faits descendent en bas, les catégories entièrement cochées passent tout en bas de la liste."
    },

    evaluation: {
        version: 1,
        titre: "🎚️ Évaluation",
        aQuoiCaSert: "Garde une trace de ton ressenti une fois l'expérience vécue (note, difficulté, adapté aux enfants...).",
        commentCaSutilise: "Renseigne les critères après coup — utile pour te souvenir plus tard si tu recommencerais, ou pour comparer plusieurs idées similaires."
    }

};

export function afficherOnboardingRubriqueSiNecessaire(rubriqueId, callbackApresFermeture) {

    const contenu = RUBRIQUE_ONBOARDING[rubriqueId];

    if (!contenu) {
        callbackApresFermeture?.();
        return;
    }

    const cle = `rubrique_${rubriqueId}_v${contenu.version}`;

    if (getIndicesVus().includes(cle)) {
        callbackApresFermeture?.();
        return;
    }

    document.getElementById("rubriqueOnboardingTitre").textContent = contenu.titre;
    document.getElementById("rubriqueOnboardingSert").textContent = contenu.aQuoiCaSert;
    document.getElementById("rubriqueOnboardingUtilise").textContent = contenu.commentCaSutilise;

    const modal = document.getElementById("rubriqueOnboardingModal");
    modal.classList.remove("hidden");

    const boutonPasser = document.getElementById("rubriqueOnboardingPasser");
    const boutonCompris = document.getElementById("rubriqueOnboardingCompris");

    function fermer() {

        marquerIndiceVu(cle);
        modal.classList.add("hidden");

        boutonPasser.removeEventListener("click", fermer);
        boutonCompris.removeEventListener("click", fermer);

        callbackApresFermeture?.();

    }

    boutonPasser.addEventListener("click", fermer);
    boutonCompris.addEventListener("click", fermer);

}
