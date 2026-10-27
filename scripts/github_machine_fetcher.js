#!/usr/bin/env node
/**
 * GITHUB MACHINE: AUTOMATED SATELLITE & SENSOR DATA FETCHER (NODE.JS)
 * Proyek: WebGIS & Early Warning System Longsor Jawa Barat
 * Berjalan di: GitHub Actions Runner (Cloud) atau Komputer Lokal
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 7 Stasiun Pemantauan Kunci Jawa Barat (Zona Rawan Longsor & Sesar)
const MONITORING_STATIONS = {
  "Cianjur (Cugenang)": { lat: -6.82, lng: 107.10 },
  "Sukabumi (Cikembar)": { lat: -6.98, lng: 106.85 },
  "Bandung Barat (Lembang)": { lat: -6.82, lng: 107.61 },
  "Kab. Bandung (Kertasari)": { lat: -7.19, lng: 107.67 },
  "Garut (Pasirwangi)": { lat: -7.22, lng: 107.75 },
  "Sumedang (Tanjungsari)": { lat: -6.85, lng: 107.82 },
  "Bogor (Puncak Lereng)": { lat: -6.70, lng: 106.98 }
};

const OUTPUT_DIR = path.join(__dirname, '..', 'Documents', 'WebGIS', 'jabar-landslide', 'public', 'data');
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

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
    console.warn('[-] Gagal fetch BMKG:', err.message);
  }
  return null;
}

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
      console.log(`[+] Himawari-9 (${code}): ${res.status === 200 ? 'Aktif 200 OK' : 'Non-aktif'}`);
    } catch (err) {
      statusResults[code] = { url, tersedia: false, error: err.message };
      console.warn(`[-] Gagal periksa Himawari-9 (${code}):`, err.message);
    }
  }
  return statusResults;
}

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
      console.warn(`[-] Gagal fetch cuaca ${name}:`, err.message);
    }
  }
  return weatherResults;
}

async function main() {
  console.log('='.repeat(60));
  console.log('🚀 GITHUB MACHINE: DATA FETCHER JABAR EWS DIMULAI');
  console.log(`⏰ Timestamp: ${new Date().toISOString()}`);
  console.log('='.repeat(60));

  const [gempa, himawariStatus, stationsWeather] = await Promise.all([
    fetchBMKGGempa(),
    fetchHimawariStatus(),
    fetchWeatherStations()
  ]);

  const payload = {
    terakhir_diperbarui: new Date().toISOString(),
    mesin_eksekusi: 'GitHub Actions Automated Cron Runner',
    gempa_bmkg: gempa,
    himawari_9: himawariStatus,
    stasiun_cuaca_jabar: stationsWeather,
    status_sistem: 'Normal Operasional'
  };

  const outFile = path.join(OUTPUT_DIR, 'live-telemetry.json');
  fs.writeFileSync(outFile, JSON.stringify(payload, null, 2), 'utf-8');

  console.log(`[✅] Data berhasil disimpan ke: ${outFile}`);
  console.log('='.repeat(60));
}

main();
