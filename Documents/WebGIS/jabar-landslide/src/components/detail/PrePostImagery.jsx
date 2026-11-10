import { useState } from 'react';
import { PRESET_BY_KEY, cropUrl, sceneDate } from '../../utils/sentinelImagery';
import DirectionOverlay from './DirectionOverlay';
import ImageCompareModal from './ImageCompareModal';

function SceneThumb({ src, label, sub, onOpen, children }) {
  const [failed, setFailed] = useState(false);
  return (
    <figure className="thumb">
      {src && !failed ? (
        <button className="thumb-btn" onClick={onOpen} title="Klik untuk memperbesar & membandingkan">
          <img src={src} alt={label} loading="lazy" onError={() => setFailed(true)} />
          {children}
        </button>
      ) : (
        <div className="thumb-empty">{src ? 'gagal dimuat' : 'tidak ada scene'}</div>
      )}
      <figcaption>
        {label}
        {sub && <span className="muted"> · {sub}</span>}
      </figcaption>
    </figure>
  );
}

/**
 * Perbandingan citra sebelum/sesudah (thumbnail). Klik → tampilan besar dengan geser/berdampingan,
 * pilihan produk Sentinel, dan panah arah geseran.
 * `pre`/`post`: objek scene {id} atau string ID. `preset`: kunci PRESETS.
 */
export default function PrePostImagery({ title, preset, pre, post, coord, delta = 0.015, note, movement }) {
  const [open, setOpen] = useState(false);
  const preId = pre?.id ?? pre;
  const postId = post?.id ?? post;
  const sensor = PRESET_BY_KEY[preset].sensor;
  const arrows = <DirectionOverlay movement={movement} />;

  return (
    <div className="prepost">
      <h3>
        {title} <span className="muted small">· klik gambar untuk memperbesar</span>
      </h3>
      <div className="pair">
        <SceneThumb src={cropUrl(preset, preId, coord, delta)} label="Sebelum" sub={sceneDate(preId)} onOpen={() => setOpen(true)}>
          {arrows}
        </SceneThumb>
        <SceneThumb src={cropUrl(preset, postId, coord, delta)} label="Sesudah" sub={sceneDate(postId)} onOpen={() => setOpen(true)}>
          {arrows}
        </SceneThumb>
      </div>
      {note && <p className="muted small">{note}</p>}
      {open && (
        <ImageCompareModal
          title={title}
          sensor={sensor}
          initialPreset={preset}
          pre={preId}
          post={postId}
          coord={coord}
          delta={delta}
          movement={movement}
          onClose={() => setOpen(false)}
        />
      )}
    </div>
  );
}
