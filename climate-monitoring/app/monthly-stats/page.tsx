'use client';

import { useEffect, useState } from 'react';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend, ReferenceLine
} from 'recharts';
import { motion } from 'framer-motion';
import { Droplets, Sun, Thermometer, Wind, BarChart3, TrendingUp, AlertTriangle, Download } from 'lucide-react';

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } }
};
const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
};

const MONTH_LABELS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

// Custom tooltip
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-3 text-xs">
        <p className="font-bold text-gray-700 mb-2">{label}</p>
        {payload.map((p: any, i: number) => (
          <div key={i} className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 rounded-full" style={{ background: p.color }}></div>
            <span className="text-gray-500">{p.name}:</span>
            <span className="font-bold text-gray-800">{p.value}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

// Stat card at top
const StatCard = ({ icon: Icon, label, value, unit, color, sub }: any) => (
  <motion.div variants={itemVariants} className="bg-white rounded-2xl p-5 shadow-[0_4px_20px_rgb(0,0,0,0.04)] border border-gray-50 flex items-center gap-4">
    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${color}`}>
      <Icon className="w-6 h-6 text-white" />
    </div>
    <div>
      <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">{label}</p>
      <p className="text-2xl font-bold text-gray-800">{value} <span className="text-sm font-medium text-gray-400">{unit}</span></p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  </motion.div>
);

export default function MonthlyStatsPage() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeParam, setActiveParam] = useState<'temperature' | 'humidity' | 'rainfall' | 'sunshine' | 'wind'>('rainfall');

  useEffect(() => {
    fetch('/api/monthly-stats')
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); });
  }, []);

  if (loading) return (
    <div className="h-full flex items-center justify-center min-h-[60vh]">
      <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }} className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full" />
    </div>
  );

  // Yearly totals
  const totalRainfall = data.reduce((s, d) => s + (d.total_rainfall || 0), 0).toFixed(1);
  const totalSunshine = data.reduce((s, d) => s + (d.total_sunshine || 0), 0).toFixed(1);
  const avgTemp = data.length ? (data.reduce((s, d) => s + (d.avg_temp_avg || 0), 0) / data.length).toFixed(1) : '-';
  const avgHumidity = data.length ? (data.reduce((s, d) => s + (d.avg_humidity_avg || 0), 0) / data.length).toFixed(1) : '-';
  const totalWarningDays = data.reduce((s, d) => s + (d.warning_days || 0), 0);
  const maxRainfallMonth = data.reduce((prev, cur) => (cur.total_rainfall > (prev?.total_rainfall || 0) ? cur : prev), data[0]);

  const paramTabs = [
    { id: 'rainfall', label: 'Curah Hujan (RR)', icon: Droplets },
    { id: 'temperature', label: 'Suhu', icon: Thermometer },
    { id: 'humidity', label: 'Kelembapan', icon: BarChart3 },
    { id: 'sunshine', label: 'Penyinaran', icon: Sun },
    { id: 'wind', label: 'Angin', icon: Wind },
  ] as const;

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="pb-12">
      {/* Header */}
      <motion.div variants={itemVariants} className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Statistik Bulanan</h1>
          <p className="text-gray-400 text-sm">Rata-rata & Total per Parameter — Jan s/d Des 2025 · Stasiun Tunggul Wulung</p>
        </div>
        <button
          onClick={() => {
            const header = ['Bulan','Σ Hujan (mm)','Avg Hujan/hari','Avg Suhu (°C)','Max Suhu','Min Suhu','Avg RH (%)','Σ Penyinaran (jam)','Avg Angin (km/h)','Max Angin (knot)','Warning Days'];
            const rows = data.map(d => [d.month_label, d.total_rainfall, d.avg_rainfall, d.avg_temp_avg, d.avg_temp_max, d.avg_temp_min, d.avg_humidity_avg, d.total_sunshine, d.avg_wind_kmh, d.avg_wind_max_knot, d.warning_days]);
            const csv = [header, ...rows].map(r => r.join(',')).join('\n');
            const blob = new Blob([csv], { type: 'text/csv' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a'); a.href = url; a.download = 'statistik-bulanan-2025.csv'; a.click();
          }}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-blue-700 transition-colors shadow-md shadow-blue-200"
        >
          <Download className="w-4 h-4" /> Export CSV
        </button>
      </motion.div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard icon={Droplets} label="Total Hujan 2025" value={totalRainfall} unit="mm" color="bg-blue-500" sub={`Terbanyak: ${maxRainfallMonth?.month_label || '-'}`} />
        <StatCard icon={Sun} label="Total Penyinaran" value={totalSunshine} unit="jam" color="bg-orange-400" sub="Sepanjang tahun 2025" />
        <StatCard icon={Thermometer} label="Rata-rata Suhu" value={avgTemp} unit="°C" color="bg-red-400" sub="Rata-rata tahunan" />
        <StatCard icon={AlertTriangle} label="Hari Bermasalah" value={totalWarningDays} unit="hari" color="bg-yellow-500" sub="QC Flag > 0" />
      </div>

      {/* Parameter Tabs */}
      <motion.div variants={itemVariants} className="bg-white rounded-3xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-50 mb-6">
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {paramTabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveParam(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all
                  ${activeParam === tab.id ? 'bg-blue-600 text-white shadow-md shadow-blue-200' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
              >
                <Icon className="w-3.5 h-3.5" /> {tab.label}
              </button>
            );
          })}
        </div>

        {/* RAINFALL CHART */}
        {activeParam === 'rainfall' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-800">Total Curah Hujan per Bulan (mm)</h3>
              <div className="flex gap-3 text-xs font-semibold">
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-blue-500 inline-block"></span>Total (mm)</span>
                <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-blue-300 inline-block"></span>Avg/hari</span>
              </div>
            </div>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis dataKey="month_label" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#9ca3af' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#9ca3af' }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="total_rainfall" name="Total Hujan (mm)" fill="#3b82f6" radius={[6, 6, 0, 0]} barSize={28} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* TEMPERATURE CHART */}
        {activeParam === 'temperature' && (
          <div>
            <h3 className="font-bold text-gray-800 mb-4">Rata-rata Suhu per Bulan (°C)</h3>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis dataKey="month_label" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#9ca3af' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#9ca3af' }} domain={['dataMin - 1', 'dataMax + 1']} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Line type="monotone" dataKey="avg_temp_max" name="Avg T-Max (°C)" stroke="#ef4444" strokeWidth={3} dot={{ r: 5, fill: '#fff', strokeWidth: 2 }} activeDot={{ r: 7 }} />
                  <Line type="monotone" dataKey="avg_temp_avg" name="Avg T-Avg (°C)" stroke="#22c55e" strokeWidth={3} dot={{ r: 5, fill: '#fff', strokeWidth: 2 }} activeDot={{ r: 7 }} />
                  <Line type="monotone" dataKey="avg_temp_min" name="Avg T-Min (°C)" stroke="#3b82f6" strokeWidth={3} dot={{ r: 5, fill: '#fff', strokeWidth: 2 }} activeDot={{ r: 7 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* HUMIDITY CHART */}
        {activeParam === 'humidity' && (
          <div>
            <h3 className="font-bold text-gray-800 mb-4">Rata-rata Kelembapan Udara per Bulan (%)</h3>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis dataKey="month_label" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#9ca3af' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#9ca3af' }} domain={[50, 100]} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Line type="monotone" dataKey="avg_humidity0700" name="RH 07:00 (%)" stroke="#ec4899" strokeWidth={2.5} dot={{ r: 4, fill: '#fff', strokeWidth: 2 }} />
                  <Line type="monotone" dataKey="avg_humidity1300" name="RH 13:00 (%)" stroke="#3b82f6" strokeWidth={2.5} dot={{ r: 4, fill: '#fff', strokeWidth: 2 }} />
                  <Line type="monotone" dataKey="avg_humidity1800" name="RH 18:00 (%)" stroke="#22d3ee" strokeWidth={2.5} dot={{ r: 4, fill: '#fff', strokeWidth: 2 }} />
                  <Line type="monotone" dataKey="avg_humidity_avg" name="RH Avg (%)" stroke="#a855f7" strokeWidth={3} strokeDasharray="5 3" dot={{ r: 5, fill: '#fff', strokeWidth: 2 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* SUNSHINE CHART */}
        {activeParam === 'sunshine' && (
          <div>
            <h3 className="font-bold text-gray-800 mb-4">Total Lama Penyinaran Matahari per Bulan (jam)</h3>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis dataKey="month_label" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#9ca3af' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#9ca3af' }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="total_sunshine" name="Total Penyinaran (jam)" fill="#f59e0b" radius={[6, 6, 0, 0]} barSize={28} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* WIND CHART */}
        {activeParam === 'wind' && (
          <div>
            <h3 className="font-bold text-gray-800 mb-4">Rata-rata Kecepatan Angin per Bulan</h3>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis dataKey="month_label" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#9ca3af' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#9ca3af' }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Line type="monotone" dataKey="avg_wind_kmh" name="Avg Angin (km/h)" stroke="#3b82f6" strokeWidth={3} dot={{ r: 5, fill: '#fff', strokeWidth: 2 }} activeDot={{ r: 7 }} />
                  <Line type="monotone" dataKey="avg_wind_max_knot" name="Avg Max Angin (knot)" stroke="#f97316" strokeWidth={3} dot={{ r: 5, fill: '#fff', strokeWidth: 2 }} activeDot={{ r: 7 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </motion.div>

      {/* Full Table */}
      <motion.div variants={itemVariants} className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-50 overflow-hidden">
        <div className="p-6 border-b border-gray-50">
          <h3 className="font-bold text-gray-800">Tabel Statistik Lengkap per Bulan</h3>
          <p className="text-xs text-gray-400 mt-1">Semua parameter iklim · Rata-rata & Total · Tahun 2025</p>
        </div>
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-xs text-left">
            <thead className="bg-gray-50 text-gray-500 uppercase font-semibold">
              <tr>
                <th className="px-5 py-4 whitespace-nowrap sticky left-0 bg-gray-50">Bulan</th>
                <th className="px-5 py-4 whitespace-nowrap text-right">Hari</th>
                <th className="px-5 py-4 whitespace-nowrap text-right text-blue-700 bg-blue-50">Σ Hujan (mm)</th>
                <th className="px-5 py-4 whitespace-nowrap text-right">Avg Hujan/hari</th>
                <th className="px-5 py-4 whitespace-nowrap text-right text-red-600">Avg T-Max (°C)</th>
                <th className="px-5 py-4 whitespace-nowrap text-right">Avg T-Avg (°C)</th>
                <th className="px-5 py-4 whitespace-nowrap text-right text-blue-600">Avg T-Min (°C)</th>
                <th className="px-5 py-4 whitespace-nowrap text-right">T07:00</th>
                <th className="px-5 py-4 whitespace-nowrap text-right">T13:00</th>
                <th className="px-5 py-4 whitespace-nowrap text-right">T18:00</th>
                <th className="px-5 py-4 whitespace-nowrap text-right text-purple-600 bg-purple-50">Avg RH (%)</th>
                <th className="px-5 py-4 whitespace-nowrap text-right">RH 07:00</th>
                <th className="px-5 py-4 whitespace-nowrap text-right">RH 13:00</th>
                <th className="px-5 py-4 whitespace-nowrap text-right">RH 18:00</th>
                <th className="px-5 py-4 whitespace-nowrap text-right text-orange-600 bg-orange-50">Σ Sinar (jam)</th>
                <th className="px-5 py-4 whitespace-nowrap text-right">Avg Sinar/hari</th>
                <th className="px-5 py-4 whitespace-nowrap text-right">Avg Angin (km/h)</th>
                <th className="px-5 py-4 whitespace-nowrap text-right">Avg Max Angin (knot)</th>
                <th className="px-5 py-4 whitespace-nowrap text-right text-yellow-700">⚠ Hari Masalah</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {data.map((row, idx) => (
                <tr key={row.month} className={`hover:bg-blue-50/30 transition-colors ${row.warning_days > 0 ? 'bg-red-50/20' : ''}`}>
                  <td className="px-5 py-3.5 font-bold text-gray-800 sticky left-0 bg-white whitespace-nowrap">{row.month_label}</td>
                  <td className="px-5 py-3.5 text-right text-gray-500">{row.total_days}</td>
                  <td className="px-5 py-3.5 text-right font-bold text-blue-700 bg-blue-50/30">{row.total_rainfall ?? '-'}</td>
                  <td className="px-5 py-3.5 text-right">{row.avg_rainfall ?? '-'}</td>
                  <td className="px-5 py-3.5 text-right text-red-600 font-semibold">{row.avg_temp_max ?? '-'}</td>
                  <td className="px-5 py-3.5 text-right font-semibold">{row.avg_temp_avg ?? '-'}</td>
                  <td className="px-5 py-3.5 text-right text-blue-600 font-semibold">{row.avg_temp_min ?? '-'}</td>
                  <td className="px-5 py-3.5 text-right text-gray-500">{row.avg_temp0700 ?? '-'}</td>
                  <td className="px-5 py-3.5 text-right text-gray-500">{row.avg_temp1300 ?? '-'}</td>
                  <td className="px-5 py-3.5 text-right text-gray-500">{row.avg_temp1800 ?? '-'}</td>
                  <td className="px-5 py-3.5 text-right font-bold text-purple-700 bg-purple-50/30">{row.avg_humidity_avg ?? '-'}</td>
                  <td className="px-5 py-3.5 text-right text-gray-500">{row.avg_humidity0700 ?? '-'}</td>
                  <td className="px-5 py-3.5 text-right text-gray-500">{row.avg_humidity1300 ?? '-'}</td>
                  <td className="px-5 py-3.5 text-right text-gray-500">{row.avg_humidity1800 ?? '-'}</td>
                  <td className="px-5 py-3.5 text-right font-bold text-orange-600 bg-orange-50/30">{row.total_sunshine ?? '-'}</td>
                  <td className="px-5 py-3.5 text-right text-gray-500">{row.avg_sunshine ?? '-'}</td>
                  <td className="px-5 py-3.5 text-right">{row.avg_wind_kmh ?? '-'}</td>
                  <td className="px-5 py-3.5 text-right">{row.avg_wind_max_knot ?? '-'}</td>
                  <td className="px-5 py-3.5 text-right">
                    {row.warning_days > 0 ? (
                      <span className="inline-flex items-center gap-1 bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full font-bold">
                        ⚠ {row.warning_days}
                      </span>
                    ) : (
                      <span className="text-green-500 font-bold">✓ 0</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
            {/* Totals row */}
            <tfoot className="bg-gray-50 border-t-2 border-gray-200 font-bold text-gray-800">
              <tr>
                <td className="px-5 py-4 sticky left-0 bg-gray-50">TOTAL / AVG</td>
                <td className="px-5 py-4 text-right">{data.reduce((s,d) => s+(d.total_days||0), 0)}</td>
                <td className="px-5 py-4 text-right text-blue-700 bg-blue-50">{totalRainfall}</td>
                <td className="px-5 py-4 text-right">-</td>
                <td className="px-5 py-4 text-right text-red-600">{data.length ? (data.reduce((s,d)=>s+(d.avg_temp_max||0),0)/data.length).toFixed(2) : '-'}</td>
                <td className="px-5 py-4 text-right">{avgTemp}</td>
                <td className="px-5 py-4 text-right text-blue-600">{data.length ? (data.reduce((s,d)=>s+(d.avg_temp_min||0),0)/data.length).toFixed(2) : '-'}</td>
                <td className="px-5 py-4 text-right">-</td>
                <td className="px-5 py-4 text-right">-</td>
                <td className="px-5 py-4 text-right">-</td>
                <td className="px-5 py-4 text-right text-purple-700 bg-purple-50">{avgHumidity}</td>
                <td className="px-5 py-4 text-right">-</td>
                <td className="px-5 py-4 text-right">-</td>
                <td className="px-5 py-4 text-right">-</td>
                <td className="px-5 py-4 text-right text-orange-600 bg-orange-50">{totalSunshine}</td>
                <td className="px-5 py-4 text-right">-</td>
                <td className="px-5 py-4 text-right">-</td>
                <td className="px-5 py-4 text-right">-</td>
                <td className="px-5 py-4 text-right text-yellow-700">{totalWarningDays}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </motion.div>
    </motion.div>
  );
}
