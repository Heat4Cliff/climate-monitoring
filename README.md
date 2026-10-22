# Climate Monitoring Dashboard & BMKG Data Analysis

Sistem monitoring dan visualisasi data klimatologi interaktif berbasis **Next.js 15**, **PostgreSQL**, dan **Metabase**. Proyek ini mengolah data observasi iklim harian (Form Fklim 71) menjadi dashboard analitik interaktif, kalender pemantauan anomali cuaca (QC Warning), serta rekapitulasi statistik bulanan.

---

## 🚀 Fitur Utama

- **Web Dashboard Interaktif (Next.js & Recharts):**
  - KPI ringkasan tahunan (Curah hujan total, rata-rata suhu harian, kelembapan rata-rata, kecepatan angin).
  - Grafik tren harian interaktif suhu udara dan curah hujan.
  - **Kalender Pemantauan Anomali (QC Flag):** Menandai tanggal observasi yang memiliki warning anomali / missing data lengkap dengan detail status.
- **Statistik Bulanan (`/monthly-stats`):**
  - Rekapitulasi agregasi bulanan (Januari – Desember) untuk seluruh 23 parameter iklim (rata-rata dan total per parameter).
  - Visualisasi tren musiman dan fitur export rekap ke CSV.
- **Tabel Data Lengkap (`/data`):**
  - Penjelajah data observasi harian lengkap dengan pencarian, pagination, dan sorting.
- **Integrasi Metabase BI:**
  - Visualisasi business intelligence dan otomasi kartu agregasi via script Python.
- **Containerized Stack:**
  - Terintegrasi penuh menggunakan Docker Compose (PostgreSQL, Metabase, Node.js/Next.js).

---

## 🛠️ Tech Stack

- **Frontend & Fullstack:** Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS, Lucide React, Framer Motion
- **Visualisasi Data:** Recharts
- **Database & ORM:** PostgreSQL 15, Prisma ORM
- **BI & Analytics:** Metabase
- **DevOps:** Docker & Docker Compose

---

## 📁 Struktur Direktori

```text
.
├── climate-monitoring/          # Aplikasi Web Next.js 15
│   ├── app/                    # App router (dashboard, data, monthly-stats, API)
│   ├── components/             # Reusable UI components (Sidebar, DataTable, KpiCard)
│   ├── prisma/                 # Prisma schema & migrasi database
│   ├── scripts/                # Skrip ETL data CSV ke PostgreSQL
│   ├── docker-compose.yml      # Orkestrasi Docker (Postgres, Metabase, Next.js)
│   └── Dockerfile              # Container image app
├── create_metabase_dashboard.py # Skrip otomasi pembuatan dashboard di Metabase
├── Penjelasan_Dashboard_Klimatologi.docx # Dokumentasi teknis & rumus perhitungan
├── specs.md                    # Dokumen spesifikasi teknis proyek
└── README.md
```

---

## ⚙️ Cara Menjalankan

### 1. Prasyarat
- Docker & Docker Compose
- Node.js 20+ (opsional jika dijalankan langsung tanpa Docker)

### 2. Konfigurasi Lingkungan
Salin file environment template:
```bash
cd climate-monitoring
cp .env.example .env
```

### 3. Menjalankan Layanan (Docker Compose)
Jalankan seluruh service (PostgreSQL, Metabase, dan Next.js):
```bash
docker compose up -d
```

- **Aplikasi Web:** [http://localhost:3010](http://localhost:3010)
- **Metabase BI:** [http://localhost:33001](http://localhost:33001)
- **PostgreSQL Database:** `localhost:55432` (User: `postgres`, Pass: `postgrespassword`, DB: `climate_monitoring`)

### 4. Migrasi Database & Import Data
Di dalam direktori `climate-monitoring`:
```bash
# Generate Prisma Client & Migrate DB
npx prisma db push

# Menjalankan script import CSV
npx ts-node scripts/import-csv.ts
```

---

## 🔒 Kebijakan Data Sensitif

Sesuai standar keamanan data dan privasi observasi BMKG:
- File data mentah observasi (`*.csv`, `*.xlsx`, `*.xls`) dan file rahasia lingkungan (`.env*`) telah dikecualikan dan diamankan dalam `.gitignore` sehingga tidak dipublikasikan ke repositori publik.
