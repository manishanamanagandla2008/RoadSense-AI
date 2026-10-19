import React, { useState } from 'react';
import Papa from 'papaparse';
import {
  UploadCloud,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Download,
  HelpCircle,
  ArrowRight,
  RotateCcw,
  RefreshCw,
  FileText
} from 'lucide-react';

interface ImportSummary {
  totalRows: number;
  successfulRows: number;
  rejectedRows: number;
  duplicateRows: number;
  missingValueRows: number;
  rejectedItems: Array<{ rowNumber: number; reason: string; rowData: any }>;
  filename: string;
  importedAt: string;
}

export const ImportView: React.FC<{ onImportSuccess: () => void }> = ({ onImportSuccess }) => {
  const [file, setFile] = useState<File | null>(null);
  const [parsedRows, setParsedRows] = useState<any[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [sourceName, setSourceName] = useState('Municipal Department Feed');

  // Column Mapping
  const [mapping, setMapping] = useState({
    source_record_id: '',
    accident_datetime: '',
    region: '',
    road_name: '',
    latitude: '',
    longitude: '',
    vehicle_type: '',
    severity: '',
    weather: ''
  });

  const [isProcessing, setIsProcessing] = useState(false);
  const [summary, setSummary] = useState<ImportSummary | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  // Handle CSV file selection
  const handleFileChange = (selectedFile: File) => {
    setFile(selectedFile);
    setErrorMsg('');
    setSummary(null);

    Papa.parse(selectedFile, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.data && results.data.length > 0) {
          const firstRow = results.data[0] as Record<string, any>;
          const extractedHeaders = Object.keys(firstRow);
          setHeaders(extractedHeaders);
          setParsedRows(results.data);

          // Auto-guess mapping based on header strings
          const guessedMapping: Record<string, string> = { ...mapping };
          extractedHeaders.forEach(h => {
            const lower = h.toLowerCase().trim();
            if (lower.includes('id') || lower.includes('case') || lower.includes('report')) guessedMapping.source_record_id = h;
            if (lower.includes('date') || lower.includes('time') || lower.includes('datetime')) guessedMapping.accident_datetime = h;
            if (lower.includes('region') || lower.includes('city') || lower.includes('county') || lower.includes('district')) guessedMapping.region = h;
            if (lower.includes('road') || lower.includes('street') || lower.includes('highway') || lower.includes('location')) guessedMapping.road_name = h;
            if (lower.includes('lat')) guessedMapping.latitude = h;
            if (lower.includes('lon') || lower.includes('lng')) guessedMapping.longitude = h;
            if (lower.includes('veh') || lower.includes('type') || lower.includes('mode')) guessedMapping.vehicle_type = h;
            if (lower.includes('sev') || lower.includes('injury') || lower.includes('fatal')) guessedMapping.severity = h;
            if (lower.includes('weath') || lower.includes('cond') || lower.includes('atm')) guessedMapping.weather = h;
          });

          setMapping(guessedMapping as any);
        } else {
          setErrorMsg('CSV file appears to be empty.');
        }
      },
      error: (err) => {
        setErrorMsg(`Failed to parse CSV file: ${err.message}`);
      }
    });
  };

  // Execute Batch Import
  const handleConfirmImport = async () => {
    if (!parsedRows.length) return;
    setIsProcessing(true);
    setErrorMsg('');

    try {
      const res = await fetch('/api/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rows: parsedRows,
          filename: file?.name || 'import.csv',
          sourceName: sourceName.trim() || 'Uploaded CSV Ingestion',
          mapping
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to complete import');
      }

      setSummary(data.summary);
      onImportSuccess();
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  // Download Sample CSV Template
  const handleDownloadTemplate = () => {
    const templateContent = [
      'source_record_id,accident_datetime,region,road_name,latitude,longitude,vehicle_type,severity,weather',
      'SAMPLE-2026-001,2026-10-12 08:30:00,Downtown Metro,Grand Avenue Junction,37.8115,-122.2598,Passenger Car,Property Damage Only,Clear',
      'SAMPLE-2026-002,2026-10-12 17:45:00,East Bay Hub,Interstate 880 Southbound,37.8044,-122.2712,Commercial Truck,Serious Injury,Rain',
      'SAMPLE-2026-003,2026-10-13 14:15:00,North Peninsula,Airport Perimeter Loop,,,Transit Bus,Minor Injury,Fog / Mist',
      'SAMPLE-2026-004,2026-10-14 21:10:00,South Valley,Capital Expressway,37.3125,-121.8214,Motorcycle,Fatal,Clear'
    ].join('\n');

    const blob = new Blob([templateContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'roadsense_accident_import_template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  // Download Validation Failure Report
  const handleDownloadValidationReport = () => {
    if (!summary || !summary.rejectedItems.length) return;

    const reportHeaders = ['Row_Number', 'Rejection_Reason', 'Source_Record_ID', 'Raw_Data_Preview'];
    const reportRows = [reportHeaders.join(',')];

    summary.rejectedItems.forEach(item => {
      const rawPreview = JSON.stringify(item.rowData).replace(/"/g, '""');
      reportRows.push(`${item.rowNumber},"${item.reason.replace(/"/g, '""')}",,"${rawPreview}"`);
    });

    const blob = new Blob([reportRows.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `validation_error_report_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const resetUpload = () => {
    setFile(null);
    setParsedRows([]);
    setHeaders([]);
    setSummary(null);
    setErrorMsg('');
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Upload & Template Header */}
      <section className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 tracking-tight">Accident Dataset Ingestion</h2>
          <p className="text-xs text-slate-500">
            Batch ingest municipal CSV records with column mapping, format verification, and duplicate audits.
          </p>
        </div>

        <button
          onClick={handleDownloadTemplate}
          className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-300 rounded-lg transition-colors"
        >
          <Download className="w-3.5 h-3.5 text-teal-600" />
          <span>Download CSV Template</span>
        </button>
      </section>

      {errorMsg && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Upload Zone */}
      {!file ? (
        <div
          onDragOver={e => e.preventDefault()}
          onDrop={e => {
            e.preventDefault();
            if (e.dataTransfer.files && e.dataTransfer.files[0]) {
              handleFileChange(e.dataTransfer.files[0]);
            }
          }}
          className="bg-white rounded-2xl border-2 border-dashed border-slate-300 p-12 text-center hover:border-teal-500 hover:bg-teal-50/20 transition-all flex flex-col items-center justify-center space-y-4"
        >
          <div className="w-14 h-14 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center">
            <UploadCloud className="w-7 h-7 text-teal-600" />
          </div>

          <div className="space-y-1">
            <h3 className="font-bold text-slate-900 text-sm">Select or Drag CSV Dataset File</h3>
            <p className="text-xs text-slate-500 max-w-md">
              Supports CSV files containing dates, locations, vehicle types, severities, and optional geographic coordinates.
            </p>
          </div>

          <label className="cursor-pointer inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs font-semibold bg-slate-900 text-white hover:bg-slate-800 transition-colors shadow-xs">
            <span>Browse Files</span>
            <input
              type="file"
              accept=".csv"
              className="hidden"
              onChange={e => {
                if (e.target.files && e.target.files[0]) {
                  handleFileChange(e.target.files[0]);
                }
              }}
            />
          </label>
        </div>
      ) : (
        <div className="space-y-6">
          {/* File Selected Badge */}
          <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <div>
                <span className="font-semibold text-slate-900 text-sm block">{file.name}</span>
                <span className="text-xs text-slate-500 font-mono tabular-nums">
                  {parsedRows.length.toLocaleString()} rows detected · {(file.size / 1024).toFixed(1)} KB
                </span>
              </div>
            </div>

            <button
              onClick={resetUpload}
              className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Choose Another File</span>
            </button>
          </div>

          {/* Column Mapping Configurator */}
          <section className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Column Header Mapping</h3>
              <p className="text-xs text-slate-500">
                Match columns in your uploaded file with the required database fields.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1">Source Record ID</label>
                <select
                  value={mapping.source_record_id}
                  onChange={e => setMapping({ ...mapping, source_record_id: e.target.value })}
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 text-xs"
                >
                  <option value="">(None / Auto-generate)</option>
                  {headers.map(h => (
                    <option key={h} value={h}>
                      {h}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1">Accident Date/Time</label>
                <select
                  value={mapping.accident_datetime}
                  onChange={e => setMapping({ ...mapping, accident_datetime: e.target.value })}
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 text-xs"
                >
                  <option value="">(Select column)</option>
                  {headers.map(h => (
                    <option key={h} value={h}>
                      {h}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1">Region / Jurisdiction</label>
                <select
                  value={mapping.region}
                  onChange={e => setMapping({ ...mapping, region: e.target.value })}
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 text-xs"
                >
                  <option value="">(Select column)</option>
                  {headers.map(h => (
                    <option key={h} value={h}>
                      {h}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1">Road / Corridor Name</label>
                <select
                  value={mapping.road_name}
                  onChange={e => setMapping({ ...mapping, road_name: e.target.value })}
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 text-xs"
                >
                  <option value="">(None / Unspecified)</option>
                  {headers.map(h => (
                    <option key={h} value={h}>
                      {h}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1">Vehicle Classification</label>
                <select
                  value={mapping.vehicle_type}
                  onChange={e => setMapping({ ...mapping, vehicle_type: e.target.value })}
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 text-xs"
                >
                  <option value="">(Select column)</option>
                  {headers.map(h => (
                    <option key={h} value={h}>
                      {h}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1">Severity Category</label>
                <select
                  value={mapping.severity}
                  onChange={e => setMapping({ ...mapping, severity: e.target.value })}
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 text-xs"
                >
                  <option value="">(Select column)</option>
                  {headers.map(h => (
                    <option key={h} value={h}>
                      {h}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1">Weather Condition</label>
                <select
                  value={mapping.weather}
                  onChange={e => setMapping({ ...mapping, weather: e.target.value })}
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 text-xs"
                >
                  <option value="">(None / Optional)</option>
                  {headers.map(h => (
                    <option key={h} value={h}>
                      {h}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1">Latitude (Optional GPS)</label>
                <select
                  value={mapping.latitude}
                  onChange={e => setMapping({ ...mapping, latitude: e.target.value })}
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 text-xs"
                >
                  <option value="">(None / Unmapped)</option>
                  {headers.map(h => (
                    <option key={h} value={h}>
                      {h}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1">Longitude (Optional GPS)</label>
                <select
                  value={mapping.longitude}
                  onChange={e => setMapping({ ...mapping, longitude: e.target.value })}
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 text-xs"
                >
                  <option value="">(None / Unmapped)</option>
                  {headers.map(h => (
                    <option key={h} value={h}>
                      {h}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="pt-2">
              <label className="block text-[11px] font-medium text-slate-600 mb-1">Assign Source Name Label</label>
              <input
                type="text"
                value={sourceName}
                onChange={e => setSourceName(e.target.value)}
                placeholder="e.g. Metro Transit Safety Authority 2026 Batch"
                className="w-full max-w-md px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
              />
            </div>
          </section>

          {/* Dataset Preview */}
          <section className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <span className="font-bold text-slate-900 text-xs">Dataset First 5 Rows Preview</span>
              <span className="text-[11px] text-slate-400 font-mono">
                Showing 5 of {parsedRows.length} rows
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                    {headers.slice(0, 8).map(h => (
                      <th key={h} className="py-2 px-3 whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {parsedRows.slice(0, 5).map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50">
                      {headers.slice(0, 8).map(h => (
                        <td key={h} className="py-2 px-3 whitespace-nowrap font-mono text-[11px]">
                          {row[h] || <span className="text-slate-400 italic">null</span>}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Import Action Bar */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              onClick={resetUpload}
              className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 text-xs font-medium"
            >
              Cancel
            </button>

            <button
              onClick={handleConfirmImport}
              disabled={isProcessing}
              className="flex items-center gap-2 px-5 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 text-xs font-semibold shadow-xs disabled:opacity-50"
            >
              {isProcessing && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
              <span>Validate & Save Valid Records to Database</span>
              <ArrowRight className="w-3.5 h-3.5 text-teal-400" />
            </button>
          </div>
        </div>
      )}

      {/* Import Summary Results Modal */}
      {summary && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-2xl overflow-hidden space-y-4 p-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-teal-600" />
                <h3 className="font-bold text-slate-900 text-base">Batch Ingestion Completed</h3>
              </div>
              <span className="text-xs text-slate-400 font-mono">{summary.filename}</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                <span className="text-slate-500 block">Total Rows</span>
                <span className="text-xl font-bold text-slate-900 font-mono tabular-nums">
                  {summary.totalRows}
                </span>
              </div>

              <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-100">
                <span className="text-emerald-700 block">Successfully Saved</span>
                <span className="text-xl font-bold text-emerald-800 font-mono tabular-nums">
                  {summary.successfulRows}
                </span>
              </div>

              <div className="p-3 bg-rose-50 rounded-lg border border-rose-100">
                <span className="text-rose-700 block">Rejected Records</span>
                <span className="text-xl font-bold text-rose-800 font-mono tabular-nums">
                  {summary.rejectedRows}
                </span>
              </div>

              <div className="p-3 bg-amber-50 rounded-lg border border-amber-100">
                <span className="text-amber-700 block">Partial / Incomplete</span>
                <span className="text-xl font-bold text-amber-800 font-mono tabular-nums">
                  {summary.missingValueRows}
                </span>
              </div>
            </div>

            {summary.rejectedItems.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-rose-700">Rejection Audit Log</span>
                  <button
                    onClick={handleDownloadValidationReport}
                    className="flex items-center gap-1 text-slate-600 hover:text-slate-900 font-medium"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download Rejection Report (CSV)</span>
                  </button>
                </div>

                <div className="max-h-40 overflow-y-auto rounded-lg border border-rose-200 bg-rose-50/40 p-2 space-y-1 text-[11px] text-rose-900">
                  {summary.rejectedItems.map((item, idx) => (
                    <div key={idx} className="flex items-start gap-2 border-b border-rose-100 pb-1">
                      <span className="font-mono font-bold shrink-0">Row {item.rowNumber}:</span>
                      <span>{item.reason}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="pt-3 border-t border-slate-200 flex items-center justify-end">
              <button
                onClick={() => setSummary(null)}
                className="px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 text-xs font-semibold shadow-xs"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
