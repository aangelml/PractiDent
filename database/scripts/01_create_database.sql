-- ============================================
-- PRACTIDENT - BASE DE DATOS COMPLETA
-- Elimina y recrea toda la estructura
-- ============================================

-- PASO 1: Eliminar base de datos existente
DROP DATABASE IF EXISTS practident_db;

-- PASO 2: Crear base de datos limpia
CREATE DATABASE practident_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE practident_db;

-- ============================================
-- TABLA PRINCIPAL: USUARIOS
-- ============================================
CREATE TABLE usuarios (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nombre VARCHAR(100) NOT NULL,
    apellido VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    telefono VARCHAR(20) DEFAULT NULL,
    password VARCHAR(255) NOT NULL,
    tipo_usuario ENUM('practicante', 'maestro', 'paciente', 'admin') NOT NULL,
    estado ENUM('activo', 'inactivo', 'suspendido') DEFAULT 'activo',
    activo BOOLEAN DEFAULT 1,
    refresh_token VARCHAR(500) DEFAULT NULL,
    last_login DATETIME DEFAULT NULL,
    login_attempts INT DEFAULT 0,
    locked_until DATETIME DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_tipo_usuario (tipo_usuario),
    INDEX idx_refresh_token (refresh_token),
    INDEX idx_estado (estado)
);

-- ============================================
-- TABLAS ESPECÍFICAS POR TIPO DE USUARIO
-- ============================================

-- Tabla de PRACTICANTES
CREATE TABLE practicantes (
    id INT PRIMARY KEY AUTO_INCREMENT,
    usuario_id INT UNIQUE NOT NULL,
    matricula VARCHAR(20) UNIQUE NOT NULL,
    semestre INT NOT NULL CHECK (semestre >= 1 AND semestre <= 12),
    turno ENUM('matutino', 'vespertino') DEFAULT 'matutino',
    promedio DECIMAL(3,2) DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    INDEX idx_matricula (matricula),
    INDEX idx_usuario (usuario_id)
);

-- Tabla de MAESTROS
CREATE TABLE maestros (
    id INT PRIMARY KEY AUTO_INCREMENT,
    usuario_id INT UNIQUE NOT NULL,
    cedula_profesional VARCHAR(20) UNIQUE NOT NULL,
    especialidad VARCHAR(100) NOT NULL,
    anos_experiencia INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    INDEX idx_cedula (cedula_profesional),
    INDEX idx_usuario (usuario_id)
);

-- Tabla de PACIENTES
CREATE TABLE pacientes (
    id INT PRIMARY KEY AUTO_INCREMENT,
    usuario_id INT UNIQUE NOT NULL,
    fecha_nacimiento DATE NOT NULL,
    telefono VARCHAR(20) NOT NULL,
    direccion VARCHAR(200),
    tipo_sangre VARCHAR(5),
    alergias TEXT,
    enfermedades_cronicas TEXT,
    historial_medico TEXT,
    contacto_emergencia VARCHAR(100),
    telefono_emergencia VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    INDEX idx_usuario (usuario_id)
);

-- ============================================
-- TABLA DE PRÁCTICAS ODONTOLÓGICAS
-- ============================================
CREATE TABLE practicas (
    id INT PRIMARY KEY AUTO_INCREMENT,
    maestro_id INT NOT NULL,
    nombre VARCHAR(200) NOT NULL,
    descripcion TEXT,
    requisitos TEXT,
    tipo_practica VARCHAR(100),
    duracion_estimada_horas INT DEFAULT 1,
    cupo_maximo INT DEFAULT 10,
    cupo_disponible INT DEFAULT 10,
    fecha_inicio DATE,
    fecha_fin DATE,
    estado ENUM('activa', 'completada', 'cancelada') DEFAULT 'activa',
    nivel_dificultad ENUM('basico', 'intermedio', 'avanzado') DEFAULT 'basico',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (maestro_id) REFERENCES maestros(id) ON DELETE CASCADE,
    INDEX idx_estado_practica (estado),
    INDEX idx_maestro (maestro_id),
    INDEX idx_nivel (nivel_dificultad)
);

-- ============================================
-- TABLA DE ASIGNACIÓN PRACTICANTES-PRÁCTICAS
-- ============================================
CREATE TABLE practicantes_practicas (
    id INT PRIMARY KEY AUTO_INCREMENT,
    practica_id INT NOT NULL,
    practicante_id INT NOT NULL,
    fecha_asignacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    estado ENUM('asignado', 'en_progreso', 'completado', 'cancelado') DEFAULT 'asignado',
    fecha_inicio_real DATETIME DEFAULT NULL,
    fecha_fin_real DATETIME DEFAULT NULL,
    observaciones TEXT,
    calificacion_maestro DECIMAL(3,2) DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (practica_id) REFERENCES practicas(id) ON DELETE CASCADE,
    FOREIGN KEY (practicante_id) REFERENCES practicantes(id) ON DELETE CASCADE,
    UNIQUE KEY unique_asignacion (practica_id, practicante_id),
    INDEX idx_practica (practica_id),
    INDEX idx_practicante (practicante_id),
    INDEX idx_estado_asignacion (estado)
);

-- ============================================
-- TABLA DE CITAS
-- ============================================
CREATE TABLE citas (
    id INT PRIMARY KEY AUTO_INCREMENT,
    practica_id INT NOT NULL,
    practicante_id INT NOT NULL,
    paciente_id INT NOT NULL,
    fecha_hora DATETIME NOT NULL,
    duracion_minutos INT DEFAULT 60,
    estado ENUM('pendiente', 'confirmada', 'completada', 'cancelada', 'no_asistio') DEFAULT 'pendiente',
    motivo_consulta TEXT,
    notas TEXT,
    tratamiento_realizado TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (practica_id) REFERENCES practicas(id) ON DELETE CASCADE,
    FOREIGN KEY (practicante_id) REFERENCES practicantes(id) ON DELETE CASCADE,
    FOREIGN KEY (paciente_id) REFERENCES pacientes(id) ON DELETE CASCADE,
    UNIQUE KEY unique_cita (practicante_id, fecha_hora),
    INDEX idx_fecha (fecha_hora),
    INDEX idx_estado_cita (estado),
    INDEX idx_paciente (paciente_id),
    INDEX idx_practica (practica_id)
);

-- ============================================
-- TABLA DE DISPONIBILIDAD DE MAESTROS
-- ============================================
CREATE TABLE disponibilidad_maestros (
    id INT PRIMARY KEY AUTO_INCREMENT,
    maestro_id INT NOT NULL,
    dia_semana ENUM('lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo') NOT NULL,
    hora_inicio TIME NOT NULL,
    hora_fin TIME NOT NULL,
    activo BOOLEAN DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (maestro_id) REFERENCES maestros(id) ON DELETE CASCADE,
    INDEX idx_maestro_dia (maestro_id, dia_semana),
    INDEX idx_activo (activo)
);

-- ============================================
-- TABLA DE EVALUACIONES
-- ============================================
CREATE TABLE evaluaciones (
    id INT PRIMARY KEY AUTO_INCREMENT,
    cita_id INT NOT NULL,
    tipo ENUM('maestro_practicante', 'paciente_servicio') NOT NULL,
    evaluador_id INT NOT NULL,
    evaluado_id INT NOT NULL,
    calificacion INT NOT NULL CHECK (calificacion >= 1 AND calificacion <= 5),
    comentarios TEXT,
    aspectos_positivos TEXT,
    aspectos_mejorar TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (cita_id) REFERENCES citas(id) ON DELETE CASCADE,
    FOREIGN KEY (evaluador_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    FOREIGN KEY (evaluado_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    INDEX idx_cita (cita_id),
    INDEX idx_evaluador (evaluador_id),
    INDEX idx_evaluado (evaluado_id),
    INDEX idx_tipo (tipo)
);

-- ============================================
-- TABLAS DE SEGURIDAD Y AUDITORÍA
-- ============================================

-- Tabla de logs de auditoría
CREATE TABLE audit_logs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    usuario_id INT,
    accion VARCHAR(100) NOT NULL,
    tabla_afectada VARCHAR(50),
    registro_id INT,
    descripcion TEXT,
    ip_address VARCHAR(45),
    user_agent VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL,
    INDEX idx_usuario_log (usuario_id),
    INDEX idx_accion (accion),
    INDEX idx_fecha_log (created_at)
);

-- Tabla para tokens revocados (blacklist de JWT)
CREATE TABLE revoked_tokens (
    id INT PRIMARY KEY AUTO_INCREMENT,
    token_jti VARCHAR(255) NOT NULL UNIQUE,
    usuario_id INT NOT NULL,
    revoked_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    expires_at DATETIME NOT NULL,
    reason VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    INDEX idx_token_jti (token_jti),
    INDEX idx_expires_at (expires_at)
);

-- Tabla para sesiones activas
CREATE TABLE user_sessions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    usuario_id INT NOT NULL,
    session_token VARCHAR(255) NOT NULL,
    ip_address VARCHAR(45),
    user_agent VARCHAR(255),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    expires_at DATETIME NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    INDEX idx_session_token (session_token),
    INDEX idx_usuario_sessions (usuario_id, is_active)
);

-- ============================================
-- VISTAS
-- ============================================

-- Vista de información de autenticación
CREATE VIEW user_auth_info AS
SELECT 
    u.id,
    u.nombre,
    u.apellido,
    u.email,
    u.tipo_usuario,
    u.estado,
    u.last_login,
    u.login_attempts,
    u.locked_until,
    COUNT(DISTINCT s.id) as active_sessions
FROM usuarios u
LEFT JOIN user_sessions s ON u.id = s.usuario_id 
    AND s.is_active = TRUE 
    AND s.expires_at > NOW()
GROUP BY u.id, u.nombre, u.apellido, u.email, u.tipo_usuario, 
         u.estado, u.last_login, u.login_attempts, u.locked_until;

-- Vista de prácticas completas
CREATE VIEW vista_practicas_completas AS
SELECT 
    p.id,
    p.nombre,
    p.descripcion,
    p.requisitos,
    p.tipo_practica,
    p.duracion_estimada_horas,
    p.fecha_inicio,
    p.fecha_fin,
    p.estado,
    p.nivel_dificultad,
    p.cupo_maximo,
    p.cupo_disponible,
    m.id as maestro_id,
    CONCAT(um.nombre, ' ', um.apellido) as maestro_nombre,
    m.especialidad as maestro_especialidad,
    COUNT(DISTINCT pp.practicante_id) as total_practicantes,
    COUNT(DISTINCT CASE WHEN pp.estado = 'completado' THEN pp.practicante_id END) as practicantes_completados,
    AVG(pp.calificacion_maestro) as promedio_calificacion
FROM practicas p
LEFT JOIN maestros m ON p.maestro_id = m.id
LEFT JOIN usuarios um ON m.usuario_id = um.id
LEFT JOIN practicantes_practicas pp ON p.id = pp.practica_id
GROUP BY p.id, p.nombre, p.descripcion, p.requisitos, p.tipo_practica, 
         p.duracion_estimada_horas, p.fecha_inicio, p.fecha_fin, p.estado, 
         p.nivel_dificultad, p.cupo_maximo, p.cupo_disponible,
         m.id, um.nombre, um.apellido, m.especialidad;

-- Vista de practicantes y sus prácticas
CREATE VIEW vista_practicante_practicas AS
SELECT 
    pp.id as asignacion_id,
    pp.practicante_id,
    CONCAT(up.nombre, ' ', up.apellido) as practicante_nombre,
    pr.matricula,
    pp.practica_id,
    p.nombre as practica_nombre,
    p.descripcion,
    p.tipo_practica,
    p.nivel_dificultad,
    p.fecha_inicio as fecha_inicio_practica,
    p.fecha_fin as fecha_fin_practica,
    pp.fecha_asignacion,
    pp.estado as estado_asignacion,
    pp.fecha_inicio_real,
    pp.fecha_fin_real,
    pp.observaciones,
    pp.calificacion_maestro,
    m.id as maestro_id,
    CONCAT(um.nombre, ' ', um.apellido) as maestro_nombre,
    m.especialidad as maestro_especialidad
FROM practicantes_practicas pp
JOIN practicas p ON pp.practica_id = p.id
JOIN practicantes pr ON pp.practicante_id = pr.id
JOIN usuarios up ON pr.usuario_id = up.id
JOIN maestros m ON p.maestro_id = m.id
JOIN usuarios um ON m.usuario_id = um.id;

-- ============================================
-- PROCEDIMIENTOS ALMACENADOS
-- ============================================

-- Procedimiento para asignar practicante a práctica
DELIMITER //
CREATE PROCEDURE asignar_practicante_practica(
    IN p_practica_id INT,
    IN p_practicante_id INT,
    OUT p_mensaje VARCHAR(255),
    OUT p_success BOOLEAN
)
BEGIN
    DECLARE v_cupo_disponible INT;
    DECLARE v_estado_practica VARCHAR(20);
    DECLARE v_ya_asignado INT;
    
    SET p_success = FALSE;
    
    SELECT cupo_disponible, estado INTO v_cupo_disponible, v_estado_practica
    FROM practicas 
    WHERE id = p_practica_id;
    
    IF v_estado_practica IS NULL THEN
        SET p_mensaje = 'La practica no existe';
    ELSEIF v_estado_practica != 'activa' THEN
        SET p_mensaje = 'La practica no esta activa';
    ELSEIF v_cupo_disponible <= 0 THEN
        SET p_mensaje = 'No hay cupo disponible en esta practica';
    ELSE
        SELECT COUNT(*) INTO v_ya_asignado
        FROM practicantes_practicas
        WHERE practica_id = p_practica_id AND practicante_id = p_practicante_id;
        
        IF v_ya_asignado > 0 THEN
            SET p_mensaje = 'El practicante ya esta asignado a esta practica';
        ELSE
            INSERT INTO practicantes_practicas (practica_id, practicante_id)
            VALUES (p_practica_id, p_practicante_id);
            
            UPDATE practicas 
            SET cupo_disponible = cupo_disponible - 1
            WHERE id = p_practica_id;
            
            SET p_mensaje = 'Practicante asignado exitosamente';
            SET p_success = TRUE;
        END IF;
    END IF;
END//
DELIMITER ;

-- Procedimiento para limpiar tokens expirados
DELIMITER //
CREATE PROCEDURE cleanup_expired_tokens()
BEGIN
    DELETE FROM revoked_tokens WHERE expires_at < NOW();
    DELETE FROM user_sessions WHERE expires_at < NOW() AND is_active = FALSE;
END//
DELIMITER ;

-- ============================================
-- TRIGGERS
-- ============================================

-- Trigger para actualizar cupo al eliminar asignación
DELIMITER //
CREATE TRIGGER actualizar_cupo_after_delete
AFTER DELETE ON practicantes_practicas
FOR EACH ROW
BEGIN
    UPDATE practicas 
    SET cupo_disponible = cupo_disponible + 1
    WHERE id = OLD.practica_id 
    AND cupo_disponible < cupo_maximo;
END//
DELIMITER ;

-- ============================================
-- DATOS INICIALES
-- ============================================

-- Usuario Admin (password: Admin123!)
-- NOTA: Este es un hash temporal, debes generar uno nuevo con bcrypt
INSERT INTO usuarios (nombre, apellido, email, password, tipo_usuario, estado, activo) 
VALUES ('Admin', 'Sistema', 'admin@practident.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5ygk6LDAQ/V5K', 'admin', 'activo', 1);

-- ============================================
-- VERIFICACIÓN FINAL
-- ============================================
SELECT '✅ Base de datos creada exitosamente' AS 'RESULTADO';
SELECT 'Tablas creadas:' AS 'INFO';
SHOW TABLES;