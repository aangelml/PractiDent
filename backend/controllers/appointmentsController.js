// backend/controllers/appointmentsController.js - COMPLETO SPRINT B3
const Appointment = require('../models/Appointment');
const db = require('../config/database');

// Obtener todas las citas
exports.getAllAppointments = async (req, res) => {
    try {
        const { estado, fecha_desde, fecha_hasta, search, page = 1, limit = 10 } = req.query;
        const offset = (page - 1) * limit;

        const filters = {
            estado,
            fecha_desde,
            fecha_hasta,
            search,
            limit: parseInt(limit),
            offset: parseInt(offset)
        };

        // Filtros según el rol del usuario
        if (req.user.tipo_usuario === 'practicante') {
            const [practicante] = await db.execute(
                'SELECT id FROM practicantes WHERE usuario_id = ?',
                [req.user.userId]
            );
            if (practicante.length > 0) {
                filters.practicante_id = practicante[0].id;
            }
        } else if (req.user.tipo_usuario === 'maestro') {
            const [maestro] = await db.execute(
                'SELECT id FROM maestros WHERE usuario_id = ?',
                [req.user.userId]
            );
            if (maestro.length > 0) {
                filters.maestro_id = maestro[0].id;
            }
        } else if (req.user.tipo_usuario === 'paciente') {
            const [paciente] = await db.execute(
                'SELECT id FROM pacientes WHERE usuario_id = ?',
                [req.user.userId]
            );
            if (paciente.length > 0) {
                filters.paciente_id = paciente[0].id;
            }
        }

        const appointments = await Appointment.findAll(filters);

        // Obtener total para paginación
        let countQuery = 'SELECT COUNT(*) as total FROM citas c JOIN practicas p ON c.practica_id = p.id WHERE 1=1';
        const countParams = [];

        if (filters.practicante_id) {
            countQuery += ' AND c.practicante_id = ?';
            countParams.push(filters.practicante_id);
        }
        if (filters.maestro_id) {
            countQuery += ' AND p.maestro_id = ?';
            countParams.push(filters.maestro_id);
        }
        if (filters.paciente_id) {
            countQuery += ' AND c.paciente_id = ?';
            countParams.push(filters.paciente_id);
        }
        if (estado) {
            countQuery += ' AND c.estado = ?';
            countParams.push(estado);
        }
        if (fecha_desde) {
            countQuery += ' AND DATE(c.fecha_hora) >= ?';
            countParams.push(fecha_desde);
        }
        if (fecha_hasta) {
            countQuery += ' AND DATE(c.fecha_hora) <= ?';
            countParams.push(fecha_hasta);
        }

        const [countResult] = await db.execute(countQuery, countParams);
        const total = countResult[0].total;

        res.json({
            success: true,
            data: {
                appointments,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    totalPages: Math.ceil(total / limit)
                }
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

// Obtener cita por ID
exports.getAppointmentById = async (req, res) => {
    try {
        const { id } = req.params;
        const appointment = await Appointment.findById(id);

        if (!appointment) {
            return res.status(404).json({
                success: false,
                message: 'Cita no encontrada'
            });
        }

        // Verificar permisos
        if (req.user.tipo_usuario === 'practicante') {
            const [practicante] = await db.execute(
                'SELECT id FROM practicantes WHERE usuario_id = ?',
                [req.user.userId]
            );
            if (practicante.length === 0 || appointment.practicante_id !== practicante[0].id) {
                return res.status(403).json({
                    success: false,
                    message: 'No tienes permiso para ver esta cita'
                });
            }
        } else if (req.user.tipo_usuario === 'paciente') {
            const [paciente] = await db.execute(
                'SELECT id FROM pacientes WHERE usuario_id = ?',
                [req.user.userId]
            );
            if (paciente.length === 0 || appointment.paciente_id !== paciente[0].id) {
                return res.status(403).json({
                    success: false,
                    message: 'No tienes permiso para ver esta cita'
                });
            }
        }

        res.json({
            success: true,
            data: appointment
        });
    } catch (error) {
        console.error('Error getting appointment:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener cita'
        });
    }
};

// Crear nueva cita
exports.createAppointment = async (req, res) => {
    try {
        const appointmentData = {
            ...req.body,
            created_by: req.user.userId
        };

        // Validar que el paciente existe
        const [paciente] = await db.execute(
            'SELECT id FROM pacientes WHERE id = ?',
            [appointmentData.paciente_id]
        );

        if (paciente.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Paciente no encontrado'
            });
        }

        // Validar que el practicante existe y está asignado a la práctica
        const [asignacion] = await db.execute(
            `SELECT * FROM practicantes_practicas 
             WHERE practica_id = ? AND practicante_id = ? 
             AND estado IN ('asignado', 'en_progreso')`,
            [appointmentData.practica_id, appointmentData.practicante_id]
        );

        if (asignacion.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'El practicante no está asignado a esta práctica o no está activo'
            });
        }

        const appointment = await Appointment.create(appointmentData);

        res.status(201).json({
            success: true,
            message: 'Cita creada exitosamente',
            data: appointment
        });
    } catch (error) {
        console.error('Error creating appointment:', error);
        
        if (error.message.includes('ya tiene una cita')) {
            return res.status(409).json({
                success: false,
                message: error.message
            });
        }
        
        if (error.message.includes('disponibilidad')) {
            return res.status(400).json({
                success: false,
                message: error.message
            });
        }

        res.status(500).json({
            success: false,
            message: 'Error al crear cita',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// Actualizar cita
exports.updateAppointment = async (req, res) => {
    try {
        const { id } = req.params;
        
        const appointment = await Appointment.findById(id);
        if (!appointment) {
            return res.status(404).json({
                success: false,
                message: 'Cita no encontrada'
            });
        }

        // Verificar permisos
        if (req.user.tipo_usuario === 'practicante') {
            const [practicante] = await db.execute(
                'SELECT id FROM practicantes WHERE usuario_id = ?',
                [req.user.userId]
            );
            if (practicante.length === 0 || appointment.practicante_id !== practicante[0].id) {
                return res.status(403).json({
                    success: false,
                    message: 'No tienes permiso para actualizar esta cita'
                });
            }
        }

        const updatedAppointment = await Appointment.update(id, {
            ...req.body,
            updated_by: req.user.userId
        });

        res.json({
            success: true,
            message: 'Cita actualizada exitosamente',
            data: updatedAppointment
        });
    } catch (error) {
        console.error('Error updating appointment:', error);
        
        if (error.message.includes('Conflicto')) {
            return res.status(409).json({
                success: false,
                message: error.message
            });
        }

        res.status(500).json({
            success: false,
            message: 'Error al actualizar cita',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// Confirmar cita
exports.confirmAppointment = async (req, res) => {
    try {
        const { id } = req.params;
        
        const confirmed = await Appointment.confirm(id, req.user.userId);

        if (confirmed) {
            res.json({
                success: true,
                message: 'Cita confirmada exitosamente'
            });
        } else {
            res.status(400).json({
                success: false,
                message: 'No se pudo confirmar la cita. Verifica que esté en estado pendiente'
            });
        }
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
        const { motivo } = req.body;
        
        const appointment = await Appointment.findById(id);
        if (!appointment) {
            return res.status(404).json({
                success: false,
                message: 'Cita no encontrada'
            });
        }

        // Verificar permisos: paciente, practicante o maestro pueden cancelar
        if (req.user.tipo_usuario === 'paciente') {
            const [paciente] = await db.execute(
                'SELECT id FROM pacientes WHERE usuario_id = ?',
                [req.user.userId]
            );
            if (paciente.length === 0 || appointment.paciente_id !== paciente[0].id) {
                return res.status(403).json({
                    success: false,
                    message: 'No tienes permiso para cancelar esta cita'
                });
            }
        } else if (req.user.tipo_usuario === 'practicante') {
            const [practicante] = await db.execute(
                'SELECT id FROM practicantes WHERE usuario_id = ?',
                [req.user.userId]
            );
            if (practicante.length === 0 || appointment.practicante_id !== practicante[0].id) {
                return res.status(403).json({
                    success: false,
                    message: 'No tienes permiso para cancelar esta cita'
                });
            }
        }

        await Appointment.cancel(id, req.user.userId, motivo);

        res.json({
            success: true,
            message: 'Cita cancelada exitosamente'
        });
    } catch (error) {
        console.error('Error canceling appointment:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Error al cancelar cita'
        });
    }
};

// Completar cita
exports.completeAppointment = async (req, res) => {
    try {
        const { id } = req.params;
        const { tratamiento_realizado } = req.body;

        if (!tratamiento_realizado) {
            return res.status(400).json({
                success: false,
                message: 'El tratamiento realizado es requerido'
            });
        }

        const appointment = await Appointment.findById(id);
        if (!appointment) {
            return res.status(404).json({
                success: false,
                message: 'Cita no encontrada'
            });
        }

        // Solo practicantes y maestros pueden completar citas
        if (req.user.tipo_usuario === 'practicante') {
            const [practicante] = await db.execute(
                'SELECT id FROM practicantes WHERE usuario_id = ?',
                [req.user.userId]
            );
            if (practicante.length === 0 || appointment.practicante_id !== practicante[0].id) {
                return res.status(403).json({
                    success: false,
                    message: 'No tienes permiso para completar esta cita'
                });
            }
        }

        await Appointment.complete(id, req.user.userId, tratamiento_realizado);

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

        const marked = await Appointment.markNoShow(id, req.user.userId);

        if (marked) {
            res.json({
                success: true,
                message: 'Cita marcada como no asistió'
            });
        } else {
            res.status(400).json({
                success: false,
                message: 'No se pudo marcar la cita'
            });
        }
    } catch (error) {
        console.error('Error marking no-show:', error);
        res.status(500).json({
            success: false,
            message: 'Error al marcar cita'
        });
    }
};

// Obtener mis citas (practicante)
exports.getMyAppointments = async (req, res) => {
    try {
        if (req.user.tipo_usuario !== 'practicante') {
            return res.status(403).json({
                success: false,
                message: 'Solo los practicantes pueden usar este endpoint'
            });
        }

        const [practicante] = await db.execute(
            'SELECT id FROM practicantes WHERE usuario_id = ?',
            [req.user.userId]
        );

        if (practicante.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Practicante no encontrado'
            });
        }

        const appointments = await Appointment.getByPracticante(
            practicante[0].id,
            { estado: req.query.estado }
        );

        res.json({
            success: true,
            data: appointments
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
        if (req.user.tipo_usuario !== 'paciente') {
            return res.status(403).json({
                success: false,
                message: 'Solo los pacientes pueden usar este endpoint'
            });
        }

        const [paciente] = await db.execute(
            'SELECT id FROM pacientes WHERE usuario_id = ?',
            [req.user.userId]
        );

        if (paciente.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Paciente no encontrado'
            });
        }

        const appointments = await Appointment.getByPaciente(
            paciente[0].id,
            { estado: req.query.estado }
        );

        res.json({
            success: true,
            data: appointments
        });
    } catch (error) {
        console.error('Error getting patient appointments:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener tus citas'
        });
    }
};

// Obtener horarios disponibles para agendar
exports.getAvailableSlots = async (req, res) => {
    try {
        const { practica_id, practicante_id, fecha } = req.query;

        if (!practica_id || !practicante_id || !fecha) {
            return res.status(400).json({
                success: false,
                message: 'practica_id, practicante_id y fecha son requeridos'
            });
        }

        // Obtener maestro de la práctica
        const [practice] = await db.execute(
            'SELECT maestro_id FROM practicas WHERE id = ?',
            [practica_id]
        );

        if (practice.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Práctica no encontrada'
            });
        }

        // Obtener disponibilidad del maestro
        const dias = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];
        const fechaObj = new Date(fecha + 'T00:00:00');
        const diaSemana = dias[fechaObj.getDay()];

        const [disponibilidad] = await db.execute(
            `SELECT * FROM disponibilidad_maestros 
             WHERE maestro_id = ? AND dia_semana = ? AND activo = 1`,
            [practice[0].maestro_id, diaSemana]
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

        // Obtener citas del practicante para ese día
        const [citasPracticante] = await db.execute(
            `SELECT DATE_FORMAT(fecha_hora, '%H:%i') as hora, duracion_minutos
             FROM citas
             WHERE practicante_id = ? AND DATE(fecha_hora) = ?
             AND estado NOT IN ('cancelada', 'no_asistio')`,
            [practicante_id, fecha]
        );

        // Generar slots disponibles
        const slots = [];

        for (const horario of disponibilidad) {
            const [horaInicio, minInicio] = horario.hora_inicio.split(':').map(Number);
            const [horaFin, minFin] = horario.hora_fin.split(':').map(Number);

            let currentMinutes = horaInicio * 60 + minInicio;
            const endMinutes = horaFin * 60 + minFin;

            while (currentMinutes + 60 <= endMinutes) {
                const hora = Math.floor(currentMinutes / 60);
                const minuto = currentMinutes % 60;
                const horaStr = `${hora.toString().padStart(2, '0')}:${minuto.toString().padStart(2, '0')}`;

                // Verificar si el slot está ocupado
                const ocupado = citasPracticante.some(cita => {
                    const [citaHora, citaMin] = cita.hora.split(':').map(Number);
                    const citaMinutes = citaHora * 60 + citaMin;
                    const citaEndMinutes = citaMinutes + cita.duracion_minutos;

                    return (currentMinutes >= citaMinutes && currentMinutes < citaEndMinutes) ||
                           (currentMinutes + 60 > citaMinutes && currentMinutes + 60 <= citaEndMinutes);
                });

                slots.push({
                    hora: horaStr,
                    disponible: !ocupado
                });

                currentMinutes += 60;
            }
        }

        res.json({
            success: true,
            data: {
                fecha,
                dia_semana: diaSemana,
                practica_id: parseInt(practica_id),
                practicante_id: parseInt(practicante_id),
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

// Obtener estadísticas de citas
exports.getStatistics = async (req, res) => {
    try {
        let filters = {};

        if (req.user.tipo_usuario === 'practicante') {
            const [practicante] = await db.execute(
                'SELECT id FROM practicantes WHERE usuario_id = ?',
                [req.user.userId]
            );
            if (practicante.length > 0) {
                filters.practicante_id = practicante[0].id;
            }
        } else if (req.user.tipo_usuario === 'maestro') {
            const [maestro] = await db.execute(
                'SELECT id FROM maestros WHERE usuario_id = ?',
                [req.user.userId]
            );
            if (maestro.length > 0) {
                filters.maestro_id = maestro[0].id;
            }
        }

        const statistics = await Appointment.getStatistics(filters);

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