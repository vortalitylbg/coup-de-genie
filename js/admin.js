// ===========================
// ADMIN PANEL JAVASCRIPT
// ===========================

let allQuestions = [];
let editingQuestionId = null;

// ===========================
// INITIALIZATION
// ===========================
document.addEventListener('DOMContentLoaded', () => {
    initParticles();
    initEventListeners();
});

// Check if user is admin - Called automatically by Firebase observer
window.onAuthStateChanged = function(isLoggedIn, user, isAdminUser) {
    console.log('🔐 Admin Panel - Auth State:', { isLoggedIn, user: user?.email, isAdminUser });
    
    if (!isLoggedIn || !isAdminUser) {
        console.warn('⚠️ Accès refusé au panel admin');
        alert('Accès refusé. Vous devez être administrateur pour accéder à cette page.');
        window.location.href = 'index.html';
    } else {
        console.log('✅ Accès admin autorisé');
        loadDashboardData();
    }
}

// ===========================
// EVENT LISTENERS
// ===========================
function initEventListeners() {
    document.getElementById('btnLogout').addEventListener('click', handleLogout);
    document.getElementById('btnAddQuestion').addEventListener('click', () => openQuestionModal());
    document.getElementById('btnScanDuplicates').addEventListener('click', handleScanDuplicates);
    document.getElementById('btnExportQuestions').addEventListener('click', handleExport);
    document.getElementById('btnCloseModal').addEventListener('click', closeQuestionModal);
    document.getElementById('btnCancelModal').addEventListener('click', closeQuestionModal);
    document.getElementById('modalOverlay').addEventListener('click', closeQuestionModal);
    document.getElementById('btnSaveQuestion').addEventListener('click', handleSaveQuestion);
    document.getElementById('searchInput').addEventListener('input', filterQuestions);
    document.getElementById('btnCloseDuplicateModal').addEventListener('click', closeDuplicateModal);
    document.getElementById('btnCloseDuplicateModalFooter').addEventListener('click', closeDuplicateModal);
    document.getElementById('duplicateModalOverlay').addEventListener('click', closeDuplicateModal);
}

// ===========================
// DASHBOARD DATA
// ===========================
async function loadDashboardData() {
    try {
        console.log('📊 Chargement des données du dashboard...');
        
        // Load questions
        const result = await loadQuestionsFromFirebase();
        console.log('📦 Résultat du chargement:', result);
        
        if (result.success) {
            allQuestions = result.questions || [];
            console.log(`✅ ${allQuestions.length} questions chargées dans le panel admin`);
        } else {
            console.error('❌ Erreur chargement questions:', result.error);
            allQuestions = [];
        }
        
        document.getElementById('totalQuestions').textContent = allQuestions.length;
        
        // Load users count
        const usersSnapshot = await db.collection('users').get();
        document.getElementById('totalUsers').textContent = usersSnapshot.size;
        
        // Display questions
        displayQuestions(allQuestions);
        
        console.log('✅ Dashboard chargé avec succès');
    } catch (error) {
        console.error('❌ Error loading dashboard data:', error);
        console.error('❌ Stack:', error.stack);
        alert('Erreur lors du chargement des données: ' + error.message);
    }
}

// ===========================
// QUESTIONS DISPLAY
// ===========================
function displayQuestions(questions) {
    const questionsList = document.getElementById('questionsList');
    
    if (questions.length === 0) {
        questionsList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-inbox"></i>
                <p>Aucune question trouvée</p>
            </div>
        `;
        return;
    }
    
    questionsList.innerHTML = questions.map(q => `
        <div class="question-item" data-id="${q.id}">
            <div class="question-item-header">
                <div class="question-item-actions">
                    <button class="btn-icon btn-edit" onclick="editQuestion('${q.id}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-icon btn-delete" onclick="deleteQuestionConfirm('${q.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
            <div class="question-item-text">${q.question}</div>
            <div class="question-item-answers">
                ${q.answers.map((answer, index) => `
                    <div class="answer-chip ${index === q.correct ? 'correct' : ''}">
                        ${String.fromCharCode(65 + index)}. ${answer}
                        ${index === q.correct ? '<i class="fas fa-check"></i>' : ''}
                    </div>
                `).join('')}
            </div>
            <div class="question-item-explanation">
                <i class="fas fa-lightbulb"></i>
                ${q.explanation}
            </div>
        </div>
    `).join('');
}

// ===========================
// FILTER & SEARCH
// ===========================
function filterQuestions() {
    const searchQuery = document.getElementById('searchInput').value.toLowerCase();
    
    let filtered = allQuestions;
    
    // Filter by search query
    if (searchQuery) {
        filtered = filtered.filter(q => 
            q.question.toLowerCase().includes(searchQuery) ||
            q.answers.some(a => a.toLowerCase().includes(searchQuery)) ||
            q.explanation.toLowerCase().includes(searchQuery)
        );
    }
    
    displayQuestions(filtered);
}

// ===========================
// MODAL MANAGEMENT
// ===========================
function openQuestionModal(questionId = null) {
    editingQuestionId = questionId;
    const modal = document.getElementById('questionModal');
    const modalTitle = document.getElementById('modalTitle');
    
    if (questionId) {
        // Edit mode
        modalTitle.innerHTML = '<i class="fas fa-edit"></i> Modifier la question';
        const question = allQuestions.find(q => q.id === questionId);
        if (question) {
            document.getElementById('questionId').value = questionId;
            document.getElementById('questionText').value = question.question;
            document.getElementById('answer0').value = question.answers[0];
            document.getElementById('answer1').value = question.answers[1];
            document.getElementById('answer2').value = question.answers[2];
            document.getElementById('answer3').value = question.answers[3];
            document.querySelector(`input[name="correctAnswer"][value="${question.correct}"]`).checked = true;
            document.getElementById('questionExplanation').value = question.explanation;
        }
    } else {
        // Add mode
        modalTitle.innerHTML = '<i class="fas fa-plus"></i> Ajouter une question';
        document.getElementById('questionForm').reset();
        document.getElementById('questionId').value = '';
    }
    
    modal.classList.add('show');
}

function closeQuestionModal() {
    const modal = document.getElementById('questionModal');
    modal.classList.remove('show');
    editingQuestionId = null;
}

// ===========================
// SAVE QUESTION
// ===========================
async function handleSaveQuestion() {
    const form = document.getElementById('questionForm');
    
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }
    
    const questionData = {
        question: document.getElementById('questionText').value.trim(),
        answers: [
            document.getElementById('answer0').value.trim(),
            document.getElementById('answer1').value.trim(),
            document.getElementById('answer2').value.trim(),
            document.getElementById('answer3').value.trim()
        ],
        correct: parseInt(document.querySelector('input[name="correctAnswer"]:checked').value),
        explanation: document.getElementById('questionExplanation').value.trim()
    };
    
    const saveBtn = document.getElementById('btnSaveQuestion');
    saveBtn.disabled = true;
    saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin btn-icon"></i><span class="btn-text">Enregistrement...</span>';
    
    try {
        let result;
        if (editingQuestionId) {
            result = await updateQuestion(editingQuestionId, questionData);
        } else {
            result = await addQuestion(questionData);
        }
        
        if (result.success) {
            closeQuestionModal();
            loadDashboardData();
        } else {
            alert('Erreur : ' + result.error);
        }
    } catch (error) {
        console.error('Error saving question:', error);
        alert('Erreur lors de l\'enregistrement');
    } finally {
        saveBtn.disabled = false;
        saveBtn.innerHTML = '<i class="fas fa-save btn-icon"></i><span class="btn-text">Enregistrer</span>';
    }
}

// ===========================
// EDIT QUESTION
// ===========================
function editQuestion(questionId) {
    openQuestionModal(questionId);
}

// ===========================
// DELETE QUESTION
// ===========================
async function deleteQuestionConfirm(questionId) {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette question ?')) {
        return;
    }
    
    try {
        const result = await deleteQuestion(questionId);
        if (result.success) {
            alert('Question supprimée avec succès !');
            loadDashboardData();
        } else {
            alert('Erreur : ' + result.error);
        }
    } catch (error) {
        console.error('Error deleting question:', error);
        alert('Erreur lors de la suppression');
    }
}

// ===========================
// EXPORT QUESTIONS
// ===========================
function handleExport() {
    if (allQuestions.length === 0) {
        alert('Aucune question à exporter');
        return;
    }
    
    try {
        // Convertir les questions en CSV
        let csv = 'Question,Réponse A,Réponse B,Réponse C,Réponse D,Bonne réponse,Explication\n';
        
        allQuestions.forEach(q => {
            const answers = q.answers.map(a => `"${a.replace(/"/g, '""')}"`).join(',');
            const correctAnswer = String.fromCharCode(65 + q.correct);
            const question = `"${q.question.replace(/"/g, '""')}"`;
            const explanation = `"${q.explanation.replace(/"/g, '""')}"`;
            
            csv += `${question},${answers},${correctAnswer},${explanation}\n`;
        });
        
        // Créer un blob et télécharger
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        
        link.setAttribute('href', url);
        link.setAttribute('download', `cerebro-questions-${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        console.log('✅ Export réussi : ' + allQuestions.length + ' questions exportées');
        alert(`Export réussi ! ${allQuestions.length} questions ont été téléchargées.`);
    } catch (error) {
        console.error('❌ Erreur export:', error);
        alert('Erreur lors de l\'export : ' + error.message);
    }
}

// ===========================
// LOGOUT
// ===========================
async function handleLogout() {
    if (confirm('Voulez-vous vraiment vous déconnecter ?')) {
        const result = await signOut();
        if (result.success) {
            window.location.href = 'index.html';
        }
    }
}

// ===========================
// CATEGORY FILTER (désactivé - plus de catégories)
// ===========================
// Fonction supprimée - les questions n'ont plus de catégories

// ===========================
// DUPLICATE SCANNER
// ===========================

/**
 * Normalise un texte pour la comparaison
 */
function normalizeText(text) {
    return text
        .toLowerCase()
        .trim()
        .replace(/[éèêë]/g, 'e')
        .replace(/[àâä]/g, 'a')
        .replace(/[ùûü]/g, 'u')
        .replace(/[ôö]/g, 'o')
        .replace(/[îï]/g, 'i')
        .replace(/[ç]/g, 'c')
        .replace(/[^a-z0-9\s]/g, '') // Enlever la ponctuation
        .replace(/\s+/g, ' '); // Normaliser les espaces
}

/**
 * Calcule la similarité entre deux textes (0-1)
 * Utilise une combinaison de Levenshtein et de comparaison de mots
 */
function calculateSimilarity(text1, text2) {
    const norm1 = normalizeText(text1);
    const norm2 = normalizeText(text2);
    
    // Si les textes sont identiques
    if (norm1 === norm2) return 1.0;
    
    // Distance de Levenshtein normalisée
    const distance = levenshteinDistance(norm1, norm2);
    const maxLength = Math.max(norm1.length, norm2.length);
    const levenshteinSimilarity = 1 - (distance / maxLength);
    
    // Similarité basée sur les mots communs
    const words1 = new Set(norm1.split(/\s+/));
    const words2 = new Set(norm2.split(/\s+/));
    const commonWords = [...words1].filter(w => words2.has(w)).length;
    const totalWords = Math.max(words1.size, words2.size);
    const wordSimilarity = totalWords > 0 ? commonWords / totalWords : 0;
    
    // Moyenne pondérée
    return (levenshteinSimilarity * 0.6) + (wordSimilarity * 0.4);
}

/**
 * Calcule la distance de Levenshtein entre deux chaînes
 */
function levenshteinDistance(str1, str2) {
    const matrix = [];
    
    for (let i = 0; i <= str2.length; i++) {
        matrix[i] = [i];
    }
    
    for (let j = 0; j <= str1.length; j++) {
        matrix[0][j] = j;
    }
    
    for (let i = 1; i <= str2.length; i++) {
        for (let j = 1; j <= str1.length; j++) {
            if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                matrix[i][j] = Math.min(
                    matrix[i - 1][j - 1] + 1,
                    matrix[i][j - 1] + 1,
                    matrix[i - 1][j] + 1
                );
            }
        }
    }
    
    return matrix[str2.length][str1.length];
}

/**
 * Charge les paires de doublons ignorées depuis Firestore
 */
async function loadIgnoredPairs() {
    try {
        const ignoredSnapshot = await db.collection('ignoredDuplicatePairs').get();
        const ignoredSet = new Set();
        
        ignoredSnapshot.forEach(doc => {
            const { q1Id, q2Id } = doc.data();
            // Ajouter dans les deux sens pour la comparaison
            ignoredSet.add(`${q1Id}|${q2Id}`);
            ignoredSet.add(`${q2Id}|${q1Id}`);
        });
        
        console.log(`✅ ${ignoredSet.size / 2} paires ignorées chargées`);
        return ignoredSet;
    } catch (error) {
        console.error('❌ Erreur chargement paires ignorées:', error);
        return new Set();
    }
}

/**
 * Sauvegarde une paire de doublons ignorée dans Firestore
 */
async function saveIgnoredPair(q1Id, q2Id) {
    try {
        await db.collection('ignoredDuplicatePairs').add({
            q1Id: q1Id,
            q2Id: q2Id,
            createdAt: new Date(),
            userId: auth.currentUser.uid
        });
        console.log(`✅ Paire ignorée sauvegardée: ${q1Id} - ${q2Id}`);
        return true;
    } catch (error) {
        console.error('❌ Erreur sauvegarde paire ignorée:', error);
        return false;
    }
}

/**
 * Trouve les doublons potentiels dans la liste des questions
 */
async function findDuplicates(questions, threshold = 0.75, ignoredPairs = null) {
    // Charger les paires ignorées si non fournies
    if (!ignoredPairs) {
        ignoredPairs = await loadIgnoredPairs();
    }
    
    const duplicates = [];
    const processedPairs = new Set();
    
    for (let i = 0; i < questions.length; i++) {
        for (let j = i + 1; j < questions.length; j++) {
            const pairKey = `${i}-${j}`;
            if (processedPairs.has(pairKey)) continue;
            
            const q1 = questions[i];
            const q2 = questions[j];
            
            // Vérifier si cette paire a déjà été marquée comme non-doublon
            if (ignoredPairs.has(`${q1.id}|${q2.id}`) || ignoredPairs.has(`${q2.id}|${q1.id}`)) {
                console.log(`⏭️ Paire ignorée: ${q1.id} - ${q2.id}`);
                processedPairs.add(pairKey);
                continue;
            }
            
            const similarity = calculateSimilarity(q1.question, q2.question);
            
            if (similarity >= threshold) {
                duplicates.push({
                    q1: q1,
                    q2: q2,
                    similarity: Math.round(similarity * 100),
                    index1: i,
                    index2: j
                });
            }
            
            processedPairs.add(pairKey);
        }
    }
    
    // Trier par score de similarité (décroissant)
    return duplicates.sort((a, b) => b.similarity - a.similarity);
}

/**
 * Lance le scan des doublons
 */
async function handleScanDuplicates() {
    const scanBtn = document.getElementById('btnScanDuplicates');
    scanBtn.disabled = true;
    scanBtn.innerHTML = '<i class="fas fa-spinner fa-spin btn-icon"></i><span class="btn-text">Scan en cours...</span>';
    
    try {
        // Charger les paires ignorées
        const ignoredPairs = await loadIgnoredPairs();
        console.log(`📊 Scan avec ${ignoredPairs.size / 2} paires ignorées`);
        
        // Trouver les doublons (en excluant les paires ignorées)
        const duplicates = await findDuplicates(allQuestions, 0.75, ignoredPairs);
        
        // Afficher les résultats
        displayDuplicateResults(duplicates);
    } catch (error) {
        console.error('Erreur lors du scan des doublons:', error);
        alert('Erreur lors du scan des doublons: ' + error.message);
    } finally {
        scanBtn.disabled = false;
        scanBtn.innerHTML = '<i class="fas fa-search btn-icon"></i><span class="btn-text">Scanner les doublons</span>';
    }
}

/**
 * Affiche les résultats du scan des doublons
 */
function displayDuplicateResults(duplicates) {
    const modalBody = document.getElementById('duplicateModalBody');
    const modal = document.getElementById('duplicateModal');
    
    if (duplicates.length === 0) {
        modalBody.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-check-circle"></i>
                <p>✅ Aucun doublon trouvé ! Votre base de questions est propre.</p>
            </div>
        `;
    } else {
        let html = `
            <div class="duplicates-info">
                <p><strong>${duplicates.length}</strong> paire(s) de questions similaires détectée(s)</p>
            </div>
            <div class="duplicates-list">
        `;
        
        duplicates.forEach((pair, index) => {
            const similarityClass = pair.similarity >= 95 ? 'high' : pair.similarity >= 85 ? 'medium' : 'low';
            
            html += `
                <div class="duplicate-pair ${similarityClass}" data-index="${index}" data-q1id="${escapeHtml(pair.q1.id)}" data-q2id="${escapeHtml(pair.q2.id)}">
                    <div class="duplicate-pair-header">
                        <div class="similarity-badge" style="background: ${getSimilarityColor(pair.similarity)};">
                            ${pair.similarity}%
                        </div>
                        <span class="similarity-label">Similarité</span>
                    </div>
                    
                    <div class="duplicate-questions">
                        <div class="duplicate-question">
                            <h4>Question 1</h4>
                            <p class="question-text">${escapeHtml(pair.q1.question)}</p>
                            <div class="answers-preview">
                                ${pair.q1.answers.map((a, i) => `
                                    <div class="answer-preview ${i === pair.q1.correct ? 'correct' : ''}">
                                        ${String.fromCharCode(65 + i)}. ${escapeHtml(a)}
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                        
                        <div class="duplicate-question">
                            <h4>Question 2</h4>
                            <p class="question-text">${escapeHtml(pair.q2.question)}</p>
                            <div class="answers-preview">
                                ${pair.q2.answers.map((a, i) => `
                                    <div class="answer-preview ${i === pair.q2.correct ? 'correct' : ''}">
                                        ${String.fromCharCode(65 + i)}. ${escapeHtml(a)}
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    </div>
                    
                    <div class="duplicate-actions">
                        <button class="btn btn-small btn-danger" onclick="handleDeleteDuplicate('${pair.q2.id}', ${index})">
                            <i class="fas fa-trash"></i> Supprimer la 2ème
                        </button>
                        <button class="btn btn-small btn-warning" onclick="handleIgnoreDuplicate(${index})">
                            <i class="fas fa-times"></i> Ce n'est pas un doublon
                        </button>
                    </div>
                </div>
            `;
        });
        
        html += `</div>`;
        modalBody.innerHTML = html;
    }
    
    modal.classList.add('show');
}

/**
 * Retourne la couleur basée sur le pourcentage de similarité
 */
function getSimilarityColor(similarity) {
    if (similarity >= 95) return '#ef4444'; // Red - très probable
    if (similarity >= 85) return '#f59e0b'; // Orange - probable
    return '#3b82f6'; // Blue - possible
}

/**
 * Échappe le HTML pour éviter les injections
 */
function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
}

/**
 * Supprime une question détectée comme doublon
 */
async function handleDeleteDuplicate(questionId, pairIndex) {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette question ? Cette action est irréversible.')) {
        return;
    }
    
    try {
        const result = await deleteQuestion(questionId);
        if (result.success) {
            alert('Question supprimée avec succès !');
            
            // Retirer la paire des résultats affichés
            const pairElement = document.querySelector(`[data-index="${pairIndex}"]`);
            if (pairElement) {
                pairElement.style.opacity = '0.5';
                pairElement.style.textDecoration = 'line-through';
            }
            
            // Recharger après 1 seconde
            setTimeout(() => {
                loadDashboardData();
            }, 1000);
        } else {
            alert('Erreur : ' + result.error);
        }
    } catch (error) {
        console.error('Erreur lors de la suppression:', error);
        alert('Erreur lors de la suppression');
    }
}

/**
 * Rejette une détection de doublon (marque comme "ce n'est pas un doublon")
 */
async function handleIgnoreDuplicate(pairIndex) {
    // Récupérer les IDs des questions
    const pairElement = document.querySelector(`[data-index="${pairIndex}"]`);
    if (!pairElement) return;
    
    const q1Id = pairElement.dataset.q1id;
    const q2Id = pairElement.dataset.q2id;
    
    if (!q1Id || !q2Id) {
        console.error('❌ IDs de questions manquants');
        return;
    }
    
    try {
        // Sauvegarder dans Firestore
        const saved = await saveIgnoredPair(q1Id, q2Id);
        
        if (saved) {
            // Afficher le message de confirmation visuellement
            pairElement.style.opacity = '0.5';
            pairElement.style.backgroundColor = 'rgba(34, 197, 94, 0.1)';
            pairElement.innerHTML = `
                <div class="ignored-message">
                    <i class="fas fa-check-circle"></i>
                    <p>Marqué comme non-doublon ✓</p>
                </div>
            `;
            console.log(`✅ Paire marquée comme non-doublon et sauvegardée`);
        } else {
            alert('Erreur lors de la sauvegarde');
        }
    } catch (error) {
        console.error('❌ Erreur:', error);
        alert('Erreur lors du marquage du non-doublon');
    }
}

/**
 * Ferme la modal des doublons
 */
function closeDuplicateModal() {
    const modal = document.getElementById('duplicateModal');
    modal.classList.remove('show');
}

// ===========================
// PARTICLES ANIMATION
// ===========================
function initParticles() {
    const particlesContainer = document.getElementById('particles');
    const particleCount = 20;
    
    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        particle.style.left = Math.random() * 100 + '%';
        particle.style.animationDelay = Math.random() * 20 + 's';
        particle.style.animationDuration = (Math.random() * 30 + 30) + 's';
        particlesContainer.appendChild(particle);
    }
}