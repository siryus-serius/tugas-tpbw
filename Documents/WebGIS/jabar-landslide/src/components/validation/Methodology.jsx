import { useMemo } from 'react';

/** Cara pengambilan & penentuan lokasi tiap data yang dipakai web ini. */
const DATA_ROWS = [
  {
    data: 'Kejadian longsor terverifikasi',
    sumber: 'Berita daring (detik, Kompas, Antara, Liputan6, CNN Indonesia, dll.) & rilis BNPB/BPBD',
    cara: 'Kandidat dikurasi manual lalu dimasukkan lewat tahap pipeline "ingest": wajib ≥ 2 tautan sumber, duplikat (tanggal + kabupaten + kecamatan) ditolak.',
    lokasi: 'Bertingkat — lihat tabel hierarki koordinat di bawah. Setiap titik diuji jatuh di kabupaten/kota yang tercatat.',
    pembaruan: 'Saat ada kejadian baru; tautan sumber dicek otomatis tiap bulan.',
    batas: 'Sebagian besar koordinat adalah perkiraan (pusat desa/kecamatan), bukan titik longsor persis.',
  },
  {
    data: 'Dampak & kerugian per kejadian',
    sumber: 'Artikel sumber tiap kejadian',
    cara: 'Hanya angka yang tertulis eksplisit di artikel; tiap angka disertai URL & kutipan (bukti). Tidak ada estimasi; selisih antar-sumber dicatat.',
    lokasi: 'Mengikuti kejadiannya.',
    pembaruan: 'Saat kejadian ditambah/diperbaiki.',
    batas: 'Kolom yang tidak dilaporkan media dibiarkan kosong (bukan nol).',
  },
  {
    data: 'Rekap longsor per desa (Galura Data Jabar)',
    sumber: 'Dinas Pemberdayaan Masyarakat dan Desa Prov. Jawa Barat (Indeks Desa Membangun)',
    cara: 'CSV resmi diunduh manual dari portal Galura (server menolak akses otomatis), diolah tahap "galura".',
    lokasi: 'Tanpa titik — dijumlahkan per kecamatan & kabupaten (kode/nama BPS → batas wilayah).',
    pembaruan: 'Tahunan (rilis DPMD); diolah otomatis saat CSV baru di-push.',
    batas: 'Periode 2019–2024; kota berbasis kelurahan (mis. Kota Bandung, Bogor, Depok) tidak tercakup.',
  },
  {
    data: 'Citra Sentinel-2 & Sentinel-1 (sebelum/sesudah)',
    sumber: 'Copernicus Sentinel via Microsoft Planetary Computer (STAC)',
    cara: 'Tahap "events": scene dicari ±120 hari dari kejadian (diperluas ke 365 hari bila berawan); dipilih awan LOKAL terkecil (band SCL di area ±2,5 km).',
    lokasi: 'Kotak ±2 km di sekitar titik kejadian.',
    pembaruan: 'Otomatis bulanan (GitHub Actions).',
    batas: 'Resolusi 10 m; lokasi yang terus berawan bisa memakai scene jauh dari tanggal kejadian.',
  },
  {
    data: 'Anomali pergeseran tanah (InSAR)',
    sumber: 'COMET-LiCSAR (interferogram Sentinel-1)',
    cara: 'Tahap "insar": kecepatan LOS per tahun dibanding rata-rata tahun sebelumnya; pin bila |Δv| ≥ 15 mm/thn, z ≥ 2,5, dan lereng ≥ 8°.',
    lokasi: 'Pusat kluster piksel anomali (grid ±100 m).',
    pembaruan: 'Otomatis bulanan.',
    batas: 'Hanya arah pandang satelit (LOS); ada celah data per frame/tahun.',
  },
  {
    data: 'Gempa bumi',
    sumber: 'BMKG (terkini) & USGS (riwayat)',
    cara: 'BMKG dibaca langsung oleh browser; USGS diolah tahap "quakes".',
    lokasi: 'Episenter dari katalog masing-masing lembaga.',
    pembaruan: 'BMKG real-time; USGS bulanan.',
    batas: 'Hubungan gempa–longsor hanya indikatif (jarak & waktu).',
  },
  {
    data: 'Kemiringan lereng & Faktor Keamanan',
    sumber: 'Copernicus DEM GLO-90 via Open-Meteo Elevation API',
    cara: 'Kemiringan P90 dalam radius ±400 m dari titik; FK model lereng tak hingga dengan parameter tanah default.',
    lokasi: 'Titik kejadian / anomali.',
    pembaruan: 'Statis (dihitung sekali, dipakai ulang).',
    batas: 'DEM 90 m & titik perkiraan → indikator regional, bukan uji geoteknik.',
  },
  {
    data: 'Batas kabupaten/kota',
    sumber: 'geoBoundaries (ADM2)',
    cara: 'Berkas GeoJSON statis.',
    lokasi: 'Poligon 27 kabupaten/kota Jawa Barat.',
    pembaruan: 'Statis.',
    batas: 'Generalisasi garis batas.',
  },
];

/** Hierarki penentuan koordinat kejadian (urutan prioritas). */
const COORD_LEVELS = [
  { key: 'titik', match: /titik kejadian/i, nama: 'Titik kejadian', cara: 'Koordinat yang disebut sumber resmi (BNPB) / laporan rinci.', ketelitian: '< 0,5 km' },
  {
    key: 'kampung',
    match: /kampung|dusun/i,
    nama: 'Pusat kampung/dusun',
    cara: 'Nama kampung dari berita dicari di OpenStreetMap (tahap "refine-coords"): tipe dusun/permukiman, nama sama persis, dalam ±6 km titik lama & kabupaten yang sama.',
    ketelitian: '± 0,3–1 km',
  },
  { key: 'desa', match: /pusat desa/i, nama: 'Pusat desa (perkiraan)', cara: 'Geocoding nama desa + kecamatan + kabupaten (OpenStreetMap Nominatim).', ketelitian: '± 1–3 km' },
  { key: 'kecamatan', match: /pusat kecamatan/i, nama: 'Pusat kecamatan (perkiraan)', cara: 'Bila desa tidak ditemukan: geocoding nama kecamatan.', ketelitian: '± 5–10 km' },
  { key: 'none', match: null, nama: 'Tanpa koordinat', cara: 'Lokasi tidak ditemukan → hanya dihitung & didaftar di tingkat kabupaten/kota.', ketelitian: 'tingkat kabupaten' },
];

export default function Methodology({ events }) {
  const counts = useMemo(() => {
    const c = Object.fromEntries(COORD_LEVELS.map((l) => [l.key, 0]));
    for (const f of events) {
      const j = f.properties.jenis_koordinat ?? '';
      const level = f.geometry ? COORD_LEVELS.find((l) => l.match?.test(j)) : COORD_LEVELS.at(-1);
      c[(level ?? COORD_LEVELS.at(-1)).key]++;
    }
    return c;
  }, [events]);

  return (
    <>
      <div className="card method-card">
        <h3>Sumber & cara pengambilan data</h3>
        <div className="table-wrap method-wrap">
          <table className="method-table">
            <thead>
              <tr>
                <th>Data</th>
                <th>Sumber</th>
                <th>Cara pengambilan</th>
                <th>Penentuan lokasi</th>
                <th>Pembaruan</th>
                <th>Ketelitian & keterbatasan</th>
              </tr>
            </thead>
            <tbody>
              {DATA_ROWS.map((r) => (
                <tr key={r.data}>
                  <th scope="row">{r.data}</th>
                  <td>{r.sumber}</td>
                  <td>{r.cara}</td>
                  <td>{r.lokasi}</td>
                  <td>{r.pembaruan}</td>
                  <td>{r.batas}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card method-card">
        <h3>Hierarki penentuan koordinat kejadian</h3>
        <p className="muted small">
          Koordinat diambil dari tingkat paling tepat yang tersedia, berurutan dari atas. Jumlah dihitung langsung dari data
          ({events.length} kejadian).
        </p>
        <div className="table-wrap method-wrap">
          <table className="method-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Tingkat lokasi</th>
                <th>Cara penentuan</th>
                <th>Perkiraan ketelitian</th>
                <th className="num">Jumlah</th>
              </tr>
            </thead>
            <tbody>
              {COORD_LEVELS.map((l, i) => (
                <tr key={l.key}>
                  <td>{i + 1}</td>
                  <th scope="row">{l.nama}</th>
                  <td>{l.cara}</td>
                  <td className="nowrap">{l.ketelitian}</td>
                  <td className="num">
                    <strong>{counts[l.key]}</strong>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="muted small">
          Titik perkiraan ditandai garis tepi putus-putus di peta; koordinat sebelum dipertajam disimpan di kolom
          <code> koordinat_awal</code>.
        </p>
      </div>
    </>
  );
}
