import { NextRequest, NextResponse } from 'next/server';
import { mockDatabase } from '@/lib/mock-database';
import { shouldBypassSimulation, simulateDelay } from '@/lib/chaos-config';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const bypass = shouldBypassSimulation(request.headers, request.url);
  if (!bypass) {
    await simulateDelay(false);
  }

  const body = await request.json().catch(() => ({}));
  if (!body.status) {
    return NextResponse.json({ error: "Missing required 'status' field" }, { status: 400 });
  }

  const result = mockDatabase.updateStatus(id, body.status);
  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return NextResponse.json(result.ticket);
}
