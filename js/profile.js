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

document.addEventListener('DOMContentLoaded', () => {
    console.log('📄 Profile page chargée');
    
    // Vérifier l'authentification
    auth.onAuthStateChanged(async (currentUser) => {
        if (currentUser) {
            console.log('✅ Utilisateur connecté:', currentUser.email);
            profileState.user = currentUser;
            await loadProfileData();
            initializeEventListeners();
        } else {
            console.log('❌ Utilisateur non connecté');
            window.location.href = 'index.html';
        }
    });

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

function displayProfileData(userData) {
    // Informations personnelles
    document.getElementById('displayNameDisplay').textContent = userData.displayName || 'Non défini';
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
            document.getElementById('displayNameDisplay').textContent = newDisplayName;
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
const style = document.createElement('style');
style.textContent = `
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
document.head.appendChild(style);

console.log('✅ Profile.js chargé');