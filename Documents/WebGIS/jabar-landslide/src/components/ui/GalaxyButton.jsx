/**
 * Tombol "galaxy": latar tinta gelap, garis kilau beraksen yang mengitari tepi, bintang statis
 * berkelip, dan cincin bintang yang berputar saat disorot. Warna mengikuti token tema
 * (--galaxy-* di galaxy-button.css). `size`: 'sm' (navbar) | 'lg' (halaman pembuka).
 */

// Cincin bintang: sudut, jarak dari pusat (% lebar), ukuran (px), durasi putar (s) — tetap, bukan acak,
// agar tampilan stabil antar-render.
const RING = Array.from({ length: 20 }, (_, i) => ({
  angle: (i * 360) / 20 + (i % 3) * 7,
  distance: 18 + ((i * 37) % 30),
  size: 1 + (i % 3) * 0.6,
  duration: 6 + ((i * 13) % 9),
}));

const STATIC = [
  [12, 30],
  [32, 72],
  [70, 26],
  [88, 66],
];

export default function GalaxyButton({ children, size = 'sm', className = '', ...props }) {
  return (
    <div className={`galaxy-button galaxy-button--${size} ${className}`}>
      <button type="button" {...props}>
        <span className="spark" aria-hidden="true" />
        <span className="backdrop" aria-hidden="true" />
        <span className="galaxy__container" aria-hidden="true">
          {STATIC.map(([x, y], i) => (
            <span key={i} className="star star--static" style={{ '--x': x, '--y': y, '--i': i }} />
          ))}
        </span>
        <span className="galaxy" aria-hidden="true">
          <span className="galaxy__ring">
            {RING.map((s, i) => (
              <span
                key={i}
                className="star"
                style={{ '--angle': s.angle, '--distance': s.distance, '--size': s.size, '--duration': s.duration }}
              />
            ))}
          </span>
        </span>
        <span className="text">{children}</span>
      </button>
      <div className="bodydrop" aria-hidden="true" />
    </div>
  );
}
