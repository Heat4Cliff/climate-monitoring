'use client';

import React from 'react';

interface ClimateObservation {
  id: string;
  stationId: string;
  date: string;
  tempMin: string;
  tempMax: string;
  tempAvg: string;
  temp0700: string;
  temp1300: string;
  temp1800: string;
  humidityAvg: string;
  humidity0700: string;
  humidity1300: string;
  humidity1800: string;
  rainfallMm: string;
  sunshineHours: string;
  windSpeedMax: string;
  windMaxKnot: string;
  windMaxDirection: string;
  windDirMax: string;
  windAvgKmh: string;
  windDirection: string;
  qcFlag: number;
}

interface DataTableProps {
  data: ClimateObservation[];
}

export function DataTable({ data }: DataTableProps) {
  const formatDate = (dateString: string) => {
    const d = new Date(dateString);
    return d.toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const formatValue = (val: string | null) => {
    if (val === null || val === '8888' || val === '9999') return '-';
    return val;
  };

  return (
    <div className="w-full h-[500px] overflow-auto rounded-xl border border-[var(--color-border)] shadow-sm bg-[var(--color-surface)]">
      <table className="w-full text-sm text-left">
        <thead className="text-xs text-[var(--color-muted)] uppercase bg-[var(--color-background)] sticky top-0 z-10 shadow-sm">
          <tr>
            <th scope="col" className="px-6 py-4 font-semibold whitespace-nowrap">Date</th>
            <th scope="col" className="px-6 py-4 font-semibold whitespace-nowrap" title="Temperature Minimum">T Min (°C)</th>
            <th scope="col" className="px-6 py-4 font-semibold whitespace-nowrap" title="Temperature Maximum">T Max (°C)</th>
            <th scope="col" className="px-6 py-4 font-semibold whitespace-nowrap" title="Temperature Average">T Avg (°C)</th>
            <th scope="col" className="px-6 py-4 font-semibold whitespace-nowrap">T 07:00 (°C)</th>
            <th scope="col" className="px-6 py-4 font-semibold whitespace-nowrap">T 13:00 (°C)</th>
            <th scope="col" className="px-6 py-4 font-semibold whitespace-nowrap">T 18:00 (°C)</th>
            <th scope="col" className="px-6 py-4 font-semibold whitespace-nowrap" title="Humidity Average">RH Avg (%)</th>
            <th scope="col" className="px-6 py-4 font-semibold whitespace-nowrap">RH 07:00 (%)</th>
            <th scope="col" className="px-6 py-4 font-semibold whitespace-nowrap">RH 13:00 (%)</th>
            <th scope="col" className="px-6 py-4 font-semibold whitespace-nowrap">RH 18:00 (%)</th>
            <th scope="col" className="px-6 py-4 font-semibold whitespace-nowrap" title="Rainfall">RR (mm)</th>
            <th scope="col" className="px-6 py-4 font-semibold whitespace-nowrap" title="Sunshine Duration">ss (Hours)</th>
            <th scope="col" className="px-6 py-4 font-semibold whitespace-nowrap" title="Wind Max Speed">ff_x (Knot)</th>
            <th scope="col" className="px-6 py-4 font-semibold whitespace-nowrap" title="Wind Max Direction">ddd_x (Dir)</th>
            <th scope="col" className="px-6 py-4 font-semibold whitespace-nowrap" title="Wind Average Speed">ff_avg (km/h)</th>
            <th scope="col" className="px-6 py-4 font-semibold whitespace-nowrap" title="Wind Direction">ddd_car (Dir)</th>
            <th scope="col" className="px-6 py-4 font-semibold whitespace-nowrap">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--color-border)]">
          {data.map((row) => (
            <tr 
              key={row.id} 
              className={`hover:bg-[var(--color-background)] transition-colors duration-200 ${row.qcFlag > 0 ? 'bg-orange-50/50' : ''}`}
            >
              <td className="px-6 py-4 font-medium text-[var(--color-text-main)] whitespace-nowrap">
                {formatDate(row.date)}
              </td>
              <td className="px-6 py-4 text-blue-600">{formatValue(row.tempMin)}</td>
              <td className="px-6 py-4 text-[var(--color-danger)]">{formatValue(row.tempMax)}</td>
              <td className="px-6 py-4 font-medium">{formatValue(row.tempAvg)}</td>
              <td className="px-6 py-4">{formatValue(row.temp0700)}</td>
              <td className="px-6 py-4">{formatValue(row.temp1300)}</td>
              <td className="px-6 py-4">{formatValue(row.temp1800)}</td>
              <td className="px-6 py-4 text-blue-600">{formatValue(row.humidityAvg)}</td>
              <td className="px-6 py-4">{formatValue(row.humidity0700)}</td>
              <td className="px-6 py-4">{formatValue(row.humidity1300)}</td>
              <td className="px-6 py-4">{formatValue(row.humidity1800)}</td>
              <td className="px-6 py-4 font-medium text-[var(--color-primary)]">{formatValue(row.rainfallMm)}</td>
              <td className="px-6 py-4 text-orange-500">{formatValue(row.sunshineHours)}</td>
              <td className="px-6 py-4">{formatValue(row.windMaxKnot)}</td>
              <td className="px-6 py-4">{formatValue(row.windMaxDirection)}</td>
              <td className="px-6 py-4">{formatValue(row.windAvgKmh)}</td>
              <td className="px-6 py-4">{formatValue(row.windDirection)}</td>
              <td className="px-6 py-4">
                {row.qcFlag > 0 ? (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[var(--color-warning)] text-white shadow-sm">
                    Warning (QC {row.qcFlag})
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[var(--color-secondary)]/10 text-[var(--color-secondary)]">
                    Valid
                  </span>
                )}
              </td>
            </tr>
          ))}
          {data.length === 0 && (
            <tr>
              <td colSpan={8} className="px-6 py-8 text-center text-[var(--color-muted)]">
                Fetching data...
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
