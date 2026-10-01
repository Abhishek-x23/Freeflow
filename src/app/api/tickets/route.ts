import { NextRequest, NextResponse } from 'next/server';
import { mockDatabase } from '@/lib/mock-database';
import { shouldBypassSimulation, simulateDelay, shouldSimulateRandomError } from '@/lib/chaos-config';

export async function GET(request: NextRequest) {
  const bypass = shouldBypassSimulation(request.headers, request.url);
  if (!bypass) {
    await simulateDelay(false);
    if (shouldSimulateRandomError(false)) {
      return NextResponse.json(
        { error: 'Simulated 500 Internal Server Error (random network/server fault)' },
        { status: 500 }
      );
    }
  }

  const searchParams = request.nextUrl.searchParams;
  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = parseInt(searchParams.get('limit') || '25', 10);
  const filters = {
    status: searchParams.get('status') || undefined,
    priority: searchParams.get('priority') || undefined,
    category: searchParams.get('category') || undefined,
    ai_decision: searchParams.get('ai_decision') || undefined,
    search: searchParams.get('q') || undefined,
  };

  const result = mockDatabase.getTickets(filters, page, limit);
  return NextResponse.json(result);
}
