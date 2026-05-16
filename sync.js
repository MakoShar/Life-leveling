// Data sync utility with debounce and cloud priority
let syncTimeout = null;

function updateSyncStatus(status) {
    let statusContainer = document.getElementById('supabase-sync-status-container');
    if (!statusContainer) {
        // Fallback search for profile cards
        const profile = document.querySelector('.profile-card') || 
                        document.querySelector('.player-profile') || 
                        document.querySelector('.settings-card') ||
                        document.body;
        
        statusContainer = document.createElement('div');
        statusContainer.id = 'supabase-sync-status-container';
        profile.prepend(statusContainer);
    }

    let statusEl = document.getElementById('supabase-sync-status');
    if (!statusEl) {
        statusEl = document.createElement('div');
        statusEl.id = 'supabase-sync-status';
        statusEl.innerHTML = `
            <div class="sync-indicator">
                <span class="sync-dot"></span>
                <span class="sync-text"></span>
            </div>
        `;
        
        // Add styles if not already present
        if (!document.getElementById('supabase-sync-styles')) {
            const style = document.createElement('style');
            style.id = 'supabase-sync-styles';
            style.textContent = `
                #supabase-sync-status {
                    font-family: 'Inter', sans-serif;
                    font-size: 11px;
                    text-transform: uppercase;
                    letter-spacing: 1px;
                    color: var(--muted, #b8956a);
                    margin-bottom: 12px;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                }
                .sync-indicator {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    padding: 4px 10px;
                    background: rgba(0,0,0,0.4);
                    border-radius: 20px;
                    border: 1px solid rgba(184, 149, 106, 0.3);
                    box-shadow: 0 2px 10px rgba(0,0,0,0.3);
                }
                .sync-dot {
                    width: 8px;
                    height: 8px;
                    border-radius: 50%;
                    background: #5d9e6e;
                    box-shadow: 0 0 8px #5d9e6e;
                    transition: all 0.3s ease;
                }
                .sync-dot.syncing {
                    background: #d4af37;
                    box-shadow: 0 0 8px #d4af37;
                    animation: supabase-pulse 1.5s infinite;
                }
                .sync-dot.offline {
                    background: #ff4444;
                    box-shadow: 0 0 8px #ff4444;
                }
                @keyframes supabase-pulse {
                    0% { opacity: 0.4; transform: scale(0.8); }
                    50% { opacity: 1; transform: scale(1.1); }
                    100% { opacity: 0.4; transform: scale(0.8); }
                }
            `;
            document.head.appendChild(style);
        }
        statusContainer.prepend(statusEl);
    }

    const dot = statusEl.querySelector('.sync-dot');
    const text = statusEl.querySelector('.sync-text');
    
    dot.classList.remove('syncing', 'offline');
    
    if (status === 'Syncing...') {
        dot.classList.add('syncing');
        text.textContent = 'Syncing';
    } else if (status === 'Synced') {
        text.textContent = 'Synced';
    } else if (status === 'Offline' || status === 'Offline mode') {
        dot.classList.add('offline');
        text.textContent = 'Offline';
    } else if (status === 'Loading cloud data...') {
        dot.classList.add('syncing');
        text.textContent = 'Loading';
    } else {
        text.textContent = status;
    }
}

// Wrapper for saving data to localStorage AND Supabase
window.syncToSupabase = function(key, value) {
    localStorage.setItem(key, value);
    updateSyncStatus('Syncing...');

    clearTimeout(syncTimeout);
    syncTimeout = setTimeout(async () => {
        try {
            const { data: { session } } = await supabaseClient.auth.getSession();
            if (!session) {
                updateSyncStatus('Offline');
                return;
            }

            const allData = {};
            for (let i = 0; i < localStorage.length; i++) {
                const k = localStorage.key(i);
                if (!k.startsWith('supabaseClient.auth.')) {
                    allData[k] = localStorage.getItem(k);
                }
            }

            const { error } = await supabase
                .from('user_data')
                .upsert({ 
                    user_id: session.user.id, 
                    data: allData,
                    updated_at: new Date().toISOString()
                }, { onConflict: 'user_id' });

            if (error) throw error;
            
            updateSyncStatus('Synced');
            setTimeout(() => { if(document.getElementById('sync-status')?.textContent === 'Synced') updateSyncStatus(''); }, 2000);
        } catch (error) {
            console.error('Error syncing to Supabase:', error);
            updateSyncStatus('Sync failed (Saved locally)');
        }
    }, 2000);
};

// Load data from Supabase to localStorage
window.loadFromSupabase = async function() {
    try {
        const { data: { session } } = await supabaseClient.auth.getSession();
        if (!session) return;

        updateSyncStatus('Loading cloud data...');
        const { data, error } = await supabase
            .from('user_data')
            .select('data')
            .eq('user_id', session.user.id)
            .single();

        if (error && error.code !== 'PGRST116') {
            throw error;
        }

        if (data && data.data) {
            const cloudData = data.data;
            for (const key in cloudData) {
                localStorage.setItem(key, cloudData[key]);
            }
        }
        updateSyncStatus('Synced');
        setTimeout(() => { if(document.getElementById('sync-status')?.textContent === 'Synced') updateSyncStatus(''); }, 2000);
    } catch (error) {
        console.error('Error loading from Supabase:', error);
        updateSyncStatus('Offline mode');
    }
};
