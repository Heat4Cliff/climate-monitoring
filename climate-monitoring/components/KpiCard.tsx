import React from 'react';
import { LucideIcon } from 'lucide-react';

interface KpiCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  colorClass?: string;
}

export function KpiCard({ title, value, icon: Icon, colorClass = "text-blue-600" }: KpiCardProps) {
  return (
    <div className="bg-[var(--color-surface)] border border-[var(--color-border)] p-6 rounded-2xl shadow-sm flex items-center justify-between">
      <div>
        <h3 className="text-[var(--color-muted)] text-sm font-medium mb-1">{title}</h3>
        <p className="text-3xl font-bold text-[var(--color-text-main)]">{value}</p>
      </div>
      <div className={`p-3 rounded-full bg-opacity-10 ${colorClass}`}>
        <Icon size={24} />
      </div>
    </div>
  );
}
