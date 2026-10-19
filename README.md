# RoadSense AI: Real-Time Road Accident Data Analysis & Visualization Platform

RoadSense AI is a modern, responsive, full-stack road safety analytics platform engineered to process, audit, and visualize collision records with high analytical rigor.

---

## 1. System Architecture

- **Frontend**: React 19, TypeScript, Tailwind CSS, Chart.js (`react-chartjs-2`), Leaflet.js (`leaflet`), Lucide React.
- **Backend**: Express REST API server (`server.ts`, `server/routes.ts`).
- **Database Engine**: Relational ANSI SQL / SQLite3 engine with disk persistence (`data/saferoads.sqlite`), exactly mirroring the 4-table MySQL production schema (`database/schema.sql`).
- **Data Ingestion**: PapaParse CSV processor with column mapping, format validation, duplicate audits, and error isolation.

---

## 2. MySQL Database Schema (`database/schema.sql`)

The database follows a normalized relational structure:
1. `locations`: Stores geographical jurisdictions (`region`, `road_name`, `latitude`, `longitude`). Coordinates are strictly stored when verified.
2. `accidents`: Stores incident events (`source_record_id`, `accident_datetime`, `location_id`, `vehicle_type`, `severity`, `weather`, `source_name`, `imported_at`).
3. `data_sources`: Documents provenance, dataset types, and synthetic vs. verified markers.
4. `import_history`: Audit trail for batch CSV uploads, tracking total rows, valid rows, duplicates, and rejections.

---

## 3. Platform Modules (10 Core Sections)

1. **Overview & Mission**: Landing page introducing RoadSense AI ("Turning Accident Data into Safer Roads"), platform preview, core features, how the system works, and legal disclaimer.
2. **Accident Records**: Full records ledger with CRUD (Create, Read, Update, Delete with confirmation), full-text search, column sorting, pagination, and incomplete record identification.
3. **Live Dashboard**: Real-time periodic updates (30-second polling cadence with visual countdown), 6 database-calculated KPI cards, multi-parameter filters (Date, Region, Road, Vehicle, Severity, Weather), and 6 interactive Chart.js visualizations.
4. **Accident Analytics**: Time-based rush-hour analysis, weekday vs. weekend distributions, and mathematical statistical measures (Mean, Median, Min, Max, Standard Deviation).
5. **Interactive Accident Map**: Leaflet.js map with severity color-coded markers, rich inspection popups, zoom/pan controls, and region-level aggregation for unmapped records.
6. **Severity Analysis**: Dedicated casualty dashboard showing known vs. missing severity, percentage distributions, regional cross-tabulations, and speed limit exposure context.
7. **Data Import & CSV Ingestion**: CSV file drag-and-drop, sample template download, column header mapping, pre-ingestion validation, duplicate detection, batch saving, and rejection report export.
8. **Reports & Downloads**: Filterable formal audit reports with summary statistics, raw CSV export, and print/PDF formatting with official regulatory disclaimer.
9. **Data Quality Audit**: Audit dashboard quantifying missingness percentages, incomplete record inspection, batch history logs, and strict distinction between zero accidents, missing attributes, and uncollected data.
10. **Settings & Schema**: MySQL schema DDL viewer and downloader, polling interval configuration (15s, 30s, 60s), and synthetic demonstration dataset reset/clear controls.

---

## 4. Setup & Running Locally

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Start Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser. The server will initialize the relational database and seed demonstration records automatically.

### Step 3: Production Build
```bash
npm run build
npm start
```

---

## 5. Official Regulatory & Analytical Disclaimer

> "Results describe patterns in the available accident records and do not establish causation. Recorded counts may be affected by reporting practices, missing information, geographic coverage, and traffic exposure. Findings should not be interpreted as definitive measures of accident risk."
