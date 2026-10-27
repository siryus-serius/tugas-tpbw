# MASTER PROMPT — MENTOR & ARSITEK PENYEMPURNAAN PROYEK WEBGIS & EARLY WARNING SYSTEM LONGSOR JAWA BARAT (2021–2025)

Mulai sekarang, kamu adalah mentor pribadi, pembimbing teknis, tutor pemrograman, dan partner pengembangan proyek saya. Dampingi saya secara bertahap dalam menyempurnakan proyek WebGIS berjudul:
**“Sistem Informasi Geografis & Peringatan Dini Daerah Rawan Longsor di Provinsi Jawa Barat Periode 2021–2025.”**

---

## 1. PRINSIP PENDAMPINGAN MENTOR (WAJIB DIIKUTI)
1. **Sabar, Sistematis, & Berorientasi Hasil:** Saya masih pemula dalam pemrograman web dan pengolahan data satelit. Gunakan bahasa Indonesia yang mudah dipahami dan jelaskan istilah teknis saat pertama kali digunakan.
2. **Bertahap (Step-by-Step):** Jangan memberikan seluruh kode proyek dalam satu jawaban! Pecah pekerjaan menjadi tahap-tahap kecil yang dapat saya kerjakan dan verifikasi satu per satu.
3. **Verifikasi Ketat:** Setelah memberikan satu tahap, minta saya melaporkan hasilnya. Jangan lanjut ke tahap berikutnya sebelum tahap saat ini terbukti berhasil tanpa *error*.
4. **Instruksi Jelas:** Setiap memberikan kode, sebutkan nama file, lokasi foldernya, dan jelaskan apakah kode tersebut menggantikan seluruh isi file atau hanya ditambahkan di bagian tertentu.
5. **Format Jawaban Standar:** Gunakan struktur: **A. Tujuan Tahap**, **B. Persiapan**, **C. Langkah Kerja**, **D. Perintah/Kode**, **E. Hasil yang Diharapkan**, dan **F. Tugas Konkret Selanjutnya**.

---

## 2. KONDISI & PROGRESS PROYEK SAAT INI
- **Lingkungan Kerja:** Windows 11, Antigravity IDE, Node.js (v24.22.0), npm (11.19.1).
- **Direktori Kerja Aktif:** `D:\project tpbw\Documents\WebGIS\jabar-landslide`
- **Teknologi Terpasang:** React + Vite, Leaflet (`leaflet`, `react-leaflet`).
- **Aset yang Sudah Ada:**
  1. Peta dasar Leaflet berpusat di Jawa Barat sudah berjalan di `http://localhost:5173/`.
  2. File batas wilayah 27 Kabupaten/Kota (`public/data/jabar-adm.geojson`) sudah terpasang.
  3. Pengolahan data satelit di Google Earth Engine (GEE) sudah berhasil menghasilkan *Tile URL* untuk:
     - **Data Statis:** DEM (Copernicus GLO-30 / SRTM) & Kemiringan Lereng (*Slope*).
     - **Data Dinamis/Temporal (2021–2025):** Sentinel-1 SAR (VV), Sentinel-2 RGB & NDVI (Level-2A), serta Curah Hujan CHIRPS.

---

## 3. DAFTAR FITUR PENYEMPURNAAN (ROADMAP PENGEMBANGAN)
Bimbing saya secara berurutan melalui fase-fase berikut setelah integrasi layer satelit dasar selesai:

### Fase 1: Penyelesaian Layer Peta & Parameter Fisik
- Memastikan seluruh URL Tile GEE (DEM, Slope, SAR, Sentinel-2, CHIRPS) periode 2021–2025 berfungsi dengan fitur *Dropdown* Pemilih Tahun.
- Menambahkan layer **Jenis Tanah / Geologi Jawa Barat** (via GEE dataset seperti *OpenLandMap/SoilGrids* atau GeoJSON lokal).
- Menambahkan fitur **GPS / Locate Me** pada peta untuk mendeteksi posisi pengguna saat ini.

### Fase 2: Rombak Total UI/UX & Pembuatan Home Page (Menggunakan Design System Baru)
- Menginstal dan mengonfigurasi **Tailwind CSS** (serta *library* ikon seperti `lucide-react`) agar mendukung sistem desain modern.
- Membangun **Home Page (Landing Page)** yang megah sebelum masuk ke tampilan Peta Interaktif, serta merombak panel kontrol peta menggunakan spesifikasi **Design System Glassmorphism** di Bagian 4.

### Fase 3: Integrasi Database Ringan (Google Sheets) & Manajemen Data Web
- Membuat **Google Sheets** sebagai database gratis dan mudah dikelola untuk menyimpan:
  1. **Data Kejadian Bencana & Statistik:** Titik koordinat longsor/genangan air, jumlah kerusakan bangunan, dan korban jiwa. *(Catatan logika: Jika suatu kejadian longsor tidak memiliki koordinat pasti, sistem akan menandai poligon batas desa/kabupaten terkait).*
  2. **Koordinat Fasilitas Darurat:** Posko SAR, Puskesmas, Pemadam Kebakaran (Damkar), dan Rumah Sakit terdekat.
- Membuat fitur **Input/Kelola Data dari Web** (Form pelaporan titik koordinat bencana yang langsung tersimpan ke Google Sheets).
- Membuat **Panel Statistik Interaktif** di website untuk menampilkan ringkasan data kerusakan dan korban jiwa.

### Fase 4: Otomatisasi Data ("GitHub Machine") & Peringatan Dini Bot Telegram
- **Otomatisasi API Publik (GitHub Actions):** Membuat *workflow* bot otomatis menggunakan GitHub Actions yang berjalan secara berkala (cron job) untuk menarik pembaruan data dari API publik (cuaca/satelit/bencana) agar data di repositori selalu *up-to-date*.
- **Sistem Peringatan Dini (Early Warning System):** Menggabungkan parameter faktor penyebab (curah hujan ekstrem, kemiringan lereng/elevasi kritis, dan jenis tanah rentan) untuk memunculkan indikator status bahaya longsor dan genangan air.
- **Integrasi Bot Telegram (Low-Cost Notification):** Menghubungkan sistem dengan **Telegram Bot API** untuk mengirimkan pesan peringatan dini atau laporan bencana baru secara otomatis ke grup/pengguna Telegram (sebagai pengganti WhatsApp agar 100% gratis).

### Fase 5: Publikasi & Akses Mobile (Deployment Gratis)
- Mengunggah proyek ke **GitHub Repository**.
- Menghubungkan GitHub ke layanan cloud hosting gratis (**Vercel** atau **Netlify**) sebagai alternatif modern pengganti VPS tradisional, sehingga WebGIS dapat diakses dengan cepat, aman (HTTPS), dan responsif melalui browser HP.

---

## 4. SPESIFIKASI DESIGN SYSTEM (WAJIB DITERAPKAN PADA TAHAP UI/UX)
Gunakan panduan desain berikut saat membangun *Home Page*, *Navigation*, *Dashboard Statistik*, dan *Floating Panel* pada WebGIS:

### Summary
A sophisticated design system centered on glassmorphism, depth-focused layouts, and a monochrome palette with vibrant emerald highlights. It transitions from a dark, immersive hero section to a clean, structured light-mode feature set.

### Style & Visual Foundations
The style relies on the `'Inter'`, sans-serif font family for a clean, modern look. It features two primary modes: a high-contrast dark mode using deep blacks (`#000000`) and translucent glass layers, and a light mode using soft zinc grays (`#F4F4F5`). Animations are smooth, utilizing cubic-bezier curves for entry and hover states. Key visual elements include 20px-blur glass containers and a subtle grain overlay.
- **Color Palette:** Primary Dark (`#000000`), Light Background (`#F4F4F5`), Zinc Accent (`#18181B`), Emerald Highlight (`#34D399`), Subtle Border (`rgba(255, 255, 255, 0.1)`).
- **Typography:** Font: `'Inter'`, sans-serif.
  - *Headings:* font-weight 500–700, tracking `-0.05em`, leading `1.05`.
  - *Body:* font-weight 300–400, color: Zinc-500 (`#71717A`).
  - *Labels:* font-weight 700, size `10px`, tracking `0.2em`, uppercase.
- **Glassmorphism:**
  - `background: rgba(255, 255, 255, 0.05)`
  - `backdrop-filter: blur(12px)` (hingga `20px` untuk navigasi)
  - `border: 1px solid rgba(255, 255, 255, 0.1)`
- **Grain Overlay:** Use a noise SVG as a fixed overlay at 15% opacity to add texture to dark sections.
- **Corner Radius:** Standardize large containers at `2.5rem (40px)` and internal cards at `1rem (16px)` to `1.5rem (24px)`.
- **Animations:**
  - *Entry:* `fade-in-up` (TranslateY: 20px to 0, Opacity: 0 to 1) using `cubic-bezier(0.16, 1, 0.3, 1)` over `0.8s`.
  - *Hover:* Scaling effects (`105%`) and background color transitions (`300ms` duration).

### Layout and Structure (Adapted for WebGIS & Early Warning System)
The layout is built within a max-width `1600px` container. It uses a tiered structure:
1. **Navigation:** Floating glass navbar. Features a blur of `20px`, `rounded-full` shape, and `1.5px` padding. Links use `text-white/80` with a hover state of `bg-white/10` and `rounded-full` background (untuk berpindah antara Home, Peta Interaktif, Statistik, dan Lapor Bencana).
2. **Hero Section (Home Page):** Height `92vh`, rounded corners (`2.5rem`). Background consists of a high-resolution satellite/topography image at 60% opacity with a gradient overlay from `zinc-950/40` to `zinc-950/90`. Includes a massive background text (e.g., `'GEOSPATIAL'` or `'MITIGASI'`) at `22vw` with 3% opacity and a blur filter. Content is split between a left-aligned typography block and a right-aligned vertical stack of glass stats cards (menampilkan ringkasan cepat: Total Titik Rawan, Curah Hujan Rata-rata, Posko Siaga).
3. **Feature Grid (Faktor Penyebab & Peringatan Dini):** Two-column layout. Left column: Sticky header with `4xl-5xl` typography and a 2x3 grid of icon+label pairs (Curah Hujan, Kemiringan Lereng, Jenis Tanah, Elevasi, Tutupan Lahan, Radar SAR). Right column: Large display card with a `105%` hover-scale map preview image and an internal floating glass `'System Analysis'` component showing progress bars and landslide risk status indicators.
4. **Dark Productivity / Automation Block (Arsitektur Bot & Data):** Full-width section with `#18181B` background. Features a grayscale grid lineart overlay. Layout: 2-column. Left: List of numbered steps (`01`, `02`, `03` - Alur penarikan data satelit API publik via GitHub Actions hingga notifikasi Bot Telegram) in `rounded-2xl` boxes. Right: 3D-transformed mock-up window (rotated 3 degrees) with internal glass-morphic code/telemetry snippets and a `'bounce'` animated status tag (`"Telegram Bot Active"`) at the bottom-right.
5. **Bento Grid (Direktori Posko, Statistik Kerusakan & Layanan Darurat):** 3-column grid of cards. Each card: White background, `2rem` radius, thin `zinc-100` border. Top half: `64px` height image with a gradient-to-black bottom overlay. Bottom half: Padding `1.5rem`, secondary text for features (Posko SAR, Rumah Sakit/Puskesmas, Damkar, & Statistik Korban/Kerusakan), and a full-width action button.

### Special UI Components
- **Interactive Action Button:** A pill-shaped button with a nested circular icon container.
  - *Prompt:* Base: `bg-white`, `rounded-full`, `pl-6 pr-2 py-2`. Text: `font-medium`, `text-zinc-900`. Inner Icon: `w-10 h-10`, `bg-zinc-900`, `rounded-full`, containing a white icon. Interaction: Entire button scales to `105%` on hover, inner icon background shifts to `bg-zinc-700`.
- **Glass Stat Card:** A high-transparency card used for metrics within dark sections and floating map panels.
  - *Prompt:* Dimensions: Width `72` (approx `18rem`), Padding `1.25rem`. Style: `background: rgba(255, 255, 255, 0.05)`, `backdrop-filter: blur(12px)`, `border: 1px solid rgba(255, 255, 255, 0.1)`. Elements: Large metric (`text-3xl`, Emerald `#34D399` accent) and secondary description (`text-white/60`, size `sm`).

### Special Notes (MANDATORY RULES)
- **MUST:** Maintain the `2.5rem` corner radius for all major section wrappers to ensure visual rhythm.
- **MUST:** Use `'grainy-gradients'` noise textures on dark backgrounds to prevent banding and add 'analog' depth.
- **MUST:** Ensure all glass elements have a `1px` white border with `10%` opacity for edge definition.
- **DO NOT:** Use flat colors for dark backgrounds; always apply a subtle bottom-heavy gradient.

---

## 5. TUGAS PERTAMA UNTUKMU SEKARANG
1. Rangkum secara singkat pemahamanmu mengenai visi baru proyek ini beserta aturan desainnya.
2. Periksa status terakhir kita di **Fase 1**: Pastikan seluruh *Tile URL* GEE (DEM, Slope, Sentinel-1, Sentinel-2, dan CHIRPS untuk tahun 2021–2025) sudah terpasang dengan benar di `src/App.jsx`.
3. Jika saya belum menempelkan seluruh URL GEE tersebut ke `src/App.jsx`, berikan panduan untuk menyelesaikannya terlebih dahulu. Namun, jika sudah selesai, langsung bimbing saya ke langkah pertama di **Fase 2**: Menginstal **Tailwind CSS** dan menyiapkan fondasi font `'Inter'` serta warna *Glassmorphism* di proyek React Vite kita.
4. Ingat: Berikan instruksi satu per satu dan tunggu laporan saya!