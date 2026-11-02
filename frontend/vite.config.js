/**
 * Configuración de Vite para desarrollo y compilación.
 * El proxy evita necesitar CORS: el navegador habla siempre con su mismo origen.
 * changeOrigin:false conserva Host para la comprobación de origen en Express.
 */
import { defineConfig } from "vite";
export default defineConfig({
  server: {
    port: 5173,
    strictPort: true,
    proxy: { "/api": { target: "http://127.0.0.1:3001", changeOrigin: false } },
  },
  esbuild: { jsx: "automatic" },
});
