/**
 * Tombol mode gelap/terang bertema langit: siang (langit biru, matahari, awan) → malam
 * (langit gelap, matahari bergeser & berubah jadi bulan berkawah, awan turun, bintang muncul).
 * Seluruh animasi digerakkan satu variabel CSS --dark (0/1) dari aria-pressed. Ukuran fluid
 * mengikuti --sky-w (lihat sky-toggle.css).
 */
const STARS = [
  [12, 22, 1.4],
  [22, 58, 0.9],
  [30, 30, 1.1],
  [41, 70, 0.8],
  [47, 18, 1.3],
  [56, 48, 0.9],
  [18, 78, 1],
  [36, 46, 0.7],
];

export default function SkyToggle({ dark, onToggle, className = '' }) {
  return (
    <button
      type="button"
      className={`sky-toggle ${className}`}
      aria-pressed={dark}
      aria-label={dark ? 'Mode gelap aktif — ganti ke mode terang' : 'Mode terang aktif — ganti ke mode gelap'}
      title={dark ? 'Mode gelap (klik untuk terang)' : 'Mode terang (klik untuk gelap)'}
      onClick={onToggle}
    >
      <span className="sky-toggle__content" aria-hidden="true">
        <span className="sky-toggle__stars">
          {STARS.map(([x, y, s], i) => (
            <span key={i} className="sky-star" style={{ '--x': x, '--y': y, '--s': s, '--i': i }} />
          ))}
        </span>
        <span className="sky-toggle__clouds sky-toggle__clouds--back" />
        <span className="sky-toggle__clouds sky-toggle__clouds--front" />
        <span className="sky-toggle__indicator">
          <span className="sky-toggle__glow" />
          <span className="sky-sun">
            <span className="sky-moon">
              <span className="sky-crater" />
              <span className="sky-crater" />
              <span className="sky-crater" />
            </span>
          </span>
        </span>
      </span>
    </button>
  );
}
