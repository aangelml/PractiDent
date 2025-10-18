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
        
        // Admin puede actualizar cualquiera, otros solo su perfil
        if (req.user.tipo_usuario !== 'admin' && parseInt(id) !== parseInt(userId)) {
            return res.status(403).json({
                success: false,
                message: 'No autorizado para actualizar este perfil'
            });
        }

        const { nombre, apellido, telefono, estado } = req.body;

        await db.execute(
            'UPDATE usuarios SET nombre = ?, apellido = ?, telefono = ?, estado = ? WHERE id = ?',
            [nombre, apellido, telefono || null, estado || 'activo', id]
        );

        const [updatedUser] = await db.execute(
            'SELECT id, nombre, apellido, email, telefono, tipo_usuario, estado FROM usuarios WHERE id = ?',
            [id]
        );

        res.json({
            success: true,
            message: 'Usuario actualizado exitosamente',
            data: updatedUser[0]
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

// AGREGAR ESTOS ENDPOINTS A backend/routes/users.js

// Crear nuevo usuario (solo admin)
router.post('/', authMiddleware, async (req, res) => {
    try {
        // Verificar que el usuario sea admin
        if (req.user.tipo_usuario !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Solo administradores pueden crear usuarios'
            });
        }

        const { nombre, apellido, email, telefono, tipo_usuario, estado, password } = req.body;

        // Validaciones básicas
        if (!nombre || !apellido || !email || !tipo_usuario || !password) {
            return res.status(400).json({
                success: false,
                message: 'Faltan campos requeridos',
                errors: []
            });
        }

        // Verificar que el email no exista
        const [existingUser] = await db.execute(
            'SELECT id FROM usuarios WHERE email = ?',
            [email]
        );

        if (existingUser.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'El email ya existe',
                errors: [{ field: 'email', message: 'Email ya registrado' }]
            });
        }

        // Hash de la contraseña
        const bcrypt = require('bcryptjs');
        const hashedPassword = await bcrypt.hash(password, 12);

        // Insertar usuario
        const [result] = await db.execute(
            'INSERT INTO usuarios (nombre, apellido, email, telefono, tipo_usuario, estado, password) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [nombre, apellido, email, telefono || null, tipo_usuario, estado || 'activo', hashedPassword]
        );

        // Obtener el usuario creado
        const [newUser] = await db.execute(
            'SELECT id, nombre, apellido, email, telefono, tipo_usuario, estado FROM usuarios WHERE id = ?',
            [result.insertId]
        );

        res.status(201).json({
            success: true,
            message: 'Usuario creado exitosamente',
            data: newUser[0]
        });
    } catch (error) {
        console.error('Error creating user:', error);
        res.status(500).json({
            success: false,
            message: 'Error al crear usuario',
            error: error.message
        });
    }
});

// Eliminar usuario (soft delete - cambiar estado a inactivo)
router.delete('/:id', authMiddleware, async (req, res) => {
    try {
        // Verificar que el usuario sea admin
        if (req.user.tipo_usuario !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Solo administradores pueden eliminar usuarios'
            });
        }

        const { id } = req.params;

        // No permitir eliminar al admin principal
        const [user] = await db.execute(
            'SELECT id, tipo_usuario FROM usuarios WHERE id = ?',
            [id]
        );

        if (user.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado'
            });
        }

        if (user[0].id === 1 && user[0].tipo_usuario === 'admin') {
            return res.status(403).json({
                success: false,
                message: 'No se puede eliminar el administrador principal'
            });
        }

        // Soft delete: cambiar estado a inactivo
        await db.execute(
            'UPDATE usuarios SET estado = ? WHERE id = ?',
            ['inactivo', id]
        );

        res.json({
            success: true,
            message: 'Usuario eliminado exitosamente'
        });
    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({
            success: false,
            message: 'Error al eliminar usuario',
            error: error.message
        });
    }
});

module.exports = router;