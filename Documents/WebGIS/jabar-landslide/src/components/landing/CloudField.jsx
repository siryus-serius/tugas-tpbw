const CLOUD = 'M10 37h94c5 0 8-3 8-7s-4-7-9-7c-2-9-9-15-18-15-7 0-13 4-16 10-3-4-8-7-14-7-9 0-16 7-17 16-3-3-7-5-12-5-8 0-15 5-16 15Z';

/** Awan garis yang melayang di belakang/depan globe (dari desain Figma). */
export default function CloudField() {
  return (
    <div className="lp-cloud-field" aria-hidden="true">
      {['one', 'two', 'three', 'four'].map((n) => (
        <svg key={n} className={`lp-cloud lp-cloud-${n}`} viewBox="0 0 120 48">
          <path d={CLOUD} />
        </svg>
      ))}
    </div>
  );
}
