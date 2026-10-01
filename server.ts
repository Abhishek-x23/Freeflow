import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { app } from './src/api/app';
import { mockDatabase } from './src/lib/mock-database';
import { isSimulationGloballyEnabled } from './src/lib/chaos-config';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export { app };

export async function startServer() {
  const PORT = parseInt(process.env.PORT || '3000', 10);
  const isDev = process.env.NODE_ENV !== 'production';

  // Setup periodic simulated background activity (every 7 seconds)
  setInterval(() => {
    if (isSimulationGloballyEnabled() && process.env.NODE_ENV !== 'test') {
      mockDatabase.triggerSimulatedBackgroundActivity();
    }
  }, 7000);

  // Serve Frontend
  if (isDev) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Production static serving
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Apex Support Server] Listening on http://0.0.0.0:${PORT}`);
  });
}

// Auto-listen when run directly (dev or production Node process)
if (!process.env.VERCEL) {
  startServer().catch((err) => {
    console.error('Failed to start server:', err);
    process.exit(1);
  });
}

export default app;
