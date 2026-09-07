class API {
    constructor() {
        // Read deployment base path from a meta tag set in index.html
        // Allows same code to work at root (/) or in a subdirectory (e.g., /inkmaster-pro/)
        const metaBase = document.querySelector('meta[name="base-url"]');
        const basePath = metaBase ? metaBase.content.trim() : '';
        
        // If base-url is empty or looks wrong, fall back to root
        // This prevents requests to wrong paths like /inkmaster_php/ when not needed
        if (!basePath || basePath === '/' || basePath === '\\') {
            this.baseUrl = '/backend/api';
        } else {
            this.baseUrl = `${basePath}/backend/api`;
        }
        
        this.headers = {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        };
    }
    
    async request(endpoint, method = 'GET', data = null) {
        const url = `${this.baseUrl}${endpoint}`;
        const options = {
            method: method,
            headers: this.headers,
            credentials: 'same-origin'
        };
        
        if (data && (method === 'POST' || method === 'PUT')) {
            options.body = JSON.stringify(data);
        }
        
        // Add timeout to prevent indefinite hangs (5 seconds)
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        
        try {
            const response = await fetch(url, { ...options, signal: controller.signal });
            clearTimeout(timeoutId);
            
            // Read the response body as text first so we can validate it
            const text = await response.text();
            
            // Check for HTML responses (covers both HTTP errors and 200 OK with HTML)
            // This prevents "Unexpected token '<'" when server returns HTML error pages
            if (text.includes('<!DOCTYPE') || text.includes('<html')) {
                throw new Error(`Server returned an HTML response instead of JSON (status ${response.status}). Check if the endpoint file exists at the expected path.`);
            }
            
            // Check for HTTP errors
            if (!response.ok) {
                let errorMessage = `HTTP ${response.status} ${response.statusText}`;
                try {
                    const errorData = JSON.parse(text);
                    errorMessage = errorData.message || errorMessage;
                } catch {
                    errorMessage = text.substring(0, 200) || errorMessage;
                }
                throw new Error(errorMessage);
            }
            
            // Parse JSON response
            const result = await JSON.parse(text);
            return result;
        } catch (error) {
            clearTimeout(timeoutId);
            if (error.name === 'AbortError') {
                throw new Error('Request timed out after 15 seconds. The server may be unavailable or the endpoint does not exist.');
            }
            throw error;
        }
    }
    
    // Auth endpoints
    async login(email, password) {
        return this.request('/auth/login.php', 'POST', { email, password });
    }
    
    async signup(data) {
        return this.request('/auth/signup.php', 'POST', data);
    }
    
    async logout() {
        return this.request('/auth/logout.php', 'POST');
    }
    
    async checkSession() {
        return this.request('/auth/session.php');
    }
    
    // Client endpoints
    async getClients(params = {}) {
        const query = new URLSearchParams(params).toString();
        return this.request(`/clients/index.php?${query}`);
    }
    
    async getClient(id) {
        return this.request(`/clients/read_update.php?id=${id}`);
    }
    
    async createClient(data) {
        return this.request('/clients/index.php', 'POST', data);
    }
    
    async updateClient(id, data) {
        return this.request(`/clients/read_update.php?id=${id}`, 'PUT', data);
    }
    
    async deleteClient(id) {
        return this.request(`/clients/read_update.php?id=${id}`, 'DELETE');
    }
    
    // Appointment endpoints
    async getAppointments(params = {}) {
        const query = new URLSearchParams(params).toString();
        return this.request(`/appointments/index.php?${query}`);
    }
    
    async getAppointment(id) {
        return this.request(`/appointments/update.php?id=${id}`);
    }
    
    async createAppointment(data) {
        return this.request('/appointments/create.php', 'POST', data);
    }
    
    async updateAppointment(id, data) {
        return this.request(`/appointments/update.php?id=${id}`, 'PUT', data);
    }
    
    async deleteAppointment(id) {
        return this.request(`/appointments/update.php?id=${id}`, 'DELETE');
    }
    
    // Financial endpoints
    async getTransactions(params = {}) {
        const query = new URLSearchParams(params).toString();
        return this.request(`/financials/transactions.php?${query}`);
    }
    
    async getDashboardStats() {
        return this.request('/financials/dashboard.php');
    }
    
    async createTransaction(data) {
        return this.request('/financials/transactions.php', 'POST', data);
    }
    
    async getClientTransactions(clientId) {
        return this.request(`/clients/transactions.php?client_id=${clientId}`);
    }
    
    async getTransaction(id) {
        return this.request(`/financials/transaction_detail.php?id=${id}`);
    }
    
    async updateTransaction(id, data) {
        return this.request(`/financials/transaction_detail.php?id=${id}`, 'PUT', data);
    }
    
    async deleteTransaction(id) {
        return this.request(`/financials/transaction_detail.php?id=${id}`, 'DELETE');
    }
    
    // Inventory endpoints
    async getInventory(params = {}) {
        const query = new URLSearchParams(params).toString();
        return this.request(`/inventory/index.php?${query}`);
    }
    
    async getLowStockAlerts() {
        return this.request('/inventory/alerts.php');
    }
    
    async createInventoryItem(data) {
        return this.request('/inventory/create.php', 'POST', data);
    }
    
    async updateInventoryItem(id, data) {
        return this.request(`/inventory/update.php?id=${id}`, 'PUT', data);
    }
    
    async getInventoryItem(id) {
        return this.request(`/inventory/update.php?id=${id}`);
    }
    
    async deleteInventoryItem(id) {
        return this.request(`/inventory/update.php?id=${id}`, 'DELETE');
    }
    
    // Settings endpoints
    async getThemeSettings() {
        return this.request('/settings/theme.php');
    }
    
    async saveTheme(data) {
        return this.request('/settings/theme.php', 'POST', data);
    }
    
    async getProfile() {
        return this.request('/settings/profile.php');
    }
    
    async updateProfile(data) {
        return this.request('/settings/profile.php', 'PUT', data);
    }
    
    async changePassword(data) {
        return this.request('/settings/profile.php', 'PUT', data);
    }
    
    async getNotificationPreferences() {
        const profile = await this.getProfile();
        return profile;
    }
    
    async updateNotifications(preferences) {
        return this.request('/settings/profile.php', 'PUT', {
            notification_preferences: preferences
        });
    }
    
    async getBusinessSettings() {
        return this.request('/settings/profile.php?business=true');
    }
    
    async updateBusinessSettings(settings) {
        return this.request('/settings/profile.php', 'PUT', settings);
    }
}

// Export singleton instance
const api = new API();
