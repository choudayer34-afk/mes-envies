const JEUX = [
    { nom: "1, 2, 3 Soleil", description: "Un joueur tourne le dos et compte, les autres avancent ; il faut le toucher avant qu'il ne se retourne.", joueurs: "3+", age: "4+", materiel: "Aucun" },
    { nom: "Épervier", description: "Les joueurs traversent un terrain sans être touchés par l'épervier au milieu.", joueurs: "5+", age: "5+", materiel: "Aucun" },
    { nom: "Loup y es-tu ?", description: "Un joueur fait le loup et répond aux autres qui avancent en chantant, jusqu'à annoncer qu'il est prêt à les attraper.", joueurs: "3+", age: "4+", materiel: "Aucun" },
    { nom: "Chat perché", description: "Un chat doit attraper les autres, sauf s'ils sont sur un point en hauteur.", joueurs: "3+", age: "5+", materiel: "Aucun" },
    { nom: "Balle au prisonnier", description: "Deux équipes s'éliminent en touchant les adversaires avec un ballon.", joueurs: "6+", age: "6+", materiel: "Un ballon" },
    { nom: "Marelle", description: "Sauter à cloche-pied dans des cases numérotées tracées au sol.", joueurs: "1+", age: "4+", materiel: "Craie, un caillou" },
    { nom: "Corde à sauter", description: "Sauter seul ou à plusieurs en tournant la corde, avec des comptines rythmées.", joueurs: "1+", age: "4+", materiel: "Une corde" },
    { nom: "Colin-maillard", description: "Un joueur les yeux bandés doit attraper les autres en les reconnaissant au toucher.", joueurs: "4+", age: "5+", materiel: "Un bandeau/foulard" },
    { nom: "Poule renard vipère", description: "Trois équipes se pourchassent en cercle façon pierre-papier-ciseaux géant.", joueurs: "9+", age: "6+", materiel: "Aucun" },
    { nom: "Le drapeau", description: "Deux équipes tentent de ramener un objet posé au centre sans se faire toucher.", joueurs: "6+", age: "6+", materiel: "Un objet (foulard, bouteille)" },
    { nom: "Béret", description: "Numéroté, chaque joueur court chercher l'objet au centre quand son numéro est appelé.", joueurs: "6+", age: "6+", materiel: "Un objet" },
    { nom: "Jacques a dit", description: "N'exécuter les ordres que s'ils commencent par « Jacques a dit ».", joueurs: "2+", age: "4+", materiel: "Aucun" },
    { nom: "Jeu des statues", description: "Danser puis se figer instantanément dès l'arrêt de la musique ou du signal.", joueurs: "2+", age: "3+", materiel: "Aucun (musique en option)" },
    { nom: "Le facteur n'est pas passé", description: "Assis en cercle, un joueur tourne autour en désignant qui doit le pourchasser.", joueurs: "5+", age: "4+", materiel: "Aucun" },
    { nom: "Pierre-papier-ciseaux géant", description: "Version grandeur nature avec tout le corps, en équipes ou en duel.", joueurs: "2+", age: "5+", materiel: "Aucun" },
    { nom: "Cache-cache", description: "Un joueur compte pendant que les autres se cachent, puis part à leur recherche.", joueurs: "2+", age: "3+", materiel: "Aucun" },
    { nom: "Chasse au trésor improvisée", description: "Cacher quelques objets et donner des indices simples pour les retrouver.", joueurs: "1+", age: "4+", materiel: "Quelques objets à cacher" },
    { nom: "Jeu de piste maison", description: "Tracer un parcours avec des indices ou flèches au sol pour guider vers une destination.", joueurs: "2+", age: "5+", materiel: "Craie ou papiers" },
    { nom: "Saute-mouton", description: "Sauter par-dessus un joueur courbé, à la suite les uns des autres.", joueurs: "2+", age: "5+", materiel: "Aucun" },
    { nom: "Course à trois pattes", description: "Deux joueurs attachés par une jambe courent ensemble jusqu'à l'arrivée.", joueurs: "2+", age: "6+", materiel: "Un foulard/lien" },
    { nom: "Course en sac", description: "Sauter dans un sac jusqu'à la ligne d'arrivée.", joueurs: "1+", age: "5+", materiel: "Un sac" },
    { nom: "Ricochets", description: "Faire rebondir des cailloux plats sur l'eau le plus de fois possible.", joueurs: "1+", age: "5+", materiel: "Un point d'eau, des cailloux" },
    { nom: "Ni oui ni non", description: "Répondre aux questions d'un joueur sans jamais dire « oui » ou « non ».", joueurs: "2+", age: "6+", materiel: "Aucun" },
    { nom: "Le mouchoir", description: "Deux équipes numérotées ; le numéro appelé doit attraper le mouchoir avant l'adversaire.", joueurs: "6+", age: "6+", materiel: "Un mouchoir/foulard" },
    { nom: "Épingler la queue de l'âne", description: "Les yeux bandés, fixer la queue au bon endroit sur un dessin d'âne.", joueurs: "2+", age: "4+", materiel: "Papier, dessin, bandeau" },
    { nom: "Cerf-volant", description: "Faire voler un cerf-volant dans un espace dégagé et venteux.", joueurs: "1+", age: "4+", materiel: "Un cerf-volant" },
    { nom: "Loup-garou simplifié", description: "Version courte et sans carte : un « loup » désigné en secret doit deviner qui l'accuse.", joueurs: "5+", age: "7+", materiel: "Aucun" },
    { nom: "Balle assise", description: "Toucher les adversaires avec une balle roulée au sol pour les éliminer.", joueurs: "4+", age: "5+", materiel: "Une balle" },
    { nom: "Chamboule-tout maison", description: "Empiler des boîtes/gobelets et les renverser en lançant une balle.", joueurs: "1+", age: "4+", materiel: "Boîtes, une balle" },
    { nom: "Chaise musicale", description: "Tourner autour de chaises (une de moins que de joueurs) et s'asseoir dès l'arrêt de la musique.", joueurs: "3+", age: "4+", materiel: "Des chaises" }
];

let searchQuery = "";
let filtreMateriel = "tous";

export function initJeux() {

    document.getElementById("btnJeux").addEventListener("click", openJeux);
    document.getElementById("closeJeux").addEventListener("click", closeJeux);

    document.getElementById("jeuxSearchInput").addEventListener("input", (event) => {
        searchQuery = event.target.value.toLowerCase().trim();
        renderJeux();
    });

    document.querySelectorAll(".jeuxFiltreChip").forEach(chip => {

        chip.addEventListener("click", () => {

            filtreMateriel = chip.dataset.filtre;

            document.querySelectorAll(".jeuxFiltreChip")
                .forEach(c => c.classList.remove("active"));

            chip.classList.add("active");

            renderJeux();

        });

    });

}

function openJeux() {
    renderJeux();
    document.getElementById("jeuxModal").classList.remove("hidden");
}

function closeJeux() {
    document.getElementById("jeuxModal").classList.add("hidden");
}

function renderJeux() {

    const container = document.getElementById("jeuxList");
    container.innerHTML = "";

    const filtered = JEUX.filter(jeu => {

        const matchSearch = !searchQuery || jeu.nom.toLowerCase().includes(searchQuery) || jeu.description.toLowerCase().includes(searchQuery);
        const matchMateriel = filtreMateriel === "tous" || (filtreMateriel === "sans" && jeu.materiel.toLowerCase().startsWith("aucun"));

        return matchSearch && matchMateriel;

    });

    if (filtered.length === 0) {
        container.innerHTML = `<div class="emptyState">Aucun jeu trouvé.</div>`;
        return;
    }

    filtered.forEach(jeu => {

        const card = document.createElement("div");
        card.className = "jeuCard";

        card.innerHTML = `
            <div class="jeuNom">🎲 ${jeu.nom}</div>
            <div class="jeuDesc">${jeu.description}</div>
            <div class="jeuMeta">
                <span>👥 ${jeu.joueurs}</span>
                <span>🎈 ${jeu.age}</span>
                <span>🧰 ${jeu.materiel}</span>
            </div>
        `;

        container.appendChild(card);

    });

}
