// ===========================
// ENHANCEMENTS.JS - Améliorations globales UI/UX
// Theme system, animations améliorées, et interactions
// ===========================

// ===========================
// THEME SYSTEM
// ===========================

class ThemeManager {
    constructor() {
        this.STORAGE_KEY = 'coup-de-genie-theme';
        this.DARK_THEME = 'dark-theme';
        this.LIGHT_THEME = 'light-theme';
        this.init();
    }

    init() {
        // Charger le thème sauvegardé ou utiliser la préférence système
        const savedTheme = this.getSavedTheme();
        const preferredTheme = this.getSystemPreference();
        const themeToApply = savedTheme || preferredTheme;

        this.setTheme(themeToApply);
        this.createThemeToggle();
    }

    getSavedTheme() {
        return localStorage.getItem(this.STORAGE_KEY);
    }

    getSystemPreference() {
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
            return this.LIGHT_THEME;
        }
        return this.DARK_THEME;
    }

    setTheme(theme) {
        const html = document.documentElement;
        
        // Supprimer les deux classes
        html.classList.remove(this.DARK_THEME, this.LIGHT_THEME);
        
        // Ajouter le thème approprié
        if (theme === this.LIGHT_THEME) {
            html.classList.add(this.LIGHT_THEME);
        } else {
            html.classList.add(this.DARK_THEME);
        }
        
        // Sauvegarder
        localStorage.setItem(this.STORAGE_KEY, theme);
        
        console.log(`🌙 Thème appliqué: ${theme}`);
    }

    toggleTheme() {
        const html = document.documentElement;
        const currentTheme = html.classList.contains(this.LIGHT_THEME) ? this.LIGHT_THEME : this.DARK_THEME;
        const newTheme = currentTheme === this.LIGHT_THEME ? this.DARK_THEME : this.LIGHT_THEME;
        
        this.setTheme(newTheme);
        this.updateToggleButton(newTheme);
    }

    createThemeToggle() {
        // Vérifier si le toggle existe déjà
        if (document.querySelector('.theme-toggle')) {
            this.updateToggleButton();
            return;
        }

        const toggle = document.createElement('button');
        toggle.className = 'theme-toggle';
        toggle.setAttribute('aria-label', 'Basculer entre mode clair et sombre');
        toggle.setAttribute('title', 'Mode clair/sombre');
        
        document.body.appendChild(toggle);
        
        toggle.addEventListener('click', () => this.toggleTheme());
        
        // Écouter les changements de préférence système
        if (window.matchMedia) {
            window.matchMedia('(prefers-color-scheme: light)').addEventListener('change', (e) => {
                if (!this.getSavedTheme()) {
                    this.setTheme(e.matches ? this.LIGHT_THEME : this.DARK_THEME);
                }
            });
        }

        this.updateToggleButton();
    }

    updateToggleButton(theme) {
        const toggle = document.querySelector('.theme-toggle');
        if (!toggle) return;

        const html = document.documentElement;
        const currentTheme = theme || (html.classList.contains(this.LIGHT_THEME) ? this.LIGHT_THEME : this.DARK_THEME);
        
        toggle.classList.remove('light-mode', 'dark-mode');
        
        if (currentTheme === this.LIGHT_THEME) {
            toggle.innerHTML = '<i class="fas fa-moon"></i>';
            toggle.classList.add('light-mode');
        } else {
            toggle.innerHTML = '<i class="fas fa-sun"></i>';
            toggle.classList.add('dark-mode');
        }
    }
}

// ===========================
// DUEL ENHANCEMENTS
// ===========================

class DuelEnhancements {
    constructor() {
        this.comboCount = 0;
        this.maxCombo = 0;
        this.answerTimes = [];
    }

    // Mettre à jour le score avec animation
    updateScore(playerElement, newScore) {
        const scoreElement = playerElement.querySelector('.player-score');
        if (!scoreElement) return;

        scoreElement.textContent = newScore;
        scoreElement.classList.remove('pulse');
        
        // Trigger reflow pour relancer l'animation
        void scoreElement.offsetWidth;
        scoreElement.classList.add('pulse');
    }

    // Gérer le combo
    handleCorrectAnswer() {
        this.comboCount++;
        this.maxCombo = Math.max(this.maxCombo, this.comboCount);
        
        if (this.comboCount > 1) {
            this.showComboIndicator(this.comboCount);
        }
    }

    handleWrongAnswer() {
        this.comboCount = 0;
    }

    showComboIndicator(count) {
        let indicator = document.getElementById('comboIndicator');
        
        if (!indicator) {
            indicator = document.createElement('div');
            indicator.id = 'comboIndicator';
            indicator.className = 'combo-indicator';
            indicator.innerHTML = `
                <div class="combo-content">
                    <div class="combo-stars">✨ 🔥 ✨</div>
                    <div class="combo-text">Combo!</div>
                    <div class="combo-number" id="comboNumber">${count}</div>
                    <div class="combo-label">Bonnes réponses d'affilée</div>
                </div>
            `;
            document.body.appendChild(indicator);
        }

        document.getElementById('comboNumber').textContent = count;
        indicator.classList.add('show');

        setTimeout(() => {
            indicator.classList.remove('show');
        }, 2000);
    }

    // Enregistrer le temps de réponse
    recordAnswerTime(timeInSeconds) {
        this.answerTimes.push(timeInSeconds);
    }

    // Obtenir l'indicateur de vitesse
    getSpeedIndicator(timeInSeconds) {
        if (timeInSeconds <= 2) return { level: 'very-fast', label: 'Très rapide' };
        if (timeInSeconds <= 5) return { level: 'fast', label: 'Rapide' };
        if (timeInSeconds <= 10) return { level: 'medium', label: 'Moyen' };
        if (timeInSeconds <= 20) return { level: 'slow', label: 'Lent' };
        return { level: 'very-slow', label: 'Très lent' };
    }

    // Afficher l'indicateur de vitesse
    showSpeedIndicator(playerCard, timeInSeconds) {
        const speedInfo = this.getSpeedIndicator(timeInSeconds);
        let speedIndicator = playerCard.querySelector('.speed-indicator');

        if (!speedIndicator) {
            speedIndicator = document.createElement('div');
            speedIndicator.className = 'speed-indicator';
            speedIndicator.innerHTML = `
                <div class="speed-dot ${speedInfo.level} active"></div>
                <div class="speed-dot ${speedInfo.level}"></div>
                <div class="speed-dot ${speedInfo.level}"></div>
                <div class="speed-label">${speedInfo.label}</div>
            `;
            playerCard.style.position = 'relative';
            playerCard.appendChild(speedIndicator);
        }

        speedIndicator.classList.add('show');
        setTimeout(() => {
            speedIndicator.classList.remove('show');
        }, 2000);
    }

    // Obtenir les statistiques de combo
    getComboStats() {
        return {
            maxCombo: this.maxCombo,
            currentCombo: this.comboCount,
            averageAnswerTime: this.answerTimes.length > 0 
                ? (this.answerTimes.reduce((a, b) => a + b, 0) / this.answerTimes.length).toFixed(2)
                : 0
        };
    }

    resetStats() {
        this.comboCount = 0;
        this.maxCombo = 0;
        this.answerTimes = [];
    }
}

// ===========================
// GLOBAL INITIALIZATION
// ===========================

document.addEventListener('DOMContentLoaded', () => {
    // Initialiser le système de thème
    window.themeManager = new ThemeManager();
    
    // Créer l'instance des améliorations du duel
    window.duelEnhancements = new DuelEnhancements();
});

// ===========================
// UTILITY FUNCTIONS
// ===========================

/**
 * Ajouter l'indicateur de vitesse à un élément
 */
function addSpeedIndicator(playerCard, timeInSeconds) {
    if (!window.duelEnhancements) return;
    window.duelEnhancements.showSpeedIndicator(playerCard, timeInSeconds);
}

/**
 * Mettre à jour le score avec animation
 */
function updateScoreWithAnimation(playerElement, newScore) {
    if (!window.duelEnhancements) return;
    window.duelEnhancements.updateScore(playerElement, newScore);
}

/**
 * Afficher le combo
 */
function showCombo(count) {
    if (!window.duelEnhancements) return;
    window.duelEnhancements.showComboIndicator(count);
}

/**
 * Enregistrer une bonne réponse (combo++)
 */
function recordCorrectAnswer() {
    if (!window.duelEnhancements) return;
    window.duelEnhancements.handleCorrectAnswer();
}

/**
 * Enregistrer une mauvaise réponse (combo reset)
 */
function recordWrongAnswer() {
    if (!window.duelEnhancements) return;
    window.duelEnhancements.handleWrongAnswer();
}

/**
 * Enregistrer le temps de réponse
 */
function recordAnswerTime(timeInSeconds) {
    if (!window.duelEnhancements) return;
    window.duelEnhancements.recordAnswerTime(timeInSeconds);
}

/**
 * Obtenir les statistiques de combo
 */
function getComboStats() {
    if (!window.duelEnhancements) return { maxCombo: 0, currentCombo: 0, averageAnswerTime: 0 };
    return window.duelEnhancements.getComboStats();
}