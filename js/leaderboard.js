// ===========================
// INITIALIZATION
// ===========================
document.addEventListener('DOMContentLoaded', async () => {
    initParticles();
    await loadLeaderboard();
});

// ===========================
// PARTICLES ANIMATION
// ===========================
function initParticles() {
    const particlesContainer = document.getElementById('particles');
    
    if (!particlesContainer) return;
    
    for (let i = 0; i < 30; i++) {
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
    
    const duration = Math.random() * 40 + 20;
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
// LEADERBOARD
// ===========================
async function loadLeaderboard() {
    const loadingSpinner = document.getElementById('loadingSpinner');
    const leaderboardTable = document.getElementById('leaderboardTable');
    const playerRankCard = document.getElementById('playerRankCard');
    
    try {
        // Charger le classement
        const result = await getLeaderboard(100);
        
        if (!result.success) {
            throw new Error(result.error);
        }
        
        const leaderboard = result.leaderboard;
        
        // Afficher le classement du joueur actuel
        const user = getCurrentUser();
        if (user) {
            await displayPlayerRank(user.uid, leaderboard);
        }
        
        // Afficher le classement
        displayLeaderboard(leaderboard, user ? user.uid : null);
        
        // Masquer le spinner et afficher le tableau
        loadingSpinner.style.display = 'none';
        leaderboardTable.style.display = 'block';
        
    } catch (error) {
        console.error('❌ Erreur chargement classement:', error);
        loadingSpinner.innerHTML = `
            <div style="text-align: center;">
                <i class="fas fa-exclamation-triangle" style="font-size: 3rem; color: var(--error); margin-bottom: 1rem;"></i>
                <p style="color: var(--text-primary);">Erreur lors du chargement du classement</p>
                <p style="color: var(--text-secondary); font-size: 0.9rem;">${error.message}</p>
            </div>
        `;
    }
}

async function displayPlayerRank(userId, leaderboard) {
    try {
        const playerRankCard = document.getElementById('playerRankCard');
        
        // Trouver le joueur dans le classement
        const playerEntry = leaderboard.find(entry => entry.uid === userId);
        
        if (!playerEntry) {
            // Le joueur n'a pas encore joué de duel
            return;
        }
        
        // Afficher la carte
        playerRankCard.style.display = 'block';
        
        // Mettre à jour les informations
        document.getElementById('playerRankBadge').textContent = `#${playerEntry.rank}`;
        document.getElementById('playerName').textContent = playerEntry.displayName;
        document.getElementById('playerElo').textContent = playerEntry.elo;
        document.getElementById('playerDuels').textContent = playerEntry.duelsPlayed;
        document.getElementById('playerWins').textContent = playerEntry.duelsWon;
        document.getElementById('playerWinRate').textContent = `${playerEntry.winRate}%`;
        
    } catch (error) {
        console.error('❌ Erreur affichage rang joueur:', error);
    }
}

function displayLeaderboard(leaderboard, currentUserId) {
    const leaderboardBody = document.getElementById('leaderboardBody');
    leaderboardBody.innerHTML = '';
    
    if (leaderboard.length === 0) {
        leaderboardBody.innerHTML = `
            <div style="padding: 3rem; text-align: center; color: var(--text-secondary);">
                <i class="fas fa-inbox" style="font-size: 3rem; margin-bottom: 1rem; display: block;"></i>
                <p>Aucun joueur dans le classement pour le moment</p>
                <p style="font-size: 0.9rem; margin-top: 0.5rem;">Soyez le premier à jouer un duel !</p>
            </div>
        `;
        return;
    }
    
    leaderboard.forEach(player => {
        const row = document.createElement('div');
        row.className = 'leaderboard-row';
        
        // Mettre en évidence le joueur actuel
        if (player.uid === currentUserId) {
            row.classList.add('current-player');
        }
        
        // Classe spéciale pour le top 3
        let rankClass = '';
        let rankIcon = '';
        if (player.rank === 1) {
            rankClass = 'top-1';
            rankIcon = '<i class="fas fa-crown"></i> ';
        } else if (player.rank === 2) {
            rankClass = 'top-2';
            rankIcon = '<i class="fas fa-medal"></i> ';
        } else if (player.rank === 3) {
            rankClass = 'top-3';
            rankIcon = '<i class="fas fa-medal"></i> ';
        }
        
        row.innerHTML = `
            <div class="rank-cell ${rankClass}">${rankIcon}#${player.rank}</div>
            <div class="player-name-cell">
                <i class="fas fa-user" style="color: var(--primary-purple);"></i>
                <span>${player.displayName}</span>
                ${player.uid === currentUserId ? '<span style="color: var(--accent-gold); font-size: 0.8rem; margin-left: 0.5rem;">(Vous)</span>' : ''}
            </div>
            <div class="elo-cell">
                <i class="fas fa-trophy" style="font-size: 0.9rem;"></i>
                ${player.elo}
            </div>
            <div class="stat-cell mobile-hidden">${player.duelsPlayed}</div>
            <div class="stat-cell mobile-hidden">
                ${player.duelsWon}
                <span style="color: var(--text-muted); font-size: 0.8rem;">(${player.winRate}%)</span>
            </div>
        `;
        
        leaderboardBody.appendChild(row);
    });
}