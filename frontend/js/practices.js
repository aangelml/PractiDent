// frontend/js/practices.js
// Agregar este archivo o integrar en dashboard.js

// Variables globales para prácticas
let currentPractices = [];
let currentPracticePage = 1;
let selectedPracticeId = null;
let searchPracticeTimeout = null;

// ========== FUNCIONES DE CARGA DE DATOS ==========

// Cargar prácticas
async function loadPractices() {
    try {
        const status = document.getElementById('filterPracticeStatus')?.value;
        const level = document.getElementById('filterPracticeLevel')?.value;
        const search = document.getElementById('searchPractice')?.value;

        // construir parámetros
        const params = new URLSearchParams({
            page: currentPracticePage,
            limit: 10
        });

        if (status) params.append('estado', status);
        if (level) params.append('nivel_dificultad', level);
        if (search) params.append('search', search);

        const response = await fetch(`${API_URL}/practices?${params.toString()}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (response.ok) {
            const result = await response.json();
            // asumir estructura result.data.practices y result.data.pagination
            currentPractices = result.data.practices || [];
            renderPracticesTable(result.data.practices || []);
            if (result.data.pagination) {
                renderPracticesPagination(result.data.pagination);
            }
        } else {
            showToast('Error al cargar prácticas', 'error');
        }
    } catch (error) {
        console.error('Error loading practices:', error);
        showToast('Error al cargar prácticas', 'error');
    }
}

// Actualizar estadísticas del practicante
function updatePracticeStats(practices) {
    const total = practices.length;
    const enProgreso = practices.filter(p => p.estado_asignacion === 'en_progreso').length;
    const completadas = practices.filter(p => p.estado_asignacion === 'completado').length;
    const calificaciones = practices.filter(p => p.calificacion_maestro).map(p => parseFloat(p.calificacion_maestro));
    const promedio = calificaciones.length > 0 ? 
        (calificaciones.reduce((a, b) => a + b, 0) / calificaciones.length).toFixed(1) : '-';

    document.getElementById('totalPracticasAsignadas').textContent = total;
    document.getElementById('practicasEnProgreso').textContent = enProgreso;
    document.getElementById('practicasCompletadas').textContent = completadas;
    document.getElementById('promedioCalificacion').textContent = promedio;
}

// ========== FUNCIONES DE MODAL ==========

// Mostrar modal de crear práctica
function showCreatePracticeModal() {
    document.getElementById('practiceModalTitle').textContent = 'Nueva Práctica';
    document.getElementById('practiceId').value = '';
    document.getElementById('practiceForm').reset();
    
    // Establecer fecha mínima como hoy
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('practiceFechaInicio').min = today;
    document.getElementById('practiceFechaFin').min = today;
    
    document.getElementById('practiceModal').classList.add('show');
}

// Cerrar modal de práctica
function closePracticeModal() {
    document.getElementById('practiceModal').classList.remove('show');
}

// Editar práctica
async function editPractice(id) {
    try {
        const response = await fetch(`${API_URL}/practices/${id}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (response.ok) {
            const result = await response.json();
            const practice = result.data.practice;
            
            document.getElementById('practiceModalTitle').textContent = 'Editar Práctica';
            document.getElementById('practiceId').value = practice.id;
            document.getElementById('practiceNombre').value = practice.nombre;
            document.getElementById('practiceDescripcion').value = practice.descripcion;
            document.getElementById('practiceRequisitos').value = practice.requisitos || '';
            document.getElementById('practiceTipo').value = practice.tipo_practica;
            document.getElementById('practiceNivel').value = practice.nivel_dificultad;
            document.getElementById('practiceDuracion').value = practice.duracion_estimada_horas;
            document.getElementById('practiceCupo').value = practice.cupo_maximo;
            document.getElementById('practiceFechaInicio').value = practice.fecha_inicio?.split('T')[0];
            document.getElementById('practiceFechaFin').value = practice.fecha_fin?.split('T')[0];
            
            document.getElementById('practiceModal').classList.add('show');
        }
    } catch (error) {
        console.error('Error loading practice:', error);
        showToast('Error al cargar práctica', 'error');
    }
}

// Ver practicantes de una práctica
async function viewPracticantes(practiceId) {
    try {
        selectedPracticeId = practiceId;
        const practice = currentPractices.find(p => p.id === practiceId);
        
        const response = await fetch(`${API_URL}/practices/${practiceId}/practicantes`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (response.ok) {
            const result = await response.json();
            
            document.getElementById('practiceNameInModal').textContent = practice?.nombre || 'Práctica';
            renderPracticantesList(result.data);
            document.getElementById('practicantesModal').classList.add('show');
        }
    } catch (error) {
        console.error('Error loading practicantes:', error);
        showToast('Error al cargar practicantes', 'error');
    }
}

// Renderizar lista de practicantes
function renderPracticantesList(practicantes) {
    const container = document.getElementById('practicantesList');
    
    if (!practicantes || practicantes.length === 0) {
        container.innerHTML = '<div class="empty-state">No hay practicantes asignados</div>';
        return;
    }

    container.innerHTML = `
        <table class="data-table">
            <thead>
                <tr>
                    <th>Matrícula</th>
                    <th>Nombre</th>
                    <th>Semestre</th>
                    <th>Estado</th>
                    <th>Calificación</th>
                    <th>Acciones</th>
                </tr>
            </thead>
            <tbody>
                ${practicantes.map(p => `
                    <tr>
                        <td>${p.matricula}</td>
                        <td>${p.nombre} ${p.apellido}</td>
                        <td>${p.semestre}°</td>
                        <td>
                            <span class="status-badge status-${p.estado}">${p.estado}</span>
                        </td>
                        <td>${p.calificacion_maestro || '-'}/10</td>
                        <td>
                            <div class="quick-actions">
                                ${currentUser.tipo_usuario === 'maestro' && p.estado === 'completado' && !p.calificacion_maestro ? `
                                    <button class="action-btn" onclick="showGradeModal(${selectedPracticeId}, ${p.practicante_id})" title="Calificar">⭐</button>
                                ` : ''}
                                ${currentUser.tipo_usuario === 'maestro' ? `
                                    <button class="action-btn" onclick="unassignPracticante(${selectedPracticeId}, ${p.practicante_id})" title="Desasignar">❌</button>
                                ` : ''}
                            </div>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

// Cerrar modal de practicantes
function closePracticantesModal() {
    document.getElementById('practicantesModal').classList.remove('show');
}

// Mostrar modal para asignar practicante
async function showAssignPracticanteModal() {
    document.getElementById('practiceIdForAssign').value = selectedPracticeId;
    
    try {
        // Cargar lista de practicantes disponibles
        const response = await fetch(`${API_URL}/users?tipo_usuario=practicante`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (response.ok) {
            const result = await response.json();
            const select = document.getElementById('practicanteToAssign');
            
            select.innerHTML = '<option value="">Seleccione un practicante...</option>' +
                result.users.filter(u => u.tipo_usuario === 'practicante').map(u => `
                    <option value="${u.id}">${u.nombre} ${u.apellido}</option>
                `).join('');
        }
    } catch (error) {
        console.error('Error loading practicantes:', error);
    }
    
    document.getElementById('assignPracticanteModal').classList.add('show');
}

// Cerrar modal de asignar practicante
function closeAssignPracticanteModal() {
    document.getElementById('assignPracticanteModal').classList.remove('show');
}

// ========== FUNCIONES DE ACCIONES ==========

// Guardar práctica (crear o editar)
document.getElementById('practiceForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const practiceId = document.getElementById('practiceId').value;
    const isEdit = !!practiceId;
    
    const practiceData = {
        nombre: document.getElementById('practiceNombre').value,
        descripcion: document.getElementById('practiceDescripcion').value,
        requisitos: document.getElementById('practiceRequisitos').value,
        tipo_practica: document.getElementById('practiceTipo').value,
        nivel_dificultad: document.getElementById('practiceNivel').value,
        duracion_estimada_horas: parseInt(document.getElementById('practiceDuracion').value),
        cupo_maximo: parseInt(document.getElementById('practiceCupo').value),
        fecha_inicio: document.getElementById('practiceFechaInicio').value,
        fecha_fin: document.getElementById('practiceFechaFin').value,
        estado: 'activa'
    };
    
    if (!isEdit) {
        practiceData.cupo_disponible = practiceData.cupo_maximo;
    }
    
    try {
        const response = await fetch(`${API_URL}/practices${isEdit ? '/' + practiceId : ''}`, {
            method: isEdit ? 'PUT' : 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify(practiceData)
        });

        if (response.ok) {
            showToast(`Práctica ${isEdit ? 'actualizada' : 'creada'} exitosamente`, 'success');
            closePracticeModal();
            loadPractices();
        } else {
            const error = await response.json();
            showToast(error.message || 'Error al guardar práctica', 'error');
        }
    } catch (error) {
        console.error('Error saving practice:', error);
        showToast('Error al guardar práctica', 'error');
    }
});

// Asignar practicante
document.getElementById('assignPracticanteForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const practiceId = document.getElementById('practiceIdForAssign').value;
    const userId = document.getElementById('practicanteToAssign').value;
    
    try {
        // Primero obtener el ID del practicante desde el usuario
        const userResponse = await fetch(`${API_URL}/users/${userId}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        
        if (userResponse.ok) {
            // Luego asignar el practicante a la práctica
            const response = await fetch(`${API_URL}/practices/${practiceId}/assign`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ practicante_id: userId })
            });

            if (response.ok) {
                showToast('Practicante asignado exitosamente', 'success');
                closeAssignPracticanteModal();
                viewPracticantes(practiceId);
            } else {
                const error = await response.json();
                showToast(error.message || 'Error al asignar practicante', 'error');
            }
        }
    } catch (error) {
        console.error('Error assigning practicante:', error);
        showToast('Error al asignar practicante', 'error');
    }
});

// Eliminar práctica
async function deletePractice(id) {
    if (!confirm('¿Estás seguro de eliminar esta práctica? Esta acción no se puede deshacer.')) return;
    
    try {
        const response = await fetch(`${API_URL}/practices/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (response.ok) {
            showToast('Práctica eliminada exitosamente', 'success');
            loadPractices();
        } else {
            const error = await response.json();
            showToast(error.message || 'Error al eliminar práctica', 'error');
        }
    } catch (error) {
        console.error('Error deleting practice:', error);
        showToast('Error al eliminar práctica', 'error');
    }
}

// Desasignar practicante
async function unassignPracticante(practiceId, practicanteId) {
    if (!confirm('¿Estás seguro de desasignar este practicante?')) return;
    
    try {
        const response = await fetch(`${API_URL}/practices/${practiceId}/unassign/${practicanteId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (response.ok) {
            showToast('Practicante desasignado exitosamente', 'success');
            viewPracticantes(practiceId);
        }
    } catch (error) {
        console.error('Error unassigning practicante:', error);
        showToast('Error al desasignar practicante', 'error');
    }
}

// Actualizar estado de mi práctica (practicante)
async function updateMyPracticeStatus(practiceId, newStatus) {
    try {
        // Obtener ID del practicante actual
        const response = await fetch(`${API_URL}/practices/my-practices`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        
        if (response.ok) {
            const result = await response.json();
            const practice = result.data.find(p => p.practica_id === practiceId);
            
            if (practice) {
                const updateResponse = await fetch(`${API_URL}/practices/${practiceId}/practicante/${practice.practicante_id}/status`, {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    },
                    body: JSON.stringify({ estado: newStatus })
                });

                if (updateResponse.ok) {
                    showToast('Estado actualizado exitosamente', 'success');
                    loadMyPractices();
                }
            }
        }
    } catch (error) {
        console.error('Error updating practice status:', error);
        showToast('Error al actualizar estado', 'error');
    }
}

// Inscribirse en práctica (practicante)
async function enrollInPractice(practiceId) {
    if (!confirm('¿Deseas inscribirte en esta práctica?')) return;
    
    try {
        // Primero obtener el ID del practicante
        const userResponse = await fetch(`${API_URL}/auth/profile`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        
        if (userResponse.ok) {
            const userData = await userResponse.json();
            
            // Luego inscribirse
            const response = await fetch(`${API_URL}/practices/${practiceId}/assign`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ practicante_id: userData.data.user.id })
            });

            if (response.ok) {
                showToast('Te has inscrito exitosamente en la práctica', 'success');
                loadPractices();
                if (currentUser.tipo_usuario === 'practicante') {
                    loadMyPractices();
                }
            } else {
                const error = await response.json();
                showToast(error.message || 'Error al inscribirse', 'error');
            }
        }
    } catch (error) {
        console.error('Error enrolling in practice:', error);
        showToast('Error al inscribirse en la práctica', 'error');
    }
}

// Ver detalles de práctica
async function viewPractice(id) {
    try {
        const response = await fetch(`${API_URL}/practices/${id}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (response.ok) {
            const result = await response.json();
            const practice = result.data.practice;
            
            // Mostrar detalles en un modal o alerta
            const details = `
                Nombre: ${practice.nombre}
                Descripción: ${practice.descripcion}
                Tipo: ${practice.tipo_practica}
                Nivel: ${practice.nivel_dificultad}
                Duración: ${practice.duracion_estimada_horas} horas
                Requisitos: ${practice.requisitos || 'Ninguno'}
                Maestro: ${practice.maestro_nombre}
                Cupo: ${practice.cupo_disponible}/${practice.cupo_maximo}
                Estado: ${practice.estado}
            `;
            
            alert(details);
        }
    } catch (error) {
        console.error('Error viewing practice:', error);
        showToast('Error al ver detalles', 'error');
    }
}

// Buscar prácticas
function searchPractices() {
    clearTimeout(searchPracticeTimeout);
    searchPracticeTimeout = setTimeout(() => {
        currentPracticePage = 1;
        loadPractices();
    }, 300);
}

// Cambiar página
function changePracticePage(page) {
    currentPracticePage = page;
    loadPractices();
}

// Ver prácticas disponibles (modal para practicantes)
async function loadAvailablePractices() {
    try {
        const response = await fetch(`${API_URL}/practices?estado=activa`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (response.ok) {
            const result = await response.json();
            renderAvailablePractices(result.data.practices);
            document.getElementById('availablePracticesModal').classList.add('show');
        }
    } catch (error) {
        console.error('Error loading available practices:', error);
        showToast('Error al cargar prácticas disponibles', 'error');
    }
}

// Renderizar prácticas disponibles
function renderAvailablePractices(practices) {
    const container = document.getElementById('availablePracticesList');
    
    const availablePractices = practices.filter(p => p.cupo_disponible > 0);
    
    if (availablePractices.length === 0) {
        container.innerHTML = '<div class="empty-state">No hay prácticas disponibles en este momento</div>';
        return;
    }

    container.innerHTML = availablePractices.map(practice => `
        <div class="dashboard-card" style="margin-bottom: 15px;">
            <div class="dashboard-card-header">
                <h4>${practice.nombre}</h4>
                <span class="status-badge">${practice.nivel_dificultad}</span>
            </div>
            <div class="dashboard-card-body">
                <p>${practice.descripcion}</p>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 10px;">
                    <small><strong>Tipo:</strong> ${practice.tipo_practica}</small>
                    <small><strong>Duración:</strong> ${practice.duracion_estimada_horas} hrs</small>
                    <small><strong>Maestro:</strong> ${practice.maestro_nombre}</small>
                    <small><strong>Cupo disponible:</strong> ${practice.cupo_disponible}</small>
                </div>
                ${practice.requisitos ? `<p style="margin-top: 10px;"><strong>Requisitos:</strong> ${practice.requisitos}</p>` : ''}
                <button class="btn btn-primary btn-sm" style="margin-top: 15px;" onclick="enrollInPractice(${practice.id})">
                    Inscribirse en esta Práctica
                </button>
            </div>
        </div>
    `).join('');
}

// Cerrar modal de prácticas disponibles
function closeAvailablePracticesModal() {
    document.getElementById('availablePracticesModal').classList.remove('show');
}

// Filtrar prácticas disponibles
function filterAvailablePractices() {
    const level = document.getElementById('filterAvailableLevel').value;
    const search = document.getElementById('searchAvailable').value.toLowerCase();
    
    const cards = document.querySelectorAll('#availablePracticesList .dashboard-card');
    
    cards.forEach(card => {
        const text = card.textContent.toLowerCase();
        const levelBadge = card.querySelector('.status-badge').textContent;
        
        const matchLevel = !level || levelBadge === level;
        const matchSearch = !search || text.includes(search);
        
        card.style.display = matchLevel && matchSearch ? 'block' : 'none';
    });
}

// ========== FUNCIONES DE RENDERIZADO ==========

// Renderizar tabla de prácticas
function renderPracticesTable(practices) {
    const tbody = document.getElementById('practicesTableBody');
    
    if (!tbody) return;
    
    if (!practices || practices.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" class="text-center">No se encontraron prácticas</td></tr>';
        return;
    }

    tbody.innerHTML = practices.map(practice => `
        <tr>
            <td>${practice.id}</td>
            <td>${practice.nombre}</td>
            <td>${practice.tipo_practica || 'N/A'}</td>
            <td><span class="status-badge">${practice.nivel_dificultad || 'básico'}</span></td>
            <td>${practice.duracion_estimada_horas || 1} hrs</td>
            <td>${practice.cupo_disponible || 0}/${practice.cupo_maximo || 10}</td>
            <td>
                <span class="status-badge status-${practice.estado === 'activa' ? 'active' : practice.estado}">
                    ${practice.estado}
                </span>
            </td>
            <td>
                <div class="quick-actions">
                    <button class="action-btn" onclick="viewPractice(${practice.id})" title="Ver detalles">👁️</button>
                    <button class="action-btn" onclick="viewPracticantes(${practice.id})" title="Ver practicantes">👥</button>
                    ${currentUser.tipo_usuario === 'maestro' ? `
                        <button class="action-btn" onclick="editPractice(${practice.id})" title="Editar">✏️</button>
                        <button class="action-btn" onclick="deletePractice(${practice.id})" title="Eliminar">🗑️</button>
                    ` : ''}
                    ${currentUser.tipo_usuario === 'practicante' && practice.cupo_disponible > 0 ? `
                        <button class="action-btn" onclick="enrollInPractice(${practice.id})" title="Inscribirse">➕</button>
                    ` : ''}
                </div>
            </td>
        </tr>
    `).join('');
}

// Renderizar paginación
function renderPracticesPagination(pagination) {
    const paginationDiv = document.getElementById('practicesPagination');
    if (!paginationDiv) return;
    
    paginationDiv.innerHTML = `
        <button onclick="changePracticePage(${pagination.page - 1})" ${pagination.page === 1 ? 'disabled' : ''}>
            ← Anterior
        </button>
        <span class="page-info">
            Página ${pagination.page} de ${pagination.totalPages}
        </span>
        <button onclick="changePracticePage(${pagination.page + 1})" ${pagination.page === pagination.totalPages ? 'disabled' : ''}>
            Siguiente →
        </button>
    `;
}

// Renderizar mis prácticas (practicante)
function renderMyPractices(practices) {
    const container = document.getElementById('myPracticesList');
    if (!container) return;

    if (!practices || practices.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">📚</div>
                <h4>No tienes prácticas asignadas</h4>
                <p>Explora las prácticas disponibles para inscribirte</p>
            </div>
        `;
        return;
    }

    container.innerHTML = practices.map(practice => `
        <div class="dashboard-card">
            <div class="dashboard-card-header">
                <h3>${practice.practica_nombre}</h3>
                <span class="status-badge status-${practice.estado_asignacion}">${practice.estado_asignacion}</span>
            </div>
            <div class="dashboard-card-body">
                <p><strong>Tipo:</strong> ${practice.tipo_practica || 'N/A'}</p>
                <p><strong>Nivel:</strong> ${practice.nivel_dificultad}</p>
                <p><strong>Maestro:</strong> ${practice.maestro_nombre}</p>
                <p><strong>Fecha de asignación:</strong> ${formatDate(practice.fecha_asignacion)}</p>
                ${practice.calificacion_maestro ? `<p><strong>Calificación:</strong> ${practice.calificacion_maestro}/10</p>` : ''}
                ${practice.observaciones ? `<p><strong>Observaciones:</strong> ${practice.observaciones}</p>` : ''}
                <div class="form-actions" style="margin-top: 15px;">
                    ${practice.estado_asignacion === 'asignado' ? `
                        <button class="btn btn-primary btn-sm" onclick="updateMyPracticeStatus(${practice.practica_id}, 'en_progreso')">
                            Iniciar Práctica
                        </button>
                    ` : ''}
                    ${practice.estado_asignacion === 'en_progreso' ? `
                        <button class="btn btn-success btn-sm" onclick="updateMyPracticeStatus(${practice.practica_id}, 'completado')">
                            Marcar como Completada
                        </button>
                    ` : ''}
                </div>
            </div>
        </div>
    `).join('');
}
