// Main Application Controller
class App {
    constructor() {
        this.api = api;
        this.auth = authManager;
        this.currentPage = 'dashboard';
        this.init();
    }
    
    async init() {
        // Setup all event handlers first (before any async operations)
        this.setupTimeDisplay();
        this.setupNavigation();
        this.setupLoginForm();
        this.setupSignupForm();
        this.setupLogout();
        this.setupAuthTabs();
        this.setupRefreshDashboard();
        
        // Show loader while checking auth (don't hide it yet)
        const loader = document.getElementById('loader');
        if (loader) {
            loader.style.opacity = '1';
            loader.classList.remove('hidden');
        }
        
        // Check authentication
        try {
            await this.checkAuth();
        } catch (error) {
            console.error('Auth check failed:', error);
            this.auth.isAuthenticated = false;
            this.auth.currentUser = null;
        }
        
        // Show appropriate page based on auth state
        if (this.auth.isAuthenticated) {
            this.showDashboard();
            this.loadPage('dashboard');
            updateProfileDisplay();
        } else {
            const dashboardContainer = document.getElementById('dashboard-container');
            const authContainer = document.getElementById('auth-container');
            if (dashboardContainer) dashboardContainer.classList.add('hidden');
            if (authContainer) authContainer.classList.remove('hidden');
        }
        
        // Hide loader AFTER auth check and page setup
        this.hideLoader();
        
        this.setupSearchListeners();
    }
    
    hideLoader() {
        const loader = document.getElementById('loader');
        const app = document.getElementById('app');
        if (loader) {
            loader.style.opacity = '0';
            setTimeout(() => {
                loader.classList.add('hidden');
            }, 8000);
        }
        if (app) app.classList.remove('hidden');
    }
    
    setupTimeDisplay() {
        const updateTime = () => {
            const now = new Date();
            const timeEl = document.getElementById('current-time');
            if (timeEl) {
                timeEl.textContent = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            }
        };
        updateTime();
        setInterval(updateTime, 60000);
    }
    
    async checkAuth() {
        await this.auth.checkAuth();
    }
    
    showDashboard() {
        const authContainer = document.getElementById('auth-container');
        const dashboardContainer = document.getElementById('dashboard-container');
        if (authContainer) authContainer.classList.add('hidden');
        if (dashboardContainer) dashboardContainer.classList.remove('hidden');
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
    
    setupNavigation() {
        const navTrigger = document.querySelector('.nav-trigger');
        const navMenu = document.querySelector('.nav-menu');
        
        if (navTrigger && navMenu) {
            navTrigger.addEventListener('click', () => {
                navMenu.classList.toggle('visible');
            });
        }
        
        document.querySelectorAll('.nav-menu li[data-page]').forEach(item => {
            item.addEventListener('click', () => {
                const page = item.dataset.page;
                this.loadPage(page);
                navMenu.classList.remove('visible');
            });
        });
    }
    
    loadPage(page) {
        this.currentPage = page;
        
        document.querySelectorAll('.nav-menu li').forEach(el => {
            el.classList.remove('active');
        });
        const activeItem = document.querySelector(`.nav-menu li[data-page="${page}"]`);
        if (activeItem) activeItem.classList.add('active');
        
        document.querySelectorAll('.page-content').forEach(el => {
            el.classList.add('hidden');
        });
        
        const pageEl = document.getElementById(`page-${page}`);
        if (pageEl) pageEl.classList.remove('hidden');
        
        this.loadPageData(page);
    }
    
    loadPageData(page) {
        switch(page) {
            case 'dashboard':
                this.loadDashboard();
                break;
            case 'clients':
                this.loadClients();
                break;
            case 'appointments':
                this.loadAppointments();
                break;
            case 'financials':
                this.loadFinancials();
                break;
            case 'inventory':
                this.loadInventory();
                break;
            case 'settings':
                this.loadSettings();
                break;
        }
    }
    
    setupLoginForm() {
        const form = document.getElementById('login-form');
        if (form) {
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                
                const email = document.getElementById('login-email').value;
                const password = document.getElementById('login-password').value;
                
                try {
                    const response = await this.api.login(email, password);
                    
                    if (response.success) {
                        if (window.settingsController && window.settingsController.themeManager) {
                            window.settingsController.themeManager.loadTheme();
                        }
                        this.showDashboard();
                        this.loadPage('dashboard');
                    } else {
                        this.showError(form, response.message);
                    }
                } catch (error) {
                    this.showError(form, error.message);
                }
            });
        }
    }
    
    setupSignupForm() {
        const form = document.getElementById('signup-form');
        if (form) {
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                
                const password = document.getElementById('signup-password').value;
                const confirm = document.getElementById('signup-confirm').value;
                
                if (password !== confirm) {
                    this.showError(form, 'Passwords do not match!');
                    return;
                }
                
                if (password.length < 8) {
                    this.showError(form, 'Password must be at least 8 characters!');
                    return;
                }
                
                const data = {
                    full_name: document.getElementById('signup-name').value,
                    username: document.getElementById('signup-username').value,
                    email: document.getElementById('signup-email').value,
                    password: password,
                    role: document.getElementById('signup-role').value
                };
                
                console.log('Signup data:', { ...data, password: '***' });
                
                try {
                    const response = await this.api.signup(data);
                    console.log('Signup response:', response);
                    
                    if (response.success) {
                        this.showSignupSuccess(form, response);
                    } else {
                        this.showError(form, response.message, response.errors);
                    }
                } catch (error) {
                    console.error('Signup error:', error);
                    this.showError(form, error.message);
                }
            });
        }
    }
    
    showSignupSuccess(form, response) {
        form.innerHTML = `
            <div class="text-center py-8">
                <div class="inline-block p-4 bg-green-100 rounded-full mb-4">
                    <i class="fas fa-check-circle text-4xl text-green-600"></i>
                </div>
                <h3 class="text-xl font-bold mb-2">Account Created!</h3>
                <p class="text-gray-500 mb-4">${response.message || 'Your account has been created successfully.'}</p>
                <p class="text-sm text-gray-500">Please sign in to continue.</p>
            </div>
        `;
        
        setTimeout(() => {
            this.switchToLogin();
        }, 3000);
    }
    
    switchToLogin() {
        const tabs = document.querySelectorAll('.auth-tab');
        const forms = document.querySelectorAll('.auth-form');
        
        tabs.forEach(t => {
            t.classList.remove('active', 'text-purple-600', 'border-purple-600');
            t.classList.add('text-gray-500');
        });
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
        
        // Reset signup form
        const signupForm = document.getElementById('signup-form');
        if (signupForm) {
            signupForm.innerHTML = this.getSignupFormHtml();
            this.setupSignupForm();
        }
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
    
    showError(form, message, errors = null) {
        // Remove previous errors
        const prevError = form.querySelector('.form-error');
        if (prevError) prevError.remove();
        
        const errorHtml = `
            <div class="form-error bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mt-4">
                <i class="fas fa-exclamation-circle mr-2"></i> ${message}
                ${errors ? Object.values(errors).map(e => `<div class="mt-1">• ${e}</div>`).join('') : ''}
            </div>
        `;
        form.insertAdjacentHTML('beforeend', errorHtml);
    }
    
    setupLogout() {
        const logoutBtn = document.getElementById('logout-btn');
        const logoutBtnHeader = document.getElementById('logout-btn-header');
        
        const handleLogout = async () => {
            try {
                await this.auth.logout();
            } catch (error) {
                console.error('Logout error:', error);
                window.location.reload();
            }
        };
        
        if (logoutBtn) {
            logoutBtn.addEventListener('click', handleLogout);
        }
        
        if (logoutBtnHeader) {
            logoutBtnHeader.addEventListener('click', handleLogout);
        }
    }
    
    setupRefreshDashboard() {
        const refreshBtn = document.getElementById('refresh-dashboard');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => {
                this.loadDashboard();
            });
        }
    }
    
    setupSearchListeners() {
        const clientSearch = document.getElementById('client-search');
        const clientFilter = document.getElementById('client-filter');
        const inventorySearch = document.getElementById('inventory-search');
        const inventoryCategory = document.getElementById('inventory-category');
        
        if (clientSearch) {
            clientSearch.addEventListener('input', debounce(() => {
                this.loadClients();
            }, 300));
        }
        
        if (clientFilter) {
            clientFilter.addEventListener('change', () => {
                this.loadClients();
            });
        }
        
        if (inventorySearch) {
            inventorySearch.addEventListener('input', debounce(() => {
                this.loadInventory();
            }, 300));
        }
        
        if (inventoryCategory) {
            inventoryCategory.addEventListener('change', () => {
                this.loadInventory();
            });
        }
    }
    
    async loadDashboard() {
        try {
            const stats = await this.api.getDashboardStats();
            if (stats.success && stats.data) {
                document.getElementById('total-clients').textContent = stats.data.total_clients || 0;
                document.getElementById('today-appointments').textContent = stats.data.today_appointments || 0;
                document.getElementById('monthly-revenue').textContent = `${stats.data.monthly_revenue || 0} KSH`;
                document.getElementById('low-stock-items').textContent = stats.data.low_stock_items || 0;
                
                // Update total transactions if the element exists
                const totalTxEl = document.getElementById('total-transactions-count');
                if (totalTxEl) {
                    totalTxEl.textContent = stats.data.total_transactions || 0;
                }
            }
            
            // Update banner stats
            updateBannerStats();
            
            await this.loadRecentTransactions();
            await this.loadUpcomingAppointments();
        } catch (error) {
            console.error('Failed to load dashboard:', error);
        }
    }
    
    async loadRecentTransactions() {
        try {
            const transactions = await this.api.getTransactions({ limit: 5 });
            const container = document.getElementById('recent-transactions');
            
            if (!container) return;
            
            if (transactions.success && transactions.data && transactions.data.length > 0) {
                container.innerHTML = transactions.data.map(t => `
                    <div class="flex justify-between items-center py-2 border-b border-white/10">
                        <div>
                            <span class="font-medium">${t.description || 'Transaction'}</span>
                            <span class="text-sm text-gray-500 ml-2">${t.transaction_date}</span>
                        </div>
                        <span class="font-semibold ${t.transaction_type === 'income' ? 'text-green-600' : 'text-red-600'}">
                            ${t.transaction_type === 'income' ? '+' : '-'} ${t.amount} KSH
                        </span>
                    </div>
                `).join('');
            } else {
                container.innerHTML = '<p class="text-gray-500 text-center py-4">No recent transactions</p>';
            }
        } catch (error) {
            console.error('Failed to load transactions:', error);
        }
    }
    
    async loadUpcomingAppointments() {
        try {
            const appointments = await this.api.getAppointments({ status: 'scheduled', limit: 5 });
            const container = document.getElementById('upcoming-appointments');
            
            if (!container) return;
            
            if (appointments.success && appointments.data && appointments.data.length > 0) {
                container.innerHTML = appointments.data.map(a => `
                    <div class="flex justify-between items-center py-2 border-b border-white/10">
                        <div>
                            <span class="font-medium">${a.client_name}</span>
                            <span class="text-sm text-gray-500 ml-2">${a.service_type}</span>
                        </div>
                        <span class="text-sm">${a.appointment_date} at ${a.start_time}</span>
                    </div>
                `).join('');
            } else {
                container.innerHTML = '<p class="text-gray-500 text-center py-4">No upcoming appointments</p>';
            }
        } catch (error) {
            console.error('Failed to load appointments:', error);
        }
    }
    
    async loadClients() {
        try {
            const search = document.getElementById('client-search')?.value || '';
            const filter = document.getElementById('client-filter')?.value || 'all';
            
            const response = await this.api.getClients({ search, status: filter });
            const tableBody = document.getElementById('clients-table-body');
            
            if (!tableBody) return;
            
            // Generate floating bubbles based on data count
            generateFloatingBubbles('clients-bubbles', response.data ? Math.min(response.data.length, 10) : 5);
            
            if (response.success && response.data && response.data.length > 0) {
                tableBody.innerHTML = response.data.map(client => {
                    const balance = client.outstanding_balance || 0;
                    const balanceClass = balance > 0 ? 'text-rose-400' : 'text-emerald-400';
                    return `
                    <tr>
                        <td>
                            <div class="flex items-center gap-3">
                                ${client.avatar_url ? `<img src="${client.avatar_url}" class="w-10 h-10 rounded-full object-cover ring-2 ring-indigo-500/30" />` : 
                                    `<div class="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center font-bold text-white">
                                        ${client.full_name ? client.full_name.charAt(0) : '?'}
                                    </div>`}
                                <div>
                                    <div class="font-medium text-white">${client.full_name}</div>
                                    <div class="text-sm text-slate-400">${client.phone || 'No phone'}</div>
                                </div>
                            </div>
                        </td>
                        <td><span class="text-slate-300">${client.phone || '-'}</span></td>
                        <td><span class="text-slate-400">${client.email || '-'}</span></td>
                        <td>
                            <span class="${balanceClass} font-semibold">${balance > 0 ? '-' : ''}${Math.abs(balance).toLocaleString()} KSH</span>
                        </td>
                        <td>
                            <button onclick="window.viewClientBalance(${client.id})" class="text-amber-400 hover:text-amber-300 transition-colors" title="Balance & History">
                                <i class="fas fa-file-invoice-dollar"></i>
                            </button>
                            <button onclick="window.viewClientHistory(${client.id})" class="text-cyan-400 hover:text-cyan-300 transition-colors ml-2" title="View History">
                                <i class="fas fa-history"></i>
                            </button>
                            <button onclick="window.editClient(${client.id})" class="text-indigo-400 hover:text-indigo-300 transition-colors ml-2">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button onclick="window.deleteClient(${client.id})" class="text-rose-400 hover:text-rose-300 transition-colors ml-2">
                                <i class="fas fa-trash"></i>
                            </button>
                        </td>
                    </tr>
                `}).join('');
            } else {
                tableBody.innerHTML = `
                    <tr>
                        <td colspan="5" class="text-center py-8 text-gray-500">
                            No clients found. Add your first client to get started.
                        </td>
                    </tr>
                `;
            }
        } catch (error) {
            console.error('Failed to load clients:', error);
        }
    }
    
    async loadAppointments(statusFilter = null) {
        try {
            const params = { limit: 100 };
            if (statusFilter && statusFilter !== 'all') {
                params.status = statusFilter;
            }
            const response = await this.api.getAppointments(params);
            const tableBody = document.getElementById('appointments-table-body');
            
            if (!tableBody) return;
            
            // Generate floating bubbles based on data count
            generateFloatingBubbles('appointments-bubbles', response.data ? Math.min(response.data.length, 10) : 5);
            
            if (response.success && response.data && response.data.length > 0) {
                const statusClasses = {
                    'scheduled': 'scheduled',
                    'in_progress': 'in_progress',
                    'completed': 'completed',
                    'cancelled': 'cancelled',
                    'no_show': 'cancelled'
                };
                
                const statusIcons = {
                    'scheduled': 'fa-clock',
                    'in_progress': 'fa-spinner',
                    'completed': 'fa-check',
                    'cancelled': 'fa-times',
                    'no_show': 'fa-minus'
                };
                
                tableBody.innerHTML = response.data.map(a => `
                    <tr>
                        <td>
                            <div class="flex items-center gap-3">
                                <div class="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center">
                                    <i class="fas fa-user text-indigo-400 text-xs"></i>
                                </div>
                                <span class="font-medium">${a.client_name || 'Unknown'}</span>
                            </div>
                        </td>
                        <td>
                            <div class="text-sm">
                                <div class="text-white">${a.appointment_date}</div>
                                <div class="text-slate-400">${a.start_time}</div>
                            </div>
                        </td>
                        <td>${a.service_type?.replace(/_/g, ' ') || '-'}</td>
                        <td>
                            <span class="status-badge ${statusClasses[a.status] || 'scheduled'}">
                                <i class="fas ${statusIcons[a.status] || 'fa-circle'} text-xs"></i>
                                ${a.status?.replace(/_/g, ' ') || '-'}
                            </span>
                        </td>
                        <td>${a.total_amount || '0'} KSH</td>
                        <td>
                            <button onclick="window.editAppointment(${a.id})" class="text-indigo-400 hover:text-indigo-300 transition-colors" title="Edit">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button onclick="window.deleteAppointment(${a.id})" class="text-rose-400 hover:text-rose-300 transition-colors ml-2" title="Delete">
                                <i class="fas fa-trash"></i>
                            </button>
                        </td>
                    </tr>
                `).join('');
            } else {
                tableBody.innerHTML = `
                    <tr>
                        <td colspan="6" class="text-center py-8 text-gray-500">
                            No appointments found.
                        </td>
                    </tr>
                `;
            }
        } catch (error) {
            console.error('Failed to load appointments:', error);
        }
    }
    
    async loadFinancials(dateRange = null) {
        try {
            const params = { limit: 1000 };
            if (dateRange && dateRange.date_from && dateRange.date_to) {
                params.date_from = dateRange.date_from;
                params.date_to = dateRange.date_to;
            }
            
            const transactions = await this.api.getTransactions(params);
            const reportContainer = document.getElementById('financial-report');
            
            if (!reportContainer) return;
            
            let totalRevenue = 0;
            let totalExpenses = 0;
            let filteredTransactions = [];
            
            if (transactions.success && transactions.data) {
                filteredTransactions = transactions.data;
                filteredTransactions.forEach(t => {
                    if (t.transaction_type === 'income') {
                        totalRevenue += parseFloat(t.amount);
                    } else {
                        totalExpenses += parseFloat(t.amount);
                    }
                });
            }
            
            // Update main stat cards
            document.getElementById('total-revenue').textContent = `${totalRevenue.toLocaleString()} KSH`;
            document.getElementById('total-expenses').textContent = `${totalExpenses.toLocaleString()} KSH`;
            document.getElementById('net-profit').textContent = `${(totalRevenue - totalExpenses).toLocaleString()} KSH`;
            document.getElementById('total-transactions-count').textContent = filteredTransactions.length.toString();
            
            // Update banner stats
            updateBannerStats();
            
            if (filteredTransactions.length > 0) {
                reportContainer.innerHTML = filteredTransactions.map(t => {
                    const clientName = t.client_name || 'No client';
                    const appointmentRef = t.appointment_id ? ` (Appt: ${t.appointment_id})` : '';
                    return `
                        <div class="flex justify-between items-center py-3 border-b border-white/10">
                            <div>
                                <span class="font-medium text-white">${t.description || t.category || 'Transaction'}</span>
                                <div class="flex items-center gap-2 mt-1">
                                    <span class="text-sm text-slate-400">${new Date(t.transaction_date).toLocaleDateString()}</span>
                                    ${t.client_id ? `<span class="text-xs text-cyan-400">${clientName}</span>` : ''}
                                    ${t.appointment_id ? `<span class="text-xs text-indigo-400">Appt #${t.appointment_id}</span>` : ''}
                                    ${t.payment_method ? `<span class="text-xs text-slate-500">💳 ${t.payment_method.replace('_', ' ')}</span>` : ''}
                                </div>
                            </div>
                            <span class="font-semibold ${t.transaction_type === 'income' ? 'text-emerald-400' : 'text-rose-400'}">
                                ${t.transaction_type === 'income' ? '+' : '-'} ${parseFloat(t.amount).toLocaleString()} KSH
                            </span>
                        </div>
                    `;
                }).join('');
            } else {
                reportContainer.innerHTML = '<p class="text-slate-400 text-center py-8">No transactions found.</p>';
            }
        } catch (error) {
            console.error('Failed to load financials:', error);
        }
    }
    
    async loadInventory() {
        try {
            const search = document.getElementById('inventory-search')?.value || '';
            const category = document.getElementById('inventory-category')?.value || 'all';
            
            const response = await this.api.getInventory({ search, category });
            const tableBody = document.getElementById('inventory-table-body');
            
            if (!tableBody) return;
            
            // Generate floating bubbles based on data count
            generateFloatingBubbles('inventory-bubbles', response.data ? Math.min(response.data.length, 10) : 5);
            
            if (response.success && response.data && response.data.length > 0) {
                tableBody.innerHTML = response.data.map(item => `
                    <tr class="${item.is_low_stock ? 'bg-rose-500/10' : ''}">
                        <td>
                            <div class="flex items-center gap-3">
                                <div class="w-8 h-8 rounded-lg ${item.is_low_stock ? 'bg-rose-500/20' : 'bg-indigo-500/20'} flex items-center justify-center">
                                    <i class="fas fa-box ${item.is_low_stock ? 'text-rose-400' : 'text-indigo-400'} text-xs"></i>
                                </div>
                                <span class="font-medium text-white">${item.product_name}</span>
                            </div>
                        </td>
                        <td><code class="text-xs bg-slate-800 px-2 py-1 rounded text-slate-300">${item.sku}</code></td>
                        <td class="text-slate-400">${item.category?.replace(/_/g, ' ') || '-'}</td>
                        <td>
                            <span class="${item.is_low_stock ? 'text-rose-400 font-bold' : 'text-slate-300'}">
                                ${item.quantity_on_hand} ${item.is_low_stock ? '<i class="fas fa-exclamation-triangle text-rose-400 ml-1"></i>' : ''}
                            </span>
                        </td>
                        <td class="text-slate-400">${item.reorder_level}</td>
                        <td><span class="text-slate-300">${parseFloat(item.unit_cost).toLocaleString()} KSH</span></td>
                        <td>
                            <button onclick="window.editInventoryItem(${item.id})" class="text-indigo-400 hover:text-indigo-300 transition-colors">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button onclick="window.deleteInventoryItem(${item.id})" class="text-rose-400 hover:text-rose-300 transition-colors ml-2">
                                <i class="fas fa-trash"></i>
                            </button>
                        </td>
                    </tr>
                `).join('');
            } else {
                tableBody.innerHTML = `
                    <tr>
                        <td colspan="7" class="text-center py-8 text-gray-500">
                            No inventory items found.
                        </td>
                    </tr>
                `;
            }
        } catch (error) {
            console.error('Failed to load inventory:', error);
        }
    }
    
    loadSettings() {
        if (window.settingsController) {
            window.settingsController.loadAllSettings();
        }
    }
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Global modal functions
function openClientModal(client = null) {
    const modal = document.getElementById('modal-container');
    const content = modal.querySelector('.modal-content');
    const isEdit = client !== null;
    
    content.innerHTML = `
        <div class="flex justify-between items-center mb-6">
            <h2 class="text-2xl font-bold">${isEdit ? 'Edit Client' : 'Add New Client'}</h2>
            <button onclick="closeModal()" class="text-gray-500 hover:text-gray-700">
                <i class="fas fa-times text-xl"></i>
            </button>
        </div>
        <form id="client-form" class="space-y-4">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label class="block text-sm font-medium mb-1">Full Name *</label>
                    <input type="text" name="full_name" class="glass-input w-full" value="${client?.full_name || ''}" required />
                </div>
                <div>
                    <label class="block text-sm font-medium mb-1">Phone *</label>
                    <input type="tel" name="phone" class="glass-input w-full" value="${client?.phone || ''}" required />
                </div>
            </div>
            <div>
                <label class="block text-sm font-medium mb-1">Email</label>
                <input type="email" name="email" class="glass-input w-full" value="${client?.email || ''}" />
            </div>
            <div>
                <label class="block text-sm font-medium mb-1">Date of Birth</label>
                <input type="date" name="date_of_birth" class="glass-input w-full" value="${client?.date_of_birth || ''}" />
            </div>
            <div>
                <label class="block text-sm font-medium mb-1">Address</label>
                <textarea name="address" class="glass-input w-full" rows="2">${client?.address || ''}</textarea>
            </div>
            <div>
                <label class="block text-sm font-medium mb-1">Tattoo Preferences</label>
                <textarea name="tattoo_preferences" class="glass-input w-full" rows="2">${client?.tattoo_preferences || ''}</textarea>
            </div>
            <div>
                <label class="block text-sm font-medium mb-1">Allergies / Medical Notes</label>
                <textarea name="allergies_medical_notes" class="glass-input w-full" rows="2">${client?.allergies_medical_notes || ''}</textarea>
            </div>
            <div class="flex gap-3 pt-4">
                <button type="submit" class="btn-primary flex-1">
                    <i class="fas fa-save mr-2"></i>${isEdit ? 'Update Client' : 'Save Client'}
                </button>
                <button type="button" onclick="closeModal()" class="btn-secondary">Cancel</button>
            </div>
        </form>
    `;
    
    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
    
    const form = document.getElementById('client-form');
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(form);
            const data = Object.fromEntries(formData.entries());
            
            try {
                if (isEdit && client) {
                    await api.updateClient(client.id, data);
                } else {
                    await api.createClient(data);
                }
                closeModal();
                app.loadClients();
                showNotification(isEdit ? 'Client updated successfully!' : 'Client added successfully!', 'success');
            } catch (error) {
                showNotification('Failed to save client: ' + error.message, 'error');
            }
        });
    }
}

async function openAppointmentModal(appointment = null) {
    const modal = document.getElementById('modal-container');
    const content = modal.querySelector('.modal-content');
    
    let clients = [];
    try {
        const response = await api.getClients({ status: 'active', limit: 100 });
        if (response.success && response.data) {
            clients = response.data;
        }
    } catch (error) {
        console.error('Failed to load clients:', error);
    }
    
    const isEdit = appointment !== null;
    
    content.innerHTML = `
        <div class="flex justify-between items-center mb-6">
            <h2 class="text-2xl font-bold">${isEdit ? 'Edit Appointment' : 'New Appointment'}</h2>
            <button onclick="closeModal()" class="text-gray-500 hover:text-gray-700">
                <i class="fas fa-times text-xl"></i>
            </button>
        </div>
        <form id="appointment-form" class="space-y-4">
            <div>
                <label class="block text-sm font-medium mb-1">Client *</label>
                <select name="client_id" class="glass-select w-full" required>
                    <option value="">Select a client</option>
                    ${clients.map(c => `
                        <option value="${c.id}" ${appointment?.client_id == c.id ? 'selected' : ''}>
                            ${c.full_name} ${c.phone ? `(${c.phone})` : ''}
                        </option>
                    `).join('')}
                </select>
                ${clients.length === 0 ? '<p class="text-xs text-gray-500 mt-1"><i class="fas fa-info-circle"></i> No clients found. Add a client first.</p>' : ''}
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label class="block text-sm font-medium mb-1">Date *</label>
                    <input type="date" name="appointment_date" class="glass-input w-full" value="${appointment?.appointment_date || ''}" required />
                </div>
                <div>
                    <label class="block text-sm font-medium mb-1">Time *</label>
                    <input type="time" name="start_time" class="glass-input w-full" value="${appointment?.start_time || ''}" required />
                </div>
            </div>
            <div>
                <label class="block text-sm font-medium mb-1">Service Type</label>
                <select name="service_type" class="glass-select w-full">
                    <option value="new_tattoo" ${appointment?.service_type === 'new_tattoo' ? 'selected' : ''}>New Tattoo</option>
                    <option value="touch_up" ${appointment?.service_type === 'touch_up' ? 'selected' : ''}>Touch Up</option>
                    <option value="consultation" ${appointment?.service_type === 'consultation' ? 'selected' : ''}>Consultation</option>
                    <option value="cover_up" ${appointment?.service_type === 'cover_up' ? 'selected' : ''}>Cover Up</option>
                    <option value="custom_design" ${appointment?.service_type === 'custom_design' ? 'selected' : ''}>Custom Design</option>
                </select>
            </div>
            <div>
                <label class="block text-sm font-medium mb-1">Duration (minutes)</label>
                <input type="number" name="duration" class="glass-input w-full" value="${appointment?.duration || 60}" />
            </div>
            <div>
                <label class="block text-sm font-medium mb-1">Total Amount (KSH)</label>
                <input type="number" name="total_amount" class="glass-input w-full" step="0.01" value="${appointment?.total_amount || ''}" />
            </div>
            <div>
                <label class="block text-sm font-medium mb-1">Deposit (KSH)</label>
                <input type="number" name="deposit_amount" class="glass-input w-full" step="0.01" value="${appointment?.deposit_amount || ''}" />
            </div>
            <div>
                <label class="block text-sm font-medium mb-1">Payment Method</label>
                <select name="payment_method" class="glass-select w-full">
                    <option value="cash" ${appointment?.payment_method === 'cash' || !appointment ? 'selected' : ''}>Cash</option>
                    <option value="mpesa" ${appointment?.payment_method === 'mpesa' ? 'selected' : ''}>M-Pesa</option>
                    <option value="bank_transfer" ${appointment?.payment_method === 'bank_transfer' ? 'selected' : ''}>Bank Transfer</option>
                    <option value="credit_card" ${appointment?.payment_method === 'credit_card' ? 'selected' : ''}>Credit Card</option>
                </select>
            </div>
            <div>
                <label class="block text-sm font-medium mb-1">Status</label>
                <select name="status" class="glass-select w-full">
                    <option value="scheduled" ${appointment?.status === 'scheduled' || !appointment ? 'selected' : ''}>Scheduled</option>
                    <option value="in_progress" ${appointment?.status === 'in_progress' ? 'selected' : ''}>In Progress</option>
                    <option value="completed" ${appointment?.status === 'completed' ? 'selected' : ''}>Completed</option>
                    <option value="cancelled" ${appointment?.status === 'cancelled' ? 'selected' : ''}>Cancelled</option>
                </select>
            </div>
            <div>
                <label class="block text-sm font-medium mb-1">Design Notes</label>
                <textarea name="design_notes" class="glass-input w-full" rows="3">${appointment?.design_notes || ''}</textarea>
            </div>
            <div class="flex gap-3 pt-4">
                <button type="submit" class="btn-primary flex-1">
                    <i class="fas fa-save mr-2"></i>${isEdit ? 'Update Appointment' : 'Save Appointment'}
                </button>
                <button type="button" onclick="closeModal()" class="btn-secondary">Cancel</button>
            </div>
        </form>
    `;
    
    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
    
    const form = document.getElementById('appointment-form');
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(form);
            const data = Object.fromEntries(formData.entries());
            
            try {
                if (isEdit && appointment) {
                    await api.updateAppointment(appointment.id, data);
                } else {
                    await api.createAppointment(data);
                }
                closeModal();
                app.loadAppointments();
                app.loadDashboard();
                showNotification(isEdit ? 'Appointment updated!' : 'Appointment created!', 'success');
            } catch (error) {
                showNotification('Failed to save appointment: ' + error.message, 'error');
            }
        });
    }
}

async function openTransactionModal() {
    const modal = document.getElementById('modal-container');
    const content = modal.querySelector('.modal-content');
    
    // Fetch existing clients for linking
    let clients = [];
    try {
        const response = await api.getClients({ status: 'active', limit: 100 });
        if (response.success && response.data) {
            clients = response.data;
        }
    } catch (error) {
        console.error('Failed to load clients for transaction modal:', error);
    }
    
    content.innerHTML = `
        <div class="flex justify-between items-center mb-6">
            <h2 class="text-2xl font-bold">Add Transaction</h2>
            <button onclick="closeModal()" class="text-gray-500 hover:text-gray-700">
                <i class="fas fa-times text-xl"></i>
            </button>
        </div>
        <form id="transaction-form" class="space-y-4">
            <div>
                <label class="block text-sm font-medium mb-1">Type *</label>
                <select name="transaction_type" class="glass-select w-full" required>
                    <option value="income">Income</option>
                    <option value="expense">Expense</option>
                </select>
            </div>
            <div>
                <label class="block text-sm font-medium mb-1">Category *</label>
                <input type="text" name="category" class="glass-input w-full" placeholder="e.g., Tattoo Session, Supplies" required />
            </div>
            <div>
                <label class="block text-sm font-medium mb-1">Amount *</label>
                <input type="number" name="amount" class="glass-input w-full" step="0.01" placeholder="0.00" required />
            </div>
            <div>
                <label class="block text-sm font-medium mb-1">Date *</label>
                <input type="date" name="transaction_date" class="glass-input w-full" value="${new Date().toISOString().split('T')[0]}" required />
            </div>
            <div>
                <label class="block text-sm font-medium mb-1">Client (Optional)</label>
                <select name="client_id" class="glass-select w-full">
                    <option value="">None</option>
                    ${clients.map(c => `
                        <option value="${c.id}">${c.full_name} ${c.phone ? '(' + c.phone + ')' : ''}</option>
                    `).join('')}
                </select>
            </div>
            <div>
                <label class="block text-sm font-medium mb-1">Payment Method</label>
                <select name="payment_method" class="glass-select w-full">
                    <option value="cash">Cash</option>
                    <option value="mpesa">M-Pesa</option>
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="credit_card">Credit Card</option>
                </select>
            </div>
            <div>
                <label class="block text-sm font-medium mb-1">Description</label>
                <textarea name="description" class="glass-input w-full" rows="2"></textarea>
            </div>
            <div class="flex gap-3 pt-4">
                <button type="submit" class="btn-primary flex-1">
                    <i class="fas fa-save mr-2"></i>Save Transaction
                </button>
                <button type="button" onclick="closeModal()" class="btn-secondary">Cancel</button>
            </div>
        </form>
    `;
    
    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
    
    const form = document.getElementById('transaction-form');
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(form);
            const data = Object.fromEntries(formData.entries());
            
            // Convert empty string to null for optional fields
            if (!data.client_id) data.client_id = null;
            
            // Validate before sending
            if (!data.category || !data.amount || !data.transaction_date) {
                showNotification('Please fill in all required fields', 'error');
                return;
            }
            
            try {
                const response = await api.createTransaction(data);
                closeModal();
                app.loadFinancials();
                app.loadDashboard();
                showNotification('Transaction saved successfully!', 'success');
            } catch (error) {
                console.error('Transaction save error:', error);
                showNotification('Failed to save: ' + error.message, 'error');
            }
        });
    }
}

function openInventoryModal() {
    const modal = document.getElementById('modal-container');
    const content = modal.querySelector('.modal-content');
    
    content.innerHTML = `
        <h2 class="text-2xl font-bold mb-6">Add Inventory Item</h2>
        <form id="inventory-form" class="space-y-4">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label class="block text-sm font-medium mb-1">Product Name *</label>
                    <input type="text" name="product_name" class="glass-input w-full" required />
                </div>
                <div>
                    <label class="block text-sm font-medium mb-1">SKU *</label>
                    <input type="text" name="sku" class="glass-input w-full" required />
                </div>
            </div>
            <div>
                <label class="block text-sm font-medium mb-1">Category *</label>
                <select name="category" class="glass-select w-full" required>
                    <option value="ink_pigments">Ink & Pigments</option>
                    <option value="needles_tubes">Needles & Tubes</option>
                    <option value="sanitation_safety">Sanitation & Safety</option>
                    <option value="office_supplies">Office Supplies</option>
                    <option value="merchandise">Merchandise</option>
                </select>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                    <label class="block text-sm font-medium mb-1">Quantity</label>
                    <input type="number" name="quantity_on_hand" class="glass-input w-full" value="0" />
                </div>
                <div>
                    <label class="block text-sm font-medium mb-1">Reorder Level</label>
                    <input type="number" name="reorder_level" class="glass-input w-full" value="5" />
                </div>
                <div>
                    <label class="block text-sm font-medium mb-1">Unit Cost</label>
                    <input type="number" name="unit_cost" class="glass-input w-full" step="0.01" />
                </div>
            </div>
            <div>
                <label class="block text-sm font-medium mb-1">Supplier</label>
                <input type="text" name="supplier" class="glass-input w-full" />
            </div>
            <div>
                <label class="block text-sm font-medium mb-1">Location</label>
                <input type="text" name="location" class="glass-input w-full" placeholder="e.g., Shelf A, Storage Room" />
            </div>
            <div class="flex gap-3 pt-4">
                <button type="submit" class="btn-primary flex-1">Save Item</button>
                <button type="button" onclick="closeModal()" class="btn-secondary">Cancel</button>
            </div>
        </form>
    `;
    
    modal.classList.remove('hidden');
    
    const form = document.getElementById('inventory-form');
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(form);
            const data = Object.fromEntries(formData.entries());
            
            try {
                await api.createInventoryItem(data);
                closeModal();
                app.loadInventory();
                alert('Inventory item added successfully!');
            } catch (error) {
                alert('Failed to add item: ' + error.message);
            }
        });
    }
}

function closeModal() {
    const modal = document.getElementById('modal-container');
    modal.classList.add('hidden');
    document.body.style.overflow = '';
}

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    const colors = {
        success: 'bg-green-500',
        error: 'bg-red-500',
        info: 'bg-blue-500',
        warning: 'bg-yellow-500'
    };
    const icons = {
        success: 'fa-check-circle',
        error: 'fa-exclamation-circle',
        info: 'fa-info-circle',
        warning: 'fa-exclamation-triangle'
    };
    
    notification.className = `fixed top-4 right-4 ${colors[type]} text-white px-6 py-4 rounded-lg shadow-2xl z-50 flex items-center gap-3 animate-slide-in`;
    notification.innerHTML = `
        <i class="fas ${icons[type]}"></i>
        <span class="font-medium">${message}</span>
    `;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transform = 'translateX(100%)';
        notification.style.transition = 'all 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 4000);
}

async function editClient(id) {
    try {
        const response = await api.getClient(id);
        if (response.success && response.data) {
            openClientModal(response.data);
        } else {
            showNotification('Failed to load client data', 'error');
        }
    } catch (error) {
        showNotification('Error loading client: ' + error.message, 'error');
    }
}

async function deleteClient(id) {
    if (!confirm('Are you sure you want to delete this client? This action cannot be undone.')) {
        return;
    }
    
    try {
        await api.deleteClient(id);
        app.loadClients();
        showNotification('Client deleted successfully!', 'success');
    } catch (error) {
        showNotification('Failed to delete client: ' + error.message, 'error');
    }
}

// Client History Modal
async function viewClientHistory(clientId) {
    try {
        // Get client details
        const clientResponse = await api.getClient(clientId);
        if (!clientResponse.success || !clientResponse.data) {
            showNotification('Failed to load client data', 'error');
            return;
        }
        
        const client = clientResponse.data;
        
        // Update modal header
        document.getElementById('client-history-name').textContent = client.full_name || 'Unknown Client';
        document.getElementById('client-history-email').textContent = client.email || client.phone || 'No contact info';
        
        const avatarEl = document.getElementById('client-history-avatar');
        if (client.avatar_url) {
            avatarEl.src = client.avatar_url;
        } else {
            const name = client.full_name || 'U';
            avatarEl.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=6366f1&color=fff&size=48`;
        }
        
        // Get client transactions
        const transactionsResponse = await api.getClientTransactions(clientId);
        const transactions = transactionsResponse.success && transactionsResponse.data ? transactionsResponse.data : [];
        
        // Calculate stats
        let totalSpent = 0;
        let totalVisits = transactions.filter(t => t.transaction_type === 'income').length;
        let lastVisit = null;
        
        transactions.forEach(t => {
            if (t.transaction_type === 'income') {
                totalSpent += parseFloat(t.amount);
            }
            if (!lastVisit || t.transaction_date > lastVisit) {
                lastVisit = t.transaction_date;
            }
        });
        
        document.getElementById('client-total-spent').textContent = `${totalSpent.toLocaleString()} KSH`;
        document.getElementById('client-total-visits').textContent = totalVisits.toString();
        document.getElementById('client-last-visit').textContent = lastVisit ? new Date(lastVisit).toLocaleDateString() : '-';
        
        // Render transactions
        const transactionsContainer = document.getElementById('client-history-transactions');
        if (transactions.length > 0) {
            transactionsContainer.innerHTML = transactions.map(t => `
                <div class="client-history-transaction">
                    <div class="client-transaction-info">
                        <div class="client-transaction-icon ${t.transaction_type}">
                            <i class="fas fa-${t.transaction_type === 'income' ? 'arrow-down' : 'arrow-up'}"></i>
                        </div>
                        <div class="client-transaction-details">
                            <h4>${t.description || t.category || 'Transaction'}</h4>
                            <p>${new Date(t.transaction_date).toLocaleDateString()} ${t.payment_method ? `• ${t.payment_method}` : ''}</p>
                        </div>
                    </div>
                    <span class="client-transaction-amount ${t.transaction_type}">
                        ${t.transaction_type === 'income' ? '+' : '-'}$${parseFloat(t.amount).toLocaleString()} KSH
                    </span>
                </div>
            `).join('');
        } else {
            transactionsContainer.innerHTML = '<p class="text-slate-400 text-center py-8">No transactions found for this client.</p>';
        }
        
        // Show modal
        document.getElementById('client-history-modal').classList.remove('hidden');
        document.body.style.overflow = 'hidden';
        
    } catch (error) {
        showNotification('Error loading client history: ' + error.message, 'error');
    }
}

function closeClientHistoryModal() {
    document.getElementById('client-history-modal').classList.add('hidden');
    document.body.style.overflow = '';
}

// Edit Client KSH (Total Spent)
function editClientKsh() {
    const spentEl = document.getElementById('client-total-spent');
    const currentValue = spentEl.textContent.replace(/[^0-9.-]/g, '');
    
    const input = document.createElement('input');
    input.type = 'number';
    input.className = 'stat-edit-input';
    input.value = currentValue;
    
    const statWithEdit = spentEl.parentElement;
    statWithEdit.innerHTML = '';
    statWithEdit.appendChild(input);
    input.focus();
    
    const saveValue = async () => {
        const newValue = parseFloat(input.value) || 0;
        spentEl.textContent = `${newValue.toLocaleString()} KSH`;
        statWithEdit.innerHTML = '';
        statWithEdit.appendChild(spentEl);
        
        // Add edit button back
        const editBtn = document.createElement('button');
        editBtn.className = 'stat-edit-btn';
        editBtn.onclick = editClientKsh;
        editBtn.title = 'Edit Total Spent';
        editBtn.innerHTML = '<i class="fas fa-edit"></i>';
        statWithEdit.appendChild(editBtn);
        
        showNotification(`Updated total spent to ${newValue.toLocaleString()} KSH`, 'success');
    };
    
    input.addEventListener('blur', saveValue);
    input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            input.blur();
        }
    });
}

// Edit Client Visits
function editClientVisits() {
    const visitsEl = document.getElementById('client-total-visits');
    const currentValue = visitsEl.textContent;
    
    const input = document.createElement('input');
    input.type = 'number';
    input.className = 'stat-edit-input';
    input.value = currentValue;
    input.min = '0';
    
    const statWithEdit = visitsEl.parentElement;
    statWithEdit.innerHTML = '';
    statWithEdit.appendChild(input);
    input.focus();
    
    const saveValue = async () => {
        const newValue = parseInt(input.value) || 0;
        visitsEl.textContent = newValue.toString();
        statWithEdit.innerHTML = '';
        statWithEdit.appendChild(visitsEl);
        
        // Add edit button back
        const editBtn = document.createElement('button');
        editBtn.className = 'stat-edit-btn';
        editBtn.onclick = editClientVisits;
        editBtn.title = 'Edit Visits';
        editBtn.innerHTML = '<i class="fas fa-edit"></i>';
        statWithEdit.appendChild(editBtn);
        
        showNotification(`Updated total visits to ${newValue}`, 'success');
    };
    
    input.addEventListener('blur', saveValue);
    input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            input.blur();
        }
    });
}

// Client Balance Modal
async function viewClientBalance(clientId) {
    try {
        // Get client details
        const clientResponse = await api.getClient(clientId);
        if (!clientResponse.success || !clientResponse.data) {
            showNotification('Failed to load client data', 'error');
            return;
        }
        
        const client = clientResponse.data;
        
        // Update modal header
        document.getElementById('balance-client-name').textContent = client.full_name || 'Unknown Client';
        document.getElementById('balance-client-contact').textContent = client.email || client.phone || 'No contact info';
        
        const imgEl = document.getElementById('balance-client-img');
        if (client.avatar_url) {
            imgEl.src = client.avatar_url;
        } else {
            const name = client.full_name || 'U';
            imgEl.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=6366f1&color=fff&size=48`;
        }
        
        // Get client transactions
        const transactionsResponse = await api.getClientTransactions(clientId);
        const transactions = transactionsResponse.success && transactionsResponse.data ? transactionsResponse.data : [];
        
        // Calculate outstanding balance
        let totalCharges = 0;
        let totalPayments = 0;
        
        transactions.forEach(t => {
            if (t.transaction_type === 'income') {
                totalPayments += parseFloat(t.amount);
            } else {
                totalCharges += parseFloat(t.amount);
            }
        });
        
        const outstanding = client.outstanding_balance || (totalCharges - totalPayments);
        const balanceEl = document.getElementById('balance-amount');
        balanceEl.textContent = `${Math.abs(outstanding).toLocaleString()} KSH`;
        balanceEl.className = `balance-value ${outstanding > 0 ? '' : 'paid'}`;
        
        // Render transactions
        const transactionsContainer = document.getElementById('balance-transactions');
        if (transactions.length > 0) {
            transactionsContainer.innerHTML = transactions.map(t => `
                <div class="balance-transaction">
                    <div class="flex items-center">
                        <div class="balance-transaction-icon ${t.transaction_type === 'income' ? 'payment' : 'charge'}">
                            <i class="fas fa-${t.transaction_type === 'income' ? 'arrow-down' : 'arrow-up'}"></i>
                        </div>
                        <div>
                            <span class="text-white text-sm">${t.description || t.category || 'Transaction'}</span>
                            <p class="text-slate-400 text-xs">${new Date(t.transaction_date).toLocaleDateString()}</p>
                        </div>
                    </div>
                    <span class="${t.transaction_type === 'income' ? 'text-emerald-400' : 'text-rose-400'}">
                        ${t.transaction_type === 'income' ? '+' : '-'}${parseFloat(t.amount).toLocaleString()} KSH
                    </span>
                </div>
            `).join('');
        } else {
            transactionsContainer.innerHTML = '<p class="text-slate-400 text-center py-8">No transactions found.</p>';
        }
        
        // Show modal
        document.getElementById('client-balance-modal').classList.remove('hidden');
        document.body.style.overflow = 'hidden';
        
    } catch (error) {
        showNotification('Error loading client balance: ' + error.message, 'error');
    }
}

function closeClientBalanceModal() {
    document.getElementById('client-balance-modal').classList.add('hidden');
    document.body.style.overflow = '';
}

function addPayment() {
    showNotification('Payment functionality coming soon', 'info');
}

function editBalanceClient() {
    closeClientBalanceModal();
    showNotification('Edit client from balance modal', 'info');
}

async function editAppointment(id) {
    try {
        const response = await api.getAppointment(id);
        if (response.success && response.data) {
            openAppointmentModal(response.data);
        } else {
            showNotification('Failed to load appointment data', 'error');
        }
    } catch (error) {
        showNotification('Error loading appointment: ' + error.message, 'error');
    }
}

// Filter Appointments
function filterAppointments(status) {
    // Update active button
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    const activeBtn = document.getElementById(`filter-${status}`);
    if (activeBtn) {
        activeBtn.classList.add('active');
    }
    
    // Reload appointments with filter
    app.loadAppointments(status);
}

// Delete Appointment
async function deleteAppointment(id) {
    if (!confirm('Are you sure you want to delete this appointment? This action cannot be undone.')) {
        return;
    }
    
    try {
        await api.deleteAppointment(id);
        showNotification('Appointment deleted successfully!', 'success');
        // Reload with current filter
        const activeBtn = document.querySelector('.filter-btn.active');
        const status = activeBtn ? activeBtn.id.replace('filter-', '') : 'all';
        app.loadAppointments(status);
    } catch (error) {
        showNotification('Failed to delete appointment: ' + error.message, 'error');
    }
}

async function editInventoryItem(id) {
    showNotification('Inventory editing coming soon', 'info');
}

async function deleteInventoryItem(id) {
    if (!confirm('Are you sure you want to delete this item?')) {
        return;
    }
    
    try {
        await api.deleteInventoryItem(id);
        app.loadInventory();
        showNotification('Item deleted successfully!', 'success');
    } catch (error) {
        showNotification('Failed to delete item: ' + error.message, 'error');
    }
}

function exportClients() {
    showNotification('Exporting client data...', 'info');
}

function exportData() {
    showNotification('Exporting all data...', 'info');
}

function importData() {
    showNotification('Importing data...', 'info');
}

function clearAllData() {
    if (confirm('This will permanently delete all your data. This action cannot be undone. Continue?')) {
        showNotification('All data cleared!', 'success');
    }
}

function refreshInventory() {
    app.loadInventory();
}

function generateReport() {
    const start = document.getElementById('report-start').value;
    const end = document.getElementById('report-end').value;
    
    if (!start || !end) {
        showNotification('Please select a date range', 'warning');
        return;
    }
    
    if (new Date(start) > new Date(end)) {
        showNotification('Start date must be before end date', 'warning');
        return;
    }
    
    app.loadFinancials({ date_from: start, date_to: end });
    showNotification(`Report generated for ${start} to ${end}`, 'success');
}

// Export report as Excel-compatible CSV
function exportReportToExcel() {
    const start = document.getElementById('report-start').value;
    const end = document.getElementById('report-end').value;
    
    if (!start || !end) {
        showNotification('Please select a date range first', 'warning');
        return;
    }
    
    // Fetch transactions for the date range
    api.getTransactions({ date_from: start, date_to: end, limit: 1000 }).then(response => {
        if (!response.success || !response.data || response.data.length === 0) {
            showNotification('No transactions found for this period', 'warning');
            return;
        }
        
        const transactions = response.data;
        
        // Calculate totals
        let totalRevenue = 0;
        let totalExpenses = 0;
        transactions.forEach(t => {
            if (t.transaction_type === 'income') {
                totalRevenue += parseFloat(t.amount);
            } else {
                totalExpenses += parseFloat(t.amount);
            }
        });
        
        // Create CSV content with BOM for Excel compatibility
        const BOM = '\uFEFF';
        let csvContent = BOM;
        
        // Header
        csvContent += 'InkMaster Pro - Financial Report\n';
        csvContent += `Period: ${start} to ${end}\n`;
        csvContent += `Generated: ${new Date().toLocaleString()}\n\n`;
        
        // Summary
        csvContent += 'SUMMARY\n';
        csvContent += `Total Revenue,${totalRevenue.toFixed(2)} KSH\n`;
        csvContent += `Total Expenses,${totalExpenses.toFixed(2)} KSH\n`;
        csvContent += `Net Profit,${(totalRevenue - totalExpenses).toFixed(2)} KSH\n\n`;
        
        // Transaction details
        csvContent += 'TRANSACTION DETAILS\n';
        csvContent += 'Date,Type,Category,Description,Amount (KSH),Payment Method\n';
        
        transactions.forEach(t => {
            const date = t.transaction_date || '';
            const type = t.transaction_type || '';
            const category = t.category || '';
            const description = (t.description || '').replace(/,/g, ';');
            const amount = parseFloat(t.amount).toFixed(2);
            const payment = t.payment_method || '';
            
            csvContent += `${date},${type},${category},${description},${amount},${payment}\n`;
        });
        
        // Create download link
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `InkMaster_Report_${start}_to_${end}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        showNotification('Report downloaded successfully!', 'success');
    }).catch(error => {
        showNotification('Failed to export report: ' + error.message, 'error');
    });
}

// Update banner stats
function updateBannerStats() {
    // These will be populated when dashboard loads
    const clients = document.getElementById('total-clients')?.textContent || '0';
    const appointments = document.getElementById('today-appointments')?.textContent || '0';
    const revenue = document.getElementById('monthly-revenue')?.textContent || '0 KSH';
    
    const bannerClients = document.getElementById('banner-stat-clients');
    const bannerAppointments = document.getElementById('banner-stat-appointments');
    const bannerRevenue = document.getElementById('banner-stat-revenue');
    
    if (bannerClients) bannerClients.textContent = clients;
    if (bannerAppointments) bannerAppointments.textContent = appointments;
    if (bannerRevenue) bannerRevenue.textContent = revenue;
}

// Generate floating bubbles tied to data
function generateFloatingBubbles(containerId, count = 8) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    container.innerHTML = '';
    
    const colors = [
        'rgba(99, 102, 241, 0.3)',
        'rgba(168, 85, 247, 0.3)',
        'rgba(236, 72, 153, 0.25)',
        'rgba(16, 185, 129, 0.25)',
        'rgba(59, 130, 246, 0.3)',
    ];
    
    for (let i = 0; i < count; i++) {
        const bubble = document.createElement('div');
        bubble.className = 'floating-bubble';
        const size = Math.random() * 60 + 30;
        bubble.style.width = `${size}px`;
        bubble.style.height = `${size}px`;
        bubble.style.left = `${Math.random() * 100}%`;
        bubble.style.top = `${Math.random() * 100}%`;
        bubble.style.background = colors[Math.floor(Math.random() * colors.length)];
        bubble.style.animationDelay = `${Math.random() * 4}s`;
        bubble.style.animationDuration = `${4 + Math.random() * 4}s`;
        container.appendChild(bubble);
    }
}

function showForgotPassword() {
    alert('Password reset functionality would be implemented here.');
}

// Carousel functionality
const carousels = {};

function initCarousel(id) {
    const carousel = document.getElementById(`${id}-carousel`);
    if (!carousel) return;
    
    const slides = carousel.querySelectorAll('.carousel-slide');
    const dotsContainer = document.getElementById(`${id}-carousel-dots`);
    
    if (slides.length === 0) return;
    
    carousels[id] = {
        current: 0,
        slides: slides,
        dotsContainer: dotsContainer,
        autoPlay: null
    };
    
    // Create dots
    if (dotsContainer) {
        dotsContainer.innerHTML = '';
        slides.forEach((_, i) => {
            const dot = document.createElement('div');
            dot.className = `carousel-dot ${i === 0 ? 'active' : ''}`;
            dot.onclick = () => goToSlide(id, i);
            dotsContainer.appendChild(dot);
        });
    }
    
    // Start autoplay
    startAutoPlay(id);
}

function moveCarousel(id, direction) {
    const carousel = carousels[id];
    if (!carousel) return;
    
    const newIndex = (carousel.current + direction + carousel.slides.length) % carousel.slides.length;
    goToSlide(id, newIndex);
}

function goToSlide(id, index) {
    const carousel = carousels[id];
    if (!carousel || index === carousel.current) return;
    
    const { slides, dotsContainer } = carousel;
    const currentSlide = slides[carousel.current];
    const nextSlide = slides[index];
    
    // Remove active class from current
    currentSlide.classList.remove('active');
    currentSlide.classList.add('prev');
    
    // Add active class to next
    nextSlide.classList.add('active');
    nextSlide.classList.remove('prev');
    
    // Update dots
    if (dotsContainer) {
        const dots = dotsContainer.querySelectorAll('.carousel-dot');
        dots.forEach((dot, i) => {
            dot.classList.toggle('active', i === index);
        });
    }
    
    carousel.current = index;
    
    // Reset autoplay
    startAutoPlay(id);
}

function startAutoPlay(id) {
    const carousel = carousels[id];
    if (!carousel) return;
    
    // Clear existing autoplay
    if (carousel.autoPlay) {
        clearInterval(carousel.autoPlay);
    }
    
    // Set new autoplay (5 seconds)
    carousel.autoPlay = setInterval(() => {
        moveCarousel(id, 1);
    }, 5000);
}

function initAllCarousels() {
    initCarousel('dashboard');
    initCarousel('clients');
    initCarousel('appointments');
    initCarousel('financials');
    initCarousel('inventory');
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.app = new App();
    initAllCarousels();
});

// Make functions global for HTML onclick handlers

// Make functions global for HTML onclick handlers
window.openClientModal = openClientModal;
window.openAppointmentModal = openAppointmentModal;
window.openTransactionModal = openTransactionModal;
window.openInventoryModal = openInventoryModal;
window.closeModal = closeModal;
window.editClient = editClient;
window.deleteClient = deleteClient;
window.viewClientHistory = viewClientHistory;
window.closeClientHistoryModal = closeClientHistoryModal;
window.editClientKsh = editClientKsh;
window.editClientVisits = editClientVisits;
window.viewClientBalance = viewClientBalance;
window.closeClientBalanceModal = closeClientBalanceModal;
window.addPayment = addPayment;
window.editBalanceClient = editBalanceClient;
window.editAppointment = editAppointment;
window.filterAppointments = filterAppointments;
window.deleteAppointment = deleteAppointment;
window.editInventoryItem = editInventoryItem;
window.deleteInventoryItem = deleteInventoryItem;
window.exportClients = exportClients;
window.exportData = exportData;
window.exportReportToExcel = exportReportToExcel;
window.importData = importData;
window.clearAllData = clearAllData;
window.refreshInventory = refreshInventory;
window.generateReport = generateReport;
window.showForgotPassword = showForgotPassword;
window.showNotification = showNotification;
