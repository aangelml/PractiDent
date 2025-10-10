// backend/models/Practice.js
const db = require('../config/database');

class Practice {
    constructor(data) {
        this.id = data.id;
        this.maestro_id = data.maestro_id;
        this.nombre = data.nombre;
        this.descripcion = data.descripcion;
        this.requisitos = data.requisitos;
        this.tipo_practica = data.tipo_practica;
        this.duracion_estimada_horas = data.duracion_estimada_horas;
        this.fecha_inicio = data.fecha_inicio;
        this.fecha_fin = data.fecha_fin;
        this.estado = data.estado;
        this.nivel_dificultad = data.nivel_dificultad;
        this.cupo_maximo = data.cupo_maximo;
        this.cupo_disponible = data.cupo_disponible;
        this.created_at = data.created_at;
        this.updated_at = data.updated_at;
    }

    // Crear nueva práctica
    static async create(practiceData) {
        const connection = await db.getConnection();
        
        try {
            await connection.beginTransaction();

            const [result] = await connection.execute(
                `INSERT INTO practicas (
                    maestro_id, nombre, descripcion, requisitos, tipo_practica,
                    duracion_estimada_horas, fecha_inicio, fecha_fin, estado,
                    nivel_dificultad, cupo_maximo, cupo_disponible
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    practiceData.maestro_id,
                    practiceData.nombre,
                    practiceData.descripcion,
                    practiceData.requisitos || null,
                    practiceData.tipo_practica,
                    practiceData.duracion_estimada_horas || 1,
                    practiceData.fecha_inicio,
                    practiceData.fecha_fin,
                    practiceData.estado || 'activa',
                    practiceData.nivel_dificultad || 'basico',
                    practiceData.cupo_maximo || 10,
                    practiceData.cupo_disponible || practiceData.cupo_maximo || 10
                ]
            );

            const practiceId = result.insertId;

            // Registrar en audit_logs
            await connection.execute(
                `INSERT INTO audit_logs (usuario_id, accion, tabla_afectada, registro_id, descripcion) 
                 VALUES (?, ?, ?, ?, ?)`,
                [practiceData.created_by, 'CREATE', 'practicas', practiceId, `Práctica ${practiceData.nombre} creada`]
            );

            await connection.commit();
            
            return { id: practiceId, ...practiceData };
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }

    // Obtener todas las prácticas con filtros
    static async findAll(filters = {}) {
        let query = `
            SELECT 
                p.*,
                CONCAT(u.nombre, ' ', u.apellido) as maestro_nombre,
                m.especialidad as maestro_especialidad,
                COUNT(DISTINCT pp.practicante_id) as total_practicantes
            FROM practicas p
            LEFT JOIN maestros m ON p.maestro_id = m.id
            LEFT JOIN usuarios u ON m.usuario_id = u.id
            LEFT JOIN practicantes_practicas pp ON p.id = pp.practica_id
            WHERE 1=1
        `;

        const params = [];

        if (filters.maestro_id) {
            query += ' AND p.maestro_id = ?';
            params.push(filters.maestro_id);
        }

        if (filters.estado) {
            query += ' AND p.estado = ?';
            params.push(filters.estado);
        }

        if (filters.tipo_practica) {
            query += ' AND p.tipo_practica = ?';
            params.push(filters.tipo_practica);
        }

        if (filters.nivel_dificultad) {
            query += ' AND p.nivel_dificultad = ?';
            params.push(filters.nivel_dificultad);
        }

        if (filters.search) {
            query += ' AND (p.nombre LIKE ? OR p.descripcion LIKE ?)';
            const searchTerm = `%${filters.search}%`;
            params.push(searchTerm, searchTerm);
        }

        query += ' GROUP BY p.id ORDER BY p.created_at DESC';

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

    // Obtener práctica por ID
    static async findById(id) {
        const [rows] = await db.execute(
            `SELECT 
                p.*,
                CONCAT(u.nombre, ' ', u.apellido) as maestro_nombre,
                m.especialidad as maestro_especialidad
             FROM practicas p
             LEFT JOIN maestros m ON p.maestro_id = m.id
             LEFT JOIN usuarios u ON m.usuario_id = u.id
             WHERE p.id = ?`,
            [id]
        );

        if (rows.length === 0) return null;
        return new Practice(rows[0]);
    }

    // Actualizar práctica
    static async update(id, practiceData) {
        const connection = await db.getConnection();
        
        try {
            await connection.beginTransaction();

            const fields = [];
            const values = [];

            // Construir dinámicamente la consulta con solo los campos proporcionados
            if (practiceData.nombre !== undefined) {
                fields.push('nombre = ?');
                values.push(practiceData.nombre);
            }
            if (practiceData.descripcion !== undefined) {
                fields.push('descripcion = ?');
                values.push(practiceData.descripcion);
            }
            if (practiceData.requisitos !== undefined) {
                fields.push('requisitos = ?');
                values.push(practiceData.requisitos);
            }
            if (practiceData.tipo_practica !== undefined) {
                fields.push('tipo_practica = ?');
                values.push(practiceData.tipo_practica);
            }
            if (practiceData.duracion_estimada_horas !== undefined) {
                fields.push('duracion_estimada_horas = ?');
                values.push(practiceData.duracion_estimada_horas);
            }
            if (practiceData.fecha_inicio !== undefined) {
                fields.push('fecha_inicio = ?');
                values.push(practiceData.fecha_inicio);
            }
            if (practiceData.fecha_fin !== undefined) {
                fields.push('fecha_fin = ?');
                values.push(practiceData.fecha_fin);
            }
            if (practiceData.estado !== undefined) {
                fields.push('estado = ?');
                values.push(practiceData.estado);
            }
            if (practiceData.nivel_dificultad !== undefined) {
                fields.push('nivel_dificultad = ?');
                values.push(practiceData.nivel_dificultad);
            }
            if (practiceData.cupo_maximo !== undefined) {
                fields.push('cupo_maximo = ?');
                values.push(practiceData.cupo_maximo);
            }

            if (fields.length === 0) {
                throw new Error('No hay campos para actualizar');
            }

            values.push(id);

            await connection.execute(
                `UPDATE practicas SET ${fields.join(', ')} WHERE id = ?`,
                values
            );

            // Registrar en audit_logs
            await connection.execute(
                `INSERT INTO audit_logs (usuario_id, accion, tabla_afectada, registro_id, descripcion) 
                 VALUES (?, ?, ?, ?, ?)`,
                [practiceData.updated_by, 'UPDATE', 'practicas', id, `Práctica actualizada`]
            );

            await connection.commit();
            
            return await this.findById(id);
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }

    // Eliminar práctica
    static async delete(id, userId) {
        const connection = await db.getConnection();
        
        try {
            await connection.beginTransaction();

            // Verificar si hay practicantes asignados
            const [assignments] = await connection.execute(
                'SELECT COUNT(*) as count FROM practicantes_practicas WHERE practica_id = ?',
                [id]
            );

            if (assignments[0].count > 0) {
                throw new Error('No se puede eliminar una práctica con practicantes asignados');
            }

            await connection.execute('DELETE FROM practicas WHERE id = ?', [id]);

            // Registrar en audit_logs
            await connection.execute(
                `INSERT INTO audit_logs (usuario_id, accion, tabla_afectada, registro_id, descripcion) 
                 VALUES (?, ?, ?, ?, ?)`,
                [userId, 'DELETE', 'practicas', id, 'Práctica eliminada']
            );

            await connection.commit();
            return true;
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }

    // Asignar practicante a práctica
    static async assignPracticante(practiceId, practicanteId) {
        const connection = await db.getConnection();
        
        try {
            await connection.beginTransaction();

            // Usar el procedimiento almacenado
            const [result] = await connection.execute(
                'CALL asignar_practicante_practica(?, ?, @mensaje, @success)',
                [practiceId, practicanteId]
            );

            const [output] = await connection.execute(
                'SELECT @mensaje as mensaje, @success as success'
            );

            await connection.commit();
            
            return {
                success: output[0].success === 1,
                message: output[0].mensaje
            };
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }

    // Desasignar practicante de práctica
    static async unassignPracticante(practiceId, practicanteId) {
        const connection = await db.getConnection();
        
        try {
            await connection.beginTransaction();

            const [result] = await connection.execute(
                'DELETE FROM practicantes_practicas WHERE practica_id = ? AND practicante_id = ?',
                [practiceId, practicanteId]
            );

            if (result.affectedRows === 0) {
                throw new Error('Asignación no encontrada');
            }

            await connection.commit();
            return true;
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }

    // Obtener practicantes asignados a una práctica
    static async getPracticantes(practiceId) {
        const [rows] = await db.execute(
            `SELECT 
                pp.*,
                p.matricula,
                p.semestre,
                p.turno,
                u.nombre,
                u.apellido,
                u.email,
                u.telefono
             FROM practicantes_practicas pp
             JOIN practicantes p ON pp.practicante_id = p.id
             JOIN usuarios u ON p.usuario_id = u.id
             WHERE pp.practica_id = ?
             ORDER BY pp.fecha_asignacion DESC`,
            [practiceId]
        );

        return rows;
    }

    // Obtener prácticas de un practicante
    static async getByPracticante(practicanteId) {
        const [rows] = await db.execute(
            `SELECT 
                p.*,
                pp.estado as estado_asignacion,
                pp.fecha_asignacion,
                pp.fecha_inicio_real,
                pp.fecha_fin_real,
                pp.observaciones,
                pp.calificacion_maestro,
                CONCAT(u.nombre, ' ', u.apellido) as maestro_nombre,
                m.especialidad as maestro_especialidad
             FROM practicas p
             JOIN practicantes_practicas pp ON p.id = pp.practica_id
             LEFT JOIN maestros m ON p.maestro_id = m.id
             LEFT JOIN usuarios u ON m.usuario_id = u.id
             WHERE pp.practicante_id = ?
             ORDER BY pp.fecha_asignacion DESC`,
            [practicanteId]
        );

        return rows;
    }

    // Actualizar estado de asignación
    static async updateAssignmentStatus(practiceId, practicanteId, status, observaciones = null) {
        const [result] = await db.execute(
            `UPDATE practicantes_practicas 
             SET estado = ?, observaciones = ?, fecha_inicio_real = IF(? = 'en_progreso', NOW(), fecha_inicio_real),
                 fecha_fin_real = IF(? = 'completado', NOW(), fecha_fin_real)
             WHERE practica_id = ? AND practicante_id = ?`,
            [status, observaciones, status, status, practiceId, practicanteId]
        );

        return result.affectedRows > 0;
    }

    // Calificar practicante en una práctica
    static async gradePracticante(practiceId, practicanteId, calificacion, observaciones = null) {
        const [result] = await db.execute(
            `UPDATE practicantes_practicas 
             SET calificacion_maestro = ?, observaciones = CONCAT(IFNULL(observaciones, ''), '\n', ?)
             WHERE practica_id = ? AND practicante_id = ?`,
            [calificacion, observaciones || '', practiceId, practicanteId]
        );

        return result.affectedRows > 0;
    }

    // Obtener estadísticas de prácticas
    static async getStatistics(maestroId = null) {
        let query = `
            SELECT 
                COUNT(DISTINCT p.id) as total_practicas,
                COUNT(DISTINCT CASE WHEN p.estado = 'activa' THEN p.id END) as practicas_activas,
                COUNT(DISTINCT CASE WHEN p.estado = 'completada' THEN p.id END) as practicas_completadas,
                COUNT(DISTINCT pp.practicante_id) as total_practicantes_asignados,
                AVG(pp.calificacion_maestro) as promedio_calificaciones
            FROM practicas p
            LEFT JOIN practicantes_practicas pp ON p.id = pp.practica_id
        `;

        const params = [];
        if (maestroId) {
            query += ' WHERE p.maestro_id = ?';
            params.push(maestroId);
        }

        const [rows] = await db.execute(query, params);
        return rows[0];
    }
}

module.exports = Practice;