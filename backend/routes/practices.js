// backend/routes/practices.js
const router = require('express').Router();
const { authenticate, authorize } = require('../middleware/auth');
const practicesController = require('../controllers/practicesController');

// Rutas públicas (requieren autenticación)
router.use(authenticate);

// Obtener todas las prácticas (todos los usuarios autenticados)
router.get('/', practicesController.getAllPractices);

// Obtener estadísticas
router.get('/statistics', practicesController.getStatistics);

// Obtener mis prácticas (solo practicantes)
router.get('/my-practices', 
    authorize('practicante'),
    practicesController.getMyPractices
);

// Obtener práctica por ID
router.get('/:id', practicesController.getPracticeById);

// Obtener practicantes de una práctica
router.get('/:id/practicantes', practicesController.getPracticantes);

// Crear nueva práctica (solo maestros)
router.post('/', 
    authorize('maestro'),
    practicesController.createPractice
);

// Actualizar práctica (solo maestros)
router.put('/:id', 
    authorize('maestro'),
    practicesController.updatePractice
);

// Eliminar práctica (solo maestros)
router.delete('/:id', 
    authorize('maestro'),
    practicesController.deletePractice
);

// Asignar practicante a práctica
router.post('/:id/assign', 
    authorize('maestro', 'practicante'),
    practicesController.assignPracticante
);

// Desasignar practicante de práctica
router.delete('/:id/unassign/:practicanteId', 
    authorize('maestro'),
    practicesController.unassignPracticante
);

// Actualizar estado de asignación
router.patch('/:id/practicante/:practicanteId/status', 
    authorize('maestro', 'practicante'),
    practicesController.updateAssignmentStatus
);

// Calificar practicante (solo maestros)
router.post('/:id/practicante/:practicanteId/grade', 
    authorize('maestro'),
    practicesController.gradePracticante
);

module.exports = router;