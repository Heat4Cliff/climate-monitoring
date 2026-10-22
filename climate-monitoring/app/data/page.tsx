'use client';

import { useEffect, useState } from 'react';
import { DataTable } from '@/components/DataTable';
import { Database } from 'lucide-react';
import { motion } from 'framer-motion';

export default function DataPage() {
  const [tableData, setTableData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/observations/all')
      .then(res => res.json())
      .then(data => {
        setTableData(data.map((d: any) => ({
          ...d,
          date: d.date || d.observedAt
        })));
        setLoading(false);
      });
  }, []);

  if (loading) return (
    <div className="h-full flex items-center justify-center min-h-[60vh]">
      <div className="animate-pulse flex flex-col items-center">
        <Database className="w-10 h-10 text-[var(--color-primary)] mb-4 animate-bounce" />
        <p className="text-[var(--color-muted)] font-medium">Loading massive climate database...</p>
      </div>
    </div>
  );

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-8"
    >
      <div className="bg-[var(--color-surface)] p-6 rounded-3xl border border-[var(--color-border)] shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
          <div>
            <h2 className="text-2xl font-bold text-[var(--color-text-main)] mb-1">Raw Observations Database</h2>
            <p className="text-sm text-[var(--color-muted)]">Complete historical record of 365 days of climate data.</p>
          </div>
          <div className="text-sm font-bold text-[var(--color-primary)] bg-[var(--color-primary-light)] px-4 py-2 rounded-xl shadow-inner">
            {tableData.length} Records Loaded
          </div>
        </div>
        <DataTable data={tableData} />
      </div>
    </motion.div>
  );
}
