// ===========================
// THEMES SYSTEM
// ===========================

const THEMES = {
    default: {
        name: 'Défaut',
        description: 'Le thème classique du jeu',
        colors: {
            primary: '#8b5cf6',
            secondary: '#3b82f6',
            background: 'linear-gradient(135deg, #1e1b4b 0%, #0f172a 100%)',
            text: '#ffffff'
        },
        icon: '🎮'
    },
    luxe: {
        name: 'Gradient Luxe',
        description: 'Design premium haut de gamme',
        colors: {
            primary: '#d4af37',
            secondary: '#c9a961',
            background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1410 50%, #2a1f1a 100%)',
            text: '#f5f1e8'
        },
        icon: '✨',
        premiumOnly: true,
        isPremiumTheme: true
    },
    cyberpunk: {
        name: 'Cyberpunk Pro',
        description: 'Futuriste et intense',
        colors: {
            primary: '#00ff88',
            secondary: '#ff006e',
            background: 'linear-gradient(135deg, #0a0e27 0%, #1a0033 50%, #0d1b2a 100%)',
            text: '#00ff88'
        },
        icon: '⚡',
        premiumOnly: true,
        isPremiumTheme: true
    }
};

const PSEUDO_COLORS = {
    white: {
        name: 'Blanc',
        color: '#ffffff'
    },
    gold: {
        name: 'Or',
        color: '#fbbf24'
    },
    blue: {
        name: 'Bleu',
        color: '#3b82f6'
    },
    cyan: {
        name: 'Cyan',
        color: '#06b6d4'
    },
    green: {
        name: 'Vert',
        color: '#10b981'
    },
    red: {
        name: 'Rouge',
        color: '#ef4444'
    },
    pink: {
        name: 'Rose',
        color: '#ec4899'
    },
    purple: {
        name: 'Violet',
        color: '#a855f7'
    },
    orange: {
        name: 'Orange',
        color: '#f97316'
    }
};

const PSEUDO_GRADIENTS = {
    orangeBlue: {
        name: 'Orange → Bleu',
        gradient: 'linear-gradient(90deg, #ff8c00, #1e90ff)'
    },
    purplePink: {
        name: 'Violet → Rose',
        gradient: 'linear-gradient(90deg, #8b5cf6, #ec4899)'
    },
    redYellow: {
        name: 'Rouge → Jaune',
        gradient: 'linear-gradient(90deg, #ef4444, #fbbf24)'
    },
    greenCyan: {
        name: 'Vert → Cyan',
        gradient: 'linear-gradient(90deg, #10b981, #06b6d4)'
    },
    pinkPurple: {
        name: 'Rose → Violet',
        gradient: 'linear-gradient(90deg, #ec4899, #a855f7)'
    },
    goldOrange: {
        name: 'Or → Orange',
        gradient: 'linear-gradient(90deg, #fbbf24, #f97316)'
    },
    cyanBlue: {
        name: 'Cyan → Bleu',
        gradient: 'linear-gradient(90deg, #06b6d4, #0369a1)'
    }
};

const PROFILE_ICONS = {
    icon1: {
        name: 'Profil 1',
        emoji: '●',
        shape: 'circle',
        image: 'assets/img/profile1.png',
        color: '#8b5cf6'
    },
    icon2: {
        name: 'Profil 2',
        emoji: '★',
        shape: 'star',
        image: 'assets/img/profile2.png',
        color: '#fbbf24',
        gradient: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
        premiumOnly: true
    },
    icon3: {
        name: 'Profil 3',
        emoji: '⬡',
        shape: 'hexagon',
        image: 'assets/img/profile3.png',
        color: '#3b82f6',
        gradient: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
        premiumOnly: true
    },
    icon4: {
        name: 'Profil 4',
        emoji: '👑',
        shape: 'crown',
        image: 'assets/img/profile4.png',
        color: '#f59e0b',
        gradient: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
        premiumOnly: true
    },
    icon5: {
        name: 'Profil 5',
        emoji: '◆',
        shape: 'diamond',
        image: 'assets/img/profile5.png',
        color: '#06b6d4',
        gradient: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)',
        premiumOnly: true
    },
    icon6: {
        name: 'Profil 6',
        emoji: '❤',
        shape: 'heart',
        image: 'assets/img/profile6.png',
        color: '#ec4899',
        gradient: 'linear-gradient(135deg, #ec4899 0%, #db2777 100%)',
        premiumOnly: true
    },
    icon7: {
        name: 'Profil 7',
        emoji: '🔥',
        shape: 'flame',
        image: 'assets/img/profile7.png',
        color: '#ef4444',
        gradient: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
        premiumOnly: true
    },
    icon8: {
        name: 'Profil 8',
        emoji: '⚡',
        shape: 'lightning',
        image: 'assets/img/profile8.png',
        color: '#eab308',
        gradient: 'linear-gradient(135deg, #eab308 0%, #ca8a04 100%)',
        premiumOnly: true
    }
};

/**
 * Appliquer un thème
 */
function applyTheme(themeName) {
    const theme = THEMES[themeName] || THEMES.default;
    
    // Appliquer les couleurs au document
    const root = document.documentElement;
    root.style.setProperty('--primary-color', theme.colors.primary);
    root.style.setProperty('--secondary-color', theme.colors.secondary);
    root.style.setProperty('--text-color', theme.colors.text);
    
    // Appliquer le background
    const particlesBg = document.querySelector('.particles-bg');
    if (particlesBg) {
        particlesBg.style.background = theme.colors.background;
    }
    
    // Appliquer les styles CSS dynamiques
    const styleId = 'theme-style';
    let styleElement = document.getElementById(styleId);
    if (!styleElement) {
        styleElement = document.createElement('style');
        styleElement.id = styleId;
        document.head.appendChild(styleElement);
    }
    
    // Styles spécifiques aux thèmes premium
    let premiumStyles = '';
    
    if (themeName === 'luxe') {
        premiumStyles = `
            /* Theme Luxe Styles - Premium Enhanced */
            body {
                background: linear-gradient(135deg, #05050a 0%, #0f0a07 30%, #1a1410 60%, #2a1f1a 100%);
                position: relative;
                overflow-x: hidden;
            }
            
            body::before {
                background-image: 
                    linear-gradient(rgba(212, 175, 55, 0.015) 1px, transparent 1px),
                    linear-gradient(90deg, rgba(212, 175, 55, 0.015) 1px, transparent 1px);
                animation: luxeGlow 6s ease-in-out infinite;
            }
            
            @keyframes luxeGlow {
                0%, 100% { opacity: 0.3; }
                50% { opacity: 0.5; }
            }
            
            .btn-primary {
                background: linear-gradient(135deg, #e5d5a8 0%, #d4af37 50%, #c9a961 100%);
                box-shadow: 0 0 20px rgba(212, 175, 55, 0.4), 0 8px 24px rgba(212, 175, 55, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.3);
                border: 2px solid rgba(255, 255, 255, 0.1);
                text-transform: uppercase;
                letter-spacing: 2px;
                font-weight: 700;
                position: relative;
                color: #1a1410;
                transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
            }
            
            .btn-primary::after {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: radial-gradient(circle at center, rgba(255,255,255,0.15) 0%, transparent 70%);
                border-radius: 50px;
            }
            
            .btn-primary:hover {
                background: linear-gradient(135deg, #f0e0c0 0%, #e5d5a8 50%, #d4af37 100%);
                box-shadow: 0 0 40px rgba(212, 175, 55, 0.6), 0 16px 40px rgba(212, 175, 55, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.5);
                transform: translateY(-6px) scale(1.02);
                letter-spacing: 3px;
            }
            
            .btn-secondary {
                background: linear-gradient(135deg, rgba(212, 175, 55, 0.12) 0%, rgba(212, 175, 55, 0.05) 100%);
                border: 2px solid rgba(212, 175, 55, 0.4);
                color: #e5d5a8;
                position: relative;
                transition: all 0.3s ease;
            }
            
            .btn-secondary:hover {
                background: linear-gradient(135deg, rgba(212, 175, 55, 0.2) 0%, rgba(212, 175, 55, 0.1) 100%);
                border-color: #d4af37;
                box-shadow: 0 8px 24px rgba(212, 175, 55, 0.3);
                color: #d4af37;
            }
            
            .card, .glass {
                background: linear-gradient(135deg, rgba(212, 175, 55, 0.08) 0%, rgba(201, 169, 97, 0.04) 100%);
                border: 2px solid rgba(212, 175, 55, 0.25);
                box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.15), 0 8px 32px rgba(212, 175, 55, 0.1), inset 0 -1px 0 rgba(0, 0, 0, 0.2);
                backdrop-filter: blur(25px) brightness(1.15);
                position: relative;
                transition: all 0.4s ease;
            }
            
            .card::before {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: radial-gradient(circle at top-left, rgba(212, 175, 55, 0.1), transparent 60%);
                border-radius: inherit;
                pointer-events: none;
            }
            
            .card:hover, .glass:hover {
                background: linear-gradient(135deg, rgba(212, 175, 55, 0.15) 0%, rgba(201, 169, 97, 0.08) 100%);
                border-color: rgba(212, 175, 55, 0.5);
                box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.2), 0 16px 48px rgba(212, 175, 55, 0.2), inset 0 -1px 0 rgba(0, 0, 0, 0.1);
                transform: translateY(-8px);
            }
            
            .stat-item, .feature {
                background: linear-gradient(135deg, rgba(212, 175, 55, 0.08) 0%, rgba(201, 169, 97, 0.04) 100%);
                border: 2px solid rgba(212, 175, 55, 0.2);
                box-shadow: 0 4px 20px rgba(212, 175, 55, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.1);
                position: relative;
                transition: all 0.3s ease;
            }
            
            .stat-item:hover, .feature:hover {
                background: linear-gradient(135deg, rgba(212, 175, 55, 0.15) 0%, rgba(201, 169, 97, 0.08) 100%);
                border-color: rgba(212, 175, 55, 0.45);
                box-shadow: 0 12px 36px rgba(212, 175, 55, 0.25);
                transform: translateY(-6px) scale(1.02);
            }
            
            a {
                color: #d4af37;
                transition: all 0.3s ease;
                position: relative;
            }
            
            a:hover {
                color: #f0e0c0;
                text-shadow: 0 0 15px rgba(212, 175, 55, 0.6);
            }
            
            .title-word {
                background: linear-gradient(135deg, #e5d5a8 0%, #d4af37 50%, #c9a961 100%);
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                background-clip: text;
                text-shadow: 0 0 30px rgba(212, 175, 55, 0.2);
            }
            
            .main-title {
                text-shadow: 0 0 30px rgba(212, 175, 55, 0.15);
                letter-spacing: 2px;
                font-weight: 300;
            }
        `;
    } else if (themeName === 'cyberpunk') {
        premiumStyles = `
            /* Theme Cyberpunk Styles - Premium Enhanced */
            body {
                background: linear-gradient(135deg, #05070f 0%, #0a0e27 25%, #1a0033 50%, #15003d 75%, #0d1b2a 100%);
                position: relative;
                overflow-x: hidden;
            }
            
            body::before {
                background-image: 
                    linear-gradient(rgba(0, 255, 136, 0.025) 1px, transparent 1px),
                    linear-gradient(90deg, rgba(0, 255, 136, 0.025) 1px, transparent 1px);
                animation: scanlines 6s linear infinite;
            }
            
            @keyframes scanlines {
                0% { transform: translateY(0); }
                100% { transform: translateY(20px); }
            }
            
            .btn-primary {
                background: linear-gradient(135deg, #00ff88 0%, #00eeaa 50%, #00cc6a 100%);
                box-shadow: 0 0 30px rgba(0, 255, 136, 0.5), 0 0 60px rgba(0, 255, 136, 0.25), inset 0 0 20px rgba(0, 255, 136, 0.15), 0 8px 20px rgba(0, 0, 0, 0.5);
                border: 2px solid rgba(0, 255, 136, 0.6);
                color: #05070f;
                text-transform: uppercase;
                letter-spacing: 3px;
                font-weight: 900;
                position: relative;
                transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
            }
            
            .btn-primary::before {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.25), transparent);
                animation: shimmer 2.5s infinite;
                border-radius: 50px;
            }
            
            @keyframes shimmer {
                0% { transform: translateX(-100%); opacity: 0; }
                50% { opacity: 1; }
                100% { transform: translateX(100%); opacity: 0; }
            }
            
            .btn-primary:hover {
                background: linear-gradient(135deg, #00ff88 0%, #00ffcc 50%, #00ff88 100%);
                box-shadow: 0 0 50px rgba(0, 255, 136, 0.8), 0 0 80px rgba(0, 255, 136, 0.4), inset 0 0 30px rgba(0, 255, 136, 0.25), 0 12px 30px rgba(0, 0, 0, 0.7);
                transform: translateY(-8px) scale(1.05);
                letter-spacing: 4px;
            }
            
            .btn-secondary {
                background: linear-gradient(135deg, rgba(0, 255, 136, 0.08) 0%, rgba(255, 0, 110, 0.05) 100%);
                border: 2px solid rgba(0, 255, 136, 0.4);
                color: #00ff88;
                position: relative;
                transition: all 0.3s ease;
            }
            
            .btn-secondary:hover {
                background: linear-gradient(135deg, rgba(0, 255, 136, 0.15) 0%, rgba(255, 0, 110, 0.1) 100%);
                border-color: #00ff88;
                box-shadow: 0 0 30px rgba(0, 255, 136, 0.4);
                color: #00ffcc;
            }
            
            .card, .glass {
                background: linear-gradient(135deg, rgba(0, 255, 136, 0.06) 0%, rgba(255, 0, 110, 0.03) 100%);
                border: 2px solid rgba(0, 255, 136, 0.3);
                box-shadow: 0 0 25px rgba(0, 255, 136, 0.15), inset 0 0 20px rgba(0, 255, 136, 0.05), 0 8px 32px rgba(0, 0, 0, 0.4);
                backdrop-filter: blur(30px) brightness(1.2);
                position: relative;
                transition: all 0.4s ease;
            }
            
            .card::after {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                border: 1px solid rgba(0, 255, 136, 0.15);
                pointer-events: none;
                border-radius: 24px;
                animation: cyberpulse 3s ease-in-out infinite;
            }
            
            @keyframes cyberpulse {
                0%, 100% { box-shadow: inset 0 0 20px rgba(0, 255, 136, 0.05); }
                50% { box-shadow: inset 0 0 40px rgba(0, 255, 136, 0.12); }
            }
            
            .card:hover, .glass:hover {
                background: linear-gradient(135deg, rgba(0, 255, 136, 0.12) 0%, rgba(255, 0, 110, 0.06) 100%);
                border-color: rgba(0, 255, 136, 0.6);
                box-shadow: 0 0 50px rgba(0, 255, 136, 0.3), inset 0 0 30px rgba(0, 255, 136, 0.1), 0 12px 40px rgba(0, 0, 0, 0.5);
                transform: translateY(-8px);
            }
            
            .stat-item, .feature {
                background: linear-gradient(135deg, rgba(0, 255, 136, 0.05) 0%, rgba(255, 0, 110, 0.03) 100%);
                border: 2px solid rgba(0, 255, 136, 0.25);
                box-shadow: 0 0 20px rgba(0, 255, 136, 0.1), inset 0 0 15px rgba(0, 255, 136, 0.02);
                position: relative;
                transition: all 0.3s ease;
            }
            
            .stat-item:hover, .feature:hover {
                background: linear-gradient(135deg, rgba(0, 255, 136, 0.1) 0%, rgba(255, 0, 110, 0.05) 100%);
                border-color: rgba(0, 255, 136, 0.6);
                box-shadow: 0 0 40px rgba(0, 255, 136, 0.3);
                transform: translateY(-6px) scale(1.03);
            }
            
            a {
                color: #00ff88;
                text-shadow: 0 0 12px rgba(0, 255, 136, 0.5);
                transition: all 0.3s ease;
                position: relative;
            }
            
            a:hover {
                color: #00ffff;
                text-shadow: 0 0 25px rgba(0, 255, 255, 0.8), 0 0 50px rgba(0, 255, 136, 0.4);
            }
            
            .title-word {
                background: linear-gradient(135deg, #00ff88 0%, #00ffcc 50%, #00ffff 100%);
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                background-clip: text;
                text-shadow: 0 0 30px rgba(0, 255, 136, 0.3);
                animation: titleGlow 3s ease-in-out infinite;
            }
            
            @keyframes titleGlow {
                0%, 100% { text-shadow: 0 0 20px rgba(0, 255, 136, 0.3); }
                50% { text-shadow: 0 0 40px rgba(0, 255, 136, 0.5); }
            }
            
            .main-title {
                text-shadow: 0 0 30px rgba(0, 255, 136, 0.2);
                color: #00ff88;
                letter-spacing: 3px;
                font-weight: 700;
            }
        `;
    }
    
    styleElement.textContent = `
        :root {
            --primary: ${theme.colors.primary};
            --secondary: ${theme.colors.secondary};
            --text-color: ${theme.colors.text};
        }
        
        body {
            color: ${theme.colors.text};
        }
        
        .card, .glass {
            background: rgba(${hexToRgb(theme.colors.primary)}, 0.1);
            border-color: ${theme.colors.primary};
        }
        
        .btn-primary {
            background: ${theme.colors.primary};
        }
        
        .btn-primary:hover {
            background: ${theme.colors.secondary};
        }
        
        a {
            color: ${theme.colors.secondary};
        }
        
        ${premiumStyles}
    `;
    
    localStorage.setItem('selectedTheme', themeName);
    console.log('✅ Thème appliqué:', themeName);
}

/**
 * Convertir hex en RGB
 */
function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : '139, 92, 246';
}

/**
 * Charger le thème sauvegardé
 */
function loadSavedTheme() {
    const savedTheme = localStorage.getItem('selectedTheme') || 'default';
    applyTheme(savedTheme);
}

/**
 * Obtenir les thèmes disponibles (filtrés selon le statut premium)
 */
function getAvailableThemes(isPremiumUser = false) {
    const available = {};
    
    for (const [key, theme] of Object.entries(THEMES)) {
        if (!theme.premiumOnly || isPremiumUser) {
            available[key] = theme;
        }
    }
    
    return available;
}

/**
 * Obtenir les icônes disponibles (filtrées selon le statut premium)
 */
function getAvailableIcons(isPremiumUser = false) {
    const available = {};
    
    for (const [key, icon] of Object.entries(PROFILE_ICONS)) {
        if (!icon.premiumOnly || isPremiumUser) {
            available[key] = icon;
        }
    }
    
    return available;
}

/**
 * Vérifier si un thème est premium
 */
function isThemePremium(themeName) {
    return THEMES[themeName]?.premiumOnly || false;
}

/**
 * Vérifier si une icône est premium
 */
function isIconPremium(iconName) {
    return PROFILE_ICONS[iconName]?.premiumOnly || false;
}

/**
 * Obtenir les dégradés de couleur disponibles pour le pseudo
 */
function getPseudoGradients() {
    return PSEUDO_GRADIENTS;
}

/**
 * Obtenir les couleurs unies disponibles pour le pseudo
 */
function getPseudoColors() {
    return PSEUDO_COLORS;
}

// Charger le thème sauvegardé au démarrage
document.addEventListener('DOMContentLoaded', () => {
    loadSavedTheme();
});

// Exposer les fonctions
window.applyTheme = applyTheme;
window.loadSavedTheme = loadSavedTheme;
window.getAvailableThemes = getAvailableThemes;
window.getAvailableIcons = getAvailableIcons;
window.isThemePremium = isThemePremium;
window.isIconPremium = isIconPremium;
window.getPseudoGradients = getPseudoGradients;
window.getPseudoColors = getPseudoColors;
window.THEMES = THEMES;
window.PROFILE_ICONS = PROFILE_ICONS;
window.PSEUDO_GRADIENTS = PSEUDO_GRADIENTS;
window.PSEUDO_COLORS = PSEUDO_COLORS;