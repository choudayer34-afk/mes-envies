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
    { id: "secours", emoji: "🩹", label: "Premiers secours" },
        { id: "deplacement", emoji: "🧗", label: "Déplacement & obstacles" },
    { id: "danger", emoji: "🐍", label: "Animaux & dangers" },
    { id: "preparation", emoji: "🎒", label: "Préparation" },

];

const FICHES_SURVIE = [

    {
        id: "methode-stop", categorieId: "priorites", emoji: "🛑", titre: "Méthode S.T.O.P.",
        illustration: "priorites-immediates.png",
        sections: [
                        { titre: "La règle des 3 — à retenir avant tout", points: [
                "3 secondes : c'est le temps que dure une inattention qui peut suffire à provoquer un accident — rester vigilant en permanence sur un terrain incertain.",
                "3 minutes : durée maximale sans respirer avant que le cerveau ne soit sérieusement affecté — l'urgence absolue en cas d'étouffement ou de noyade.",
                "3 heures : durée critique sans abri par grand froid, pluie battante ou vent fort — l'abri devient alors la priorité numéro 1.",
                "3 jours : durée maximale raisonnable sans eau avant que les fonctions vitales ne soient sérieusement affectées.",
                "3 semaines : durée avant que le manque de nourriture devienne vraiment critique physiquement.",
                "3 mois : durée au-delà de laquelle l'absence de contact social et d'hygiène de base commence à peser lourdement sur le moral et la santé.",
                "3 ans : durée au-delà de laquelle l'absence d'un objectif ou d'un projet clair peut éroder durablement la motivation et le sens donné à la situation (repère de moral à long terme, pas une donnée physiologique)."
            ]},

            { titre: "Les 4 étapes concrètes de la méthode S.T.O.P.", points: [
                "1. S — S'arrêter physiquement : cesser immédiatement de marcher ou d'agir, poser son sac, s'asseoir si possible.",
                "2. T — Réfléchir (Think) : se demander à voix haute quelle heure il est, depuis quand on est dans cette situation, et quelles ressources on a sur soi.",
                "3. O — Observer : regarder autour à 360°, repérer un point d'eau, du bois sec, un abri naturel, et le sens du vent.",
                "4. P — Planifier : choisir une seule action prioritaire à réaliser dans les 30 prochaines minutes, et s'y consacrer entièrement avant de passer à la suivante."
            ]}
        ]
    },

    {
        id: "construire-abri", categorieId: "abri", emoji: "🏠", titre: "Construire un abri simple",
        illustration: "abri.png",
        sections: [
            { titre: "Étape 1 — Choisir l'emplacement", points: [
                "1. Repérer un terrain légèrement en pente, jamais un creux où l'eau de pluie pourrait s'accumuler.",
                "2. Vérifier l'absence de branches mortes ou instables au-dessus de l'emplacement choisi (risque de chute).",
                "3. Positionner l'ouverture de l'abri à l'opposé du vent dominant, en observant la direction du vent sur les feuilles ou fumées avant de construire.",
                "4. Vérifier la proximité d'une source d'eau et de bois mort sans être à plus de quelques minutes de marche."
            ]},
            { titre: "Étape 2 — Monter l'armature", points: [
                "1. Trouver une branche solide et droite d'environ 2 à 3 mètres pour servir de poutre maîtresse.",
                "2. Appuyer une extrémité de cette poutre en diagonale contre un tronc d'arbre ou une branche basse, à une hauteur d'environ 1,20 m.",
                "3. Laisser l'autre extrémité reposer au sol, formant un angle d'environ 45°.",
                "4. Vérifier la stabilité en appuyant fermement sur la poutre — elle ne doit pas glisser latéralement."
            ]},
            { titre: "Étape 3 — Ajouter la structure secondaire", points: [
                "1. Poser des branches plus fines côte à côte, perpendiculairement à la poutre maîtresse, espacées d'environ 15 à 20 cm.",
                "2. Faire en sorte que chaque branche dépasse légèrement des deux côtés pour la stabilité.",
                "3. Ajouter une seconde couche de branches encore plus fines, en diagonale par rapport à la première couche, pour créer un quadrillage serré."
            ]},
            { titre: "Étape 4 — Isoler et recouvrir", points: [
                "1. Commencer par le bas de la pente du toit et empiler des feuilles, fougères ou mousse par poignées.",
                "2. Progresser vers le haut en superposant chaque nouvelle couche sur un tiers de la précédente, comme des tuiles, pour que l'eau s'écoule vers l'extérieur.",
                "3. Répéter l'opération jusqu'à obtenir une épaisseur d'au moins 30 cm de végétation — une couche fine laisse passer l'eau et le froid.",
                "4. Isoler impérativement le sol à l'intérieur de l'abri avec une couche de branchages secs et feuilles avant de s'y allonger : la perte de chaleur par le sol est la plus rapide et la plus dangereuse."
            ]}
        ]
    },

    {
        id: "trouver-purifier-eau", categorieId: "eau", emoji: "💧", titre: "Trouver et purifier l'eau",
        illustration: "eau.png",
        sections: [
            { titre: "Où chercher de l'eau", points: [
                "1. Privilégier un cours d'eau qui coule visiblement plutôt qu'une mare stagnante.",
                "2. Suivre la végétation dense et verte dans un vallon, souvent signe d'humidité proche même sans eau visible.",
                "3. Le matin tôt, passer un tissu propre sur l'herbe couverte de rosée puis l'essorer dans un récipient — cette méthode peut fournir plusieurs centaines de millilitres en zone humide.",
                "4. En zone rocheuse, chercher les points bas où l'eau de pluie a pu s'accumuler dans une cavité à l'ombre."
            ]},
            { titre: "Étape 1 — Filtrer grossièrement", points: [
                "1. Tendre un tissu propre (t-shirt, mouchoir) au-dessus d'un récipient vide, en formant une légère poche avec le centre.",
                "2. Verser l'eau trouble lentement à travers le tissu.",
                "3. Recommencer l'opération 2 à 3 fois si l'eau reste très chargée en particules, en utilisant chaque fois une zone propre du tissu."
            ]},
            { titre: "Étape 2 — Rendre l'eau potable", points: [
                "1. Porter l'eau filtrée à ébullition franche (grosses bulles continues), pas seulement un frémissement.",
                "2. Maintenir cette ébullition pendant au moins 1 minute complète (3 minutes en altitude au-dessus de 2000 m).",
                "3. Laisser refroidir avant de boire pour éviter les brûlures.",
                "4. Sans possibilité de feu : utiliser des pastilles de purification chimique en respectant strictement le temps d'attente indiqué sur l'emballage.",
                "Règle absolue : ne jamais boire une eau non traitée, même si elle paraît parfaitement claire — les micro-organismes ne sont pas visibles à l'œil nu."
            ]}
        ]
    },

    {
        id: "allumer-feu", categorieId: "feu", emoji: "🔥", titre: "Allumer et entretenir un feu",
        illustration: "feu.png",
        sections: [
            { titre: "Étape 1 — Préparer le combustible", points: [
                "1. Rassembler 3 catégories de bois avant de commencer : brindilles fines comme des allumettes (l'amadou), branches de la taille d'un doigt, puis bûches plus épaisses.",
                "2. Prévoir au moins deux fois plus de petit bois que ce qui semble nécessaire — c'est l'étape la plus souvent sous-estimée.",
                "3. Si le bois est humide, fendre les branches pour exposer le bois sec de l'intérieur."
            ]},
            { titre: "Étape 2 — Préparer l'emplacement", points: [
                "1. Choisir un sol dégagé, sans végétation sèche ni racines à fleur de sol dans un rayon de 1,5 mètre.",
                "2. Dégager la terre jusqu'au sol minéral si possible, ou disposer un lit de pierres plates.",
                "3. Disposer 3 pierres en triangle pour délimiter le foyer et servir de futur support de récipient."
            ]},
            { titre: "Étape 3 — Construire et allumer", points: [
                "1. Former un petit tas conique avec les brindilles les plus fines au centre du foyer.",
                "2. Approcher la flamme ou l'étincelle à la base du tas, jamais au sommet.",
                "3. Une fois la flamme prise sur les brindilles fines, ajouter progressivement des branches de taille moyenne en les disposant en tipi autour de la flamme.",
                "4. Attendre que ces branches moyennes soient bien enflammées avant d'ajouter du bois plus épais."
            ]},
            { titre: "Étape 4 — Entretenir et éteindre", points: [
                "1. Nourrir le feu du plus fin au plus épais, jamais l'inverse — un gros morceau posé trop tôt étouffe la flamme naissante.",
                "2. Garder toujours une réserve de petit bois sec à portée de main pour relancer si le feu faiblit.",
                "3. Pour éteindre complètement : arroser abondamment, remuer les cendres, arroser une seconde fois, et vérifier qu'aucune braise ne reste chaude au toucher (avec précaution) avant de partir."
            ]}
        ]
    },

    {
        id: "proteger-soleil-froid", categorieId: "protection", emoji: "☀️", titre: "Se protéger du soleil et du froid",
        illustration: "protection.png",
        sections: [
            { titre: "Créer de l'ombre — étapes", points: [
                "1. Planter un premier bâton fin et droit verticalement dans le sol.",
                "2. Planter un second bâton identique à environ 1,5 mètre de distance.",
                "3. Tendre un tissu, une bâche ou un vêtement entre les deux bâtons, en l'attachant à chaque extrémité.",
                "4. Ajuster l'inclinaison du tissu pour qu'il projette une ombre nette au sol à l'heure la plus chaude de la journée."
            ]},
            { titre: "Se protéger du soleil — bons réflexes", points: [
                "Couvrir la peau plutôt que la découvrir : un vêtement ample en tissu léger protège mieux qu'une exposition directe.",
                "Boire par petites quantités régulières tout au long de la journée, même sans sensation de soif marquée.",
                "Se reposer à l'ombre pendant les heures les plus chaudes plutôt que de forcer un déplacement."
            ]},
            { titre: "Se protéger du froid — étapes", points: [
                "1. Isoler systématiquement le sol avant de chercher à se couvrir par-dessus — s'asseoir ou s'allonger sur des branchages secs, jamais directement sur la terre ou la pierre froide.",
                "2. Superposer plusieurs couches de vêtements fines plutôt qu'une seule épaisse — l'air emprisonné entre les couches isole mieux.",
                "3. Couvrir la tête et le cou, zones de perte de chaleur importante.",
                "4. Surveiller l'apparition de tremblements incontrôlés, confusion ou perte de coordination — signes d'hypothermie nécessitant de trouver de la chaleur immédiatement (feu, abri, contact corporel)."
            ]}
        ]
    },

    {
        id: "orientation-sans-gps", categorieId: "orientation", emoji: "🧭", titre: "S'orienter sans GPS",
        illustration: "orientation.png",
        sections: [
            { titre: "Avec le soleil", points: [
                "1. Observer la position du soleil : il se lève approximativement à l'est et se couche approximativement à l'ouest.",
                "2. À midi solaire (pas midi à la montre, mais le point le plus haut du soleil dans la journée), planter un bâton vertical et observer son ombre.",
                "3. Dans l'hémisphère nord, cette ombre la plus courte de la journée pointe vers le nord."
            ]},
            { titre: "Avec une montre analogique — méthode complète", points: [
                "1. Poser la montre à plat horizontalement, dans la paume de la main.",
                "2. Orienter la montre pour que la petite aiguille (celle des heures) pointe exactement en direction du soleil.",
                "3. Repérer le point situé exactement entre la petite aiguille et le repère de midi (12h) sur le cadran.",
                "4. La bissection de cet angle indique approximativement le sud dans l'hémisphère nord (le nord dans l'hémisphère sud)."
            ]},
            { titre: "Avec les étoiles la nuit", points: [
                "1. Repérer la Grande Ourse (forme de casserole à 7 étoiles) dans le ciel.",
                "2. Suivre les deux étoiles formant le bord de la 'casserole' en prolongeant une ligne imaginaire sur environ 5 fois leur distance.",
                "3. Cette ligne pointe vers l'étoile Polaire, qui indique le nord avec une bonne précision."
            ]}
        ]
    },

    {
        id: "se-nourrir-prudence", categorieId: "nourriture", emoji: "🍄", titre: "Se nourrir avec prudence",
        illustration: "nourriture.png",
        sections: [
            { titre: "Règle d'or absolue", points: [
                "Ne jamais consommer un champignon sans identification certaine par une personne experte — de nombreuses espèces mortelles ressemblent fortement à des espèces comestibles.",
                "En cas de doute sur une baie, un fruit ou une plante : ne pas consommer, sans exception.",
                "Écarter systématiquement tout végétal à odeur d'amande amère, à latex blanc laiteux qui coule quand on le casse, ou qui pousse à proximité de déchets ou d'eau stagnante."
            ]},
            { titre: "Étapes avant toute consommation", points: [
                "1. Ne jamais goûter un fruit ou une plante inconnue, même en très petite quantité.",
                "2. Ne consommer que des espèces déjà connues avec certitude avant la situation de survie — ce n'est pas le moment d'apprendre.",
                "3. Privilégier la pêche à la ligne improvisée (fil, hameçon de fortune, appât) ou un piège simple à petit gibier, généralement plus sûrs que la cueillette incertaine.",
                "4. Cuire systématiquement tout aliment d'origine animale avant consommation pour réduire les risques."
            ]}
        ]
    },

    {
        id: "noeuds-utiles", categorieId: "outils", emoji: "🪢", titre: "5 nœuds utiles",
        illustration: "outils-noeuds.png",
        sections: [
            { titre: "Nœud en huit — pour une boucle solide en bout de corde", points: [
                "1. Former une boucle en croisant le brin de corde sur lui-même, à environ 30 cm de l'extrémité.",
                "2. Passer l'extrémité libre derrière le brin principal, puis la faire ressortir à travers la boucle formée.",
                "3. Le tracé dessine un chiffre 8 bien visible une fois posé à plat.",
                "4. Serrer en tirant sur les deux côtés du nœud en même temps, pas seulement sur l'extrémité.",
                "Usage : créer un point d'accroche fiable qui ne glisse pas, facile à défaire même après avoir forcé dessus."
            ]},
            { titre: "Nœud de cabestan — pour attacher rapidement à un poteau", points: [
                "1. Faire un tour complet de corde autour du poteau ou de la branche.",
                "2. Croiser le brin qui revient par-dessus le brin qui part, formant un X contre le poteau.",
                "3. Faire un second tour identique juste au-dessus du premier.",
                "4. Glisser l'extrémité sous ce second tour, entre la corde et le poteau, puis tirer pour serrer.",
                "Usage : fixation rapide et solide pour monter une bâche ou un abri ; se resserre automatiquement sous tension mais reste réglable en le faisant glisser avant serrage final."
            ]},
            { titre: "Nœud plat — pour relier deux cordes de même diamètre", points: [
                "1. Tenir une extrémité de chaque corde, une dans chaque main.",
                "2. Passer le brin droit par-dessus le brin gauche, puis les croiser une première fois.",
                "3. Reprendre les deux nouvelles extrémités et les croiser une seconde fois dans le sens opposé au premier croisement.",
                "4. Tirer les deux côtés en même temps pour aplatir le nœud — il doit former deux boucles symétriques imbriquées.",
                "Attention : ce nœud n'est pas fiable pour une charge lourde ou en suspension, uniquement pour joindre deux cordes au sol ou à faible tension."
            ]},
            { titre: "Nœud de tension (nœud coulant réglable) — pour tendre une corde", points: [
                "1. Planter un point d'ancrage (piquet, arbre) et attacher fermement une extrémité de la corde dessus.",
                "2. Tendre la corde vers le second point d'ancrage et faire une boucle simple à environ 40 cm de ce second point.",
                "3. Passer l'extrémité libre à travers cette boucle 2 à 3 fois en tortillant, comme un tire-bouchon, avant de ressortir.",
                "4. Attacher l'extrémité libre au second point d'ancrage, puis tirer sur le brin qui sort de la boucle tortillée pour tendre progressivement toute la corde.",
                "5. Bloquer en faisant un demi-nœud simple contre la boucle une fois la tension voulue atteinte.",
                "Usage : tendre une corde de bâche ou de tente sans avoir besoin d'outil, avec un réglage fin possible avant blocage final."
            ]},
            { titre: "Nœud pince à linge — pour suspendre un objet léger", points: [
                "1. Former une petite boucle simple sur la corde tendue, à l'endroit où l'objet doit être suspendu.",
                "2. Faire passer un second tour de corde autour de cette boucle, en serrant les deux brins l'un contre l'autre comme une pince.",
                "3. Glisser l'anse ou la ficelle de l'objet à suspendre entre les deux brins serrés de la pince.",
                "4. Relâcher légèrement pour ajuster la position, puis resserrer en tirant sur les deux côtés de la corde principale.",
                "Usage : accrocher rapidement du linge, un sac léger ou du matériel sur une corde tendue, sans matériel supplémentaire ni nœud à défaire à chaque fois."
            ]}
        ]
    },

    {
        id: "signaler-detresse", categorieId: "signaler", emoji: "🆘", titre: "Signaler sa position",
        illustration: "signaler.png",
        sections: [
            { titre: "La règle des 3 signaux", points: [
                "3 signaux identiques et répétés (feux, coups de sifflet, éclats de miroir) sont universellement reconnus comme un appel de détresse.",
                "3 feux disposés en triangle sont visibles de loin et facilement repérables depuis les airs."
            ]},
            { titre: "Signal au miroir — étapes", points: [
                "1. Tenir le miroir ou tout objet réfléchissant à bout de bras, incliné à 45° face au soleil.",
                "2. Viser précisément la direction où se trouve le secours potentiel (avion, bateau, personne au loin).",
                "3. Incliner légèrement le miroir pour balayer le faisceau réfléchi sur la cible en 3 courts passages successifs, avec une pause entre chaque."
            ]},
            { titre: "Signal de fumée — étapes", points: [
                "1. Allumer un feu classique bien établi avec des flammes.",
                "2. Ajouter de la végétation verte et humide (feuilles fraîches) sur les braises pour produire une fumée épaisse et blanche, plus visible qu'une fumée de bois sec.",
                "3. Produire 3 colonnes de fumée distinctes si possible, en espaçant 3 petits foyers, plutôt qu'une seule colonne continue."
            ]},
            { titre: "Symbole SOS au sol — étapes", points: [
                "1. Choisir un espace dégagé et visible depuis le ciel (clairière, plage, sommet).",
                "2. Former les lettres S-O-S avec des pierres, branches ou tout matériau contrastant avec le sol.",
                "3. Faire chaque lettre suffisamment grande (au moins 3 mètres de haut) pour être lisible depuis un avion."
            ]}
        ]
    },

    {
        id: "lire-nuages", categorieId: "meteo", emoji: "🌦️", titre: "Lire le ciel sans instrument",
        illustration: "meteo.png",
        sections: [
            { titre: "Signes annonçant la pluie", points: [
                "Nuages bas, sombres et à base plate qui s'épaississent visiblement en quelques minutes d'observation.",
                "Chute soudaine du vent suivie d'une reprise en rafales irrégulières.",
                "Les animaux et insectes deviennent silencieux ou cherchent activement un abri.",
                "Une odeur de terre humide plus marquée qu'à l'habitude peut précéder l'arrivée de pluie."
            ]},
            { titre: "Signes de beau temps stable", points: [
                "Ciel dégagé au coucher du soleil avec des teintes rouges ou orangées nettes et prolongées.",
                "Présence de nuages fins et étirés en très haute altitude, sans épaisseur ni relief marqué.",
                "Rosée abondante au sol le matin, signe d'une nuit calme et sans vent fort."
            ]},
            { titre: "Action à entreprendre face à ces signes", points: [
                "1. Dès l'observation de nuages bas qui s'épaississent, chercher activement un abri avant que la pluie ne commence.",
                "2. Sécuriser le feu et le bois sec sous couvert avant l'arrivée de l'humidité.",
                "3. Si un beau temps stable est identifié, en profiter pour sécher les affaires humides et renforcer l'abri en prévision d'un futur changement."
            ]}
        ]
    },

    {
        id: "gerer-solitude", categorieId: "mental", emoji: "🧠", titre: "Gérer la solitude et le stress",
        illustration: "mental-solitude.png",
        sections: [
            { titre: "Dans l'instant — technique de respiration", points: [
                "1. S'asseoir si possible, dos droit, épaules relâchées.",
                "2. Inspirer lentement par le nez en comptant jusqu'à 4.",
                "3. Retenir sa respiration en comptant jusqu'à 4.",
                "4. Expirer lentement par la bouche en comptant jusqu'à 6.",
                "5. Répéter ce cycle 4 à 5 fois avant de prendre toute décision importante — la panique consomme de l'énergie et brouille le jugement."
            ]},
            { titre: "Reprendre le contrôle par l'action", points: [
                "1. Se fixer une seule tâche concrète et réalisable dans l'immédiat (ramasser du bois, sécuriser l'abri, filtrer de l'eau).",
                "2. La réaliser entièrement avant de penser à la suivante, sans se laisser submerger par l'ensemble de la situation.",
                "3. Parler à voix haute à soi-même pour structurer ses pensées et réduire concrètement le sentiment d'isolement — décrire ce qu'on fait, étape par étape, à voix haute."
            ]},
            { titre: "Sur la durée — tenir le moral", points: [
                "1. Établir une routine simple avec des horaires approximatifs pour les repas, le repos et les tâches.",
                "2. Marquer chaque jour écoulé d'une manière visible (encoche sur un bâton, pierre déplacée) pour garder un repère temporel.",
                "3. Se rappeler consciemment que la grande majorité des situations de survie se résolvent en quelques jours — garder cet horizon réaliste en tête plutôt que de penser à long terme."
            ]}
        ]
    },
    {
        id: "feu-longue-duree", categorieId: "feu", emoji: "🔥", titre: "Un feu qui dure toute la nuit",
        illustration: "feu-longue-duree.png",
        sections: [
            { titre: "La technique du feu en étoile", points: [
                "1. Une fois le feu bien établi, disposer 4 à 6 grosses bûches en étoile autour du foyer central, chaque extrémité pointant vers le centre en contact avec les braises.",
                "2. À mesure que chaque bûche se consume à son extrémité, la repousser légèrement vers le centre plutôt que d'ajouter du bois neuf en permanence.",
                "3. Cette disposition permet une combustion lente et régulière, nécessitant seulement un ajustement toutes les 2 à 3 heures plutôt qu'une surveillance constante."
            ]},
            { titre: "La technique de la bûche témoin", points: [
                "1. Choisir une bûche particulièrement épaisse et humide, difficile à enflammer complètement.",
                "2. La placer au centre du foyer une fois les flammes bien établies autour — elle se consume très lentement en conservant des braises actives longtemps.",
                "3. Le matin, il suffit généralement de raviver les braises restantes avec du petit bois sec plutôt que de rallumer un feu depuis zéro."
            ]},
            { titre: "Précaution essentielle", points: [
                "Même avec ces techniques, ne jamais s'endormir en laissant un feu totalement sans surveillance dans un environnement à risque (vent fort, végétation sèche proche) — désigner toujours quelqu'un en veille si le groupe le permet."
            ]}
        ]
    },

    {
        id: "corde-descente-pente", categorieId: "deplacement", emoji: "🧗", titre: "Descendre une pente raide avec une corde",
        illustration: "corde-pente.png",
        sections: [
            { titre: "Principe : s'assurer, pas grimper en rappel technique", points: [
                "Cette méthode sert uniquement à se stabiliser sur une pente raide mais praticable, pas à descendre une paroi verticale — dans ce cas, seule une vraie technique d'escalade avec matériel adapté est sécuritaire."
            ]},
            { titre: "Étapes", points: [
                "1. Attacher fermement une extrémité de la corde à un point d'ancrage solide en haut de la pente (tronc d'arbre robuste, rocher massif).",
                "2. Vérifier la solidité de l'ancrage en tirant fermement sur la corde avant de s'y confier.",
                "3. Descendre face à la pente, en tenant la corde à deux mains devant soi, en gardant toujours une légère tension.",
                "4. Progresser pas à pas, en testant chaque appui au sol avant d'y transférer le poids, sans jamais lâcher complètement la corde.",
                "5. Ne jamais enrouler la corde autour du poignet ou du corps sans technique adaptée — en cas de chute, cela peut causer une blessure grave plutôt que d'aider."
            ]}
        ]
    },

    {
        id: "matelas-isolant", categorieId: "abri", emoji: "🛏️", titre: "Fabriquer un matelas isolant naturel",
        illustration: "matelas.png",
        sections: [
            { titre: "Pourquoi c'est essentiel", points: [
                "Le sol absorbe la chaleur du corps beaucoup plus vite que l'air ambiant — un bon matelas isolant est souvent plus important qu'une couverture par-dessus."
            ]},
            { titre: "Étapes de construction", points: [
                "1. Rassembler une grande quantité de matériaux secs et gonflants : feuilles mortes, fougères, herbes hautes, mousse.",
                "2. Délimiter au sol un rectangle légèrement plus grand que le corps allongé.",
                "3. Empiler ces matériaux en une couche d'au moins 20 cm d'épaisseur avant compression — l'épaisseur diminue significativement une fois qu'on s'allonge dessus.",
                "4. Tasser légèrement le centre en gardant les bords un peu plus hauts, pour un meilleur maintien du corps.",
                "5. Ajouter une couche supplémentaire tous les jours si possible, les matériaux naturels se tassant rapidement avec l'usage."
            ]}
        ]
    },

    {
        id: "hameçon-fortune", categorieId: "nourriture", emoji: "🎣", titre: "Fabriquer une ligne de pêche de fortune",
        illustration: "hameçon.png",
        sections: [
            { titre: "Fabriquer un hameçon improvisé", points: [
                "1. Trouver un objet fin et rigide pouvant être plié : épingle, petit os solide, épine robuste, morceau de fil de fer.",
                "2. Plier l'extrémité en forme de crochet net, avec une pointe suffisamment acérée pour accrocher.",
                "3. Aiguiser la pointe si possible en la frottant contre une pierre rugueuse."
            ]},
            { titre: "Fabriquer la ligne", points: [
                "1. Utiliser un fil solide disponible : lacet fin déroulé, fil de couture, ou fibres végétales tressées ensemble (écorce souple, racines fines).",
                "2. Tresser plusieurs brins fins ensemble pour renforcer la résistance si le matériau de base est fragile.",
                "3. Attacher fermement une extrémité à l'hameçon avec plusieurs tours serrés."
            ]},
            { titre: "Amorcer et pêcher", points: [
                "1. Utiliser un appât simple : ver, insecte, petit morceau de nourriture disponible.",
                "2. Lancer la ligne dans une zone calme proche de la végétation aquatique, souvent plus poissonneuse que le milieu d'un cours d'eau.",
                "3. Rester patient et immobile — le mouvement et le bruit près de l'eau font fuir les poissons."
            ]}
        ]
    },

    {
        id: "transport-eau-sans-contenant", categorieId: "eau", emoji: "🧺", titre: "Transporter de l'eau sans contenant",
        illustration: "transport-eau.png",
        sections: [
            { titre: "Avec de larges feuilles", points: [
                "1. Choisir une grande feuille non toxique et suffisamment rigide (feuille de bananier, grande feuille de bardane).",
                "2. La rouler en forme de cornet, en repliant la pointe basse pour fermer l'extrémité.",
                "3. Maintenir la forme avec une fine tige végétale ou un brin d'herbe noué autour.",
                "Limite : cette méthode convient pour un transport court et rapide, pas pour un stockage prolongé."
            ]},
            { titre: "Avec de l'écorce", points: [
                "1. Prélever un morceau d'écorce souple et sans fissure sur un arbre mort ou une branche tombée (éviter de blesser un arbre vivant).",
                "2. La plier délicatement en forme de coupe ou de auge, en repliant les bords vers le haut.",
                "3. Maintenir les plis avec des épines végétales utilisées comme attaches temporaires, façon agrafe naturelle."
            ]},
            { titre: "Alternative avec un sac plastique", points: [
                "Si un sac plastique est disponible (même un simple emballage), il constitue souvent la solution la plus fiable et étanche, à privilégier avant toute solution végétale plus fragile."
            ]}
        ]
    },

    {
        id: "piege-simple-ethique", categorieId: "nourriture", emoji: "🐛", titre: "Principe d'un piège simple",
        illustration: "piege.png",
        sections: [
            { titre: "Cadre et prudence", points: [
                "La pose de pièges pour capturer du gibier est réglementée dans de nombreux pays et territoires, même en situation de survie — à n'envisager qu'en dernier recours et en connaissance des règles locales si elles peuvent être respectées.",
                "Un piège abandonné ou mal surveillé peut blesser un animal sans le capturer, ce qui pose un vrai problème éthique — ne poser un piège que si on peut le surveiller régulièrement."
            ]},
            { titre: "Principe général du collet simple", points: [
                "1. Repérer un passage évident et récent d'animaux (trace au sol, sentier étroit dans la végétation).",
                "2. Former une boucle coulissante avec un fil ou une fine corde, positionnée à hauteur adaptée à la taille de l'animal ciblé.",
                "3. Fixer solidement l'autre extrémité du fil à un point fixe robuste (racine, tronc).",
                "4. Camoufler légèrement le dispositif avec des éléments naturels environnants, sans obstruer le passage principal."
            ]},
            { titre: "Après la pose", points: [
                "Vérifier le piège au moins deux fois par jour, matin et soir, pour ne jamais laisser un animal capturé souffrir inutilement.",
                "Démonter systématiquement le dispositif dès qu'il n'est plus utile ou avant de quitter durablement la zone."
            ]}
        ]
    }
,
    {
        id: "premiers-gestes", categorieId: "secours", emoji: "🩹", titre: "Premiers gestes simples",
        illustration: "premiers-secours.png",
        sections: [
            { titre: "Rappel important avant tout geste", points: [
                "Cette fiche ne remplace en aucun cas une vraie formation aux premiers secours.",
                "En cas de doute ou de blessure grave (saignement abondant, fracture ouverte, perte de conscience), chercher de l'aide professionnelle en priorité absolue dès que possible."
            ]},
            { titre: "Plaie superficielle — étapes", points: [
                "1. Se laver les mains ou les nettoyer au mieux avant tout contact avec la plaie.",
                "2. Nettoyer la plaie avec de l'eau propre, en rinçant du centre vers l'extérieur.",
                "3. Sécher délicatement les bords avec un tissu propre, sans frotter sur la plaie elle-même.",
                "4. Poser une compresse ou un tissu propre directement sur la plaie.",
                "5. Bander en spirale, en partant de l'extrémité du membre vers le centre du corps (par exemple du poignet vers le coude), chaque tour chevauchant le précédent d'un tiers de sa largeur.",
                "6. Fixer l'extrémité du bandage sans serrer excessivement — vérifier que les doigts ou orteils restent chauds et colorés après la pose.",
                "7. Surveiller dans les jours suivants l'apparition de rougeur qui s'étend, chaleur anormale ou écoulement, signes possibles d'infection nécessitant une consultation."
            ]},
            { titre: "Pour aller plus loin", points: [
                "Consulter les ressources officielles de la Croix-Rouge française pour suivre une vraie formation aux gestes qui sauvent, seule façon d'être réellement préparé face à une urgence médicale."
            ]}
        ]
    },
        {
        id: "se-rafraichir", categorieId: "protection", emoji: "🌬️", titre: "Se rafraîchir sans matériel",
        illustration: "se-rafraichir.png",
        sections: [
            { titre: "Cibler les points de refroidissement du corps", points: [
                "1. Mouiller en priorité poignets, nuque, tempes et intérieur des coudes — ce sont les zones où le sang circule proche de la peau et se refroidit le plus efficacement.",
                "2. Si l'eau est limitée, quelques gouttes sur ces zones suffisent, pas besoin de s'immerger entièrement.",
                "3. Répéter l'opération toutes les 20 à 30 minutes en cas de forte chaleur plutôt qu'une seule fois abondamment."
            ]},
            { titre: "Créer un courant d'air", points: [
                "1. Fabriquer un éventail avec une large feuille, un morceau de tissu ou de carton.",
                "2. Agiter en mouvements lents et amples plutôt que rapides et brefs — un mouvement lent déplace plus d'air avec moins d'effort et de transpiration supplémentaire.",
                "3. Se placer si possible dans un courant d'air naturel (entrée de grotte, sous un arbre isolé) plutôt qu'en zone fermée."
            ]},
            { titre: "Utiliser l'évaporation", points: [
                "1. Mouiller un vêtement léger (t-shirt, foulard) et le laisser sécher sur la peau plutôt que de l'essorer immédiatement.",
                "2. L'évaporation de l'eau sur le tissu absorbe la chaleur du corps et procure une sensation de fraîcheur prolongée.",
                "3. Éviter de mouiller un vêtement épais qui sécherait trop lentement et garderait l'humidité contre la peau."
            ]}
        ]
    },

    {
        id: "proteger-insectes", categorieId: "protection", emoji: "🦟", titre: "Se protéger des insectes",
        illustration: "insectes.png",
        sections: [
            { titre: "Répulsifs naturels improvisés", points: [
                "1. Froisser et frotter sur la peau des feuilles aromatiques reconnues localement (menthe sauvage, lavande) si on sait les identifier avec certitude.",
                "2. Faire fumer légèrement un feu avec du bois vert humide : la fumée dense éloigne une grande partie des insectes volants.",
                "3. Éviter les zones d'eau stagnante à proximité immédiate du campement, principal lieu de reproduction des moustiques."
            ]},
            { titre: "Comportements à adopter", points: [
                "1. Couvrir bras et jambes au crépuscule et à l'aube, moments de plus forte activité des moustiques.",
                "2. Éviter les vêtements de couleur sombre qui attirent davantage certains insectes que les couleurs claires.",
                "3. Vérifier chaussures et literie improvisée avant utilisation, en particulier dans les climats chauds."
            ]},
            { titre: "En cas de piqûre", points: [
                "1. Ne pas grattouiller pour éviter le risque d'infection secondaire.",
                "2. Appliquer du froid si disponible (eau fraîche, argile humide) pour réduire la démangeaison et l'inflammation.",
                "3. Surveiller l'apparition de rougeur qui s'étend largement ou de fièvre, signes pouvant nécessiter un avis médical."
            ]}
        ]
    },

    {
        id: "securiser-nuit", categorieId: "abri", emoji: "🌙", titre: "S'organiser pour la nuit",
        illustration: "nuit.png",
        sections: [
            { titre: "Avant la tombée de la nuit", points: [
                "1. Terminer la construction ou le renforcement de l'abri au moins 1 heure avant le coucher du soleil — la luminosité baisse plus vite que prévu.",
                "2. Rassembler suffisamment de bois pour tenir le feu toute la nuit si possible, la nuit est le moment où le froid et le sentiment d'isolement sont les plus marqués.",
                "3. Repérer et écarter tout élément tranchant, instable ou glissant à proximité immédiate de la zone de couchage."
            ]},
            { titre: "Organisation en groupe", points: [
                "1. Si plusieurs personnes sont présentes, organiser des tours de veille par relais de 1 à 2 heures plutôt que de laisser tout le monde dormir en même temps.",
                "2. Désigner clairement qui surveille le feu et qui se repose, pour éviter les malentendus pendant la nuit.",
                "3. Se placer en cercle autour du feu si le groupe est petit, pour partager la chaleur et faciliter la surveillance mutuelle."
            ]},
            { titre: "Précautions face aux animaux nocturnes", points: [
                "1. Ne jamais garder de nourriture à proximité immédiate de la zone de couchage — la suspendre ou l'éloigner à quelques mètres si possible.",
                "2. Garder le feu visible et actif, la plupart des animaux évitent naturellement les flammes et la lumière.",
                "3. Éviter de dormir à même le sol dans une zone de passage évident (sentier d'animaux, berge de rivière)."
            ]}
        ]
    },

    {
        id: "traverser-obstacle", categorieId: "deplacement", emoji: "🧗", titre: "Traverser un obstacle naturel",
        illustration: "obstacle.png",
        sections: [
            { titre: "Traverser un cours d'eau", points: [
                "1. Chercher un point de traversée large et peu profond plutôt qu'un point étroit souvent plus profond et plus rapide.",
                "2. Détacher la sangle ventrale d'un sac à dos avant d'entrer dans l'eau, pour pouvoir s'en libérer rapidement en cas de chute.",
                "3. Utiliser un bâton solide comme troisième point d'appui, placé légèrement en amont du courant pour ne pas être déséquilibré.",
                "4. Avancer de côté, jamais de face contre le courant, en gardant toujours deux points d'appui stables avant de déplacer le troisième."
            ]},
            { titre: "Évaluer un terrain instable", points: [
                "1. Tester chaque appui avec le bâton ou le pied avant d'y transférer tout le poids du corps.",
                "2. Se méfier particulièrement des zones de mousse épaisse, de terre sombre et humide, ou de végétation anormalement verte isolée — signes possibles de terrain meuble ou marécageux.",
                "3. Contourner largement plutôt que de tenter de franchir rapidement une zone dont la stabilité est incertaine."
            ]},
            { titre: "Marcher en pente", points: [
                "1. À la montée, placer le pied entièrement à plat plutôt que sur la pointe pour économiser l'effort et améliorer l'adhérence.",
                "2. À la descente, plier légèrement les genoux et raccourcir le pas pour garder le contrôle et réduire le risque de glissade.",
                "3. Utiliser un bâton en appui du côté de la pente pour stabiliser chaque pas."
            ]}
        ]
    },

    {
        id: "animaux-dangereux", categorieId: "danger", emoji: "🐍", titre: "Face à un animal potentiellement dangereux",
        illustration: "animal.png",
        sections: [
            { titre: "Comportement général à adopter", points: [
                "1. Ne jamais courir directement en tournant le dos à un animal qui semble menaçant, sauf indication contraire spécifique à l'espèce locale connue.",
                "2. Reculer lentement, en gardant l'animal dans son champ de vision, sans geste brusque ni cri soudain.",
                "3. Laisser toujours à l'animal un chemin de fuite dégagé plutôt que de le sentir piégé, ce qui augmente le risque d'attaque défensive."
            ]},
            { titre: "Face à un serpent", points: [
                "1. S'arrêter immédiatement dès qu'un serpent est repéré, sans mouvement brusque.",
                "2. Reculer lentement de plusieurs mètres avant de contourner largement.",
                "3. Ne jamais tenter de le manipuler ou de l'identifier de près, même s'il semble immobile ou mort."
            ]},
            { titre: "En cas de morsure ou piqûre grave — avant les secours", points: [
                "1. Rester aussi calme et immobile que possible pour limiter la circulation du venin dans le corps.",
                "2. Ne pas inciser, aspirer ou appliquer un garrot sur la plaie — ces gestes anciens sont aujourd'hui déconseillés et peuvent aggraver la situation.",
                "3. Immobiliser le membre concerné en le maintenant si possible sous le niveau du cœur.",
                "4. Chercher un secours médical au plus vite — ce type de situation dépasse largement le cadre des premiers gestes simples et nécessite une prise en charge professionnelle rapide."
            ]}
        ]
    },

    {
        id: "kit-survie-minimal", categorieId: "preparation", emoji: "🎒", titre: "Kit de survie minimal",
        illustration: "kit.png",
        sections: [
            { titre: "Les objets qui changent tout", points: [
                "1. Un couteau fixe ou pliant solide — l'outil le plus polyvalent pour couper, tailler, préparer un abri ou du bois.",
                "2. Un briquet ou des allumettes étanches, dans un contenant fermé hermétiquement — bien plus fiable que la friction en conditions humides.",
                "3. Un sifflet — un signal sonore porte bien plus loin et demande bien moins d'énergie qu'un cri, utile pour signaler sa position.",
                "4. Une couverture de survie légère et compacte — protège efficacement contre le froid et peut aussi servir de signal visuel réfléchissant.",
                "5. Une petite trousse de premiers secours basique — pansements, compresses, bandage.",
                "6. Une lampe frontale ou de poche avec piles de rechange — libère les mains, essentiel après la tombée de la nuit.",
                "7. Une gourde ou poche à eau pliable, même vide au départ — permet de transporter l'eau trouvée sur place."
            ]},
            { titre: "Où le garder", points: [
                "1. Toujours sur soi (poche, ceinture) plutôt que seulement dans un sac qui peut être perdu ou laissé de côté.",
                "2. Vérifier régulièrement l'état des piles et la date de péremption des éléments concernés (pansements, pastilles de purification).",
                "3. Adapter le contenu au contexte du déplacement prévu (forêt, montagne, littoral) plutôt qu'un kit unique universel."
            ]}
        ]
    },
        {
        id: "abri-complexe", categorieId: "abri", emoji: "⛺", titre: "Abri complexe (tipi / abri en A)",
        illustration: "abri-complexe.png",
        sections: [
            { titre: "Le tipi — étapes", points: [
                "1. Rassembler 8 à 10 perches longues et droites, toutes de longueur similaire (environ 2,5 m).",
                "2. Lier 3 de ces perches ensemble à leur sommet avec une corde ou une liane, puis les écarter au sol pour former un tripode stable.",
                "3. Ajouter les autres perches tout autour, appuyées contre le point de liaison central, réparties régulièrement pour former un cône complet.",
                "4. Recouvrir progressivement de branches feuillues, d'écorce ou de bâches, en partant du bas et en superposant chaque couche vers le haut comme des tuiles.",
                "5. Laisser une petite ouverture au sommet si un feu doit être fait à l'intérieur, pour l'évacuation de la fumée."
            ]},
            { titre: "L'abri en A (double pente) — étapes", points: [
                "1. Trouver ou planter deux supports verticaux (arbres proches ou piquets) à environ 2 mètres l'un de l'autre.",
                "2. Fixer une perche horizontale entre les deux supports, à hauteur d'épaule, formant la poutre faîtière.",
                "3. Appuyer des perches plus fines en diagonale de chaque côté de cette poutre, formant un A vu de face, jusqu'au sol.",
                "4. Recouvrir chaque pan avec des branches puis des feuilles superposées, en partant du bas vers le haut sur chaque face.",
                "Avantage sur l'appentis simple : les deux pans fermés protègent des deux côtés à la fois et retiennent mieux la chaleur en espace clos."
            ]}
        ]
    },

    {
        id: "traverser-riviere-groupe", categorieId: "deplacement", emoji: "🎒", titre: "Traverser une rivière en groupe avec sacs à dos",
        illustration: "riviere-groupe.png",
        sections: [
            { titre: "Préparer la traversée", points: [
                "1. Choisir le membre le plus stable et expérimenté du groupe pour passer en premier sans charge, afin de repérer le meilleur passage.",
                "2. Détacher systématiquement la sangle ventrale de chaque sac à dos avant d'entrer dans l'eau — en cas de chute, un sac accroché peut entraîner sous l'eau.",
                "3. Regrouper les objets les plus lourds ou fragiles en un minimum de sacs si possible, plutôt que de répartir le risque sur tout le monde en même temps."
            ]},
            { titre: "Technique de la ligne humaine", points: [
                "1. Se placer en ligne, chacun tenant fermement l'épaule ou la sangle de sac de la personne devant, formant une chaîne solidaire face au courant.",
                "2. La personne la plus forte et stable se place en tête, face au courant, pour fendre le flux et protéger les suivants.",
                "3. Avancer ensemble, un pas à la fois, en gardant toujours au moins 2 appuis au sol par personne avant de bouger le troisième.",
                "4. Communiquer verbalement à chaque pas plutôt que d'avancer en silence, pour rester synchronisé."
            ]},
            { titre: "Alternative avec corde tendue", points: [
                "1. Si une corde est disponible, la tendre d'une rive à l'autre en l'attachant fermement aux deux extrémités avant que quiconque n'entre dans l'eau.",
                "2. Chaque personne traverse en se tenant à cette corde avec les deux mains, en restant du côté aval de la corde (jamais amont) pour ne pas être plaquée contre elle par le courant.",
                "3. Faire traverser les sacs séparément si possible, attachés à la corde par une sangle, plutôt que portés sur le dos pendant la traversée la plus délicate."
            ]}
        ]
    },

    {
        id: "brancard-improvise", categorieId: "secours", emoji: "🩹", titre: "Fabriquer un brancard improvisé",
        illustration: "brancard.png",
        sections: [
            { titre: "Rappel avant tout déplacement d'une personne blessée", points: [
                "Ne déplacer une personne blessée que si rester sur place représente un danger plus grand (feu, effondrement, montée des eaux).",
                "En cas de suspicion de blessure au dos ou au cou, éviter tout déplacement sauf urgence vitale absolue — un mauvais mouvement peut aggraver gravement une lésion de la colonne."
            ]},
            { titre: "Construction du brancard", points: [
                "1. Trouver 2 perches solides et droites, plus longues que la personne à transporter d'au moins 30 cm de chaque côté.",
                "2. Enfiler 2 à 3 t-shirts (ou vestes) sur les deux perches en les faisant passer par les manches, comme on enfilerait un vêtement sur deux bâtons parallèles.",
                "3. Fermer les t-shirts (zip ou boutons) une fois enfilés sur les perches pour qu'ils ne glissent pas, formant une surface de toile tendue entre les deux perches.",
                "4. Vérifier la solidité en appuyant fermement sur la toile avant d'y installer la personne blessée.",
                "5. Si possible, ajouter un vêtement supplémentaire plié sous la tête ou les zones les plus sensibles pour plus de confort."
            ]},
            { titre: "Porter le brancard", points: [
                "1. Se positionner à deux porteurs minimum, un à chaque extrémité, en tenant fermement les deux perches.",
                "2. Se relever ensemble en pliant les jambes plutôt que le dos, en restant synchronisés.",
                "3. Avancer au pas, en gardant le brancard aussi horizontal que possible, avec la tête légèrement plus haute que les pieds si la personne est consciente et sans traumatisme identifié au dos."
            ]}
        ]
    },

    {
        id: "double-bache-fraicheur", categorieId: "protection", emoji: "⛺", titre: "Créer une lame d'air fraîche avec deux bâches",
        illustration: "double-bache.png",
        sections: [
            { titre: "Principe", points: [
                "Une seule bâche tendue au soleil chauffe rapidement l'air juste en dessous, comme une petite serre.",
                "Deux bâches superposées avec un espace d'air entre elles créent un effet isolant similaire à un double vitrage : l'air emprisonné entre les deux couches limite la transmission de la chaleur vers l'espace habité en dessous."
            ]},
            { titre: "Construction — étapes", points: [
                "1. Tendre une première bâche en hauteur, inclinée face au soleil, comme un toit d'ombre classique.",
                "2. Tendre une seconde bâche parallèlement à la première, à environ 20-30 cm d'écart en dessous, en utilisant des bâtons ou pierres comme entretoises pour maintenir cet espace constant.",
                "3. Vérifier que l'air peut légèrement circuler sur les côtés entre les deux bâches, sans créer un espace totalement fermé qui empêcherait l'évacuation de la chaleur accumulée.",
                "4. S'installer dans l'espace ombragé sous la seconde bâche (la plus basse), qui reste sensiblement plus fraîche que sous une bâche unique exposée directement au soleil."
            ]},
            { titre: "Optimisation si matériel disponible", points: [
                "1. Choisir si possible une bâche extérieure de couleur claire ou réfléchissante pour renvoyer davantage de rayonnement solaire.",
                "2. Orienter l'ensemble pour laisser circuler un vent naturel latéral entre les deux couches, renforçant l'évacuation de la chaleur emprisonnée."
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