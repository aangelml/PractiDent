// frontend/js/app.js - Versión Mejorada con Dashboard
console.log('PractiDent App iniciada');

// URL del API - IMPORTANTE: Puerto 3000
const API_URL = 'http://localhost:3000/api';

// Verificar conexión con el API (versión minimalista)
async function checkAPI() {
    const statusBar = document.querySelector('.status-bar');
    const statusDot = document.querySelector('.status-dot');
    const statusText = document.querySelector('.status-text');
    
    try {
        const response = await fetch(`${API_URL}/health`);
        const data = await response.json();
        
        if (response.ok && data.status === 'ok') {
            statusBar.classList.remove('error');
            statusText.textContent = 'Sistema operativo';
            statusDot.style.background = '#10b981';
        } else {
            throw new Error('Sistema no disponible');
        }
    } catch (error) {
        console.error('Error:', error);
        statusBar.classList.add('error');
        statusText.textContent = 'Sin conexión';
        statusDot.style.background = '#ef4444';
    }
}

// Función para scroll suave a features
window.scrollToFeatures = function() {
    document.getElementById('features').scrollIntoView({ 
        behavior: 'smooth' 
    });
}

// Función para mostrar modal de login
function showLoginModal() {
    closeModal();
    
    const modalHTML = `
        <div id="modal" class="modal">
            <div class="modal-content">
                <span class="close" onclick="closeModal()">&times;</span>
                <h2>🔐 Iniciar Sesión</h2>
                <form id="loginForm">
                    <div class="form-group">
                        <label for="email">Correo Electrónico</label>
                        <input type="email" id="email" name="email" required placeholder="tu@email.com">
                    </div>
                    <div class="form-group">
                        <label for="password">Contraseña</label>
                        <input type="password" id="password" name="password" required placeholder="••••••••">
                    </div>
                    <button type="submit" class="btn-submit">Iniciar Sesión</button>
                </form>
                <div id="login-message" style="margin-top: 1rem; text-align: center;"></div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    document.getElementById('loginForm').addEventListener('submit', handleLogin);
}

// Función para mostrar modal de registro
function showRegisterModal() {
    closeModal();
    
    const modalHTML = `
        <div id="modal" class="modal">
            <div class="modal-content">
                <span class="close" onclick="closeModal()">&times;</span>
                <h2>📝 Crear Cuenta</h2>
                <form id="registerForm">
                    <div class="form-row">
                        <div class="form-group">
                            <label for="nombre">Nombre</label>
                            <input type="text" id="nombre" name="nombre" required placeholder="Juan">
                        </div>
                        <div class="form-group">
                            <label for="apellido">Apellido</label>
                            <input type="text" id="apellido" name="apellido" required placeholder="Pérez">
                        </div>
                    </div>
                    <div class="form-group">
                        <label for="email">Correo Electrónico</label>
                        <input type="email" id="regEmail" name="email" required placeholder="tu@email.com">
                    </div>
                    <div class="form-group">
                        <label for="telefono">Teléfono</label>
                        <input type="tel" id="telefono" name="telefono" placeholder="2281234567">
                    </div>
                    <div class="form-group">
                        <label for="password">Contraseña</label>
                        <input type="password" id="regPassword" name="password" required placeholder="••••••••">
                        <small>Mín. 8 caracteres, incluir mayúsculas, minúsculas, números y símbolos</small>
                    </div>
                    <div class="form-group">
                        <label for="tipo_usuario">Tipo de Usuario</label>
                        <select id="tipo_usuario" name="tipo_usuario" required onchange="showExtraFields(this.value)">
                            <option value="">Seleccione...</option>
                            <option value="practicante">Practicante (Estudiante)</option>
                            <option value="maestro">Maestro (Supervisor)</option>
                            <option value="paciente">Paciente</option>
                        </select>
                    </div>
                    <div id="extraFields"></div>
                    <button type="submit" class="btn-submit">Crear Cuenta</button>
                </form>
                <div id="register-message" style="margin-top: 1rem; text-align: center;"></div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    document.getElementById('registerForm').addEventListener('submit', handleRegister);
}

// Mostrar campos adicionales según tipo de usuario
function showExtraFields(tipo) {
    const container = document.getElementById('extraFields');
    let html = '';
    
    switch(tipo) {
        case 'practicante':
            html = `
                <div class="form-group">
                    <label for="matricula">Matrícula</label>
                    <input type="text" id="matricula" name="matricula" required placeholder="A123456">
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label for="semestre">Semestre</label>
                        <input type="number" id="semestre" name="semestre" min="1" max="12" required placeholder="8">
                    </div>
                    <div class="form-group">
                        <label for="grupo">Grupo</label>
                        <input type="text" id="grupo" name="grupo" required placeholder="A">
                    </div>
                </div>
            `;
            break;
        case 'maestro':
            html = `
                <div class="form-group">
                    <label for="cedula_profesional">Cédula Profesional</label>
                    <input type="text" id="cedula_profesional" name="cedula_profesional" required placeholder="1234567">
                </div>
                <div class="form-group">
                    <label for="especialidad">Especialidad</label>
                    <input type="text" id="especialidad" name="especialidad" required placeholder="Ortodoncia">
                </div>
                <div class="form-group">
                    <label for="experiencia_anios">Años de Experiencia</label>
                    <input type="number" id="experiencia_anios" name="experiencia_anios" min="0" required placeholder="5">
                </div>
            `;
            break;
        case 'paciente':
            html = `
                <div class="form-group">
                    <label for="fecha_nacimiento">Fecha de Nacimiento</label>
                    <input type="date" id="fecha_nacimiento" name="fecha_nacimiento" required>
                </div>
                <div class="form-group">
                    <label for="direccion">Dirección</label>
                    <textarea id="direccion" name="direccion" rows="2" placeholder="Calle, Número, Colonia"></textarea>
                </div>
            `;
            break;
    }
    
    // Animación suave al mostrar campos
    container.style.opacity = '0';
    container.innerHTML = html;
    setTimeout(() => {
        container.style.transition = 'opacity 0.3s ease';
        container.style.opacity = '1';
    }, 10);
}

// Cerrar modal
function closeModal() {
    const modal = document.getElementById('modal');
    if (modal) {
        modal.style.animation = 'fadeOut 0.3s';
        setTimeout(() => modal.remove(), 300);
    }
}

// Manejar login
async function handleLogin(e) {
    e.preventDefault();
    const messageDiv = document.getElementById('login-message');
    const submitBtn = e.target.querySelector('.btn-submit');
    
    const formData = {
        email: document.getElementById('email').value,
        password: document.getElementById('password').value
    };
    
    try {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Iniciando sesión...';
        messageDiv.innerHTML = '';
        
        const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });
        
        const data = await response.json();
        
        if (response.ok && data.success) {
            messageDiv.innerHTML = '<p style="color: #10b981;">✅ Login exitoso! Redirigiendo...</p>';
            
            // Guardar tokens y datos del usuario
            if (data.data) {
                // Guardar tokens
                localStorage.setItem('token', data.data.accessToken || data.data.token);
                localStorage.setItem('refreshToken', data.data.refreshToken);
                
                // Guardar usuario - manejar la estructura de tu controlador
                const userData = data.data.user || {};
                localStorage.setItem('user', JSON.stringify(userData));
                localStorage.setItem('userType', userData.tipo_usuario);
            }
            
            setTimeout(() => {
                closeModal();
                // Redirigir al dashboard
                window.location.href = '/dashboard.html';
            }, 1500);
        } else {
            messageDiv.innerHTML = `<p style="color: #ef4444;">❌ ${data.message || 'Error en el login'}</p>`;
            submitBtn.disabled = false;
            submitBtn.textContent = 'Iniciar Sesión';
        }
    } catch (error) {
        console.error('Error:', error);
        messageDiv.innerHTML = '<p style="color: #ef4444;">❌ Error al conectar con el servidor</p>';
        submitBtn.disabled = false;
        submitBtn.textContent = 'Iniciar Sesión';
    }
}

// Manejar registro
async function handleRegister(e) {
    e.preventDefault();
    const messageDiv = document.getElementById('register-message');
    const submitBtn = e.target.querySelector('.btn-submit');
    
    const form = e.target;
    const formData = new FormData(form);
    const data = Object.fromEntries(formData);
    
    // Validar contraseña
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(data.password)) {
        messageDiv.innerHTML = '<p style="color: #ef4444;">❌ La contraseña no cumple con los requisitos</p>';
        return;
    }
    
    try {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Creando cuenta...';
        messageDiv.innerHTML = '';
        
        const response = await fetch(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });
        
        const result = await response.json();
        
        if (response.ok && result.success) {
            messageDiv.innerHTML = '<p style="color: #10b981;">✅ Registro exitoso! Redirigiendo al login...</p>';
            
            // Si el registro devuelve tokens, guardarlos y redirigir al dashboard
            if (result.data && result.data.accessToken) {
                localStorage.setItem('token', result.data.accessToken || result.data.token);
                localStorage.setItem('refreshToken', result.data.refreshToken);
                localStorage.setItem('user', JSON.stringify(result.data.user));
                localStorage.setItem('userType', result.data.user.tipo_usuario);
                
                setTimeout(() => {
                    closeModal();
                    window.location.href = '/dashboard.html';
                }, 1500);
            } else {
                // Si no hay tokens, mostrar login
                setTimeout(() => {
                    closeModal();
                    showLoginModal();
                    // Pre-llenar email
                    document.getElementById('email').value = data.email;
                    const loginMsg = document.getElementById('login-message');
                    if (loginMsg) {
                        loginMsg.innerHTML = '<p style="color: #10b981;">Registro exitoso. Ahora inicia sesión.</p>';
                    }
                }, 2000);
            }
        } else {
            // Mostrar errores específicos si vienen del servidor
            if (result.errors && Array.isArray(result.errors)) {
                const errorMessages = result.errors.map(err => err.msg || err.message).join('<br>');
                messageDiv.innerHTML = `<p style="color: #ef4444;">❌ ${errorMessages}</p>`;
            } else {
                messageDiv.innerHTML = `<p style="color: #ef4444;">❌ ${result.message || 'Error en el registro'}</p>`;
            }
            submitBtn.disabled = false;
            submitBtn.textContent = 'Crear Cuenta';
        }
    } catch (error) {
        console.error('Error:', error);
        messageDiv.innerHTML = '<p style="color: #ef4444;">❌ Error al conectar con el servidor</p>';
        submitBtn.disabled = false;
        submitBtn.textContent = 'Crear Cuenta';
    }
}

// Verificar si hay usuario logueado
function checkUserSession() {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    
    if (token && user) {
        const userData = JSON.parse(user);
        updateUIForLoggedUser(userData);
    }
}

// Actualizar UI para usuario logueado
function updateUIForLoggedUser(user) {
    const navLinks = document.getElementById('nav-links');
    if (navLinks) {
        navLinks.innerHTML = `
            <span style="color: var(--text-dark); margin-right: 1rem;">
                Hola, <strong>${user.nombre}</strong> (${user.tipo_usuario})
            </span>
            <a href="/dashboard.html" class="btn-outline">Dashboard</a>
            <a href="#" onclick="logout()" class="btn-primary">Cerrar Sesión</a>
        `;
    }
}

// Función de logout
window.logout = async function() {
    const token = localStorage.getItem('token');
    
    if (token) {
        try {
            await fetch(`${API_URL}/auth/logout`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
        } catch (error) {
            console.error('Error en logout:', error);
        }
    }
    
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    localStorage.removeItem('userType');
    window.location.href = '/';
}

// Hacer funciones globales
window.closeModal = closeModal;
window.showExtraFields = showExtraFields;

// Animación de fade out para modales
const style = document.createElement('style');
style.textContent = `
    @keyframes fadeOut {
        from { opacity: 1; }
        to { opacity: 0; }
    }
`;
document.head.appendChild(style);

// Ejecutar al cargar
document.addEventListener('DOMContentLoaded', () => {
    // Verificar API
    checkAPI();
    
    // Verificar sesión
    checkUserSession();
    
    // Actualizar estado cada 60 segundos (menos frecuente)
    setInterval(checkAPI, 60000);
    
    // Event listeners para botones
    const loginBtn = document.getElementById('login-btn');
    if (loginBtn) {
        loginBtn.addEventListener('click', (e) => {
            e.preventDefault();
            showLoginModal();
        });
    }
    
    const registerBtn = document.getElementById('register-btn');
    if (registerBtn) {
        registerBtn.addEventListener('click', (e) => {
            e.preventDefault();
            showRegisterModal();
        });
    }
    
    // Cerrar modal al hacer click fuera
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            closeModal();
        }
    });
    
    // Cerrar modal con ESC
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeModal();
        }
    });
});