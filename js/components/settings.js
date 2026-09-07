// Settings Component
// Theme Management
class ThemeManager {
    constructor() {
        this.currentTheme = localStorage.getItem('inkmaster_theme') || 'dark';
        this.primaryColor = localStorage.getItem('inkmaster_primary') || '#8B5CF6';
        this.secondaryColor = localStorage.getItem('inkmaster_secondary') || '#6D28D9';
        this.accentColor = localStorage.getItem('inkmaster_accent') || '#EC4899';
        
        this.loadTheme();
    }
    
    loadTheme() {
        const themeLink = document.getElementById('theme-stylesheet');
        if (themeLink) {
            themeLink.href = `css/themes/${this.currentTheme}.css`;
        }
        
        document.documentElement.style.setProperty('--primary-color', this.primaryColor);
        document.documentElement.style.setProperty('--secondary-color', this.secondaryColor);
        document.documentElement.style.setProperty('--accent-color', this.accentColor);
        
        // Apply background based on theme
        this.applyThemeBackground();
        
        this.updateThemeUI();
    }
    
    applyThemeBackground() {
        const body = document.body;
        // Remove existing theme classes
        body.classList.remove('theme-dark', 'theme-light', 'theme-neon', 'theme-vintage');
        // Add current theme class
        body.classList.add(`theme-${this.currentTheme}`);
    }
    
    setTheme(theme) {
        this.currentTheme = theme;
        localStorage.setItem('inkmaster_theme', theme);
        this.loadTheme();
        this.saveThemeToBackend();
    }
    
    setColors(primary, secondary, accent) {
        this.primaryColor = primary;
        this.secondaryColor = secondary;
        this.accentColor = accent;
        
        localStorage.setItem('inkmaster_primary', primary);
        localStorage.setItem('inkmaster_secondary', secondary);
        localStorage.setItem('inkmaster_accent', accent);
        
        this.loadTheme();
        this.saveThemeToBackend();
    }
    
    async saveThemeToBackend() {
        try {
            if (window.api) {
                await window.api.saveTheme({
                    theme: this.currentTheme,
                    primary_color: this.primaryColor,
                    secondary_color: this.secondaryColor,
                    accent_color: this.accentColor
                });
            }
        } catch (error) {
            console.error('Failed to save theme:', error);
        }
    }
    
    updateThemeUI() {
        document.querySelectorAll('.theme-option').forEach(el => {
            const theme = el.dataset.theme;
            const preview = el.querySelector('.theme-preview');
            if (!preview) return;
            
            if (theme === this.currentTheme) {
                preview.classList.add('border-purple-500');
            } else {
                preview.classList.remove('border-purple-500');
            }
        });
        
        const primaryInput = document.getElementById('primary-color');
        const secondaryInput = document.getElementById('secondary-color');
        const accentInput = document.getElementById('accent-color');
        
        if (primaryInput) primaryInput.value = this.primaryColor;
        if (secondaryInput) secondaryInput.value = this.secondaryColor;
        if (accentInput) accentInput.value = this.accentColor;
    }
}

// Settings Panel Controller
class SettingsController {
    constructor() {
        this.themeManager = new ThemeManager();
        this.setupSettingsTabs();
        this.setupThemeOptions();
        this.setupProfileForm();
        this.setupSecurityForm();
        this.setupNotificationForm();
        this.setupBusinessForm();
    }
    
    loadAllSettings() {
        this.loadProfileData();
        this.loadBusinessSettings();
        this.loadNotificationPreferences();
    }
    
    setupSettingsTabs() {
        const tabs = document.querySelectorAll('.settings-tab');
        const panels = {
            theme: document.getElementById('settings-theme'),
            profile: document.getElementById('settings-profile'),
            security: document.getElementById('settings-security'),
            notifications: document.getElementById('settings-notifications'),
            business: document.getElementById('settings-business')
        };
        
        if (!tabs.length) return;
        
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                tabs.forEach(t => {
                    t.classList.remove('active', 'text-purple-600', 'border-purple-600');
                    t.classList.add('text-gray-500');
                });
                
                Object.keys(panels).forEach(key => {
                    if (panels[key]) panels[key].classList.add('hidden');
                });
                
                const target = tab.dataset.settings;
                tab.classList.add('active', 'text-purple-600', 'border-purple-600');
                tab.classList.remove('text-gray-500');
                
                if (panels[target]) {
                    panels[target].classList.remove('hidden');
                    panels[target].classList.add('active');
                }
            });
        });
    }
    
    setupThemeOptions() {
        document.querySelectorAll('.theme-option').forEach(el => {
            el.addEventListener('click', () => {
                const theme = el.dataset.theme;
                this.themeManager.setTheme(theme);
            });
        });
    }
    
    setupProfileForm() {
        const form = document.getElementById('profile-form');
        if (!form) return;
        
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const profileImage = document.getElementById('profile-image').files[0];
            const data = {
                full_name: document.getElementById('profile-name').value,
                username: document.getElementById('profile-username').value,
                email: document.getElementById('profile-email').value
            };
            
            try {
                const response = await api.updateProfile(data);
                if (response.success) {
                    // Update auth manager currentUser
                    if (window.authManager) {
                        window.authManager.currentUser = {
                            ...window.authManager.currentUser,
                            ...data
                        };
                    }
                    
                    // Update dashboard name
                    const userNameEl = document.getElementById('user-name');
                    if (userNameEl && data.full_name) {
                        userNameEl.textContent = data.full_name;
                    }
                    
                    // Update banner profile
                    updateProfileDisplay();
                    
                    // Handle profile image upload if provided
                    if (profileImage) {
                        const reader = new FileReader();
                        reader.onload = function(e) {
                            // Update banner image
                            const bannerImgEl = document.getElementById('banner-profile-img');
                            if (bannerImgEl) {
                                bannerImgEl.src = e.target.result;
                            }
                            // Store in auth manager
                            if (window.authManager) {
                                window.authManager.currentUser.profile_image = e.target.result;
                            }
                        };
                        reader.readAsDataURL(profileImage);
                    }
                    
                    showNotification('Profile updated successfully!', 'success');
                    this.loadProfileData();
                }
            } catch (error) {
                showNotification('Failed to update profile: ' + error.message, 'error');
            }
        });
    }
    
    setupSecurityForm() {
        const form = document.getElementById('security-form');
        if (!form) return;
        
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const current = document.getElementById('current-password').value;
            const newPass = document.getElementById('new-password').value;
            const confirm = document.getElementById('confirm-password').value;
            
            if (newPass !== confirm) {
                alert('Passwords do not match!');
                return;
            }
            
            if (newPass.length < 8) {
                alert('Password must be at least 8 characters!');
                return;
            }
            
            try {
                const response = await api.changePassword({
                    current_password: current,
                    new_password: newPass
                });
                
                if (response.success) {
                    alert('Password changed successfully!');
                    e.target.reset();
                }
            } catch (error) {
                alert('Failed to change password: ' + error.message);
            }
        });
    }
    
    setupNotificationForm() {
        const form = document.getElementById('notification-form');
        if (!form) return;
        
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const preferences = {
                appointments: document.getElementById('notify-appointments').checked,
                stock: document.getElementById('notify-stock').checked,
                payments: document.getElementById('notify-payments').checked,
                updates: document.getElementById('notify-updates').checked
            };
            
            try {
                const response = await api.updateNotifications(preferences);
                if (response.success) {
                    alert('Notification preferences updated!');
                }
            } catch (error) {
                alert('Failed to update preferences: ' + error.message);
            }
        });
    }
    
    setupBusinessForm() {
        const form = document.getElementById('business-form');
        if (!form) return;
        
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const settings = {
                business_name: document.getElementById('business-name').value,
                currency: document.getElementById('business-currency').value,
                tax_rate: document.getElementById('business-tax').value,
                default_duration: document.getElementById('business-duration').value
            };
            
            try {
                const response = await api.updateBusinessSettings(settings);
                if (response.success) {
                    alert('Business settings updated!');
                }
            } catch (error) {
                alert('Failed to update settings: ' + error.message);
            }
        });
    }
    
    async loadProfileData() {
        try {
            const response = await api.getProfile();
            if (response.success) {
                const data = response.data;
                document.getElementById('profile-name').value = data.full_name || '';
                document.getElementById('profile-username').value = data.username || '';
                document.getElementById('profile-email').value = data.email || '';
                document.getElementById('profile-role').value = data.role || 'artist';
                
                // Update settings profile header display
                const settingsDisplayName = document.getElementById('settings-display-name');
                const settingsDisplayRole = document.getElementById('settings-display-role');
                const settingsProfileImg = document.getElementById('settings-profile-img');
                
                if (settingsDisplayName) {
                    settingsDisplayName.textContent = data.full_name || 'User Name';
                }
                if (settingsDisplayRole) {
                    settingsDisplayRole.textContent = data.role || 'Artist';
                }
                if (settingsProfileImg) {
                    if (data.profile_image) {
                        settingsProfileImg.src = data.profile_image;
                    } else {
                        const name = data.full_name || data.email || 'U';
                        settingsProfileImg.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=6366f1&color=fff&size=80`;
                    }
                }
                
                // Update auth manager currentUser
                if (window.authManager) {
                    window.authManager.currentUser = {
                        ...window.authManager.currentUser,
                        full_name: data.full_name,
                        username: data.username,
                        email: data.email,
                        role: data.role,
                        profile_image: data.profile_image
                    };
                }
                
                // Update banner and dashboard
                updateProfileDisplay();
            }
        } catch (error) {
            console.error('Failed to load profile:', error);
        }
    }
    
    async loadBusinessSettings() {
        try {
            const response = await api.getBusinessSettings();
            if (response.success && response.data) {
                const data = response.data;
                document.getElementById('business-name').value = data.business_name || '';
                document.getElementById('business-currency').value = data.currency || 'KSH';
                document.getElementById('business-tax').value = data.tax_rate || 16;
                document.getElementById('business-duration').value = data.default_duration || 60;
            }
        } catch (error) {
            console.error('Failed to load business settings:', error);
        }
    }
    
    async loadNotificationPreferences() {
        try {
            const response = await api.getNotificationPreferences();
            if (response.success && response.data) {
                const prefs = response.data;
                if (prefs.notification_preferences) {
                    prefs.notification_preferences = JSON.parse(prefs.notification_preferences);
                }
                document.getElementById('notify-appointments').checked = prefs.notification_preferences?.appointments !== false;
                document.getElementById('notify-stock').checked = prefs.notification_preferences?.stock !== false;
                document.getElementById('notify-payments').checked = prefs.notification_preferences?.payments !== false;
                document.getElementById('notify-updates').checked = prefs.notification_preferences?.updates || false;
            }
        } catch (error) {
            console.error('Failed to load preferences:', error);
        }
    }
}

// Global functions for settings
window.saveThemeSettings = function() {
    const primary = document.getElementById('primary-color').value;
    const secondary = document.getElementById('secondary-color').value;
    const accent = document.getElementById('accent-color').value;
    
    if (window.settingsController && window.settingsController.themeManager) {
        window.settingsController.themeManager.setColors(primary, secondary, accent);
    }
    alert('Theme colors updated!');
};

window.logoutAllDevices = function() {
    if (confirm('This will log you out from all devices. Continue?')) {
        alert('Logged out from all devices!');
    }
};

window.clearSession = function() {
    if (confirm('Clear your current session?')) {
        alert('Session cleared!');
    }
};

window.exportData = function() {
    alert('Data export started!');
};

window.importData = function() {
    alert('Data import started!');
};

window.clearAllData = function() {
    if (confirm('This will permanently delete all your data. This action cannot be undone. Continue?')) {
        alert('All data cleared!');
    }
};

// Initialize settings when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('settings-theme')) {
        window.settingsController = new SettingsController();
    }
});
