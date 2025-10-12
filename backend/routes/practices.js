// backend/routes/practices.js - ACTUALIZADO SPRINT B2
const router = require('express').Router();
const { authenticate } = require('../middleware/authSimple');
const { authorize } = require('../middleware/roleAuth');
const practicesController = require('../controllers/practicesController');
const maestroAvailabilityController = require('../controllers/maestroAvailabilityController');
const {
    validateCreatePractice,
    validateUpdatePractice,
    validateAssignPracticante,
    validateUpdateAssignmentStatus,
    validateGradePracticante,
    validatePracticeId,
    validatePracticanteId,
    validatePracticeFilters,
    validateMaestroDisponibilidad
} = require('../middleware/validators');

// ============================================
// RUTAS PÚBLICAS (requieren autenticación)
// ============================================
router.use(authenticate);

// ============================================
// RUTAS DE PRÁCTICAS
// ============================================

// Obtener estadísticas de prácticas
router.get('/statistics', practicesController.getStatistics);

// Obtener todas las prácticas con filtros
router.get('/', 
    validatePracticeFilters,
    practicesController.getAllPractices
);

// Obtener mis prácticas (solo practicantes)
router.get('/my-practices', 
    authorize('practicante'),
    practicesController.getMyPractices
);

// Obtener práctica por ID
router.get('/:id', 
    validatePracticeId,
    practicesController.getPracticeById
);

// Obtener practicantes de una práctica
router.get('/:id/practicantes', 
    validatePracticeId,
    practicesController.getPracticantes
);

// Crear nueva práctica (solo maestros y admin)
router.post('/', 
    authorize('maestro', 'admin'),
    validateCreatePractice,
    practicesController.createPractice
);

// Actualizar práctica (solo maestros y admin)
router.put('/:id', 
    authorize('maestro', 'admin'),
    validatePracticeId,
    validateUpdatePractice,
    practicesController.updatePractice
);

// Eliminar práctica (solo maestros y admin)
router.delete('/:id', 
    authorize('maestro', 'admin'),
    validatePracticeId,
    practicesController.deletePractice
);

// ============================================
// RUTAS DE ASIGNACIÓN DE PRACTICANTES
// ============================================

// Asignar practicante a práctica
router.post('/:id/assign', 
    authorize('maestro', 'practicante', 'admin'),
    validatePracticeId,
    validateAssignPracticante,
    practicesController.assignPracticante
);

// Desasignar practicante de práctica
router.delete('/:id/practicantes/:practicanteId', 
    authorize('maestro', 'admin'),
    validatePracticeId,
    validatePracticanteId,
    practicesController.unassignPracticante
);

// Actualizar estado de asignación
router.patch('/:id/practicantes/:practicanteId/status', 
    authorize('maestro', 'practicante', 'admin'),
    validatePracticeId,
    validatePracticanteId,
    validateUpdateAssignmentStatus,
    practicesController.updateAssignmentStatus
);

// Calificar practicante (solo maestros)
router.post('/:id/practicantes/:practicanteId/grade', 
    authorize('maestro', 'admin'),
    validatePracticeId,
    validatePracticanteId,
    validateGradePracticante,
    practicesController.gradePracticante
);

// ============================================
// RUTAS DE DISPONIBILIDAD DE MAESTROS
// ============================================

// Obtener disponibilidad de un maestro
router.get('/maestros/:maestroId/disponibilidad',
    maestroAvailabilityController.getAvailability
);

// Obtener resumen semanal de disponibilidad
router.get('/maestros/:maestroId/disponibilidad/resumen',
    maestroAvailabilityController.getWeeklySummary
);

// Obtener slots disponibles para una fecha específica
router.get('/maestros/:maestroId/disponibilidad/slots',
    maestroAvailabilityController.getAvailableSlots
);

// Crear disponibilidad (solo maestros)
router.post('/maestros/:maestroId/disponibilidad',
    authorize('maestro', 'admin'),
    validateMaestroDisponibilidad,
    maestroAvailabilityController.createAvailability
);

// Actualizar disponibilidad (solo maestros)
router.put('/maestros/:maestroId/disponibilidad/:availabilityId',
    authorize('maestro', 'admin'),
    validateMaestroDisponibilidad,
    maestroAvailabilityController.updateAvailability
);

// Eliminar disponibilidad (solo maestros)
router.delete('/maestros/:maestroId/disponibilidad/:availabilityId',
    authorize('maestro', 'admin'),
    maestroAvailabilityController.deleteAvailability
);

module.exports = router;