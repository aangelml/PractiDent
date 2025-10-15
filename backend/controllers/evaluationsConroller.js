// backend/controllers/evaluationsController.js - SPRINT B4
const Evaluation = require('../models/Evaluation');
const db = require('../config/database');

// Obtener todas las evaluaciones
exports.getAllEvaluations = async (req, res) => {
    try {
        const { tipo, calificacion_min, calificacion_max, page = 1, limit = 10 } = req.query;
        const offset = (page - 1) * limit;

        const filters = {
            tipo,
            calificacion_min,
            calificacion_max,
            limit: parseInt(limit),
            offset: parseInt(offset)
        };

        // Filtros según el rol del usuario
        if (req.user.tipo_usuario === 'maestro') {
            // Maestros solo ven evaluaciones donde ellos son evaluadores
            filters.evaluador_id = req.user.userId;
        } else if (req.user.tipo_usuario === 'practicante') {
            // Practicantes solo ven evaluaciones donde ellos son evaluados
            filters.evaluado_id = req.user.userId;
        } else if (req.user.tipo_usuario === 'paciente') {
            // Pacientes solo ven sus propias evaluaciones
            filters.evaluador_id = req.user.userId;
        }
        // Admin puede ver todas sin filtros adicionales

        const evaluations = await Evaluation.findAll(filters);

        // Obtener total para paginación
        let countQuery = 'SELECT COUNT(*) as total FROM evaluaciones WHERE 1=1';
        const countParams = [];

        if (filters.evaluador_id) {
            countQuery += ' AND evaluador_id = ?';
            countParams.push(filters.evaluador_id);
        }
        if (filters.evaluado_id) {
            countQuery += ' AND evaluado_id = ?';
            countParams.push(filters.evaluado_id);
        }
        if (tipo) {
            countQuery += ' AND tipo = ?';
            countParams.push(tipo);
        }

        const [countResult] = await db.execute(countQuery, countParams);
        const total = countResult[0].total;

        res.json({
            success: true,
            data: {
                evaluations,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    totalPages: Math.ceil(total / limit)
                }
            }
        });
    } catch (error) {
        console.error('Error getting evaluations:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener evaluaciones',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// Obtener evaluación por ID
exports.getEvaluationById = async (req, res) => {
    try {
        const { id } = req.params;
        const evaluation = await Evaluation.findById(id);

        if (!evaluation) {
            return res.status(404).json({
                success: false,
                message: 'Evaluación no encontrada'
            });
        }

        // Verificar permisos
        const canView = 
            req.user.tipo_usuario === 'admin' ||
            evaluation.evaluador_id === req.user.userId ||
            evaluation.evaluado_id === req.user.userId;

        if (!canView) {
            return res.status(403).json({
                success: false,
                message: 'No tienes permiso para ver esta evaluación'
            });
        }

        res.json({
            success: true,
            data: evaluation
        });
    } catch (error) {
        console.error('Error getting evaluation:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener evaluación'
        });
    }
};

// Crear evaluación maestro → practicante
exports.createMaestroPracticanteEvaluation = async (req, res) => {
    try {
        // Solo maestros y admin pueden crear este tipo de evaluación
        if (req.user.tipo_usuario !== 'maestro' && req.user.tipo_usuario !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Solo maestros pueden evaluar practicantes'
            });
        }

        const evaluationData = {
            ...req.body,
            tipo: 'maestro_practicante',
            evaluador_id: req.user.userId
        };

        // Validar campos obligatorios
        if (!evaluationData.comentarios) {
            return res.status(400).json({
                success: false,
                message: 'Los comentarios son obligatorios para evaluaciones de maestro'
            });
        }

        const evaluation = await Evaluation.create(evaluationData);

        res.status(201).json({
            success: true,
            message: 'Evaluación de practicante creada exitosamente',
            data: evaluation
        });
    } catch (error) {
        console.error('Error creating maestro evaluation:', error);
        
        if (error.message.includes('Ya existe')) {
            return res.status(409).json({
                success: false,
                message: error.message
            });
        }
        
        if (error.message.includes('completada') || error.message.includes('Solo')) {
            return res.status(400).json({
                success: false,
                message: error.message
            });
        }

        res.status(500).json({
            success: false,
            message: 'Error al crear evaluación',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// Crear evaluación paciente → servicio
exports.createPacienteServicioEvaluation = async (req, res) => {
    try {
        // Solo pacientes pueden crear este tipo de evaluación
        if (req.user.tipo_usuario !== 'paciente') {
            return res.status(403).json({
                success: false,
                message: 'Solo pacientes pueden evaluar el servicio'
            });
        }

        const evaluationData = {
            ...req.body,
            tipo: 'paciente_servicio',
            evaluador_id: req.user.userId
        };

        const evaluation = await Evaluation.create(evaluationData);

        res.status(201).json({
            success: true,
            message: 'Evaluación del servicio creada exitosamente',
            data: evaluation
        });
    } catch (error) {
        console.error('Error creating patient evaluation:', error);
        
        if (error.message.includes('Ya existe')) {
            return res.status(409).json({
                success: false,
                message: error.message
            });
        }
        
        if (error.message.includes('completada') || error.message.includes('Solo')) {
            return res.status(400).json({
                success: false,
                message: error.message
            });
        }

        res.status(500).json({
            success: false,
            message: 'Error al crear evaluación',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// Obtener evaluaciones de un practicante
exports.getPracticanteEvaluations = async (req, res) => {
    try {
        const { id } = req.params;

        // Verificar permisos
        if (req.user.tipo_usuario === 'practicante' && req.user.userId !== parseInt(id)) {
            return res.status(403).json({
                success: false,
                message: 'No tienes permiso para ver estas evaluaciones'
            });
        }

        const evaluations = await Evaluation.getByPracticante(id);
        const average = await Evaluation.getPracticanteAverage(id);

        res.json({
            success: true,
            data: {
                evaluations,
                statistics: average
            }
        });
    } catch (error) {
        console.error('Error getting practicante evaluations:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener evaluaciones del practicante'
        });
    }
};

// Obtener evaluaciones por cita
exports.getEvaluationsByCita = async (req, res) => {
    try {
        const { citaId } = req.params;

        // Verificar que la cita existe
        const [cita] = await db.execute(
            `SELECT c.*, 
                pr.usuario_id as practicante_usuario_id,
                pac.usuario_id as paciente_usuario_id,
                m.usuario_id as maestro_usuario_id
             FROM citas c
             JOIN practicantes pr ON c.practicante_id = pr.id
             JOIN pacientes pac ON c.paciente_id = pac.id
             JOIN practicas p ON c.practica_id = p.id
             JOIN maestros m ON p.maestro_id = m.id
             WHERE c.id = ?`,
            [citaId]
        );

        if (cita.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Cita no encontrada'
            });
        }

        // Verificar permisos
        const canView = 
            req.user.tipo_usuario === 'admin' ||
            req.user.userId === cita[0].practicante_usuario_id ||
            req.user.userId === cita[0].paciente_usuario_id ||
            req.user.userId === cita[0].maestro_usuario_id;

        if (!canView) {
            return res.status(403).json({
                success: false,
                message: 'No tienes permiso para ver las evaluaciones de esta cita'
            });
        }

        const evaluations = await Evaluation.findByCita(citaId);

        res.json({
            success: true,
            data: {
                cita_id: citaId,
                evaluations,
                tiene_evaluacion_maestro: evaluations.some(e => e.tipo === 'maestro_practicante'),
                tiene_evaluacion_paciente: evaluations.some(e => e.tipo === 'paciente_servicio')
            }
        });
    } catch (error) {
        console.error('Error getting evaluations by cita:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener evaluaciones de la cita'
        });
    }
};

// Obtener estadísticas de evaluaciones
exports.getStatistics = async (req, res) => {
    try {
        let filters = {};

        // Si es practicante, solo sus estadísticas
        if (req.user.tipo_usuario === 'practicante') {
            filters.evaluado_id = req.user.userId;
        }

        const statistics = await Evaluation.getStatistics(filters);

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

// Obtener citas pendientes de evaluar
exports.getPendingEvaluations = async (req, res) => {
    try {
        const userType = req.user.tipo_usuario;

        if (userType !== 'maestro' && userType !== 'paciente') {
            return res.status(403).json({
                success: false,
                message: 'Solo maestros y pacientes pueden ver citas pendientes de evaluar'
            });
        }

        const pendingCitas = await Evaluation.getPendingEvaluations(req.user.userId, userType);

        res.json({
            success: true,
            data: {
                total: pendingCitas.length,
                citas: pendingCitas
            }
        });
    } catch (error) {
        console.error('Error getting pending evaluations:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener citas pendientes de evaluar'
        });
    }
};

// Obtener mis evaluaciones realizadas
exports.getMyEvaluations = async (req, res) => {
    try {
        const evaluations = await Evaluation.findAll({
            evaluador_id: req.user.userId
        });

        res.json({
            success: true,
            data: {
                total: evaluations.length,
                evaluations
            }
        });
    } catch (error) {
        console.error('Error getting my evaluations:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener tus evaluaciones'
        });
    }
};

// Obtener evaluaciones recibidas (practicantes)
exports.getMyReceivedEvaluations = async (req, res) => {
    try {
        if (req.user.tipo_usuario !== 'practicante') {
            return res.status(403).json({
                success: false,
                message: 'Solo practicantes pueden ver evaluaciones recibidas'
            });
        }

        const evaluations = await Evaluation.getByPracticante(req.user.userId);
        const average = await Evaluation.getPracticanteAverage(req.user.userId);

        res.json({
            success: true,
            data: {
                total: evaluations.length,
                evaluations,
                statistics: average
            }
        });
    } catch (error) {
        console.error('Error getting received evaluations:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener evaluaciones recibidas'
        });
    }
};

// Eliminar evaluación (solo admin)
exports.deleteEvaluation = async (req, res) => {
    try {
        if (req.user.tipo_usuario !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Solo administradores pueden eliminar evaluaciones'
            });
        }

        const { id } = req.params;
        const evaluation = await Evaluation.findById(id);

        if (!evaluation) {
            return res.status(404).json({
                success: false,
                message: 'Evaluación no encontrada'
            });
        }

        const deleted = await Evaluation.delete(id);

        if (deleted) {
            // Registrar en audit_logs
            await db.execute(
                `INSERT INTO audit_logs (usuario_id, accion, tabla_afectada, registro_id, descripcion)
                 VALUES (?, ?, ?, ?, ?)`,
                [req.user.userId, 'DELETE', 'evaluaciones', id, 'Evaluación eliminada por administrador']
            );

            res.json({
                success: true,
                message: 'Evaluación eliminada exitosamente'
            });
        } else {
            res.status(400).json({
                success: false,
                message: 'No se pudo eliminar la evaluación'
            });
        }
    } catch (error) {
        console.error('Error deleting evaluation:', error);
        res.status(500).json({
            success: false,
            message: 'Error al eliminar evaluación'
        });
    }
};