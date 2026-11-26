const fs = require('fs');
const path = require('path');

const archivoEnv = path.join(__dirname, '..', '.env');
if (fs.existsSync(archivoEnv)) {
    for (const linea of fs.readFileSync(archivoEnv, 'utf8').split(/\r?\n/)) {
        const coincide = linea.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/);

        if (coincide && !(coincide[1] in process.env)) process.env[coincide[1]] = coincide[2];
    }
}

module.exports = {
    puerto: Number(process.env.PORT) || 3000,

    db: {
        host: process.env.DB_HOST || '127.0.0.1',
        port: Number(process.env.DB_PORT) || 3306,
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '1234',
        database: process.env.DB_NAME || 'bellastylemanager',

        ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : undefined
    },

    codigoAdmin: process.env.CODIGO_ADMIN || 'BELLA2026',

    jwt: {
        secreto: process.env.JWT_SECRETO || require('crypto').createHash('sha256')
            .update('bellastyle|' + (process.env.DB_PASSWORD || '1234') + '|' + (process.env.DB_HOST || '')).digest('hex'),
        duracion: '8h'
    },

    ia: {
        clave: process.env.GEMINI_API_KEY || '',

        modelo: process.env.GEMINI_MODELO || 'gemini-flash-lite-latest'
    },

    cloudinary: {
        nombre: process.env.CLOUDINARY_CLOUD_NAME || '',
        clave: process.env.CLOUDINARY_API_KEY || '',
        secreto: process.env.CLOUDINARY_API_SECRET || ''
    },

    salon: {
        direccion: process.env.SALON_DIRECCION || '',
        telefono: process.env.SALON_TELEFONO || '',
        instagram: process.env.SALON_INSTAGRAM || ''
    }
};
