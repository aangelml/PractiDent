// backend/controllers/usersController.js
const db = require('../config/database');
const bcrypt = require('bcryptjs');

// Listar todos los usuarios con filtros
exports.getAllUsers = async (req, res) => {
  try {
    const { 
      tipo_usuario, 
      estado, 
      search, 
      page = 1, 
      limit = 10 
    } = req.query;

    const offset = (page - 1) * limit;

    let query = `
      SELECT 
        u.id, u.nombre, u.apellido, u.email, u.telefono, u.tipo_usuario, 
        u.estado, u.activo, u.created_at, u.last_login,
        p.matricula, p.semestre, p.turno,
        m.cedula_profesional, m.especialidad, m.anos_experiencia,
        pa.fecha_nacimiento
      FROM usuarios u
      LEFT JOIN practicantes p ON u.id = p.usuario_id
      LEFT JOIN maestros m ON u.id = m.usuario_id
      LEFT JOIN pacientes pa ON u.id = pa.usuario_id
      WHERE 1=1
    `;

    const params = [];

    // Filtros
    if (tipo_usuario) {
      query += ' AND u.tipo_usuario = ?';
      params.push(tipo_usuario);
    }

    if (estado) {
      query += ' AND u.estado = ?';
      params.push(estado);
    }

    if (search) {
      query += ' AND (u.nombre LIKE ? OR u.apellido LIKE ? OR u.email LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    // Contar total
    const countQuery = query.replace(/SELECT.*FROM/, 'SELECT COUNT(*) as total FROM');
    const [countResult] = await db.execute(countQuery, params);
    const total = countResult[0].total;

    // Paginación
    query += ' ORDER BY u.created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const [users] = await db.execute(query, params);

    res.json({
      success: true,
      data: {
        users,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(total / limit)
        }
      }
    });

  } catch (error) {
    console.error('Error obteniendo usuarios:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener usuarios'
    });
  }
};

// Obtener usuario por ID
exports.getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    const [users] = await db.execute(
      `SELECT 
        u.id, u.nombre, u.apellido, u.email, u.telefono, u.tipo_usuario, 
        u.estado, u.activo, u.created_at, u.last_login,
        p.matricula, p.semestre, p.turno, p.promedio,
        m.cedula_profesional, m.especialidad, m.anos_experiencia,
        pa.fecha_nacimiento, pa.direccion, pa.tipo_sangre, pa.alergias
      FROM usuarios u
      LEFT JOIN practicantes p ON u.id = p.usuario_id
      LEFT JOIN maestros m ON u.id = m.usuario_id
      LEFT JOIN pacientes pa ON u.id = pa.usuario_id
      WHERE u.id = ?`,
      [id]
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    res.json({
      success: true,
      data: { user: users[0] }
    });

  } catch (error) {
    console.error('Error obteniendo usuario:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener usuario'
    });
  }
};

// Actualizar usuario
exports.updateUser = async (req, res) => {
  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();
    
    const { id } = req.params;
    const { 
      nombre, 
      apellido, 
      telefono, 
      estado,
      // Campos específicos
      semestre,
      turno,
      promedio,
      especialidad,
      anos_experiencia,
      fecha_nacimiento,
      direccion
    } = req.body;

    // Verificar que el usuario existe
    const [userCheck] = await connection.execute(
      'SELECT tipo_usuario FROM usuarios WHERE id = ?',
      [id]
    );

    if (userCheck.length === 0) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    const tipo_usuario = userCheck[0].tipo_usuario;

    // Actualizar tabla usuarios
    const fieldsToUpdate = [];
    const values = [];

    if (nombre !== undefined) {
      fieldsToUpdate.push('nombre = ?');
      values.push(nombre);
    }
    if (apellido !== undefined) {
      fieldsToUpdate.push('apellido = ?');
      values.push(apellido);
    }
    if (telefono !== undefined) {
      fieldsToUpdate.push('telefono = ?');
      values.push(telefono);
    }
    if (estado !== undefined) {
      fieldsToUpdate.push('estado = ?');
      values.push(estado);
    }

    if (fieldsToUpdate.length > 0) {
      values.push(id);
      await connection.execute(
        `UPDATE usuarios SET ${fieldsToUpdate.join(', ')} WHERE id = ?`,
        values
      );
    }

    // Actualizar tabla específica según tipo
    if (tipo_usuario === 'practicante') {
      const practFields = [];
      const practValues = [];

      if (semestre !== undefined) {
        practFields.push('semestre = ?');
        practValues.push(semestre);
      }
      if (turno !== undefined) {
        practFields.push('turno = ?');
        practValues.push(turno);
      }
      if (promedio !== undefined) {
        practFields.push('promedio = ?');
        practValues.push(promedio);
      }

      if (practFields.length > 0) {
        practValues.push(id);
        await connection.execute(
          `UPDATE practicantes SET ${practFields.join(', ')} WHERE usuario_id = ?`,
          practValues
        );
      }
    } else if (tipo_usuario === 'maestro') {
      const maestroFields = [];
      const maestroValues = [];

      if (especialidad !== undefined) {
        maestroFields.push('especialidad = ?');
        maestroValues.push(especialidad);
      }
      if (anos_experiencia !== undefined) {
        maestroFields.push('anos_experiencia = ?');
        maestroValues.push(anos_experiencia);
      }

      if (maestroFields.length > 0) {
        maestroValues.push(id);
        await connection.execute(
          `UPDATE maestros SET ${maestroFields.join(', ')} WHERE usuario_id = ?`,
          maestroValues
        );
      }
    } else if (tipo_usuario === 'paciente') {
      const pacienteFields = [];
      const pacienteValues = [];

      if (fecha_nacimiento !== undefined) {
        pacienteFields.push('fecha_nacimiento = ?');
        pacienteValues.push(fecha_nacimiento);
      }
      if (direccion !== undefined) {
        pacienteFields.push('direccion = ?');
        pacienteValues.push(direccion);
      }

      if (pacienteFields.length > 0) {
        pacienteValues.push(id);
        await connection.execute(
          `UPDATE pacientes SET ${pacienteFields.join(', ')} WHERE usuario_id = ?`,
          pacienteValues
        );
      }
    }

    // Registrar auditoría
    await connection.execute(
      `INSERT INTO audit_logs (usuario_id, accion, tabla_afectada, registro_id, descripcion) 
       VALUES (?, 'UPDATE', 'usuarios', ?, ?)`,
      [req.user.userId, id, `Usuario ${id} actualizado por admin`]
    );

    await connection.commit();

    res.json({
      success: true,
      message: 'Usuario actualizado exitosamente'
    });

  } catch (error) {
    await connection.rollback();
    console.error('Error actualizando usuario:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar usuario'
    });
  } finally {
    connection.release();
  }
};

// Activar/Desactivar usuario
exports.toggleUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { activo } = req.body;

    if (activo === undefined) {
      return res.status(400).json({
        success: false,
        message: 'El campo activo es requerido'
      });
    }

    await db.execute(
      'UPDATE usuarios SET activo = ? WHERE id = ?',
      [activo ? 1 : 0, id]
    );

    // Registrar auditoría
    await db.execute(
      `INSERT INTO audit_logs (usuario_id, accion, tabla_afectada, registro_id, descripcion) 
       VALUES (?, ?, 'usuarios', ?, ?)`,
      [req.user.userId, activo ? 'ACTIVATE' : 'DEACTIVATE', id, 
       `Usuario ${id} ${activo ? 'activado' : 'desactivado'}`]
    );

    res.json({
      success: true,
      message: `Usuario ${activo ? 'activado' : 'desactivado'} exitosamente`
    });

  } catch (error) {
    console.error('Error cambiando estado de usuario:', error);
    res.status(500).json({
      success: false,
      message: 'Error al cambiar estado del usuario'
    });
  }
};

// Eliminar usuario (soft delete)
exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar que no sea el usuario actual
    if (parseInt(id) === req.user.userId) {
      return res.status(400).json({
        success: false,
        message: 'No puedes eliminar tu propio usuario'
      });
    }

    // Cambiar estado a inactivo y desactivar
    await db.execute(
      'UPDATE usuarios SET estado = "inactivo", activo = 0 WHERE id = ?',
      [id]
    );

    // Registrar auditoría
    await db.execute(
      `INSERT INTO audit_logs (usuario_id, accion, tabla_afectada, registro_id, descripcion) 
       VALUES (?, 'DELETE', 'usuarios', ?, ?)`,
      [req.user.userId, id, `Usuario ${id} eliminado (soft delete)`]
    );

    res.json({
      success: true,
      message: 'Usuario eliminado exitosamente'
    });

  } catch (error) {
    console.error('Error eliminando usuario:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar usuario'
    });
  }
};

// Obtener estadísticas de usuarios
exports.getUserStats = async (req, res) => {
  try {
    const [stats] = await db.execute(`
      SELECT 
        COUNT(*) as total_usuarios,
        SUM(CASE WHEN tipo_usuario = 'practicante' THEN 1 ELSE 0 END) as total_practicantes,
        SUM(CASE WHEN tipo_usuario = 'maestro' THEN 1 ELSE 0 END) as total_maestros,
        SUM(CASE WHEN tipo_usuario = 'paciente' THEN 1 ELSE 0 END) as total_pacientes,
        SUM(CASE WHEN tipo_usuario = 'admin' THEN 1 ELSE 0 END) as total_admins,
        SUM(CASE WHEN estado = 'activo' THEN 1 ELSE 0 END) as usuarios_activos,
        SUM(CASE WHEN activo = 1 THEN 1 ELSE 0 END) as usuarios_habilitados,
        SUM(CASE WHEN last_login >= DATE_SUB(NOW(), INTERVAL 7 DAY) THEN 1 ELSE 0 END) as usuarios_activos_semana
      FROM usuarios
    `);

    res.json({
      success: true,
      data: stats[0]
    });

  } catch (error) {
    console.error('Error obteniendo estadísticas:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener estadísticas'
    });
  }
};

// Resetear contraseña (admin)
exports.resetUserPassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;

    if (!newPassword) {
      return res.status(400).json({
        success: false,
        message: 'La nueva contraseña es requerida'
      });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);

    await db.execute(
      'UPDATE usuarios SET password = ? WHERE id = ?',
      [hashedPassword, id]
    );

    // Registrar auditoría
    await db.execute(
      `INSERT INTO audit_logs (usuario_id, accion, tabla_afectada, registro_id, descripcion) 
       VALUES (?, 'PASSWORD_RESET', 'usuarios', ?, ?)`,
      [req.user.userId, id, `Contraseña reseteada por admin para usuario ${id}`]
    );

    res.json({
      success: true,
      message: 'Contraseña reseteada exitosamente'
    });

  } catch (error) {
    console.error('Error reseteando contraseña:', error);
    res.status(500).json({
      success: false,
      message: 'Error al resetear contraseña'
    });
  }
};