import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  AlertTriangle,
  FileSpreadsheet,
  CheckCircle2,
  HelpCircle,
  Database,
  History,
  Info,
  Eye,
  X
} from 'lucide-react';
import { DataQualityReport, AccidentRecord } from '../types.js';

export const DataQualityView: React.FC = () => {
  const [quality, setQuality] = useState<DataQualityReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [inspectingRecord, setInspectingRecord] = useState<AccidentRecord | null>(null);

  useEffect(() => {
    async function loadQuality() {
      setLoading(true);
      try {
        const res = await fetch('/api/data-quality');
        const json = await res.json();
        if (json.success) {
          setQuality(json.data);
        }
      } catch (err) {
        console.error('Failed to load data quality:', err);
      } finally {
        setLoading(false);
      }
    }
    loadQuality();
  }, []);

  const total = quality?.totalRecords || 0;

  const getPct = (val: number) => {
    if (total === 0) return '0.0';
    return ((val / total) * 100).toFixed(1);
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Three Semantic Distinctions Banner (Section 13) */}
      <section className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-teal-600" />
          <h2 className="font-bold text-slate-900 text-base">Fundamental Data Rigor & Three-Way Distinction</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-1.5">
            <span className="font-bold text-slate-900 block text-xs">1. Zero Recorded Accidents</span>
            <p className="text-slate-600 leading-relaxed text-[11px]">
              A road segment where surveillance and reporting operate continuously, but zero collisions occurred during the evaluated time window.
            </p>
          </div>

          <div className="p-4 rounded-lg bg-amber-50/70 border border-amber-200 space-y-1.5">
            <span className="font-bold text-amber-900 block text-xs">2. Missing Accident Attributes</span>
            <p className="text-amber-800 leading-relaxed text-[11px]">
              An incident definitely occurred and was logged, but certain fields (e.g., weather condition, vehicle subtype) were left unrecorded by officers.
            </p>
          </div>

          <div className="p-4 rounded-lg bg-blue-50/70 border border-blue-200 space-y-1.5">
            <span className="font-bold text-blue-900 block text-xs">3. Uncollected Roadway Data</span>
            <p className="text-blue-800 leading-relaxed text-[11px]">
              Jurisdictions or private roads outside the surveillance program where incident data was never gathered. These are never inferred as zero.
            </p>
          </div>
        </div>
      </section>

      {/* Missingness Audit Grid */}
      <section className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-5">
        <div>
          <h3 className="font-bold text-slate-900 text-base">Field Completeness & Missingness Audit</h3>
          <p className="text-xs text-slate-500">
            Percentage and count of records lacking critical attributes in database (N = {total.toLocaleString()} total rows)
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
          {/* Missing Dates */}
          <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-800">Date & Time Field</span>
              <span className="font-mono font-bold text-slate-900 tabular-nums">
                {getPct(quality?.missingDates || 0)}% missing
              </span>
            </div>
            <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-slate-700 rounded-full"
                style={{ width: `${getPct(quality?.missingDates || 0)}%` }}
              />
            </div>
            <span className="text-[11px] text-slate-500 font-mono tabular-nums block">
              {quality?.missingDates || 0} records without timestamp
            </span>
          </div>

          {/* Missing Location */}
          <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-800">Geographic Region</span>
              <span className="font-mono font-bold text-slate-900 tabular-nums">
                {getPct(quality?.missingLocations || 0)}% missing
              </span>
            </div>
            <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-slate-700 rounded-full"
                style={{ width: `${getPct(quality?.missingLocations || 0)}%` }}
              />
            </div>
            <span className="text-[11px] text-slate-500 font-mono tabular-nums block">
              {quality?.missingLocations || 0} records without region
            </span>
          </div>

          {/* Missing Vehicle */}
          <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-800">Vehicle Classification</span>
              <span className="font-mono font-bold text-slate-900 tabular-nums">
                {getPct(quality?.missingVehicles || 0)}% missing
              </span>
            </div>
            <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-slate-700 rounded-full"
                style={{ width: `${getPct(quality?.missingVehicles || 0)}%` }}
              />
            </div>
            <span className="text-[11px] text-slate-500 font-mono tabular-nums block">
              {quality?.missingVehicles || 0} records without vehicle type
            </span>
          </div>

          {/* Missing Severity */}
          <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-800">Casualty Severity</span>
              <span className="font-mono font-bold text-slate-900 tabular-nums">
                {getPct(quality?.missingSeverity || 0)}% missing
              </span>
            </div>
            <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-rose-600 rounded-full"
                style={{ width: `${getPct(quality?.missingSeverity || 0)}%` }}
              />
            </div>
            <span className="text-[11px] text-slate-500 font-mono tabular-nums block">
              {quality?.missingSeverity || 0} records without severity tier
            </span>
          </div>

          {/* Missing Weather */}
          <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-800">Weather Condition</span>
              <span className="font-mono font-bold text-slate-900 tabular-nums">
                {getPct(quality?.missingWeather || 0)}% missing
              </span>
            </div>
            <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-amber-500 rounded-full"
                style={{ width: `${getPct(quality?.missingWeather || 0)}%` }}
              />
            </div>
            <span className="text-[11px] text-slate-500 font-mono tabular-nums block">
              {quality?.missingWeather || 0} records with missing weather
            </span>
          </div>

          {/* Missing GPS Coordinates */}
          <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-800">GPS Exact Coordinates</span>
              <span className="font-mono font-bold text-slate-900 tabular-nums">
                {getPct(quality?.missingCoordinates || 0)}% missing
              </span>
            </div>
            <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-600 rounded-full"
                style={{ width: `${getPct(quality?.missingCoordinates || 0)}%` }}
              />
            </div>
            <span className="text-[11px] text-slate-500 font-mono tabular-nums block">
              {quality?.missingCoordinates || 0} records without exact lat/long
            </span>
          </div>
        </div>
      </section>

      {/* Incomplete Records Inspector Table */}
      <section className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden space-y-3 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-slate-900 text-base">Incomplete Records Inspection</h3>
            <p className="text-xs text-slate-500">
              Inspect actual database rows that contain partial or missing attributes. These are retained in the database rather than discarded.
            </p>
          </div>
          <span className="text-xs font-mono text-slate-400">Sample of 15 incomplete rows</span>
        </div>

        <div className="overflow-x-auto pt-2">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                <th className="py-2.5 px-3">Record ID</th>
                <th className="py-2.5 px-3">Date</th>
                <th className="py-2.5 px-3">Region</th>
                <th className="py-2.5 px-3">Road</th>
                <th className="py-2.5 px-3">Vehicle</th>
                <th className="py-2.5 px-3">Severity</th>
                <th className="py-2.5 px-3">Weather</th>
                <th className="py-2.5 px-3 text-right">Inspect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {(quality?.incompleteSample || []).map(r => (
                <tr key={r.accident_id} className="hover:bg-slate-50/60">
                  <td className="py-2 px-3 font-mono text-slate-900 tabular-nums">
                    {r.source_record_id || `#${r.accident_id}`}
                  </td>
                  <td className="py-2 px-3 font-mono tabular-nums text-slate-600">
                    {r.accident_datetime ? r.accident_datetime.substring(0, 10) : <span className="text-rose-600 font-medium">Missing Date</span>}
                  </td>
                  <td className="py-2 px-3">
                    {r.region || <span className="text-rose-600 font-medium">Missing Region</span>}
                  </td>
                  <td className="py-2 px-3">
                    {r.road_name || <span className="text-slate-400 italic">Unspecified</span>}
                  </td>
                  <td className="py-2 px-3">
                    {r.vehicle_type || <span className="text-amber-600 font-medium">Missing</span>}
                  </td>
                  <td className="py-2 px-3">
                    {r.severity || <span className="text-rose-600 font-medium">Missing</span>}
                  </td>
                  <td className="py-2 px-3">
                    {r.weather || <span className="text-amber-600 font-medium">Missing</span>}
                  </td>
                  <td className="py-2 px-3 text-right">
                    <button
                      onClick={() => setInspectingRecord(r)}
                      className="text-teal-700 hover:text-teal-900 p-1 rounded hover:bg-teal-50"
                      title="Inspect Record"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Import History Table */}
      <section className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-slate-900 text-base">Batch Ingestion Audit History</h3>
            <p className="text-xs text-slate-500">Historical records of uploaded files, row counts, and validation states</p>
          </div>
          <History className="w-5 h-5 text-slate-400" />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                <th className="py-2.5 px-3">Import ID</th>
                <th className="py-2.5 px-3">Filename</th>
                <th className="py-2.5 px-3 text-right">Total Rows</th>
                <th className="py-2.5 px-3 text-right">Ingested</th>
                <th className="py-2.5 px-3 text-right">Rejected</th>
                <th className="py-2.5 px-3 text-right">Incomplete</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3 text-right">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {(quality?.importHistory || []).map(imp => (
                <tr key={imp.import_id} className="hover:bg-slate-50/50">
                  <td className="py-2.5 px-3 font-mono font-medium text-slate-900 tabular-nums">
                    #{imp.import_id}
                  </td>
                  <td className="py-2.5 px-3 font-medium text-slate-800">{imp.filename}</td>
                  <td className="py-2.5 px-3 text-right font-mono tabular-nums">{imp.total_rows}</td>
                  <td className="py-2.5 px-3 text-right font-mono tabular-nums text-emerald-700 font-semibold">
                    {imp.successful_rows}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono tabular-nums text-rose-600">
                    {imp.rejected_rows}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono tabular-nums text-amber-600">
                    {imp.missing_value_rows}
                  </td>
                  <td className="py-2.5 px-3">
                    <span className="font-semibold text-teal-700 font-mono text-[11px]">
                      {imp.validation_status}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono text-slate-500 tabular-nums">
                    {imp.imported_at ? imp.imported_at.substring(0, 16) : '--'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Record Inspect Modal */}
      {inspectingRecord && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-md p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="font-bold text-slate-900 text-sm">
                Incomplete Record Audit: #{inspectingRecord.accident_id}
              </h3>
              <button onClick={() => setInspectingRecord(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 text-slate-700">
              <div><strong>Record ID:</strong> {inspectingRecord.source_record_id || 'None'}</div>
              <div><strong>Datetime:</strong> {inspectingRecord.accident_datetime || <span className="text-rose-600 font-medium">Null</span>}</div>
              <div><strong>Region:</strong> {inspectingRecord.region || <span className="text-rose-600 font-medium">Null</span>}</div>
              <div><strong>Road:</strong> {inspectingRecord.road_name || <span className="text-slate-400">Null</span>}</div>
              <div><strong>Vehicle Type:</strong> {inspectingRecord.vehicle_type || <span className="text-amber-600 font-medium">Null</span>}</div>
              <div><strong>Severity:</strong> {inspectingRecord.severity || <span className="text-rose-600 font-medium">Null</span>}</div>
              <div><strong>Weather:</strong> {inspectingRecord.weather || <span className="text-amber-600 font-medium">Null</span>}</div>
              <div><strong>Source:</strong> {inspectingRecord.source_name || 'System Default'}</div>
            </div>

            <div className="pt-3 border-t border-slate-200 text-[11px] text-slate-500">
              Note: This partial record is intentionally preserved in the dataset so total incident counts are not artificially deflated.
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
