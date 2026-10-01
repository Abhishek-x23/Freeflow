import { NextRequest, NextResponse } from 'next/server';
import { mockDatabase } from '@/lib/mock-database';

export async function GET(request: NextRequest) {
  const since = request.nextUrl.searchParams.get('since');
  const result = mockDatabase.getUpdates(since);
  return NextResponse.json(result);
}
