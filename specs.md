# SPEC.md
# Sistem Monitoring Data Klimatologi BMKG
## Next.js + Tailwind CSS + React Bits + PostgreSQL + Metabase

**Status:** Draft Technical Specification  
**Versi:** 1.0.0  
**Tanggal:** 19 Agustus 2026  
**Target:** Prototype internal → siap dikembangkan menjadi production  
**Sumber data awal:** `Fklim 2025-01-01 to 2025-12-31.csv`

---

## 1. Ringkasan Proyek

Sistem ini merupakan aplikasi monitoring data klimatologi berbasis web yang menampilkan data observasi stasiun meteorologi dalam bentuk dashboard interaktif.

Arsitektur menggunakan:

- **Next.js** sebagai aplikasi utama dan application shell.
- **React** sebagai komponen UI.
- **Tailwind CSS** sebagai sistem styling.
- **React Bits** sebagai sumber komponen visual dan animasi pendukung.
- **PostgreSQL** sebagai database utama.
- **Metabase** sebagai analytics dan dashboard engine.
- **CSV** sebagai sumber data awal untuk proses import dan normalisasi.
- **Docker Compose** direkomendasikan untuk local development agar PostgreSQL dan Metabase mudah dijalankan secara konsisten.

Aplikasi harus memungkinkan pengguna melihat kondisi klimatologi secara cepat melalui KPI, filter periode, grafik, tabel data, dan dashboard analitik.

Sistem memiliki dua lapisan visualisasi:

1. **Next.js Dashboard**
   Untuk UI aplikasi utama, KPI, filter, visualisasi custom, navigasi, autentikasi, dan pengalaman pengguna.
2. **Metabase Analytics**
   Untuk dashboard analitik yang lebih eksploratif, query visual, ad-hoc analysis, dan pelaporan.

Keduanya menggunakan sumber data PostgreSQL yang sama.

---

# 2. Tujuan Sistem

## 2.1 Tujuan Utama

Membangun sistem monitoring klimatologi yang mampu:

- Menampilkan data observasi harian.
- Menampilkan ringkasan statistik periode tertentu.
- Membandingkan parameter meteorologi dari waktu ke waktu.
- Menampilkan distribusi cuaca khusus.
- Menampilkan arah dan kecepatan angin.
- Menampilkan tren temperatur, kelembapan, curah hujan, tekanan udara, dan lama penyinaran matahari.
- Menandai data yang memiliki masalah quality control.
- Menyediakan dashboard yang mudah dipahami oleh pengguna non-teknis.
- Menyediakan analisis lebih lanjut melalui Metabase.

## 2.2 Tujuan Teknis

Sistem harus:

- Memiliki struktur database yang terukur.
- Memisahkan raw data dan cleaned data.
- Memiliki proses import CSV yang dapat diulang.
- Memvalidasi data sebelum masuk ke tabel produksi.
- Mendukung filter tanggal.
- Mendukung agregasi harian, mingguan, dan bulanan.
- Memiliki API internal yang terstruktur.
- Mendukung responsive layout.
- Tidak membocorkan credential database atau Metabase ke client.
- Memiliki logging dan error handling.

---

# 3. Dataset Awal

File input:

`Fklim 2025-01-01 to 2025-12-31.csv`

Dataset awal berisi **365 record observasi** untuk:

- `station_id`: 96805
- `station_name`: Stasiun Meteorologi Tunggul Wulung
- Lokasi: sekitar latitude `-7.7186`, longitude `109.0148`
- Periode: 1 Januari 2025 sampai 31 Desember 2025

Kolom sumber:

| Kolom | Tipe awal | Deskripsi |
|---|---|---|
| station_id | integer | ID stasiun |
| station_name | text | Nama stasiun |
| current_latitude | numeric | Latitude stasiun |
| current_longitude | numeric | Longitude stasiun |
| data_timestamp | date | Tanggal observasi |
| Tbk_120cm_0700 | numeric | Temperatur pada waktu observasi 07:00 |
| tbk_120cm_1300 | numeric | Temperatur pada waktu observasi 13:00 |
| Tbk_120cm_1800 | numeric | Temperatur pada waktu observasi 18:00 |
| tbk_avg | numeric | Temperatur rata-rata |
| t_max_120cm_1800 | numeric | Temperatur maksimum |
| t_min_120cm_1300 | numeric | Temperatur minimum |
| rr_0700 | numeric | Curah hujan |
| ss_8 | numeric | Lama penyinaran matahari |
| cuaca_khusus | text | Fenomena/cuaca khusus |
| pp_qfe_0000 | numeric | Tekanan udara |
| rh_120cm_0700 | numeric | Kelembapan relatif 07:00 |
| rh_120cm_1300 | numeric | Kelembapan relatif 13:00 |
| rh_120cm_1800 | numeric | Kelembapan relatif 18:00 |
| rh_avg | numeric | Kelembapan relatif rata-rata |
| ff_avg_km_jm | numeric | Kecepatan angin rata-rata |
| wd_cardinal | text | Arah angin dominan |
| ff_max_knot | integer | Kecepatan angin maksimum |
| wd_ff_max | text | Arah angin maksimum |
| qc_flag | integer | Status quality control |
| qc_parameter | text | Parameter yang terkena quality control |

## 3.1 Temuan Data Penting

Data awal memiliki beberapa nilai yang perlu ditangani sebelum visualisasi:

- `rr_0700` memiliki nilai `8888`, yang harus diperlakukan sebagai nilai kode/sentinel dan tidak boleh langsung dianggap sebagai curah hujan normal.
- `ss_8` memiliki nilai `9999`, yang harus diperlakukan sebagai nilai tidak valid atau kode khusus.
- `cuaca_khusus` memiliki variasi format seperti `TS + RA`, `TS+RA`, `TS  + RA`, `TSRA`, `TS RA`, dan bentuk lain yang perlu dinormalisasi.
- Terdapat data kosong pada `cuaca_khusus`.
- Terdapat beberapa data kosong pada `ss_8`.
- `qc_flag` memiliki lebih dari satu status dan harus dipertahankan sebagai indikator kualitas data.
- `qc_parameter` sebagian besar kosong, tetapi record yang terisi harus dapat ditelusuri.

**Aturan penting:** data mentah tidak boleh ditimpa. Nilai asli harus disimpan pada tabel raw agar proses audit dan reprocessing tetap memungkinkan.

---

# 4. Konsep Arsitektur

```text
                  ┌──────────────────────────┐
                  │      CSV / Data Source   │
                  └────────────┬─────────────┘
                               │
                               ▼
                  ┌──────────────────────────┐
                  │     Import / ETL Job     │
                  │ Validation + Normalize   │
                  └────────────┬─────────────┘
                               │
                               ▼
                  ┌──────────────────────────┐
                  │       PostgreSQL         │
                  │                          │
                  │ raw_fklim                 │
                  │ fact_climate_observation │
                  │ dim_station              │
                  │ dim_date                 │
                  │ summary / view           │
                  └───────────┬──────────────┘
                              │
                 ┌────────────┴────────────┐
                 │                         │
                 ▼                         ▼
      ┌───────────────────┐     ┌────────────────────┐
      │     Next.js       │     │      Metabase      │
      │ App + API + UI    │     │ Analytics / BI     │
      └─────────┬─────────┘     └──────────┬─────────┘
                │                          │
                └────────────┬─────────────┘
                             ▼
                  ┌──────────────────────────┐
                  │      End User            │
                  │ Dashboard / Monitoring   │
                  └──────────────────────────┘
```

---

# 5. Teknologi

## 5.1 Frontend

- Next.js
- React
- TypeScript
- Tailwind CSS
- React Bits
- Lucide Icons
- Recharts atau library chart React yang kompatibel
- TanStack Table untuk tabel data jika diperlukan

## 5.2 Backend

Next.js digunakan sebagai application backend melalui:

- Route Handlers
- Server Components
- Server Actions jika diperlukan
- Service layer untuk business logic

## 5.3 Database

- PostgreSQL

ORM yang direkomendasikan:

- Prisma

Alternatif:

- Drizzle ORM

Untuk konsistensi project, gunakan satu ORM saja.

## 5.4 Business Intelligence

- Metabase

Metabase terhubung langsung ke PostgreSQL melalui koneksi database khusus read-oriented.

## 5.5 Development

- Node.js
- npm / pnpm
- Docker
- Docker Compose
- Git
- ESLint
- Prettier

---

# 6. Struktur Project yang Direkomendasikan

```text
climate-monitoring/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   └── layout.tsx
│   │
│   ├── dashboard/
│   │   ├── page.tsx
│   │   ├── climate/
│   │   ├── rainfall/
│   │   ├── temperature/
│   │   ├── humidity/
│   │   ├── wind/
│   │   ├── quality/
│   │   └── reports/
│   │
│   ├── api/
│   │   ├── dashboard/
│   │   ├── observations/
│   │   ├── stations/
│   │   ├── statistics/
│   │   └── import/
│   │
│   ├── layout.tsx
│   └── page.tsx
│
├── components/
│   ├── charts/
│   ├── dashboard/
│   ├── filters/
│   ├── tables/
│   ├── ui/
│   └── metabase/
│
├── lib/
│   ├── db.ts
│   ├── auth.ts
│   ├── metabase.ts
│   ├── validations/
│   ├── queries/
│   └── utils/
│
├── prisma/
│   ├── schema.prisma
│   ├── migrations/
│   └── seed.ts
│
├── scripts/
│   ├── import-csv.ts
│   ├── normalize-weather.ts
│   └── validate-data.ts
│
├── public/
│
├── docs/
│   ├── architecture.md
│   ├── database.md
│   ├── metabase.md
│   └── data-dictionary.md
│
├── docker/
│
├── .env.example
├── docker-compose.yml
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
└── README.md
```

---

# 7. Database Design

## 7.1 Prinsip

Database menggunakan pendekatan sederhana dengan dukungan dimensi dan fact table.

Minimal tabel:

1. `stations`
2. `climate_observations`
3. `weather_events`
4. `data_quality_logs`
5. `import_batches`
6. `users` jika autentikasi disimpan di aplikasi

Untuk kebutuhan analitik yang lebih kuat dapat ditambahkan:

- `dim_date`
- `monthly_climate_summary`
- materialized views

---

# 8. Tabel `stations`

```sql
CREATE TABLE stations (
    id BIGSERIAL PRIMARY KEY,
    station_id INTEGER NOT NULL UNIQUE,
    station_name VARCHAR(255) NOT NULL,
    latitude NUMERIC(9,6) NOT NULL,
    longitude NUMERIC(9,6) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);
```

---

# 9. Tabel `climate_observations`

```sql
CREATE TABLE climate_observations (
    id BIGSERIAL PRIMARY KEY,

    station_id BIGINT NOT NULL REFERENCES stations(id),

    observed_at DATE NOT NULL,

    temp_0700 NUMERIC(5,2),
    temp_1300 NUMERIC(5,2),
    temp_1800 NUMERIC(5,2),
    temp_avg NUMERIC(5,2),
    temp_max NUMERIC(5,2),
    temp_min NUMERIC(5,2),

    rainfall_mm NUMERIC(8,2),
    sunshine_hours NUMERIC(6,2),

    pressure_hpa NUMERIC(7,2),

    humidity_0700 NUMERIC(5,2),
    humidity_1300 NUMERIC(5,2),
    humidity_1800 NUMERIC(5,2),
    humidity_avg NUMERIC(5,2),

    wind_avg_kmh NUMERIC(6,2),
    wind_direction VARCHAR(32),
    wind_max_knot INTEGER,
    wind_max_direction VARCHAR(32),

    qc_flag INTEGER NOT NULL DEFAULT 0,
    qc_parameter VARCHAR(255),

    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_station_observation_date
        UNIQUE (station_id, observed_at)
);
```

---

# 10. Tabel `weather_events`

Tabel ini digunakan untuk menyimpan cuaca khusus yang telah dinormalisasi.

```sql
CREATE TABLE weather_events (
    id BIGSERIAL PRIMARY KEY,
    observation_id BIGINT NOT NULL REFERENCES climate_observations(id) ON DELETE CASCADE,
    event_code VARCHAR(32) NOT NULL,
    event_label VARCHAR(100) NOT NULL
);
```

Contoh normalisasi:

| Raw | Normalized |
|---|---|
| TS | TS |
| TS + RA | TS_RA |
| TS+RA | TS_RA |
| TS  + RA | TS_RA |
| TSRA | TS_RA |
| RA | RA |
| - | NONE |
| kosong | NONE |

Format akhir harus mengikuti data dictionary resmi yang disepakati pada tahap implementasi.

---

# 11. Tabel `import_batches`

```sql
CREATE TABLE import_batches (
    id BIGSERIAL PRIMARY KEY,
    file_name VARCHAR(255) NOT NULL,
    file_hash VARCHAR(128),
    total_rows INTEGER NOT NULL DEFAULT 0,
    valid_rows INTEGER NOT NULL DEFAULT 0,
    invalid_rows INTEGER NOT NULL DEFAULT 0,
    imported_at TIMESTAMP NOT NULL DEFAULT NOW(),
    status VARCHAR(32) NOT NULL
);
```

Contoh status:

- `PENDING`
- `PROCESSING`
- `SUCCESS`
- `PARTIAL`
- `FAILED`

---

# 12. Raw Data Layer

Buat tabel:

`raw_fklim_observations`

Tujuannya:

- Menyimpan row CSV asli.
- Memudahkan audit.
- Menjaga nilai sentinel seperti `8888` atau `9999`.
- Memungkinkan reprocessing tanpa meminta ulang file sumber.

Raw table tidak digunakan langsung oleh dashboard.

---

# 13. Data Cleaning Rules

## 13.1 Sentinel Values

Nilai berikut tidak boleh langsung digunakan sebagai angka valid sebelum divalidasi:

- `8888`
- `9999`

Rule:

```text
8888 -> NULL / flagged invalid
9999 -> NULL / flagged invalid
```

Nilai raw tetap disimpan.

## 13.2 Rainfall

`rainfall_mm` harus menggunakan unit milimeter.

Validasi awal:

```text
rainfall_mm >= 0
```

Nilai yang tidak memenuhi rule diberi flag.

## 13.3 Sunshine

`sunshine_hours` harus dikonversi menjadi nilai numerik valid.

Rule awal:

```text
0 <= sunshine_hours <= 24
```

Jika sumber menggunakan kode khusus, nilai tersebut harus masuk sebagai NULL setelah proses cleaning dan tercatat di quality log.

## 13.4 Humidity

Rule:

```text
0 <= RH <= 100
```

## 13.5 Temperature

Data temperatur harus diperiksa terhadap:

- NULL
- angka ekstrem
- range tidak wajar
- QC flag

Jangan menghapus data hanya karena nilainya terlihat ekstrem. Gunakan rule validation dan QC status.

## 13.6 Wind

Arah angin dinormalisasi ke:

```text
N
NE
E
SE
S
SW
W
NW
C
```

Jika satu record memiliki beberapa arah seperti:

```text
SW;W
E;NE
```

nilai raw disimpan, sedangkan analisis dapat memakai:

- dominant direction
- direction tokens

---

# 14. Index Database

Minimal index:

```sql
CREATE INDEX idx_observations_station_date
ON climate_observations(station_id, observed_at);

CREATE INDEX idx_observations_date
ON climate_observations(observed_at);

CREATE INDEX idx_observations_qc
ON climate_observations(qc_flag);

CREATE INDEX idx_weather_events_code
ON weather_events(event_code);
```

Untuk query dashboard yang berat, evaluasi:

- composite index
- materialized view
- summary table
- partitioning berdasarkan waktu

Partitioning belum wajib pada tahap prototype.

---

# 15. KPI Utama Dashboard

Dashboard utama minimal menyediakan:

1. Temperatur rata-rata
2. Temperatur maksimum
3. Temperatur minimum
4. Curah hujan
5. Kelembapan rata-rata
6. Tekanan udara rata-rata
7. Kecepatan angin rata-rata
8. Kecepatan angin maksimum
9. Lama penyinaran matahari
10. Jumlah hari hujan
11. Jumlah hari dengan cuaca khusus
12. Jumlah record dengan QC flag

Contoh KPI:

```text
Average Temperature
27.6 °C
```

```text
Maximum Temperature
35.6 °C
```

```text
Total Rainfall
xxx mm
```

```text
Average Humidity
81.8 %
```

---

# 16. Filter Dashboard

Global filter minimal:

- Rentang tanggal
- Tahun
- Bulan
- Stasiun
- Parameter
- Status QC
- Cuaca khusus
- Arah angin

Filter harus dapat memengaruhi grafik dan tabel yang relevan.

---

# 17. Dashboard Layout

Layout yang direkomendasikan:

```text
┌─────────────────────────────────────────────────────────────┐
│ Header                                                      │
│ Logo | Monitoring Klimatologi | User                        │
├─────────────────────────────────────────────────────────────┤
│ Sidebar                                                     │
│ Dashboard                                                  │
│ Temperatur                                                 │
│ Curah Hujan                                                │
│ Kelembapan                                                 │
│ Angin                                                      │
│ Quality Control                                            │
│ Metabase                                                   │
├─────────────────────────────────────────────────────────────┤
│ Main                                                        │
│                                                             │
│ [KPI] [KPI] [KPI] [KPI]                                    │
│                                                             │
│ [Temperature Line Chart] [Rainfall Area Chart]            │
│                                                             │
│ [Humidity Line]       [Wind Bar/Pie]                       │
│                                                             │
│ [Weather Pie]         [Scatter Plot]                       │
│                                                             │
│ [Data Table]                                                │
└─────────────────────────────────────────────────────────────┘
```

Desain dapat mengambil inspirasi dari tampilan monitoring pada referensi, tetapi UI harus dibuat sebagai aplikasi dashboard khusus dan tidak meniru identitas visual produk lain.

---

# 18. Visualisasi

## 18.1 Line Chart

Digunakan untuk:

- Temperatur harian
- RH harian
- Tekanan udara
- Kecepatan angin
- Perbandingan temperatur minimum, rata-rata, maksimum

Contoh:

```text
X = tanggal
Y = temperatur
Series = min / avg / max
```

---

# 19. Area Chart

Digunakan untuk:

- Curah hujan per hari
- Akumulasi curah hujan
- Lama penyinaran matahari
- Trend kelembapan

Rekomendasi utama:

```text
Area Chart:
Daily Rainfall
X = date
Y = rainfall_mm
```

---

# 20. Bar Chart

Digunakan untuk:

- Curah hujan per bulan
- Temperatur rata-rata per bulan
- Hari hujan per bulan
- Distribusi arah angin
- Jumlah kejadian cuaca khusus

Contoh:

```text
January  ███████
February ███████████
March    █████
...
```

---

# 21. Pie / Donut Chart

Digunakan untuk:

- Distribusi cuaca khusus
- Proporsi arah angin
- Distribusi status QC

Contoh:

```text
RA
TS
TS_RA
NONE
OTHER
```

Pie chart tidak boleh digunakan untuk data time series.

---

# 22. Scatter Plot

Scatter plot harus digunakan untuk analisis korelasi.

Kandidat:

### A. Temperatur vs Kelembapan

```text
X = temp_avg
Y = humidity_avg
```

### B. Curah Hujan vs Kelembapan

```text
X = rainfall_mm
Y = humidity_avg
```

### C. Temperatur vs Tekanan

```text
X = temp_avg
Y = pressure_hpa
```

### D. Kecepatan Angin vs Temperatur

```text
X = wind_avg_kmh
Y = temp_avg
```

Scatter plot sebaiknya menyediakan tooltip:

- tanggal
- temperature
- humidity
- rainfall
- wind
- pressure

---

# 23. Grafik Tambahan yang Direkomendasikan

Untuk versi pengembangan lanjut:

- Heatmap kalender curah hujan
- Wind rose
- Histogram temperatur
- Box plot temperatur per bulan
- KPI trend sparkline
- Correlation matrix
- Cumulative rainfall chart
- Monthly comparison chart

---

# 24. Dashboard Pages

## 24.1 `/dashboard`

Halaman utama.

Isi:

- Global filters
- KPI
- Trend temperatur
- Curah hujan
- Kelembapan
- Angin
- Cuaca khusus
- QC summary

## 24.2 `/dashboard/temperature`

Isi:

- Temperature min/max/avg
- Line chart
- Monthly comparison
- Scatter temperature-humidity
- Table

## 24.3 `/dashboard/rainfall`

Isi:

- Total rainfall
- Rainy days
- Max daily rainfall
- Area chart
- Monthly bar chart
- Rainfall distribution

## 24.4 `/dashboard/humidity`

Isi:

- Average RH
- Min RH
- Max RH
- RH line chart
- Temperature vs RH scatter plot

## 24.5 `/dashboard/wind`

Isi:

- Average wind
- Max wind
- Direction distribution
- Wind bar chart
- Scatter plot

## 24.6 `/dashboard/quality`

Isi:

- Total records
- Valid records
- Flagged records
- QC rate
- QC parameter
- Data anomaly table

## 24.7 `/dashboard/metabase`

Isi:

- Embedded Metabase dashboard
- Link ke analytics Metabase jika diperlukan

---

# 25. API Specification

## Dashboard

```http
GET /api/dashboard/summary
```

Response:

```json
{
  "temperature": {
    "avg": 27.6,
    "min": 22.0,
    "max": 35.6
  },
  "rainfall": {
    "total": 0,
    "rainyDays": 0
  },
  "humidity": {
    "avg": 81.8
  },
  "wind": {
    "avg": 6.9,
    "max": 15
  }
}
```

Nilai `rainfall` di atas hanya contoh bentuk response dan tidak boleh dianggap sebagai hasil final sebelum data cleaning.

---

## Temperature

```http
GET /api/observations/temperature?from=2025-01-01&to=2025-12-31
```

## Rainfall

```http
GET /api/observations/rainfall?from=2025-01-01&to=2025-12-31
```

## Humidity

```http
GET /api/observations/humidity?from=2025-01-01&to=2025-12-31
```

## Wind

```http
GET /api/observations/wind?from=2025-01-01&to=2025-12-31
```

## Statistics

```http
GET /api/statistics/monthly?year=2025
```

## Quality

```http
GET /api/quality/summary?from=2025-01-01&to=2025-12-31
```

---

# 26. Query Layer

Jangan menaruh query database kompleks langsung di komponen React.

Gunakan:

```text
UI
 ↓
API / Server Action
 ↓
Service
 ↓
Repository / Query
 ↓
Prisma
 ↓
PostgreSQL
```

Contoh:

```text
components/charts/TemperatureChart.tsx
        ↓
services/temperature.service.ts
        ↓
repositories/temperature.repository.ts
        ↓
Prisma
```

Keuntungan:

- mudah diuji
- mudah dirawat
- query reusable
- business logic terpisah

---

# 27. Metabase Integration

## 27.1 Tujuan

Metabase digunakan untuk:

- analisis eksploratif
- dashboard internal
- ad-hoc query
- laporan
- drill-down
- visualisasi tambahan
- validasi terhadap dashboard Next.js

## 27.2 Koneksi

Metabase membaca PostgreSQL melalui user/database khusus analytics.

Contoh:

```text
PostgreSQL
    ├── Next.js application
    └── Metabase
```

Metabase jangan menggunakan credential administrator database jika tidak diperlukan.

## 27.3 Embedded Dashboard

Untuk dashboard Metabase yang ditampilkan di Next.js:

```text
Next.js
   ↓
Embedded Metabase Dashboard
   ↓
Metabase
   ↓
PostgreSQL
```

Credential dan token embedding tidak boleh ditempatkan sebagai secret yang dapat dibaca browser secara langsung.

Gunakan mekanisme embedding yang didukung oleh edisi Metabase yang dipakai.

---

# 28. Dashboard Metabase

Dashboard Metabase minimal:

## Dashboard A - Executive Summary

- KPI temperature
- KPI rainfall
- KPI humidity
- KPI wind
- Rainfall monthly
- Temperature monthly
- Weather event distribution

## Dashboard B - Climate Trend

- Temperature line
- RH line
- Pressure line
- Sunshine area
- Rainfall area

## Dashboard C - Wind Analysis

- Wind direction distribution
- Wind speed bar
- Wind speed trend
- Wind-related scatter plots

## Dashboard D - Data Quality

- Total rows
- Valid
- Flagged
- QC parameter
- Missing values
- Anomaly summary

---

# 29. Data Import Workflow

Proses import:

```text
Upload CSV
   ↓
Check file
   ↓
Calculate hash
   ↓
Create import_batch
   ↓
Read rows
   ↓
Validate columns
   ↓
Validate types
   ↓
Normalize values
   ↓
Store raw rows
   ↓
Store cleaned rows
   ↓
Store weather event
   ↓
Store quality log
   ↓
Update import batch
   ↓
Generate summary
```

Import harus idempotent.

File yang sama tidak boleh menggandakan observasi.

Gunakan kombinasi:

```text
station_id + observed_at
```

sebagai unique constraint.

---

# 30. Validation Rules

Sebelum insert:

### Required

- station_id
- station_name
- latitude
- longitude
- data_timestamp

### Numeric

Semua parameter numerik harus dapat diparsing.

### Date

Format:

```text
YYYY-MM-DD
```

### Range

Humidity:

```text
0..100
```

Rainfall:

```text
>= 0
```

Sunshine:

```text
0..24
```

Temperature:

Gunakan pemeriksaan domain dan QC, bukan hard-coded arbitrary threshold sebagai satu-satunya aturan.

---

# 31. Data Quality Dashboard

Sistem harus menghitung:

```text
Total Records
Valid Records
Invalid Records
QC Flagged
Missing Values
Duplicate Records
```

Quality score:

```text
quality_rate =
(valid_records / total_records) * 100
```

Quality rate tidak boleh menyembunyikan data yang sebenarnya valid tetapi memiliki warning.

Bedakan:

- Valid
- Warning
- Invalid

---

# 32. UI/UX Requirement

## 32.1 Tema

Rekomendasi:

- dark/light mode
- clean dashboard
- high contrast
- card-based layout
- responsive grid
- visual hierarchy jelas

## 32.2 React Bits

React Bits dipakai untuk:

- animated card
- counter
- background effect
- hover interaction
- chart container enhancement
- loading transitions

React Bits tidak boleh digunakan untuk elemen kritis jika animasinya mengurangi keterbacaan.

## 32.3 Loading State

Gunakan:

- skeleton
- progress indicator
- empty state
- error state

Jangan menampilkan dashboard kosong tanpa informasi bahwa data sedang dimuat.

---

# 33. Responsive

Minimal mendukung:

- Desktop
- Laptop
- Tablet
- Mobile

Prioritas dashboard adalah desktop karena data monitoring membutuhkan area visual besar.

Pada mobile:

- grafik menjadi 1 kolom
- tabel dapat horizontal scroll
- sidebar berubah menjadi drawer
- filter menjadi modal/sheet

---

# 34. Security

## Database

- Jangan expose PostgreSQL ke internet tanpa kebutuhan.
- Gunakan password kuat.
- Gunakan least privilege.
- Pisahkan user aplikasi dan user Metabase.
- Simpan credential di environment variable.

## Application

- Validasi semua query parameter.
- Hindari SQL injection.
- Rate-limit endpoint import.
- Batasi ukuran file.
- Validasi MIME/type dan extension.
- Jangan izinkan path traversal.
- Jangan menyimpan secret di frontend.

## Metabase

- Jangan expose admin credential.
- Gunakan account/service account khusus.
- Batasi akses dashboard.
- Pisahkan environment development dan production.

---

# 35. Environment Variables

Contoh `.env.example`:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/climate_monitoring"

NEXT_PUBLIC_APP_NAME="Climate Monitoring"

METABASE_URL="http://localhost:3001"
METABASE_SITE_URL="http://localhost:3001"
METABASE_EMBED_SECRET="change-me"

NODE_ENV="development"
```

Secret production harus dibuat berbeda.

---

# 36. Docker Compose

Komponen minimal:

```text
postgres
metabase
nextjs
```

Opsional:

```text
pgadmin
```

Struktur:

```yaml
services:
  postgres:
    image: postgres
    ...

  metabase:
    image: metabase/metabase
    depends_on:
      - postgres
    ...

  app:
    build:
      context: .
    depends_on:
      - postgres
    ...
```

Tag image sebaiknya dikunci pada versi yang telah diuji dalam project, bukan selalu menggunakan `latest`.

---

# 37. Materialized Views

Untuk dashboard besar, buat summary:

```sql
CREATE MATERIALIZED VIEW monthly_climate_summary AS
SELECT
    station_id,
    DATE_TRUNC('month', observed_at) AS month,
    AVG(temp_avg) AS avg_temperature,
    MIN(temp_min) AS min_temperature,
    MAX(temp_max) AS max_temperature,
    SUM(rainfall_mm) AS total_rainfall,
    AVG(humidity_avg) AS avg_humidity,
    AVG(wind_avg_kmh) AS avg_wind
FROM climate_observations
GROUP BY station_id, DATE_TRUNC('month', observed_at);
```

Refresh:

```sql
REFRESH MATERIALIZED VIEW monthly_climate_summary;
```

Pada tahap awal, view biasa dapat digunakan jika performa masih cukup.

---

# 38. Performance Requirement

Target awal:

- Dashboard initial load < 3 detik pada local/normal environment.
- API query < 1 detik untuk summary sederhana.
- Chart query < 2 detik untuk dataset standar.
- Import 365 baris harus selesai dalam hitungan detik.
- Gunakan pagination untuk tabel.
- Gunakan aggregation di database, bukan mengambil seluruh dataset ke browser.

Untuk data berukuran besar:

- query indexing
- materialized views
- pagination
- caching
- server-side aggregation

---

# 39. Caching

Gunakan caching pada:

- summary dashboard
- monthly aggregation
- station metadata
- static data dictionary

Jangan cache query yang harus benar-benar real-time tanpa strategi invalidation.

---

# 40. Testing

## Unit Test

Test:

- normalisasi weather
- sentinel conversion
- validation
- statistic calculation
- quality calculation

## Integration Test

Test:

- CSV import
- database insert
- duplicate prevention
- API query
- Metabase connectivity

## E2E Test

Test:

```text
Login
→ Dashboard
→ Filter date
→ Chart update
→ Open detail
→ Open Metabase
```

---

# 41. Logging

Log minimal:

- import started
- import finished
- invalid row
- duplicate row
- API error
- database error
- authentication event

Contoh:

```text
[INFO] Import started
[INFO] File: Fklim 2025...
[INFO] Rows: 365
[INFO] Valid: ...
[WARN] Sentinel values detected
[INFO] Import complete
```

Jangan log password, token, secret, atau credential database.

---

# 42. Seed Development

Database development harus menyediakan:

- station sample
- data 2025
- normalized weather events
- QC data

Seed harus dapat dijalankan ulang dengan aman.

Contoh:

```bash
npx prisma migrate dev
npx prisma db seed
```

---

# 43. Acceptance Criteria

Project dianggap siap untuk tahap prototype apabila:

- PostgreSQL berjalan.
- Metabase berjalan.
- Next.js berjalan.
- CSV berhasil diimport.
- Raw data tersimpan.
- Cleaned data tersimpan.
- Duplicate tidak terjadi.
- Dashboard dapat membaca PostgreSQL.
- Minimal 5 jenis chart tersedia.
- Filter tanggal berfungsi.
- KPI berubah berdasarkan filter.
- Data quality terlihat.
- Metabase dapat membaca database.
- Dashboard Metabase dapat diakses.
- Responsive layout berjalan.
- Error/loading/empty state tersedia.

---

# 44. MVP

MVP harus terdiri dari:

### Backend

- PostgreSQL
- Prisma
- CSV importer
- validation
- normalization
- REST API

### Frontend

- Dashboard
- KPI
- Date filter
- Line chart
- Bar chart
- Pie chart
- Area chart
- Scatter plot
- Data table

### Metabase

- database connection
- summary dashboard
- climate trend dashboard
- quality dashboard

---

# 45. Phase 2

Setelah MVP:

- multi-station support
- multi-year data
- authentication
- role based access
- saved filters
- report export
- CSV upload UI
- audit trail
- richer Metabase embedding
- heatmap
- wind rose
- anomaly detection

---

# 46. Phase 3

Pengembangan lanjutan:

- automatic scheduled import
- real-time or near-real-time ingestion jika sumber data tersedia
- alerting
- threshold monitoring
- notification
- predictive analytics
- forecasting
- machine learning
- anomaly detection

---

# 47. Future Alerting

Contoh rule:

```text
IF rainfall_today > threshold
THEN create alert
```

```text
IF temperature_max > threshold
THEN create alert
```

```text
IF qc_flag = 1
THEN create data quality alert
```

Alert system belum wajib untuk MVP.

---

# 48. Reporting

Sediakan opsi:

- Export CSV
- Export Excel
- Print dashboard
- PDF report
- Metabase question export

Format laporan:

```text
Title
Period
Station
Summary KPI
Charts
Interpretation
Data quality note
Generated timestamp
```

---

# 49. Data Dictionary

Dokumen `docs/data-dictionary.md` wajib dibuat.

Isi:

- column source
- target column
- type
- unit
- nullable
- allowed range
- transformation
- sentinel
- source definition
- display label

Contoh:

```text
Source: tbk_avg
Target: temp_avg
Type: numeric
Unit: °C
Nullable: true
Transformation: direct numeric conversion
```

---

# 50. Naming Convention

## Database

snake_case:

```text
climate_observations
monthly_climate_summary
```

## TypeScript

camelCase:

```text
getClimateSummary
```

## Components

PascalCase:

```text
TemperatureChart.tsx
```

## API

kebab-case atau resource-based:

```text
/api/observations/temperature
```

---

# 51. Accessibility

Wajib:

- semantic HTML
- keyboard navigation
- readable contrast
- chart descriptions
- tooltip yang jelas
- tidak bergantung pada warna saja untuk status
- accessible table headers

---

# 52. Observability

Production dapat ditingkatkan dengan:

- error tracking
- application logs
- database monitoring
- health endpoint

Contoh:

```http
GET /api/health
```

Response:

```json
{
  "status": "ok",
  "database": "connected"
}
```

---

# 53. Backup

PostgreSQL harus memiliki strategi backup.

Minimum:

- daily backup production
- retention policy
- tested restore

Jangan menganggap file CSV sebagai satu-satunya backup.

---

# 54. Migration Strategy

Setiap perubahan database harus menggunakan migration.

Contoh:

```bash
npx prisma migrate dev
```

Production:

```bash
npx prisma migrate deploy
```

Jangan mengubah schema production secara manual tanpa migration tracking.

---

# 55. Recommended Development Sequence

## Step 1
Buat repository.

## Step 2
Setup Next.js + TypeScript.

## Step 3
Setup Tailwind CSS.

## Step 4
Setup React Bits.

## Step 5
Setup PostgreSQL.

## Step 6
Setup Prisma.

## Step 7
Buat migration.

## Step 8
Import CSV ke raw table.

## Step 9
Build normalization pipeline.

## Step 10
Populate cleaned observation table.

## Step 11
Build API.

## Step 12
Build dashboard shell.

## Step 13
Build KPI.

## Step 14
Build charts.

## Step 15
Build filters.

## Step 16
Build quality dashboard.

## Step 17
Setup Metabase.

## Step 18
Connect Metabase ke PostgreSQL.

## Step 19
Build Metabase dashboards.

## Step 20
Integrate/embed Metabase ke Next.js.

## Step 21
Testing.

## Step 22
Performance tuning.

## Step 23
Security review.

## Step 24
Documentation.

---

# 56. Definition of Done

Project dianggap selesai untuk versi pertama apabila:

- [ ] Database schema final.
- [ ] Migration tersedia.
- [ ] CSV importer tersedia.
- [ ] Data cleaning tersedia.
- [ ] Data quality validation tersedia.
- [ ] API tersedia.
- [ ] Dashboard Next.js tersedia.
- [ ] KPI tersedia.
- [ ] Line chart tersedia.
- [ ] Bar chart tersedia.
- [ ] Pie chart tersedia.
- [ ] Area chart tersedia.
- [ ] Scatter plot tersedia.
- [ ] Date filtering tersedia.
- [ ] Data table tersedia.
- [ ] Metabase connected.
- [ ] Metabase dashboards tersedia.
- [ ] Metabase integration tersedia.
- [ ] Loading/error state tersedia.
- [ ] Responsive tersedia.
- [ ] Security baseline diterapkan.
- [ ] README tersedia.
- [ ] Data dictionary tersedia.
- [ ] Deployment guide tersedia.

---

# 57. Catatan Penting Sebelum Coding

1. Jangan memasukkan nilai `8888` dan `9999` sebagai angka valid ke grafik.
2. Jangan menghapus raw data.
3. Jangan melakukan transformasi weather event tanpa menyimpan bentuk raw.
4. Jangan menghitung statistik di client jika dapat dilakukan di PostgreSQL.
5. Jangan mengambil seluruh dataset ke browser untuk chart.
6. Jangan menggunakan credential Metabase/database di frontend.
7. Jangan menggunakan `latest` untuk image Docker pada deployment yang harus reproducible.
8. Jangan membuat dashboard hanya bergantung pada satu tool. Next.js harus tetap menjadi application layer dan Metabase menjadi analytics layer.
9. Jangan menyimpulkan makna ilmiah suatu kolom hanya berdasarkan nama field. Unit dan definisi final harus diverifikasi terhadap data dictionary/sumber resmi BMKG sebelum laporan formal digunakan.

---

# 58. Target Hasil Akhir

Hasil akhir yang ditargetkan:

```text
Climate Monitoring System
│
├── Dashboard Monitoring
│   ├── KPI
│   ├── Temperature
│   ├── Rainfall
│   ├── Humidity
│   ├── Wind
│   └── Quality Control
│
├── Data Management
│   ├── Import CSV
│   ├── Validation
│   ├── Cleaning
│   └── Audit
│
├── Analytics
│   ├── Metabase
│   ├── Advanced Charts
│   └── Reports
│
└── Infrastructure
    ├── Next.js
    ├── PostgreSQL
    ├── Metabase
    └── Docker
```

---

# 59. Status Implementasi

Pada tahap berikutnya project dapat mulai dikerjakan dari urutan:

```text
SPEC.md
   ↓
Database Schema
   ↓
CSV Importer
   ↓
Data Cleaning
   ↓
Seed
   ↓
API
   ↓
Dashboard UI
   ↓
Charts
   ↓
Metabase
   ↓
Integration
   ↓
Testing
```

Dokumen ini menjadi baseline teknis sebelum implementasi kode dimulai.

---

# 60. Design System dan Visual Identity

Desain web harus menggunakan identitas visual yang terinspirasi dari karakter warna logo BMKG yang dilampirkan, terutama kombinasi **biru** dan **hijau**. Warna tersebut menjadi identitas utama sistem, tetapi implementasi UI tidak boleh menyalin logo atau identitas merek secara berlebihan.

## 60.1 Konsep Visual

Arah desain:

- Profesional
- Modern
- Clean
- Data-centric
- Mudah dibaca
- Memiliki nuansa meteorologi dan klimatologi
- Dominan biru dan hijau
- Menggunakan warna netral untuk menjaga keterbacaan grafik

Komposisi warna:

```text
Biru       → identitas utama, navigasi, header, informasi
Hijau      → indikator positif, lingkungan, kondisi normal
Putih      → background utama dan ruang visual
Slate/Grey → teks sekunder, border, background pendukung
Merah      → warning/error saja
Kuning     → attention/warning tertentu
```

## 60.2 Palet Warna

Gunakan design tokens agar seluruh aplikasi konsisten.

### Primary Blue

```text
Primary 900: #063B8C
Primary 800: #084FA8
Primary 700: #0B5ED7
Primary 600: #1677E8
Primary 500: #2F80ED
Primary 100: #DBEAFE
Primary 50 : #EFF6FF
```

Biru digunakan untuk:

- Navbar
- Sidebar
- Primary button
- Active navigation
- Link
- KPI utama
- Informasi cuaca
- Elemen identitas aplikasi

### Secondary Green

```text
Green 900: #006B14
Green 800: #008A1B
Green 700: #00A51A
Green 600: #12B82A
Green 500: #22C55E
Green 100: #DCFCE7
Green 50 : #F0FDF4
```

Hijau digunakan untuk:

- Status normal
- KPI positif
- Data valid
- Indikator lingkungan
- Chart tertentu
- Accent
- Success state

### Neutral

```text
Background: #F8FAFC
Surface:    #FFFFFF
Border:     #E2E8F0
Text:       #0F172A
Text Muted: #64748B
Text Soft:  #94A3B8
```

### Semantic Colors

```text
Success: #16A34A
Warning: #F59E0B
Danger:  #DC2626
Info:    #2563EB
```

Warna semantic hanya digunakan untuk menyampaikan status. Jangan menggunakan warna tersebut sebagai dekorasi tanpa makna.

---

# 61. Visual Relationship Biru dan Hijau

Kombinasi utama aplikasi:

```text
          BLUE
     Information
          │
          │
          ▼
     Monitoring
          │
          ▼
         GREEN
      Normal State
```

Gunakan biru sebagai warna identitas utama dan hijau sebagai warna pendukung.

Contoh:

```text
Primary Button     → Blue
Active Sidebar     → Blue
Selected Filter    → Blue
Normal Status      → Green
Valid Data         → Green
Success            → Green
Warning            → Amber
Error              → Red
```

Jangan menggunakan kombinasi biru dan hijau secara berlebihan pada satu komponen. Gunakan satu warna dominan dan satu accent.

---

# 62. Dashboard Theme

## 62.1 Light Mode

Default dashboard menggunakan light mode.

Contoh:

```text
Page Background
#F8FAFC

Card
#FFFFFF

Primary
#0B5ED7

Secondary
#00A51A

Border
#E2E8F0
```

Card:

```text
background: white
border: 1px solid #E2E8F0
border-radius: 14px
box-shadow: subtle
```

## 62.2 Dark Mode

Dark mode dapat disediakan sebagai fitur lanjutan.

Base:

```text
Background: #020617
Surface:    #0F172A
Surface 2:  #1E293B
Text:       #F8FAFC
Muted:      #94A3B8
```

Biru dan hijau harus tetap memiliki contrast yang baik pada dark mode.

---

# 63. Header Design

Header:

```text
┌──────────────────────────────────────────────────────────────┐
│ [LOGO] Climate Monitoring        Search       🔔   Profile │
└──────────────────────────────────────────────────────────────┘
```

Karakter:

- background putih atau biru tua
- border bawah tipis
- sticky
- tinggi sekitar 64px
- logo dan nama aplikasi di kiri
- utility action di kanan

Nama aplikasi yang direkomendasikan:

```text
Climate Monitoring
```

atau:

```text
BMKG Climate Monitoring
```

Untuk sistem internal, nama dapat disesuaikan dengan nama unit/stasiun.

---

# 64. Sidebar Design

Sidebar menggunakan primary blue sebagai identitas.

```text
┌─────────────────────┐
│ LOGO                │
│ Climate Monitoring  │
├─────────────────────┤
│ Dashboard           │
│ Temperature         │
│ Rainfall            │
│ Humidity            │
│ Wind                │
│ Quality Control     │
│ Metabase            │
├─────────────────────┤
│ Settings            │
└─────────────────────┘
```

Active state:

```text
background: blue
text: white
icon: white
```

Hover:

```text
background: blue-50
text: blue-700
```

Sidebar pada mobile berubah menjadi drawer.

---

# 65. Logo dan Branding

Logo BMKG yang diberikan digunakan sebagai **referensi visual untuk arah warna dan karakter desain**.

Aturan:

- Jangan mengubah logo asli.
- Jangan mengubah proporsi logo.
- Jangan menggunakan logo sebagai background besar.
- Jika logo resmi digunakan dalam aplikasi, gunakan file resmi dengan sumber yang sesuai.
- Letakkan logo pada area branding, bukan di setiap card.
- Pastikan ukuran logo tetap jelas dan proporsional.

Untuk versi prototype internal, dapat digunakan placeholder logo dengan ukuran yang konsisten.

Rekomendasi:

```text
Desktop Header:
Logo height: 32-40px

Sidebar:
Logo height: 36-44px

Login Page:
Logo height: 64-96px
```

---

# 66. Card Design

Kartu KPI:

```text
┌──────────────────────────────┐
│ Average Temperature      🌡  │
│                              │
│ 27.6 °C                      │
│ +0.8% from previous period   │
└──────────────────────────────┘
```

Karakter:

- white surface
- rounded 14-16px
- border subtle
- shadow minimal
- icon menggunakan blue/green
- angka besar
- label jelas

Jangan menggunakan gradient berat pada setiap card.

Gradient hanya boleh digunakan untuk accent tertentu.

---

# 67. KPI Color Rules

Contoh:

```text
Temperature
Blue

Rainfall
Green

Humidity
Blue

Wind
Green

Quality
Green jika normal
Amber jika warning
Red jika critical
```

Warna KPI harus konsisten dengan makna, bukan berdasarkan preferensi visual semata.

---

# 68. Chart Design System

Semua chart harus memiliki:

- title
- subtitle bila diperlukan
- legend bila terdapat beberapa series
- tooltip
- axis label yang relevan
- format unit
- empty state
- loading state

Contoh:

```text
Daily Temperature
01 Jan 2025 - 31 Dec 2025

Legend:
● Min
● Average
● Max
```

---

# 69. Chart Color Palette

Gunakan palet yang konsisten.

```text
Temperature Avg  → Blue
Temperature Max  → Green
Temperature Min  → Slate

Rainfall         → Green
Humidity         → Blue
Pressure         → Slate
Wind             → Green
QC Warning       → Amber
QC Error         → Red
```

Untuk chart multi-series, gunakan kombinasi yang tetap dapat dibedakan tanpa mengandalkan warna saja.

---

# 70. Line Chart Style

Line:

```text
stroke-width: 2
rounded line
smooth rendering bila tidak mengubah interpretasi data
```

Gunakan dot hanya ketika diperlukan.

Untuk dataset harian 365 record, dot tidak perlu selalu ditampilkan agar grafik tetap bersih.

---

# 71. Area Chart Style

Area chart menggunakan:

```text
base line: blue/green
fill: low opacity
```

Tujuan area chart:

- memperlihatkan volume
- trend
- akumulasi

Hindari opacity tinggi yang membuat grid dan label sulit dibaca.

---

# 72. Bar Chart Style

Gunakan rounded bar dengan radius kecil.

Contoh:

```text
Monthly Rainfall

Jan  ███████████
Feb  ███████
Mar  █████████████
```

Warna utama:

```text
Blue atau Green
```

Jika menunjukkan perbandingan status, gunakan warna semantic.

---

# 73. Pie / Donut Chart Style

Gunakan donut chart untuk dashboard utama.

Contoh:

```text
Weather Events
        ╭────╮
     ╭──      ──╮
    │    42%     │
     ╰──      ──╯
        ╰────╯
```

Tampilkan:

- percentage
- label
- total
- tooltip

Jangan menggunakan terlalu banyak kategori dalam satu pie chart.

Jika kategori terlalu banyak, gunakan bar chart.

---

# 74. Scatter Plot Style

Scatter plot:

```text
X Axis
Y Axis
Grid
Tooltip
Regression line optional
```

Contoh:

```text
Temperature vs Humidity

Humidity %
100 |             •
 90 |       •  •
 80 |   • •  •
 70 | •
    └────────────────────
      20  25  30  35
          Temp °C
```

Regression line bersifat opsional dan harus diberi label jika digunakan.

---

# 75. Background Visual

Background utama tidak boleh menggunakan pola yang terlalu ramai.

Pilihan:

```text
#F8FAFC
```

Dapat ditambahkan decorative background sangat ringan menggunakan:

- radial gradient
- grid pattern
- dots
- blur effect

Namun opacity harus rendah agar tidak mengganggu data.

---

# 76. React Bits Usage

React Bits digunakan untuk memperkuat UX, bukan menggantikan informasi.

Contoh penggunaan:

### Counter

KPI:

```text
27.6 °C
```

### Animated Gradient

Hero atau login page.

### Background Effect

Landing page atau overview.

### Hover Effect

Card dan navigation.

### Entrance Animation

Dashboard load.

Animasi tidak boleh:

- memperlambat interaction
- mengganggu chart
- membuat angka sulit dibaca
- berjalan terlalu agresif

Gunakan `prefers-reduced-motion` untuk accessibility.

---

# 77. Typography

Font utama yang direkomendasikan:

```text
Inter
```

Alternatif:

```text
Geist
```

Hierarchy:

```text
H1: 28-36px
H2: 22-28px
H3: 18-22px
Body: 14-16px
Caption: 12-13px
KPI: 28-36px
```

Gunakan font weight:

```text
Regular
Medium
Semibold
Bold
```

Jangan menggunakan terlalu banyak weight.

---

# 78. Border Radius

Standar:

```text
Card: 14-16px
Button: 10-12px
Input: 10-12px
Badge: 9999px
Modal: 16px
```

Tujuan:

UI terlihat modern tetapi tetap profesional.

---

# 79. Spacing

Gunakan spacing berbasis kelipatan 4 atau 8.

Contoh:

```text
4px
8px
12px
16px
20px
24px
32px
40px
48px
```

Jangan memberikan spacing acak antar komponen.

---

# 80. Component Architecture

Komponen visual:

```text
components/
├── layout/
│   ├── AppShell.tsx
│   ├── Sidebar.tsx
│   ├── Header.tsx
│   └── MobileNav.tsx
│
├── dashboard/
│   ├── KpiCard.tsx
│   ├── SummaryCard.tsx
│   ├── ChartCard.tsx
│   └── FilterBar.tsx
│
├── charts/
│   ├── TemperatureLineChart.tsx
│   ├── RainfallAreaChart.tsx
│   ├── MonthlyBarChart.tsx
│   ├── WeatherDonutChart.tsx
│   ├── HumidityLineChart.tsx
│   └── ClimateScatterChart.tsx
│
└── ui/
    ├── Button.tsx
    ├── Badge.tsx
    ├── Card.tsx
    ├── Select.tsx
    ├── DateRangePicker.tsx
    └── DataTable.tsx
```

---

# 81. UX State

Setiap halaman dashboard harus memiliki:

## Loading

```text
Skeleton KPI
Skeleton Chart
Skeleton Table
```

## Empty

```text
No data available for selected period.
```

## Error

```text
Unable to load monitoring data.
Please try again.
```

## Success

Data ditampilkan normal.

---

# 82. Status Badge

Gunakan badge:

```text
NORMAL
WARNING
CRITICAL
VALID
INVALID
```

Contoh:

```text
● NORMAL
● WARNING
● CRITICAL
```

Jangan hanya menggunakan warna. Sertakan teks/status agar accessible.

---

# 83. Filter UX

Filter utama berada di bagian atas:

```text
┌───────────────────────────────────────────────────────────┐
│ Date Range   Station   Parameter   QC   Weather   Apply  │
└───────────────────────────────────────────────────────────┘
```

Filter harus:

- mudah ditemukan
- tetap terlihat saat diperlukan
- dapat di-reset
- menampilkan state aktif
- tidak menyebabkan full page reload bila tidak diperlukan

Tambahkan:

```text
Reset Filter
```

---

# 84. Responsive Grid

Desktop:

```text
grid-cols-4
```

Tablet:

```text
grid-cols-2
```

Mobile:

```text
grid-cols-1
```

Chart:

Desktop:

```text
2-column
```

Mobile:

```text
1-column
```

---

# 85. Design Tokens untuk Tailwind

Gunakan semantic token, bukan hard-coded color di setiap komponen.

Contoh konsep:

```css
--color-primary: #0B5ED7;
--color-primary-dark: #063B8C;
--color-secondary: #00A51A;
--color-background: #F8FAFC;
--color-surface: #FFFFFF;
--color-border: #E2E8F0;
--color-text: #0F172A;
--color-muted: #64748B;
```

Tailwind harus menggunakan token tersebut melalui theme configuration atau pendekatan CSS variable yang konsisten.

---

# 86. Suggested Tailwind Mapping

Contoh penggunaan:

```text
bg-primary
text-primary
border-primary

bg-secondary
text-secondary

bg-surface
text-foreground
text-muted
border-border
```

Tujuannya agar perubahan brand color dapat dilakukan dari satu tempat.

---

# 87. Visual Priority

Prioritas visual dashboard:

```text
1. KPI
2. Trend
3. Comparison
4. Distribution
5. Correlation
6. Raw table
```

Pengguna harus dapat memahami kondisi sistem dalam beberapa detik tanpa membaca seluruh tabel.

---

# 88. Design Acceptance Criteria

Desain dianggap sesuai apabila:

- [ ] Biru menjadi primary brand color.
- [ ] Hijau menjadi secondary/accent color.
- [ ] Background tetap ringan dan netral.
- [ ] Dashboard terlihat profesional dan tidak terlalu ramai.
- [ ] KPI mudah ditemukan.
- [ ] Chart memiliki hierarchy yang jelas.
- [ ] Semua chart memiliki tooltip.
- [ ] Status tidak hanya dibedakan dengan warna.
- [ ] Responsive di desktop/tablet/mobile.
- [ ] Logo tidak terdistorsi.
- [ ] Animasi React Bits tidak mengganggu data.
- [ ] Kontras teks memenuhi kebutuhan accessibility.
- [ ] UI menggunakan design tokens.
- [ ] Semua komponen visual konsisten.

---

# 89. Final Design Direction

Identitas visual final:

```text
                BMKG-inspired
                     │
              ┌──────┴──────┐
              │             │
            BLUE          GREEN
          Primary        Accent
              │             │
              └──────┬──────┘
                     │
                 WHITE UI
                     │
              Clean Dashboard
                     │
           Data Visualization
                     │
             Climate Monitoring
```

Aplikasi harus terasa seperti **sistem monitoring profesional**, bukan sekadar halaman kumpulan grafik.

Warna biru memberikan identitas utama sistem, sedangkan hijau memperkuat konteks lingkungan dan klimatologi. Warna netral menjaga chart, angka, tabel, dan status tetap menjadi fokus utama pengguna.

---

# 90. Update Scope Project

Dengan tambahan design system ini, scope project sekarang mencakup:

```text
DATA
├── CSV
├── ETL
├── Validation
├── Normalization
└── Quality Control

BACKEND
├── Next.js
├── Prisma
├── PostgreSQL
└── API

FRONTEND
├── Tailwind CSS
├── React Bits
├── Responsive UI
├── Design System
└── Accessibility

VISUALIZATION
├── Line
├── Area
├── Bar
├── Pie/Donut
├── Scatter
├── KPI
└── Data Table

ANALYTICS
├── Metabase
├── Embedded Dashboard
└── Advanced Analysis

VISUAL IDENTITY
├── BMKG-inspired Blue
├── BMKG-inspired Green
├── Neutral Background
├── Consistent Components
└── Professional Monitoring UI
```

Dokumen ini sekarang menjadi baseline untuk implementasi **fungsi, database, dashboard, analytics, dan visual design**.
