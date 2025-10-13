// backend/middleware/validators.js - ACTUALIZADO SPRINT B2
const { body, param, query, validationResult } = require('express-validator');

// Middleware para manejar errores de validación
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Error de validación',
      errors: errors.array().map(err => ({
        field: err.path,
        message: err.msg,
        value: err.value
      }))
    });
  }
  next();
};

// ============================================
// VALIDADORES DE AUTENTICACIÓN (EXISTENTES)
// ============================================

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
    .isLength({ max: 1000 }).withMessage('El historial médico no puede exceder 1000 caracteres'),
  
  handleValidationErrors
];

// Validador para login
exports.validateLogin = [
  body('email')
    .trim()
    .notEmpty().withMessage('El email es requerido')
    .isEmail().withMessage('Email inválido')
    .normalizeEmail(),
  
  body('password')
    .notEmpty().withMessage('La contraseña es requerida'),
  
  handleValidationErrors
];

// Validador para refresh token
exports.validateRefreshToken = [
  body('refreshToken')
    .notEmpty().withMessage('El refresh token es requerido'),
  
  handleValidationErrors
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
    .withMessage('Las contraseñas no coinciden'),
  
  handleValidationErrors
];

// ============================================
// NUEVOS VALIDADORES PARA PRÁCTICAS - SPRINT B2
// ============================================

// Validar creación de práctica
exports.validateCreatePractice = [
  body('nombre')
    .trim()
    .notEmpty().withMessage('El nombre de la práctica es requerido')
    .isLength({ min: 5, max: 200 }).withMessage('El nombre debe tener entre 5 y 200 caracteres'),
  
  body('descripcion')
    .trim()
    .notEmpty().withMessage('La descripción es requerida')
    .isLength({ min: 10, max: 1000 }).withMessage('La descripción debe tener entre 10 y 1000 caracteres'),
  
  body('requisitos')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Los requisitos no pueden exceder 500 caracteres'),
  
  body('tipo_practica')
    .trim()
    .notEmpty().withMessage('El tipo de práctica es requerido')
    .isLength({ min: 3, max: 100 }).withMessage('El tipo de práctica debe tener entre 3 y 100 caracteres'),
  
  body('duracion_estimada_horas')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('La duración debe ser entre 1 y 100 horas'),
  
  body('cupo_maximo')
    .optional()
    .isInt({ min: 1, max: 50 }).withMessage('El cupo máximo debe ser entre 1 y 50'),
  
  body('fecha_inicio')
    .notEmpty().withMessage('La fecha de inicio es requerida')
    .isISO8601().withMessage('Formato de fecha inválido')
    .custom((value) => {
      const startDate = new Date(value);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (startDate < today) {
        throw new Error('La fecha de inicio no puede ser anterior a hoy');
      }
      return true;
    }),
  
  body('fecha_fin')
    .notEmpty().withMessage('La fecha de fin es requerida')
    .isISO8601().withMessage('Formato de fecha inválido')
    .custom((value, { req }) => {
      const endDate = new Date(value);
      const startDate = new Date(req.body.fecha_inicio);
      if (endDate <= startDate) {
        throw new Error('La fecha de fin debe ser posterior a la fecha de inicio');
      }
      return true;
    }),
  
  body('estado')
    .optional()
    .isIn(['activa', 'completada', 'cancelada']).withMessage('Estado inválido'),
  
  body('nivel_dificultad')
    .optional()
    .isIn(['basico', 'intermedio', 'avanzado']).withMessage('Nivel de dificultad inválido'),
  
  handleValidationErrors
];

// Validar actualización de práctica
exports.validateUpdatePractice = [
  body('nombre')
    .optional()
    .trim()
    .isLength({ min: 5, max: 200 }).withMessage('El nombre debe tener entre 5 y 200 caracteres'),
  
  body('descripcion')
    .optional()
    .trim()
    .isLength({ min: 10, max: 1000 }).withMessage('La descripción debe tener entre 10 y 1000 caracteres'),
  
  body('requisitos')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Los requisitos no pueden exceder 500 caracteres'),
  
  body('tipo_practica')
    .optional()
    .trim()
    .isLength({ min: 3, max: 100 }).withMessage('El tipo de práctica debe tener entre 3 y 100 caracteres'),
  
  body('duracion_estimada_horas')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('La duración debe ser entre 1 y 100 horas'),
  
  body('cupo_maximo')
    .optional()
    .isInt({ min: 1, max: 50 }).withMessage('El cupo máximo debe ser entre 1 y 50'),
  
  body('fecha_inicio')
    .optional()
    .isISO8601().withMessage('Formato de fecha inválido'),
  
  body('fecha_fin')
    .optional()
    .isISO8601().withMessage('Formato de fecha inválido'),
  
  body('estado')
    .optional()
    .isIn(['activa', 'completada', 'cancelada']).withMessage('Estado inválido'),
  
  body('nivel_dificultad')
    .optional()
    .isIn(['basico', 'intermedio', 'avanzado']).withMessage('Nivel de dificultad inválido'),
  
  handleValidationErrors
];

// Validar asignación de practicante
exports.validateAssignPracticante = [
  body('practicante_id')
    .notEmpty().withMessage('El ID del practicante es requerido')
    .isInt({ min: 1 }).withMessage('ID de practicante inválido'),
  
  handleValidationErrors
];

// Validar actualización de estado de asignación
exports.validateUpdateAssignmentStatus = [
  body('estado')
    .notEmpty().withMessage('El estado es requerido')
    .isIn(['asignado', 'en_progreso', 'completado', 'cancelado']).withMessage('Estado inválido'),
  
  body('observaciones')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Las observaciones no pueden exceder 500 caracteres'),
  
  handleValidationErrors
];

// Validar calificación de practicante
exports.validateGradePracticante = [
  body('calificacion')
    .notEmpty().withMessage('La calificación es requerida')
    .isFloat({ min: 0, max: 10 }).withMessage('La calificación debe estar entre 0 y 10')
    .custom((value) => {
      // Permitir solo un decimal
      const decimal = value.toString().split('.')[1];
      if (decimal && decimal.length > 2) {
        throw new Error('La calificación solo puede tener hasta 2 decimales');
      }
      return true;
    }),
  
  body('observaciones')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Las observaciones no pueden exceder 500 caracteres'),
  
  handleValidationErrors
];

// Validar parámetros de ID
exports.validatePracticeId = [
  param('id')
    .isInt({ min: 1 }).withMessage('ID de práctica inválido'),
  
  handleValidationErrors
];

exports.validatePracticanteId = [
  param('practicanteId')
    .isInt({ min: 1 }).withMessage('ID de practicante inválido'),
  
  handleValidationErrors
];

// Validar query params para filtros
exports.validatePracticeFilters = [
  query('estado')
    .optional()
    .isIn(['activa', 'completada', 'cancelada']).withMessage('Estado inválido'),
  
  query('tipo_practica')
    .optional()
    .trim()
    .isLength({ max: 100 }).withMessage('Tipo de práctica inválido'),
  
  query('nivel_dificultad')
    .optional()
    .isIn(['basico', 'intermedio', 'avanzado']).withMessage('Nivel de dificultad inválido'),
  
  query('search')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 }).withMessage('El término de búsqueda debe tener entre 2 y 100 caracteres'),
  
  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('Número de página inválido'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('El límite debe estar entre 1 y 100'),
  
  handleValidationErrors
];

// Validar disponibilidad de maestro
exports.validateMaestroDisponibilidad = [
  body('dia_semana')
    .notEmpty().withMessage('El día de la semana es requerido')
    .isIn(['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'])
    .withMessage('Día de la semana inválido'),
  
  body('hora_inicio')
    .notEmpty().withMessage('La hora de inicio es requerida')
    .matches(/^([01]\d|2[0-3]):([0-5]\d)$/).withMessage('Formato de hora inválido (HH:MM)'),
  
  body('hora_fin')
    .notEmpty().withMessage('La hora de fin es requerida')
    .matches(/^([01]\d|2[0-3]):([0-5]\d)$/).withMessage('Formato de hora inválido (HH:MM)')
    .custom((value, { req }) => {
      const [startHour, startMin] = req.body.hora_inicio.split(':').map(Number);
      const [endHour, endMin] = value.split(':').map(Number);
      
      const startMinutes = startHour * 60 + startMin;
      const endMinutes = endHour * 60 + endMin;
      
      if (endMinutes <= startMinutes) {
        throw new Error('La hora de fin debe ser posterior a la hora de inicio');
      }
      
      if (endMinutes - startMinutes < 30) {
        throw new Error('La disponibilidad debe ser de al menos 30 minutos');
      }
      
      return true;
    }),
  
  body('activo')
    .optional()
    .isBoolean().withMessage('El campo activo debe ser booleano'),
  
  handleValidationErrors
];

// ============================================
// VALIDADORES PARA CITAS - SPRINT B3
// ============================================

// Validar creación de cita
exports.validateCreateAppointment = [
  body('practica_id')
    .notEmpty().withMessage('El ID de la práctica es requerido')
    .isInt({ min: 1 }).withMessage('ID de práctica inválido'),
  
  body('practicante_id')
    .notEmpty().withMessage('El ID del practicante es requerido')
    .isInt({ min: 1 }).withMessage('ID de practicante inválido'),
  
  body('paciente_id')
    .notEmpty().withMessage('El ID del paciente es requerido')
    .isInt({ min: 1 }).withMessage('ID de paciente inválido'),
  
  body('fecha_hora')
    .notEmpty().withMessage('La fecha y hora son requeridas')
    .isISO8601().withMessage('Formato de fecha/hora inválido')
    .custom((value) => {
      const appointmentDate = new Date(value);
      const now = new Date();
      if (appointmentDate < now) {
        throw new Error('La fecha de la cita no puede ser en el pasado');
      }
      return true;
    }),
  
  body('duracion_minutos')
    .optional()
    .isInt({ min: 15, max: 240 }).withMessage('La duración debe ser entre 15 y 240 minutos'),
  
  body('motivo_consulta')
    .notEmpty().withMessage('El motivo de consulta es requerido')
    .trim()
    .isLength({ min: 10, max: 500 }).withMessage('El motivo debe tener entre 10 y 500 caracteres'),
  
  body('notas')
    .optional()
    .trim()
    .isLength({ max: 1000 }).withMessage('Las notas no pueden exceder 1000 caracteres'),
  
  handleValidationErrors
];

// Validar actualización de cita
exports.validateUpdateAppointment = [
  body('fecha_hora')
    .optional()
    .isISO8601().withMessage('Formato de fecha/hora inválido')
    .custom((value) => {
      const appointmentDate = new Date(value);
      const now = new Date();
      if (appointmentDate < now) {
        throw new Error('La fecha de la cita no puede ser en el pasado');
      }
      return true;
    }),
  
  body('duracion_minutos')
    .optional()
    .isInt({ min: 15, max: 240 }).withMessage('La duración debe ser entre 15 y 240 minutos'),
  
  body('estado')
    .optional()
    .isIn(['pendiente', 'confirmada', 'completada', 'cancelada', 'no_asistio'])
    .withMessage('Estado inválido'),
  
  body('motivo_consulta')
    .optional()
    .trim()
    .isLength({ min: 10, max: 500 }).withMessage('El motivo debe tener entre 10 y 500 caracteres'),
  
  body('notas')
    .optional()
    .trim()
    .isLength({ max: 1000 }).withMessage('Las notas no pueden exceder 1000 caracteres'),
  
  body('tratamiento_realizado')
    .optional()
    .trim()
    .isLength({ max: 2000 }).withMessage('El tratamiento no puede exceder 2000 caracteres'),
  
  handleValidationErrors
];

// Validar cancelación de cita
exports.validateCancelAppointment = [
  body('motivo')
    .notEmpty().withMessage('El motivo de cancelación es requerido')
    .trim()
    .isLength({ min: 5, max: 500 }).withMessage('El motivo debe tener entre 5 y 500 caracteres'),
  
  handleValidationErrors
];

// Validar completar cita
exports.validateCompleteAppointment = [
  body('tratamiento_realizado')
    .notEmpty().withMessage('El tratamiento realizado es requerido')
    .trim()
    .isLength({ min: 10, max: 2000 }).withMessage('El tratamiento debe tener entre 10 y 2000 caracteres'),
  
  handleValidationErrors
];

// Validar ID de cita
exports.validateAppointmentId = [
  param('id')
    .isInt({ min: 1 }).withMessage('ID de cita inválido'),
  
  handleValidationErrors
];

// Validar filtros de citas
exports.validateAppointmentFilters = [
  query('estado')
    .optional()
    .isIn(['pendiente', 'confirmada', 'completada', 'cancelada', 'no_asistio'])
    .withMessage('Estado inválido'),
  
  query('fecha_desde')
    .optional()
    .isISO8601().withMessage('Formato de fecha inválido'),
  
  query('fecha_hasta')
    .optional()
    .isISO8601().withMessage('Formato de fecha inválido')
    .custom((value, { req }) => {
      if (req.query.fecha_desde) {
        const desde = new Date(req.query.fecha_desde);
        const hasta = new Date(value);
        if (hasta < desde) {
          throw new Error('La fecha hasta debe ser posterior a la fecha desde');
        }
      }
      return true;
    }),
  
  query('search')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 }).withMessage('El término de búsqueda debe tener entre 2 y 100 caracteres'),
  
  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('Número de página inválido'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('El límite debe estar entre 1 y 100'),
  
  handleValidationErrors
];

// Validar consulta de slots disponibles
exports.validateAvailableSlots = [
  query('practica_id')
    .notEmpty().withMessage('El ID de la práctica es requerido')
    .isInt({ min: 1 }).withMessage('ID de práctica inválido'),
  
  query('practicante_id')
    .notEmpty().withMessage('El ID del practicante es requerido')
    .isInt({ min: 1 }).withMessage('ID de practicante inválido'),
  
  query('fecha')
    .notEmpty().withMessage('La fecha es requerida')
    .matches(/^\d{4}-\d{2}-\d{2}$/).withMessage('Formato de fecha inválido (YYYY-MM-DD)')
    .custom((value) => {
      const fecha = new Date(value + 'T00:00:00');
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);
      if (fecha < hoy) {
        throw new Error('La fecha no puede ser en el pasado');
      }
      return true;
    }),
  
  handleValidationErrors
];
exports.validateCreateMaestroEvaluation = [
  body('cita_id')
    .notEmpty().withMessage('El ID de la cita es requerido')
    .isInt({ min: 1 }).withMessage('ID de cita inválido'),
  
  body('evaluado_id')
    .notEmpty().withMessage('El ID del evaluado es requerido')
    .isInt({ min: 1 }).withMessage('ID de evaluado inválido'),
  
  body('calificacion')
    .notEmpty().withMessage('La calificación es requerida')
    .isInt({ min: 1, max: 5 }).withMessage('La calificación debe ser entre 1 y 5 estrellas'),
  
  body('comentarios')
    .notEmpty().withMessage('Los comentarios son obligatorios para evaluaciones de maestro')
    .trim()
    .isLength({ min: 10, max: 1000 }).withMessage('Los comentarios deben tener entre 10 y 1000 caracteres'),
  
  body('aspectos_positivos')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Los aspectos positivos no pueden exceder 500 caracteres'),
  
  body('aspectos_mejorar')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Los aspectos a mejorar no pueden exceder 500 caracteres'),
  
  handleValidationErrors
];

// Validar creación de evaluación paciente → servicio
exports.validateCreatePacienteEvaluation = [
  body('cita_id')
    .notEmpty().withMessage('El ID de la cita es requerido')
    .isInt({ min: 1 }).withMessage('ID de cita inválido'),
  
  body('evaluado_id')
    .notEmpty().withMessage('El ID del evaluado es requerido')
    .isInt({ min: 1 }).withMessage('ID de evaluado inválido'),
  
  body('calificacion')
    .notEmpty().withMessage('La calificación es requerida')
    .isInt({ min: 1, max: 5 }).withMessage('La calificación debe ser entre 1 y 5 estrellas'),
  
  body('comentarios')
    .optional()
    .trim()
    .isLength({ max: 1000 }).withMessage('Los comentarios no pueden exceder 1000 caracteres'),
  
  body('aspectos_positivos')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Los aspectos positivos no pueden exceder 500 caracteres'),
  
  body('aspectos_mejorar')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Los aspectos a mejorar no pueden exceder 500 caracteres'),
  
  handleValidationErrors
];

// Validar ID de evaluación
exports.validateEvaluationId = [
  param('id')
    .isInt({ min: 1 }).withMessage('ID de evaluación inválido'),
  
  handleValidationErrors
];

// Validar filtros de evaluaciones
exports.validateEvaluationFilters = [
  query('tipo')
    .optional()
    .isIn(['maestro_practicante', 'paciente_servicio']).withMessage('Tipo de evaluación inválido'),
  
  query('calificacion_min')
    .optional()
    .isInt({ min: 1, max: 5 }).withMessage('Calificación mínima debe ser entre 1 y 5'),
  
  query('calificacion_max')
    .optional()
    .isInt({ min: 1, max: 5 }).withMessage('Calificación máxima debe ser entre 1 y 5')
    .custom((value, { req }) => {
      if (req.query.calificacion_min && parseInt(value) < parseInt(req.query.calificacion_min)) {
        throw new Error('La calificación máxima debe ser mayor o igual a la mínima');
      }
      return true;
    }),
  
  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('Número de página inválido'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('El límite debe estar entre 1 y 100'),
  
  handleValidationErrors
];

module.exports = exports;