// ===========================
// RANK SYSTEM - COMPETITIVE (ELO-BASED)
// ===========================

/**
 * Configuration des rangs compétitifs basés sur l'ELO
 * Structure: Rang → 3 phases → Seuils ELO
 */
const RANK_SYSTEM = {
    ranks: [
        {
            id: 0,
            name: 'Fer',
            icon: '⚒️',
            color: '#A39D8F',
            phases: {
                1: { minElo: 100, maxElo: 166, label: 'Fer 1' },
                2: { minElo: 167, maxElo: 233, label: 'Fer 2' },
                3: { minElo: 234, maxElo: 300, label: 'Fer 3' }
            }
        },
        {
            id: 1,
            name: 'Bronze',
            icon: '🥉',
            color: '#CD7F32',
            phases: {
                1: { minElo: 301, maxElo: 367, label: 'Bronze 1' },
                2: { minElo: 368, maxElo: 434, label: 'Bronze 2' },
                3: { minElo: 435, maxElo: 501, label: 'Bronze 3' }
            }
        },
        {
            id: 2,
            name: 'Argent',
            icon: '🥈',
            color: '#C0C0C0',
            phases: {
                1: { minElo: 502, maxElo: 568, label: 'Argent 1' },
                2: { minElo: 569, maxElo: 635, label: 'Argent 2' },
                3: { minElo: 636, maxElo: 702, label: 'Argent 3' }
            }
        },
        {
            id: 3,
            name: 'Or',
            icon: '🥇',
            color: '#FFD700',
            phases: {
                1: { minElo: 703, maxElo: 769, label: 'Or 1' },
                2: { minElo: 770, maxElo: 836, label: 'Or 2' },
                3: { minElo: 837, maxElo: 903, label: 'Or 3' }
            }
        },
        {
            id: 4,
            name: 'Cristal',
            icon: '💎',
            color: '#00D4FF',
            phases: {
                1: { minElo: 904, maxElo: 970, label: 'Cristal 1' },
                2: { minElo: 971, maxElo: 1037, label: 'Cristal 2' },
                3: { minElo: 1038, maxElo: 1104, label: 'Cristal 3' }
            }
        },
        {
            id: 5,
            name: 'Diamant',
            icon: '💠',
            color: '#00FFFF',
            phases: {
                1: { minElo: 1105, maxElo: 1171, label: 'Diamant 1' },
                2: { minElo: 1172, maxElo: 1238, label: 'Diamant 2' },
                3: { minElo: 1239, maxElo: 1305, label: 'Diamant 3' }
            }
        },
        {
            id: 6,
            name: 'Apothéose',
            icon: '👑',
            color: '#FF00FF',
            phases: {
                1: { minElo: 1306, maxElo: 1372, label: 'Apothéose 1' },
                2: { minElo: 1373, maxElo: 1439, label: 'Apothéose 2' },
                3: { minElo: 1440, maxElo: 1506, label: 'Apothéose 3' }
            }
        },
        {
            id: 7,
            name: 'Cosmique',
            icon: '⭐',
            color: '#FF4444',
            phases: {
                1: { minElo: 1507, maxElo: 1573, label: 'Cosmique 1' },
                2: { minElo: 1574, maxElo: 1640, label: 'Cosmique 2' },
                3: { minElo: 1641, maxElo: 9999, label: 'Cosmique 3' }
            }
        }
    ]
};

/**
 * Calculer le rang et la phase basée sur l'ELO
 * @param {number} userElo - ELO de l'utilisateur
 * @returns {Object} {rankId, rankName, phase, icon, color, label, progressPercent, eloInPhase, eloToNextPhase}
 */
function calculateRankFromElo(userElo) {
    userElo = Math.max(100, userElo || 100);
    
    // Parcourir tous les rangs
    for (const rank of RANK_SYSTEM.ranks) {
        // Parcourir toutes les phases du rang
        for (const [phaseNum, phaseData] of Object.entries(rank.phases)) {
            if (userElo >= phaseData.minElo && userElo <= phaseData.maxElo) {
                const eloInPhase = userElo - phaseData.minElo;
                const phaseRange = phaseData.maxElo - phaseData.minElo + 1;
                const progressPercent = Math.min(100, (eloInPhase / phaseRange) * 100);
                const eloToNextPhase = phaseData.maxElo - userElo;
                
                return {
                    rankId: rank.id,
                    rankName: rank.name,
                    phase: parseInt(phaseNum),
                    icon: rank.icon,
                    color: rank.color,
                    label: phaseData.label,
                    progressPercent: progressPercent,
                    eloInPhase: eloInPhase,
                    phaseMinElo: phaseData.minElo,
                    phaseMaxElo: phaseData.maxElo,
                    eloToNextPhase: eloToNextPhase
                };
            }
        }
    }
    
    // Si dépassement du dernier rang, retourner le dernier
    const lastRank = RANK_SYSTEM.ranks[RANK_SYSTEM.ranks.length - 1];
    const lastPhase = lastRank.phases[3];
    return {
        rankId: lastRank.id,
        rankName: lastRank.name,
        phase: 3,
        icon: lastRank.icon,
        color: lastRank.color,
        label: lastPhase.label,
        progressPercent: 100,
        eloInPhase: userElo - lastPhase.minElo,
        phaseMinElo: lastPhase.minElo,
        phaseMaxElo: lastPhase.maxElo,
        eloToNextPhase: 0
    };
}

/**
 * Obtenir tous les rangs disponibles avec les infos de progression
 * @param {number} userElo - ELO actuel pour calculer le rang
 * @returns {Array} Liste de tous les rangs avec infos
 */
function getAllRanksWithProgress(userElo) {
    const currentRank = calculateRankFromElo(userElo);
    
    return RANK_SYSTEM.ranks.map(rank => {
        const rankPhases = [];
        for (const [phaseNum, phaseData] of Object.entries(rank.phases)) {
            const isCurrent = currentRank.rankName === rank.name && currentRank.phase === parseInt(phaseNum);
            const isCompleted = userElo > phaseData.maxElo;
            
            rankPhases.push({
                phase: parseInt(phaseNum),
                label: phaseData.label,
                minElo: phaseData.minElo,
                maxElo: phaseData.maxElo,
                isCurrent: isCurrent,
                isCompleted: isCompleted
            });
        }
        
        return {
            rankId: rank.id,
            rankName: rank.name,
            icon: rank.icon,
            color: rank.color,
            phases: rankPhases
        };
    });
}

/**
 * Obtenir le chemin de l'image du rang
 * @param {string} rankName - Nom du rang (ex: 'Fer', 'Bronze', etc.)
 * @param {number} phase - Phase du rang (1, 2, ou 3) - optionnel
 * @returns {string} Chemin vers l'image
 */
function getRankImagePath(rankName, phase = null) {
    const imageName = rankName.toLowerCase().replace(/[éè]/g, 'e'); // apotheose -> apotheose
    if (phase !== null) {
        return `assets/img/ranks/${imageName}${phase}.png`;
    }
    return `assets/img/ranks/${imageName}.png`;
}

/**
 * Formater le rang pour l'affichage (avec emoji - compatibilité)
 * @param {number} userElo - ELO de l'utilisateur
 * @returns {string} Texte formaté du rang
 */
function formatRankDisplay(userElo) {
    const rank = calculateRankFromElo(userElo);
    return `${rank.icon} ${rank.label}`;
}

/**
 * Obtenir les informations détaillées du rang
 * @param {number} userElo - ELO de l'utilisateur
 * @returns {Object} Infos détaillées
 */
function getRankDetails(userElo) {
    return calculateRankFromElo(userElo);
}