import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react()],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.AWS_S3_ACCESSKEYID': JSON.stringify(env.AWS_S3_ACCESSKEYID),
        'process.env.AWS_S3_SECRETACCESSKEY': JSON.stringify(env.AWS_S3_SECRETACCESSKEY),
        'process.env.AWS_S3_REGION': JSON.stringify(env.AWS_S3_REGION),
        'process.env.AWS_S3_IMAGE_ROOT': JSON.stringify(env.AWS_S3_IMAGE_ROOT),
        'process.env.AWS_BASE_URL': JSON.stringify(env.AWS_BASE_URL),
        'process.env.AWS_S3_IMAGE_WHERE2USE': JSON.stringify(env.AWS_S3_IMAGE_WHERE2USE)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
