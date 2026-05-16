// Settings Page Logic
(async function initSettings() {
    try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;
        if (!session) {
            window.location.href = 'login.html';
            return;
        }
        await loadFromSupabase();
        
        // Reveal UI
        document.body.style.visibility = 'visible';
        startSettings();
    } catch (err) {
        console.error('Auth Error:', err);
        window.location.href = 'login.html';
        return;
    }
})();

function startSettings() {
    const STORAGE_KEY = 'solo_leveling_state_v1';
    const SETTINGS_KEY = 'solo_leveling_settings_v1';

    // DOM Elements
    const userNameInput = document.getElementById('userName');
    const saveUserNameBtn = document.getElementById('saveUserName');
    const avatarPreview = document.getElementById('avatarPreview');
    const avatarUpload = document.getElementById('avatarUpload');
    const uploadAvatarBtn = document.getElementById('uploadAvatarBtn');
    const resetAvatarBtn = document.getElementById('resetAvatarBtn');
    const resetTimeSelect = document.getElementById('resetTime');
    const soundToggle = document.getElementById('soundToggle');
    const notificationsToggle = document.getElementById('notificationsToggle');
    const exportDataBtn = document.getElementById('exportDataBtn');
    const importDataBtn = document.getElementById('importDataBtn');
    const importDataInput = document.getElementById('importDataInput');
    const resetAllBtn = document.getElementById('resetAllBtn');
    const confirmModal = document.getElementById('confirmModal');
    const confirmTitle = document.getElementById('confirmTitle');
    const confirmMessage = document.getElementById('confirmMessage');
    const confirmYes = document.getElementById('confirmYes');
    const confirmNo = document.getElementById('confirmNo');
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toastMessage');
    
    // Crop modal elements
    const cropModal = document.getElementById('cropModal');
    const cropImage = document.getElementById('cropImage');
    const cropBox = document.getElementById('cropBox');
    const applyCrop = document.getElementById('applyCrop');
    const cancelCrop = document.getElementById('cancelCrop');

    let currentConfirmAction = null;
    let cropData = {
        imageData: null,
        isDragging: false,
        isResizing: false,
        startX: 0,
        startY: 0,
        currentHandle: null
    };

    // Load current settings
    function loadSettings() {
        try {
            // Load state data
            const stateRaw = localStorage.getItem(STORAGE_KEY);
            if (stateRaw) {
                const state = JSON.parse(stateRaw);
                userNameInput.value = state.userName || 'User name';
                if (state.avatarImage) {
                    avatarPreview.src = state.avatarImage;
                }
            }

            // Load settings
            const settingsRaw = localStorage.getItem(SETTINGS_KEY);
            if (settingsRaw) {
                const settings = JSON.parse(settingsRaw);
                resetTimeSelect.value = settings.resetTime || '0';
                soundToggle.checked = settings.soundEffects !== false;
                notificationsToggle.checked = settings.notifications === true;
            }
        } catch (e) {
            console.error('Error loading settings:', e);
        }
    }

    // Save username
    function saveUserName() {
        const newName = userNameInput.value.trim();
        if (!newName) {
            showToast('⚠️ Username cannot be empty');
            return;
        }

        try {
            const stateRaw = localStorage.getItem(STORAGE_KEY);
            const state = stateRaw ? JSON.parse(stateRaw) : {};
            state.userName = newName;
            syncToSupabase(STORAGE_KEY, JSON.stringify(state));
            showToast('✅ Username saved!');
        } catch (e) {
            showToast('❌ Error saving username');
            console.error(e);
        }
    }

    // Handle avatar upload with crop and compress
    function handleAvatarUpload(e) {
        const file = e.target.files[0];
        if (!file) return;

        // Check file type
        if (!file.type.startsWith('image/')) {
            showToast('⚠️ Please upload an image file');
            return;
        }

        const reader = new FileReader();
        reader.onload = function(event) {
            cropData.imageData = event.target.result;
            showCropModal(event.target.result);
        };
        reader.readAsDataURL(file);
    }
    
    // Show crop modal
    function showCropModal(imageData) {
        cropImage.src = imageData;
        cropModal.setAttribute('aria-hidden', 'false');
        
        // Wait for image to load before setting up crop box
        cropImage.onload = function() {
            const container = document.querySelector('.crop-container');
            const containerRect = container.getBoundingClientRect();
            const imgRect = cropImage.getBoundingClientRect();
            
            // Calculate image position relative to container
            const imgLeft = imgRect.left - containerRect.left;
            const imgTop = imgRect.top - containerRect.top;
            const imgWidth = imgRect.width;
            const imgHeight = imgRect.height;
            
            // Set initial crop box to center square (80% of smaller dimension)
            const cropSize = Math.min(imgWidth, imgHeight) * 0.8;
            const cropLeft = imgLeft + (imgWidth - cropSize) / 2;
            const cropTop = imgTop + (imgHeight - cropSize) / 2;
            
            cropBox.style.width = cropSize + 'px';
            cropBox.style.height = cropSize + 'px';
            cropBox.style.left = cropLeft + 'px';
            cropBox.style.top = cropTop + 'px';
        };
    }
    
    // Hide crop modal
    function hideCropModal() {
        cropModal.setAttribute('aria-hidden', 'true');
        cropData.imageData = null;
        avatarUpload.value = ''; // Reset file input
    }
    
    // Crop box dragging and resizing
    function initCropHandlers() {
        const container = document.querySelector('.crop-container');
        const handles = document.querySelectorAll('.crop-handle');
        
        // Drag crop box
        cropBox.addEventListener('mousedown', function(e) {
            if (e.target.classList.contains('crop-handle')) return;
            cropData.isDragging = true;
            cropData.startX = e.clientX - cropBox.offsetLeft;
            cropData.startY = e.clientY - cropBox.offsetTop;
            e.preventDefault();
        });
        
        // Resize from handles
        handles.forEach(handle => {
            handle.addEventListener('mousedown', function(e) {
                cropData.isResizing = true;
                cropData.currentHandle = handle.classList[1];
                cropData.startX = e.clientX;
                cropData.startY = e.clientY;
                cropData.startBoxLeft = cropBox.offsetLeft;
                cropData.startBoxTop = cropBox.offsetTop;
                cropData.startBoxWidth = cropBox.offsetWidth;
                cropData.startBoxHeight = cropBox.offsetHeight;
                e.stopPropagation();
                e.preventDefault();
            });
        });
        
        // Mouse move
        document.addEventListener('mousemove', function(e) {
            if (cropData.isDragging) {
                const containerRect = container.getBoundingClientRect();
                let newLeft = e.clientX - cropData.startX;
                let newTop = e.clientY - cropData.startY;
                
                // Constrain to container
                newLeft = Math.max(0, Math.min(newLeft, containerRect.width - cropBox.offsetWidth));
                newTop = Math.max(0, Math.min(newTop, containerRect.height - cropBox.offsetHeight));
                
                cropBox.style.left = newLeft + 'px';
                cropBox.style.top = newTop + 'px';
            }
            
            if (cropData.isResizing) {
                const deltaX = e.clientX - cropData.startX;
                const deltaY = e.clientY - cropData.startY;
                const delta = Math.max(deltaX, deltaY); // Keep square
                
                let newSize = cropData.startBoxWidth;
                let newLeft = cropData.startBoxLeft;
                let newTop = cropData.startBoxTop;
                
                if (cropData.currentHandle.includes('right')) {
                    newSize = Math.max(50, cropData.startBoxWidth + delta);
                } else if (cropData.currentHandle.includes('left')) {
                    newSize = Math.max(50, cropData.startBoxWidth - delta);
                    newLeft = cropData.startBoxLeft + (cropData.startBoxWidth - newSize);
                }
                
                if (cropData.currentHandle.includes('bottom')) {
                    newSize = Math.max(50, Math.max(newSize, cropData.startBoxHeight + delta));
                } else if (cropData.currentHandle.includes('top')) {
                    newSize = Math.max(50, Math.max(newSize, cropData.startBoxHeight - delta));
                    newTop = cropData.startBoxTop + (cropData.startBoxHeight - newSize);
                }
                
                // Constrain to container
                const containerRect = container.getBoundingClientRect();
                newSize = Math.min(newSize, containerRect.width - newLeft, containerRect.height - newTop);
                
                cropBox.style.width = newSize + 'px';
                cropBox.style.height = newSize + 'px';
                cropBox.style.left = newLeft + 'px';
                cropBox.style.top = newTop + 'px';
            }
        });
        
        // Mouse up
        document.addEventListener('mouseup', function() {
            cropData.isDragging = false;
            cropData.isResizing = false;
            cropData.currentHandle = null;
        });
    }
    
    // Apply crop and compress
    function applyCropAndSave() {
        const container = document.querySelector('.crop-container');
        const containerRect = container.getBoundingClientRect();
        const imgRect = cropImage.getBoundingClientRect();
        
        // Calculate crop coordinates relative to the actual image
        const scaleX = cropImage.naturalWidth / imgRect.width;
        const scaleY = cropImage.naturalHeight / imgRect.height;
        
        const cropLeft = (cropBox.offsetLeft - (imgRect.left - containerRect.left)) * scaleX;
        const cropTop = (cropBox.offsetTop - (imgRect.top - containerRect.top)) * scaleY;
        const cropWidth = cropBox.offsetWidth * scaleX;
        const cropHeight = cropBox.offsetHeight * scaleY;
        
        // Create canvas for cropping
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // Set canvas to 500x500
        canvas.width = 500;
        canvas.height = 500;
        
        // Create temp image
        const img = new Image();
        img.onload = function() {
            // Draw cropped and resized image
            ctx.drawImage(
                img,
                cropLeft, cropTop, cropWidth, cropHeight,
                0, 0, 500, 500
            );
            
            // Compress to JPEG
            const compressedData = canvas.toDataURL('image/jpeg', 0.85);
            
            // Update preview
            avatarPreview.src = compressedData;
            
            try {
                const stateRaw = localStorage.getItem(STORAGE_KEY);
                const state = stateRaw ? JSON.parse(stateRaw) : {};
                state.avatarImage = compressedData;
                syncToSupabase(STORAGE_KEY, JSON.stringify(state));
                showToast('✅ Avatar cropped & saved! (500x500)');
                hideCropModal();
            } catch (e) {
                showToast('❌ Error saving avatar');
                console.error(e);
            }
        };
        img.src = cropData.imageData;
    }

    // Reset avatar to default
    function resetAvatar() {
        avatarPreview.src = 'Images/Default_profile.png';
        try {
            const stateRaw = localStorage.getItem(STORAGE_KEY);
            const state = stateRaw ? JSON.parse(stateRaw) : {};
            delete state.avatarImage;
            syncToSupabase(STORAGE_KEY, JSON.stringify(state));
            showToast('✅ Avatar reset to default');
        } catch (e) {
            showToast('❌ Error resetting avatar');
            console.error(e);
        }
    }

    // Save settings
    function saveSettings() {
        const settings = {
            resetTime: resetTimeSelect.value,
            soundEffects: soundToggle.checked,
            notifications: notificationsToggle.checked
        };

        try {
            syncToSupabase(SETTINGS_KEY, JSON.stringify(settings));
            showToast('✅ Settings saved!');
        } catch (e) {
            showToast('❌ Error saving settings');
            console.error(e);
        }
    }

    // Export data
    function exportData() {
        try {
            const stateRaw = localStorage.getItem(STORAGE_KEY);
            const settingsRaw = localStorage.getItem(SETTINGS_KEY);
            
            const exportData = {
                version: '1.0',
                exportDate: new Date().toISOString(),
                state: stateRaw ? JSON.parse(stateRaw) : {},
                settings: settingsRaw ? JSON.parse(settingsRaw) : {}
            };

            const dataStr = JSON.stringify(exportData, null, 2);
            const dataBlob = new Blob([dataStr], { type: 'application/json' });
            const url = URL.createObjectURL(dataBlob);
            
            const link = document.createElement('a');
            link.href = url;
            link.download = `life-leveling-backup-${new Date().toISOString().split('T')[0]}.json`;
            link.click();
            
            URL.revokeObjectURL(url);
            showToast('✅ Data exported successfully!');
        } catch (e) {
            showToast('❌ Error exporting data');
            console.error(e);
        }
    }

    // Import data
    function handleImportData(e) {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = function(event) {
            try {
                const importedData = JSON.parse(event.target.result);
                
                if (importedData.state) {
                    syncToSupabase(STORAGE_KEY, JSON.stringify(importedData.state));
                }
                if (importedData.settings) {
                    syncToSupabase(SETTINGS_KEY, JSON.stringify(importedData.settings));
                }
                
                showToast('✅ Data imported! Reloading...');
                setTimeout(() => {
                    window.location.reload();
                }, 1500);
            } catch (e) {
                showToast('❌ Invalid backup file');
                console.error(e);
            }
        };
        reader.readAsText(file);
    }

    // Reset all progress
    function resetAllProgress() {
        showConfirmModal(
            'Reset All Progress',
            'Are you ABSOLUTELY sure? This will delete ALL your progress, quests, stats, and purchases. This cannot be undone!',
            () => {
                try {
                    syncToSupabase(STORAGE_KEY, "{}");
                    syncToSupabase(SETTINGS_KEY, "{}");
                    showToast('✅ All data deleted. Redirecting...');
                    setTimeout(() => {
                        window.location.href = 'index.html';
                    }, 1500);
                } catch (e) {
                    showToast('❌ Error resetting data');
                    console.error(e);
                }
            }
        );
    }

    // Show confirmation modal
    function showConfirmModal(title, message, onConfirm) {
        confirmTitle.textContent = title;
        confirmMessage.textContent = message;
        currentConfirmAction = onConfirm;
        confirmModal.setAttribute('aria-hidden', 'false');
    }

    // Hide confirmation modal
    function hideConfirmModal() {
        confirmModal.setAttribute('aria-hidden', 'true');
        currentConfirmAction = null;
    }

    // Show toast notification
    function showToast(message) {
        toastMessage.textContent = message;
        toast.setAttribute('aria-hidden', 'false');
        setTimeout(() => {
            toast.setAttribute('aria-hidden', 'true');
        }, 3000);
    }

    // Event Listeners
    saveUserNameBtn.addEventListener('click', saveUserName);
    userNameInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') saveUserName();
    });

    uploadAvatarBtn.addEventListener('click', () => avatarUpload.click());
    avatarUpload.addEventListener('change', handleAvatarUpload);
    resetAvatarBtn.addEventListener('click', resetAvatar);

    resetTimeSelect.addEventListener('change', saveSettings);
    soundToggle.addEventListener('change', saveSettings);
    notificationsToggle.addEventListener('change', saveSettings);

    exportDataBtn.addEventListener('click', exportData);
    importDataBtn.addEventListener('click', () => importDataInput.click());
    importDataInput.addEventListener('change', handleImportData);

    resetAllBtn.addEventListener('click', resetAllProgress);

    confirmYes.addEventListener('click', () => {
        if (currentConfirmAction) {
            currentConfirmAction();
        }
        hideConfirmModal();
    });

    confirmNo.addEventListener('click', hideConfirmModal);

    // Request notification permission on change
    if (notificationsToggle) {
        notificationsToggle.addEventListener('change', () => {
            if (notificationsToggle.checked && 'Notification' in window) {
                Notification.requestPermission();
            }
        });
    }
    
    // Crop modal event listeners
    applyCrop.addEventListener('click', applyCropAndSave);
    cancelCrop.addEventListener('click', hideCropModal);

    // Initialize
    loadSettings();
    initCropHandlers();
}
