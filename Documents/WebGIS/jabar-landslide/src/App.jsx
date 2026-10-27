import React, { useState } from 'react';
import Navbar from './components/layout/Navbar';
import HeroSection from './components/home/HeroSection';
import FeatureGrid from './components/home/FeatureGrid';
import AutomationBlock from './components/home/AutomationBlock';
import BentoGrid from './components/home/BentoGrid';
import WebGISMap from './components/map/WebGISMap';
import StatsPanel from './components/panels/StatsPanel';

export default function App() {
  const [activeTab, setActiveTab] = useState('home'); // 'home' | 'map' | 'stats'
  const [selectedInitialLayer, setSelectedInitialLayer] = useState(null);

  const handleTabChange = (tabId) => {
    if (tabId === 'terkini') {
      setSelectedInitialLayer('terkini');
      setActiveTab('map');
    } else {
      if (tabId === 'map' && selectedInitialLayer === 'terkini') {
        setSelectedInitialLayer(null);
      }
      setActiveTab(tabId);
    }
  };

  const handleOpenMapWithLayer = (layerId) => {
    setSelectedInitialLayer(layerId);
    setActiveTab('map');
  };

  return (
    <div className="min-h-screen bg-black text-white relative flex flex-col font-sans selection:bg-emerald-400 selection:text-black">
      {/* Subtle Grain Overlay for texture depth */}
      <div className="grain-overlay" />

      {/* Floating Glass Navbar */}
      <Navbar activeTab={selectedInitialLayer === 'terkini' && activeTab === 'map' ? 'terkini' : activeTab} setActiveTab={handleTabChange} />

      {/* Main Content Area */}
      <main className="flex-1 w-full flex flex-col">
        {activeTab === 'home' && (
          <div className="w-full flex flex-col animate-fade-in-up">
            <HeroSection onExploreMap={(mode) => {
              if (mode === 'terkini') {
                setSelectedInitialLayer('terkini');
              } else {
                setSelectedInitialLayer(null);
              }
              setActiveTab('map');
            }} />
            <FeatureGrid onOpenMapWithLayer={handleOpenMapWithLayer} />
            <AutomationBlock />
            <BentoGrid onOpenStats={() => setActiveTab('stats')} />

            {/* Footer Section */}
            <footer className="w-full max-w-[1600px] mx-auto py-12 px-6 lg:px-12 border-t border-white/10 mt-12 flex flex-col sm:flex-row items-center justify-between text-zinc-400 text-xs gap-4">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                <span>Proyek Tugas TPBW &bull; Sistem Informasi Geografis & Peringatan Dini Longsor Jawa Barat</span>
              </div>
              <div className="flex items-center gap-6">
                <span>Data: Google Earth Engine, ESA Copernicus, BMKG, BNPB</span>
                <span>Tahun 2021–2025</span>
              </div>
            </footer>
          </div>
        )}

        {activeTab === 'map' && (
          <div className="w-full h-full animate-fade-in-up">
            <WebGISMap initialLayer={selectedInitialLayer} />
          </div>
        )}

        {/* Modal Panels */}
        {activeTab === 'stats' && (
          <StatsPanel onClose={() => setActiveTab('home')} />
        )}
      </main>

    </div>
  );
}