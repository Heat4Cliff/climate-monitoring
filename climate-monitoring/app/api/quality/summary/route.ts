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

  const total = await prisma.climateObservation.count({ where: whereClause });
  
  const flagged = await prisma.climateObservation.count({
    where: {
      ...whereClause,
      qcFlag: { gt: 0 }
    }
  });

  const valid = total - flagged;
  const qcRate = total > 0 ? (valid / total) * 100 : 0;

  return NextResponse.json({
    totalRecords: total,
    validRecords: valid,
    flaggedRecords: flagged,
    qcRate: Number(qcRate.toFixed(2))
  });
}
