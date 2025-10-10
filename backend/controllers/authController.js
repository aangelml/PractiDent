// backend/controllers/authController.js - OPTIMIZADO
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/database');

// Generar tokens JWT
const generateTokens = (userId, email, tipo_usuario, nombre, apellido) => {
  const accessToken = jwt.sign(
    { 
      userId, 
      email,
      tipo_usuario,
      nombre,
      apellido,
      type: 'access' 
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || '30m' }
  );

  const refreshToken = jwt.sign(
    { userId, type: 'refresh' },
    process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRE || '7d' }
  );

  return { accessToken, refreshToken };
};

// Registro de usuario
exports.register = async (req, res) => {
  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();
    
    const { 
      nombre, 
      apellido, 
      email, 
      password, 
      telefono,
      tipo_usuario,
      // Campos específicos
      matricula,
      semestre,
      turno,
      cedula_profesional,
      especialidad,
      anos_experiencia,
      fecha_nacimiento,
      direccion
    } = req.body;

    // Verificar email duplicado
    const [existingUser] = await connection.execute(
      'SELECT id FROM usuarios WHERE email = ?',
      [email]
    );

    if (existingUser.length > 0) {
      await connection.rollback();
      return res.status(409).json({
        success: false,
        message: 'El email ya está registrado'
      });
    }

    // Hash de contraseña
    const hashedPassword = await bcrypt.hash(
      password, 
      parseInt(process.env.BCRYPT_ROUNDS) || 12
    );

    // Insertar usuario base
    const [userResult] = await connection.execute(
      `INSERT INTO usuarios (nombre, apellido, email, password, telefono, tipo_usuario, estado, activo) 
       VALUES (?, ?, ?, ?, ?, ?, 'activo', 1)`,
      [nombre, apellido, email, hashedPassword, telefono || null, tipo_usuario]
    );

    const userId = userResult.insertId;

    // Insertar datos específicos según tipo
    if (tipo_usuario === 'practicante') {
      // Validar campos requeridos
      if (!matricula || !semestre || !turno) {
        await connection.rollback();
        return res.status(400).json({
          success: false,
          message: 'Matrícula, semestre y turno son requeridos para practicantes'
        });
      }

      await connection.execute(
        `INSERT INTO practicantes (usuario_id, matricula, semestre, turno) 
         VALUES (?, ?, ?, ?)`,
        [userId, matricula, semestre, turno]
      );
      
    } else if (tipo_usuario === 'maestro') {
      // Validar campos requeridos
      if (!cedula_profesional || !especialidad) {
        await connection.rollback();
        return res.status(400).json({
          success: false,
          message: 'Cédula profesional y especialidad son requeridas para maestros'
        });
      }

      await connection.execute(
        `INSERT INTO maestros (usuario_id, cedula_profesional, especialidad, anos_experiencia) 
         VALUES (?, ?, ?, ?)`,
        [userId, cedula_profesional, especialidad, anos_experiencia || 0]
      );
      
    } else if (tipo_usuario === 'paciente') {
      // Validar campos requeridos
      if (!fecha_nacimiento || !telefono) {
        await connection.rollback();
        return res.status(400).json({
          success: false,
          message: 'Fecha de nacimiento y teléfono son requeridos para pacientes'
        });
      }

      await connection.execute(
        `INSERT INTO pacientes (usuario_id, fecha_nacimiento, telefono, direccion) 
         VALUES (?, ?, ?, ?)`,
        [userId, fecha_nacimiento, telefono, direccion || null]
      );
    }

    // Registrar auditoría
    await connection.execute(
      `INSERT INTO audit_logs (usuario_id, accion, tabla_afectada, registro_id, descripcion) 
       VALUES (?, 'CREATE', 'usuarios', ?, ?)`,
      [userId, userId, `Usuario ${email} registrado como ${tipo_usuario}`]
    );

    await connection.commit();

    // Generar tokens
    const { accessToken, refreshToken } = generateTokens(
      userId, 
      email, 
      tipo_usuario, 
      nombre, 
      apellido
    );

    // Guardar refresh token
    await User.updateRefreshToken(userId, refreshToken);

    res.status(201).json({
      success: true,
      message: 'Usuario registrado exitosamente',
      data: {
        user: {
          id: userId,
          nombre,
          apellido,
          email,
          telefono: telefono || null,
          tipo_usuario
        },
        token: accessToken,
        refreshToken
      }
    });

  } catch (error) {
    await connection.rollback();
    console.error('Error en registro:', error);
    
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({
        success: false,
        message: 'El email, matrícula o cédula ya está registrado'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Error al registrar usuario',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  } finally {
    connection.release();
  }
};

// Login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Buscar usuario activo
    const [users] = await db.execute(
      `SELECT id, nombre, apellido, email, password, telefono, tipo_usuario, estado, activo
       FROM usuarios 
       WHERE email = ? AND estado = 'activo' AND activo = 1`,
      [email]
    );

    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Credenciales inválidas'
      });
    }

    const user = users[0];

    // Verificar contraseña
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: 'Credenciales inválidas'
      });
    }

    // Generar tokens
    const { accessToken, refreshToken } = generateTokens(
      user.id,
      user.email,
      user.tipo_usuario,
      user.nombre,
      user.apellido
    );

    // Actualizar último login y refresh token
    await db.execute(
      'UPDATE usuarios SET last_login = CURRENT_TIMESTAMP WHERE id = ?',
      [user.id]
    );
    await User.updateRefreshToken(user.id, refreshToken);

    // Registrar auditoría
    await db.execute(
      `INSERT INTO audit_logs (usuario_id, accion, descripcion, ip_address) 
       VALUES (?, 'LOGIN', 'Inicio de sesión exitoso', ?)`,
      [user.id, req.ip || req.headers['x-forwarded-for'] || 'unknown']
    );

    res.json({
      success: true,
      message: 'Login exitoso',
      data: {
        user: {
          id: user.id,
          nombre: user.nombre,
          apellido: user.apellido,
          email: user.email,
          telefono: user.telefono,
          tipo_usuario: user.tipo_usuario
        },
        token: accessToken,
        refreshToken
      }
    });

  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({
      success: false,
      message: 'Error al iniciar sesión'
    });
  }
};

// Obtener perfil
exports.getProfile = async (req, res) => {
  try {
    const userId = req.user.userId;

    const [users] = await db.execute(
      `SELECT 
        u.id, u.nombre, u.apellido, u.email, u.telefono, u.tipo_usuario, 
        u.estado, u.activo, u.created_at, u.last_login,
        p.matricula, p.semestre, p.turno,
        m.cedula_profesional, m.especialidad, m.anos_experiencia,
        pa.fecha_nacimiento, pa.direccion
      FROM usuarios u
      LEFT JOIN practicantes p ON u.id = p.usuario_id
      LEFT JOIN maestros m ON u.id = m.usuario_id
      LEFT JOIN pacientes pa ON u.id = pa.usuario_id
      WHERE u.id = ?`,
      [userId]
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    const user = users[0];
    const profile = {
      id: user.id,
      nombre: user.nombre,
      apellido: user.apellido,
      email: user.email,
      telefono: user.telefono,
      tipo_usuario: user.tipo_usuario,
      estado: user.estado,
      activo: user.activo,
      created_at: user.created_at,
      last_login: user.last_login
    };

    // Agregar datos específicos según tipo
    if (user.tipo_usuario === 'practicante') {
      profile.matricula = user.matricula;
      profile.semestre = user.semestre;
      profile.turno = user.turno;
    } else if (user.tipo_usuario === 'maestro') {
      profile.cedula_profesional = user.cedula_profesional;
      profile.especialidad = user.especialidad;
      profile.anos_experiencia = user.anos_experiencia;
    } else if (user.tipo_usuario === 'paciente') {
      profile.fecha_nacimiento = user.fecha_nacimiento;
      profile.direccion = user.direccion;
    }

    res.json({
      success: true,
      data: { user: profile }
    });

  } catch (error) {
    console.error('Error obteniendo perfil:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener perfil'
    });
  }
};

// Refresh token
exports.refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        message: 'Refresh token no proporcionado'
      });
    }

    let decoded;
    try {
      decoded = jwt.verify(
        refreshToken, 
        process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET
      );
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: 'Refresh token inválido o expirado'
      });
    }

    if (decoded.type !== 'refresh') {
      return res.status(401).json({
        success: false,
        message: 'Tipo de token inválido'
      });
    }

    // Verificar token en BD
    const isValid = await User.verifyRefreshToken(decoded.userId, refreshToken);
    if (!isValid) {
      return res.status(401).json({
        success: false,
        message: 'Refresh token no válido'
      });
    }

    // Obtener datos del usuario
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    // Generar nuevos tokens
    const tokens = generateTokens(
      user.id,
      user.email,
      user.tipo_usuario,
      user.nombre,
      user.apellido
    );

    // Actualizar refresh token
    await User.updateRefreshToken(user.id, tokens.refreshToken);

    res.json({
      success: true,
      data: {
        token: tokens.accessToken,
        refreshToken: tokens.refreshToken
      }
    });

  } catch (error) {
    console.error('Error refreshing token:', error);
    res.status(500).json({
      success: false,
      message: 'Error al renovar token'
    });
  }
};

// Logout
exports.logout = async (req, res) => {
  try {
    const userId = req.user.userId;
    
    // Limpiar refresh token
    await User.updateRefreshToken(userId, null);

    // Registrar auditoría
    await db.execute(
      `INSERT INTO audit_logs (usuario_id, accion, descripcion) 
       VALUES (?, 'LOGOUT', 'Cierre de sesión')`,
      [userId]
    );

    res.json({
      success: true,
      message: 'Sesión cerrada exitosamente'
    });

  } catch (error) {
    console.error('Error en logout:', error);
    res.status(500).json({
      success: false,
      message: 'Error al cerrar sesión'
    });
  }
};

// Cambiar contraseña
exports.changePassword = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { currentPassword, newPassword } = req.body;

    // Obtener usuario
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    // Verificar contraseña actual
    const isValid = await user.verifyPassword(currentPassword);
    if (!isValid) {
      return res.status(401).json({
        success: false,
        message: 'Contraseña actual incorrecta'
      });
    }

    // Cambiar contraseña
    await User.changePassword(userId, newPassword);

    res.json({
      success: true,
      message: 'Contraseña actualizada exitosamente'
    });

  } catch (error) {
    console.error('Error changing password:', error);
    res.status(500).json({
      success: false,
      message: 'Error al cambiar contraseña'
    });
  }
};