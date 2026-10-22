'use client';

import { useEffect, useState } from 'react';
import { ExternalLink, Database, BarChart3, LayoutDashboard } from 'lucide-react';

export default function MetabasePage() {
  const [metabaseUrl, setMetabaseUrl] = useState('http://localhost:33001');

  useEffect(() => {
    const host = window.location.hostname;
    setMetabaseUrl(`http://${host}:33001`);
  }, []);

  return (
    <div className="h-[70vh] flex flex-col items-center justify-center bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl shadow-sm p-8 text-center">
      <div className="flex space-x-4 mb-6">
        <div className="p-4 bg-blue-50 text-[var(--color-primary)] rounded-2xl">
          <Database className="w-10 h-10" />
        </div>
        <div className="p-4 bg-teal-50 text-teal-600 rounded-2xl">
          <BarChart3 className="w-10 h-10" />
        </div>
        <div className="p-4 bg-purple-50 text-purple-600 rounded-2xl">
          <LayoutDashboard className="w-10 h-10" />
        </div>
      </div>
      
      <h2 className="text-3xl font-bold mb-4 text-[var(--color-text-main)]">Advanced Analytics Hub</h2>
      <p className="text-[var(--color-muted)] max-w-lg mb-8 text-lg">
        Metabase is running securely on your server. Due to modern browser security policies, full-screen analytics platforms are best viewed in a dedicated window.
      </p>
      
      <a 
        href={metabaseUrl} 
        target="_blank" 
        rel="noopener noreferrer"
        className="inline-flex items-center px-6 py-3 bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] transition-colors text-white font-semibold rounded-xl shadow-md text-lg"
      >
        Open Metabase Studio
        <ExternalLink className="ml-2 w-5 h-5" />
      </a>
      
      <div className="mt-8 text-sm text-[var(--color-muted)] bg-[var(--color-background)] px-6 py-4 rounded-lg border border-[var(--color-border)] text-left max-w-lg">
        <h4 className="font-semibold text-[var(--color-text-main)] mb-2">What you can do in Metabase:</h4>
        <ul className="list-disc pl-5 space-y-1">
          <li>Create custom dashboards using drag-and-drop.</li>
          <li>Query the <span className="font-mono bg-white px-1 py-0.5 rounded border border-gray-200">climate_monitoring</span> database.</li>
          <li>Set up automated email or Slack alerts for weather anomalies.</li>
        </ul>
      </div>
    </div>
  );
}
