import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, GeoJSON, Marker, Popup, Polyline, Tooltip, ImageOverlay, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { 
  Layers, Mountain, Satellite, Radio, CloudRain, MapPin, 
  Navigation, Eye, EyeOff, Sliders, ChevronDown, ChevronUp, Sparkles,
  PanelLeftClose, PanelLeftOpen, Activity, AlertTriangle, ShieldAlert,
  Flame, Home, Users, Building2, Info, X, RefreshCw,
  Calendar, Clock, Play, Pause, SkipBack, SkipForward, RotateCcw, History, FastForward
} from 'lucide-react';

// Fix Leaflet Default Marker Icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Custom Icon untuk Titik Gempa Real-time BMKG
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

// Custom Icon untuk Gempa Merusak Historis BNPB
const createHistoricalQuakeIcon = (mag, isHighlighted = false) => {
  return new L.DivIcon({
    className: 'custom-historical-quake-marker',
    html: `
      <div style="display: flex; align-items: center; gap: 4px; background: ${isHighlighted ? 'rgba(225, 29, 72, 0.95)' : 'rgba(15, 23, 42, 0.95)'}; border: 2px solid ${isHighlighted ? '#fbbf24' : '#f43f5e'}; padding: 3px 8px; border-radius: 9999px; box-shadow: 0 4px ${isHighlighted ? '20px rgba(251, 191, 36, 0.9)' : '14px rgba(244, 63, 94, 0.6)'}; white-space: nowrap; cursor: pointer; ${isHighlighted ? 'transform: scale(1.15); animation: pulse 1.5s infinite;' : ''}">
        <span style="width: 8px; height: 8px; border-radius: 50%; background: ${isHighlighted ? '#fbbf24' : '#f43f5e'}; box-shadow: 0 0 8px ${isHighlighted ? '#fbbf24' : '#f43f5e'};"></span>
        <span style="color: #ffffff; font-size: 11px; font-weight: 800; font-family: sans-serif;">M ${mag}</span>
      </div>
    `,
    iconSize: isHighlighted ? [85, 30] : [75, 26],
    iconAnchor: isHighlighted ? [42, 15] : [37, 13],
  });
};

// Custom Icon untuk Stasiun Cuaca & Sensor Terkini
const createWeatherStationIcon = (stationName, rainStatus) => {
  const isRain = rainStatus && rainStatus.includes('Hujan');
  return new L.DivIcon({
    className: 'custom-weather-station-marker',
    html: `
      <div style="display: flex; items-center; gap: 4px; background: rgba(15, 23, 42, 0.95); border: 1.5px solid ${isRain ? '#38bdf8' : '#34d399'}; padding: 3px 8px; border-radius: 9999px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5); white-space: nowrap; cursor: pointer;">
        <span style="width: 7px; height: 7px; border-radius: 50%; background: ${isRain ? '#38bdf8' : '#34d399'}; box-shadow: 0 0 6px ${isRain ? '#38bdf8' : '#34d399'};"></span>
        <span style="color: #ffffff; font-size: 10px; font-weight: 700; font-family: sans-serif;">${stationName.split(' ')[0]}</span>
      </div>
    `,
    iconSize: [85, 24],
    iconAnchor: [42, 12],
  });
};

// =========================================================================
// DATA CITRA SATELIT RESMI & PERMANEN (100% BEBAS EXPIRE)
// =========================================================================

// 1. CITRA OPTIK SENTINEL-2 RESMI (EOX Cloudless Mozaik per Tahun 2021-2025 & Terkini)
const S2_PERMANENT_TILES = {
  'terkini': "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
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

// 5. SATELIT CUACA HIMAWARI-9 BMKG (SEKTOR INDONESIA & JAWA BARAT)
// Ekstensi koordinat resmi citra satelit inderaja BMKG: Latitude [-20.0, 20.0], Longitude [90.0, 150.0]
const HIMAWARI_BOUNDS = [
  [-20.0, 90.0],  // Pojok Barat Daya [Lat, Lng]
  [20.0, 150.0]   // Pojok Timur Laut [Lat, Lng]
];

const HIMAWARI_PRODUCTS = {
  'EH': {
    id: 'EH',
    name: 'Enhanced IR (Awan Konvektif / Cb)',
    shortName: 'Awan Konvektif',
    url: 'https://inderaja.bmkg.go.id/IMAGE/HIMA/H08_EH_Indonesia.png',
    desc: 'Deteksi awan dingin Cumulonimbus pemicu hujan badai & longsor'
  },
  'RP': {
    id: 'RP',
    name: 'Rainfall Potential (Curah Hujan)',
    shortName: 'Potensi Hujan',
    url: 'https://inderaja.bmkg.go.id/IMAGE/HIMA/H08_RP_Indonesia.png',
    desc: 'Estimasi intensitas curah hujan per jam dari sensor satelit'
  },
  'NC': {
    id: 'NC',
    name: 'Natural Color (RGB Tutupan Awan)',
    shortName: 'Warna Alami',
    url: 'https://inderaja.bmkg.go.id/IMAGE/HIMA/H08_NC_Indonesia.png',
    desc: 'Komposit optik warna alami tutupan awan di atas Jawa Barat'
  }
};

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

  // Waktu Real-world Hari Ini
  const now = new Date();
  const currentRealYear = now.getFullYear();
  const currentRealMonth = now.getMonth() + 1; // 1-12
  const currentRealDay = now.getDate();
  const currentRealHour = now.getHours();
  const todayDateStr = `${currentRealYear}-${String(currentRealMonth).padStart(2, '0')}-${String(currentRealDay).padStart(2, '0')}`;

  // State Filter Mode Simulasi: 'hari' (24 Jam) | 'bulan' (Harian dlm Bulan) | 'tahun' (2021-2026)
  const [simMode, setSimMode] = useState('hari');
  // State Kecepatan Putar (Playback Speed): 0.5x, 1x, 2x, 4x
  const [playbackSpeed, setPlaybackSpeed] = useState(1);

  // State Kalender & Fitur Maju/Mundur Waktu
  const [selectedDate, setSelectedDate] = useState(todayDateStr);
  const [selectedHour, setSelectedHour] = useState(currentRealHour);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showTimeline, setShowTimeline] = useState(true);

  // Parsing Tanggal Terpilih
  const [selYearStr, selMonthStr, selDayStr] = (selectedDate || todayDateStr).split('-');
  const selectedYearNum = parseInt(selYearStr, 10) || currentRealYear;
  const selectedMonthNum = parseInt(selMonthStr, 10) || currentRealMonth;
  const selectedDayNum = parseInt(selDayStr, 10) || currentRealDay;

  // Batas Kalender & Jam Realtime
  const isToday = selectedDate === todayDateStr;
  const isCurrentMonth = selectedYearNum === currentRealYear && selectedMonthNum === currentRealMonth;
  const daysInSelectedMonth = new Date(selectedYearNum, selectedMonthNum, 0).getDate();
  const maxAvailableDay = isCurrentMonth ? Math.min(daysInSelectedMonth, currentRealDay) : daysInSelectedMonth;
  const maxAvailableHour = isToday ? currentRealHour : 23;

  // Status Live & Tahun Citra Satelit Terpilih
  const isLive = (simMode === 'hari' && isToday && selectedHour === currentRealHour) ||
                 (simMode === 'bulan' && isToday) ||
                 (simMode === 'tahun' && selectedYearNum === 2026);

  const selectedYear = (selectedYearNum === 2026 || isLive) ? 'terkini' : String(selectedYearNum);
  const dateYear = String(selectedYearNum);

  // Looping Auto-Play Timeline (Dengan Kecepatan Playback Speed Dinamis & Multi-Mode)
  useEffect(() => {
    let interval;
    if (isPlaying) {
      const speedDelays = {
        0.5: 2000,
        1: 1000,
        2: 500,
        4: 250,
      };
      const delay = speedDelays[playbackSpeed] || 1000;

      interval = setInterval(() => {
        if (simMode === 'hari') {
          setSelectedHour((prev) => (prev >= maxAvailableHour ? 0 : prev + 1));
        } else if (simMode === 'bulan') {
          setSelectedDate((prevDate) => {
            const [yS, mS, dS] = (prevDate || todayDateStr).split('-');
            const y = parseInt(yS, 10);
            const m = parseInt(mS, 10);
            const d = parseInt(dS, 10);
            const totalDays = new Date(y, m, 0).getDate();
            const isCurrM = y === currentRealYear && m === currentRealMonth;
            const maxD = isCurrM ? Math.min(totalDays, currentRealDay) : totalDays;
            const nextD = d >= maxD ? 1 : d + 1;
            return `${y}-${String(m).padStart(2, '0')}-${String(nextD).padStart(2, '0')}`;
          });
        } else if (simMode === 'tahun') {
          setSelectedDate((prevDate) => {
            const [yS, mS, dS] = (prevDate || todayDateStr).split('-');
            const y = parseInt(yS, 10);
            const nextY = y >= 2026 ? 2021 : y + 1;
            if (nextY === 2026) return todayDateStr;
            return `${nextY}-${mS}-${dS}`;
          });
        }
      }, delay);
    }
    return () => clearInterval(interval);
  }, [isPlaying, simMode, playbackSpeed, maxAvailableHour, maxAvailableDay, currentRealYear, currentRealMonth, currentRealDay, todayDateStr]);

  // Jaga agar selectedHour tidak melampaui maxAvailableHour
  useEffect(() => {
    if (selectedHour > maxAvailableHour) {
      setSelectedHour(maxAvailableHour);
    }
  }, [maxAvailableHour, selectedHour]);

  // Jaga agar selectedDayNum tidak melampaui maxAvailableDay
  useEffect(() => {
    if (selectedDayNum > maxAvailableDay) {
      setSelectedDate(`${selectedYearNum}-${String(selectedMonthNum).padStart(2, '0')}-${String(maxAvailableDay).padStart(2, '0')}`);
    }
  }, [maxAvailableDay, selectedDayNum, selectedMonthNum, selectedYearNum]);

  const handleDateChange = (newDateStr) => {
    setSelectedDate(newDateStr);
    setIsPlaying(false);
    const newIsToday = newDateStr === todayDateStr;
    const newMaxHour = newIsToday ? currentRealHour : 23;
    if (selectedHour > newMaxHour) {
      setSelectedHour(newMaxHour);
    }
  };

  // Navigasi Langkah Mundur Sesuai Mode
  const canStepBack = simMode === 'hari' ? selectedHour > 0 :
                      simMode === 'bulan' ? selectedDayNum > 1 :
                      selectedYearNum > 2021;

  const handleStepBack = () => {
    if (simMode === 'hari') {
      setSelectedHour((prev) => Math.max(0, prev - 1));
    } else if (simMode === 'bulan') {
      const prevD = Math.max(1, selectedDayNum - 1);
      setSelectedDate(`${selectedYearNum}-${String(selectedMonthNum).padStart(2, '0')}-${String(prevD).padStart(2, '0')}`);
    } else if (simMode === 'tahun') {
      const prevY = Math.max(2021, selectedYearNum - 1);
      if (prevY === 2026) setSelectedDate(todayDateStr);
      else setSelectedDate(`${prevY}-${selMonthStr}-${selDayStr}`);
    }
  };

  // Navigasi Langkah Maju Sesuai Mode
  const canStepForward = simMode === 'hari' ? selectedHour < maxAvailableHour :
                         simMode === 'bulan' ? selectedDayNum < maxAvailableDay :
                         selectedYearNum < 2026;

  const handleStepForward = () => {
    if (simMode === 'hari') {
      setSelectedHour((prev) => Math.min(maxAvailableHour, prev + 1));
    } else if (simMode === 'bulan') {
      const nextD = Math.min(maxAvailableDay, selectedDayNum + 1);
      setSelectedDate(`${selectedYearNum}-${String(selectedMonthNum).padStart(2, '0')}-${String(nextD).padStart(2, '0')}`);
    } else if (simMode === 'tahun') {
      const nextY = Math.min(2026, selectedYearNum + 1);
      if (nextY === 2026) setSelectedDate(todayDateStr);
      else setSelectedDate(`${nextY}-${selMonthStr}-${selDayStr}`);
    }
  };

  const getIndonesianMonthName = (monthIndex) => {
    const months = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];
    return months[monthIndex - 1] || '';
  };

  const formatIndonesianDateFull = (dateStr) => {
    if (!dateStr) return '';
    const [y, m, d] = dateStr.split('-');
    return `${parseInt(d, 10)} ${getIndonesianMonthName(parseInt(m, 10))} ${y}`;
  };

  // Layer Visibility
  const [baseMap, setBaseMap] = useState('osm'); // 'osm' | 'satellite'
  const [showBoundary, setShowBoundary] = useState(true);
  const [showSlope, setShowSlope] = useState(true);
  const [showDem, setShowDem] = useState(false);
  const [showSentinel2, setShowSentinel2] = useState(true);
  const [showSar, setShowSar] = useState(false);
  const [showHimawari, setShowHimawari] = useState(true);
  const [himawariProduct, setHimawariProduct] = useState('EH'); // 'EH' | 'RP' | 'NC'
  const [himawariOpacity, setHimawariOpacity] = useState(0.7);
  const [himawariTimestamp, setHimawariTimestamp] = useState(Date.now());
  const [showGempa, setShowGempa] = useState(true);
  const [showFaults, setShowFaults] = useState(true);
  const [showHistoricalQuakes, setShowHistoricalQuakes] = useState(true);
  const [showSoilLayer, setShowSoilLayer] = useState(false);

  // Opacity states
  const [slopeOpacity, setSlopeOpacity] = useState(0.85);
  const [demOpacity, setDemOpacity] = useState(0.7);
  const [s2Opacity, setS2Opacity] = useState(0.9);
  const [sarOpacity, setSarOpacity] = useState(0.65);

  // Live Gempa BMKG Terkini
  const [gempaData, setGempaData] = useState(null);

  // Data Faktual BNPB, PuSGeN, & Tanah
  const [seismicData, setSeismicData] = useState(null);
  const [soilData, setSoilData] = useState(null);
  const [selectedDisasterDetail, setSelectedDisasterDetail] = useState(null);

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

  // 4. Ambil Data Faktual Gempa & Jalur Sesar BNPB / PuSGeN
  useEffect(() => {
    fetch('/data/jabar-earthquakes-bnpb.json')
      .then(res => res.json())
      .then(data => setSeismicData(data))
      .catch(err => console.error('Gagal mengambil data seismik BNPB:', err));
  }, []);

  // 5. Ambil Data Klasifikasi Jenis Tanah (27 Kab/Kota)
  useEffect(() => {
    fetch('/data/jabar-soil-classification.json')
      .then(res => res.json())
      .then(data => setSoilData(data))
      .catch(err => console.error('Gagal mengambil data jenis tanah:', err));
  }, []);

  // 6. Ambil Data Telemetri Real-time Stasiun Pantau Jabar (GitHub Machine)
  const [liveTelemetry, setLiveTelemetry] = useState(null);
  useEffect(() => {
    fetch('/data/live-telemetry.json')
      .then(res => res.json())
      .then(data => setLiveTelemetry(data))
      .catch(err => console.warn('Belum ada data live telemetry:', err));
  }, []);

  // Handle Initial Layer / Mode dari luar (Navbar/Hero)
  useEffect(() => {
    if (initialLayer === 'terkini') {
      setSelectedDate(todayDateStr);
      setSelectedHour(currentRealHour);
      setShowHimawari(true);
      setShowGempa(true);
      setShowSentinel2(true);
    } else if (['2021', '2022', '2023', '2024', '2025'].includes(initialLayer)) {
      setSelectedDate(`${initialLayer}-06-15`);
      setSelectedHour(12);
    } else if (initialLayer === 'slope') {
      setShowSlope(true);
    } else if (initialLayer === 'soil') {
      setShowSoilLayer(true);
    } else if (initialLayer === 'gempa') {
      setShowGempa(true);
      setShowFaults(true);
    } else if (initialLayer === 'radar' || initialLayer === 'himawari') {
      setShowHimawari(true);
    }
  }, [initialLayer]);

  // Handle Refresh Data Live (Termasuk Satelit Himawari-9 & Sensor Cuaca)
  const [isRefreshing, setIsRefreshing] = useState(false);
  const handleRefreshLive = () => {
    setIsRefreshing(true);
    setHimawariTimestamp(Date.now());
    fetch('/data/live-telemetry.json?t=' + Date.now())
      .then(res => res.json())
      .then(data => {
        setLiveTelemetry(data);
        setTimeout(() => setIsRefreshing(false), 500);
      })
      .catch(err => {
        console.warn('Gagal memuat telemetry:', err);
        setIsRefreshing(false);
      });
  };

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

  const getFeatureStyle = (feature) => {
    if (!showSoilLayer || !soilData?.wilayah) {
      return {
        color: '#38bdf8',
        weight: 1.8,
        opacity: 0.9,
        fillColor: '#0284c7',
        fillOpacity: 0.05
      };
    }
    const name = feature.properties?.shapeName || feature.properties?.NAME_2 || '';
    const soilInfo = Object.entries(soilData.wilayah).find(([k]) => 
      k.toLowerCase().includes(name.toLowerCase()) || name.toLowerCase().includes(k.toLowerCase().replace('kabupaten ', '').replace('kota ', ''))
    )?.[1];

    if (!soilInfo) return { color: '#64748b', weight: 1.5, opacity: 0.8, fillColor: '#334155', fillOpacity: 0.2 };

    let fillColor = '#0284c7';
    if (soilInfo.tingkat_rawan_tanah?.includes('Sangat Kritis')) fillColor = '#ef4444';
    else if (soilInfo.tingkat_rawan_tanah?.includes('Tinggi')) fillColor = '#f97316';
    else if (soilInfo.tingkat_rawan_tanah?.includes('Sedang')) fillColor = '#eab308';
    else if (soilInfo.tingkat_rawan_tanah?.includes('Rendah')) fillColor = '#06b6d4';

    return {
      color: '#ffffff',
      weight: 2,
      opacity: 0.9,
      fillColor: fillColor,
      fillOpacity: 0.38
    };
  };

  const onEachFeature = (feature, layer) => {
    const name = feature.properties?.shapeName || feature.properties?.NAME_2 || 'Wilayah Jawa Barat';
    
    // Cari data klasifikasi tanah yang sesuai
    const soilInfo = soilData?.wilayah ? Object.entries(soilData.wilayah).find(([k]) => 
      k.toLowerCase().includes(name.toLowerCase()) || name.toLowerCase().includes(k.toLowerCase().replace('kabupaten ', '').replace('kota ', ''))
    )?.[1] : null;

    layer.bindPopup(`
      <div style="font-family: inherit; line-height: 1.4; padding: 4px; max-width: 260px;">
        <strong style="color: #38bdf8; font-size: 0.95rem; display: block; margin-bottom: 2px;">
          ${name}
        </strong>
        <span style="font-size: 0.72rem; color: #94a3b8; display: block;">
          Provinsi Jawa Barat &bull; ADM2
        </span>
        
        ${soilInfo ? `
          <div style="margin-top: 8px; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 6px; font-size: 0.75rem;">
            <div style="color: #34d399; font-weight: 700; margin-bottom: 2px;">🌱 Klasifikasi Tanah:</div>
            <div style="color: #ffffff; font-weight: 600;">${soilInfo.tanah_dominan.join(', ')}</div>
            <div style="color: #94a3b8; font-size: 0.7rem; margin-top: 3px;">Zona: ${soilInfo.zona_fisiografi}</div>
            <div style="margin-top: 4px; padding: 3px 6px; border-radius: 4px; background: rgba(255,255,255,0.06); font-size: 0.7rem;">
              Kerawanan: <b style="color: #fca5a5;">${soilInfo.tingkat_rawan_tanah}</b>
            </div>
            <div style="color: #64748b; font-size: 0.68rem; margin-top: 4px; font-style: italic;">
              ${soilInfo.status}
            </div>
          </div>
        ` : ''}

        <div style="margin-top: 6px; font-size: 0.72rem; border-top: 1px solid rgba(255,255,255,0.06); padding-top: 4px; color: #cbd5e1;">
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

        {/* 6. Layer Satelit Cuaca & Radar Awan Hujan Himawari-9 (BMKG Resmi) */}
        {showHimawari && (
          <ImageOverlay
            key={`himawari-${himawariProduct}-${himawariTimestamp}`}
            url={`${HIMAWARI_PRODUCTS[himawariProduct].url}?t=${himawariTimestamp}`}
            bounds={HIMAWARI_BOUNDS}
            opacity={himawariOpacity}
            zIndex={350}
          />
        )}

        {/* 7. Layer Batas Administrasi & Klasifikasi Tanah 27 Kab/Kota */}
        {showBoundary && geoData && (
          <GeoJSON
            key={`jabar-boundary-${showSoilLayer ? 'soil' : 'plain'}`}
            data={geoData}
            style={getFeatureStyle}
            onEachFeature={onEachFeature}
          />
        )}

        {/* 8. Jalur Sesar Aktif Utama Jawa Barat (PuSGeN / Badan Geologi) */}
        {showFaults && seismicData?.sesarAktif?.map((sesar, idx) => (
          <Polyline
            key={`sesar-${idx}`}
            positions={sesar.jalur_koordinat}
            pathOptions={{
              color: '#f43f5e',
              weight: 4,
              dashArray: '8, 6',
              opacity: 0.95
            }}
          >
            <Tooltip sticky>
              <div className="font-sans text-xs">
                <strong className="text-rose-600 block text-sm">⚡ {sesar.nama}</strong>
                <span>Panjang: <b>{sesar.panjang_km} km</b> &bull; Laju: <b>{sesar.kecepatan_geser}</b></span>
              </div>
            </Tooltip>
            <Popup>
              <div className="p-1 font-sans text-xs space-y-1.5 text-zinc-900 max-w-xs">
                <div className="flex items-center gap-1.5 text-rose-600 font-bold text-sm">
                  <span>⚡ {sesar.nama}</span>
                </div>
                <div className="text-[11px] text-zinc-600 font-medium">{sesar.tipe}</div>
                <div className="border-y border-zinc-200 py-1.5 text-[11px] space-y-0.5">
                  <div>Panjang Jalur: <b>{sesar.panjang_km} km</b></div>
                  <div>Kecepatan Geser: <b>{sesar.kecepatan_geser}</b></div>
                  <div>Bentangan Wilayah: <b>{sesar.bentangan}</b></div>
                </div>
                <div className="text-[10px] text-zinc-500 italic">
                  Sumber: Pusat Studi Gempa Nasional (PuSGeN) & Badan Geologi ESDM
                </div>
              </div>
            </Popup>
          </Polyline>
        ))}

        {/* 9. Marker Gempa Merusak Historis (Faktual BNPB) */}
        {showHistoricalQuakes && seismicData?.historicalDisasters?.map((event) => {
          const eventYear = event.tanggal?.match(/\b(202\d)\b/)?.[1];
          const isMatchingYear = simMode === 'tahun' && eventYear === String(selectedYearNum);
          return (
            <Marker
              key={event.id}
              position={event.koordinat}
              icon={createHistoricalQuakeIcon(event.magnitudo, isMatchingYear)}
              eventHandlers={{
                click: () => setSelectedDisasterDetail(event)
              }}
            >
              <Tooltip direction="top" offset={[0, -10]} permanent={isMatchingYear}>
                <div className="font-sans text-xs">
                  <span className="font-bold text-rose-600 block">{event.nama} (M {event.magnitudo})</span>
                  {isMatchingYear && (
                    <span className="text-[10px] bg-rose-500/20 text-rose-300 px-1 py-0.5 rounded font-bold block mt-0.5">
                      ⚡ Gempa Besar Periode {eventYear}
                    </span>
                  )}
                  <span className="text-[10px] text-zinc-600">Klik untuk rincian kerusakan BNPB</span>
                </div>
              </Tooltip>
            </Marker>
          );
        })}

        {/* 10. Marker Gempa Bumi Terkini (BMKG Real-time) */}
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

        {/* 11. Stasiun Pantau Cuaca & Sensor Satelit (Aktif Real-time & Timeline 24 Jam) */}
        {(isLive || showHimawari) && liveTelemetry?.stasiun_cuaca_jabar && (
          Object.entries(liveTelemetry.stasiun_cuaca_jabar).map(([namaStasiun, dataStasiun], idx) => {
            const hourDelta = Math.abs(selectedHour - 14);
            const simTemp = Math.max(14, (dataStasiun.suhu_c - hourDelta * 0.3)).toFixed(1);
            return (
              <Marker
                key={`stasiun-${idx}`}
                position={[dataStasiun.lat, dataStasiun.lng]}
                icon={createWeatherStationIcon(namaStasiun, dataStasiun.status_hujan)}
              >
                <Popup>
                  <div className="p-1 font-sans text-xs space-y-1.5 text-zinc-900 max-w-xs">
                    <div className="flex items-center justify-between border-b border-zinc-200 pb-1">
                      <div className="flex items-center gap-1.5 text-emerald-600 font-bold">
                        <CloudRain className="w-4 h-4" />
                        <span>SENSOR CUACA JABAR</span>
                      </div>
                      <span className="font-mono text-[10px] bg-zinc-100 px-1.5 py-0.5 rounded text-zinc-700 font-bold">
                        {String(selectedHour).padStart(2, '0')}:00 WIB
                      </span>
                    </div>
                    <div className="font-bold text-sm text-zinc-900">{namaStasiun}</div>
                    <div className="grid grid-cols-2 gap-2 text-[11px] bg-zinc-50 p-2 rounded-xl border border-zinc-200">
                      <div>Suhu: <b className="text-zinc-900">{isLive ? dataStasiun.suhu_c : simTemp}°C</b></div>
                      <div>Kelembapan: <b>{dataStasiun.kelembapan_persen}%</b></div>
                      <div>Curah Hujan: <b className="text-blue-600">{dataStasiun.curah_hujan_mm} mm</b></div>
                      <div>Status: <b className={dataStasiun.status_hujan.includes('Lebat') ? 'text-rose-600' : 'text-emerald-600'}>{dataStasiun.status_hujan}</b></div>
                    </div>
                    <div className="text-[10px] text-zinc-500 italic flex items-center justify-between">
                      <span>Tanggal: {selectedDate}</span>
                      <span>{isLive ? '● Live BMKG' : 'Simulasi Jam'}</span>
                    </div>
                  </div>
                </Popup>
              </Marker>
            );
          })
        )}

        {/* 12. Marker GPS Posisi Pengguna */}
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

      {/* Floating Center Mode HUD (Terkini / Historis Switcher) */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[900] max-w-[92vw] flex items-center gap-2.5 px-4 py-2 rounded-2xl glass-panel-elevated border border-white/10 shadow-2xl backdrop-blur-xl animate-fade-in-up">
        {isLive ? (
          <>
            <div className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500"></span>
              </span>
              <span className="text-xs font-bold text-white tracking-wide uppercase whitespace-nowrap">
                Peta Terkini (Live)
              </span>
            </div>
            <div className="h-3.5 w-px bg-white/20 hidden md:block"></div>
            <div className="text-[11px] text-zinc-300 hidden md:flex items-center gap-2 font-mono whitespace-nowrap">
              <span className="text-emerald-400">● 7 Stasiun</span>
              <span>&bull;</span>
              <span className="text-sky-300">Himawari-9 ({HIMAWARI_PRODUCTS[himawariProduct].shortName})</span>
              <span>&bull;</span>
              <span className="text-zinc-400">{String(selectedHour).padStart(2, '0')}:00 WIB</span>
            </div>
            <button
              onClick={handleRefreshLive}
              disabled={isRefreshing}
              title="Segarkan data telemetri live"
              className="ml-1 p-1 px-2.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-[10px] font-semibold flex items-center gap-1 cursor-pointer transition-colors"
            >
              <RefreshCw className={`w-3 h-3 text-rose-400 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </>
        ) : (
          <>
            <div className="flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-xs font-semibold text-zinc-200 whitespace-nowrap">
                {simMode === 'hari' && (
                  <span>{formatIndonesianDateFull(selectedDate)} &bull; <b className="text-emerald-400 font-bold">{String(selectedHour).padStart(2, '0')}:00 WIB</b></span>
                )}
                {simMode === 'bulan' && (
                  <span>Simulasi Bulanan: <b className="text-emerald-400 font-bold">{formatIndonesianDateFull(selectedDate)}</b></span>
                )}
                {simMode === 'tahun' && (
                  <span>Simulasi Multi-Tahun: <b className="text-emerald-400 font-bold">Tahun {selectedYearNum}</b></span>
                )}
              </span>
              {playbackSpeed > 1 && (
                <span className="px-1.5 py-0.5 rounded-md bg-sky-400/20 text-sky-300 font-mono text-[10px] font-bold border border-sky-400/30">
                  {playbackSpeed}x
                </span>
              )}
            </div>
            <button
              onClick={() => {
                handleDateChange(todayDateStr);
                setSelectedHour(currentRealHour);
                setSimMode('hari');
                setShowHimawari(true);
                setShowGempa(true);
              }}
              className="ml-2 px-2.5 py-1 rounded-xl bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 text-white text-[10px] font-bold shadow-md shadow-rose-600/30 flex items-center gap-1.5 cursor-pointer transition-all border border-rose-400/30 whitespace-nowrap"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>
              <span>Kembali ke Waktu Live</span>
            </button>
          </>
        )}
      </div>

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
          {/* 1. Pemilih Kalender & Waktu Pengamatan (Tanggal, Bulan, Tahun) */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                <span>Simulasi Waktu & Kalender</span>
              </span>
              {isLive ? (
                <span className="flex items-center gap-1 text-[9px] font-bold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-full border border-rose-500/30 animate-pulse">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span> LIVE AKTIF
                </span>
              ) : (
                <span className="text-[9px] font-semibold text-zinc-400 bg-white/5 px-2 py-0.5 rounded-full border border-white/10">
                  ARSIP HISTORIS
                </span>
              )}
            </div>

            {/* Filter Mode Simulasi: Hari, Bulanan, Tahunan */}
            <div className="space-y-1">
              <span className="text-[9px] font-semibold uppercase tracking-wider text-zinc-400 block">
                Filter Mode Simulasi:
              </span>
              <div className="grid grid-cols-3 gap-1 p-1 rounded-xl bg-white/5 border border-white/10">
                <button
                  type="button"
                  onClick={() => { setSimMode('hari'); setIsPlaying(false); }}
                  className={`py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer text-center flex items-center justify-center gap-1 ${
                    simMode === 'hari'
                      ? 'bg-emerald-400 text-zinc-950 font-bold shadow-md shadow-emerald-400/20'
                      : 'text-zinc-400 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <Clock className="w-3 h-3" />
                  <span>24 Jam</span>
                </button>
                <button
                  type="button"
                  onClick={() => { setSimMode('bulan'); setIsPlaying(false); }}
                  className={`py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer text-center flex items-center justify-center gap-1 ${
                    simMode === 'bulan'
                      ? 'bg-emerald-400 text-zinc-950 font-bold shadow-md shadow-emerald-400/20'
                      : 'text-zinc-400 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <Calendar className="w-3 h-3" />
                  <span>Bulanan</span>
                </button>
                <button
                  type="button"
                  onClick={() => { setSimMode('tahun'); setIsPlaying(false); }}
                  className={`py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer text-center flex items-center justify-center gap-1 ${
                    simMode === 'tahun'
                      ? 'bg-emerald-400 text-zinc-950 font-bold shadow-md shadow-emerald-400/20'
                      : 'text-zinc-400 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <Sparkles className="w-3 h-3" />
                  <span>Tahunan</span>
                </button>
              </div>
              <div className="text-[10px] text-zinc-400 leading-tight pt-0.5">
                {simMode === 'hari' && '⚡ Simulasi diurnal jam per jam (00:00 - 23:00) & awan radar Himawari-9.'}
                {simMode === 'bulan' && `📅 Simulasi progres harian bulan ${getIndonesianMonthName(selectedMonthNum)} ${selectedYearNum}.`}
                {simMode === 'tahun' && '🛰️ Komparasi citra Sentinel-2 & bencana gempa tahunan (2021 – 2026).'}
              </div>
            </div>

            {/* Pengatur Kecepatan Simulasi (Percepat Playback Speed) */}
            <div className="space-y-1 pt-1 border-t border-white/5">
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-semibold uppercase tracking-wider text-sky-400 flex items-center gap-1">
                  <FastForward className="w-3 h-3 text-sky-400" />
                  <span>Kecepatan Putar (Speed):</span>
                </span>
                <span className="text-[10px] font-mono text-emerald-400 font-bold">{playbackSpeed}x</span>
              </div>
              <div className="grid grid-cols-4 gap-1 p-1 rounded-xl bg-white/5 border border-white/10">
                {[0.5, 1, 2, 4].map((spd) => (
                  <button
                    key={spd}
                    type="button"
                    onClick={() => setPlaybackSpeed(spd)}
                    className={`py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer text-center ${
                      playbackSpeed === spd
                        ? 'bg-sky-400 text-zinc-950 font-bold shadow-md shadow-sky-400/20'
                        : 'text-zinc-400 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    {spd}x
                  </button>
                ))}
              </div>
            </div>

            {/* Input Kalender Tanggal (Bisa Pilih Tanggal, Bulan, Tahun) */}
            <div className="space-y-1 pt-1 border-t border-white/5">
              <label className="text-[10px] text-zinc-400 block font-medium">
                Pilih Tanggal Kalender (2021 – 2026):
              </label>
              <input
                type="date"
                value={selectedDate}
                min="2021-01-01"
                max={todayDateStr}
                onChange={(e) => handleDateChange(e.target.value)}
                className="w-full bg-white/[0.06] hover:bg-white/[0.1] focus:bg-zinc-900 border border-white/15 focus:border-emerald-400 rounded-xl px-3 py-2 text-xs text-white font-medium outline-none transition-all cursor-pointer shadow-inner [color-scheme:dark]"
              />
            </div>

            {/* Tombol Opsi Cepat: Live vs Kemarin */}
            <div className="grid grid-cols-2 gap-1.5 pt-0.5">
              <button
                type="button"
                onClick={() => {
                  handleDateChange(todayDateStr);
                  setSelectedHour(currentRealHour);
                  setShowHimawari(true);
                  setShowGempa(true);
                }}
                className={`py-1.5 px-2 rounded-xl text-[10px] font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer border ${
                  isLive
                    ? 'bg-gradient-to-r from-rose-600 to-rose-500 text-white border-rose-400 shadow-md shadow-rose-600/30'
                    : 'bg-white/5 hover:bg-white/10 text-zinc-300 border-white/10'
                }`}
              >
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-rose-500"></span>
                </span>
                <span>Hari Ini (Live)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  const d = new Date(now);
                  d.setDate(d.getDate() - 1);
                  handleDateChange(d.toISOString().split('T')[0]);
                }}
                className={`py-1.5 px-2 rounded-xl text-[10px] font-medium transition-all cursor-pointer border flex items-center justify-center gap-1 ${
                  selectedDate === new Date(Date.now() - 86400000).toISOString().split('T')[0]
                    ? 'bg-emerald-400 text-zinc-950 font-bold border-emerald-300'
                    : 'bg-white/5 hover:bg-white/10 text-zinc-300 border-white/10'
                }`}
              >
                <RotateCcw className="w-3 h-3" />
                <span>Kemarin</span>
              </button>
            </div>

            {/* Pintas Tahun Cepat (2021-2026) */}
            <div>
              <span className="text-[9px] font-semibold uppercase tracking-wider text-zinc-500 block mb-1">
                Lompat ke Tahun:
              </span>
              <div className="grid grid-cols-6 gap-1 p-1 rounded-xl bg-white/5 border border-white/10">
                {['2021', '2022', '2023', '2024', '2025', '2026'].map((yr) => (
                  <button
                    key={yr}
                    onClick={() => {
                      if (yr === '2026') handleDateChange(todayDateStr);
                      else handleDateChange(`${yr}-06-15`);
                    }}
                    className={`py-1 text-[11px] font-semibold rounded-lg transition-all cursor-pointer ${
                      String(selectedYearNum) === yr
                        ? 'bg-emerald-400 text-zinc-950 shadow-md shadow-emerald-400/20 font-bold'
                        : 'text-zinc-400 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    {yr === '2026' ? 'Live' : yr}
                  </button>
                ))}
              </div>
            </div>

            {/* Informasi Waktu & Tanggal Aktif Terpilih */}
            <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/5 text-[11px] text-zinc-300 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-zinc-400 text-[10px]">Tanggal:</span>
                <b className="text-white font-semibold">{formatIndonesianDateFull(selectedDate)}</b>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-400 text-[10px]">Jam Pengamatan:</span>
                <b className="text-emerald-400 font-mono font-bold">{String(selectedHour).padStart(2, '0')}:00 WIB</b>
              </div>
              <div className="flex items-center justify-between text-[10px] text-zinc-400 pt-1 border-t border-white/5">
                <span>Mode Simulasi:</span>
                <span className="text-emerald-300 font-semibold uppercase">
                  {simMode === 'hari' ? '24 Jam' : simMode === 'bulan' ? 'Bulanan' : 'Tahunan'} ({playbackSpeed}x)
                </span>
              </div>
              <div className="flex items-center justify-between text-[10px] text-zinc-400">
                <span>Status Data:</span>
                <span className={isLive ? 'text-rose-400 font-bold' : 'text-zinc-300'}>
                  {isLive ? '🔴 Real-Time Live' : `📅 Satelit Historis (${dateYear})`}
                </span>
              </div>
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

          {/* 3. Section Khusus: Zona Seismik & Gempa Faktual BNPB */}
          <div className="space-y-2 pt-2 border-t border-white/10">
            <span className="text-[10px] font-bold uppercase tracking-wider text-rose-400 block mb-1">
              Data Seismik & Gempa (BNPB & PuSGeN)
            </span>

            {/* Jalur Sesar Aktif (PuSGeN) */}
            <div className="p-3 rounded-2xl bg-rose-950/20 border border-rose-500/20 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-0.5 bg-rose-500 shadow-sm shadow-rose-500"></span>
                <div>
                  <span className="text-xs font-semibold text-white block">Jalur Sesar Aktif Utama</span>
                  <span className="text-[10px] text-zinc-400">Lembang, Cimandiri, Garsela, Baribis</span>
                </div>
              </div>
              <input
                type="checkbox"
                checked={showFaults}
                onChange={(e) => setShowFaults(e.target.checked)}
                className="accent-rose-500 w-4 h-4 cursor-pointer"
              />
            </div>

            {/* Gempa Merusak Historis (BNPB) */}
            <div className="p-3 rounded-2xl bg-rose-950/20 border border-rose-500/20 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                <div>
                  <span className="text-xs font-semibold text-white block">Gempa Merusak BNPB (2020–2024)</span>
                  <span className="text-[10px] text-zinc-400">Cianjur, Sumedang, Bandung, Sukabumi</span>
                </div>
              </div>
              <input
                type="checkbox"
                checked={showHistoricalQuakes}
                onChange={(e) => setShowHistoricalQuakes(e.target.checked)}
                className="accent-rose-500 w-4 h-4 cursor-pointer"
              />
            </div>

            {/* Gempa Real-time BMKG */}
            <div className="p-3 rounded-2xl bg-rose-950/20 border border-rose-500/20 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping"></span>
                <div>
                  <span className="text-xs font-semibold text-white block">Titik Gempa Real-time BMKG</span>
                  <span className="text-[10px] text-zinc-400">Pembaruan Langsung Sensor TEWS</span>
                </div>
              </div>
              <input
                type="checkbox"
                checked={showGempa}
                onChange={(e) => setShowGempa(e.target.checked)}
                className="accent-rose-500 w-4 h-4 cursor-pointer"
              />
            </div>
          </div>

          {/* 4. Daftar Layer Penginderaan Jauh Permanen */}
          <div className="space-y-2 pt-2 border-t border-white/10">
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block mb-1">
              Layer Satelit & Terrain (Permanen)
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

            {/* Satelit Cuaca Himawari-9 BMKG (Awan & Potensi Hujan) */}
            <div className="p-3 rounded-2xl bg-sky-950/20 border border-sky-500/20 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-sky-400 shadow-sm shadow-sky-400 animate-pulse"></span>
                  <div>
                    <span className="text-xs font-semibold text-white block">Satelit Cuaca Himawari-9</span>
                    <span className="text-[10px] text-sky-300">BMKG Remote Sensing &bull; Geostasioner</span>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={showHimawari}
                  onChange={(e) => setShowHimawari(e.target.checked)}
                  className="accent-sky-400 w-4 h-4 cursor-pointer"
                />
              </div>

              {showHimawari && (
                <div className="space-y-2 pt-1.5 border-t border-white/5">
                  {/* Selector Kanal / Produk Himawari-9 */}
                  <div>
                    <span className="text-[9px] font-bold uppercase tracking-wider text-zinc-400 block mb-1">
                      Kanal / Produk Satelit:
                    </span>
                    <div className="grid grid-cols-3 gap-1">
                      {Object.values(HIMAWARI_PRODUCTS).map((prod) => (
                        <button
                          key={prod.id}
                          onClick={() => setHimawariProduct(prod.id)}
                          className={`py-1 px-1 rounded-lg text-[10px] font-semibold transition-all cursor-pointer truncate ${
                            himawariProduct === prod.id
                              ? 'bg-sky-500 text-white shadow-sm shadow-sky-500/30'
                              : 'bg-white/5 text-zinc-400 hover:text-white hover:bg-white/10'
                          }`}
                          title={prod.name}
                        >
                          {prod.shortName}
                        </button>
                      ))}
                    </div>
                    <p className="text-[10px] text-zinc-400 mt-1.5 italic leading-tight">
                      {HIMAWARI_PRODUCTS[himawariProduct].desc}
                    </p>
                  </div>

                  {/* Opasitas Himawari */}
                  <div className="flex items-center justify-between text-[10px] text-zinc-400 pt-1">
                    <span>Opasitas</span>
                    <input
                      type="range"
                      min="0.1"
                      max="1"
                      step="0.05"
                      value={himawariOpacity}
                      onChange={(e) => setHimawariOpacity(parseFloat(e.target.value))}
                      className="w-28 accent-sky-400 cursor-pointer"
                    />
                    <span className="font-mono">{Math.round(himawariOpacity * 100)}%</span>
                  </div>
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

            {/* Klasifikasi Jenis Tanah (27 Kab/Kota) */}
            <div className="p-3 rounded-2xl bg-emerald-950/20 border border-emerald-500/20 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
                <div>
                  <span className="text-xs font-semibold text-white block">Zona Klasifikasi Tanah</span>
                  <span className="text-[10px] text-zinc-400">Andosol, Latosol, Aluvial, Grumusol</span>
                </div>
              </div>
              <input
                type="checkbox"
                checked={showSoilLayer}
                onChange={(e) => setShowSoilLayer(e.target.checked)}
                className="accent-emerald-400 w-4 h-4 cursor-pointer"
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

      {/* 13. Floating Multi-Mode Timeline Bar at Bottom of Screen (Dasar Layar) */}
      {showTimeline && (
        <div 
          className={`absolute bottom-4 left-1/2 -translate-x-1/2 z-[900] w-[96vw] sm:w-[92vw] md:max-w-3xl lg:max-w-4xl transition-all duration-300 ${
            isSidebarOpen ? 'lg:left-[calc(50%+140px)]' : 'lg:left-1/2'
          }`}
        >
          <div className="glass-panel-elevated rounded-2xl border border-white/15 p-3 sm:p-4 shadow-2xl backdrop-blur-2xl text-white space-y-2.5">
            {/* Top Bar: Playback Controls, Speed Selector, Simulation Mode, and Status Badges */}
            <div className="flex items-center justify-between gap-2 flex-wrap">
              {/* Left Controls: Step Back, Play/Pause, Step Forward & Speed Multipliers */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <div className="flex items-center gap-1 bg-white/5 p-1 rounded-xl border border-white/10">
                  <button
                    type="button"
                    onClick={handleStepBack}
                    disabled={!canStepBack}
                    className="p-1.5 rounded-lg hover:bg-white/15 text-zinc-300 hover:text-white disabled:opacity-30 disabled:hover:bg-transparent transition-all cursor-pointer"
                    title={simMode === 'hari' ? "Mundur 1 Jam" : simMode === 'bulan' ? "Mundur 1 Hari" : "Mundur 1 Tahun"}
                  >
                    <SkipBack className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsPlaying(!isPlaying)}
                    className="px-3 py-1 rounded-lg bg-emerald-400 hover:bg-emerald-300 active:scale-95 text-zinc-950 font-bold text-xs flex items-center gap-1.5 shadow-md shadow-emerald-400/20 transition-all cursor-pointer"
                    title={isPlaying ? "Jeda Simulasi" : "Putar Simulasi Otomatis"}
                  >
                    {isPlaying ? (
                      <>
                        <Pause className="w-3.5 h-3.5 fill-current" />
                        <span>Jeda</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>Putar</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={handleStepForward}
                    disabled={!canStepForward}
                    className="p-1.5 rounded-lg hover:bg-white/15 text-zinc-300 hover:text-white disabled:opacity-30 disabled:hover:bg-transparent transition-all cursor-pointer"
                    title={simMode === 'hari' ? "Maju 1 Jam" : simMode === 'bulan' ? "Maju 1 Hari" : "Maju 1 Tahun"}
                  >
                    <SkipForward className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Inline Speed Selector Pill (Fitur Percepat) */}
                <div className="flex items-center bg-white/5 p-0.5 rounded-xl border border-white/10 text-[10px] font-bold">
                  <span className="px-1.5 text-zinc-400 flex items-center gap-1" title="Pilihan Kecepatan Simulasi">
                    <FastForward className="w-3 h-3 text-sky-400" />
                    <span className="hidden sm:inline">Speed:</span>
                  </span>
                  {[0.5, 1, 2, 4].map((spd) => (
                    <button
                      key={spd}
                      type="button"
                      onClick={() => setPlaybackSpeed(spd)}
                      className={`px-1.5 sm:px-2 py-0.5 rounded-lg transition-all cursor-pointer ${
                        playbackSpeed === spd
                          ? 'bg-sky-400 text-zinc-950 font-black shadow-sm shadow-sky-400/30'
                          : 'text-zinc-400 hover:text-white hover:bg-white/10'
                      }`}
                    >
                      {spd}x
                    </button>
                  ))}
                </div>
              </div>

              {/* Mode Simulasi Switcher: 24 Jam / Bulanan / Tahunan */}
              <div className="flex items-center bg-white/5 p-0.5 sm:p-1 rounded-xl border border-white/10 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setSimMode('hari');
                    setIsPlaying(false);
                  }}
                  className={`px-2 sm:px-2.5 py-1 rounded-lg font-medium transition-all cursor-pointer flex items-center gap-1 text-[11px] ${
                    simMode === 'hari'
                      ? 'bg-emerald-400 text-zinc-950 font-bold shadow-sm shadow-emerald-400/20'
                      : 'text-zinc-400 hover:text-white hover:bg-white/10'
                  }`}
                  title="Simulasi Jam (Rentang 24 Jam)"
                >
                  <Clock className="w-3 h-3" />
                  <span>24 Jam</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setSimMode('bulan');
                    setIsPlaying(false);
                  }}
                  className={`px-2 sm:px-2.5 py-1 rounded-lg font-medium transition-all cursor-pointer flex items-center gap-1 text-[11px] ${
                    simMode === 'bulan'
                      ? 'bg-emerald-400 text-zinc-950 font-bold shadow-sm shadow-emerald-400/20'
                      : 'text-zinc-400 hover:text-white hover:bg-white/10'
                  }`}
                  title="Simulasi Harian dalam Sebulan"
                >
                  <Calendar className="w-3 h-3" />
                  <span>Bulanan</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setSimMode('tahun');
                    setIsPlaying(false);
                  }}
                  className={`px-2 sm:px-2.5 py-1 rounded-lg font-medium transition-all cursor-pointer flex items-center gap-1 text-[11px] ${
                    simMode === 'tahun'
                      ? 'bg-emerald-400 text-zinc-950 font-bold shadow-sm shadow-emerald-400/20'
                      : 'text-zinc-400 hover:text-white hover:bg-white/10'
                  }`}
                  title="Simulasi Tahunan (2021 – 2026)"
                >
                  <Sparkles className="w-3 h-3" />
                  <span>Tahunan</span>
                </button>
              </div>

              {/* Time Badge & Live Status */}
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white/[0.06] border border-white/10 text-xs shadow-inner">
                  {simMode === 'hari' && (
                    <>
                      <Clock className="w-3.5 h-3.5 text-sky-400" />
                      <span className="font-mono font-bold text-sm text-white tracking-wider">
                        {String(selectedHour).padStart(2, '0')}:00
                      </span>
                      <span className="text-[10px] text-zinc-400">WIB</span>
                    </>
                  )}
                  {simMode === 'bulan' && (
                    <>
                      <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="font-semibold text-xs text-white">
                        {selectedDayNum} {getIndonesianMonthName(selectedMonthNum)} {selectedYearNum}
                      </span>
                    </>
                  )}
                  {simMode === 'tahun' && (
                    <>
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                      <span className="font-bold text-sm text-white">
                        {selectedYearNum === 2026 ? '2026 (Live)' : `Tahun ${selectedYearNum}`}
                      </span>
                    </>
                  )}
                </div>

                {isLive ? (
                  <span className="px-2.5 py-1 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[10px] font-bold flex items-center gap-1.5 animate-pulse shadow-sm shadow-rose-500/20 whitespace-nowrap">
                    <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                    <span>LIVE</span>
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      handleDateChange(todayDateStr);
                      setSelectedHour(currentRealHour);
                      setShowHimawari(true);
                      setShowGempa(true);
                    }}
                    className="px-2.5 py-1 rounded-full bg-white/5 hover:bg-white/15 text-zinc-300 hover:text-white border border-white/10 text-[10px] font-medium transition-colors cursor-pointer flex items-center gap-1 whitespace-nowrap"
                  >
                    <RotateCcw className="w-2.5 h-2.5 text-emerald-400" />
                    <span>Ke Waktu Live</span>
                  </button>
                )}
              </div>
            </div>

            {/* Dynamic Slider Bar based on simMode */}
            <div className="space-y-1">
              <div className="relative flex items-center">
                {/* 1. Mode Hari (00:00 s.d. maxAvailableHour) */}
                {simMode === 'hari' && (
                  <input
                    type="range"
                    min={0}
                    max={maxAvailableHour}
                    step={1}
                    value={selectedHour}
                    onChange={(e) => {
                      setSelectedHour(parseInt(e.target.value, 10));
                      setIsPlaying(false);
                    }}
                    className="w-full accent-emerald-400 cursor-pointer h-2 bg-white/10 rounded-lg appearance-none transition-all"
                  />
                )}

                {/* 2. Mode Bulan (1 s.d. maxAvailableDay) */}
                {simMode === 'bulan' && (
                  <input
                    type="range"
                    min={1}
                    max={maxAvailableDay}
                    step={1}
                    value={selectedDayNum}
                    onChange={(e) => {
                      const dVal = parseInt(e.target.value, 10);
                      setSelectedDate(`${selectedYearNum}-${String(selectedMonthNum).padStart(2, '0')}-${String(dVal).padStart(2, '0')}`);
                      setIsPlaying(false);
                    }}
                    className="w-full accent-emerald-400 cursor-pointer h-2 bg-white/10 rounded-lg appearance-none transition-all"
                  />
                )}

                {/* 3. Mode Tahun (2021 s.d. 2026) */}
                {simMode === 'tahun' && (
                  <input
                    type="range"
                    min={2021}
                    max={2026}
                    step={1}
                    value={selectedYearNum}
                    onChange={(e) => {
                      const yVal = parseInt(e.target.value, 10);
                      if (yVal === 2026) handleDateChange(todayDateStr);
                      else handleDateChange(`${yVal}-06-15`);
                      setIsPlaying(false);
                    }}
                    className="w-full accent-emerald-400 cursor-pointer h-2 bg-white/10 rounded-lg appearance-none transition-all"
                  />
                )}
              </div>

              {/* Ticks Along Bottom of Track */}
              {simMode === 'hari' && (
                <div className="flex justify-between items-center text-[9px] text-zinc-400 font-mono px-0.5 pt-0.5 select-none">
                  <button 
                    type="button"
                    onClick={() => setSelectedHour(0)} 
                    className={`hover:text-white cursor-pointer ${selectedHour === 0 ? 'text-emerald-400 font-bold' : ''}`}
                  >
                    00:00
                  </button>
                  <button 
                    type="button"
                    onClick={() => setSelectedHour(Math.min(4, maxAvailableHour))} 
                    className={`hover:text-white cursor-pointer ${selectedHour === 4 ? 'text-emerald-400 font-bold' : ''}`}
                  >
                    04:00
                  </button>
                  <button 
                    type="button"
                    onClick={() => setSelectedHour(Math.min(8, maxAvailableHour))} 
                    className={`hover:text-white cursor-pointer ${selectedHour === 8 ? 'text-emerald-400 font-bold' : ''}`}
                  >
                    08:00
                  </button>
                  <button 
                    type="button"
                    onClick={() => setSelectedHour(Math.min(12, maxAvailableHour))} 
                    className={`hover:text-white cursor-pointer ${selectedHour === 12 ? 'text-emerald-400 font-bold' : ''}`}
                  >
                    12:00
                  </button>
                  <button 
                    type="button"
                    onClick={() => setSelectedHour(Math.min(16, maxAvailableHour))} 
                    className={`hover:text-white cursor-pointer ${selectedHour === 16 ? 'text-emerald-400 font-bold' : ''}`}
                  >
                    16:00
                  </button>
                  <button 
                    type="button"
                    onClick={() => setSelectedHour(Math.min(20, maxAvailableHour))} 
                    className={`hover:text-white cursor-pointer ${selectedHour === 20 ? 'text-emerald-400 font-bold' : ''}`}
                  >
                    20:00
                  </button>
                  <button 
                    type="button"
                    onClick={() => setSelectedHour(maxAvailableHour)} 
                    className={`hover:text-white cursor-pointer ${selectedHour === maxAvailableHour ? (isToday ? 'text-rose-400 font-bold' : 'text-emerald-400 font-bold') : ''}`}
                  >
                    {isToday ? `Maks (${String(currentRealHour).padStart(2, '0')}:00)` : '23:00'}
                  </button>
                </div>
              )}

              {simMode === 'bulan' && (
                <div className="flex justify-between items-center text-[9px] text-zinc-400 font-mono px-0.5 pt-0.5 select-none">
                  {[1, 5, 10, 15, 20, 25, maxAvailableDay].map((d) => (
                    <button
                      key={`tick-day-${d}`}
                      type="button"
                      onClick={() => {
                        const targetD = Math.min(d, maxAvailableDay);
                        setSelectedDate(`${selectedYearNum}-${String(selectedMonthNum).padStart(2, '0')}-${String(targetD).padStart(2, '0')}`);
                      }}
                      className={`hover:text-white cursor-pointer ${
                        selectedDayNum === d ? 'text-emerald-400 font-bold' : ''
                      }`}
                    >
                      {d === maxAvailableDay && isCurrentMonth ? `Tgl ${d} (Hari Ini)` : `Tgl ${d}`}
                    </button>
                  ))}
                </div>
              )}

              {simMode === 'tahun' && (
                <div className="flex justify-between items-center text-[9px] text-zinc-400 font-mono px-0.5 pt-0.5 select-none">
                  {[2021, 2022, 2023, 2024, 2025, 2026].map((yr) => (
                    <button
                      key={`tick-year-${yr}`}
                      type="button"
                      onClick={() => {
                        if (yr === 2026) handleDateChange(todayDateStr);
                        else handleDateChange(`${yr}-06-15`);
                      }}
                      className={`hover:text-white cursor-pointer ${
                        selectedYearNum === yr
                          ? yr === 2026 ? 'text-rose-400 font-bold' : 'text-emerald-400 font-bold'
                          : ''
                      }`}
                    >
                      {yr === 2026 ? '2026 (Live)' : yr}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Floating Bottom-Right Legend (Dinaikkan agar tidak tumpang tindih dengan timeline) */}
      <div className="absolute bottom-28 right-6 z-[890] p-4 rounded-2xl glass-panel-elevated border border-white/10 text-left max-w-xs text-xs shadow-2xl hidden xl:block">
        <div className="font-semibold text-white mb-2 flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
          <span>Legenda Seismik & Satelit Jabar</span>
        </div>
        <div className="space-y-1.5 text-[11px] text-zinc-300">
          <div className="flex items-center gap-2">
            <span className="w-4 h-0.5 border-t-2 border-dashed border-rose-500"></span>
            <span>Garis Merah Putus: Jalur Sesar Aktif (PuSGeN)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-1.5 py-0.2 rounded-full bg-rose-600 text-white font-bold text-[9px]">M 5.6</span>
            <span>Pin Angka: Gempa Merusak (BNPB)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded bg-emerald-400"></span>
            <span>Sentinel-2: Citra Optik Alami</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded bg-amber-500"></span>
            <span>Hillshade: Morfologi Lereng 3D</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded bg-sky-400"></span>
            <span>Himawari-9: Awan Konvektif & Hujan (BMKG)</span>
          </div>
        </div>
      </div>

      {/* Modal Detail Kerusakan Gempa BNPB (Faktual) */}
      {selectedDisasterDetail && (
        <div className="fixed inset-0 z-[1200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in-up text-left">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl glass-panel-elevated border border-rose-500/30 p-6 sm:p-8 shadow-2xl text-white">
            <div className="flex items-start justify-between border-b border-white/10 pb-4 mb-4">
              <div>
                <div className="flex items-center gap-2 text-rose-400 text-xs font-semibold mb-1">
                  <ShieldAlert className="w-4 h-4" />
                  <span>DATA RESMI KERUSAKAN & DAMPAK BENCANA BNPB</span>
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                  {selectedDisasterDetail.nama}
                </h3>
                <div className="text-xs text-zinc-400 mt-1 flex flex-wrap gap-2">
                  <span>📅 {selectedDisasterDetail.tanggal}</span>
                  <span>&bull;</span>
                  <span>📍 {selectedDisasterDetail.wilayah}</span>
                </div>
              </div>
              <button
                onClick={() => setSelectedDisasterDetail(null)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-zinc-300 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Parameter Seismik */}
            <div className="grid grid-cols-3 gap-3 p-3 rounded-2xl bg-white/[0.03] border border-white/10 mb-4 text-center">
              <div>
                <span className="text-[10px] text-zinc-400 uppercase tracking-wider block">Magnitudo</span>
                <span className="text-xl font-black text-rose-500">M {selectedDisasterDetail.magnitudo}</span>
              </div>
              <div>
                <span className="text-[10px] text-zinc-400 uppercase tracking-wider block">Kedalaman</span>
                <span className="text-xl font-bold text-white">{selectedDisasterDetail.kedalaman_km} km</span>
              </div>
              <div>
                <span className="text-[10px] text-zinc-400 uppercase tracking-wider block">Sesar Pemicu</span>
                <span className="text-xs font-bold text-amber-300 block mt-1">{selectedDisasterDetail.sesar_pemicu}</span>
              </div>
            </div>

            {/* Statistik Dampak Korban Jiwa & Pengungsi */}
            <div className="mb-4">
              <span className="text-xs font-bold text-zinc-300 uppercase tracking-wider block mb-2 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-emerald-400" />
                <span>Dampak Korban Jiwa (Laporan BNPB)</span>
              </span>
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-center">
                  <div className="text-xs text-rose-300">Meninggal Dunia</div>
                  <div className="text-2xl font-black text-rose-400">{selectedDisasterDetail.dampak.meninggal.toLocaleString('id-ID')}</div>
                  <div className="text-[10px] text-zinc-400">Jiwa</div>
                </div>
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-center">
                  <div className="text-xs text-amber-300">Luka-luka</div>
                  <div className="text-2xl font-black text-amber-400">{selectedDisasterDetail.dampak.luka_luka.toLocaleString('id-ID')}</div>
                  <div className="text-[10px] text-zinc-400">Jiwa</div>
                </div>
                <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-center">
                  <div className="text-xs text-blue-300">Mengungsi</div>
                  <div className="text-2xl font-black text-blue-400">{selectedDisasterDetail.dampak.mengungsi.toLocaleString('id-ID')}</div>
                  <div className="text-[10px] text-zinc-400">Jiwa</div>
                </div>
              </div>
            </div>

            {/* Statistik Kerusakan Rumah & Fasilitas Fisik */}
            <div className="mb-4">
              <span className="text-xs font-bold text-zinc-300 uppercase tracking-wider block mb-2 flex items-center gap-1.5">
                <Home className="w-3.5 h-3.5 text-blue-400" />
                <span>Rincian Kerusakan Rumah & Fasilitas Umum</span>
              </span>
              <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-3">
                <div className="flex items-center justify-between border-b border-white/5 pb-2">
                  <span className="text-xs text-zinc-300">Total Kerusakan Rumah</span>
                  <span className="text-sm font-bold text-white">{selectedDisasterDetail.dampak.total_rumah_rusak.toLocaleString('id-ID')} Unit</span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="p-2 rounded-lg bg-white/5">
                    <span className="text-[10px] text-rose-400 block">Rusak Berat</span>
                    <span className="font-bold">{selectedDisasterDetail.dampak.rumah_rusak_berat.toLocaleString('id-ID')}</span>
                  </div>
                  <div className="p-2 rounded-lg bg-white/5">
                    <span className="text-[10px] text-amber-400 block">Rusak Sedang</span>
                    <span className="font-bold">{selectedDisasterDetail.dampak.rumah_rusak_sedang.toLocaleString('id-ID')}</span>
                  </div>
                  <div className="p-2 rounded-lg bg-white/5">
                    <span className="text-[10px] text-emerald-400 block">Rusak Ringan</span>
                    <span className="font-bold">{selectedDisasterDetail.dampak.rumah_rusak_ringan.toLocaleString('id-ID')}</span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-white/5 text-[11px] text-zinc-400">
                  <div>Sekolah: <b className="text-white">{selectedDisasterDetail.dampak.fasilitas_pendidikan}</b> unit</div>
                  <div>Tempat Ibadah: <b className="text-white">{selectedDisasterDetail.dampak.tempat_ibadah}</b> unit</div>
                  <div>Faskes: <b className="text-white">{selectedDisasterDetail.dampak.fasilitas_kesehatan}</b> unit</div>
                </div>
              </div>
            </div>

            {/* Korelasi Tanah Longsor */}
            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-200 mb-4">
              <strong className="block mb-1 flex items-center gap-1.5 text-amber-300 font-bold">
                <Mountain className="w-3.5 h-3.5" /> Korelasi Dampak Tanah Longsor:
              </strong>
              <span>{selectedDisasterDetail.korelasi_longsor}</span>
            </div>

            <div className="flex items-center justify-between text-[11px] text-zinc-400 pt-2 border-t border-white/10">
              <span className="flex items-center gap-1">
                <Info className="w-3.5 h-3.5 text-emerald-400" /> Sumber: BNPB & Pusat Studi Gempa Nasional
              </span>
              <button
                onClick={() => setSelectedDisasterDetail(null)}
                className="px-5 py-2 rounded-full bg-white text-zinc-950 font-bold text-xs hover:bg-zinc-200 transition-colors cursor-pointer"
              >
                Tutup Rincian
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
