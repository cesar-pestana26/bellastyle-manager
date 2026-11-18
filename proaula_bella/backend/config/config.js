// Configuración general del sistema.
// Cada valor se lee primero de una VARIABLE DE ENTORNO (process.env).
// Así, en la nube (Render) o en Docker se configuran sin tocar el código.
// Si la variable no existe, se usa el valor por defecto (el de tu PC).
//
// En tu PC puedes guardar las variables en el archivo backend/.env
// (una por línea: NOMBRE=valor) para no escribir "set ..." cada vez.
// Ese archivo NO se sube a GitHub (.gitignore) porque guarda claves.

const fs = require('fs');
const path = require('path');

const archivoEnv = path.join(__dirname, '..', '.env');
if (fs.existsSync(archivoEnv)) {
    for (const linea of fs.readFileSync(archivoEnv, 'utf8').split(/\r?\n/)) {
        const coincide = linea.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/);
        // Las variables del sistema (las de Render o "set") tienen prioridad
        if (coincide && !(coincide[1] in process.env)) process.env[coincide[1]] = coincide[2];
    }
}

module.exports = {
    // Render y Docker indican el puerto en la variable PORT
    puerto: Number(process.env.PORT) || 3000,

    db: {
        host: process.env.DB_HOST || '127.0.0.1',
        port: Number(process.env.DB_PORT) || 3306,
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '1234',
        database: process.env.DB_NAME || 'bellastylemanager',
        // Las bases de datos en la nube exigen conexión cifrada (SSL).
        // En tu PC no se usa: DB_SSL no existe.
        ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : undefined
    },

    // Código que se pide para registrar una cuenta de administradora.
    // Solo lo conoce la dueña del salón.
    codigoAdmin: process.env.CODIGO_ADMIN || 'BELLA2026',

    // Asistente con inteligencia artificial del chat (Gemini API de Google).
    // Sin clave, el chat usa el asistente de palabras clave.
    ia: {
        clave: process.env.GEMINI_API_KEY || '',
        modelo: process.env.GEMINI_MODELO || 'gemma-4-26b-a4b-it'
    }
};
