import React, { useState } from 'react';
import {
  Settings,
  Database,
  Trash2,
  RotateCcw,
  Download,
  Copy,
  Check,
  Server,
  ShieldCheck,
  AlertTriangle,
  Code2,
  FileCode
} from 'lucide-react';

interface SettingsViewProps {
  onDataReset: () => void;
  pollingInterval: number;
  onUpdatePollingInterval: (seconds: number) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  onDataReset,
  pollingInterval,
  onUpdatePollingInterval
}) => {
  const [copied, setCopied] = useState(false);
  const [actionMsg, setActionMsg] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const mysqlSchemaCode = `-- RoadSense AI: MySQL Database Schema
-- Compatible with MySQL 8.0+

CREATE DATABASE IF NOT EXISTS saferoads_ai CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE saferoads_ai;

-- 1. Table: locations
CREATE TABLE IF NOT EXISTS locations (
    location_id INT AUTO_INCREMENT PRIMARY KEY,
    region VARCHAR(150) NOT NULL,
    road_name VARCHAR(200) NULL,
    latitude DECIMAL(10, 7) NULL,
    longitude DECIMAL(10, 7) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_region (region),
    INDEX idx_road (road_name),
    INDEX idx_coordinates (latitude, longitude)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2. Table: data_sources
CREATE TABLE IF NOT EXISTS data_sources (
    source_id INT AUTO_INCREMENT PRIMARY KEY,
    source_name VARCHAR(255) NOT NULL,
    source_type VARCHAR(100) NOT NULL DEFAULT 'CSV_BATCH',
    source_url VARCHAR(500) NULL,
    description TEXT NULL,
    is_synthetic BOOLEAN DEFAULT FALSE,
    imported_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3. Table: accidents
CREATE TABLE IF NOT EXISTS accidents (
    accident_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    source_record_id VARCHAR(150) NULL,
    accident_datetime DATETIME NULL,
    location_id INT NULL,
    vehicle_type VARCHAR(100) NULL,
    severity VARCHAR(100) NULL,
    weather VARCHAR(100) NULL,
    source_name VARCHAR(255) NULL,
    imported_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_accident_location
        FOREIGN KEY (location_id) REFERENCES locations(location_id)
        ON DELETE SET NULL ON UPDATE CASCADE,
    INDEX idx_accident_datetime (accident_datetime),
    INDEX idx_severity (severity),
    INDEX idx_vehicle_type (vehicle_type),
    INDEX idx_weather (weather),
    INDEX idx_location (location_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 4. Table: import_history
CREATE TABLE IF NOT EXISTS import_history (
    import_id INT AUTO_INCREMENT PRIMARY KEY,
    source_id INT NULL,
    filename VARCHAR(255) NOT NULL,
    total_rows INT NOT NULL DEFAULT 0,
    successful_rows INT NOT NULL DEFAULT 0,
    rejected_rows INT NOT NULL DEFAULT 0,
    duplicate_rows INT NOT NULL DEFAULT 0,
    missing_value_rows INT NOT NULL DEFAULT 0,
    validation_status VARCHAR(50) NOT NULL DEFAULT 'COMPLETED',
    imported_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_import_source
        FOREIGN KEY (source_id) REFERENCES data_sources(source_id)
        ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`;

  const handleCopySchema = () => {
    navigator.clipboard.writeText(mysqlSchemaCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadSchema = () => {
    const blob = new Blob([mysqlSchemaCode], { type: 'text/sql' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'schema.sql';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleResetDemoData = async () => {
    if (!confirm('Reset database to synthetic demonstration records? Any user-uploaded data will be replaced by the default sample benchmark.')) {
      return;
    }
    setIsProcessing(true);
    setActionMsg('');
    try {
      const res = await fetch('/api/sample-data/reset', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setActionMsg(data.message);
        onDataReset();
      }
    } catch (err: any) {
      setActionMsg(`Reset error: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClearDemoData = async () => {
    if (!confirm('Safely remove all demonstration records from the database? Any user-uploaded records will be preserved.')) {
      return;
    }
    setIsProcessing(true);
    setActionMsg('');
    try {
      const res = await fetch('/api/sample-data/clear', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setActionMsg(data.message);
        onDataReset();
      }
    } catch (err: any) {
      setActionMsg(`Clear error: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Engine & Environment Status */}
      <section className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Server className="w-5 h-5 text-teal-600" />
            <h2 className="font-bold text-slate-900 text-base">Database Engine & Real-Time Setup</h2>
          </div>
          <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
            Relational SQL Operational
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
            <span className="text-slate-500 font-medium">Relational Engine</span>
            <div className="text-sm font-bold text-slate-900">ANSI SQL / SQLite3</div>
            <p className="text-[11px] text-slate-500">Persisted binary disk storage at `data/saferoads.sqlite`</p>
          </div>

          <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
            <span className="text-slate-500 font-medium">MySQL DDL Parity</span>
            <div className="text-sm font-bold text-slate-900">Production Ready</div>
            <p className="text-[11px] text-slate-500">Full 4-table schema compliant with Section 14 spec</p>
          </div>

          <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
            <span className="text-slate-500 font-medium">Polling Cadence</span>
            <div className="text-sm font-bold text-slate-900">{pollingInterval} Seconds Polling</div>
            <p className="text-[11px] text-slate-500">Auto-refreshes statistics without reloading page</p>
          </div>
        </div>

        {/* Polling Interval Setting */}
        <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs border-t border-slate-100">
          <div>
            <span className="font-semibold text-slate-800">Auto-Refresh Cadence</span>
            <p className="text-slate-500 text-[11px]">Adjust how often the live dashboard polls the server for newly ingested records</p>
          </div>

          <div className="flex items-center gap-2">
            {[15, 30, 60].map(sec => (
              <button
                key={sec}
                onClick={() => onUpdatePollingInterval(sec)}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-colors ${
                  pollingInterval === sec
                    ? 'bg-slate-900 text-white font-semibold'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {sec}s
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Demonstration Data Management (Section 15) */}
      <section className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div>
          <h2 className="font-bold text-slate-900 text-base">Demonstration Dataset Management</h2>
          <p className="text-xs text-slate-500">
            Control the synthetic demonstration benchmark. Demonstration records are clearly tagged and can be safely purged.
          </p>
        </div>

        {actionMsg && (
          <div className="p-3 bg-teal-50 border border-teal-200 rounded-lg text-teal-800 text-xs flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-teal-600 shrink-0" />
            <span>{actionMsg}</span>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleResetDemoData}
            disabled={isProcessing}
            className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 text-xs font-semibold shadow-xs disabled:opacity-50"
          >
            <RotateCcw className="w-3.5 h-3.5 text-teal-400" />
            <span>Reset Demo Benchmark (140 Records)</span>
          </button>

          <button
            onClick={handleClearDemoData}
            disabled={isProcessing}
            className="flex items-center gap-1.5 px-4 py-2 bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Remove Demo Records Safely</span>
          </button>
        </div>

        <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 text-[11px] text-slate-600 leading-relaxed">
          <strong>Transparency Notice:</strong> All initial benchmark records are marked with source label <em>"Metro Road Safety Dept (Demonstration)"</em>. Purging demo records leaves all user-uploaded CSV batches completely intact.
        </div>
      </section>

      {/* MySQL Schema DDL Viewer & Downloader (Section 14) */}
      <section className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="font-bold text-slate-900 text-base">MySQL Database Schema (`database/schema.sql`)</h2>
            <p className="text-xs text-slate-500">Official DDL for tables `locations`, `accidents`, `data_sources`, and `import_history`</p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopySchema}
              className="flex items-center gap-1 px-3 py-1.5 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 text-xs font-medium"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-teal-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
              <span>{copied ? 'Copied' : 'Copy SQL'}</span>
            </button>

            <button
              onClick={handleDownloadSchema}
              className="flex items-center gap-1 px-3 py-1.5 bg-slate-900 text-white rounded-lg hover:bg-slate-800 text-xs font-semibold shadow-xs"
            >
              <Download className="w-3.5 h-3.5 text-teal-400" />
              <span>Download schema.sql</span>
            </button>
          </div>
        </div>

        <div className="rounded-lg bg-slate-950 p-4 overflow-x-auto text-slate-200 font-mono text-[11px] max-h-80 border border-slate-800 leading-relaxed">
          <pre>{mysqlSchemaCode}</pre>
        </div>
      </section>

      {/* Step-by-Step Production & Deployment Instructions (Section 19 & 20) */}
      <section className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div>
          <h2 className="font-bold text-slate-900 text-base">Local Setup & Deployment Instructions</h2>
          <p className="text-xs text-slate-500">Run RoadSense AI with standalone MySQL or full-stack Node/Python environment</p>
        </div>

        <div className="space-y-4 text-xs text-slate-700">
          <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
            <span className="font-bold text-slate-900 text-xs block">1. Installing Dependencies</span>
            <code className="block bg-slate-900 text-teal-400 p-2.5 rounded font-mono text-[11px]">
              npm install
            </code>
          </div>

          <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
            <span className="font-bold text-slate-900 text-xs block">2. Configuring MySQL Database (Optional external MySQL instance)</span>
            <p className="text-slate-600 text-[11px]">
              Create database `saferoads_ai` using `database/schema.sql`. In `.env`, configure:
            </p>
            <code className="block bg-slate-900 text-teal-400 p-2.5 rounded font-mono text-[11px]">
              MYSQL_HOST=localhost<br/>
              MYSQL_PORT=3306<br/>
              MYSQL_DATABASE=saferoads_ai<br/>
              MYSQL_USER=saferoads_user<br/>
              MYSQL_PASSWORD=your_secure_password
            </code>
          </div>

          <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
            <span className="font-bold text-slate-900 text-xs block">3. Starting the Real-Time Server</span>
            <code className="block bg-slate-900 text-teal-400 p-2.5 rounded font-mono text-[11px]">
              npm run dev
            </code>
            <p className="text-slate-600 text-[11px]">
              The server will boot on port 3000, initialize the relational schema, and seed synthetic demonstration records.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};
