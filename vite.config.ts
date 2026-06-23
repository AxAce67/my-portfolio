import { defineConfig, loadEnv, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// Mirrors api/server-status.ts and api/github/momentum.ts locally so
// `npm run dev` can exercise the real endpoints without needing
// `vercel dev`. Uses server.ssrLoadModule so the TS source compiles
// through Vite's own pipeline instead of relying on Node to understand
// TypeScript directly.
function localApiDevMiddleware(): Plugin {
  return {
    name: 'local-api-dev-middleware',
    configureServer(server) {
      server.middlewares.use('/api/server-status', async (req, res) => {
        res.setHeader('Content-Type', 'application/json');
        try {
          const mod = await server.ssrLoadModule('/api/server-status.ts');
          const result = await mod.getTailscaleDeviceStatus();
          res.statusCode = 'error' in result ? 502 : 200;
          res.end(JSON.stringify(result));
        } catch (err) {
          res.statusCode = 500;
          res.end(JSON.stringify({ error: err instanceof Error ? err.message : 'Internal error' }));
        }
      });

      server.middlewares.use('/api/github/momentum', async (req, res) => {
        res.setHeader('Content-Type', 'application/json');
        try {
          const mod = await server.ssrLoadModule('/api/github/momentum.ts');
          const result = await mod.getGithubMomentum();
          res.statusCode = result.ok ? 200 : 502;
          res.end(JSON.stringify(result.data));
        } catch (err) {
          res.statusCode = 500;
          res.end(JSON.stringify({ error: err instanceof Error ? err.message : 'Internal error' }));
        }
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  const envDefines = Object.keys(env)
    .filter((key) => key.startsWith('NEXT_PUBLIC_') || key === 'NODE_ENV')
    .reduce((acc, key) => {
      acc[`process.env.${key}`] = JSON.stringify(env[key]);
      return acc;
    }, {} as Record<string, string>);

  // loadEnv doesn't mutate process.env — do it ourselves so the local API
  // dev middleware (api/_lib/*) can read these via process.env like it
  // does on Vercel.
  for (const [key, value] of Object.entries(env)) {
    if (key.startsWith('TAILSCALE_') || key.startsWith('GITHUB_')) {
      process.env[key] = value;
    }
  }

  return {
    plugins: [react(), localApiDevMiddleware()],
    define: envDefines,
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
  };
});
