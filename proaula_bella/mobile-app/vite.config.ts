import { defineConfig, loadEnv } from 'vite';
import vue from '@vitejs/plugin-vue';

// En el computador (npm run dev), "/api" se redirige al backend:
// por defecto el publicado en Render; con API_PROXY_TARGET=http://localhost:3000 usa el local.
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const backend = env.API_PROXY_TARGET || 'https://bellastyle.onrender.com';
  return {
    plugins: [vue()],
    server: {
      port: 5174,
      proxy: { '/api': { target: backend, changeOrigin: true, secure: true } },
    },
  };
});
