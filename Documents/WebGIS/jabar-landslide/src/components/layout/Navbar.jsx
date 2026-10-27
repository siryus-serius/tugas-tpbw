import React from 'react';
import { MapPin, Layers, BarChart3, ShieldAlert } from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab }) {
  const navItems = [
    { id: 'home', label: 'Beranda', icon: ShieldAlert },
    { id: 'terkini', label: 'Peta Terkini (Live)', icon: Layers, isLive: true },
    { id: 'map', label: 'Arsip & Layer', icon: Layers },
    { id: 'stats', label: 'Statistik & Posko', icon: BarChart3 },
  ];

  return (
    <header className="fixed top-5 inset-x-0 z-[1000] flex justify-center px-4 pointer-events-none">
      <nav className="pointer-events-auto flex items-center justify-between gap-4 px-3 py-2 rounded-full glass-nav shadow-2xl max-w-4xl w-full border border-white/10 transition-all duration-300">
        {/* Brand / Logo */}
        <div 
          onClick={() => setActiveTab('home')} 
          className="flex items-center gap-2.5 pl-3 cursor-pointer group"
        >
          <div className="w-8 h-8 rounded-full bg-emerald-500/10 border border-emerald-400/30 flex items-center justify-center text-emerald-400 group-hover:scale-105 transition-transform">
            <MapPin className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-bold tracking-tight text-white group-hover:text-emerald-400 transition-colors">
              JABAR<span className="text-emerald-400">LANDSLIDE</span>
            </span>
            <span className="text-[10px] text-zinc-400 font-mono tracking-wider uppercase">
              EWS 2021–2026
            </span>
          </div>
        </div>

        {/* Navigation Links */}
        <div className="flex items-center gap-1 bg-white/[0.03] p-1 rounded-full border border-white/5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id || (item.id === 'terkini' && activeTab === 'map' && false);
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 cursor-pointer ${
                  item.isLive
                    ? activeTab === 'terkini'
                      ? 'bg-rose-600 text-white font-bold shadow-lg shadow-rose-600/30'
                      : 'text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 font-semibold'
                    : isActive
                      ? 'bg-emerald-400 text-zinc-950 font-semibold shadow-md shadow-emerald-400/20'
                      : 'text-zinc-300 hover:text-white hover:bg-white/10'
                }`}
              >
                {item.isLive && (
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                  </span>
                )}
                {!item.isLive && <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-zinc-950' : 'text-zinc-400'}`} />}
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Live Status Badge */}
        <div className="hidden sm:flex items-center gap-2 pr-2">
          <div 
            onClick={() => setActiveTab('terkini')}
            className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/60 hover:bg-emerald-900/60 border border-emerald-500/30 text-[11px] font-medium text-emerald-300 cursor-pointer transition-colors"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Sistem Siaga Live</span>
          </div>
        </div>
      </nav>
    </header>
  );
}
