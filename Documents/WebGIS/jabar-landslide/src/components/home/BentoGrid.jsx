import React from 'react';
import { ShieldCheck, HeartPulse, Flame, ArrowUpRight, PhoneCall, Building2 } from 'lucide-react';

export default function BentoGrid({ onOpenStats }) {
  const cards = [
    {
      id: 'posko',
      title: 'Posko Siaga SAR & BPBD',
      badge: 'Respon Cepat',
      img: 'https://images.unsplash.com/photo-1541872703-74c5e44368f9?auto=format&fit=crop&w=600&q=80',
      desc: 'Direktori pos komando tanggap darurat bencana longsor tingkat provinsi dan kabupaten/kota lengkap dengan narahubung 24 jam.',
      icon: ShieldCheck,
      stat: '48 Posko Aktif',
      actionText: 'Lihat Daftar Posko',
      color: 'text-emerald-600'
    },
    {
      id: 'medis',
      title: 'Fasilitas Medis & RS Rujukan',
      badge: 'Layanan Darurat',
      img: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=600&q=80',
      desc: 'Pemetaan fasilitas kesehatan, Puskesmas DTP, dan Rumah Sakit rujukan terdekat dengan koordinat spasial dan ambulans siaga.',
      icon: HeartPulse,
      stat: '112 Unit RS / Puskesmas',
      actionText: 'Cari Rumah Sakit',
      color: 'text-rose-600'
    },
    {
      id: 'damkar',
      title: 'Pemadam Kebakaran & Evakuasi',
      badge: 'Unit Penyelamatan',
      img: 'https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&w=600&q=80',
      desc: 'Regu evakuasi Damkar dan tim penyelamatan alat berat di wilayah perbukitan terjal dan akses rawan terputus.',
      icon: Flame,
      stat: '34 Regu Siaga',
      actionText: 'Kontak Tim Evakuasi',
      color: 'text-amber-600'
    }
  ];

  return (
    <section className="w-full max-w-[1600px] mx-auto my-16 px-6 lg:px-12 text-left">
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-10">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-emerald-400 block mb-2">
            Mitigasi & Kesiapsiagaan
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-white leading-tight">
            Direktori Layanan Darurat & <br />
            <span className="text-zinc-400 font-light">Posko Lapangan</span>
          </h2>
        </div>
        <p className="text-sm text-zinc-400 font-light max-w-md mt-4 md:mt-0">
          Akses cepat informasi kontak penting dan lokasi fasilitas vital saat terjadi kondisi darurat tanah longsor.
        </p>
      </div>

      {/* 3-Column Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <div
              key={c.id}
              className="bg-white rounded-[2rem] overflow-hidden border border-zinc-100 shadow-xl flex flex-col justify-between group hover:-translate-y-1.5 transition-all duration-300"
            >
              {/* Top Half: 120px height image with a gradient-to-black bottom overlay */}
              <div className="relative w-full h-32 overflow-hidden">
                <img
                  src={c.img}
                  alt={c.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                <div className="absolute top-3 left-4">
                  <span className="px-3 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase bg-white/90 backdrop-blur-md text-zinc-900 shadow">
                    {c.badge}
                  </span>
                </div>
                <div className="absolute bottom-3 left-4 text-white font-mono text-xs font-semibold flex items-center gap-1.5">
                  <Icon className="w-4 h-4 text-emerald-400" />
                  <span>{c.stat}</span>
                </div>
              </div>

              {/* Bottom Half: Padding 1.5rem, secondary text, and full-width action button */}
              <div className="p-6 flex flex-col flex-grow justify-between bg-white text-zinc-900">
                <div>
                  <h3 className="text-lg font-bold text-zinc-900 tracking-tight mb-2 group-hover:text-emerald-700 transition-colors">
                    {c.title}
                  </h3>
                  <p className="text-xs text-zinc-500 font-normal leading-relaxed mb-6">
                    {c.desc}
                  </p>
                </div>

                <button
                  onClick={onOpenStats}
                  className="w-full py-2.5 px-4 rounded-full bg-zinc-900 text-white hover:bg-zinc-800 text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer group-hover:bg-emerald-600"
                >
                  <span>{c.actionText}</span>
                  <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
