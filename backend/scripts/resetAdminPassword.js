require('dotenv').config();
const bcrypt = require('bcryptjs');
const db = require('../config/database');

const resetPassword = async () => {
    try {
        console.log('🔄 Reseteando contraseña del admin...');
        
        const hashedPassword = await bcrypt.hash('Admin123!', 10);

        const [result] = await db.execute(
            'UPDATE usuarios SET password = ? WHERE email = ?',
            [hashedPassword, 'admin@practident.com']
        );

        if (result.affectedRows === 0) {
            console.log('❌ Usuario admin no encontrado');
        } else {
            console.log('✅ Contraseña restablecida exitosamente');
            console.log('📧 Email: admin@practident.com');
            console.log('🔑 Password: Admin123!');
        }
        
        await db.end();
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        await db.end();
        process.exit(1);
    }
};

resetPassword();