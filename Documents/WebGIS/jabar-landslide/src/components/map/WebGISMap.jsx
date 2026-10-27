import React, { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, GeoJSON, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { 
  Layers, Mountain, Satellite, Radio, CloudRain, MapPin, 
  Navigation, Eye, EyeOff, Sliders, ChevronDown, ChevronUp, Sparkles,
  PanelLeftClose, PanelLeftOpen, X
} from 'lucide-react';

// Fix Leaflet Default Icon in Webpack/Vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// =========================================================================
// DATA RESMI GOOGLE EARTH ENGINE (PROJECT: tugas-tpbw-510613)
// =========================================================================

const TILE_DEM_URL = 
  "https://earthengine.googleapis.com/v1/projects/tugas-tpbw-510613/maps/fcb2064c70af2983335acc906e376ba4-ab0eb5c19baf66681a45d0c7b96da437/tiles/{z}/{x}/{y}";

const TILE_SLOPE_URL = 
  "https://earthengine.googleapis.com/v1/projects/tugas-tpbw-510613/maps/c5166a6f88620ce52c3fb1db3204eca4-f22e69aad551677c6409fc85ad6b578e/tiles/{z}/{x}/{y}";

const S2_TILES = {
  '2021': "https://earthengine.googleapis.com/v1/projects/tugas-tpbw-510613/maps/d4b28ebfa8350be34099504c5f26d0bd-8414e96c210eedf1314db9575e479851/tiles/{z}/{x}/{y}",
  '2022': "https://earthengine.googleapis.com/v1/projects/tugas-tpbw-510613/maps/42b2e71a6d6bb26e6db6de7a5a50950d-4f638c23985504a30bda02872e4f44af/tiles/{z}/{x}/{y}",
  '2023': "https://earthengine.googleapis.com/v1/projects/tugas-tpbw-510613/maps/a35b688b46136ad6e3f065874e1cbda4-081e5cc9d8025d7ceb734d200eb15092/tiles/{z}/{x}/{y}",
  '2024': "https://earthengine.googleapis.com/v1/projects/tugas-tpbw-510613/maps/e34d32412419a0a1d3dc5c2319f85c2b-b2fd31b9bd952229ecf0d511c76e809f/tiles/{z}/{x}/{y}",
  '2025': "https://earthengine.googleapis.com/v1/projects/tugas-tpbw-510613/maps/9a3281fb425a8111606e8383c274c643-57c11cee72e3325d9708379a0cade29a/tiles/{z}/{x}/{y}",
};

const SAR_TILES = {
  '2021': "https://earthengine.googleapis.com/v1/projects/tugas-tpbw-510613/maps/fef5b5920b36f65d8660208e8c776e97-6a8461f36905aa99bbd53567771bcfa6/tiles/{z}/{x}/{y}",
  '2022': "https://earthengine.googleapis.com/v1/projects/tugas-tpbw-510613/maps/903ed40d784ae6963c84890ad981d5e6-b8c2ef7b243a2a064f99c42832a7ee85/tiles/{z}/{x}/{y}",
  '2023': "https://earthengine.googleapis.com/v1/projects/tugas-tpbw-510613/maps/9376891d236ce599c0b255299ebafe83-cfe84aa357c49697498712bd42a154f0/tiles/{z}/{x}/{y}",
  '2024': "https://earthengine.googleapis.com/v1/projects/tugas-tpbw-510613/maps/5339849cb6b95e83217886d1f499f4bb-fd92a1b270bb2a1870641d207d184c20/tiles/{z}/{x}/{y}",
  '2025': "https://earthengine.googleapis.com/v1/projects/tugas-tpbw-510613/maps/bb9d967bb9f3718cf968209f14792fe5-f5a0366377fa0dfff1ac241d15b6f2fe/tiles/{z}/{x}/{y}",
};

const CHIRPS_TILES = {
  '2021': "https://earthengine.googleapis.com/v1/projects/tugas-tpbw-510613/maps/7890d39f6b87ffd8396e326749dc7050-3d7b5d7a5dcc130df203b0bff80607e2/tiles/{z}/{x}/{y}",
  '2022': "https://earthengine.googleapis.com/v1/projects/tugas-tpbw-510613/maps/692e9387b5a463f29fe2ab472f76fc5b-2af58c939826a42ef997e2e9e821e80c/tiles/{z}/{x}/{y}",
  '2023': "https://earthengine.googleapis.com/v1/projects/tugas-tpbw-510613/maps/69be477c2549506c72cf9ac3940b3ce6-6faf89e5d1eebb0f43e08fcc25c25c05/tiles/{z}/{x}/{y}",
  '2024': "https://earthengine.googleapis.com/v1/projects/tugas-tpbw-510613/maps/26e56c16eae6f79fd1b0fb91f7d0618a-23b67b34afc88ec99a0af62ac8dc54dc/tiles/{z}/{x}/{y}",
  '2025': "https://earthengine.googleapis.com/v1/projects/tugas-tpbw-510613/maps/6653fe3e5fa45daebfd49236e1dd3576-8fe734681abc84566592bf302f1e7c5b/tiles/{z}/{x}/{y}",
};

// Layer Geologi / Formasi Batuan Jawa Barat (Tile Service)
const TILE_GEOLOGY_URL = 
  "https://server.arcgisonline.com/ArcGIS/rest/services/Specialty/DeLorme_World_Base_Map/MapServer/tile/{z}/{y}/{x}";

// Sub-komponen Kontrol Kamera Peta (Fly to User GPS)
function MapCameraController({ userCoords }) {
  const map = useMap();
  useEffect(() => {
    if (userCoords) {
      map.flyTo([userCoords.lat, userCoords.lng], 13, { animate: true, duration: 1.5 });
    }
  }, [userCoords, map]);
  return null;
}

export default function WebGISMap({ initialLayer }) {
  const centerJabar = [-6.9175, 107.6191];
  const zoomLevel = 8;
  const [geoData, setGeoData] = useState(null);

  // Filter Tahun
  const [selectedYear, setSelectedYear] = useState('2023');

  // Layer Visibility
  const [baseMap, setBaseMap] = useState('osm'); // 'osm' | 'satellite'
  const [showBoundary, setShowBoundary] = useState(true);
  const [showSlope, setShowSlope] = useState(true);
  const [showDem, setShowDem] = useState(false);
  const [showSentinel2, setShowSentinel2] = useState(true);
  const [showSar, setShowSar] = useState(false);
  const [showChirps, setShowChirps] = useState(false);
  const [showGeology, setShowGeology] = useState(false);

  // Opacity states
  const [slopeOpacity, setSlopeOpacity] = useState(0.9);
  const [demOpacity, setDemOpacity] = useState(0.7);
  const [s2Opacity, setS2Opacity] = useState(0.85);
  const [sarOpacity, setSarOpacity] = useState(0.7);
  const [chirpsOpacity, setChirpsOpacity] = useState(0.65);
  const [geologyOpacity, setGeologyOpacity] = useState(0.5);

  // GPS Locate Me state
  const [userLocation, setUserLocation] = useState(null);
  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState(null);

  // UI state: Docked left sidebar
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Load GeoJSON Batas Administrasi
  useEffect(() => {
    fetch('/data/jabar-adm.json')
      .then((res) => {
        if (!res.ok) throw new Error('Gagal mengambil file GeoJSON');
        return res.json();
      })
      .then((data) => setGeoData(data))
      .catch((err) => console.error('Error membaca data GeoJSON:', err));
  }, []);

  // Handle Locate Me (GPS)
  const handleLocateMe = () => {
    setIsLocating(true);
    setLocationError(null);
    if (!navigator.geolocation) {
      setLocationError('Browser Anda tidak mendukung fitur geolokasi GPS.');
      setIsLocating(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy
        });
        setIsLocating(false);
      },
      (error) => {
        setLocationError('Gagal mendeteksi lokasi GPS. Pastikan izin lokasi aktif.');
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const geoJsonStyle = {
    color: '#38bdf8',
    weight: 1.8,
    opacity: 0.9,
    fillColor: '#0284c7',
    fillOpacity: 0.05
  };

  const onEachFeature = (feature, layer) => {
    const name = feature.properties?.shapeName || feature.properties?.NAME_2 || 'Wilayah Jawa Barat';
    layer.bindPopup(`
      <div style="font-family: inherit; line-height: 1.4; padding: 4px;">
        <strong style="color: #38bdf8; font-size: 0.95rem; display: block; margin-bottom: 2px;">
          ${name}
        </strong>
        <span style="font-size: 0.75rem; color: #94a3b8; display: block;">
          Provinsi Jawa Barat &bull; ADM2
        </span>
        <div style="margin-top: 8px; font-size: 0.75rem; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 6px; color: #cbd5e1;">
          Tahun Analisis Citra: <b>${selectedYear}</b>
        </div>
      </div>
    `);
  };

  return (
    <div className="relative w-full h-[calc(100vh-80px)] mt-20 overflow-hidden bg-black">
      {/* Map Canvas */}
      <MapContainer
        center={centerJabar}
        zoom={zoomLevel}
        scrollWheelZoom={true}
        className="w-full h-full"
      >
        <MapCameraController userCoords={userLocation} />

        {/* 1. Basemap */}
        {baseMap === 'osm' ? (
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
        ) : (
          <TileLayer
            attribution='&copy; <a href="https://www.esri.com/">Esri World Imagery</a>'
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
          />
        )}

        {/* 2. Layer Geologi / Formasi Tanah */}
        {showGeology && (
          <TileLayer
            url={TILE_GEOLOGY_URL}
            opacity={geologyOpacity}
            attribution="Esri DeLorme World Base Map / Geology Reference"
          />
        )}

        {/* 3. Layer Sentinel-2 (Dinamis 2021-2025) */}
        {showSentinel2 && S2_TILES[selectedYear] && (
          <TileLayer
            key={`s2-${selectedYear}`}
            url={S2_TILES[selectedYear]}
            opacity={s2Opacity}
            attribution="Sentinel-2 L2A &bull; Google Earth Engine"
          />
        )}

        {/* 4. Layer Radar Sentinel-1 SAR (Dinamis 2021-2025) */}
        {showSar && SAR_TILES[selectedYear] && (
          <TileLayer
            key={`sar-${selectedYear}`}
            url={SAR_TILES[selectedYear]}
            opacity={sarOpacity}
            attribution="Sentinel-1 SAR C-Band &bull; Google Earth Engine"
          />
        )}

        {/* 5. Layer Curah Hujan CHIRPS (Dinamis 2021-2025) */}
        {showChirps && CHIRPS_TILES[selectedYear] && (
          <TileLayer
            key={`chirps-${selectedYear}`}
            url={CHIRPS_TILES[selectedYear]}
            opacity={chirpsOpacity}
            attribution="CHIRPS Precipitation &bull; Google Earth Engine"
          />
        )}

        {/* 6. Layer Topografi DEM */}
        {showDem && (
          <TileLayer
            url={TILE_DEM_URL}
            opacity={demOpacity}
            attribution="SRTM DEM 30m &bull; GEE"
            className="filter-dem-terrain"
          />
        )}

        {/* 7. Layer Kemiringan Lereng (Slope) */}
        {showSlope && (
          <TileLayer
            url={TILE_SLOPE_URL}
            opacity={slopeOpacity}
            attribution="Slope Analysis &bull; Google Earth Engine"
            className="filter-slope-hazard"
          />
        )}

        {/* 8. Layer Batas Administrasi */}
        {showBoundary && geoData && (
          <GeoJSON
            key="jabar-boundary-geojson"
            data={geoData}
            style={geoJsonStyle}
            onEachFeature={onEachFeature}
          />
        )}

        {/* 9. Marker GPS Posisi Pengguna */}
        {userLocation && (
          <Marker position={[userLocation.lat, userLocation.lng]}>
            <Popup>
              <div className="text-zinc-900 font-sans text-xs">
                <b>Lokasi Anda Terdeteksi</b>
                <br />
                Akurasi: &plusmn;{Math.round(userLocation.accuracy)} meter
              </div>
            </Popup>
          </Marker>
        )}
      </MapContainer>

      {/* Floating GPS Locate Button (Top Right) */}
      <div className="absolute top-4 right-4 z-[900] flex flex-col gap-2">
        <button
          onClick={handleLocateMe}
          disabled={isLocating}
          className="p-3 rounded-full bg-zinc-950/80 hover:bg-zinc-800 text-white border border-white/20 backdrop-blur-md shadow-xl transition-all hover:scale-105 active:scale-95 flex items-center justify-center cursor-pointer group"
          title="Deteksi Lokasi GPS Saya"
        >
          <Navigation className={`w-5 h-5 text-emerald-400 group-hover:rotate-45 transition-transform ${isLocating ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {locationError && (
        <div className="absolute top-16 right-4 z-[900] max-w-xs p-3 rounded-xl bg-rose-950/80 border border-rose-500/40 text-rose-200 text-xs backdrop-blur-md shadow-lg animate-fade-in-up">
          {locationError}
        </div>
      )}

      {/* Floating Button to Reopen Sidebar (Visible when Sidebar is Closed) */}
      {!isSidebarOpen && (
        <button
          onClick={() => setIsSidebarOpen(true)}
          className="absolute top-4 left-4 z-[900] px-4 py-2.5 rounded-2xl bg-zinc-950/85 hover:bg-zinc-800 text-white border border-white/20 backdrop-blur-md shadow-2xl flex items-center gap-2.5 text-xs font-semibold hover:border-emerald-400/50 hover:scale-105 active:scale-95 transition-all cursor-pointer group animate-fade-in-up"
          title="Buka Panel Layer"
        >
          <Layers className="w-4 h-4 text-emerald-400 group-hover:rotate-12 transition-transform" />
          <span>Layer & Kontrol</span>
        </button>
      )}

      {/* Docked Left Sidebar (Menyatu ke Kiri & Bisa Ditutup) */}
      <aside 
        className={`absolute top-0 bottom-0 left-0 z-[950] w-84 max-w-[85vw] h-full bg-zinc-950/92 backdrop-blur-2xl border-r border-white/10 shadow-2xl flex flex-col transition-transform duration-300 ease-in-out ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Panel Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 bg-white/[0.02]">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-white block">
                Layer & Analisis
              </span>
              <span className="text-[10px] text-zinc-400 font-mono">
                WebGIS Jabar EWS
              </span>
            </div>
          </div>
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="p-1.5 rounded-xl text-zinc-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer group"
            title="Tutup Panel ke Kiri"
          >
            <PanelLeftClose className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          </button>
        </div>

        {/* Scrollable Panel Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 text-left">
            {/* 1. Pemilih Tahun */}
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block mb-2">
                Tahun Pengamatan Satelit
              </span>
              <div className="grid grid-cols-5 gap-1 p-1 rounded-xl bg-white/5 border border-white/10">
                {['2021', '2022', '2023', '2024', '2025'].map((yr) => (
                  <button
                    key={yr}
                    onClick={() => setSelectedYear(yr)}
                    className={`py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                      selectedYear === yr
                        ? 'bg-emerald-400 text-zinc-950 shadow-md shadow-emerald-400/20'
                        : 'text-zinc-400 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    {yr}
                  </button>
                ))}
              </div>
            </div>

            {/* 2. Peta Dasar (Basemap) */}
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block mb-2">
                Peta Dasar
              </span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setBaseMap('osm')}
                  className={`py-1.5 px-3 rounded-xl text-xs font-medium border transition-all cursor-pointer ${
                    baseMap === 'osm'
                      ? 'bg-white/15 border-emerald-400 text-emerald-300'
                      : 'border-white/10 text-zinc-400 hover:text-white'
                  }`}
                >
                  🗺️ Standar OSM
                </button>
                <button
                  onClick={() => setBaseMap('satellite')}
                  className={`py-1.5 px-3 rounded-xl text-xs font-medium border transition-all cursor-pointer ${
                    baseMap === 'satellite'
                      ? 'bg-white/15 border-emerald-400 text-emerald-300'
                      : 'border-white/10 text-zinc-400 hover:text-white'
                  }`}
                >
                  🛰️ Citra Esri
                </button>
              </div>
            </div>

            {/* 3. Daftar Layer Penginderaan Jauh */}
            <div className="space-y-2 pt-2 border-t border-white/10">
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block mb-1">
                Layer Tematik GEE
              </span>

              {/* Kemiringan Lereng (Slope) */}
              <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/5 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-sm shadow-rose-500"></span>
                    <span className="text-xs font-semibold text-white">Kemiringan Lereng</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={showSlope}
                    onChange={(e) => setShowSlope(e.target.checked)}
                    className="accent-emerald-400 w-4 h-4 cursor-pointer"
                  />
                </div>
                {showSlope && (
                  <div className="space-y-1">
                    <div className="h-1.5 rounded-full bg-gradient-to-r from-emerald-400 via-amber-400 to-rose-600"></div>
                    <div className="flex items-center justify-between text-[10px] text-zinc-400">
                      <span>Opasitas</span>
                      <input
                        type="range"
                        min="0.1"
                        max="1"
                        step="0.05"
                        value={slopeOpacity}
                        onChange={(e) => setSlopeOpacity(parseFloat(e.target.value))}
                        className="w-28 accent-emerald-400 cursor-pointer"
                      />
                      <span className="font-mono">{Math.round(slopeOpacity * 100)}%</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Sentinel-2 RGB */}
              <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/5 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400"></span>
                    <span className="text-xs font-semibold text-white">Sentinel-2 RGB ({selectedYear})</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={showSentinel2}
                    onChange={(e) => setShowSentinel2(e.target.checked)}
                    className="accent-emerald-400 w-4 h-4 cursor-pointer"
                  />
                </div>
                {showSentinel2 && (
                  <div className="flex items-center justify-between text-[10px] text-zinc-400">
                    <span>Opasitas</span>
                    <input
                      type="range"
                      min="0.1"
                      max="1"
                      step="0.05"
                      value={s2Opacity}
                      onChange={(e) => setS2Opacity(parseFloat(e.target.value))}
                      className="w-28 accent-emerald-400 cursor-pointer"
                    />
                    <span className="font-mono">{Math.round(s2Opacity * 100)}%</span>
                  </div>
                )}
              </div>

              {/* Radar Sentinel-1 SAR */}
              <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/5 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-pink-400 shadow-sm shadow-pink-400"></span>
                    <span className="text-xs font-semibold text-white">Radar Sentinel-1 SAR</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={showSar}
                    onChange={(e) => setShowSar(e.target.checked)}
                    className="accent-emerald-400 w-4 h-4 cursor-pointer"
                  />
                </div>
                {showSar && (
                  <div className="flex items-center justify-between text-[10px] text-zinc-400">
                    <span>Opasitas</span>
                    <input
                      type="range"
                      min="0.1"
                      max="1"
                      step="0.05"
                      value={sarOpacity}
                      onChange={(e) => setSarOpacity(parseFloat(e.target.value))}
                      className="w-28 accent-pink-400 cursor-pointer"
                    />
                    <span className="font-mono">{Math.round(sarOpacity * 100)}%</span>
                  </div>
                )}
              </div>

              {/* Curah Hujan CHIRPS */}
              <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/5 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-400 shadow-sm shadow-blue-400"></span>
                    <span className="text-xs font-semibold text-white">Curah Hujan CHIRPS</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={showChirps}
                    onChange={(e) => setShowChirps(e.target.checked)}
                    className="accent-emerald-400 w-4 h-4 cursor-pointer"
                  />
                </div>
                {showChirps && (
                  <div className="flex items-center justify-between text-[10px] text-zinc-400">
                    <span>Opasitas</span>
                    <input
                      type="range"
                      min="0.1"
                      max="1"
                      step="0.05"
                      value={chirpsOpacity}
                      onChange={(e) => setChirpsOpacity(parseFloat(e.target.value))}
                      className="w-28 accent-blue-400 cursor-pointer"
                    />
                    <span className="font-mono">{Math.round(chirpsOpacity * 100)}%</span>
                  </div>
                )}
              </div>

              {/* DEM SRTM Topografi */}
              <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/5 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-violet-400 shadow-sm shadow-violet-400"></span>
                    <span className="text-xs font-semibold text-white">Elevasi DEM 30m</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={showDem}
                    onChange={(e) => setShowDem(e.target.checked)}
                    className="accent-emerald-400 w-4 h-4 cursor-pointer"
                  />
                </div>
                {showDem && (
                  <div className="flex items-center justify-between text-[10px] text-zinc-400">
                    <span>Opasitas</span>
                    <input
                      type="range"
                      min="0.1"
                      max="1"
                      step="0.05"
                      value={demOpacity}
                      onChange={(e) => setDemOpacity(parseFloat(e.target.value))}
                      className="w-28 accent-violet-400 cursor-pointer"
                    />
                    <span className="font-mono">{Math.round(demOpacity * 100)}%</span>
                  </div>
                )}
              </div>

              {/* Batas Administrasi */}
              <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-sky-400"></span>
                  <span className="text-xs font-semibold text-white">Batas 27 Kab/Kota</span>
                </div>
                <input
                  type="checkbox"
                  checked={showBoundary}
                  onChange={(e) => setShowBoundary(e.target.checked)}
                  className="accent-emerald-400 w-4 h-4 cursor-pointer"
                />
              </div>
            </div>
        </div>
      </aside>

      {/* Floating Bottom-Right Legend */}
      <div className="absolute bottom-6 right-6 z-[900] p-4 rounded-2xl glass-panel-elevated border border-white/10 text-left max-w-xs text-xs shadow-2xl hidden sm:block">
        <div className="font-semibold text-white mb-2 flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
          <span>Legenda Kerawanan Lereng</span>
        </div>
        <div className="space-y-1.5 text-[11px] text-zinc-300">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded bg-[#00e676]"></span>
            <span>0°–15° : Datar s/d Landai (Aman)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded bg-[#ffea00]"></span>
            <span>15°–25° : Agak Curam (Waspada)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded bg-[#ff6d00]"></span>
            <span>25°–45° : Curam (Rawan Longsor)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded bg-[#ff1744]"></span>
            <span>&gt;45° : Sangat Curam (Kritis)</span>
          </div>
        </div>
      </div>
    </div>
  );
}
