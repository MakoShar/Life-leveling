/**
 * Authentication Guard - Must run before any shop logic
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
        startShop();
        document.body.style.visibility = 'visible';
    } catch (err) {
        console.error('Auth Error:', err);
        window.location.href = 'login.html';
    }
})();

function startShop() {
// Shop Items Database
const shopItems = [
    // Mental Health Category
    {
        id: 'mental_1',
        name: 'Meditation Guide',
        category: 'mental',
        icon: '🧘‍♂️',
        price: 50,
        description: 'Learn mindfulness and meditation techniques to reduce stress and anxiety.',
        fullDescription: `
            <h3>About This Guide</h3>
            <p>A comprehensive meditation guide that teaches you various techniques to improve mental clarity and reduce stress.</p>
            <h3>What You'll Learn:</h3>
            <ul>
                <li>Basic breathing exercises</li>
                <li>Mindfulness meditation</li>
                <li>Body scan techniques</li>
                <li>Guided visualization</li>
                <li>Daily meditation routines</li>
            </ul>
            <h3>Benefits:</h3>
            <ul>
                <li>Reduced anxiety and stress</li>
                <li>Improved focus and concentration</li>
                <li>Better emotional regulation</li>
                <li>Enhanced sleep quality</li>
            </ul>
        `
    },
    {
        id: 'mental_2',
        name: 'Stress Relief Techniques',
        category: 'mental',
        icon: '😌',
        price: 40,
        description: 'Practical methods to manage and reduce daily stress effectively.',
        fullDescription: `
            <h3>About This Course</h3>
            <p>Learn evidence-based techniques to manage stress in your daily life.</p>
            <h3>Includes:</h3>
            <ul>
                <li>Progressive muscle relaxation</li>
                <li>Time management strategies</li>
                <li>Cognitive reframing exercises</li>
                <li>Quick stress-relief methods</li>
                <li>Building resilience</li>
            </ul>
        `
    },
    {
        id: 'mental_3',
        name: 'Sleep Optimization',
        category: 'mental',
        icon: '😴',
        price: 45,
        description: 'Improve your sleep quality with proven sleep hygiene practices.',
        fullDescription: `
            <h3>Sleep Better Tonight</h3>
            <p>Master the art of quality sleep with this comprehensive guide.</p>
            <h3>Topics Covered:</h3>
            <ul>
                <li>Sleep hygiene fundamentals</li>
                <li>Creating the perfect sleep environment</li>
                <li>Bedtime routine development</li>
                <li>Dealing with insomnia</li>
                <li>Natural sleep aids</li>
            </ul>
        `
    },
    {
        id: 'mental_4',
        name: 'Journaling for Growth',
        category: 'mental',
        icon: '📓',
        price: 35,
        description: 'Structured journaling exercises for self-reflection and personal growth.',
        fullDescription: `
            <h3>Transform Through Writing</h3>
            <p>Discover the power of journaling for mental health and personal development.</p>
            <h3>What's Inside:</h3>
            <ul>
                <li>Daily journaling prompts</li>
                <li>Gratitude practice templates</li>
                <li>Goal-setting frameworks</li>
                <li>Emotion processing exercises</li>
                <li>Weekly reflection guides</li>
            </ul>
        `
    },

    // Gym Guide Category
    {
        id: 'gym_1',
        name: 'Beginner Workout Plan',
        category: 'gym',
        icon: '💪',
        price: 60,
        description: 'Complete 12-week workout program for beginners starting their fitness journey.',
        fullDescription: `
            <h3>Start Your Fitness Journey</h3>
            <p>A structured 12-week program designed specifically for beginners.</p>
            <h3>Program Includes:</h3>
            <ul>
                <li>3 days per week full-body workouts</li>
                <li>Progressive overload principles</li>
                <li>Proper form demonstrations</li>
                <li>Warm-up and cool-down routines</li>
                <li>Recovery and rest day guidance</li>
            </ul>
            <h3>Expected Results:</h3>
            <ul>
                <li>Increased strength and endurance</li>
                <li>Improved body composition</li>
                <li>Better mobility and flexibility</li>
                <li>Established workout habit</li>
            </ul>
        `
    },
    {
        id: 'gym_2',
        name: 'Advanced Training Program',
        category: 'gym',
        icon: '🏋️',
        price: 80,
        description: 'Intensive training program for experienced lifters seeking maximum gains.',
        fullDescription: `
            <h3>Take Your Training to the Next Level</h3>
            <p>Advanced periodized program for serious strength and muscle gains.</p>
            <h3>Features:</h3>
            <ul>
                <li>4-5 day split routines</li>
                <li>Periodization strategies</li>
                <li>Advanced techniques (drop sets, supersets, etc.)</li>
                <li>Deload week protocols</li>
                <li>Competition preparation (optional)</li>
            </ul>
        `
    },
    {
        id: 'gym_3',
        name: 'Home Workout Guide',
        category: 'gym',
        icon: '🏠',
        price: 45,
        description: 'Effective workouts you can do at home with minimal equipment.',
        fullDescription: `
            <h3>No Gym? No Problem!</h3>
            <p>Get fit from the comfort of your home with bodyweight and minimal equipment exercises.</p>
            <h3>Includes:</h3>
            <ul>
                <li>Bodyweight exercise library</li>
                <li>Resistance band workouts</li>
                <li>Dumbbell-only routines</li>
                <li>HIIT cardio sessions</li>
                <li>Space-efficient exercises</li>
            </ul>
        `
    },
    {
        id: 'gym_4',
        name: 'Cardio Optimization',
        category: 'gym',
        icon: '🏃',
        price: 50,
        description: 'Master cardiovascular training for endurance and fat loss.',
        fullDescription: `
            <h3>Maximize Your Cardio</h3>
            <p>Learn how to structure cardio for your specific goals.</p>
            <h3>Topics:</h3>
            <ul>
                <li>HIIT vs steady-state cardio</li>
                <li>Running programs (5K to marathon)</li>
                <li>Cycling training plans</li>
                <li>Swimming techniques</li>
                <li>Heart rate zone training</li>
            </ul>
        `
    },

    // Nutrition Category
    {
        id: 'nutrition_1',
        name: 'Meal Planning Basics',
        category: 'nutrition',
        icon: '🍽️',
        price: 55,
        description: 'Learn to plan and prep nutritious meals efficiently.',
        fullDescription: `
            <h3>Master Meal Planning</h3>
            <p>Save time and eat healthier with strategic meal planning.</p>
            <h3>You'll Learn:</h3>
            <ul>
                <li>Weekly meal planning templates</li>
                <li>Batch cooking strategies</li>
                <li>Grocery shopping optimization</li>
                <li>Food storage techniques</li>
                <li>Budget-friendly healthy eating</li>
            </ul>
        `
    },
    {
        id: 'nutrition_2',
        name: 'Macro Counting Guide',
        category: 'nutrition',
        icon: '📊',
        price: 65,
        description: 'Understand macronutrients and learn flexible dieting.',
        fullDescription: `
            <h3>Flexible Dieting Made Simple</h3>
            <p>Track your macros effectively for your fitness goals.</p>
            <h3>Includes:</h3>
            <ul>
                <li>Macro calculation formulas</li>
                <li>Tracking apps and tools</li>
                <li>Meal timing strategies</li>
                <li>Adjusting macros for goals</li>
                <li>Sample meal plans for different macros</li>
            </ul>
        `
    },
    {
        id: 'nutrition_3',
        name: 'Healthy Recipe Book',
        category: 'nutrition',
        icon: '👨‍🍳',
        price: 40,
        description: '100+ delicious and nutritious recipes for various dietary preferences.',
        fullDescription: `
            <h3>Delicious & Nutritious</h3>
            <p>Over 100 recipes that are both healthy and tasty.</p>
            <h3>Features:</h3>
            <ul>
                <li>Breakfast, lunch, dinner, and snacks</li>
                <li>Vegetarian and vegan options</li>
                <li>High-protein recipes</li>
                <li>Low-carb alternatives</li>
                <li>Macro information for each recipe</li>
            </ul>
        `
    },
    {
        id: 'nutrition_4',
        name: 'Supplement Guide',
        category: 'nutrition',
        icon: '💊',
        price: 45,
        description: 'Evidence-based guide to effective supplements and their usage.',
        fullDescription: `
            <h3>Supplement Wisely</h3>
            <p>Cut through the marketing and learn what supplements actually work.</p>
            <h3>Covers:</h3>
            <ul>
                <li>Essential supplements (protein, creatine, etc.)</li>
                <li>Vitamins and minerals</li>
                <li>Pre and post-workout supplements</li>
                <li>Dosage and timing</li>
                <li>Safety and quality considerations</li>
            </ul>
        `
    },

    // Life Skills Category
    {
        id: 'skills_1',
        name: 'Time Management Mastery',
        category: 'skills',
        icon: '⏰',
        price: 50,
        description: 'Optimize your productivity with proven time management techniques.',
        fullDescription: `
            <h3>Take Control of Your Time</h3>
            <p>Learn to prioritize, schedule, and accomplish more with less stress.</p>
            <h3>Techniques Covered:</h3>
            <ul>
                <li>Eisenhower Matrix</li>
                <li>Time blocking</li>
                <li>Pomodoro Technique</li>
                <li>Energy management</li>
                <li>Eliminating time wasters</li>
            </ul>
        `
    },
    {
        id: 'skills_2',
        name: 'Habit Formation System',
        category: 'skills',
        icon: '🎯',
        price: 55,
        description: 'Build lasting positive habits using science-backed methods.',
        fullDescription: `
            <h3>Transform Your Life Through Habits</h3>
            <p>Learn the psychology of habit formation and how to make changes stick.</p>
            <h3>Includes:</h3>
            <ul>
                <li>The habit loop explained</li>
                <li>Trigger-action-reward system</li>
                <li>Habit stacking techniques</li>
                <li>Breaking bad habits</li>
                <li>21/66 day challenges</li>
            </ul>
        `
    },
    {
        id: 'skills_3',
        name: 'Financial Literacy Basics',
        category: 'skills',
        icon: '💰',
        price: 60,
        description: 'Essential knowledge for managing money and building wealth.',
        fullDescription: `
            <h3>Build Your Financial Future</h3>
            <p>Learn the fundamentals of personal finance and wealth building.</p>
            <h3>Topics:</h3>
            <ul>
                <li>Budgeting and saving strategies</li>
                <li>Debt management</li>
                <li>Investment basics</li>
                <li>Emergency fund creation</li>
                <li>Retirement planning</li>
            </ul>
        `
    },
    {
        id: 'skills_4',
        name: 'Communication Skills',
        category: 'skills',
        icon: '🗣️',
        price: 50,
        description: 'Improve your interpersonal and professional communication abilities.',
        fullDescription: `
            <h3>Communicate Effectively</h3>
            <p>Enhance your relationships and career through better communication.</p>
            <h3>Learn:</h3>
            <ul>
                <li>Active listening techniques</li>
                <li>Assertive communication</li>
                <li>Non-verbal communication</li>
                <li>Conflict resolution</li>
                <li>Public speaking basics</li>
            </ul>
        `
    },

    // Special Items Category
    {
        id: 'special_1',
        name: 'Scroll of Status Clear',
        category: 'special',
        icon: '📜',
        price: 500,
        description: 'Legendary scroll that removes all penalties including Pjog status.',
        fullDescription: `
            <h3>⚡ Legendary Item ⚡</h3>
            <p>This powerful scroll can clear all negative status effects and reset your penalties.</p>
            <h3>Effects:</h3>
            <ul>
                <li>Removes all Pjog status levels</li>
                <li>Clears will power penalties</li>
                <li>One-time use item</li>
                <li>Cannot be refunded once purchased</li>
            </ul>
            <p><strong>Use this item wisely!</strong></p>
        `
    },
    {
        id: 'special_2',
        name: 'XP Booster (24h)',
        category: 'special',
        icon: '⚡',
        price: 100,
        description: 'Double XP gain from all quests for 24 hours.',
        fullDescription: `
            <h3>Level Up Faster</h3>
            <p>Temporarily boost your XP gains to accelerate your progress.</p>
            <h3>Effects:</h3>
            <ul>
                <li>2x XP from all quest completions</li>
                <li>Lasts for 24 hours</li>
                <li>Stackable with other bonuses</li>
                <li>Timer starts immediately upon purchase</li>
            </ul>
        `
    },
    {
        id: 'special_3',
        name: 'Stat Point Bundle (10)',
        category: 'special',
        icon: '✨',
        price: 200,
        description: 'Instantly gain 10 stat points to allocate as you wish.',
        fullDescription: `
            <h3>Instant Power Boost</h3>
            <p>Get 10 stat points immediately to strengthen your character.</p>
            <h3>Details:</h3>
            <ul>
                <li>Receive 10 unallocated stat points</li>
                <li>Distribute freely among any stats</li>
                <li>Points added immediately</li>
                <li>Best value for stat point purchases</li>
            </ul>
        `
    },
    {
        id: 'special_4',
        name: 'Quest Refresh Token',
        category: 'special',
        icon: '🔄',
        price: 75,
        description: 'Instantly refresh your daily quests to get new ones.',
        fullDescription: `
            <h3>New Challenges Await</h3>
            <p>Reset your daily quest list and get fresh challenges.</p>
            <h3>Effects:</h3>
            <ul>
                <li>Instantly refreshes daily quest list</li>
                <li>Can be used once per day</li>
                <li>Uncompleted quests will be replaced</li>
                <li>New quests available immediately</li>
            </ul>
        `
    },
    {
        id: 'special_5',
        name: 'Life Improvement Bundle',
        category: 'special',
        icon: '🎁',
        price: 300,
        description: 'Complete package including guides from all categories at a discounted price.',
        fullDescription: `
            <h3>🌟 Best Value Deal! 🌟</h3>
            <p>Get one guide from each major category at a significant discount.</p>
            <h3>Bundle Includes:</h3>
            <ul>
                <li>1 Mental Health guide of your choice</li>
                <li>1 Gym Guide of your choice</li>
                <li>1 Nutrition guide of your choice</li>
                <li>1 Life Skills guide of your choice</li>
                <li>Bonus: 5 stat points</li>
            </ul>
            <p><strong>Save 35% compared to buying separately!</strong></p>
        `
    }
];

// State Management
let currentCategory = 'all';
let userCredits = 0;
let purchasedItems = [];

// Initialize Shop
async function initShopApp() {
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (!session) {
        window.location.href = 'login.html';
        return;
    }
    await loadFromSupabase();

    const runInit = () => {
        loadUserData();
        renderItems(currentCategory);
        setupEventListeners();
        updateCreditsDisplay();
        updateSidebar();
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', runInit);
    } else {
        runInit();
    }
}

initShopApp();

// Load user data from localStorage
function loadUserData() {
    const state = JSON.parse(localStorage.getItem('solo_leveling_state_v1')) || {};
    userCredits = state.gold || 0;
    purchasedItems = state.purchasedShopItems || [];
}

// Save purchased items to localStorage
function saveUserData() {
    const state = JSON.parse(localStorage.getItem('solo_leveling_state_v1')) || {};
    state.gold = userCredits;
    state.purchasedShopItems = purchasedItems;
    syncToSupabase('solo_leveling_state_v1', JSON.stringify(state));
}

// Update credits display
function updateCreditsDisplay() {
    document.getElementById('shopCredits').textContent = userCredits;
    document.getElementById('sidebarCredits').textContent = userCredits;
}

// Setup event listeners
function setupEventListeners() {
    // Hamburger menu
    const hamburgerBtn = document.getElementById('hamburgerBtn');
    const sidebar = document.getElementById('sidebar');
    const sidebarOverlay = document.getElementById('sidebarOverlay');
    const closeSidebar = document.getElementById('closeSidebar');

    hamburgerBtn.addEventListener('click', () => {
        sidebar.classList.add('open');
        sidebarOverlay.classList.add('active');
        hamburgerBtn.classList.add('active');
        updateSidebar();
    });

    closeSidebar.addEventListener('click', closeSidebarMenu);
    sidebarOverlay.addEventListener('click', closeSidebarMenu);

    // Category tabs
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentCategory = btn.dataset.category;
            renderItems(currentCategory);
        });
    });

    // Modal close buttons
    document.querySelectorAll('.close-modal').forEach(btn => {
        btn.addEventListener('click', () => {
            closeAllModals();
        });
    });

    // Click outside modal to close
    window.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            closeAllModals();
        }
    });

    // Purchase modal buttons
    document.getElementById('cancelPurchase').addEventListener('click', closeAllModals);
    document.getElementById('confirmPurchase').addEventListener('click', completePurchase);
    document.getElementById('closeDetails').addEventListener('click', closeAllModals);
}

// Close sidebar menu
function closeSidebarMenu() {
    document.getElementById('sidebar').classList.remove('open');
    document.getElementById('sidebarOverlay').classList.remove('active');
    document.getElementById('hamburgerBtn').classList.remove('active');
}

// Render items based on category
function renderItems(category) {
    const container = document.getElementById('itemsContainer');
    const filteredItems = category === 'all' 
        ? shopItems 
        : shopItems.filter(item => item.category === category);

    container.innerHTML = filteredItems.map(item => {
        const isPurchased = purchasedItems.includes(item.id);
        const canAfford = userCredits >= item.price;
        
        return `
            <div class="item-card" data-item-id="${item.id}">
                <div class="item-icon">${item.icon}</div>
                <div class="item-category">${getCategoryName(item.category)}</div>
                <div class="item-name">${item.name}</div>
                <div class="item-description">${item.description}</div>
                <div class="item-footer">
                    <div class="item-price">
                        <span>💎</span>
                        <span>${item.price}</span>
                    </div>
                    <button class="buy-btn" 
                        onclick="showPurchaseModal('${item.id}')"
                        ${isPurchased ? 'disabled' : ''}
                        ${!canAfford && !isPurchased ? 'disabled' : ''}>
                        ${isPurchased ? 'Owned' : (canAfford ? 'Buy' : 'Not Enough')}
                    </button>
                </div>
            </div>
        `;
    }).join('');

    // Add click listeners for item details
    container.querySelectorAll('.item-card').forEach(card => {
        card.addEventListener('click', (e) => {
            if (!e.target.classList.contains('buy-btn')) {
                const itemId = card.dataset.itemId;
                showDetailsModal(itemId);
            }
        });
    });
}

// Get category display name
function getCategoryName(category) {
    const names = {
        mental: 'Mental Health',
        gym: 'Gym Guide',
        nutrition: 'Nutrition',
        skills: 'Life Skills',
        special: 'Special Item'
    };
    return names[category] || category;
}

// Show purchase confirmation modal
function showPurchaseModal(itemId) {
    const item = shopItems.find(i => i.id === itemId);
    if (!item) return;

    document.getElementById('modalItemPreview').innerHTML = `<div style="font-size: 64px;">${item.icon}</div>`;
    document.getElementById('modalItemDescription').textContent = item.description;
    document.getElementById('modalItemCost').textContent = item.price;
    document.getElementById('modalCreditsBalance').textContent = userCredits;

    const modal = document.getElementById('purchaseModal');
    modal.style.display = 'block';
    modal.dataset.itemId = itemId;
}

// Show item details modal
function showDetailsModal(itemId) {
    const item = shopItems.find(i => i.id === itemId);
    if (!item) return;

    document.getElementById('detailsItemName').textContent = item.name;
    document.getElementById('detailsContent').innerHTML = item.fullDescription;

    document.getElementById('detailsModal').style.display = 'block';
}

// Complete purchase
function completePurchase() {
    const modal = document.getElementById('purchaseModal');
    const itemId = modal.dataset.itemId;
    const item = shopItems.find(i => i.id === itemId);

    if (!item) return;

    if (userCredits >= item.price && !purchasedItems.includes(itemId)) {
        userCredits -= item.price;
        purchasedItems.push(itemId);
        
        // Apply special item effects
        applyItemEffect(item);
        
        saveUserData();
        updateCreditsDisplay();
        renderItems(currentCategory);
        updateSidebar();
        closeAllModals();

        alert(`✅ Successfully purchased: ${item.name}`);
    }
}

// Apply item effects (for special items)
function applyItemEffect(item) {
    const state = JSON.parse(localStorage.getItem('solo_leveling_state_v1')) || {};

    switch(item.id) {
        case 'special_1': // Scroll of Status Clear
            state.pjogStatus = 0;
            state.penalties = [];
            alert('🌟 All penalties have been cleared!');
            break;
        case 'special_2': // XP Booster
            state.xpBoostExpiry = Date.now() + (24 * 60 * 60 * 1000);
            alert('⚡ XP Booster activated for 24 hours!');
            break;
        case 'special_3': // Stat Points
            state.statPoints = (state.statPoints || 0) + 10;
            alert('✨ 10 stat points have been added!');
            break;
        case 'special_4': // Quest Refresh
            // This would be handled in the main app
            alert('🔄 Quest Refresh Token added to inventory!');
            break;
        case 'special_5': // Bundle
            state.statPoints = (state.statPoints || 0) + 5;
            alert('🎁 Bundle purchased! Check your inventory and enjoy 5 bonus stat points!');
            break;
    }

    syncToSupabase('solo_leveling_state_v1', JSON.stringify(state));
}

// Close all modals
function closeAllModals() {
    document.getElementById('purchaseModal').style.display = 'none';
    document.getElementById('detailsModal').style.display = 'none';
}

// Update sidebar with purchased guides
function updateSidebar() {
    const container = document.getElementById('purchasedGuides');
    
    if (purchasedItems.length === 0) {
        container.innerHTML = `
            <div class="empty-guides">
                <div class="empty-guides-icon">📦</div>
                <p>You haven't purchased any guides yet.</p>
                <p style="margin-top: 10px; font-size: 14px;">Start shopping to improve your life!</p>
            </div>
        `;
        return;
    }

    const purchasedGuides = shopItems.filter(item => purchasedItems.includes(item.id));
    
    container.innerHTML = purchasedGuides.map(item => `
        <div class="guide-item" onclick="showDetailsModal('${item.id}')">
            <div class="guide-item-icon">${item.icon}</div>
            <div class="guide-item-name">${item.name}</div>
            <div class="guide-item-category">${getCategoryName(item.category)}</div>
        </div>
    `).join('');
}
} // end startShop
