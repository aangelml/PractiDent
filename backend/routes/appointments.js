// backend/routes/appointments.js - COMPLETO SPRINT B3
const router = require('express').Router();
const authSimple = require('../middleware/authSimple');
const { authorize } = require('../middleware/roleAuth');
const appointmentsController = require('../controllers/appointmentsController');
const {
    validateCreateAppointment,
    validateUpdateAppointment,
    validateCancelAppointment,
    validateCompleteAppointment,
    validateAppointmentId,
    validateAppointmentFilters,
    validateAvailableSlots
} = require('../middleware/validators');

// ============================================
// TODAS LAS RUTAS REQUIEREN AUTENTICACIÓN
// ============================================
router.use(authSimple);

// ============================================
// RUTAS DE CONSULTA
// ============================================

// Obtener estadísticas de citas
router.get('/statistics', appointmentsController.getStatistics);

// Obtener horarios disponibles para agendar
router.get('/available-slots',
    validateAvailableSlots,
    appointmentsController.getAvailableSlots
);

// Obtener todas las citas (con filtros según rol)
router.get('/',
    validateAppointmentFilters,
    appointmentsController.getAllAppointments
);

// Obtener mis citas (practicante)
router.get('/my-appointments',
    authorize('practicante'),
    appointmentsController.getMyAppointments
);

// Obtener mis citas (paciente)
router.get('/patient/my-appointments',
    authorize('paciente'),
    appointmentsController.getPatientAppointments
);

// Obtener cita por ID
router.get('/:id',
    validateAppointmentId,
    appointmentsController.getAppointmentById
);

// ============================================
// RUTAS DE CREACIÓN Y MODIFICACIÓN
// ============================================

// Crear nueva cita (practicantes, maestros y admin)
router.post('/',
    authorize('practicante', 'admin', 'maestro'),
    validateCreateAppointment,
    appointmentsController.createAppointment
);

// Actualizar cita
router.put('/:id',
    authorize('practicante', 'maestro', 'admin'),
    validateAppointmentId,
    validateUpdateAppointment,
    appointmentsController.updateAppointment
);

// ============================================
// RUTAS DE CAMBIO DE ESTADO
// ============================================

// Confirmar cita
router.patch('/:id/confirm',
    authorize('practicante', 'maestro', 'admin'),
    validateAppointmentId,
    appointmentsController.confirmAppointment
);

// Cancelar cita
router.patch('/:id/cancel',
    authorize('paciente', 'practicante', 'maestro', 'admin'),
    validateAppointmentId,
    validateCancelAppointment,
    appointmentsController.cancelAppointment
);

// Completar cita
router.patch('/:id/complete',
    authorize('practicante', 'maestro', 'admin'),
    validateAppointmentId,
    validateCompleteAppointment,
    appointmentsController.completeAppointment
);

// Marcar como no asistió
router.patch('/:id/no-show',
    authorize('practicante', 'maestro', 'admin'),
    validateAppointmentId,
    appointmentsController.markNoShow
);

module.exports = router;