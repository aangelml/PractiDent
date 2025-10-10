// backend/routes/users.js
const router = require('express').Router();
const authMiddleware = require('../middleware/authSimple');
const db = require('../config/database');

// Obtener todos los usuarios (solo para maestros)
router.get('/', authMiddleware, async (req, res) => {
    try {
        const [users] = await db.execute(
            'SELECT id, nombre, apellido, email, telefono, tipo_usuario FROM usuarios LIMIT 20'
        );
        
        res.json({
            success: true,
            users,
            pagination: {
                total: users.length,
                page: 1,
                limit: 20,
                totalPages: 1
            }
        });
    } catch (error) {
        console.error('Error getting users:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error al obtener usuarios' 
        });
    }
});

// Obtener un usuario por ID
router.get('/:id', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const [users] = await db.execute(
            'SELECT id, nombre, apellido, email, telefono, tipo_usuario FROM usuarios WHERE id = ?',
            [id]
        );

        if (users.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado'
            });
        }

        res.json({
            success: true,
            data: users[0]
        });
    } catch (error) {
        console.error('Error getting user:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error al obtener usuario' 
        });
    }
});

// Actualizar usuario (incluye actualización de teléfono)
router.put('/:id', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.userId || req.user.id;
        
        // Verificar que el usuario solo pueda actualizar su propio perfil
        if (parseInt(id) !== parseInt(userId)) {
            return res.status(403).json({
                success: false,
                message: 'No autorizado para actualizar este perfil'
            });
        }

        const { nombre, apellido, telefono } = req.body;

        // Actualizar usuario
        await db.execute(
            'UPDATE usuarios SET nombre = ?, apellido = ?, telefono = ? WHERE id = ?',
            [nombre, apellido, telefono || null, id]
        );

        res.json({
            success: true,
            message: 'Perfil actualizado exitosamente'
        });
    } catch (error) {
        console.error('Error updating user:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error al actualizar usuario' 
        });
    }
});

// Obtener maestros disponibles
router.get('/maestros', authMiddleware, async (req, res) => {
    try {
        const [maestros] = await db.execute(
            `SELECT u.id, u.nombre, u.apellido, m.especialidad 
             FROM usuarios u 
             LEFT JOIN maestros m ON u.id = m.usuario_id 
             WHERE u.tipo_usuario = 'maestro'`
        );
        
        res.json({
            success: true,
            data: maestros
        });
    } catch (error) {
        console.error('Error getting maestros:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error al obtener maestros' 
        });
    }
});

module.exports = router;