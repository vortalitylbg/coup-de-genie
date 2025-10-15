// ===========================
// FIREBASE DIAGNOSTIC SCRIPT
// ===========================

/**
 * Ce script vérifie que Firebase est correctement configuré
 * et que toutes les fonctionnalités fonctionnent
 */

console.log('🔍 Démarrage du diagnostic Firebase...');

// Fonction pour afficher les résultats
function logResult(test, success, message) {
    const icon = success ? '✅' : '❌';
    console.log(`${icon} ${test}: ${message}`);
    return success;
}

// Attendre que Firebase soit chargé
setTimeout(async () => {
    let allTestsPassed = true;
    
    console.log('\n=== TEST 1: Vérification du chargement Firebase ===');
    
    // Test 1: Firebase est-il chargé ?
    if (typeof firebase === 'undefined') {
        logResult('Firebase SDK', false, 'Firebase SDK non chargé');
        allTestsPassed = false;
        return;
    } else {
        logResult('Firebase SDK', true, 'Firebase SDK chargé');
    }
    
    // Test 2: Firebase est-il initialisé ?
    try {
        const app = firebase.app();
        logResult('Firebase App', true, `Projet: ${app.options.projectId}`);
    } catch (error) {
        logResult('Firebase App', false, 'Firebase non initialisé');
        allTestsPassed = false;
        return;
    }
    
    console.log('\n=== TEST 2: Vérification des services ===');
    
    // Test 3: Auth est-il disponible ?
    if (typeof auth !== 'undefined' && auth) {
        logResult('Firebase Auth', true, 'Service Auth disponible');
    } else {
        logResult('Firebase Auth', false, 'Service Auth non disponible');
        allTestsPassed = false;
    }
    
    // Test 4: Firestore est-il disponible ?
    if (typeof db !== 'undefined' && db) {
        logResult('Firebase Firestore', true, 'Service Firestore disponible');
    } else {
        logResult('Firebase Firestore', false, 'Service Firestore non disponible');
        allTestsPassed = false;
    }
    
    // Test 5: Analytics est-il disponible ?
    if (typeof analytics !== 'undefined' && analytics) {
        logResult('Firebase Analytics', true, 'Service Analytics disponible');
    } else {
        logResult('Firebase Analytics', false, 'Service Analytics non disponible');
    }
    
    console.log('\n=== TEST 3: Vérification des fonctions ===');
    
    // Test 6: Fonctions d'authentification
    const authFunctions = ['signIn', 'signUp', 'signInWithGoogle', 'signOut', 'getCurrentUser', 'isAdmin'];
    authFunctions.forEach(func => {
        if (typeof window[func] === 'function') {
            logResult(`Fonction ${func}`, true, 'Disponible');
        } else {
            logResult(`Fonction ${func}`, false, 'Non disponible');
            allTestsPassed = false;
        }
    });
    
    // Test 7: Fonctions de gestion des questions
    const questionFunctions = ['loadQuestionsFromFirebase', 'addQuestion', 'updateQuestion', 'deleteQuestion'];
    questionFunctions.forEach(func => {
        if (typeof window[func] === 'function') {
            logResult(`Fonction ${func}`, true, 'Disponible');
        } else {
            logResult(`Fonction ${func}`, false, 'Non disponible');
            allTestsPassed = false;
        }
    });
    
    console.log('\n=== TEST 4: Test de connexion Firestore ===');
    
    // Test 8: Connexion à Firestore
    try {
        const testQuery = await db.collection('users').limit(1).get();
        logResult('Connexion Firestore', true, `${testQuery.size} document(s) trouvé(s)`);
    } catch (error) {
        logResult('Connexion Firestore', false, error.message);
        console.error('Détails de l\'erreur:', error);
        allTestsPassed = false;
    }
    
    console.log('\n=== TEST 5: Vérification de l\'état d\'authentification ===');
    
    // Test 9: État d'authentification
    const currentUser = auth.currentUser;
    if (currentUser) {
        logResult('Utilisateur connecté', true, currentUser.email);
        
        // Test 10: Vérifier si l'utilisateur est admin
        try {
            const isUserAdmin = await isAdmin(currentUser.uid);
            logResult('Vérification admin', true, `Admin: ${isUserAdmin}`);
        } catch (error) {
            logResult('Vérification admin', false, error.message);
        }
        
        // Test 11: Récupérer les données utilisateur
        try {
            const userDoc = await db.collection('users').doc(currentUser.uid).get();
            if (userDoc.exists) {
                logResult('Document utilisateur', true, 'Document trouvé dans Firestore');
                console.log('Données utilisateur:', userDoc.data());
            } else {
                logResult('Document utilisateur', false, 'Document non trouvé dans Firestore');
                allTestsPassed = false;
            }
        } catch (error) {
            logResult('Document utilisateur', false, error.message);
            allTestsPassed = false;
        }
    } else {
        logResult('Utilisateur connecté', false, 'Aucun utilisateur connecté');
        console.log('ℹ️ Connectez-vous pour tester les fonctionnalités utilisateur');
    }
    
    console.log('\n=== TEST 6: Vérification des méthodes d\'authentification ===');
    
    // Test 12: Vérifier les méthodes d'authentification activées
    try {
        const providers = await auth.fetchSignInMethodsForEmail('test@example.com');
        logResult('Méthodes d\'authentification', true, 'Vérification possible');
    } catch (error) {
        if (error.code === 'auth/invalid-email') {
            logResult('Méthodes d\'authentification', true, 'Service fonctionnel');
        } else {
            logResult('Méthodes d\'authentification', false, error.message);
        }
    }
    
    console.log('\n=== RÉSUMÉ ===');
    if (allTestsPassed) {
        console.log('✅ Tous les tests sont passés ! Firebase est correctement configuré.');
    } else {
        console.log('❌ Certains tests ont échoué. Vérifiez la configuration Firebase.');
        console.log('📖 Consultez FIREBASE_SETUP.md pour les instructions de configuration.');
    }
    
    console.log('\n=== INFORMATIONS SUPPLÉMENTAIRES ===');
    console.log('Projet Firebase:', firebase.app().options.projectId);
    console.log('Auth Domain:', firebase.app().options.authDomain);
    console.log('Utilisateur actuel:', currentUser ? currentUser.email : 'Non connecté');
    
}, 2000);

// Export pour utilisation dans d'autres scripts
window.runFirebaseDiagnostic = () => {
    location.reload();
};