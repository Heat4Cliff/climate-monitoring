import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const from = searchParams.get('from');
  const to = searchParams.get('to');

  let whereClause = {};
  if (from && to) {
    whereClause = {
      observedAt: {
        gte: new Date(from),
        lte: new Date(to)
      }
    };
  }

  const data = await prisma.climateObservation.findMany({
    where: whereClause,
    orderBy: { observedAt: 'asc' },
    select: {
      observedAt: true,
      humidityAvg: true,
    }
  });

  return NextResponse.json(data);
}
