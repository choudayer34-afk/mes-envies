const JEUX = [
        { nom: "Le juke-box humain", description: "Chacun chante ou fredonne un morceau à tour de rôle, les autres devinent le titre.", joueurs: "2+", age: "5+", materiel: "Aucun" },
    { nom: "Portrait chinois", description: "Décrire quelqu'un via des comparaisons (« si j'étais un animal... ») pour le faire deviner.", joueurs: "2+", age: "6+", materiel: "Aucun" },
    { nom: "Ni oui ni non chronométré", description: "Poser des questions pièges pendant une minute sans faire dire oui ou non à l'adversaire.", joueurs: "2+", age: "6+", materiel: "Aucun" },
    { nom: "Le pays imaginaire", description: "Inventer à tour de rôle un détail d'un pays fictif (paysage, habitants, lois...).", joueurs: "2+", age: "5+", materiel: "Aucun" },
    { nom: "Ni vu ni connu", description: "Un objet doit être caché à la vue de tous puis retrouvé par les autres.", joueurs: "2+", age: "4+", materiel: "Un petit objet" },
    { nom: "Le morpion géant", description: "Tracer une grille au sol et jouer au morpion avec des cailloux/bâtons comme pions.", joueurs: "2", age: "5+", materiel: "Craie, cailloux" },
    { nom: "La marelle des couleurs", description: "Variante de la marelle où chaque case a une couleur à annoncer en sautant.", joueurs: "1+", age: "4+", materiel: "Craie" },
    { nom: "Le memory nature", description: "Ramasser des paires d'objets naturels identiques (feuilles, cailloux) puis les faire deviner les yeux fermés.", joueurs: "1+", age: "4+", materiel: "Éléments naturels" },
    { nom: "La course aux petits pas", description: "Avancer par petits pas successifs sans que le meneur ne vous voie bouger.", joueurs: "3+", age: "5+", materiel: "Aucun" },
    { nom: "Le roi du silence", description: "Rester immobile et silencieux le plus longtemps possible ; le premier qui bouge ou parle perd.", joueurs: "2+", age: "4+", materiel: "Aucun" },
    { nom: "La grenouille dans la mare", description: "Sauter d'un cercle tracé au sol à un autre sans jamais tomber « à l'eau ».", joueurs: "1+", age: "4+", materiel: "Craie" },
    { nom: "Le funambule", description: "Marcher en équilibre sur une ligne tracée ou une corde posée au sol.", joueurs: "1+", age: "4+", materiel: "Une corde ou craie" },
    { nom: "Chasse aux couleurs", description: "Repérer le plus vite possible des objets d'une couleur donnée dans l'environnement.", joueurs: "1+", age: "3+", materiel: "Aucun" },
    { nom: "Le détective", description: "Un joueur observe une scène puis se retourne ; il doit dire ce qui a changé.", joueurs: "2+", age: "5+", materiel: "Quelques objets" },
    { nom: "Le loto des sons", description: "Fermer les yeux et deviner d'où viennent les bruits environnants.", joueurs: "1+", age: "4+", materiel: "Aucun" },
    { nom: "La bataille de pouces", description: "Chacun essaie de plaquer le pouce de l'autre en un duel rapide.", joueurs: "2", age: "5+", materiel: "Aucun" },
    { nom: "Le concours de grimaces", description: "Faire la grimace la plus drôle sans rire soi-même.", joueurs: "2+", age: "4+", materiel: "Aucun" },
    { nom: "Le mime des animaux", description: "Mimer un animal sans parler, les autres doivent le deviner.", joueurs: "2+", age: "4+", materiel: "Aucun" },
    { nom: "Le petit poucet", description: "Semer discrètement des petits objets sur un parcours pour qu'un autre les retrouve ensuite.", joueurs: "2+", age: "5+", materiel: "Petits objets" },
    { nom: "La course à cloche-pied", description: "Course simple où il faut avancer uniquement sur un pied jusqu'à l'arrivée.", joueurs: "1+", age: "4+", materiel: "Aucun" },
    { nom: "Le relais du bouchon", description: "Faire passer un petit objet de main en main le plus vite possible sans le faire tomber.", joueurs: "4+", age: "5+", materiel: "Un petit objet" },
    { nom: "Le land art", description: "Créer une composition artistique avec des éléments naturels trouvés sur place.", joueurs: "1+", age: "3+", materiel: "Éléments naturels" },
    { nom: "La chasse aux petites bêtes", description: "Observer et recenser discrètement les insectes croisés sur le chemin.", joueurs: "1+", age: "4+", materiel: "Aucun (loupe en option)" },
    { nom: "Le jeu des ombres", description: "Créer des formes avec son ombre ou celle d'un objet et faire deviner ce que ça représente.", joueurs: "2+", age: "4+", materiel: "Aucun" },
    { nom: "Le calcul du chef", description: "Le meneur donne un calcul simple à voix haute, le premier à répondre juste marque un point.", joueurs: "2+", age: "6+", materiel: "Aucun" },
    { nom: "Le ni-ni des gestes", description: "Interdiction de dire un mot précis (ex. « oui ») pendant tout le trajet, sous peine de gage.", joueurs: "2+", age: "6+", materiel: "Aucun" },
    { nom: "Le jeu de la plaque", description: "En voiture, repérer des lettres ou numéros de plaques d'immatriculation dans l'ordre alphabétique.", joueurs: "1+", age: "6+", materiel: "Aucun" },
    { nom: "Ni tout blanc ni tout noir", description: "Trouver le plus d'objets possible d'une couleur donnée en regardant par la fenêtre de la voiture.", joueurs: "1+", age: "4+", materiel: "Aucun" },
    { nom: "Le jeu des devinettes", description: "Poser des devinettes simples à tour de rôle et tenter de les résoudre.", joueurs: "2+", age: "5+", materiel: "Aucun" },
    { nom: "La ronde des prénoms", description: "Trouver un mot commençant par chaque lettre du prénom d'un joueur.", joueurs: "2+", age: "5+", materiel: "Aucun" },
    { nom: "Le petit chanteur", description: "Chanter une chanson en remplaçant un mot précis par un son ou un geste convenu.", joueurs: "2+", age: "5+", materiel: "Aucun" },
    { nom: "Le jeu du dictionnaire", description: "Un joueur invente une fausse définition d'un mot rare, les autres doivent deviner s'il dit vrai.", joueurs: "3+", age: "8+", materiel: "Aucun" },
    { nom: "Ni assis ni debout", description: "Rester en équilibre sur un pied le plus longtemps possible.", joueurs: "1+", age: "4+", materiel: "Aucun" },
    { nom: "Le parcours d'obstacles improvisé", description: "Utiliser des éléments naturels (troncs, pierres) comme un parcours à franchir.", joueurs: "1+", age: "4+", materiel: "Aucun" },
    { nom: "La bataille d'eau", description: "S'asperger avec des pistolets à eau ou simplement les mains, dans un cadre autorisé.", joueurs: "2+", age: "4+", materiel: "Eau, pistolets à eau (optionnel)" },
    { nom: "Le château de sable", description: "Construire ensemble un château ou une sculpture de sable sur la plage.", joueurs: "1+", age: "3+", materiel: "Sable, seau, pelle" },
    { nom: "La pêche aux trésors", description: "Chercher des coquillages ou galets particuliers le long du rivage.", joueurs: "1+", age: "3+", materiel: "Aucun" },
    { nom: "Le relais de plage", description: "Course à relais dans le sable, éventuellement avec un objet à transporter.", joueurs: "4+", age: "5+", materiel: "Aucun" },
    { nom: "Le beach-volley improvisé", description: "Renvoyer un ballon par-dessus une ligne tracée dans le sable.", joueurs: "2+", age: "6+", materiel: "Un ballon" },
    { nom: "Le concours de saut en longueur", description: "Sauter le plus loin possible depuis une ligne de départ tracée dans le sable ou au sol.", joueurs: "1+", age: "4+", materiel: "Aucun" },
    { nom: "La ronde chantée", description: "Se tenir la main en cercle et chanter une comptine avec des gestes associés.", joueurs: "3+", age: "3+", materiel: "Aucun" },
    { nom: "Le jeu du fil rouge", description: "Inventer une histoire à plusieurs, chacun ajoutant une phrase à la suite de l'autre.", joueurs: "2+", age: "5+", materiel: "Aucun" },
    { nom: "Le mot le plus long", description: "Trouver à tour de rôle le mot le plus long possible sur un thème donné.", joueurs: "2+", age: "6+", materiel: "Aucun" },
    { nom: "Le jeu des sept familles improvisé", description: "Créer oralement des familles de mots par catégorie (fruits, animaux...) à tour de rôle.", joueurs: "2+", age: "5+", materiel: "Aucun" },
    { nom: "Le petit architecte", description: "Construire la plus haute tour possible avec des cailloux, brindilles ou objets trouvés.", joueurs: "1+", age: "3+", materiel: "Éléments naturels" },
    { nom: "Le jeu du miroir", description: "Un joueur fait des gestes que l'autre doit reproduire comme un reflet.", joueurs: "2", age: "4+", materiel: "Aucun" },
    { nom: "La suite logique", description: "Continuer une suite de gestes ou de sons initiée par le joueur précédent, en y ajoutant le sien.", joueurs: "2+", age: "5+", materiel: "Aucun" },
    { nom: "Le jeu des empreintes", description: "Observer et deviner à qui appartiennent des traces ou empreintes trouvées sur le chemin.", joueurs: "1+", age: "4+", materiel: "Aucun" },
    { nom: "La cueillette sensorielle", description: "Ramasser des éléments naturels différents et décrire leur texture les yeux fermés.", joueurs: "1+", age: "3+", materiel: "Éléments naturels" },
    { nom: "Le jeu du chef d'orchestre", description: "Un joueur désigné secrètement dirige des gestes que tous imitent, un autre doit le devinerz.", joueurs: "4+", age: "6+", materiel: "Aucun" },
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
    document.getElementById("jeuxRandomButton").addEventListener("click", tirerJeuAleatoire);

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
