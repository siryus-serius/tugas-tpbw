# WebGIS Pemetaan Daerah Rawan Longsor Jawa Barat (2021–2025)

Repository untuk proyek tugas TPBW (Teknologi Penginderaan Jauh & WebGIS):
**"Pemetaan Daerah Rawan Longsor di Provinsi Jawa Barat Periode 2021–2025"**

---

## 📌 Deskripsi Proyek
Website WebGIS interaktif berbasis React dan Leaflet untuk visualisasi spasial serta penginderaan jauh dalam memetakan kerawanan bencana longsor di Provinsi Jawa Barat menggunakan data temporal 2021–2025.

### Fitur Utama:
- 🗺️ **Peta Interaktif Jawa Barat**: Batas administrasi 27 kabupaten/kota.
- 🛰️ **Citra Satelit & Indeks**: Sentinel-1 SAR, Sentinel-2 Optical, NDVI.
- 🏔️ **Topografi & Medan**: Model Elevasi Digital (SRTM DEM) dan Kemiringan Lereng (*Slope*).
- 🌧️ **Klimatologi**: Ringkasan curah hujan historis (CHIRPS).
- 📅 **Filter Temporal**: Pemilih tahun 2021, 2022, 2023, 2024, dan 2025.
- 🎛️ **Kontrol Layer & Legenda**: Panel HUD terapung modern dengan pengaturan opasitas dan legenda dinamis.

---

## 🛠️ Arsitektur & Teknologi
- **Frontend**: React 19, Vite, Leaflet, React-Leaflet
- **Data Spasial**: GeoJSON Jawa Barat, Earth Engine raster tile services
- **Styling**: Modern dark glassmorphic CSS, responsive UI
- **AI Custom Skills**: Antigravity UI/UX & Architecture Customization

---

## 🚀 Memulai Proyek Lokal

```bash
# Masuk ke folder aplikasi
cd Documents/WebGIS/jabar-landslide

# Instal dependensi
npm install

# Jalankan server pengembangan
npm run dev
```
Buka browser pada tautan yang diberikan terminal (biasanya `http://localhost:5173`).
