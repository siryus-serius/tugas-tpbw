import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { ImageOverlay, MapContainer, Pane, TileLayer } from 'react-leaflet';
import { computeVegetationLoss } from '../../services/changeApi';
import { waybackPair } from '../../services/waybackApi';
import { PRESET_BY_KEY, itemTileUrl, presetsFor, rawTifUrl, sceneDate } from '../../utils/sentinelImagery';
import Checkbox from '../ui/Checkbox';
import { DirectionMarker, SwipeClip, SyncView } from './mapParts';

const WAYBACK = 'wayback';
const LOSS_DELTA = 0.025; // area analisis kehilangan vegetasi ±0,025° (±2,8 km)

/** Daftar sumber citra yang tersedia untuk titik ini (Wayback + preset S2/S1 yang punya scene). */
function useSources(scenes) {
  return useMemo(() => {
    const groups = [{ label: 'Resolusi tinggi', items: [{ key: WAYBACK, label: 'Esri Wayback (±0,3–0,6 m)' }] }];
    for (const [sensor, label] of [
      ['s2', 'Sentinel-2 (10 m)'],
      ['s1', 'Sentinel-1 radar (10 m)'],
    ]) {
      if (scenes[sensor]?.pre || scenes[sensor]?.post) {
        groups.push({ label, items: presetsFor(sensor).map((p) => ({ key: p.key, label: p.rawBand ? `${p.label} — ${p.note}` : p.label })) });
      }
    }
    return groups;
  }, [scenes]);
}

/**
 * Penampil perbandingan sebelum/sesudah yang bisa digeser & di-zoom:
 * Esri Wayback resolusi tinggi atau Sentinel-1/2 (semua preset), mode geser/berdampingan,
 * sorotan kehilangan vegetasi (dNDVI Sentinel-2), dan panah arah lereng.
 *
 * scenes: { s2: {pre, post}, s1: {pre, post} } (objek scene {id} atau string ID)
 * period: { before, after } tanggal acuan YYYY-MM-DD untuk memilih rilis Wayback
 */
export default function CompareViewer({ title, coord, scenes, period, movement, initialSource, onClose }) {
  const sources = useSources(scenes);
  const [source, setSource] = useState(initialSource ?? WAYBACK);
  const [mode, setMode] = useState('swipe');
  const [split, setSplit] = useState(50);
  const [showArrows, setShowArrows] = useState(true);
  const [showLoss, setShowLoss] = useState(false);
  const [wayback, setWayback] = useState(null);
  const [loss, setLoss] = useState({ status: 'idle' });
  const [group] = useState(() => ({ maps: new Set(), syncing: false }));
  const [lng, lat] = coord;

  const id = (sensor, k) => scenes[sensor]?.[k]?.id ?? scenes[sensor]?.[k] ?? null;
  const s2pre = id('s2', 'pre');
  const s2post = id('s2', 'post');

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  useEffect(() => {
    waybackPair(period.before, period.after).then(setWayback, (err) => setWayback({ error: err.message }));
  }, [period.before, period.after]);

  // Hitung kehilangan vegetasi sekali, saat sorotan pertama kali diaktifkan
  const toggleLoss = () => {
    setShowLoss((v) => !v);
    if (loss.status !== 'idle' || !s2pre || !s2post) return;
    setLoss({ status: 'loading' });
    computeVegetationLoss({ preId: s2pre, postId: s2post, coord, delta: LOSS_DELTA })
      .then((data) => setLoss({ status: 'ready', data }))
      .catch((err) => setLoss({ status: 'error', error: err.message }));
  };

  // Lapisan sebelum/sesudah sesuai sumber
  let layers;
  if (source === WAYBACK) {
    layers = {
      pre: wayback?.pre && { url: wayback.pre.url, label: `rilis ${wayback.pre.date}`, maxNative: 19 },
      post: wayback?.post && { url: wayback.post.url, label: `rilis ${wayback.post.date}`, maxNative: 19 },
    };
  } else {
    const sensor = PRESET_BY_KEY[source].sensor;
    const mk = (k) => id(sensor, k) && { url: itemTileUrl(source, id(sensor, k)), label: sceneDate(id(sensor, k)), maxNative: 14 };
    layers = { pre: mk('pre'), post: mk('post') };
  }
  const preset = PRESET_BY_KEY[source];

  const overlays = (
    <>
      {showLoss && loss.status === 'ready' && (
        <Pane name="loss" style={{ zIndex: 460 }}>
          <ImageOverlay url={loss.data.dataUrl} bounds={loss.data.bounds} className="pixelated" />
        </Pane>
      )}
      {showArrows && movement && <DirectionMarker coord={coord} movement={movement} />}
    </>
  );

  const mapProps = { center: [lat, lng], zoom: 15, minZoom: 11, maxZoom: 19, className: 'compare-map', attributionControl: true };
  const tile = (l, pane) =>
    l && (
      <TileLayer
        key={l.url}
        url={l.url}
        pane={pane}
        maxNativeZoom={l.maxNative}
        maxZoom={19}
        attribution={source === WAYBACK ? 'Esri World Imagery Wayback' : 'Copernicus Sentinel data, Microsoft Planetary Computer'}
      />
    );

  return createPortal(
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal modal-wide" role="dialog" aria-modal="true" aria-label={title} onClick={(e) => e.stopPropagation()}>
        <header className="modal-head">
          <div>
            <h3>{title}</h3>
            <p className="muted small">
              Sebelum: {layers.pre?.label ?? 'tidak ada'} · Sesudah: {layers.post?.label ?? 'tidak ada'} · geser &amp; scroll
              untuk zoom
            </p>
          </div>
          <button className="close" onClick={onClose} aria-label="Tutup">
            ×
          </button>
        </header>

        <div className="modal-tools">
          <select value={source} onChange={(e) => setSource(e.target.value)} aria-label="Sumber citra">
            {sources.map((g) => (
              <optgroup key={g.label} label={g.label}>
                {g.items.map((it) => (
                  <option key={it.key} value={it.key}>
                    {it.label}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
          <div className="seg">
            <button className={mode === 'swipe' ? 'active' : ''} onClick={() => setMode('swipe')}>
              Geser
            </button>
            <button className={mode === 'side' ? 'active' : ''} onClick={() => setMode('side')}>
              Berdampingan
            </button>
          </div>
          {movement && (
            <Checkbox checked={showArrows} onChange={() => setShowArrows((v) => !v)}>
              Panah arah
            </Checkbox>
          )}
          {s2pre && s2post && (
            <Checkbox checked={showLoss} onChange={toggleLoss}>
              Sorot kehilangan vegetasi
            </Checkbox>
          )}
        </div>

        {mode === 'swipe' ? (
          <div className="compare-stage">
            <MapContainer {...mapProps}>
              <Pane name="post" style={{ zIndex: 400 }}>
                {tile(layers.post, 'post')}
              </Pane>
              <Pane name="pre" style={{ zIndex: 410 }}>
                {tile(layers.pre, 'pre')}
              </Pane>
              <SwipeClip split={split} />
              {overlays}
            </MapContainer>
            <div className="swipe-line" style={{ left: `${split}%` }} />
            <span className="swipe-tag left">Sebelum</span>
            <span className="swipe-tag right">Sesudah</span>
            <input
              className="swipe-range"
              type="range"
              min="0"
              max="100"
              value={split}
              onChange={(e) => setSplit(Number(e.target.value))}
              aria-label="Geser perbandingan"
            />
          </div>
        ) : (
          <div className="side">
            {[
              ['Sebelum', layers.pre],
              ['Sesudah', layers.post],
            ].map(([label, l]) => (
              <div key={label} className="compare-stage">
                <MapContainer {...mapProps}>
                  {tile(l, 'tilePane')}
                  <SyncView group={group} />
                  {overlays}
                </MapContainer>
                <span className="swipe-tag left">
                  {label} · {l?.label ?? 'tidak ada'}
                </span>
              </div>
            ))}
          </div>
        )}

        <footer className="modal-foot small">
          {source === WAYBACK ? (
            <p className="muted">
              Esri Wayback: citra resolusi tinggi (umumnya ±0,3–0,6 m). Tanggal adalah tanggal <b>rilis</b> mosaik, bukan tanggal
              pemotretan di lokasi ini — pastikan citra &quot;sesudah&quot; memang diambil setelah kejadian
              {period.after ? ` (${period.after})` : ''}.
              {wayback?.error && <span className="error"> Gagal memuat Wayback: {wayback.error}</span>}
              {wayback && !wayback.error && !wayback.post && ' Belum ada rilis setelah tanggal kejadian.'}
            </p>
          ) : (
            <p className="muted">{preset?.note}</p>
          )}
          {showLoss && (
            <p>
              {loss.status === 'loading' && 'Menghitung kehilangan vegetasi (Sentinel-2)…'}
              {loss.status === 'error' && <span className="error">Gagal: {loss.error}</span>}
              {loss.status === 'ready' && (
                <>
                  <strong>Merah = kehilangan vegetasi</strong> (NDVI turun ≥ 0,25 dari lahan bervegetasi) antara{' '}
                  {sceneDate(s2pre)} dan {sceneDate(s2post)}: total ±{loss.data.lossHa} ha, bercak terbesar ±
                  {loss.data.largestHa} ha. Piksel awan/bayangan dibuang ({Math.round((1 - loss.data.validFrac) * 100)}%
                  area). Bercak memanjang searah lereng = indikasi kuat bekas longsor; petak persegi umumnya panen/pembukaan
                  lahan.
                </>
              )}
            </p>
          )}
          {movement && (
            <p>
              <strong>{movement.headline}.</strong> {movement.detail}
              {movement.look != null && ' Panah biru putus-putus = arah pandang satelit Sentinel-1.'}
            </p>
          )}
          {preset?.rawBand && (
            <p>
              Unduh band {preset.rawBand} (GeoTIFF, reflektansi asli):{' '}
              <a href={rawTifUrl(source, id('s2', 'pre'), coord, LOSS_DELTA)} target="_blank" rel="noreferrer">
                sebelum
              </a>{' '}
              ·{' '}
              <a href={rawTifUrl(source, id('s2', 'post'), coord, LOSS_DELTA)} target="_blank" rel="noreferrer">
                sesudah
              </a>
            </p>
          )}
        </footer>
      </div>
    </div>,
    document.body
  );
}

