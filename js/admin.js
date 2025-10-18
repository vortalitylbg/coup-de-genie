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
    populateCategorySelects();
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
    document.getElementById('btnMigrateQuestions').addEventListener('click', handleMigration);
    document.getElementById('btnExportQuestions').addEventListener('click', handleExport);
    document.getElementById('btnImportQuestions').addEventListener('click', () => document.getElementById('importFile').click());
    document.getElementById('importFile').addEventListener('change', handleImport);
    document.getElementById('btnCloseModal').addEventListener('click', closeQuestionModal);
    document.getElementById('btnCancelModal').addEventListener('click', closeQuestionModal);
    document.getElementById('modalOverlay').addEventListener('click', closeQuestionModal);
    document.getElementById('btnSaveQuestion').addEventListener('click', handleSaveQuestion);
    document.getElementById('categoryFilter').addEventListener('change', filterQuestions);
    document.getElementById('searchInput').addEventListener('input', filterQuestions);
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
                <div class="question-item-category">
                    <i class="fas ${CATEGORY_ICONS[q.category] || 'fa-question'}"></i>
                    <span>${q.category}</span>
                </div>
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
    const categoryFilter = document.getElementById('categoryFilter').value;
    const searchQuery = document.getElementById('searchInput').value.toLowerCase();
    
    let filtered = allQuestions;
    
    // Filter by category
    if (categoryFilter) {
        filtered = filtered.filter(q => q.category === categoryFilter);
    }
    
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
            document.getElementById('questionCategory').value = question.category;
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
        category: document.getElementById('questionCategory').value,
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
            alert(editingQuestionId ? 'Question modifiée avec succès !' : 'Question ajoutée avec succès !');
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
// MIGRATION
// ===========================
async function handleMigration() {
    if (!confirm(`Voulez-vous migrer les ${QUESTIONS.length} questions locales vers Firebase ?\n\nAttention : Cette opération peut prendre du temps.`)) {
        return;
    }
    
    const btn = document.getElementById('btnMigrateQuestions');
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin btn-icon"></i><span class="btn-text">Migration en cours...</span>';
    
    try {
        const result = await migrateQuestionsToFirebase(QUESTIONS);
        if (result.success) {
            alert(`Migration réussie ! ${result.count} questions ont été migrées.`);
            loadDashboardData();
        } else {
            alert('Erreur : ' + result.error);
        }
    } catch (error) {
        console.error('Error during migration:', error);
        alert('Erreur lors de la migration');
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-database btn-icon"></i><span class="btn-text">Migrer les questions locales</span>';
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
        let csv = 'Catégorie,Question,Réponse A,Réponse B,Réponse C,Réponse D,Bonne réponse,Explication\n';
        
        allQuestions.forEach(q => {
            const answers = q.answers.map(a => `"${a.replace(/"/g, '""')}"`).join(',');
            const correctAnswer = String.fromCharCode(65 + q.correct);
            const category = `"${q.category.replace(/"/g, '""')}"`;
            const question = `"${q.question.replace(/"/g, '""')}"`;
            const explanation = `"${q.explanation.replace(/"/g, '""')}"`;
            
            csv += `${category},${question},${answers},${correctAnswer},${explanation}\n`;
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
// IMPORT QUESTIONS
// ===========================
async function handleImport(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    try {
        const text = await file.text();
        const lines = text.split('\n').filter(line => line.trim());
        
        if (lines.length < 2) {
            alert('Le fichier CSV est vide ou invalide');
            return;
        }
        
        // Ignorer l'entête
        const questions = [];
        let invalidRows = 0;
        
        for (let i = 1; i < lines.length; i++) {
            const row = parseCSVLine(lines[i]);
            
            if (row.length < 8) {
                invalidRows++;
                continue;
            }
            
            const [category, question, answerA, answerB, answerC, answerD, correctAnswer, explanation] = row;
            
            if (!category || !question || !answerA || !answerB || !answerC || !answerD || !correctAnswer || !explanation) {
                invalidRows++;
                continue;
            }
            
            // Convertir la réponse correcte (A, B, C, D) en index (0, 1, 2, 3)
            const correctIndex = correctAnswer.trim().toUpperCase().charCodeAt(0) - 65;
            if (correctIndex < 0 || correctIndex > 3) {
                invalidRows++;
                continue;
            }
            
            questions.push({
                category: category.trim(),
                question: question.trim(),
                answers: [answerA.trim(), answerB.trim(), answerC.trim(), answerD.trim()],
                correct: correctIndex,
                explanation: explanation.trim()
            });
        }
        
        if (questions.length === 0) {
            alert('Aucune question valide trouvée dans le fichier');
            return;
        }
        
        // Confirmation avant import
        if (!confirm(`${questions.length} questions seront importées.\n\nContinuer ?`)) {
            return;
        }
        
        const btn = document.getElementById('btnImportQuestions');
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin btn-icon"></i><span class="btn-text">Import en cours...</span>';
        
        // Importer les questions une par une
        let imported = 0;
        for (const q of questions) {
            const result = await addQuestion(q);
            if (result.success) {
                imported++;
            }
        }
        
        alert(`Import réussi ! ${imported}/${questions.length} questions ont été importées.\n${invalidRows > 0 ? `(${invalidRows} lignes invalides ignorées)` : ''}`);
        loadDashboardData();
        
    } catch (error) {
        console.error('❌ Erreur import:', error);
        alert('Erreur lors de l\'import : ' + error.message);
    } finally {
        const btn = document.getElementById('btnImportQuestions');
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-upload btn-icon"></i><span class="btn-text">Importer (CSV)</span>';
        // Réinitialiser l'input file
        event.target.value = '';
    }
}

// ===========================
// CSV PARSER
// ===========================
function parseCSVLine(line) {
    const result = [];
    let current = '';
    let insideQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        
        if (char === '"') {
            insideQuotes = !insideQuotes;
        } else if (char === ',' && !insideQuotes) {
            result.push(current);
            current = '';
        } else {
            current += char;
        }
    }
    
    result.push(current);
    return result.map(item => item.replace(/^"|"$/g, '').replace(/""/g, '"'));
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
// POPULATE SELECTS
// ===========================
function populateCategorySelects() {
    const categorySelect = document.getElementById('questionCategory');
    const categoryFilter = document.getElementById('categoryFilter');
    
    ALL_CATEGORIES.forEach(category => {
        const option1 = document.createElement('option');
        option1.value = category;
        option1.textContent = category;
        categorySelect.appendChild(option1);
        
        const option2 = document.createElement('option');
        option2.value = category;
        option2.textContent = category;
        categoryFilter.appendChild(option2);
    });
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