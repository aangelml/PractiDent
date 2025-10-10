// backend/middleware/validators.js
const { body, param, query } = require('express-validator');

// Validadores para autenticación
exports.validateRegister = [
  body('nombre')
    .trim()
    .notEmpty().withMessage('El nombre es requerido')
    .isLength({ min: 2, max: 50 }).withMessage('El nombre debe tener entre 2 y 50 caracteres')
    .matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/).withMessage('El nombre solo puede contener letras'),
  
  body('apellido')
    .trim()
    .notEmpty().withMessage('El apellido es requerido')
    .isLength({ min: 2, max: 50 }).withMessage('El apellido debe tener entre 2 y 50 caracteres')
    .matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/).withMessage('El apellido solo puede contener letras'),
  
  body('email')
    .trim()
    .notEmpty().withMessage('El email es requerido')
    .isEmail().withMessage('Email inválido')
    .normalizeEmail(),
  
  body('password')
    .notEmpty().withMessage('La contraseña es requerida')
    .isLength({ min: 8 }).withMessage('La contraseña debe tener al menos 8 caracteres')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('La contraseña debe contener al menos una mayúscula, una minúscula, un número y un carácter especial'),
  
  body('tipo_usuario')
    .notEmpty().withMessage('El tipo de usuario es requerido')
    .isIn(['practicante', 'maestro', 'paciente']).withMessage('Tipo de usuario inválido'),

  // Validaciones condicionales para practicante
  body('matricula')
    .if(body('tipo_usuario').equals('practicante'))
    .notEmpty().withMessage('La matrícula es requerida para practicantes')
    .matches(/^[A-Z0-9]{6,10}$/).withMessage('Formato de matrícula inválido'),
  
  body('semestre')
    .if(body('tipo_usuario').equals('practicante'))
    .notEmpty().withMessage('El semestre es requerido')
    .isInt({ min: 1, max: 12 }).withMessage('Semestre inválido'),
  
  body('turno')
    .if(body('tipo_usuario').equals('practicante'))
    .notEmpty().withMessage('El turno es requerido')
    .isIn(['matutino', 'vespertino']).withMessage('Turno inválido'),

  // Validaciones condicionales para maestro
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
    .notEmpty().withMessage('Los años de experiencia son requeridos')
    .isInt({ min: 0, max: 50 }).withMessage('Años de experiencia inválidos'),

  // Validaciones condicionales para paciente
  body('fecha_nacimiento')
    .if(body('tipo_usuario').equals('paciente'))
    .notEmpty().withMessage('La fecha de nacimiento es requerida')
    .isISO8601().withMessage('Formato de fecha inválido')
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
    .notEmpty().withMessage('El teléfono es requerido')
    .matches(/^[0-9]{10}$/).withMessage('El teléfono debe tener 10 dígitos'),
  
  body('direccion')
    .if(body('tipo_usuario').equals('paciente'))
    .optional()
    .isLength({ min: 10, max: 200 }).withMessage('La dirección debe tener entre 10 y 200 caracteres'),
  
  body('historial_medico')
    .if(body('tipo_usuario').equals('paciente'))
    .optional()
    .isLength({ max: 1000 }).withMessage('El historial médico no puede exceder 1000 caracteres')
];

// Validador para login
exports.validateLogin = [
  body('email')
    .trim()
    .notEmpty().withMessage('El email es requerido')
    .isEmail().withMessage('Email inválido')
    .normalizeEmail(),
  
  body('password')
    .notEmpty().withMessage('La contraseña es requerida')
];

// Validador para refresh token
exports.validateRefreshToken = [
  body('refreshToken')
    .notEmpty().withMessage('El refresh token es requerido')
];

// Validador para cambio de contraseña
exports.validateChangePassword = [
  body('currentPassword')
    .notEmpty().withMessage('La contraseña actual es requerida'),
  
  body('newPassword')
    .notEmpty().withMessage('La nueva contraseña es requerida')
    .isLength({ min: 8 }).withMessage('La contraseña debe tener al menos 8 caracteres')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('La contraseña debe contener al menos una mayúscula, una minúscula, un número y un carácter especial')
    .custom((value, { req }) => value !== req.body.currentPassword)
    .withMessage('La nueva contraseña debe ser diferente a la actual'),
  
  body('confirmPassword')
    .notEmpty().withMessage('La confirmación de contraseña es requerida')
    .custom((value, { req }) => value === req.body.newPassword)
    .withMessage('Las contraseñas no coinciden')
];