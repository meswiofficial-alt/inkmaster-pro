// Appointments Component
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

    window.editAppointment = function(id) {
        const modal = document.getElementById('modal-container');
        const content = modal.querySelector('.modal-content');
        
        api.getAppointment(id).then(response => {
            const appt = response.data;
            
            api.getClients({ limit: 100 }).then(clientsResp => {
                const clientOptions = (clientsResp.data || []).map(c => 
                    `<option value="${c.id}" ${c.id == appt.client_id ? 'selected' : ''}>${c.full_name}</option>`
                ).join('');
                
                content.innerHTML = `
                    <div class="flex justify-between items-center mb-6">
                        <h2 class="text-2xl font-bold">Edit Appointment</h2>
                        <button onclick="closeModal()" class="text-gray-500 hover:text-gray-700">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <form id="edit-appointment-form" class="space-y-4">
                        <div>
                            <label class="block text-sm font-medium mb-1">Client</label>
                            <select name="client_id" class="glass-select w-full">${clientOptions}</select>
                        </div>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label class="block text-sm font-medium mb-1">Date</label>
                                <input type="date" name="appointment_date" class="glass-input w-full" value="${appt.appointment_date}" />
                            </div>
                            <div>
                                <label class="block text-sm font-medium mb-1">Time</label>
                                <input type="time" name="start_time" class="glass-input w-full" value="${appt.start_time}" />
                            </div>
                        </div>
                        <div>
                            <label class="block text-sm font-medium mb-1">Service Type</label>
                            <select name="service_type" class="glass-select w-full">
                                <option value="new_tattoo" ${appt.service_type === 'new_tattoo' ? 'selected' : ''}>New Tattoo</option>
                                <option value="touch_up" ${appt.service_type === 'touch_up' ? 'selected' : ''}>Touch Up</option>
                                <option value="consultation" ${appt.service_type === 'consultation' ? 'selected' : ''}>Consultation</option>
                                <option value="cover_up" ${appt.service_type === 'cover_up' ? 'selected' : ''}>Cover Up</option>
                                <option value="custom_design" ${appt.service_type === 'custom_design' ? 'selected' : ''}>Custom Design</option>
                            </select>
                        </div>
                        <div>
                            <label class="block text-sm font-medium mb-1">Status</label>
                            <select name="status" class="glass-select w-full">
                                <option value="scheduled" ${appt.status === 'scheduled' ? 'selected' : ''}>Scheduled</option>
                                <option value="in_progress" ${appt.status === 'in_progress' ? 'selected' : ''}>In Progress</option>
                                <option value="completed" ${appt.status === 'completed' ? 'selected' : ''}>Completed</option>
                                <option value="cancelled" ${appt.status === 'cancelled' ? 'selected' : ''}>Cancelled</option>
                                <option value="no_show" ${appt.status === 'no_show' ? 'selected' : ''}>No Show</option>
                            </select>
                        </div>
                        <div>
                            <label class="block text-sm font-medium mb-1">Total Amount</label>
                            <input type="number" name="total_amount" class="glass-input w-full" value="${appt.total_amount}" step="0.01" />
                        </div>
                        <div>
                            <label class="block text-sm font-medium mb-1">Design Notes</label>
                            <textarea name="design_notes" class="glass-input w-full" rows="3">${appt.design_notes || ''}</textarea>
                        </div>
                        <div class="flex gap-3 pt-4">
                            <button type="submit" class="btn-primary flex-1">Save Changes</button>
                            <button type="button" onclick="closeModal()" class="btn-secondary">Cancel</button>
                        </div>
                    </form>
                `;
                
                modal.classList.remove('hidden');
                
                const form = document.getElementById('edit-appointment-form');
                if (form) {
                    form.addEventListener('submit', async (e) => {
                        e.preventDefault();
                        const formData = new FormData(form);
                        const data = Object.fromEntries(formData.entries());
                        
                        try {
                            await api.updateAppointment(id, data);
                            closeModal();
                            app.loadAppointments();
                            alert('Appointment updated successfully!');
                        } catch (error) {
                            alert('Failed to update appointment: ' + error.message);
                        }
                    });
                }
            });
        }).catch(error => {
            console.error('Failed to load appointment:', error);
            alert('Failed to load appointment for editing');
        });
    };

    // Search with debounce (integrated into app.js already)
})();
