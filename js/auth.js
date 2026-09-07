// Authentication module
class AuthManager {
    constructor() {
        this.api = api;
        this.isAuthenticated = false;
        this.currentUser = null;
    }
    
    async checkAuth() {
        try {
            const response = await this.api.checkSession();
            this.isAuthenticated = response.success && response.data && response.data.authenticated;
            
            if (this.isAuthenticated) {
                this.currentUser = response.data.user;
                // Fetch full profile data to ensure we have latest info
                await this.fetchProfileData();
                return true;
            }
            return false;
        } catch (error) {
            this.isAuthenticated = false;
            this.currentUser = null;
            return false;
        }
    }
    
    async fetchProfileData() {
        try {
            const response = await this.api.getProfile();
            if (response.success && response.data) {
                this.currentUser = {
                    ...this.currentUser,
                    full_name: response.data.full_name,
                    email: response.data.email,
                    username: response.data.username,
                    role: response.data.role,
                    profile_image: response.data.profile_image
                };
                // Update UI with profile data
                updateProfileDisplay();
            }
        } catch (error) {
            console.error('Failed to fetch profile:', error);
        }
    }
    
    async login(email, password) {
        try {
            const response = await this.api.login(email, password);
            
            if (response.success) {
                this.isAuthenticated = true;
                this.currentUser = response.data;
                this.onLoginSuccess(response.data);
                return { success: true, data: response.data };
            }
            
            return { success: false, message: response.message };
        } catch (error) {
            return { success: false, message: error.message };
        }
    }
    
    async signup(data) {
        try {
            const response = await this.api.signup(data);
            
            if (response.success) {
                this.onSignupSuccess(response.data);
                return { success: true, data: response.data, message: response.message };
            }
            
            return { success: false, message: response.message, errors: response.errors };
        } catch (error) {
            return { success: false, message: error.message };
        }
    }
    
    async logout() {
        try {
            await this.api.logout();
        } catch (error) {
            console.error('Logout error:', error);
        }
        
        this.isAuthenticated = false;
        this.currentUser = null;
        this.onLogout();
    }
    
    onLoginSuccess(user) {
        const authContainer = document.getElementById('auth-container');
        const dashboardContainer = document.getElementById('dashboard-container');
        
        if (authContainer) authContainer.classList.add('hidden');
        if (dashboardContainer) dashboardContainer.classList.remove('hidden');
        
        const userNameEl = document.getElementById('user-name');
        if (userNameEl) {
            userNameEl.textContent = user.full_name || user.email || 'Artist';
        }
        
        // Update navbar profile
        updateNavbarProfile();
    }
    
    onSignupSuccess(data) {
        // Switch to login tab after successful signup
        this.switchToLoginTab();
        this.showSignupSuccess(data);
    }
    
    onLogout() {
        window.location.reload();
    }
    
    switchToLoginTab() {
        const tabs = document.querySelectorAll('.auth-tab');
        const forms = document.querySelectorAll('.auth-form');
        
        tabs.forEach(t => t.classList.remove('active', 'text-purple-600', 'border-purple-600'));
        tabs.forEach(t => t.classList.add('text-gray-500'));
        
        forms.forEach(f => f.classList.remove('active'));
        
        const loginTab = document.querySelector('.auth-tab[data-tab="login"]');
        const loginForm = document.getElementById('login-form');
        
        if (loginTab) {
            loginTab.classList.add('active', 'text-purple-600', 'border-purple-600');
            loginTab.classList.remove('text-gray-500');
        }
        if (loginForm) {
            loginForm.classList.add('active');
        }
    }
    
    showSignupSuccess(data) {
        const signupForm = document.getElementById('signup-form');
        if (!signupForm) return;
        
        // Show success message
        const successHtml = `
            <div class="text-center py-8">
                <div class="inline-block p-4 bg-green-100 rounded-full mb-4">
                    <i class="fas fa-check-circle text-4xl text-green-600"></i>
                </div>
                <h3 class="text-xl font-bold mb-2">Account Created!</h3>
                <p class="text-gray-500 mb-4">Your account has been created successfully.</p>
                <p class="text-sm text-gray-500">Please sign in to continue.</p>
            </div>
        `;
        
        signupForm.innerHTML = successHtml;
        
        // Reset form after delay and switch to login tab
        setTimeout(() => {
            signupForm.innerHTML = this.getSignupFormHtml();
            this.switchToLoginTab();
        }, 3000);
    }
    
    getSignupFormHtml() {
        return `
            <div class="form-group">
                <label class="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <div class="input-wrapper">
                    <i class="fas fa-user input-icon"></i>
                    <input type="text" id="signup-name" class="glass-input w-full" placeholder="John Doe" required />
                </div>
            </div>
            <div class="form-group">
                <label class="block text-sm font-medium text-gray-700 mb-1">Username</label>
                <div class="input-wrapper">
                    <i class="fas fa-at input-icon"></i>
                    <input type="text" id="signup-username" class="glass-input w-full" placeholder="johndoe" required />
                </div>
            </div>
            <div class="form-group">
                <label class="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <div class="input-wrapper">
                    <i class="fas fa-envelope input-icon"></i>
                    <input type="email" id="signup-email" class="glass-input w-full" placeholder="john@example.com" required />
                </div>
            </div>
            <div class="form-group">
                <label class="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <div class="input-wrapper">
                    <i class="fas fa-lock input-icon"></i>
                    <input type="password" id="signup-password" class="glass-input w-full" placeholder="Min 8 characters" required minlength="8" />
                </div>
                <div class="text-xs text-gray-500 mt-1">
                    <i class="fas fa-info-circle"></i> Must be at least 8 characters with uppercase, lowercase, and numbers
                </div>
            </div>
            <div class="form-group">
                <label class="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
                <div class="input-wrapper">
                    <i class="fas fa-check-circle input-icon"></i>
                    <input type="password" id="signup-confirm" class="glass-input w-full" placeholder="Confirm password" required />
                </div>
            </div>
            <div class="form-group">
                <label class="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <select id="signup-role" class="glass-select w-full">
                    <option value="artist">Tattoo Artist</option>
                    <option value="staff">Studio Staff</option>
                </select>
            </div>
            <button type="submit" class="btn-primary w-full">
                <i class="fas fa-user-plus mr-2"></i> Create Account
            </button>
            <div class="text-center text-sm text-gray-500">
                By signing up, you agree to our Terms of Service and Privacy Policy
            </div>
        `;
    }
    
    setupAuthTabs() {
        const tabs = document.querySelectorAll('.auth-tab');
        const forms = document.querySelectorAll('.auth-form');
        
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const target = tab.dataset.tab;
                
                tabs.forEach(t => {
                    t.classList.remove('active', 'text-purple-600', 'border-purple-600');
                    t.classList.add('text-gray-500');
                });
                forms.forEach(f => f.classList.remove('active'));
                
                tab.classList.add('active', 'text-purple-600', 'border-purple-600');
                tab.classList.remove('text-gray-500');
                
                const targetForm = document.getElementById(`${target}-form`);
                if (targetForm) {
                    targetForm.classList.add('active');
                }
            });
        });
    }
}

// Update profile display in UI
function updateProfileDisplay() {
    const currentUser = authManager.currentUser;
    if (!currentUser) return;
    
    // Update banner name
    const bannerNameEl = document.getElementById('banner-profile-name');
    if (bannerNameEl) {
        bannerNameEl.textContent = `Welcome back, ${currentUser.full_name || 'Artist'}`;
    }
    
    // Update banner email
    const bannerEmailEl = document.getElementById('banner-profile-email');
    if (bannerEmailEl) {
        bannerEmailEl.textContent = currentUser.email || 'artist@inkmaster.com';
    }
    
    // Update dashboard name
    const userNameEl = document.getElementById('user-name');
    if (userNameEl) {
        userNameEl.textContent = currentUser.full_name || 'Artist';
    }
    
    // Update banner profile image
    const bannerImgEl = document.getElementById('banner-profile-img');
    if (bannerImgEl) {
        if (currentUser.profile_image) {
            bannerImgEl.src = currentUser.profile_image;
        } else {
            const name = currentUser.full_name || currentUser.email || 'U';
            bannerImgEl.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=6366f1&color=fff&size=64`;
        }
    }
}

// Initialize auth manager
const authManager = new AuthManager();
