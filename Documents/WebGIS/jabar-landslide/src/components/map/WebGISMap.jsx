import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, GeoJSON, Marker, Popup, Polyline, Tooltip, ImageOverlay, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { 
  Layers, Mountain, Satellite, Radio, CloudRain, MapPin, 
  Navigation, Eye, EyeOff, Sliders, ChevronDown, ChevronUp, Sparkles,
  PanelLeftClose, PanelLeftOpen, Activity, AlertTriangle, ShieldAlert,
  Flame, Home, Users, Building2, Info, X, RefreshCw,
  Calendar, Clock, Play, Pause, SkipBack, SkipForward, RotateCcw, History, FastForward,
  Hospital, HeartPulse, Compass, ExternalLink, Route, PhoneCall, Building
} from 'lucide-react';
import { 
  calculateDistanceKm, 
  estimateDrivingMinutes, 
  getGoogleMapsNavigationUrl, 
  getGoogleMapsSearchUrl, 
  findNearestFacilities 
} from '../../services/emergencyService';

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
  const isSevere = rainStatus && (rainStatus.includes('Lebat') || rainStatus.includes('Awas') || rainStatus.includes('Siaga'));
  const isRain = rainStatus && rainStatus.includes('Hujan');
  const borderColor = isSevere ? '#ef4444' : isRain ? '#38bdf8' : '#34d399';
  const dotColor = isSevere ? '#ef4444' : isRain ? '#38bdf8' : '#34d399';
  return new L.DivIcon({
    className: 'custom-weather-station-marker',
    html: `
      <div style="display: flex; align-items: center; gap: 4px; background: rgba(15, 23, 42, 0.95); border: 1.5px solid ${borderColor}; padding: 3px 8px; border-radius: 9999px; box-shadow: 0 4px 12px ${isSevere ? 'rgba(239, 68, 68, 0.6)' : 'rgba(0, 0, 0, 0.5)'}; white-space: nowrap; cursor: pointer; ${isSevere ? 'animation: pulse 1.5s infinite;' : ''}">
        <span style="width: 7px; height: 7px; border-radius: 50%; background: ${dotColor}; box-shadow: 0 0 6px ${dotColor};"></span>
        <span style="color: #ffffff; font-size: 10px; font-weight: 700; font-family: sans-serif;">${stationName.split(' ')[0]}</span>
      </div>
    `,
    iconSize: [85, 24],
    iconAnchor: [42, 12],
  });
};

// Custom Icon untuk Fasilitas Darurat (BPBD, SAR, Puskesmas / RS Rujukan)
const createEmergencyFacilityIcon = (type, name) => {
  let borderColor = '#10b981';
  let iconEmoji = '🏥';
  let shortLabel = name.includes('RSUD') ? 'RSUD' : 'Pusk';

  if (type === 'bpbd') {
    borderColor = '#f59e0b';
    iconEmoji = '🏢';
    shortLabel = 'BPBD';
  } else if (type === 'sar') {
    borderColor = '#0ea5e9';
    iconEmoji = '🚨';
    shortLabel = 'SAR';
  }

  return new L.DivIcon({
    className: 'custom-emergency-marker',
    html: `
      <div style="display: flex; align-items: center; gap: 4px; background: rgba(15, 23, 42, 0.95); border: 1.5px solid ${borderColor}; padding: 2.5px 7px; border-radius: 9999px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.6); white-space: nowrap; cursor: pointer; transition: transform 0.2s;">
        <span style="font-size: 11px;">${iconEmoji}</span>
        <span style="color: #ffffff; font-size: 10px; font-weight: 700; font-family: sans-serif;">${shortLabel}</span>
      </div>
    `,
    iconSize: [75, 24],
    iconAnchor: [37, 12],
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

  // State Filter Mode Simulasi: 'hari' (24 Jam) | 'pekan' (Skala 7 Hari) | 'bulan' (Harian dlm Bulan) | 'tahun' (2021-2026)
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

  // Mode Tahunan: index bulan dari Jan 2021 (0) s.d. bulan berjalan (maxMonthIndex)
  const maxMonthIndex = (currentRealYear - 2021) * 12 + (currentRealMonth - 1);
  const selectedMonthIndex = Math.min(maxMonthIndex, Math.max(0, (selectedYearNum - 2021) * 12 + (selectedMonthNum - 1)));

  // Mode Pekan: 7 hari terakhir (H-6 s.d. H-0 / Hari Ini), 2 slot per hari (08:00 Pagi, 20:00 Malam) = total 14 slot
  const diffDaysFromToday = Math.round((new Date(selectedDate) - new Date(todayDateStr)) / 86400000);
  const clampedWeekDayOffset = Math.min(0, Math.max(-6, diffDaysFromToday));
  const weekSlotIndex = (clampedWeekDayOffset + 6) * 2 + (selectedHour >= 14 ? 1 : 0);
  const maxWeekSlot = isToday ? (currentRealHour >= 20 ? 13 : 12) : 13;

  // Status Live & Tahun Citra Satelit Terpilih
  const isLive = (simMode === 'hari' && isToday && selectedHour === currentRealHour) ||
                 (simMode === 'pekan' && isToday && (selectedHour >= (currentRealHour >= 20 ? 20 : 8))) ||
                 (simMode === 'bulan' && isToday) ||
                 (simMode === 'tahun' && selectedYearNum === currentRealYear && selectedMonthNum === currentRealMonth);

  const selectedYear = (selectedYearNum === 2026 || isLive) ? 'terkini' : String(selectedYearNum);
  const dateYear = String(selectedYearNum);

  // Looping Auto-Play Timeline (Dengan Kecepatan Playback Speed Dinamis & Skala Pergerakan Mulus)
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
          // Maju 1 jam
          setSelectedHour((prev) => (prev >= maxAvailableHour ? 0 : prev + 1));
        } else if (simMode === 'pekan') {
          // Maju per 12 jam (Pagi / Malam) agar skala pergerakan rentang 7 hari mulus
          const nextSlot = weekSlotIndex >= maxWeekSlot ? 0 : weekSlotIndex + 1;
          const dayOffset = Math.floor(nextSlot / 2) - 6;
          const targetHour = (nextSlot % 2 === 0) ? 8 : 20;
          const d = new Date(now);
          d.setDate(d.getDate() + dayOffset);
          const dStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
          setSelectedDate(dStr);
          setSelectedHour(targetHour);
        } else if (simMode === 'bulan') {
          // Maju per 3 hari
          setSelectedDate((prevDate) => {
            const [yS, mS, dS] = (prevDate || todayDateStr).split('-');
            const y = parseInt(yS, 10);
            const m = parseInt(mS, 10);
            const d = parseInt(dS, 10);
            const totalDays = new Date(y, m, 0).getDate();
            const isCurrM = y === currentRealYear && m === currentRealMonth;
            const maxD = isCurrM ? Math.min(totalDays, currentRealDay) : totalDays;
            const nextD = (d >= maxD) ? 1 : Math.min(maxD, d + 3);
            return `${y}-${String(m).padStart(2, '0')}-${String(nextD).padStart(2, '0')}`;
          });
        } else if (simMode === 'tahun') {
          // Maju per 1 bulan sepanjang rentang 2021 s.d. 2026
          const nextIdx = selectedMonthIndex >= maxMonthIndex ? 0 : selectedMonthIndex + 1;
          const nextY = 2021 + Math.floor(nextIdx / 12);
          const nextM = (nextIdx % 12) + 1;
          const totalDays = new Date(nextY, nextM, 0).getDate();
          const isCurrM = nextY === currentRealYear && nextM === currentRealMonth;
          const maxD = isCurrM ? currentRealDay : totalDays;
          const nextD = Math.min(maxD, selectedDayNum || 15);
          setSelectedDate(`${nextY}-${String(nextM).padStart(2, '0')}-${String(nextD).padStart(2, '0')}`);
        }
      }, delay);
    }
    return () => clearInterval(interval);
  }, [isPlaying, simMode, playbackSpeed, maxAvailableHour, weekSlotIndex, maxWeekSlot, maxAvailableDay, selectedMonthIndex, maxMonthIndex, selectedDayNum, currentRealYear, currentRealMonth, currentRealDay, todayDateStr]);

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
                      simMode === 'pekan' ? weekSlotIndex > 0 :
                      simMode === 'bulan' ? selectedDayNum > 1 :
                      selectedMonthIndex > 0;

  const handleStepBack = () => {
    if (simMode === 'hari') {
      setSelectedHour((prev) => Math.max(0, prev - 1));
    } else if (simMode === 'pekan') {
      const prevSlot = Math.max(0, weekSlotIndex - 1);
      const dayOffset = Math.floor(prevSlot / 2) - 6;
      const targetHour = (prevSlot % 2 === 0) ? 8 : 20;
      const d = new Date(now);
      d.setDate(d.getDate() + dayOffset);
      setSelectedDate(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`);
      setSelectedHour(targetHour);
    } else if (simMode === 'bulan') {
      const prevD = Math.max(1, selectedDayNum - 3);
      setSelectedDate(`${selectedYearNum}-${String(selectedMonthNum).padStart(2, '0')}-${String(prevD).padStart(2, '0')}`);
    } else if (simMode === 'tahun') {
      const prevIdx = Math.max(0, selectedMonthIndex - 1);
      const prevY = 2021 + Math.floor(prevIdx / 12);
      const prevM = (prevIdx % 12) + 1;
      const totalDays = new Date(prevY, prevM, 0).getDate();
      const isCurrM = prevY === currentRealYear && prevM === currentRealMonth;
      const maxD = isCurrM ? currentRealDay : totalDays;
      const prevD = Math.min(maxD, selectedDayNum || 15);
      setSelectedDate(`${prevY}-${String(prevM).padStart(2, '0')}-${String(prevD).padStart(2, '0')}`);
    }
  };

  // Navigasi Langkah Maju Sesuai Mode
  const canStepForward = simMode === 'hari' ? selectedHour < maxAvailableHour :
                         simMode === 'pekan' ? weekSlotIndex < maxWeekSlot :
                         simMode === 'bulan' ? selectedDayNum < maxAvailableDay :
                         selectedMonthIndex < maxMonthIndex;

  const handleStepForward = () => {
    if (simMode === 'hari') {
      setSelectedHour((prev) => Math.min(maxAvailableHour, prev + 1));
    } else if (simMode === 'pekan') {
      const nextSlot = Math.min(maxWeekSlot, weekSlotIndex + 1);
      const dayOffset = Math.floor(nextSlot / 2) - 6;
      const targetHour = (nextSlot % 2 === 0) ? 8 : 20;
      const d = new Date(now);
      d.setDate(d.getDate() + dayOffset);
      setSelectedDate(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`);
      setSelectedHour(targetHour);
    } else if (simMode === 'bulan') {
      const nextD = Math.min(maxAvailableDay, selectedDayNum + 3);
      setSelectedDate(`${selectedYearNum}-${String(selectedMonthNum).padStart(2, '0')}-${String(nextD).padStart(2, '0')}`);
    } else if (simMode === 'tahun') {
      const nextIdx = Math.min(maxMonthIndex, selectedMonthIndex + 1);
      const nextY = 2021 + Math.floor(nextIdx / 12);
      const nextM = (nextIdx % 12) + 1;
      const totalDays = new Date(nextY, nextM, 0).getDate();
      const isCurrM = nextY === currentRealYear && nextM === currentRealMonth;
      const maxD = isCurrM ? currentRealDay : totalDays;
      const nextD = Math.min(maxD, selectedDayNum || 15);
      setSelectedDate(`${nextY}-${String(nextM).padStart(2, '0')}-${String(nextD).padStart(2, '0')}`);
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

  // Sinkronisasi data telemetri cuaca stasiun pantau dengan pergerakan waktu
  const getStationWeatherState = (namaStasiun, dataStasiun) => {
    if (isLive) {
      return {
        temp: dataStasiun.suhu_c,
        humidity: dataStasiun.kelembapan_persen,
        rain: dataStasiun.curah_hujan_mm,
        status: dataStasiun.status_hujan,
        isRain: dataStasiun.status_hujan?.includes('Hujan')
      };
    }

    // 1. Variasi Diurnal Suhu (Jam 00:00 - 23:00 WIB)
    const hourRad = ((selectedHour - 14) * Math.PI) / 12;
    const diurnalTempOffset = -4.0 * Math.cos(hourRad);
    const baseTemp = dataStasiun.suhu_c || 24;
    const simTemp = Math.max(15, Math.min(36, (baseTemp + diurnalTempOffset))).toFixed(1);

    // 2. Variasi Musiman Curah Hujan (Bulan 1 - 12)
    const isWetSeason = [11, 12, 1, 2, 3].includes(selectedMonthNum);
    const isDrySeason = [6, 7, 8].includes(selectedMonthNum);

    // 3. Variasi Gelombang Harian / Pekanan (Siklus MJO / Sinoptik)
    const synopticWave = Math.sin((selectedDayNum * 1.5) + (selectedMonthNum * 0.8));
    const afternoonConvection = (selectedHour >= 13 && selectedHour <= 19) ? 1.8 : 0.4;

    let simRainMm = 0;
    if (isWetSeason) {
      simRainMm = Math.max(0, Math.round((28 + synopticWave * 20) * afternoonConvection));
    } else if (isDrySeason) {
      simRainMm = Math.max(0, Math.round((3 + synopticWave * 3) * afternoonConvection));
    } else {
      simRainMm = Math.max(0, Math.round((14 + synopticWave * 12) * afternoonConvection));
    }

    // Variasi Kelembapan
    const simHumidity = Math.min(99, Math.max(50, Math.round(
      (dataStasiun.kelembapan_persen || 75) + 
      (simRainMm > 20 ? 14 : -6) + 
      (selectedHour < 7 || selectedHour > 19 ? 8 : -6)
    )));

    // Status Hujan & Peringatan Dini Longsor
    let simStatus = 'Cerah / Berawan';
    if (simRainMm >= 50) simStatus = 'Hujan Sangat Lebat (Awas Longsor 🚨)';
    else if (simRainMm >= 25) simStatus = 'Hujan Lebat (Siaga Longsor ⚠️)';
    else if (simRainMm >= 10) simStatus = 'Hujan Sedang (Waspada)';
    else if (simRainMm > 1) simStatus = 'Hujan Ringan';

    return {
      temp: simTemp,
      humidity: simHumidity,
      rain: simRainMm,
      status: simStatus,
      isRain: simRainMm > 1
    };
  };

  // Layer Visibility
  const [baseMap, setBaseMap] = useState('osm'); // 'osm' | 'satellite'
  const [showBoundary, setShowBoundary] = useState(true);
  const [showSlope, setShowSlope] = useState(true);
  const [showDem, setShowDem] = useState(false);
  const [showSentinel2, setShowSentinel2] = useState(true);
  const [showSar, setShowSar] = useState(false);
  const [showHimawari, setShowHimawari] = useState(true);
  const [radarEngine, setRadarEngine] = useState('himawari_ir'); // 'himawari_ir' | 'rainviewer_loop' | 'imerg_rain' | 'bmkg_static'
  const [himawariProduct, setHimawariProduct] = useState('EH'); // 'EH' | 'RP' | 'NC'
  const [himawariOpacity, setHimawariOpacity] = useState(0.75);
  const [himawariTimestamp, setHimawariTimestamp] = useState(Date.now());
  const [rainviewerData, setRainviewerData] = useState(null);
  const [radarFrameIndex, setRadarFrameIndex] = useState(0);
  const [isRadarPlaying, setIsRadarPlaying] = useState(true);
  const [showGempa, setShowGempa] = useState(true);
  const [showFaults, setShowFaults] = useState(true);
  const [showHistoricalQuakes, setShowHistoricalQuakes] = useState(true);
  const [showSoilLayer, setShowSoilLayer] = useState(false);
  const [showEmergencyLayer, setShowEmergencyLayer] = useState(true);
  const [emergencyTypeFilter, setEmergencyTypeFilter] = useState('all'); // 'all' | 'bpbd' | 'sar' | 'puskesmas'
  const [emergencyFacilities, setEmergencyFacilities] = useState([]);
  const [showNearestPanel, setShowNearestPanel] = useState(false);

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

  // 7. Ambil Data Fasilitas Darurat (BPBD, SAR, Puskesmas / Faskes Terdekat)
  useEffect(() => {
    fetch('/data/jabar-emergency-facilities.json')
      .then(res => res.json())
      .then(data => setEmergencyFacilities(data.facilities || []))
      .catch(err => console.warn('Gagal memuat direktori fasilitas darurat:', err));
  }, []);

  // 8. Ambil Data Radar Doppler Cuaca Real-time (RainViewer API)
  useEffect(() => {
    fetch('https://api.rainviewer.com/public/weather-maps.json')
      .then(res => res.json())
      .then(data => {
        setRainviewerData(data);
        if (data?.radar?.past?.length) {
          setRadarFrameIndex(data.radar.past.length - 1);
        }
      })
      .catch(err => console.warn('Gagal memuat data RainViewer radar:', err));
  }, []);

  // Animasi Loop Frame Radar Cuaca Doppler Real-time
  useEffect(() => {
    if (radarEngine !== 'rainviewer_loop' || !isRadarPlaying || !rainviewerData?.radar?.past?.length) return;
    const interval = setInterval(() => {
      setRadarFrameIndex(prev => (prev + 1) % rainviewerData.radar.past.length);
    }, 750);
    return () => clearInterval(interval);
  }, [radarEngine, isRadarPlaying, rainviewerData]);

  // Generator URL Tile Himawari-9 AHI Band 13 Clean Infrared (NASA GIBS)
  const getHimawariTileUrl = () => {
    try {
      const selDate = new Date(`${selectedDate}T${String(selectedHour).padStart(2, '0')}:00:00+07:00`);
      const now = new Date();
      const diffDays = (now - selDate) / (1000 * 60 * 60 * 24);

      if (diffDays >= 0 && diffDays <= 20) {
        const utcHour = selDate.getUTCHours();
        const utcDay = selDate.toISOString().slice(0, 10);
        const timeStr = `${utcDay}T${String(utcHour).padStart(2, '0')}:00:00Z`;
        return `https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/Himawari_AHI_Band13_Clean_Infrared/default/${timeStr}/GoogleMapsCompatible_Level6/{z}/{y}/{x}.png`;
      }
    } catch (e) {}
    return 'https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/Himawari_AHI_Band13_Clean_Infrared/default/default/GoogleMapsCompatible_Level6/{z}/{y}/{x}.png';
  };

  // Generator URL Tile GPM IMERG Presipitasi Nyata Historis 2021-2026 (NASA GIBS)
  const getImergTileUrl = () => {
    const d = selectedDate || '2026-10-26';
    return `https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/IMERG_Precipitation_Rate/default/${d}/GoogleMapsCompatible_Level6/{z}/{y}/{x}.png`;
  };

  // Generator URL Tile RainViewer Doppler Radar Real-time
  const getRainViewerTileUrl = () => {
    if (!rainviewerData?.radar?.past?.length) return null;
    const frames = rainviewerData.radar.past;
    const frame = frames[radarFrameIndex] || frames[frames.length - 1];
    return `${rainviewerData.host}${frame.path}/256/{z}/{x}/{y}/2/1_1.png`;
  };

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

        {/* 6. Multi-Engine Radar & Satelit Cuaca Dinamis (Himawari-9 AHI IR, IMERG Hujan Historis, RainViewer Radar Loop, & BMKG) */}
        {showHimawari && (
          <>
            {/* OPSI 1: Himawari-9 AHI Band 13 Clean Infrared (NASA GIBS) - Dinamis per Jam Sesuai Timeline */}
            {radarEngine === 'himawari_ir' && (
              <TileLayer
                key={`himawari-ir-${selectedDate}-${selectedHour}`}
                url={getHimawariTileUrl()}
                opacity={himawariOpacity}
                zIndex={350}
                attribution="JMA Himawari-9 AHI Infrared &bull; NASA GIBS"
              />
            )}

            {/* OPSI 2: GPM IMERG Presipitasi Nyata Historis 2021-2026 (NASA GIBS) - Mengubah Peta Hujan Sesuai Hari Kalender */}
            {radarEngine === 'imerg_rain' && (
              <TileLayer
                key={`imerg-rain-${selectedDate}`}
                url={getImergTileUrl()}
                opacity={himawariOpacity}
                zIndex={350}
                attribution="NASA/JAXA GPM IMERG Real Precipitation Rate"
              />
            )}

            {/* OPSI 3: RainViewer Doppler Weather Radar (Animasi Loop 13 Frame Nyata) */}
            {radarEngine === 'rainviewer_loop' && getRainViewerTileUrl() && (
              <TileLayer
                key={`rainviewer-${radarFrameIndex}`}
                url={getRainViewerTileUrl()}
                opacity={himawariOpacity}
                zIndex={350}
                attribution="RainViewer Real-time Weather Doppler Radar"
              />
            )}

            {/* OPSI 4: BMKG Inderaja Indonesia (Snapshot Statis Kalibrasi Suhu BMKG) */}
            {radarEngine === 'bmkg_static' && (
              <ImageOverlay
                key={`himawari-bmkg-${himawariProduct}-${himawariTimestamp}`}
                url={`${HIMAWARI_PRODUCTS[himawariProduct].url}?t=${himawariTimestamp}`}
                bounds={HIMAWARI_BOUNDS}
                opacity={himawariOpacity}
                zIndex={350}
              />
            )}
          </>
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

        {/* 9. Marker Gempa Merusak Historis (Faktual BNPB - Sinkronisasi Kronologis) */}
        {showHistoricalQuakes && seismicData?.historicalDisasters
          ?.filter((event) => {
            const eventYear = parseInt(event.tanggal?.match(/\b(202\d)\b/)?.[1], 10) || 2020;
            return eventYear <= selectedYearNum;
          })
          .map((event) => {
            const eventYear = parseInt(event.tanggal?.match(/\b(202\d)\b/)?.[1], 10) || 2020;
            const isMatchingYear = selectedYearNum === eventYear;
            const isMatchingMonth = isMatchingYear && (
              (event.tanggal.includes('November') && selectedMonthNum === 11) ||
              (event.tanggal.includes('Desember') && selectedMonthNum === 12) ||
              (event.tanggal.includes('September') && selectedMonthNum === 9) ||
              (event.tanggal.includes('Maret') && selectedMonthNum === 3)
            );
            const isHighlighted = simMode === 'tahun' ? isMatchingYear : (simMode === 'bulan' ? isMatchingMonth : isMatchingYear);
            return (
              <Marker
                key={`quake-${event.id}-${selectedYearNum}`}
                position={event.koordinat}
                icon={createHistoricalQuakeIcon(event.magnitudo, isHighlighted)}
                eventHandlers={{
                  click: () => setSelectedDisasterDetail(event)
                }}
              >
                <Tooltip direction="top" offset={[0, -10]} permanent={isHighlighted}>
                  <div className="font-sans text-xs">
                    <span className="font-bold text-rose-600 block">{event.nama} (M {event.magnitudo})</span>
                    {isHighlighted && (
                      <span className="text-[10px] bg-rose-500/20 text-rose-300 px-1 py-0.5 rounded font-bold block mt-0.5 animate-pulse">
                        ⚡ Gempa Periode {isMatchingMonth ? `Bulan ${getIndonesianMonthName(selectedMonthNum)} ${eventYear}` : `Tahun ${eventYear}`}
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

        {/* 11. Stasiun Pantau Cuaca & Sensor Satelit (Aktif Real-time & Sinkronisasi Timeline) */}
        {(isLive || showHimawari) && liveTelemetry?.stasiun_cuaca_jabar && (
          Object.entries(liveTelemetry.stasiun_cuaca_jabar).map(([namaStasiun, dataStasiun], idx) => {
            const weather = getStationWeatherState(namaStasiun, dataStasiun);
            return (
              <Marker
                key={`stasiun-${idx}-${selectedDate}-${selectedHour}`}
                position={[dataStasiun.lat, dataStasiun.lng]}
                icon={createWeatherStationIcon(namaStasiun, weather.status)}
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
                      <div>Suhu: <b className="text-zinc-900">{weather.temp}°C</b></div>
                      <div>Kelembapan: <b>{weather.humidity}%</b></div>
                      <div>Curah Hujan: <b className="text-blue-600">{weather.rain} mm</b></div>
                      <div>Status: <b className={weather.status.includes('Lebat') || weather.status.includes('Awas') ? 'text-rose-600 font-bold' : weather.isRain ? 'text-sky-600' : 'text-emerald-600'}>{weather.status}</b></div>
                    </div>
                    <div className="text-[10px] text-zinc-500 italic flex items-center justify-between">
                      <span>Tanggal: {selectedDate}</span>
                      <span className={isLive ? 'text-rose-600 font-bold' : 'text-emerald-700 font-medium'}>
                        {isLive ? '● Live BMKG' : `Tersinkronisasi ${simMode === 'tahun' ? 'Musiman' : simMode === 'bulan' ? 'Harian' : 'Diurnal'}`}
                      </span>
                    </div>
                  </div>
                </Popup>
              </Marker>
            );
          })
        )}

        {/* 12. Marker Fasilitas Darurat (BPBD, SAR, Puskesmas Terdekat - Integrasi Google Maps API) */}
        {showEmergencyLayer && emergencyFacilities
          .filter(f => emergencyTypeFilter === 'all' || f.type === emergencyTypeFilter)
          .map(facility => {
            const userDist = userLocation ? calculateDistanceKm(userLocation.lat, userLocation.lng, facility.lat, facility.lng) : null;
            const drivingMins = userDist ? estimateDrivingMinutes(userDist) : null;
            const gmapsNavUrl = getGoogleMapsNavigationUrl(
              facility.lat, 
              facility.lng, 
              userLocation?.lat, 
              userLocation?.lng
            );
            const gmapsSearchUrl = getGoogleMapsSearchUrl(facility.name, facility.address);

            return (
              <Marker
                key={`facility-${facility.id}`}
                position={[facility.lat, facility.lng]}
                icon={createEmergencyFacilityIcon(facility.type, facility.name)}
              >
                <Popup>
                  <div className="p-1 font-sans text-xs space-y-2 text-zinc-900 max-w-xs">
                    <div className="flex items-center justify-between border-b border-zinc-200 pb-1">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        facility.type === 'bpbd' ? 'bg-amber-100 text-amber-800' :
                        facility.type === 'sar' ? 'bg-sky-100 text-sky-800' :
                        'bg-emerald-100 text-emerald-800'
                      }`}>
                        {facility.categoryName}
                      </span>
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                        ● {facility.hours}
                      </span>
                    </div>

                    <div>
                      <div className="font-bold text-sm text-zinc-900 leading-snug">{facility.name}</div>
                      <div className="text-[11px] text-zinc-600 mt-0.5 flex items-start gap-1">
                        <span>📍</span>
                        <span>{facility.address}</span>
                      </div>
                    </div>

                    {userDist && (
                      <div className="p-2 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 flex items-center justify-between">
                        <div>
                          <span className="text-[10px] text-amber-700 block">Jarak dari Posisi Anda:</span>
                          <span className="font-bold text-xs">{userDist} km ({drivingMins} mnt via Ambulans/Rescue)</span>
                        </div>
                        <span className="text-lg">🚑</span>
                      </div>
                    )}

                    <div className="space-y-1 text-[11px] bg-zinc-50 p-2 rounded-xl border border-zinc-200">
                      <div className="flex items-center justify-between">
                        <span className="text-zinc-500">Nomor Darurat:</span>
                        <a href={`tel:${facility.phone}`} className="font-bold text-rose-600 hover:underline">
                          📞 {facility.phone}
                        </a>
                      </div>
                      <div className="pt-1 text-[10px] text-zinc-600">
                        <span className="font-semibold block text-zinc-700">Layanan Siaga:</span>
                        <div className="flex flex-wrap gap-1 mt-0.5">
                          {facility.services?.map((svc, i) => (
                            <span key={i} className="px-1.5 py-0.5 bg-white border border-zinc-200 rounded text-[9px] text-zinc-700">
                              {svc}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Google Maps Actions */}
                    <div className="pt-1 flex flex-col gap-1.5">
                      <a
                        href={gmapsNavUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition-colors text-center"
                      >
                        <Route className="w-3.5 h-3.5" />
                        <span>Rute Navigasi Google Maps</span>
                      </a>
                      <a
                        href={gmapsSearchUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-800 font-semibold text-[11px] transition-colors text-center"
                      >
                        <ExternalLink className="w-3 h-3" />
                        <span>Lihat di Google Maps</span>
                      </a>
                    </div>
                  </div>
                </Popup>
              </Marker>
            );
          })}

        {/* 13. Marker GPS Posisi Pengguna */}
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

      {/* Floating GPS Locate & Emergency Facilities Buttons (Top Right) */}
      <div className="absolute top-4 right-4 z-[900] flex flex-col gap-2">
        <button
          onClick={handleLocateMe}
          disabled={isLocating}
          className="p-3 rounded-full bg-zinc-950/80 hover:bg-zinc-800 text-white border border-white/20 backdrop-blur-md shadow-xl transition-all hover:scale-105 active:scale-95 flex items-center justify-center cursor-pointer group"
          title="Deteksi Lokasi GPS Saya"
        >
          <Navigation className={`w-5 h-5 text-emerald-400 group-hover:rotate-45 transition-transform ${isLocating ? 'animate-spin' : ''}`} />
        </button>

        <button
          onClick={() => setShowNearestPanel(true)}
          className="p-3 rounded-full bg-amber-950/80 hover:bg-amber-900/80 text-white border border-amber-500/40 backdrop-blur-md shadow-xl transition-all hover:scale-105 active:scale-95 flex items-center justify-center cursor-pointer group"
          title="Cari Posko SAR, BPBD & Puskesmas Terdekat (Google Maps API)"
        >
          <Hospital className="w-5 h-5 text-amber-400 group-hover:scale-110 transition-transform" />
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
                {simMode === 'pekan' && (
                  <span>Simulasi Pekan: <b className="text-emerald-400 font-bold">{formatIndonesianDateFull(selectedDate)} ({selectedHour === 8 ? '08:00 Pagi' : '20:00 Malam'})</b></span>
                )}
                {simMode === 'bulan' && (
                  <span>Simulasi Bulanan: <b className="text-emerald-400 font-bold">Tgl {selectedDayNum} {getIndonesianMonthName(selectedMonthNum)} {selectedYearNum}</b></span>
                )}
                {simMode === 'tahun' && (
                  <span>Simulasi Tahunan: <b className="text-emerald-400 font-bold">{getIndonesianMonthName(selectedMonthNum)} {selectedYearNum}</b></span>
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

            {/* Filter Mode Simulasi: 24 Jam, Pekan, Bulanan, Tahunan */}
            <div className="space-y-1">
              <span className="text-[9px] font-semibold uppercase tracking-wider text-zinc-400 block">
                Filter Skala Simulasi:
              </span>
              <div className="grid grid-cols-4 gap-1 p-1 rounded-xl bg-white/5 border border-white/10">
                <button
                  type="button"
                  onClick={() => { setSimMode('hari'); setIsPlaying(false); }}
                  className={`py-1.5 text-[11px] font-semibold rounded-lg transition-all cursor-pointer text-center flex flex-col items-center justify-center gap-0.5 ${
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
                  onClick={() => { setSimMode('pekan'); setIsPlaying(false); }}
                  className={`py-1.5 text-[11px] font-semibold rounded-lg transition-all cursor-pointer text-center flex flex-col items-center justify-center gap-0.5 ${
                    simMode === 'pekan'
                      ? 'bg-emerald-400 text-zinc-950 font-bold shadow-md shadow-emerald-400/20'
                      : 'text-zinc-400 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <Calendar className="w-3 h-3" />
                  <span>Pekan</span>
                </button>
                <button
                  type="button"
                  onClick={() => { setSimMode('bulan'); setIsPlaying(false); }}
                  className={`py-1.5 text-[11px] font-semibold rounded-lg transition-all cursor-pointer text-center flex flex-col items-center justify-center gap-0.5 ${
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
                  className={`py-1.5 text-[11px] font-semibold rounded-lg transition-all cursor-pointer text-center flex flex-col items-center justify-center gap-0.5 ${
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
                {simMode === 'hari' && '⚡ Geser per 1 jam (00:00 - 23:00 WIB) & awan radar Himawari-9.'}
                {simMode === 'pekan' && '📆 Skala 7 hari: geser per 12 jam (Pagi/Malam) dengan transisi mulus.'}
                {simMode === 'bulan' && `📅 Skala bulanan: geser per 3 hari (${getIndonesianMonthName(selectedMonthNum)} ${selectedYearNum}).`}
                {simMode === 'tahun' && '🗓️ Skala tahunan (2021 – 2026): geser per 1 bulan & citra Sentinel-2.'}
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
                  {simMode === 'hari' ? '24 Jam' : simMode === 'pekan' ? 'Pekan (7 Hari)' : simMode === 'bulan' ? 'Bulanan (3 Hari)' : 'Tahunan (Per Bulan)'} ({playbackSpeed}x)
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

            {/* Pusat Radar Satelit Cuaca Dinamis (Himawari-9 IR Dinamis, RainViewer Radar Loop, IMERG Hujan, BMKG) */}
            <div className="p-3.5 rounded-2xl bg-gradient-to-br from-sky-950/40 via-blue-950/20 to-zinc-900/60 border border-sky-500/30 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-sky-400 shadow-sm shadow-sky-400 animate-pulse"></span>
                  <div>
                    <span className="text-xs font-semibold text-white block">Radar & Satelit Cuaca Dinamis</span>
                    <span className="text-[10px] text-sky-300 font-mono">Bergerak Nyata Sesuai Timeline</span>
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
                <div className="space-y-3 pt-1 border-t border-white/5">
                  {/* Selector 4 Engine Radar Satelit */}
                  <div>
                    <span className="text-[9px] font-bold uppercase tracking-wider text-zinc-400 block mb-1.5">
                      Pilih Sumber Mesin Radar:
                    </span>
                    <div className="grid grid-cols-2 gap-1 text-[10px]">
                      <button
                        type="button"
                        onClick={() => setRadarEngine('himawari_ir')}
                        className={`p-1.5 rounded-xl font-semibold transition-all text-left flex flex-col cursor-pointer ${
                          radarEngine === 'himawari_ir'
                            ? 'bg-sky-500 text-white shadow-md shadow-sky-500/30 font-bold'
                            : 'bg-white/5 text-zinc-400 hover:text-white hover:bg-white/10'
                        }`}
                      >
                        <span className="text-xs">🛰️ Himawari-9 IR</span>
                        <span className="text-[9px] opacity-80">Dinamis Per Jam</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setRadarEngine('rainviewer_loop')}
                        className={`p-1.5 rounded-xl font-semibold transition-all text-left flex flex-col cursor-pointer ${
                          radarEngine === 'rainviewer_loop'
                            ? 'bg-emerald-500 text-zinc-950 shadow-md shadow-emerald-500/30 font-bold'
                            : 'bg-white/5 text-zinc-400 hover:text-white hover:bg-white/10'
                        }`}
                      >
                        <span className="text-xs">📡 Radar Doppler</span>
                        <span className="text-[9px] opacity-80">Animasi Bergerak</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setRadarEngine('imerg_rain')}
                        className={`p-1.5 rounded-xl font-semibold transition-all text-left flex flex-col cursor-pointer ${
                          radarEngine === 'imerg_rain'
                            ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30 font-bold'
                            : 'bg-white/5 text-zinc-400 hover:text-white hover:bg-white/10'
                        }`}
                      >
                        <span className="text-xs">🌧️ GPM IMERG</span>
                        <span className="text-[9px] opacity-80">Hujan 2021–2026</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setRadarEngine('bmkg_static')}
                        className={`p-1.5 rounded-xl font-semibold transition-all text-left flex flex-col cursor-pointer ${
                          radarEngine === 'bmkg_static'
                            ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 font-bold'
                            : 'bg-white/5 text-zinc-400 hover:text-white hover:bg-white/10'
                        }`}
                      >
                        <span className="text-xs">🇮🇩 BMKG Inderaja</span>
                        <span className="text-[9px] opacity-80">Suhu Terkalibrasi</span>
                      </button>
                    </div>
                  </div>

                  {/* KONTROL KHUSUS ENGINE 1: Himawari-9 IR Dinamis */}
                  {radarEngine === 'himawari_ir' && (
                    <div className="p-2 rounded-xl bg-sky-950/40 border border-sky-500/20 text-[11px] text-sky-200 space-y-1">
                      <div className="flex items-center justify-between font-bold text-sky-300">
                        <span>Pola Awan Berubah Sesuai Jam:</span>
                        <span className="font-mono bg-sky-900/60 px-1.5 py-0.5 rounded text-[10px]">
                          {String(selectedHour).padStart(2, '0')}:00 WIB
                        </span>
                      </div>
                      <p className="text-[10px] text-zinc-400 leading-tight">
                        Sensor AHI Band 13 Clean Infrared (NASA GIBS / JMA). Mengikuti pergerakan scrubber timeline harian dan bulanan secara nyata.
                      </p>
                    </div>
                  )}

                  {/* KONTROL KHUSUS ENGINE 2: RainViewer Radar Doppler Animasi Loop */}
                  {radarEngine === 'rainviewer_loop' && (
                    <div className="p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-[11px] space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-emerald-300 text-xs">Animasi Radar Doppler:</span>
                        <button
                          type="button"
                          onClick={() => setIsRadarPlaying(!isRadarPlaying)}
                          className="px-2 py-0.5 rounded-lg bg-emerald-500 text-zinc-950 font-bold text-[10px] flex items-center gap-1 cursor-pointer"
                        >
                          {isRadarPlaying ? <Pause className="w-3 h-3 fill-current" /> : <Play className="w-3 h-3 fill-current" />}
                          <span>{isRadarPlaying ? 'Jeda' : 'Putar'}</span>
                        </button>
                      </div>

                      {rainviewerData?.radar?.past?.length ? (
                        <div>
                          <input
                            type="range"
                            min="0"
                            max={rainviewerData.radar.past.length - 1}
                            value={radarFrameIndex}
                            onChange={(e) => {
                              setRadarFrameIndex(parseInt(e.target.value, 10));
                              setIsRadarPlaying(false);
                            }}
                            className="w-full accent-emerald-400 cursor-pointer h-1.5 bg-white/10 rounded"
                          />
                          <div className="flex justify-between text-[9px] text-zinc-400 font-mono mt-1">
                            <span>Frame {radarFrameIndex + 1} dari {rainviewerData.radar.past.length}</span>
                            <span className="text-emerald-400 font-bold">● Loop Aktif 10 Mnt</span>
                          </div>
                        </div>
                      ) : (
                        <div className="text-[10px] text-zinc-500">Memuat radar doppler...</div>
                      )}
                    </div>
                  )}

                  {/* KONTROL KHUSUS ENGINE 3: GPM IMERG Presipitasi Historis */}
                  {radarEngine === 'imerg_rain' && (
                    <div className="p-2 rounded-xl bg-blue-950/40 border border-blue-500/20 text-[11px] text-blue-200 space-y-1">
                      <div className="flex items-center justify-between font-bold text-blue-300">
                        <span>Peta Curah Hujan Historis:</span>
                        <span className="font-mono bg-blue-900/60 px-1.5 py-0.5 rounded text-[10px]">
                          {selectedDate}
                        </span>
                      </div>
                      <p className="text-[10px] text-zinc-400 leading-tight">
                        Data satelit radar presipitasi global (NASA GPM / JAXA) untuk semua tahun 2021 s.d. 2026. Peta hujan berubah mengikuti tanggal kalender yang Anda pilih.
                      </p>
                    </div>
                  )}

                  {/* KONTROL KHUSUS ENGINE 4: BMKG Inderaja Indonesia */}
                  {radarEngine === 'bmkg_static' && (
                    <div>
                      <span className="text-[9px] font-bold uppercase tracking-wider text-zinc-400 block mb-1">
                        Kanal BMKG Inderaja:
                      </span>
                      <div className="grid grid-cols-3 gap-1">
                        {Object.values(HIMAWARI_PRODUCTS).map((prod) => (
                          <button
                            key={prod.id}
                            type="button"
                            onClick={() => setHimawariProduct(prod.id)}
                            className={`py-1 px-1 rounded-lg text-[10px] font-semibold transition-all cursor-pointer truncate ${
                              himawariProduct === prod.id
                                ? 'bg-indigo-500 text-white shadow-sm'
                                : 'bg-white/5 text-zinc-400 hover:text-white'
                            }`}
                            title={prod.name}
                          >
                            {prod.shortName}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Pengatur Opasitas Satelit/Radar */}
                  <div className="flex items-center justify-between text-[10px] text-zinc-400 pt-1">
                    <span>Opasitas Layer</span>
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

            {/* Posko Darurat & Fasilitas Medis (BPBD, SAR, Puskesmas - Google Maps API) */}
            <div className="p-3 rounded-2xl bg-amber-950/20 border border-amber-500/30 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-sm shadow-amber-400"></span>
                  <div>
                    <span className="text-xs font-semibold text-white block">Posko & Faskes Siaga</span>
                    <span className="text-[10px] text-amber-300 font-mono">Google Maps Navigation API</span>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={showEmergencyLayer}
                  onChange={(e) => setShowEmergencyLayer(e.target.checked)}
                  className="accent-amber-400 w-4 h-4 cursor-pointer"
                />
              </div>

              {showEmergencyLayer && (
                <div className="space-y-2 pt-1 border-t border-white/5">
                  <div className="grid grid-cols-4 gap-1 text-[10px]">
                    {[
                      { id: 'all', label: 'Semua' },
                      { id: 'bpbd', label: '🏢 BPBD' },
                      { id: 'sar', label: '🚨 SAR' },
                      { id: 'puskesmas', label: '🏥 Faskes' }
                    ].map(tab => (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setEmergencyTypeFilter(tab.id)}
                        className={`py-1 rounded-lg text-center font-medium transition-all cursor-pointer ${
                          emergencyTypeFilter === tab.id
                            ? 'bg-amber-400 text-zinc-950 font-bold shadow-sm'
                            : 'bg-white/5 text-zinc-400 hover:text-white'
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowNearestPanel(true)}
                    className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-xl bg-gradient-to-r from-amber-500/20 to-emerald-500/20 hover:from-amber-500/30 hover:to-emerald-500/30 border border-amber-500/30 text-amber-300 text-[11px] font-semibold transition-all cursor-pointer"
                  >
                    <Compass className="w-3.5 h-3.5 text-amber-400 animate-spin" style={{ animationDuration: '6s' }} />
                    <span>Cari Faskes Terdekat dari Lokasi</span>
                  </button>
                </div>
              )}
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

              {/* Mode Simulasi Switcher: 24 Jam / Pekan / Bulanan / Tahunan */}
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
                    setSimMode('pekan');
                    setIsPlaying(false);
                  }}
                  className={`px-2 sm:px-2.5 py-1 rounded-lg font-medium transition-all cursor-pointer flex items-center gap-1 text-[11px] ${
                    simMode === 'pekan'
                      ? 'bg-emerald-400 text-zinc-950 font-bold shadow-sm shadow-emerald-400/20'
                      : 'text-zinc-400 hover:text-white hover:bg-white/10'
                  }`}
                  title="Simulasi Skala Pekan (7 Hari - Step 12 Jam Mulus)"
                >
                  <Calendar className="w-3 h-3" />
                  <span>Pekan</span>
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
                  title="Simulasi Bulanan (Step 3 Hari)"
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
                  title="Simulasi Tahunan 2021–2026 (Step 1 Bulan)"
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
                  {simMode === 'pekan' && (
                    <>
                      <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="font-semibold text-xs text-white">
                        {formatIndonesianDateFull(selectedDate)}
                      </span>
                      <span className="font-mono text-[10px] px-1 rounded bg-white/10 text-emerald-300 font-bold">
                        {selectedHour === 8 ? '08:00 Pagi' : '20:00 Malam'}
                      </span>
                    </>
                  )}
                  {simMode === 'bulan' && (
                    <>
                      <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="font-semibold text-xs text-white">
                        Tgl {selectedDayNum} {getIndonesianMonthName(selectedMonthNum)} {selectedYearNum}
                      </span>
                    </>
                  )}
                  {simMode === 'tahun' && (
                    <>
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                      <span className="font-bold text-sm text-white">
                        {getIndonesianMonthName(selectedMonthNum)} {selectedYearNum}
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
                {/* 1. Mode Hari (00:00 s.d. maxAvailableHour - step 1 jam) */}
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

                {/* 2. Mode Pekan (7 Hari - step 12 jam / Pagi-Malam) */}
                {simMode === 'pekan' && (
                  <input
                    type="range"
                    min={0}
                    max={maxWeekSlot}
                    step={1}
                    value={weekSlotIndex}
                    onChange={(e) => {
                      const slot = parseInt(e.target.value, 10);
                      const dayOffset = Math.floor(slot / 2) - 6;
                      const targetHour = (slot % 2 === 0) ? 8 : 20;
                      const d = new Date(now);
                      d.setDate(d.getDate() + dayOffset);
                      setSelectedDate(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`);
                      setSelectedHour(targetHour);
                      setIsPlaying(false);
                    }}
                    className="w-full accent-emerald-400 cursor-pointer h-2 bg-white/10 rounded-lg appearance-none transition-all"
                  />
                )}

                {/* 3. Mode Bulan (1 s.d. maxAvailableDay - step 3 hari) */}
                {simMode === 'bulan' && (
                  <input
                    type="range"
                    min={1}
                    max={maxAvailableDay}
                    step={3}
                    value={selectedDayNum}
                    onChange={(e) => {
                      const dVal = parseInt(e.target.value, 10);
                      setSelectedDate(`${selectedYearNum}-${String(selectedMonthNum).padStart(2, '0')}-${String(dVal).padStart(2, '0')}`);
                      setIsPlaying(false);
                    }}
                    className="w-full accent-emerald-400 cursor-pointer h-2 bg-white/10 rounded-lg appearance-none transition-all"
                  />
                )}

                {/* 4. Mode Tahun (Jan 2021 s.d. Okt 2026 - step 1 bulan) */}
                {simMode === 'tahun' && (
                  <input
                    type="range"
                    min={0}
                    max={maxMonthIndex}
                    step={1}
                    value={selectedMonthIndex}
                    onChange={(e) => {
                      const idx = parseInt(e.target.value, 10);
                      const y = 2021 + Math.floor(idx / 12);
                      const m = (idx % 12) + 1;
                      const totalDays = new Date(y, m, 0).getDate();
                      const isCurrM = y === currentRealYear && m === currentRealMonth;
                      const maxD = isCurrM ? currentRealDay : totalDays;
                      const d = Math.min(maxD, selectedDayNum || 15);
                      setSelectedDate(`${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`);
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

              {simMode === 'pekan' && (
                <div className="flex justify-between items-center text-[9px] text-zinc-400 font-mono px-0.5 pt-0.5 select-none">
                  {[
                    { slot: 0, label: 'H-6' },
                    { slot: 2, label: 'H-5' },
                    { slot: 4, label: 'H-4' },
                    { slot: 6, label: 'H-3' },
                    { slot: 8, label: 'H-2' },
                    { slot: 10, label: 'Kemarin' },
                    { slot: Math.min(12, maxWeekSlot), label: 'Hari Ini' }
                  ].map(({ slot, label }) => (
                    <button
                      key={`tick-week-${slot}`}
                      type="button"
                      onClick={() => {
                        const dayOffset = Math.floor(slot / 2) - 6;
                        const d = new Date(now);
                        d.setDate(d.getDate() + dayOffset);
                        setSelectedDate(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`);
                        setSelectedHour(8);
                      }}
                      className={`hover:text-white cursor-pointer ${
                        Math.floor(weekSlotIndex / 2) * 2 === slot ? 'text-emerald-400 font-bold' : ''
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              )}

              {simMode === 'bulan' && (
                <div className="flex justify-between items-center text-[9px] text-zinc-400 font-mono px-0.5 pt-0.5 select-none">
                  {[1, 4, 7, 10, 13, 16, 19, 22, 25, 28, maxAvailableDay].filter((v, i, a) => a.indexOf(v) === i).map((d) => (
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
                      {d === maxAvailableDay && isCurrentMonth ? `Tgl ${d} (Maks)` : `Tgl ${d}`}
                    </button>
                  ))}
                </div>
              )}

              {simMode === 'tahun' && (
                <div className="flex justify-between items-center text-[9px] text-zinc-400 font-mono px-0.5 pt-0.5 select-none">
                  {[2021, 2022, 2023, 2024, 2025, 2026].map((yr) => {
                    const yrIdx = (yr - 2021) * 12 + (yr === 2026 ? currentRealMonth - 1 : 0);
                    return (
                      <button
                        key={`tick-year-${yr}`}
                        type="button"
                        onClick={() => {
                          const targetMonth = yr === 2026 ? currentRealMonth : 6;
                          const targetDate = yr === 2026 ? todayDateStr : `${yr}-${String(targetMonth).padStart(2, '0')}-15`;
                          handleDateChange(targetDate);
                        }}
                        className={`hover:text-white cursor-pointer ${
                          selectedYearNum === yr
                            ? yr === 2026 ? 'text-rose-400 font-bold' : 'text-emerald-400 font-bold'
                            : ''
                        }`}
                      >
                        {yr === 2026 ? `2026 (${getIndonesianMonthName(currentRealMonth)})` : yr}
                      </button>
                    );
                  })}
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
            <span className="w-3 h-3 rounded bg-amber-400"></span>
            <span>🏢 BPBD & 🚨 Posko SAR Basarnas</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded bg-emerald-400"></span>
            <span>🏥 Puskesmas & RS Rujukan Bencana</span>
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

            {/* Fasilitas Darurat & Rujukan Terdekat dari Titik Bencana Ini (Google Maps API) */}
            <div className="mb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 mb-2 flex items-center gap-1.5">
                <Hospital className="w-3.5 h-3.5" /> Posko BPBD, SAR, & Puskesmas Terdekat dari Titik Ini:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mt-2">
                {findNearestFacilities(
                  selectedDisasterDetail.koordinat[0], 
                  selectedDisasterDetail.koordinat[1], 
                  emergencyFacilities, 
                  3
                ).map((f) => (
                  <div key={f.id} className="p-3 rounded-2xl bg-white/[0.04] border border-white/10 text-xs flex flex-col justify-between space-y-2">
                    <div>
                      <div className="flex items-center justify-between text-[10px] mb-1">
                        <span className={`px-1.5 py-0.5 rounded font-bold ${
                          f.type === 'bpbd' ? 'bg-amber-500/20 text-amber-300' :
                          f.type === 'sar' ? 'bg-sky-500/20 text-sky-300' :
                          'bg-emerald-500/20 text-emerald-300'
                        }`}>
                          {f.categoryName.split('/')[0]}
                        </span>
                        <span className="font-mono text-emerald-400 font-bold">{f.distanceKm} km</span>
                      </div>
                      <div className="font-bold text-white text-xs leading-tight">{f.name}</div>
                      <div className="text-[10px] text-zinc-400 mt-1">
                        ⏱️ Est. {f.drivingTimeMinutes} menit via Ambulans
                      </div>
                    </div>
                    <div className="space-y-1 pt-1 border-t border-white/5">
                      <a
                        href={f.googleMapsNavUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-[11px] shadow-sm transition-colors text-center"
                      >
                        <Route className="w-3 h-3" />
                        <span>Rute Google Maps</span>
                      </a>
                      <a
                        href={`tel:${f.phone}`}
                        className="w-full flex items-center justify-center gap-1 py-1 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white text-[10px] transition-colors text-center"
                      >
                        <PhoneCall className="w-3 h-3 text-rose-400" />
                        <span>{f.phone}</span>
                      </a>
                    </div>
                  </div>
                ))}
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

      {/* Modal Cari Faskes & Posko Terdekat (Google Maps API) */}
      {showNearestPanel && (
        <div className="fixed inset-0 z-[1200] flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-fade-in-up text-left">
          <div className="w-full max-w-3xl max-h-[90vh] flex flex-col rounded-3xl glass-panel-elevated border border-white/15 p-5 sm:p-7 shadow-2xl text-white overflow-hidden">
            <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-4 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-400">
                  <Hospital className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2 text-amber-400 text-xs font-semibold">
                    <Compass className="w-3.5 h-3.5" />
                    <span>JARAK & NAVIGASI SPASIAL TERDEKAT</span>
                  </div>
                  <h3 className="text-xl font-bold tracking-tight text-white">
                    Faskes, Posko SAR, & Kantor BPBD Terdekat
                  </h3>
                </div>
              </div>
              <button
                onClick={() => setShowNearestPanel(false)}
                className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-zinc-300 hover:text-white transition-colors cursor-pointer text-lg font-bold"
              >
                &times;
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 pr-1">
              {/* Origin Selector Card */}
              <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-3">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                  <div className="text-xs">
                    <span className="text-zinc-400 block">Titik Acuan Perhitungan Jarak:</span>
                    <b className="text-white">
                      {userLocation 
                        ? `📍 GPS Anda (${userLocation.lat.toFixed(4)}, ${userLocation.lng.toFixed(4)})` 
                        : '📍 Titik Default (Cianjur / Cugenang: -6.82, 107.10)'}
                    </b>
                  </div>
                  {!userLocation && (
                    <button
                      type="button"
                      onClick={handleLocateMe}
                      disabled={isLocating}
                      className="px-3 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Navigation className="w-3.5 h-3.5" />
                      <span>{isLocating ? 'Mendeteksi GPS...' : 'Aktifkan GPS Saya'}</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Nearest Facilities List */}
              <div className="space-y-3">
                {findNearestFacilities(
                  userLocation?.lat || -6.82, 
                  userLocation?.lng || 107.10, 
                  emergencyFacilities, 
                  6,
                  emergencyTypeFilter
                ).map((f) => (
                  <div key={f.id} className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-amber-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          f.type === 'bpbd' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                          f.type === 'sar' ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30' :
                          'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        }`}>
                          {f.categoryName}
                        </span>
                        <span className="text-[10px] text-zinc-500 font-mono">● {f.hours}</span>
                      </div>
                      <div className="text-sm font-bold text-white">{f.name}</div>
                      <div className="text-xs text-zinc-400">{f.address}</div>
                      <div className="text-xs font-bold text-amber-400 pt-0.5">
                        📏 Jarak: {f.distanceKm} km &bull; ⏱️ Estimasi {f.drivingTimeMinutes} menit perjalanan
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
                      <a
                        href={f.googleMapsNavUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition-colors"
                      >
                        <Route className="w-3.5 h-3.5" />
                        <span>Rute Navigasi Google Maps</span>
                      </a>
                      <a
                        href={`tel:${f.phone}`}
                        className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-rose-400 hover:text-white transition-colors"
                        title="Telepon Posko"
                      >
                        <PhoneCall className="w-4 h-4" />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
