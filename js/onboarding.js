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
