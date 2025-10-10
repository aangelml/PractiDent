// backend/middleware/roleAuth.js
// Middleware para verificar roles específicos

// Verificar si el usuario tiene uno de los roles permitidos
const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'No autenticado'
      });
    }

    const userRole = req.user.tipo_usuario;

    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para acceder a este recurso',
        requiredRoles: allowedRoles,
        yourRole: userRole
      });
    }

    next();
  };
};

// Verificar que sea admin
const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'No autenticado'
    });
  }

  if (req.user.tipo_usuario !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Acceso denegado. Solo administradores.'
    });
  }

  next();
};

// Verificar que sea maestro
const requireMaestro = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'No autenticado'
    });
  }

  if (req.user.tipo_usuario !== 'maestro') {
    return res.status(403).json({
      success: false,
      message: 'Acceso denegado. Solo maestros.'
    });
  }

  next();
};

// Verificar que sea practicante
const requirePracticante = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'No autenticado'
    });
  }

  if (req.user.tipo_usuario !== 'practicante') {
    return res.status(403).json({
      success: false,
      message: 'Acceso denegado. Solo practicantes.'
    });
  }

  next();
};

// Verificar que sea paciente
const requirePaciente = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'No autenticado'
    });
  }

  if (req.user.tipo_usuario !== 'paciente') {
    return res.status(403).json({
      success: false,
      message: 'Acceso denegado. Solo pacientes.'
    });
  }

  next();
};

// Verificar que el usuario acceda solo a sus propios recursos
const requireOwnerOrAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'No autenticado'
    });
  }

  const resourceUserId = parseInt(req.params.id || req.params.userId);
  const currentUserId = req.user.userId;
  const isAdmin = req.user.tipo_usuario === 'admin';

  if (!isAdmin && resourceUserId !== currentUserId) {
    return res.status(403).json({
      success: false,
      message: 'No tienes permiso para acceder a este recurso'
    });
  }

  next();
};

module.exports = {
  authorize,
  requireAdmin,
  requireMaestro,
  requirePracticante,
  requirePaciente,
  requireOwnerOrAdmin
};