import { NextResponse } from 'next/server';
import { getOrCreateTodaysSuggestion } from '@/lib/suggestions/service';
import { readIdempotencyKey } from '@/lib/utils/http';

export async function POST(request: Request) {
  // Optional idempotency key (not stored yet; per-day upsert handles idempotency)
  readIdempotencyKey(request.headers);
  const res = await getOrCreateTodaysSuggestion({ forceCreate: true, source: 'api' });
  return NextResponse.json(res, { status: res.success ? 200 : 400 });
}

export async function GET() {
  const res = await getOrCreateTodaysSuggestion({ forceCreate: true, source: 'api' });
  return NextResponse.json(res, { status: res.success ? 200 : 400 });
}