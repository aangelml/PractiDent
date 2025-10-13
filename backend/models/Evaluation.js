// backend/models/Evaluation.js - SPRINT B4
const db = require('../config/database');

class Evaluation {
    constructor(data) {
        this.id = data.id;
        this.cita_id = data.cita_id;
        this.tipo = data.tipo;
        this.evaluador_id = data.evaluador_id;
        this.evaluado_id = data.evaluado_id;
        this.calificacion = data.calificacion;
        this.comentarios = data.comentarios;
        this.aspectos_positivos = data.aspectos_positivos;
        this.aspectos_mejorar = data.aspectos_mejorar;
        this.created_at = data.created_at;
    }

    // Crear nueva evaluación
    static async create(evaluationData) {
        const connection = await db.getConnection();
        
        try {
            await connection.beginTransaction();

            // 1. Verificar que la cita existe y está completada
            const [cita] = await connection.execute(
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
                [evaluationData.cita_id]
            );

            if (cita.length === 0) {
                throw new Error('Cita no encontrada');
            }

            if (cita[0].estado !== 'completada') {
                throw new Error('Solo se pueden evaluar citas completadas');
            }

            // 2. Verificar tipo de evaluación y permisos
            if (evaluationData.tipo === 'maestro_practicante') {
                // El maestro evalúa al practicante
                if (evaluationData.evaluador_id !== cita[0].maestro_usuario_id) {
                    throw new Error('Solo el maestro de la práctica puede evaluar al practicante');
                }
                if (evaluationData.evaluado_id !== cita[0].practicante_usuario_id) {
                    throw new Error('El evaluado debe ser el practicante de la cita');
                }
            } else if (evaluationData.tipo === 'paciente_servicio') {
                // El paciente evalúa el servicio (practicante)
                if (evaluationData.evaluador_id !== cita[0].paciente_usuario_id) {
                    throw new Error('Solo el paciente de la cita puede evaluar el servicio');
                }
                if (evaluationData.evaluado_id !== cita[0].practicante_usuario_id) {
                    throw new Error('El evaluado debe ser el practicante que atendió');
                }
            }

            // 3. Verificar que no exista una evaluación previa
            const [existing] = await connection.execute(
                `SELECT id FROM evaluaciones 
                 WHERE cita_id = ? AND tipo = ? AND evaluador_id = ?`,
                [evaluationData.cita_id, evaluationData.tipo, evaluationData.evaluador_id]
            );

            if (existing.length > 0) {
                throw new Error('Ya existe una evaluación de este tipo para esta cita');
            }

            // 4. Crear la evaluación
            const [result] = await connection.execute(
                `INSERT INTO evaluaciones (
                    cita_id, tipo, evaluador_id, evaluado_id, calificacion,
                    comentarios, aspectos_positivos, aspectos_mejorar
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    evaluationData.cita_id,
                    evaluationData.tipo,
                    evaluationData.evaluador_id,
                    evaluationData.evaluado_id,
                    evaluationData.calificacion,
                    evaluationData.comentarios || null,
                    evaluationData.aspectos_positivos || null,
                    evaluationData.aspectos_mejorar || null
                ]
            );

            const evaluationId = result.insertId;

            // 5. Registrar en audit_logs
            await connection.execute(
                `INSERT INTO audit_logs (usuario_id, accion, tabla_afectada, registro_id, descripcion)
                 VALUES (?, ?, ?, ?, ?)`,
                [
                    evaluationData.evaluador_id,
                    'CREATE',
                    'evaluaciones',
                    evaluationId,
                    `Evaluación ${evaluationData.tipo} creada para cita ${evaluationData.cita_id}`
                ]
            );

            await connection.commit();
            
            return { id: evaluationId, ...evaluationData };
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }

    // Obtener todas las evaluaciones con filtros
    static async findAll(filters = {}) {
        let query = `
            SELECT 
                e.*,
                CONCAT(ue.nombre, ' ', ue.apellado) as evaluador_nombre,
                ue.tipo_usuario as evaluador_tipo,
                CONCAT(uev.nombre, ' ', uev.apellado) as evaluado_nombre,
                c.fecha_hora as cita_fecha,
                c.motivo_consulta,
                p.nombre as practica_nombre,
                p.tipo_practica
            FROM evaluaciones e
            JOIN usuarios ue ON e.evaluador_id = ue.id
            JOIN usuarios uev ON e.evaluado_id = uev.id
            JOIN citas c ON e.cita_id = c.id
            JOIN practicas p ON c.practica_id = p.id
            WHERE 1=1
        `;

        const params = [];

        if (filters.tipo) {
            query += ' AND e.tipo = ?';
            params.push(filters.tipo);
        }

        if (filters.evaluador_id) {
            query += ' AND e.evaluador_id = ?';
            params.push(filters.evaluador_id);
        }

        if (filters.evaluado_id) {
            query += ' AND e.evaluado_id = ?';
            params.push(filters.evaluado_id);
        }

        if (filters.cita_id) {
            query += ' AND e.cita_id = ?';
            params.push(filters.cita_id);
        }

        if (filters.calificacion_min) {
            query += ' AND e.calificacion >= ?';
            params.push(filters.calificacion_min);
        }

        if (filters.calificacion_max) {
            query += ' AND e.calificacion <= ?';
            params.push(filters.calificacion_max);
        }

        query += ' ORDER BY e.created_at DESC';

        if (filters.limit) {
            query += ' LIMIT ?';
            params.push(parseInt(filters.limit));
        }

        if (filters.offset) {
            query += ' OFFSET ?';
            params.push(parseInt(filters.offset));
        }

        const [rows] = await db.execute(query, params);
        return rows;
    }

    // Obtener evaluación por ID
    static async findById(id) {
        const [rows] = await db.execute(
            `SELECT 
                e.*,
                CONCAT(ue.nombre, ' ', ue.apellido) as evaluador_nombre,
                ue.email as evaluador_email,
                ue.tipo_usuario as evaluador_tipo,
                CONCAT(uev.nombre, ' ', uev.apellido) as evaluado_nombre,
                uev.email as evaluado_email,
                c.id as cita_id,
                c.fecha_hora as cita_fecha,
                c.motivo_consulta,
                c.tratamiento_realizado,
                p.nombre as practica_nombre,
                p.tipo_practica,
                p.descripcion as practica_descripcion
             FROM evaluaciones e
             JOIN usuarios ue ON e.evaluador_id = ue.id
             JOIN usuarios uev ON e.evaluado_id = uev.id
             JOIN citas c ON e.cita_id = c.id
             JOIN practicas p ON c.practica_id = p.id
             WHERE e.id = ?`,
            [id]
        );

        if (rows.length === 0) return null;
        return rows[0];
    }

    // Obtener evaluaciones por cita
    static async findByCita(citaId) {
        const [rows] = await db.execute(
            `SELECT 
                e.*,
                CONCAT(ue.nombre, ' ', ue.apellido) as evaluador_nombre,
                ue.tipo_usuario as evaluador_tipo,
                CONCAT(uev.nombre, ' ', uev.apellido) as evaluado_nombre
             FROM evaluaciones e
             JOIN usuarios ue ON e.evaluador_id = ue.id
             JOIN usuarios uev ON e.evaluado_id = uev.id
             WHERE e.cita_id = ?
             ORDER BY e.tipo`,
            [citaId]
        );

        return rows;
    }

    // Obtener evaluaciones de un practicante (como evaluado)
    static async getByPracticante(practicanteUsuarioId) {
        const [rows] = await db.execute(
            `SELECT 
                e.*,
                CONCAT(ue.nombre, ' ', ue.apellido) as evaluador_nombre,
                ue.tipo_usuario as evaluador_tipo,
                c.fecha_hora as cita_fecha,
                p.nombre as practica_nombre,
                p.tipo_practica
             FROM evaluaciones e
             JOIN usuarios ue ON e.evaluador_id = ue.id
             JOIN citas c ON e.cita_id = c.id
             JOIN practicas p ON c.practica_id = p.id
             WHERE e.evaluado_id = ?
             ORDER BY e.created_at DESC`,
            [practicanteUsuarioId]
        );

        return rows;
    }

    // Obtener promedio de calificaciones de un practicante
    static async getPracticanteAverage(practicanteUsuarioId) {
        const [rows] = await db.execute(
            `SELECT 
                AVG(calificacion) as promedio_general,
                COUNT(*) as total_evaluaciones,
                AVG(CASE WHEN tipo = 'maestro_practicante' THEN calificacion END) as promedio_maestro,
                COUNT(CASE WHEN tipo = 'maestro_practicante' THEN 1 END) as total_maestro,
                AVG(CASE WHEN tipo = 'paciente_servicio' THEN calificacion END) as promedio_paciente,
                COUNT(CASE WHEN tipo = 'paciente_servicio' THEN 1 END) as total_paciente
             FROM evaluaciones
             WHERE evaluado_id = ?`,
            [practicanteUsuarioId]
        );

        return rows[0];
    }

    // Obtener estadísticas generales de evaluaciones
    static async getStatistics(filters = {}) {
        let query = `
            SELECT 
                COUNT(*) as total_evaluaciones,
                AVG(calificacion) as promedio_general,
                COUNT(CASE WHEN tipo = 'maestro_practicante' THEN 1 END) as total_maestro,
                AVG(CASE WHEN tipo = 'maestro_practicante' THEN calificacion END) as promedio_maestro,
                COUNT(CASE WHEN tipo = 'paciente_servicio' THEN 1 END) as total_paciente,
                AVG(CASE WHEN tipo = 'paciente_servicio' THEN calificacion END) as promedio_paciente,
                COUNT(CASE WHEN calificacion = 5 THEN 1 END) as evaluaciones_5_estrellas,
                COUNT(CASE WHEN calificacion >= 4 THEN 1 END) as evaluaciones_4_mas
            FROM evaluaciones
            WHERE 1=1
        `;

        const params = [];

        if (filters.evaluado_id) {
            query += ' AND evaluado_id = ?';
            params.push(filters.evaluado_id);
        }

        if (filters.tipo) {
            query += ' AND tipo = ?';
            params.push(filters.tipo);
        }

        const [rows] = await db.execute(query, params);
        return rows[0];
    }

    // Verificar si una cita ya tiene evaluación de un tipo específico
    static async hasEvaluation(citaId, tipo) {
        const [rows] = await db.execute(
            `SELECT COUNT(*) as count FROM evaluaciones WHERE cita_id = ? AND tipo = ?`,
            [citaId, tipo]
        );

        return rows[0].count > 0;
    }

    // Obtener citas pendientes de evaluar para un usuario
    static async getPendingEvaluations(userId, userType) {
        let query = '';
        
        if (userType === 'maestro') {
            query = `
                SELECT 
                    c.id as cita_id,
                    c.fecha_hora,
                    c.motivo_consulta,
                    p.nombre as practica_nombre,
                    CONCAT(up.nombre, ' ', up.apellido) as practicante_nombre,
                    pr.matricula,
                    CONCAT(upac.nombre, ' ', upac.apellido) as paciente_nombre,
                    EXISTS(
                        SELECT 1 FROM evaluaciones 
                        WHERE cita_id = c.id 
                        AND tipo = 'maestro_practicante' 
                        AND evaluador_id = ?
                    ) as ya_evaluada
                FROM citas c
                JOIN practicas p ON c.practica_id = p.id
                JOIN maestros m ON p.maestro_id = m.id
                JOIN practicantes pr ON c.practicante_id = pr.id
                JOIN usuarios up ON pr.usuario_id = up.id
                JOIN pacientes pac ON c.paciente_id = pac.id
                JOIN usuarios upac ON pac.usuario_id = upac.id
                WHERE m.usuario_id = ?
                AND c.estado = 'completada'
                HAVING ya_evaluada = 0
                ORDER BY c.fecha_hora DESC
            `;
            
            const [rows] = await db.execute(query, [userId, userId]);
            return rows;
        } else if (userType === 'paciente') {
            query = `
                SELECT 
                    c.id as cita_id,
                    c.fecha_hora,
                    c.motivo_consulta,
                    c.tratamiento_realizado,
                    p.nombre as practica_nombre,
                    CONCAT(up.nombre, ' ', up.apellido) as practicante_nombre,
                    EXISTS(
                        SELECT 1 FROM evaluaciones 
                        WHERE cita_id = c.id 
                        AND tipo = 'paciente_servicio' 
                        AND evaluador_id = ?
                    ) as ya_evaluada
                FROM citas c
                JOIN practicas p ON c.practica_id = p.id
                JOIN pacientes pac ON c.paciente_id = pac.id
                JOIN practicantes pr ON c.practicante_id = pr.id
                JOIN usuarios up ON pr.usuario_id = up.id
                WHERE pac.usuario_id = ?
                AND c.estado = 'completada'
                HAVING ya_evaluada = 0
                ORDER BY c.fecha_hora DESC
            `;
            
            const [rows] = await db.execute(query, [userId, userId]);
            return rows;
        }

        return [];
    }

    // Eliminar evaluación (solo admin)
    static async delete(id) {
        const [result] = await db.execute(
            'DELETE FROM evaluaciones WHERE id = ?',
            [id]
        );

        return result.affectedRows > 0;
    }
}

module.exports = Evaluation;