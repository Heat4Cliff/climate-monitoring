'use client';

import { useEffect, useState } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { motion } from 'framer-motion';
import { CheckCircle2, AlertCircle, Wind, Sun } from 'lucide-react';

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
};

export default function Dashboard() {
  const [summary, setSummary] = useState<any>(null);
  const [dailyData, setDailyData] = useState<any[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date(2025, 0, 1));
  const [selectedDate, setSelectedDate] = useState<number | null>(null);
  const [hourlyTempView, setHourlyTempView] = useState(false);

  // Calendar logic
  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
  
  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    setSelectedDate(null);
  }
  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    setSelectedDate(null);
  }

  useEffect(() => {
    fetch('/api/dashboard/summary').then(res => res.json()).then(setSummary);
    fetch('/api/observations/temperature').then(res => res.json()).then(data => {
      const mapped = data.map((d: any) => ({
        ...d,
        date: new Date(d.observedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
        dayOnly: new Date(d.observedAt).getDate().toString().padStart(2, '0'),
        parsedObservedAt: new Date(d.observedAt)
      }));
      setDailyData(mapped);
    });
  }, []);

  if (!summary || dailyData.length === 0) return (
    <div className="h-full flex items-center justify-center min-h-[60vh]">
      <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ repeat: Infinity, duration: 1.5 }} className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
    </div>
  );

  const top30Days = dailyData.slice(0, 30);

  // Calendar specific data
  const getDayData = (day: number) => {
    return dailyData.find(d => d.parsedObservedAt.getMonth() === currentDate.getMonth() && d.parsedObservedAt.getDate() === day && d.parsedObservedAt.getFullYear() === currentDate.getFullYear());
  };

  const getAlertsForDate = (dayData: any) => {
    if (!dayData) return [];
    let alerts = [];
    if (dayData.qcFlag > 0) alerts.push({ type: 'warning', msg: `Quality Control Warning: Level ${dayData.qcFlag}` });
    const missingKeys = Object.entries(dayData).filter(([k, v]) => v === '8888' || v === '9999').map(([k]) => k);
    if (missingKeys.length > 0) alerts.push({ type: 'error', msg: `Missing/Invalid data in: ${missingKeys.join(', ')}` });
    return alerts;
  };

  const activeDayData = (selectedDate ? getDayData(selectedDate) : dailyData[0]) || {};

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="max-w-[1400px] mx-auto pb-12">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
          <p className="text-gray-400 text-sm">BMKG Climate Analytics Overview</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* TOP LEFT: Large Bar Chart */}
        <motion.div variants={itemVariants} className="lg:col-span-2 bg-white rounded-3xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-50">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-gray-800">Rainfall Activity (RR)</h3>
          </div>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={top30Days}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="dayOnly" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#9ca3af'}} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#9ca3af'}} />
                <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                <Bar dataKey="rainfallMm" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* TOP RIGHT: Calendar & Tasks */}
        <motion.div variants={itemVariants} className="bg-white rounded-3xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-50 flex flex-col min-h-[380px]">
          <div className="flex justify-between items-center mb-4">
            <div>
              <span className="text-blue-500 font-bold text-sm">{currentDate.getFullYear()}/{String(currentDate.getMonth() + 1).padStart(2, '0')}</span>
              <h3 className="font-bold text-gray-800 text-lg">{currentDate.toLocaleString('default', { month: 'long' })}</h3>
            </div>
            <div className="flex gap-2">
              <button onClick={handlePrevMonth} className="w-8 h-8 bg-blue-50 rounded-full flex items-center justify-center text-blue-600 hover:bg-blue-100 transition-colors">&lt;</button>
              <button onClick={handleNextMonth} className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white shadow-md shadow-blue-200 hover:bg-blue-700 transition-colors">&gt;</button>
            </div>
          </div>
          
          <div className="grid grid-cols-7 gap-1 text-center text-xs mb-4">
            {['S','M','T','W','T','F','S'].map((d, index) => <div key={`header-${index}`} className="text-gray-400 font-semibold py-1">{d}</div>)}
            {Array.from({length: firstDayOfMonth}).map((_, i) => <div key={`empty-${i}`} className="py-1.5" />)}
            
            {Array.from({length: daysInMonth}).map((_, i) => {
              const day = i + 1;
              const dayData = getDayData(day);
              const alerts = getAlertsForDate(dayData);
              const hasWarning = alerts.length > 0;
              const isSelected = selectedDate === day;

              return (
                <div 
                  key={`day-${i}`} 
                  onClick={() => setSelectedDate(day)}
                  className={`relative py-1.5 rounded-md cursor-pointer transition-colors
                    ${isSelected ? 'bg-blue-600 text-white shadow-md' : 'text-gray-600 hover:bg-blue-50'}`}
                >
                  {day}
                  {hasWarning && (
                    <div className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-red-500 border border-white shadow-sm"></div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="space-y-2 flex-1 overflow-y-auto pr-2 custom-scrollbar">
            {selectedDate ? (
              getAlertsForDate(getDayData(selectedDate)).length > 0 ? (
                getAlertsForDate(getDayData(selectedDate)).map((alert, idx) => (
                  <div key={idx} className={`border-l-4 p-3 rounded-r-xl ${alert.type === 'error' ? 'bg-red-50 border-red-500' : 'bg-orange-50 border-orange-500'}`}>
                    <div className={`flex items-center text-xs font-bold mb-1 ${alert.type === 'error' ? 'text-red-600' : 'text-orange-600'}`}>
                      <AlertCircle className="w-3 h-3 mr-1"/> {alert.type === 'error' ? 'Missing Data' : 'QC Warning'}
                    </div>
                    <p className="text-xs text-gray-600">{alert.msg}</p>
                  </div>
                ))
              ) : (
                <div className="bg-green-50 border-l-4 border-green-500 p-3 rounded-r-xl">
                  <div className="flex items-center text-xs text-green-600 font-bold mb-1"><CheckCircle2 className="w-3 h-3 mr-1"/> Data Valid</div>
                  <p className="text-xs text-gray-600">No issues found on this date.</p>
                </div>
              )
            ) : (
              <div className="text-center text-xs text-gray-400 mt-4 px-2 py-4 border border-dashed border-gray-200 rounded-lg bg-gray-50/50">
                Click a date on the calendar to see specific data alerts.
              </div>
            )}
          </div>
        </motion.div>

        {/* MIDDLE LEFT: Line Chart */}
        <motion.div variants={itemVariants} className="lg:col-span-2 bg-white rounded-3xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-50">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-gray-800">Temperature Overview</h3>
            
            <div className="flex items-center bg-gray-100 p-1 rounded-full text-xs">
              <button 
                onClick={() => setHourlyTempView(false)} 
                className={`px-3 py-1 rounded-full transition-colors ${!hourlyTempView ? 'bg-white shadow-sm font-bold text-gray-800' : 'text-gray-500 hover:text-gray-700'}`}
              >
                Min/Max/Avg
              </button>
              <button 
                onClick={() => setHourlyTempView(true)} 
                className={`px-3 py-1 rounded-full transition-colors ${hourlyTempView ? 'bg-white shadow-sm font-bold text-gray-800' : 'text-gray-500 hover:text-gray-700'}`}
              >
                Hourly (07, 13, 18)
              </button>
            </div>
          </div>
          
          <div className="flex gap-2 text-xs font-bold items-center mb-4">
            {!hourlyTempView ? (
              <>
                <span className="w-2 h-2 rounded-full bg-red-400"></span> Max
                <span className="w-2 h-2 rounded-full bg-green-500 ml-2"></span> Avg
                <span className="w-2 h-2 rounded-full bg-blue-500 ml-2"></span> Min
              </>
            ) : (
              <>
                <span className="w-2 h-2 rounded-full bg-orange-400"></span> 07:00
                <span className="w-2 h-2 rounded-full bg-red-500 ml-2"></span> 13:00
                <span className="w-2 h-2 rounded-full bg-purple-500 ml-2"></span> 18:00
              </>
            )}
          </div>

          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dailyData.slice(0, 15)}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#9ca3af'}} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#9ca3af'}} domain={['dataMin - 2', 'dataMax + 2']} />
                <Tooltip cursor={{ stroke: '#f0f0f0', strokeWidth: 2 }} contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                
                {!hourlyTempView ? (
                  <>
                    <Line type="monotone" dataKey="tempMax" stroke="#ef4444" strokeWidth={3} dot={{r: 4, strokeWidth: 2, fill: '#fff'}} activeDot={{r: 6}} />
                    <Line type="monotone" dataKey="tempAvg" stroke="#22c55e" strokeWidth={3} dot={{r: 4, strokeWidth: 2, fill: '#fff'}} activeDot={{r: 6}} />
                    <Line type="monotone" dataKey="tempMin" stroke="#3b82f6" strokeWidth={3} dot={{r: 4, strokeWidth: 2, fill: '#fff'}} activeDot={{r: 6}} />
                  </>
                ) : (
                  <>
                    <Line type="monotone" dataKey="temp0700" stroke="#f97316" strokeWidth={3} dot={{r: 4, strokeWidth: 2, fill: '#fff'}} activeDot={{r: 6}} />
                    <Line type="monotone" dataKey="temp1300" stroke="#ef4444" strokeWidth={3} dot={{r: 4, strokeWidth: 2, fill: '#fff'}} activeDot={{r: 6}} />
                    <Line type="monotone" dataKey="temp1800" stroke="#a855f7" strokeWidth={3} dot={{r: 4, strokeWidth: 2, fill: '#fff'}} activeDot={{r: 6}} />
                  </>
                )}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* MIDDLE RIGHT: Circular Progress / Stats */}
        <motion.div variants={itemVariants} className="bg-white rounded-3xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-50 grid grid-cols-2 gap-4">
          <div className="col-span-2 flex justify-between items-center mb-2">
            <h3 className="font-bold text-gray-800">Key Metrics</h3>
          </div>
          
          <div className="flex flex-col items-center justify-center p-4">
            <div className="relative w-20 h-20 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                <path className="text-gray-100" strokeWidth="3" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                <path className="text-blue-500" strokeWidth="3" strokeDasharray={`${summary.humidity.avg}, 100`} strokeLinecap="round" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
              </svg>
              <span className="absolute text-sm font-bold text-gray-700">{summary.humidity.avg}%</span>
            </div>
            <span className="text-xs text-gray-400 font-semibold mt-2">Avg Humidity</span>
          </div>

          <div className="flex flex-col items-center justify-center p-4">
            <div className="relative w-20 h-20 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                <path className="text-gray-100" strokeWidth="3" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                <path className="text-green-500" strokeWidth="3" strokeDasharray={`100, 100`} strokeLinecap="round" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
              </svg>
              <span className="absolute text-sm font-bold text-gray-700">100%</span>
            </div>
            <span className="text-xs text-gray-400 font-semibold mt-2">System Health</span>
          </div>
        </motion.div>

        {/* BOTTOM LEFT: Grouped Bar Chart */}
        <motion.div variants={itemVariants} className="lg:col-span-2 bg-white rounded-3xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-50 flex flex-col justify-center">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-gray-800">Humidity Levels (07:00, 13:00, 18:00)</h3>
            <div className="flex gap-2 text-xs font-bold items-center">
              <span className="w-2 h-2 rounded-full bg-pink-500"></span> 07:00
              <span className="w-2 h-2 rounded-full bg-blue-500 ml-2"></span> 13:00
              <span className="w-2 h-2 rounded-full bg-cyan-400 ml-2"></span> 18:00
            </div>
          </div>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={top30Days.slice(0,10)}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="dayOnly" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#9ca3af'}} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#9ca3af'}} />
                <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                <Bar dataKey="humidity0700" fill="#ec4899" radius={[4, 4, 0, 0]} barSize={8} />
                <Bar dataKey="humidity1300" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={8} />
                <Bar dataKey="humidity1800" fill="#22d3ee" radius={[4, 4, 0, 0]} barSize={8} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* BOTTOM RIGHT: Wind & Sunshine */}
        <motion.div variants={itemVariants} className="bg-white rounded-3xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-50 flex flex-col gap-4 justify-center">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-bold text-gray-800 text-sm">Selected Date Data</h3>
            <span className="text-xs text-blue-500 font-bold bg-blue-50 px-2 py-1 rounded-full">
              {activeDayData.date || '-'}
            </span>
          </div>

          <div className="bg-blue-50 rounded-2xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-500 text-white rounded-full flex items-center justify-center shadow-md">
                <Wind className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Wind (ff_avg)</p>
                <p className="text-xl font-bold text-gray-800">{activeDayData.windAvgKmh !== '8888' ? activeDayData.windAvgKmh : '-'} <span className="text-sm font-medium text-gray-500">km/h</span></p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-gray-400 font-semibold uppercase">Max (ff_x)</p>
              <p className="text-sm font-bold text-blue-600">{activeDayData.windMaxKnot !== '8888' ? activeDayData.windMaxKnot : '-'} Knot</p>
              <p className="text-[10px] text-gray-400 mt-1">{activeDayData.windMaxDirection !== '8888' ? activeDayData.windMaxDirection : '-'}</p>
            </div>
          </div>

          <div className="bg-orange-50 rounded-2xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-400 text-white rounded-full flex items-center justify-center shadow-md">
                <Sun className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Sunshine (ss)</p>
                <p className="text-xl font-bold text-gray-800">{activeDayData.sunshineHours !== '8888' ? activeDayData.sunshineHours : '-'} <span className="text-sm font-medium text-gray-500">Hours</span></p>
              </div>
            </div>
          </div>

        </motion.div>

      </div>
    </motion.div>
  );
}
