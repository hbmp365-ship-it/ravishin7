import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      /** true = 0.0.0.0 바인딩 → 같은 네트워크 PC에서 http://<이 Mac의 LAN IP>:포트 로 접속 가능 */
      server: {
        port: 3000,
        host: true,
        strictPort: false,
        /** localhost → n8n CORS 회피 (AI 프로필 시트 기록) */
        proxy: {
          '/api/ai-profile-n8n': {
            target: 'https://teeshot.app.n8n.cloud',
            changeOrigin: true,
            rewrite: (requestPath) => requestPath.replace(/^\/api\/ai-profile-n8n/, ''),
          },
        },
      },
      preview: {
        port: 4173,
        host: true,
        strictPort: false,
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
        'process.env.AWS_S3_IMAGE_WHERE2USE': JSON.stringify(env.AWS_S3_IMAGE_WHERE2USE),
        'process.env.VITE_AI_PROFILE_N8N_WEBHOOK_URL': JSON.stringify(env.VITE_AI_PROFILE_N8N_WEBHOOK_URL ?? ''),
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
