// Financials Component
(function() {
    window.generateReport = function() {
        const start = document.getElementById('report-start').value;
        const end = document.getElementById('report-end').value;
        
        if (!start || !end) {
            alert('Please select a date range');
            return;
        }
        
        if (window.app) {
            window.app.loadFinancials({ date_from: start, date_to: end });
        }
    };
})();
