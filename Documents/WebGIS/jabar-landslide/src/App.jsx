import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, GeoJSON } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import './App.css';

// =========================================================================
// DATA RESMI GOOGLE EARTH ENGINE (PROJECT: tugas-tpbw-510613)
// =========================================================================

// 1. DATA STATIS: ELEVASI DEM SRTM 30m
const TILE_DEM_URL = 
  "https://earthengine.googleapis.com/v1/projects/tugas-tpbw-510613/maps/fcb2064c70af2983335acc906e376ba4-ab0eb5c19baf66681a45d0c7b96da437/tiles/{z}/{x}/{y}";

// 2. DATA STATIS: KEMIRINGAN LERENG (SLOPE)
const TILE_SLOPE_URL = 
  "https://earthengine.googleapis.com/v1/projects/tugas-tpbw-510613/maps/c5166a6f88620ce52c3fb1db3204eca4-f22e69aad551677c6409fc85ad6b578e/tiles/{z}/{x}/{y}";

// 3. DATA DINAMIS: CITRA OPTIK SENTINEL-2 RGB (2021 - 2025)
const S2_TILES = {
  '2021': "https://earthengine.googleapis.com/v1/projects/tugas-tpbw-510613/maps/d4b28ebfa8350be34099504c5f26d0bd-8414e96c210eedf1314db9575e479851/tiles/{z}/{x}/{y}",
  '2022': "https://earthengine.googleapis.com/v1/projects/tugas-tpbw-510613/maps/42b2e71a6d6bb26e6db6de7a5a50950d-4f638c23985504a30bda02872e4f44af/tiles/{z}/{x}/{y}",
  '2023': "https://earthengine.googleapis.com/v1/projects/tugas-tpbw-510613/maps/a35b688b46136ad6e3f065874e1cbda4-081e5cc9d8025d7ceb734d200eb15092/tiles/{z}/{x}/{y}",
  '2024': "https://earthengine.googleapis.com/v1/projects/tugas-tpbw-510613/maps/e34d32412419a0a1d3dc5c2319f85c2b-b2fd31b9bd952229ecf0d511c76e809f/tiles/{z}/{x}/{y}",
  '2025': "https://earthengine.googleapis.com/v1/projects/tugas-tpbw-510613/maps/9a3281fb425a8111606e8383c274c643-57c11cee72e3325d9708379a0cade29a/tiles/{z}/{x}/{y}",
};

// 4. DATA DINAMIS: RADAR SENTINEL-1 SAR (2021 - 2025)
const SAR_TILES = {
  '2021': "https://earthengine.googleapis.com/v1/projects/tugas-tpbw-510613/maps/fef5b5920b36f65d8660208e8c776e97-6a8461f36905aa99bbd53567771bcfa6/tiles/{z}/{x}/{y}",
  '2022': "https://earthengine.googleapis.com/v1/projects/tugas-tpbw-510613/maps/903ed40d784ae6963c84890ad981d5e6-b8c2ef7b243a2a064f99c42832a7ee85/tiles/{z}/{x}/{y}",
  '2023': "https://earthengine.googleapis.com/v1/projects/tugas-tpbw-510613/maps/9376891d236ce599c0b255299ebafe83-cfe84aa357c49697498712bd42a154f0/tiles/{z}/{x}/{y}",
  '2024': "https://earthengine.googleapis.com/v1/projects/tugas-tpbw-510613/maps/5339849cb6b95e83217886d1f499f4bb-fd92a1b270bb2a1870641d207d184c20/tiles/{z}/{x}/{y}",
  '2025': "https://earthengine.googleapis.com/v1/projects/tugas-tpbw-510613/maps/bb9d967bb9f3718cf968209f14792fe5-f5a0366377fa0dfff1ac241d15b6f2fe/tiles/{z}/{x}/{y}",
};

// 5. DATA DINAMIS: CURAH HUJAN CHIRPS (2021 - 2025)
const CHIRPS_TILES = {
  '2021': "https://earthengine.googleapis.com/v1/projects/tugas-tpbw-510613/maps/7890d39f6b87ffd8396e326749dc7050-3d7b5d7a5dcc130df203b0bff80607e2/tiles/{z}/{x}/{y}",
  '2022': "https://earthengine.googleapis.com/v1/projects/tugas-tpbw-510613/maps/692e9387b5a463f29fe2ab472f76fc5b-2af58c939826a42ef997e2e9e821e80c/tiles/{z}/{x}/{y}",
  '2023': "https://earthengine.googleapis.com/v1/projects/tugas-tpbw-510613/maps/69be477c2549506c72cf9ac3940b3ce6-6faf89e5d1eebb0f43e08fcc25c25c05/tiles/{z}/{x}/{y}",
  '2024': "https://earthengine.googleapis.com/v1/projects/tugas-tpbw-510613/maps/26e56c16eae6f79fd1b0fb91f7d0618a-23b67b34afc88ec99a0af62ac8dc54dc/tiles/{z}/{x}/{y}",
  '2025': "https://earthengine.googleapis.com/v1/projects/tugas-tpbw-510613/maps/6653fe3e5fa45daebfd49236e1dd3576-8fe734681abc84566592bf302f1e7c5b/tiles/{z}/{x}/{y}",
};

function App() {
  const centerJabar = [-6.9175, 107.6191];
  const zoomLevel = 8;
  const [geoData, setGeoData] = useState(null);

  // State pemilihan tahun (2021–2025)
  const [selectedYear, setSelectedYear] = useState('2023');

  // State aktivasi layer satelit & peta dasar
  const [baseMap, setBaseMap] = useState('osm'); // 'osm' | 'satellite'
  const [showBoundary, setShowBoundary] = useState(true);
  const [showDem, setShowDem] = useState(false);
  const [showSlope, setShowSlope] = useState(true);
  const [showSentinel2, setShowSentinel2] = useState(true);
  const [showSar, setShowSar] = useState(false);
  const [showChirps, setShowChirps] = useState(false);

  // State transparansi layer satelit
  const [demOpacity, setDemOpacity] = useState(0.7);
  const [slopeOpacity, setSlopeOpacity] = useState(0.9);
  const [s2Opacity, setS2Opacity] = useState(0.85);
  const [sarOpacity, setSarOpacity] = useState(0.7);
  const [chirpsOpacity, setChirpsOpacity] = useState(0.65);

  // Ambil data GeoJSON batas wilayah Jawa Barat (faktual 27 Kab/Kota)
  useEffect(() => {
    fetch('/data/jabar-adm.json')
      .then((res) => {
        if (!res.ok) throw new Error('Gagal mengambil file GeoJSON');
        return res.json();
      })
      .then((data) => setGeoData(data))
      .catch((err) => console.error('Error membaca data GeoJSON:', err));
  }, []);

  // Style garis batas administrasi
  const geoJsonStyle = {
    color: '#0284c7',       // Garis batas biru cyan
    weight: 1.8,
    opacity: 0.9,
    fillColor: '#38bdf8',
    fillOpacity: 0.04       // Transparan agar citra satelit terlihat jelas
  };

  // Interaktivitas popup tiap poligon kabupaten/kota
  const onEachFeature = (feature, layer) => {
    const name = feature.properties?.shapeName || feature.properties?.NAME_2 || 'Wilayah Jawa Barat';

    layer.bindPopup(`
      <div style="font-family: inherit; line-height: 1.4;">
        <strong style="color: #38bdf8; font-size: 0.95rem; display: block; margin-bottom: 2px;">
          ${name}
        </strong>
        <span style="font-size: 0.74rem; color: #94a3b8; display: block;">
          Provinsi Jawa Barat &bull; ADM2
        </span>
        <div style="margin-top: 8px; font-size: 0.74rem; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 6px; color: #cbd5e1;">
          Tahun Pengamatan: <b>${selectedYear}</b>
        </div>
      </div>
    `);

    layer.on({
      mouseover: (e) => {
        const target = e.target;
        target.setStyle({
          weight: 2.8,
          color: '#ffffff',
          fillOpacity: 0.15
        });
      },
      mouseout: (e) => {
        const target = e.target;
        target.setStyle(geoJsonStyle);
      }
    });
  };

  return (
    <div className="webgis-app">
      {/* 1. Header Bertema Glassmorphism */}
      <header className="app-header">
        <div className="header-left">
          <div className="header-icon">
            <svg viewBox="0 0 24 24">
              <path d="M14 6l-3.75 5 2.85 3.8-1.6 1.2L7 10l-6 8h22L14 6z" />
            </svg>
          </div>
          <div className="header-title-group">
            <h1>WebGIS Pemetaan Daerah Rawan Longsor</h1>
            <p>Provinsi Jawa Barat &bull; Integrasi Satelit Google Earth Engine (2021–2025)</p>
          </div>
        </div>

        <div className="header-right">
          <div className="badge-glow">
            <span className="badge-dot"></span>
            GEE Live: Tahun {selectedYear}
          </div>
        </div>
      </header>

      {/* 2. Area Peta Utama & Kontrol Translucent */}
      <div className="map-container">
        {/* Panel Kontrol Mengambang (Frosted Glass Panel) */}
        <aside className="glass-panel">
          <div className="panel-header">
            <div className="panel-header-title">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="3" y1="9" x2="21" y2="9"></line>
                <line x1="9" y1="21" x2="9" y2="9"></line>
              </svg>
              Kontrol WebGIS
            </div>
          </div>

          {/* Pemilih Periode Tahun */}
          <div className="panel-section">
            <div className="section-label">Tahun Analisis Citra</div>
            <div className="year-pills" style={{ gridTemplateColumns: 'repeat(5, 1fr)' }}>
              {['2021', '2022', '2023', '2024', '2025'].map((year) => (
                <button
                  key={year}
                  className={`year-pill ${selectedYear === year ? 'active' : ''}`}
                  onClick={() => setSelectedYear(year)}
                >
                  {year}
                </button>
              ))}
            </div>
          </div>

          {/* Pilihan Peta Dasar (Basemap) */}
          <div className="panel-section">
            <div className="section-label">Peta Dasar (Basemap)</div>
            <div className="basemap-pills">
              <button
                className={`basemap-pill ${baseMap === 'osm' ? 'active' : ''}`}
                onClick={() => setBaseMap('osm')}
              >
                🗺️ Standar OSM
              </button>
              <button
                className={`basemap-pill ${baseMap === 'satellite' ? 'active' : ''}`}
                onClick={() => setBaseMap('satellite')}
              >
                🛰️ Satelit Esri
              </button>
            </div>
          </div>

          {/* Layer Penginderaan Jauh / Satelit (Sumber GEE Faktual) */}
          <div className="panel-section">
            <div className="section-label">Layer Satelit (Google Earth Engine)</div>

            {/* 1. Kemiringan Lereng (Slope) */}
            <div className="layer-card" style={{ flexDirection: 'column', alignItems: 'stretch', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div className="layer-card-info">
                  <span 
                    className="layer-color-dot" 
                    style={{ 
                      background: 'linear-gradient(135deg, #00ff66 0%, #ffee00 35%, #ff7700 65%, #ff0044 100%)', 
                      borderColor: '#ff0044',
                      boxShadow: '0 0 10px rgba(255, 0, 68, 0.7)'
                    }}
                  ></span>
                  <div>
                    <div className="layer-name" style={{ color: '#f8fafc', fontWeight: 600 }}>
                      Kemiringan Lereng (RGB Super Vivid)
                    </div>
                    <div className="layer-sub" style={{ color: '#94a3b8' }}>
                      Gradasi: Hijau (Datar) &rarr; Merah (Curam)
                    </div>
                  </div>
                </div>
                <label className="switch">
                  <input
                    type="checkbox"
                    checked={showSlope}
                    onChange={(e) => setShowSlope(e.target.checked)}
                  />
                  <span className="slider"></span>
                </label>
              </div>

              {/* Spektrum Warna RGB Mini di dalam Card */}
              {showSlope && (
                <div style={{ background: 'rgba(0,0,0,0.3)', padding: '6px 8px', borderRadius: '6px', marginTop: '2px' }}>
                  <div style={{ 
                    height: '8px', 
                    borderRadius: '4px', 
                    background: 'linear-gradient(to right, #00e676 0%, #ffea00 35%, #ff6d00 65%, #ff1744 100%)',
                    marginBottom: '4px',
                    boxShadow: '0 0 8px rgba(255, 109, 0, 0.4)'
                  }}></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.62rem', color: '#cbd5e1' }}>
                    <span>0° Datar</span>
                    <span>15° Landai</span>
                    <span>25° Curam</span>
                    <span>&gt;45° Terjal</span>
                  </div>
                </div>
              )}

              {showSlope && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.72rem', color: '#94a3b8' }}>
                  <span>Transparansi:</span>
                  <input
                    type="range"
                    min="0.1"
                    max="1"
                    step="0.05"
                    value={slopeOpacity}
                    onChange={(e) => setSlopeOpacity(parseFloat(e.target.value))}
                    style={{ flex: 1, accentColor: '#ff0044', cursor: 'pointer' }}
                  />
                  <span style={{ fontWeight: 600, color: '#f1f5f9' }}>{Math.round(slopeOpacity * 100)}%</span>
                </div>
              )}
            </div>

            {/* 2. Elevasi DEM SRTM */}
            <div className="layer-card" style={{ flexDirection: 'column', alignItems: 'stretch', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div className="layer-card-info">
                  <span className="layer-color-dot" style={{ backgroundColor: '#8b5cf6', borderColor: '#a78bfa' }}></span>
                  <div>
                    <div className="layer-name">Elevasi Topografi (DEM)</div>
                    <div className="layer-sub">SRTM Digital Elevation &bull; Statis</div>
                  </div>
                </div>
                <label className="switch">
                  <input
                    type="checkbox"
                    checked={showDem}
                    onChange={(e) => setShowDem(e.target.checked)}
                  />
                  <span className="slider"></span>
                </label>
              </div>
              {showDem && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.72rem', color: '#94a3b8' }}>
                  <span>Transparansi:</span>
                  <input
                    type="range"
                    min="0.1"
                    max="1"
                    step="0.05"
                    value={demOpacity}
                    onChange={(e) => setDemOpacity(parseFloat(e.target.value))}
                    style={{ flex: 1, accentColor: '#8b5cf6', cursor: 'pointer' }}
                  />
                  <span>{Math.round(demOpacity * 100)}%</span>
                </div>
              )}
            </div>

            {/* 3. Citra Optik Sentinel-2 RGB */}
            <div className="layer-card" style={{ flexDirection: 'column', alignItems: 'stretch', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div className="layer-card-info">
                  <span className="layer-color-dot" style={{ backgroundColor: '#10b981', borderColor: '#34d399' }}></span>
                  <div>
                    <div className="layer-name">Sentinel-2 RGB ({selectedYear})</div>
                    <div className="layer-sub">Citra Optik Bebas Awan &bull; ESA</div>
                  </div>
                </div>
                <label className="switch">
                  <input
                    type="checkbox"
                    checked={showSentinel2}
                    onChange={(e) => setShowSentinel2(e.target.checked)}
                  />
                  <span className="slider"></span>
                </label>
              </div>
              {showSentinel2 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.72rem', color: '#94a3b8' }}>
                  <span>Transparansi:</span>
                  <input
                    type="range"
                    min="0.1"
                    max="1"
                    step="0.05"
                    value={s2Opacity}
                    onChange={(e) => setS2Opacity(parseFloat(e.target.value))}
                    style={{ flex: 1, accentColor: '#10b981', cursor: 'pointer' }}
                  />
                  <span>{Math.round(s2Opacity * 100)}%</span>
                </div>
              )}
            </div>

            {/* 4. Radar Sentinel-1 SAR */}
            <div className="layer-card" style={{ flexDirection: 'column', alignItems: 'stretch', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div className="layer-card-info">
                  <span className="layer-color-dot" style={{ backgroundColor: '#ec4899', borderColor: '#f472b6' }}></span>
                  <div>
                    <div className="layer-name">Sentinel-1 SAR ({selectedYear})</div>
                    <div className="layer-sub">Radar Backscatter C-band &bull; ESA</div>
                  </div>
                </div>
                <label className="switch">
                  <input
                    type="checkbox"
                    checked={showSar}
                    onChange={(e) => setShowSar(e.target.checked)}
                  />
                  <span className="slider"></span>
                </label>
              </div>
              {showSar && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.72rem', color: '#94a3b8' }}>
                  <span>Transparansi:</span>
                  <input
                    type="range"
                    min="0.1"
                    max="1"
                    step="0.05"
                    value={sarOpacity}
                    onChange={(e) => setSarOpacity(parseFloat(e.target.value))}
                    style={{ flex: 1, accentColor: '#ec4899', cursor: 'pointer' }}
                  />
                  <span>{Math.round(sarOpacity * 100)}%</span>
                </div>
              )}
            </div>

            {/* 5. Curah Hujan CHIRPS */}
            <div className="layer-card" style={{ flexDirection: 'column', alignItems: 'stretch', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div className="layer-card-info">
                  <span className="layer-color-dot" style={{ backgroundColor: '#3b82f6', borderColor: '#60a5fa' }}></span>
                  <div>
                    <div className="layer-name">Curah Hujan CHIRPS ({selectedYear})</div>
                    <div className="layer-sub">Presipitasi Tahunan &bull; UCSB</div>
                  </div>
                </div>
                <label className="switch">
                  <input
                    type="checkbox"
                    checked={showChirps}
                    onChange={(e) => setShowChirps(e.target.checked)}
                  />
                  <span className="slider"></span>
                </label>
              </div>
              {showChirps && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.72rem', color: '#94a3b8' }}>
                  <span>Transparansi:</span>
                  <input
                    type="range"
                    min="0.1"
                    max="1"
                    step="0.05"
                    value={chirpsOpacity}
                    onChange={(e) => setChirpsOpacity(parseFloat(e.target.value))}
                    style={{ flex: 1, accentColor: '#3b82f6', cursor: 'pointer' }}
                  />
                  <span>{Math.round(chirpsOpacity * 100)}%</span>
                </div>
              )}
            </div>
          </div>

          {/* Layer Administrasi */}
          <div className="panel-section">
            <div className="section-label">Layer Administrasi</div>
            <div className="layer-card">
              <div className="layer-card-info">
                <span className="layer-color-dot" style={{ backgroundColor: '#0284c7', borderColor: '#38bdf8' }}></span>
                <div>
                  <div className="layer-name">Batas 27 Kab/Kota</div>
                  <div className="layer-sub">geoBoundaries ADM2</div>
                </div>
              </div>
              <label className="switch">
                <input
                  type="checkbox"
                  checked={showBoundary}
                  onChange={(e) => setShowBoundary(e.target.checked)}
                />
                <span className="slider"></span>
              </label>
            </div>
          </div>
        </aside>

        {/* Legenda Transparan di Sudut Kanan Bawah */}
        <div className="glass-legend" style={{ maxWidth: '280px' }}>
          <div className="legend-title">Informasi & Sumber Data</div>
          
          <div className="legend-item" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '2px', marginBottom: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%' }}>
              <span 
                className="legend-color-box" 
                style={{ background: 'linear-gradient(to right, #22c55e, #eab308, #f97316, #ef4444)', width: '42px', height: '10px' }}
              ></span>
              <span style={{ fontWeight: 600, color: '#f1f5f9' }}>Kemiringan Lereng (RGB)</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', fontSize: '0.64rem', color: '#94a3b8', paddingLeft: '50px' }}>
              <span>0° (Datar)</span>
              <span>&gt;45° (Curam)</span>
            </div>
          </div>
          <div className="legend-item">
            <span className="legend-color-box" style={{ background: 'linear-gradient(to right, #10b981, #f59e0b, #ef4444)' }}></span>
            Elevasi DEM (SRTM 30m)
          </div>
          <div className="legend-item">
            <span className="legend-color-box" style={{ backgroundColor: '#10b981' }}></span>
            Sentinel-2 Citra Optik ({selectedYear})
          </div>
          <div className="legend-item">
            <span className="legend-color-box" style={{ backgroundColor: '#ec4899' }}></span>
            Sentinel-1 SAR Radar ({selectedYear})
          </div>
          <div className="legend-item">
            <span className="legend-color-box" style={{ backgroundColor: '#3b82f6' }}></span>
            Curah Hujan CHIRPS ({selectedYear})
          </div>
          <div className="legend-item">
            <span className="legend-color-box" style={{ backgroundColor: 'rgba(56, 189, 248, 0.2)', borderColor: '#0284c7' }}></span>
            Batas Administrasi 27 Kab/Kota
          </div>

          <div style={{ marginTop: '8px', fontSize: '0.68rem', color: '#64748b', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '6px', lineHeight: 1.3 }}>
            Server GEE: <code>tugas-tpbw-510613</code><br/>
            Data faktual diproses berbasis komputasi awan.
          </div>
        </div>

        {/* Peta Leaflet */}
        <MapContainer
          center={centerJabar}
          zoom={zoomLevel}
          scrollWheelZoom={true}
          style={{ width: '100%', height: '100%' }}
        >
          {/* 1. Basemap (Peta Dasar) */}
          {baseMap === 'satellite' ? (
            <TileLayer
              key="esri-satellite"
              attribution='&copy; <a href="https://www.esri.com/">Esri</a> &mdash; World Imagery'
              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
              maxZoom={18}
            />
          ) : (
            <TileLayer
              key="osm-standard"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
          )}

          {/* 2. Layer Citra Optik Sentinel-2 RGB Dinamis Sesuai Tahun (Paling Bawah setelah Basemap) */}
          {showSentinel2 && S2_TILES[selectedYear] && (
            <TileLayer
              key={`gee-s2-${selectedYear}`}
              url={S2_TILES[selectedYear]}
              attribution="Copernicus Sentinel-2 via Google Earth Engine"
              opacity={s2Opacity}
              zIndex={2}
            />
          )}

          {/* 3. Layer Elevasi DEM SRTM 30m */}
          {showDem && (
            <TileLayer
              key="gee-dem-layer"
              className="dem-colored-tile"
              url={TILE_DEM_URL}
              crossOrigin="anonymous"
              attribution="USGS SRTM DEM via Google Earth Engine"
              opacity={demOpacity}
              zIndex={3}
            />
          )}

          {/* 4. Layer Kemiringan Lereng (Slope) dengan Colormap Nyata (Di Atas Citra) */}
          {showSlope && (
            <TileLayer
              key="gee-slope-layer"
              className="slope-colored-tile"
              url={TILE_SLOPE_URL}
              crossOrigin="anonymous"
              attribution="USGS SRTM Slope via Google Earth Engine"
              opacity={slopeOpacity}
              zIndex={10}
            />
          )}

          {/* 5. Layer Radar Sentinel-1 SAR Dinamis Sesuai Tahun */}
          {showSar && SAR_TILES[selectedYear] && (
            <TileLayer
              key={`gee-sar-${selectedYear}`}
              url={SAR_TILES[selectedYear]}
              attribution="Copernicus Sentinel-1 SAR via Google Earth Engine"
              opacity={sarOpacity}
              zIndex={5}
            />
          )}

          {/* 6. Layer Curah Hujan CHIRPS Dinamis Sesuai Tahun */}
          {showChirps && CHIRPS_TILES[selectedYear] && (
            <TileLayer
              key={`gee-chirps-${selectedYear}`}
              url={CHIRPS_TILES[selectedYear]}
              attribution="UCSB CHIRPS via Google Earth Engine"
              opacity={chirpsOpacity}
              zIndex={6}
            />
          )}

          {/* 7. Layer Batas Wilayah GeoJSON */}
          {showBoundary && geoData && (
            <GeoJSON
              key={`jabar-boundary-${selectedYear}`}
              data={geoData}
              style={geoJsonStyle}
              onEachFeature={onEachFeature}
            />
          )}
        </MapContainer>
      </div>
    </div>
  );
}

export default App;