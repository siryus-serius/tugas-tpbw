import { useState } from 'react';
import { PRESET_BY_KEY, cropUrl, sceneDate } from '../../utils/sentinelImagery';
import CompareViewer from '../compare/CompareViewer';

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
 * Thumbnail sebelum/sesudah. Klik → penampil perbandingan (geser/zoom, Wayback resolusi tinggi,
 * semua produk Sentinel, sorotan kehilangan vegetasi).
 * compare: { scenes: {s2, s1}, period: {before, after} }
 */
export default function PrePostImagery({ title, preset, pre, post, coord, delta = 0.015, note, movement, compare }) {
  const [open, setOpen] = useState(false);
  const preId = pre?.id ?? pre;
  const postId = post?.id ?? post;

  return (
    <div className="prepost">
      <h3>
        {title} <span className="muted small">· klik untuk memperbesar</span>
      </h3>
      <div className="pair">
        <SceneThumb src={cropUrl(preset, preId, coord, delta)} label="Sebelum" sub={sceneDate(preId)} onOpen={() => setOpen(true)}>
        </SceneThumb>
        <SceneThumb src={cropUrl(preset, postId, coord, delta)} label="Sesudah" sub={sceneDate(postId)} onOpen={() => setOpen(true)}>
        </SceneThumb>
      </div>
      {note && <p className="muted small">{note}</p>}
      {open && (
        <CompareViewer
          title={title}
          coord={coord}
          scenes={compare.scenes}
          period={compare.period}
          movement={movement}
          initialSource={PRESET_BY_KEY[preset] ? preset : undefined}
          onClose={() => setOpen(false)}
        />
      )}
    </div>
  );
}
