// Inventory Component
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

    const searchInput = document.getElementById('inventory-search');
    const categorySelect = document.getElementById('inventory-category');

    if (searchInput) {
        searchInput.addEventListener('input', debounce(() => {
            if (window.app) window.app.loadInventory();
        }, 300));
    }

    if (categorySelect) {
        categorySelect.addEventListener('change', () => {
            if (window.app) window.app.loadInventory();
        });
    }

    window.refreshInventory = function() {
        if (window.app) window.app.loadInventory();
    };

    window.editInventoryItem = function(id) {
        const modal = document.getElementById('modal-container');
        const content = modal.querySelector('.modal-content');
        
        api.getInventoryItem(id).then(response => {
            const item = response.data;
            content.innerHTML = `
                <div class="flex justify-between items-center mb-6">
                    <h2 class="text-2xl font-bold">Edit Inventory Item</h2>
                    <button onclick="closeModal()" class="text-gray-500 hover:text-gray-700">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <form id="edit-inventory-form" class="space-y-4">
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label class="block text-sm font-medium mb-1">Product Name *</label>
                            <input type="text" name="product_name" class="glass-input w-full" value="${item.product_name}" required />
                        </div>
                        <div>
                            <label class="block text-sm font-medium mb-1">SKU *</label>
                            <input type="text" name="sku" class="glass-input w-full" value="${item.sku}" required />
                        </div>
                    </div>
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label class="block text-sm font-medium mb-1">Quantity</label>
                            <input type="number" name="quantity_on_hand" class="glass-input w-full" value="${item.quantity_on_hand}" />
                        </div>
                        <div>
                            <label class="block text-sm font-medium mb-1">Reorder Level</label>
                            <input type="number" name="reorder_level" class="glass-input w-full" value="${item.reorder_level}" />
                        </div>
                        <div>
                            <label class="block text-sm font-medium mb-1">Unit Cost</label>
                            <input type="number" name="unit_cost" class="glass-input w-full" value="${item.unit_cost}" step="0.01" />
                        </div>
                    </div>
                    <div>
                        <label class="block text-sm font-medium mb-1">Supplier</label>
                        <input type="text" name="supplier" class="glass-input w-full" value="${item.supplier || ''}" />
                    </div>
                    <div>
                        <label class="block text-sm font-medium mb-1">Location</label>
                        <input type="text" name="location" class="glass-input w-full" value="${item.location || ''}" />
                    </div>
                    <div class="flex gap-3 pt-4">
                        <button type="submit" class="btn-primary flex-1">Save Changes</button>
                        <button type="button" onclick="closeModal()" class="btn-secondary">Cancel</button>
                    </div>
                </form>
            `;
            
            modal.classList.remove('hidden');
            
            const form = document.getElementById('edit-inventory-form');
            if (form) {
                form.addEventListener('submit', async (e) => {
                    e.preventDefault();
                    const formData = new FormData(form);
                    const data = Object.fromEntries(formData.entries());
                    
                    try {
                        await api.updateInventoryItem(id, data);
                        closeModal();
                        app.loadInventory();
                        alert('Inventory item updated successfully!');
                    } catch (error) {
                        alert('Failed to update item: ' + error.message);
                    }
                });
            }
        }).catch(error => {
            console.error('Failed to load inventory item:', error);
            alert('Failed to load item for editing');
        });
    };

    window.deleteInventoryItem = async function(id) {
        if (confirm('Are you sure you want to remove this item?')) {
            try {
                await api.deleteInventoryItem(id);
                app.loadInventory();
                alert('Item removed successfully!');
            } catch (error) {
                alert('Failed to remove item: ' + error.message);
            }
        }
    };
})();
