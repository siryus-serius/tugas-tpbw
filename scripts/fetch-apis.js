#!/usr/bin/env node
/**
 * GITHUB MACHINE: DATA FETCHER WITH ENVIRONMENT SECRETS SUPPORT
 * File: scripts/fetch-apis.js
 * 
 * Mendukung Secrets Environment dari GitHub Actions:
 * - API_URL_1 / API_TOKEN_1 (Opsional: Private Satellite / Custom API)
 * - API_URL_2 / API_TOKEN_2 (Opsional: Field Reports / Google Sheets)
 * - API_URL_3 / API_TOKEN_3 (Opsional: Notification Webhook / Telegram Bot)
 * 
 * Serta secara otomatis menarik telemetri real-time Jawa Barat:
 * - BMKG TEWS (Gempa Terkini Real-time)
 * - BMKG Himawari-9 (Citra Awan Konvektif & Hujan)
 * - Open-Meteo Satelit (Presipitasi & Kelembapan Tanah 7 Stasiun Jabar)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  getDatabase,
  insertTelemetryBatch,
  insertEarthquake,
  insertHimawariLog,
  insertCitizenReport,
  setSystemMetadata,
  exportDatabaseSnapshots
} from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Koordinat 7 Stasiun Pemantauan Kunci Jawa Barat (Zona Rawan Longsor & Sesar)
const MONITORING_STATIONS = {
  "Cianjur (Cugenang)": { lat: -6.82, lng: 107.10 },
  "Sukabumi (Cikembar)": { lat: -6.98, lng: 106.85 },
  "Bandung Barat (Lembang)": { lat: -6.82, lng: 107.61 },
  "Kab. Bandung (Kertasari)": { lat: -7.19, lng: 107.67 },
  "Garut (Pasirwangi)": { lat: -7.22, lng: 107.75 },
  "Sumedang (Tanjungsari)": { lat: -6.85, lng: 107.82 },
  "Bogor (Puncak Lereng)": { lat: -6.70, lng: 106.98 }
};

// Target direktori penyimpanan data
const ROOT_DATA_DIR = path.join(__dirname, '..', 'data');
const WEBGIS_PUBLIC_DATA_DIR = path.join(__dirname, '..', 'Documents', 'WebGIS', 'jabar-landslide', 'public', 'data');

for (const dir of [ROOT_DATA_DIR, WEBGIS_PUBLIC_DATA_DIR]) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

// 1. Ambil Data Gempa Real-time BMKG
async function fetchBMKGGempa() {
  console.log('[*] Menarik data gempa bumi terkini dari BMKG...');
  try {
    const res = await fetch('https://data.bmkg.go.id/DataMKG/TEWS/autogempa.json', {
      headers: { 'User-Agent': 'GitHub-Machine-Jabar-EWS/1.0' }
    });
    if (res.ok) {
      const data = await res.json();
      const gempa = data?.Infogempa?.gempa;
      console.log(`[+] Gempa Terkini BMKG: M ${gempa?.Magnitude} di ${gempa?.Wilayah}`);
      return gempa;
    }
  } catch (err) {
    console.warn('[-] Peringatan BMKG Gempa:', err.message);
  }
  return null;
}

// 2. Periksa Citra Satelit Cuaca Himawari-9 BMKG
async function fetchHimawariStatus() {
  console.log('[*] Memeriksa ketersediaan citra satelit cuaca Himawari-9 BMKG...');
  const products = {
    'EH': 'https://inderaja.bmkg.go.id/IMAGE/HIMA/H08_EH_Indonesia.png',
    'RP': 'https://inderaja.bmkg.go.id/IMAGE/HIMA/H08_RP_Indonesia.png',
    'NC': 'https://inderaja.bmkg.go.id/IMAGE/HIMA/H08_NC_Indonesia.png'
  };
  const statusResults = {};
  for (const [code, url] of Object.entries(products)) {
    try {
      const res = await fetch(url, { method: 'HEAD' });
      statusResults[code] = {
        url,
        tersedia: res.ok,
        terakhir_diperbarui: res.headers.get('last-modified') || new Date().toISOString()
      };
      console.log(`[+] Himawari-9 (${code}): ${res.status === 200 ? 'Aktif 200 OK' : 'Status ' + res.status}`);
    } catch (err) {
      statusResults[code] = { url, tersedia: false, error: err.message };
      console.warn(`[-] Gagal periksa Himawari-9 (${code}):`, err.message);
    }
  }
  return statusResults;
}

// 3. Ambil Telemetri Cuaca & Kelembapan Tanah 7 Stasiun Jawa Barat
async function fetchWeatherStations() {
  console.log('[*] Menarik data presipitasi & kelembapan tanah satelit via Open-Meteo...');
  const weatherResults = {};

  for (const [name, coords] of Object.entries(MONITORING_STATIONS)) {
    try {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${coords.lat}&longitude=${coords.lng}&current=temperature_2m,relative_humidity_2m,precipitation,rain&hourly=precipitation_probability,soil_moisture_0_to_7cm&timezone=Asia%2FJakarta`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        const curr = data?.current || {};
        const precip = curr.precipitation || 0;
        weatherResults[name] = {
          lat: coords.lat,
          lng: coords.lng,
          suhu_c: curr.temperature_2m,
          kelembapan_persen: curr.relative_humidity_2m,
          curah_hujan_mm: precip,
          status_hujan: precip > 10 ? 'Hujan Lebat' : (precip > 2 ? 'Hujan Sedang' : 'Aman / Berawan')
        };
      }
    } catch (err) {
      console.warn(`[-] Peringatan cuaca ${name}:`, err.message);
    }
  }
  return weatherResults;
}

// 4. Dukungan Fleksibel untuk Custom Secrets Environment (API_URL_1..3 & API_TOKEN_1..3)
async function fetchCustomAPIs() {
  const customData = {};
  const secretAPIs = [
    { id: 'api_1', url: process.env.API_URL_1, token: process.env.API_TOKEN_1 },
    { id: 'api_2', url: process.env.API_URL_2, token: process.env.API_TOKEN_2 },
    { id: 'api_3', url: process.env.API_URL_3, token: process.env.API_TOKEN_3 },
  ];

  for (const item of secretAPIs) {
    if (item.url && item.url.trim() !== '') {
      console.log(`[*] Menghubungi Custom API (${item.id}): ${item.url}...`);
      try {
        const headers = { 'User-Agent': 'GitHub-Machine-Jabar-EWS/1.0' };
        if (item.token && item.token.trim() !== '') {
          headers['Authorization'] = `Bearer ${item.token}`;
        }
        const res = await fetch(item.url, { headers });
        if (res.ok) {
          customData[item.id] = await res.json();
          console.log(`[+] Berhasil mengambil data dari ${item.id}`);
        } else {
          customData[item.id] = { status: res.status, statusText: res.statusText };
        }
      } catch (err) {
        console.warn(`[-] Peringatan ${item.id}:`, err.message);
        customData[item.id] = { error: err.message };
      }
    } else {
      // Secret belum diset di GitHub, abaikan tanpa error
    }
  }
  return customData;
}

async function main() {
  console.log('='.repeat(60));
  console.log('🚀 GITHUB ACTIONS DATA MACHINE: FETCH-APIS DIMULAI');
  console.log(`⏰ Timestamp UTC: ${new Date().toISOString()}`);
  console.log('='.repeat(60));

  // Inisialisasi Database SQLite
  const db = await getDatabase();

  const [gempa, himawariStatus, stationsWeather, customAPIs] = await Promise.all([
    fetchBMKGGempa(),
    fetchHimawariStatus(),
    fetchWeatherStations(),
    fetchCustomAPIs()
  ]);

  const timestamp = new Date().toISOString();

  // Simpan ke SQLite
  if (gempa) {
    insertEarthquake(db, gempa);
  }
  if (himawariStatus) {
    insertHimawariLog(db, himawariStatus, timestamp);
  }
  if (stationsWeather) {
    insertTelemetryBatch(db, stationsWeather, timestamp);
  }

  // Jika ada custom APIs yang berisi laporan lapangan / field reports
  if (customAPIs?.api_2 && Array.isArray(customAPIs.api_2)) {
    for (const rep of customAPIs.api_2) {
      insertCitizenReport(db, rep);
    }
  }

  setSystemMetadata(db, 'terakhir_fetch', timestamp);
  setSystemMetadata(db, 'status_runner', 'GitHub Actions Runner - Berhasil');

  // Ekspor Snapshot Database Terindeks
  const dbSummary = exportDatabaseSnapshots(db);

  const payload = {
    terakhir_diperbarui: timestamp,
    mesin_eksekusi: 'GitHub Actions Automated Cron Runner (fetch-apis.yml)',
    mesin_database: 'SQLite v3 (node:sqlite) + JSON Read-Replica',
    statistik_database: dbSummary.statistik,
    gempa_bmkg: gempa,
    himawari_9: himawariStatus,
    stasiun_cuaca_jabar: stationsWeather,
    custom_apis: Object.keys(customAPIs).length > 0 ? customAPIs : undefined,
    status_sistem: 'Normal Operasional'
  };

  // Simpan ke data/live-telemetry.json & data/latest.json
  const rootOutFile = path.join(ROOT_DATA_DIR, 'live-telemetry.json');
  const latestOutFile = path.join(ROOT_DATA_DIR, 'latest.json');

  fs.writeFileSync(rootOutFile, JSON.stringify(payload, null, 2), 'utf-8');
  fs.writeFileSync(latestOutFile, JSON.stringify(payload, null, 2), 'utf-8');

  // Simpan ke Documents/WebGIS/jabar-landslide/public/data/live-telemetry.json (untuk aplikasi WebGIS)
  const publicOutFile = path.join(WEBGIS_PUBLIC_DATA_DIR, 'live-telemetry.json');
  fs.writeFileSync(publicOutFile, JSON.stringify(payload, null, 2), 'utf-8');

  console.log(`[✅] Data snapshot & database SQLite berhasil diperbarui:`);
  console.log(`    1. ${path.join(ROOT_DATA_DIR, 'database.sqlite')}`);
  console.log(`    2. ${rootOutFile}`);
  console.log(`    3. ${latestOutFile}`);
  console.log(`    4. ${publicOutFile}`);
  console.log('='.repeat(60));
}

main().catch(err => {
  console.error('[FATAL] Kesalahan tidak terduga:', err);
  process.exit(1);
});
