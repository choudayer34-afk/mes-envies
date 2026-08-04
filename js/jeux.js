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
let modeActuel = "normal";

const JEUX_FILE_ATTENTE = [
    { nom: "20 questions", description: "Un joueur pense à un objet/personnage, les autres posent 20 questions fermées max pour deviner.", joueurs: "2+", age: "6+", materiel: "Aucun" },
    { nom: "Le comptage silencieux", description: "Compter à tour de rôle sans se concerter ; si deux personnes disent un nombre en même temps, on repart de zéro.", joueurs: "2+", age: "6+", materiel: "Aucun" },
    { nom: "Catégories rapides", description: "Donner un thème (fruits, pays...) et énumérer chacun un mot à tour de rôle sans répéter.", joueurs: "2+", age: "5+", materiel: "Aucun" },
    { nom: "Le jeu de l'alphabet", description: "Trouver un mot sur un thème donné en suivant l'ordre de l'alphabet, lettre après lettre.", joueurs: "2+", age: "6+", materiel: "Aucun" },
    { nom: "Ni oui ni non", description: "Répondre à des questions sans jamais dire « oui » ni « non » pendant tout le temps d'attente.", joueurs: "2+", age: "6+", materiel: "Aucun" },
    { nom: "Le mot mystère", description: "Un joueur pense à un mot, donne sa première lettre, les autres proposent jusqu'à trouver.", joueurs: "2+", age: "5+", materiel: "Aucun" },
    { nom: "Pierre-papier-ciseaux en série", description: "Enchaîner des manches rapides, le premier à 5 victoires gagne.", joueurs: "2", age: "4+", materiel: "Aucun" },
    { nom: "Le jeu des différences", description: "Observer deux personnes autour de vous puis fermer les yeux et citer une différence entre elles.", joueurs: "2+", age: "6+", materiel: "Aucun" },
    { nom: "Le compte est bon (mini)", description: "Donner 3 petits nombres, trouver une opération qui donne un résultat cible.", joueurs: "1+", age: "8+", materiel: "Aucun" },
    { nom: "Le jeu du prénom", description: "Trouver un adjectif sympa commençant par chaque lettre de son prénom.", joueurs: "1+", age: "5+", materiel: "Aucun" },
    { nom: "Les gestes secrets", description: "Un joueur invente une suite de 3 gestes, les autres doivent la reproduire de mémoire.", joueurs: "2+", age: "5+", materiel: "Aucun" },
    { nom: "Le jeu des sons", description: "Fermer les yeux et lister tous les sons qu'on entend autour de la file.", joueurs: "1+", age: "4+", materiel: "Aucun" },
    { nom: "La chanson à trous", description: "Chanter une chanson connue en s'arrêtant sur un mot que les autres doivent compléter.", joueurs: "2+", age: "4+", materiel: "Aucun" },
    { nom: "Le jeu du miroir immobile", description: "Un joueur fait une pose, l'autre doit la copier exactement sans bouger ensuite.", joueurs: "2", age: "4+", materiel: "Aucun" },
    { nom: "Qui suis-je ?", description: "Un joueur pense à un personnage Disney, les autres posent des questions oui/non pour deviner.", joueurs: "2+", age: "5+", materiel: "Aucun" },
    { nom: "Le jeu des rimes", description: "Trouver le plus de mots possible qui riment avec un mot donné.", joueurs: "1+", age: "5+", materiel: "Aucun" },
    { nom: "Compter les couleurs", description: "Repérer et compter combien de fois une couleur donnée apparaît autour de vous.", joueurs: "1+", age: "3+", materiel: "Aucun" },
    { nom: "Le jeu des initiales", description: "Trouver un prénom et un métier qui commencent par la même lettre.", joueurs: "1+", age: "6+", materiel: "Aucun" },
    { nom: "L'histoire à deux voix", description: "Inventer une histoire en alternant une phrase chacun, sans se concerter à l'avance.", joueurs: "2+", age: "5+", materiel: "Aucun" },
    { nom: "Le jeu du portrait", description: "Décrire une personne dans la file sans la nommer, les autres doivent deviner qui c'est.", joueurs: "2+", age: "6+", materiel: "Aucun" },
    { nom: "Le calcul mental éclair", description: "Se donner des petits calculs à résoudre le plus vite possible.", joueurs: "1+", age: "7+", materiel: "Aucun" },
    { nom: "Le jeu du acronyme", description: "Choisir 3 lettres au hasard et inventer une phrase où chaque mot commence par ces lettres.", joueurs: "1+", age: "7+", materiel: "Aucun" },
    { nom: "Ni cette ni cette", description: "Le meneur pointe un objet, les autres doivent le décrire sans utiliser certains mots interdits.", joueurs: "2+", age: "6+", materiel: "Aucun" },
    { nom: "Le jeu des expressions", description: "Trouver le plus d'expressions possible contenant un mot donné (ex. « chat »).", joueurs: "1+", age: "8+", materiel: "Aucun" },
    { nom: "Le compte à rebours créatif", description: "Trouver un mot pour chaque chiffre en comptant à rebours depuis 10.", joueurs: "1+", age: "6+", materiel: "Aucun" },
    { nom: "Le jeu des towers", description: "Observer une attraction ou un décor et compter des détails précis (fenêtres, drapeaux...).", joueurs: "1+", age: "4+", materiel: "Aucun" },
    { nom: "Le vrai ou faux", description: "Chacun affirme 3 choses sur soi, une est fausse, les autres doivent deviner laquelle.", joueurs: "2+", age: "6+", materiel: "Aucun" },
    { nom: "Le jeu du superlatif", description: "Désigner ensemble « le plus » de quelque chose observé autour (le plus grand chapeau, la couleur la plus vue...).", joueurs: "2+", age: "5+", materiel: "Aucun" },
    { nom: "La suite de Fibonacci simplifiée", description: "Continuer une suite de nombres où chaque terme est la somme des deux précédents.", joueurs: "1+", age: "9+", materiel: "Aucun" },
    { nom: "Le jeu du silence chronométré", description: "Rester silencieux le plus longtemps possible ; celui qui parle en premier doit faire un petit gage.", joueurs: "2+", age: "4+", materiel: "Aucun" },
        { nom: "Le jeu du ni-ni-ni", description: "Interdit de dire trois mots précis pendant tout le temps d'attente, sous peine de gage.", joueurs: "2+", age: "6+", materiel: "Aucun" },
    { nom: "La bataille des accents", description: "Raconter une phrase en imitant un accent différent à chaque tour.", joueurs: "2+", age: "6+", materiel: "Aucun" },
    { nom: "Le jeu du pays mystère", description: "Un joueur pense à un pays, les autres posent des questions oui/non pour le deviner.", joueurs: "2+", age: "7+", materiel: "Aucun" },
    { nom: "L'animal mystère", description: "Même principe que le pays mystère, mais avec un animal à deviner.", joueurs: "2+", age: "5+", materiel: "Aucun" },
    { nom: "Le jeu du personnage Disney", description: "Décrire un personnage Disney par ses traits sans le nommer, les autres devinent.", joueurs: "2+", age: "4+", materiel: "Aucun" },
    { nom: "Chante le générique", description: "Chanter ou fredonner le générique d'un dessin animé, les autres devinent lequel.", joueurs: "2+", age: "4+", materiel: "Aucun" },
    { nom: "Le jeu des 5 sens", description: "Décrire ce qu'on ressent (odeurs, sons, textures) sans utiliser la vue.", joueurs: "1+", age: "5+", materiel: "Aucun" },
    { nom: "La phrase la plus longue", description: "Construire à tour de rôle une phrase en ajoutant chacun un mot, sans qu'elle n'ait plus de sens.", joueurs: "2+", age: "6+", materiel: "Aucun" },
    { nom: "Le jeu du contraire", description: "Le meneur dit un mot, l'autre doit répondre son contraire le plus vite possible.", joueurs: "2+", age: "5+", materiel: "Aucun" },
    { nom: "Les private jokes de famille", description: "Chacun raconte son souvenir préféré de la journée passée à Disney.", joueurs: "2+", age: "4+", materiel: "Aucun" },
    { nom: "Le jeu du menteur", description: "Raconter une anecdote vraie ou fausse, les autres doivent deviner si c'est vrai.", joueurs: "2+", age: "7+", materiel: "Aucun" },
    { nom: "Compter les personnages costumés", description: "Repérer et compter le nombre de personnages ou costumes visibles autour de vous.", joueurs: "1+", age: "3+", materiel: "Aucun" },
    { nom: "Le jeu du drapeau", description: "Repérer les nationalités des visiteurs autour grâce aux langues entendues ou vêtements.", joueurs: "1+", age: "6+", materiel: "Aucun" },
    { nom: "La bataille de blagues", description: "Chacun raconte sa meilleure blague, celle qui fait le plus rire gagne un point.", joueurs: "2+", age: "5+", materiel: "Aucun" },
    { nom: "Le jeu du karaoké silencieux", description: "Mimer les paroles d'une chanson sans émettre de son, les autres devinent le titre.", joueurs: "2+", age: "5+", materiel: "Aucun" },
    { nom: "Invente une attraction", description: "Imaginer et décrire une nouvelle attraction Disney complètement inventée.", joueurs: "1+", age: "5+", materiel: "Aucun" },
    { nom: "Le jeu du souvenir parfait", description: "Décrire le souvenir qu'on aimerait garder de ce voyage en un seul mot chacun.", joueurs: "2+", age: "6+", materiel: "Aucun" },
    { nom: "La conjugaison rigolote", description: "Conjuguer un verbe inventé à tous les temps, le plus drôle possible.", joueurs: "2+", age: "8+", materiel: "Aucun" },
    { nom: "Le jeu des synonymes", description: "Trouver le plus de synonymes possible pour un mot donné en 30 secondes.", joueurs: "1+", age: "8+", materiel: "Aucun" },
    { nom: "Combien de temps encore ?", description: "Chacun estime le temps d'attente restant, celui qui se rapproche le plus gagne.", joueurs: "2+", age: "5+", materiel: "Aucun" },
    { nom: "Le jeu du prénom royal", description: "Inventer un nom de prince/princesse à partir de son propre prénom.", joueurs: "1+", age: "4+", materiel: "Aucun" },
    { nom: "Le jeu des 3 vœux", description: "Chacun partage les 3 vœux qu'il ferait s'il rencontrait une fée.", joueurs: "2+", age: "4+", materiel: "Aucun" },
    { nom: "Le jeu du splash", description: "Deviner quelle attraction chaque personne de la famille préfère et pourquoi.", joueurs: "2+", age: "4+", materiel: "Aucun" },
    { nom: "Le jeu des mots à l'envers", description: "Dire son prénom ou un mot simple à l'envers, lettre par lettre.", joueurs: "1+", age: "7+", materiel: "Aucun" },
    { nom: "Le jeu du calcul de manège", description: "Calculer combien de tours un manège doit faire pour occuper x minutes.", joueurs: "1+", age: "8+", materiel: "Aucun" },
    { nom: "Devine mon dessin animé", description: "Décrire l'intrigue d'un dessin animé sans le nommer, les autres devinent.", joueurs: "2+", age: "5+", materiel: "Aucun" },
    { nom: "Le jeu du première lettre", description: "Trouver un objet visible dont le nom commence par une lettre donnée.", joueurs: "1+", age: "4+", materiel: "Aucun" },
    { nom: "Le jeu de l'improvisation", description: "Improviser une courte scène avec un thème donné par les autres.", joueurs: "2+", age: "7+", materiel: "Aucun" },
    { nom: "Le jeu du sosie", description: "Repérer une personne dans la file qui ressemble à quelqu'un de connu.", joueurs: "1+", age: "6+", materiel: "Aucun" },
    { nom: "Le compte des paires", description: "Compter le nombre de couples/duos qui passent devant vous en 2 minutes.", joueurs: "1+", age: "5+", materiel: "Aucun" },
    { nom: "Le jeu des super-pouvoirs", description: "Choisir un super-pouvoir et expliquer comment on l'utiliserait à Disney.", joueurs: "1+", age: "4+", materiel: "Aucun" },
    { nom: "Le jeu du chef cuisinier", description: "Inventer une recette improbable avec des ingrédients Disney imaginaires.", joueurs: "1+", age: "5+", materiel: "Aucun" },
    { nom: "Le jeu des probabilités", description: "Deviner qui, dans le groupe, va monter en premier dans l'attraction sans être malade.", joueurs: "2+", age: "6+", materiel: "Aucun" },
    { nom: "Le jeu du chiffre porte-bonheur", description: "Chacun choisit un chiffre et compte combien de fois il apparaît autour en 1 minute.", joueurs: "1+", age: "5+", materiel: "Aucun" },
    { nom: "Raconte ta journée en 3 mots", description: "Résumer la journée en exactement 3 mots, à tour de rôle.", joueurs: "2+", age: "5+", materiel: "Aucun" },
    { nom: "Le jeu du portrait chinois Disney", description: "« Si j'étais un personnage Disney, je serais... » et pourquoi.", joueurs: "1+", age: "5+", materiel: "Aucun" },
    { nom: "Le jeu de la météo intérieure", description: "Décrire son humeur du moment comme un bulletin météo (« ensoleillé avec un peu de fatigue »).", joueurs: "1+", age: "5+", materiel: "Aucun" },
    { nom: "Le jeu du plan parfait", description: "Imaginer la journée de rêve à Disney si tout était permis, sans contrainte de temps ni budget.", joueurs: "1+", age: "5+", materiel: "Aucun" },
    { nom: "Le jeu du détective de file", description: "Observer discrètement une personne et deviner son métier ou sa passion.", joueurs: "1+", age: "7+", materiel: "Aucun" },
    { nom: "Le jeu desémotions", description: "Mimer une émotion sans un mot, les autres doivent la deviner.", joueurs: "2+", age: "4+", materiel: "Aucun" },
    { nom: "Le jeu du calcul d'attente cumulée", description: "Additionner mentalement les temps d'attente déjà vécus dans la journée.", joueurs: "1+", age: "8+", materiel: "Aucun" },
    { nom: "Le jeu du roi/reine d'un jour", description: "Décrire ce qu'on ferait si on était roi ou reine du parc pour une journée.", joueurs: "1+", age: "4+", materiel: "Aucun" },
    { nom: "Le jeu des expressions inventées", description: "Créer une nouvelle expression rigolote et l'expliquer aux autres.", joueurs: "1+", age: "6+", materiel: "Aucun" },
    { nom: "Le jeu du plus proche souvenir d'enfance", description: "Partager un souvenir d'enfance qui ressemble à ce qu'on vit maintenant.", joueurs: "2+", age: "8+", materiel: "Aucun" },
    { nom: "Le jeu de la dernière lettre", description: "Le mot suivant doit commencer par la dernière lettre du mot précédent, sur un thème donné.", joueurs: "2+", age: "6+", materiel: "Aucun" }

];

let searchQuery = "";
let filtreMateriel = "tous";

export function initJeux() {

    document.getElementById("btnJeux").addEventListener("click", openJeux);
    document.getElementById("closeJeux").addEventListener("click", closeJeux);
    document.getElementById("jeuxRandomButton").addEventListener("click", tirerJeuAleatoire);
    document.getElementById("btnJeuxFile").addEventListener("click", openJeuxFileAttente);

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

export function openJeuxFileAttente() {
    modeActuel = "file";
    renderJeux();
    document.getElementById("jeuxModal").classList.remove("hidden");
}

function openJeux() {
    modeActuel = "normal";
    renderJeux();
    document.getElementById("jeuxModal").classList.remove("hidden");
}


function closeJeux() {
    document.getElementById("jeuxModal").classList.add("hidden");
}

function renderJeux() {

    const titre = document.getElementById("jeuxModalTitle");
    if (titre) {
        titre.textContent = modeActuel === "file" ? "⏳ Jeux en file d'attente" : "🎲 Jeux avec les enfants";
    }

    const container = document.getElementById("jeuxList");
    
    container.innerHTML = "";

     const filtered = getListeActuelle().filter(jeu => {


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
function getListeActuelle() {
    return modeActuel === "file" ? JEUX_FILE_ATTENTE : JEUX;
}

function tirerJeuAleatoire() {

       const pool = getListeActuelle().filter(jeu => {

        return filtreMateriel === "tous" || (filtreMateriel === "sans" && jeu.materiel.toLowerCase().startsWith("aucun"));
    });

    if (pool.length === 0)
        return;

    const jeu = pool[Math.floor(Math.random() * pool.length)];

    document.getElementById("jeuxSearchInput").value = "";
    searchQuery = "";

    const container = document.getElementById("jeuxList");
    container.innerHTML = "";

    const card = document.createElement("div");
    card.className = "jeuCard jeuCardHighlight";

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

    const relanceButton = document.createElement("button");
    relanceButton.className = "secondaryButton";
    relanceButton.textContent = "🎲 Un autre !";
    relanceButton.style.width = "100%";
    relanceButton.style.marginTop = "10px";

    relanceButton.addEventListener("click", tirerJeuAleatoire);

    container.appendChild(relanceButton);

    const retourButton = document.createElement("button");
    retourButton.className = "secondaryButton";
    retourButton.textContent = "← Voir la liste complète";
    retourButton.style.width = "100%";
    retourButton.style.marginTop = "8px";

    retourButton.addEventListener("click", renderJeux);

    container.appendChild(retourButton);

}
