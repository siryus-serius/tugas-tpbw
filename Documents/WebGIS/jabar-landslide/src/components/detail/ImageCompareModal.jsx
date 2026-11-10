import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { PRESET_BY_KEY, cropUrl, presetsFor, rawTifUrl, sceneDate } from '../../utils/sentinelImagery';
import DirectionOverlay from './DirectionOverlay';

const SIZE = 768;

function groupBy(list) {
  return list.reduce((acc, p) => ({ ...acc, [p.group]: [...(acc[p.group] || []), p] }), {});
}

/**
 * Perbandingan besar sebelum/sesudah: mode berdampingan atau geser (swipe),
 * pilihan produk Sentinel (sesuai sensor scene), panah arah geseran, unduh band mentah.
 */
export default function ImageCompareModal({ title, sensor, initialPreset, pre, post, coord, delta, movement, onClose }) {
  const [presetKey, setPresetKey] = useState(initialPreset);
  const [mode, setMode] = useState('swipe');
  const [split, setSplit] = useState(50);
  const [showArrows, setShowArrows] = useState(true);
  const preset = PRESET_BY_KEY[presetKey];
  const view = delta * 1.6; // sedikit lebih luas dari thumbnail
  const preUrl = cropUrl(presetKey, pre, coord, view, SIZE);
  const postUrl = cropUrl(presetKey, post, coord, view, SIZE);
  const km = (view * 2 * 111).toFixed(1);

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const overlay = showArrows && <DirectionOverlay movement={movement} />;

  // Portal ke <body>: popup Leaflet memakai transform, jadi posisi fixed harus di luar peta
  return createPortal(
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" role="dialog" aria-modal="true" aria-label={title} onClick={(e) => e.stopPropagation()}>
        <header className="modal-head">
          <div>
            <h3>{title}</h3>
            <p className="muted small">
              Sebelum {sceneDate(pre)} · Sesudah {sceneDate(post)} · cakupan ±{km} km, utara ke atas
            </p>
          </div>
          <button className="close" onClick={onClose} aria-label="Tutup">
            ×
          </button>
        </header>

        <div className="modal-tools">
          <select value={presetKey} onChange={(e) => setPresetKey(e.target.value)} aria-label="Produk citra">
            {Object.entries(groupBy(presetsFor(sensor))).map(([group, list]) => (
              <optgroup key={group} label={group}>
                {list.map((p) => (
                  <option key={p.key} value={p.key}>
                    {p.label}
                    {p.rawBand ? ` — ${p.note}` : ''}
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
            <label className="toggle small">
              <input type="checkbox" checked={showArrows} onChange={() => setShowArrows((v) => !v)} /> Panah arah
            </label>
          )}
        </div>

        {mode === 'swipe' ? (
          <div className="swipe">
            <div className="swipe-stage">
              <img src={postUrl} alt="Sesudah" />
              <img src={preUrl} alt="Sebelum" className="swipe-top" style={{ clipPath: `inset(0 ${100 - split}% 0 0)` }} />
              <div className="swipe-line" style={{ left: `${split}%` }} />
              <span className="swipe-tag left">Sebelum</span>
              <span className="swipe-tag right">Sesudah</span>
              {overlay}
            </div>
            <input
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
              ['Sebelum', preUrl, pre],
              ['Sesudah', postUrl, post],
            ].map(([label, url, id]) => (
              <figure key={label} className="swipe-stage">
                {url ? <img src={url} alt={label} /> : <div className="thumb-empty">tidak ada scene</div>}
                {overlay}
                <figcaption>
                  {label} · {sceneDate(id)}
                </figcaption>
              </figure>
            ))}
          </div>
        )}

        <footer className="modal-foot small">
          <p className="muted">{preset?.note}</p>
          {movement && (
            <p>
              <strong>{movement.headline}.</strong> {movement.detail}
              {movement.look != null && ' Panah biru putus-putus = arah pandang satelit Sentinel-1.'}
            </p>
          )}
          {preset?.rawBand && (
            <p>
              Unduh band {preset.rawBand} (GeoTIFF, reflektansi asli ×10⁴):{' '}
              <a href={rawTifUrl(presetKey, pre, coord, view)} target="_blank" rel="noreferrer">
                sebelum
              </a>{' '}
              ·{' '}
              <a href={rawTifUrl(presetKey, post, coord, view)} target="_blank" rel="noreferrer">
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
