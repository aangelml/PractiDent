// backend/routes/appointments.js - VERSIÓN FINAL CORREGIDA
const router = require('express').Router();
const authSimple = require('../middleware/authSimple'); // ← Usando authSimple que sí existe
const appointmentsController = require('../controllers/appointmentsController');

// ============================================
// TODAS LAS RUTAS REQUIEREN AUTENTICACIÓN
// ============================================
router.use(authSimple);

// ============================================
// RUTAS DE CONSULTA (SIN AUTORIZACIÓN ADICIONAL)
// ============================================

// ⭐ CRÍTICO: Este endpoint debe estar ANTES que otros GET para evitar conflictos
// Obtener horarios disponibles - ACCESIBLE PARA TODOS LOS USUARIOS AUTENTICADOS
router.get('/available-slots', appointmentsController.getAvailableSlots);

// Obtener estadísticas
router.get('/statistics', appointmentsController.getStatistics);

// Obtener mis citas (practicante) - ruta específica antes de /:id
router.get('/my-appointments', appointmentsController.getMyAppointments);

// Obtener mis citas (paciente) - ruta específica antes de /:id
router.get('/patient/my-appointments', appointmentsController.getPatientAppointments);

// Obtener todas las citas (con filtros según rol en el controlador)
router.get('/', appointmentsController.getAllAppointments);

// Obtener cita por ID (debe ir después de rutas específicas)
router.get('/:id', appointmentsController.getAppointmentById);

// ============================================
// RUTAS DE CREACIÓN Y MODIFICACIÓN
// ============================================

// ⭐ CRÍTICO: Crear cita - AHORA PERMITE PACIENTES
// La autorización por rol se maneja en el controlador
router.post('/', appointmentsController.createAppointment);

// Actualizar cita (calificación) - todos pueden calificar sus propias citas
router.put('/:id', appointmentsController.updateAppointment);

// ============================================
// RUTAS DE CAMBIO DE ESTADO
// ============================================

// Confirmar cita - la validación de rol se hace en el controlador
router.patch('/:id/confirm', appointmentsController.confirmAppointment);

// Cancelar cita - todos pueden cancelar (validación en controlador)
router.patch('/:id/cancel', appointmentsController.cancelAppointment);

// Completar cita - validación en controlador
router.patch('/:id/complete', appointmentsController.completeAppointment);

// Marcar como no asistió - validación en controlador
router.patch('/:id/no-show', appointmentsController.markNoShow);

module.exports = router;