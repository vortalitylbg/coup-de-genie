// ===========================
// FIREBASE CONFIGURATION
// ===========================

// Configuration Firebase
const firebaseConfig = {
    apiKey: "AIzaSyCSF-_hzGJBiNKjAWT3CGuld5mRQU6SfSk",
    authDomain: "cerebro-e9e4a.firebaseapp.com",
    projectId: "cerebro-e9e4a",
    storageBucket: "cerebro-e9e4a.firebasestorage.app",
    messagingSenderId: "532559359729",
    appId: "1:532559359729:web:d6fd744497c426966dc350",
    measurementId: "G-KLCW6ETCGT"
};

// Initialiser Firebase
try {
    firebase.initializeApp(firebaseConfig);
    console.log('🔥 Firebase initialisé');
} catch (error) {
    console.error('❌ Erreur d\'initialisation Firebase:', error);
}

// Initialiser les services
const auth = firebase.auth();
const db = firebase.firestore();
const analytics = firebase.analytics();
const ADSENSE_CLIENT_ID = 'ca-pub-6310403411998518';
const CONSENT_STORAGE_KEY = 'cg_ads_consent';
let consentPreferencesButton = null;

console.log('✅ Services Firebase initialisés:', {
    auth: !!auth,
    db: !!db,
    analytics: !!analytics
});

// ===========================
// AUTHENTICATION FUNCTIONS
// ===========================

/**
 * Connexion avec email et mot de passe
 */
async function signIn(email, password) {
    try {
        const userCredential = await auth.signInWithEmailAndPassword(email, password);
        console.log('✅ Connexion réussie:', userCredential.user.email);
        return { success: true, user: userCredential.user };
    } catch (error) {
        console.error('❌ Erreur de connexion:', error);
        return { success: false, error: getErrorMessage(error.code) };
    }
}

/**
 * Inscription avec email et mot de passe
 */
async function signUp(email, password, displayName) {
    try {
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        const user = userCredential.user;
        
        // Mettre à jour le profil avec le nom d'affichage
        await user.updateProfile({
            displayName: displayName
        });
        
        // Créer le document utilisateur dans Firestore
        await db.collection('users').doc(user.uid).set({
            email: email,
            displayName: displayName,
            isAdmin: false,
            gamesPlayed: 0,
            totalScore: 0,
            bestScore: 0,
            elo: 100,
            duelsPlayed: 0,
            duelsWon: 0,
            duelsLost: 0,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            // Premium fields
            hasPremium: false,
            premiumExpiry: null,
            theme: 'default',
            profileIcon: 'icon1',
            profileColor: '#8b5cf6',
            tournaments: [],
            achievements: [],
            stripeCustomerId: null,
            // Advanced stats fields
            gameHistory: [],
            categoryStats: {},
            lastPlayedDate: null,
            totalPlayTime: 0,
            streakCurrent: 0,
            streakBest: 0,
            accuracyRate: 0,
            averageScore: 0,
            eloHistory: [100],
            rankHistory: []
        });
        
        console.log('✅ Inscription réussie:', user.email);
        return { success: true, user: user };
    } catch (error) {
        console.error('❌ Erreur d\'inscription:', error);
        return { success: false, error: getErrorMessage(error.code) };
    }
}

/**
 * Connexion avec Google
 */
async function signInWithGoogle() {
    try {
        const provider = new firebase.auth.GoogleAuthProvider();
        const result = await auth.signInWithPopup(provider);
        const user = result.user;
        
        // Vérifier si c'est la première connexion
        const userDoc = await db.collection('users').doc(user.uid).get();
        
        if (!userDoc.exists) {
            // Créer le document utilisateur
            await db.collection('users').doc(user.uid).set({
                email: user.email,
                displayName: user.displayName,
                isAdmin: false,
                gamesPlayed: 0,
                totalScore: 0,
                bestScore: 0,
                elo: 100,
                duelsPlayed: 0,
                duelsWon: 0,
                duelsLost: 0,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                // Premium fields
                hasPremium: false,
                premiumExpiry: null,
                theme: 'default',
                profileIcon: 'icon1',
                profileColor: '#8b5cf6',
                tournaments: [],
                achievements: [],
                stripeCustomerId: null,
                // Advanced stats fields
                gameHistory: [],
                categoryStats: {},
                lastPlayedDate: null,
                totalPlayTime: 0,
                streakCurrent: 0,
                streakBest: 0,
                accuracyRate: 0,
                averageScore: 0,
                eloHistory: [100],
                rankHistory: []
            });
        }
        
        console.log('✅ Connexion Google réussie:', user.email);
        return { success: true, user: user };
    } catch (error) {
        console.error('❌ Erreur de connexion Google:', error);
        return { success: false, error: getErrorMessage(error.code) };
    }
}

/**
 * Déconnexion
 */
async function signOut() {
    try {
        await auth.signOut();
        console.log('✅ Déconnexion réussie');
        return { success: true };
    } catch (error) {
        console.error('❌ Erreur de déconnexion:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Obtenir l'utilisateur actuel
 */
function getCurrentUser() {
    return auth.currentUser;
}

function getSafeDisplayName(rawName, uid) {
    if (rawName && rawName.trim()) {
        return rawName.trim();
    }
    if (uid) {
        const suffix = uid.replace(/[^a-zA-Z0-9]/g, '').slice(-6).toUpperCase();
        if (suffix) {
            return `Joueur-${suffix}`;
        }
    }
    return 'Joueur-Anonyme';
}

function loadAdSenseScript() {
    if (window.__adsenseLoaded) {
        return;
    }
    window.adsbygoogle = window.adsbygoogle || [];
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT_ID}`;
    script.crossOrigin = 'anonymous';
    document.head.appendChild(script);
    window.__adsenseLoaded = true;
}

function setConsentBannerVisibility(banner, visible) {
    if (!banner) {
        return;
    }
    banner.setAttribute('data-visible', visible ? 'true' : 'false');
    if (consentPreferencesButton) {
        consentPreferencesButton.style.display = visible ? 'none' : 'inline-flex';
    }
}

function ensureConsentPreferencesTrigger() {
    if (consentPreferencesButton || !document.body) {
        return;
    }
    const button = document.createElement('button');
    button.id = 'consentPreferencesButton';
    button.className = 'consent-preferences-button';
    button.type = 'button';
    button.textContent = 'Gestion des cookies';
    button.addEventListener('click', function () {
        const banner = createConsentBanner();
        setConsentBannerVisibility(banner, true);
    });
    const banner = document.getElementById('consentBanner');
    if (banner && banner.getAttribute('data-visible') === 'true') {
        button.style.display = 'none';
    } else {
        button.style.display = 'inline-flex';
    }
    consentPreferencesButton = button;
    document.body.appendChild(button);
}

function handleConsentDecision(value) {
    try {
        localStorage.setItem(CONSENT_STORAGE_KEY, value);
    } catch (error) {
        console.warn('Stockage du consentement indisponible', error);
    }
    if (value === 'granted') {
        loadAdSenseScript();
    } else {
        const existingScript = document.querySelector('script[src*="googlesyndication.com/pagead/js/adsbygoogle.js"]');
        if (existingScript && existingScript.parentNode) {
            existingScript.parentNode.removeChild(existingScript);
        }
        window.__adsenseLoaded = false;
        if (window.adsbygoogle && Array.isArray(window.adsbygoogle)) {
            window.adsbygoogle.length = 0;
        }
    }
    const banner = document.getElementById('consentBanner');
    setConsentBannerVisibility(banner, false);
    ensureConsentPreferencesTrigger();
}

function createConsentBanner() {
    if (!document.body) {
        return null;
    }
    let banner = document.getElementById('consentBanner');
    if (banner) {
        return banner;
    }
    banner = document.createElement('div');
    banner.id = 'consentBanner';
    banner.className = 'consent-banner';
    banner.setAttribute('data-visible', 'false');
    banner.innerHTML = `
        <div class="consent-banner-content">
            <div>
                <h3 class="consent-banner-title">Gestion des cookies</h3>
                <p class="consent-banner-text">Nous utilisons des cookies afin d'afficher des annonces Google AdSense. Vous pouvez accepter pour activer la publicité personnalisée ou refuser pour continuer sans annonces ciblées.</p>
            </div>
            <div class="consent-banner-actions">
                <button type="button" class="consent-button consent-button-primary" data-action="accept">Accepter et continuer</button>
                <button type="button" class="consent-button consent-button-secondary" data-action="reject">Continuer sans publicité personnalisée</button>
            </div>
            <a class="consent-banner-link" href="privacy.html">En savoir plus</a>
        </div>
    `;
    document.body.appendChild(banner);
    const acceptButton = banner.querySelector('[data-action="accept"]');
    const rejectButton = banner.querySelector('[data-action="reject"]');
    if (acceptButton) {
        acceptButton.addEventListener('click', function () {
            handleConsentDecision('granted');
        });
    }
    if (rejectButton) {
        rejectButton.addEventListener('click', function () {
            handleConsentDecision('denied');
        });
    }
    return banner;
}

function initializeAdConsent() {
    let stored = null;
    try {
        stored = localStorage.getItem(CONSENT_STORAGE_KEY);
    } catch (error) {
        console.warn('Lecture du consentement indisponible', error);
    }
    if (stored === 'granted') {
        loadAdSenseScript();
        ensureConsentPreferencesTrigger();
        return;
    }
    if (stored === 'denied') {
        window.adsbygoogle = window.adsbygoogle || [];
        window.adsbygoogle.length = 0;
        ensureConsentPreferencesTrigger();
        return;
    }
    const banner = createConsentBanner();
    setConsentBannerVisibility(banner, true);
}

document.addEventListener('DOMContentLoaded', function () {
    initializeAdConsent();
});

/**
 * Attendre que Firebase restaure l'état d'authentification
 * Résout avec l'utilisateur actuel ou null après le délai d'attente
 */
async function waitForAuthReady(timeoutMs = 3000) {
    return new Promise((resolve) => {
        let hasResolved = false;
        
        // Attendre le prochain changement d'état d'authentification
        // C'est le seul moyen de s'assurer que Firebase a restauré l'authentification
        const unsubscribe = auth.onAuthStateChanged((user) => {
            if (!hasResolved) {
                hasResolved = true;
                unsubscribe(); // Arrêter d'écouter après le premier changement
                console.log('✅ Firebase auth ready, user:', user ? user.email : 'null');
                resolve(user);
            }
        });
        
        // Timeout pour éviter une attente infinie
        setTimeout(() => {
            if (!hasResolved) {
                hasResolved = true;
                unsubscribe();
                console.warn('⏱️ Timeout waitForAuthReady - retour null');
                resolve(auth.currentUser);
            }
        }, timeoutMs);
    });
}

/**
 * Vérifier si l'utilisateur est admin
 */
async function isAdmin(userId) {
    try {
        const userDoc = await db.collection('users').doc(userId).get();
        if (userDoc.exists) {
            return userDoc.data().isAdmin === true;
        }
        return false;
    } catch (error) {
        console.error('❌ Erreur vérification admin:', error);
        return false;
    }
}

/**
 * Observer les changements d'état d'authentification
 */
function onAuthStateChanged(callback) {
    return auth.onAuthStateChanged(callback);
}

// ===========================
// QUESTIONS MANAGEMENT
// ===========================

/**
 * Charger toutes les questions depuis Firebase
 */
async function loadQuestionsFromFirebase() {
    try {
        const snapshot = await db.collection('questions').get();
        const questions = [];
        
        snapshot.forEach(doc => {
            questions.push({
                id: doc.id,
                ...doc.data()
            });
        });
        
        console.log(`✅ ${questions.length} questions chargées depuis Firebase`);
        return { success: true, questions: questions };
    } catch (error) {
        console.error('❌ Erreur chargement questions:', error);
        return { success: false, error: error.message, questions: [] };
    }
}

/**
 * Ajouter une nouvelle question (admin uniquement)
 */
async function addQuestion(questionData) {
    try {
        const user = getCurrentUser();
        if (!user) {
            throw new Error('Vous devez être connecté');
        }
        
        const isUserAdmin = await isAdmin(user.uid);
        if (!isUserAdmin) {
            throw new Error('Accès refusé : droits administrateur requis');
        }
        
        const docRef = await db.collection('questions').add({
            question: questionData.question,
            answers: questionData.answers,
            correct: questionData.correct,
            explanation: questionData.explanation,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            createdBy: user.uid
        });
        
        console.log('✅ Question ajoutée:', docRef.id);
        return { success: true, id: docRef.id };
    } catch (error) {
        console.error('❌ Erreur ajout question:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Mettre à jour une question (admin uniquement)
 */
async function updateQuestion(questionId, questionData) {
    try {
        const user = getCurrentUser();
        if (!user) {
            throw new Error('Vous devez être connecté');
        }
        
        const isUserAdmin = await isAdmin(user.uid);
        if (!isUserAdmin) {
            throw new Error('Accès refusé : droits administrateur requis');
        }
        
        await db.collection('questions').doc(questionId).update({
            question: questionData.question,
            answers: questionData.answers,
            correct: questionData.correct,
            explanation: questionData.explanation,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        console.log('✅ Question mise à jour:', questionId);
        return { success: true };
    } catch (error) {
        console.error('❌ Erreur mise à jour question:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Supprimer une question (admin uniquement)
 */
async function deleteQuestion(questionId) {
    try {
        const user = getCurrentUser();
        if (!user) {
            throw new Error('Vous devez être connecté');
        }
        
        const isUserAdmin = await isAdmin(user.uid);
        if (!isUserAdmin) {
            throw new Error('Accès refusé : droits administrateur requis');
        }
        
        await db.collection('questions').doc(questionId).delete();
        
        console.log('✅ Question supprimée:', questionId);
        return { success: true };
    } catch (error) {
        console.error('❌ Erreur suppression question:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Migrer les questions locales vers Firebase (une seule fois)
 */
async function migrateQuestionsToFirebase(localQuestions) {
    try {
        const user = getCurrentUser();
        if (!user) {
            throw new Error('Vous devez être connecté');
        }
        
        const isUserAdmin = await isAdmin(user.uid);
        if (!isUserAdmin) {
            throw new Error('Accès refusé : droits administrateur requis');
        }
        
        const batch = db.batch();
        let count = 0;
        
        for (const question of localQuestions) {
            const docRef = db.collection('questions').doc();
            batch.set(docRef, {
                question: question.question,
                answers: question.answers,
                correct: question.correct,
                category: question.category,
                explanation: question.explanation,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                createdBy: user.uid
            });
            count++;
        }
        
        await batch.commit();
        
        console.log(`✅ ${count} questions migrées vers Firebase`);
        return { success: true, count: count };
    } catch (error) {
        console.error('❌ Erreur migration questions:', error);
        return { success: false, error: error.message };
    }
}

// ===========================
// GAME RESULTS & STATS
// ===========================

/**
 * Sauvegarder le résultat d'une partie
 */
async function saveGameResult(gameData) {
    try {
        const user = getCurrentUser();
        if (!user) {
            console.log('⚠️ Utilisateur non connecté, résultat non sauvegardé');
            return { success: false, error: 'Non connecté' };
        }
        
        // Sauvegarder le résultat
        await db.collection('gameResults').add({
            userId: user.uid,
            score: gameData.score,
            correctAnswers: gameData.correctAnswers,
            wrongAnswers: gameData.wrongAnswers,
            categories: gameData.categories,
            playedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        // Mettre à jour les statistiques de l'utilisateur
        const userRef = db.collection('users').doc(user.uid);
        const userDoc = await userRef.get();
        
        if (userDoc.exists) {
            const userData = userDoc.data();
            const newGamesPlayed = (userData.gamesPlayed || 0) + 1;
            const newTotalScore = (userData.totalScore || 0) + gameData.score;
            const newBestScore = Math.max(userData.bestScore || 0, gameData.score);
            
            await userRef.update({
                gamesPlayed: newGamesPlayed,
                totalScore: newTotalScore,
                bestScore: newBestScore,
                lastPlayedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            
            // 🏅 Mettre à jour le rang de l'utilisateur
            await updateUserRank(user.uid);
        }
        
        console.log('✅ Résultat sauvegardé');
        return { success: true };
    } catch (error) {
        console.error('❌ Erreur sauvegarde résultat:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Obtenir les statistiques d'un utilisateur
 */
async function getUserStats(userId) {
    try {
        const userDoc = await db.collection('users').doc(userId).get();
        
        if (!userDoc.exists) {
            throw new Error('Utilisateur non trouvé');
        }
        
        const userData = userDoc.data();
        
        return {
            success: true,
            stats: {
                gamesPlayed: userData.gamesPlayed || 0,
                totalScore: userData.totalScore || 0,
                bestScore: userData.bestScore || 0,
                averageScore: userData.gamesPlayed > 0 
                    ? Math.round(userData.totalScore / userData.gamesPlayed) 
                    : 0,
                elo: userData.elo || 100,
                duelsPlayed: userData.duelsPlayed || 0,
                duelsWon: userData.duelsWon || 0,
                duelsLost: userData.duelsLost || 0
            }
        };
    } catch (error) {
        console.error('❌ Erreur récupération stats:', error);
        return { success: false, error: error.message };
    }
}

// ===========================
// DUEL SYSTEM & ELO
// ===========================

/**
 * Calculer le changement d'ELO après un duel (système zéro-somme équilibré)
 * Formule d'ELO standard avec multiplicateur de temps réduit
 * 
 * RÈGLES:
 * - Gagnant contre joueur plus fort = plus d'ELO
 * - Gagnant contre joueur plus faible = moins d'ELO
 * - Plus de temps restant = légèrement plus d'ELO (1.0x à 1.15x)
 * - Système zéro-somme: total des gains/pertes = 0
 */
function calculateEloChange(winnerElo, loserElo, winnerTimeRemaining = 30, winnerScore = 0, loserScore = 0) {
    const K = 32; // Facteur K standard
    
    // ========== MULTIPLICATEUR: Basé sur le temps restant ==========
    // 30s restant = x1.0 (neutre)
    // 60s restant = x1.15 (bonus léger pour victoire rapide)
    // Formule: 1.0 + (timeRemaining - 30) / 200
    const timeMultiplier = Math.max(0.85, 1.0 + (Math.min(winnerTimeRemaining, 60) - 30) / 200);
    
    // ========== MULTIPLICATEUR: Basé sur les scores (score-based ELO modifier) ==========
    // Normaliser les scores (diviser par 1000 pour avoir des valeurs raisonnables)
    // Score 800+ = beaucoup de points (bon performance)
    // Score 400-800 = points moyens
    // Score 0-400 = peu de points (mauvaise performance)
    const winnerScoreNormalized = Math.min(winnerScore / 1000, 1.5); // Cap at 1.5
    const loserScoreNormalized = Math.min(loserScore / 1000, 1.5);   // Cap at 1.5
    
    // Le multiplicateur de score récompense les victoires avec beaucoup de points
    // et punit les défaites avec peu de points
    // Formule: 0.5 + (playerScore / 1000) * 1.0
    // Min: 0.5 (si 0 points), Max: 2.0 (si 1500+ points)
    const winnerScoreMultiplier = 0.5 + (winnerScoreNormalized * 1.0);
    const loserScoreMultiplier = 0.5 + (loserScoreNormalized * 1.0);
    
    // ========== PROBABILITÉ D'ELO ATTENDUE ==========
    // Calcul standard ELO basé sur la différence d'ELO
    const expectedWinner = 1 / (1 + Math.pow(10, (loserElo - winnerElo) / 400));
    const expectedLoser = 1 / (1 + Math.pow(10, (winnerElo - loserElo) / 400));
    
    // ========== CALCUL FINAL (QUASI-ZÉRO-SOMME) ==========
    // Combine tous les multiplicateurs
    const baseWinnerChange = K * timeMultiplier * winnerScoreMultiplier * (1 - expectedWinner);
    const baseLoserChange = K * timeMultiplier * loserScoreMultiplier * (expectedLoser - 1);
    
    // Arrondir et capper les valeurs
    let winnerChange = Math.round(baseWinnerChange);
    let loserChange = Math.round(baseLoserChange);
    
    // Capper les changements d'ELO pour éviter les extrêmes
    // Win: entre +5 et +35 ELO
    // Loss: entre -35 et -5 ELO
    winnerChange = Math.max(5, Math.min(35, winnerChange));
    loserChange = Math.max(-35, Math.min(-5, loserChange));
    
    console.log('💰 ELO Change Breakdown (with Score Modifier):', {
        winner: { elo: winnerElo, score: winnerScore, eloGain: winnerChange },
        loser: { elo: loserElo, score: loserScore, eloLoss: loserChange },
        timeMultiplier: timeMultiplier.toFixed(3),
        winnerScoreMultiplier: winnerScoreMultiplier.toFixed(3),
        loserScoreMultiplier: loserScoreMultiplier.toFixed(3),
        expectedWinnerProba: (expectedWinner * 100).toFixed(1) + '%',
        totalChange: (winnerChange + loserChange)
    });
    
    return { winnerChange, loserChange };
}

/**
 * Créer une nouvelle partie de duel
 */
async function createDuel(categories) {
    try {
        console.log('➕ createDuel() - Début');
        
        const user = getCurrentUser();
        console.log('👤 Utilisateur actuel:', user ? user.email : 'null');
        
        if (!user) {
            throw new Error('Vous devez être connecté pour jouer en duel');
        }
        
        // Récupérer l'ELO du joueur
        console.log('📊 Récupération de l\'ELO...');
        const userDoc = await db.collection('users').doc(user.uid).get();
        
        if (!userDoc.exists) {
            throw new Error('Profil utilisateur introuvable');
        }
        
        const userData = userDoc.data();
        const playerElo = userData.elo || 100;
        const playerDisplayName = getSafeDisplayName(userData.displayName || user.displayName, user.uid);
        console.log('✅ ELO du joueur:', playerElo);
        
        // Créer le duel
        console.log('💾 Création du duel dans Firestore...');
        const duelRef = await db.collection('duels').add({
            player1: {
                uid: user.uid,
                displayName: playerDisplayName,
                elo: playerElo,
                timeRemaining: 60, // 60 secondes par joueur
                correctAnswers: 0,
                wrongAnswers: 0,
                score: 0, // Score basé sur les bonnes réponses (+100 par bonne réponse)
                ready: false
            },
            player2: null,
            status: 'waiting', // waiting, ready, playing, finished
            categories: categories,
            activePlayer: null, // 1 ou 2 (sera défini au démarrage)
            currentQuestionIndex: 0,
            questions: [],
            penaltyUntil: null, // Timestamp de fin de pénalité
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            expiresAt: firebase.firestore.Timestamp.fromDate(new Date(Date.now() + 5 * 60 * 1000)) // 5 minutes
        });
        
        console.log('✅ Duel créé avec succès:', duelRef.id);
        return { success: true, duelId: duelRef.id };
    } catch (error) {
        console.error('❌ Erreur création duel:', error);
        console.error('Stack trace:', error.stack);
        return { success: false, error: error.message };
    }
}

/**
 * Rejoindre un duel existant (matchmaking)
 */
async function joinDuel(categories) {
    try {
        console.log('🎮 joinDuel() - Début');
        
        const user = getCurrentUser();
        console.log('👤 Utilisateur actuel:', user ? user.email : 'null');
        
        if (!user) {
            throw new Error('Vous devez être connecté pour jouer en duel');
        }
        
        // Récupérer l'ELO du joueur
        console.log('📊 Récupération de l\'ELO...');
        const userDoc = await db.collection('users').doc(user.uid).get();
        
        if (!userDoc.exists) {
            throw new Error('Profil utilisateur introuvable');
        }
        
        const userData = userDoc.data();
        const playerElo = userData.elo || 100;
        const playerDisplayName = getSafeDisplayName(userData.displayName || user.displayName, user.uid);
        console.log('✅ ELO du joueur:', playerElo);
        
        // Chercher un duel en attente avec un ELO similaire (+/- 100)
        // Plus strict que 200 pour éviter les mauvais matchings
        console.log('🔍 Recherche d\'un duel en attente...');
        const duelsSnapshot = await db.collection('duels')
            .where('status', '==', 'waiting')
            .where('player1.elo', '>=', playerElo - 100)
            .where('player1.elo', '<=', playerElo + 100)
            .orderBy('player1.elo')
            .orderBy('createdAt')
            .limit(1)
            .get();
        
        console.log('📥 Duels trouvés:', duelsSnapshot.size);
        
        // 🧹 Filtrer les duels trop vieux (plus de 3 minutes) ou sans questions
        let validDuel = null;
        const now = Date.now();
        const MAX_AGE = 3 * 60 * 1000; // 3 minutes
        
        for (const duelDoc of duelsSnapshot.docs) {
            const duelData = duelDoc.data();
            const createdAtMs = duelData.createdAt ? duelData.createdAt.toMillis() : 0;
            const duelAge = now - createdAtMs;
            
            console.log('⏱️ Âge du duel:', (duelAge / 1000).toFixed(1), 'secondes');
            
            if (duelAge > MAX_AGE) {
                console.log('⚠️ Duel trop ancien, suppression...');
                await deleteDuel(duelDoc.id);
            } else {
                validDuel = { id: duelDoc.id, data: duelData };
                break;
            }
        }
        
        if (!validDuel) {
            // Aucun duel valide trouvé, en créer un nouveau
            console.log('➕ Aucun duel valide trouvé, création d\'un nouveau...');
            return await createDuel(categories);
        }
        
        // Rejoindre le duel trouvé
        const duelId = validDuel.id;
        const duelData = validDuel.data;
        
        console.log('🎯 Duel trouvé:', duelId);
        console.log('👥 Player1:', duelData.player1.displayName, '- ELO:', duelData.player1.elo);
        
        // Vérifier que ce n'est pas le même joueur
        if (duelData.player1.uid === user.uid) {
            console.log('⚠️ C\'est votre propre duel, création d\'un nouveau...');
            return await createDuel(categories);
        }
        
        // Sélectionner un grand nombre de questions (pool illimité)
        console.log('❓ Sélection des questions...');
        const questions = await selectDuelQuestions(categories, 50); // Pool de 50 questions
        console.log('✅ Questions sélectionnées:', questions.length);
        
        // Mettre à jour le duel
        console.log('💾 Mise à jour du duel...');
        await db.collection('duels').doc(duelId).update({
            player2: {
                uid: user.uid,
                displayName: playerDisplayName,
                elo: playerElo,
                timeRemaining: 60, // 60 secondes par joueur
                correctAnswers: 0,
                wrongAnswers: 0,
                score: 0, // Score basé sur les bonnes réponses (+100 par bonne réponse)
                ready: false
            },
            status: 'ready',
            questions: questions
        });
        
        // 🧹 Supprimer les autres duels en attente du player2
        // (pour éviter que le même joueur ne rejoigne plusieurs duels)
        await deleteOtherPendingDuels(user.uid, duelId);
        
        console.log('✅ Duel rejoint avec succès:', duelId);
        return { success: true, duelId: duelId };
    } catch (error) {
        console.error('❌ Erreur rejoindre duel:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Sélectionner les questions pour un duel
 */
async function selectDuelQuestions(categories, count) {
    try {
        let questionsQuery = db.collection('questions');
        
        // Filtrer par catégories si spécifié
        if (categories && categories.length > 0) {
            questionsQuery = questionsQuery.where('category', 'in', categories.slice(0, 10));
        }
        
        const snapshot = await questionsQuery.get();
        const allQuestions = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        
        // Mélanger et sélectionner
        const shuffled = allQuestions.sort(() => Math.random() - 0.5);
        return shuffled.slice(0, count);
    } catch (error) {
        console.error('❌ Erreur sélection questions duel:', error);
        return [];
    }
}

/**
 * Marquer un joueur comme prêt
 */
async function setPlayerReady(duelId, playerNumber) {
    try {
        const user = getCurrentUser();
        if (!user) {
            throw new Error('Vous devez être connecté');
        }
        
        const updateData = {};
        updateData[`player${playerNumber}.ready`] = true;
        
        await db.collection('duels').doc(duelId).update(updateData);
        
        // Vérifier si les deux joueurs sont prêts
        const duelDoc = await db.collection('duels').doc(duelId).get();
        const duelData = duelDoc.data();
        
        if (duelData.player1.ready && duelData.player2.ready) {
            // Déterminer qui commence (ELO le plus bas, ou aléatoire si égalité)
            let startingPlayer;
            if (duelData.player1.elo < duelData.player2.elo) {
                startingPlayer = 1;
            } else if (duelData.player2.elo < duelData.player1.elo) {
                startingPlayer = 2;
            } else {
                // ELO égal : choix aléatoire
                startingPlayer = Math.random() < 0.5 ? 1 : 2;
            }
            
            await db.collection('duels').doc(duelId).update({
                status: 'playing',
                activePlayer: startingPlayer,
                startedAt: firebase.firestore.FieldValue.serverTimestamp(),
                lastTimerUpdate: firebase.firestore.FieldValue.serverTimestamp()
            });
        }
        
        console.log('✅ Joueur prêt');
        return { success: true };
    } catch (error) {
        console.error('❌ Erreur set ready:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Soumettre une réponse dans un duel (nouveau système "12 Coups de Midi")
 */
async function submitDuelAnswer(duelId, playerNumber, answerIndex) {
    try {
        const user = getCurrentUser();
        if (!user) {
            throw new Error('Vous devez être connecté');
        }
        
        const duelDoc = await db.collection('duels').doc(duelId).get();
        const duelData = duelDoc.data();
        
        // Vérifier que c'est bien le tour du joueur
        if (duelData.activePlayer !== playerNumber) {
            return { success: false, error: 'Ce n\'est pas votre tour' };
        }
        
        // Vérifier si on est en période de pénalité
        if (duelData.penaltyUntil && duelData.penaltyUntil.toMillis() > Date.now()) {
            return { success: false, error: 'Période de pénalité en cours' };
        }
        
        const question = duelData.questions[duelData.currentQuestionIndex];
        const isCorrect = answerIndex === question.correct;
        
        const playerKey = `player${playerNumber}`;
        const updateData = {};
        
        if (isCorrect) {
            // Bonne réponse : incrémenter le compteur et passer au joueur suivant
            updateData[`${playerKey}.correctAnswers`] = (duelData[playerKey].correctAnswers || 0) + 1;
            updateData.activePlayer = playerNumber === 1 ? 2 : 1; // Changer de joueur
            updateData.currentQuestionIndex = duelData.currentQuestionIndex + 1;
            updateData.lastTimerUpdate = firebase.firestore.FieldValue.serverTimestamp();
            updateData.penaltyUntil = null;
        } else {
            // Mauvaise réponse : pénalité de 3 secondes
            updateData[`${playerKey}.wrongAnswers`] = (duelData[playerKey].wrongAnswers || 0) + 1;
            updateData.penaltyUntil = firebase.firestore.Timestamp.fromDate(new Date(Date.now() + 3000)); // +3 secondes
            updateData.currentQuestionIndex = duelData.currentQuestionIndex + 1; // Nouvelle question après pénalité
        }
        
        await db.collection('duels').doc(duelId).update(updateData);
        
        console.log('✅ Réponse soumise:', { isCorrect });
        return { success: true, isCorrect, correctAnswer: question.correct };
    } catch (error) {
        console.error('❌ Erreur soumission réponse:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Mettre à jour le temps restant d'un joueur
 */
async function updatePlayerTime(duelId, playerNumber, timeRemaining) {
    try {
        const updateData = {};
        updateData[`player${playerNumber}.timeRemaining`] = Math.max(0, timeRemaining);
        updateData['lastTimerUpdate'] = firebase.firestore.FieldValue.serverTimestamp();
        
        await db.collection('duels').doc(duelId).update(updateData);
        
        // Note: La fin du duel est gérée par le timer dans duel.js
        // pour éviter les appels multiples
        
        return { success: true };
    } catch (error) {
        console.error('❌ Erreur mise à jour temps:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Terminer un duel et mettre à jour les ELO (nouveau système basé sur le temps)
 */
async function finishDuel(duelId, winner = null) {
    try {
        console.log('🏁 finishDuel() appelé - duelId:', duelId, 'winner:', winner);
        
        const duelDoc = await db.collection('duels').doc(duelId).get();
        const duelData = duelDoc.data();
        
        console.log('📊 Statut actuel du duel:', duelData.status);
        
        if (duelData.status === 'finished') {
            console.log('⚠️ Duel déjà terminé - protection contre double appel');
            return { success: true, message: 'Duel déjà terminé' };
        }
        
        // Déterminer le vainqueur si non spécifié
        if (winner === null) {
            const player1Time = duelData.player1.timeRemaining || 0;
            const player2Time = duelData.player2.timeRemaining || 0;
            
            if (player1Time > player2Time) {
                winner = 1;
            } else if (player2Time > player1Time) {
                winner = 2;
            } else {
                winner = 0; // Égalité (très rare)
            }
        }
        
        const loser = winner === 1 ? 2 : 1;
        const winnerTime = duelData[`player${winner}`].timeRemaining || 0;
        const winnerScore = duelData[`player${winner}`].score || 0;
        const loserScore = duelData[`player${loser}`].score || 0;
        
        console.log('🏆 Vainqueur:', winner, '| Temps restant:', winnerTime, 's | Score:', winnerScore);
        console.log('🏆 Perdant:', loser, '| Score:', loserScore);
        
        // Calculer les changements d'ELO basés sur le temps restant ET les scores
        const eloChanges = calculateEloChange(
            duelData[`player${winner}`].elo,
            duelData[`player${loser}`].elo,
            winnerTime,
            winnerScore,
            loserScore
        );
        
        console.log('📈 Changements d\'ELO calculés:', eloChanges);
        
        // Mettre à jour les ELO et stats des joueurs
        const batch = db.batch();
        
        // Player 1
        console.log('📝 Récupération des données du joueur 1:', duelData.player1.uid);
        const player1Ref = db.collection('users').doc(duelData.player1.uid);
        const player1Doc = await player1Ref.get();
        
        if (!player1Doc.exists) {
            throw new Error('Joueur 1 introuvable dans la base de données');
        }
        
        const player1Data = player1Doc.data();
        console.log('✅ Joueur 1 trouvé - ELO actuel:', player1Data.elo);
        
        const player1EloChange = winner === 1 ? eloChanges.winnerChange : eloChanges.loserChange;
        const player1NewElo = (player1Data.elo || 100) + player1EloChange;
        
        console.log('📊 Joueur 1 - Ancien ELO:', player1Data.elo, '| Changement:', player1EloChange, '| Nouveau ELO:', player1NewElo);
        
        batch.update(player1Ref, {
            elo: player1NewElo,
            duelsPlayed: (player1Data.duelsPlayed || 0) + 1,
            duelsWon: (player1Data.duelsWon || 0) + (winner === 1 ? 1 : 0),
            duelsLost: (player1Data.duelsLost || 0) + (winner === 2 ? 1 : 0)
        });
        
        // Player 2
        console.log('📝 Récupération des données du joueur 2:', duelData.player2.uid);
        const player2Ref = db.collection('users').doc(duelData.player2.uid);
        const player2Doc = await player2Ref.get();
        
        if (!player2Doc.exists) {
            throw new Error('Joueur 2 introuvable dans la base de données');
        }
        
        const player2Data = player2Doc.data();
        console.log('✅ Joueur 2 trouvé - ELO actuel:', player2Data.elo);
        
        const player2EloChange = winner === 2 ? eloChanges.winnerChange : eloChanges.loserChange;
        const player2NewElo = (player2Data.elo || 100) + player2EloChange;
        
        console.log('📊 Joueur 2 - Ancien ELO:', player2Data.elo, '| Changement:', player2EloChange, '| Nouveau ELO:', player2NewElo);
        
        batch.update(player2Ref, {
            elo: player2NewElo,
            duelsPlayed: (player2Data.duelsPlayed || 0) + 1,
            duelsWon: (player2Data.duelsWon || 0) + (winner === 2 ? 1 : 0),
            duelsLost: (player2Data.duelsLost || 0) + (winner === 1 ? 1 : 0)
        });
        
        // Mettre à jour le duel
        console.log('📝 Mise à jour du statut du duel');
        const duelRef = db.collection('duels').doc(duelId);
        batch.update(duelRef, {
            status: 'finished',
            winner: winner,
            eloChanges: {
                player1: player1EloChange,
                player2: player2EloChange
            },
            finishedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        console.log('💾 Commit du batch update...');
        console.log('📦 Batch contient 3 opérations: 2 users + 1 duel');
        await batch.commit();
        console.log('✅ Batch commit réussi !');
        console.log('🎉 ELO mis à jour - Joueur 1:', player1NewElo, '| Joueur 2:', player2NewElo);
        
        // Mettre à jour les rangs basés sur le nouvel ELO
        console.log('🏅 Mise à jour des rangs...');
        await updateUserRank(duelData.player1.uid);
        await updateUserRank(duelData.player2.uid);
        
        console.log('✅ Duel terminé:', { 
            winner, 
            eloChanges: {
                player1: player1EloChange,
                player2: player2EloChange
            }
        });
        
        // 🧹 Supprimer le duel après un court délai (permet à l'UI de s'afficher)
        setTimeout(() => {
            console.log('🗑️ Suppression du duel terminé après délai...');
            deleteDuel(duelId).then(result => {
                if (result.success) {
                    console.log('✅ Duel terminé supprimé de la base');
                } else {
                    console.warn('⚠️ Impossible de supprimer le duel:', result.error);
                }
            });
        }, 2000); // 2 secondes de délai
        
        return { 
            success: true, 
            winner,
            eloChanges: {
                player1: player1EloChange,
                player2: player2EloChange
            }
        };
    } catch (error) {
        console.error('❌ Erreur fin duel:', error);
        console.error('Stack trace:', error.stack);
        return { success: false, error: error.message };
    }
}

/**
 * Supprimer un duel de la base de données
 */
async function deleteDuel(duelId) {
    try {
        console.log('🗑️ Suppression du duel:', duelId);
        await db.collection('duels').doc(duelId).delete();
        console.log('✅ Duel supprimé avec succès');
        return { success: true };
    } catch (error) {
        console.error('❌ Erreur suppression duel:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Supprimer tous les duels en attente créés par un utilisateur
 * (utile lors de la déconnexion ou de la fermeture de la page)
 */
async function deleteUserPendingDuels(userId) {
    try {
        console.log('🔍 Recherche des duels en attente pour:', userId);
        
        // Trouver les duels créés par cet utilisateur et en attente
        const duelsSnapshot = await db.collection('duels')
            .where('player1.uid', '==', userId)
            .where('status', '==', 'waiting')
            .get();
        
        console.log('📋 Duels trouvés:', duelsSnapshot.size);
        
        if (duelsSnapshot.empty) {
            console.log('ℹ️ Aucun duel en attente à supprimer');
            return { success: true, deleted: 0 };
        }
        
        // Supprimer tous les duels
        const batch = db.batch();
        let count = 0;
        
        duelsSnapshot.forEach(doc => {
            console.log('🗑️ Marqué pour suppression:', doc.id);
            batch.delete(doc.ref);
            count++;
        });
        
        await batch.commit();
        console.log('✅ Duels supprimés:', count);
        return { success: true, deleted: count };
    } catch (error) {
        console.error('❌ Erreur suppression duels utilisateur:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Supprimer tous les duels en attente pour un utilisateur qui a trouvé quelqu'un
 * (quand un duel passe en 'ready')
 */
async function deleteOtherPendingDuels(userId, currentDuelId) {
    try {
        console.log('🧹 Nettoyage des autres duels en attente de:', userId);
        
        // Trouver les duels créés par cet utilisateur (sauf le current) et en attente
        const duelsSnapshot = await db.collection('duels')
            .where('player1.uid', '==', userId)
            .where('status', '==', 'waiting')
            .get();
        
        const batch = db.batch();
        let count = 0;
        
        duelsSnapshot.forEach(doc => {
            // Ne pas supprimer le duel actuel
            if (doc.id !== currentDuelId) {
                console.log('🗑️ Suppression du duel concurrent:', doc.id);
                batch.delete(doc.ref);
                count++;
            }
        });
        
        if (count > 0) {
            await batch.commit();
            console.log('✅ Duels concurrents supprimés:', count);
        }
        
        return { success: true, deleted: count };
    } catch (error) {
        console.error('❌ Erreur nettoyage duels:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Observer les changements d'un duel en temps réel
 */
function watchDuel(duelId, callback) {
    return db.collection('duels').doc(duelId).onSnapshot(callback);
}

/**
 * Obtenir le classement ELO
 */
async function getLeaderboard(limit = 100) {
    try {
        const snapshot = await db.collection('users')
            .orderBy('elo', 'desc')
            .limit(limit)
            .get();
        
        const leaderboard = [];
        snapshot.forEach((doc, index) => {
            const data = doc.data();
            const safeDisplayName = getSafeDisplayName(data.displayName, doc.id);
            leaderboard.push({
                rank: index + 1,
                uid: doc.id,
                displayName: safeDisplayName,
                elo: data.elo || 100,
                duelsPlayed: data.duelsPlayed || 0,
                duelsWon: data.duelsWon || 0,
                duelsLost: data.duelsLost || 0,
                winRate: data.duelsPlayed > 0 
                    ? Math.round((data.duelsWon / data.duelsPlayed) * 100) 
                    : 0
            });
        });
        
        console.log('✅ Classement chargé:', leaderboard.length);
        return { success: true, leaderboard };
    } catch (error) {
        console.error('❌ Erreur chargement classement:', error);
        return { success: false, error: error.message, leaderboard: [] };
    }
}

/**
 * Obtenir le rang d'un joueur
 */
async function getPlayerRank(userId) {
    try {
        const userDoc = await db.collection('users').doc(userId).get();
        if (!userDoc.exists) {
            throw new Error('Utilisateur non trouvé');
        }
        
        const userData = userDoc.data();
        const playerElo = userData.elo || 100;
        
        // Compter combien de joueurs ont un ELO supérieur
        const snapshot = await db.collection('users')
            .where('elo', '>', playerElo)
            .get();
        
        const rank = snapshot.size + 1;
        
        return { success: true, rank, elo: playerElo };
    } catch (error) {
        console.error('❌ Erreur récupération rang:', error);
        return { success: false, error: error.message };
    }
}

// ===========================
// UTILITY FUNCTIONS
// ===========================

/**
 * Obtenir un message d'erreur en français
 */
function getErrorMessage(errorCode) {
    const errorMessages = {
        'auth/email-already-in-use': 'Cette adresse email est déjà utilisée',
        'auth/invalid-email': 'Adresse email invalide',
        'auth/operation-not-allowed': 'Opération non autorisée',
        'auth/weak-password': 'Le mot de passe doit contenir au moins 6 caractères',
        'auth/user-disabled': 'Ce compte a été désactivé',
        'auth/user-not-found': 'Aucun compte ne correspond à cet email',
        'auth/wrong-password': 'Mot de passe incorrect',
        'auth/too-many-requests': 'Trop de tentatives. Réessayez plus tard',
        'auth/network-request-failed': 'Erreur de connexion réseau',
        'auth/popup-closed-by-user': 'Fenêtre de connexion fermée',
        'auth/cancelled-popup-request': 'Connexion annulée'
    };
    
    return errorMessages[errorCode] || 'Une erreur est survenue';
}

// ===========================
// EXPORT FUNCTIONS (pour utilisation globale)
// ===========================

// Exposer explicitement les fonctions sur l'objet window pour garantir l'accès global
window.signIn = signIn;
window.signUp = signUp;
window.signInWithGoogle = signInWithGoogle;
window.signOut = signOut;
window.getCurrentUser = getCurrentUser;
window.waitForAuthReady = waitForAuthReady;
window.isAdmin = isAdmin;
window.loadQuestionsFromFirebase = loadQuestionsFromFirebase;
window.addQuestion = addQuestion;
window.updateQuestion = updateQuestion;
window.deleteQuestion = deleteQuestion;
window.getSafeDisplayName = getSafeDisplayName;
window.migrateQuestionsToFirebase = migrateQuestionsToFirebase;
window.saveGameResult = saveGameResult;
window.getUserStats = getUserStats;

// Fonctions de duel
window.joinDuel = joinDuel;
window.submitDuelAnswer = submitDuelAnswer;
window.updatePlayerTime = updatePlayerTime;
window.finishDuel = finishDuel;
window.watchDuel = watchDuel;
window.deleteDuel = deleteDuel;
window.deleteUserPendingDuels = deleteUserPendingDuels;
window.deleteOtherPendingDuels = deleteOtherPendingDuels;
window.getLeaderboard = getLeaderboard;
window.getPlayerRank = getPlayerRank;

// ===========================
// USER PROFILE MANAGEMENT
// ===========================

/**
 * Récupérer toutes les données du profil utilisateur
 */
async function getUserData(userId) {
    try {
        const userDoc = await db.collection('users').doc(userId).get();
        
        if (!userDoc.exists) {
            throw new Error('Utilisateur non trouvé');
        }
        
        const userData = userDoc.data();
        const stats = await getUserStats(userId);
        
        return {
            success: true,
            user: {
                uid: userId,
                email: userData.email || '',
                displayName: userData.displayName || '',
                elo: userData.elo || 100,
                createdAt: userData.createdAt,
                ...stats.stats
            }
        };
    } catch (error) {
        console.error('❌ Erreur récupération données utilisateur:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Mettre à jour le mot de passe
 */
async function updateUserPassword(currentPassword, newPassword) {
    try {
        const user = getCurrentUser();
        if (!user || !user.email) {
            throw new Error('Vous devez être connecté');
        }
        
        // Ré-authentifier l'utilisateur
        const credential = firebase.auth.EmailAuthProvider.credential(
            user.email,
            currentPassword
        );
        
        await user.reauthenticateWithCredential(credential);
        
        // Mettre à jour le mot de passe
        await user.updatePassword(newPassword);
        
        console.log('✅ Mot de passe mis à jour');
        return { success: true };
    } catch (error) {
        console.error('❌ Erreur mise à jour mot de passe:', error);
        
        if (error.code === 'auth/wrong-password') {
            return { success: false, error: 'Le mot de passe actuel est incorrect' };
        } else if (error.code === 'auth/weak-password') {
            return { success: false, error: 'Le nouveau mot de passe est trop faible (min. 6 caractères)' };
        }
        
        return { success: false, error: getErrorMessage(error.code) };
    }
}

/**
 * Mettre à jour le pseudo de l'utilisateur
 */
async function updateUserDisplayName(newDisplayName) {
    try {
        const user = getCurrentUser();
        if (!user) {
            throw new Error('Vous devez être connecté');
        }
        
        // Vérifier que le pseudo n'est pas vide
        if (!newDisplayName || newDisplayName.trim().length < 3) {
            return { success: false, error: 'Le pseudo doit contenir au moins 3 caractères' };
        }
        
        if (newDisplayName.length > 30) {
            return { success: false, error: 'Le pseudo ne doit pas dépasser 30 caractères' };
        }
        
        // Mettre à jour le profil Firebase
        await user.updateProfile({
            displayName: newDisplayName.trim()
        });
        
        // Mettre à jour dans Firestore
        await db.collection('users').doc(user.uid).update({
            displayName: newDisplayName.trim()
        });
        
        console.log('✅ Pseudo mis à jour:', newDisplayName);
        return { success: true };
    } catch (error) {
        console.error('❌ Erreur mise à jour pseudo:', error);
        return { success: false, error: getErrorMessage(error.code) };
    }
}

/**
 * Supprimer le compte utilisateur
 */
async function deleteUserAccount() {
    try {
        const user = getCurrentUser();
        if (!user) {
            throw new Error('Vous devez être connecté');
        }
        
        const userId = user.uid;
        
        // Supprimer les données utilisateur de Firestore EN PREMIER
        // (tant qu'on est connecté et qu'on a les permissions)
        await db.collection('users').doc(userId).delete();
        console.log('✅ Données Firestore supprimées');
        
        // Supprimer le compte Firebase AUTH
        // Si ça échoue, au moins les données Firestore sont déjà supprimées
        try {
            await user.delete();
            console.log('✅ Compte auth supprimé');
        } catch (authError) {
            console.warn('⚠️ Impossible de supprimer le compte auth:', authError.code);
            
            if (authError.code === 'auth/requires-recent-login') {
                throw new Error('Veuillez vous reconnecter pour supprimer votre compte');
            }
            throw authError;
        }
        
        console.log('✅ Compte complètement supprimé');
        return { success: true };
    } catch (error) {
        console.error('❌ Erreur suppression compte:', error);
        
        if (error.code === 'auth/requires-recent-login') {
            return { success: false, error: 'Veuillez vous reconnecter pour supprimer votre compte' };
        }
        
        return { success: false, error: error.message || getErrorMessage(error.code) };
    }
}

// ===========================
// PREMIUM FUNCTIONS
// ===========================

/**
 * Convertir une valeur en Date de manière robuste
 */
function convertToDate(value) {
    if (!value) return null;
    
    // Si c'est déjà une Date
    if (value instanceof Date) {
        return value;
    }
    
    // Si c'est un Timestamp Firebase (a une méthode toDate)
    if (value && typeof value.toDate === 'function') {
        return value.toDate();
    }
    
    // Si c'est une string ou un nombre, essayer de le convertir
    const date = new Date(value);
    return isNaN(date.getTime()) ? null : date;
}

/**
 * Vérifier si l'utilisateur est premium
 */
async function isPremium(userId) {
    try {
        const userDoc = await db.collection('users').doc(userId).get();
        if (!userDoc.exists) return false;
        
        const userData = userDoc.data();
        if (!userData.hasPremium) return false;
        
        // Vérifier l'expiration
        if (userData.premiumExpiry) {
            const expiryDate = convertToDate(userData.premiumExpiry);
            if (!expiryDate) return false; // Format de date invalide
            
            if (expiryDate < new Date()) {
                // Le premium a expiré
                await db.collection('users').doc(userId).update({
                    hasPremium: false,
                    premiumExpiry: null
                });
                return false;
            }
        }
        
        return true;
    } catch (error) {
        console.error('❌ Erreur vérification premium:', error);
        return false;
    }
}

/**
 * Obtenir les données premium d'un utilisateur
 */
async function getPremiumData(userId) {
    try {
        const userDoc = await db.collection('users').doc(userId).get();
        if (!userDoc.exists) {
            throw new Error('Utilisateur non trouvé');
        }
        
        const userData = userDoc.data();
        const premium = await isPremium(userId);
        
        // Convertir premiumExpiry de manière robuste
        const premiumExpiry = userData.premiumExpiry ? convertToDate(userData.premiumExpiry) : null;
        
        return {
            success: true,
            hasPremium: premium,
            premiumExpiry: premiumExpiry,
            theme: userData.theme || 'default',
            profileIcon: userData.profileIcon || 'icon1',
            profileColor: userData.profileColor || '#8b5cf6',
            pseudoColor: userData.pseudoColor || null,
            pseudoGradient: userData.pseudoGradient || null
        };
    } catch (error) {
        console.error('❌ Erreur récupération données premium:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Mettre à jour le thème de l'utilisateur
 */
async function updateUserTheme(userId, theme) {
    try {
        await db.collection('users').doc(userId).update({
            theme: theme
        });
        console.log('✅ Thème mis à jour:', theme);
        return { success: true };
    } catch (error) {
        console.error('❌ Erreur mise à jour thème:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Mettre à jour l'icône de profil de l'utilisateur
 */
async function updateProfileIcon(userId, icon) {
    try {
        await db.collection('users').doc(userId).update({
            profileIcon: icon
        });
        console.log('✅ Icône profil mise à jour:', icon);
        return { success: true };
    } catch (error) {
        console.error('❌ Erreur mise à jour icône:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Mettre à jour la couleur du pseudo
 */
async function updateProfileColor(userId, color) {
    try {
        await db.collection('users').doc(userId).update({
            profileColor: color
        });
        console.log('✅ Couleur profil mise à jour:', color);
        return { success: true };
    } catch (error) {
        console.error('❌ Erreur mise à jour couleur:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Mettre à jour le dégradé du pseudo
 */
async function updateProfileGradient(userId, gradientKey) {
    try {
        await db.collection('users').doc(userId).update({
            pseudoGradient: gradientKey
        });
        console.log('✅ Dégradé du pseudo mis à jour:', gradientKey);
        return { success: true };
    } catch (error) {
        console.error('❌ Erreur mise à jour dégradé:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Mettre à jour la couleur unie du pseudo
 */
async function updateProfilePseudoColor(userId, colorKey) {
    try {
        await db.collection('users').doc(userId).update({
            pseudoColor: colorKey
        });
        console.log('✅ Couleur du pseudo mise à jour:', colorKey);
        return { success: true };
    } catch (error) {
        console.error('❌ Erreur mise à jour couleur:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Activer l'abonnement premium (côté backend - à utiliser après paiement Stripe)
 */
async function activatePremium(userId, monthsCount = 1) {
    try {
        const expiryDate = new Date();
        expiryDate.setMonth(expiryDate.getMonth() + monthsCount);
        
        await db.collection('users').doc(userId).update({
            hasPremium: true,
            premiumExpiry: firebase.firestore.Timestamp.fromDate(expiryDate)
        });
        
        console.log('✅ Premium activé jusqu\'au:', expiryDate);
        return { success: true };
    } catch (error) {
        console.error('❌ Erreur activation premium:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Désactiver l'abonnement premium
 */
async function deactivatePremium(userId) {
    try {
        await db.collection('users').doc(userId).update({
            hasPremium: false,
            premiumExpiry: null
        });
        
        console.log('✅ Premium désactivé');
        return { success: true };
    } catch (error) {
        console.error('❌ Erreur désactivation premium:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Ajouter un achievement
 */
async function addAchievement(userId, achievementId) {
    try {
        const userRef = db.collection('users').doc(userId);
        const userDoc = await userRef.get();
        
        if (!userDoc.exists) {
            throw new Error('Utilisateur non trouvé');
        }
        
        const achievements = userDoc.data().achievements || [];
        if (!achievements.includes(achievementId)) {
            achievements.push(achievementId);
            await userRef.update({ achievements });
            console.log('✅ Achievement ajouté:', achievementId);
        }
        
        return { success: true };
    } catch (error) {
        console.error('❌ Erreur ajout achievement:', error);
        return { success: false, error: error.message };
    }
}

// Exposer aussi les services Firebase
window.auth = auth;
window.db = db;
window.analytics = analytics;
window.getUserData = getUserData;
window.updateUserDisplayName = updateUserDisplayName;
window.updateUserPassword = updateUserPassword;
window.deleteUserAccount = deleteUserAccount;
window.isPremium = isPremium;
window.getPremiumData = getPremiumData;
window.updateUserTheme = updateUserTheme;
window.updateProfileIcon = updateProfileIcon;
window.updateProfileColor = updateProfileColor;
window.updateProfileGradient = updateProfileGradient;
window.updateProfilePseudoColor = updateProfilePseudoColor;
window.activatePremium = activatePremium;
window.deactivatePremium = deactivatePremium;
window.addAchievement = addAchievement;

// ===========================
// RANK SYSTEM - UPDATE RANK
// ===========================

/**
 * Mettre à jour le rang de l'utilisateur basé sur son ELO
 * Cette fonction est appelée après chaque duel
 */
async function updateUserRank(userId) {
    try {
        const userRef = db.collection('users').doc(userId);
        const userDoc = await userRef.get();
        
        if (!userDoc.exists) {
            throw new Error('Utilisateur non trouvé');
        }
        
        const userData = userDoc.data();
        const userElo = userData.elo || 100;
        
        // Calculer le nouveau rang basé sur l'ELO
        const rankData = calculateRankFromElo(userElo);
        
        // Note: Le rang est calculé dynamiquement à partir de l'ELO
        // Pas besoin de le stocker dans la DB
        
        console.log(`✅ Rang mis à jour: ${rankData.label} (${userElo} ELO)`);
        return { success: true, rank: rankData };
    } catch (error) {
        console.error('❌ Erreur mise à jour rang:', error);
        return { success: false, error: error.message };
    }
}

console.log('🔥 Firebase initialisé avec succès');

// ===========================
// HOME PAGE STATISTICS
// ===========================

/**
 * Récupérer les statistiques pour la page d'accueil
 */
async function getHomePageStats() {
    try {
        console.log('🔥 Récupération des stats depuis Firestore...');
        
        // 1. Nombre total de joueurs (documents dans la collection 'users')
        console.log('📍 Requête users...');
        const usersSnapshot = await db.collection('users').get();
        const totalPlayers = usersSnapshot.size;
        console.log(`📊 Utilisateurs trouvés: ${totalPlayers}`);
        
        // 2. Nombre total de questions
        console.log('📍 Requête questions...');
        const questionsSnapshot = await db.collection('questions').get();
        const totalQuestions = questionsSnapshot.size;
        console.log(`📊 Questions trouvées: ${totalQuestions}`);
        
        // 3. Nombre total de défis joués (somme des duelsPlayed de tous les utilisateurs)
        let totalDuelsPlayed = 0;
        usersSnapshot.forEach(doc => {
            const userData = doc.data();
            const duels = userData.duelsPlayed || 0;
            totalDuelsPlayed += duels;
        });
        console.log(`📊 Défis joués au total: ${totalDuelsPlayed}`);
        
        console.log('✅ Stats chargées:', { totalPlayers, totalQuestions, totalDuelsPlayed });
        
        return {
            success: true,
            totalPlayers: totalPlayers,
            totalQuestions: totalQuestions,
            totalDuelsPlayed: totalDuelsPlayed
        };
    } catch (error) {
        console.error('❌ Erreur chargement stats:', error);
        console.error('❌ Stack:', error.stack);
        return {
            success: false,
            totalPlayers: 0,
            totalQuestions: 0,
            totalDuelsPlayed: 0
        };
    }
}

// ===========================
// AUTO-INITIALIZE AUTH STATE OBSERVER
// ===========================

/**
 * Observer automatique de l'état d'authentification
 * Cette fonction est appelée automatiquement à chaque changement d'état
 */
auth.onAuthStateChanged(async (user) => {
    console.log('🔄 État d\'authentification changé:', user ? user.email : 'Non connecté');
    
    if (user) {
        // Vérifier si l'utilisateur est admin
        const userIsAdmin = await isAdmin(user.uid);
        console.log('👤 Utilisateur:', user.email, '| Admin:', userIsAdmin);
        
        // Appeler la fonction onAuthStateChanged de app.js si elle existe
        if (typeof window.onAuthStateChanged === 'function') {
            window.onAuthStateChanged(true, user, userIsAdmin);
        }
    } else {
        // Utilisateur déconnecté
        console.log('👤 Utilisateur déconnecté');
        
        // Appeler la fonction onAuthStateChanged de app.js si elle existe
        if (typeof window.onAuthStateChanged === 'function') {
            window.onAuthStateChanged(false, null, false);
        }
    }
});