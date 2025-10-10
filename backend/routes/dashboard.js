// backend/routes/dashboard.js
const router = require('express').Router();
const authMiddleware = require('../middleware/authSimple');

// Ruta principal del dashboard
router.get('/', authMiddleware, async (req, res) => {
    try {
        res.json({ 
            success: true,
            message: 'Dashboard endpoint', 
            data: {
                user: {
                    id: req.user.userId || req.user.id,
                    nombre: req.user.nombre,
                    apellido: req.user.apellido,
                    email: req.user.email,
                    tipo_usuario: req.user.tipo_usuario
                },
                estadisticas: {
                    total_citas: 0,
                    citas_pendientes: 0,
                    citas_completadas: 0,
                    promedio_evaluaciones: 0
                },
                proximasCitas: [],
                evaluacionesRecientes: []
            }
        });
    } catch (error) {
        console.error('Dashboard error:', error);
        res.status(500).json({
            success: false,
            message: 'Error al cargar el dashboard'
        });
    }
});

// Obtener notificaciones
router.get('/notifications', authMiddleware, (req, res) => {
    res.json({ 
        success: true,
        data: [],
        message: 'No hay notificaciones nuevas'
    });
});

module.exports = router;