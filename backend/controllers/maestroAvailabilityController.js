// backend/controllers/maestroAvailabilityController.js - NUEVO SPRINT B2
const db = require('../config/database');

// Obtener disponibilidad de un maestro
exports.getAvailability = async (req, res) => {
    try {
        const { maestroId } = req.params;

        // Verificar permisos: maestro solo puede ver su propia disponibilidad
        if (req.user.tipo_usuario === 'maestro') {
            const [maestro] = await db.execute(
                'SELECT id FROM maestros WHERE usuario_id = ?',
                [req.user.userId]
            );
            
            if (maestro.length === 0 || maestro[0].id !== parseInt(maestroId)) {
                return res.status(403).json({
                    success: false,
                    message: 'No tienes permiso para ver esta disponibilidad'
                });
            }
        }

        const [disponibilidad] = await db.execute(
            `SELECT * FROM disponibilidad_maestros 
             WHERE maestro_id = ? AND activo = 1
             ORDER BY 
                FIELD(dia_semana, 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'),
                hora_inicio`,
            [maestroId]
        );

        res.json({
            success: true,
            data: disponibilidad
        });
    } catch (error) {
        console.error('Error getting availability:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener disponibilidad'
        });
    }
};

// Crear nueva disponibilidad
exports.createAvailability = async (req, res) => {
    try {
        const { maestroId } = req.params;
        const { dia_semana, hora_inicio, hora_fin, activo = true } = req.body;

        // Verificar que sea el maestro dueño
        const [maestro] = await db.execute(
            'SELECT id FROM maestros WHERE usuario_id = ?',
            [req.user.userId]
        );

        if (maestro.length === 0 || maestro[0].id !== parseInt(maestroId)) {
            return res.status(403).json({
                success: false,
                message: 'No tienes permiso para crear disponibilidad'
            });
        }

        // Verificar si ya existe un horario similar
        const [existing] = await db.execute(
            `SELECT * FROM disponibilidad_maestros 
             WHERE maestro_id = ? AND dia_semana = ? AND activo = 1
             AND (
                (hora_inicio <= ? AND hora_fin > ?) OR
                (hora_inicio < ? AND hora_fin >= ?) OR
                (hora_inicio >= ? AND hora_fin <= ?)
             )`,
            [maestroId, dia_semana, hora_inicio, hora_inicio, hora_fin, hora_fin, hora_inicio, hora_fin]
        );

        if (existing.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Ya existe una disponibilidad que se traslapa con este horario'
            });
        }

        // Crear disponibilidad
        const [result] = await db.execute(
            `INSERT INTO disponibilidad_maestros (maestro_id, dia_semana, hora_inicio, hora_fin, activo)
             VALUES (?, ?, ?, ?, ?)`,
            [maestroId, dia_semana, hora_inicio, hora_fin, activo]
        );

        // Registrar en audit_logs
        await db.execute(
            `INSERT INTO audit_logs (usuario_id, accion, tabla_afectada, registro_id, descripcion)
             VALUES (?, ?, ?, ?, ?)`,
            [req.user.userId, 'CREATE', 'disponibilidad_maestros', result.insertId, 
             `Disponibilidad creada: ${dia_semana} ${hora_inicio}-${hora_fin}`]
        );

        res.status(201).json({
            success: true,
            message: 'Disponibilidad creada exitosamente',
            data: {
                id: result.insertId,
                maestro_id: maestroId,
                dia_semana,
                hora_inicio,
                hora_fin,
                activo
            }
        });
    } catch (error) {
        console.error('Error creating availability:', error);
        res.status(500).json({
            success: false,
            message: 'Error al crear disponibilidad'
        });
    }
};

// Actualizar disponibilidad
exports.updateAvailability = async (req, res) => {
    try {
        const { maestroId, availabilityId } = req.params;
        const { dia_semana, hora_inicio, hora_fin, activo } = req.body;

        // Verificar que sea el maestro dueño
        const [maestro] = await db.execute(
            'SELECT id FROM maestros WHERE usuario_id = ?',
            [req.user.userId]
        );

        if (maestro.length === 0 || maestro[0].id !== parseInt(maestroId)) {
            return res.status(403).json({
                success: false,
                message: 'No tienes permiso para actualizar disponibilidad'
            });
        }

        // Verificar que la disponibilidad existe y pertenece al maestro
        const [availability] = await db.execute(
            'SELECT * FROM disponibilidad_maestros WHERE id = ? AND maestro_id = ?',
            [availabilityId, maestroId]
        );

        if (availability.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Disponibilidad no encontrada'
            });
        }

        // Construir query de actualización
        const updates = [];
        const values = [];

        if (dia_semana !== undefined) {
            updates.push('dia_semana = ?');
            values.push(dia_semana);
        }
        if (hora_inicio !== undefined) {
            updates.push('hora_inicio = ?');
            values.push(hora_inicio);
        }
        if (hora_fin !== undefined) {
            updates.push('hora_fin = ?');
            values.push(hora_fin);
        }
        if (activo !== undefined) {
            updates.push('activo = ?');
            values.push(activo);
        }

        if (updates.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No hay campos para actualizar'
            });
        }

        values.push(availabilityId);

        await db.execute(
            `UPDATE disponibilidad_maestros SET ${updates.join(', ')} WHERE id = ?`,
            values
        );

        // Registrar en audit_logs
        await db.execute(
            `INSERT INTO audit_logs (usuario_id, accion, tabla_afectada, registro_id, descripcion)
             VALUES (?, ?, ?, ?, ?)`,
            [req.user.userId, 'UPDATE', 'disponibilidad_maestros', availabilityId, 
             'Disponibilidad actualizada']
        );

        res.json({
            success: true,
            message: 'Disponibilidad actualizada exitosamente'
        });
    } catch (error) {
        console.error('Error updating availability:', error);
        res.status(500).json({
            success: false,
            message: 'Error al actualizar disponibilidad'
        });
    }
};

// Eliminar disponibilidad
exports.deleteAvailability = async (req, res) => {
    try {
        const { maestroId, availabilityId } = req.params;

        // Verificar que sea el maestro dueño
        const [maestro] = await db.execute(
            'SELECT id FROM maestros WHERE usuario_id = ?',
            [req.user.userId]
        );

        if (maestro.length === 0 || maestro[0].id !== parseInt(maestroId)) {
            return res.status(403).json({
                success: false,
                message: 'No tienes permiso para eliminar disponibilidad'
            });
        }

        // Soft delete: marcar como inactivo
        const [result] = await db.execute(
            'UPDATE disponibilidad_maestros SET activo = 0 WHERE id = ? AND maestro_id = ?',
            [availabilityId, maestroId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'Disponibilidad no encontrada'
            });
        }

        // Registrar en audit_logs
        await db.execute(
            `INSERT INTO audit_logs (usuario_id, accion, tabla_afectada, registro_id, descripcion)
             VALUES (?, ?, ?, ?, ?)`,
            [req.user.userId, 'DELETE', 'disponibilidad_maestros', availabilityId, 
             'Disponibilidad eliminada']
        );

        res.json({
            success: true,
            message: 'Disponibilidad eliminada exitosamente'
        });
    } catch (error) {
        console.error('Error deleting availability:', error);
        res.status(500).json({
            success: false,
            message: 'Error al eliminar disponibilidad'
        });
    }
};

// Obtener horarios disponibles para agendar
exports.getAvailableSlots = async (req, res) => {
    try {
        const { maestroId } = req.params;
        const { fecha } = req.query; // Fecha en formato YYYY-MM-DD

        if (!fecha) {
            return res.status(400).json({
                success: false,
                message: 'La fecha es requerida'
            });
        }

        // Obtener día de la semana de la fecha
        const dias = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];
        const fechaObj = new Date(fecha + 'T00:00:00');
        const diaSemana = dias[fechaObj.getDay()];

        // Obtener disponibilidad del maestro para ese día
        const [disponibilidad] = await db.execute(
            `SELECT * FROM disponibilidad_maestros 
             WHERE maestro_id = ? AND dia_semana = ? AND activo = 1`,
            [maestroId, diaSemana]
        );

        if (disponibilidad.length === 0) {
            return res.json({
                success: true,
                data: {
                    fecha,
                    dia_semana: diaSemana,
                    slots: []
                }
            });
        }

        // Obtener citas ya agendadas para ese día y maestro
        const [citasAgendadas] = await db.execute(
            `SELECT DATE_FORMAT(fecha_hora, '%H:%i') as hora, duracion_minutos
             FROM citas c
             JOIN practicas p ON c.practica_id = p.id
             WHERE p.maestro_id = ? AND DATE(fecha_hora) = ? 
             AND c.estado NOT IN ('cancelada', 'no_asistio')`,
            [maestroId, fecha]
        );

        // Generar slots disponibles
        const slots = [];
        
        for (const horario of disponibilidad) {
            const [horaInicio, minInicio] = horario.hora_inicio.split(':').map(Number);
            const [horaFin, minFin] = horario.hora_fin.split(':').map(Number);
            
            let currentMinutes = horaInicio * 60 + minInicio;
            const endMinutes = horaFin * 60 + minFin;
            
            // Generar slots de 60 minutos
            while (currentMinutes + 60 <= endMinutes) {
                const hora = Math.floor(currentMinutes / 60);
                const minuto = currentMinutes % 60;
                const horaStr = `${hora.toString().padStart(2, '0')}:${minuto.toString().padStart(2, '0')}`;
                
                // Verificar si el slot está ocupado
                const ocupado = citasAgendadas.some(cita => {
                    const [citaHora, citaMin] = cita.hora.split(':').map(Number);
                    const citaMinutes = citaHora * 60 + citaMin;
                    const citaEndMinutes = citaMinutes + cita.duracion_minutos;
                    
                    return (currentMinutes >= citaMinutes && currentMinutes < citaEndMinutes) ||
                           (currentMinutes + 60 > citaMinutes && currentMinutes + 60 <= citaEndMinutes);
                });
                
                if (!ocupado) {
                    slots.push({
                        hora: horaStr,
                        disponible: true
                    });
                }
                
                currentMinutes += 60; // Incrementar 60 minutos
            }
        }

        res.json({
            success: true,
            data: {
                fecha,
                dia_semana: diaSemana,
                slots: slots.sort((a, b) => a.hora.localeCompare(b.hora))
            }
        });
    } catch (error) {
        console.error('Error getting available slots:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener horarios disponibles'
        });
    }
};

// Obtener resumen de disponibilidad semanal
exports.getWeeklySummary = async (req, res) => {
    try {
        const { maestroId } = req.params;

        const [disponibilidad] = await db.execute(
            `SELECT 
                dia_semana,
                COUNT(*) as total_bloques,
                MIN(hora_inicio) as primera_hora,
                MAX(hora_fin) as ultima_hora,
                SUM(TIME_TO_SEC(TIMEDIFF(hora_fin, hora_inicio)) / 3600) as horas_totales
             FROM disponibilidad_maestros
             WHERE maestro_id = ? AND activo = 1
             GROUP BY dia_semana
             ORDER BY FIELD(dia_semana, 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo')`,
            [maestroId]
        );

        // Calcular total semanal
        const totalHoras = disponibilidad.reduce((sum, dia) => sum + parseFloat(dia.horas_totales || 0), 0);

        res.json({
            success: true,
            data: {
                disponibilidad_por_dia: disponibilidad,
                total_horas_semanales: totalHoras.toFixed(2),
                total_dias_disponibles: disponibilidad.length
            }
        });
    } catch (error) {
        console.error('Error getting weekly summary:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener resumen semanal'
        });
    }
};