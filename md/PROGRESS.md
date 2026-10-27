# DOKUMEN PROGRESS PROYEK WEBGIS
## Pemetaan Daerah Rawan Longsor di Provinsi Jawa Barat Periode 2021–2025

* **Terakhir Diperbarui:** 20 Oktober 2026
* **Peran Mentor:** Pendampingan bertahap, sistematis, ramah pemula, dan berorientasi hasil ilmiah faktual.
* **Lingkungan Kerja:**
  * Sistem Operasi: Windows 11
  * Editor / IDE: Antigravity IDE
  * Node.js: `v24.22.0` | npm: `11.19.1`
  * Direktori Kerja: `D:\project tpbw\Documents\WebGIS\jabar-landslide`
  * Frontend Framework: React 19 + Vite
  * Peta Interaktif: Leaflet & React-Leaflet
  * Backend & Pengolahan Citra: Google Earth Engine (GEE)

---

## 1. STATUS TAHAPAN PROYEK (ROADMAP 9 TAHAP)

| Tahap | Deskripsi | Status | Keterangan |
| :--- | :--- | :---: | :--- |
| **Tahap 1** | Pemeriksaan Lingkungan Kerja | **SELESAI** | Node.js, npm, Antigravity IDE terverifikasi siap. |
| **Tahap 2** | Pembuatan Proyek React + Vite | **SELESAI** | Proyek berjalan normal di `http://localhost:5173/`. |
| **Tahap 3** | Peta Dasar, Batas Wilayah & UI Glassmorphism | **SELESAI** | Peta Jawa Barat, batas 27 Kab/Kota, basemap switcher, tema translucent aktif. |
| **Tahap 4** | Akses & Pengenalan Google Earth Engine (GEE) | **SELESAI** | Berhasil menyiapkan proyek Cloud GEE `tugas-tpbw-510613`. |
| **Tahap 5** | Pengolahan Dataset Satelit Faktual di GEE | **SELESAI** | Sentinel-2 RGB, DEM SRTM Slope, CHIRPS (2021–2025) terproses. |
| **Tahap 6** | Integrasi Layer Satelit ke WebGIS | **SELESAI** | URL Tile GEE terhubung ke Leaflet TileLayer secara dinamis & interaktif. |
| **Tahap 7** | Penyempurnaan Antarmuka WebGIS | **SEDANG BERJALAN** | Slider transparansi, kontrol multi-layer, dan legenda satelit aktif. |
| **Tahap 8** | Pengujian & Dokumentasi Proyek | *Antrean* | Uji performa, penanganan error, pembuatan laporan/README akademik. |
| **Tahap 9** | Pengembangan Lanjutan & Validasi Metodologi | *Antrean* | Skoring pembobotan (AHP/Bivariate) jika metodologi sudah siap. |

---

## 2. DETAIL CAPAIAN YANG SUDAH SELESAI (TAHAP 1–3)

### A. Konfigurasi Data Spasial Faktual
- Berkas data batas administrasi 27 Kabupaten/Kota Jawa Barat tersimpan di `public/data/jabar-adm.json` (sumber geoBoundaries ADM2).
- Sinkronisasi kode pemanggilan di `src/App.jsx` sudah selaras sehingga 27 wilayah poligon kabupaten/kota ter-render tanpa error 404.

### B. Integrasi 5 Dataset Satelit Faktual Google Earth Engine (Project: tugas-tpbw-510613)
- 🏔️ **Kemiringan Lereng (Slope):** Dihitung dari DEM SRTM 30m USGS (statis).
- ⛰️ **Elevasi Topografi (DEM SRTM):** Model elevasi digital 30m USGS (statis).
- 🛰️ **Citra Optik Sentinel-2 RGB:** Komposit bebas awan multi-tahun (2021, 2022, 2023, 2024, 2025).
- 📡 **Radar Sentinel-1 SAR:** Backscatter radar C-band multi-tahun (2021, 2022, 2023, 2024, 2025).
- 🌧️ **Curah Hujan CHIRPS:** Presipitasi tahunan UCSB multi-tahun (2021, 2022, 2023, 2024, 2025).

### C. Antarmuka Bergaya Glassmorphism (Frosted Translucent)
- **Header Kaca Transparan:** Indikator live status pemantauan satelit GEE aktif.
- **Floating Control Panel:**
  * **Pemilih Tahun:** `2021`, `2022`, `2023`, `2024`, dan `2025` yang menyinkronkan layer Sentinel-2, Sentinel-1 SAR, dan CHIRPS secara serentak.
  * **Pilihan Peta Dasar (Basemap Switcher):** Bebas watermark API Key (Standar OSM & Esri Satelit).
  * **Saklar & Slider Transparansi:** Setiap layer satelit memiliki tombol ON/OFF dan slider transparansi mandiri (10%–100%).
- **Interaktivitas Poligon & Popup:** Hover highlight dan kartu identitas wilayah ADM2.
- **Legenda Peta Transparan:** Panduan visual lengkap untuk 5 sumber data satelit dan batas wilayah.

---

## 3. STRUKTUR BERKAS PROYEK SAAT INI

```text
D:\project tpbw\
├── md\                                        <--- Folder pusat semua dokumentasi (.md)
│   ├── PROGRESS.md                            <--- Pelacak progress & status tahapan
│   └── PROMPT_UTAMA.md                        <--- Panduan mentor & spesifikasi proyek
└── Documents\
    └── WebGIS\
        └── jabar-landslide\
            ├── index.html                     <--- Title WebGIS & Google Fonts (Plus Jakarta Sans)
            ├── vite.config.js
            ├── package.json                   <--- leaflet, react-leaflet terinstal
            ├── public\
            │   └── data\
            │       └── jabar-adm.json         <--- GeoJSON 27 Kabupaten/Kota se-Jawa Barat
            └── src\
                ├── main.jsx                   <--- Entry point React
                ├── App.jsx                    <--- Komponen utama Leaflet Map & Kontrol Panel
                └── App.css                    <--- Seluruh styling tema Glassmorphism Translucent
```

---

## 4. PRINSIP INTEGRITAS DATA & METODOLOGI

Sesuai arahan pembimbing:
1. **Tidak Menggunakan Data Fiktif/Mock:** Seluruh tampilan layer peta harus bersumber dari data spasial dan citra satelit faktual.
2. **Karakteristik Data Satelit:**
   * **Sentinel-2:** Citra optik untuk melihat tutupan lahan dan kerapatan vegetasi (NDVI). Perlu penanganan tutupan awan (*cloud masking*).
   * **DEM SRTM:** Model elevasi digital 30m untuk menganalisis ketinggian dan kemiringan lereng (*slope*). Bersifat statis.
   * **CHIRPS:** Data presipitasi kuasi-global berbasis satelit dan stasiun cuaca untuk tren curah hujan historis 2021–2025.
   * **Sentinel-1:** Radar aperture sintetis (SAR) C-band yang dapat menembus awan.
3. **Klaim Kerawanan:** Visualisasi data satelit adalah lapisan parameter fisik lingkungan; klaim tingkat kerawanan harus didasarkan pada metode analisis yang jelas dan tervalidasi.

---

## 5. AGENDA TUGAS BERIKUTNYA (TAHAP 4)

1. Memverifikasi pembukaan akun dan akses ke **Google Earth Engine Code Editor**:
   👉 `https://code.earthengine.google.com/`
2. Menyiapkan batas area studi (*Region of Interest* / ROI) Jawa Barat di GEE.
3. Melakukan uji coba pemanggilan dataset satelit pertama (Sentinel-2 komposit atau DEM SRTM Jawa Barat) di GEE Code Editor.
