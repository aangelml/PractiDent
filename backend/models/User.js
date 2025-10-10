// backend/models/User.js
const db = require('../config/database');
const bcrypt = require('bcryptjs');

class User {
  constructor(data) {
    this.id = data.id;
    this.nombre = data.nombre;
    this.apellido = data.apellido;
    this.email = data.email;
    this.password = data.password;
    this.tipo_usuario = data.tipo_usuario;
    this.estado = data.estado || 'activo';
    this.refresh_token = data.refresh_token;
    this.last_login = data.last_login;
    this.login_attempts = data.login_attempts;
    this.locked_until = data.locked_until;
    this.created_at = data.created_at;
    this.updated_at = data.updated_at;
  }

  // Crear nuevo usuario
  static async create(userData) {
    const connection = await db.getConnection();
    
    try {
      await connection.beginTransaction();

      // Hash de la contraseña
      const hashedPassword = await bcrypt.hash(userData.password, parseInt(process.env.BCRYPT_ROUNDS));
      
      // Insertar en tabla usuarios
      const [result] = await connection.execute(
        `INSERT INTO usuarios (nombre, apellido, email, password, tipo_usuario, estado) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          userData.nombre,
          userData.apellido,
          userData.email,
          hashedPassword,
          userData.tipo_usuario,
          userData.estado || 'activo'
        ]
      );

      const userId = result.insertId;

      // Insertar en tabla específica según tipo de usuario
      if (userData.tipo_usuario === 'practicante') {
        await connection.execute(
          `INSERT INTO practicantes (usuario_id, matricula, semestre, turno) 
           VALUES (?, ?, ?, ?)`,
          [userId, userData.matricula, userData.semestre, userData.turno]
        );
      } else if (userData.tipo_usuario === 'maestro') {
        await connection.execute(
          `INSERT INTO maestros (usuario_id, cedula_profesional, especialidad, anos_experiencia) 
           VALUES (?, ?, ?, ?)`,
          [userId, userData.cedula_profesional, userData.especialidad, userData.anos_experiencia]
        );
      } else if (userData.tipo_usuario === 'paciente') {
        await connection.execute(
          `INSERT INTO pacientes (usuario_id, fecha_nacimiento, telefono, direccion, historial_medico) 
           VALUES (?, ?, ?, ?, ?)`,
          [
            userId, 
            userData.fecha_nacimiento, 
            userData.telefono, 
            userData.direccion,
            userData.historial_medico || null
          ]
        );
      }

      // Registrar en audit_logs
await connection.execute(
  `INSERT INTO audit_logs (usuario_id, accion, tabla_afectada, descripcion) 
   VALUES (?, ?, ?, ?)`,
  [userId, 'CREATE', 'usuarios', `Usuario ${userData.email} registrado`]
);

      await connection.commit();
      
      return { id: userId, ...userData, password: undefined };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  // Buscar usuario por email
  static async findByEmail(email) {
    const [rows] = await db.execute(
      `SELECT u.*, 
              p.matricula, p.semestre, p.turno,
              m.cedula_profesional, m.especialidad, m.anos_experiencia,
              pa.fecha_nacimiento, pa.telefono, pa.direccion, pa.historial_medico
       FROM usuarios u
       LEFT JOIN practicantes p ON u.id = p.usuario_id
       LEFT JOIN maestros m ON u.id = m.usuario_id
       LEFT JOIN pacientes pa ON u.id = pa.usuario_id
       WHERE u.email = ? AND u.estado = 'activo'`,
      [email]
    );

    if (rows.length === 0) return null;
    return new User(rows[0]);
  }

  // Buscar usuario por ID
static async findById(id) {
    try {
        const [users] = await db.execute(
            `SELECT 
                u.id, 
                u.nombre, 
                u.apellido, 
                u.email, 
                u.telefono,
                u.tipo_usuario, 
                u.estado,
                u.activo,
                u.password,
                u.refresh_token,
                u.last_login,
                u.login_attempts,
                u.locked_until,
                u.created_at,
                u.updated_at
             FROM usuarios u 
             WHERE u.id = ? AND u.activo = 1`,
            [id]
        );

        if (users.length === 0) {
            return null;
        }

        return new User(users[0]);
    } catch (error) {
        console.error('Error finding user by ID:', error);
        throw error;
    }
}

  // Verificar contraseña
  async verifyPassword(password) {
    return await bcrypt.compare(password, this.password);
  }

  // Actualizar último acceso
  static async updateLastLogin(userId) {
    await db.execute(
      `UPDATE usuarios SET last_login = CURRENT_TIMESTAMP WHERE id = ?`,
      [userId]
    );
  }

  // Verificar si email existe
  static async emailExists(email) {
    const [rows] = await db.execute(
      `SELECT COUNT(*) as count FROM usuarios WHERE email = ?`,
      [email]
    );
    return rows[0].count > 0;
  }

  // Actualizar refresh token
  static async updateRefreshToken(userId, refreshToken) {
    const hashedToken = refreshToken ? await bcrypt.hash(refreshToken, 10) : null;
    await db.execute(
      `UPDATE usuarios SET refresh_token = ? WHERE id = ?`,
      [hashedToken, userId]
    );
  }

  // Verificar refresh token
  static async verifyRefreshToken(userId, refreshToken) {
    const [rows] = await db.execute(
      `SELECT refresh_token FROM usuarios WHERE id = ?`,
      [userId]
    );

    if (!rows[0] || !rows[0].refresh_token) return false;
    return await bcrypt.compare(refreshToken, rows[0].refresh_token);
  }

  // Cambiar contraseña
  static async changePassword(userId, newPassword) {
    const hashedPassword = await bcrypt.hash(newPassword, parseInt(process.env.BCRYPT_ROUNDS));
    
    await db.execute(
      `UPDATE usuarios SET password = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [hashedPassword, userId]
    );

    // Registrar en audit_logs
    await db.execute(
      `INSERT INTO audit_logs (usuario_id, accion, tabla_afectada, registro_id, descripcion) 
       VALUES (?, ?, ?, ?, ?)`,
      [userId, 'UPDATE', 'usuarios', userId, 'Contraseña actualizada']
    );
  }

  // Obtener permisos del usuario
  async getPermissions() {
    const rolePermissions = {
      admin: ['all'],
      maestro: ['view_practicantes', 'evaluate_practicas', 'manage_citas', 'view_reports'],
      practicante: ['view_own_practicas', 'manage_own_citas', 'view_own_evaluations'],
      paciente: ['book_citas', 'view_own_citas', 'submit_evaluations']
    };

    return rolePermissions[this.tipo_usuario] || [];
  }

  // Método para serializar (no incluir password)
toJSON() {
    return {
        id: this.id,
        nombre: this.nombre,
        apellido: this.apellido,
        email: this.email,
        telefono: this.telefono || '',
        tipo_usuario: this.tipo_usuario,
        activo: this.activo !== undefined ? this.activo : true,
        created_at: this.created_at,
        last_login: this.last_login
        // No incluir password ni refresh_token
    };
}
}

module.exports = User;