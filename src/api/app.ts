import express, { Request, Response, NextFunction } from 'express';
import { mockDatabase } from '../lib/mock-database';
import {
  shouldBypassSimulation,
  simulateDelay,
  shouldSimulateRandomError,
  shouldSimulateClaimConflict,
  setSimulationGloballyEnabled,
  isSimulationGloballyEnabled,
} from '../lib/chaos-config';

export const app = express();

app.use(express.json());

// Create API router
const router = express.Router();

// Chaos simulation middleware
router.use(async (req: Request, res: Response, next: NextFunction) => {
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

// Simulation endpoints
router.get('/simulation', (_req: Request, res: Response) => {
  res.json({ enabled: isSimulationGloballyEnabled() });
});

router.post('/simulation/toggle', (req: Request, res: Response) => {
  const { enabled } = req.body;
  if (typeof enabled === 'boolean') {
    setSimulationGloballyEnabled(enabled);
  }
  res.json({ enabled: isSimulationGloballyEnabled() });
});

// 1. GET /tickets
router.get('/tickets', (req: Request, res: Response) => {
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
    console.error('Error in GET /tickets:', err);
    res.status(500).json({ error: 'Failed to retrieve tickets' });
  }
});

// 2. GET /tickets/updates
router.get('/tickets/updates', (req: Request, res: Response) => {
  try {
    const since = (req.query.since as string) || null;
    const result = mockDatabase.getUpdates(since);
    res.json(result);
  } catch (err: unknown) {
    console.error('Error in GET /tickets/updates:', err);
    res.status(500).json({ error: 'Failed to retrieve ticket updates' });
  }
});

// 3. GET /tickets/:id
router.get('/tickets/:id', (req: Request, res: Response) => {
  try {
    const ticket = mockDatabase.getTicketById(req.params.id);
    if (!ticket) {
      return res.status(404).json({ error: `Ticket '${req.params.id}' not found` });
    }
    res.json(ticket);
  } catch (err: unknown) {
    console.error('Error in GET /tickets/:id:', err);
    res.status(500).json({ error: 'Failed to retrieve ticket' });
  }
});

// 4. POST /tickets/:id/claim
router.post('/tickets/:id/claim', (req: Request, res: Response) => {
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
    console.error('Error in POST /tickets/:id/claim:', err);
    res.status(500).json({ error: 'Failed to claim ticket' });
  }
});

// 5. PATCH /tickets/:id/status
router.patch('/tickets/:id/status', (req: Request, res: Response) => {
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
    console.error('Error in PATCH /tickets/:id/status:', err);
    res.status(500).json({ error: 'Failed to update ticket status' });
  }
});

// 6. PATCH /tickets/:id/triage
router.patch('/tickets/:id/triage', (req: Request, res: Response) => {
  try {
    const { category, priority, reason } = req.body;
    const result = mockDatabase.triageTicket(req.params.id, category, priority, reason);
    if (!result.success) {
      return res.status(result.status).json({ error: result.error });
    }

    res.status(200).json(result.ticket);
  } catch (err: unknown) {
    console.error('Error in PATCH /tickets/:id/triage:', err);
    res.status(500).json({ error: 'Failed to triage ticket' });
  }
});

// 7. POST /tickets/:id/retriage
router.post('/tickets/:id/retriage', (req: Request, res: Response) => {
  try {
    const result = mockDatabase.retriageTicket(req.params.id);
    if (!result.success) {
      return res.status(result.status).json({ error: result.error });
    }

    res.status(200).json(result.ticket);
  } catch (err: unknown) {
    console.error('Error in POST /tickets/:id/retriage:', err);
    res.status(500).json({ error: 'Failed to re-triage ticket' });
  }
});

// Mount on BOTH '/api' and '/'
// This guarantees that regardless of how Vercel or Express handles the path prefix,
// every request to /api/tickets or /tickets matches seamlessly!
app.use('/api', router);
app.use('/', router);

export default app;
