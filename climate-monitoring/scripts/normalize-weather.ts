export function normalizeWeatherEvent(raw: string | undefined | null): string {
  if (!raw || raw.trim() === '') return 'NONE';
  const clean = raw.toUpperCase().replace(/\s+/g, '');
  if (clean === 'TS+RA' || clean === 'TSRA') return 'TS_RA';
  if (clean === 'TS') return 'TS';
  if (clean === 'RA') return 'RA';
  return 'OTHER';
}
