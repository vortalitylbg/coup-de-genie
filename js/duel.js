// ===========================
// CONFIGURATION & CONSTANTS
// ===========================
const CONFIG = {
    initialTime: 60, // 60 secondes par joueur
    penaltyDuration: 3, // 3 secondes de pénalité
    maxCategorySelection: 5
};

// ===========================
// CATEGORY SELECTION STATE
// ===========================
let categoryState = {
    selectedCategories: [],
    allCategoriesSelected: false
};

// ===========================
// DUEL STATE (Nouveau système "12 Coups de Midi")
// ===========================
let duelState = {
    duelId: null,
    playerNumber: null, // 1 or 2
    timerInterval: null,
    duelUnsubscribe: null,
    isAnswering: false, // Pour éviter les doubles clics
    penaltyTimeout: null, // Timeout pour la pénalité
    lastTimerSync: Date.now(), // Pour synchroniser le timer local
    
    // 🎮 Améliorations
    comboP1: 0,
    comboP2: 0,
    maxComboP1: 0,
    maxComboP2: 0,
    answerStartTime: null, // Enregistrer le temps de début de question
    player1Score: 0,
    player2Score: 0
};

// ===========================
// INITIALIZATION
// ===========================
let isInitialized = false;

document.addEventListener('DOMContentLoaded', async () => {
    console.log('🎮 Initialisation du mode duel...');
    
    // Attendre que Firebase soit initialisé
    await waitForFirebase();
    console.log('✅ Firebase prêt');
    
    // ⚡ IMPORTANT: Attendre que Firebase restaure l'état d'authentification
    // Cela évite une race condition où getCurrentUser() retournerait null trop tôt
    console.log('⏳ Attente de la restauration de l\'état d\'authentification...');
    const user = await waitForAuthReady();
    console.log('🔐 Vérification de l\'utilisateur:', user ? user.email : 'non connecté');
    
    if (!user) {
        console.error('❌ Utilisateur non connecté');
        alert('Vous devez être connecté pour jouer en mode duel !');
        window.location.href = 'index.html';
        return;
    }
    
    console.log('✅ Utilisateur connecté:', user.email);
    
    if (!isInitialized) {
        isInitialized = true;
        initCategoryModal();
        showCategoryModal();
    }
});

// Fonction pour attendre que Firebase soit prêt
function waitForFirebase() {
    return new Promise((resolve) => {
        if (typeof firebase !== 'undefined' && typeof auth !== 'undefined' && typeof db !== 'undefined') {
            resolve();
        } else {
            const checkInterval = setInterval(() => {
                if (typeof firebase !== 'undefined' && typeof auth !== 'undefined' && typeof db !== 'undefined') {
                    clearInterval(checkInterval);
                    resolve();
                }
            }, 100);
        }
    });
}

// ===========================
// CATEGORY SELECTION
// ===========================
function initCategoryModal() {
    console.log('🎯 Initialisation de la modal de catégories...');
    
    // Forcer "Toutes les catégories" uniquement
    categoryState.allCategoriesSelected = true;
    categoryState.selectedCategories = [];
    
    // Masquer la grille de catégories et le compteur
    const categoriesGrid = document.getElementById('categoriesGrid');
    const categoryCounter = document.querySelector('.category-counter');
    
    if (!categoriesGrid || !categoryCounter) {
        console.error('❌ Éléments de catégories introuvables');
        return;
    }
    
    categoriesGrid.style.display = 'none';
    categoryCounter.style.display = 'none';
    
    // Activer le bouton "Toutes les catégories" et le désactiver
    const allBtn = document.getElementById('categoryAllBtn');
    if (!allBtn) {
        console.error('❌ Bouton "Toutes les catégories" introuvable');
        return;
    }
    
    allBtn.classList.add('active');
    allBtn.disabled = true;
    allBtn.style.cursor = 'not-allowed';
    allBtn.style.opacity = '0.8';
    
    // Activer le bouton "Commencer"
    const startBtn = document.getElementById('btnStartDuel');
    if (!startBtn) {
        console.error('❌ Bouton "Commencer" introuvable');
        return;
    }
    
    console.log('✅ Activation du bouton "Chercher un adversaire"');
    startBtn.disabled = false;
    
    // Ajouter les event listeners (une seule fois)
    const btnStartDuel = document.getElementById('btnStartDuel');
    const btnCancelCategory = document.getElementById('btnCancelCategory');
    
    if (btnStartDuel) {
        // Cloner pour supprimer les anciens listeners
        const newStartBtn = btnStartDuel.cloneNode(true);
        btnStartDuel.parentNode.replaceChild(newStartBtn, btnStartDuel);
        newStartBtn.addEventListener('click', startMatchmaking);
        console.log('✅ Event listener ajouté sur "Chercher un adversaire"');
    }
    
    if (btnCancelCategory) {
        const newCancelBtn = btnCancelCategory.cloneNode(true);
        btnCancelCategory.parentNode.replaceChild(newCancelBtn, btnCancelCategory);
        newCancelBtn.addEventListener('click', () => {
            window.location.href = 'index.html';
        });
        console.log('✅ Event listener ajouté sur "Retour"');
    }
    
    console.log('✅ Modal de catégories initialisée');
}

function toggleCategory(category, element) {
    if (categoryState.allCategoriesSelected) {
        categoryState.allCategoriesSelected = false;
        document.getElementById('categoryAllBtn').classList.remove('active');
    }
    
    const index = categoryState.selectedCategories.indexOf(category);
    
    if (index > -1) {
        categoryState.selectedCategories.splice(index, 1);
        element.classList.remove('active');
    } else {
        if (categoryState.selectedCategories.length < CONFIG.maxCategorySelection) {
            categoryState.selectedCategories.push(category);
            element.classList.add('active');
        }
    }
    
    updateCategoryCounter();
}

function toggleAllCategories() {
    const allBtn = document.getElementById('categoryAllBtn');
    const categoryItems = document.querySelectorAll('.category-item');
    
    categoryState.allCategoriesSelected = !categoryState.allCategoriesSelected;
    
    if (categoryState.allCategoriesSelected) {
        allBtn.classList.add('active');
        categoryState.selectedCategories = [];
        categoryItems.forEach(item => item.classList.remove('active'));
    } else {
        allBtn.classList.remove('active');
    }
    
    updateCategoryCounter();
}

function updateCategoryCounter() {
    const counter = document.getElementById('categoryCount');
    const startBtn = document.getElementById('btnStartDuel');
    
    if (categoryState.allCategoriesSelected) {
        counter.textContent = 'Toutes';
        startBtn.disabled = false;
    } else {
        counter.textContent = categoryState.selectedCategories.length;
        startBtn.disabled = categoryState.selectedCategories.length === 0;
    }
}

function showCategoryModal() {
    console.log('📋 Affichage de la modal de catégories...');
    const modal = document.getElementById('categoryModal');
    
    if (!modal) {
        console.error('❌ Modal de catégories introuvable');
        return;
    }
    
    modal.classList.remove('hidden');
    console.log('✅ Modal affichée');
}

function hideCategoryModal() {
    console.log('📋 Masquage de la modal de catégories...');
    const modal = document.getElementById('categoryModal');
    
    if (!modal) {
        console.error('❌ Modal de catégories introuvable');
        return;
    }
    
    modal.classList.add('hidden');
    console.log('✅ Modal masquée');
}

// ===========================
// MATCHMAKING
// ===========================
async function startMatchmaking() {
    console.log('🔍 Démarrage du matchmaking...');
    
    hideCategoryModal();
    
    const matchmakingScreen = document.getElementById('matchmakingScreen');
    if (!matchmakingScreen) {
        console.error('❌ Écran de matchmaking introuvable');
        return;
    }
    matchmakingScreen.classList.remove('hidden');
    
    const categories = categoryState.allCategoriesSelected ? null : categoryState.selectedCategories;
    console.log('📂 Catégories sélectionnées:', categories || 'Toutes');
    
    try {
        console.log('🔄 Appel de joinDuel()...');
        const result = await joinDuel(categories);
        console.log('📥 Résultat de joinDuel():', result);
        
        if (!result.success) {
            console.error('❌ Échec du matchmaking:', result.error);
            alert('Erreur lors de la recherche d\'adversaire : ' + result.error);
            window.location.href = 'index.html';
            return;
        }
        
        duelState.duelId = result.duelId;
        console.log('✅ Duel créé/rejoint - ID:', duelState.duelId);
        
        // Observer les changements du duel
        console.log('👀 Mise en place de l\'observateur...');
        duelState.duelUnsubscribe = watchDuel(duelState.duelId, handleDuelUpdate);
        console.log('✅ Observateur actif');
        
    } catch (error) {
        console.error('❌ Erreur matchmaking:', error);
        console.error('Stack trace:', error.stack);
        alert('Erreur lors de la recherche d\'adversaire: ' + error.message);
        window.location.href = 'index.html';
    }
    
    // Bouton annuler
    const btnCancel = document.getElementById('btnCancelMatchmaking');
    if (btnCancel) {
        btnCancel.addEventListener('click', () => {
            console.log('🚫 Annulation du matchmaking');
            if (duelState.duelUnsubscribe) {
                duelState.duelUnsubscribe();
            }
            window.location.href = 'index.html';
        });
    }
}

// ===========================
// DUEL UPDATE HANDLER (Nouveau système)
// ===========================
function handleDuelUpdate(snapshot) {
    if (!snapshot.exists) {
        console.error('❌ Duel introuvable');
        return;
    }
    
    const duelData = snapshot.data();
    const user = getCurrentUser();
    
    // Déterminer le numéro du joueur
    if (duelState.playerNumber === null) {
        if (duelData.player1.uid === user.uid) {
            duelState.playerNumber = 1;
        } else if (duelData.player2 && duelData.player2.uid === user.uid) {
            duelState.playerNumber = 2;
        }
    }
    
    console.log('📊 Duel status:', duelData.status, '| Active player:', duelData.activePlayer);
    console.log('📊 Real-time listener fired - Current scores - P1:', duelData.player1?.score, 'P2:', duelData.player2?.score);
    
    switch (duelData.status) {
        case 'waiting':
            // Toujours en attente d'un adversaire
            break;
            
        case 'ready':
            // Adversaire trouvé, afficher l'écran d'attente
            showWaitingScreen(duelData);
            break;
            
        case 'playing':
            // Le jeu commence
            const gameContent = document.getElementById('gameContent');
            
            if (gameContent.classList.contains('hidden')) {
                // Première fois : lancer le compte à rebours
                startCountdown();
            } else {
                // Mise à jour en cours de jeu
                updateGameScreen(duelData);
            }
            break;
            
        case 'finished':
            // Duel terminé
            stopTimer();
            showResults(duelData);
            break;
    }
}

function updateGameScreen(duelData) {
    // Mettre à jour les cartes des joueurs
    updatePlayerCards(duelData);
    
    // Charger la nouvelle question si nécessaire
    const currentQuestionElement = document.getElementById('questionNumber');
    const currentQuestionNumber = parseInt(currentQuestionElement.textContent.match(/\d+/)?.[0] || 0);
    
    console.log(`📊 Question actuelle affichée: ${currentQuestionNumber}, Question serveur: ${duelData.currentQuestionIndex + 1}`);
    
    // Ne charger la nouvelle question que si on n'est pas en train de répondre
    // Cela évite de charger la question suivante pendant que le feedback/pénalité est affiché
    if (currentQuestionNumber !== duelData.currentQuestionIndex + 1 && !duelState.isAnswering) {
        console.log('🔄 Chargement de la nouvelle question...');
        loadQuestion(duelData);
    }
    
    // Gérer le timer
    if (!duelState.timerInterval && duelData.status === 'playing') {
        startTimer(duelData);
    }
}

// ===========================
// WAITING SCREEN
// ===========================
function showWaitingScreen(duelData) {
    document.getElementById('matchmakingScreen').classList.add('hidden');
    const waitingScreen = document.getElementById('waitingScreen');
    waitingScreen.classList.remove('hidden');
    
    // Afficher les infos des joueurs
    document.getElementById('player1Name').textContent = duelData.player1.displayName;
    document.getElementById('player1Elo').textContent = duelData.player1.elo;
    document.getElementById('player1Name2').textContent = duelData.player1.displayName;
    
    if (duelData.player2) {
        document.getElementById('player2Name').textContent = duelData.player2.displayName;
        document.getElementById('player2Elo').textContent = duelData.player2.elo;
        document.getElementById('player2Name2').textContent = duelData.player2.displayName;
    }
    
    // Charger les profils des joueurs (icônes + couleurs)
    loadBothPlayerProfiles(duelData);
    
    // Mettre à jour les indicateurs de prêt
    const player1Ready = document.getElementById('player1Ready');
    const player2Ready = document.getElementById('player2Ready');
    
    if (duelData.player1.ready) {
        player1Ready.classList.add('ready');
        player1Ready.innerHTML = '<i class="fas fa-check"></i>';
    }
    
    if (duelData.player2 && duelData.player2.ready) {
        player2Ready.classList.add('ready');
        player2Ready.innerHTML = '<i class="fas fa-check"></i>';
    }
    
    // Bouton prêt
    const btnReady = document.getElementById('btnReady');
    const currentPlayer = duelState.playerNumber === 1 ? duelData.player1 : duelData.player2;
    
    if (currentPlayer.ready) {
        btnReady.disabled = true;
        btnReady.innerHTML = '<i class="fas fa-check btn-icon"></i><span class="btn-text">En attente...</span>';
    } else {
        btnReady.addEventListener('click', async () => {
            await setPlayerReady(duelState.duelId, duelState.playerNumber);
            btnReady.disabled = true;
            btnReady.innerHTML = '<i class="fas fa-check btn-icon"></i><span class="btn-text">En attente...</span>';
        });
    }
}

// ===========================
// COUNTDOWN
// ===========================
function startCountdown() {
    document.getElementById('waitingScreen').classList.add('hidden');
    const countdownScreen = document.getElementById('countdownScreen');
    countdownScreen.classList.remove('hidden');
    
    let count = 3;
    const countdownValue = document.getElementById('countdownValue');
    
    const countdownInterval = setInterval(() => {
        count--;
        if (count > 0) {
            countdownValue.textContent = count;
        } else {
            clearInterval(countdownInterval);
            countdownScreen.classList.add('hidden');
            startGame();
        }
    }, 1000);
}

// ===========================
// GAME LOGIC (Nouveau système "12 Coups de Midi")
// ===========================
async function startGame() {
    console.log('🎮 Démarrage du jeu...');
    document.getElementById('gameContent').classList.remove('hidden');
    
    // Montrer le timer global (affiche le temps du joueur actif)
    const timerBox = document.getElementById('timerBox');
    if (timerBox) {
        console.log('✅ timerBox found:', timerBox);
        console.log('📊 timerBox classList before:', timerBox.className);
        console.log('📊 timerBox computed style display:', window.getComputedStyle(timerBox).display);
        timerBox.style.display = 'flex';
        console.log('📊 timerBox display set to flex');
        console.log('📊 timerBox computed style display after:', window.getComputedStyle(timerBox).display);
    } else {
        console.error('❌ timerBox not found!');
    }
    
    // Charger les données du duel et afficher la première question
    try {
        const duelDoc = await db.collection('duels').doc(duelState.duelId).get();
        if (duelDoc.exists) {
            const duelData = duelDoc.data();
            console.log('📊 Données du duel chargées:', duelData);
            
            // Charger les profils des joueurs (icônes + couleurs)
            await loadBothPlayerProfiles(duelData);
            
            // Charger la première question
            loadQuestion(duelData);
            
            // Mettre à jour les cartes des joueurs
            updatePlayerCards(duelData);
            
            // Démarrer le timer
            startTimer(duelData);
        }
    } catch (error) {
        console.error('❌ Erreur démarrage du jeu:', error);
    }
}

function loadQuestion(duelData) {
    const question = duelData.questions[duelData.currentQuestionIndex];
    
    if (!question) {
        console.error('❌ Question introuvable');
        return;
    }
    
    console.log('📝 Chargement de la question:', duelData.currentQuestionIndex + 1);
    
    // 🎯 Enregistrer le temps de début de question pour calculer la vitesse de réponse
    duelState.answerStartTime = Date.now();
    
    // Mettre à jour l'interface
    document.getElementById('questionNumber').textContent = `Question ${duelData.currentQuestionIndex + 1}`;
    document.getElementById('questionText').textContent = question.question;
    document.getElementById('progressText').textContent = `Mode Duel - En cours`;
    
    // Catégorie
    const categoryElement = document.getElementById('questionCategory');
    const categoryIcon = CATEGORY_ICONS[question.category] || 'fa-question';
    categoryElement.innerHTML = `
        <i class="fas ${categoryIcon} category-icon"></i>
        <span class="category-name">${question.category}</span>
    `;
    
    // Réponses
    const answersGrid = document.getElementById('answersGrid');
    const answerButtons = answersGrid.querySelectorAll('.answer-btn');
    
    const isMyTurn = duelData.activePlayer === duelState.playerNumber;
    
    answerButtons.forEach((btn, index) => {
        btn.classList.remove('correct', 'wrong', 'disabled', 'selected');
        btn.querySelector('.answer-text').textContent = question.answers[index];
        
        if (isMyTurn) {
            btn.disabled = false;
            btn.onclick = () => selectAnswer(index);
        } else {
            btn.disabled = true;
            btn.classList.add('disabled');
        }
    });
    
    // Réinitialiser le feedback
    document.getElementById('answerFeedback').classList.remove('show', 'correct', 'wrong');
    document.getElementById('btnNext').style.display = 'none';
    
    duelState.isAnswering = false;
}

function updatePlayerCards(duelData) {
    const user = getCurrentUser();
    const isPlayer1 = duelData.player1.uid === user.uid;
    
    // Player 1
    const player1Card = document.getElementById('player1Card');
    document.getElementById('player1NameGame').textContent = duelData.player1.displayName;
    document.getElementById('player1EloGame').textContent = duelData.player1.elo;
    
    // 🎯 Afficher le score depuis Firestore (mise à jour en temps réel)
    const player1ScoreElement = document.getElementById('player1Score');
    player1ScoreElement.textContent = duelData.player1.score || 0;
    player1ScoreElement.style.color = 'var(--accent-gold)';
    player1ScoreElement.style.fontSize = '2rem';
    console.log(`📊 Player 1 score updated: ${duelData.player1.score || 0}`);
    
    // Player 2
    if (duelData.player2) {
        const player2Card = document.getElementById('player2Card');
        document.getElementById('player2NameGame').textContent = duelData.player2.displayName;
        document.getElementById('player2EloGame').textContent = duelData.player2.elo;
        
        // 🎯 Afficher le score depuis Firestore (mise à jour en temps réel)
        const player2ScoreElement = document.getElementById('player2Score');
        player2ScoreElement.textContent = duelData.player2.score || 0;
        player2ScoreElement.style.color = 'var(--accent-gold)';
        player2ScoreElement.style.fontSize = '2rem';
        console.log(`📊 Player 2 score updated: ${duelData.player2.score || 0} (Full player2 data:`, duelData.player2, ')');
    } else {
        console.warn('⚠️ player2 is null in duelData!', duelData);
    }
    
    // Mettre en évidence le joueur actif
    player1Card.classList.remove('current-player', 'active-turn');
    document.getElementById('player2Card').classList.remove('current-player', 'active-turn');
    
    if (duelData.activePlayer === 1) {
        player1Card.classList.add('active-turn');
    } else if (duelData.activePlayer === 2) {
        document.getElementById('player2Card').classList.add('active-turn');
    }
    
    // Toujours mettre en évidence le joueur local
    if (isPlayer1) {
        player1Card.classList.add('current-player');
    } else {
        document.getElementById('player2Card').classList.add('current-player');
    }
}

// Nouveau système de timer : met à jour le temps du joueur actif
function startTimer(initialDuelData) {
    if (duelState.timerInterval) {
        clearInterval(duelState.timerInterval);
    }
    
    console.log('⏱️ Démarrage du timer');
    
    // Variables locales pour le timer
    let localTime = {
        player1: initialDuelData.player1.timeRemaining || 60,
        player2: initialDuelData.player2.timeRemaining || 60
    };
    let currentActivePlayer = initialDuelData.activePlayer;
    let syncCounter = 0;
    
    duelState.timerInterval = setInterval(async () => {
        try {
            // Récupérer les données actuelles pour vérifier le joueur actif
            const duelDoc = await db.collection('duels').doc(duelState.duelId).get();
            if (!duelDoc.exists) {
                clearInterval(duelState.timerInterval);
                return;
            }
            
            const currentDuelData = duelDoc.data();
            
            // Vérifier si le duel est toujours en cours
            if (currentDuelData.status !== 'playing') {
                clearInterval(duelState.timerInterval);
                return;
            }
            
            // Mettre à jour le joueur actif si changé
            if (currentDuelData.activePlayer !== currentActivePlayer) {
                console.log(`🔄 Changement de joueur actif: ${currentActivePlayer} → ${currentDuelData.activePlayer}`);
                currentActivePlayer = currentDuelData.activePlayer;
                
                // Synchroniser les temps avec le serveur
                localTime.player1 = currentDuelData.player1.timeRemaining || 0;
                localTime.player2 = currentDuelData.player2.timeRemaining || 0;
            }
            
            // Décrémenter le temps du joueur actif localement
            const playerKey = `player${currentActivePlayer}`;
            
            if (localTime[playerKey] > 0) {
                localTime[playerKey]--;
            }
            
            // 🎯 Mettre à jour le timer dans le header (au lieu des éléments de score)
            const timerValue = document.getElementById('timerValue');
            const timerBox = document.getElementById('timerBox');
            
            if (timerValue && timerBox) {
                // Afficher le timer du joueur actif
                const activePlayerTime = currentActivePlayer === 1 ? localTime.player1 : localTime.player2;
                timerValue.textContent = `${Math.max(0, Math.floor(activePlayerTime))}s`;
                
                // Changer la couleur selon le temps restant
                timerBox.classList.remove('timer-critical', 'timer-warning', 'timer-normal');
                if (activePlayerTime <= 10) {
                    timerBox.classList.add('timer-critical');
                } else if (activePlayerTime <= 30) {
                    timerBox.classList.add('timer-warning');
                } else {
                    timerBox.classList.add('timer-normal');
                }
            }
            
            // 🎯 Les éléments de score affichent maintenant les points (via updatePlayerCards)
            // Ne pas les modifier ici!
            
            syncCounter++;
            
            // Synchroniser avec Firestore toutes les 3 secondes (au lieu de chaque seconde)
            if (syncCounter >= 3) {
                syncCounter = 0;
                
                // Vérifier si le joueur actif est le joueur local
                const user = getCurrentUser();
                const isPlayer1 = currentDuelData.player1.uid === user.uid;
                const isMyTurn = (currentActivePlayer === 1 && isPlayer1) || (currentActivePlayer === 2 && !isPlayer1);
                
                // Seul le joueur actif met à jour le timer sur Firestore
                if (isMyTurn) {
                    await updatePlayerTime(duelState.duelId, currentActivePlayer, localTime[playerKey]);
                    console.log(`⏱️ Sync timer: Player ${currentActivePlayer} = ${localTime[playerKey]}s`);
                }
            }
            
            // Vérifier si le temps est écoulé pour l'un des joueurs
            if (localTime['player1'] <= 0) {
                console.log('⏱️ Temps écoulé pour le joueur 1 - Joueur 2 gagne !');
                clearInterval(duelState.timerInterval);
                duelState.timerInterval = null;
                
                // N'importe quel joueur peut terminer le duel (protection contre double appel dans finishDuel)
                console.log('🏁 Fin du duel - Victoire du joueur 2');
                await finishDuel(duelState.duelId, 2);
                return;
            }
            
            if (localTime['player2'] <= 0) {
                console.log('⏱️ Temps écoulé pour le joueur 2 - Joueur 1 gagne !');
                clearInterval(duelState.timerInterval);
                duelState.timerInterval = null;
                
                // N'importe quel joueur peut terminer le duel (protection contre double appel dans finishDuel)
                console.log('🏁 Fin du duel - Victoire du joueur 1');
                await finishDuel(duelState.duelId, 1);
                return;
            }
            
        } catch (error) {
            console.error('❌ Erreur timer:', error);
        }
    }, 1000);
}

function stopTimer() {
    if (duelState.timerInterval) {
        clearInterval(duelState.timerInterval);
        duelState.timerInterval = null;
    }
}

// Fonction pour afficher un effet visuel sur la carte du joueur
function showPlayerCardEffect(playerNumber, isCorrect) {
    const playerCard = playerNumber === 1 
        ? document.getElementById('player1Card') 
        : document.getElementById('player2Card');
    
    playerCard.classList.add('answered');
    
    if (isCorrect) {
        playerCard.classList.add('correct-answer');
        setTimeout(() => {
            playerCard.classList.remove('correct-answer');
        }, 1000);
    } else {
        playerCard.classList.add('wrong-answer');
        setTimeout(() => {
            playerCard.classList.remove('wrong-answer');
        }, 500);
    }
    
    setTimeout(() => {
        playerCard.classList.remove('answered');
    }, 600);
}

async function selectAnswer(selectedIndex) {
    if (duelState.isAnswering) return;
    
    duelState.isAnswering = true;
    
    console.log('📤 Soumission de la réponse:', selectedIndex);
    
    // Désactiver tous les boutons immédiatement
    const answersGrid = document.getElementById('answersGrid');
    const answerButtons = answersGrid.querySelectorAll('.answer-btn');
    answerButtons.forEach(btn => {
        btn.disabled = true;
        btn.classList.add('disabled');
    });
    
    // Marquer visuellement la réponse sélectionnée
    answerButtons[selectedIndex].classList.add('selected');
    
    // Soumettre la réponse
    const result = await submitDuelAnswer(
        duelState.duelId,
        duelState.playerNumber,
        selectedIndex
    );
    
    if (!result.success) {
        console.error('❌ Erreur soumission:', result.error);
        duelState.isAnswering = false;
        return;
    }
    
    // Récupérer la question actuelle pour afficher la bonne réponse
    const doc = await db.collection('duels').doc(duelState.duelId).get();
    const duelData = doc.data();
    const question = duelData.questions[duelData.currentQuestionIndex - 1]; // -1 car l'index a déjà été incrémenté
    
    // Afficher l'effet sur la carte du joueur
    showPlayerCardEffect(duelState.playerNumber, result.isCorrect);
    
    // Afficher le feedback visuel sur les boutons
    answerButtons.forEach((btn, index) => {
        if (index === result.correctAnswer) {
            btn.classList.add('correct');
        } else if (index === selectedIndex) {
            btn.classList.add('wrong');
        }
    });
    
    // Afficher le feedback textuel
    const feedback = document.getElementById('answerFeedback');
    const feedbackIcon = document.getElementById('feedbackIcon');
    const feedbackText = document.getElementById('feedbackText');
    const feedbackExplanation = document.getElementById('feedbackExplanation');
    
    if (result.isCorrect) {
        feedback.classList.add('show', 'correct');
        feedbackIcon.className = 'fas fa-check feedback-icon correct';
        feedbackText.textContent = '✅ Bonne réponse !';
        feedbackText.className = 'feedback-text correct';
        
        // 🎯 AMÉLIORATIONS DUEL
        // 1️⃣ Mettre à jour le combo
        const playerNumber = duelState.playerNumber;
        if (playerNumber === 1) {
            duelState.comboP1++;
            duelState.maxComboP1 = Math.max(duelState.maxComboP1, duelState.comboP1);
            duelState.player1Score += 100;
        } else {
            duelState.comboP2++;
            duelState.maxComboP2 = Math.max(duelState.maxComboP2, duelState.comboP2);
            duelState.player2Score += 100;
        }
        
        // 🔄 Synchroniser le score dans Firestore
        syncScoreToFirestore(playerNumber, duelState[`player${playerNumber}Score`]);
        
        // 2️⃣ Afficher le combo si > 1
        if (duelState[`comboP${playerNumber}`] > 1) {
            showCombo(duelState[`comboP${playerNumber}`]);
        }
        
        // 3️⃣ Afficher l'indicateur de vitesse
        if (duelState.answerStartTime) {
            const answerTimeMs = Date.now() - duelState.answerStartTime;
            const answerTimeSeconds = (answerTimeMs / 1000).toFixed(2);
            const playerCard = document.getElementById(`player${playerNumber}Card`);
            addSpeedIndicator(playerCard, parseFloat(answerTimeSeconds));
            recordAnswerTime(parseFloat(answerTimeSeconds));
            console.log(`⚡ Temps de réponse P${playerNumber}: ${answerTimeSeconds}s`);
        }
        
        // 4️⃣ Mettre à jour le score avec animation
        const playerScoreElement = document.getElementById(`player${playerNumber}Score`);
        if (playerScoreElement) {
            updateScoreWithAnimation(document.getElementById(`player${playerNumber}Card`), duelState[`player${playerNumber}Score`]);
        }
        
        // Lancer les confettis !
        createConfetti();
        
        // Passer à la question suivante après 2 secondes
        setTimeout(async () => {
            feedback.classList.remove('show', 'correct');
            
            // Charger la nouvelle question après le feedback
            const doc = await db.collection('duels').doc(duelState.duelId).get();
            const updatedDuelData = doc.data();
            loadQuestion(updatedDuelData);
            
            // Réinitialiser l'état de réponse
            duelState.isAnswering = false;
        }, 2000);
    } else {
        feedback.classList.add('show', 'wrong');
        feedbackIcon.className = 'fas fa-times feedback-icon wrong';
        feedbackText.textContent = '❌ Mauvaise réponse !';
        feedbackText.className = 'feedback-text wrong';
        
        // Afficher la bonne réponse
        if (question && question.explanation) {
            feedbackExplanation.textContent = `Bonne réponse : ${question.answers[result.correctAnswer]}. ${question.explanation}`;
        } else if (question) {
            feedbackExplanation.textContent = `Bonne réponse : ${question.answers[result.correctAnswer]}`;
        }
        
        // 🎯 AMÉLIORATIONS DUEL - Réinitialiser le combo
        const playerNumber = duelState.playerNumber;
        if (playerNumber === 1) {
            duelState.comboP1 = 0;
        } else {
            duelState.comboP2 = 0;
        }
        console.log(`❌ Combo réinitialisé P${playerNumber}`);
        
        // Afficher la pénalité de 3 secondes
        showPenaltyCountdown();
    }
}

// Afficher le compte à rebours de pénalité (3 secondes)
async function showPenaltyCountdown() {
    let penaltyTime = CONFIG.penaltyDuration;
    
    // Masquer le feedback normal
    const feedback = document.getElementById('answerFeedback');
    feedback.classList.remove('show', 'wrong');
    
    // Afficher l'overlay de pénalité
    const penaltyOverlay = document.getElementById('penaltyOverlay');
    const penaltyCountdown = document.getElementById('penaltyCountdown');
    
    penaltyOverlay.classList.remove('hidden');
    penaltyCountdown.textContent = penaltyTime;
    
    const penaltyInterval = setInterval(async () => {
        penaltyTime--;
        
        if (penaltyTime > 0) {
            penaltyCountdown.textContent = penaltyTime;
        } else {
            clearInterval(penaltyInterval);
            penaltyOverlay.classList.add('hidden');
            document.getElementById('feedbackExplanation').textContent = '';
            
            // Charger la nouvelle question après la pénalité
            const doc = await db.collection('duels').doc(duelState.duelId).get();
            const updatedDuelData = doc.data();
            loadQuestion(updatedDuelData);
            
            // Réinitialiser l'état de réponse
            duelState.isAnswering = false;
        }
    }, 1000);
}

// 🔄 Synchroniser le score à Firestore en temps réel
async function syncScoreToFirestore(playerNumber, score) {
    try {
        if (!duelState.duelId) {
            console.error(`❌ No duelId when syncing score for player ${playerNumber}`);
            return;
        }
        
        const updateData = {};
        updateData[`player${playerNumber}.score`] = score;
        
        console.log(`🔄 Attempting to sync score for P${playerNumber}: ${score} to duel ${duelState.duelId}`);
        await db.collection('duels').doc(duelState.duelId).update(updateData);
        console.log(`✅ Score synchronisé P${playerNumber}: ${score}`);
        
        // Verify the update was written
        const verification = await db.collection('duels').doc(duelState.duelId).get();
        console.log(`📊 Verification - P${playerNumber} score in Firestore:`, verification.data()[`player${playerNumber}`]?.score);
    } catch (error) {
        console.error(`❌ Erreur synchronisation score P${playerNumber}:`, error);
        console.error('Error details:', error.message, error.code);
    }
}

// Fonction pour créer des confettis lors d'une bonne réponse
function createConfetti() {
    const colors = ['#10b981', '#fbbf24', '#7c3aed', '#3b82f6', '#f59e0b'];
    const confettiCount = 30;
    
    for (let i = 0; i < confettiCount; i++) {
        const confetti = document.createElement('div');
        confetti.style.position = 'fixed';
        confetti.style.width = '10px';
        confetti.style.height = '10px';
        confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        confetti.style.left = Math.random() * 100 + '%';
        confetti.style.top = '-10px';
        confetti.style.opacity = '1';
        confetti.style.borderRadius = Math.random() > 0.5 ? '50%' : '0';
        confetti.style.zIndex = '9999';
        confetti.style.pointerEvents = 'none';
        
        document.body.appendChild(confetti);
        
        const duration = Math.random() * 2 + 2;
        const rotation = Math.random() * 720 - 360;
        const xMovement = Math.random() * 200 - 100;
        
        confetti.animate([
            {
                transform: 'translateY(0) translateX(0) rotate(0deg)',
                opacity: 1
            },
            {
                transform: `translateY(${window.innerHeight}px) translateX(${xMovement}px) rotate(${rotation}deg)`,
                opacity: 0
            }
        ], {
            duration: duration * 1000,
            easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)'
        });
        
        setTimeout(() => {
            confetti.remove();
        }, duration * 1000);
    }
}

// ===========================
// RESULTS (Nouveau système basé sur le temps)
// ===========================
function showResults(duelData) {
    console.log('🏁 Affichage des résultats...', duelData);
    
    // Nettoyer le timer
    if (duelState.timerInterval) {
        clearInterval(duelState.timerInterval);
        duelState.timerInterval = null;
    }
    
    // Réinitialiser l'état du duel
    duelState.isAnswering = false;
    
    document.getElementById('gameContent').classList.add('hidden');
    const resultsScreen = document.getElementById('resultsScreen');
    resultsScreen.classList.remove('hidden');
    
    const user = getCurrentUser();
    const isPlayer1 = duelData.player1.uid === user.uid;
    const currentPlayer = isPlayer1 ? duelData.player1 : duelData.player2;
    const opponent = isPlayer1 ? duelData.player2 : duelData.player1;
    const currentPlayerNumber = isPlayer1 ? 1 : 2;
    
    // Déterminer le résultat
    const resultTitle = document.getElementById('resultTitle');
    const eloChangeElement = document.getElementById('eloChange');
    const player1Result = document.getElementById('player1Result');
    const player2Result = document.getElementById('player2Result');
    
    // Récupérer le changement d'ELO
    const eloChange = duelData.eloChanges[`player${currentPlayerNumber}`] || 0;
    const opponentEloChange = duelData.eloChanges[`player${currentPlayerNumber === 1 ? 2 : 1}`] || 0;
    
    // Déterminer le vainqueur
    const isWinner = duelData.winner === currentPlayerNumber;
    
    if (isWinner) {
        resultTitle.textContent = '🎉 Victoire !';
        resultTitle.className = 'result-title victory';
        player1Result.classList.add('winner');
        
        // Lancer des confettis pour la victoire
        createConfetti();
        setTimeout(createConfetti, 500);
    } else {
        resultTitle.textContent = '😔 Défaite';
        resultTitle.className = 'result-title defeat';
        player2Result.classList.add('winner');
    }
    
    // Afficher le changement d'ELO
    eloChangeElement.innerHTML = `
        <i class="fas fa-arrow-${eloChange >= 0 ? 'up' : 'down'}"></i>
        <span>${eloChange >= 0 ? '+' : ''}${eloChange} ELO</span>
    `;
    eloChangeElement.className = `elo-change ${eloChange >= 0 ? 'positive' : 'negative'}`;
    
    // Afficher les stats des joueurs (temps restant au lieu du score)
    document.getElementById('player1NameResult').textContent = currentPlayer.displayName;
    document.getElementById('player1FinalScore').textContent = `${Math.floor(currentPlayer.timeRemaining || 0)}s`;
    document.getElementById('player1Correct').textContent = currentPlayer.correctAnswers || 0;
    document.getElementById('player1NewElo').textContent = currentPlayer.elo + eloChange;
    
    document.getElementById('player2NameResult').textContent = opponent.displayName;
    document.getElementById('player2FinalScore').textContent = `${Math.floor(opponent.timeRemaining || 0)}s`;
    document.getElementById('player2Correct').textContent = opponent.correctAnswers || 0;
    document.getElementById('player2NewElo').textContent = opponent.elo + opponentEloChange;
    
    // Boutons
    document.getElementById('btnViewLeaderboard').onclick = () => {
        window.location.href = 'leaderboard.html';
    };
    
    document.getElementById('btnPlayAgain').onclick = () => {
        window.location.reload();
    };
    
    document.getElementById('btnHome').onclick = () => {
        window.location.href = 'index.html';
    };
    
    // Nettoyer le listener Firestore APRÈS avoir affiché les résultats
    // Cela permet aux deux joueurs de recevoir la mise à jour du statut 'finished'
    if (duelState.duelUnsubscribe) {
        console.log('🧹 Nettoyage du listener Firestore (après affichage des résultats)');
        duelState.duelUnsubscribe();
        duelState.duelUnsubscribe = null;
    }
}

// ===========================
// PLAYER PROFILE DISPLAY
// ===========================

/**
 * Charger et afficher les profils des deux joueurs (icônes + couleurs des pseudos)
 */
async function loadBothPlayerProfiles(duelData) {
    try {
        console.log('👥 Chargement des profils des deux joueurs...');
        
        // Charger le profil du joueur 1
        await loadDuelPlayerProfile(1, duelData.player1.uid, duelData.player1.displayName);
        
        // Charger le profil du joueur 2 si présent
        if (duelData.player2) {
            await loadDuelPlayerProfile(2, duelData.player2.uid, duelData.player2.displayName);
        }
        
        console.log('✅ Profils des joueurs chargés');
    } catch (error) {
        console.error('❌ Erreur lors du chargement des profils:', error);
    }
}

/**
 * Charger et afficher le profil d'un joueur spécifique
 */
async function loadDuelPlayerProfile(playerNumber, userId, displayName) {
    try {
        // Vérifier si le joueur est premium
        const hasPremium = await isPremium(userId);
        
        // Récupérer les données premium (profileIcon et profileColor)
        const premiumResult = await getPremiumData(userId);
        if (!premiumResult.success) {
            console.error(`❌ Erreur chargement données premium joueur ${playerNumber}:`, premiumResult.error);
            return;
        }
        
        const userData = premiumResult;
        console.log(`👤 Données premium joueur ${playerNumber}:`, userData);
        console.log(`👑 Joueur ${playerNumber} premium? ${hasPremium}`);
        
        // Sélectionner les éléments DOM appropriés
        const waitingNameElement = document.getElementById(`player${playerNumber}Name`);
        const gameNameElement = document.getElementById(`player${playerNumber}NameGame`);
        const waitingIconElement = document.getElementById(`duelPlayer${playerNumber}ProfileIcon`);
        const gameIconElement = document.getElementById(`duelPlayer${playerNumber}GameIcon`);
        const waitingFallbackIcon = document.getElementById(`duelPlayer${playerNumber}FallbackIcon`);
        const waitingCrownElement = document.getElementById(`duelPlayer${playerNumber}PremiumCrown`);
        const gameCrownElement = document.getElementById(`duelPlayer${playerNumber}GameCrown`);
        
        console.log(`🔍 Éléments trouvés pour joueur ${playerNumber}:`, {
            waitingIcon: !!waitingIconElement,
            gameIcon: !!gameIconElement,
            waitingFallback: !!waitingFallbackIcon,
            waitingName: !!waitingNameElement,
            gameName: !!gameNameElement
        });
        
        // Appliquer la couleur ou le dégradé du pseudo si elle existe (premium)
        if (userData.profileColor) {
            let colorStyle = userData.profileColor;
            
            // Priorité : dégradé du pseudo > couleur unie du pseudo > gradient de l'icône
            let isGradient = false;
            let solidColor = null;
            
            if (userData.pseudoGradient) {
                const gradientData = PSEUDO_GRADIENTS && PSEUDO_GRADIENTS[userData.pseudoGradient];
                if (gradientData) {
                    colorStyle = gradientData.gradient;
                    isGradient = true;
                }
            } else if (userData.pseudoColor) {
                const colorData = PSEUDO_COLORS && PSEUDO_COLORS[userData.pseudoColor];
                if (colorData) {
                    solidColor = colorData.color;
                    isGradient = false;
                }
            } else if (PROFILE_ICONS && PROFILE_ICONS[userData.profileIcon]?.gradient) {
                colorStyle = PROFILE_ICONS[userData.profileIcon].gradient;
                isGradient = true;
            }
            
            // Appliquer le style au pseudo du joueur en attente
            if (waitingNameElement) {
                if (isGradient && colorStyle) {
                    waitingNameElement.style.backgroundImage = colorStyle;
                    waitingNameElement.style.webkitBackgroundClip = 'text';
                    waitingNameElement.style.webkitTextFillColor = 'transparent';
                    waitingNameElement.style.backgroundClip = 'text';
                    waitingNameElement.style.color = '';
                } else if (solidColor) {
                    waitingNameElement.style.backgroundImage = '';
                    waitingNameElement.style.webkitBackgroundClip = '';
                    waitingNameElement.style.webkitTextFillColor = '';
                    waitingNameElement.style.backgroundClip = '';
                    waitingNameElement.style.color = solidColor;
                }
            }
            
            // Appliquer le style au pseudo du joueur en jeu
            if (gameNameElement) {
                if (isGradient && colorStyle) {
                    gameNameElement.style.backgroundImage = colorStyle;
                    gameNameElement.style.webkitBackgroundClip = 'text';
                    gameNameElement.style.webkitTextFillColor = 'transparent';
                    gameNameElement.style.backgroundClip = 'text';
                    gameNameElement.style.color = '';
                } else if (solidColor) {
                    gameNameElement.style.backgroundImage = '';
                    gameNameElement.style.webkitBackgroundClip = '';
                    gameNameElement.style.webkitTextFillColor = '';
                    gameNameElement.style.backgroundClip = '';
                    gameNameElement.style.color = solidColor;
                }
            }
            console.log(`✅ Couleur/dégradé du pseudo appliqué pour le joueur ${playerNumber}`);
        }
        
        // Afficher l'icône de profil si elle existe (premium)
        if (userData.profileIcon && PROFILE_ICONS && PROFILE_ICONS[userData.profileIcon]) {
            const iconData = PROFILE_ICONS[userData.profileIcon];
            console.log(`🎨 Icône trouvée pour joueur ${playerNumber}:`, iconData);
            
            if (iconData.image) {
                // Afficher l'icône dans l'écran d'attente
                if (waitingIconElement) {
                    waitingIconElement.src = iconData.image;
                    waitingIconElement.style.borderColor = iconData.color;
                    waitingIconElement.style.display = 'block';
                    waitingIconElement.style.visibility = 'visible';
                    console.log(`✅ Image d'attente affichée pour joueur ${playerNumber}`);
                    if (waitingFallbackIcon) {
                        waitingFallbackIcon.style.display = 'none';
                    }
                    // Afficher la couronne seulement si l'utilisateur est premium
                    if (waitingCrownElement) {
                        if (hasPremium) {
                            waitingCrownElement.style.display = 'block';
                            waitingCrownElement.style.color = iconData.color;
                        } else {
                            waitingCrownElement.style.display = 'none';
                        }
                    }
                } else {
                    console.warn(`⚠️ Élément waitingIcon non trouvé pour joueur ${playerNumber}`);
                }
                
                // Afficher l'icône dans le header du jeu
                if (gameIconElement) {
                    gameIconElement.src = iconData.image;
                    gameIconElement.style.borderColor = iconData.color;
                    gameIconElement.style.display = 'block';
                    gameIconElement.style.visibility = 'visible';
                    console.log(`✅ Image de jeu affichée pour joueur ${playerNumber}`);
                    // Afficher la couronne seulement si l'utilisateur est premium
                    if (gameCrownElement) {
                        if (hasPremium) {
                            gameCrownElement.style.display = 'block';
                            gameCrownElement.style.color = iconData.color;
                        } else {
                            gameCrownElement.style.display = 'none';
                        }
                    }
                } else {
                    console.warn(`⚠️ Élément gameIcon non trouvé pour joueur ${playerNumber}`);
                }
            } else {
                console.warn(`⚠️ Pas d'image trouvée pour l'icône ${userData.profileIcon}`);
            }
        } else {
            console.log(`ℹ️ Joueur ${playerNumber} n'a pas de profileIcon défini (non-premium ou non sauvegardé)`);
        }
    } catch (error) {
        console.error(`❌ Erreur chargement profil joueur ${playerNumber}:`, error);
    }
}