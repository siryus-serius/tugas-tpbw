import React from 'react';
import { Bot, Terminal, GitBranch, BellRing, Sparkles, Send } from 'lucide-react';

export default function AutomationBlock() {
  const steps = [
    {
      num: '01',
      title: 'Pipa Ekstraksi API Satelit Otomatis',
      desc: 'GitHub Actions menjalankan cron job berkala untuk menarik data curah hujan harian CHIRPS dan anomali radar Sentinel-1 dari Google Earth Engine API.',
      tag: 'GitHub Actions Cron'
    },
    {
      num: '02',
      title: 'Pemrosesan Ambang Batas Spasial',
      desc: 'Jika curah hujan kumulatif >150 mm/hari bertemu kemiringan lereng >30°, sistem menetapkan status "Waspada / Siaga" pada desa/kecamatan terkait.',
      tag: 'Serverless Worker'
    },
    {
      num: '03',
      title: 'Diseminasi Peringatan Dini Bot Telegram',
      desc: 'Bot Telegram secara otomatis mengirim pesan instan berisi koordinat bahaya, nama desa, rekomendasi evakuasi, dan tautan langsung ke peta interaktif.',
      tag: 'Telegram Bot API'
    }
  ];

  return (
    <section className="w-full bg-[#18181B] text-white my-16 py-16 px-6 lg:px-12 border-y border-white/10 relative overflow-hidden">
      {/* Grayscale Grid Lineart Overlay */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-10"
        style={{
          backgroundImage: `linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)`,
          backgroundSize: '40px 40px'
        }}
      />

      <div className="max-w-[1600px] mx-auto relative z-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 text-left">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold mb-3">
              <Bot className="w-3.5 h-3.5" />
              <span>Arsitektur Otomatisasi Low-Cost</span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white leading-tight">
              GitHub Actions & <br />
              <span className="text-zinc-400 font-light">Bot Telegram Peringatan Dini</span>
            </h2>
          </div>
          <p className="text-sm text-zinc-400 font-light max-w-md mt-4 md:mt-0">
            Arsitektur modern tanpa sewa server mahal: memanfaatkan GitHub Actions dan Telegram Bot API untuk pembaruan data dan pengiriman notifikasi instan 100% gratis.
          </p>
        </div>

        {/* 2-Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          {/* Left Column: Numbered Steps in rounded-2xl boxes */}
          <div className="lg:col-span-6 flex flex-col gap-4 text-left">
            {steps.map((s) => (
              <div
                key={s.num}
                className="p-6 rounded-2xl bg-zinc-900/80 border border-white/10 hover:border-emerald-500/30 transition-all duration-300 group hover:translate-x-1"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="font-mono text-2xl font-black text-emerald-400 tracking-wider">
                    {s.num}
                  </span>
                  <span className="text-[10px] font-mono px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-zinc-400">
                    {s.tag}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-white group-hover:text-emerald-300 transition-colors mb-2">
                  {s.title}
                </h3>
                <p className="text-xs sm:text-sm text-zinc-400 font-light leading-relaxed">
                  {s.desc}
                </p>
              </div>
            ))}
          </div>

          {/* Right Column: 3D Transformed Mock-up Window */}
          <div className="lg:col-span-6 relative flex justify-center py-6">
            <div 
              className="w-full max-w-lg rounded-2xl bg-zinc-950/90 border border-white/15 p-5 shadow-2xl relative text-left"
              style={{
                transform: 'perspective(1000px) rotateY(-4deg) rotateX(2deg) rotateZ(1deg)',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)'
              }}
            >
              {/* Window Header */}
              <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-rose-500/80"></div>
                  <div className="w-3 h-3 rounded-full bg-amber-500/80"></div>
                  <div className="w-3 h-3 rounded-full bg-emerald-500/80"></div>
                  <span className="text-xs font-mono text-zinc-400 ml-2">github-action-telemetry.log</span>
                </div>
                <GitBranch className="w-4 h-4 text-zinc-400" />
              </div>

              {/* Terminal Code Snippet */}
              <div className="font-mono text-xs text-zinc-300 space-y-2 bg-black/60 p-4 rounded-xl border border-white/5 overflow-x-auto">
                <div className="text-emerald-400 flex items-center gap-1.5">
                  <Terminal className="w-3.5 h-3.5" />
                  <span>workflow: jabar-landslide-ews-cron.yml</span>
                </div>
                <div className="text-zinc-500">[2026-10-27 18:00:00 UTC] Trigger: schedule (0 */6 * * *)</div>
                <div className="text-zinc-300">&gt; Fetching CHIRPS rainfall raster: <span className="text-emerald-300">OK (2,840 grid points)</span></div>
                <div className="text-zinc-300">&gt; Evaluating slope threshold &gt; 25°: <span className="text-amber-300">Zona Cianjur Selatan (Triggered)</span></div>
                <div className="text-zinc-300">&gt; Formatting Telegram payload... <span className="text-blue-300">Done</span></div>
                <div className="text-emerald-400 font-semibold">&gt; Telegram Dispatch: Message sent to @JabarMitigasiAlerts</div>
              </div>

              {/* Mock Telegram Notification Bubble */}
              <div className="mt-4 p-4 rounded-xl bg-blue-950/40 border border-blue-500/30 text-xs">
                <div className="flex items-center justify-between text-blue-400 font-bold mb-1.5">
                  <span className="flex items-center gap-1.5">
                    <Send className="w-3.5 h-3.5" /> [BOT PERINGATAN DINI] JABAR EWS
                  </span>
                  <span className="text-[10px] text-zinc-400 font-normal">Baru saja</span>
                </div>
                <p className="text-zinc-200 leading-relaxed font-sans text-xs">
                  ⚠️ <b>PERINGATAN LEVEL SIAGA 2:</b> Terdeteksi akumulasi curah hujan 168 mm dalam 24 jam pada lereng 34° di Kec. Cugenang, Kab. Cianjur. Warga diimbau waspada terhadap rekahan tanah.
                </p>
              </div>

              {/* Bounce Animated Status Tag */}
              <div className="absolute -bottom-4 right-4 z-20 flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-400 text-zinc-950 font-bold text-xs shadow-lg shadow-emerald-400/30 animate-bounce">
                <BellRing className="w-3.5 h-3.5" />
                <span>Telegram Bot Active</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
