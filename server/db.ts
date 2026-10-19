import initSqlJs, { Database } from 'sql.js';
import fs from 'fs';
import path from 'path';

let db: Database;
const DB_DIR = path.resolve(process.cwd(), 'data');
const DB_PATH = path.join(DB_DIR, 'saferoads.sqlite');

export async function initDatabase(): Promise<Database> {
  if (db) return db;

  const SQL = await initSqlJs();

  if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
  }

  if (fs.existsSync(DB_PATH)) {
    try {
      const fileBuffer = fs.readFileSync(DB_PATH);
      db = new SQL.Database(fileBuffer);
    } catch {
      db = new SQL.Database();
    }
  } else {
    db = new SQL.Database();
  }

  // Execute schema creation
  db.run(`
    CREATE TABLE IF NOT EXISTS locations (
      location_id INTEGER PRIMARY KEY AUTOINCREMENT,
      region TEXT NOT NULL,
      road_name TEXT,
      latitude REAL,
      longitude REAL,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS data_sources (
      source_id INTEGER PRIMARY KEY AUTOINCREMENT,
      source_name TEXT NOT NULL,
      source_type TEXT NOT NULL DEFAULT 'CSV_BATCH',
      source_url TEXT,
      description TEXT,
      is_synthetic INTEGER DEFAULT 0,
      imported_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS accidents (
      accident_id INTEGER PRIMARY KEY AUTOINCREMENT,
      source_record_id TEXT,
      accident_datetime TEXT,
      location_id INTEGER,
      vehicle_type TEXT,
      severity TEXT,
      weather TEXT,
      source_name TEXT,
      imported_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (location_id) REFERENCES locations(location_id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS import_history (
      import_id INTEGER PRIMARY KEY AUTOINCREMENT,
      source_id INTEGER,
      filename TEXT NOT NULL,
      total_rows INTEGER NOT NULL DEFAULT 0,
      successful_rows INTEGER NOT NULL DEFAULT 0,
      rejected_rows INTEGER NOT NULL DEFAULT 0,
      duplicate_rows INTEGER NOT NULL DEFAULT 0,
      missing_value_rows INTEGER NOT NULL DEFAULT 0,
      validation_status TEXT NOT NULL DEFAULT 'COMPLETED',
      imported_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (source_id) REFERENCES data_sources(source_id) ON DELETE SET NULL
    );

    CREATE INDEX IF NOT EXISTS idx_accidents_datetime ON accidents(accident_datetime);
    CREATE INDEX IF NOT EXISTS idx_accidents_severity ON accidents(severity);
    CREATE INDEX IF NOT EXISTS idx_accidents_vehicle ON accidents(vehicle_type);
    CREATE INDEX IF NOT EXISTS idx_accidents_weather ON accidents(weather);
    CREATE INDEX IF NOT EXISTS idx_accidents_location ON accidents(location_id);
    CREATE INDEX IF NOT EXISTS idx_locations_region ON locations(region);
  `);

  // Check if we have records; if empty, seed demonstration dataset
  const res = db.exec("SELECT COUNT(*) as count FROM accidents");
  const count = res[0]?.values[0]?.[0] as number || 0;
  if (count === 0) {
    seedDemonstrationData(db);
  }

  saveDatabase();
  return db;
}

export function saveDatabase() {
  if (!db) return;
  try {
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(DB_PATH, buffer);
  } catch (err) {
    console.error('Failed to persist database to disk:', err);
  }
}

export function getDb(): Database {
  if (!db) {
    throw new Error('Database not initialized. Call initDatabase() first.');
  }
  return db;
}

export function queryAll<T = Record<string, any>>(sqlText: string, params: any[] = []): T[] {
  const database = getDb();
  const stmt = database.prepare(sqlText);
  if (params && params.length > 0) {
    stmt.bind(params);
  }
  const results: T[] = [];
  while (stmt.step()) {
    results.push(stmt.getAsObject() as T);
  }
  stmt.free();
  return results;
}

export function queryOne<T = Record<string, any>>(sqlText: string, params: any[] = []): T | null {
  const rows = queryAll<T>(sqlText, params);
  return rows.length > 0 ? rows[0] : null;
}

export function runSql(sqlText: string, params: any[] = []): { lastInsertRowId: number; changes: number } {
  const database = getDb();
  database.run(sqlText, params);
  const lastIdRes = database.exec("SELECT last_insert_rowid() as id");
  const lastInsertRowId = Number(lastIdRes[0]?.values[0]?.[0] || 0);
  const changesRes = database.exec("SELECT changes() as changes");
  const changes = Number(changesRes[0]?.values[0]?.[0] || 0);
  saveDatabase();
  return { lastInsertRowId, changes };
}

export function clearSampleData(): { removed: number } {
  const database = getDb();
  // Find synthetic source records
  const countRes = database.exec("SELECT COUNT(*) FROM accidents WHERE source_name LIKE '%Demonstration%' OR source_name LIKE '%Synthetic%'");
  const removed = Number(countRes[0]?.values[0]?.[0] || 0);

  database.run("DELETE FROM accidents WHERE source_name LIKE '%Demonstration%' OR source_name LIKE '%Synthetic%'");
  database.run("DELETE FROM data_sources WHERE is_synthetic = 1");
  saveDatabase();
  return { removed };
}

export function resetDemonstrationData(): void {
  const database = getDb();
  database.run("DELETE FROM accidents");
  database.run("DELETE FROM locations");
  database.run("DELETE FROM import_history");
  database.run("DELETE FROM data_sources");
  seedDemonstrationData(database);
  saveDatabase();
}

function seedDemonstrationData(database: Database) {
  // 1. Insert synthetic source
  database.run(
    `INSERT INTO data_sources (source_name, source_type, source_url, description, is_synthetic) 
     VALUES ('Metro Road Safety Dept (Demonstration)', 'CSV_BATCH', 'https://saferoads.internal/demo', 'Curated synthetic demonstration dataset for testing multi-year trends, weather patterns, and severity analytics.', 1)`
  );

  // 2. Predefined locations with realistic coordinates (around a major metro area: San Francisco Bay / Silicon Valley coordinates 37.7 - 37.8 N, -122.4 - -122.2 W)
  // Some records will deliberately have NULL coordinates to verify Section 10 ("If the dataset only contains region or road names, do not invent coordinates")
  const locationsData = [
    { region: 'Downtown Metro', road_name: 'Market Street & 4th Ave', lat: 37.7858, lng: -122.4065 },
    { region: 'Downtown Metro', road_name: 'Mission Boulevard', lat: 37.7602, lng: -122.4194 },
    { region: 'Downtown Metro', road_name: 'Van Ness Expressway', lat: 37.7812, lng: -122.4215 },
    { region: 'Downtown Metro', road_name: 'Broadway Tunnel Corridor', lat: 37.7961, lng: -122.4124 },
    { region: 'East Bay Hub', road_name: 'Interstate 880 Southbound', lat: 37.8044, lng: -122.2712 },
    { region: 'East Bay Hub', road_name: 'Grand Avenue Junction', lat: 37.8115, lng: -122.2598 },
    { region: 'East Bay Hub', road_name: 'Telegraph Avenue', lat: 37.8421, lng: -122.2611 },
    { region: 'East Bay Hub', road_name: 'San Pablo Corridor', lat: 37.8512, lng: -122.2854 },
    { region: 'North Peninsula', road_name: 'Highway 101 Northbound MP 14', lat: 37.6624, lng: -122.4082 },
    { region: 'North Peninsula', road_name: 'El Camino Real', lat: 37.6534, lng: -122.4231 },
    { region: 'North Peninsula', road_name: 'Skyline Boulevard (Hwy 35)', lat: 37.6189, lng: -122.4645 },
    { region: 'South Valley', road_name: 'Capital Expressway', lat: 37.3125, lng: -121.8214 },
    { region: 'South Valley', road_name: 'Interstate 280 Interchange', lat: 37.3278, lng: -121.9056 },
    { region: 'South Valley', road_name: 'Stevens Creek Boulevard', lat: 37.3235, lng: -122.0321 },
    { region: 'Coastal Sector', road_name: 'Pacific Coast Highway 1', lat: 37.5021, lng: -122.4789 },
    // Missing coordinates locations to test regional grouping without false exact dots
    { region: 'North Peninsula', road_name: 'Airport Perimeter Loop', lat: null, lng: null },
    { region: 'East Bay Hub', road_name: 'Port Terminal Access Way', lat: null, lng: null },
    { region: 'South Valley', road_name: 'Industrial Park Connector', lat: null, lng: null },
    { region: 'Coastal Sector', road_name: 'Ocean Shore Route (Unmapped)', lat: null, lng: null }
  ];

  const locStmt = database.prepare("INSERT INTO locations (region, road_name, latitude, longitude) VALUES (?, ?, ?, ?)");
  for (const loc of locationsData) {
    locStmt.run([loc.region, loc.road_name, loc.lat, loc.lng]);
  }
  locStmt.free();

  // 3. Generate 140 realistic accident records across the past 12 months up to current date
  const vehicleTypes = ['Passenger Car', 'Passenger Car', 'SUV', 'SUV', 'Pickup Truck', 'Commercial Truck', 'Motorcycle', 'Transit Bus', 'Bicycle', 'Light Van'];
  const severities = ['Property Damage Only', 'Property Damage Only', 'Minor Injury', 'Minor Injury', 'Serious Injury', 'Fatal'];
  const weatherConditions = ['Clear', 'Clear', 'Clear', 'Rain', 'Rain', 'Fog / Mist', 'Overcast', 'Snow / Sleet', null]; // null tests missing weather!

  const accStmt = database.prepare(`
    INSERT INTO accidents (source_record_id, accident_datetime, location_id, vehicle_type, severity, weather, source_name)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  // Deterministic seed generation with temporal patterns (higher on Friday/Saturday evenings and rush hours)
  const now = new Date('2026-10-18T20:00:00Z');
  
  for (let i = 1; i <= 140; i++) {
    const locId = (i % locationsData.length) + 1;
    // Days offset: between 0 and 300 days ago
    const dayOffset = Math.floor((i * 19) % 270);
    // Hour: weighted toward 7-9am (morning rush) and 16-19pm (evening rush)
    let hour = (i * 7) % 24;
    if (i % 3 === 0) hour = 17 + (i % 3); // 17, 18, 19
    else if (i % 4 === 0) hour = 7 + (i % 3); // 7, 8, 9
    const minute = (i * 13) % 60;

    const recordDate = new Date(now.getTime() - dayOffset * 86400000);
    recordDate.setUTCHours(hour, minute, 0, 0);
    const dateStr = recordDate.toISOString().replace('T', ' ').substring(0, 19);

    const vehicle = (i === 12) ? null : vehicleTypes[i % vehicleTypes.length]; // 1 missing vehicle for data quality
    const severity = (i === 45) ? null : severities[i % severities.length]; // 1 missing severity for data quality
    const weather = weatherConditions[i % weatherConditions.length];

    accStmt.run([
      `DEMO-2026-${String(i).padStart(4, '0')}`,
      dateStr,
      locId,
      vehicle,
      severity,
      weather,
      'Metro Road Safety Dept (Demonstration)'
    ]);
  }
  accStmt.free();

  // Record demonstration import history
  database.run(
    `INSERT INTO import_history (source_id, filename, total_rows, successful_rows, rejected_rows, duplicate_rows, missing_value_rows, validation_status)
     VALUES (1, 'synthetic_metro_safety_benchmark_2026.csv', 142, 140, 2, 0, 16, 'COMPLETED')`
  );
}
