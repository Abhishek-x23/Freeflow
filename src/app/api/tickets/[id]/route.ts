import { NextRequest, NextResponse } from 'next/server';
import { mockDatabase } from '@/lib/mock-database';
import { shouldBypassSimulation, simulateDelay, shouldSimulateRandomError } from '@/lib/chaos-config';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const bypass = shouldBypassSimulation(request.headers, request.url);
  if (!bypass) {
    await simulateDelay(false);
    if (shouldSimulateRandomError(false)) {
      return NextResponse.json(
        { error: 'Simulated 500 Internal Server Error' },
        { status: 500 }
      );
    }
  }

  const ticket = mockDatabase.getTicketById(id);
  if (!ticket) {
    return NextResponse.json({ error: `Ticket '${id}' not found` }, { status: 404 });
  }

  return NextResponse.json(ticket);
}
