// backend/middleware/authSimple.js
const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        
        if (!authHeader) {
            return res.status(401).json({
                success: false,
                message: 'Token no proporcionado'
            });
        }

        const token = authHeader.startsWith('Bearer ') 
            ? authHeader.slice(7) 
            : authHeader;

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Token no válido'
            });
        }

        // Verificar token con tu secret
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'practident_secret_key_2024');
        
        // Crear objeto user para req - ajustado a tu estructura
        req.user = {
            userId: decoded.userId || decoded.id,  // Compatibilidad con ambos
            id: decoded.userId || decoded.id,
            email: decoded.email,
            tipo_usuario: decoded.tipo_usuario || decoded.type,
            nombre: decoded.nombre,
            apellido: decoded.apellido
        };
        
        next();
    } catch (error) {
        console.error('Auth error:', error.message);
        
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                message: 'Token expirado',
                expired: true
            });
        }
        
        return res.status(401).json({
            success: false,
            message: 'Token inválido'
        });
    }
};