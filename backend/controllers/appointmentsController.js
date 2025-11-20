// backend/controllers/appointmentsController.js - VERSIÓN FINAL CORREGIDA
const db = require('../config/database');

// Obtener todas las citas
exports.getAllAppointments = async (req, res) => {
    try {
        const { estado, fecha_desde, fecha_hasta, search, page = 1, limit = 15 } = req.query;
        const offset = (page - 1) * limit;

        let query = `
            SELECT 
                c.*,
                up.nombre as paciente_nombre,
                up.apellido as paciente_apellido,
                upr.nombre as practicante_nombre,
                upr.apellido as practicante_apellido,
                p.nombre as practica_nombre
            FROM citas c
            LEFT JOIN pacientes pac ON c.paciente_id = pac.id
            LEFT JOIN usuarios up ON pac.usuario_id = up.id
            LEFT JOIN practicantes pra ON c.practicante_id = pra.id
            LEFT JOIN usuarios upr ON pra.usuario_id = upr.id
            LEFT JOIN practicas p ON c.practica_id = p.id
            WHERE 1=1
        `;
        
        const params = [];

        // Filtros según rol (buscar por usuario_id en tablas relacionadas)
        if (req.user.tipo_usuario === 'practicante') {
            query += ' AND pra.usuario_id = ?';
            params.push(req.user.userId);
        } else if (req.user.tipo_usuario === 'paciente') {
            query += ' AND pac.usuario_id = ?';
            params.push(req.user.userId);
        } else if (req.user.tipo_usuario === 'maestro') {
            query += ' AND p.maestro_id IN (SELECT id FROM maestros WHERE usuario_id = ?)';
            params.push(req.user.userId);
        }

        // Filtros adicionales
        if (estado) {
            query += ' AND c.estado = ?';
            params.push(estado);
        }

        if (fecha_desde) {
            query += ' AND DATE(c.fecha_hora) >= ?';
            params.push(fecha_desde);
        }

        if (fecha_hasta) {
            query += ' AND DATE(c.fecha_hora) <= ?';
            params.push(fecha_hasta);
        }

        if (search) {
            query += ' AND (up.nombre LIKE ? OR up.apellido LIKE ? OR upr.nombre LIKE ?)';
            const searchParam = `%${search}%`;
            params.push(searchParam, searchParam, searchParam);
        }

        query += ' ORDER BY c.fecha_hora DESC';
        query += ` LIMIT ${parseInt(limit)} OFFSET ${parseInt(offset)}`;

        const [appointments] = await db.execute(query, params);

        // Total count
        let countQuery = `
            SELECT COUNT(*) as total FROM citas c 
            LEFT JOIN pacientes pac ON c.paciente_id = pac.id
            LEFT JOIN practicantes pra ON c.practicante_id = pra.id
            LEFT JOIN practicas p ON c.practica_id = p.id 
            WHERE 1=1
        `;
        const countParams = [];
        
        if (req.user.tipo_usuario === 'practicante') {
            countQuery += ' AND pra.usuario_id = ?';
            countParams.push(req.user.userId);
        } else if (req.user.tipo_usuario === 'paciente') {
            countQuery += ' AND pac.usuario_id = ?';
            countParams.push(req.user.userId);
        } else if (req.user.tipo_usuario === 'maestro') {
            countQuery += ' AND p.maestro_id IN (SELECT id FROM maestros WHERE usuario_id = ?)';
            countParams.push(req.user.userId);
        }

        if (estado) {
            countQuery += ' AND c.estado = ?';
            countParams.push(estado);
        }

        const [countResult] = await db.execute(countQuery, countParams);
        const total = countResult[0].total;

        res.json({
            success: true,
            data: appointments,
            total: total,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Error getting appointments:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener citas',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// Crear nueva cita - ⭐ VERSIÓN CORREGIDA
exports.createAppointment = async (req, res) => {
    try {
        const {
            paciente_id,         // Este es usuario_id del paciente
            practicante_id,      // Este es usuario_id del practicante
            practica_id,
            fecha_hora,
            duracion_minutos,
            motivo_consulta
        } = req.body;

        console.log('Creando cita con datos:', req.body);

        // Validar campos requeridos
        if (!paciente_id || !practicante_id || !practica_id || !fecha_hora || !motivo_consulta) {
            return res.status(400).json({
                success: false,
                message: 'Faltan campos requeridos',
                errors: [
                    { field: 'paciente_id', required: !!paciente_id },
                    { field: 'practicante_id', required: !!practicante_id },
                    { field: 'practica_id', required: !!practica_id },
                    { field: 'fecha_hora', required: !!fecha_hora },
                    { field: 'motivo_consulta', required: !!motivo_consulta }
                ]
            });
        }

        // ⭐ CLAVE: Obtener los IDs de las tablas practicantes y pacientes
        // El frontend envía usuario_id, pero necesitamos practicantes.id y pacientes.id

        // 1. Obtener ID del practicante en tabla practicantes
        const [practicante] = await db.execute(
            'SELECT id FROM practicantes WHERE usuario_id = ?',
            [practicante_id]
        );

        if (practicante.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Practicante no encontrado'
            });
        }

        const practicante_db_id = practicante[0].id;

        // 2. Obtener ID del paciente en tabla pacientes
        const [paciente] = await db.execute(
            'SELECT id FROM pacientes WHERE usuario_id = ?',
            [paciente_id]
        );

        if (paciente.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Paciente no encontrado'
            });
        }

        const paciente_db_id = paciente[0].id;

        // 3. Validar que la práctica existe
        const [practica] = await db.execute(
            'SELECT id FROM practicas WHERE id = ?',
            [practica_id]
        );

        if (practica.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Práctica no encontrada'
            });
        }

        // 4. Insertar cita usando los IDs de las tablas relacionadas
        const query = `
            INSERT INTO citas (
                paciente_id, practicante_id, practica_id, fecha_hora,
                duracion_minutos, motivo_consulta, estado
            ) VALUES (?, ?, ?, ?, ?, ?, 'pendiente')
        `;

        const [result] = await db.execute(query, [
            paciente_db_id,      // ⭐ Usar ID de tabla pacientes
            practicante_db_id,   // ⭐ Usar ID de tabla practicantes
            practica_id,
            fecha_hora,
            duracion_minutos || 60,
            motivo_consulta
        ]);

        console.log('✅ Cita creada con ID:', result.insertId);

        res.status(201).json({
            success: true,
            message: 'Cita creada exitosamente',
            data: {
                id: result.insertId,
                paciente_id: paciente_db_id,
                practicante_id: practicante_db_id,
                practica_id,
                fecha_hora,
                duracion_minutos: duracion_minutos || 60,
                motivo_consulta,
                estado: 'pendiente'
            }
        });
    } catch (error) {
        console.error('Error creating appointment:', error);
        res.status(500).json({
            success: false,
            message: 'Error al crear cita',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// Obtener cita por ID
exports.getAppointmentById = async (req, res) => {
    try {
        const { id } = req.params;

        const query = `
            SELECT 
                c.*,
                up.nombre as paciente_nombre,
                up.apellido as paciente_apellido,
                up.email as paciente_email,
                upr.nombre as practicante_nombre,
                upr.apellido as practicante_apellido,
                upr.email as practicante_email,
                p.nombre as practica_nombre,
                p.descripcion as practica_descripcion
            FROM citas c
            LEFT JOIN pacientes pac ON c.paciente_id = pac.id
            LEFT JOIN usuarios up ON pac.usuario_id = up.id
            LEFT JOIN practicantes pra ON c.practicante_id = pra.id
            LEFT JOIN usuarios upr ON pra.usuario_id = upr.id
            LEFT JOIN practicas p ON c.practica_id = p.id
            WHERE c.id = ?
        `;

        const [appointments] = await db.execute(query, [id]);

        if (appointments.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Cita no encontrada'
            });
        }

        res.json({
            success: true,
            data: appointments[0]
        });
    } catch (error) {
        console.error('Error getting appointment:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener cita'
        });
    }
};

// Confirmar cita
exports.confirmAppointment = async (req, res) => {
    try {
        const { id } = req.params;

        const [citas] = await db.execute(
            'SELECT * FROM citas WHERE id = ? AND estado = "pendiente"',
            [id]
        );

        if (citas.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Cita no encontrada o no puede ser confirmada'
            });
        }

        await db.execute(
            'UPDATE citas SET estado = "confirmada" WHERE id = ?',
            [id]
        );

        res.json({
            success: true,
            message: 'Cita confirmada exitosamente'
        });
    } catch (error) {
        console.error('Error confirming appointment:', error);
        res.status(500).json({
            success: false,
            message: 'Error al confirmar cita'
        });
    }
};

// Cancelar cita
exports.cancelAppointment = async (req, res) => {
    try {
        const { id } = req.params;
        const { motivo_cancelacion } = req.body;

        const [citas] = await db.execute(
            'SELECT * FROM citas WHERE id = ? AND estado IN ("pendiente", "confirmada")',
            [id]
        );

        if (citas.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Cita no encontrada o no puede ser cancelada'
            });
        }

        // Nota: No existe columna motivo_cancelacion en tu BD
        await db.execute(
            'UPDATE citas SET estado = "cancelada" WHERE id = ?',
            [id]
        );

        res.json({
            success: true,
            message: 'Cita cancelada exitosamente'
        });
    } catch (error) {
        console.error('Error canceling appointment:', error);
        res.status(500).json({
            success: false,
            message: 'Error al cancelar cita'
        });
    }
};

// Completar cita
exports.completeAppointment = async (req, res) => {
    try {
        const { id } = req.params;
        const { tratamiento_realizado, notas } = req.body;

        if (!tratamiento_realizado) {
            return res.status(400).json({
                success: false,
                message: 'El tratamiento realizado es requerido'
            });
        }

        const [citas] = await db.execute(
            'SELECT * FROM citas WHERE id = ? AND estado = "confirmada"',
            [id]
        );

        if (citas.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Cita no encontrada o no puede ser completada'
            });
        }

        await db.execute(
            `UPDATE citas 
             SET estado = "completada", 
                 tratamiento_realizado = ?, 
                 notas = ? 
             WHERE id = ?`,
            [tratamiento_realizado, notas || null, id]
        );

        res.json({
            success: true,
            message: 'Cita completada exitosamente'
        });
    } catch (error) {
        console.error('Error completing appointment:', error);
        res.status(500).json({
            success: false,
            message: 'Error al completar cita'
        });
    }
};

// Marcar como no asistió
exports.markNoShow = async (req, res) => {
    try {
        const { id } = req.params;

        const [citas] = await db.execute(
            'SELECT * FROM citas WHERE id = ? AND estado = "confirmada"',
            [id]
        );

        if (citas.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Cita no encontrada'
            });
        }

        await db.execute(
            'UPDATE citas SET estado = "no_asistio" WHERE id = ?',
            [id]
        );

        res.json({
            success: true,
            message: 'Cita marcada como no asistió'
        });
    } catch (error) {
        console.error('Error marking no-show:', error);
        res.status(500).json({
            success: false,
            message: 'Error al marcar no asistió'
        });
    }
};

// Actualizar cita (para calificación via evaluaciones)
exports.updateAppointment = async (req, res) => {
    try {
        const { id } = req.params;
        const { calificacion } = req.body;

        if (!calificacion || calificacion < 1 || calificacion > 5) {
            return res.status(400).json({
                success: false,
                message: 'La calificación debe estar entre 1 y 5'
            });
        }

        // Verificar que la cita existe y está completada
        const [citas] = await db.execute(
            'SELECT * FROM citas WHERE id = ? AND estado = "completada"',
            [id]
        );

        if (citas.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No se pudo calificar la cita. Verifica que esté completada.'
            });
        }

        // Crear evaluación en tabla evaluaciones
        await db.execute(
            `INSERT INTO evaluaciones 
             (cita_id, tipo, evaluador_id, evaluado_id, calificacion) 
             VALUES (?, 'paciente_servicio', ?, ?, ?)`,
            [id, req.user.userId, citas[0].practicante_id, calificacion]
        );

        res.json({
            success: true,
            message: 'Calificación guardada exitosamente'
        });
    } catch (error) {
        console.error('Error updating appointment:', error);
        res.status(500).json({
            success: false,
            message: 'Error al calificar cita'
        });
    }
};

// Obtener mis citas (practicante)
exports.getMyAppointments = async (req, res) => {
    try {
        const { estado, page = 1, limit = 12 } = req.query;
        const offset = (page - 1) * limit;

        let query = `
            SELECT 
                c.*,
                up.nombre as paciente_nombre,
                up.apellido as paciente_apellido,
                p.nombre as practica_nombre
            FROM citas c
            LEFT JOIN pacientes pac ON c.paciente_id = pac.id
            LEFT JOIN usuarios up ON pac.usuario_id = up.id
            LEFT JOIN practicantes pra ON c.practicante_id = pra.id
            LEFT JOIN practicas p ON c.practica_id = p.id
            WHERE pra.usuario_id = ?
        `;
        
        const params = [req.user.userId];

        if (estado) {
            query += ' AND c.estado = ?';
            params.push(estado);
        }

        query += ' ORDER BY c.fecha_hora DESC';
        query += ` LIMIT ${parseInt(limit)} OFFSET ${parseInt(offset)}`;

        const [appointments] = await db.execute(query, params);

        res.json({
            success: true,
            data: appointments,
            total: appointments.length
        });
    } catch (error) {
        console.error('Error getting my appointments:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener tus citas'
        });
    }
};

// Obtener citas del paciente
exports.getPatientAppointments = async (req, res) => {
    try {
        const { estado, page = 1, limit = 12 } = req.query;
        const offset = (page - 1) * limit;

        let query = `
            SELECT 
                c.*,
                upr.nombre as practicante_nombre,
                upr.apellido as practicante_apellido,
                p.nombre as practica_nombre
            FROM citas c
            LEFT JOIN practicantes pra ON c.practicante_id = pra.id
            LEFT JOIN usuarios upr ON pra.usuario_id = upr.id
            LEFT JOIN pacientes pac ON c.paciente_id = pac.id
            LEFT JOIN practicas p ON c.practica_id = p.id
            WHERE pac.usuario_id = ?
        `;
        
        const params = [req.user.userId];

        if (estado) {
            query += ' AND c.estado = ?';
            params.push(estado);
        }

        query += ' ORDER BY c.fecha_hora DESC';
        query += ` LIMIT ${parseInt(limit)} OFFSET ${parseInt(offset)}`;

        const [appointments] = await db.execute(query, params);

        res.json({
            success: true,
            data: appointments,
            total: appointments.length
        });
    } catch (error) {
        console.error('Error getting patient appointments:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener tus citas'
        });
    }
};

// Obtener horarios disponibles
exports.getAvailableSlots = async (req, res) => {
    try {
        const { practicante_id, fecha } = req.query;

        console.log('getAvailableSlots - params:', { practicante_id, fecha });

        if (!practicante_id || !fecha) {
            return res.status(400).json({
                success: false,
                message: 'practicante_id y fecha son requeridos'
            });
        }

        // ⭐ Convertir usuario_id a practicante.id
        const [practicante] = await db.execute(
            'SELECT id FROM practicantes WHERE usuario_id = ?',
            [practicante_id]
        );

        if (practicante.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Practicante no encontrado'
            });
        }

        const practicante_db_id = practicante[0].id;

        // Obtener citas del practicante para ese día
        const [citasExistentes] = await db.execute(
            `SELECT DATE_FORMAT(fecha_hora, '%H:%i') as hora, duracion_minutos
             FROM citas
             WHERE practicante_id = ? AND DATE(fecha_hora) = ?
             AND estado NOT IN ('cancelada', 'no_asistio')`,
            [practicante_db_id, fecha]
        );

        console.log('Citas existentes:', citasExistentes);

        // Generar slots de 8:00 AM a 8:00 PM cada 30 minutos
        const slots = [];
        for (let hour = 8; hour < 20; hour++) {
            for (let min of [0, 30]) {
                const horaStr = `${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`;
                
                // Verificar si está ocupado
                const ocupado = citasExistentes.some(cita => {
                    const [citaHora, citaMin] = cita.hora.split(':').map(Number);
                    const citaMinutes = citaHora * 60 + citaMin;
                    const slotMinutes = hour * 60 + min;
                    
                    return slotMinutes >= citaMinutes && slotMinutes < (citaMinutes + cita.duracion_minutos);
                });

                if (!ocupado) {
                    slots.push(horaStr);
                }
            }
        }

        console.log('Slots disponibles:', slots);

        res.json({
            success: true,
            data: slots
        });
    } catch (error) {
        console.error('Error getting available slots:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener horarios disponibles',
            error: error.message
        });
    }
};

// Obtener estadísticas
exports.getStatistics = async (req, res) => {
    try {
        let whereClause = '';
        const params = [];

        if (req.user.tipo_usuario === 'practicante') {
            whereClause = 'WHERE pra.usuario_id = ?';
            params.push(req.user.userId);
        } else if (req.user.tipo_usuario === 'paciente') {
            whereClause = 'WHERE pac.usuario_id = ?';
            params.push(req.user.userId);
        } else if (req.user.tipo_usuario === 'maestro') {
            whereClause = 'WHERE p.maestro_id IN (SELECT id FROM maestros WHERE usuario_id = ?)';
            params.push(req.user.userId);
        }

        const query = `
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN c.estado = 'pendiente' THEN 1 ELSE 0 END) as pendientes,
                SUM(CASE WHEN c.estado = 'confirmada' THEN 1 ELSE 0 END) as confirmadas,
                SUM(CASE WHEN c.estado = 'completada' THEN 1 ELSE 0 END) as completadas,
                SUM(CASE WHEN c.estado = 'cancelada' THEN 1 ELSE 0 END) as canceladas,
                SUM(CASE WHEN c.estado = 'no_asistio' THEN 1 ELSE 0 END) as no_asistio
            FROM citas c
            LEFT JOIN pacientes pac ON c.paciente_id = pac.id
            LEFT JOIN practicantes pra ON c.practicante_id = pra.id
            LEFT JOIN practicas p ON c.practica_id = p.id
            ${whereClause}
        `;

        const [stats] = await db.execute(query, params);

        res.json({
            success: true,
            data: stats[0]
        });
    } catch (error) {
        console.error('Error getting statistics:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener estadísticas'
        });
    }
};