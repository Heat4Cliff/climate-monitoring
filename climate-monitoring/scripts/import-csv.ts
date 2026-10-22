import fs from 'fs';
import { parse } from 'csv-parse';
import { PrismaClient } from '@prisma/client';
import { validateObservation } from './validate-data';
import { normalizeWeatherEvent } from './normalize-weather';
import crypto from 'crypto';
import path from 'path';

const prisma = new PrismaClient();

async function main() {
  const filePath = path.resolve(__dirname, '../../Fklim 2025-01-01 to 2025-12-31.csv');
  console.log(`Reading CSV from ${filePath}`);

  const fileBuffer = fs.readFileSync(filePath);
  const fileHash = crypto.createHash('sha256').update(fileBuffer).digest('hex');

  // Skip the first line (Form Fklim 71)
  const fileContent = fileBuffer.toString('utf-8');
  const lines = fileContent.split('\n');
  if (lines[0].includes('Form Fklim')) {
    lines.shift();
  }
  const cleanCsvContent = lines.join('\n');

  // Create Import Batch
  const batch = await prisma.importBatch.create({
    data: {
      fileName: 'Fklim 2025-01-01 to 2025-12-31.csv',
      fileHash,
      status: 'PROCESSING',
    }
  });

  console.log(`Created Import Batch ID: ${batch.id}`);

  let totalRows = 0;
  let validRows = 0;
  let invalidRows = 0;

  const parser = parse({
    columns: true,
    skip_empty_lines: true,
  });

  const records: any[] = [];
  
  await new Promise((resolve, reject) => {
    parser.on('readable', function () {
      let record;
      while ((record = parser.read()) !== null) {
        records.push(record);
      }
    });
    parser.on('error', function(err){
      reject(err);
    });
    parser.on('end', function(){
      resolve(null);
    });
    parser.write(cleanCsvContent);
    parser.end();
  });

  console.log(`Parsed ${records.length} records. Beginning database insert...`);

  for (const row of records) {
    totalRows++;
    
    // Save Raw
    await prisma.rawFklimObservation.create({
      data: {
        fileName: batch.fileName,
        rawRow: JSON.stringify(row),
      }
    });

    const validated = validateObservation(row);

    if (!validated.isValid) {
      invalidRows++;
      continue;
    }

    const d = validated.cleanedRow;
    const observedAt = new Date(row['data_timestamp']);

    try {
      // Upsert Station
      const station = await prisma.station.upsert({
        where: { stationId: parseInt(row['station_id']) },
        update: {},
        create: {
          stationId: parseInt(row['station_id']),
          stationName: row['station_name'],
          latitude: parseFloat(row['current_latitude']),
          longitude: parseFloat(row['current_longitude']),
        }
      });

      // Upsert Observation
      const observation = await prisma.climateObservation.upsert({
        where: {
          uq_station_observation_date: {
            stationId: station.id,
            observedAt: observedAt,
          }
        },
        update: {
           qcFlag: validated.qcFlag,
           qcParameter: validated.qcParameter,
        },
        create: {
          stationId: station.id,
          observedAt: observedAt,
          temp0700: d.temp0700,
          temp1300: d.temp1300,
          temp1800: d.temp1800,
          tempAvg: d.tempAvg,
          tempMax: d.tempMax,
          tempMin: d.tempMin,
          rainfallMm: d.rainfallMm,
          sunshineHours: d.sunshineHours,
          pressureHpa: d.pressureHpa,
          humidity0700: d.humidity0700,
          humidity1300: d.humidity1300,
          humidity1800: d.humidity1800,
          humidityAvg: d.humidityAvg,
          windAvgKmh: d.windAvgKmh,
          windDirection: d.windDirection,
          windMaxKnot: d.windMaxKnot,
          windMaxDirection: d.windMaxDirection,
          qcFlag: validated.qcFlag,
          qcParameter: validated.qcParameter,
        }
      });

      // Handle Weather Event
      const rawWeather = row['cuaca_khusus'];
      const normalizedCode = normalizeWeatherEvent(rawWeather);
      
      if (normalizedCode !== 'NONE') {
        const existingEvent = await prisma.weatherEvent.findFirst({
           where: { observationId: observation.id, eventCode: normalizedCode }
        });
        if (!existingEvent) {
          await prisma.weatherEvent.create({
            data: {
              observationId: observation.id,
              eventCode: normalizedCode,
              eventLabel: rawWeather || 'UNKNOWN',
            }
          });
        }
      }

      validRows++;
    } catch (err) {
      console.error(`Error importing row for date ${row['data_timestamp']}`, err);
      invalidRows++;
    }
  }

  // Update Batch Status
  await prisma.importBatch.update({
    where: { id: batch.id },
    data: {
      totalRows,
      validRows,
      invalidRows,
      status: 'SUCCESS',
    }
  });

  console.log(`Import Complete! Total: ${totalRows}, Valid: ${validRows}, Invalid: ${invalidRows}`);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
