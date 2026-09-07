// Clients Component
(function() {
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

    const searchInput = document.getElementById('client-search');
    const filterSelect = document.getElementById('client-filter');

    if (searchInput) {
        searchInput.addEventListener('input', debounce(() => {
            if (window.app) window.app.loadClients();
        }, 300));
    }

    if (filterSelect) {
        filterSelect.addEventListener('change', () => {
            if (window.app) window.app.loadClients();
        });
    }

    window.editClient = function(id) {
        const modal = document.getElementById('modal-container');
        const content = modal.querySelector('.modal-content');
        
        api.getClient(id).then(response => {
            const client = response.data;
            content.innerHTML = `
                <div class="flex justify-between items-center mb-6">
                    <h2 class="text-2xl font-bold">Edit Client</h2>
                    <button onclick="closeModal()" class="text-gray-500 hover:text-gray-700">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <form id="edit-client-form" class="space-y-4">
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label class="block text-sm font-medium mb-1">Full Name *</label>
                            <input type="text" name="full_name" class="glass-input w-full" value="${client.full_name}" required />
                        </div>
                        <div>
                            <label class="block text-sm font-medium mb-1">Phone *</label>
                            <input type="tel" name="phone" class="glass-input w-full" value="${client.phone}" required />
                        </div>
                    </div>
                    <div>
                        <label class="block text-sm font-medium mb-1">Email</label>
                        <input type="email" name="email" class="glass-input w-full" value="${client.email || ''}" />
                    </div>
                    <div>
                        <label class="block text-sm font-medium mb-1">Tattoo Preferences</label>
                        <textarea name="tattoo_preferences" class="glass-input w-full" rows="3">${client.tattoo_preferences || ''}</textarea>
                    </div>
                    <div class="flex gap-3 pt-4">
                        <button type="submit" class="btn-primary flex-1">Save Changes</button>
                        <button type="button" onclick="closeModal()" class="btn-secondary">Cancel</button>
                    </div>
                </form>
            `;
            
            modal.classList.remove('hidden');
            
            const form = document.getElementById('edit-client-form');
            if (form) {
                form.addEventListener('submit', async (e) => {
                    e.preventDefault();
                    const formData = new FormData(form);
                    const data = Object.fromEntries(formData.entries());
                    
                    try {
                        await api.updateClient(id, data);
                        closeModal();
                        app.loadClients();
                        alert('Client updated successfully!');
                    } catch (error) {
                        alert('Failed to update client: ' + error.message);
                    }
                });
            }
        }).catch(error => {
            console.error('Failed to load client:', error);
            alert('Failed to load client for editing');
        });
    };

    window.deleteClient = async function(id) {
        if (confirm('Are you sure you want to delete this client?')) {
            try {
                await api.deleteClient(id);
                app.loadClients();
                alert('Client deleted successfully!');
            } catch (error) {
                alert('Failed to delete client: ' + error.message);
            }
        }
    };
})();
