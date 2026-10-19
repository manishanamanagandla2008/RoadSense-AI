import React, { useState, useEffect } from 'react';
import {
  Clock,
  Calendar,
  TrendingUp,
  MapPin,
  Car,
  AlertTriangle,
  FileSpreadsheet,
  Info,
  ShieldAlert,
  Calculator
} from 'lucide-react';
import { Bar, Line } from 'react-chartjs-2';
import '../utils/chartSetup.js';
import { StatisticalSummary, LocationStats, VehicleStats, AnalyticsTrends } from '../types.js';

export const AnalyticsView: React.FC = () => {
  const [trends, setTrends] = useState<AnalyticsTrends | null>(null);
  const [stats, setStats] = useState<StatisticalSummary | null>(null);
  const [locations, setLocations] = useState<LocationStats | null>(null);
  const [vehicles, setVehicles] = useState<VehicleStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadAnalytics() {
      setLoading(true);
      try {
        const [trendsRes, statsRes, locRes, vehRes] = await Promise.all([
          fetch('/api/analytics/trends'),
          fetch('/api/analytics/statistics'),
          fetch('/api/analytics/locations'),
          fetch('/api/analytics/vehicles')
        ]);

        const [trendsJson, statsJson, locJson, vehJson] = await Promise.all([
          trendsRes.json(),
          statsRes.json(),
          locRes.json(),
          vehRes.json()
        ]);

        if (trendsJson.success) setTrends(trendsJson.data);
        if (statsJson.success) setStats(statsJson.data);
        if (locJson.success) setLocations(locJson.data);
        if (vehJson.success) setVehicles(vehJson.data);
      } catch (err) {
        console.error('Failed to load analytics:', err);
      } finally {
        setLoading(false);
      }
    }

    loadAnalytics();
  }, []);

  const weekdayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const weekdayCounts = Array(7).fill(0);
  if (trends?.weekday) {
    trends.weekday.forEach(w => {
      if (w.weekday >= 0 && w.weekday < 7) {
        weekdayCounts[w.weekday] = w.count;
      }
    });
  }

  // Weekday Chart
  const weekdayChart = {
    labels: weekdayNames,
    datasets: [
      {
        label: 'Accidents Recorded',
        data: weekdayCounts,
        backgroundColor: weekdayCounts.map((_, i) => (i === 0 || i === 6 ? '#0284C7' : '#0D9488')),
        borderRadius: 4
      }
    ]
  };

  // Rush Hour Hourly Chart
  const hoursLabels = Array.from({ length: 24 }, (_, i) => `${i}:00`);
  const hoursData = Array(24).fill(0);
  if (trends?.hourly) {
    trends.hourly.forEach(h => {
      if (h.hour >= 0 && h.hour < 24) hoursData[h.hour] = h.count;
    });
  }

  const hourlyChart = {
    labels: hoursLabels,
    datasets: [
      {
        label: 'Accidents',
        data: hoursData,
        backgroundColor: hoursData.map((_, h) => (h >= 7 && h <= 9) || (h >= 16 && h <= 19) ? '#DC2626' : '#64748B'),
        borderRadius: 3
      }
    ]
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Descriptive Statistical Summary Section (Section 9) */}
      <section className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calculator className="w-5 h-5 text-teal-600" />
            <div>
              <h2 className="font-bold text-slate-900 text-base">Descriptive Statistical Measures</h2>
              <p className="text-xs text-slate-500">
                Mathematical distribution metrics computed across recorded daily event series
              </p>
            </div>
          </div>
          <span className="text-[11px] font-mono text-slate-400 bg-slate-50 px-2 py-1 rounded border border-slate-200">
            N = {stats?.sampleSizeDays || 0} Observation Days
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 pt-2">
          <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
            <span className="block text-xs text-slate-500 font-medium">Daily Mean ($\mu$)</span>
            <span className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
              {stats?.meanDaily ?? '--'}
            </span>
            <span className="block text-[11px] text-slate-400 mt-0.5">Accidents / Day</span>
          </div>

          <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
            <span className="block text-xs text-slate-500 font-medium">Daily Median</span>
            <span className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
              {stats?.medianDaily ?? '--'}
            </span>
            <span className="block text-[11px] text-slate-400 mt-0.5">50th Percentile</span>
          </div>

          <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
            <span className="block text-xs text-slate-500 font-medium">Min Daily Count</span>
            <span className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
              {stats?.minDaily ?? '--'}
            </span>
            <span className="block text-[11px] text-slate-400 mt-0.5">Lowest recorded</span>
          </div>

          <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
            <span className="block text-xs text-slate-500 font-medium">Max Daily Count</span>
            <span className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
              {stats?.maxDaily ?? '--'}
            </span>
            <span className="block text-[11px] text-slate-400 mt-0.5">Peak single day</span>
          </div>

          <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
            <span className="block text-xs text-slate-500 font-medium">Standard Dev ($\sigma$)</span>
            <span className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
              {stats?.stdDev ?? '--'}
            </span>
            <span className="block text-[11px] text-slate-400 mt-0.5">Sample dispersion</span>
          </div>
        </div>

        <div className="flex items-start gap-2 p-3 bg-amber-50/60 border border-amber-200/60 rounded-lg text-amber-900 text-xs">
          <Info className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
          <p className="leading-relaxed">
            <strong>Statistical Rigor Notice:</strong> Calculations handle empty datasets and missing values safely. 
            Non-recorded days are not artificially replaced with zero unless continuous automated surveillance is verified.
          </p>
        </div>
      </section>

      {/* Time-Based Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Day of Week */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Day-of-Week Distribution</h3>
              <p className="text-xs text-slate-500">Comparative incident volume across weekdays vs weekends</p>
            </div>
            <Calendar className="w-4 h-4 text-slate-400" />
          </div>

          <div className="h-64">
            <Bar
              data={weekdayChart}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                  x: { grid: { display: false } },
                  y: { beginAtZero: true }
                }
              }}
            />
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2 text-xs border-t border-slate-100">
            <div className="p-2.5 bg-slate-50 rounded-md">
              <span className="text-slate-500 block text-[11px]">Weekday Incidents (Mon–Fri)</span>
              <span className="font-bold text-slate-900 font-mono text-sm tabular-nums">
                {trends?.weekdayVsWeekend.weekday || 0}
              </span>
            </div>
            <div className="p-2.5 bg-slate-50 rounded-md">
              <span className="text-slate-500 block text-[11px]">Weekend Incidents (Sat–Sun)</span>
              <span className="font-bold text-slate-900 font-mono text-sm tabular-nums">
                {trends?.weekdayVsWeekend.weekend || 0}
              </span>
            </div>
          </div>
        </div>

        {/* Hourly Rush Hour Bars */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Hourly Concentration & Rush Periods</h3>
              <p className="text-xs text-slate-500">Highlighted red bars indicate commuter rush periods (7-9am, 4-7pm)</p>
            </div>
            <Clock className="w-4 h-4 text-slate-400" />
          </div>

          <div className="h-64">
            <Bar
              data={hourlyChart}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                  x: { grid: { display: false } },
                  y: { beginAtZero: true }
                }
              }}
            />
          </div>

          <div className="p-2.5 bg-slate-50 rounded-md text-xs text-slate-600 border border-slate-100">
            Elevated frequencies align with commuter influx periods. Shift-change periods and evening dusk present heightened event counts.
          </div>
        </div>
      </div>

      {/* Location-Based Corridors & Road Safety Considerations */}
      <section className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-bold text-slate-900 text-base">High-Count Corridors & Road Segments</h2>
            <p className="text-xs text-slate-500">Ranking of road networks by recorded event frequency</p>
          </div>
          <MapPin className="w-5 h-5 text-slate-400" />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 font-medium">
                <th className="py-2.5 px-3">Roadway Name</th>
                <th className="py-2.5 px-3">Region</th>
                <th className="py-2.5 px-3 text-right">Recorded Accidents</th>
                <th className="py-2.5 px-3 text-right">Fatal Incidents</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {(locations?.roads || []).map((road, idx) => (
                <tr key={idx} className="hover:bg-slate-50/60">
                  <td className="py-2.5 px-3 font-medium text-slate-900">{road.road_name}</td>
                  <td className="py-2.5 px-3">{road.region}</td>
                  <td className="py-2.5 px-3 text-right font-mono font-semibold tabular-nums text-slate-900">
                    {road.count}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono font-semibold tabular-nums text-rose-600">
                    {road.fatal_count}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-600 space-y-1">
          <div className="font-semibold text-slate-900 flex items-center gap-1.5">
            <ShieldAlert className="w-4 h-4 text-slate-700" />
            <span>Geographic Precision & Traffic Exposure Mandate</span>
          </div>
          <p className="leading-relaxed">
            {locations?.disclaimer ||
              'A location having higher incident counts does not inherently signify that it is more dangerous. Without vehicle miles traveled (VMT) and average annual daily traffic (AADT), counts reflect traffic throughput as well as safety performance.'}
          </p>
        </div>
      </section>

      {/* Vehicle-Type Analysis & Exposure Warning */}
      <section className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-bold text-slate-900 text-base">Vehicle Classifications & Exposure Context</h2>
            <p className="text-xs text-slate-500">Involvement frequencies across commercial, public, and private vehicles</p>
          </div>
          <Car className="w-5 h-5 text-slate-400" />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {(vehicles?.vehicleSummary || []).map((v, idx) => (
            <div key={idx} className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <span className="block text-xs font-medium text-slate-700 truncate">{v.vehicle_type}</span>
              <span className="text-xl font-bold text-slate-900 font-mono tabular-nums">{v.count}</span>
              <span className="block text-[11px] text-slate-400">Total Recorded</span>
            </div>
          ))}
        </div>

        <div className="p-4 bg-blue-50/60 rounded-lg border border-blue-200/60 text-xs text-blue-900">
          <strong>Exposure Principle:</strong> Passenger cars dominate total incident tallies primarily because they comprise over 70% of circulating road traffic. Exposure data is essential before drawing relative risk inferences.
        </div>
      </section>
    </div>
  );
};
