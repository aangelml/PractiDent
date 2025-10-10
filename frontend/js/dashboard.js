// Dashboard JavaScript - PractiDent (VERSIÓN CORREGIDA)
const API_URL = 'http://localhost:3000/api';

// Estado global
let currentUser = null;
let dashboardData = null;
let currentPage = 1;
let searchTimeout = null;

// Inicializar dashboard al cargar la página
document.addEventListener('DOMContentLoaded', async () => {
    // Verificar autenticación
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '/index.html';
        return;
    }

    // Cargar datos del usuario y dashboard
    await loadUserProfile();
    setupEventListeners();
    startNotificationPolling();
});

// Cargar perfil del usuario CORREGIDO
async function loadUserProfile() {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            console.error('No token found');
            window.location.href = '/index.html';
            return;
        }

        console.log('Cargando perfil con token...');
        
        const response = await fetch(`${API_URL}/auth/profile`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        console.log('Response status:', response.status);
        const result = await response.json();
        console.log('Profile response:', result);

        if (response.ok && result.success) {
            // Asegurarse de que tenemos los datos correctos
            currentUser = result.data?.user || result.data || {};
            
            // Verificar que tenemos los campos necesarios
            if (!currentUser.id && !currentUser.userId) {
                console.error('Usuario sin ID válido');
                // Intentar recuperar del localStorage
                const storedUser = localStorage.getItem('user');
                if (storedUser) {
                    const parsed = JSON.parse(storedUser);
                    currentUser = { ...parsed, ...currentUser };
                }
            }
            
            // Asegurarse de que el ID esté disponible
            if (!currentUser.userId) {
                currentUser.userId = currentUser.id;
            }
            
            console.log('Usuario actual:', currentUser);
            console.log('Teléfono recibido:', currentUser.telefono);
            
            // Actualizar localStorage con datos completos
            localStorage.setItem('user', JSON.stringify(currentUser));
            
            // Actualizar la interfaz
            updateUserInterface();
            
            // Cargar el dashboard después de tener el usuario
            await loadDashboard();
            
        } else if (response.status === 401) {
            console.log('Token expired, attempting refresh...');
            const refreshSuccess = await refreshToken();
            if (!refreshSuccess) {
                window.location.href = '/index.html';
            }
        } else {
            throw new Error(result.message || 'Error loading profile');
        }
    } catch (error) {
        console.error('Error loading profile:', error);
        showToast('Error al cargar el perfil', 'error');
        
        // Intentar usar datos del localStorage como fallback
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            try {
                currentUser = JSON.parse(storedUser);
                console.log('Usando usuario de localStorage:', currentUser);
                updateUserInterface();
                await loadDashboard();
            } catch (e) {
                console.error('Error parseando usuario de localStorage:', e);
                setTimeout(() => {
                    window.location.href = '/index.html';
                }, 2000);
            }
        } else {
            setTimeout(() => {
                window.location.href = '/index.html';
            }, 2000);
        }
    }
}

// Actualizar interfaz con datos del usuario (UNA SOLA VERSIÓN)
function updateUserInterface() {
    if (!currentUser) {
        console.error('No hay usuario actual');
        return;
    }
    
    console.log('Actualizando interfaz con:', currentUser);
    
    // Actualizar información del usuario en sidebar con validaciones
    const userNameElement = document.getElementById('userName');
    const userRoleElement = document.getElementById('userRole');
    const userInitialElement = document.getElementById('userInitial');
    
    if (userNameElement) {
        const fullName = `${currentUser.nombre || ''} ${currentUser.apellido || ''}`.trim();
        userNameElement.textContent = fullName || 'Usuario';
    }
    
    if (userRoleElement) {
        userRoleElement.textContent = currentUser.tipo_usuario || 'Sin rol';
    }
    
    if (userInitialElement) {
        const initial = currentUser.nombre ? currentUser.nombre[0].toUpperCase() : 'U';
        userInitialElement.textContent = initial;
    }

    // Mostrar secciones según el rol
    const userType = currentUser.tipo_usuario;
    
    // Ocultar todas las secciones específicas primero
    document.querySelectorAll('.practicante-only').forEach(el => {
        el.style.display = 'none';
    });
    document.querySelectorAll('.maestro-only').forEach(el => {
        el.style.display = 'none';
    });
    document.querySelectorAll('.paciente-only').forEach(el => {
        el.style.display = 'none';
    });
    
    // Mostrar secciones según el tipo de usuario
    if (userType === 'practicante') {
        document.querySelectorAll('.practicante-only').forEach(el => {
            el.style.display = 'block';
        });
    } else if (userType === 'maestro') {
        document.querySelectorAll('.maestro-only').forEach(el => {
            el.style.display = 'block';
        });
    } else if (userType === 'paciente') {
        document.querySelectorAll('.paciente-only').forEach(el => {
            el.style.display = 'block';
        });
    }

    // Actualizar formulario de perfil si existe
    if (document.getElementById('profileNombre')) {
        document.getElementById('profileNombre').value = currentUser.nombre || '';
        document.getElementById('profileApellido').value = currentUser.apellido || '';
        document.getElementById('profileEmail').value = currentUser.email || '';
        
        const telefonoField = document.getElementById('profileTelefono');
        if (telefonoField) {
            telefonoField.value = currentUser.telefono || '';
            console.log('Campo teléfono actualizado a:', currentUser.telefono || 'vacío');
        }
    }
}

// Función para refrescar el token
async function refreshToken() {
    try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) {
            console.error('No refresh token found');
            return false;
        }

        const response = await fetch(`${API_URL}/auth/refresh`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ refreshToken })
        });

        if (response.ok) {
            const data = await response.json();
            localStorage.setItem('token', data.data.token);
            localStorage.setItem('refreshToken', data.data.refreshToken);
            console.log('Token refreshed successfully');
            return true;
        } else {
            console.error('Failed to refresh token');
            return false;
        }
    } catch (error) {
        console.error('Error refreshing token:', error);
        return false;
    }
}

// Cargar dashboard principal (UNA SOLA VERSIÓN)
async function loadDashboard() {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            console.error('No token found for dashboard');
            renderEmptyDashboard();
            return;
        }

        const response = await fetch(`${API_URL}/dashboard`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            const result = await response.json();
            dashboardData = result.data || result;
            renderDashboard();
        } else {
            console.error('Dashboard response not ok:', response.status);
            renderEmptyDashboard();
        }
    } catch (error) {
        console.error('Error loading dashboard:', error);
        showToast('Error al cargar el dashboard', 'error');
        renderEmptyDashboard();
    }
}

// Función para mostrar dashboard vacío
function renderEmptyDashboard() {
    const statsGrid = document.getElementById('statsGrid');
    const dashboardContent = document.getElementById('dashboardContent');
    
    if (statsGrid) {
        statsGrid.innerHTML = `
            <div class="stat-card">
                <div class="stat-value">0</div>
                <div class="stat-label">Total de Citas</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">0</div>
                <div class="stat-label">Citas Pendientes</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">0</div>
                <div class="stat-label">Citas Completadas</div>
            </div>
        `;
    }
    
    if (dashboardContent) {
        dashboardContent.innerHTML = `
            <div class="dashboard-card">
                <div class="dashboard-card-header">
                    <h3>Bienvenido</h3>
                </div>
                <div class="dashboard-card-body">
                    <p>No hay datos disponibles en este momento.</p>
                </div>
            </div>
        `;
    }
}

// Renderizar dashboard según el tipo de usuario
function renderDashboard() {
    const statsGrid = document.getElementById('statsGrid');
    const dashboardContent = document.getElementById('dashboardContent');
    
    if (!statsGrid || !dashboardContent) {
        console.error('Elementos del dashboard no encontrados');
        return;
    }
    
    statsGrid.innerHTML = '';
    dashboardContent.innerHTML = '';

    switch (currentUser.tipo_usuario) {
        case 'practicante':
            renderPracticanteDashboard();
            break;
        case 'maestro':
            renderMaestroDashboard();
            break;
        case 'paciente':
            renderPacienteDashboard();
            break;
        default:
            renderEmptyDashboard();
    }
}

// Dashboard del Practicante
function renderPracticanteDashboard() {
    const stats = dashboardData.estadisticas || {};
    
    // Tarjetas de estadísticas
    document.getElementById('statsGrid').innerHTML = `
        <div class="stat-card">
            <div class="stat-card-header">
                <span class="stat-icon">📅</span>
            </div>
            <div class="stat-value">${stats.total_citas || 0}</div>
            <div class="stat-label">Total de Citas</div>
        </div>
        <div class="stat-card">
            <div class="stat-card-header">
                <span class="stat-icon">⏳</span>
            </div>
            <div class="stat-value">${stats.citas_pendientes || 0}</div>
            <div class="stat-label">Citas Pendientes</div>
        </div>
        <div class="stat-card">
            <div class="stat-card-header">
                <span class="stat-icon">✅</span>
            </div>
            <div class="stat-value">${stats.citas_completadas || 0}</div>
            <div class="stat-label">Citas Completadas</div>
        </div>
        <div class="stat-card">
            <div class="stat-card-header">
                <span class="stat-icon">⭐</span>
            </div>
            <div class="stat-value">${stats.promedio_evaluaciones ? stats.promedio_evaluaciones.toFixed(1) : 'N/A'}</div>
            <div class="stat-label">Calificación Promedio</div>
        </div>
    `;

    // Contenido del dashboard
    document.getElementById('dashboardContent').innerHTML = `
        <div class="dashboard-card">
            <div class="dashboard-card-header">
                <h3>📅 Próximas Citas</h3>
            </div>
            <div class="dashboard-card-body">
                ${renderProximasCitas(dashboardData.proximasCitas)}
            </div>
        </div>
        <div class="dashboard-card">
            <div class="dashboard-card-header">
                <h3>⭐ Evaluaciones Recientes</h3>
            </div>
            <div class="dashboard-card-body">
                ${renderEvaluacionesRecientes(dashboardData.evaluacionesRecientes)}
            </div>
        </div>
    `;
}

// Dashboard del Maestro
function renderMaestroDashboard() {
    const stats = dashboardData.estadisticas || {};
    
    // Tarjetas de estadísticas
    document.getElementById('statsGrid').innerHTML = `
        <div class="stat-card">
            <div class="stat-card-header">
                <span class="stat-icon">👥</span>
            </div>
            <div class="stat-value">${stats.total_estudiantes || 0}</div>
            <div class="stat-label">Estudiantes Asignados</div>
        </div>
        <div class="stat-card">
            <div class="stat-card-header">
                <span class="stat-icon">📚</span>
            </div>
            <div class="stat-value">${stats.total_practicas || 0}</div>
            <div class="stat-label">Total de Prácticas</div>
        </div>
        <div class="stat-card">
            <div class="stat-card-header">
                <span class="stat-icon">🎯</span>
            </div>
            <div class="stat-value">${stats.practicas_activas || 0}</div>
            <div class="stat-label">Prácticas Activas</div>
        </div>
        <div class="stat-card">
            <div class="stat-card-header">
                <span class="stat-icon">📝</span>
            </div>
            <div class="stat-value">${stats.evaluaciones_realizadas || 0}</div>
            <div class="stat-label">Evaluaciones Realizadas</div>
        </div>
    `;

    // Contenido del dashboard
    document.getElementById('dashboardContent').innerHTML = `
        <div class="dashboard-card">
            <div class="dashboard-card-header">
                <h3>👥 Estudiantes Asignados</h3>
            </div>
            <div class="dashboard-card-body">
                ${renderEstudiantes(dashboardData.estudiantes)}
            </div>
        </div>
        <div class="dashboard-card">
            <div class="dashboard-card-header">
                <h3>📚 Prácticas Activas</h3>
            </div>
            <div class="dashboard-card-body">
                ${renderPracticasActivas(dashboardData.practicasActivas)}
            </div>
        </div>
    `;
}

// Dashboard del Paciente
function renderPacienteDashboard() {
    const stats = dashboardData.estadisticas || {};
    
    // Tarjetas de estadísticas
    document.getElementById('statsGrid').innerHTML = `
        <div class="stat-card">
            <div class="stat-card-header">
                <span class="stat-icon">📅</span>
            </div>
            <div class="stat-value">${stats.total_citas || 0}</div>
            <div class="stat-label">Total de Citas</div>
        </div>
        <div class="stat-card">
            <div class="stat-card-header">
                <span class="stat-icon">⏳</span>
            </div>
            <div class="stat-value">${stats.citas_pendientes || 0}</div>
            <div class="stat-label">Citas Pendientes</div>
        </div>
        <div class="stat-card">
            <div class="stat-card-header">
                <span class="stat-icon">✅</span>
            </div>
            <div class="stat-value">${stats.citas_completadas || 0}</div>
            <div class="stat-label">Citas Completadas</div>
        </div>
        <div class="stat-card">
            <div class="stat-card-header">
                <span class="stat-icon">⭐</span>
            </div>
            <div class="stat-value">${stats.evaluaciones_dadas || 0}</div>
            <div class="stat-label">Evaluaciones Realizadas</div>
        </div>
    `;

    // Contenido del dashboard
    document.getElementById('dashboardContent').innerHTML = `
        <div class="dashboard-card">
            <div class="dashboard-card-header">
                <h3>📅 Próximas Citas</h3>
            </div>
            <div class="dashboard-card-body">
                ${renderProximasCitasPaciente(dashboardData.proximasCitas)}
            </div>
        </div>
        <div class="dashboard-card">
            <div class="dashboard-card-header">
                <h3>📋 Historial de Citas</h3>
            </div>
            <div class="dashboard-card-body">
                ${renderHistorialCitas(dashboardData.historialCitas)}
            </div>
        </div>
    `;
}

// Funciones de renderizado auxiliares
function renderProximasCitas(citas) {
    if (!citas || citas.length === 0) {
        return '<div class="empty-state"><p>No hay citas próximas</p></div>';
    }
    
    return `
        <table class="data-table">
            <thead>
                <tr>
                    <th>Fecha</th>
                    <th>Hora</th>
                    <th>Paciente</th>
                    <th>Estado</th>
                </tr>
            </thead>
            <tbody>
                ${citas.map(cita => `
                    <tr>
                        <td>${formatDate(cita.fecha)}</td>
                        <td>${cita.hora_inicio}</td>
                        <td>${cita.paciente_nombre} ${cita.paciente_apellido}</td>
                        <td><span class="status-badge status-${cita.estado}">${cita.estado}</span></td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

function renderEvaluacionesRecientes(evaluaciones) {
    if (!evaluaciones || evaluaciones.length === 0) {
        return '<div class="empty-state"><p>No hay evaluaciones recientes</p></div>';
    }
    
    return evaluaciones.map(evaluaciones => `
        <div style="padding: 10px; border-bottom: 1px solid #e5e7eb;">
            <div style="display: flex; justify-content: space-between;">
                <strong>${eval.evaluador_nombre}</strong>
                <span>⭐ ${eval.calificacion}/5</span>
            </div>
            <p style="color: #6b7280; margin-top: 5px;">${eval.comentarios || 'Sin comentarios'}</p>
            <small style="color: #9ca3af;">${formatDate(eval.fecha_evaluacion)}</small>
        </div>
    `).join('');
}

function renderEstudiantes(estudiantes) {
    if (!estudiantes || estudiantes.length === 0) {
        return '<div class="empty-state"><p>No hay estudiantes asignados</p></div>';
    }
    
    return `
        <table class="data-table">
            <thead>
                <tr>
                    <th>Nombre</th>
                    <th>Email</th>
                    <th>Semestre</th>
                    <th>Grupo</th>
                </tr>
            </thead>
            <tbody>
                ${estudiantes.map(est => `
                    <tr>
                        <td>${est.nombre} ${est.apellido}</td>
                        <td>${est.email}</td>
                        <td>${est.semestre}°</td>
                        <td>${est.grupo}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

function renderPracticasActivas(practicas) {
    if (!practicas || practicas.length === 0) {
        return '<div class="empty-state"><p>No hay prácticas activas</p></div>';
    }
    
    return practicas.map(practica => `
        <div style="padding: 10px; border-bottom: 1px solid #e5e7eb;">
            <strong>${practica.nombre}</strong>
            <p style="color: #6b7280; margin-top: 5px;">${practica.descripcion}</p>
            <div style="display: flex; justify-content: space-between; margin-top: 10px;">
                <small>👥 ${practica.num_practicantes} practicantes</small>
                <small>📅 ${formatDate(practica.fecha_inicio)}</small>
            </div>
        </div>
    `).join('');
}

function renderProximasCitasPaciente(citas) {
    if (!citas || citas.length === 0) {
        return '<div class="empty-state"><p>No hay citas próximas</p></div>';
    }
    
    return `
        <table class="data-table">
            <thead>
                <tr>
                    <th>Fecha</th>
                    <th>Hora</th>
                    <th>Practicante</th>
                    <th>Práctica</th>
                </tr>
            </thead>
            <tbody>
                ${citas.map(cita => `
                    <tr>
                        <td>${formatDate(cita.fecha)}</td>
                        <td>${cita.hora_inicio}</td>
                        <td>${cita.practicante_nombre} ${cita.practicante_apellido}</td>
                        <td>${cita.practica_nombre || 'N/A'}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

function renderHistorialCitas(citas) {
    if (!citas || citas.length === 0) {
        return '<div class="empty-state"><p>No hay citas en el historial</p></div>';
    }
    
    return citas.map(cita => `
        <div style="padding: 10px; border-bottom: 1px solid #e5e7eb;">
            <div style="display: flex; justify-content: space-between;">
                <strong>${formatDate(cita.fecha)}</strong>
                ${cita.calificacion ? `<span>⭐ ${cita.calificacion}/5</span>` : ''}
            </div>
            <p style="color: #6b7280; margin-top: 5px;">
                Dr. ${cita.practicante_nombre} ${cita.practicante_apellido} - ${cita.practica_nombre || 'Consulta general'}
            </p>
            ${cita.evaluacion_comentarios ? `<p style="color: #9ca3af; font-size: 14px; margin-top: 5px;">${cita.evaluacion_comentarios}</p>` : ''}
        </div>
    `).join('');
}

// Gestión de Usuarios (Solo Maestros)
async function loadUsers() {
    if (currentUser.tipo_usuario !== 'maestro') return;

    const tipoUsuario = document.getElementById('filterTipoUsuario').value;
    const search = document.getElementById('searchUser').value;
    const activo = document.getElementById('filterActivo').value;

    try {
        const params = new URLSearchParams({
            page: currentPage,
            limit: 10
        });

        if (tipoUsuario) params.append('tipo_usuario', tipoUsuario);
        if (search) params.append('search', search);
        if (activo) params.append('activo', activo);

        const response = await fetch(`${API_URL}/users?${params}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (response.ok) {
            const data = await response.json();
            renderUsersTable(data.users);
            renderPagination(data.pagination);
        }
    } catch (error) {
        console.error('Error loading users:', error);
        showToast('Error al cargar usuarios', 'error');
    }
}

function renderUsersTable(users) {
    const tbody = document.getElementById('usersTableBody');
    
    if (!users || users.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" class="text-center">No se encontraron usuarios</td></tr>';
        return;
    }

    tbody.innerHTML = users.map(user => `
        <tr>
            <td>${user.id}</td>
            <td>${user.nombre} ${user.apellido}</td>
            <td>${user.email}</td>
            <td>${user.telefono || 'N/A'}</td>
            <td><span class="status-badge">${user.tipo_usuario}</span></td>
            <td>
                <span class="status-badge status-${user.activo ? 'active' : 'inactive'}">
                    ${user.activo ? 'Activo' : 'Inactivo'}
                </span>
            </td>
            <td>${user.last_login ? formatDateTime(user.last_login) : 'Nunca'}</td>
            <td>
                <div class="quick-actions">
                    <button class="action-btn" onclick="editUser(${user.id})" title="Editar">✏️</button>
                    <button class="action-btn" onclick="toggleUserStatus(${user.id}, ${!user.activo})" title="${user.activo ? 'Desactivar' : 'Activar'}">
                        ${user.activo ? '🔒' : '🔓'}
                    </button>
                    <button class="action-btn" onclick="resetPassword(${user.id})" title="Resetear contraseña">🔑</button>
                    <button class="action-btn" onclick="deleteUser(${user.id})" title="Eliminar">🗑️</button>
                </div>
            </td>
        </tr>
    `).join('');
}

function renderPagination(pagination) {
    const paginationDiv = document.getElementById('usersPagination');
    
    paginationDiv.innerHTML = `
        <button onclick="changePage(${pagination.page - 1})" ${pagination.page === 1 ? 'disabled' : ''}>
            ← Anterior
        </button>
        <span class="page-info">
            Página ${pagination.page} de ${pagination.totalPages}
        </span>
        <button onclick="changePage(${pagination.page + 1})" ${pagination.page === pagination.totalPages ? 'disabled' : ''}>
            Siguiente →
        </button>
    `;
}

function changePage(page) {
    currentPage = page;
    loadUsers();
}

function searchUsers() {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
        currentPage = 1;
        loadUsers();
    }, 300);
}

// Manejo del perfil
document.getElementById('profileForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Verificar que tengamos el ID del usuario
    const userId = currentUser?.id || currentUser?.userId;
    if (!userId) {
        showToast('Error: No se pudo identificar el usuario', 'error');
        return;
    }
    
    const profileData = {
        nombre: document.getElementById('profileNombre').value,
        apellido: document.getElementById('profileApellido').value,
        telefono: document.getElementById('profileTelefono').value
    };
    
    try {
        const response = await fetch(`${API_URL}/users/${userId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify(profileData)
        });

        const result = await response.json();
        
        if (response.ok && result.success) {
            showToast('Perfil actualizado exitosamente', 'success');
            
            // Actualizar datos locales
            currentUser.nombre = profileData.nombre;
            currentUser.apellido = profileData.apellido;
            currentUser.telefono = profileData.telefono;
            
            // Actualizar localStorage
            localStorage.setItem('user', JSON.stringify(currentUser));
            
            // Actualizar interfaz
            updateUserInterface();
            
            // Recargar perfil del servidor
            await loadUserProfile();
        } else {
            showToast(result.message || 'Error al actualizar perfil', 'error');
        }
    } catch (error) {
        console.error('Error updating profile:', error);
        showToast('Error al actualizar perfil', 'error');
    }
});

// Cambio de contraseña
document.getElementById('passwordForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    
    if (newPassword !== confirmPassword) {
        showToast('Las contraseñas no coinciden', 'error');
        return;
    }
    
    if (!validatePassword(newPassword)) {
        showToast('La nueva contraseña no cumple con los requisitos', 'error');
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/auth/change-password`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ currentPassword, newPassword })
        });

        if (response.ok) {
            showToast('Contraseña actualizada exitosamente', 'success');
            document.getElementById('passwordForm').reset();
        } else {
            const error = await response.json();
            showToast(error.message || 'Error al cambiar contraseña', 'error');
        }
    } catch (error) {
        console.error('Error changing password:', error);
        showToast('Error al cambiar contraseña', 'error');
    }
});

// Navegación
function setupEventListeners() {
    // Navegación del sidebar
    document.querySelectorAll('.nav-link[data-section]').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const section = link.dataset.section;
            navigateToSection(section);
        });
    });
}

function navigateToSection(sectionId) {
    // Ocultar todas las secciones
    document.querySelectorAll('.content-section').forEach(section => {
        section.style.display = 'none';
    });
    
    // Mostrar sección seleccionada
    const section = document.getElementById(sectionId);
    if (section) {
        section.style.display = 'block';
        
        // Actualizar título
        const link = document.querySelector(`[data-section="${sectionId}"]`);
        if (link) {
            document.getElementById('sectionTitle').textContent = link.textContent.trim();
            
            // Actualizar link activo
            document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
            link.classList.add('active');
        }
        
        // Cargar datos si es necesario
        if (sectionId === 'usuarios' && currentUser.tipo_usuario === 'maestro') {
            loadUsers();
        } else if (sectionId === 'practicas') {
            loadPractices();
        } else if (sectionId === 'mis-practicas' && currentUser.tipo_usuario === 'practicante') {
            loadMyPractices();
        }
    }
}

// Notificaciones
async function loadNotifications() {
    try {
        const response = await fetch(`${API_URL}/dashboard/notifications`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (response.ok) {
            const result = await response.json();
            const notifications = result.data || [];
            renderNotifications(notifications);
        }
    } catch (error) {
        console.error('Error loading notifications:', error);
    }
}

function renderNotifications(notifications) {
    const notificationsList = document.getElementById('notificationsList');
    const badge = document.getElementById('notificationBadge');
    
    if (!notifications || notifications.length === 0) {
        notificationsList.innerHTML = '<p class="no-notifications">No hay notificaciones nuevas</p>';
        badge.style.display = 'none';
    } else {
        badge.style.display = 'block';
        badge.textContent = notifications.length;
        
        notificationsList.innerHTML = notifications.map(notif => `
            <div class="notification-item">
                <strong>${getNotificationTitle(notif.tipo)}</strong>
                <p>${getNotificationMessage(notif)}</p>
            </div>
        `).join('');
    }
}

function getNotificationTitle(tipo) {
    const titles = {
        'nueva_cita': '📅 Nueva Cita',
        'supervision_requerida': '👁️ Supervisión Requerida',
        'recordatorio_cita': '⏰ Recordatorio de Cita'
    };
    return titles[tipo] || '📢 Notificación';
}

function getNotificationMessage(notif) {
    switch(notif.tipo) {
        case 'nueva_cita':
            return `Cita con ${notif.paciente_nombre} el ${formatDate(notif.fecha)}`;
        case 'supervision_requerida':
            return `${notif.citas_pendientes} citas pendientes en ${notif.nombre}`;
        case 'recordatorio_cita':
            return `Cita con Dr. ${notif.practicante_nombre} el ${formatDate(notif.fecha)} a las ${notif.hora_inicio}`;
        default:
            return 'Nueva notificación';
    }
}

function toggleNotifications() {
    const dropdown = document.getElementById('notificationsDropdown');
    dropdown.classList.toggle('show');
    
    if (dropdown.classList.contains('show')) {
        loadNotifications();
    }
}

function startNotificationPolling() {
    loadNotifications();
    setInterval(loadNotifications, 60000); // Actualizar cada minuto
}

// Funciones de UI
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const mainContent = document.querySelector('.main-content');
    
    sidebar.classList.toggle('collapsed');
    sidebar.classList.toggle('show');
    mainContent.classList.toggle('sidebar-collapsed');
}

function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    const icons = {
        success: '✅',
        error: '❌',
        warning: '⚠️',
        info: 'ℹ️'
    };
    
    toast.innerHTML = `
        <span>${icons[type]}</span>
        <span>${message}</span>
    `;
    
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.remove();
    }, 3000);
}

// Utilidades
function formatDate(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

function formatDateTime(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString('es-ES', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function validatePassword(password) {
    const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return regex.test(password);
}

// Cerrar sesión
async function logout() {
    try {
        await fetch(`${API_URL}/auth/logout`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
    } catch (error) {
        console.error('Error during logout:', error);
    } finally {
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        localStorage.removeItem('userType');
        window.location.href = '/index.html';
    }
}

// Cerrar dropdown al hacer clic fuera
document.addEventListener('click', (e) => {
    const dropdown = document.getElementById('notificationsDropdown');
    const icon = document.querySelector('.notifications-icon');
    
    if (icon && dropdown && !icon.contains(e.target) && !dropdown.contains(e.target)) {
        dropdown.classList.remove('show');
    }
});

// Modal de Usuario
function showCreateUserModal() {
    document.getElementById('userModalTitle').textContent = 'Nuevo Usuario';
    document.getElementById('userId').value = '';
    document.getElementById('userForm').reset();
    document.getElementById('passwordGroup').style.display = 'block';
    document.getElementById('userPassword').required = true;
    document.getElementById('userModal').classList.add('show');
    loadAvailableMaestros();
}

async function editUser(userId) {
    try {
        const response = await fetch(`${API_URL}/users/${userId}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (response.ok) {
            const result = await response.json();
            const user = result.success ? result.data : result;
            
            document.getElementById('userModalTitle').textContent = 'Editar Usuario';
            document.getElementById('userId').value = user.id;
            document.getElementById('userNombre').value = user.nombre;
            document.getElementById('userApellido').value = user.apellido;
            document.getElementById('userEmail').value = user.email;
            document.getElementById('userTelefono').value = user.telefono || '';
            document.getElementById('userTipo').value = user.tipo_usuario;
            document.getElementById('userTipo').disabled = true;
            document.getElementById('passwordGroup').style.display = 'none';
            document.getElementById('userPassword').required = false;
            
            // Mostrar campos específicos
            showUserTypeFields();
            
            // Llenar campos específicos si existen
            if (user.detalles_especificos) {
                fillTypeSpecificFields(user.tipo_usuario, user.detalles_especificos);
            }
            
            document.getElementById('userModal').classList.add('show');
        }
    } catch (error) {
        console.error('Error loading user:', error);
        showToast('Error al cargar usuario', 'error');
    }
}

function fillTypeSpecificFields(tipo, detalles) {
    if (tipo === 'practicante') {
        document.getElementById('practicanteMatricula').value = detalles.matricula || '';
        document.getElementById('practicanteSemestre').value = detalles.semestre || '';
        document.getElementById('practicanteTurno').value = detalles.turno || 'matutino';
        document.getElementById('practicanteMaestro').value = detalles.maestro_asignado || '';
    } else if (tipo === 'maestro') {
        document.getElementById('maestroCedula').value = detalles.cedula_profesional || '';
        document.getElementById('maestroEspecialidad').value = detalles.especialidad || '';
        document.getElementById('maestroExperiencia').value = detalles.anos_experiencia || '';
    } else if (tipo === 'paciente') {
        document.getElementById('pacienteFechaNacimiento').value = detalles.fecha_nacimiento || '';
        document.getElementById('pacienteDireccion').value = detalles.direccion || '';
        document.getElementById('pacienteHistorial').value = detalles.historial_medico || '';
    }
}

function closeUserModal() {
    document.getElementById('userModal').classList.remove('show');
    document.getElementById('userTipo').disabled = false;
}

function showUserTypeFields() {
    const tipo = document.getElementById('userTipo').value;
    
    // Ocultar todos los campos específicos
    document.querySelectorAll('.type-fields').forEach(el => el.style.display = 'none');
    
    // Mostrar campos del tipo seleccionado
    if (tipo) {
        const fieldsDiv = document.getElementById(`${tipo}Fields`);
        if (fieldsDiv) {
            fieldsDiv.style.display = 'block';
            
            if (tipo === 'practicante') {
                loadAvailableMaestros();
            }
        }
    }
}

async function loadAvailableMaestros() {
    try {
        const response = await fetch(`${API_URL}/users/maestros`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (response.ok) {
            const result = await response.json();
            const maestros = result.success ? result.data : result;
            const select = document.getElementById('practicanteMaestro');
            
            if (select) {
                select.innerHTML = '<option value="">Seleccione...</option>' +
                    maestros.map(m => `
                        <option value="${m.id}">
                            ${m.nombre} ${m.apellido} - ${m.especialidad || 'General'}
                        </option>
                    `).join('');
            }
        }
    } catch (error) {
        console.error('Error loading maestros:', error);
    }
}

// Guardar usuario
document.getElementById('userForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const userId = document.getElementById('userId').value;
    const isEdit = !!userId;
    
    const userData = {
        nombre: document.getElementById('userNombre').value,
        apellido: document.getElementById('userApellido').value,
        email: document.getElementById('userEmail').value,
        telefono: document.getElementById('userTelefono').value,
        tipo_usuario: document.getElementById('userTipo').value
    };
    
    if (!isEdit) {
        userData.password = document.getElementById('userPassword').value;
    }
    
    // Agregar detalles específicos según el tipo
    if (userData.tipo_usuario === 'practicante') {
        userData.matricula = document.getElementById('practicanteMatricula').value;
        userData.semestre = document.getElementById('practicanteSemestre').value;
        userData.turno = document.getElementById('practicanteTurno').value || 'matutino';
    } else if (userData.tipo_usuario === 'maestro') {
        userData.cedula_profesional = document.getElementById('maestroCedula').value;
        userData.especialidad = document.getElementById('maestroEspecialidad').value;
        userData.anos_experiencia = document.getElementById('maestroExperiencia').value;
    } else if (userData.tipo_usuario === 'paciente') {
        userData.fecha_nacimiento = document.getElementById('pacienteFechaNacimiento').value;
        userData.direccion = document.getElementById('pacienteDireccion').value;
    }
    
    try {
        const url = isEdit ? `${API_URL}/users/${userId}` : `${API_URL}/auth/register`;
        const response = await fetch(url, {
            method: isEdit ? 'PUT' : 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify(userData)
        });

        if (response.ok) {
            showToast(`Usuario ${isEdit ? 'actualizado' : 'creado'} exitosamente`, 'success');
            closeUserModal();
            loadUsers();
        } else {
            const error = await response.json();
            showToast(error.message || 'Error al guardar usuario', 'error');
        }
    } catch (error) {
        console.error('Error saving user:', error);
        showToast('Error al guardar usuario', 'error');
    }
});

// Acciones de usuario
async function toggleUserStatus(userId, activo) {
    if (!confirm(`¿Estás seguro de ${activo ? 'activar' : 'desactivar'} este usuario?`)) return;
    
    try {
        const response = await fetch(`${API_URL}/users/${userId}/status`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ activo })
        });

        if (response.ok) {
            showToast(`Usuario ${activo ? 'activado' : 'desactivado'} exitosamente`, 'success');
            loadUsers();
        }
    } catch (error) {
        console.error('Error toggling user status:', error);
        showToast('Error al cambiar estado del usuario', 'error');
    }
}

async function resetPassword(userId) {
    const newPassword = prompt('Ingresa la nueva contraseña (mín. 8 caracteres, con mayúscula, minúscula, número y símbolo):');
    
    if (!newPassword) return;
    
    if (!validatePassword(newPassword)) {
        showToast('La contraseña no cumple con los requisitos', 'error');
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/users/${userId}/reset-password`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ newPassword })
        });

        if (response.ok) {
            showToast('Contraseña restablecida exitosamente', 'success');
        }
    } catch (error) {
        console.error('Error resetting password:', error);
        showToast('Error al restablecer contraseña', 'error');
    }
}

async function deleteUser(userId) {
    if (!confirm('¿Estás seguro de eliminar este usuario? Esta acción no se puede deshacer.')) return;
    
    try {
        const response = await fetch(`${API_URL}/users/${userId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (response.ok) {
            showToast('Usuario eliminado exitosamente', 'success');
            loadUsers();
        }
    } catch (error) {
        console.error('Error deleting user:', error);
        showToast('Error al eliminar usuario', 'error');
    }
}

// Función auxiliar para cargar mis prácticas (practicantes)
async function loadMyPractices() {
    try {
        const response = await fetch(`${API_URL}/practices/my-practices`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (response.ok) {
            const result = await response.json();
            renderMyPractices(result.data);
            updatePracticeStats(result.data);
        }
    } catch (error) {
        console.error('Error loading my practices:', error);
        showToast('Error al cargar tus prácticas', 'error');
    }
}