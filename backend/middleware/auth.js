// backend/middleware/auth.js
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Middleware de autenticación
exports.authenticate = async (req, res, next) => {
  try {
    // Obtener token del header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Token no proporcionado'
      });
    }

    const token = authHeader.substring(7);

    // Verificar token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          message: 'Token expirado',
          code: 'TOKEN_EXPIRED'
        });
      }
      return res.status(401).json({
        success: false,
        message: 'Token inválido'
      });
    }

    // Verificar tipo de token
    if (decoded.type !== 'access') {
      return res.status(401).json({
        success: false,
        message: 'Tipo de token inválido'
      });
    }

    // Obtener usuario
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    // Agregar usuario a request
    req.user = {
      userId: user.id,
      email: user.email,
      tipo_usuario: user.tipo_usuario,
      nombre: user.nombre,
      apellido: user.apellido
    };

    next();

  } catch (error) {
    console.error('Error en autenticación:', error);
    res.status(500).json({
      success: false,
      message: 'Error en autenticación',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Middleware de autorización por roles
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'No autenticado'
      });
    }

    if (!roles.includes(req.user.tipo_usuario)) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para acceder a este recurso'
      });
    }

    next();
  };
};

// Middleware para verificar permisos específicos
exports.checkPermission = (permission) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'No autenticado'
        });
      }

      const user = await User.findById(req.user.userId);
      const permissions = await user.getPermissions();

      if (!permissions.includes(permission) && !permissions.includes('all')) {
        return res.status(403).json({
          success: false,
          message: 'No tienes el permiso necesario para esta acción'
        });
      }

      next();

    } catch (error) {
      console.error('Error verificando permisos:', error);
      res.status(500).json({
        success: false,
        message: 'Error verificando permisos'
      });
    }
  };
};

// Middleware opcional de autenticación (no falla si no hay token)
exports.optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.substring(7);

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      if (decoded.type === 'access') {
        const user = await User.findById(decoded.userId);
        if (user) {
          req.user = {
            userId: user.id,
            email: user.email,
            tipo_usuario: user.tipo_usuario,
            nombre: user.nombre,
            apellido: user.apellido
          };
        }
      }
    } catch (error) {
      // Token inválido, continuar sin autenticación
    }

    next();

  } catch (error) {
    next();
  }
};
