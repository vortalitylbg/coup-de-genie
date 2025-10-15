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
 * Calculer le changement d'ELO après un duel (basé sur le temps restant)
 * Plus le vainqueur a de temps restant, plus il gagne d'ELO
 */
function calculateEloChange(winnerElo, loserElo, winnerTimeRemaining = 30) {
    const K = 32; // Facteur K de base
    
    // Multiplicateur basé sur le temps restant (0 à 60 secondes)
    // 60s restant = x2.0, 30s = x1.5, 10s = x1.2, 0s = x1.0
    const timeMultiplier = 1 + (winnerTimeRemaining / 60);
    const adjustedK = K * timeMultiplier;
    
    const expectedWinner = 1 / (1 + Math.pow(10, (loserElo - winnerElo) / 400));
    const expectedLoser = 1 / (1 + Math.pow(10, (winnerElo - loserElo) / 400));
    
    const winnerChange = Math.round(adjustedK * (1 - expectedWinner));
    const loserChange = Math.round(adjustedK * (0 - expectedLoser));
    
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
                timeRemaining: 60, // 60 secondes par joueur
                correctAnswers: 0,
                wrongAnswers: 0,
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
        
        // Sélectionner un grand nombre de questions (pool illimité)
        console.log('❓ Sélection des questions...');
        const questions = await selectDuelQuestions(categories, 50); // Pool de 50 questions
        console.log('✅ Questions sélectionnées:', questions.length);
        
        // Mettre à jour le duel
        console.log('💾 Mise à jour du duel...');
        await db.collection('duels').doc(duelId).update({
            player2: {
                uid: user.uid,
                displayName: user.displayName || user.email,
                elo: playerElo,
                timeRemaining: 60, // 60 secondes par joueur
                correctAnswers: 0,
                wrongAnswers: 0,
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
        
        console.log('🏆 Vainqueur:', winner, '| Temps restant:', winnerTime, 's');
        
        // Calculer les changements d'ELO basés sur le temps restant
        const eloChanges = calculateEloChange(
            duelData[`player${winner}`].elo,
            duelData[`player${loser}`].elo,
            winnerTime
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
        const player1NewElo = (player1Data.elo || 1000) + player1EloChange;
        
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
        const player2NewElo = (player2Data.elo || 1000) + player2EloChange;
        
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
        
        console.log('✅ Duel terminé:', { 
            winner, 
            eloChanges: {
                player1: player1EloChange,
                player2: player2EloChange
            }
        });
        
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

// Fonctions de duel
window.joinDuel = joinDuel;
window.submitDuelAnswer = submitDuelAnswer;
window.updatePlayerTime = updatePlayerTime;
window.finishDuel = finishDuel;
window.watchDuel = watchDuel;
window.getLeaderboard = getLeaderboard;
window.getPlayerRank = getPlayerRank;

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