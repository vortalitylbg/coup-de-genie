// ===========================
// CONFIGURATION & CONSTANTS
// ===========================
const CONFIG = {
    totalQuestions: 10,
    timePerQuestion: 30,
    pointsPerCorrectAnswer: 100,
    bonusTimePoints: 10,
    maxCategorySelection: 5,
    particles: {
        count: 30,
        minSpeed: 20,
        maxSpeed: 60
    }
};

// ===========================
// CATEGORY SELECTION STATE
// ===========================
let categoryState = {
    selectedCategories: [],
    allCategoriesSelected: false
};

// ===========================
// GAME STATE
// ===========================
let gameState = {
    currentQuestion: 0,
    score: 0,
    correctAnswers: 0,
    wrongAnswers: 0,
    timeRemaining: CONFIG.timePerQuestion,
    timerInterval: null,
    answerSelected: false,
    questions: [],
    startTime: null,
    questionTimes: [],
    gameStarted: false
};

// Store for Firebase questions
let FIREBASE_QUESTIONS = [];

// ===========================
// INITIALIZATION
// ===========================
document.addEventListener('DOMContentLoaded', async () => {
    // Load questions from Firebase
    await loadFirebaseQuestions();
    
    initCategoryModal();
    initParticles();
    initConfetti();
    showCategoryModal();
});

async function loadFirebaseQuestions() {
    try {
        const result = await loadQuestionsFromFirebase();
        
        if (result.success && result.questions.length > 0) {
            FIREBASE_QUESTIONS = result.questions;
            console.log(`✅ ${FIREBASE_QUESTIONS.length} questions chargées depuis Firebase`);
        } else {
            console.log('⚠️ Aucune question dans Firebase, utilisation des questions locales');
            FIREBASE_QUESTIONS = QUESTIONS;
        }
    } catch (error) {
        console.error('❌ Erreur chargement questions Firebase:', error);
        // Fallback to local questions
        FIREBASE_QUESTIONS = QUESTIONS;
        console.log('⚠️ Utilisation des questions locales en secours');
    }
}

function initCategoryModal() {
    // Générer la grille de catégories
    const categoriesGrid = document.getElementById('categoriesGrid');
    categoriesGrid.innerHTML = '';
    
    ALL_CATEGORIES.forEach(category => {
        const categoryItem = document.createElement('button');
        categoryItem.className = 'category-item';
        categoryItem.dataset.category = category;
        
        const icon = CATEGORY_ICONS[category] || 'fa-question';
        
        categoryItem.innerHTML = `
            <i class="fas ${icon} category-item-icon"></i>
            <span class="category-item-name">${category}</span>
            <i class="fas fa-check category-check"></i>
        `;
        
        categoryItem.addEventListener('click', () => toggleCategory(category, categoryItem));
        categoriesGrid.appendChild(categoryItem);
    });
    
    // Bouton "Toutes les catégories"
    document.getElementById('categoryAllBtn').addEventListener('click', toggleAllCategories);
    
    // Bouton "Annuler"
    document.getElementById('btnCancelCategory').addEventListener('click', () => {
        window.location.href = 'index.html';
    });
    
    // Bouton "Commencer"
    document.getElementById('btnStartGame').addEventListener('click', startGameWithCategories);
}

function showCategoryModal() {
    document.getElementById('categoryModal').classList.remove('hidden');
    document.querySelector('.game-header').style.display = 'none';
    document.querySelector('.game-content').style.display = 'none';
}

function hideCategoryModal() {
    document.getElementById('categoryModal').classList.add('hidden');
    document.querySelector('.game-header').style.display = 'flex';
    document.querySelector('.game-content').style.display = 'block';
}

function toggleCategory(category, element) {
    if (categoryState.allCategoriesSelected) {
        // Désélectionner "Toutes les catégories" si on clique sur une catégorie spécifique
        categoryState.allCategoriesSelected = false;
        document.getElementById('categoryAllBtn').classList.remove('selected');
    }
    
    const index = categoryState.selectedCategories.indexOf(category);
    
    if (index > -1) {
        // Désélectionner
        categoryState.selectedCategories.splice(index, 1);
        element.classList.remove('selected');
    } else {
        // Sélectionner (max 5)
        if (categoryState.selectedCategories.length < CONFIG.maxCategorySelection) {
            categoryState.selectedCategories.push(category);
            element.classList.add('selected');
        }
    }
    
    updateCategoryUI();
}

function toggleAllCategories() {
    const allBtn = document.getElementById('categoryAllBtn');
    const categoryItems = document.querySelectorAll('.category-item');
    
    categoryState.allCategoriesSelected = !categoryState.allCategoriesSelected;
    
    if (categoryState.allCategoriesSelected) {
        allBtn.classList.add('selected');
        categoryState.selectedCategories = [];
        categoryItems.forEach(item => item.classList.remove('selected'));
    } else {
        allBtn.classList.remove('selected');
    }
    
    updateCategoryUI();
}

function updateCategoryUI() {
    const count = categoryState.allCategoriesSelected ? ALL_CATEGORIES.length : categoryState.selectedCategories.length;
    document.getElementById('categoryCount').textContent = count;
    
    const startBtn = document.getElementById('btnStartGame');
    const canStart = categoryState.allCategoriesSelected || categoryState.selectedCategories.length > 0;
    startBtn.disabled = !canStart;
    
    // Désactiver les catégories non sélectionnées si on a atteint la limite
    if (categoryState.selectedCategories.length >= CONFIG.maxCategorySelection && !categoryState.allCategoriesSelected) {
        document.querySelectorAll('.category-item').forEach(item => {
            if (!item.classList.contains('selected')) {
                item.classList.add('disabled');
            }
        });
    } else {
        document.querySelectorAll('.category-item').forEach(item => {
            item.classList.remove('disabled');
        });
    }
}

function startGameWithCategories() {
    // Filtrer les questions selon les catégories sélectionnées
    let filteredQuestions;
    
    // Use Firebase questions if available, otherwise use local
    const questionsSource = FIREBASE_QUESTIONS.length > 0 ? FIREBASE_QUESTIONS : QUESTIONS;
    
    if (categoryState.allCategoriesSelected) {
        filteredQuestions = [...questionsSource];
    } else {
        filteredQuestions = questionsSource.filter(q => 
            categoryState.selectedCategories.includes(q.category)
        );
    }
    
    // Vérifier qu'on a assez de questions
    if (filteredQuestions.length < CONFIG.totalQuestions) {
        alert(`Pas assez de questions disponibles pour les catégories sélectionnées. Minimum requis : ${CONFIG.totalQuestions}`);
        return;
    }
    
    // Mélanger et sélectionner les questions
    gameState.questions = shuffleArray(filteredQuestions).slice(0, CONFIG.totalQuestions);
    gameState.startTime = Date.now();
    gameState.gameStarted = true;
    
    // Cacher la modal et afficher le jeu
    hideCategoryModal();
    
    // Initialiser les event listeners du jeu
    initGameEventListeners();
    
    // Démarrer le jeu
    displayQuestion();
    startTimer();
}

function initGameEventListeners() {
    const answerButtons = document.querySelectorAll('.answer-btn');
    answerButtons.forEach(btn => {
        btn.addEventListener('click', () => handleAnswerClick(btn));
    });
    
    document.getElementById('btnNext').addEventListener('click', nextQuestion);
    document.getElementById('btnReplay').addEventListener('click', replayGame);
    document.getElementById('btnHome').addEventListener('click', goHome);
}

// ===========================
// GAME LOGIC
// ===========================
function displayQuestion() {
    const question = gameState.questions[gameState.currentQuestion];
    
    document.getElementById('questionNumber').textContent = `Question ${gameState.currentQuestion + 1}`;
    document.getElementById('progressText').textContent = `Question ${gameState.currentQuestion + 1}/${CONFIG.totalQuestions}`;
    
    const progress = ((gameState.currentQuestion) / CONFIG.totalQuestions) * 100;
    document.getElementById('progressBar').style.width = `${progress}%`;
    
    document.getElementById('questionText').textContent = question.question;
    
    // Afficher la catégorie avec icône Font Awesome
    const categoryElement = document.getElementById('questionCategory');
    const iconClass = CATEGORY_ICONS[question.category] || 'fa-book';
    categoryElement.innerHTML = `
        <i class="fas ${iconClass} category-icon"></i>
        <span class="category-name">${question.category}</span>
    `;
    
    const answerButtons = document.querySelectorAll('.answer-btn');
    question.answers.forEach((answer, index) => {
        const btn = answerButtons[index];
        btn.querySelector('.answer-text').textContent = answer;
        btn.classList.remove('correct', 'wrong', 'disabled');
        btn.disabled = false;
    });
    
    document.getElementById('answerFeedback').classList.remove('show');
    document.getElementById('btnNext').style.display = 'none';
    
    gameState.answerSelected = false;
    gameState.timeRemaining = CONFIG.timePerQuestion;
    
    document.getElementById('questionCard').classList.add('animate-in');
    setTimeout(() => {
        document.getElementById('questionCard').classList.remove('animate-in');
    }, 500);
}

function handleAnswerClick(button) {
    if (gameState.answerSelected) return;
    
    gameState.answerSelected = true;
    const selectedAnswer = parseInt(button.dataset.answer);
    const question = gameState.questions[gameState.currentQuestion];
    const isCorrect = selectedAnswer === question.correct;
    
    clearInterval(gameState.timerInterval);
    gameState.questionTimes.push(CONFIG.timePerQuestion - gameState.timeRemaining);
    
    const answerButtons = document.querySelectorAll('.answer-btn');
    answerButtons.forEach(btn => {
        btn.classList.add('disabled');
        btn.disabled = true;
    });
    
    answerButtons[question.correct].classList.add('correct');
    
    if (isCorrect) {
        button.classList.add('correct');
        gameState.correctAnswers++;
        
        const timeBonus = Math.floor(gameState.timeRemaining * CONFIG.bonusTimePoints);
        const points = CONFIG.pointsPerCorrectAnswer + timeBonus;
        gameState.score += points;
        
        animateScore(points);
        showFeedback(true, question.explanation, timeBonus);
        
        // Lancer les confettis !
        launchConfetti();
    } else {
        button.classList.add('wrong');
        gameState.wrongAnswers++;
        showFeedback(false, question.explanation);
    }
    
    setTimeout(() => {
        document.getElementById('btnNext').style.display = 'flex';
    }, 1000);
}

function showFeedback(isCorrect, explanation, timeBonus = 0) {
    const feedbackElement = document.getElementById('answerFeedback');
    const iconElement = document.getElementById('feedbackIcon');
    const textElement = document.getElementById('feedbackText');
    const explanationElement = document.getElementById('feedbackExplanation');
    
    if (isCorrect) {
        iconElement.className = 'fas fa-check feedback-icon correct';
        textElement.textContent = timeBonus > 0 
            ? `Excellent ! +${timeBonus} points bonus !` 
            : 'Bonne réponse !';
        textElement.className = 'feedback-text correct';
    } else {
        iconElement.className = 'fas fa-times feedback-icon wrong';
        textElement.textContent = 'Dommage !';
        textElement.className = 'feedback-text wrong';
    }
    
    explanationElement.textContent = explanation;
    feedbackElement.classList.add('show');
}

function nextQuestion() {
    gameState.currentQuestion++;
    
    if (gameState.currentQuestion >= CONFIG.totalQuestions) {
        endGame();
    } else {
        displayQuestion();
        startTimer();
    }
}

function startTimer() {
    const timerElement = document.getElementById('timerValue');
    const timerBox = document.getElementById('timerBox');
    
    timerBox.classList.remove('warning', 'danger');
    
    gameState.timerInterval = setInterval(() => {
        gameState.timeRemaining--;
        timerElement.textContent = gameState.timeRemaining;
        
        if (gameState.timeRemaining <= 10) {
            timerBox.classList.add('warning');
        }
        
        if (gameState.timeRemaining <= 5) {
            timerBox.classList.add('danger');
        }
        
        if (gameState.timeRemaining <= 0) {
            clearInterval(gameState.timerInterval);
            if (!gameState.answerSelected) {
                handleTimeout();
            }
        }
    }, 1000);
}

function handleTimeout() {
    gameState.answerSelected = true;
    gameState.wrongAnswers++;
    gameState.questionTimes.push(CONFIG.timePerQuestion);
    
    const question = gameState.questions[gameState.currentQuestion];
    const answerButtons = document.querySelectorAll('.answer-btn');
    
    answerButtons.forEach((btn, index) => {
        btn.classList.add('disabled');
        btn.disabled = true;
        if (index === question.correct) {
            btn.classList.add('correct');
        }
    });
    
    showFeedback(false, question.explanation);
    
    setTimeout(() => {
        document.getElementById('btnNext').style.display = 'flex';
    }, 1000);
}

function animateScore(points) {
    const scoreElement = document.getElementById('scoreValue');
    const currentScore = gameState.score - points;
    const duration = 500;
    const steps = 20;
    const increment = points / steps;
    let step = 0;
    
    const timer = setInterval(() => {
        step++;
        const newScore = Math.floor(currentScore + (increment * step));
        scoreElement.textContent = newScore;
        
        if (step >= steps) {
            clearInterval(timer);
            scoreElement.textContent = gameState.score;
        }
    }, duration / steps);
    
    scoreElement.parentElement.classList.add('score-pulse');
    setTimeout(() => {
        scoreElement.parentElement.classList.remove('score-pulse');
    }, 500);
}

async function endGame() {
    clearInterval(gameState.timerInterval);
    
    const avgTime = gameState.questionTimes.reduce((a, b) => a + b, 0) / gameState.questionTimes.length;
    
    document.getElementById('finalScore').textContent = gameState.score;
    document.getElementById('correctAnswers').textContent = gameState.correctAnswers;
    document.getElementById('wrongAnswers').textContent = gameState.wrongAnswers;
    document.getElementById('avgTime').textContent = avgTime.toFixed(1) + 's';
    
    const percentage = (gameState.correctAnswers / CONFIG.totalQuestions) * 100;
    let message = '';
    
    if (percentage === 100) {
        message = 'Parfait ! Vous êtes un expert !';
        launchConfetti(true); // Confettis massifs pour score parfait
    } else if (percentage >= 80) {
        message = 'Excellent ! Très bonne performance !';
    } else if (percentage >= 60) {
        message = 'Bien joué ! Continuez comme ça !';
    } else if (percentage >= 40) {
        message = 'Pas mal ! Encore un petit effort !';
    } else {
        message = 'Continuez à vous entraîner !';
    }
    
    document.getElementById('scoreMessage').textContent = message;
    document.getElementById('gameOverModal').classList.add('show');
    
    // Save game result to Firebase if user is logged in
    const selectedCats = categoryState.allCategoriesSelected ? ['all'] : categoryState.selectedCategories;
    await saveGameResult({
        score: gameState.score,
        correctAnswers: gameState.correctAnswers,
        wrongAnswers: gameState.wrongAnswers,
        categories: selectedCats
    });
}

function replayGame() {
    document.getElementById('gameOverModal').classList.remove('show');
    
    // Réinitialiser l'état du jeu
    gameState = {
        currentQuestion: 0,
        score: 0,
        correctAnswers: 0,
        wrongAnswers: 0,
        timeRemaining: CONFIG.timePerQuestion,
        timerInterval: null,
        answerSelected: false,
        questions: [],
        startTime: null,
        questionTimes: [],
        gameStarted: false
    };
    
    // Réinitialiser l'état des catégories
    categoryState = {
        selectedCategories: [],
        allCategoriesSelected: false
    };
    
    document.getElementById('scoreValue').textContent = '0';
    document.getElementById('timerValue').textContent = CONFIG.timePerQuestion;
    
    // Réafficher la modal de sélection de catégories
    showCategoryModal();
    
    // Réinitialiser l'interface de sélection
    document.querySelectorAll('.category-item').forEach(item => {
        item.classList.remove('selected', 'disabled');
    });
    document.getElementById('categoryAllBtn').classList.remove('selected');
    updateCategoryUI();
}

function goHome() {
    window.location.href = 'index.html';
}

// ===========================
// CONFETTI SYSTEM
// ===========================
let confettiCanvas, confettiCtx, confettiParticles = [];

function initConfetti() {
    confettiCanvas = document.getElementById('confetti-canvas');
    confettiCtx = confettiCanvas.getContext('2d');
    confettiCanvas.width = window.innerWidth;
    confettiCanvas.height = window.innerHeight;
    
    window.addEventListener('resize', () => {
        confettiCanvas.width = window.innerWidth;
        confettiCanvas.height = window.innerHeight;
    });
}

function launchConfetti(massive = false) {
    const colors = ['#2563eb', '#7c3aed', '#fbbf24', '#10b981', '#ef4444', '#3b82f6', '#8b5cf6', '#fcd34d'];
    const particleCount = massive ? 150 : 50;
    
    for (let i = 0; i < particleCount; i++) {
        confettiParticles.push({
            x: Math.random() * confettiCanvas.width,
            y: -20,
            vx: (Math.random() - 0.5) * 10,
            vy: Math.random() * 5 + 5,
            rotation: Math.random() * 360,
            rotationSpeed: (Math.random() - 0.5) * 10,
            size: Math.random() * 8 + 4,
            color: colors[Math.floor(Math.random() * colors.length)],
            gravity: 0.3,
            life: 200
        });
    }
    
    animateConfetti();
}

function animateConfetti() {
    confettiCtx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
    
    confettiParticles = confettiParticles.filter(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += p.gravity;
        p.rotation += p.rotationSpeed;
        p.life--;
        
        confettiCtx.save();
        confettiCtx.translate(p.x, p.y);
        confettiCtx.rotate(p.rotation * Math.PI / 180);
        confettiCtx.fillStyle = p.color;
        confettiCtx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
        confettiCtx.restore();
        
        return p.life > 0 && p.y < confettiCanvas.height + 50;
    });
    
    if (confettiParticles.length > 0) {
        requestAnimationFrame(animateConfetti);
    }
}

// ===========================
// PARTICLES BACKGROUND
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
// UTILITY FUNCTIONS
// ===========================
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

// ===========================
// CONSOLE MESSAGE
// ===========================
console.log('%cCluture Quiz Game', 'font-size: 24px; font-weight: bold; color: #2563eb;');
console.log('%cBonne chance ! ', 'font-size: 14px; color: #7c3aed;');