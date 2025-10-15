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
            elo: 1000,
            duelsPlayed: 0,
            duelsWon: 0,
            duelsLost: 0,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
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
                elo: 1000,
                duelsPlayed: 0,
                duelsWon: 0,
                duelsLost: 0,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
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
            category: questionData.category,
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
            category: questionData.category,
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
                elo: userData.elo || 1000,
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
 * Calculer le changement d'ELO après un duel
 */
function calculateEloChange(winnerElo, loserElo, isDraw = false) {
    const K = 32; // Facteur K (sensibilité du changement)
    
    const expectedWinner = 1 / (1 + Math.pow(10, (loserElo - winnerElo) / 400));
    const expectedLoser = 1 / (1 + Math.pow(10, (winnerElo - loserElo) / 400));
    
    if (isDraw) {
        const winnerChange = Math.round(K * (0.5 - expectedWinner));
        const loserChange = Math.round(K * (0.5 - expectedLoser));
        return { winnerChange, loserChange };
    }
    
    const winnerChange = Math.round(K * (1 - expectedWinner));
    const loserChange = Math.round(K * (0 - expectedLoser));
    
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
        const playerElo = userData.elo || 1000;
        console.log('✅ ELO du joueur:', playerElo);
        
        // Créer le duel
        console.log('💾 Création du duel dans Firestore...');
        const duelRef = await db.collection('duels').add({
            player1: {
                uid: user.uid,
                displayName: user.displayName || user.email,
                elo: playerElo,
                score: 0,
                answers: [],
                ready: false
            },
            player2: null,
            status: 'waiting', // waiting, ready, playing, finished
            categories: categories,
            currentQuestion: 0,
            questions: [],
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
        const playerElo = userData.elo || 1000;
        console.log('✅ ELO du joueur:', playerElo);
        
        // Chercher un duel en attente avec un ELO similaire (+/- 200)
        console.log('🔍 Recherche d\'un duel en attente...');
        const duelsSnapshot = await db.collection('duels')
            .where('status', '==', 'waiting')
            .where('player1.elo', '>=', playerElo - 200)
            .where('player1.elo', '<=', playerElo + 200)
            .orderBy('player1.elo')
            .orderBy('createdAt')
            .limit(1)
            .get();
        
        console.log('📥 Duels trouvés:', duelsSnapshot.size);
        
        if (duelsSnapshot.empty) {
            // Aucun duel trouvé, en créer un nouveau
            console.log('➕ Aucun duel trouvé, création d\'un nouveau...');
            return await createDuel(categories);
        }
        
        // Rejoindre le duel trouvé
        const duelDoc = duelsSnapshot.docs[0];
        const duelId = duelDoc.id;
        const duelData = duelDoc.data();
        
        console.log('🎯 Duel trouvé:', duelId);
        console.log('👥 Player1:', duelData.player1.displayName, '- ELO:', duelData.player1.elo);
        
        // Vérifier que ce n'est pas le même joueur
        if (duelData.player1.uid === user.uid) {
            console.log('⚠️ C\'est votre propre duel, création d\'un nouveau...');
            return await createDuel(categories);
        }
        
        // Sélectionner les questions pour le duel
        console.log('❓ Sélection des questions...');
        const questions = await selectDuelQuestions(categories, 3);
        console.log('✅ Questions sélectionnées:', questions.length);
        
        // Mettre à jour le duel
        console.log('💾 Mise à jour du duel...');
        await db.collection('duels').doc(duelId).update({
            player2: {
                uid: user.uid,
                displayName: user.displayName || user.email,
                elo: playerElo,
                score: 0,
                answers: [],
                ready: false
            },
            status: 'ready',
            questions: questions
        });
        
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
            await db.collection('duels').doc(duelId).update({
                status: 'playing',
                startedAt: firebase.firestore.FieldValue.serverTimestamp()
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
 * Soumettre une réponse dans un duel
 */
async function submitDuelAnswer(duelId, playerNumber, questionIndex, answerIndex, timeSpent) {
    try {
        const user = getCurrentUser();
        if (!user) {
            throw new Error('Vous devez être connecté');
        }
        
        const duelDoc = await db.collection('duels').doc(duelId).get();
        const duelData = duelDoc.data();
        const question = duelData.questions[questionIndex];
        
        const isCorrect = answerIndex === question.correct;
        
        // Calculer les points (max 1000 points par question)
        // 500 points de base + 500 points bonus selon le temps (30s max)
        let points = 0;
        if (isCorrect) {
            const basePoints = 500;
            const timeBonus = Math.max(0, 500 * (1 - timeSpent / 30));
            points = Math.round(basePoints + timeBonus);
        }
        
        const answer = {
            questionIndex,
            answerIndex,
            isCorrect,
            timeSpent,
            points
        };
        
        // Mettre à jour les réponses et le score du joueur
        const playerKey = `player${playerNumber}`;
        const currentAnswers = duelData[playerKey].answers || [];
        const currentScore = duelData[playerKey].score || 0;
        
        const updateData = {};
        updateData[`${playerKey}.answers`] = [...currentAnswers, answer];
        updateData[`${playerKey}.score`] = currentScore + points;
        
        await db.collection('duels').doc(duelId).update(updateData);
        
        console.log('✅ Réponse soumise:', { isCorrect, points });
        return { success: true, isCorrect, points };
    } catch (error) {
        console.error('❌ Erreur soumission réponse:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Terminer un duel et mettre à jour les ELO
 */
async function finishDuel(duelId) {
    try {
        const duelDoc = await db.collection('duels').doc(duelId).get();
        const duelData = duelDoc.data();
        
        if (duelData.status === 'finished') {
            return { success: true, message: 'Duel déjà terminé' };
        }
        
        const player1Score = duelData.player1.score || 0;
        const player2Score = duelData.player2.score || 0;
        
        let winner = null;
        let isDraw = false;
        
        if (player1Score > player2Score) {
            winner = 1;
        } else if (player2Score > player1Score) {
            winner = 2;
        } else {
            isDraw = true;
        }
        
        // Calculer les changements d'ELO
        const eloChanges = calculateEloChange(
            duelData.player1.elo,
            duelData.player2.elo,
            isDraw
        );
        
        // Mettre à jour les ELO et stats des joueurs
        const batch = db.batch();
        
        // Player 1
        const player1Ref = db.collection('users').doc(duelData.player1.uid);
        const player1Doc = await player1Ref.get();
        const player1Data = player1Doc.data();
        
        batch.update(player1Ref, {
            elo: (player1Data.elo || 1000) + eloChanges.winnerChange,
            duelsPlayed: (player1Data.duelsPlayed || 0) + 1,
            duelsWon: (player1Data.duelsWon || 0) + (winner === 1 ? 1 : 0),
            duelsLost: (player1Data.duelsLost || 0) + (winner === 2 ? 1 : 0)
        });
        
        // Player 2
        const player2Ref = db.collection('users').doc(duelData.player2.uid);
        const player2Doc = await player2Ref.get();
        const player2Data = player2Doc.data();
        
        batch.update(player2Ref, {
            elo: (player2Data.elo || 1000) + eloChanges.loserChange,
            duelsPlayed: (player2Data.duelsPlayed || 0) + 1,
            duelsWon: (player2Data.duelsWon || 0) + (winner === 2 ? 1 : 0),
            duelsLost: (player2Data.duelsLost || 0) + (winner === 1 ? 1 : 0)
        });
        
        // Mettre à jour le duel
        const duelRef = db.collection('duels').doc(duelId);
        batch.update(duelRef, {
            status: 'finished',
            winner: winner,
            isDraw: isDraw,
            eloChanges: eloChanges,
            finishedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        await batch.commit();
        
        console.log('✅ Duel terminé:', { winner, isDraw, eloChanges });
        return { 
            success: true, 
            winner, 
            isDraw, 
            eloChanges,
            player1Score,
            player2Score
        };
    } catch (error) {
        console.error('❌ Erreur fin duel:', error);
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
            leaderboard.push({
                rank: index + 1,
                uid: doc.id,
                displayName: data.displayName || data.email,
                elo: data.elo || 1000,
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
        const playerElo = userData.elo || 1000;
        
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
window.isAdmin = isAdmin;
window.loadQuestionsFromFirebase = loadQuestionsFromFirebase;
window.addQuestion = addQuestion;
window.updateQuestion = updateQuestion;
window.deleteQuestion = deleteQuestion;
window.migrateQuestionsToFirebase = migrateQuestionsToFirebase;
window.saveGameResult = saveGameResult;
window.getUserStats = getUserStats;

// Exposer aussi les services Firebase
window.auth = auth;
window.db = db;
window.analytics = analytics;

console.log('🔥 Firebase initialisé avec succès');

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