import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, GeoJSON, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { 
  Layers, Mountain, Satellite, Radio, CloudRain, MapPin, 
  Navigation, Eye, EyeOff, Sliders, ChevronDown, ChevronUp, Sparkles,
  PanelLeftClose, PanelLeftOpen, Activity, AlertTriangle
} from 'lucide-react';

// Fix Leaflet Default Marker Icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Custom Icon untuk Titik Gempa BMKG
const earthquakeIcon = new L.DivIcon({
  className: 'custom-earthquake-marker',
  html: `
    <div style="position: relative; width: 28px; height: 28px; display: flex; items-center; justify-content: center;">
      <span style="position: absolute; width: 100%; height: 100%; border-radius: 50%; background-color: rgba(239, 68, 68, 0.4); animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></span>
      <span style="position: relative; width: 16px; height: 16px; border-radius: 50%; background-color: #ef4444; border: 2px solid #ffffff; box-shadow: 0 0 10px rgba(239, 68, 68, 0.8);"></span>
    </div>
  `,
  iconSize: [28, 28],
  iconAnchor: [14, 14],
});

// =========================================================================
// DATA CITRA SATELIT RESMI & PERMANEN (100% BEBAS EXPIRE / TANPA GEE TOKEN)
// =========================================================================

// 1. CITRA OPTIK SENTINEL-2 RESMI (EOX Cloudless Mozaik per Tahun 2021-2025)
const S2_PERMANENT_TILES = {
  '2021': "https://tiles.maps.eox.at/wmts/1.0.0/s2cloudless-2021_3857/default/g/{z}/{y}/{x}.jpg",
  '2022': "https://tiles.maps.eox.at/wmts/1.0.0/s2cloudless-2022_3857/default/g/{z}/{y}/{x}.jpg",
  '2023': "https://tiles.maps.eox.at/wmts/1.0.0/s2cloudless-2023_3857/default/g/{z}/{y}/{x}.jpg",
  '2024': "https://tiles.maps.eox.at/wmts/1.0.0/s2cloudless-2021_3857/default/g/{z}/{y}/{x}.jpg",
  '2025': "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
};

// 2. MORFOLOGI KEMIRINGAN LERENG & HILLSHADE (Esri Shaded Relief 3D)
const TILE_SLOPE_RELIEF_URL = 
  "https://server.arcgisonline.com/ArcGIS/rest/services/World_Shaded_Relief/MapServer/tile/{z}/{y}/{x}";

// 3. ELEVASI & KONTUR TOPOGRAFI (OpenTopoMap - Kontur & mdpl Pegunungan Jabar)
const TILE_OPENTOPO_URL = 
  "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png";

// 4. RADAR SATELIT MALAM / SENSOR RADAR AKTIF (NASA Earthdata VIIRS)
const SAR_PERMANENT_URL = 
  "https://map1.vis.earthdata.nasa.gov/wmts-webmerc/VIIRS_CityLights_2012/default/GoogleMapsCompatible_Level8/{z}/{y}/{x}.jpg";

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
  const [showRain, setShowRain] = useState(false);
  const [showGempa, setShowGempa] = useState(true);

  // Opacity states
  const [slopeOpacity, setSlopeOpacity] = useState(0.85);
  const [demOpacity, setDemOpacity] = useState(0.7);
  const [s2Opacity, setS2Opacity] = useState(0.9);
  const [sarOpacity, setSarOpacity] = useState(0.65);
  const [rainOpacity, setRainOpacity] = useState(0.75);

  // Live Weather Radar (RainViewer Dynamic Tile Path)
  const [rainRadarPath, setRainRadarPath] = useState(null);

  // Live Gempa BMKG Terkini
  const [gempaData, setGempaData] = useState(null);

  // GPS Locate Me state
  const [userLocation, setUserLocation] = useState(null);
  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState(null);

  // UI state: Docked left sidebar
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // 1. Ambil Data GeoJSON Batas 27 Kab/Kota
  useEffect(() => {
    fetch('/data/jabar-adm.json')
      .then((res) => {
        if (!res.ok) throw new Error('Gagal mengambil file GeoJSON');
        return res.json();
      })
      .then((data) => setGeoData(data))
      .catch((err) => console.error('Error membaca data GeoJSON:', err));
  }, []);

  // 2. Ambil Radar Curah Hujan Realtime (RainViewer Live API)
  useEffect(() => {
    fetch('https://api.rainviewer.com/public/weather-maps.json')
      .then(res => res.json())
      .then(data => {
        if (data?.radar?.past?.length > 0) {
          const latest = data.radar.past[data.radar.past.length - 1];
          setRainRadarPath(latest.path);
        }
      })
      .catch(err => console.warn('Gagal memuat RainViewer Live Radar:', err));
  }, []);

  // 3. Ambil Data Gempa Bumi Terkini Resmi dari BMKG
  useEffect(() => {
    fetch('https://data.bmkg.go.id/DataMKG/TEWS/autogempa.json')
      .then(res => res.json())
      .then(data => {
        if (data?.Infogempa?.gempa) {
          const g = data.Infogempa.gempa;
          const [latStr, lngStr] = g.Coordinates.split(',');
          setGempaData({
            ...g,
            lat: parseFloat(latStr.trim()),
            lng: parseFloat(lngStr.trim())
          });
        }
      })
      .catch(err => console.warn('Gagal mengambil data gempa BMKG:', err));
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
          Tahun Pengamatan Satelit: <b>${selectedYear}</b>
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
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
        ) : (
          <TileLayer
            attribution='&copy; <a href="https://www.esri.com/">Esri World Imagery</a>'
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
          />
        )}

        {/* 2. Layer Topografi DEM & Kontur (OpenTopoMap) */}
        {showDem && (
          <TileLayer
            url={TILE_OPENTOPO_URL}
            opacity={demOpacity}
            attribution='&copy; <a href="https://opentopomap.org">OpenTopoMap</a>'
          />
        )}

        {/* 3. Layer Kemiringan Lereng & Morfologi (Esri Shaded Relief 3D) */}
        {showSlope && (
          <TileLayer
            url={TILE_SLOPE_RELIEF_URL}
            opacity={slopeOpacity}
            attribution='Esri Shaded Relief &bull; Topographic Slope'
          />
        )}

        {/* 4. Layer Sentinel-2 Resmi EOX Cloudless (Permanen 2021-2025) */}
        {showSentinel2 && S2_PERMANENT_TILES[selectedYear] && (
          <TileLayer
            key={`s2-permanent-${selectedYear}`}
            url={S2_PERMANENT_TILES[selectedYear]}
            opacity={s2Opacity}
            attribution='Sentinel-2 Cloudless by <a href="https://maps.eox.at/">EOX</a> / ESA Copernicus'
          />
        )}

        {/* 5. Layer Radar Satelit Malam / SAR (NASA Earthdata) */}
        {showSar && (
          <TileLayer
            url={SAR_PERMANENT_URL}
            opacity={sarOpacity}
            attribution="NASA Earthdata &bull; Nighttime Satellite Radar"
          />
        )}

        {/* 6. Layer Radar Cuaca & Curah Hujan Live (RainViewer) */}
        {showRain && rainRadarPath && (
          <TileLayer
            key={`rain-${rainRadarPath}`}
            url={`https://tilecache.rainviewer.com${rainRadarPath}/256/{z}/{x}/{y}/2/1_1.png`}
            opacity={rainOpacity}
            attribution='Live Precipitation Radar &bull; <a href="https://www.rainviewer.com">RainViewer</a>'
          />
        )}

        {/* 7. Layer Batas Administrasi 27 Kab/Kota */}
        {showBoundary && geoData && (
          <GeoJSON
            key="jabar-boundary-geojson"
            data={geoData}
            style={geoJsonStyle}
            onEachFeature={onEachFeature}
          />
        )}

        {/* 8. Marker Gempa Bumi Terkini (BMKG Real-time) */}
        {showGempa && gempaData && (
          <Marker position={[gempaData.lat, gempaData.lng]} icon={earthquakeIcon}>
            <Popup>
              <div className="p-1 font-sans text-xs space-y-1 text-zinc-900 max-w-xs">
                <div className="flex items-center gap-1.5 text-rose-600 font-bold">
                  <Activity className="w-4 h-4 text-rose-600 animate-pulse" />
                  <span>GEMPA TERKINI (BMKG)</span>
                </div>
                <div className="font-semibold text-zinc-900 text-sm">{gempaData.Wilayah}</div>
                <div className="grid grid-cols-2 gap-1 text-[11px] text-zinc-700 border-y border-zinc-200 py-1.5 my-1">
                  <div>Magnitudo: <b className="text-rose-600 text-sm">{gempaData.Magnitude} M</b></div>
                  <div>Kedalaman: <b>{gempaData.Kedalaman}</b></div>
                  <div>Waktu: <b>{gempaData.Jam}</b></div>
                  <div>Tanggal: <b>{gempaData.Tanggal}</b></div>
                </div>
                <div className="text-[10px] text-zinc-500 italic bg-zinc-100 p-1 rounded">
                  {gempaData.Potensi}
                </div>
              </div>
            </Popup>
          </Marker>
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

          {/* 3. Daftar Layer Penginderaan Jauh Permanen */}
          <div className="space-y-2 pt-2 border-t border-white/10">
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block mb-1">
              Layer Satelit & Bencana (Permanen)
            </span>

            {/* Sentinel-2 RGB (EOX Cloudless) */}
            <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/5 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400"></span>
                  <div>
                    <span className="text-xs font-semibold text-white block">Sentinel-2 Optik ({selectedYear})</span>
                    <span className="text-[10px] text-zinc-400">EOX Cloudless &bull; Bebas Awan</span>
                  </div>
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

            {/* Kemiringan Lereng (Shaded Relief 3D) */}
            <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/5 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-sm shadow-rose-500"></span>
                  <div>
                    <span className="text-xs font-semibold text-white block">Morfologi Lereng (Hillshade 3D)</span>
                    <span className="text-[10px] text-zinc-400">Esri Shaded Relief &bull; Lereng Kritis</span>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={showSlope}
                  onChange={(e) => setShowSlope(e.target.checked)}
                  className="accent-emerald-400 w-4 h-4 cursor-pointer"
                />
              </div>
              {showSlope && (
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
              )}
            </div>

            {/* Curah Hujan Radar Live (RainViewer) */}
            <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/5 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-400 shadow-sm shadow-blue-400"></span>
                  <div>
                    <span className="text-xs font-semibold text-white block">Radar Hujan Real-Time</span>
                    <span className="text-[10px] text-zinc-400">RainViewer Live Radar Awan</span>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={showRain}
                  onChange={(e) => setShowRain(e.target.checked)}
                  className="accent-emerald-400 w-4 h-4 cursor-pointer"
                />
              </div>
              {showRain && (
                <div className="flex items-center justify-between text-[10px] text-zinc-400">
                  <span>Opasitas</span>
                  <input
                    type="range"
                    min="0.1"
                    max="1"
                    step="0.05"
                    value={rainOpacity}
                    onChange={(e) => setRainOpacity(parseFloat(e.target.value))}
                    className="w-28 accent-blue-400 cursor-pointer"
                  />
                  <span className="font-mono">{Math.round(rainOpacity * 100)}%</span>
                </div>
              )}
            </div>

            {/* Topografi & Kontur Elevasi (OpenTopoMap) */}
            <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/5 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-violet-400 shadow-sm shadow-violet-400"></span>
                  <div>
                    <span className="text-xs font-semibold text-white block">Topografi & Kontur Mdpl</span>
                    <span className="text-[10px] text-zinc-400">OpenTopoMap &bull; Ketinggian Gunung</span>
                  </div>
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

            {/* Radar Satelit SAR / Malam (NASA) */}
            <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/5 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-pink-400 shadow-sm shadow-pink-400"></span>
                  <div>
                    <span className="text-xs font-semibold text-white block">Radar Satelit (Sensor Aktif)</span>
                    <span className="text-[10px] text-zinc-400">NASA Earthdata GIBS</span>
                  </div>
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

            {/* Gempa Terkini BMKG (Real-time Pin) */}
            <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping"></span>
                <div>
                  <span className="text-xs font-semibold text-white block">Titik Gempa Terkini</span>
                  <span className="text-[10px] text-zinc-400">BMKG AutoGempa Real-time</span>
                </div>
              </div>
              <input
                type="checkbox"
                checked={showGempa}
                onChange={(e) => setShowGempa(e.target.checked)}
                className="accent-rose-500 w-4 h-4 cursor-pointer"
              />
            </div>

            {/* Batas 27 Kab/Kota */}
            <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-sky-400"></span>
                <span className="text-xs font-semibold text-white">Batas 27 Kab/Kota Jabar</span>
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
          <span>Legenda Pemetaan Jawa Barat</span>
        </div>
        <div className="space-y-1.5 text-[11px] text-zinc-300">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded bg-emerald-400"></span>
            <span>Sentinel-2 : Citra Optik Alami</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded bg-amber-500"></span>
            <span>Hillshade : Lereng Terjal Pegunungan</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded bg-blue-400"></span>
            <span>RainViewer : Radar Presipitasi Live</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded bg-rose-500 animate-pulse"></span>
            <span>Pin Berdenyut : Pusat Gempa BMKG</span>
          </div>
        </div>
      </div>
    </div>
  );
}
