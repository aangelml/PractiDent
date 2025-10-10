const pool = require('../config/database');

// Obtener datos del dashboard según el tipo de usuario
exports.getDashboard = async (req, res) => {
    try {
        const userId = req.user.id;
        const userType = req.user.tipo_usuario;
        
        let dashboardData = {
            user: {
                id: userId,
                nombre: req.user.nombre,
                email: req.user.email,
                tipo_usuario: userType
            }
        };

        switch(userType) {
            case 'practicante':
                dashboardData = await getPracticanteDashboard(userId, dashboardData);
                break;
            case 'maestro':
                dashboardData = await getMaestroDashboard(userId, dashboardData);
                break;
            case 'paciente':
                dashboardData = await getPacienteDashboard(userId, dashboardData);
                break;
        }

        res.json(dashboardData);
    } catch (error) {
        console.error('Dashboard error:', error);
        res.status(500).json({ message: 'Error al cargar el dashboard' });
    }
};

// Dashboard del Practicante
async function getPracticanteDashboard(userId, dashboardData) {
    const connection = await pool.getConnection();
    try {
        // Obtener información del practicante
        const [practicante] = await connection.execute(
            'SELECT * FROM practicantes WHERE usuario_id = ?',
            [userId]
        );

        // Obtener estadísticas
        const [stats] = await connection.execute(`
            SELECT 
                (SELECT COUNT(*) FROM citas WHERE practicante_id = ?) as total_citas,
                (SELECT COUNT(*) FROM citas WHERE practicante_id = ? AND estado = 'pendiente') as citas_pendientes,
                (SELECT COUNT(*) FROM citas WHERE practicante_id = ? AND estado = 'completada') as citas_completadas,
                (SELECT COUNT(*) FROM evaluaciones WHERE practicante_id = ?) as total_evaluaciones,
                (SELECT AVG(calificacion) FROM evaluaciones WHERE practicante_id = ?) as promedio_evaluaciones
        `, [userId, userId, userId, userId, userId]);

        // Obtener próximas citas
        const [proximasCitas] = await connection.execute(`
            SELECT c.*, p.nombre as paciente_nombre, p.apellido as paciente_apellido
            FROM citas c
            LEFT JOIN pacientes pac ON c.paciente_id = pac.usuario_id
            LEFT JOIN usuarios p ON pac.usuario_id = p.id
            WHERE c.practicante_id = ? 
            AND c.fecha >= CURDATE()
            AND c.estado IN ('pendiente', 'confirmada')
            ORDER BY c.fecha, c.hora_inicio
            LIMIT 5
        `, [userId]);

        // Obtener evaluaciones recientes
        const [evaluacionesRecientes] = await connection.execute(`
            SELECT e.*, p.nombre as evaluador_nombre
            FROM evaluaciones e
            LEFT JOIN usuarios p ON e.evaluador_id = p.id
            WHERE e.practicante_id = ?
            ORDER BY e.fecha_evaluacion DESC
            LIMIT 5
        `, [userId]);

        dashboardData.practicante = practicante[0] || {};
        dashboardData.estadisticas = stats[0];
        dashboardData.proximasCitas = proximasCitas;
        dashboardData.evaluacionesRecientes = evaluacionesRecientes;

        return dashboardData;
    } finally {
        connection.release();
    }
}

// Dashboard del Maestro
async function getMaestroDashboard(userId, dashboardData) {
    const connection = await pool.getConnection();
    try {
        // Obtener información del maestro
        const [maestro] = await connection.execute(
            'SELECT * FROM maestros WHERE usuario_id = ?',
            [userId]
        );

        // Obtener estadísticas
        const [stats] = await connection.execute(`
            SELECT 
                (SELECT COUNT(DISTINCT p.usuario_id) 
                 FROM practicantes p 
                 WHERE p.maestro_asignado = ?) as total_estudiantes,
                (SELECT COUNT(*) FROM practicas WHERE maestro_id = ?) as total_practicas,
                (SELECT COUNT(*) FROM practicas WHERE maestro_id = ? AND estado = 'activa') as practicas_activas,
                (SELECT COUNT(*) FROM evaluaciones WHERE evaluador_id = ? AND tipo_evaluacion = 'maestro_practicante') as evaluaciones_realizadas
        `, [userId, userId, userId, userId]);

        // Obtener estudiantes asignados
        const [estudiantes] = await connection.execute(`
            SELECT u.id, u.nombre, u.apellido, u.email, p.semestre, p.grupo
            FROM practicantes p
            INNER JOIN usuarios u ON p.usuario_id = u.id
            WHERE p.maestro_asignado = ?
            ORDER BY p.semestre, p.grupo, u.apellido
            LIMIT 10
        `, [userId]);

        // Obtener prácticas supervisadas activas
        const [practicasActivas] = await connection.execute(`
            SELECT pr.*, 
                   COUNT(DISTINCT cp.practicante_id) as num_practicantes
            FROM practicas pr
            LEFT JOIN citas_practicas cp ON pr.id = cp.practica_id
            WHERE pr.maestro_id = ? AND pr.estado = 'activa'
            GROUP BY pr.id
            ORDER BY pr.fecha_inicio DESC
            LIMIT 5
        `, [userId]);

        // Obtener evaluaciones pendientes
        const [evaluacionesPendientes] = await connection.execute(`
            SELECT c.*, u.nombre as practicante_nombre, u.apellido as practicante_apellido,
                   pac.nombre as paciente_nombre, pac.apellido as paciente_apellido
            FROM citas c
            INNER JOIN usuarios u ON c.practicante_id = u.id
            INNER JOIN usuarios pac ON c.paciente_id = pac.id
            LEFT JOIN evaluaciones e ON c.id = e.cita_id AND e.tipo_evaluacion = 'maestro_practicante'
            WHERE c.maestro_supervisor = ? 
            AND c.estado = 'completada'
            AND e.id IS NULL
            ORDER BY c.fecha DESC
            LIMIT 5
        `, [userId]);

        dashboardData.maestro = maestro[0] || {};
        dashboardData.estadisticas = stats[0];
        dashboardData.estudiantes = estudiantes;
        dashboardData.practicasActivas = practicasActivas;
        dashboardData.evaluacionesPendientes = evaluacionesPendientes;

        return dashboardData;
    } finally {
        connection.release();
    }
}

// Dashboard del Paciente
async function getPacienteDashboard(userId, dashboardData) {
    const connection = await pool.getConnection();
    try {
        // Obtener información del paciente
        const [paciente] = await connection.execute(
            'SELECT * FROM pacientes WHERE usuario_id = ?',
            [userId]
        );

        // Obtener estadísticas
        const [stats] = await connection.execute(`
            SELECT 
                (SELECT COUNT(*) FROM citas WHERE paciente_id = ?) as total_citas,
                (SELECT COUNT(*) FROM citas WHERE paciente_id = ? AND estado = 'pendiente') as citas_pendientes,
                (SELECT COUNT(*) FROM citas WHERE paciente_id = ? AND estado = 'completada') as citas_completadas,
                (SELECT COUNT(*) FROM evaluaciones WHERE cita_id IN (SELECT id FROM citas WHERE paciente_id = ?)) as evaluaciones_dadas
        `, [userId, userId, userId, userId]);

        // Obtener próximas citas
        const [proximasCitas] = await connection.execute(`
            SELECT c.*, 
                   u.nombre as practicante_nombre, u.apellido as practicante_apellido,
                   pr.nombre as practica_nombre
            FROM citas c
            LEFT JOIN usuarios u ON c.practicante_id = u.id
            LEFT JOIN citas_practicas cp ON c.id = cp.cita_id
            LEFT JOIN practicas pr ON cp.practica_id = pr.id
            WHERE c.paciente_id = ? 
            AND c.fecha >= CURDATE()
            AND c.estado IN ('pendiente', 'confirmada')
            ORDER BY c.fecha, c.hora_inicio
            LIMIT 5
        `, [userId]);

        // Obtener historial de citas
        const [historialCitas] = await connection.execute(`
            SELECT c.*, 
                   u.nombre as practicante_nombre, u.apellido as practicante_apellido,
                   pr.nombre as practica_nombre,
                   e.calificacion, e.comentarios as evaluacion_comentarios
            FROM citas c
            LEFT JOIN usuarios u ON c.practicante_id = u.id
            LEFT JOIN citas_practicas cp ON c.id = cp.cita_id
            LEFT JOIN practicas pr ON cp.practica_id = pr.id
            LEFT JOIN evaluaciones e ON c.id = e.cita_id AND e.tipo_evaluacion = 'paciente_servicio'
            WHERE c.paciente_id = ? 
            AND c.estado = 'completada'
            ORDER BY c.fecha DESC
            LIMIT 10
        `, [userId]);

        dashboardData.paciente = paciente[0] || {};
        dashboardData.estadisticas = stats[0];
        dashboardData.proximasCitas = proximasCitas;
        dashboardData.historialCitas = historialCitas;

        return dashboardData;
    } finally {
        connection.release();
    }
}

// Obtener notificaciones del usuario
exports.getNotifications = async (req, res) => {
    try {
        const userId = req.user.id;
        const userType = req.user.tipo_usuario;
        
        const connection = await pool.getConnection();
        
        try {
            let notifications = [];
            
            // Notificaciones según tipo de usuario
            if (userType === 'practicante') {
                // Nuevas citas asignadas
                const [newAppointments] = await connection.execute(`
                    SELECT 'nueva_cita' as tipo, c.*, p.nombre as paciente_nombre
                    FROM citas c
                    LEFT JOIN usuarios p ON c.paciente_id = p.id
                    WHERE c.practicante_id = ? 
                    AND c.created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
                    ORDER BY c.created_at DESC
                    LIMIT 5
                `, [userId]);
                
                notifications = [...notifications, ...newAppointments];
            } else if (userType === 'maestro') {
                // Prácticas que requieren supervisión
                const [supervisionNeeded] = await connection.execute(`
                    SELECT 'supervision_requerida' as tipo, pr.*, COUNT(c.id) as citas_pendientes
                    FROM practicas pr
                    LEFT JOIN citas_practicas cp ON pr.id = cp.practica_id
                    LEFT JOIN citas c ON cp.cita_id = c.id AND c.estado = 'pendiente'
                    WHERE pr.maestro_id = ? AND pr.estado = 'activa'
                    GROUP BY pr.id
                    HAVING citas_pendientes > 0
                    LIMIT 5
                `, [userId]);
                
                notifications = [...notifications, ...supervisionNeeded];
            } else if (userType === 'paciente') {
                // Recordatorios de citas próximas
                const [upcomingReminders] = await connection.execute(`
                    SELECT 'recordatorio_cita' as tipo, c.*, u.nombre as practicante_nombre
                    FROM citas c
                    LEFT JOIN usuarios u ON c.practicante_id = u.id
                    WHERE c.paciente_id = ? 
                    AND c.fecha BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 3 DAY)
                    AND c.estado IN ('pendiente', 'confirmada')
                    ORDER BY c.fecha, c.hora_inicio
                    LIMIT 5
                `, [userId]);
                
                notifications = [...notifications, ...upcomingReminders];
            }
            
            res.json(notifications);
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error('Notifications error:', error);
        res.status(500).json({ message: 'Error al cargar notificaciones' });
    }
};