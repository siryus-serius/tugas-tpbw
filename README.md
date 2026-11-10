# WebGIS Longsor & Pergeseran Tanah Jawa Barat

Proyek tugas TPBW: peta kejadian longsor terverifikasi Jawa Barat (2021–2026) dan **deteksi otomatis anomali pergeseran tanah** dari Sentinel-1 InSAR, dilengkapi citra Sentinel-2 dan Sentinel-1 sebelum/sesudah kejadian.

## Fitur
- **Filter tahun**: menampilkan kejadian longsor, pin anomali, dan peta warna untuk tahun terpilih.
- **Pin anomali otomatis**: muncul bila kecepatan pergeseran tahun terpilih menyimpang signifikan dari rata-rata tahun-tahun sebelumnya, khusus area lereng (≥ 8°).
- **Peta warna Δ kecepatan (InSAR)**: merah berarti menjauhi satelit (turun/gerak lereng), biru berarti mendekati.
- **Panel detail kejadian**: Sentinel-2 warna asli dan NDVI, serta Sentinel-1 radar VV, sebelum dan sesudah kejadian.
- **Mosaik Sentinel-2 tahunan** (EOX cloudless 2019–2025).
- **Faktor Keamanan (FK) lereng**: kemiringan lereng (DEM) + skenario air tanah (Kering/Lembap/Jenuh) → model lereng tak hingga → warna titik Labil/Kritis/Stabil (Bowles 1989). Parameter tanah (c', φ', γ, z) bisa diubah dan FK dihitung ulang seketika.
- **Gempa**: BMKG terkini (live) + riwayat USGS sejak 2021; kaitan otomatis gempa ↔ longsor.
- **Prediksi kerawanan**: indeks gabungan FK, anomali InSAR, dan guncangan gempa 30 hari.
- **Validasi data**: 16 pemeriksaan otomatis, pembaruan bulanan hanya bila lolos.

## Arsitektur

```
.github/workflows/pipeline.yml   satu pipeline: data (mingguan) → lint + build → deploy GitHub Pages
scripts/
  pipeline.js                    entrypoint: node scripts/pipeline.js [events|insar|all]
  config.js                      path, frame LiCSAR, seluruh parameter metode
  stages/events.js               scene S1/S2 + kemiringan lereng per kejadian → sentinel_events.json
  stages/insar.js                anomali pergeseran tanah → insar/{anomalies.geojson, summary.json, *.png}
  lib/                           http, stac, licsar, raster, png, geo, terrain (modul murni & I/O terpisah)
Documents/WebGIS/jabar-landslide/src/
  App.jsx                        komposisi saja: data → filter → gempa → FK → kerawanan → tampilan
  config/constants.js            konstanta tampilan & domain
  services/                      dataApi (JSON statis), soilMoistureApi (Open-Meteo)
  hooks/                         useWebgisData, useMapFilters, useMonitoringPoints, useSoilMoisture, useSlopeStability
  utils/                         factorOfSafety (rumus FK & klasifikasi), sentinelImagery, markerColors, format
  components/map|sidebar|detail/ sub-komponen presentasi
```

Tidak ada server, database, maupun secret. Semua sumber data publik **tanpa login**:

| Data | Sumber |
|---|---|
| Kejadian longsor | BNPB / BPBD (dikurasi manual, `longsor_jabar_2021_2026.geojson`) |
| Interferogram Sentinel-1 | [COMET-LiCSAR](https://comet.nerc.ac.uk/comet-lics-portal/) (JASMIN + arsip CEDA) |
| Scene & render Sentinel-1 RTC / Sentinel-2 L2A | [Microsoft Planetary Computer](https://planetarycomputer.microsoft.com/) |
| Mosaik Sentinel-2 cloudless | [EOX s2maps.eu](https://s2maps.eu) (CC BY-NC-SA 4.0) |
| DEM Copernicus 90 m (kemiringan lereng titik kejadian) | [Open-Meteo Elevation API](https://open-meteo.com/) |
| Gempa terkini / riwayat gempa | [BMKG](https://data.bmkg.go.id/gempabumi) (wajib dicantumkan) / [USGS](https://earthquake.usgs.gov/fdsnws/event/1/) |

## Metode anomali pergeseran (ringkas)
1. Tiga frame LiCSAR mencakup Jabar: `098A_09673_121312` (asc), `047D_09652_111009` dan `149D_09700_081210` (desc).
2. Per tahun dipilih rantai interferogram berurutan 6–24 hari. Setiap interferogram di-multilook 2×2 (±220 m), dimasker koherensi ≥ 0,3, lalu di-*high-pass* ±2,6 km untuk membuang atmosfer dan ramp.
3. Kecepatan LOS tahunan dihitung dengan stacking: Σ pergeseran / Σ waktu. Piksel harus valid di ≥ 50% interferogram dan |v| ≤ 200 mm/thn.
4. Δv = v(tahun) − rata-rata tahun sebelumnya (baseline mulai 2019). Piksel dianggap anomali bila |Δv| ≥ 15 mm/thn, |z| ≥ 2,5, dan pencilan spasial (≥ 3×MAD).
5. Kelompok ≥ 3 piksel di lereng ≥ 8° menjadi satu pin.

**Keterbatasan:** C-band cepat kehilangan koherensi di lereng bervegetasi lebat, sehingga banyak lokasi longsor tidak punya piksel InSAR yang valid. Resolusi ±220 m hanya menangkap gerakan lambat yang luas. Pin adalah indikasi awal untuk dicek lapangan, bukan konfirmasi longsor.

## Faktor Keamanan lereng

FK = [c' + (γ − m·γw)·z·cos²β·tan φ'] / [γ·z·sin β·cos β] (lereng tak hingga), dengan m = rasio muka air sebagai **skenario** (0 kering, 0,5 lembap, 1 jenuh). Kemiringan β: kejadian = persentil-90 lereng ±400 m (DEM Copernicus 90 m); anomali = rata-rata klaster (DEM LiCSAR). FK adalah indikator regional, bukan pengganti uji geoteknik.

## Menjalankan

```bash
# Data (Node ≥ 22.2)
npm ci
npm run pipeline            # semua tahap; atau pipeline:events / pipeline:insar
                            # InSAR pertama kali ±30–40 menit, selanjutnya pakai cache data/insar/cache

# Web
cd Documents/WebGIS/jabar-landslide
npm ci
npm run lint && npm run build
npm run dev
```

Untuk deploy GitHub Pages, aktifkan sekali di **Settings → Pages → Source: GitHub Actions**.
