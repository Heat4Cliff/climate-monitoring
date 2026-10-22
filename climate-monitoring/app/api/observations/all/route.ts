import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const observations = await prisma.climateObservation.findMany({
      orderBy: {
        observedAt: 'asc',
      },
    });

    return NextResponse.json(observations);
  } catch (error) {
    console.error('Failed to fetch observations:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
