import { NextRequest, NextResponse } from 'next/server';
import { mockDatabase } from '@/lib/mock-database';
import { shouldBypassSimulation, simulateDelay, shouldSimulateClaimConflict } from '@/lib/chaos-config';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const bypass = shouldBypassSimulation(request.headers, request.url);
  if (!bypass) {
    await simulateDelay(false);
  }

  const simulateConflict = !bypass && shouldSimulateClaimConflict(false);
  const body = await request.json().catch(() => ({}));
  const result = mockDatabase.claimTicket(id, body.agent_id, simulateConflict);

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return NextResponse.json(result.ticket);
}
