// backend/controllers/practicesController.js
const Practice = require('../models/Practice');
const db = require('../config/database');

// Obtener todas las prácticas
exports.getAllPractices = async (req, res) => {
    try {
        const { estado, tipo_practica, nivel_dificultad, search, page = 1, limit = 10 } = req.query;
        const offset = (page - 1) * limit;

        // Filtros según el tipo de usuario
        const filters = {
            estado,
            tipo_practica,
            nivel_dificultad,
            search,
            limit: parseInt(limit),
            offset: parseInt(offset)
        };

        // Si es maestro, solo ver sus prácticas
        if (req.user.tipo_usuario === 'maestro') {
            // Obtener el ID del maestro
            const [maestro] = await db.execute(
                'SELECT id FROM maestros WHERE usuario_id = ?',
                [req.user.userId]
            );
            if (maestro.length > 0) {
                filters.maestro_id = maestro[0].id;
            }
        }

        const practices = await Practice.findAll(filters);

        // Obtener total para paginación
        let countQuery = 'SELECT COUNT(*) as total FROM practicas WHERE 1=1';
        const countParams = [];

        if (filters.maestro_id) {
            countQuery += ' AND maestro_id = ?';
            countParams.push(filters.maestro_id);
        }
        if (estado) {
            countQuery += ' AND estado = ?';
            countParams.push(estado);
        }
        if (search) {
            countQuery += ' AND (nombre LIKE ? OR descripcion LIKE ?)';
            countParams.push(`%${search}%`, `%${search}%`);
        }

        const [countResult] = await db.execute(countQuery, countParams);
        const total = countResult[0].total;

        res.json({
            success: true,
            data: {
                practices,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    totalPages: Math.ceil(total / limit)
                }
            }
        });
    } catch (error) {
        console.error('Error getting practices:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener prácticas',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// Obtener práctica por ID
exports.getPracticeById = async (req, res) => {
    try {
        const { id } = req.params;
        const practice = await Practice.findById(id);

        if (!practice) {
            return res.status(404).json({
                success: false,
                message: 'Práctica no encontrada'
            });
        }

        // Obtener practicantes asignados
        const practicantes = await Practice.getPracticantes(id);

        res.json({
            success: true,
            data: {
                practice,
                practicantes
            }
        });
    } catch (error) {
        console.error('Error getting practice:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener práctica'
        });
    }
};

// Crear nueva práctica (solo maestros)
exports.createPractice = async (req, res) => {
    try {
        // Verificar que sea un maestro
        if (req.user.tipo_usuario !== 'maestro') {
            return res.status(403).json({
                success: false,
                message: 'Solo los maestros pueden crear prácticas'
            });
        }

        // Obtener el ID del maestro
        const [maestro] = await db.execute(
            'SELECT id FROM maestros WHERE usuario_id = ?',
            [req.user.userId]
        );

        if (maestro.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Maestro no encontrado'
            });
        }

        const practiceData = {
            ...req.body,
            maestro_id: maestro[0].id,
            created_by: req.user.userId
        };

        const practice = await Practice.create(practiceData);

        res.status(201).json({
            success: true,
            message: 'Práctica creada exitosamente',
            data: practice
        });
    } catch (error) {
        console.error('Error creating practice:', error);
        res.status(500).json({
            success: false,
            message: 'Error al crear práctica',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// Actualizar práctica
exports.updatePractice = async (req, res) => {
    try {
        const { id } = req.params;
        
        // Verificar que sea el maestro dueño de la práctica
        const practice = await Practice.findById(id);
        if (!practice) {
            return res.status(404).json({
                success: false,
                message: 'Práctica no encontrada'
            });
        }

        // Verificar permisos
        if (req.user.tipo_usuario === 'maestro') {
            const [maestro] = await db.execute(
                'SELECT id FROM maestros WHERE usuario_id = ?',
                [req.user.userId]
            );
            
            if (maestro.length === 0 || practice.maestro_id !== maestro[0].id) {
                return res.status(403).json({
                    success: false,
                    message: 'No tienes permiso para editar esta práctica'
                });
            }
        }

        const updatedPractice = await Practice.update(id, {
            ...req.body,
            updated_by: req.user.userId
        });

        res.json({
            success: true,
            message: 'Práctica actualizada exitosamente',
            data: updatedPractice
        });
    } catch (error) {
        console.error('Error updating practice:', error);
        res.status(500).json({
            success: false,
            message: 'Error al actualizar práctica'
        });
    }
};

// Eliminar práctica
exports.deletePractice = async (req, res) => {
    try {
        const { id } = req.params;
        
        // Verificar que sea el maestro dueño
        const practice = await Practice.findById(id);
        if (!practice) {
            return res.status(404).json({
                success: false,
                message: 'Práctica no encontrada'
            });
        }

        if (req.user.tipo_usuario === 'maestro') {
            const [maestro] = await db.execute(
                'SELECT id FROM maestros WHERE usuario_id = ?',
                [req.user.userId]
            );
            
            if (maestro.length === 0 || practice.maestro_id !== maestro[0].id) {
                return res.status(403).json({
                    success: false,
                    message: 'No tienes permiso para eliminar esta práctica'
                });
            }
        }

        await Practice.delete(id, req.user.userId);

        res.json({
            success: true,
            message: 'Práctica eliminada exitosamente'
        });
    } catch (error) {
        console.error('Error deleting practice:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Error al eliminar práctica'
        });
    }
};

// Asignar practicante a práctica
exports.assignPracticante = async (req, res) => {
    try {
        const { id } = req.params;
        const { practicante_id } = req.body;

        // Verificar que sea maestro o el mismo practicante
        if (req.user.tipo_usuario === 'practicante') {
            const [practicante] = await db.execute(
                'SELECT id FROM practicantes WHERE usuario_id = ?',
                [req.user.userId]
            );
            
            if (practicante.length === 0 || practicante[0].id !== parseInt(practicante_id)) {
                return res.status(403).json({
                    success: false,
                    message: 'Solo puedes asignarte a ti mismo'
                });
            }
        }

        const result = await Practice.assignPracticante(id, practicante_id);

        if (result.success) {
            res.json({
                success: true,
                message: result.message
            });
        } else {
            res.status(400).json({
                success: false,
                message: result.message
            });
        }
    } catch (error) {
        console.error('Error assigning practicante:', error);
        res.status(500).json({
            success: false,
            message: 'Error al asignar practicante'
        });
    }
};

// Desasignar practicante de práctica
exports.unassignPracticante = async (req, res) => {
    try {
        const { id, practicanteId } = req.params;

        await Practice.unassignPracticante(id, practicanteId);

        res.json({
            success: true,
            message: 'Practicante desasignado exitosamente'
        });
    } catch (error) {
        console.error('Error unassigning practicante:', error);
        res.status(500).json({
            success: false,
            message: 'Error al desasignar practicante'
        });
    }
};

// Obtener practicantes de una práctica
exports.getPracticantes = async (req, res) => {
    try {
        const { id } = req.params;
        const practicantes = await Practice.getPracticantes(id);

        res.json({
            success: true,
            data: practicantes
        });
    } catch (error) {
        console.error('Error getting practicantes:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener practicantes'
        });
    }
};

// Obtener prácticas del practicante actual
exports.getMyPractices = async (req, res) => {
    try {
        if (req.user.tipo_usuario !== 'practicante') {
            return res.status(403).json({
                success: false,
                message: 'Solo los practicantes pueden ver sus prácticas'
            });
        }

        // Usar directamente req.user.userId (no buscar en tabla practicantes)
        const practices = await Practice.getByPracticante(req.user.userId);

        res.json({
            success: true,
            data: practices
        });
    } catch (error) {
        console.error('Error getting my practices:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener tus prácticas'
        });
    }
};

// Actualizar estado de asignación
exports.updateAssignmentStatus = async (req, res) => {
    try {
        const { id, practicanteId } = req.params;
        const { estado, observaciones } = req.body;

        const validStates = ['asignado', 'en_progreso', 'completado', 'cancelado'];
        if (!validStates.includes(estado)) {
            return res.status(400).json({
                success: false,
                message: 'Estado inválido'
            });
        }

        const updated = await Practice.updateAssignmentStatus(
            id, 
            practicanteId, 
            estado, 
            observaciones
        );

        if (updated) {
            res.json({
                success: true,
                message: 'Estado actualizado exitosamente'
            });
        } else {
            res.status(404).json({
                success: false,
                message: 'Asignación no encontrada'
            });
        }
    } catch (error) {
        console.error('Error updating assignment status:', error);
        res.status(500).json({
            success: false,
            message: 'Error al actualizar estado'
        });
    }
};

// Calificar practicante
exports.gradePracticante = async (req, res) => {
    try {
        if (req.user.tipo_usuario !== 'maestro') {
            return res.status(403).json({
                success: false,
                message: 'Solo los maestros pueden calificar'
            });
        }

        const { id, practicanteId } = req.params;
        const { calificacion, observaciones } = req.body;

        if (calificacion < 0 || calificacion > 10) {
            return res.status(400).json({
                success: false,
                message: 'La calificación debe estar entre 0 y 10'
            });
        }

        const updated = await Practice.gradePracticante(
            id, 
            practicanteId, 
            calificacion, 
            observaciones
        );

        if (updated) {
            res.json({
                success: true,
                message: 'Calificación registrada exitosamente'
            });
        } else {
            res.status(404).json({
                success: false,
                message: 'Asignación no encontrada'
            });
        }
    } catch (error) {
        console.error('Error grading practicante:', error);
        res.status(500).json({
            success: false,
            message: 'Error al calificar'
        });
    }
};

// Obtener estadísticas
exports.getStatistics = async (req, res) => {
    try {
        let maestroId = null;
        
        if (req.user.tipo_usuario === 'maestro') {
            const [maestro] = await db.execute(
                'SELECT id FROM maestros WHERE usuario_id = ?',
                [req.user.userId]
            );
            if (maestro.length > 0) {
                maestroId = maestro[0].id;
            }
        }

        const statistics = await Practice.getStatistics(maestroId);

        res.json({
            success: true,
            data: statistics
        });
    } catch (error) {
        console.error('Error getting statistics:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener estadísticas'
        });
    }
};