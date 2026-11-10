import { useState } from 'react';

/**
 * Grafik batang satu seri (SVG), mengikuti spesifikasi dataviz:
 * batang ≤ 24 px, ujung data membulat 4 px & rata di garis dasar, celah antar-batang,
 * grid samar, label langsung hanya pada nilai tertinggi, tooltip saat hover.
 *
 * data: [{ key, label, value, detail? }]
 * orientation: 'vertical' (kolom) | 'horizontal' (baris, untuk label panjang)
 */
const BAR = 22;
const R = 4;

function niceMax(v) {
  if (v <= 5) return 5;
  const p = 10 ** Math.floor(Math.log10(v));
  return Math.ceil(v / p) * p;
}

/** Path batang dengan ujung data membulat dan pangkal (garis dasar) persegi. */
function barPath(x, y, w, h, horizontal) {
  const r = Math.min(R, horizontal ? w / 2 : h / 2, horizontal ? h / 2 : w / 2);
  if (h <= 0 || w <= 0) return '';
  if (horizontal) {
    // pangkal di kiri, ujung membulat di kanan
    return `M${x},${y} H${x + w - r} Q${x + w},${y} ${x + w},${y + r} V${y + h - r} Q${x + w},${y + h} ${x + w - r},${y + h} H${x} Z`;
  }
  // pangkal di bawah, ujung membulat di atas
  return `M${x},${y + h} V${y + r} Q${x},${y} ${x + r},${y} H${x + w - r} Q${x + w},${y} ${x + w},${y + r} V${y + h} Z`;
}

export default function BarChart({ title, data, unit, orientation = 'vertical', onSelect }) {
  const [hover, setHover] = useState(null);
  const max = niceMax(Math.max(1, ...data.map((d) => d.value)));
  const top = data.reduce((m, d) => (d.value > (m?.value ?? -1) ? d : m), null);
  const ticks = [0, max / 2, max];
  const horizontal = orientation === 'horizontal';

  const W = 560;
  const padL = horizontal ? 130 : 34;
  const padR = horizontal ? 36 : 8;
  const padT = 18;
  const rowH = BAR + 8;
  const H = horizontal ? padT + data.length * rowH + 22 : 220;
  const padB = horizontal ? 22 : 28;
  const plotW = W - padL - padR;
  const plotH = H - padT - padB;
  const slot = horizontal ? rowH : plotW / data.length;
  const scale = (v) => ((horizontal ? plotW : plotH) * v) / max;

  return (
    <figure className="chart">
      <figcaption>{title}</figcaption>
      <div className="chart-wrap">
        <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={title}>
          {/* grid samar + sumbu nilai */}
          {ticks.map((t) => {
            const p = horizontal ? padL + scale(t) : padT + plotH - scale(t);
            return horizontal ? (
              <g key={t}>
                <line x1={p} x2={p} y1={padT} y2={H - padB} className="grid" />
                <text x={p} y={H - 6} className="tick" textAnchor="middle">
                  {t}
                </text>
              </g>
            ) : (
              <g key={t}>
                <line x1={padL} x2={W - padR} y1={p} y2={p} className="grid" />
                <text x={padL - 6} y={p + 4} className="tick" textAnchor="end">
                  {t}
                </text>
              </g>
            );
          })}

          {data.map((d, i) => {
            const len = scale(d.value);
            const isTop = d === top && d.value > 0;
            let x;
            let y;
            let w;
            let h;
            if (horizontal) {
              x = padL;
              y = padT + i * rowH + (rowH - BAR) / 2;
              w = len;
              h = BAR;
            } else {
              w = Math.min(BAR, slot - 4);
              x = padL + i * slot + (slot - w) / 2;
              y = padT + plotH - len;
              h = len;
            }
            return (
              <g key={d.key}>
                <path d={barPath(x, y, w, h, horizontal)} className="bar" />
                {/* label kategori */}
                {horizontal ? (
                  <text x={padL - 8} y={y + BAR / 2 + 4} className="cat" textAnchor="end">
                    {d.label}
                  </text>
                ) : (
                  <text x={padL + i * slot + slot / 2} y={H - 10} className="cat" textAnchor="middle">
                    {d.label}
                  </text>
                )}
                {/* label langsung hanya untuk nilai tertinggi */}
                {isTop &&
                  (horizontal ? (
                    <text x={x + w + 6} y={y + BAR / 2 + 4} className="val">
                      {d.value}
                    </text>
                  ) : (
                    <text x={x + w / 2} y={y - 6} className="val" textAnchor="middle">
                      {d.value}
                    </text>
                  ))}
                {/* area hover lebih besar dari batang */}
                <rect
                  x={horizontal ? 0 : padL + i * slot}
                  y={horizontal ? padT + i * rowH : padT}
                  width={horizontal ? W : slot}
                  height={horizontal ? rowH : plotH}
                  className="hit"
                  onMouseEnter={() => setHover({ d, i })}
                  onMouseLeave={() => setHover(null)}
                  onClick={() => onSelect?.(d)}
                />
              </g>
            );
          })}
          <line
            x1={padL}
            x2={horizontal ? padL : W - padR}
            y1={horizontal ? padT : padT + plotH}
            y2={horizontal ? H - padB : padT + plotH}
            className="axis"
          />
        </svg>
        {hover && (
          <div
            className="chart-tip"
            style={
              horizontal
                ? { top: `${((padT + hover.i * rowH) / H) * 100}%`, left: '50%' }
                : { left: `${((padL + (hover.i + 0.5) * slot) / W) * 100}%`, top: '4%' }
            }
          >
            <strong>{hover.d.label}</strong>
            <span>
              {hover.d.value} {unit}
            </span>
            {hover.d.detail && <span className="muted">{hover.d.detail}</span>}
          </div>
        )}
      </div>
    </figure>
  );
}
