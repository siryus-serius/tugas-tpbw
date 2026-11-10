import { useState } from 'react';
import { cropUrl, sceneDate } from '../../utils/sentinelImagery';

function SceneThumb({ src, label, sub }) {
  const [failed, setFailed] = useState(false);
  return (
    <figure className="thumb">
      {src && !failed ? (
        <img src={src} alt={label} loading="lazy" onError={() => setFailed(true)} />
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

/** Perbandingan citra sebelum/sesudah. `pre`/`post`: objek scene {id} atau string ID. */
export default function PrePostImagery({ title, kind, pre, post, coord, delta, note }) {
  const preId = pre?.id ?? pre;
  const postId = post?.id ?? post;
  return (
    <div className="prepost">
      <h3>{title}</h3>
      <div className="pair">
        <SceneThumb src={cropUrl(kind, preId, coord, delta)} label="Sebelum" sub={sceneDate(preId)} />
        <SceneThumb src={cropUrl(kind, postId, coord, delta)} label="Sesudah" sub={sceneDate(postId)} />
      </div>
      {note && <p className="muted small">{note}</p>}
    </div>
  );
}
