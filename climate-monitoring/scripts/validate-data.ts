export function validateObservation(row: any): { isValid: boolean; qcFlag: number; qcParameter: string | null; cleanedRow: any } {
  let qcFlag = 0;
  const qcParams: string[] = [];

  const parseNum = (val: string) => {
    if (val === undefined || val === null || val === '') return null;
    const num = parseFloat(val);
    if (isNaN(num)) return null;
    return num;
  };

  const parsed = {
    temp0700: parseNum(row['Tbk_120cm_0700']),
    temp1300: parseNum(row['tbk_120cm_1300']),
    temp1800: parseNum(row['Tbk_120cm_1800']),
    tempAvg: parseNum(row['tbk_avg']),
    tempMax: parseNum(row['t_max_120cm_1800']),
    tempMin: parseNum(row['t_min_120cm_1300']),
    rainfallMm: parseNum(row['rr_0700']),
    sunshineHours: parseNum(row['ss_8']),
    pressureHpa: parseNum(row['pp_qfe_0000']),
    humidity0700: parseNum(row['rh_120cm_0700']),
    humidity1300: parseNum(row['rh_120cm_1300']),
    humidity1800: parseNum(row['rh_120cm_1800']),
    humidityAvg: parseNum(row['rh_avg']),
    windAvgKmh: parseNum(row['ff_avg_km_jm']),
    windDirection: row['wd_cardinal'] || null,
    windMaxKnot: Math.round(parseNum(row['ff_max_knot']) || 0) || null,
    windMaxDirection: row['wd_ff_max'] || null,
  };

  if (parsed.rainfallMm === 8888 || parsed.rainfallMm === 9999) {
    qcFlag = 1;
    qcParams.push('rainfallMm');
    parsed.rainfallMm = null;
  } else if (parsed.rainfallMm !== null && parsed.rainfallMm < 0) {
    qcFlag = 1;
    qcParams.push('rainfallMm_negative');
  }

  if (parsed.sunshineHours === 8888 || parsed.sunshineHours === 9999) {
    qcFlag = 1;
    qcParams.push('sunshineHours');
    parsed.sunshineHours = null;
  } else if (parsed.sunshineHours !== null && (parsed.sunshineHours < 0 || parsed.sunshineHours > 24)) {
    qcFlag = 1;
    qcParams.push('sunshineHours_range');
  }

  if (parsed.humidityAvg !== null && (parsed.humidityAvg < 0 || parsed.humidityAvg > 100)) {
    qcFlag = 1;
    qcParams.push('humidityAvg_range');
  }

  return {
    isValid: true,
    qcFlag,
    qcParameter: qcParams.length > 0 ? qcParams.join(',') : null,
    cleanedRow: parsed,
  };
}
