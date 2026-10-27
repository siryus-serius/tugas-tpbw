import React from 'react';
import { ArrowRight, Satellite, CloudRain, ShieldCheck, Map, AlertTriangle } from 'lucide-react';

export default function HeroSection({ onExploreMap }) {
  return (
    <section className="relative w-full min-h-[92vh] rounded-[2.5rem] overflow-hidden bg-black border border-white/10 mx-auto my-4 max-w-[1600px] flex items-center justify-between p-8 md:p-16 shadow-2xl">
      {/* Background Satellite Texture & Gradient Overlay */}
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center opacity-60 mix-blend-luminosity scale-105 transition-transform duration-1000"
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&w=2000&q=80')`
        }}
      />
      <div className="absolute inset-0 z-0 bg-gradient-to-r from-zinc-950/95 via-zinc-950/80 to-zinc-950/50" />
      <div className="absolute inset-0 z-0 bg-gradient-to-t from-zinc-950 via-transparent to-zinc-950/60" />

      {/* Massive Background Typography */}
      <div 
        className="absolute bottom-2 left-1/2 -translate-x-1/2 z-0 font-extrabold text-[20vw] leading-none text-white/[0.03] select-none pointer-events-none blur-[1px] tracking-tighter"
      >
        GEOSPATIAL
      </div>

      {/* Hero Content: Two Columns */}
      <div className="relative z-10 w-full flex flex-col lg:flex-row items-center justify-between gap-12 mt-12">
        {/* Left Column: Typography Block */}
        <div className="max-w-2xl text-left animate-fade-in-up">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/[0.06] border border-white/10 backdrop-blur-md mb-6">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
              Platform Mitigasi & Peringatan Dini Bencana
            </span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-white leading-[1.08] mb-6">
            Pemetaan Daerah <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 via-teal-200 to-emerald-500">
              Rawan Longsor Jawa Barat
            </span>
          </h1>

          <p className="text-base sm:text-lg text-zinc-400 font-light leading-relaxed mb-8 max-w-xl">
            Sistem Informasi Geografis terintegrasi Google Earth Engine (2021–2025). Mengolah citra satelit radar Sentinel-1, optik Sentinel-2, elevasi SRTM DEM, dan curah hujan CHIRPS secara temporal untuk pemodelan kerawanan bencana di 27 Kabupaten/Kota.
          </p>

          {/* Interactive Action Buttons */}
          <div className="flex flex-wrap items-center gap-4">
            <button
              onClick={() => onExploreMap('terkini')}
              className="group inline-flex items-center gap-3.5 bg-gradient-to-r from-rose-600 to-rose-500 text-white pl-6 pr-2.5 py-2.5 rounded-full font-semibold text-sm hover:scale-105 active:scale-100 transition-all duration-300 shadow-xl shadow-rose-600/30 cursor-pointer border border-rose-400/40"
            >
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-white"></span>
              </span>
              <span>Buka Peta Terkini (Live)</span>
              <div className="w-10 h-10 rounded-full bg-black/30 group-hover:bg-black/50 flex items-center justify-center text-white transition-colors duration-200">
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </button>

            <button
              onClick={() => onExploreMap('2025')}
              className="group inline-flex items-center gap-3 bg-white text-zinc-950 px-6 py-3.5 rounded-full font-semibold text-sm hover:bg-zinc-100 hover:scale-105 active:scale-100 transition-all duration-300 shadow-xl shadow-white/10 cursor-pointer"
            >
              <span>Arsip Historis (2021–2025)</span>
            </button>

            <a
              href="#feature-grid"
              className="inline-flex items-center gap-2 px-5 py-3.5 rounded-full text-zinc-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 text-sm font-medium transition-all backdrop-blur-md cursor-pointer"
            >
              <Satellite className="w-4 h-4 text-emerald-400" />
              <span>Multi-Kriteria Satelit</span>
            </a>
          </div>
        </div>

        {/* Right Column: Stack of Glass Stat Cards */}
        <div className="w-full lg:w-auto flex flex-col gap-4 items-end animate-fade-in-up">
          {/* Stat Card 1 */}
          <div className="w-full sm:w-72 p-5 rounded-2xl glass-card border border-white/10 shadow-2xl hover:border-emerald-400/40 hover:-translate-y-1 transition-all duration-300">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400">
                Cakupan Administrasi
              </span>
              <Map className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-3xl font-extrabold text-emerald-400 tracking-tight mb-1">
              27 Wilayah
            </div>
            <div className="text-xs text-zinc-400 font-light">
              Kabupaten & Kota Provinsi Jawa Barat tervalidasi batas spasial
            </div>
          </div>

          {/* Stat Card 2 */}
          <div className="w-full sm:w-72 p-5 rounded-2xl glass-card border border-white/10 shadow-2xl hover:border-emerald-400/40 hover:-translate-y-1 transition-all duration-300">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400">
                Curah Hujan Tahunan
              </span>
              <CloudRain className="w-4 h-4 text-blue-400" />
            </div>
            <div className="text-3xl font-extrabold text-blue-400 tracking-tight mb-1">
              &gt; 2.800 mm
            </div>
            <div className="text-xs text-zinc-400 font-light">
              Rata-rata presipitasi CHIRPS di zona pegunungan tengah & selatan
            </div>
          </div>

          {/* Stat Card 3 */}
          <div className="w-full sm:w-72 p-5 rounded-2xl glass-card border border-white/10 shadow-2xl hover:border-emerald-400/40 hover:-translate-y-1 transition-all duration-300">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400">
                Status Integrasi
              </span>
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-3xl font-extrabold text-white tracking-tight mb-1 flex items-center gap-2">
              <span>GEE Live</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/30">
                5 Tahun
              </span>
            </div>
            <div className="text-xs text-zinc-400 font-light">
              Sentinel-1, Sentinel-2, DEM 30m, & Kemiringan Lereng 2021–2025
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
