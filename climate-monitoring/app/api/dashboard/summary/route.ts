import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  const aggs = await prisma.climateObservation.aggregate({
    _avg: {
      tempAvg: true,
      humidityAvg: true,
      windAvgKmh: true,
    },
    _min: {
      tempMin: true,
    },
    _max: {
      tempMax: true,
      windMaxKnot: true,
    },
    _sum: {
      rainfallMm: true,
    }
  });

  const rainyDaysCount = await prisma.climateObservation.count({
    where: { rainfallMm: { gt: 0 } }
  });

  return NextResponse.json({
    temperature: {
      avg: aggs._avg.tempAvg ? Number(Number(aggs._avg.tempAvg).toFixed(1)) : 0,
      min: aggs._min.tempMin ? Number(aggs._min.tempMin) : 0,
      max: aggs._max.tempMax ? Number(aggs._max.tempMax) : 0
    },
    rainfall: {
      total: aggs._sum.rainfallMm ? Number(Number(aggs._sum.rainfallMm).toFixed(1)) : 0,
      rainyDays: rainyDaysCount
    },
    humidity: {
      avg: aggs._avg.humidityAvg ? Number(Number(aggs._avg.humidityAvg).toFixed(1)) : 0
    },
    wind: {
      avg: aggs._avg.windAvgKmh ? Number(Number(aggs._avg.windAvgKmh).toFixed(1)) : 0,
      max: aggs._max.windMaxKnot ? Number(aggs._max.windMaxKnot) : 0
    }
  });
}
