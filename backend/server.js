// backend/server.js - VERSION ACTUALIZADA CON PRÁCTICAS Y CITAS (SPRINT B3)
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const path = require('path');
const db = require('./config/database');

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares de seguridad
app.use(helmet({
    contentSecurityPolicy: false
}));

// CORS - CONFIGURACIÓN CORREGIDA PARA FRONTEND EN PUERTO 5173
app.use(cors({
    origin: ['http://localhost:3000', 'http://localhost:5173', 'http://localhost:8080'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Middlewares generales
app.use(compression());
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Servir archivos estáticos del frontend
app.use(express.static(path.join(__dirname, '../frontend')));

// Rate limiting
const rateLimit = require('express-rate-limit');

const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: 'Demasiados intentos de login, intente de nuevo en 15 minutos',
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => process.env.NODE_ENV === 'development'
});

const registerLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 3,
    message: 'Demasiados registros desde esta IP, intente de nuevo en una hora'
});

// Aplicar rate limiting
app.use('/api/auth/login', loginLimiter);
app.use('/api/auth/register', registerLimiter);

// Importar y usar rutas de autenticación
const authRoutes = require('./routes/auth');
app.use('/api/auth', authRoutes);

// VERIFICAR SI EXISTEN LAS RUTAS ANTES DE CARGARLAS
const fs = require('fs');
const dashboardRoutePath = path.join(__dirname, 'routes', 'dashboard.js');
const usersRoutePath = path.join(__dirname, 'routes', 'users.js');
const practicesRoutePath = path.join(__dirname, 'routes', 'practices.js');
const appointmentsRoutePath = path.join(__dirname, 'routes', 'appointments.js');

if (fs.existsSync(dashboardRoutePath)) {
    try {
        const dashboardRoutes = require('./routes/dashboard');
        app.use('/api/dashboard', dashboardRoutes);
        console.log('✅ Rutas de dashboard cargadas');
    } catch (error) {
        console.error('❌ Error cargando rutas de dashboard:', error.message);
    }
} else {
    console.log('⚠️ Archivo routes/dashboard.js no encontrado');
}

if (fs.existsSync(usersRoutePath)) {
    try {
        const usersRoutes = require('./routes/users');
        app.use('/api/users', usersRoutes);
        console.log('✅ Rutas de usuarios cargadas');
    } catch (error) {
        console.error('❌ Error cargando rutas de usuarios:', error.message);
    }
} else {
    console.log('⚠️ Archivo routes/users.js no encontrado');
}

// Verificar y cargar rutas de prácticas (SPRINT B2)
if (fs.existsSync(practicesRoutePath)) {
    try {
        const practicesRoutes = require('./routes/practices');
        app.use('/api/practices', practicesRoutes);
        console.log('✅ Rutas de prácticas cargadas');
    } catch (error) {
        console.error('❌ Error cargando rutas de prácticas:', error.message);
    }
} else {
    console.log('⚠️ Archivo routes/practices.js no encontrado');
}

// Verificar y cargar rutas de citas (SPRINT B3) - NUEVO
if (fs.existsSync(appointmentsRoutePath)) {
    try {
        const appointmentsRoutes = require('./routes/appointments');
        app.use('/api/appointments', appointmentsRoutes);
        console.log('✅ Rutas de citas cargadas');
    } catch (error) {
        console.error('❌ Error cargando rutas de citas:', error.message);
    }
} else {
    console.log('⚠️ Archivo routes/appointments.js no encontrado');
}

// Health check endpoint
app.get('/api/health', async (req, res) => {
    try {
        await db.execute('SELECT 1');
        res.json({
            status: 'ok',
            message: 'API funcionando correctamente',
            timestamp: new Date().toISOString(),
            environment: process.env.NODE_ENV || 'development',
            database: 'connected',
            port: PORT,
            features: {
                authentication: true,
                dashboard: fs.existsSync(dashboardRoutePath),
                userManagement: fs.existsSync(usersRoutePath),
                practices: fs.existsSync(practicesRoutePath),
                appointments: fs.existsSync(appointmentsRoutePath),
                rateLimit: true,
                cors: true,
                helmet: true
            }
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: 'Error en el servidor',
            timestamp: new Date().toISOString(),
            database: 'disconnected'
        });
    }
});

// Manejo de errores 404 para API
app.use('/api/*', (req, res) => {
    res.status(404).json({
        success: false,
        message: 'Endpoint no encontrado',
        path: req.originalUrl
    });
});

// Servir frontend para todas las demás rutas
app.get('*', (req, res) => {
    const indexPath = path.join(__dirname, '../frontend/index.html');
    if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
    } else {
        res.status(404).send('Frontend no encontrado');
    }
});

// Manejo de errores global
app.use((err, req, res, next) => {
    console.error('Error:', err);
    
    if (err.type === 'validation') {
        return res.status(400).json({
            success: false,
            message: 'Error de validación',
            errors: err.errors
        });
    }
    
    if (err.name === 'JsonWebTokenError') {
        return res.status(401).json({
            success: false,
            message: 'Token inválido'
        });
    }
    
    if (err.name === 'TokenExpiredError') {
        return res.status(401).json({
            success: false,
            message: 'Token expirado'
        });
    }
    
    if (err.code === 'ER_DUP_ENTRY') {
        return res.status(409).json({
            success: false,
            message: 'El registro ya existe'
        });
    }
    
    res.status(err.status || 500).json({
        success: false,
        message: err.message || 'Error interno del servidor',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
});

// Verificar conexión a base de datos e iniciar servidor
const startServer = async () => {
    try {
        // Verificar conexión a base de datos
        await db.execute('SELECT 1');
        console.log('✅ Conexión a base de datos establecida');
        
        // Verificar tablas necesarias
        const [tables] = await db.execute(`
            SELECT TABLE_NAME 
            FROM information_schema.TABLES 
            WHERE TABLE_SCHEMA = ? 
            AND TABLE_NAME IN ('usuarios', 'practicantes', 'maestros', 'pacientes', 'practicas', 'practicantes_practicas', 'citas')`,
            [process.env.DB_NAME]
        );
        
        console.log(`✅ Tablas encontradas: ${tables.length}/7`);
        
        // Iniciar servidor
        app.listen(PORT, () => {
            console.log('\n' + '='.repeat(60));
            console.log('🚀 PRACTIDENT BACKEND - SISTEMA INICIADO');
            console.log('='.repeat(60));
            console.log(`🔒 Puerto: ${PORT}`);
            console.log(`🌐 Frontend: http://localhost:${PORT}`);
            console.log(`📡 API Base: http://localhost:${PORT}/api`);
            console.log(`🔧 Ambiente: ${process.env.NODE_ENV || 'development'}`);
            console.log(`🗄️  Base de datos: ${process.env.DB_NAME}`);
            console.log(`✅ CORS habilitado para: localhost:3000, localhost:5173, localhost:8080`);
            console.log('='.repeat(60));
            console.log('\n📌 Endpoints disponibles:');
            console.log('  POST /api/auth/register        - Registro de usuarios');
            console.log('  POST /api/auth/login           - Inicio de sesión');
            console.log('  POST /api/auth/refresh         - Renovar token');
            console.log('  POST /api/auth/logout          - Cerrar sesión');
            console.log('  GET  /api/auth/profile         - Ver perfil (requiere auth)');
            console.log('  POST /api/auth/change-password - Cambiar contraseña (requiere auth)');
            
            if (fs.existsSync(dashboardRoutePath)) {
                console.log('\n📌 Endpoints de Dashboard:');
                console.log('  GET  /api/dashboard            - Dashboard principal');
                console.log('  GET  /api/dashboard/notifications - Notificaciones');
            }
            
            if (fs.existsSync(usersRoutePath)) {
                console.log('\n📌 Endpoints de Usuarios:');
                console.log('  GET  /api/users                - Listar usuarios');
                console.log('  GET  /api/users/:id            - Ver usuario');
                console.log('  PUT  /api/users/:id            - Actualizar usuario');
                console.log('  GET  /api/users/maestros       - Listar maestros');
            }
            
            if (fs.existsSync(practicesRoutePath)) {
                console.log('\n📌 Endpoints de Prácticas:');
                console.log('  GET  /api/practices            - Listar prácticas');
                console.log('  GET  /api/practices/statistics - Estadísticas');
                console.log('  GET  /api/practices/my-practices - Mis prácticas (practicantes)');
                console.log('  GET  /api/practices/:id        - Ver práctica');
                console.log('  POST /api/practices            - Crear práctica (maestros)');
                console.log('  PUT  /api/practices/:id        - Actualizar práctica (maestros)');
                console.log('  DELETE /api/practices/:id      - Eliminar práctica (maestros)');
                console.log('  POST /api/practices/:id/assign - Asignar practicante');
                console.log('  GET  /api/practices/:id/practicantes - Ver practicantes');
                console.log('  GET  /api/practices/maestros/:id/disponibilidad - Ver disponibilidad');
            }
            
            if (fs.existsSync(appointmentsRoutePath)) {
                console.log('\n📌 Endpoints de Citas:');
                console.log('  GET  /api/appointments                 - Listar citas');
                console.log('  GET  /api/appointments/statistics      - Estadísticas');
                console.log('  GET  /api/appointments/available-slots - Horarios disponibles');
                console.log('  GET  /api/appointments/my-appointments - Mis citas (practicante)');
                console.log('  GET  /api/appointments/patient/my-appointments - Mis citas (paciente)');
                console.log('  GET  /api/appointments/:id             - Ver cita');
                console.log('  POST /api/appointments                 - Crear cita');
                console.log('  PUT  /api/appointments/:id             - Actualizar cita');
                console.log('  PATCH /api/appointments/:id/confirm    - Confirmar cita');
                console.log('  PATCH /api/appointments/:id/cancel     - Cancelar cita');
                console.log('  PATCH /api/appointments/:id/complete   - Completar cita');
                console.log('  PATCH /api/appointments/:id/no-show    - Marcar no asistió');
            }
            
            console.log('\n📌 Otros:');
            console.log('  GET  /api/health               - Estado del sistema');
            console.log('='.repeat(60) + '\n');
        });
    } catch (error) {
        console.error('❌ Error al iniciar:', error.message);
        console.error('Verifica tu conexión a MySQL y que la base de datos esté creada');
        process.exit(1);
    }
};

// Manejo de señales para cerrar correctamente
process.on('SIGTERM', async () => {
    console.log('\nSIGTERM recibido, cerrando servidor...');
    await db.end();
    process.exit(0);
});

process.on('SIGINT', async () => {
    console.log('\n👋 Cerrando servidor...');
    await db.end();
    process.exit(0);
});

// Iniciar servidor
startServer();
