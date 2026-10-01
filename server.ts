import express, { Request, Response, NextFunction } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import { mockDatabase } from './src/lib/mock-database';
import {
  shouldBypassSimulation,
  simulateDelay,
  shouldSimulateRandomError,
  shouldSimulateClaimConflict,
  setSimulationGloballyEnabled,
  isSimulationGloballyEnabled,
} from './src/lib/chaos-config';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = parseInt(process.env.PORT || '3000', 10);
  const isDev = process.env.NODE_ENV !== 'production';

  app.use(express.json());

  // Chaos simulation middleware for all /api routes except health & simulation config
  app.use('/api', async (req: Request, res: Response, next: NextFunction) => {
    if (req.path.startsWith('/simulation')) {
      return next();
    }

    const bypass = shouldBypassSimulation(req.headers, req.originalUrl);

    // 1. Simulate 300-1500ms network latency
    if (!bypass) {
      await simulateDelay(false);
    }

    // 2. Simulate 10% random server error
    if (!bypass && shouldSimulateRandomError(false)) {
      return res.status(500).json({
        error: 'Simulated 500 Internal Server Error (random network/server fault)',
        code: 'SIMULATED_CHAOS_ERROR',
      });
    }

    next();
  });

  // Simulation status & toggle endpoint
  app.get('/api/simulation', (_req: Request, res: Response) => {
    res.json({ enabled: isSimulationGloballyEnabled() });
  });

  app.post('/api/simulation/toggle', (req: Request, res: Response) => {
    const { enabled } = req.body;
    if (typeof enabled === 'boolean') {
      setSimulationGloballyEnabled(enabled);
    }
    res.json({ enabled: isSimulationGloballyEnabled() });
  });

  // 1. GET /api/tickets
  app.get('/api/tickets', (req: Request, res: Response) => {
    try {
      const page = parseInt(req.query.page as string, 10) || 1;
      const limit = parseInt(req.query.limit as string, 10) || 25;
      const filters = {
        status: (req.query.status as string) || undefined,
        priority: (req.query.priority as string) || undefined,
        category: (req.query.category as string) || undefined,
        ai_decision: (req.query.ai_decision as string) || undefined,
        search: (req.query.q as string) || undefined,
      };

      const result = mockDatabase.getTickets(filters, page, limit);
      res.json(result);
    } catch (err: unknown) {
      console.error('Error in GET /api/tickets:', err);
      res.status(500).json({ error: 'Failed to retrieve tickets' });
    }
  });

  // 2. GET /api/tickets/updates
  app.get('/api/tickets/updates', (req: Request, res: Response) => {
    try {
      const since = (req.query.since as string) || null;
      const result = mockDatabase.getUpdates(since);
      res.json(result);
    } catch (err: unknown) {
      console.error('Error in GET /api/tickets/updates:', err);
      res.status(500).json({ error: 'Failed to retrieve ticket updates' });
    }
  });

  // 3. GET /api/tickets/:id
  app.get('/api/tickets/:id', (req: Request, res: Response) => {
    try {
      const ticket = mockDatabase.getTicketById(req.params.id);
      if (!ticket) {
        return res.status(404).json({ error: `Ticket '${req.params.id}' not found` });
      }
      res.json(ticket);
    } catch (err: unknown) {
      console.error('Error in GET /api/tickets/:id:', err);
      res.status(500).json({ error: 'Failed to retrieve ticket' });
    }
  });

  // 4. POST /api/tickets/:id/claim
  app.post('/api/tickets/:id/claim', (req: Request, res: Response) => {
    try {
      const { agent_id } = req.body;
      const bypass = shouldBypassSimulation(req.headers, req.originalUrl);
      const simulateConflict = !bypass && shouldSimulateClaimConflict(false);

      const result = mockDatabase.claimTicket(req.params.id, agent_id, simulateConflict);
      if (!result.success) {
        return res.status(result.status).json({ error: result.error });
      }

      res.status(200).json(result.ticket);
    } catch (err: unknown) {
      console.error('Error in POST /api/tickets/:id/claim:', err);
      res.status(500).json({ error: 'Failed to claim ticket' });
    }
  });

  // 5. PATCH /api/tickets/:id/status
  app.patch('/api/tickets/:id/status', (req: Request, res: Response) => {
    try {
      const { status } = req.body;
      if (!status) {
        return res.status(400).json({ error: "Missing required 'status' field in request body" });
      }

      const result = mockDatabase.updateStatus(req.params.id, status);
      if (!result.success) {
        return res.status(result.status).json({ error: result.error });
      }

      res.status(200).json(result.ticket);
    } catch (err: unknown) {
      console.error('Error in PATCH /api/tickets/:id/status:', err);
      res.status(500).json({ error: 'Failed to update ticket status' });
    }
  });

  // 6. PATCH /api/tickets/:id/triage
  app.patch('/api/tickets/:id/triage', (req: Request, res: Response) => {
    try {
      const { category, priority, reason } = req.body;
      const result = mockDatabase.triageTicket(req.params.id, category, priority, reason);
      if (!result.success) {
        return res.status(result.status).json({ error: result.error });
      }

      res.status(200).json(result.ticket);
    } catch (err: unknown) {
      console.error('Error in PATCH /api/tickets/:id/triage:', err);
      res.status(500).json({ error: 'Failed to triage ticket' });
    }
  });

  // 7. POST /api/tickets/:id/retriage
  app.post('/api/tickets/:id/retriage', (req: Request, res: Response) => {
    try {
      // Re-triage performed locally and securely on server
      const result = mockDatabase.retriageTicket(req.params.id);
      if (!result.success) {
        return res.status(result.status).json({ error: result.error });
      }

      res.status(200).json(result.ticket);
    } catch (err: unknown) {
      console.error('Error in POST /api/tickets/:id/retriage:', err);
      res.status(500).json({ error: 'Failed to re-triage ticket' });
    }
  });

  // Setup periodic simulated background activity (every 7 seconds)
  setInterval(() => {
    if (isSimulationGloballyEnabled() && process.env.NODE_ENV !== 'test') {
      mockDatabase.triggerSimulatedBackgroundActivity();
    }
  }, 7000);

  // Serve Frontend
  if (isDev) {
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

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
