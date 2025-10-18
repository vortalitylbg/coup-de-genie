// ===========================
// CONFIGURATION & CONSTANTS
// ===========================
const CONFIG = {
    particles: {
        count: 50,
        minSpeed: 20,
        maxSpeed: 60
    },
    stats: {
        updateInterval: 3000
    }
};

// ===========================
// INITIALIZATION
// ===========================
document.addEventListener('DOMContentLoaded', () => {
    initParticles();
    initButtons();
    initStatsAnimation();
    addInteractiveEffects();
});

// ===========================
// PARTICLES ANIMATION
// ===========================
function initParticles() {
    const particlesContainer = document.getElementById('particles');
    
    if (!particlesContainer) return;
    
    for (let i = 0; i < CONFIG.particles.count; i++) {
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
    
    const duration = Math.random() * (CONFIG.particles.maxSpeed - CONFIG.particles.minSpeed) + CONFIG.particles.minSpeed;
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
// BUTTON INTERACTIONS
// ===========================
function initButtons() {
    const btnPlay = document.getElementById('btnPlay');
    const btnDuel = document.getElementById('btnDuel');
    const btnClassement = document.getElementById('btnClassement');
    const btnConnexion = document.getElementById('btnConnexion');
    
    if (btnPlay) {
        btnPlay.addEventListener('click', () => {
            handlePlayClick();
        });
    }
    
    if (btnDuel) {
        btnDuel.addEventListener('click', () => {
            handleDuelClick();
        });
    }
    
    if (btnClassement) {
        btnClassement.addEventListener('click', () => {
            handleClassementClick();
        });
    }
    
    if (btnConnexion) {
        btnConnexion.addEventListener('click', () => {
            handleConnexionClick();
        });
    }
}

function handlePlayClick() {
    const btn = document.getElementById('btnPlay');
    btn.style.transform = 'scale(0.95)';
    
    setTimeout(() => {
        btn.style.transform = '';
        console.log('Lancement du jeu...');
        window.location.href = 'game.html';
    }, 150);
}

function handleDuelClick() {
    const btn = document.getElementById('btnDuel');
    btn.style.transform = 'scale(0.95)';
    
    setTimeout(() => {
        btn.style.transform = '';
        
        // Vérifier si l'utilisateur est connecté
        if (typeof getCurrentUser === 'function') {
            const user = getCurrentUser();
            if (!user) {
                alert('Vous devez être connecté pour jouer en mode duel !');
                showAuthModal();
                return;
            }
        } else {
            // Si Firebase n'est pas encore chargé, attendre un peu
            console.warn('Firebase pas encore chargé, tentative de redirection...');
        }
        
        console.log('Lancement du mode duel...');
        window.location.href = 'duel.html';
    }, 150);
}

function handleClassementClick() {
    const btn = document.getElementById('btnClassement');
    btn.style.transform = 'scale(0.95)';
    
    setTimeout(() => {
        btn.style.transform = '';
        console.log('Affichage du classement...');
        window.location.href = 'leaderboard.html';
    }, 150);
}

function handleConnexionClick() {
    const btn = document.getElementById('btnConnexion');
    btn.style.transform = 'scale(0.95)';
    
    setTimeout(() => {
        btn.style.transform = '';
        console.log('Ouverture de la connexion...');
        showAuthModal();
    }, 150);
}

// ===========================
// AUTH STATE HANDLER
// ===========================
window.onAuthStateChanged = function(isLoggedIn, user, isAdminUser) {
    const btnConnexion = document.getElementById('btnConnexion');
    
    if (!btnConnexion) {
        console.warn('⚠️ Bouton de connexion non trouvé');
        return;
    }
    
    if (isLoggedIn && user) {
        // User is logged in
        console.log('✅ Mise à jour UI - Utilisateur connecté:', user.email);
        
        // Charger les données de profil premium
        loadAndDisplayUserProfile(user, btnConnexion);
        
        // Show admin link if user is admin
        if (isAdminUser) {
            console.log('🛡️ Utilisateur admin détecté - Ajout du bouton Admin');
            addAdminLink();
        }
    } else {
        // User is logged out
        console.log('✅ Mise à jour UI - Utilisateur déconnecté');
        
        // Cloner le bouton pour supprimer tous les gestionnaires d'événements
        const newBtn = btnConnexion.cloneNode(true);
        btnConnexion.parentNode.replaceChild(newBtn, btnConnexion);
        
        // Mettre à jour le contenu
        newBtn.innerHTML = `
            <i class="fas fa-user"></i>
            <span>Connexion</span>
        `;
        
        // Ajouter le gestionnaire de connexion
        newBtn.addEventListener('click', handleConnexionClick);
        
        // Remove admin link if exists
        const adminLink = document.getElementById('adminLink');
        if (adminLink) {
            adminLink.remove();
        }
    }
}

/**
 * Charger et afficher le profil utilisateur avec son icône et couleur
 */
async function loadAndDisplayUserProfile(user, btnConnexion) {
    try {
        // Récupérer les données premium/profil
        const premiumData = await getPremiumData(user.uid);
        
        // Cloner le bouton pour supprimer tous les gestionnaires d'événements
        const newBtn = btnConnexion.cloneNode(true);
        btnConnexion.parentNode.replaceChild(newBtn, btnConnexion);
        
        // Récupérer les infos de l'icône
        let profileImageHTML = '';
        const pseudoName = user.displayName || user.email;
        
        // Construire la couleur du pseudo
        let pseudoColor = premiumData.profileColor || '#ffffff';
        
        // Appliquer la couleur du pseudo si disponible
        if (premiumData.pseudoColor) {
            pseudoColor = premiumData.pseudoColor;
        }
        
        if (premiumData.profileIcon && PROFILE_ICONS && PROFILE_ICONS[premiumData.profileIcon]) {
            const iconData = PROFILE_ICONS[premiumData.profileIcon];
            
            // Afficher l'image PNG au lieu de l'icône générique
            profileImageHTML = `
                <img src="${iconData.image}" alt="${pseudoName}" 
                     style="width: 40px; height: 40px; border-radius: 50%; object-fit: cover; border: 2px solid ${iconData.color};">
                <span style="color: ${pseudoColor};">${pseudoName}</span>
            `;
        } else {
            // Fallback si pas d'icône profil
            profileImageHTML = `
                <i class="fas fa-user-circle"></i>
                <span style="color: ${pseudoColor};">${pseudoName}</span>
            `;
        }
        
        // Mettre à jour le contenu du bouton
        newBtn.innerHTML = profileImageHTML;
        
        // Ajouter le style pour afficher les éléments en flexbox
        newBtn.style.display = 'flex';
        newBtn.style.alignItems = 'center';
        newBtn.style.gap = '0.75rem';
        
        // Ajouter le nouveau gestionnaire qui empêche la propagation
        newBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            showUserMenu(e);
        });
        
        console.log('✅ Profil utilisateur chargé:', {
            profileIcon: premiumData.profileIcon,
            profileColor: premiumData.profileColor
        });
    } catch (error) {
        console.error('❌ Erreur chargement profil utilisateur:', error);
        
        // Fallback : afficher un profil générique en cas d'erreur
        const newBtn = btnConnexion.cloneNode(true);
        btnConnexion.parentNode.replaceChild(newBtn, btnConnexion);
        
        newBtn.innerHTML = `
            <i class="fas fa-user-circle"></i>
            <span>${user.displayName || user.email}</span>
        `;
        
        newBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            showUserMenu(e);
        });
    }
}

function addAdminLink() {
    const header = document.querySelector('.header');
    let adminLink = document.getElementById('adminLink');
    
    if (!adminLink) {
        adminLink = document.createElement('a');
        adminLink.id = 'adminLink';
        adminLink.href = 'admin.html';
        adminLink.className = 'btn-connexion';
        adminLink.style.background = 'linear-gradient(135deg, #ef4444, #f59e0b)';
        adminLink.style.border = 'none';
        adminLink.innerHTML = `
            <i class="fas fa-shield-halved"></i>
            <span>Admin</span>
        `;
        header.insertBefore(adminLink, document.getElementById('btnConnexion'));
    }
}

function showUserMenu(event) {
    // Empêcher la propagation du clic
    if (event) {
        event.stopPropagation();
        event.preventDefault();
    }
    
    // Fermer le menu s'il existe déjà
    const existingMenu = document.querySelector('.user-menu');
    if (existingMenu) {
        existingMenu.remove();
        return;
    }
    
    const menu = document.createElement('div');
    menu.className = 'user-menu';
    menu.innerHTML = `
        <div class="user-menu-content">
            <button class="user-menu-item" onclick="window.location.href='profile.html'">
                <i class="fas fa-user"></i>
                <span>Mon profil</span>
            </button>
            <button class="user-menu-item" onclick="window.location.href='premium.html'">
                <i class="fas fa-crown" style="color: #fbbf24;"></i>
                <span>Premium</span>
            </button>
            <button class="user-menu-item" onclick="handleLogout()">
                <i class="fas fa-sign-out-alt"></i>
                <span>Déconnexion</span>
            </button>
        </div>
    `;
    
    document.body.appendChild(menu);
    
    setTimeout(() => menu.classList.add('show'), 10);
    
    // Close on click outside
    setTimeout(() => {
        document.addEventListener('click', function closeMenu(e) {
            if (!menu.contains(e.target) && !e.target.closest('#btnConnexion')) {
                menu.classList.remove('show');
                setTimeout(() => menu.remove(), 300);
                document.removeEventListener('click', closeMenu);
            }
        });
    }, 100);
}

async function handleLogout() {
    if (confirm('Voulez-vous vraiment vous déconnecter ?')) {
        await signOut();
        location.reload();
    }
}

// ===========================
// AUTH MODAL
// ===========================
function showAuthModal() {
    // Fermer le modal existant s'il y en a un
    const existingModal = document.querySelector('.auth-modal');
    if (existingModal) {
        existingModal.remove();
    }
    
    const modal = document.createElement('div');
    modal.className = 'auth-modal';
    modal.id = 'authModal';
    modal.innerHTML = `
        <div class="auth-modal-overlay"></div>
        <div class="auth-modal-content">
            <button class="auth-modal-close" id="closeAuthModalBtn">
                <i class="fas fa-times"></i>
            </button>
            
            <div class="auth-tabs">
                <button class="auth-tab active" data-tab="login">Connexion</button>
                <button class="auth-tab" data-tab="signup">Inscription</button>
            </div>
            
            <!-- Login Form -->
            <form id="loginForm" class="auth-form active">
                <h2 class="auth-title">
                    <i class="fas fa-sign-in-alt"></i>
                    Connexion
                </h2>
                
                <div class="auth-form-group">
                    <label>Email</label>
                    <input type="email" id="loginEmail" required placeholder="votre@email.com" autocomplete="email">
                </div>
                
                <div class="auth-form-group">
                    <label>Mot de passe</label>
                    <input type="password" id="loginPassword" required placeholder="••••••••" autocomplete="current-password">
                </div>
                
                <button type="submit" class="btn btn-primary auth-submit">
                    <i class="fas fa-sign-in-alt btn-icon"></i>
                    <span class="btn-text">Se connecter</span>
                </button>
                
                <div class="auth-divider">
                    <span>ou</span>
                </div>
                
                <button type="button" class="btn btn-secondary auth-google" id="googleSignInBtn">
                    <i class="fab fa-google btn-icon"></i>
                    <span class="btn-text">Continuer avec Google</span>
                </button>
            </form>
            
            <!-- Signup Form -->
            <form id="signupForm" class="auth-form">
                <h2 class="auth-title">
                    <i class="fas fa-user-plus"></i>
                    Inscription
                </h2>
                
                <div class="auth-form-group">
                    <label>Nom d'utilisateur</label>
                    <input type="text" id="signupName" required placeholder="Votre pseudo" autocomplete="name">
                </div>
                
                <div class="auth-form-group">
                    <label>Email</label>
                    <input type="email" id="signupEmail" required placeholder="votre@email.com" autocomplete="email">
                </div>
                
                <div class="auth-form-group">
                    <label>Mot de passe</label>
                    <input type="password" id="signupPassword" required placeholder="••••••••" minlength="6" autocomplete="new-password">
                </div>
                
                <button type="submit" class="btn btn-primary auth-submit">
                    <i class="fas fa-user-plus btn-icon"></i>
                    <span class="btn-text">S'inscrire</span>
                </button>
                
                <div class="auth-divider">
                    <span>ou</span>
                </div>
                
                <button type="button" class="btn btn-secondary auth-google" id="googleSignUpBtn">
                    <i class="fab fa-google btn-icon"></i>
                    <span class="btn-text">Continuer avec Google</span>
                </button>
            </form>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Attendre que le DOM soit mis à jour
    setTimeout(() => {
        modal.classList.add('show');
        
        // Tab switching
        modal.querySelectorAll('.auth-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                e.preventDefault();
                const tabName = tab.dataset.tab;
                modal.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
                modal.querySelectorAll('.auth-form').forEach(f => f.classList.remove('active'));
                tab.classList.add('active');
                modal.querySelector(`#${tabName}Form`).classList.add('active');
            });
        });
        
        // Form submissions
        const loginForm = modal.querySelector('#loginForm');
        const signupForm = modal.querySelector('#signupForm');
        
        if (loginForm) {
            loginForm.addEventListener('submit', handleLogin);
            console.log('✅ Login form event listener attached');
        }
        
        if (signupForm) {
            signupForm.addEventListener('submit', handleSignup);
            console.log('✅ Signup form event listener attached');
        }
        
        // Google Sign In buttons
        const googleSignInBtn = modal.querySelector('#googleSignInBtn');
        const googleSignUpBtn = modal.querySelector('#googleSignUpBtn');
        
        if (googleSignInBtn) {
            googleSignInBtn.addEventListener('click', handleGoogleSignIn);
        }
        
        if (googleSignUpBtn) {
            googleSignUpBtn.addEventListener('click', handleGoogleSignIn);
        }
        
        // Close button
        const closeBtn = modal.querySelector('#closeAuthModalBtn');
        if (closeBtn) {
            closeBtn.addEventListener('click', closeAuthModal);
        }
        
        // Close on overlay click
        const overlay = modal.querySelector('.auth-modal-overlay');
        if (overlay) {
            overlay.addEventListener('click', closeAuthModal);
        }
        
        console.log('✅ Auth modal initialized');
    }, 10);
}

function closeAuthModal() {
    const modal = document.querySelector('.auth-modal');
    if (modal) {
        modal.classList.remove('show');
        setTimeout(() => modal.remove(), 300);
    }
}

async function handleLogin(e) {
    e.preventDefault();
    console.log('🔐 Tentative de connexion...');
    
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    const submitBtn = e.target.querySelector('.auth-submit');
    
    console.log('📧 Email:', email);
    
    if (!email || !password) {
        alert('Veuillez remplir tous les champs');
        return;
    }
    
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin btn-icon"></i><span class="btn-text">Connexion...</span>';
    
    try {
        const result = await signIn(email, password);
        console.log('📥 Résultat de connexion:', result);
        
        if (result.success) {
            closeAuthModal();
        } else {
            console.error('❌ Erreur de connexion:', result.error);
            alert('Erreur : ' + result.error);
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="fas fa-sign-in-alt btn-icon"></i><span class="btn-text">Se connecter</span>';
        }
    } catch (error) {
        console.error('❌ Exception lors de la connexion:', error);
        alert('Erreur inattendue : ' + error.message);
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="fas fa-sign-in-alt btn-icon"></i><span class="btn-text">Se connecter</span>';
    }
}

async function handleSignup(e) {
    e.preventDefault();
    console.log('📝 Tentative d\'inscription...');
    
    const name = document.getElementById('signupName').value;
    const email = document.getElementById('signupEmail').value;
    const password = document.getElementById('signupPassword').value;
    const submitBtn = e.target.querySelector('.auth-submit');
    
    console.log('👤 Nom:', name);
    console.log('📧 Email:', email);
    
    if (!name || !email || !password) {
        alert('Veuillez remplir tous les champs');
        return;
    }
    
    if (password.length < 6) {
        alert('Le mot de passe doit contenir au moins 6 caractères');
        return;
    }
    
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin btn-icon"></i><span class="btn-text">Inscription...</span>';
    
    try {
        const result = await signUp(email, password, name);
        console.log('📥 Résultat de l\'inscription:', result);
        
        if (result.success) {
            console.log('✅ Inscription réussie !');
            closeAuthModal();
            alert('Inscription réussie ! Bienvenue sur Cérébro !');
        } else {
            console.error('❌ Erreur d\'inscription:', result.error);
            alert('Erreur : ' + result.error);
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="fas fa-user-plus btn-icon"></i><span class="btn-text">S\'inscrire</span>';
        }
    } catch (error) {
        console.error('❌ Exception lors de l\'inscription:', error);
        alert('Erreur inattendue : ' + error.message);
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="fas fa-user-plus btn-icon"></i><span class="btn-text">S\'inscrire</span>';
    }
}

async function handleGoogleSignIn() {
    console.log('🔐 Tentative de connexion avec Google...');
    
    try {
        const result = await signInWithGoogle();
        console.log('📥 Résultat de connexion Google:', result);
        
        if (result.success) {
            console.log('✅ Connexion Google réussie !');
            closeAuthModal();
            alert('Connexion réussie avec Google !');
        } else {
            console.error('❌ Erreur de connexion Google:', result.error);
            alert('Erreur : ' + result.error);
        }
    } catch (error) {
        console.error('❌ Exception lors de la connexion Google:', error);
        alert('Erreur inattendue : ' + error.message);
    }
}

// ===========================
// STATS ANIMATION
// ===========================
function initStatsAnimation() {
    const statNumbers = document.querySelectorAll('.stat-number');
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                animateStatNumber(entry.target);
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.5 });
    
    statNumbers.forEach(stat => observer.observe(stat));
}

function animateStatNumber(element) {
    const finalText = element.textContent;
    const hasComma = finalText.includes(',');
    const hasM = finalText.includes('M');
    
    let finalNumber;
    if (hasM) {
        finalNumber = parseFloat(finalText) * 1000;
    } else {
        finalNumber = parseInt(finalText.replace(/,/g, ''));
    }
    
    if (isNaN(finalNumber)) {
        // Pour les nombres avec décimales (comme 4.8)
        finalNumber = parseFloat(finalText);
        if (isNaN(finalNumber)) return;
    }
    
    const duration = 2000;
    const steps = 60;
    const increment = finalNumber / steps;
    let current = 0;
    let step = 0;
    
    const timer = setInterval(() => {
        current += increment;
        step++;
        
        if (step >= steps) {
            clearInterval(timer);
            element.textContent = finalText;
        } else {
            if (hasM) {
                element.textContent = (current / 1000).toFixed(1) + 'M';
            } else if (hasComma) {
                element.textContent = Math.floor(current).toLocaleString('fr-FR');
            } else if (finalText.includes('.')) {
                element.textContent = (current / 1000).toFixed(1);
            } else {
                element.textContent = Math.floor(current);
            }
        }
    }, duration / steps);
}

// ===========================
// INTERACTIVE EFFECTS
// ===========================
function addInteractiveEffects() {
    // Effet de parallaxe sur le mouvement de la souris
    document.addEventListener('mousemove', (e) => {
        const moveX = (e.clientX - window.innerWidth / 2) * 0.01;
        const moveY = (e.clientY - window.innerHeight / 2) * 0.01;
        
        const title = document.querySelector('.main-title');
        if (title) {
            title.style.transform = `translate(${moveX}px, ${moveY}px)`;
        }
    });
    
    // Effet de hover sur les features
    const features = document.querySelectorAll('.feature');
    features.forEach(feature => {
        feature.addEventListener('mouseenter', () => {
            feature.style.transform = 'translateY(-5px) scale(1.05)';
        });
        
        feature.addEventListener('mouseleave', () => {
            feature.style.transform = '';
        });
    });
    
    // Effet de ripple sur les boutons
    const buttons = document.querySelectorAll('.btn');
    buttons.forEach(button => {
        button.addEventListener('click', function(e) {
            const ripple = document.createElement('span');
            const rect = this.getBoundingClientRect();
            const size = Math.max(rect.width, rect.height);
            const x = e.clientX - rect.left - size / 2;
            const y = e.clientY - rect.top - size / 2;
            
            ripple.style.width = ripple.style.height = size + 'px';
            ripple.style.left = x + 'px';
            ripple.style.top = y + 'px';
            ripple.style.position = 'absolute';
            ripple.style.borderRadius = '50%';
            ripple.style.background = 'rgba(255, 255, 255, 0.5)';
            ripple.style.transform = 'scale(0)';
            ripple.style.animation = 'ripple 0.6s ease-out';
            ripple.style.pointerEvents = 'none';
            
            this.appendChild(ripple);
            
            setTimeout(() => ripple.remove(), 600);
        });
    });
}

// Ajouter l'animation ripple au CSS dynamiquement
const style = document.createElement('style');
style.textContent = `
    @keyframes ripple {
        to {
            transform: scale(4);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// ===========================
// UTILITY FUNCTIONS
// ===========================
function prefersReducedMotion() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

if (prefersReducedMotion()) {
    CONFIG.particles.count = 10;
}

// ===========================
// EASTER EGG
// ===========================
let clickCount = 0;
const logo = document.querySelector('.logo');

if (logo) {
    logo.addEventListener('click', () => {
        clickCount++;
        
        if (clickCount === 5) {
            logo.style.animation = 'pulse 0.5s ease';
            setTimeout(() => {
                logo.style.animation = '';
            }, 500);
            
            console.log('Easter egg trouvé ! Vous êtes un vrai fan de Cluture !');
            
            // Mini explosion de confettis
            createMiniConfetti();
            
            clickCount = 0;
        }
    });
}

function createMiniConfetti() {
    const colors = ['#2563eb', '#7c3aed', '#fbbf24'];
    const logo = document.querySelector('.logo');
    const rect = logo.getBoundingClientRect();
    
    for (let i = 0; i < 20; i++) {
        const confetti = document.createElement('div');
        confetti.style.position = 'fixed';
        confetti.style.left = rect.left + rect.width / 2 + 'px';
        confetti.style.top = rect.top + rect.height / 2 + 'px';
        confetti.style.width = '8px';
        confetti.style.height = '8px';
        confetti.style.background = colors[Math.floor(Math.random() * colors.length)];
        confetti.style.borderRadius = '50%';
        confetti.style.pointerEvents = 'none';
        confetti.style.zIndex = '9999';
        
        const angle = (Math.PI * 2 * i) / 20;
        const velocity = 100 + Math.random() * 100;
        const vx = Math.cos(angle) * velocity;
        const vy = Math.sin(angle) * velocity;
        
        document.body.appendChild(confetti);
        
        let x = 0, y = 0, vy_current = vy;
        const gravity = 500;
        const startTime = Date.now();
        
        function animate() {
            const elapsed = (Date.now() - startTime) / 1000;
            x = vx * elapsed;
            y = vy_current * elapsed + 0.5 * gravity * elapsed * elapsed;
            
            confetti.style.transform = `translate(${x}px, ${y}px)`;
            confetti.style.opacity = Math.max(0, 1 - elapsed);
            
            if (elapsed < 1) {
                requestAnimationFrame(animate);
            } else {
                confetti.remove();
            }
        }
        
        animate();
    }
}

// ===========================
// CONSOLE MESSAGE
// ===========================
console.log('%cCluture Quiz', 'font-size: 24px; font-weight: bold; color: #2563eb;');
console.log('%cBienvenue dans le meilleur quiz de culture générale !', 'font-size: 14px; color: #7c3aed;');
console.log('%cDéveloppé avec passion pour les passionnés de quiz', 'font-size: 12px; color: #94a3b8;');