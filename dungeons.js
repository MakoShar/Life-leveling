/**
 * Authentication Guard - Must run before any dungeon logic
 */
(async function initAuth() {
    try {
        const { data: { session }, error } = await supabaseClient.auth.getSession();
        if (error) throw error;
        if (!session) {
            window.location.href = 'login.html';
            return;
        }
        await loadFromSupabase();
        startDungeons();
        document.body.style.visibility = 'visible';
    } catch (err) {
        console.error('Auth Error:', err);
        window.location.href = 'login.html';
    }
})();

function startDungeons() {
// Dungeons Data - Real Life Challenges
const dungeons = [
    {
        id: 'dungeon_1',
        name: 'Push-Up Mastery',
        rank: 'E',
        description: 'Master the basic push-up form and build upper body strength.',
        duration: '1 Week',
        challenge: 'Complete 100 push-ups daily for 7 days',
        requiredLevel: 1,
        recommendedStats: { STR: 5, STA: 5 },
        rewards: {
            xp: 100,
            credits: 25,
            stats: { STR: 2, STA: 1 },
            unlocks: 'One-Hand Push-Up Challenge'
        }
    },
    {
        id: 'dungeon_2',
        name: 'One-Hand Push-Up',
        rank: 'D',
        description: 'Unlock the ultimate upper body strength skill - one-handed push-ups.',
        duration: '2 Weeks',
        challenge: 'Achieve 5 consecutive one-hand push-ups per arm',
        requiredLevel: 5,
        recommendedStats: { STR: 15, STA: 10 },
        rewards: {
            xp: 300,
            credits: 75,
            stats: { STR: 5, STA: 2 },
            unlocks: 'Advanced Calisthenics'
        }
    },
    {
        id: 'dungeon_3',
        name: 'Handstand Challenge',
        rank: 'C',
        description: 'Master balance and core strength by holding a handstand.',
        duration: '3 Weeks',
        challenge: 'Hold a freestanding handstand for 60 seconds',
        requiredLevel: 8,
        recommendedStats: { STR: 20, AGI: 15, STA: 15 },
        rewards: {
            xp: 500,
            credits: 100,
            stats: { STR: 3, AGI: 4, STA: 3 },
            unlocks: 'Handstand Push-Ups'
        }
    },
    {
        id: 'dungeon_4',
        name: 'Running Endurance',
        rank: 'D',
        description: 'Build cardiovascular endurance through consistent running.',
        duration: '4 Weeks',
        challenge: 'Run 5km under 30 minutes consistently',
        requiredLevel: 6,
        recommendedStats: { STA: 20, AGI: 10 },
        rewards: {
            xp: 400,
            credits: 80,
            stats: { STA: 5, AGI: 3 },
            unlocks: '10K Training Program'
        }
    },
    {
        id: 'dungeon_5',
        name: 'Meditation Master',
        rank: 'C',
        description: 'Develop mental clarity and emotional control through daily meditation.',
        duration: '3 Weeks',
        challenge: 'Meditate for 20 minutes daily for 21 days',
        requiredLevel: 10,
        recommendedStats: { WIL: 15, INT: 10 },
        rewards: {
            xp: 450,
            credits: 90,
            stats: { WIL: 4, INT: 3 },
            unlocks: 'Advanced Mindfulness Techniques'
        }
    },
    {
        id: 'dungeon_6',
        name: 'Reading Marathon',
        rank: 'D',
        description: 'Expand your knowledge by completing challenging books.',
        duration: '4 Weeks',
        challenge: 'Read and summarize 5 non-fiction books',
        requiredLevel: 7,
        recommendedStats: { INT: 15, WIL: 10 },
        rewards: {
            xp: 400,
            credits: 85,
            stats: { INT: 5, WIL: 2 },
            unlocks: 'Speed Reading Course'
        }
    },
    {
        id: 'dungeon_7',
        name: 'Muscle-Up Achievement',
        rank: 'B',
        description: 'The ultimate pull-up progression - explosive strength required.',
        duration: '6 Weeks',
        challenge: 'Achieve 3 consecutive muscle-ups',
        requiredLevel: 12,
        recommendedStats: { STR: 30, AGI: 20, STA: 20 },
        rewards: {
            xp: 800,
            credits: 150,
            stats: { STR: 6, AGI: 4, STA: 3 },
            unlocks: 'Weighted Calisthenics'
        }
    },
    {
        id: 'dungeon_8',
        name: 'Cold Shower Discipline',
        rank: 'C',
        description: 'Build mental toughness through cold exposure therapy.',
        duration: '2 Weeks',
        challenge: 'Take cold showers (2min) every morning for 14 days',
        requiredLevel: 9,
        recommendedStats: { WIL: 20, STA: 15 },
        rewards: {
            xp: 350,
            credits: 70,
            stats: { WIL: 4, STA: 2 },
            unlocks: 'Wim Hof Method'
        }
    },
    {
        id: 'dungeon_9',
        name: 'Plank Endurance',
        rank: 'D',
        description: 'Develop core strength and mental fortitude.',
        duration: '2 Weeks',
        challenge: 'Hold a plank for 5 minutes straight',
        requiredLevel: 6,
        recommendedStats: { STR: 15, STA: 15, WIL: 10 },
        rewards: {
            xp: 300,
            credits: 60,
            stats: { STR: 2, STA: 3, WIL: 2 },
            unlocks: 'Advanced Core Training'
        }
    },
    {
        id: 'dungeon_10',
        name: 'Social Confidence',
        rank: 'B',
        description: 'Break out of your comfort zone and develop charisma.',
        duration: '3 Weeks',
        challenge: 'Have meaningful conversations with 30 strangers',
        requiredLevel: 11,
        recommendedStats: { CHR: 20, WIL: 15 },
        rewards: {
            xp: 600,
            credits: 120,
            stats: { CHR: 6, WIL: 3 },
            unlocks: 'Public Speaking Course'
        }
    },
    {
        id: 'dungeon_11',
        name: 'Perfect Diet',
        rank: 'C',
        description: 'Master nutrition and meal discipline.',
        duration: '4 Weeks',
        challenge: 'Follow a clean diet plan with 90% adherence',
        requiredLevel: 10,
        recommendedStats: { WIL: 20, INT: 15 },
        rewards: {
            xp: 500,
            credits: 100,
            stats: { WIL: 4, STA: 3, INT: 2 },
            unlocks: 'Meal Prep Mastery'
        }
    },
    {
        id: 'dungeon_12',
        name: 'Ultimate Transformation',
        rank: 'S',
        description: 'The final challenge combining all aspects of life improvement.',
        duration: '12 Weeks',
        challenge: 'Complete all: 100 push-ups daily, 5km run, meditate 30min, read 1 book/week, cold showers',
        requiredLevel: 20,
        recommendedStats: { STR: 40, AGI: 30, STA: 40, INT: 30, WIL: 40, CHR: 25 },
        rewards: {
            xp: 3000,
            credits: 500,
            stats: { STR: 10, AGI: 8, STA: 10, INT: 8, WIL: 10, CHR: 6 },
            unlocks: 'Elite Life Mastery'
        }
    }
];

// State Management
let playerData = {
    level: 1,
    hp: 100,
    credits: 0,
    power: 50
};
let activeDungeon = null;
let dungeonProgress = 0;

// Initialize
// Initialize
async function initDungeonsApp() {
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (!session) {
        window.location.href = 'login.html';
        return;
    }
    await loadFromSupabase();

    const runInit = () => {
        loadPlayerData();
        renderDungeons();
        setupEventListeners();
        updatePlayerDisplay();
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', runInit);
    } else {
        runInit();
    }
}

initDungeonsApp();

// Load player data from main system
function loadPlayerData() {
    const state = JSON.parse(localStorage.getItem('solo_leveling_state_v1')) || {};
    
    // Calculate level from XP
    const xp = state.xp || 0;
    playerData.level = Math.floor(xp / 100) + 1;
    
    // Get stats
    const stats = state.stats || {};
    playerData.stats = stats;
    
    // Calculate total power from stats
    playerData.power = (stats.STR || 0) + (stats.AGI || 0) + (stats.INT || 0) + 
                       (stats.STA || 0) + (stats.WIL || 0) + (stats.CHR || 0);
    
    playerData.credits = state.gold || 0;
    playerData.hp = 100 + ((stats.STA || 0) * 2);
}

// Update player display
function updatePlayerDisplay() {
    document.getElementById('playerLevel').textContent = playerData.level;
    document.getElementById('playerHP').textContent = playerData.hp;
    document.getElementById('playerCredits').textContent = playerData.credits;
}

// Render dungeons grid
function renderDungeons() {
    const container = document.getElementById('dungeonsGrid');
    
    container.innerHTML = dungeons.map(dungeon => {
        const isLocked = playerData.level < dungeon.requiredLevel;
        
        // Check if player meets recommended stats
        let meetsRequirements = true;
        let requirementText = '';
        if (!isLocked) {
            const reqStats = dungeon.recommendedStats;
            for (const stat in reqStats) {
                const playerStat = playerData.stats[stat] || 0;
                if (playerStat < reqStats[stat]) {
                    meetsRequirements = false;
                }
                requirementText += `${stat}: ${reqStats[stat]} `;
            }
        }
        
        return `
            <div class="dungeon-card ${isLocked ? 'locked' : ''}" 
                 data-dungeon-id="${dungeon.id}"
                 onclick="${isLocked ? '' : `showDungeonDetails('${dungeon.id}')`}">
                ${isLocked ? '<div class="lock-icon">🔒</div>' : ''}
                <span class="dungeon-rank rank-${dungeon.rank}">${dungeon.rank} Rank</span>
                <h3>${dungeon.name}</h3>
                <p class="dungeon-description">${dungeon.description}</p>
                <div class="dungeon-stats">
                    <div class="dungeon-stat">
                        <div class="dungeon-stat-label">Duration</div>
                        <div class="dungeon-stat-value" style="font-size: 14px;">${dungeon.duration}</div>
                    </div>
                    <div class="dungeon-stat">
                        <div class="dungeon-stat-label">Level Req.</div>
                        <div class="dungeon-stat-value">${dungeon.requiredLevel}</div>
                    </div>
                    <div class="dungeon-stat">
                        <div class="dungeon-stat-label">Status</div>
                        <div class="dungeon-stat-value" style="color: ${meetsRequirements ? '#5d9e6e' : '#ff4444'}; font-size: 14px;">
                            ${isLocked ? 'Locked' : (meetsRequirements ? 'Ready' : 'Train')}
                        </div>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// Show dungeon details modal
function showDungeonDetails(dungeonId) {
    const dungeon = dungeons.find(d => d.id === dungeonId);
    if (!dungeon) return;

    document.getElementById('modalDungeonName').textContent = dungeon.name;
    document.querySelector('#dungeonModal .dungeon-rank').innerHTML = 
        `<span class="dungeon-rank rank-${dungeon.rank}">${dungeon.rank} Rank</span>`;
    document.getElementById('modalDungeonDescription').innerHTML = `
        <p>${dungeon.description}</p>
        <p style="margin-top: 15px;"><strong>⏱️ Duration:</strong> ${dungeon.duration}</p>
        <p style="margin-top: 10px;"><strong>🎯 Challenge:</strong> ${dungeon.challenge}</p>
    `;
    
    // Show required stats
    let reqStatsHtml = `<div class="requirement-item">Required Level: ${dungeon.requiredLevel} (Your Level: ${playerData.level})</div>`;
    reqStatsHtml += '<div class="requirement-item"><strong>Recommended Stats:</strong><br>';
    for (const stat in dungeon.recommendedStats) {
        const playerStat = playerData.stats[stat] || 0;
        const required = dungeon.recommendedStats[stat];
        const meets = playerStat >= required;
        reqStatsHtml += `${stat}: ${required} (You: ${playerStat}) ${meets ? '✅' : '❌'}<br>`;
    }
    reqStatsHtml += '</div>';
    document.getElementById('modalRequirements').innerHTML = reqStatsHtml;
    
    // Show rewards
    let rewardsHtml = `
        <div class="reward-item">✨ XP: +${dungeon.rewards.xp}</div>
        <div class="reward-item">💎 Credits: +${dungeon.rewards.credits}</div>
    `;
    
    // Show stat rewards
    if (dungeon.rewards.stats) {
        rewardsHtml += '<div class="reward-item"><strong>Stat Gains:</strong><br>';
        for (const stat in dungeon.rewards.stats) {
            rewardsHtml += `${stat}: +${dungeon.rewards.stats[stat]}<br>`;
        }
        rewardsHtml += '</div>';
    }
    
    rewardsHtml += `<div class="reward-item">🔓 Unlocks: ${dungeon.rewards.unlocks}</div>`;
    document.getElementById('modalRewards').innerHTML = rewardsHtml;

    document.getElementById('dungeonModal').style.display = 'block';
    document.getElementById('dungeonModal').dataset.dungeonId = dungeonId;
}

// Setup event listeners
function setupEventListeners() {
    // Modal close
    document.querySelectorAll('.close-modal').forEach(btn => {
        btn.addEventListener('click', closeAllModals);
    });

    // Click outside modal
    window.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            closeAllModals();
        }
    });

    // Enter dungeon
    document.getElementById('enterDungeon').addEventListener('click', enterDungeon);
    document.getElementById('cancelDungeon').addEventListener('click', closeAllModals);

    // Complete dungeon
    document.getElementById('completeDungeonBtn').addEventListener('click', completeDungeon);
    document.getElementById('abandonDungeonBtn').addEventListener('click', abandonDungeon);

    // Close completion modal
    document.getElementById('closeCompletion').addEventListener('click', closeAllModals);
}

// Enter dungeon
function enterDungeon() {
    const dungeonId = document.getElementById('dungeonModal').dataset.dungeonId;
    const dungeon = dungeons.find(d => d.id === dungeonId);
    
    if (!dungeon) return;

    activeDungeon = dungeon;
    dungeonProgress = 0;

    // Show active dungeon
    document.getElementById('activeDungeon').style.display = 'block';
    document.getElementById('activeDungeonName').textContent = dungeon.name;
    document.getElementById('activeDungeonDetails').innerHTML = `
        <strong>${dungeon.rank} Rank</strong> - ${dungeon.duration}<br>
        <em>${dungeon.challenge}</em>
    `;
    
    closeAllModals();
    
    // Simulate progress (in real use, this would track actual completion over weeks)
    startDungeonProgress();
}

// Start dungeon progress simulation
function startDungeonProgress() {
    const interval = setInterval(() => {
        dungeonProgress += 10;
        document.getElementById('dungeonProgress').style.width = dungeonProgress + '%';
        document.getElementById('progressText').textContent = dungeonProgress + '%';
        
        if (dungeonProgress >= 100) {
            clearInterval(interval);
        }
    }, 1000);
}

// Complete dungeon
function completeDungeon() {
    if (!activeDungeon || dungeonProgress < 100) {
        alert('Complete the dungeon progress first!');
        return;
    }

    // Apply rewards
    const state = JSON.parse(localStorage.getItem('solo_leveling_state_v1')) || {};
    state.xp = (state.xp || 0) + activeDungeon.rewards.xp;
    state.gold = (state.gold || 0) + activeDungeon.rewards.credits;
    
    // Apply stat rewards
    if (!state.stats) state.stats = {};
    if (activeDungeon.rewards.stats) {
        for (const stat in activeDungeon.rewards.stats) {
            state.stats[stat] = (state.stats[stat] || 0) + activeDungeon.rewards.stats[stat];
        }
    }
    
    syncToSupabase('solo_leveling_state_v1', JSON.stringify(state));

    // Build rewards display
    let rewardsHtml = `
        <h3>Rewards Earned:</h3>
        <ul>
            <li>✨ XP: +${activeDungeon.rewards.xp}</li>
            <li>💎 Credits: +${activeDungeon.rewards.credits}</li>
    `;
    
    if (activeDungeon.rewards.stats) {
        rewardsHtml += '<li><strong>Stat Increases:</strong><ul>';
        for (const stat in activeDungeon.rewards.stats) {
            rewardsHtml += `<li>${stat}: +${activeDungeon.rewards.stats[stat]}</li>`;
        }
        rewardsHtml += '</ul></li>';
    }
    
    rewardsHtml += `<li>🔓 ${activeDungeon.rewards.unlocks}</li></ul>`;
    
    // Show completion modal
    document.getElementById('rewardsDisplay').innerHTML = rewardsHtml;
    document.getElementById('completionModal').style.display = 'block';

    // Reset
    document.getElementById('activeDungeon').style.display = 'none';
    activeDungeon = null;
    dungeonProgress = 0;

    // Reload data
    loadPlayerData();
    updatePlayerDisplay();
}

// Abandon dungeon
function abandonDungeon() {
    if (confirm('Are you sure you want to abandon this dungeon? You will lose all progress.')) {
        document.getElementById('activeDungeon').style.display = 'none';
        activeDungeon = null;
        dungeonProgress = 0;
    }
}

// Close all modals
function closeAllModals() {
    document.getElementById('dungeonModal').style.display = 'none';
    document.getElementById('completionModal').style.display = 'none';
}
} // end startDungeons
