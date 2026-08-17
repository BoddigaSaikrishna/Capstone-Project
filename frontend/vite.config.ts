import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env from frontend directory (__dirname) and process.cwd()
  const envFrontend = loadEnv(mode, __dirname, '');
  const envRoot = loadEnv(mode, process.cwd(), '');
  const jenkinsTarget = envFrontend.VITE_JENKINS_URL || envRoot.VITE_JENKINS_URL || 'http://localhost:8080';

  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    optimizeDeps: {
      exclude: ['lucide-react'],
    },
    server: {
      proxy: {
        // All /jenkins-proxy/* requests are forwarded to Jenkins (local or ngrok)
        '/jenkins-proxy': {
          target: jenkinsTarget,
          changeOrigin: true,
          // Strip the /jenkins-proxy prefix before forwarding
          rewrite: (path) => path.replace(/^\/jenkins-proxy/, ''),
          // Bypass ngrok browser warning header
          headers: {
            'ngrok-skip-browser-warning': 'true',
          },
          secure: false,
        },
      },
    },
  };
});
