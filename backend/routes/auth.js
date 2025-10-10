// backend/routes/auth.js - VERSIÓN CORREGIDA
const router = require('express').Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/authSimple');
const { body, validationResult } = require('express-validator');

// Middleware para manejar errores de validación
const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            message: 'Errores de validación',
            errors: errors.array().map(err => ({
                field: err.path,
                message: err.msg
            }))
        });
    }
    next();
};

// Validaciones para registro
const registerValidation = [
    body('nombre')
        .trim()
        .notEmpty().withMessage('El nombre es requerido')
        .isLength({ min: 2, max: 50 }).withMessage('El nombre debe tener entre 2 y 50 caracteres'),
    
    body('apellido')
        .trim()
        .notEmpty().withMessage('El apellido es requerido')
        .isLength({ min: 2, max: 50 }).withMessage('El apellido debe tener entre 2 y 50 caracteres'),
    
    body('email')
        .trim()
        .notEmpty().withMessage('El email es requerido')
        .isEmail().withMessage('Email inválido')
        .normalizeEmail(),
    
    body('password')
        .notEmpty().withMessage('La contraseña es requerida')
        .isLength({ min: 8 }).withMessage('La contraseña debe tener al menos 8 caracteres')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
        .withMessage('La contraseña debe contener mayúsculas, minúsculas, números y caracteres especiales'),
    
    body('tipo_usuario')
        .notEmpty().withMessage('El tipo de usuario es requerido')
        .isIn(['practicante', 'maestro', 'paciente', 'admin'])
        .withMessage('Tipo de usuario inválido'),

    // Validaciones condicionales para PRACTICANTE
    body('matricula')
        .if(body('tipo_usuario').equals('practicante'))
        .notEmpty().withMessage('La matrícula es requerida para practicantes')
        .matches(/^[A-Z0-9]{6,10}$/).withMessage('Formato de matrícula inválido (6-10 caracteres alfanuméricos)'),
    
    body('semestre')
        .if(body('tipo_usuario').equals('practicante'))
        .notEmpty().withMessage('El semestre es requerido')
        .isInt({ min: 1, max: 12 }).withMessage('El semestre debe estar entre 1 y 12'),
    
    body('turno')
        .if(body('tipo_usuario').equals('practicante'))
        .notEmpty().withMessage('El turno es requerido')
        .isIn(['matutino', 'vespertino']).withMessage('Turno inválido'),

    // Validaciones condicionales para MAESTRO
    body('cedula_profesional')
        .if(body('tipo_usuario').equals('maestro'))
        .notEmpty().withMessage('La cédula profesional es requerida para maestros')
        .matches(/^[0-9]{7,8}$/).withMessage('Formato de cédula profesional inválido'),
    
    body('especialidad')
        .if(body('tipo_usuario').equals('maestro'))
        .notEmpty().withMessage('La especialidad es requerida')
        .isLength({ min: 3, max: 100 }).withMessage('La especialidad debe tener entre 3 y 100 caracteres'),
    
    body('anos_experiencia')
        .if(body('tipo_usuario').equals('maestro'))
        .optional()
        .isInt({ min: 0, max: 50 }).withMessage('Años de experiencia inválidos'),

    // Validaciones condicionales para PACIENTE
    body('fecha_nacimiento')
        .if(body('tipo_usuario').equals('paciente'))
        .notEmpty().withMessage('La fecha de nacimiento es requerida para pacientes')
        .isISO8601().withMessage('Formato de fecha inválido (YYYY-MM-DD)')
        .custom((value) => {
            const birthDate = new Date(value);
            const today = new Date();
            const age = today.getFullYear() - birthDate.getFullYear();
            if (age < 0 || age > 120) {
                throw new Error('Fecha de nacimiento inválida');
            }
            return true;
        }),
    
    body('telefono')
        .if(body('tipo_usuario').equals('paciente'))
        .notEmpty().withMessage('El teléfono es requerido para pacientes')
        .matches(/^[0-9]{10}$/).withMessage('El teléfono debe tener 10 dígitos'),

    handleValidationErrors
];

// Validaciones para login  
const loginValidation = [
    body('email')
        .trim()
        .notEmpty().withMessage('El email es requerido')
        .isEmail().withMessage('Email inválido')
        .normalizeEmail(),
    
    body('password')
        .notEmpty().withMessage('La contraseña es requerida'),

    handleValidationErrors
];

// Validaciones para refresh token
const refreshValidation = [
    body('refreshToken')
        .notEmpty().withMessage('El refresh token es requerido'),

    handleValidationErrors
];

// Validaciones para cambio de contraseña
const changePasswordValidation = [
    body('currentPassword')
        .notEmpty().withMessage('La contraseña actual es requerida'),
    
    body('newPassword')
        .notEmpty().withMessage('La nueva contraseña es requerida')
        .isLength({ min: 8 }).withMessage('La nueva contraseña debe tener al menos 8 caracteres')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
        .withMessage('La nueva contraseña debe contener mayúsculas, minúsculas, números y caracteres especiales')
        .custom((value, { req }) => {
            if (value === req.body.currentPassword) {
                throw new Error('La nueva contraseña debe ser diferente a la actual');
            }
            return true;
        }),

    handleValidationErrors
];

// ==========================================
// RUTAS PÚBLICAS (sin autenticación)
// ==========================================
router.post('/register', registerValidation, authController.register);
router.post('/login', loginValidation, authController.login);
router.post('/refresh', refreshValidation, authController.refreshToken);

// ==========================================
// RUTAS PROTEGIDAS (requieren autenticación)
// ==========================================
router.get('/profile', authMiddleware, authController.getProfile);
router.post('/logout', authMiddleware, authController.logout);
router.post('/change-password', authMiddleware, changePasswordValidation, authController.changePassword);

// Ruta de prueba (solo para desarrollo)
if (process.env.NODE_ENV === 'development') {
    router.get('/test', (req, res) => {
        res.json({
            success: true,
            message: 'Rutas de autenticación funcionando correctamente',
            timestamp: new Date().toISOString()
        });
    });
}

module.exports = router;