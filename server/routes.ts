import { Router } from 'express';
import { queryAll, queryOne, runSql, clearSampleData, resetDemonstrationData } from './db.js';

export const apiRouter = Router();

// Helper to sanitize and build WHERE clause for common filters
function buildFilterClause(reqQuery: any, prefix = 'a.') {
  const conditions: string[] = [];
  const params: any[] = [];

  if (reqQuery.startDate) {
    conditions.push(`${prefix}accident_datetime >= ?`);
    params.push(reqQuery.startDate);
  }
  if (reqQuery.endDate) {
    conditions.push(`${prefix}accident_datetime <= ?`);
    params.push(reqQuery.endDate + ' 23:59:59');
  }
  if (reqQuery.region) {
    conditions.push(`l.region = ?`);
    params.push(reqQuery.region);
  }
  if (reqQuery.roadName) {
    conditions.push(`l.road_name LIKE ?`);
    params.push(`%${reqQuery.roadName}%`);
  }
  if (reqQuery.vehicleType) {
    conditions.push(`${prefix}vehicle_type = ?`);
    params.push(reqQuery.vehicleType);
  }
  if (reqQuery.severity) {
    conditions.push(`${prefix}severity = ?`);
    params.push(reqQuery.severity);
  }
  if (reqQuery.weather) {
    if (reqQuery.weather === 'Missing') {
      conditions.push(`${prefix}weather IS NULL`);
    } else {
      conditions.push(`${prefix}weather = ?`);
      params.push(reqQuery.weather);
    }
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  return { whereClause, params };
}

// 1. GET /api/dashboard - Main summary statistics
apiRouter.get('/dashboard', (req, res) => {
  try {
    const { whereClause, params } = buildFilterClause(req.query);

    // Total accidents
    const totalRow = queryOne<{ count: number }>(
      `SELECT COUNT(*) as count FROM accidents a LEFT JOIN locations l ON a.location_id = l.location_id ${whereClause}`,
      params
    );
    const totalAccidents = totalRow?.count || 0;

    // Accidents recorded in last 30 days (or this month)
    const thisMonthRow = queryOne<{ count: number }>(
      `SELECT COUNT(*) as count FROM accidents a LEFT JOIN locations l ON a.location_id = l.location_id 
       ${whereClause ? whereClause + ' AND' : 'WHERE'} a.accident_datetime >= datetime('now', '-30 days')`,
      params
    );

    // Accidents recorded today (or in past 24 hours)
    const todayRow = queryOne<{ count: number }>(
      `SELECT COUNT(*) as count FROM accidents a LEFT JOIN locations l ON a.location_id = l.location_id 
       ${whereClause ? whereClause + ' AND' : 'WHERE'} a.accident_datetime >= datetime('now', '-1 day')`,
      params
    );

    // Locations represented
    const locRow = queryOne<{ count: number }>(
      `SELECT COUNT(DISTINCT l.region) as count FROM accidents a LEFT JOIN locations l ON a.location_id = l.location_id ${whereClause}`,
      params
    );

    // Most frequent vehicle type
    const topVehicleRow = queryOne<{ vehicle_type: string; count: number }>(
      `SELECT a.vehicle_type, COUNT(*) as count FROM accidents a LEFT JOIN locations l ON a.location_id = l.location_id 
       ${whereClause ? whereClause + ' AND' : 'WHERE'} a.vehicle_type IS NOT NULL 
       GROUP BY a.vehicle_type ORDER BY count DESC LIMIT 1`,
      params
    );

    // Most frequent severity
    const topSeverityRow = queryOne<{ severity: string; count: number }>(
      `SELECT a.severity, COUNT(*) as count FROM accidents a LEFT JOIN locations l ON a.location_id = l.location_id 
       ${whereClause ? whereClause + ' AND' : 'WHERE'} a.severity IS NOT NULL 
       GROUP BY a.severity ORDER BY count DESC LIMIT 1`,
      params
    );

    // Monthly trend for small chart on dashboard
    const monthlyTrends = queryAll<{ month: string; count: number }>(
      `SELECT strftime('%Y-%m', a.accident_datetime) as month, COUNT(*) as count
       FROM accidents a LEFT JOIN locations l ON a.location_id = l.location_id
       ${whereClause ? whereClause + ' AND' : 'WHERE'} a.accident_datetime IS NOT NULL
       GROUP BY month ORDER BY month ASC LIMIT 12`,
      params
    );

    // Severity distribution for dashboard doughnut
    const severityDistribution = queryAll<{ severity: string; count: number }>(
      `SELECT COALESCE(a.severity, 'Not Recorded') as severity, COUNT(*) as count
       FROM accidents a LEFT JOIN locations l ON a.location_id = l.location_id
       ${whereClause}
       GROUP BY a.severity ORDER BY count DESC`,
      params
    );

    // Vehicle distribution
    const vehicleDistribution = queryAll<{ vehicle_type: string; count: number }>(
      `SELECT COALESCE(a.vehicle_type, 'Not Recorded') as vehicle_type, COUNT(*) as count
       FROM accidents a LEFT JOIN locations l ON a.location_id = l.location_id
       ${whereClause}
       GROUP BY a.vehicle_type ORDER BY count DESC LIMIT 8`,
      params
    );

    // Location top regions
    const topRegions = queryAll<{ region: string; count: number }>(
      `SELECT COALESCE(l.region, 'Unknown Region') as region, COUNT(*) as count
       FROM accidents a LEFT JOIN locations l ON a.location_id = l.location_id
       ${whereClause}
       GROUP BY l.region ORDER BY count DESC LIMIT 6`,
      params
    );

    // Weather counts
    const weatherSummary = queryAll<{ weather: string; count: number }>(
      `SELECT COALESCE(a.weather, 'Missing Weather Data') as weather, COUNT(*) as count
       FROM accidents a LEFT JOIN locations l ON a.location_id = l.location_id
       ${whereClause}
       GROUP BY a.weather ORDER BY count DESC`,
      params
    );

    res.json({
      success: true,
      data: {
        totalAccidents,
        accidentsToday: todayRow?.count || 0,
        accidentsThisMonth: thisMonthRow?.count || 0,
        locationsRepresented: locRow?.count || 0,
        mostFrequentVehicle: topVehicleRow ? topVehicleRow.vehicle_type : 'N/A',
        mostFrequentSeverity: topSeverityRow ? topSeverityRow.severity : 'N/A',
        monthlyTrends,
        severityDistribution,
        vehicleDistribution,
        topRegions,
        weatherSummary,
        lastUpdated: new Date().toISOString()
      }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 2. GET /api/accidents - Paginated and searchable records
apiRouter.get('/accidents', (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.max(1, Math.min(100, parseInt(req.query.limit as string) || 15));
    const offset = (page - 1) * limit;

    const conditions: string[] = [];
    const params: any[] = [];

    const search = req.query.search as string;
    if (search && search.trim()) {
      const s = `%${search.trim()}%`;
      conditions.push(`(
        a.source_record_id LIKE ? OR 
        l.road_name LIKE ? OR 
        l.region LIKE ? OR 
        a.vehicle_type LIKE ? OR 
        a.severity LIKE ? OR 
        a.weather LIKE ? OR 
        a.source_name LIKE ?
      )`);
      params.push(s, s, s, s, s, s, s);
    }

    if (req.query.region) {
      conditions.push('l.region = ?');
      params.push(req.query.region);
    }
    if (req.query.vehicleType) {
      conditions.push('a.vehicle_type = ?');
      params.push(req.query.vehicleType);
    }
    if (req.query.severity) {
      conditions.push('a.severity = ?');
      params.push(req.query.severity);
    }
    if (req.query.weather) {
      if (req.query.weather === 'Missing') {
        conditions.push('a.weather IS NULL');
      } else {
        conditions.push('a.weather = ?');
        params.push(req.query.weather);
      }
    }
    if (req.query.startDate) {
      conditions.push('a.accident_datetime >= ?');
      params.push(req.query.startDate);
    }
    if (req.query.endDate) {
      conditions.push('a.accident_datetime <= ?');
      params.push(req.query.endDate + ' 23:59:59');
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const allowedSortColumns: Record<string, string> = {
      accident_id: 'a.accident_id',
      accident_datetime: 'a.accident_datetime',
      region: 'l.region',
      road_name: 'l.road_name',
      vehicle_type: 'a.vehicle_type',
      severity: 'a.severity',
      weather: 'a.weather',
      source_name: 'a.source_name'
    };

    const sortByParam = (req.query.sortBy as string) || 'accident_datetime';
    const sortCol = allowedSortColumns[sortByParam] || 'a.accident_datetime';
    const sortOrder = (req.query.sortOrder as string)?.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    // Count query
    const totalRow = queryOne<{ count: number }>(
      `SELECT COUNT(*) as count FROM accidents a LEFT JOIN locations l ON a.location_id = l.location_id ${whereClause}`,
      params
    );
    const total = totalRow?.count || 0;

    // Data query
    const records = queryAll(
      `SELECT 
        a.accident_id,
        a.source_record_id,
        a.accident_datetime,
        a.location_id,
        l.region,
        l.road_name,
        l.latitude,
        l.longitude,
        a.vehicle_type,
        a.severity,
        a.weather,
        a.source_name,
        a.imported_at
       FROM accidents a 
       LEFT JOIN locations l ON a.location_id = l.location_id
       ${whereClause}
       ORDER BY ${sortCol} ${sortOrder}
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    res.json({
      success: true,
      records,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 3. POST /api/accidents - Create a new accident record
apiRouter.post('/accidents', (req, res) => {
  try {
    const {
      source_record_id,
      accident_datetime,
      region,
      road_name,
      latitude,
      longitude,
      vehicle_type,
      severity,
      weather,
      source_name
    } = req.body;

    if (!region || !region.trim()) {
      return res.status(400).json({ success: false, error: 'Region is required for location tracking.' });
    }

    // Find or create location
    let locationId: number | null = null;
    const existingLoc = queryOne<{ location_id: number }>(
      `SELECT location_id FROM locations WHERE region = ? AND (road_name = ? OR (road_name IS NULL AND ? IS NULL)) LIMIT 1`,
      [region.trim(), road_name?.trim() || null, road_name?.trim() || null]
    );

    if (existingLoc) {
      locationId = existingLoc.location_id;
      // If lat/lng provided and was null, update it
      if (latitude !== undefined && longitude !== undefined && latitude !== null && longitude !== null) {
        runSql(`UPDATE locations SET latitude = ?, longitude = ? WHERE location_id = ? AND latitude IS NULL`, [
          parseFloat(latitude),
          parseFloat(longitude),
          locationId
        ]);
      }
    } else {
      const latVal = latitude ? parseFloat(latitude) : null;
      const lngVal = longitude ? parseFloat(longitude) : null;
      const locResult = runSql(
        `INSERT INTO locations (region, road_name, latitude, longitude) VALUES (?, ?, ?, ?)`,
        [region.trim(), road_name?.trim() || null, latVal, lngVal]
      );
      locationId = locResult.lastInsertRowId;
    }

    const genSourceId = source_record_id?.trim() || `MANUAL-${Date.now()}`;
    const srcName = source_name?.trim() || 'Manual Operator Entry';

    const insertResult = runSql(
      `INSERT INTO accidents (source_record_id, accident_datetime, location_id, vehicle_type, severity, weather, source_name)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        genSourceId,
        accident_datetime || null,
        locationId,
        vehicle_type?.trim() || null,
        severity?.trim() || null,
        weather?.trim() || null,
        srcName
      ]
    );

    const createdRecord = queryOne(
      `SELECT a.*, l.region, l.road_name, l.latitude, l.longitude 
       FROM accidents a LEFT JOIN locations l ON a.location_id = l.location_id 
       WHERE a.accident_id = ?`,
      [insertResult.lastInsertRowId]
    );

    res.status(201).json({ success: true, record: createdRecord });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 4. PUT /api/accidents/:id - Update an accident record
apiRouter.put('/accidents/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ success: false, error: 'Invalid record ID' });

    const existing = queryOne<{ location_id: number }>(`SELECT location_id FROM accidents WHERE accident_id = ?`, [id]);
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Accident record not found' });
    }

    const {
      source_record_id,
      accident_datetime,
      region,
      road_name,
      latitude,
      longitude,
      vehicle_type,
      severity,
      weather,
      source_name
    } = req.body;

    // Update location or link to new one
    let locId = existing.location_id;
    if (region) {
      if (locId) {
        runSql(
          `UPDATE locations SET region = ?, road_name = ?, latitude = ?, longitude = ? WHERE location_id = ?`,
          [
            region.trim(),
            road_name ? road_name.trim() : null,
            latitude !== undefined && latitude !== null && latitude !== '' ? parseFloat(latitude) : null,
            longitude !== undefined && longitude !== null && longitude !== '' ? parseFloat(longitude) : null,
            locId
          ]
        );
      } else {
        const locRes = runSql(
          `INSERT INTO locations (region, road_name, latitude, longitude) VALUES (?, ?, ?, ?)`,
          [
            region.trim(),
            road_name ? road_name.trim() : null,
            latitude ? parseFloat(latitude) : null,
            longitude ? parseFloat(longitude) : null
          ]
        );
        locId = locRes.lastInsertRowId;
      }
    }

    runSql(
      `UPDATE accidents SET 
        source_record_id = COALESCE(?, source_record_id),
        accident_datetime = ?,
        location_id = ?,
        vehicle_type = ?,
        severity = ?,
        weather = ?,
        source_name = COALESCE(?, source_name)
       WHERE accident_id = ?`,
      [
        source_record_id || null,
        accident_datetime || null,
        locId,
        vehicle_type || null,
        severity || null,
        weather || null,
        source_name || null,
        id
      ]
    );

    const updated = queryOne(
      `SELECT a.*, l.region, l.road_name, l.latitude, l.longitude 
       FROM accidents a LEFT JOIN locations l ON a.location_id = l.location_id 
       WHERE a.accident_id = ?`,
      [id]
    );

    res.json({ success: true, record: updated });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 5. DELETE /api/accidents/:id - Delete record with authorization verification
apiRouter.delete('/accidents/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ success: false, error: 'Invalid record ID' });

    const existing = queryOne(`SELECT accident_id FROM accidents WHERE accident_id = ?`, [id]);
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Accident record not found' });
    }

    runSql(`DELETE FROM accidents WHERE accident_id = ?`, [id]);
    res.json({ success: true, message: `Record ${id} successfully deleted.` });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 6. POST /api/import - CSV Batch Import & Validation
apiRouter.post('/import', (req, res) => {
  try {
    const { rows, filename, sourceName, mapping } = req.body;

    if (!Array.isArray(rows) || rows.length === 0) {
      return res.status(400).json({ success: false, error: 'No row data received for batch import.' });
    }

    const cleanFilename = filename?.trim() || `upload_${Date.now()}.csv`;
    const cleanSourceName = sourceName?.trim() || 'Uploaded CSV Dataset';

    // Register or find data source
    let sourceId: number | null = null;
    const existingSource = queryOne<{ source_id: number }>(
      `SELECT source_id FROM data_sources WHERE source_name = ? LIMIT 1`,
      [cleanSourceName]
    );
    if (existingSource) {
      sourceId = existingSource.source_id;
    } else {
      const srcRes = runSql(
        `INSERT INTO data_sources (source_name, source_type, description, is_synthetic) 
         VALUES (?, 'CSV_BATCH', 'User-uploaded accident dataset with validation audit', 0)`,
        [cleanSourceName]
      );
      sourceId = srcRes.lastInsertRowId;
    }

    const validCategories = {
      severity: ['Property Damage Only', 'Minor Injury', 'Serious Injury', 'Fatal', 'PDO', 'Fatal Crash', 'Non-Injury'],
      vehicle: ['Passenger Car', 'SUV', 'Pickup Truck', 'Commercial Truck', 'Motorcycle', 'Transit Bus', 'Bicycle', 'Light Van', 'Pedestrian', 'Other Vehicle']
    };

    let totalRows = rows.length;
    let successfulRows = 0;
    let rejectedRows = 0;
    let duplicateRows = 0;
    let missingValueRows = 0;

    const rejectedItems: Array<{ rowNumber: number; reason: string; rowData: any }> = [];
    const validRecordsToInsert: any[] = [];

    // Preload existing source_record_ids to detect duplicates reliably
    const existingIds = new Set(
      queryAll<{ source_record_id: string }>(`SELECT source_record_id FROM accidents WHERE source_record_id IS NOT NULL`)
        .map(r => r.source_record_id)
    );

    const m = mapping || {
      source_record_id: 'source_record_id',
      accident_datetime: 'accident_datetime',
      region: 'region',
      road_name: 'road_name',
      latitude: 'latitude',
      longitude: 'longitude',
      vehicle_type: 'vehicle_type',
      severity: 'severity',
      weather: 'weather'
    };

    rows.forEach((rawRow, idx) => {
      const rowNum = idx + 1;
      const sourceRecordId = rawRow[m.source_record_id]?.toString().trim() || null;
      const dateVal = rawRow[m.accident_datetime]?.toString().trim() || null;
      const region = rawRow[m.region]?.toString().trim() || null;
      const roadName = rawRow[m.road_name]?.toString().trim() || null;
      const vehicleType = rawRow[m.vehicle_type]?.toString().trim() || null;
      const severity = rawRow[m.severity]?.toString().trim() || null;
      const weather = rawRow[m.weather]?.toString().trim() || null;
      const latRaw = rawRow[m.latitude];
      const lngRaw = rawRow[m.longitude];

      // Validation check 1: duplicate detection
      if (sourceRecordId && existingIds.has(sourceRecordId)) {
        duplicateRows++;
        rejectedRows++;
        rejectedItems.push({
          rowNumber: rowNum,
          reason: `Duplicate source record identifier "${sourceRecordId}" already exists in the database.`,
          rowData: rawRow
        });
        return;
      }

      // Validation check 2: must have at least region or date to be an intelligible record
      if (!region && !dateVal) {
        rejectedRows++;
        rejectedItems.push({
          rowNumber: rowNum,
          reason: 'Record lacks both date/time and geographic region. Critical minimum information missing.',
          rowData: rawRow
        });
        return;
      }

      // Validation check 3: date validity if present
      let parsedDate: string | null = null;
      if (dateVal) {
        const d = new Date(dateVal);
        if (isNaN(d.getTime())) {
          rejectedRows++;
          rejectedItems.push({
            rowNumber: rowNum,
            reason: `Invalid datetime format: "${dateVal}". Must be ISO-8601 or YYYY-MM-DD HH:MM.`,
            rowData: rawRow
          });
          return;
        }
        parsedDate = d.toISOString().replace('T', ' ').substring(0, 19);
      }

      // Coordinate checks: if coordinates exist, validate boundaries
      let lat: number | null = null;
      let lng: number | null = null;
      if (latRaw !== undefined && latRaw !== null && latRaw !== '' && lngRaw !== undefined && lngRaw !== null && lngRaw !== '') {
        const parsedLat = parseFloat(latRaw);
        const parsedLng = parseFloat(lngRaw);
        if (!isNaN(parsedLat) && !isNaN(parsedLng)) {
          if (parsedLat >= -90 && parsedLat <= 90 && parsedLng >= -180 && parsedLng <= 180) {
            lat = parsedLat;
            lng = parsedLng;
          } else {
            // Out of bounds coordinates: do not reject the whole accident, but do not invent coordinates
            lat = null;
            lng = null;
          }
        }
      }

      // Track missing non-critical attributes
      const hasMissingValues = !dateVal || !region || !vehicleType || !severity || !weather;
      if (hasMissingValues) {
        missingValueRows++;
      }

      if (sourceRecordId) {
        existingIds.add(sourceRecordId);
      }

      validRecordsToInsert.push({
        source_record_id: sourceRecordId || `IMP-${Date.now()}-${rowNum}`,
        accident_datetime: parsedDate,
        region: region || 'Unspecified Region',
        road_name: roadName,
        latitude: lat,
        longitude: lng,
        vehicle_type: vehicleType,
        severity: severity,
        weather: weather,
        source_name: cleanSourceName
      });
    });

    // Batch insert valid records into locations and accidents
    for (const item of validRecordsToInsert) {
      let locId: number | null = null;
      const existingLoc = queryOne<{ location_id: number }>(
        `SELECT location_id FROM locations WHERE region = ? AND (road_name = ? OR (road_name IS NULL AND ? IS NULL)) LIMIT 1`,
        [item.region, item.road_name, item.road_name]
      );

      if (existingLoc) {
        locId = existingLoc.location_id;
        if (item.latitude !== null && item.longitude !== null) {
          runSql(`UPDATE locations SET latitude = ?, longitude = ? WHERE location_id = ? AND latitude IS NULL`, [
            item.latitude,
            item.longitude,
            locId
          ]);
        }
      } else {
        const locRes = runSql(
          `INSERT INTO locations (region, road_name, latitude, longitude) VALUES (?, ?, ?, ?)`,
          [item.region, item.road_name, item.latitude, item.longitude]
        );
        locId = locRes.lastInsertRowId;
      }

      runSql(
        `INSERT INTO accidents (source_record_id, accident_datetime, location_id, vehicle_type, severity, weather, source_name)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          item.source_record_id,
          item.accident_datetime,
          locId,
          item.vehicle_type,
          item.severity,
          item.weather,
          item.source_name
        ]
      );
      successfulRows++;
    }

    // Record import history audit
    runSql(
      `INSERT INTO import_history (source_id, filename, total_rows, successful_rows, rejected_rows, duplicate_rows, missing_value_rows, validation_status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        sourceId,
        cleanFilename,
        totalRows,
        successfulRows,
        rejectedRows,
        duplicateRows,
        missingValueRows,
        rejectedRows > 0 && successfulRows === 0 ? 'FAILED' : 'COMPLETED'
      ]
    );

    res.json({
      success: true,
      summary: {
        totalRows,
        successfulRows,
        rejectedRows,
        duplicateRows,
        missingValueRows,
        rejectedItems: rejectedItems.slice(0, 50), // return first 50 rejected reasons
        filename: cleanFilename,
        importedAt: new Date().toISOString()
      }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 7. GET /api/analytics/trends - Time-based analysis
apiRouter.get('/analytics/trends', (req, res) => {
  try {
    const { whereClause, params } = buildFilterClause(req.query);

    // Hourly distribution (0-23)
    const hourly = queryAll<{ hour: number; count: number }>(
      `SELECT CAST(strftime('%H', a.accident_datetime) AS INTEGER) as hour, COUNT(*) as count
       FROM accidents a LEFT JOIN locations l ON a.location_id = l.location_id
       ${whereClause ? whereClause + ' AND' : 'WHERE'} a.accident_datetime IS NOT NULL
       GROUP BY hour ORDER BY hour ASC`,
      params
    );

    // Weekday distribution (0 = Sunday, 6 = Saturday)
    const weekday = queryAll<{ weekday: number; count: number }>(
      `SELECT CAST(strftime('%w', a.accident_datetime) AS INTEGER) as weekday, COUNT(*) as count
       FROM accidents a LEFT JOIN locations l ON a.location_id = l.location_id
       ${whereClause ? whereClause + ' AND' : 'WHERE'} a.accident_datetime IS NOT NULL
       GROUP BY weekday ORDER BY weekday ASC`,
      params
    );

    // Monthly distribution
    const monthly = queryAll<{ month: string; count: number }>(
      `SELECT strftime('%Y-%m', a.accident_datetime) as month, COUNT(*) as count
       FROM accidents a LEFT JOIN locations l ON a.location_id = l.location_id
       ${whereClause ? whereClause + ' AND' : 'WHERE'} a.accident_datetime IS NOT NULL
       GROUP BY month ORDER BY month ASC`,
      params
    );

    // Daily distribution (last 60 days)
    const daily = queryAll<{ day: string; count: number }>(
      `SELECT date(a.accident_datetime) as day, COUNT(*) as count
       FROM accidents a LEFT JOIN locations l ON a.location_id = l.location_id
       ${whereClause ? whereClause + ' AND' : 'WHERE'} a.accident_datetime IS NOT NULL
       GROUP BY day ORDER BY day ASC LIMIT 90`,
      params
    );

    // Weekday vs Weekend
    let weekdayCount = 0;
    let weekendCount = 0;
    weekday.forEach(w => {
      if (w.weekday === 0 || w.weekday === 6) {
        weekendCount += w.count;
      } else {
        weekdayCount += w.count;
      }
    });

    res.json({
      success: true,
      data: {
        hourly,
        weekday,
        monthly,
        daily,
        weekdayVsWeekend: {
          weekday: weekdayCount,
          weekend: weekendCount
        }
      }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 8. GET /api/analytics/locations - Location ranking and high-count roads
apiRouter.get('/analytics/locations', (req, res) => {
  try {
    const { whereClause, params } = buildFilterClause(req.query);

    const regions = queryAll<{ region: string; count: number; fatal_count: number; serious_count: number }>(
      `SELECT 
        COALESCE(l.region, 'Unknown Region') as region, 
        COUNT(*) as count,
        SUM(CASE WHEN a.severity = 'Fatal' THEN 1 ELSE 0 END) as fatal_count,
        SUM(CASE WHEN a.severity = 'Serious Injury' THEN 1 ELSE 0 END) as serious_count
       FROM accidents a LEFT JOIN locations l ON a.location_id = l.location_id
       ${whereClause}
       GROUP BY l.region ORDER BY count DESC`,
      params
    );

    const roads = queryAll<{ road_name: string; region: string; count: number; fatal_count: number }>(
      `SELECT 
        COALESCE(l.road_name, 'Unspecified Road') as road_name,
        COALESCE(l.region, 'Unknown') as region,
        COUNT(*) as count,
        SUM(CASE WHEN a.severity = 'Fatal' THEN 1 ELSE 0 END) as fatal_count
       FROM accidents a LEFT JOIN locations l ON a.location_id = l.location_id
       ${whereClause ? whereClause + ' AND' : 'WHERE'} l.road_name IS NOT NULL
       GROUP BY l.road_name, l.region ORDER BY count DESC LIMIT 15`,
      params
    );

    res.json({
      success: true,
      data: {
        regions,
        roads,
        disclaimer: 'Geographic precision reflects recorded source attributes. High counts reflect recorded events and may be influenced by traffic exposure and reporting coverage rather than individual hazard risk.'
      }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 9. GET /api/analytics/vehicles - Vehicle type comparison & severity breakdown
apiRouter.get('/analytics/vehicles', (req, res) => {
  try {
    const { whereClause, params } = buildFilterClause(req.query);

    const vehicleSummary = queryAll<{ vehicle_type: string; count: number }>(
      `SELECT COALESCE(a.vehicle_type, 'Not Recorded') as vehicle_type, COUNT(*) as count
       FROM accidents a LEFT JOIN locations l ON a.location_id = l.location_id
       ${whereClause}
       GROUP BY a.vehicle_type ORDER BY count DESC`,
      params
    );

    const vehicleBySeverity = queryAll<{ vehicle_type: string; severity: string; count: number }>(
      `SELECT 
        COALESCE(a.vehicle_type, 'Not Recorded') as vehicle_type,
        COALESCE(a.severity, 'Unknown') as severity,
        COUNT(*) as count
       FROM accidents a LEFT JOIN locations l ON a.location_id = l.location_id
       ${whereClause}
       GROUP BY a.vehicle_type, a.severity
       ORDER BY vehicle_type ASC, count DESC`,
      params
    );

    res.json({
      success: true,
      data: {
        vehicleSummary,
        vehicleBySeverity,
        note: 'Counts reflect recorded vehicle involvement. Exposure metrics (traffic density, vehicle miles traveled) are necessary to assess normalized vehicle-type risk.'
      }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 10. GET /api/analytics/severity - Dedicated severity breakdown
apiRouter.get('/analytics/severity', (req, res) => {
  try {
    const { whereClause, params } = buildFilterClause(req.query);

    const totalWithSeverityRow = queryOne<{ count: number }>(
      `SELECT COUNT(*) as count FROM accidents a LEFT JOIN locations l ON a.location_id = l.location_id
       ${whereClause ? whereClause + ' AND' : 'WHERE'} a.severity IS NOT NULL`,
      params
    );

    const missingSeverityRow = queryOne<{ count: number }>(
      `SELECT COUNT(*) as count FROM accidents a LEFT JOIN locations l ON a.location_id = l.location_id
       ${whereClause ? whereClause + ' AND' : 'WHERE'} a.severity IS NULL`,
      params
    );

    const distribution = queryAll<{ severity: string; count: number }>(
      `SELECT a.severity, COUNT(*) as count
       FROM accidents a LEFT JOIN locations l ON a.location_id = l.location_id
       ${whereClause ? whereClause + ' AND' : 'WHERE'} a.severity IS NOT NULL
       GROUP BY a.severity ORDER BY count DESC`,
      params
    );

    const severityByRegion = queryAll<{ region: string; severity: string; count: number }>(
      `SELECT l.region, a.severity, COUNT(*) as count
       FROM accidents a LEFT JOIN locations l ON a.location_id = l.location_id
       ${whereClause ? whereClause + ' AND' : 'WHERE'} a.severity IS NOT NULL AND l.region IS NOT NULL
       GROUP BY l.region, a.severity ORDER BY count DESC`,
      params
    );

    const severityByHour = queryAll<{ hour: number; severity: string; count: number }>(
      `SELECT CAST(strftime('%H', a.accident_datetime) AS INTEGER) as hour, a.severity, COUNT(*) as count
       FROM accidents a LEFT JOIN locations l ON a.location_id = l.location_id
       ${whereClause ? whereClause + ' AND' : 'WHERE'} a.accident_datetime IS NOT NULL AND a.severity IS NOT NULL
       GROUP BY hour, a.severity ORDER BY hour ASC`,
      params
    );

    res.json({
      success: true,
      data: {
        totalKnownSeverity: totalWithSeverityRow?.count || 0,
        missingSeverityCount: missingSeverityRow?.count || 0,
        distribution,
        severityByRegion,
        severityByHour
      }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 11. GET /api/analytics/weather - Weather patterns & missing weather reporting
apiRouter.get('/analytics/weather', (req, res) => {
  try {
    const { whereClause, params } = buildFilterClause(req.query);

    const knownWeather = queryAll<{ weather: string; count: number; fatal_count: number }>(
      `SELECT 
        a.weather, 
        COUNT(*) as count,
        SUM(CASE WHEN a.severity = 'Fatal' THEN 1 ELSE 0 END) as fatal_count
       FROM accidents a LEFT JOIN locations l ON a.location_id = l.location_id
       ${whereClause ? whereClause + ' AND' : 'WHERE'} a.weather IS NOT NULL
       GROUP BY a.weather ORDER BY count DESC`,
      params
    );

    const missingWeatherRow = queryOne<{ count: number }>(
      `SELECT COUNT(*) as count FROM accidents a LEFT JOIN locations l ON a.location_id = l.location_id
       ${whereClause ? whereClause + ' AND' : 'WHERE'} a.weather IS NULL`,
      params
    );

    res.json({
      success: true,
      data: {
        knownWeather,
        missingWeatherCount: missingWeatherRow?.count || 0
      }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 12. GET /api/analytics/statistics - Statistical distribution (Mean, Median, StdDev, Min, Max)
apiRouter.get('/analytics/statistics', (req, res) => {
  try {
    const { whereClause, params } = buildFilterClause(req.query);

    // Group counts by calendar day
    const dailyCounts = queryAll<{ day: string; count: number }>(
      `SELECT date(a.accident_datetime) as day, COUNT(*) as count
       FROM accidents a LEFT JOIN locations l ON a.location_id = l.location_id
       ${whereClause ? whereClause + ' AND' : 'WHERE'} a.accident_datetime IS NOT NULL
       GROUP BY day ORDER BY count ASC`,
      params
    );

    if (dailyCounts.length === 0) {
      return res.json({
        success: true,
        data: {
          sampleSizeDays: 0,
          meanDaily: 0,
          medianDaily: 0,
          minDaily: 0,
          maxDaily: 0,
          stdDev: 0,
          notes: 'Empty dataset or no recorded datetimes matching active filters.'
        }
      });
    }

    const counts = dailyCounts.map(d => d.count);
    const n = counts.length;
    const sum = counts.reduce((acc, c) => acc + c, 0);
    const mean = sum / n;

    // Median
    let median = 0;
    if (n % 2 === 1) {
      median = counts[Math.floor(n / 2)];
    } else {
      median = (counts[n / 2 - 1] + counts[n / 2]) / 2;
    }

    const minDaily = counts[0];
    const maxDaily = counts[n - 1];

    // Standard deviation
    const variance = counts.reduce((acc, c) => acc + Math.pow(c - mean, 2), 0) / (n > 1 ? n - 1 : 1);
    const stdDev = Math.sqrt(variance);

    res.json({
      success: true,
      data: {
        sampleSizeDays: n,
        totalRecordedAccidents: sum,
        meanDaily: parseFloat(mean.toFixed(2)),
        medianDaily: parseFloat(median.toFixed(2)),
        minDaily,
        maxDaily,
        stdDev: parseFloat(stdDev.toFixed(2)),
        notes: 'Calculated from recorded daily events. Non-recorded days are not assumed to have zero events unless continuous coverage is verified.'
      }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 13. GET /api/map/accidents - Mappable coordinates & regional aggregates
apiRouter.get('/map/accidents', (req, res) => {
  try {
    const { whereClause, params } = buildFilterClause(req.query);

    // Mappable records with valid lat/long
    const mappable = queryAll(
      `SELECT 
        a.accident_id,
        a.source_record_id,
        a.accident_datetime,
        l.region,
        l.road_name,
        l.latitude,
        l.longitude,
        a.vehicle_type,
        a.severity,
        a.weather,
        a.source_name
       FROM accidents a 
       INNER JOIN locations l ON a.location_id = l.location_id
       ${whereClause ? whereClause + ' AND' : 'WHERE'} l.latitude IS NOT NULL AND l.longitude IS NOT NULL
       LIMIT 500`,
      params
    );

    // Unmapped count and region summary
    const unmappedByRegion = queryAll<{ region: string; unmapped_count: number }>(
      `SELECT COALESCE(l.region, 'Unknown Region') as region, COUNT(*) as unmapped_count
       FROM accidents a LEFT JOIN locations l ON a.location_id = l.location_id
       ${whereClause ? whereClause + ' AND' : 'WHERE'} (l.latitude IS NULL OR l.longitude IS NULL)
       GROUP BY l.region ORDER BY unmapped_count DESC`,
      params
    );

    const totalMappable = mappable.length;
    const totalUnmapped = unmappedByRegion.reduce((acc, r) => acc + r.unmapped_count, 0);

    res.json({
      success: true,
      mappable,
      unmappedByRegion,
      stats: {
        totalMappable,
        totalUnmapped,
        coordinateCoveragePct: totalMappable + totalUnmapped > 0 
          ? parseFloat(((totalMappable / (totalMappable + totalUnmapped)) * 100).toFixed(1))
          : 0
      },
      disclaimer: 'Coordinates represent verified record points. Locations without exact coordinates are aggregated regionally rather than approximated with fabricated points.'
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 14. GET /api/data-quality - Audit of missingness, invalid dates & import history
apiRouter.get('/data-quality', (req, res) => {
  try {
    const totalRow = queryOne<{ count: number }>(`SELECT COUNT(*) as count FROM accidents`);
    const totalRecords = totalRow?.count || 0;

    const missingDates = queryOne<{ count: number }>(`SELECT COUNT(*) as count FROM accidents WHERE accident_datetime IS NULL`)?.count || 0;
    const missingLocations = queryOne<{ count: number }>(`SELECT COUNT(*) as count FROM accidents WHERE location_id IS NULL`)?.count || 0;
    const missingVehicles = queryOne<{ count: number }>(`SELECT COUNT(*) as count FROM accidents WHERE vehicle_type IS NULL`)?.count || 0;
    const missingSeverity = queryOne<{ count: number }>(`SELECT COUNT(*) as count FROM accidents WHERE severity IS NULL`)?.count || 0;
    const missingWeather = queryOne<{ count: number }>(`SELECT COUNT(*) as count FROM accidents WHERE weather IS NULL`)?.count || 0;
    const missingCoordinates = queryOne<{ count: number }>(
      `SELECT COUNT(*) as count FROM accidents a LEFT JOIN locations l ON a.location_id = l.location_id WHERE l.latitude IS NULL OR l.longitude IS NULL`
    )?.count || 0;

    const importHistory = queryAll(`SELECT * FROM import_history ORDER BY imported_at DESC LIMIT 20`);
    const dataSources = queryAll(`SELECT * FROM data_sources ORDER BY imported_at DESC`);

    // Incomplete records sample for user inspection
    const incompleteSample = queryAll(
      `SELECT a.accident_id, a.source_record_id, a.accident_datetime, l.region, l.road_name, a.vehicle_type, a.severity, a.weather, a.source_name
       FROM accidents a LEFT JOIN locations l ON a.location_id = l.location_id
       WHERE a.accident_datetime IS NULL 
          OR a.vehicle_type IS NULL 
          OR a.severity IS NULL 
          OR a.weather IS NULL 
          OR l.latitude IS NULL
       LIMIT 15`
    );

    res.json({
      success: true,
      data: {
        totalRecords,
        missingDates,
        missingLocations,
        missingVehicles,
        missingSeverity,
        missingWeather,
        missingCoordinates,
        importHistory,
        dataSources,
        incompleteSample,
        auditedAt: new Date().toISOString()
      }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 15. GET /api/reports/data - Comprehensive report data extraction
apiRouter.get('/reports/data', (req, res) => {
  try {
    const { whereClause, params } = buildFilterClause(req.query);

    const totalRow = queryOne<{ count: number }>(
      `SELECT COUNT(*) as count FROM accidents a LEFT JOIN locations l ON a.location_id = l.location_id ${whereClause}`,
      params
    );

    const severities = queryAll<{ severity: string; count: number }>(
      `SELECT COALESCE(a.severity, 'Not Specified') as severity, COUNT(*) as count
       FROM accidents a LEFT JOIN locations l ON a.location_id = l.location_id
       ${whereClause} GROUP BY a.severity ORDER BY count DESC`,
      params
    );

    const vehicles = queryAll<{ vehicle_type: string; count: number }>(
      `SELECT COALESCE(a.vehicle_type, 'Not Specified') as vehicle_type, COUNT(*) as count
       FROM accidents a LEFT JOIN locations l ON a.location_id = l.location_id
       ${whereClause} GROUP BY a.vehicle_type ORDER BY count DESC LIMIT 8`,
      params
    );

    const topLocations = queryAll<{ region: string; road_name: string; count: number }>(
      `SELECT l.region, COALESCE(l.road_name, 'Multiple Roads') as road_name, COUNT(*) as count
       FROM accidents a LEFT JOIN locations l ON a.location_id = l.location_id
       ${whereClause} GROUP BY l.region, l.road_name ORDER BY count DESC LIMIT 10`,
      params
    );

    const sources = queryAll<{ source_name: string; count: number }>(
      `SELECT COALESCE(a.source_name, 'Standard Database') as source_name, COUNT(*) as count
       FROM accidents a LEFT JOIN locations l ON a.location_id = l.location_id
       ${whereClause} GROUP BY a.source_name ORDER BY count DESC`,
      params
    );

    res.json({
      success: true,
      report: {
        title: 'RoadSense AI Comprehensive Safety & Accident Audit',
        generatedAt: new Date().toISOString(),
        filtersApplied: req.query,
        totalRecords: totalRow?.count || 0,
        severities,
        vehicles,
        topLocations,
        sources,
        disclaimer: 'Results describe patterns in the available accident records and do not establish causation. Recorded counts may be affected by reporting practices, missing information, geographic coverage, and traffic exposure. Findings should not be interpreted as definitive measures of accident risk.'
      }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 16. GET /api/reports/csv - Direct CSV Export of filtered records
apiRouter.get('/reports/csv', (req, res) => {
  try {
    const { whereClause, params } = buildFilterClause(req.query);

    const records = queryAll<{
      accident_id: number;
      source_record_id: string;
      accident_datetime: string;
      region: string;
      road_name: string;
      latitude: number;
      longitude: number;
      vehicle_type: string;
      severity: string;
      weather: string;
      source_name: string;
    }>(
      `SELECT 
        a.accident_id,
        a.source_record_id,
        a.accident_datetime,
        l.region,
        l.road_name,
        l.latitude,
        l.longitude,
        a.vehicle_type,
        a.severity,
        a.weather,
        a.source_name
       FROM accidents a LEFT JOIN locations l ON a.location_id = l.location_id
       ${whereClause}
       ORDER BY a.accident_datetime DESC`,
      params
    );

    // Build CSV string
    const headers = ['accident_id', 'source_record_id', 'accident_datetime', 'region', 'road_name', 'latitude', 'longitude', 'vehicle_type', 'severity', 'weather', 'source_name'];
    const csvRows = [headers.join(',')];

    for (const r of records) {
      const values = [
        r.accident_id,
        `"${(r.source_record_id || '').replace(/"/g, '""')}"`,
        `"${r.accident_datetime || ''}"`,
        `"${(r.region || '').replace(/"/g, '""')}"`,
        `"${(r.road_name || '').replace(/"/g, '""')}"`,
        r.latitude ?? '',
        r.longitude ?? '',
        `"${(r.vehicle_type || '').replace(/"/g, '""')}"`,
        `"${(r.severity || '').replace(/"/g, '""')}"`,
        `"${(r.weather || '').replace(/"/g, '""')}"`,
        `"${(r.source_name || '').replace(/"/g, '""')}"`
      ];
      csvRows.push(values.join(','));
    }

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=roadsense_export_${Date.now()}.csv`);
    res.status(200).send(csvRows.join('\n'));
  } catch (err: any) {
    res.status(500).send(`Export error: ${err.message}`);
  }
});

// 17. POST /api/sample-data/reset - Re-seed demonstration data
apiRouter.post('/sample-data/reset', (req, res) => {
  try {
    resetDemonstrationData();
    res.json({ success: true, message: 'Demonstration dataset successfully reset to default synthetic benchmark.' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 18. POST /api/sample-data/clear - Clear synthetic demo data safely
apiRouter.post('/sample-data/clear', (req, res) => {
  try {
    const result = clearSampleData();
    res.json({ success: true, message: `Removed ${result.removed} demonstration records. User-uploaded datasets remain untouched.` });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 19. GET /api/system/status - Health and database provenance
apiRouter.get('/system/status', (req, res) => {
  try {
    const totalRow = queryOne<{ count: number }>(`SELECT COUNT(*) as count FROM accidents`);
    res.json({
      success: true,
      status: 'OPERATIONAL',
      serverTime: new Date().toISOString(),
      database: 'Relational ANSI/MySQL SQL Engine (SQLite with disk persistence)',
      totalRecords: totalRow?.count || 0,
      realtimeMode: 'Internal Database Periodic Polling (30s interval)',
      liveFeedAvailable: false,
      disclaimer: 'Real-time dashboard updates reflect newly added, edited, or uploaded database records. No synthetic live traffic simulator is fabricated.'
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});
