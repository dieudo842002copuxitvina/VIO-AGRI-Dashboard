
import { NextResponse } from 'next/server';
import { getTrustScore } from '@/modules/trust/trust.service';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');

  if (!userId) {
    return NextResponse.json({ error: 'userId is required' }, { status: 400 });
  }

  const trustScore = await getTrustScore(userId);

  if (!trustScore) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  return NextResponse.json(trustScore);
}
