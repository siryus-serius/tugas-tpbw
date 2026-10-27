/**
 * DATABASE MANAGER UNTUK WEBGIS & SISTEM PERINGATAN DINI LONGSOR JAWA BARAT
 * File: scripts/db.js
 * 
 * Menggunakan SQLite embedded (node:sqlite) yang efisien, zero-cost, dan tanpa dependensi eksternal.
 * Menghasilkan:
 * 1. data/database.sqlite (Relational database terindeks, standar industri GIS)
 * 2. Export ke format JSON read-replica untuk WebGIS client (sub-50ms loading)
 * 3. Seeding otomatis data historis BNPB 2021-2025 & Klasifikasi Tanah 27 Kab/Kota
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ROOT_DATA_DIR = path.join(__dirname, '..', 'data');
const WEBGIS_PUBLIC_DATA_DIR = path.join(__dirname, '..', 'Documents', 'WebGIS', 'jabar-landslide', 'public', 'data');
const DB_FILE_PATH = path.join(ROOT_DATA_DIR, 'database.sqlite');

let dbInstance = null;

/**
 * Inisialisasi Database SQLite
 */
export async function getDatabase() {
  if (dbInstance) return dbInstance;

  if (!fs.existsSync(ROOT_DATA_DIR)) {
    fs.mkdirSync(ROOT_DATA_DIR, { recursive: true });
  }

  try {
    const { DatabaseSync } = await import('node:sqlite');
    dbInstance = new DatabaseSync(DB_FILE_PATH);
    
    // Aktifkan mode WAL untuk performa tinggi dan konkurensi optimal
    dbInstance.exec('PRAGMA journal_mode = WAL;');
    dbInstance.exec('PRAGMA synchronous = NORMAL;');
    
    initTables(dbInstance);
    seedInitialData(dbInstance);
    return dbInstance;
  } catch (err) {
    console.error('[-] Gagal menginisialisasi SQLite dengan node:sqlite:', err.message);
    throw err;
  }
}

/**
 * Skema Relational Database
 */
function initTables(db) {
  db.exec(`
    -- 1. Tabel Telemetri Stasiun Pemantauan Cuaca & Kelembapan Tanah
    CREATE TABLE IF NOT EXISTS telemetry_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      timestamp TEXT NOT NULL,
      station_id TEXT NOT NULL,
      lat REAL,
      lng REAL,
      temp_c REAL,
      humidity_pct REAL,
      rainfall_mm REAL,
      status TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_telemetry_ts ON telemetry_logs (timestamp);
    CREATE INDEX IF NOT EXISTS idx_telemetry_station ON telemetry_logs (station_id);

    -- 2. Tabel Kejadian Gempa Bumi BMKG TEWS
    CREATE TABLE IF NOT EXISTS earthquakes (
      id TEXT PRIMARY KEY,
      datetime TEXT NOT NULL,
      magnitude REAL,
      depth_km REAL,
      coordinates TEXT,
      lat REAL,
      lng REAL,
      region TEXT,
      potensi TEXT,
      shakemap_url TEXT,
      created_at TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_earthquakes_datetime ON earthquakes (datetime);

    -- 3. Tabel Riwayat Bencana & Korelasi Sesar/Longsor BNPB (2020-2025)
    CREATE TABLE IF NOT EXISTS landslide_events (
      id TEXT PRIMARY KEY,
      year INTEGER NOT NULL,
      nama TEXT NOT NULL,
      tanggal TEXT,
      lat REAL,
      lng REAL,
      wilayah TEXT,
      sesar_pemicu TEXT,
      korban_meninggal INTEGER DEFAULT 0,
      korban_luka INTEGER DEFAULT 0,
      mengungsi INTEGER DEFAULT 0,
      rumah_rusak INTEGER DEFAULT 0,
      korelasi_longsor TEXT,
      status_bnpb TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_landslide_year ON landslide_events (year);

    -- 4. Tabel Klasifikasi Karakteristik Tanah di 27 Kab/Kota Jawa Barat
    CREATE TABLE IF NOT EXISTS soil_classifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      wilayah TEXT UNIQUE NOT NULL,
      tipe TEXT,
      tanah_dominan TEXT,
      zona_fisiografi TEXT,
      tingkat_rawan_tanah TEXT,
      status TEXT,
      catatan TEXT
    );

    -- 5. Tabel Pemantauan Citra Satelit Cuaca Himawari-9 BMKG
    CREATE TABLE IF NOT EXISTS himawari_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      timestamp TEXT NOT NULL,
      product_code TEXT NOT NULL,
      url TEXT,
      available INTEGER DEFAULT 1,
      last_modified TEXT
    );

    -- 6. Tabel Laporan Partisipatif Lapangan Warga / Petugas EWS
    CREATE TABLE IF NOT EXISTS citizen_reports (
      id TEXT PRIMARY KEY,
      created_at TEXT NOT NULL,
      nama_pelapor TEXT,
      nomor_kontak TEXT,
      wilayah TEXT,
      coords TEXT,
      lat REAL,
      lng REAL,
      tingkat_bahaya TEXT,
      deskripsi TEXT,
      sync_status TEXT DEFAULT 'synced'
    );

    -- 7. Metadata Sistem & Riwayat Eksekusi GitHub Machine
    CREATE TABLE IF NOT EXISTS system_metadata (
      key TEXT PRIMARY KEY,
      value TEXT,
      updated_at TEXT
    );

    -- 8. Tabel Direktori Fasilitas Darurat (BPBD, SAR, Puskesmas Terdekat)
    CREATE TABLE IF NOT EXISTS emergency_facilities (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL,
      category_name TEXT,
      name TEXT NOT NULL,
      address TEXT,
      lat REAL NOT NULL,
      lng REAL NOT NULL,
      phone TEXT,
      phone_alt TEXT,
      hours TEXT,
      services TEXT,
      google_query TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_facilities_type ON emergency_facilities (type);
  `);
}

/**
 * Seeding Data Historis BNPB & Tanah jika tabel masih kosong
 */
function seedInitialData(db) {
  // 1. Cek & Seed Landslide Events
  const landslideCount = db.prepare('SELECT COUNT(*) as count FROM landslide_events').get().count;
  if (landslideCount === 0) {
    const bnpbJsonPath = path.join(WEBGIS_PUBLIC_DATA_DIR, 'jabar-earthquakes-bnpb.json');
    if (fs.existsSync(bnpbJsonPath)) {
      try {
        const raw = JSON.parse(fs.readFileSync(bnpbJsonPath, 'utf-8'));
        const events = raw.historicalDisasters || [];
        const insertStmt = db.prepare(`
          INSERT OR REPLACE INTO landslide_events 
          (id, year, nama, tanggal, lat, lng, wilayah, sesar_pemicu, korban_meninggal, korban_luka, mengungsi, rumah_rusak, korelasi_longsor, status_bnpb)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        for (const ev of events) {
          const yearMatch = ev.tanggal?.match(/202[0-9]/) || [2022];
          const year = parseInt(yearMatch[0], 10);
          const lat = ev.koordinat?.[0] || 0;
          const lng = ev.koordinat?.[1] || 0;
          const dead = ev.dampak?.meninggal || 0;
          const injured = ev.dampak?.luka_luka || 0;
          const displaced = ev.dampak?.mengungsi || 0;
          const houses = ev.dampak?.total_rumah_rusak || 0;

          insertStmt.run(
            ev.id,
            year,
            ev.nama || 'Kejadian Kebencanaan',
            ev.tanggal || '',
            lat,
            lng,
            ev.wilayah || '',
            ev.sesar_pemicu || '',
            dead,
            injured,
            displaced,
            houses,
            ev.korelasi_longsor || '',
            ev.status_bnpb || ''
          );
        }
        console.log(`[+] Database seeded: ${events.length} kejadian historis BNPB dimasukkan ke SQLite.`);
      } catch (err) {
        console.warn('[-] Gagal seed landslide_events:', err.message);
      }
    }
  }

  // 2. Cek & Seed Klasifikasi Tanah
  const soilCount = db.prepare('SELECT COUNT(*) as count FROM soil_classifications').get().count;
  if (soilCount === 0) {
    const soilJsonPath = path.join(WEBGIS_PUBLIC_DATA_DIR, 'jabar-soil-classification.json');
    if (fs.existsSync(soilJsonPath)) {
      try {
        const raw = JSON.parse(fs.readFileSync(soilJsonPath, 'utf-8'));
        const wilayahList = raw.wilayah || {};
        const insertSoilStmt = db.prepare(`
          INSERT OR REPLACE INTO soil_classifications 
          (wilayah, tipe, tanah_dominan, zona_fisiografi, tingkat_rawan_tanah, status, catatan)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `);
        let count = 0;
        for (const [namaWilayah, item] of Object.entries(wilayahList)) {
          insertSoilStmt.run(
            namaWilayah,
            item.tipe || 'Kabupaten',
            Array.isArray(item.tanah_dominan) ? item.tanah_dominan.join(', ') : (item.tanah_dominan || ''),
            item.zona_fisiografi || '',
            item.tingkat_rawan_tanah || '',
            item.status || '',
            item.catatan || ''
          );
          count++;
        }
        console.log(`[+] Database seeded: ${count} data klasifikasi tanah dimasukkan ke SQLite.`);
      } catch (err) {
        console.warn('[-] Gagal seed soil_classifications:', err.message);
      }
    }
  }

  // 3. Cek & Seed Emergency Facilities (BPBD, SAR, Puskesmas)
  const facCount = db.prepare('SELECT COUNT(*) as count FROM emergency_facilities').get().count;
  if (facCount === 0) {
    const facJsonPath = path.join(WEBGIS_PUBLIC_DATA_DIR, 'jabar-emergency-facilities.json');
    if (fs.existsSync(facJsonPath)) {
      try {
        const raw = JSON.parse(fs.readFileSync(facJsonPath, 'utf-8'));
        const facilities = raw.facilities || [];
        const insertFacStmt = db.prepare(`
          INSERT OR REPLACE INTO emergency_facilities 
          (id, type, category_name, name, address, lat, lng, phone, phone_alt, hours, services, google_query)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        for (const f of facilities) {
          insertFacStmt.run(
            f.id,
            f.type,
            f.categoryName || '',
            f.name,
            f.address || '',
            f.lat,
            f.lng,
            f.phone || '',
            f.phoneAlt || '',
            f.hours || '',
            Array.isArray(f.services) ? f.services.join(', ') : '',
            f.googlePlaceQuery || ''
          );
        }
        console.log(`[+] Database seeded: ${facilities.length} fasilitas darurat (BPBD, SAR, Puskesmas) dimasukkan ke SQLite.`);
      } catch (err) {
        console.warn('[-] Gagal seed emergency_facilities:', err.message);
      }
    }
  }
}

/**
 * Catat Telemetri Stasiun Cuaca
 */
export function insertTelemetryBatch(db, stationsData, timestamp) {
  const ts = timestamp || new Date().toISOString();
  const stmt = db.prepare(`
    INSERT INTO telemetry_logs (timestamp, station_id, lat, lng, temp_c, humidity_pct, rainfall_mm, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  let count = 0;
  for (const [stationName, data] of Object.entries(stationsData || {})) {
    stmt.run(
      ts,
      stationName,
      data.lat || 0,
      data.lng || 0,
      data.suhu_c || 0,
      data.kelembapan_persen || 0,
      data.curah_hujan_mm || 0,
      data.status_hujan || 'Normal'
    );
    count++;
  }
  return count;
}

/**
 * Catat Gempa BMKG
 */
export function insertEarthquake(db, gempa) {
  if (!gempa || !gempa.Wilayah) return false;

  const id = `EQ-${gempa.Tanggal?.replace(/\s+/g, '-')}-${gempa.Jam?.replace(/[:\s]/g, '')}-${gempa.Magnitude}`;
  const stmt = db.prepare(`
    INSERT OR REPLACE INTO earthquakes 
    (id, datetime, magnitude, depth_km, coordinates, lat, lng, region, potensi, shakemap_url, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const coords = gempa.Coordinates?.split(',') || [0, 0];
  const lat = parseFloat(coords[0]) || 0;
  const lng = parseFloat(coords[1]) || 0;
  const depth = parseFloat(gempa.Kedalaman?.replace(/[^0-9.]/g, '')) || 0;
  const mag = parseFloat(gempa.Magnitude) || 0;

  stmt.run(
    id,
    `${gempa.Tanggal} ${gempa.Jam}`,
    mag,
    depth,
    gempa.Coordinates || '',
    lat,
    lng,
    gempa.Wilayah || '',
    gempa.Potensi || '',
    gempa.Shakemap ? `https://data.bmkg.go.id/DataMKG/TEWS/${gempa.Shakemap}` : '',
    new Date().toISOString()
  );
  return true;
}

/**
 * Catat Log Himawari-9
 */
export function insertHimawariLog(db, himawariStatus, timestamp) {
  const ts = timestamp || new Date().toISOString();
  const stmt = db.prepare(`
    INSERT INTO himawari_logs (timestamp, product_code, url, available, last_modified)
    VALUES (?, ?, ?, ?, ?)
  `);

  for (const [code, info] of Object.entries(himawariStatus || {})) {
    stmt.run(
      ts,
      code,
      info.url || '',
      info.tersedia ? 1 : 0,
      info.terakhir_diperbarui || ''
    );
  }
}

/**
 * Catat Laporan Warga Baru
 */
export function insertCitizenReport(db, report) {
  const id = report.id || `REP-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const stmt = db.prepare(`
    INSERT OR REPLACE INTO citizen_reports 
    (id, created_at, nama_pelapor, nomor_kontak, wilayah, coords, lat, lng, tingkat_bahaya, deskripsi, sync_status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const lat = report.lat || (report.coords ? parseFloat(report.coords.split(',')[0]) : 0);
  const lng = report.lng || (report.coords ? parseFloat(report.coords.split(',')[1]) : 0);

  stmt.run(
    id,
    report.created_at || new Date().toISOString(),
    report.nama_pelapor || report.name || 'Warga Tanpa Nama',
    report.nomor_kontak || report.phone || '',
    report.wilayah || report.region || '',
    report.coords || `${lat}, ${lng}`,
    lat,
    lng,
    report.tingkat_bahaya || report.severity || 'Sedang',
    report.deskripsi || report.description || '',
    'synced'
  );
  return id;
}

/**
 * Update Metadata Sistem
 */
export function setSystemMetadata(db, key, value) {
  const stmt = db.prepare(`
    INSERT OR REPLACE INTO system_metadata (key, value, updated_at)
    VALUES (?, ?, ?)
  `);
  stmt.run(key, typeof value === 'string' ? value : JSON.stringify(value), new Date().toISOString());
}

/**
 * Ekspor Snapshot JSON Terindeks untuk Frontend WebGIS
 * (Memberikan kecepatan sub-50ms tanpa beban koneksi database di client)
 */
export function exportDatabaseSnapshots(db) {
  // 1. Query Statistik Ringkas
  const totalTelemetry = db.prepare('SELECT COUNT(*) as total FROM telemetry_logs').get().total;
  const totalEarthquakes = db.prepare('SELECT COUNT(*) as total FROM earthquakes').get().total;
  const totalLandslides = db.prepare('SELECT COUNT(*) as total FROM landslide_events').get().total;
  const totalCitizenReports = db.prepare('SELECT COUNT(*) as total FROM citizen_reports').get().total;
  const totalSoil = db.prepare('SELECT COUNT(*) as total FROM soil_classifications').get().total;
  const totalFacilities = db.prepare('SELECT COUNT(*) as total FROM emergency_facilities').get().total;

  // 2. Ambil 20 Log Telemetri Terakhir
  const recentTelemetry = db.prepare(`
    SELECT timestamp, station_id, lat, lng, temp_c, humidity_pct, rainfall_mm, status
    FROM telemetry_logs
    ORDER BY id DESC
    LIMIT 21
  `).all();

  // 3. Ambil 5 Gempa Terakhir
  const recentEarthquakes = db.prepare(`
    SELECT id, datetime, magnitude, depth_km, lat, lng, region, potensi, shakemap_url
    FROM earthquakes
    ORDER BY datetime DESC
    LIMIT 5
  `).all();

  // 4. Ambil Semua Kejadian Longsor Historis
  const historicalLandslides = db.prepare(`
    SELECT * FROM landslide_events ORDER BY year DESC, id ASC
  `).all();

  // 5. Ambil Semua Laporan Warga
  const citizenReports = db.prepare(`
    SELECT * FROM citizen_reports ORDER BY created_at DESC LIMIT 50
  `).all();

  const summary = {
    metadata: {
      terakhir_ekspor: new Date().toISOString(),
      mesin_database: 'SQLite v3 (node:sqlite) + Edge JSON Read-Replica',
      status: 'Terhubung & Terindeks',
      lokasi_db: 'data/database.sqlite'
    },
    statistik: {
      total_telemetri_tersimpan: totalTelemetry,
      total_gempa_tercatat: totalEarthquakes,
      total_kejadian_longsor_historis: totalLandslides,
      total_laporan_masyarakat: totalCitizenReports,
      total_wilayah_klasifikasi_tanah: totalSoil,
      total_fasilitas_darurat: totalFacilities
    },
    telemetri_terkini: recentTelemetry,
    gempa_terkini: recentEarthquakes,
    kejadian_longsor: historicalLandslides,
    laporan_masyarakat: citizenReports
  };

  const jsonStr = JSON.stringify(summary, null, 2);

  // Simpan ke data/database-summary.json
  const rootSummaryPath = path.join(ROOT_DATA_DIR, 'database-summary.json');
  fs.writeFileSync(rootSummaryPath, jsonStr, 'utf-8');

  // Simpan ke Documents/WebGIS/jabar-landslide/public/data/database-summary.json
  const publicSummaryPath = path.join(WEBGIS_PUBLIC_DATA_DIR, 'database-summary.json');
  fs.writeFileSync(publicSummaryPath, jsonStr, 'utf-8');

  console.log(`[✅] Snapshot database terindeks diekspor ke:`);
  console.log(`     - ${rootSummaryPath}`);
  console.log(`     - ${publicSummaryPath}`);

  return summary;
}
