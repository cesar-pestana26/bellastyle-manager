// Configuración general del sistema.
// Si tu MySQL tiene otra contraseña, cámbiala aquí.

module.exports = {
    puerto: 3000,

    db: {
        host: '127.0.0.1',
        port: 3306,
        user: 'root',
        password: '1234',
        database: 'bellastylemanager'
    },

    // Código que se pide para registrar una cuenta de administradora.
    // Solo lo conoce la dueña del salón.
    codigoAdmin: 'BELLA2026'
};
