import React from 'react';
import { CloudRain, Mountain, Layers, Trees, Radio, Compass, AlertOctagon, TrendingUp, CheckCircle2 } from 'lucide-react';

export default function FeatureGrid({ onOpenMapWithLayer }) {
  const factors = [
    {
      id: 'himawari',
      title: 'Satelit Cuaca Himawari-9',
      desc: 'Pendeteksian awan konvektif tebal (Cb) & estimasi presipitasi BMKG pemicu longsor.',
      icon: CloudRain,
      color: 'text-sky-400',
      bg: 'bg-sky-500/10',
      border: 'border-sky-500/20'
    },
    {
      id: 'slope',
      title: 'Kemiringan Lereng',
      desc: 'Sudut lereng >25° dan >45° (terjal) berpotensi gaya geser gravitasi tinggi.',
      icon: Mountain,
      color: 'text-rose-400',
      bg: 'bg-rose-500/10',
      border: 'border-rose-500/20'
    },
    {
      id: 'soil',
      title: 'Jenis Tanah & Geologi',
      desc: 'Formasi batuan vulkanik muda dan tanah andosol/latosol yang gembur dan peka erosi.',
      icon: Layers,
      color: 'text-amber-400',
      bg: 'bg-amber-500/10',
      border: 'border-amber-500/20'
    },
    {
      id: 'elevation',
      title: 'Elevasi Topografi (DEM)',
      desc: 'Model digital elevasi SRTM 30m memetakan zona pegunungan Jawa Barat.',
      icon: Compass,
      color: 'text-violet-400',
      bg: 'bg-violet-500/10',
      border: 'border-violet-500/20'
    },
    {
      id: 'landcover',
      title: 'Tutupan Lahan & NDVI',
      desc: 'Kerapatan kanopi vegetasi Sentinel-2 sebagai penahan laju limpasan permukaan.',
      icon: Trees,
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10',
      border: 'border-emerald-500/20'
    },
    {
      id: 'sar',
      title: 'Radar Sentinel-1 SAR',
      desc: 'Sensor gelombang mikro C-band menembus tutupan awan untuk deformasi lereng.',
      icon: Radio,
      color: 'text-pink-400',
      bg: 'bg-pink-500/10',
      border: 'border-pink-500/20'
    },
  ];

  return (
    <section id="feature-grid" className="w-full max-w-[1600px] mx-auto my-12 px-6 lg:px-12">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
        {/* Left Column: Sticky Header & 2x3 Grid of Factors */}
        <div className="lg:col-span-7 flex flex-col gap-8 text-left">
          <div className="lg:sticky lg:top-24 z-10 bg-black/60 backdrop-blur-md pb-4">
            <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-emerald-400 block mb-2">
              Parameter Spasial Multi-Kriteria
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white leading-[1.15]">
              Faktor Pengaruh & <br />
              <span className="text-zinc-400 font-light">Indikator Kerawanan</span>
            </h2>
            <p className="text-sm text-zinc-400 font-light mt-3 max-w-lg">
              Analisis kerawanan tanah longsor memadukan 6 variabel spasial utama yang diekstrak dari komposit citra satelit dan data terrain.
            </p>
          </div>

          {/* 2x3 Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {factors.map((f) => {
              const Icon = f.icon;
              return (
                <div
                  key={f.id}
                  className={`p-5 rounded-2xl glass-card border ${f.border} hover:scale-[1.02] transition-all duration-300 flex flex-col justify-between group`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className={`w-10 h-10 rounded-xl ${f.bg} flex items-center justify-center ${f.color}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400">
                        GEE Layer
                      </span>
                    </div>
                    <h3 className="text-base font-semibold text-white group-hover:text-emerald-400 transition-colors mb-2">
                      {f.title}
                    </h3>
                    <p className="text-xs text-zinc-400 font-light leading-relaxed">
                      {f.desc}
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-[11px] text-zinc-400">
                    <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Terintegrasi
                    </span>
                    <button 
                      onClick={() => onOpenMapWithLayer(f.id)}
                      className="text-zinc-300 hover:text-white underline cursor-pointer"
                    >
                      Buka di Peta &rarr;
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Large Display Card with 105% Hover Scale & Floating System Analysis */}
        <div className="lg:col-span-5 relative w-full">
          <div className="relative rounded-[2rem] overflow-hidden border border-white/10 bg-zinc-950 p-2 shadow-2xl group">
            {/* Map Preview Image with 105% Scale Effect */}
            <div className="relative w-full h-[520px] rounded-[1.75rem] overflow-hidden">
              <img
                src="https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80"
                alt="Topografi Lereng Jawa Barat"
                className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700 brightness-75 contrast-125"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/20 to-transparent" />
              
              {/* Top Banner on Image */}
              <div className="absolute top-4 inset-x-4 flex items-center justify-between z-10">
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-black/60 backdrop-blur-md text-emerald-400 border border-white/10 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  Observasi Satelit Aktif
                </span>
                <span className="text-xs font-mono text-zinc-300 bg-black/60 px-2.5 py-1 rounded-full border border-white/10">
                  Kab. Cianjur &bull; Bandung Barat
                </span>
              </div>

              {/* Floating Glass "System Analysis" Component */}
              <div className="absolute bottom-4 inset-x-4 p-5 rounded-2xl glass-panel-elevated border border-white/15 z-10 text-left">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <AlertOctagon className="w-4 h-4 text-amber-400" />
                    <span className="text-xs font-bold text-white tracking-wide">
                      ANALISIS SISTEM EARLY WARNING
                    </span>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-400/10 text-amber-300 border border-amber-400/20 font-bold">
                    SIAGA LEVEL 2
                  </span>
                </div>

                <div className="space-y-3">
                  {/* Metric Progress 1 */}
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-zinc-400">Indeks Kemiringan Kritis (&gt;30°)</span>
                      <span className="font-semibold text-rose-400">78% Terpenuhi</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-amber-400 to-rose-500 rounded-full w-[78%]"></div>
                    </div>
                  </div>

                  {/* Metric Progress 2 */}
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-zinc-400">Ambang Batas Curah Hujan Kumulatif</span>
                      <span className="font-semibold text-blue-400">65% Waspada</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-teal-400 to-blue-500 rounded-full w-[65%]"></div>
                    </div>
                  </div>

                  {/* Metric Progress 3 */}
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-zinc-400">Skor Kerentanan Geologi Wilayah</span>
                      <span className="font-semibold text-emerald-400">Tinggi (Zona Selatan)</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-emerald-400 to-lime-400 rounded-full w-[85%]"></div>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-[11px] text-zinc-400">
                  <span>Validasi Data: BNPB & BMKG</span>
                  <span className="text-emerald-400 font-medium">Algoritma Weighted Overlay</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
