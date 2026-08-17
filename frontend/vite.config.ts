import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file so we can read VITE_JENKINS_URL at config time
  const env = loadEnv(mode, process.cwd(), '');
  const jenkinsTarget = env.VITE_JENKINS_URL || '';

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
      proxy: jenkinsTarget
        ? {
            // All /jenkins-proxy/* requests are forwarded to the Jenkins server
            '/jenkins-proxy': {
              target: jenkinsTarget,
              changeOrigin: true,
              // Strip the /jenkins-proxy prefix before forwarding
              rewrite: (path) => path.replace(/^\/jenkins-proxy/, ''),
              // Bypass ngrok browser warning page
              headers: {
                'ngrok-skip-browser-warning': 'true',
              },
              // Don't verify SSL for ngrok tunnels
              secure: false,
            },
          }
        : {},
    },
  };
});
