// ===========================
// CATEGORY ICONS & CONSTANTS
// ===========================
// All questions are now stored in Firebase
// This file is kept only for category definitions

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

// Empty questions array - all questions are now stored in Firebase
const QUESTIONS = [];