import React, { useState, useEffect } from 'react';
import { 
  Database, 
  Server, 
  Download, 
  RefreshCw, 
  CheckCircle2, 
  Table, 
  HardDrive, 
  FileJson, 
  Layers, 
  AlertTriangle,
  Activity,
  Trash2,
  Calendar,
  CloudRain
} from 'lucide-react';
import { 
  fetchDatabaseSummary, 
  getAllCitizenReports, 
  deleteCitizenReport, 
  exportReportsAsGeoJSON 
} from '../../services/dbClient';

export default function DatabasePanel({ onClose }) {
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'telemetry' | 'reports' | 'sql'
  const [dbData, setDbData] = useState(null);
  const [citizenReports, setCitizenReports] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const [summary, reports] = await Promise.all([
        fetchDatabaseSummary(),
        getAllCitizenReports()
      ]);
      setDbData(summary);
      setCitizenReports(reports);
    } catch (err) {
      console.warn('Gagal memuat data database:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleDeleteReport = async (id) => {
    if (window.confirm('Hapus laporan ini dari database lokal browser?')) {
      await deleteCitizenReport(id);
      loadData();
    }
  };

  return (
    <div className="fixed inset-0 z-[1200] flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-fade-in-up text-left">
      <div className="w-full max-w-5xl max-h-[92vh] flex flex-col rounded-3xl glass-panel-elevated border border-white/15 p-5 sm:p-7 shadow-2xl text-white overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-5 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-400">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold">
                <Server className="w-3.5 h-3.5" />
                <span>SERVERLESS EDGE GEOSPATIAL DATABASE</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                Database EWS & Telemetri Terindeks
              </h2>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={loadData}
              title="Refresh Data"
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-colors cursor-pointer border border-white/10"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-emerald-400' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-zinc-300 hover:text-white transition-colors cursor-pointer text-lg font-bold"
            >
              &times;
            </button>
          </div>
        </div>

        {/* Navigation Sub-Tabs */}
        <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-white/5 border border-white/10 mb-5 shrink-0 text-xs overflow-x-auto">
          {[
            { id: 'overview', label: 'Ringkasan & Skema', icon: HardDrive },
            { id: 'telemetry', label: 'Log Stasiun & Gempa', icon: Activity },
            { id: 'reports', label: `Laporan Warga (${citizenReports.length})`, icon: AlertTriangle },
            { id: 'sql', label: 'Ekspor & Unduhan', icon: Download }
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all cursor-pointer whitespace-nowrap ${
                  isActive 
                    ? 'bg-emerald-400 text-zinc-950 font-bold shadow-md shadow-emerald-400/20' 
                    : 'text-zinc-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-6">

          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Architecture Highlight Card */}
              <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-950/40 via-zinc-900/60 to-zinc-950/80 border border-emerald-500/20">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <span className="text-[11px] font-mono text-emerald-400 tracking-wider uppercase font-semibold">
                      Arsitektur Paling Efektif (Tri-Layer Edge Engine)
                    </span>
                    <h3 className="text-base font-bold text-white">
                      SQLite v3 Embedded + Browser IndexedDB + CDN Static Read-Replica
                    </h3>
                    <p className="text-xs text-zinc-400 max-w-2xl leading-relaxed">
                      Sistem menggunakan SQLite murni bawaan Node.js (<code className="text-emerald-300 font-mono">node:sqlite</code>) pada GitHub Actions untuk mencatat riwayat sensor, gempa BMKG, dan satelit Himawari-9 tanpa biaya bulanan (Zero-Cost). Data otomatis disinkronkan ke WebGIS client secara instan (&lt;50ms) dan dapat bekerja offline via IndexedDB.
                    </p>
                  </div>
                  <div className="flex sm:flex-col gap-2 shrink-0">
                    <span className="px-3 py-1 rounded-lg bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-[11px] font-mono text-center">
                      WAL Mode Active
                    </span>
                    <span className="px-3 py-1 rounded-lg bg-white/5 border border-white/10 text-zinc-400 text-[11px] font-mono text-center">
                      Zero Server Cost
                    </span>
                  </div>
                </div>
              </div>

              {/* 5 Stats Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                <div className="p-4 rounded-2xl glass-card border border-white/10">
                  <div className="text-[11px] text-zinc-400 mb-1">Telemetri Sensor</div>
                  <div className="text-2xl font-black text-emerald-400 tracking-tight">
                    {dbData?.statistik?.total_telemetri_tersimpan ?? 7}
                  </div>
                  <div className="text-[10px] text-zinc-500 mt-1">7 Stasiun Kunci Jabar</div>
                </div>

                <div className="p-4 rounded-2xl glass-card border border-white/10">
                  <div className="text-[11px] text-zinc-400 mb-1">Gempa BMKG</div>
                  <div className="text-2xl font-black text-rose-400 tracking-tight">
                    {dbData?.statistik?.total_gempa_tercatat ?? 1}
                  </div>
                  <div className="text-[10px] text-zinc-500 mt-1">BMKG TEWS Realtime</div>
                </div>

                <div className="p-4 rounded-2xl glass-card border border-white/10">
                  <div className="text-[11px] text-zinc-400 mb-1">Historis BNPB</div>
                  <div className="text-2xl font-black text-amber-400 tracking-tight">
                    {dbData?.statistik?.total_kejadian_longsor_historis ?? 4}
                  </div>
                  <div className="text-[10px] text-zinc-500 mt-1">Periode 2021–2025</div>
                </div>

                <div className="p-4 rounded-2xl glass-card border border-white/10">
                  <div className="text-[11px] text-zinc-400 mb-1">Klasifikasi Tanah</div>
                  <div className="text-2xl font-black text-cyan-400 tracking-tight">
                    {dbData?.statistik?.total_wilayah_klasifikasi_tanah ?? 27}
                  </div>
                  <div className="text-[10px] text-zinc-500 mt-1">Kab & Kota Se-Jabar</div>
                </div>

                <div className="p-4 rounded-2xl glass-card border border-white/10 col-span-2 sm:col-span-1">
                  <div className="text-[11px] text-zinc-400 mb-1">Laporan Warga</div>
                  <div className="text-2xl font-black text-purple-400 tracking-tight">
                    {citizenReports.length}
                  </div>
                  <div className="text-[10px] text-zinc-500 mt-1">Tersimpan di IndexedDB</div>
                </div>
              </div>

              {/* Database Tables Schema Directory */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-3 flex items-center gap-2">
                  <Table className="w-4 h-4 text-emerald-400" />
                  <span>Struktur Relational Tabel SQLite (File: data/database.sqlite)</span>
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-emerald-400">telemetry_logs</span>
                      <span className="text-[10px] text-zinc-500 font-mono">Time-Series</span>
                    </div>
                    <p className="text-zinc-400 text-[11px]">
                      Menyimpan log sensor cuaca: suhu, kelembapan tanah, curah hujan mm, dan status peringatan per stasiun.
                    </p>
                    <div className="text-[10px] font-mono text-zinc-500">
                      Index: (timestamp), (station_id)
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-rose-400">earthquakes</span>
                      <span className="text-[10px] text-zinc-500 font-mono">BMKG TEWS</span>
                    </div>
                    <p className="text-zinc-400 text-[11px]">
                      Pusat gempa bumi, magnitudo, kedalaman, koordinat guncangan, potensi tsunami, dan URL peta goncangan.
                    </p>
                    <div className="text-[10px] font-mono text-zinc-500">
                      Index: (datetime)
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-amber-400">landslide_events</span>
                      <span className="text-[10px] text-zinc-500 font-mono">BNPB Georisk</span>
                    </div>
                    <p className="text-zinc-400 text-[11px]">
                      Bencana riil 2021–2025: Cianjur 2022, Sumedang 2023, Kertasari 2024, data korban jiwa & kerusakan rumah.
                    </p>
                    <div className="text-[10px] font-mono text-zinc-500">
                      Index: (year)
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-cyan-400">soil_classifications</span>
                      <span className="text-[10px] text-zinc-500 font-mono">Kementan / USDA</span>
                    </div>
                    <p className="text-zinc-400 text-[11px]">
                      Karakteristik tanah 27 kabupaten/kota (Andosol, Latosol, Grumusol, Podsolik) dan tingkat kepekaan longsor.
                    </p>
                    <div className="text-[10px] font-mono text-zinc-500">
                      Index: (wilayah UNIQUE)
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: TELEMETRY & EARTHQUAKE LOGS */}
          {activeTab === 'telemetry' && (
            <div className="space-y-6">
              {/* Telemetry Table */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400 mb-3 flex items-center gap-2">
                  <CloudRain className="w-4 h-4" />
                  <span>Log Telemetri Stasiun Pemantauan Cuaca & Tanah (Terkini)</span>
                </h4>
                <div className="overflow-x-auto rounded-2xl border border-white/10 bg-white/[0.02]">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-white/5 border-b border-white/10 text-zinc-400 text-[11px] font-mono">
                      <tr>
                        <th className="p-3">Stasiun / Wilayah</th>
                        <th className="p-3">Koordinat</th>
                        <th className="p-3">Suhu (°C)</th>
                        <th className="p-3">Kelembapan (%)</th>
                        <th className="p-3">Curah Hujan (mm)</th>
                        <th className="p-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 font-mono">
                      {(dbData?.telemetri_terkini || []).length > 0 ? (
                        dbData.telemetri_terkini.map((row, idx) => (
                          <tr key={idx} className="hover:bg-white/[0.03] transition-colors">
                            <td className="p-3 font-semibold text-white font-sans">{row.station_id}</td>
                            <td className="p-3 text-zinc-400 text-[11px]">{row.lat?.toFixed(2)}, {row.lng?.toFixed(2)}</td>
                            <td className="p-3 text-zinc-200">{row.temp_c}°C</td>
                            <td className="p-3 text-zinc-200">{row.humidity_pct}%</td>
                            <td className="p-3 font-bold text-cyan-400">{row.rainfall_mm} mm</td>
                            <td className="p-3">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                                row.status?.includes('Lebat') 
                                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                                  : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              }`}>
                                {row.status || 'Normal'}
                              </span>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="6" className="p-6 text-center text-zinc-500 font-sans">
                            Belum ada telemetri tercatat. Jalankan sinkronisasi data.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Earthquake Section */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-rose-400 mb-3 flex items-center gap-2">
                  <Activity className="w-4 h-4" />
                  <span>Log Gempa BMKG TEWS Terkini</span>
                </h4>
                <div className="grid grid-cols-1 gap-3">
                  {(dbData?.gempa_terkini || []).map((eq, i) => (
                    <div key={i} className="p-4 rounded-2xl bg-white/[0.03] border border-rose-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 font-bold text-xs border border-rose-500/40">
                            M {eq.magnitude}
                          </span>
                          <span className="text-zinc-400 text-xs font-mono">{eq.datetime}</span>
                          <span className="text-zinc-500 text-xs">&bull; Kedalaman: {eq.depth_km} km</span>
                        </div>
                        <div className="text-sm font-semibold text-white">{eq.region}</div>
                        <div className="text-xs text-zinc-400 mt-1">{eq.potensi}</div>
                      </div>
                      {eq.shakemap_url && (
                        <a
                          href={eq.shakemap_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white text-xs border border-white/10 shrink-0 transition-colors"
                        >
                          Lihat Peta Shakemap
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: CITIZEN REPORTS (INDEXEDDB) */}
          {activeTab === 'reports' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white/[0.03] p-4 rounded-2xl border border-white/10">
                <div>
                  <h4 className="text-sm font-bold text-white">Database Partisipatif Warga (IndexedDB)</h4>
                  <p className="text-xs text-zinc-400">
                    Laporan warga yang dikirim melalui formulir pelaporan cepat tersimpan aman di peramban dan dapat diekspor.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={exportReportsAsGeoJSON}
                    disabled={citizenReports.length === 0}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 disabled:opacity-40 text-zinc-950 font-bold text-xs transition-colors cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Ekspor GeoJSON</span>
                  </button>
                </div>
              </div>

              {citizenReports.length === 0 ? (
                <div className="py-12 text-center text-zinc-500 space-y-2">
                  <AlertTriangle className="w-8 h-8 mx-auto text-zinc-600" />
                  <p className="text-xs">Belum ada laporan dari warga di database lokal.</p>
                  <p className="text-[11px] text-zinc-600">Gunakan formulir 'Laporkan Titik Longsor' di peta untuk menambah data.</p>
                </div>
              ) : (
                <div className="divide-y divide-white/5 rounded-2xl bg-white/[0.02] border border-white/10 overflow-hidden text-xs">
                  {citizenReports.map((r) => (
                    <div key={r.id} className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 hover:bg-white/[0.02]">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            r.severity === 'Kritis' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40' :
                            r.severity === 'Tinggi' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' :
                            'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                          }`}>
                            {r.severity}
                          </span>
                          <span className="font-semibold text-white">{r.name}</span>
                          <span className="text-zinc-500">&bull; {r.region}</span>
                          <span className="text-[10px] font-mono text-zinc-500">{new Date(r.created_at).toLocaleString('id-ID')}</span>
                        </div>
                        <p className="text-zinc-300 text-xs">{r.description}</p>
                        <div className="text-[11px] font-mono text-emerald-400">
                          Koordinat: {r.coords} | Kontak: {r.phone}
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeleteReport(r.id)}
                        className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 transition-colors cursor-pointer border border-rose-500/20 shrink-0"
                        title="Hapus Laporan"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: EXPORT & SQL DOWNLOAD */}
          {activeTab === 'sql' && (
            <div className="space-y-4 text-xs">
              <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/10 space-y-4">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <HardDrive className="w-4 h-4 text-emerald-400" />
                  <span>Unduh File Database SQLite & Snapshot GIS</span>
                </h4>
                <p className="text-zinc-400 text-xs leading-relaxed">
                  Semua tabel, log telemetri, data historis BNPB 2021–2025, dan klasifikasi tanah dapat diunduh langsung dalam format standar industri untuk keperluan analisis di GIS (QGIS, ArcGIS), Python Jupyter Notebook, maupun DBeaver.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <a
                    href="/data/database-summary.json"
                    download="database-summary.json"
                    className="p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-between group transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <FileJson className="w-6 h-6 text-amber-400" />
                      <div>
                        <div className="font-bold text-white group-hover:text-amber-400 transition-colors">
                          database-summary.json
                        </div>
                        <div className="text-[11px] text-zinc-500">Fast JSON Read-Replica (&lt;50ms)</div>
                      </div>
                    </div>
                    <Download className="w-4 h-4 text-zinc-400 group-hover:text-white" />
                  </a>

                  <a
                    href="/data/live-telemetry.json"
                    download="live-telemetry.json"
                    className="p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-between group transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Activity className="w-6 h-6 text-emerald-400" />
                      <div>
                        <div className="font-bold text-white group-hover:text-emerald-400 transition-colors">
                          live-telemetry.json
                        </div>
                        <div className="text-[11px] text-zinc-500">Telemetri Satelit Terkini</div>
                      </div>
                    </div>
                    <Download className="w-4 h-4 text-zinc-400 group-hover:text-white" />
                  </a>
                </div>

                <div className="p-4 rounded-xl bg-zinc-950 border border-white/10 mt-4">
                  <div className="text-[11px] text-zinc-400 font-mono mb-2">
                    Lokasi File SQLite di Repository:
                  </div>
                  <code className="text-emerald-400 font-mono text-xs block bg-black/60 p-2.5 rounded-lg border border-white/5 overflow-x-auto">
                    data/database.sqlite
                  </code>
                  <p className="text-[11px] text-zinc-500 mt-2">
                    File ini diperbarui otomatis setiap 10 menit oleh runner GitHub Actions (<code className="text-zinc-400 font-mono">fetch-apis.yml</code>).
                  </p>
                </div>
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
