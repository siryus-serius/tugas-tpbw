import React from 'react';
import { ShieldCheck, Users, Home, AlertCircle, Phone, MapPin, Building } from 'lucide-react';

export default function StatsPanel({ onClose }) {
  const stats = [
    { label: 'Total Titik Kejadian Longsor', val: '142 Titik', change: '+12% musim hujan', color: 'text-rose-400' },
    { label: 'Korban Terdampak / Mengungsi', val: '2.418 Jiwa', change: 'Tersebar di 6 Kab.', color: 'text-amber-400' },
    { label: 'Kerusakan Rumah & Fasum', val: '385 Unit', change: '74 Rusak Berat', color: 'text-blue-400' },
    { label: 'Posko Siaga & Dapur Umum', val: '48 Lokasi', change: '100% Beroperasi', color: 'text-emerald-400' },
  ];

  const emergencyContacts = [
    { name: 'Pusdalops BPBD Provinsi Jawa Barat', phone: '0821-2672-8888', loc: 'Kota Bandung' },
    { name: 'Basarnas Kantor SAR Bandung', phone: '022-7780437', loc: 'Cicalengka, Kab. Bandung' },
    { name: 'BPBD Kab. Cianjur (Posko Utama)', phone: '0263-2280200', loc: 'Kabupaten Cianjur' },
    { name: 'BPBD Kab. Bandung Barat', phone: '022-82783000', loc: 'Ngamprah, KBB' },
    { name: 'BPBD Kab. Sukabumi (Siaga 24 Jam)', phone: '0266-243111', loc: 'Cikembar, Sukabumi' },
  ];

  return (
    <div className="fixed inset-0 z-[1200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in-up text-left">
      <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-3xl glass-panel-elevated border border-white/15 p-6 sm:p-8 shadow-2xl text-white">
        <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-6">
          <div>
            <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold mb-1">
              <ShieldCheck className="w-4 h-4" />
              <span>DASHBOARD STATISTIK & REKAPITULASI BENCANA</span>
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-white">
              Data Mitigasi & Direktori Posko Darurat
            </h2>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-zinc-300 hover:text-white transition-colors cursor-pointer text-lg font-bold"
          >
            &times;
          </button>
        </div>

        {/* 4 Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {stats.map((s, i) => (
            <div key={i} className="p-4 rounded-2xl glass-card border border-white/10">
              <div className="text-[11px] font-medium text-zinc-400 mb-1">{s.label}</div>
              <div className={`text-2xl font-black ${s.color} tracking-tight mb-1`}>{s.val}</div>
              <div className="text-[11px] text-zinc-400">{s.change}</div>
            </div>
          ))}
        </div>

        {/* Emergency Contacts Table */}
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-emerald-400 mb-3 flex items-center gap-2">
            <Phone className="w-4 h-4" />
            <span>Narahubung Cepat Posko Tanggap Bencana (24 Jam)</span>
          </h3>
          <div className="divide-y divide-white/5 rounded-2xl bg-white/[0.03] border border-white/10 overflow-hidden">
            {emergencyContacts.map((c, i) => (
              <div key={i} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-white/[0.04] transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                    <Building className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-semibold text-sm text-white">{c.name}</div>
                    <div className="text-xs text-zinc-400 flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-zinc-400" /> {c.loc}
                    </div>
                  </div>
                </div>
                <a
                  href={`tel:${c.phone}`}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 text-xs font-semibold self-start sm:self-auto transition-colors"
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>{c.phone}</span>
                </a>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-white/10 text-right">
          <button
            onClick={onClose}
            className="px-6 py-2 rounded-full bg-white text-zinc-900 font-semibold text-xs hover:bg-zinc-200 transition-colors cursor-pointer"
          >
            Tutup Panel
          </button>
        </div>
      </div>
    </div>
  );
}
