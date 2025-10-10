// backend/test-db.js
require('dotenv').config();
const db = require('./config/database');

async function testDatabase() {
    try {
        console.log('1. Probando conexión...');
        const [result] = await db.execute('SELECT 1');
        console.log('✅ Conexión OK');
        
        console.log('\n2. Verificando tablas...');
        const [tables] = await db.execute('SHOW TABLES');
        console.log('Tablas encontradas:', tables.map(t => Object.values(t)[0]));
        
        console.log('\n3. Verificando estructura de usuarios...');
        const [columns] = await db.execute('DESCRIBE usuarios');
        console.log('Columnas en usuarios:', columns.map(c => c.Field).join(', '));
        
        console.log('\n4. Verificando estructura de audit_logs...');
        const [auditColumns] = await db.execute('DESCRIBE audit_logs');
        console.log('Columnas en audit_logs:', auditColumns.map(c => c.Field).join(', '));
        
        console.log('\n5. Insertando usuario de prueba...');
        const [insertResult] = await db.execute(
            `INSERT INTO usuarios (nombre, apellido, email, password, tipo_usuario) 
             VALUES (?, ?, ?, ?, ?)`,
            ['Test', 'User', 'test' + Date.now() + '@test.com', 'hashedpass', 'practicante']
        );
        console.log('✅ Usuario insertado, ID:', insertResult.insertId);
        
        console.log('\n✅ TODO FUNCIONA CORRECTAMENTE');
        
    } catch (error) {
        console.error('\n❌ ERROR:', error.message);
        console.error('Código de error:', error.code);
        console.error('SQL State:', error.sqlState);
    } finally {
        await db.end();
    }
}

testDatabase();