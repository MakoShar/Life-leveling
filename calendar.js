// Storage key
const STORAGE_KEY = 'solo_leveling_state_v1';

// Current date tracking
let currentDate = new Date();
let selectedDate = new Date();

// Initialize calendar
document.addEventListener('DOMContentLoaded', function() {
    checkAndResetDailyQuests();
    loadCalendarData();
    renderCalendar();
    renderMiniCalendar();
    renderProfile();
    renderTodaysTasks();
    setupEventListeners();
});

// Check if day has changed and reset daily quests
function checkAndResetDailyQuests() {
    const data = loadCalendarData();
    const today = new Date().toDateString();
    const lastReset = data.lastDailyReset || '';
    
    if (lastReset !== today) {
        // Check for incomplete quests and apply penalties
        checkDailyQuestsAndApplyPenalties(data);
        
        // Reset daily quests
        data.dailyQuests = {
            pushups: false,
            situps: false,
            crunches: false,
            running: false,
            reading: false
        };
        data.lastDailyReset = today;
        
        // Reset stat point award flag for new day
        delete data.lastStatPointAward;
        
        // Save updated data
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        } catch (e) {
            console.error('Error resetting daily quests:', e);
        }
    }
}

// Check daily quests and apply penalties for incomplete tasks
function checkDailyQuestsAndApplyPenalties(data) {
    let incompleteTasks = 0;
    
    // Count incomplete daily quests
    for (const [key, completed] of Object.entries(data.dailyQuests || {})) {
        if (!completed) {
            incompleteTasks++;
        }
    }
    
    // Check calendar tasks for yesterday
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    
    if (data.calendarTasks && Array.isArray(data.calendarTasks)) {
        data.calendarTasks.forEach(task => {
            let shouldCheck = false;
            
            // Check if task was for yesterday
            if (task.date === yesterdayStr) {
                shouldCheck = true;
            }
            
            // Check recurring tasks
            if (task.recurring !== 'none') {
                const taskDate = new Date(task.date);
                const endDate = task.endDate ? new Date(task.endDate) : new Date(9999, 11, 31);
                
                if (yesterday >= taskDate && yesterday <= endDate) {
                    if (task.recurring === 'daily') {
                        shouldCheck = true;
                    } else if (task.recurring === 'weekly') {
                        const daysDiff = Math.floor((yesterday - taskDate) / (1000 * 60 * 60 * 24));
                        shouldCheck = daysDiff % 7 === 0;
                    }
                }
            }
            
            // Check if task was completed
            if (shouldCheck && !task.completed) {
                incompleteTasks++;
            }
        });
    }
    
    // Apply penalties
    if (incompleteTasks > 0) {
        // Initialize penalties array if not exists
        if (!data.penalties) {
            data.penalties = [];
        }
        
        // Calculate Willpower loss (5 per incomplete task)
        const willPowerLost = incompleteTasks * 5;
        
        // Update Pjog status
        data.pjogStatus = (data.pjogStatus || 0) + 1;
        
        // Reduce Willpower stat
        if (data.stats && data.stats.WIL) {
            data.stats.WIL = Math.max(1, data.stats.WIL - willPowerLost);
        }
        
        // Record penalty
        const penalty = {
            date: new Date().toLocaleDateString(),
            incompleteTasks: incompleteTasks,
            willPowerLost: willPowerLost,
            pjogLevel: data.pjogStatus
        };
        
        data.penalties.push(penalty);
        
        showNotification(`⚠️ Penalty Applied: ${incompleteTasks} incomplete tasks! WIL -${willPowerLost}, Pjog x${data.pjogStatus}`);
    }
}

// Render profile section
function renderProfile() {
    const data = loadCalendarData();
    
    // Update avatar
    const avatarEl = document.getElementById('calendarAvatar');
    if (avatarEl) {
        avatarEl.src = data.avatarImage || 'Images/Default_profile.png';
    }
    
    // Update username
    const userNameEl = document.getElementById('calendarUserName');
    if (userNameEl) {
        userNameEl.textContent = data.userName || 'User name';
    }
    
    // Calculate level from XP (100 XP per level, starting at level 1)
    const xp = data.xp || 0;
    const level = Math.floor(xp / 100) + 1;
    const xpInLevel = xp % 100;
    const xpNeeded = 100;
    const xpPercent = xpInLevel;
    
    // Update level
    const levelEl = document.getElementById('calendarLevel');
    if (levelEl) {
        levelEl.textContent = level;
    }
    
    // Update credits
    const creditsEl = document.getElementById('calendarCredits');
    if (creditsEl) {
        creditsEl.textContent = data.gold || 0;
    }
    
    // Update XP bar
    const xpBarEl = document.getElementById('calendarXpBar');
    if (xpBarEl) {
        xpBarEl.style.width = `${xpPercent}%`;
    }
    
    // Update XP text
    const xpEl = document.getElementById('calendarXp');
    const nextXpEl = document.getElementById('calendarNextXp');
    if (xpEl) xpEl.textContent = xpInLevel;
    if (nextXpEl) nextXpEl.textContent = xpNeeded;
    
    // Update penalties
    renderPenalties(data);
}

// Render penalties
function renderPenalties(data) {
    const penaltiesEl = document.getElementById('calendarPenalties');
    if (!penaltiesEl) return;
    
    let html = '';
    
    // Show Pjog status
    if (data.pjogStatus && data.pjogStatus > 0) {
        const baseDistance = 400;
        const additionalDistance = 200 * (data.pjogStatus - 1);
        const totalDistance = baseDistance + additionalDistance;
        
        const baseTime = 3;
        const additionalTime = 2 * (data.pjogStatus - 1);
        const totalTime = baseTime + additionalTime;
        
        html += `<div class="penalty-item">
            <strong>🔒 PENALTY JOG x${data.pjogStatus}</strong>
            <div class="penalty-details">Must run ${totalDistance}m in ${totalTime} min</div>
            <div class="penalty-details" style="font-style: italic; color: #ff8888;">PERMANENT - Scroll required</div>
        </div>`;
    }
    
    // Show recent penalties
    if (data.penalties && data.penalties.length > 0) {
        const recentPenalties = data.penalties.slice(-3).reverse();
        recentPenalties.forEach(p => {
            html += `<div class="penalty-item">
                <div style="font-size: 12px; color: #ff8888;">
                    ${p.date}: WIL -${p.willPowerLost || 0}, Pjog→x${p.pjogLevel}
                </div>
            </div>`;
        });
    }
    
    if (!html) {
        penaltiesEl.innerHTML = 'None';
        penaltiesEl.style.color = '#5d9e6e';
    } else {
        penaltiesEl.innerHTML = html;
    }
}

// Setup event listeners
function setupEventListeners() {
    // Hamburger menu
    const hamburgerBtn = document.getElementById('hamburgerBtn');
    const sidebar = document.getElementById('sidebar');
    const closeSidebar = document.getElementById('closeSidebar');

    hamburgerBtn.addEventListener('click', () => {
        sidebar.classList.add('open');
    });

    closeSidebar.addEventListener('click', () => {
        sidebar.classList.remove('open');
    });

    // Close sidebar when clicking outside
    document.addEventListener('click', (e) => {
        if (sidebar.classList.contains('open') && 
            !sidebar.contains(e.target) && 
            !hamburgerBtn.contains(e.target)) {
            sidebar.classList.remove('open');
        }
    });

    // Add Task Modal
    const addTaskModal = document.getElementById('addTaskModal');
    const createBtn = document.getElementById('createBtn');
    const closeModal = document.getElementById('closeModal');
    const cancelTask = document.getElementById('cancelTask');
    const addTaskForm = document.getElementById('addTaskForm');
    const taskRecurring = document.getElementById('taskRecurring');
    const endDateGroup = document.getElementById('endDateGroup');

    createBtn.addEventListener('click', () => {
        addTaskModal.classList.add('show');
        // Set default date to today
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('taskDate').value = today;
    });

    closeModal.addEventListener('click', () => {
        addTaskModal.classList.remove('show');
        addTaskForm.reset();
    });

    cancelTask.addEventListener('click', () => {
        addTaskModal.classList.remove('show');
        addTaskForm.reset();
    });

    // Close modal when clicking outside
    addTaskModal.addEventListener('click', (e) => {
        if (e.target === addTaskModal) {
            addTaskModal.classList.remove('show');
            addTaskForm.reset();
        }
    });

    // Show/hide end date based on recurring selection
    taskRecurring.addEventListener('change', () => {
        if (taskRecurring.value !== 'none') {
            endDateGroup.style.display = 'block';
        } else {
            endDateGroup.style.display = 'none';
        }
    });

    // Handle form submission
    addTaskForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const taskData = {
            name: document.getElementById('taskName').value,
            priority: document.getElementById('taskPriority').value,
            date: document.getElementById('taskDate').value,
            timeFrom: document.getElementById('taskTimeFrom').value,
            timeTo: document.getElementById('taskTimeTo').value,
            recurring: document.getElementById('taskRecurring').value,
            endDate: document.getElementById('taskEndDate').value
        };

        // Save task to localStorage
        saveTask(taskData);
        
        // Close modal and reset form
        addTaskModal.classList.remove('show');
        addTaskForm.reset();
        
        // Refresh calendar
        renderCalendar();
        renderTodaysTasks();
        
        showNotification('✅ Task added successfully!');
    });

    document.getElementById('todayBtn').addEventListener('click', () => {
        currentDate = new Date();
        renderCalendar();
        renderMiniCalendar();
    });

    document.getElementById('prevBtn').addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() - 1);
        renderCalendar();
        renderMiniCalendar();
    });

    document.getElementById('nextBtn').addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() + 1);
        renderCalendar();
        renderMiniCalendar();
    });

    document.getElementById('miniPrevBtn').addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() - 1);
        renderCalendar();
        renderMiniCalendar();
    });

    document.getElementById('miniNextBtn').addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() + 1);
        renderCalendar();
        renderMiniCalendar();
    });
}

// Load data from localStorage
function loadCalendarData() {
    try {
        const data = localStorage.getItem(STORAGE_KEY);
        if (data) {
            return JSON.parse(data);
        }
    } catch (e) {
        console.error('Error loading calendar data:', e);
    }
    return {
        quests: [],
        dungeons: [],
        dailyQuests: {}
    };
}

// Render main calendar
function renderCalendar() {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    // Update header
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                       'July', 'August', 'September', 'October', 'November', 'December'];
    document.getElementById('currentMonth').textContent = `${monthNames[month]} ${year}`;

    // Get first day of month and number of days
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    const calendarDays = document.getElementById('calendarDays');
    calendarDays.innerHTML = '';

    const data = loadCalendarData();
    const today = new Date();

    // Previous month days
    for (let i = firstDay - 1; i >= 0; i--) {
        const day = daysInPrevMonth - i;
        const dayDiv = createDayElement(day, true, false, year, month - 1, data);
        calendarDays.appendChild(dayDiv);
    }

    // Current month days
    for (let day = 1; day <= daysInMonth; day++) {
        const isToday = day === today.getDate() && 
                       month === today.getMonth() && 
                       year === today.getFullYear();
        const dayDiv = createDayElement(day, false, isToday, year, month, data);
        calendarDays.appendChild(dayDiv);
    }

    // Next month days
    const totalCells = firstDay + daysInMonth;
    const remainingCells = totalCells % 7 === 0 ? 0 : 7 - (totalCells % 7);
    for (let day = 1; day <= remainingCells; day++) {
        const dayDiv = createDayElement(day, true, false, year, month + 1, data);
        calendarDays.appendChild(dayDiv);
    }
}

// Create day element
function createDayElement(day, isOtherMonth, isToday, year, month, data) {
    const dayDiv = document.createElement('div');
    dayDiv.className = `calendar-day${isOtherMonth ? ' other-month' : ''}${isToday ? ' today' : ''}`;
    
    const dayNumber = document.createElement('div');
    dayNumber.className = 'day-number';
    dayNumber.textContent = day;
    dayDiv.appendChild(dayNumber);

    // Add events for this day
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    
    // Check for daily quests
    if (data.dailyQuests && !isOtherMonth) {
        const eventDiv = document.createElement('div');
        eventDiv.className = 'event';
        eventDiv.textContent = 'Daily Quests';
        dayDiv.appendChild(eventDiv);
    }

    // Check for active quests with deadlines
    if (data.quests && Array.isArray(data.quests)) {
        data.quests.forEach(quest => {
            if (quest.deadline && quest.deadline === dateStr) {
                const eventDiv = document.createElement('div');
                eventDiv.className = 'event quest';
                eventDiv.textContent = quest.title || 'Quest';
                dayDiv.appendChild(eventDiv);
            }
        });
    }

    // Check for dungeons
    if (data.dungeons && Array.isArray(data.dungeons)) {
        data.dungeons.forEach(dungeon => {
            if (dungeon.date && dungeon.date === dateStr) {
                const eventDiv = document.createElement('div');
                eventDiv.className = 'event dungeon';
                eventDiv.textContent = dungeon.title || 'Dungeon';
                dayDiv.appendChild(eventDiv);
            }
        });
    }

    // Check for calendar tasks
    if (data.calendarTasks && Array.isArray(data.calendarTasks)) {
        data.calendarTasks.forEach(task => {
            if (task.date === dateStr) {
                const eventDiv = document.createElement('div');
                eventDiv.className = `event task-${task.priority}`;
                
                // Add time if available
                let displayText = task.name;
                if (task.timeFrom) {
                    displayText = `${task.timeFrom} ${task.name}`;
                }
                
                eventDiv.textContent = displayText;
                dayDiv.appendChild(eventDiv);
            }
            
            // Handle recurring tasks
            if (task.recurring !== 'none') {
                const taskDate = new Date(task.date);
                const checkDate = new Date(year, month, day);
                const endDate = task.endDate ? new Date(task.endDate) : new Date(9999, 11, 31);
                
                if (checkDate >= taskDate && checkDate <= endDate) {
                    let shouldShow = false;
                    
                    if (task.recurring === 'daily') {
                        shouldShow = true;
                    } else if (task.recurring === 'weekly') {
                        const daysDiff = Math.floor((checkDate - taskDate) / (1000 * 60 * 60 * 24));
                        shouldShow = daysDiff % 7 === 0;
                    }
                    
                    if (shouldShow) {
                        const eventDiv = document.createElement('div');
                        eventDiv.className = `event task-${task.priority}`;
                        
                        let displayText = task.name;
                        if (task.timeFrom) {
                            displayText = `${task.timeFrom} ${task.name}`;
                        }
                        
                        eventDiv.textContent = displayText;
                        dayDiv.appendChild(eventDiv);
                    }
                }
            }
        });
    }

    return dayDiv;
}

// Render mini calendar
function renderMiniCalendar() {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();
    
    const miniCalendarDays = document.getElementById('miniCalendarDays');
    miniCalendarDays.innerHTML = '';

    const today = new Date();

    // Previous month days
    for (let i = firstDay - 1; i >= 0; i--) {
        const day = daysInPrevMonth - i;
        const dayDiv = document.createElement('div');
        dayDiv.className = 'mini-day other-month';
        dayDiv.textContent = day;
        miniCalendarDays.appendChild(dayDiv);
    }

    // Current month days
    for (let day = 1; day <= daysInMonth; day++) {
        const isToday = day === today.getDate() && 
                       month === today.getMonth() && 
                       year === today.getFullYear();
        const dayDiv = document.createElement('div');
        dayDiv.className = `mini-day${isToday ? ' today' : ''}`;
        dayDiv.textContent = day;
        miniCalendarDays.appendChild(dayDiv);
    }
}

// Get base XP for daily quests
function getBaseDailyQuestXP(questKey) {
    const baseXP = {
        pushups: 10,
        situps: 10,
        crunches: 10,
        running: 15,
        reading: 20
    };
    return baseXP[questKey] || 10;
}

// Get daily quest amount based on level
function getDailyQuestAmount(questKey, level) {
    if (!level) {
        const data = loadCalendarData();
        level = (data.dailyQuestLevels && data.dailyQuestLevels[questKey]) || 1;
    }
    
    const progressions = {
        pushups: { start: 5, end: 100, increment: 5 },
        situps: { start: 5, end: 100, increment: 5 },
        crunches: { start: 5, end: 100, increment: 5 },
        running: { start: 1, end: 10, increment: 0.5 },
        reading: { start: 5, end: 30, increment: 1 }
    };
    
    const prog = progressions[questKey];
    if (!prog) return 1;
    
    const amount = prog.start + ((level - 1) * prog.increment);
    return Math.min(amount, prog.end);
}

// Get quest unit
function getQuestUnit(questKey) {
    const units = {
        pushups: 'reps',
        situps: 'reps',
        crunches: 'reps',
        running: 'km',
        reading: 'pages'
    };
    return units[questKey] || '';
}

// Get max level for a quest
function getMaxQuestLevel(questKey) {
    const progressions = {
        pushups: { start: 5, end: 100, increment: 5 },
        situps: { start: 5, end: 100, increment: 5 },
        crunches: { start: 5, end: 100, increment: 5 },
        running: { start: 1, end: 10, increment: 0.5 },
        reading: { start: 5, end: 30, increment: 1 }
    };
    
    const prog = progressions[questKey];
    if (!prog) return 1;
    
    return Math.ceil((prog.end - prog.start) / prog.increment) + 1;
}

// Check if all daily quests are completed and award stat points
function checkAllDailyQuestsComplete(data) {
    const today = new Date().toDateString();
    
    // Check if already awarded today
    if (data.lastStatPointAward === today) {
        console.log('Stat points already awarded today');
        return; // Already awarded today
    }
    
    // Check if all daily quests are completed
    const allComplete = data.dailyQuests &&
        data.dailyQuests.pushups &&
        data.dailyQuests.situps &&
        data.dailyQuests.crunches &&
        data.dailyQuests.running &&
        data.dailyQuests.reading;
    
    console.log('All daily quests complete:', allComplete);
    console.log('Daily quests status:', data.dailyQuests);
    
    if (allComplete) {
        // Initialize gold if not exists
        if (!data.gold) {
            data.gold = 0;
        }
        
        // Award 3 credits
        data.gold += 3;
        data.lastStatPointAward = today;
        
        // Save to localStorage
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
            showNotification('🎉 All daily quests complete! +3 Credits awarded!');
            console.log('Credits awarded! New total:', data.gold);
        } catch (err) {
            console.error('Error awarding credits:', err);
        }
    }
}

// Render today's tasks
function renderTodaysTasks() {
    const data = loadCalendarData();
    
    // Render daily quests
    renderDailyQuests(data);
    
    // Render active quests
    renderActiveQuests(data);
    
    // Render dungeons
    renderDungeons(data);
}

// Render daily quests
function renderDailyQuests(data) {
    const container = document.getElementById('dailyQuestsList');
    container.innerHTML = '';

    const today = new Date().toISOString().split('T')[0];

    const dailyQuestTypes = [
        { key: 'pushups', label: 'Pushups', icon: '💪' },
        { key: 'situps', label: 'Situps', icon: '🧘' },
        { key: 'crunches', label: 'Crunches', icon: '💪' },
        { key: 'running', label: 'Running', icon: '🏃' },
        { key: 'reading', label: 'Reading', icon: '📚' }
    ];

    dailyQuestTypes.forEach(quest => {
        const taskItem = document.createElement('div');
        taskItem.className = 'task-item';

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = `daily-${quest.key}`;
        checkbox.dataset.quest = quest.key;
        
        // Check if completed today
        if (data.dailyQuests && data.dailyQuests[quest.key]) {
            checkbox.checked = data.dailyQuests[quest.key];
        }

        // Add change listener to sync with main app
        checkbox.addEventListener('change', (e) => {
            const questKey = e.target.dataset.quest;
            if (questKey) {
                const wasChecked = data.dailyQuests[questKey];
                const nowChecked = e.target.checked;
                
                data.dailyQuests[questKey] = nowChecked;
                
                // Award XP when quest is completed (not when unchecked)
                if (!wasChecked && nowChecked) {
                    // Calculate XP with diminishing returns based on body adaptation
                    const completionCount = data.dailyQuestCompletions[questKey] || 0;
                    const currentLevel = data.dailyQuestLevels[questKey] || 1;
                    const baseXP = getBaseDailyQuestXP(questKey);
                    const levelMultiplier = 1 + ((currentLevel - 1) * 0.1);
                    const adaptationMultiplier = Math.pow(0.85, completionCount);
                    const finalXP = Math.max(2, Math.floor(baseXP * levelMultiplier * adaptationMultiplier));
                    
                    // Add XP
                    data.xp = (data.xp || 0) + finalXP;
                    
                    // Increment completion counter
                    data.dailyQuestCompletions[questKey] = completionCount + 1;
                    
                    // Check if should level up the quest (every 3 completions at current level)
                    const maxLevel = getMaxQuestLevel(questKey);
                    if ((completionCount + 1) % 3 === 0 && currentLevel < maxLevel) {
                        data.dailyQuestLevels[questKey] = currentLevel + 1;
                        showNotification(`🎉 Quest leveled up! ${quest.label} now requires ${getDailyQuestAmount(questKey, currentLevel + 1)} ${getQuestUnit(questKey)}`);
                    }
                    
                    // Show XP notification
                    const adaptationPercent = Math.round(adaptationMultiplier * 100);
                    showNotification(`✅ +${finalXP} XP (${adaptationPercent}% adaptation)`);
                    
                    // Refresh profile to show new XP
                    renderProfile();
                    
                    // Check if all daily quests are completed
                    checkAllDailyQuestsComplete(data);
                }
                
                // Save to localStorage
                try {
                    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
                } catch (err) {
                    console.error('Error saving daily quest state:', err);
                }
            }
        });

        const taskContent = document.createElement('div');
        taskContent.className = 'task-content';

        const taskName = document.createElement('div');
        taskName.className = 'task-name';
        taskName.textContent = `${quest.icon} ${quest.label}`;

        const taskDetails = document.createElement('div');
        taskDetails.className = 'task-details';
        
        // Get current amount
        const level = (data.dailyQuestLevels && data.dailyQuestLevels[quest.key]) || 1;
        const amounts = {
            pushups: 5 + (level - 1) * 5,
            situps: 5 + (level - 1) * 5,
            crunches: 5 + (level - 1) * 5,
            running: 1 + (level - 1) * 0.5,
            reading: 5 + (level - 1) * 1
        };
        const amount = amounts[quest.key] || 5;
        const unit = quest.key === 'running' ? 'km' : quest.key === 'reading' ? 'pages' : 'reps';
        taskDetails.textContent = `${amount} ${unit}`;

        taskContent.appendChild(taskName);
        taskContent.appendChild(taskDetails);

        taskItem.appendChild(checkbox);
        taskItem.appendChild(taskContent);
        container.appendChild(taskItem);
    });

    // Add today's calendar tasks
    if (data.calendarTasks && Array.isArray(data.calendarTasks)) {
        data.calendarTasks.forEach(task => {
            let shouldShow = false;
            
            // Check if task is for today
            if (task.date === today) {
                shouldShow = true;
            }
            
            // Check recurring tasks
            if (task.recurring !== 'none') {
                const taskDate = new Date(task.date);
                const todayDate = new Date(today);
                const endDate = task.endDate ? new Date(task.endDate) : new Date(9999, 11, 31);
                
                if (todayDate >= taskDate && todayDate <= endDate) {
                    if (task.recurring === 'daily') {
                        shouldShow = true;
                    } else if (task.recurring === 'weekly') {
                        const daysDiff = Math.floor((todayDate - taskDate) / (1000 * 60 * 60 * 24));
                        shouldShow = daysDiff % 7 === 0;
                    }
                }
            }
            
            if (shouldShow) {
                const taskItem = document.createElement('div');
                taskItem.className = 'task-item';

                const checkbox = document.createElement('input');
                checkbox.type = 'checkbox';
                checkbox.id = `calendar-task-${task.id}`;

                const taskContent = document.createElement('div');
                taskContent.className = 'task-content';

                const taskName = document.createElement('div');
                taskName.className = 'task-name';
                taskName.textContent = task.name;

                const taskDetails = document.createElement('div');
                taskDetails.className = 'task-details';
                let detailText = '';
                if (task.timeFrom && task.timeTo) {
                    detailText = `${task.timeFrom} - ${task.timeTo}`;
                } else if (task.timeFrom) {
                    detailText = task.timeFrom;
                }
                if (task.recurring !== 'none') {
                    detailText += ` • ${task.recurring}`;
                }
                taskDetails.textContent = detailText;

                const badge = document.createElement('span');
                badge.className = `task-badge task-${task.priority}`;
                badge.textContent = task.priority.charAt(0).toUpperCase() + task.priority.slice(1);

                taskContent.appendChild(taskName);
                taskContent.appendChild(taskDetails);
                taskContent.appendChild(badge);

                taskItem.appendChild(checkbox);
                taskItem.appendChild(taskContent);
                container.appendChild(taskItem);
            }
        });
    }

    if (container.children.length === 0) {
        container.innerHTML = '<div class="empty-tasks">No daily quests available</div>';
    }
}

// Render active quests
function renderActiveQuests(data) {
    const container = document.getElementById('activeQuestsList');
    container.innerHTML = '';

    if (data.quests && Array.isArray(data.quests)) {
        const activeQuests = data.quests.filter(q => !q.completed);
        
        activeQuests.forEach((quest, index) => {
            const taskItem = document.createElement('div');
            taskItem.className = 'task-item';

            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.id = `quest-${index}`;

            const taskContent = document.createElement('div');
            taskContent.className = 'task-content';

            const taskName = document.createElement('div');
            taskName.className = 'task-name';
            taskName.textContent = quest.title || `Quest ${index + 1}`;

            const taskDetails = document.createElement('div');
            taskDetails.className = 'task-details';
            taskDetails.textContent = `Progress: ${quest.progress || 0}/${quest.target || 100}`;

            const badge = document.createElement('span');
            badge.className = 'task-badge quest';
            badge.textContent = 'Quest';

            taskContent.appendChild(taskName);
            taskContent.appendChild(taskDetails);
            taskContent.appendChild(badge);

            taskItem.appendChild(checkbox);
            taskItem.appendChild(taskContent);
            container.appendChild(taskItem);
        });

        if (activeQuests.length === 0) {
            container.innerHTML = '<div class="empty-tasks">No active quests</div>';
        }
    } else {
        container.innerHTML = '<div class="empty-tasks">No active quests</div>';
    }
}

// Render dungeons
function renderDungeons(data) {
    const container = document.getElementById('dungeonsList');
    container.innerHTML = '';

    if (data.dungeons && Array.isArray(data.dungeons)) {
        const upcomingDungeons = data.dungeons.filter(d => !d.completed);
        
        upcomingDungeons.forEach((dungeon, index) => {
            const taskItem = document.createElement('div');
            taskItem.className = 'task-item';

            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.id = `dungeon-${index}`;

            const taskContent = document.createElement('div');
            taskContent.className = 'task-content';

            const taskName = document.createElement('div');
            taskName.className = 'task-name';
            taskName.textContent = dungeon.title || `Dungeon ${index + 1}`;

            const taskDetails = document.createElement('div');
            taskDetails.className = 'task-details';
            taskDetails.textContent = dungeon.duration ? `Duration: ${dungeon.duration} min` : 'Timed challenge';

            const badge = document.createElement('span');
            badge.className = 'task-badge dungeon';
            badge.textContent = 'Dungeon';

            taskContent.appendChild(taskName);
            taskContent.appendChild(taskDetails);
            taskContent.appendChild(badge);

            taskItem.appendChild(checkbox);
            taskItem.appendChild(taskContent);
            container.appendChild(taskItem);
        });

        if (upcomingDungeons.length === 0) {
            container.innerHTML = '<div class="empty-tasks">No upcoming dungeons</div>';
        }
    } else {
        container.innerHTML = '<div class="empty-tasks">No upcoming dungeons</div>';
    }
}

// Save task to localStorage
function saveTask(taskData) {
    const data = loadCalendarData();
    
    if (!data.calendarTasks) {
        data.calendarTasks = [];
    }
    
    // Add unique ID and timestamp
    taskData.id = Date.now();
    taskData.created = new Date().toISOString();
    
    data.calendarTasks.push(taskData);
    
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
        console.error('Error saving task:', e);
    }
}

// Show notification
function showNotification(message) {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: linear-gradient(135deg, #d4af37, #b8956a);
        color: #1a0f0a;
        padding: 15px 25px;
        border-radius: 8px;
        font-size: 16px;
        font-weight: 600;
        z-index: 3000;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
        animation: slideIn 0.3s ease;
    `;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}
