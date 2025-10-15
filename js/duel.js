// ===========================
// CONFIGURATION & CONSTANTS
// ===========================
const CONFIG = {
    totalQuestions: 3,
    timePerQuestion: 30,
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
// DUEL STATE
// ===========================
let duelState = {
    duelId: null,
    playerNumber: null, // 1 or 2
    currentQuestion: 0,
    timeRemaining: CONFIG.timePerQuestion,
    timerInterval: null,
    answerSelected: false,
    questionStartTime: null,
    duelUnsubscribe: null,
    combo: 0, // Combo de bonnes réponses consécutives
    maxCombo: 0 // Meilleur combo de la partie
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
    
    // Attendre un peu pour que l'auth state soit restauré
    setTimeout(() => {
        const user = getCurrentUser();
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
    }, 500); // Attendre 500ms pour que Firebase restaure la session
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
// DUEL UPDATE HANDLER
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
    
    console.log('📊 Duel status:', duelData.status);
    
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
            if (duelState.currentQuestion === 0) {
                startCountdown();
            } else {
                updateGameScreen(duelData);
            }
            break;
            
        case 'finished':
            // Duel terminé
            showResults(duelData);
            break;
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
// GAME LOGIC
// ===========================
function startGame() {
    document.getElementById('gameContent').classList.remove('hidden');
    loadQuestion();
}

function loadQuestion() {
    // Récupérer les données du duel depuis Firestore
    db.collection('duels').doc(duelState.duelId).get().then(doc => {
        const duelData = doc.data();
        const question = duelData.questions[duelState.currentQuestion];
        
        if (!question) {
            console.error('❌ Question introuvable');
            return;
        }
        
        // Mettre à jour l'interface
        updatePlayerCards(duelData);
        
        document.getElementById('questionNumber').textContent = `Question ${duelState.currentQuestion + 1}`;
        document.getElementById('questionText').textContent = question.question;
        document.getElementById('progressText').textContent = `Question ${duelState.currentQuestion + 1}/${CONFIG.totalQuestions}`;
        
        const progressBar = document.getElementById('progressBar');
        progressBar.style.width = `${((duelState.currentQuestion + 1) / CONFIG.totalQuestions) * 100}%`;
        
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
        
        answerButtons.forEach((btn, index) => {
            btn.classList.remove('correct', 'wrong', 'disabled');
            btn.querySelector('.answer-text').textContent = question.answers[index];
            btn.onclick = () => selectAnswer(index, question.correct);
        });
        
        // Réinitialiser le feedback
        document.getElementById('answerFeedback').classList.remove('show', 'correct', 'wrong');
        document.getElementById('btnNext').style.display = 'none';
        
        // Démarrer le timer
        duelState.answerSelected = false;
        duelState.timeRemaining = CONFIG.timePerQuestion;
        duelState.questionStartTime = Date.now();
        startTimer();
    });
}

function updatePlayerCards(duelData) {
    const user = getCurrentUser();
    const isPlayer1 = duelData.player1.uid === user.uid;
    
    // Player 1
    const player1Card = document.getElementById('player1Card');
    document.getElementById('player1NameGame').textContent = duelData.player1.displayName;
    document.getElementById('player1EloGame').textContent = duelData.player1.elo;
    
    const player1ScoreElement = document.getElementById('player1Score');
    const oldScore1 = parseInt(player1ScoreElement.textContent) || 0;
    const newScore1 = duelData.player1.score || 0;
    
    if (newScore1 > oldScore1) {
        player1ScoreElement.classList.add('score-increase');
        setTimeout(() => player1ScoreElement.classList.remove('score-increase'), 600);
    }
    player1ScoreElement.textContent = newScore1;
    
    // Player 2
    if (duelData.player2) {
        const player2Card = document.getElementById('player2Card');
        document.getElementById('player2NameGame').textContent = duelData.player2.displayName;
        document.getElementById('player2EloGame').textContent = duelData.player2.elo;
        
        const player2ScoreElement = document.getElementById('player2Score');
        const oldScore2 = parseInt(player2ScoreElement.textContent) || 0;
        const newScore2 = duelData.player2.score || 0;
        
        if (newScore2 > oldScore2) {
            player2ScoreElement.classList.add('score-increase');
            setTimeout(() => player2ScoreElement.classList.remove('score-increase'), 600);
        }
        player2ScoreElement.textContent = newScore2;
    }
    
    // Mettre en évidence le joueur actuel
    if (isPlayer1) {
        player1Card.classList.add('current-player');
    } else {
        document.getElementById('player2Card').classList.add('current-player');
    }
    
    // Afficher le combo si > 1
    updateComboDisplay();
}

function startTimer() {
    const timerValue = document.getElementById('timerValue');
    const timerBox = document.getElementById('timerBox');
    
    if (duelState.timerInterval) {
        clearInterval(duelState.timerInterval);
    }
    
    // Réinitialiser le style du timer
    timerBox.classList.remove('warning', 'danger');
    timerBox.style.animation = '';
    
    duelState.timerInterval = setInterval(() => {
        duelState.timeRemaining--;
        timerValue.textContent = duelState.timeRemaining;
        
        // Avertissement à 10 secondes
        if (duelState.timeRemaining === 10) {
            timerBox.classList.add('warning');
        }
        
        // Danger à 5 secondes
        if (duelState.timeRemaining === 5) {
            timerBox.classList.remove('warning');
            timerBox.classList.add('danger');
            timerBox.style.animation = 'pulse 0.5s ease-in-out infinite';
        }
        
        if (duelState.timeRemaining <= 0) {
            clearInterval(duelState.timerInterval);
            if (!duelState.answerSelected) {
                selectAnswer(-1, -1); // Temps écoulé, pas de réponse
            }
        }
    }, 1000);
}

// Fonction pour afficher le combo
function updateComboDisplay() {
    const user = getCurrentUser();
    const playerCard = duelState.playerNumber === 1 
        ? document.getElementById('player1Card') 
        : document.getElementById('player2Card');
    
    // Supprimer l'ancien indicateur de combo
    const oldCombo = playerCard.querySelector('.combo-indicator');
    if (oldCombo) {
        oldCombo.remove();
    }
    
    // Afficher le nouveau combo si > 1
    if (duelState.combo > 1) {
        const comboIndicator = document.createElement('div');
        comboIndicator.className = 'combo-indicator';
        comboIndicator.innerHTML = `🔥 x${duelState.combo}`;
        playerCard.appendChild(comboIndicator);
    }
}

// Fonction pour afficher un effet visuel sur la carte du joueur
function showPlayerCardEffect(isCorrect) {
    const playerCard = duelState.playerNumber === 1 
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

async function selectAnswer(selectedIndex, correctIndex) {
    if (duelState.answerSelected) return;
    
    duelState.answerSelected = true;
    clearInterval(duelState.timerInterval);
    
    const timeSpent = (Date.now() - duelState.questionStartTime) / 1000;
    
    // Soumettre la réponse
    const result = await submitDuelAnswer(
        duelState.duelId,
        duelState.playerNumber,
        duelState.currentQuestion,
        selectedIndex,
        timeSpent
    );
    
    // Mettre à jour le combo
    if (result.isCorrect) {
        duelState.combo++;
        if (duelState.combo > duelState.maxCombo) {
            duelState.maxCombo = duelState.combo;
        }
    } else {
        duelState.combo = 0;
    }
    
    // Afficher l'effet sur la carte du joueur
    showPlayerCardEffect(result.isCorrect);
    
    // Afficher le feedback visuel sur les boutons
    const answersGrid = document.getElementById('answersGrid');
    const answerButtons = answersGrid.querySelectorAll('.answer-btn');
    
    answerButtons.forEach((btn, index) => {
        btn.classList.add('disabled');
        if (index === correctIndex) {
            btn.classList.add('correct');
        } else if (index === selectedIndex && selectedIndex !== -1) {
            btn.classList.add('wrong');
        }
    });
    
    // Récupérer l'explication
    const doc = await db.collection('duels').doc(duelState.duelId).get();
    const question = doc.data().questions[duelState.currentQuestion];
    
    // Afficher le feedback textuel
    const feedback = document.getElementById('answerFeedback');
    const feedbackIcon = document.getElementById('feedbackIcon');
    const feedbackText = document.getElementById('feedbackText');
    const feedbackExplanation = document.getElementById('feedbackExplanation');
    
    if (result.isCorrect) {
        feedback.classList.add('show', 'correct');
        feedbackIcon.className = 'fas fa-check feedback-icon correct';
        
        let message = `Bonne réponse ! +${result.points} points`;
        if (duelState.combo > 1) {
            message += ` 🔥 Combo x${duelState.combo} !`;
        }
        feedbackText.textContent = message;
        feedbackText.className = 'feedback-text correct';
        
        // Lancer les confettis !
        createConfetti();
    } else {
        feedback.classList.add('show', 'wrong');
        feedbackIcon.className = 'fas fa-times feedback-icon wrong';
        
        if (selectedIndex === -1) {
            feedbackText.textContent = '⏱️ Temps écoulé !';
        } else {
            feedbackText.textContent = '❌ Mauvaise réponse !';
        }
        feedbackText.className = 'feedback-text wrong';
    }
    
    if (question.explanation) {
        feedbackExplanation.textContent = question.explanation;
    }
    
    // Afficher le bouton suivant
    const btnNext = document.getElementById('btnNext');
    btnNext.style.display = 'flex';
    btnNext.onclick = nextQuestion;
}

async function nextQuestion() {
    duelState.currentQuestion++;
    
    if (duelState.currentQuestion >= CONFIG.totalQuestions) {
        // Fin du duel
        await finishDuel(duelState.duelId);
    } else {
        loadQuestion();
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

function updateGameScreen(duelData) {
    updatePlayerCards(duelData);
}

// ===========================
// RESULTS
// ===========================
function showResults(duelData) {
    if (duelState.timerInterval) {
        clearInterval(duelState.timerInterval);
    }
    
    document.getElementById('gameContent').classList.add('hidden');
    const resultsScreen = document.getElementById('resultsScreen');
    resultsScreen.classList.remove('hidden');
    
    const user = getCurrentUser();
    const isPlayer1 = duelData.player1.uid === user.uid;
    const currentPlayer = isPlayer1 ? duelData.player1 : duelData.player2;
    const opponent = isPlayer1 ? duelData.player2 : duelData.player1;
    
    // Déterminer le résultat
    const resultTitle = document.getElementById('resultTitle');
    const eloChangeElement = document.getElementById('eloChange');
    const player1Result = document.getElementById('player1Result');
    const player2Result = document.getElementById('player2Result');
    
    let eloChange = 0;
    if (isPlayer1) {
        eloChange = duelData.eloChanges.winnerChange;
    } else {
        eloChange = duelData.eloChanges.loserChange;
    }
    
    if (duelData.isDraw) {
        resultTitle.textContent = 'Match nul !';
        resultTitle.className = 'result-title draw';
    } else if ((duelData.winner === 1 && isPlayer1) || (duelData.winner === 2 && !isPlayer1)) {
        resultTitle.textContent = 'Victoire !';
        resultTitle.className = 'result-title victory';
        player1Result.classList.add('winner');
    } else {
        resultTitle.textContent = 'Défaite';
        resultTitle.className = 'result-title defeat';
        player2Result.classList.add('winner');
    }
    
    // Afficher le changement d'ELO
    eloChangeElement.innerHTML = `
        <i class="fas fa-arrow-${eloChange >= 0 ? 'up' : 'down'}"></i>
        <span>${eloChange >= 0 ? '+' : ''}${eloChange} ELO</span>
    `;
    eloChangeElement.className = `elo-change ${eloChange >= 0 ? 'positive' : 'negative'}`;
    
    // Afficher les stats des joueurs
    document.getElementById('player1NameResult').textContent = currentPlayer.displayName;
    document.getElementById('player1FinalScore').textContent = currentPlayer.score;
    document.getElementById('player1Correct').textContent = currentPlayer.answers.filter(a => a.isCorrect).length;
    document.getElementById('player1NewElo').textContent = currentPlayer.elo + eloChange;
    
    document.getElementById('player2NameResult').textContent = opponent.displayName;
    document.getElementById('player2FinalScore').textContent = opponent.score;
    document.getElementById('player2Correct').textContent = opponent.answers.filter(a => a.isCorrect).length;
    document.getElementById('player2NewElo').textContent = opponent.elo + (isPlayer1 ? duelData.eloChanges.loserChange : duelData.eloChanges.winnerChange);
    
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
}