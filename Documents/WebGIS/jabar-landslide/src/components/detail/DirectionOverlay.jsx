/**
 * Overlay SVG di atas citra (utara ke atas): panah arah lereng turun dari titik pusat, dan
 * (untuk anomali) panah putus-putus arah pandang satelit. Lingkaran = lokasi titik.
 */
const Arrow = ({ deg, length, color, dashed, label }) => {
  const r = (deg * Math.PI) / 180;
  const x2 = 50 + length * Math.sin(r);
  const y2 = 50 - length * Math.cos(r);
  const id = `head-${color.replace('#', '')}`;
  return (
    <g>
      <defs>
        <marker id={id} viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
          <path d="M0,0 L10,5 L0,10 z" fill={color} />
        </marker>
      </defs>
      <line
        x1="50"
        y1="50"
        x2={x2}
        y2={y2}
        stroke={color}
        strokeWidth="1.6"
        strokeDasharray={dashed ? '3 2' : undefined}
        markerEnd={`url(#${id})`}
        vectorEffect="non-scaling-stroke"
      />
      {label && (
        <text x={x2} y={y2 - 2} fill={color} fontSize="4" textAnchor="middle" paintOrder="stroke" stroke="#000" strokeWidth="0.8">
          {label}
        </text>
      )}
    </g>
  );
};

export default function DirectionOverlay({ movement }) {
  if (!movement) return null;
  const { aspect, look, consistent } = movement;
  const color = consistent === false ? '#facc15' : '#ef4444';
  return (
    <svg className="direction-overlay" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
      <circle cx="50" cy="50" r="4" fill="none" stroke="#fff" strokeWidth="1" vectorEffect="non-scaling-stroke" />
      {look != null && <Arrow deg={look} length={22} color="#22d3ee" dashed label="pandang satelit" />}
      <Arrow deg={aspect} length={30} color={color} label="lereng turun" />
      <text x="94" y="8" fill="#fff" fontSize="5" textAnchor="middle" paintOrder="stroke" stroke="#000" strokeWidth="0.8">
        U ↑
      </text>
    </svg>
  );
}
