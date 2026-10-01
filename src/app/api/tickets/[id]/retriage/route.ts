import { NextRequest, NextResponse } from 'next/server';
import { mockDatabase } from '@/lib/mock-database';
import { shouldBypassSimulation, simulateDelay } from '@/lib/chaos-config';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const bypass = shouldBypassSimulation(request.headers, request.url);
  if (!bypass) {
    await simulateDelay(false);
  }

  // AI re-triage executed locally and safely on server
  const result = mockDatabase.retriageTicket(id);

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return NextResponse.json(result.ticket);
}
