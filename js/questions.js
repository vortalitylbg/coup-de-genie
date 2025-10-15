// ===========================
// EXTENDED QUESTIONS DATABASE
// ===========================

// Category icons mapping (Font Awesome)
const CATEGORY_ICONS = {
    'Culture générale': 'fa-book-open',
    'Histoire': 'fa-landmark',
    'Géographie': 'fa-earth-americas',
    'Sciences': 'fa-flask',
    'Mathématiques': 'fa-calculator',
    'Langue française': 'fa-language',
    'Littérature': 'fa-book',
    'Cinéma & Séries': 'fa-film',
    'Musique': 'fa-music',
    'Jeux vidéo': 'fa-gamepad',
    'Sport': 'fa-futbol',
    'Culture internet': 'fa-wifi',
    'Technologie': 'fa-microchip',
    'Mode & Beauté': 'fa-shirt',
    'Cuisine & Alimentation': 'fa-utensils',
    'Animaux': 'fa-paw',
    'Art & Peinture': 'fa-palette',
    'Télévision & Médias': 'fa-tv',
    'Actualité & Société': 'fa-newspaper',
    'Culture geek': 'fa-robot',
    'Mythologie': 'fa-dragon',
    'Nature & environnement': 'fa-leaf',
    'Santé & Corps humain': 'fa-heart-pulse',
    'Inventions & découvertes': 'fa-lightbulb',
    'Culture urbaine': 'fa-city',
    'Économie & finance': 'fa-chart-line',
    'Voyages & Monde': 'fa-plane',
    'Culture "fun"': 'fa-face-laugh-beam',
    'Quiz humoristique / WTF': 'fa-face-grin-tears',
    'Quiz "Génération 2000"': 'fa-calendar-days'
};

// Liste de toutes les catégories disponibles
const ALL_CATEGORIES = Object.keys(CATEGORY_ICONS);

// Base de questions étendue
const QUESTIONS = [
    // Culture générale
    {
        question: "Quelle est la capitale de la France ?",
        answers: ["Paris", "Londres", "Berlin", "Madrid"],
        correct: 0,
        category: "Culture générale",
        explanation: "Paris est la capitale et la plus grande ville de France."
    },
    {
        question: "Combien y a-t-il de continents sur Terre ?",
        answers: ["5", "6", "7", "8"],
        correct: 2,
        category: "Culture générale",
        explanation: "Il y a 7 continents : Afrique, Amérique du Nord, Amérique du Sud, Antarctique, Asie, Europe et Océanie."
    },
    {
        question: "Quelle est la langue la plus parlée au monde ?",
        answers: ["Anglais", "Mandarin", "Espagnol", "Hindi"],
        correct: 1,
        category: "Culture générale",
        explanation: "Le mandarin est la langue la plus parlée avec plus d'un milliard de locuteurs."
    },
    
    // Histoire
    {
        question: "En quelle année a eu lieu la Révolution française ?",
        answers: ["1789", "1799", "1804", "1815"],
        correct: 0,
        category: "Histoire",
        explanation: "La Révolution française a débuté en 1789 avec la prise de la Bastille le 14 juillet."
    },
    {
        question: "Qui était le premier empereur romain ?",
        answers: ["Jules César", "Auguste", "Néron", "Caligula"],
        correct: 1,
        category: "Histoire",
        explanation: "Auguste (Octave) fut le premier empereur romain, régnant de 27 av. J.-C. à 14 ap. J.-C."
    },
    {
        question: "En quelle année l'homme a-t-il marché sur la Lune pour la première fois ?",
        answers: ["1965", "1967", "1969", "1971"],
        correct: 2,
        category: "Histoire",
        explanation: "Neil Armstrong a marché sur la Lune le 21 juillet 1969 lors de la mission Apollo 11."
    },
    
    // Géographie
    {
        question: "Quel est le plus grand océan du monde ?",
        answers: ["Atlantique", "Indien", "Arctique", "Pacifique"],
        correct: 3,
        category: "Géographie",
        explanation: "L'océan Pacifique est le plus grand océan, couvrant environ 165 millions de km²."
    },
    {
        question: "Quelle est la capitale du Japon ?",
        answers: ["Kyoto", "Osaka", "Tokyo", "Hiroshima"],
        correct: 2,
        category: "Géographie",
        explanation: "Tokyo est la capitale du Japon et l'une des plus grandes métropoles du monde."
    },
    {
        question: "Quel est le plus long fleuve du monde ?",
        answers: ["Nil", "Amazone", "Yangtsé", "Mississippi"],
        correct: 0,
        category: "Géographie",
        explanation: "Le Nil est considéré comme le plus long fleuve du monde avec environ 6 650 km."
    },
    
    // Sciences
    {
        question: "Quelle est la planète la plus proche du Soleil ?",
        answers: ["Vénus", "Mars", "Mercure", "Terre"],
        correct: 2,
        category: "Sciences",
        explanation: "Mercure est la planète la plus proche du Soleil, à environ 58 millions de km."
    },
    {
        question: "Quel est l'élément chimique dont le symbole est 'O' ?",
        answers: ["Or", "Osmium", "Oxygène", "Oganesson"],
        correct: 2,
        category: "Sciences",
        explanation: "O est le symbole de l'oxygène, élément essentiel à la vie."
    },
    {
        question: "Quelle est la vitesse de la lumière dans le vide ?",
        answers: ["300 000 km/s", "150 000 km/s", "450 000 km/s", "600 000 km/s"],
        correct: 0,
        category: "Sciences",
        explanation: "La lumière se déplace à environ 300 000 kilomètres par seconde dans le vide."
    },
    
    // Mathématiques
    {
        question: "Combien vaut Pi (π) approximativement ?",
        answers: ["3.14", "2.71", "1.61", "4.20"],
        correct: 0,
        category: "Mathématiques",
        explanation: "Pi (π) vaut approximativement 3.14159... C'est le rapport entre la circonférence d'un cercle et son diamètre."
    },
    {
        question: "Quel est le résultat de 12 × 12 ?",
        answers: ["124", "144", "154", "164"],
        correct: 1,
        category: "Mathématiques",
        explanation: "12 × 12 = 144. C'est aussi 12²."
    },
    {
        question: "Combien y a-t-il de degrés dans un triangle ?",
        answers: ["90°", "180°", "270°", "360°"],
        correct: 1,
        category: "Mathématiques",
        explanation: "La somme des angles d'un triangle est toujours égale à 180°."
    },
    
    // Langue française
    {
        question: "Quel est le pluriel de 'cheval' ?",
        answers: ["Chevals", "Chevaux", "Chevaus", "Chevales"],
        correct: 1,
        category: "Langue française",
        explanation: "Le pluriel de 'cheval' est 'chevaux', comme pour la plupart des mots en -al."
    },
    {
        question: "Que signifie l'expression 'avoir un chat dans la gorge' ?",
        answers: ["Avoir faim", "Être enroué", "Mentir", "Avoir peur"],
        correct: 1,
        category: "Langue française",
        explanation: "Cette expression signifie être enroué, avoir la voix rauque."
    },
    {
        question: "Quel est le féminin de 'directeur' ?",
        answers: ["Directeuse", "Directrice", "Directeure", "Directrice"],
        correct: 1,
        category: "Langue française",
        explanation: "Le féminin de 'directeur' est 'directrice'."
    },
    
    // Littérature
    {
        question: "Qui a écrit 'Les Misérables' ?",
        answers: ["Émile Zola", "Victor Hugo", "Gustave Flaubert", "Alexandre Dumas"],
        correct: 1,
        category: "Littérature",
        explanation: "Les Misérables a été écrit par Victor Hugo et publié en 1862."
    },
    {
        question: "Quel est le vrai nom de Molière ?",
        answers: ["Jean-Baptiste Poquelin", "Jean-Jacques Rousseau", "Pierre Corneille", "Jean Racine"],
        correct: 0,
        category: "Littérature",
        explanation: "Molière est le nom de scène de Jean-Baptiste Poquelin, célèbre dramaturge français."
    },
    {
        question: "Qui a écrit 'Le Petit Prince' ?",
        answers: ["Jules Verne", "Antoine de Saint-Exupéry", "Albert Camus", "Marcel Pagnol"],
        correct: 1,
        category: "Littérature",
        explanation: "Le Petit Prince a été écrit par Antoine de Saint-Exupéry en 1943."
    },
    
    // Cinéma & Séries
    {
        question: "Quel film a remporté l'Oscar du meilleur film en 1998 ?",
        answers: ["Titanic", "Good Will Hunting", "L.A. Confidential", "As Good as It Gets"],
        correct: 0,
        category: "Cinéma & Séries",
        explanation: "Titanic de James Cameron a remporté 11 Oscars dont celui du meilleur film en 1998."
    },
    {
        question: "Dans quelle série trouve-t-on les personnages Ross, Rachel et Chandler ?",
        answers: ["How I Met Your Mother", "Friends", "Seinfeld", "The Big Bang Theory"],
        correct: 1,
        category: "Cinéma & Séries",
        explanation: "Ces personnages sont issus de la série culte Friends (1994-2004)."
    },
    {
        question: "Qui a réalisé le film 'Inception' ?",
        answers: ["Steven Spielberg", "Christopher Nolan", "Quentin Tarantino", "Martin Scorsese"],
        correct: 1,
        category: "Cinéma & Séries",
        explanation: "Inception (2010) a été réalisé par Christopher Nolan."
    },
    
    // Musique
    {
        question: "Quel groupe a chanté 'Bohemian Rhapsody' ?",
        answers: ["The Beatles", "Queen", "Led Zeppelin", "Pink Floyd"],
        correct: 1,
        category: "Musique",
        explanation: "Bohemian Rhapsody est un titre emblématique du groupe Queen, sorti en 1975."
    },
    {
        question: "Combien y a-t-il de touches blanches sur un piano standard ?",
        answers: ["48", "52", "56", "60"],
        correct: 1,
        category: "Musique",
        explanation: "Un piano standard possède 52 touches blanches et 36 touches noires."
    },
    {
        question: "Quel artiste est surnommé 'The King of Pop' ?",
        answers: ["Elvis Presley", "Michael Jackson", "Prince", "Freddie Mercury"],
        correct: 1,
        category: "Musique",
        explanation: "Michael Jackson est surnommé 'The King of Pop' pour son influence majeure sur la musique pop."
    },
    
    // Jeux vidéo
    {
        question: "Quel est le personnage principal de la série 'The Legend of Zelda' ?",
        answers: ["Zelda", "Link", "Ganon", "Epona"],
        correct: 1,
        category: "Jeux vidéo",
        explanation: "Link est le héros jouable de la série, bien que le jeu porte le nom de la princesse Zelda."
    },
    {
        question: "En quelle année est sorti le premier 'Super Mario Bros' ?",
        answers: ["1983", "1985", "1987", "1989"],
        correct: 1,
        category: "Jeux vidéo",
        explanation: "Super Mario Bros est sorti en 1985 sur la console NES (Nintendo Entertainment System)."
    },
    {
        question: "Quel jeu vidéo a popularisé le genre 'Battle Royale' ?",
        answers: ["Fortnite", "PUBG", "Apex Legends", "Call of Duty Warzone"],
        correct: 1,
        category: "Jeux vidéo",
        explanation: "PUBG (PlayerUnknown's Battlegrounds) a popularisé le genre Battle Royale en 2017."
    },
    
    // Sport
    {
        question: "Combien de joueurs composent une équipe de football sur le terrain ?",
        answers: ["9", "10", "11", "12"],
        correct: 2,
        category: "Sport",
        explanation: "Une équipe de football est composée de 11 joueurs sur le terrain."
    },
    {
        question: "Quel pays a remporté la Coupe du Monde de football 2018 ?",
        answers: ["Brésil", "Allemagne", "France", "Argentine"],
        correct: 2,
        category: "Sport",
        explanation: "La France a remporté la Coupe du Monde 2018 en Russie en battant la Croatie 4-2."
    },
    {
        question: "Combien de sets faut-il gagner pour remporter un match de tennis en Grand Chelem (hommes) ?",
        answers: ["2", "3", "4", "5"],
        correct: 1,
        category: "Sport",
        explanation: "En Grand Chelem, les hommes jouent en 5 sets et doivent en gagner 3 pour remporter le match."
    },
    
    // Culture internet
    {
        question: "Que signifie 'LOL' ?",
        answers: ["Lots of Love", "Laugh Out Loud", "Loss of Life", "Lord of Light"],
        correct: 1,
        category: "Culture internet",
        explanation: "LOL signifie 'Laugh Out Loud', soit 'rire aux éclats' en français."
    },
    {
        question: "En quelle année YouTube a-t-il été créé ?",
        answers: ["2003", "2005", "2007", "2009"],
        correct: 1,
        category: "Culture internet",
        explanation: "YouTube a été créé en février 2005 par trois anciens employés de PayPal."
    },
    {
        question: "Quel réseau social utilise un oiseau bleu comme logo ?",
        answers: ["Facebook", "Instagram", "Twitter/X", "LinkedIn"],
        correct: 2,
        category: "Culture internet",
        explanation: "Twitter (maintenant X) utilise un oiseau bleu comme logo emblématique."
    },
    
    // Technologie
    {
        question: "Qui est le fondateur d'Apple ?",
        answers: ["Bill Gates", "Steve Jobs", "Mark Zuckerberg", "Elon Musk"],
        correct: 1,
        category: "Technologie",
        explanation: "Steve Jobs a co-fondé Apple en 1976 avec Steve Wozniak et Ronald Wayne."
    },
    {
        question: "Que signifie 'CPU' en informatique ?",
        answers: ["Computer Power Unit", "Central Processing Unit", "Core Program Utility", "Central Power Unit"],
        correct: 1,
        category: "Technologie",
        explanation: "CPU signifie Central Processing Unit, c'est le processeur central de l'ordinateur."
    },
    {
        question: "Quel langage de programmation est symbolisé par un serpent ?",
        answers: ["Java", "Python", "Ruby", "PHP"],
        correct: 1,
        category: "Technologie",
        explanation: "Python est symbolisé par un serpent, en référence à son nom."
    },
    
    // Mode & Beauté
    {
        question: "Quelle marque de luxe a pour logo deux C entrelacés ?",
        answers: ["Dior", "Chanel", "Gucci", "Prada"],
        correct: 1,
        category: "Mode & Beauté",
        explanation: "Chanel a pour logo deux C entrelacés, créé par Coco Chanel."
    },
    {
        question: "Dans quel pays se déroule la Fashion Week la plus célèbre ?",
        answers: ["Italie", "États-Unis", "France", "Royaume-Uni"],
        correct: 2,
        category: "Mode & Beauté",
        explanation: "La Fashion Week de Paris est considérée comme la plus prestigieuse au monde."
    },
    
    // Cuisine & Alimentation
    {
        question: "Quel pays est l'origine de la pizza ?",
        answers: ["France", "Espagne", "Italie", "Grèce"],
        correct: 2,
        category: "Cuisine & Alimentation",
        explanation: "La pizza est originaire d'Italie, plus précisément de Naples."
    },
    {
        question: "Quel fruit est utilisé pour faire du guacamole ?",
        answers: ["Tomate", "Avocat", "Mangue", "Papaye"],
        correct: 1,
        category: "Cuisine & Alimentation",
        explanation: "Le guacamole est une préparation mexicaine à base d'avocat écrasé."
    },
    {
        question: "Combien d'étoiles Michelin un restaurant peut-il obtenir au maximum ?",
        answers: ["2", "3", "4", "5"],
        correct: 1,
        category: "Cuisine & Alimentation",
        explanation: "Un restaurant peut obtenir au maximum 3 étoiles Michelin, la plus haute distinction."
    },
    
    // Animaux
    {
        question: "Quel est l'animal terrestre le plus rapide ?",
        answers: ["Lion", "Guépard", "Antilope", "Cheval"],
        correct: 1,
        category: "Animaux",
        explanation: "Le guépard peut atteindre 110-120 km/h, ce qui en fait l'animal terrestre le plus rapide."
    },
    {
        question: "Combien de pattes a une araignée ?",
        answers: ["6", "8", "10", "12"],
        correct: 1,
        category: "Animaux",
        explanation: "Les araignées ont 8 pattes, ce qui les distingue des insectes qui en ont 6."
    },
    {
        question: "Quel est le plus grand animal du monde ?",
        answers: ["Éléphant d'Afrique", "Baleine bleue", "Requin baleine", "Girafe"],
        correct: 1,
        category: "Animaux",
        explanation: "La baleine bleue est le plus grand animal ayant jamais existé, pouvant mesurer jusqu'à 30 mètres."
    },
    
    // Art & Peinture
    {
        question: "Qui a peint la Joconde ?",
        answers: ["Michel-Ange", "Léonard de Vinci", "Raphaël", "Donatello"],
        correct: 1,
        category: "Art & Peinture",
        explanation: "La Joconde a été peinte par Léonard de Vinci entre 1503 et 1519."
    },
    {
        question: "Quel artiste est célèbre pour ses tournesols ?",
        answers: ["Claude Monet", "Vincent van Gogh", "Pablo Picasso", "Salvador Dalí"],
        correct: 1,
        category: "Art & Peinture",
        explanation: "Vincent van Gogh est célèbre pour sa série de peintures de tournesols."
    },
    {
        question: "Dans quel musée se trouve la Joconde ?",
        answers: ["Le Louvre", "Le Musée d'Orsay", "Le British Museum", "Le Prado"],
        correct: 0,
        category: "Art & Peinture",
        explanation: "La Joconde est exposée au musée du Louvre à Paris depuis 1797."
    },
    
    // Télévision & Médias
    {
        question: "Quelle chaîne diffuse le journal de 20h présenté par Anne-Claire Coudray ?",
        answers: ["TF1", "France 2", "M6", "France 3"],
        correct: 0,
        category: "Télévision & Médias",
        explanation: "Anne-Claire Coudray présente le journal de 20h sur TF1."
    },
    
    // Actualité & Société
    {
        question: "Combien y a-t-il de pays membres de l'Union Européenne en 2024 ?",
        answers: ["25", "27", "28", "30"],
        correct: 1,
        category: "Actualité & Société",
        explanation: "L'Union Européenne compte 27 pays membres depuis le Brexit en 2020."
    },
    
    // Culture geek
    {
        question: "Dans Star Wars, qui est le père de Luke Skywalker ?",
        answers: ["Obi-Wan Kenobi", "Yoda", "Dark Vador", "Palpatine"],
        correct: 2,
        category: "Culture geek",
        explanation: "Dark Vador (Anakin Skywalker) est le père de Luke Skywalker."
    },
    {
        question: "Quel est le vrai nom de Batman ?",
        answers: ["Bruce Wayne", "Clark Kent", "Peter Parker", "Tony Stark"],
        correct: 0,
        category: "Culture geek",
        explanation: "Bruce Wayne est l'identité secrète de Batman."
    },
    {
        question: "Dans Harry Potter, quelle est la maison de Hermione Granger ?",
        answers: ["Serpentard", "Poufsouffle", "Serdaigle", "Gryffondor"],
        correct: 3,
        category: "Culture geek",
        explanation: "Hermione Granger appartient à la maison Gryffondor à Poudlard."
    },
    
    // Mythologie
    {
        question: "Qui est le dieu grec de la mer ?",
        answers: ["Zeus", "Hadès", "Poséidon", "Apollon"],
        correct: 2,
        category: "Mythologie",
        explanation: "Poséidon est le dieu grec de la mer, des océans et des tremblements de terre."
    },
    {
        question: "Quel héros grec a tué la Méduse ?",
        answers: ["Hercule", "Persée", "Thésée", "Achille"],
        correct: 1,
        category: "Mythologie",
        explanation: "Persée a décapité la Méduse avec l'aide d'Athéna et d'Hermès."
    },
    
    // Nature & environnement
    {
        question: "Quel gaz les plantes absorbent-elles lors de la photosynthèse ?",
        answers: ["Oxygène", "Azote", "Dioxyde de carbone", "Hydrogène"],
        correct: 2,
        category: "Nature & environnement",
        explanation: "Les plantes absorbent le CO2 (dioxyde de carbone) et rejettent de l'oxygène."
    },
    {
        question: "Quel est le plus grand désert du monde ?",
        answers: ["Sahara", "Gobi", "Antarctique", "Arabie"],
        correct: 2,
        category: "Nature & environnement",
        explanation: "L'Antarctique est techniquement le plus grand désert du monde (désert froid)."
    },
    
    // Santé & Corps humain
    {
        question: "Combien d'os possède un adulte humain ?",
        answers: ["186", "206", "226", "246"],
        correct: 1,
        category: "Santé & Corps humain",
        explanation: "Un adulte possède 206 os, contre 270 à la naissance (certains fusionnent en grandissant)."
    },
    {
        question: "Quel organe produit l'insuline ?",
        answers: ["Le foie", "Le pancréas", "Les reins", "L'estomac"],
        correct: 1,
        category: "Santé & Corps humain",
        explanation: "Le pancréas produit l'insuline, hormone qui régule le taux de sucre dans le sang."
    },
    
    // Inventions & découvertes
    {
        question: "Qui a inventé l'ampoule électrique ?",
        answers: ["Nikola Tesla", "Thomas Edison", "Alexander Graham Bell", "Benjamin Franklin"],
        correct: 1,
        category: "Inventions & découvertes",
        explanation: "Thomas Edison a perfectionné et commercialisé l'ampoule électrique en 1879."
    },
    {
        question: "En quelle année Internet a-t-il été créé ?",
        answers: ["1969", "1979", "1989", "1999"],
        correct: 0,
        category: "Inventions & découvertes",
        explanation: "ARPANET, l'ancêtre d'Internet, a été créé en 1969."
    },
    
    // Culture urbaine
    {
        question: "Dans quelle ville est né le hip-hop ?",
        answers: ["Los Angeles", "Chicago", "New York", "Detroit"],
        correct: 2,
        category: "Culture urbaine",
        explanation: "Le hip-hop est né dans le Bronx à New York dans les années 1970."
    },
    
    // Économie & finance
    {
        question: "Quelle est la monnaie du Japon ?",
        answers: ["Yuan", "Won", "Yen", "Baht"],
        correct: 2,
        category: "Économie & finance",
        explanation: "Le yen (¥) est la monnaie officielle du Japon."
    },
    
    // Voyages & Monde
    {
        question: "Quelle est la ville la plus peuplée du monde ?",
        answers: ["Shanghai", "Tokyo", "Delhi", "São Paulo"],
        correct: 1,
        category: "Voyages & Monde",
        explanation: "Tokyo est la ville la plus peuplée du monde avec environ 37 millions d'habitants dans son agglomération."
    },
    {
        question: "Dans quel pays se trouve la tour de Pise ?",
        answers: ["France", "Espagne", "Italie", "Grèce"],
        correct: 2,
        category: "Voyages & Monde",
        explanation: "La tour de Pise se trouve en Italie, dans la ville de Pise en Toscane."
    },
    
    // Culture "fun"
    {
        question: "Combien de carrés de chocolat y a-t-il dans une tablette Milka standard ?",
        answers: ["20", "24", "28", "32"],
        correct: 1,
        category: "Culture \"fun\"",
        explanation: "Une tablette Milka standard contient 24 carrés de chocolat."
    },
    
    // Quiz humoristique / WTF
    {
        question: "Quel animal peut dormir debout ?",
        answers: ["Le cheval", "La vache", "Le mouton", "Tous ces animaux"],
        correct: 3,
        category: "Quiz humoristique / WTF",
        explanation: "Les chevaux, vaches et moutons peuvent tous dormir debout grâce à un système de verrouillage des articulations."
    },
    {
        question: "Combien de temps faudrait-il pour compter jusqu'à un milliard ?",
        answers: ["1 mois", "1 an", "10 ans", "31 ans"],
        correct: 3,
        category: "Quiz humoristique / WTF",
        explanation: "En comptant 1 nombre par seconde sans s'arrêter, il faudrait environ 31 ans pour atteindre un milliard !"
    },
    
    // Quiz "Génération 2000"
    {
        question: "Quel réseau social a popularisé les 'stories' ?",
        answers: ["Facebook", "Snapchat", "Instagram", "TikTok"],
        correct: 1,
        category: "Quiz \"Génération 2000\"",
        explanation: "Snapchat a été le premier à populariser les 'stories' en 2013."
    },
    {
        question: "Quel jeu mobile a connu un succès mondial en 2016 avec la réalité augmentée ?",
        answers: ["Candy Crush", "Pokémon GO", "Clash of Clans", "Among Us"],
        correct: 1,
        category: "Quiz \"Génération 2000\"",
        explanation: "Pokémon GO a créé un phénomène mondial en 2016 avec sa réalité augmentée."
    },
    {
        question: "Quelle plateforme de streaming a lancé la série 'Stranger Things' ?",
        answers: ["Amazon Prime", "Disney+", "Netflix", "HBO Max"],
        correct: 2,
        category: "Quiz \"Génération 2000\"",
        explanation: "Stranger Things est une série originale Netflix lancée en 2016."
    }
];