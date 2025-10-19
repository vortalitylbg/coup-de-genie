// ===========================
// PREMIUM SYSTEM
// ===========================

const PREMIUM_PRICE = 4.99;
const PREMIUM_CURRENCY = '€';
const STRIPE_PAYMENT_LINK = 'https://buy.stripe.com/aFaaEW1DN9lj5p5gOk0Jq01';
const PENDING_PURCHASE_KEY = 'pendingPremiumPurchase';
const PURCHASE_PENDING_TTL = 1000 * 60 * 60 * 2; // 2 heures

// Plan features
const PLAN_FEATURES = {
    free: [
        { name: 'Jeux illimités', available: true },
        { name: 'Mode Duel classique', available: true },
        { name: 'Classement global', available: true },
        { name: 'Thème par défaut', available: true },
        { name: '1 icône de profil', available: true },
        { name: 'Pseudo simple', available: true },
        { name: 'Statistiques basiques', available: true }
    ],
    premium: [
        { name: 'Jeux illimités', available: true },
        { name: 'Mode Duel Rapide (30s)', available: true },
        { name: 'Classement global + privatisé', available: true },
        { name: '7 thèmes personnalisés', available: true },
        { name: '8 icônes de profil', available: true },
        { name: 'Couleur de pseudo personnalisée', available: true },
        { name: 'Statistiques avancées + Graphiques', available: true },
        { name: 'Export en PDF', available: true },
        { name: 'Mode Tournoi privé', available: true },
        { name: 'Priorité au matchmaking', available: true },
        { name: 'Badge Premium', available: true },
        { name: 'Pas de publicités', available: true }
    ]
};

const PREMIUM_BENEFITS = [
    {
        icon: '🚫',
        title: 'Pas de publicités',
        description: 'Profitez d\'une expérience sans interruption'
    },
    {
        icon: '⚡',
        title: 'Mode Duel Rapide',
        description: 'Compétitions éclair de 30 secondes en classé'
    },
    {
        icon: '🎨',
        title: 'Thèmes personnalisés',
        description: '7 thèmes magnifiques exclusifs'
    },
    {
        icon: '👤',
        title: 'Icônes de profil',
        description: '8 styles d\'icônes uniques pour votre profil'
    },
    {
        icon: '🏆',
        title: 'Badges spéciaux',
        description: 'Badge Premium visible sur votre profil'
    },
    {
        icon: '🌈',
        title: 'Couleur de pseudo',
        description: 'Personnalisez la couleur de votre nom'
    },
    {
        icon: '📊',
        title: 'Stats avancées',
        description: 'Graphiques et analyses détaillées'
    },
    {
        icon: '📄',
        title: 'Export en PDF',
        description: 'Téléchargez vos statistiques'
    },
    {
        icon: '🏅',
        title: 'Tournoi privé',
        description: 'Créez des tournois personnalisés'
    },
    {
        icon: '👥',
        title: 'Priorité matchmaking',
        description: 'Trouver des adversaires plus vite'
    }
];

/**
 * Initialiser la page premium
 */
async function initPremiumPage() {
    try {
        console.log('🚀 Initialisation de la page premium...');
        
        // ⚡ IMPORTANT: Attendre que Firebase restaure l'état d'authentification
        // Cela évite une race condition où getCurrentUser() retournerait null trop tôt
        console.log('⏳ Attente de la restauration de l\'état d\'authentification...');
        const user = await waitForAuthReady();
        console.log('👤 Utilisateur actuel:', user ? user.email : 'Aucun');
        
        if (!user) {
            showAlert('Vous devez être connecté pour voir les offres premium', 'info');
            setTimeout(() => window.location.href = 'index.html', 2000);
            return;
        }
        
        // Vérifier si un achat est en attente
        const pendingUserId = getPendingPurchaseUserId();

        // Vérifier le statut premium
        console.log('✅ Vérification du statut premium...');
        const isPremiumUser = await isPremium(user.uid);
        console.log('👑 Utilisateur premium?', isPremiumUser);

        // Si l'utilisateur est premium et qu'un achat est en attente, nettoyer le flag local
        if (isPremiumUser && pendingUserId === user.uid) {
            clearPendingPurchase();
            hideEmbeddedStripeButton();
            showAlert('Votre abonnement premium est maintenant actif. Merci !', 'success');
        }

        // Afficher les plans de pricing
        console.log('💳 Affichage des plans de pricing...');
        displayPricingPlans(isPremiumUser);

        // Afficher le statut premium actuel si l'utilisateur est premium
        if (isPremiumUser) {
            console.log('📊 Affichage du statut premium actuel...');
            await displayCurrentPremiumStatus(user.uid);
        } else if (pendingUserId === user.uid) {
            await ensureStripeScriptLoaded();
            showEmbeddedStripeButton();
            showAlert('Paiement en cours. Terminez le paiement Stripe dans l’onglet ouvert.', 'info');
        }
        
        // Afficher les bénéfices
        console.log('🎁 Affichage des bénéfices premium...');
        displayBenefits();
        
        // Afficher les thèmes premium
        console.log('🎨 Affichage des thèmes premium...');
        displayThemes(isPremiumUser);
        
        // Ajouter les écouteurs
        setupEventListeners();
        
        console.log('✨ Page premium chargée avec succès!');
        
    } catch (error) {
        console.error('❌ Erreur initialisation premium:', error);
        console.error('📋 Stack trace:', error.stack);
        showAlert('Erreur lors du chargement de la page premium: ' + error.message, 'error');
    }
}

/**
 * Afficher les 2 cartes de plans (Gratuit et Premium)
 */
function displayPricingPlans(isPremiumUser) {
    const container = document.getElementById('pricingPlans');
    if (!container) return;
    
    container.innerHTML = `
        <!-- Plan Gratuit -->
        <div class="plan-card">
            <div class="plan-header">
                <h3>👤 Gratuit</h3>
                <p>Jouez sans limites</p>
            </div>
            <div class="plan-price">
                <span class="amount">0</span>
                <span class="currency">${PREMIUM_CURRENCY}</span>
                <span class="period">/toujours</span>
            </div>
            <div class="plan-divider"></div>
            <div class="plan-features">
                ${PLAN_FEATURES.free.map(feature => `
                    <div class="feature-item ${feature.available ? '' : 'unavailable'}">
                        <i class="fas ${feature.available ? 'fa-check-circle' : 'fa-lock'}"></i>
                        <span>${feature.name}</span>
                    </div>
                `).join('')}
            </div>
            <div class="plan-action">
                <button onclick="window.location.href='game.html'" class="btn btn-primary">
                    <i class="fas fa-play"></i>
                    Commencer
                </button>
            </div>
        </div>

        <!-- Plan Premium -->
        <div class="plan-card featured">
            <div class="badge">⭐ RECOMMANDÉ</div>
            <div class="plan-header">
                <h3>👑 Premium</h3>
                <p>Tout illimité + exclusif</p>
            </div>
            <div class="plan-price">
                <span class="amount">${PREMIUM_PRICE}</span>
                <span class="currency">${PREMIUM_CURRENCY}</span>
                <span class="period">/mois</span>
            </div>
            <div class="plan-divider"></div>
            <div class="plan-features">
                ${PLAN_FEATURES.premium.map(feature => `
                    <div class="feature-item">
                        <i class="fas fa-star"></i>
                        <span>${feature.name}</span>
                    </div>
                `).join('')}
            </div>
            <div class="plan-action">
                ${isPremiumUser ? `
                    <button onclick="window.location.href='profile.html'" class="btn btn-primary">
                        <i class="fas fa-user-circle"></i>
                        Mon Profil
                    </button>
                ` : `
                    <button onclick="handlePremiumPurchase()" class="btn btn-primary checkout-button">
                        <i class="fas fa-credit-card"></i>
                        S'abonner
                    </button>
                    <div id="stripeBuyButtonContainer" style="display: none; width: 100%; margin-top: 1rem;"></div>
                `}
            </div>
        </div>
    `;
}

/**
 * Afficher les bénéfices premium
 */
function displayBenefits() {
    const benefitsContainer = document.getElementById('premiumBenefits');
    if (!benefitsContainer) return;
    
    benefitsContainer.innerHTML = PREMIUM_BENEFITS.map(benefit => `
        <div class="benefit-card glass">
            <div class="benefit-icon">${benefit.icon}</div>
            <h3>${benefit.title}</h3>
            <p>${benefit.description}</p>
        </div>
    `).join('');
}

/**
 * Afficher les thèmes premium disponibles
 */
function displayThemes(isPremiumUser) {
    const themesContainer = document.getElementById('themesGrid');
    const themesSection = document.getElementById('themesSection');
    
    if (!themesContainer || !themesSection) return;
    
    // Caché la section si l'utilisateur n'est pas premium
    if (!isPremiumUser) {
        themesSection.style.display = 'none';
        return;
    }
    
    themesSection.style.display = 'block';
    
    // Obtenir les thèmes disponibles selon le statut premium
    const availableThemes = getAvailableThemes(isPremiumUser);
    const currentTheme = localStorage.getItem('selectedTheme') || 'default';
    
    // Créer les cartes de thèmes
    const themesHTML = Object.entries(availableThemes)
        .filter(([key]) => key !== 'default') // Filtrer le thème par défaut
        .map(([key, theme]) => {
            const isActive = currentTheme === key;
            const themeClass = theme.isPremiumTheme ? (key === 'luxe' ? 'luxe' : 'cyberpunk') : '';
            
            let colorSwatches = '';
            const primaryColor = theme.colors.primary;
            const secondaryColor = theme.colors.secondary;
            
            colorSwatches = `
                <div class="color-swatch" style="background-color: ${primaryColor};"></div>
                <div class="color-swatch" style="background-color: ${secondaryColor};"></div>
            `;
            
            let tagClass = 'theme-tag';
            if (key === 'luxe') tagClass += ' theme-luxe-tag';
            else if (key === 'cyberpunk') tagClass += ' theme-cyber-tag';
            
            return `
                <div class="theme-card ${themeClass} ${isActive ? 'active' : ''}" onclick="selectTheme('${key}')">
                    <div class="selected-badge">✓ ACTIF</div>
                    <div class="theme-icon">${theme.icon}</div>
                    <div>
                        <div class="theme-name">${theme.name}</div>
                        <div class="theme-description">${theme.description}</div>
                        ${theme.premiumOnly ? `<span class="${tagClass}">👑 Premium</span>` : ''}
                        <div class="theme-preview">
                            ${colorSwatches}
                        </div>
                    </div>
                </div>
            `;
        })
        .join('');
    
    themesContainer.innerHTML = themesHTML;
}

/**
 * Sélectionner et appliquer un thème
 */
function selectTheme(themeName) {
    console.log('🎨 Sélection du thème:', themeName);
    applyTheme(themeName);
    
    // Mettre à jour l'affichage des thèmes
    const themesContainer = document.getElementById('themesGrid');
    if (themesContainer) {
        const themeCards = themesContainer.querySelectorAll('.theme-card');
        themeCards.forEach(card => {
            card.classList.remove('active');
        });
        
        const selectedCard = themesContainer.querySelector(`[onclick="selectTheme('${themeName}')"]`);
        if (selectedCard) {
            selectedCard.classList.add('active');
        }
    }
    
    showAlert(`✨ Thème "${themeName}" appliqué avec succès!`, 'success');
}

/**
 * Afficher le statut premium actuel de l'utilisateur
 */
async function displayCurrentPremiumStatus(userId) {
    const statusContainer = document.getElementById('premiumStatus');
    if (!statusContainer) return;
    
    try {
        const premiumData = await getPremiumData(userId);
        console.log('📊 Premium data:', premiumData);
        
        if (premiumData.success && premiumData.hasPremium && premiumData.premiumExpiry) {
            const expiryDate = premiumData.premiumExpiry;
            const now = new Date();
            const remainingDays = Math.ceil((expiryDate - now) / (1000 * 60 * 60 * 24));
            
            statusContainer.innerHTML = `
                <div class="current-status">
                    <h3><i class="fas fa-crown"></i> Vous êtes Premium ! 👑</h3>
                    <p>Merci d'avoir choisi Premium. Profitez de tous les avantages exclusifs !</p>
                    <div class="expiry-info">
                        <span class="label">Expiration de l'abonnement :</span>
                        <span class="value">${expiryDate.toLocaleDateString('fr-FR')} (${remainingDays} jours restants)</span>
                    </div>
                </div>
            `;
        }
    } catch (error) {
        console.error('❌ Erreur affichage statut premium:', error);
    }
}

/**
 * Gérer l'achat premium
 */
async function handlePremiumPurchase() {
    const user = getCurrentUser();
    
    if (!user) {
        showAlert('Vous devez être connecté', 'error');
        return;
    }

    try {
        await ensureStripeScriptLoaded();
        registerPendingPurchase(user.uid);
        showEmbeddedStripeButton();
        setTimeout(() => {
            window.open(STRIPE_PAYMENT_LINK, '_blank');
        }, 100);
    } catch (error) {
        console.error('❌ Erreur préparation achat premium:', error);
        showAlert("Impossible d'initialiser l'achat. Réessayez plus tard.", 'error');
    }
}

/**
 * Configurer les écouteurs d'événements
 */
function setupEventListeners() {
    // À ajouter si des boutons supplémentaires sont nécessaires
}

/**
 * Enregistrer un achat premium en attente
 */
function registerPendingPurchase(userId) {
    const payload = {
        userId,
        createdAt: Date.now(),
        expiryAt: Date.now() + PURCHASE_PENDING_TTL
    };
    localStorage.setItem(PENDING_PURCHASE_KEY, JSON.stringify(payload));
}

/**
 * Vérifier si un achat premium est en attente et non expiré
 */
function getPendingPurchaseUserId() {
    try {
        const raw = localStorage.getItem(PENDING_PURCHASE_KEY);
        if (!raw) return null;
        const data = JSON.parse(raw);
        if (!data || !data.userId || !data.expiryAt) {
            localStorage.removeItem(PENDING_PURCHASE_KEY);
            return null;
        }
        if (Date.now() > data.expiryAt) {
            localStorage.removeItem(PENDING_PURCHASE_KEY);
            return null;
        }
        return data.userId;
    } catch (error) {
        console.warn('⚠️ Erreur lecture achat pending:', error);
        localStorage.removeItem(PENDING_PURCHASE_KEY);
        return null;
    }
}

/**
 * Supprimer le flag d'achat en attente
 */
function clearPendingPurchase() {
    localStorage.removeItem(PENDING_PURCHASE_KEY);
}

/**
 * Afficher le bouton Stripe intégré
 */
function showEmbeddedStripeButton() {
    const container = document.getElementById('stripeBuyButtonContainer');
    if (!container) return;

    if (!container.querySelector('stripe-buy-button')) {
        const buyButtonElement = document.createElement('stripe-buy-button');
        buyButtonElement.setAttribute('buy-button-id', 'buy_btn_1SJh4mAGYeUDmVwDwskBwan0');
        buyButtonElement.setAttribute('publishable-key', 'pk_live_51Nev8mAGYeUDmVwDqZTc4A8oEaNkEGDMAonp6EAmxzUGluphF3YFFu5t7eL1Ov9ZsIpzXgm6u93zhIGpyW1bjakB00BRo9tUr1');
        container.appendChild(buyButtonElement);
    }

    container.style.display = 'block';
}

/**
 * Masquer le bouton Stripe intégré
 */
function hideEmbeddedStripeButton() {
    const container = document.getElementById('stripeBuyButtonContainer');
    if (!container) return;
    container.style.display = 'none';
}

/**
 * S'assurer que le script Stripe Buy Button est chargé
 */
function ensureStripeScriptLoaded() {
    return new Promise((resolve, reject) => {
        try {
            const scriptContainer = document.getElementById('stripeBuyButtonScript');
            if (!scriptContainer) {
                return reject(new Error('Conteneur pour le script Stripe introuvable.'));
            }

            const isLoaded = scriptContainer.getAttribute('data-loaded') === 'true';
            if (isLoaded) {
                return resolve(true);
            }

            const existingScript = document.querySelector('script[data-stripe-buy-button="true"]');
            if (existingScript) {
                scriptContainer.setAttribute('data-loaded', 'true');
                return resolve(true);
            }

            const script = document.createElement('script');
            script.src = 'https://js.stripe.com/v3/buy-button.js';
            script.async = true;
            script.setAttribute('data-stripe-buy-button', 'true');

            script.onload = () => {
                scriptContainer.setAttribute('data-loaded', 'true');
                resolve(true);
            };

            script.onerror = () => {
                reject(new Error('Impossible de charger le script Stripe.'));
            };

            scriptContainer.appendChild(script);
        } catch (error) {
            reject(error);
        }
    });
}

/**
 * Afficher une alerte
 */
function showAlert(message, type = 'info') {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type}`;
    alertDiv.innerHTML = `
        <i class="fas fa-${type === 'error' ? 'exclamation-circle' : type === 'success' ? 'check-circle' : 'info-circle'}"></i>
        <span>${message}</span>
    `;
    
    document.body.appendChild(alertDiv);
    
    setTimeout(() => {
        alertDiv.classList.add('show');
    }, 10);
    
    setTimeout(() => {
        alertDiv.classList.remove('show');
        setTimeout(() => alertDiv.remove(), 300);
    }, 3000);
}

// Initialiser au chargement
document.addEventListener('DOMContentLoaded', initPremiumPage);

// Exposer les fonctions
window.handlePremiumPurchase = handlePremiumPurchase;
window.initPremiumPage = initPremiumPage;
window.selectTheme = selectTheme;