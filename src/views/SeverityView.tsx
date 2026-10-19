import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  ShieldAlert,
  BarChart2,
  PieChart,
  Car,
  Clock,
  MapPin,
  HelpCircle,
  TrendingDown
} from 'lucide-react';
import { Doughnut, Bar } from 'react-chartjs-2';
import '../utils/chartSetup.js';
import { SeverityStats } from '../types.js';

export const SeverityView: React.FC = () => {
  const [data, setData] = useState<SeverityStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadSeverity() {
      setLoading(true);
      try {
        const res = await fetch('/api/analytics/severity');
        const json = await res.json();
        if (json.success) {
          setData(json.data);
        }
      } catch (err) {
        console.error('Failed to load severity analytics:', err);
      } finally {
        setLoading(false);
      }
    }
    loadSeverity();
  }, []);

  const totalKnown = data?.totalKnownSeverity || 0;
  const missingSeverity = data?.missingSeverityCount || 0;

  const severityColors: Record<string, string> = {
    'Fatal': '#E11D48',
    'Serious Injury': '#EA580C',
    'Minor Injury': '#0284C7',
    'Property Damage Only': '#64748B'
  };

  // Doughnut Chart Data
  const doughnutData = {
    labels: (data?.distribution || []).map(d => d.severity),
    datasets: [
      {
        data: (data?.distribution || []).map(d => d.count),
        backgroundColor: (data?.distribution || []).map(d => severityColors[d.severity] || '#94A3B8'),
        borderColor: '#FFFFFF',
        borderWidth: 2
      }
    ]
  };

  // Severity by Region Bar Chart
  const regionNames = Array.from(new Set((data?.severityByRegion || []).map(r => r.region)));
  const severityLevels = ['Fatal', 'Serious Injury', 'Minor Injury', 'Property Damage Only'];

  const regionDatasets = severityLevels.map(level => {
    return {
      label: level,
      data: regionNames.map(region => {
        const item = (data?.severityByRegion || []).find(r => r.region === region && r.severity === level);
        return item ? item.count : 0;
      }),
      backgroundColor: severityColors[level],
      borderRadius: 3
    };
  });

  const regionChart = {
    labels: regionNames,
    datasets: regionDatasets
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Overview Metric Cards */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs mb-1">
            <span>Verified Known Severity</span>
            <AlertTriangle className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
            {totalKnown.toLocaleString()}
          </div>
          <span className="block text-[11px] text-slate-400 mt-0.5">Categorized Incident Records</span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs mb-1">
            <span>Missing Severity Data</span>
            <HelpCircle className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-amber-700 font-mono tabular-nums">
            {missingSeverity.toLocaleString()}
          </div>
          <span className="block text-[11px] text-slate-400 mt-0.5">Records without injury tier</span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs mb-1">
            <span>Fatal Crash Ratio</span>
            <ShieldAlert className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl font-bold text-rose-700 font-mono tabular-nums">
            {totalKnown > 0
              ? `${(
                  (((data?.distribution.find(d => d.severity === 'Fatal')?.count || 0) / totalKnown) * 100)
                ).toFixed(1)}%`
              : '0.0%'}
          </div>
          <span className="block text-[11px] text-slate-400 mt-0.5">Recorded fatal outcomes</span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs mb-1">
            <span>Property Damage Only</span>
            <Car className="w-4 h-4 text-slate-500" />
          </div>
          <div className="text-2xl font-bold text-slate-700 font-mono tabular-nums">
            {totalKnown > 0
              ? `${(
                  (((data?.distribution.find(d => d.severity === 'Property Damage Only')?.count || 0) / totalKnown) * 100)
                ).toFixed(1)}%`
              : '0.0%'}
          </div>
          <span className="block text-[11px] text-slate-400 mt-0.5">Non-injury collisions</span>
        </div>
      </section>

      {/* Percentage Breakdown Cards */}
      <section className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
        <h3 className="font-bold text-slate-900 text-base">Recorded Severity Classifications</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {(data?.distribution || []).map((d, idx) => {
            const pct = totalKnown > 0 ? ((d.count / totalKnown) * 100).toFixed(1) : '0';
            const color = severityColors[d.severity] || '#64748B';
            return (
              <div key={idx} className="p-4 rounded-lg bg-slate-50 border border-slate-200 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-slate-900 text-xs">{d.severity}</span>
                    <span className="font-mono text-xs font-bold text-slate-900 tabular-nums">{pct}%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${pct}%`, backgroundColor: color }}
                    />
                  </div>
                </div>
                <div className="mt-3 text-[11px] text-slate-500 font-mono tabular-nums">
                  {d.count.toLocaleString()} occurrences
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Charts: Distribution & Regional Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Doughnut distribution */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Severity Proportion</h3>
              <p className="text-xs text-slate-500">Relative casualty distribution in dataset</p>
            </div>
            <PieChart className="w-4 h-4 text-slate-400" />
          </div>

          <div className="h-64 flex items-center justify-center">
            <div className="w-56 h-56">
              <Doughnut
                data={doughnutData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: { position: 'bottom', labels: { boxWidth: 10, font: { size: 10 } } }
                  },
                  cutout: '60%'
                }}
              />
            </div>
          </div>
        </div>

        {/* Severity by Region */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Severity by Region</h3>
              <p className="text-xs text-slate-500">Cross-tabulation across jurisdictions</p>
            </div>
            <MapPin className="w-4 h-4 text-slate-400" />
          </div>

          <div className="h-64">
            <Bar
              data={regionChart}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: { position: 'bottom', labels: { boxWidth: 10, font: { size: 10 } } }
                },
                scales: {
                  x: { stacked: true, grid: { display: false } },
                  y: { stacked: true, beginAtZero: true }
                }
              }}
            />
          </div>
        </div>
      </div>

      {/* Analytical Interpretation Context */}
      <div className="p-5 bg-slate-100 rounded-xl border border-slate-200 text-xs text-slate-600 space-y-2">
        <div className="font-semibold text-slate-900 flex items-center gap-1.5">
          <ShieldAlert className="w-4 h-4 text-slate-700" />
          <span>Understanding Severity Distributions Safely</span>
        </div>
        <p className="leading-relaxed">
          The preponderance of Property Damage Only (PDO) collisions is typical of municipal collision surveillance systems. 
          Higher proportions of severe or fatal outcomes in specific outer regions often correlate with higher roadway speed limits 
          (e.g., rural state highways vs. urban gridlock) rather than driver behavior differences alone.
        </p>
      </div>
    </div>
  );
};
