// backend/routes/evaluations.js - SPRINT B4
const express = require('express');
const router = express.Router();
const evaluationsController = require('../controllers/evaluationsController');
const authSimple = require('../middleware/authSimple');
const { authorize } = require('../middleware/roleAuth');
const {
    validateCreateMaestroEvaluation,
    validateCreatePacienteEvaluation,
    validateEvaluationId,
    validateEvaluationFilters
} = require('../middleware/validators');

// Todas las rutas requieren autenticación
router.use(authSimple);

// ============================================
// RUTAS DE CONSULTA
// ============================================

// Obtener estadísticas de evaluaciones
// GET /api/evaluations/statistics
router.get(
    '/statistics',
    authorize('admin', 'maestro', 'practicante'),
    evaluationsController.getStatistics
);

// Obtener citas pendientes de evaluar
// GET /api/evaluations/pending
router.get(
    '/pending',
    authorize('maestro', 'paciente'),
    evaluationsController.getPendingEvaluations
);

// Obtener mis evaluaciones realizadas
// GET /api/evaluations/my-evaluations
router.get(
    '/my-evaluations',
    authorize('maestro', 'paciente'),
    evaluationsController.getMyEvaluations
);

// Obtener evaluaciones recibidas (practicantes)
// GET /api/evaluations/received
router.get(
    '/received',
    authorize('practicante'),
    evaluationsController.getMyReceivedEvaluations
);

// Obtener evaluaciones de un practicante específico
// GET /api/evaluations/practicante/:id
router.get(
    '/practicante/:id',
    authorize('admin', 'maestro', 'practicante'),
    evaluationsController.getPracticanteEvaluations
);

// Obtener evaluaciones de una cita específica
// GET /api/evaluations/by-cita/:citaId
router.get(
    '/by-cita/:citaId',
    evaluationsController.getEvaluationsByCita
);

// Obtener todas las evaluaciones (con filtros)
// GET /api/evaluations
router.get(
    '/',
    validateEvaluationFilters,
    evaluationsController.getAllEvaluations
);

// Obtener evaluación por ID
// GET /api/evaluations/:id
router.get(
    '/:id',
    validateEvaluationId,
    evaluationsController.getEvaluationById
);

// ============================================
// RUTAS DE CREACIÓN
// ============================================

// Crear evaluación maestro → practicante
// POST /api/evaluations/maestro-practicante
router.post(
    '/maestro-practicante',
    authorize('maestro', 'admin'),
    validateCreateMaestroEvaluation,
    evaluationsController.createMaestroPracticanteEvaluation
);

// Crear evaluación paciente → servicio
// POST /api/evaluations/paciente-servicio
router.post(
    '/paciente-servicio',
    authorize('paciente'),
    validateCreatePacienteEvaluation,
    evaluationsController.createPacienteServicioEvaluation
);

// ============================================
// RUTAS DE ELIMINACIÓN (solo admin)
// ============================================

// Eliminar evaluación
// DELETE /api/evaluations/:id
router.delete(
    '/:id',
    authorize('admin'),
    validateEvaluationId,
    evaluationsController.deleteEvaluation
);

module.exports = router;