// Dashboard Component
// This file extends the App class with dashboard-specific functionality

(function() {
    if (typeof window.App === 'undefined' && typeof App !== 'undefined') {
        App.prototype.refreshDashboard = async function() {
            await this.loadDashboard();
        };
    }
})();

// Additional dashboard helper functions
function updateDashboardRealtime() {
    if (window.app && document.visibilityState === 'visible') {
        window.app.loadDashboard();
    }
}

document.addEventListener('visibilitychange', updateDashboardRealtime);
