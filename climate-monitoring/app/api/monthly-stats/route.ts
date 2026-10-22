import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  // Use raw SQL for efficient monthly aggregations
  const result = await prisma.$queryRaw<any[]>`
    SELECT
      TO_CHAR(observed_at, 'YYYY-MM') AS month,
      TO_CHAR(observed_at, 'Mon YYYY') AS month_label,
      COUNT(*) AS total_days,

      -- Temperature 07:00
      ROUND(AVG(temp_0700)::numeric, 2) AS avg_temp0700,
      -- Temperature 13:00
      ROUND(AVG(temp_1300)::numeric, 2) AS avg_temp1300,
      -- Temperature 18:00
      ROUND(AVG(temp_1800)::numeric, 2) AS avg_temp1800,
      -- Temperature Avg
      ROUND(AVG(temp_avg)::numeric, 2) AS avg_temp_avg,
      -- Temperature Max
      ROUND(AVG(temp_max)::numeric, 2) AS avg_temp_max,
      ROUND(MAX(temp_max)::numeric, 2) AS max_temp_max,
      -- Temperature Min
      ROUND(AVG(temp_min)::numeric, 2) AS avg_temp_min,
      ROUND(MIN(temp_min)::numeric, 2) AS min_temp_min,

      -- Rainfall (TOTAL per month, standard BMKG)
      ROUND(SUM(rainfall_mm)::numeric, 1) AS total_rainfall,
      ROUND(AVG(rainfall_mm)::numeric, 2) AS avg_rainfall,

      -- Sunshine hours (TOTAL per month)
      ROUND(SUM(sunshine_hours)::numeric, 1) AS total_sunshine,
      ROUND(AVG(sunshine_hours)::numeric, 2) AS avg_sunshine,

      -- Pressure
      ROUND(AVG(pressure_hpa)::numeric, 2) AS avg_pressure,

      -- Humidity 07:00
      ROUND(AVG(humidity_0700)::numeric, 2) AS avg_humidity0700,
      -- Humidity 13:00
      ROUND(AVG(humidity_1300)::numeric, 2) AS avg_humidity1300,
      -- Humidity 18:00
      ROUND(AVG(humidity_1800)::numeric, 2) AS avg_humidity1800,
      -- Humidity Avg
      ROUND(AVG(humidity_avg)::numeric, 2) AS avg_humidity_avg,

      -- Wind
      ROUND(AVG(wind_avg_kmh)::numeric, 2) AS avg_wind_kmh,
      ROUND(AVG(wind_max_knot)::numeric, 2) AS avg_wind_max_knot,
      ROUND(MAX(wind_max_knot)::numeric, 0) AS max_wind_knot,

      -- QC
      SUM(CASE WHEN qc_flag > 0 THEN 1 ELSE 0 END) AS warning_days

    FROM climate_observations
    GROUP BY TO_CHAR(observed_at, 'YYYY-MM'), TO_CHAR(observed_at, 'Mon YYYY')
    ORDER BY month ASC
  `;

  // Convert BigInt and Decimal to plain numbers
  const clean = result.map(row => {
    const obj: any = {};
    for (const [k, v] of Object.entries(row)) {
      if (v === null || v === undefined) {
        obj[k] = null;
      } else if (typeof v === 'bigint') {
        obj[k] = Number(v);
      } else {
        obj[k] = Number(v) || v;
      }
    }
    return obj;
  });

  return NextResponse.json(clean);
}
