import { useState } from 'react';
import CloudField from '../components/landing/CloudField';
import RetroGlobe from '../components/landing/RetroGlobe';
import { JABAR } from '../config/constants';
import GalaxyButton from '../components/ui/GalaxyButton';
import ScrollWords from '../components/landing/ScrollWords';
import SkyToggle from '../components/ui/SkyToggle';
import usePageScroll from '../hooks/usePageScroll';

/**
 * Halaman pembuka (desain Figma "Landing Page Globe Retro", isi disesuaikan proyek).
 * Tombol "Masuk ke peta" → globe berputar & membesar ke Jawa Barat → onEnter(bagian).
 */
const SECTIONS = ['top', 'tentang', 'sumber', 'jelajah'];

function ArrowIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20">
      <path d="M4 10h11M11 5l5 5-5 5" />
    </svg>
  );
}

const fmt = (deg, pos, neg) => `${Math.abs(deg).toFixed(4)}° ${deg >= 0 ? pos : neg}`;

export default function LandingPage({ data, theme, onToggleTheme, onEnter }) {
  const { scrollTo } = usePageScroll(SECTIONS, { offset: 0 });
  const [target, setTarget] = useState(null);
  const [leaving, setLeaving] = useState(false);
  const deaths = data.allEvents.reduce((s, f) => s + (f.properties.korban_meninggal ?? 0), 0);
  const year = new Date().getFullYear();

  const enter = (section) => {
    if (target) return;
    scrollTo('top', { immediate: true });
    setTarget(section);
  };
  const arrive = () => {
    setLeaving(true);
    setTimeout(() => onEnter(target ?? 'peta'), 380);
  };

  const principles = [
    {
      number: '01',
      title: 'Kejadian nyata',
      text: `${data.allEvents.length || 41} kejadian longsor 2021–2026 dari BNPB, BPBD & media — tiap kejadian minimal dua sumber dan diperiksa otomatis setiap bulan.`,
    },
    {
      number: '02',
      title: 'Mata satelit',
      text: 'Sentinel-1 InSAR membaca pergeseran tanah hingga milimeter; Sentinel-2 memperlihatkan bekas longsor dari hilangnya vegetasi.',
    },
    {
      number: '03',
      title: 'Peringatan dini',
      text: 'Faktor Keamanan lereng, gempa BMKG terkini, dan anomali pergeseran digabung menjadi indeks kerawanan.',
    },
  ];

  return (
    <div className={`lp ${target ? 'lp-focusing' : ''} ${leaving ? 'lp-leaving' : ''}`}>
      <header className="lp-header">
        <button className="lp-brand" onClick={() => scrollTo('top')} aria-label="Longsor Jabar, kembali ke atas">
          <span className="lp-brand-mark" />
          LONGSOR JABAR
        </button>
        <nav className="lp-nav" aria-label="Navigasi utama">
          <button onClick={() => scrollTo('tentang')}>Tentang</button>
          <button onClick={() => scrollTo('sumber')}>Sumber data</button>
          <button onClick={() => enter('dashboard')}>Dashboard</button>
        </nav>
        <div className="lp-header-right">
          <SkyToggle dark={theme === 'dark'} onToggle={onToggleTheme} />
          <button className="lp-nav-cta" onClick={() => enter('peta')}>
            Jelajahi <ArrowIcon />
          </button>
        </div>
      </header>

      <section className="lp-hero" id="top">
        <CloudField />

        <div className="lp-eyebrow lp-fade">
          <span>Edisi {year}</span>
          <span>Bandung / Jawa Barat</span>
        </div>

        {/* Globe = objek utama di tengah; judul mengapit tepinya */}
        <div className="lp-stage">
          <h1 className="lp-title lp-fade">
            <span className="lp-title-a">Lereng dalam</span>
            <span className="lp-title-b">pantauan.</span>
          </h1>
          <div className="lp-globe-wrap" aria-label="Globe berputar dengan lintasan satelit Sentinel di atas Jawa Barat">
            <div className="lp-orbit lp-orbit-one lp-fade" />
            <div className="lp-orbit lp-orbit-two lp-fade" />
            <RetroGlobe events={data.events} theme={theme} focus={Boolean(target)} onArrive={arrive} />
            <div className="lp-edition-stamp lp-fade">
              <span>JABAR</span>
              <strong>’{String(year).slice(2)}</strong>
            </div>
            <div className="lp-coordinate lp-coordinate-top lp-fade">{fmt(JABAR.lat, 'N', 'S')}</div>
            <div className="lp-coordinate lp-coordinate-bottom lp-fade">{fmt(JABAR.lon, 'E', 'W')}</div>
            <div className="lp-route-legend lp-fade">
              <span>
                <i className="lp-route-key lp-route-key-s1" />
                Sentinel-1
              </span>
              <span>
                <i className="lp-route-key lp-route-key-s2" />
                Sentinel-2
              </span>
              <span>
                <i className="lp-route-key lp-route-key-event" />
                Longsor
              </span>
            </div>
          </div>
        </div>

        <div className="lp-hero-bottom lp-fade">
          <p>
            Peta kejadian longsor, pergeseran tanah dari satelit, dan gempa bumi di Jawa Barat — {deaths || '…'} korban jiwa
            tercatat sejak 2021, agar lereng berisiko terbaca lebih awal.
          </p>
          <GalaxyButton size="lg" className="lp-primary-button" onClick={() => enter('peta')}>
            Masuk ke peta <ArrowIcon />
          </GalaxyButton>
        </div>

        <p className="lp-visual-note lp-fade">
          Gerakkan kursor
          <br />
          untuk mengubah orbit
        </p>

        <div className="lp-scroll-line lp-fade">
          <span>GULIR UNTUK MENGENAL</span>
        </div>
      </section>

      <div className="lp-fade">
        <ScrollWords />
      </div>

      <section className="lp-manifesto" id="tentang">
        <div className="lp-kicker">Tentang proyek</div>
        <p>
          Bukan sekadar mencatat longsor.
          <br />
          Kami ingin <em>membacanya lebih awal.</em>
        </p>
        <div className="lp-manifesto-meta">
          <span>TPBW · {year}</span>
          <span>
            {fmt(JABAR.lat, 'N', 'S')}, {fmt(JABAR.lon, 'E', 'W')}
          </span>
        </div>
      </section>

      <section className="lp-principles" id="sumber">
        <div className="lp-section-heading">
          <span>Sumber data</span>
          <span>(03)</span>
        </div>
        <div className="lp-principle-grid">
          {principles.map((p) => (
            <article key={p.number}>
              <span className="lp-principle-number">{p.number}</span>
              <h2>{p.title}</h2>
              <p>{p.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="lp-closing" id="jelajah">
        <span className="lp-closing-orbit" />
        <p>Data diperbarui otomatis setiap bulan.</p>
        <h2>Lihat lebih dekat.</h2>
        <button onClick={() => enter('peta')}>
          Masuk ke peta <ArrowIcon />
        </button>
      </section>

      <footer className="lp-footer">
        <span>© {year} LONGSOR JABAR</span>
        <span>DIBUAT UNTUK JAWA BARAT</span>
        <button onClick={() => scrollTo('top')}>KEMBALI KE ATAS ↑</button>
      </footer>
    </div>
  );
}
