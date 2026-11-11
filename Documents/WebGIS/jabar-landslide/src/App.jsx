import { useState } from 'react';
import TopoBackground from './components/ui/TopoBackground';
import useTheme from './hooks/useTheme';
import useWebgisData from './hooks/useWebgisData';
import LandingPage from './pages/LandingPage';
import MapPage from './pages/MapPage';

const APP_SECTIONS = ['peta', 'dashboard', 'kejadian', 'validasi', 'metodologi'];
const hashSection = () => {
  const h = window.location.hash.slice(1);
  return APP_SECTIONS.includes(h) ? h : null;
};

/**
 * Akar aplikasi: memuat data & tema sekali, lalu memilih halaman.
 * - halaman pembuka (globe) tampil lebih dulu
 * - tautan langsung (#peta, #dashboard, …) melewati halaman pembuka
 */
export default function App() {
  const data = useWebgisData();
  const { theme, toggleTheme } = useTheme();
  const [section, setSection] = useState(hashSection); // null = halaman pembuka

  const enter = (target) => {
    window.history.replaceState(null, '', `#${target}`);
    window.scrollTo(0, 0);
    setSection(target);
  };
  const home = () => {
    window.history.replaceState(null, '', window.location.pathname);
    window.scrollTo(0, 0);
    setSection(null);
  };

  return (
    <>
      <TopoBackground />
      {section ? (
        <MapPage data={data} theme={theme} onToggleTheme={toggleTheme} initialSection={section} onHome={home} />
      ) : (
        <LandingPage data={data} theme={theme} onToggleTheme={toggleTheme} onEnter={enter} />
      )}
    </>
  );
}
