// ===========================
// PROFILE PAGE - MAIN LOGIC
// ===========================

/**
 * État de la page
 */
const profileState = {
    user: null,
    stats: null,
    loading: false
};

// ===========================
// INITIALIZATION
// ===========================

document.addEventListener('DOMContentLoaded', async () => {
    console.log('📄 Profile page chargée');
    
    // Attendre que Firebase restaure l'authentification
    console.log('⏳ Attente de la restauration de l\'état d\'authentification...');
    const user = await waitForAuthReady();
    
    if (user) {
        console.log('✅ Utilisateur connecté:', user.email);
        profileState.user = user;
        await loadProfileData();
        await loadPremiumData();
        initializeEventListeners();
    } else {
        console.log('❌ Utilisateur non connecté');
        window.location.href = 'index.html';
    }

    // Initialiser les particules
    initParticles();
});

// ===========================
// LOAD PROFILE DATA
// ===========================

async function loadProfileData() {
    try {
        const result = await getUserData(profileState.user.uid);
        
        if (result.success) {
            profileState.stats = result.user;
            displayProfileData(result.user);
            
            // ✨ Afficher le badge premium
            await displayPremiumBadge();
            
            console.log('✅ Données du profil chargées');
        } else {
            showAlert('Erreur lors du chargement du profil', 'error');
            console.error('❌ Erreur:', result.error);
        }
    } catch (error) {
        showAlert('Une erreur est survenue', 'error');
        console.error('❌ Erreur:', error);
    }
}

// ===========================
// DISPLAY PROFILE DATA
// ===========================

/**
 * 🎨 Appliquer la couleur/dégradé du pseudo à un élément
 */
function applyPseudoStyleToElement(element, userData) {
    if (!element || !userData) return;
    
    const pseudoGradient = userData.pseudoGradient;
    const pseudoColor = userData.pseudoColor;
    let shouldApplyGradient = false;
    let gradientStyle = null;
    let solidColor = null;
    
    // Priorité 1 : Dégradé du pseudo
    if (pseudoGradient && pseudoGradient !== 'none' && window.PSEUDO_GRADIENTS && window.PSEUDO_GRADIENTS[pseudoGradient]) {
        gradientStyle = window.PSEUDO_GRADIENTS[pseudoGradient].gradient;
        shouldApplyGradient = true;
    }
    // Priorité 2 : Couleur unie du pseudo
    else if (pseudoColor && window.PSEUDO_COLORS && window.PSEUDO_COLORS[pseudoColor]) {
        solidColor = window.PSEUDO_COLORS[pseudoColor].color;
    }
    // Priorité 3 : Dégradé du profil
    else if (userData.profileIcon && PROFILE_ICONS && PROFILE_ICONS[userData.profileIcon]?.gradient) {
        gradientStyle = PROFILE_ICONS[userData.profileIcon].gradient;
        shouldApplyGradient = true;
    }
    
    if (shouldApplyGradient && gradientStyle) {
        element.style.backgroundImage = gradientStyle;
        element.style.webkitBackgroundClip = 'text';
        element.style.webkitTextFillColor = 'transparent';
        element.style.backgroundClip = 'text';
        element.style.color = '';
    } else if (solidColor) {
        // Réinitialiser les styles de gradient
        element.style.backgroundImage = '';
        element.style.webkitBackgroundClip = '';
        element.style.webkitTextFillColor = '';
        element.style.backgroundClip = '';
        element.style.color = solidColor;
    } else {
        // Réinitialiser tous les styles
        element.style.backgroundImage = '';
        element.style.webkitBackgroundClip = '';
        element.style.webkitTextFillColor = '';
        element.style.backgroundClip = '';
        element.style.color = '';
    }
}

function displayProfileData(userData) {
    // Informations personnelles
    const displayNameElement = document.getElementById('displayNameDisplay');
    displayNameElement.textContent = userData.displayName || 'Non défini';
    
    // Appliquer la couleur/dégradé du pseudo
    applyPseudoStyleToElement(displayNameElement, userData);
    
    document.getElementById('emailDisplay').textContent = userData.email;
    
    // Date d'inscription
    if (userData.createdAt) {
        const date = userData.createdAt.toDate ? userData.createdAt.toDate() : new Date(userData.createdAt);
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        document.getElementById('memberSinceDisplay').textContent = date.toLocaleDateString('fr-FR', options);
    } else {
        document.getElementById('memberSinceDisplay').textContent = 'N/A';
    }

    // Statistiques
    document.getElementById('gamesPlayedStat').textContent = userData.gamesPlayed || 0;
    document.getElementById('bestScoreStat').textContent = userData.bestScore || 0;
    document.getElementById('averageScoreStat').textContent = userData.averageScore || 0;
    document.getElementById('eloStat').textContent = userData.elo || 1000;
    document.getElementById('duelsPlayedStat').textContent = userData.duelsPlayed || 0;
    document.getElementById('duelsWonStat').textContent = userData.duelsWon || 0;

    // Pré-remplir le champ du pseudo
    document.getElementById('newDisplayName').placeholder = userData.displayName || 'Votre nouveau pseudo';
}

/**
 * ✨ Afficher le badge Premium si l'utilisateur est premium
 */
async function displayPremiumBadge() {
    try {
        const isPremiumUser = await isPremium(profileState.user.uid);
        const badgeContainer = document.getElementById('premiumBadgeContainer');
        
        if (isPremiumUser && badgeContainer) {
            badgeContainer.style.display = 'block';
            console.log('✨ Badge premium affiché');
        }
    } catch (error) {
        console.error('❌ Erreur affichage badge premium:', error);
    }
}

// ===========================
// EVENT LISTENERS
// ===========================

function initializeEventListeners() {
    // Formulaire mise à jour profil
    const updateProfileForm = document.getElementById('updateProfileForm');
    if (updateProfileForm) {
        updateProfileForm.addEventListener('submit', handleUpdateProfile);
    }

    // Formulaire changement mot de passe
    const changePasswordForm = document.getElementById('changePasswordForm');
    if (changePasswordForm) {
        changePasswordForm.addEventListener('submit', handleChangePassword);
    }

    // Bouton déconnexion
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }

    // Bouton suppression compte
    const deleteAccountBtn = document.getElementById('deleteAccountBtn');
    if (deleteAccountBtn) {
        deleteAccountBtn.addEventListener('click', handleDeleteAccount);
    }
}

// ===========================
// LOAD PREMIUM DATA
// ===========================

async function loadPremiumData() {
    try {
        const premium = await isPremium(profileState.user.uid);
        const premiumData = await getPremiumData(profileState.user.uid);

        if (premium) {
            // Afficher la section premium
            document.getElementById('premiumSection').style.display = 'block';
            document.getElementById('premiumUpgradeSection').style.display = 'none';
            
            // Afficher les stats avancées
            document.getElementById('advancedStatsSection').style.display = 'block';
            
            // Charger les stats avancées
            await displayAdvancedStats();

            // Charger les thèmes
            displayThemes(premiumData.theme);

            // Charger les icônes
            displayIcons(premiumData.profileIcon);

            // Charger les couleurs unies du pseudo
            displayPseudoColors(premiumData.pseudoColor);

            // Charger les dégradés de couleur
            displayPseudoGradients(premiumData.pseudoGradient);
        } else {
            // Afficher la section upgrade
            document.getElementById('premiumSection').style.display = 'none';
            document.getElementById('premiumUpgradeSection').style.display = 'block';
            document.getElementById('advancedStatsSection').style.display = 'none';
        }
    } catch (error) {
        console.error('❌ Erreur chargement données premium:', error);
    }
}

// ===========================
// ADVANCED STATS
// ===========================

/**
 * Afficher les stats avancées pour les utilisateurs premium
 */
async function displayAdvancedStats() {
    try {
        const userData = profileState.stats;
        
        // Calculer les stats
        const totalPlayTime = (userData.totalPlayTime || 0) / 60; // en heures
        const accuracyRate = userData.accuracyRate || 0;
        const winrate = userData.duelsPlayed > 0 ? Math.round((userData.duelsWon / userData.duelsPlayed) * 100) : 0;
        const streakBest = userData.streakBest || 0;
        
        // Afficher les stats synthétiques
        document.getElementById('totalPlayTimeStat').textContent = totalPlayTime.toFixed(1) + 'h';
        document.getElementById('accuracyRateStat').textContent = accuracyRate.toFixed(1) + '%';
        document.getElementById('streakStat').textContent = streakBest;
        document.getElementById('winrateStat').textContent = winrate + '%';
        
        // Créer les graphiques
        createEloChart(userData);
        createWinrateChart(userData);
        createCategoryChart(userData);
        
        console.log('✅ Stats avancées affichées');
    } catch (error) {
        console.error('❌ Erreur affichage stats avancées:', error);
    }
}

/**
 * Créer le graphique d'évolution ELO
 */
function createEloChart(userData) {
    const ctx = document.getElementById('eloChart');
    if (!ctx) return;
    
    // Générer des données d'évolution ELO
    const eloHistory = userData.eloHistory || [1000];
    // S'assurer qu'il y a au moins 2 points pour le graphique
    if (eloHistory.length === 1) {
        eloHistory.push(userData.elo || 1000);
    }
    const labels = eloHistory.map((_, i) => i + 1);
    
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'ELO',
                data: eloHistory,
                borderColor: '#7c3aed',
                backgroundColor: 'rgba(124, 58, 237, 0.1)',
                borderWidth: 2,
                tension: 0.4,
                fill: true,
                pointRadius: 4,
                pointBackgroundColor: '#7c3aed',
                pointBorderColor: '#fff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: { display: false }
            },
            scales: {
                y: {
                    beginAtZero: false,
                    grid: { color: 'rgba(124, 58, 237, 0.1)' },
                    ticks: { color: '#cbd5e1' }
                },
                x: {
                    grid: { color: 'rgba(124, 58, 237, 0.1)' },
                    ticks: { color: '#cbd5e1' }
                }
            }
        }
    });
}

/**
 * Créer le graphique de taux de victoire
 */
function createWinrateChart(userData) {
    const ctx = document.getElementById('winrateChart');
    if (!ctx) return;
    
    const wins = userData.duelsWon || 0;
    const losses = userData.duelsLost || 0;
    
    // Si aucun duel, afficher un message
    if (wins === 0 && losses === 0) {
        ctx.style.display = 'none';
        ctx.parentElement.innerHTML += '<p style="color: var(--text-secondary); text-align: center; padding: 2rem;">Commencez vos premiers duels pour voir votre statistique !</p>';
        return;
    }
    
    new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Victoires', 'Défaites'],
            datasets: [{
                data: [wins, losses],
                backgroundColor: ['#10b981', '#ef4444'],
                borderColor: 'rgba(15, 23, 42, 1)',
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    labels: {
                        color: '#cbd5e1'
                    }
                }
            }
        }
    });
}

/**
 * Créer le graphique des performances par catégorie
 */
function createCategoryChart(userData) {
    const ctx = document.getElementById('categoryChart');
    if (!ctx) return;
    
    const categoryStats = userData.categoryStats || {};
    const categories = Object.keys(categoryStats);
    
    if (categories.length === 0) {
        // Afficher un message si pas de données
        ctx.style.display = 'none';
        ctx.previousElementSibling.innerHTML += '<p style="color: var(--text-secondary); text-align: center; padding: 2rem;">Pas encore de données. Jouez quelques parties pour voir vos stats par catégorie!</p>';
        return;
    }
    
    const scores = categories.map(cat => categoryStats[cat].averageScore || 0);
    
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: categories,
            datasets: [{
                label: 'Score moyen',
                data: scores,
                backgroundColor: [
                    '#7c3aed', '#3b82f6', '#10b981', '#f59e0b', 
                    '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899'
                ],
                borderRadius: 8,
                borderSkipped: false
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            indexAxis: 'y',
            plugins: {
                legend: { display: false }
            },
            scales: {
                x: {
                    grid: { color: 'rgba(124, 58, 237, 0.1)' },
                    ticks: { color: '#cbd5e1' }
                },
                y: {
                    grid: { display: false },
                    ticks: { color: '#cbd5e1' }
                }
            }
        }
    });
}

/**
 * Afficher les thèmes disponibles
 */
function displayThemes(currentTheme) {
    const container = document.getElementById('themesGrid');
    if (!container) return;

    const themes = getAvailableThemes(true); // true = utilisateur premium
    
    container.innerHTML = Object.entries(themes).map(([key, theme]) => `
        <div class="theme-card ${currentTheme === key ? 'active' : ''}" 
             data-theme="${key}"
             style="
                 padding: 1rem;
                 background: ${theme.colors.background};
                 border-radius: 12px;
                 border: 2px solid ${currentTheme === key ? '#fbbf24' : 'transparent'};
                 cursor: pointer;
                 transition: all 0.3s ease;
             ">
            <div style="font-size: 2rem; margin-bottom: 0.5rem;">${theme.icon}</div>
            <div style="font-size: 0.85rem; color: var(--text-primary);">${theme.name}</div>
        </div>
    `).join('');

    // Ajouter les écouteurs
    container.querySelectorAll('.theme-card').forEach(card => {
        card.addEventListener('click', async (e) => {
            const theme = e.currentTarget.dataset.theme;
            await handleThemeChange(theme);
        });
    });
}

/**
 * Afficher les icônes disponibles
 */
function displayIcons(currentIcon) {
    const container = document.getElementById('iconsGrid');
    if (!container) return;

    const icons = getAvailableIcons(true); // true = utilisateur premium
    
    container.innerHTML = Object.entries(icons).map(([key, icon]) => `
        <div class="icon-card ${currentIcon === key ? 'active' : ''}" 
             data-icon="${key}"
             style="
                 padding: 0.75rem;
                 background: var(--bg-card);
                 border-radius: 12px;
                 border: 2px solid ${currentIcon === key ? 'var(--accent-gold)' : 'var(--border-color)'};
                 cursor: pointer;
                 transition: all 0.3s ease;
                 text-align: center;
                 display: flex;
                 flex-direction: column;
                 align-items: center;
                 justify-content: center;
                 gap: 0.5rem;
             ">
            <img src="${icon.image}" alt="${icon.name}" style="width: 50px; height: 50px; border-radius: 50%; object-fit: cover; border: 2px solid ${icon.color}; display: block;">
            <div style="font-size: 0.8rem; color: var(--text-secondary);">${icon.name}</div>
        </div>
    `).join('');

    // Ajouter les écouteurs
    container.querySelectorAll('.icon-card').forEach(card => {
        card.addEventListener('click', async (e) => {
            const icon = e.currentTarget.dataset.icon;
            await handleIconChange(icon);
        });
    });
}

/**
 * Gérer le changement de thème
 */
async function handleThemeChange(themeName) {
    try {
        const result = await updateUserTheme(profileState.user.uid, themeName);
        
        if (result.success) {
            applyTheme(themeName);
            showAlert('Thème appliqué avec succès !', 'success');
            displayThemes(themeName);
        } else {
            showAlert('Erreur lors du changement de thème', 'error');
        }
    } catch (error) {
        console.error('❌ Erreur:', error);
        showAlert('Une erreur est survenue', 'error');
    }
}

/**
 * Gérer le changement d'icône
 */
async function handleIconChange(iconName) {
    try {
        const result = await updateProfileIcon(profileState.user.uid, iconName);
        
        if (result.success) {
            showAlert('Icône mise à jour avec succès !', 'success');
            displayIcons(iconName);
            
            // Mettre à jour le bouton de profil dans le header
            if (typeof loadAndDisplayUserProfile === 'function') {
                await loadAndDisplayUserProfile(profileState.user, document.getElementById('btnConnexion'));
            }
        } else {
            showAlert('Erreur lors du changement d\'icône', 'error');
        }
    } catch (error) {
        console.error('❌ Erreur:', error);
        showAlert('Une erreur est survenue', 'error');
    }
}

/**
 * Afficher les dégradés de couleur disponibles pour le pseudo
 */
function displayPseudoGradients(currentGradient) {
    const container = document.getElementById('pseudoGradientsGrid');
    if (!container) return;

    const gradients = getPseudoGradients();
    
    container.innerHTML = Object.entries(gradients).map(([key, gradient]) => `
        <div class="pseudo-gradient-card ${currentGradient === key ? 'active' : ''}" 
             data-gradient="${key}"
             style="
                 padding: 1rem;
                 border-radius: 12px;
                 border: 3px solid ${currentGradient === key ? '#fbbf24' : '#444'};
                 cursor: pointer;
                 transition: all 0.3s ease;
                 display: flex;
                 flex-direction: column;
                 align-items: center;
                 justify-content: center;
                 gap: 0.5rem;
                 min-height: 100px;
                 background: var(--bg-card);
             ">
            <div style="
                font-size: 1.5rem;
                font-weight: 700;
                background: ${gradient.gradient};
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                background-clip: text;
                letter-spacing: 2px;
            ">Pseudo</div>
            <div style="font-size: 0.75rem; color: var(--text-secondary); font-weight: 600;">${gradient.name}</div>
        </div>
    `).join('');

    // Ajouter les écouteurs
    container.querySelectorAll('.pseudo-gradient-card').forEach(card => {
        card.addEventListener('click', async (e) => {
            const gradientKey = e.currentTarget.dataset.gradient;
            await handlePseudoGradientChange(gradientKey);
        });
    });
}

/**
 * Afficher les couleurs unies disponibles pour le pseudo
 */
function displayPseudoColors(currentColor) {
    const container = document.getElementById('pseudoColorsGrid');
    if (!container) return;

    const colors = getPseudoColors();
    
    container.innerHTML = Object.entries(colors).map(([key, color]) => `
        <div class="pseudo-color-card ${currentColor === key ? 'active' : ''}" 
             data-color="${key}"
             style="
                 padding: 1rem;
                 border-radius: 12px;
                 border: 3px solid ${currentColor === key ? '#fbbf24' : '#444'};
                 cursor: pointer;
                 transition: all 0.3s ease;
                 display: flex;
                 flex-direction: column;
                 align-items: center;
                 justify-content: center;
                 gap: 0.5rem;
                 min-height: 100px;
                 background: var(--bg-card);
             ">
            <div style="
                font-size: 1.5rem;
                font-weight: 700;
                color: ${color.color};
                letter-spacing: 2px;
            ">Pseudo</div>
            <div style="font-size: 0.75rem; color: var(--text-secondary); font-weight: 600;">${color.name}</div>
        </div>
    `).join('');

    // Ajouter les écouteurs
    container.querySelectorAll('.pseudo-color-card').forEach(card => {
        card.addEventListener('click', async (e) => {
            const colorKey = e.currentTarget.dataset.color;
            await handlePseudoColorChange(colorKey);
        });
    });
}

/**
 * Gérer le changement de couleur unie du pseudo
 */
async function handlePseudoColorChange(colorKey) {
    try {
        // Sauvegarder la couleur
        const colorResult = await updateProfilePseudoColor(profileState.user.uid, colorKey);
        
        // Vider le dégradé dans Firebase pour assurer l'exclusivité
        const gradientResult = await updateProfileGradient(profileState.user.uid, null);
        
        if (colorResult.success && gradientResult.success) {
            showAlert('Couleur du pseudo mise à jour ! 🎨', 'success');
            
            // Mettre à jour l'état local et réinitialiser le dégradé
            profileState.stats.pseudoColor = colorKey;
            profileState.stats.pseudoGradient = null;
            
            // Réappliquer la couleur au pseudo affiché
            const displayNameElement = document.getElementById('displayNameDisplay');
            applyPseudoStyleToElement(displayNameElement, profileState.stats);
            
            // Rafraîchir l'affichage des cartes de couleur et dégradé
            displayPseudoColors(colorKey);
            displayPseudoGradients(null);
            
            // Mettre à jour le bouton de profil dans le header
            if (typeof loadAndDisplayUserProfile === 'function') {
                await loadAndDisplayUserProfile(profileState.user, document.getElementById('btnConnexion'));
            }
        } else {
            showAlert('Erreur lors du changement de couleur', 'error');
        }
    } catch (error) {
        console.error('❌ Erreur:', error);
        showAlert('Une erreur est survenue', 'error');
    }
}

/**
 * Gérer le changement de dégradé du pseudo
 */
async function handlePseudoGradientChange(gradientKey) {
    try {
        // Sauvegarder le dégradé
        const gradientResult = await updateProfileGradient(profileState.user.uid, gradientKey);
        
        // Vider la couleur dans Firebase pour assurer l'exclusivité
        const colorResult = await updateProfilePseudoColor(profileState.user.uid, null);
        
        if (gradientResult.success && colorResult.success) {
            showAlert('Dégradé du pseudo mis à jour ! 🌈', 'success');
            
            // Mettre à jour l'état local et réinitialiser la couleur unie
            profileState.stats.pseudoGradient = gradientKey;
            profileState.stats.pseudoColor = null;
            
            // Réappliquer le dégradé au pseudo affiché
            const displayNameElement = document.getElementById('displayNameDisplay');
            applyPseudoStyleToElement(displayNameElement, profileState.stats);
            
            // Rafraîchir l'affichage des cartes de couleur et dégradé
            displayPseudoGradients(gradientKey);
            displayPseudoColors(null);
            
            // Mettre à jour le bouton de profil dans le header
            if (typeof loadAndDisplayUserProfile === 'function') {
                await loadAndDisplayUserProfile(profileState.user, document.getElementById('btnConnexion'));
            }
        } else {
            showAlert('Erreur lors du changement de dégradé', 'error');
        }
    } catch (error) {
        console.error('❌ Erreur:', error);
        showAlert('Une erreur est survenue', 'error');
    }
}

// ===========================
// UPDATE PROFILE HANDLER
// ===========================

async function handleUpdateProfile(e) {
    e.preventDefault();

    const newDisplayName = document.getElementById('newDisplayName').value.trim();
    const btn = document.getElementById('updateProfileBtn');

    // Validation
    if (!newDisplayName || newDisplayName.length < 3) {
        showAlert('Le pseudo doit contenir au moins 3 caractères', 'error');
        return;
    }

    if (newDisplayName.length > 30) {
        showAlert('Le pseudo ne doit pas dépasser 30 caractères', 'error');
        return;
    }

    // Vérifier si le pseudo est identique à l'actuel
    if (newDisplayName === profileState.stats.displayName) {
        showAlert('Le nouveau pseudo est identique à l\'ancien', 'info');
        return;
    }

    setButtonLoading(btn, true);

    try {
        const result = await updateUserDisplayName(newDisplayName);

        if (result.success) {
            showAlert('Pseudo mis à jour avec succès !', 'success');
            profileState.stats.displayName = newDisplayName;
            const displayNameElement = document.getElementById('displayNameDisplay');
            displayNameElement.textContent = newDisplayName;
            applyPseudoStyleToElement(displayNameElement, profileState.stats);
            document.getElementById('newDisplayName').value = '';
            document.getElementById('newDisplayName').placeholder = newDisplayName;
        } else {
            showAlert(result.error || 'Erreur lors de la mise à jour', 'error');
        }
    } catch (error) {
        console.error('❌ Erreur:', error);
        showAlert('Une erreur est survenue', 'error');
    } finally {
        setButtonLoading(btn, false);
    }
}

// ===========================
// CHANGE PASSWORD HANDLER
// ===========================

async function handleChangePassword(e) {
    e.preventDefault();

    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const btn = document.getElementById('changePasswordBtn');

    // Validation
    if (!currentPassword || !newPassword || !confirmPassword) {
        showAlert('Tous les champs sont requis', 'error');
        return;
    }

    if (newPassword.length < 6) {
        showAlert('Le nouveau mot de passe doit contenir au moins 6 caractères', 'error');
        return;
    }

    if (newPassword !== confirmPassword) {
        showAlert('Les mots de passe ne correspondent pas', 'error');
        return;
    }

    if (currentPassword === newPassword) {
        showAlert('Le nouveau mot de passe doit être différent du mot de passe actuel', 'error');
        return;
    }

    setButtonLoading(btn, true);

    try {
        const result = await updateUserPassword(currentPassword, newPassword);

        if (result.success) {
            showAlert('Mot de passe mis à jour avec succès !', 'success');
            document.getElementById('changePasswordForm').reset();
        } else {
            showAlert(result.error || 'Erreur lors de la mise à jour', 'error');
        }
    } catch (error) {
        console.error('❌ Erreur:', error);
        showAlert('Une erreur est survenue', 'error');
    } finally {
        setButtonLoading(btn, false);
    }
}

// ===========================
// LOGOUT HANDLER
// ===========================

async function handleLogout() {
    if (confirm('Êtes-vous sûr de vouloir vous déconnecter ?')) {
        try {
            await signOut();
            console.log('✅ Déconnexion réussie');
            window.location.href = 'index.html';
        } catch (error) {
            console.error('❌ Erreur:', error);
            showAlert('Erreur lors de la déconnexion', 'error');
        }
    }
}

// ===========================
// DELETE ACCOUNT HANDLER
// ===========================

async function handleDeleteAccount() {
    const confirmation = prompt(
        'ATTENTION : Cette action est irréversible et supprimera définitivement votre compte et toutes vos données.\n\nTapez "SUPPRIMER" pour confirmer'
    );

    if (confirmation !== 'SUPPRIMER') {
        if (confirmation !== null) {
            showAlert('Suppression annulée', 'info');
        }
        return;
    }

    const btn = document.getElementById('deleteAccountBtn');
    setButtonLoading(btn, true);

    try {
        const result = await deleteUserAccount();

        if (result.success) {
            showAlert('Compte supprimé. Redirection...', 'success');
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 2000);
        } else {
            showAlert(result.error || 'Erreur lors de la suppression', 'error');
        }
    } catch (error) {
        console.error('❌ Erreur:', error);
        showAlert('Une erreur est survenue', 'error');
    } finally {
        setButtonLoading(btn, false);
    }
}

// ===========================
// UTILITY FUNCTIONS
// ===========================

/**
 * Afficher une alerte
 */
function showAlert(message, type = 'info') {
    const container = document.getElementById('alertContainer');
    
    const alert = document.createElement('div');
    alert.className = `alert alert-${type}`;
    
    const iconMap = {
        success: 'fa-check-circle',
        error: 'fa-exclamation-circle',
        info: 'fa-info-circle'
    };
    
    alert.innerHTML = `
        <i class="fas ${iconMap[type] || 'fa-info-circle'}"></i>
        <span>${message}</span>
    `;
    
    container.appendChild(alert);
    
    // Supprimer l'alerte après 5 secondes
    setTimeout(() => {
        alert.style.animation = 'fadeOut 0.3s ease';
        setTimeout(() => alert.remove(), 300);
    }, 5000);
}

/**
 * Gérer l'état de chargement du bouton
 */
function setButtonLoading(btn, loading) {
    if (loading) {
        btn.classList.add('loading');
        btn.disabled = true;
    } else {
        btn.classList.remove('loading');
        btn.disabled = false;
    }
}

/**
 * Initialiser les particules
 */
function initParticles() {
    const particlesContainer = document.getElementById('particles');
    if (!particlesContainer) return;

    const particleCount = 30;
    for (let i = 0; i < particleCount; i++) {
        createParticle(particlesContainer);
    }
}

function createParticle(container) {
    const particle = document.createElement('div');
    particle.className = 'particle';
    
    particle.style.left = Math.random() * 100 + '%';
    
    const size = Math.random() * 4 + 2;
    particle.style.width = size + 'px';
    particle.style.height = size + 'px';
    
    const duration = Math.random() * 40 + 20;
    particle.style.animationDuration = duration + 's';
    particle.style.animationDelay = Math.random() * 5 + 's';
    
    const colors = ['#2563eb', '#7c3aed', '#fbbf24', '#3b82f6'];
    particle.style.background = colors[Math.floor(Math.random() * colors.length)];
    
    container.appendChild(particle);
    
    particle.addEventListener('animationiteration', () => {
        particle.style.left = Math.random() * 100 + '%';
    });
}

// ===========================
// ANIMATIONS
// ===========================

// Animation de sortie
const fadeOutStyle = document.createElement('style');
fadeOutStyle.textContent = `
    @keyframes fadeOut {
        from {
            opacity: 1;
            transform: translateY(0);
        }
        to {
            opacity: 0;
            transform: translateY(-10px);
        }
    }
`;
document.head.appendChild(fadeOutStyle);

console.log('✅ Profile.js chargé');