const CATEGORIES_SURVIE = [
    { id: "priorites", emoji: "🚨", label: "Priorités immédiates" },
    { id: "abri", emoji: "🏠", label: "Abri" },
    { id: "eau", emoji: "💧", label: "Eau" },
    { id: "feu", emoji: "🔥", label: "Feu" },
    { id: "protection", emoji: "☀️", label: "Protection" },
    { id: "orientation", emoji: "🧭", label: "Orientation" },
    { id: "nourriture", emoji: "🍄", label: "Se nourrir" },
    { id: "outils", emoji: "🪢", label: "Outils & nœuds" },
    { id: "signaler", emoji: "🆘", label: "Signaler sa position" },
    { id: "meteo", emoji: "🌦️", label: "Lire le ciel" },
    { id: "mental", emoji: "🧠", label: "Mental & solitude" },
    { id: "secours", emoji: "🩹", label: "Premiers secours" }
];

const FICHES_SURVIE = [

    {
        id: "methode-stop", categorieId: "priorites", emoji: "🛑", titre: "Méthode S.T.O.P.",
        illustration: "F985D7C2-AEC0-45C9-BE08-12DA2AB20971.png",
        sections: [
            { titre: "La règle des 3", points: [
                "3 secondes pour évaluer un danger immédiat avant d'agir.",
                "3 heures : durée critique sans abri par grand froid ou pluie.",
                "3 jours : durée critique sans eau.",
                "3 semaines : durée critique sans nourriture."
            ]},
            { titre: "Les 4 étapes S.T.O.P.", points: [
                "S — S'arrêter : ne pas paniquer, ne pas continuer à avancer au hasard.",
                "T — Réfléchir (Think) : faire le point sur la situation, l'heure, la météo.",
                "O — Observer : repérer les ressources autour (eau, bois, abri naturel).",
                "P — Planifier : décider d'une action claire avant de bouger."
            ]}
        ]
    },

    {
        id: "construire-abri", categorieId: "abri", emoji: "🏠", titre: "Construire un abri simple",
        illustration: "C21B8912-EC1A-4798-9A9C-02F3B5DBFE0C.png",
        sections: [
            { titre: "Choisir l'emplacement", points: [
                "Terrain légèrement en pente pour l'écoulement de l'eau.",
                "À l'abri du vent dominant, jamais sous un arbre mort ou une branche fragile.",
                "Proche de ressources (bois, eau) sans être trop loin d'un point repérable."
            ]},
            { titre: "Construire un appentis", points: [
                "Appuyer une branche maîtresse en diagonale contre un tronc ou entre deux arbres.",
                "Poser des branches plus fines perpendiculairement contre elle, façon toit incliné.",
                "Recouvrir de feuilles, fougères ou mousse en couches superposées du bas vers le haut.",
                "Isoler le sol avec des branchages secs avant de s'asseoir/s'allonger — la perte de chaleur par le sol est la plus rapide."
            ]}
        ]
    },

    {
        id: "trouver-purifier-eau", categorieId: "eau", emoji: "💧", titre: "Trouver et purifier l'eau",
        illustration: "EB73ECA5-80AF-4938-BAA6-D8188E39440D.png",
        sections: [
            { titre: "Où chercher", points: [
                "Cours d'eau qui coule plutôt qu'une eau stagnante.",
                "Point bas d'un vallon, végétation dense (souvent signe d'humidité).",
                "Rosée du matin récoltable avec un tissu passé sur l'herbe."
            ]},
            { titre: "Purifier avant de boire", points: [
                "Filtrer grossièrement avec un tissu pour retirer les particules visibles.",
                "Faire bouillir au moins 1 minute pour éliminer les micro-organismes.",
                "Sans feu possible : pastilles de purification si disponibles.",
                "Ne jamais boire une eau non traitée, même si elle semble claire."
            ]}
        ]
    },

    {
        id: "allumer-feu", categorieId: "feu", emoji: "🔥", titre: "Allumer et entretenir un feu",
        illustration: "BF568D8A-0459-4900-92E4-B38BA8C435AC.png",
        sections: [
            { titre: "Préparer avant d'allumer", points: [
                "Rassembler 3 tailles de bois : brindilles fines, branches moyennes, bûches.",
                "Choisir un emplacement dégagé, loin de branches basses et de végétation sèche.",
                "Préparer un lit de petit bois sec avant de chercher à produire une flamme."
            ]},
            { titre: "Entretenir", points: [
                "Nourrir progressivement du plus fin au plus épais, jamais l'inverse.",
                "Protéger la base du vent avec des pierres ou un mur de bois vert.",
                "Ne jamais laisser un feu sans surveillance, l'éteindre complètement avant de partir."
            ]}
        ]
    },

    {
        id: "proteger-soleil-froid", categorieId: "protection", emoji: "☀️", titre: "Se protéger du soleil et du froid",
        illustration: "1077301E-9A9B-490E-BA81-D38CF9C27B91.png",
        sections: [
            { titre: "Contre le soleil", points: [
                "Créer de l'ombre avec un tissu tendu entre deux points fixes.",
                "Se couvrir plutôt que se découvrir : les vêtements amples protègent mieux que la peau nue.",
                "Boire régulièrement même sans sensation de soif marquée."
            ]},
            { titre: "Contre le froid", points: [
                "Isoler du sol avant de chercher à se couvrir par-dessus.",
                "Superposer plusieurs couches fines plutôt qu'une seule épaisse.",
                "Repérer les signes d'hypothermie : tremblements incontrôlés, confusion, perte de coordination — chercher de la chaleur immédiatement si présents."
            ]}
        ]
    },

    {
        id: "orientation-sans-gps", categorieId: "orientation", emoji: "🧭", titre: "S'orienter sans GPS",
        illustration: "orientation.png",
        sections: [
            { titre: "Avec le soleil", points: [
                "Le soleil se lève à l'est et se couche à l'ouest (approximatif selon la saison).",
                "À midi solaire, l'ombre la plus courte pointe vers le nord (hémisphère nord)."
            ]},
            { titre: "Avec une montre analogique", points: [
                "Poser la montre à plat, orienter la petite aiguille vers le soleil.",
                "La bissection entre la petite aiguille et 12h indique approximativement le sud (hémisphère nord)."
            ]},
            { titre: "Avec les étoiles (nuit)", points: [
                "Repérer l'étoile Polaire via la Grande Ourse pour trouver le nord (hémisphère nord)."
            ]}
        ]
    },

    {
        id: "se-nourrir-prudence", categorieId: "nourriture", emoji: "🍄", titre: "Se nourrir avec prudence",
        illustration: "nourriture.png",
        sections: [
            { titre: "Règle d'or", points: [
                "Ne jamais consommer un champignon sans identification certaine par un expert.",
                "En cas de doute sur une plante ou un fruit sauvage : ne pas consommer.",
                "Éviter tout ce qui a une odeur d'amande amère, un latex blanc, ou pousse près de déchets."
            ]},
            { titre: "Pistes simples", points: [
                "Certaines baies communes sont identifiables avec certitude si on les connaît déjà — ne pas improviser.",
                "La pêche à la ligne ou au piège simple est souvent plus sûre que la cueillette incertaine."
            ]}
        ]
    },

    {
        id: "noeuds-utiles", categorieId: "outils", emoji: "🪢", titre: "3 nœuds utiles",
        illustration: "outils-noeuds.png",
        sections: [
            { titre: "Nœud en huit", points: [
                "Utile pour créer une boucle d'accroche solide en bout de corde.",
                "Facile à défaire même après avoir forcé."
            ]},
            { titre: "Nœud de cabestan", points: [
                "Idéal pour attacher rapidement une corde autour d'un poteau ou d'une branche.",
                "Se resserre sous tension, pratique pour monter un abri."
            ]},
            { titre: "Nœud plat", points: [
                "Pour relier deux cordes de diamètre similaire.",
                "Ne pas l'utiliser pour une charge lourde ou en suspension."
            ]}
        ]
    },

    {
        id: "signaler-detresse", categorieId: "signaler", emoji: "🆘", titre: "Signaler sa position",
        illustration: "signaler.png",
        sections: [
            { titre: "Règle du 3", points: [
                "3 signaux identiques répétés (feux, sifflets, éclats) sont universellement reconnus comme un appel de détresse.",
                "3 feux disposés en triangle sont visibles de loin et de l'air."
            ]},
            { titre: "Moyens simples", points: [
                "Miroir ou surface réfléchissante orientée vers le soleil et un point éloigné.",
                "Fumée épaisse le jour (végétation verte sur le feu), flamme vive la nuit.",
                "Grand symbole SOS formé au sol avec pierres ou branches, visible du ciel."
            ]}
        ]
    },

    {
        id: "lire-nuages", categorieId: "meteo", emoji: "🌦️", titre: "Lire le ciel sans instrument",
        illustration: "meteo.png",
        sections: [
            { titre: "Signes de pluie proche", points: [
                "Nuages bas, sombres et à base plate qui s'épaississent rapidement.",
                "Chute soudaine du vent puis reprise en rafales.",
                "Animaux et insectes qui deviennent silencieux ou se mettent à l'abri."
            ]},
            { titre: "Signes de beau temps", points: [
                "Ciel dégagé au coucher du soleil, teintes rouges/orangées nettes.",
                "Nuages fins et étirés en haute altitude, sans épaisseur."
            ]}
        ]
    },

    {
        id: "gerer-solitude", categorieId: "mental", emoji: "🧠", titre: "Gérer la solitude et le stress",
        illustration: "mental-solitude.png",
        sections: [
            { titre: "Dans l'instant", points: [
                "Respirer profondément et lentement avant toute décision — la panique consomme de l'énergie et brouille le jugement.",
                "Se fixer une petite tâche concrète immédiate (ramasser du bois, sécuriser l'abri) pour reprendre le contrôle.",
                "Parler à voix haute à soi-même aide à structurer ses pensées et réduit le sentiment d'isolement."
            ]},
            { titre: "Sur la durée", points: [
                "Établir une routine simple (repas, repos, tâches) donne un repère temporel stabilisant.",
                "Se rappeler que la plupart des situations de survie se résolvent en quelques jours — garder cet horizon en tête."
            ]}
        ]
    },

    {
        id: "premiers-gestes", categorieId: "secours", emoji: "🩹", titre: "Premiers gestes simples",
        illustration: "premiers-secours.png",
        sections: [
            { titre: "Rappel important", points: [
                "Cette fiche ne remplace pas une vraie formation aux premiers secours.",
                "En cas de doute ou de blessure grave, chercher de l'aide professionnelle dès que possible."
            ]},
            { titre: "Plaie superficielle", points: [
                "Nettoyer avec de l'eau propre si disponible.",
                "Bander en spirale du poignet vers le coude (ou de l'extrémité vers le centre), sans serrer excessivement.",
                "Surveiller les signes d'infection dans les jours suivants (rougeur qui s'étend, chaleur, écoulement)."
            ]},
            { titre: "Pour aller plus loin", points: [
                "Consulter les ressources officielles de la Croix-Rouge française pour une vraie formation aux gestes qui sauvent."
            ]}
        ]
    }

];

let vueActuelle = "categories";
let categorieActuelle = null;
let ficheActuelle = null;

export function initSurvie() {

    document.getElementById("btnSurvie").addEventListener("click", openSurvie);
    document.getElementById("closeSurvie").addEventListener("click", closeSurvie);

    document.getElementById("survieBackButton").addEventListener("click", () => {

        if (vueActuelle === "fiche") {
            vueActuelle = "fiches";
            renderSurvie();
        } else if (vueActuelle === "fiches") {
            vueActuelle = "categories";
            renderSurvie();
        }

    });

}

function openSurvie() {
    vueActuelle = "categories";
    renderSurvie();
    document.getElementById("survieModal").classList.remove("hidden");
}

function closeSurvie() {
    document.getElementById("survieModal").classList.add("hidden");
}

function renderSurvie() {

    const container = document.getElementById("survieContent");
    const backButton = document.getElementById("survieBackButton");
    const titleEl = document.getElementById("survieModalTitle");

    container.innerHTML = "";
    backButton.classList.toggle("hidden", vueActuelle === "categories");

    if (vueActuelle === "categories") {

        titleEl.textContent = "🌲 Survie & autonomie";

        const grid = document.createElement("div");
        grid.className = "survieCategorieGrid";

        CATEGORIES_SURVIE.forEach(cat => {

            const card = document.createElement("button");
            card.type = "button";
            card.className = "survieCategorieCard";
            card.innerHTML = `<span class="survieCategorieEmoji">${cat.emoji}</span><span>${cat.label}</span>`;

            card.addEventListener("click", () => {
                categorieActuelle = cat.id;
                vueActuelle = "fiches";
                renderSurvie();
            });

            grid.appendChild(card);

        });

        container.appendChild(grid);

    } else if (vueActuelle === "fiches") {

        const cat = CATEGORIES_SURVIE.find(c => c.id === categorieActuelle);
        titleEl.textContent = `${cat.emoji} ${cat.label}`;

        const fiches = FICHES_SURVIE.filter(f => f.categorieId === categorieActuelle);

        fiches.forEach(fiche => {

            const row = document.createElement("button");
            row.type = "button";
            row.className = "survieFicheRow";
            row.innerHTML = `<span>${fiche.emoji} ${fiche.titre}</span><span>›</span>`;

            row.addEventListener("click", () => {
                ficheActuelle = fiche.id;
                vueActuelle = "fiche";
                renderSurvie();
            });

            container.appendChild(row);

        });

    } else if (vueActuelle === "fiche") {

        const fiche = FICHES_SURVIE.find(f => f.id === ficheActuelle);
        titleEl.textContent = `${fiche.emoji} ${fiche.titre}`;

        if (fiche.illustration) {

            const img = document.createElement("img");
            img.src = `illustrations/survie/${fiche.illustration}`;
            img.className = "survieIllustration";
            img.onerror = () => { img.style.display = "none"; };

            container.appendChild(img);

        }

        fiche.sections.forEach(section => {

            const h3 = document.createElement("div");
            h3.className = "survieSectionTitre";
            h3.textContent = section.titre;
            container.appendChild(h3);

            const ul = document.createElement("ul");
            ul.className = "survieListe";

            section.points.forEach(point => {
                const li = document.createElement("li");
                li.textContent = point;
                ul.appendChild(li);
            });

            container.appendChild(ul);

        });

    }

}
