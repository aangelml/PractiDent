// backend/models/Appointment.js - NUEVO SPRINT B3
const db = require('../config/database');

class Appointment {
    constructor(data) {
        this.id = data.id;
        this.practica_id = data.practica_id;
        this.practicante_id = data.practicante_id;
        this.paciente_id = data.paciente_id;
        this.fecha_hora = data.fecha_hora;
        this.duracion_minutos = data.duracion_minutos;
        this.estado = data.estado;
        this.motivo_consulta = data.motivo_consulta;
        this.notas = data.notas;
        this.tratamiento_realizado = data.tratamiento_realizado;
        this.created_at = data.created_at;
        this.updated_at = data.updated_at;
    }

    // Crear nueva cita
    static async create(appointmentData) {
        const connection = await db.getConnection();
        
        try {
            await connection.beginTransaction();

            // Verificar disponibilidad del practicante
            const [conflicts] = await connection.execute(
                `SELECT id FROM citas 
                 WHERE practicante_id = ? 
                 AND DATE(fecha_hora) = DATE(?)
                 AND estado NOT IN ('cancelada', 'no_asistio')
                 AND (
                     (fecha_hora <= ? AND DATE_ADD(fecha_hora, INTERVAL duracion_minutos MINUTE) > ?) OR
                     (fecha_hora < DATE_ADD(?, INTERVAL ? MINUTE) AND DATE_ADD(fecha_hora, INTERVAL duracion_minutos MINUTE) >= DATE_ADD(?, INTERVAL ? MINUTE))
                 )`,
                [
                    appointmentData.practicante_id,
                    appointmentData.fecha_hora,
                    appointmentData.fecha_hora,
                    appointmentData.fecha_hora,
                    appointmentData.fecha_hora,
                    appointmentData.duracion_minutos,
                    appointmentData.fecha_hora,
                    appointmentData.duracion_minutos
                ]
            );

            if (conflicts.length > 0) {
                throw new Error('El practicante ya tiene una cita en ese horario');
            }

            // Verificar disponibilidad del maestro
            const [practice] = await connection.execute(
                `SELECT p.maestro_id, p.estado, p.fecha_inicio, p.fecha_fin
                 FROM practicas p
                 WHERE p.id = ?`,
                [appointmentData.practica_id]
            );

            if (practice.length === 0) {
                throw new Error('Práctica no encontrada');
            }

            if (practice[0].estado !== 'activa') {
                throw new Error('La práctica no está activa');
            }

            // Verificar que la fecha está dentro del rango de la práctica
            const citaDate = new Date(appointmentData.fecha_hora);
            const practiceStart = new Date(practice[0].fecha_inicio);
            const practiceEnd = new Date(practice[0].fecha_fin);

            if (citaDate < practiceStart || citaDate > practiceEnd) {
                throw new Error('La fecha de la cita debe estar dentro del período de la práctica');
            }

            // Verificar disponibilidad del maestro para ese día/hora
            const dias = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];
            const diaSemana = dias[citaDate.getDay()];
            const horaCita = citaDate.toTimeString().slice(0, 5);

            const [disponibilidad] = await connection.execute(
                `SELECT * FROM disponibilidad_maestros
                 WHERE maestro_id = ? 
                 AND dia_semana = ?
                 AND hora_inicio <= ?
                 AND hora_fin > ?
                 AND activo = 1`,
                [practice[0].maestro_id, diaSemana, horaCita, horaCita]
            );

            if (disponibilidad.length === 0) {
                throw new Error('El maestro no tiene disponibilidad en ese horario');
            }

            // Crear la cita
            const [result] = await connection.execute(
                `INSERT INTO citas (
                    practica_id, practicante_id, paciente_id, fecha_hora,
                    duracion_minutos, estado, motivo_consulta, notas
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    appointmentData.practica_id,
                    appointmentData.practicante_id,
                    appointmentData.paciente_id,
                    appointmentData.fecha_hora,
                    appointmentData.duracion_minutos || 60,
                    'pendiente',
                    appointmentData.motivo_consulta,
                    appointmentData.notas || null
                ]
            );

            const appointmentId = result.insertId;

            // Registrar en audit_logs
            await connection.execute(
                `INSERT INTO audit_logs (usuario_id, accion, tabla_afectada, registro_id, descripcion)
                 VALUES (?, ?, ?, ?, ?)`,
                [
                    appointmentData.created_by,
                    'CREATE',
                    'citas',
                    appointmentId,
                    `Cita creada para el ${appointmentData.fecha_hora}`
                ]
            );

            await connection.commit();
            
            return { id: appointmentId, ...appointmentData, estado: 'pendiente' };
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }

    // Obtener todas las citas con filtros
    static async findAll(filters = {}) {
        let query = `
            SELECT 
                c.*,
                p.nombre as practica_nombre,
                p.tipo_practica,
                CONCAT(up.nombre, ' ', up.apellido) as practicante_nombre,
                pr.matricula as practicante_matricula,
                CONCAT(upac.nombre, ' ', upac.apellido) as paciente_nombre,
                pac.telefono as paciente_telefono,
                CONCAT(um.nombre, ' ', um.apellido) as maestro_nombre,
                m.especialidad as maestro_especialidad
            FROM citas c
            JOIN practicas p ON c.practica_id = p.id
            JOIN practicantes pr ON c.practicante_id = pr.id
            JOIN usuarios up ON pr.usuario_id = up.id
            JOIN pacientes pac ON c.paciente_id = pac.id
            JOIN usuarios upac ON pac.usuario_id = upac.id
            JOIN maestros m ON p.maestro_id = m.id
            JOIN usuarios um ON m.usuario_id = um.id
            WHERE 1=1
        `;

        const params = [];

        if (filters.estado) {
            query += ' AND c.estado = ?';
            params.push(filters.estado);
        }

        if (filters.practicante_id) {
            query += ' AND c.practicante_id = ?';
            params.push(filters.practicante_id);
        }

        if (filters.paciente_id) {
            query += ' AND c.paciente_id = ?';
            params.push(filters.paciente_id);
        }

        if (filters.practica_id) {
            query += ' AND c.practica_id = ?';
            params.push(filters.practica_id);
        }

        if (filters.maestro_id) {
            query += ' AND p.maestro_id = ?';
            params.push(filters.maestro_id);
        }

        if (filters.fecha_desde) {
            query += ' AND DATE(c.fecha_hora) >= ?';
            params.push(filters.fecha_desde);
        }

        if (filters.fecha_hasta) {
            query += ' AND DATE(c.fecha_hora) <= ?';
            params.push(filters.fecha_hasta);
        }

        if (filters.search) {
            query += ` AND (
                CONCAT(upac.nombre, ' ', upac.apellido) LIKE ? OR
                c.motivo_consulta LIKE ? OR
                p.nombre LIKE ?
            )`;
            const searchTerm = `%${filters.search}%`;
            params.push(searchTerm, searchTerm, searchTerm);
        }

        query += ' ORDER BY c.fecha_hora DESC';

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

    // Obtener cita por ID
    static async findById(id) {
        const [rows] = await db.execute(
            `SELECT 
                c.*,
                p.nombre as practica_nombre,
                p.tipo_practica,
                p.descripcion as practica_descripcion,
                CONCAT(up.nombre, ' ', up.apellido) as practicante_nombre,
                up.email as practicante_email,
                pr.matricula as practicante_matricula,
                pr.semestre as practicante_semestre,
                CONCAT(upac.nombre, ' ', upac.apellido) as paciente_nombre,
                upac.email as paciente_email,
                pac.telefono as paciente_telefono,
                pac.fecha_nacimiento as paciente_fecha_nacimiento,
                pac.alergias as paciente_alergias,
                pac.enfermedades_cronicas as paciente_enfermedades,
                CONCAT(um.nombre, ' ', um.apellido) as maestro_nombre,
                um.email as maestro_email,
                m.especialidad as maestro_especialidad
             FROM citas c
             JOIN practicas p ON c.practica_id = p.id
             JOIN practicantes pr ON c.practicante_id = pr.id
             JOIN usuarios up ON pr.usuario_id = up.id
             JOIN pacientes pac ON c.paciente_id = pac.id
             JOIN usuarios upac ON pac.usuario_id = upac.id
             JOIN maestros m ON p.maestro_id = m.id
             JOIN usuarios um ON m.usuario_id = um.id
             WHERE c.id = ?`,
            [id]
        );

        if (rows.length === 0) return null;
        return rows[0];
    }

    // Actualizar cita
    static async update(id, appointmentData) {
        const connection = await db.getConnection();
        
        try {
            await connection.beginTransaction();

            const fields = [];
            const values = [];

            if (appointmentData.fecha_hora !== undefined) {
                // Verificar conflictos si se cambia la fecha
                const [current] = await connection.execute(
                    'SELECT practicante_id, duracion_minutos FROM citas WHERE id = ?',
                    [id]
                );

                const [conflicts] = await connection.execute(
                    `SELECT id FROM citas 
                     WHERE practicante_id = ? 
                     AND id != ?
                     AND DATE(fecha_hora) = DATE(?)
                     AND estado NOT IN ('cancelada', 'no_asistio')
                     AND (
                         (fecha_hora <= ? AND DATE_ADD(fecha_hora, INTERVAL duracion_minutos MINUTE) > ?) OR
                         (fecha_hora < DATE_ADD(?, INTERVAL ? MINUTE) AND DATE_ADD(fecha_hora, INTERVAL duracion_minutos MINUTE) >= DATE_ADD(?, INTERVAL ? MINUTE))
                     )`,
                    [
                        current[0].practicante_id,
                        id,
                        appointmentData.fecha_hora,
                        appointmentData.fecha_hora,
                        appointmentData.fecha_hora,
                        appointmentData.fecha_hora,
                        current[0].duracion_minutos,
                        appointmentData.fecha_hora,
                        current[0].duracion_minutos
                    ]
                );

                if (conflicts.length > 0) {
                    throw new Error('Conflicto de horario con otra cita');
                }

                fields.push('fecha_hora = ?');
                values.push(appointmentData.fecha_hora);
            }

            if (appointmentData.duracion_minutos !== undefined) {
                fields.push('duracion_minutos = ?');
                values.push(appointmentData.duracion_minutos);
            }

            if (appointmentData.estado !== undefined) {
                fields.push('estado = ?');
                values.push(appointmentData.estado);
            }

            if (appointmentData.motivo_consulta !== undefined) {
                fields.push('motivo_consulta = ?');
                values.push(appointmentData.motivo_consulta);
            }

            if (appointmentData.notas !== undefined) {
                fields.push('notas = ?');
                values.push(appointmentData.notas);
            }

            if (appointmentData.tratamiento_realizado !== undefined) {
                fields.push('tratamiento_realizado = ?');
                values.push(appointmentData.tratamiento_realizado);
            }

            if (fields.length === 0) {
                throw new Error('No hay campos para actualizar');
            }

            values.push(id);

            await connection.execute(
                `UPDATE citas SET ${fields.join(', ')} WHERE id = ?`,
                values
            );

            // Registrar en audit_logs
            await connection.execute(
                `INSERT INTO audit_logs (usuario_id, accion, tabla_afectada, registro_id, descripcion)
                 VALUES (?, ?, ?, ?, ?)`,
                [appointmentData.updated_by, 'UPDATE', 'citas', id, 'Cita actualizada']
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

    // Cancelar cita
    static async cancel(id, userId, motivo) {
        const connection = await db.getConnection();
        
        try {
            await connection.beginTransaction();

            const [cita] = await connection.execute(
                'SELECT estado, fecha_hora FROM citas WHERE id = ?',
                [id]
            );

            if (cita.length === 0) {
                throw new Error('Cita no encontrada');
            }

            if (cita[0].estado === 'completada') {
                throw new Error('No se puede cancelar una cita completada');
            }

            if (cita[0].estado === 'cancelada') {
                throw new Error('La cita ya está cancelada');
            }

            await connection.execute(
                `UPDATE citas SET estado = 'cancelada', notas = CONCAT(IFNULL(notas, ''), '\nCANCELADA: ', ?) WHERE id = ?`,
                [motivo || 'Sin motivo especificado', id]
            );

            // Registrar en audit_logs
            await connection.execute(
                `INSERT INTO audit_logs (usuario_id, accion, tabla_afectada, registro_id, descripcion)
                 VALUES (?, ?, ?, ?, ?)`,
                [userId, 'CANCEL', 'citas', id, `Cita cancelada: ${motivo || 'Sin motivo'}`]
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

    // Confirmar cita
    static async confirm(id, userId) {
        const [result] = await db.execute(
            `UPDATE citas SET estado = 'confirmada' WHERE id = ? AND estado = 'pendiente'`,
            [id]
        );

        if (result.affectedRows > 0) {
            await db.execute(
                `INSERT INTO audit_logs (usuario_id, accion, tabla_afectada, registro_id, descripcion)
                 VALUES (?, ?, ?, ?, ?)`,
                [userId, 'CONFIRM', 'citas', id, 'Cita confirmada']
            );
        }

        return result.affectedRows > 0;
    }

    // Marcar como completada
    static async complete(id, userId, tratamiento) {
        const connection = await db.getConnection();
        
        try {
            await connection.beginTransaction();

            await connection.execute(
                `UPDATE citas SET estado = 'completada', tratamiento_realizado = ? WHERE id = ?`,
                [tratamiento, id]
            );

            await connection.execute(
                `INSERT INTO audit_logs (usuario_id, accion, tabla_afectada, registro_id, descripcion)
                 VALUES (?, ?, ?, ?, ?)`,
                [userId, 'COMPLETE', 'citas', id, 'Cita completada']
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

    // Marcar como no asistió
    static async markNoShow(id, userId) {
        const [result] = await db.execute(
            `UPDATE citas SET estado = 'no_asistio' WHERE id = ?`,
            [id]
        );

        if (result.affectedRows > 0) {
            await db.execute(
                `INSERT INTO audit_logs (usuario_id, accion, tabla_afectada, registro_id, descripcion)
                 VALUES (?, ?, ?, ?, ?)`,
                [userId, 'NO_SHOW', 'citas', id, 'Paciente no asistió']
            );
        }

        return result.affectedRows > 0;
    }

    // Obtener citas por practicante
    static async getByPracticante(practicanteId, filters = {}) {
        let query = `
            SELECT 
                c.*,
                p.nombre as practica_nombre,
                CONCAT(upac.nombre, ' ', upac.apellido) as paciente_nombre,
                pac.telefono as paciente_telefono
            FROM citas c
            JOIN practicas p ON c.practica_id = p.id
            JOIN pacientes pac ON c.paciente_id = pac.id
            JOIN usuarios upac ON pac.usuario_id = upac.id
            WHERE c.practicante_id = ?
        `;

        const params = [practicanteId];

        if (filters.estado) {
            query += ' AND c.estado = ?';
            params.push(filters.estado);
        }

        query += ' ORDER BY c.fecha_hora DESC';

        const [rows] = await db.execute(query, params);
        return rows;
    }

    // Obtener citas por paciente
    static async getByPaciente(pacienteId, filters = {}) {
        let query = `
            SELECT 
                c.*,
                p.nombre as practica_nombre,
                p.tipo_practica,
                CONCAT(up.nombre, ' ', up.apellido) as practicante_nombre,
                CONCAT(um.nombre, ' ', um.apellido) as maestro_nombre
            FROM citas c
            JOIN practicas p ON c.practica_id = p.id
            JOIN practicantes pr ON c.practicante_id = pr.id
            JOIN usuarios up ON pr.usuario_id = up.id
            JOIN maestros m ON p.maestro_id = m.id
            JOIN usuarios um ON m.usuario_id = um.id
            WHERE c.paciente_id = ?
        `;

        const params = [pacienteId];

        if (filters.estado) {
            query += ' AND c.estado = ?';
            params.push(filters.estado);
        }

        query += ' ORDER BY c.fecha_hora DESC';

        const [rows] = await db.execute(query, params);
        return rows;
    }

    // Obtener estadísticas de citas
    static async getStatistics(filters = {}) {
        let query = `
            SELECT 
                COUNT(*) as total_citas,
                COUNT(CASE WHEN estado = 'pendiente' THEN 1 END) as pendientes,
                COUNT(CASE WHEN estado = 'confirmada' THEN 1 END) as confirmadas,
                COUNT(CASE WHEN estado = 'completada' THEN 1 END) as completadas,
                COUNT(CASE WHEN estado = 'cancelada' THEN 1 END) as canceladas,
                COUNT(CASE WHEN estado = 'no_asistio' THEN 1 END) as no_asistio
            FROM citas
            WHERE 1=1
        `;

        const params = [];

        if (filters.practicante_id) {
            query += ' AND practicante_id = ?';
            params.push(filters.practicante_id);
        }

        if (filters.maestro_id) {
            query += ' AND practica_id IN (SELECT id FROM practicas WHERE maestro_id = ?)';
            params.push(filters.maestro_id);
        }

        const [rows] = await db.execute(query, params);
        return rows[0];
    }
}

module.exports = Appointment;