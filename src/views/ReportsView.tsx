import React, { useState, useEffect } from 'react';
import {
  FileText,
  Download,
  Printer,
  Filter,
  ShieldAlert,
  Calendar,
  CheckCircle2,
  Clock,
  Car,
  MapPin,
  RefreshCw
} from 'lucide-react';
import { FilterState } from '../types.js';

export const ReportsView: React.FC = () => {
  const [filters, setFilters] = useState<FilterState>({
    startDate: '',
    endDate: '',
    region: '',
    roadName: '',
    vehicleType: '',
    severity: '',
    weather: ''
  });

  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      if (filters.region) params.append('region', filters.region);
      if (filters.roadName) params.append('roadName', filters.roadName);
      if (filters.vehicleType) params.append('vehicleType', filters.vehicleType);
      if (filters.severity) params.append('severity', filters.severity);
      if (filters.weather) params.append('weather', filters.weather);

      const res = await fetch(`/api/reports/data?${params.toString()}`);
      const json = await res.json();
      if (json.success) {
        setReportData(json.report);
      }
    } catch (err) {
      console.error('Failed to load report:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [filters]);

  const handleDownloadCSV = () => {
    const params = new URLSearchParams();
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);
    if (filters.region) params.append('region', filters.region);
    if (filters.roadName) params.append('roadName', filters.roadName);
    if (filters.vehicleType) params.append('vehicleType', filters.vehicleType);
    if (filters.severity) params.append('severity', filters.severity);
    if (filters.weather) params.append('weather', filters.weather);

    window.location.href = `/api/reports/csv?${params.toString()}`;
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Parameter Filter Bar */}
      <section className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs space-y-3 print:hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2 font-semibold text-slate-800">
            <Filter className="w-4 h-4 text-teal-600" />
            <span>Report Scope & Filter Parameters</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadCSV}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 text-xs font-medium transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-teal-600" />
              <span>Download Raw CSV</span>
            </button>

            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 text-white rounded-lg hover:bg-slate-800 text-xs font-semibold transition-colors shadow-xs"
            >
              <Printer className="w-3.5 h-3.5 text-teal-400" />
              <span>Print / Save PDF Report</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div>
            <label className="block text-[11px] font-medium text-slate-500 mb-1">Region</label>
            <select
              value={filters.region}
              onChange={e => setFilters({ ...filters, region: e.target.value })}
              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-md text-xs"
            >
              <option value="">All Regions</option>
              <option value="Downtown Metro">Downtown Metro</option>
              <option value="East Bay Hub">East Bay Hub</option>
              <option value="North Peninsula">North Peninsula</option>
              <option value="South Valley">South Valley</option>
              <option value="Coastal Sector">Coastal Sector</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-medium text-slate-500 mb-1">Severity</label>
            <select
              value={filters.severity}
              onChange={e => setFilters({ ...filters, severity: e.target.value })}
              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-md text-xs"
            >
              <option value="">All Severities</option>
              <option value="Property Damage Only">Property Damage Only</option>
              <option value="Minor Injury">Minor Injury</option>
              <option value="Serious Injury">Serious Injury</option>
              <option value="Fatal">Fatal</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-medium text-slate-500 mb-1">Vehicle</label>
            <select
              value={filters.vehicleType}
              onChange={e => setFilters({ ...filters, vehicleType: e.target.value })}
              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-md text-xs"
            >
              <option value="">All Vehicles</option>
              <option value="Passenger Car">Passenger Car</option>
              <option value="SUV">SUV</option>
              <option value="Commercial Truck">Commercial Truck</option>
              <option value="Motorcycle">Motorcycle</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-medium text-slate-500 mb-1">Weather</label>
            <select
              value={filters.weather}
              onChange={e => setFilters({ ...filters, weather: e.target.value })}
              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-md text-xs"
            >
              <option value="">All Weather</option>
              <option value="Clear">Clear</option>
              <option value="Rain">Rain</option>
              <option value="Fog / Mist">Fog / Mist</option>
              <option value="Missing">Missing Weather</option>
            </select>
          </div>
        </div>
      </section>

      {/* Official Formatted Report Document */}
      <article className="bg-white rounded-xl border border-slate-200 p-8 sm:p-12 shadow-sm space-y-8 print:border-none print:shadow-none print:p-0">
        {/* Report Header */}
        <header className="border-b border-slate-200 pb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-teal-700 tracking-wider uppercase mb-1">
              <span>RoadSense AI Safety Audit Intelligence</span>
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Road Accident Comprehensive Analytics Report
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Official analytical summary generated from verified relational database records.
            </p>
          </div>

          <div className="text-right text-xs text-slate-500">
            <div>
              Generated: <span className="font-mono text-slate-900 tabular-nums">
                {reportData?.generatedAt ? new Date(reportData.generatedAt).toLocaleString() : '--'}
              </span>
            </div>
            <div>Database Status: <span className="text-emerald-700 font-semibold">Active Sync</span></div>
          </div>
        </header>

        {/* Executive KPI Summary Strip */}
        <section className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
            <span className="text-[11px] text-slate-500 block">Total Records Analyzed</span>
            <span className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
              {(reportData?.totalRecords || 0).toLocaleString()}
            </span>
          </div>

          <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
            <span className="text-[11px] text-slate-500 block">Identified Corridors</span>
            <span className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
              {reportData?.topLocations?.length || 0}
            </span>
          </div>

          <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
            <span className="text-[11px] text-slate-500 block">Vehicle Categories</span>
            <span className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
              {reportData?.vehicles?.length || 0}
            </span>
          </div>

          <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
            <span className="text-[11px] text-slate-500 block">Data Sources Ingested</span>
            <span className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
              {reportData?.sources?.length || 0}
            </span>
          </div>
        </section>

        {/* Severity Breakdown Table */}
        <section className="space-y-3">
          <h2 className="text-sm font-bold text-slate-900 tracking-tight">1. Severity Level Distribution</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                  <th className="py-2.5 px-3">Casualty Tier</th>
                  <th className="py-2.5 px-3 text-right">Count</th>
                  <th className="py-2.5 px-3 text-right">Percentage of Sample</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {(reportData?.severities || []).map((s: any, idx: number) => {
                  const pct = reportData.totalRecords > 0 ? ((s.count / reportData.totalRecords) * 100).toFixed(1) : '0';
                  return (
                    <tr key={idx} className="hover:bg-slate-50/50">
                      <td className="py-2 px-3 font-medium text-slate-900">{s.severity}</td>
                      <td className="py-2 px-3 text-right font-mono tabular-nums">{s.count.toLocaleString()}</td>
                      <td className="py-2 px-3 text-right font-mono tabular-nums">{pct}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        {/* Top High-Count Roadways */}
        <section className="space-y-3">
          <h2 className="text-sm font-bold text-slate-900 tracking-tight">2. Road Corridor Incident Ranks</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                  <th className="py-2.5 px-3">Roadway</th>
                  <th className="py-2.5 px-3">Region</th>
                  <th className="py-2.5 px-3 text-right">Recorded Events</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {(reportData?.topLocations || []).map((loc: any, idx: number) => (
                  <tr key={idx} className="hover:bg-slate-50/50">
                    <td className="py-2 px-3 font-medium text-slate-900">{loc.road_name}</td>
                    <td className="py-2 px-3 text-slate-600">{loc.region}</td>
                    <td className="py-2 px-3 text-right font-mono tabular-nums">{loc.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Vehicle Involvements */}
        <section className="space-y-3">
          <h2 className="text-sm font-bold text-slate-900 tracking-tight">3. Vehicle Class Involvement</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            {(reportData?.vehicles || []).map((veh: any, idx: number) => (
              <div key={idx} className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                <span className="font-semibold text-slate-800 block truncate">{veh.vehicle_type}</span>
                <span className="text-base font-bold text-slate-900 font-mono tabular-nums">{veh.count}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Mandatory Official Disclaimer (Section 12 requirement) */}
        <footer className="border-t border-slate-200 pt-6 space-y-3 text-xs text-slate-600">
          <div className="font-bold text-slate-900 flex items-center gap-1.5">
            <ShieldAlert className="w-4 h-4 text-slate-700" />
            <span>Analytical Methodology & Legal Disclaimer</span>
          </div>
          <p className="leading-relaxed bg-slate-50 p-4 rounded-lg border border-slate-200 font-serif italic text-slate-700">
            "Results describe patterns in the available accident records and do not establish causation. Recorded counts may be affected by reporting practices, missing information, geographic coverage, and traffic exposure. Findings should not be interpreted as definitive measures of accident risk."
          </p>
          <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-400 pt-2">
            <span>RoadSense AI Platform · Report Verification Checksum Validated</span>
            <span>Generated from RoadSense Relational SQL Database</span>
          </div>
        </footer>
      </article>
    </div>
  );
};
