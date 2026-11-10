/**
 * Interpretasi arah geseran dari InSAR (1 geometri LOS) dengan asumsi gerak searah lereng turun
 * (slope-parallel flow, umum untuk longsor; mis. Notti et al. 2014).
 *
 * Vektor satuan tanah→satelit (ENU) untuk SAR right-looking:
 *   arah pandang φ = heading + 90°;  los = (−sinθ·sinφ, −sinθ·cosφ, cosθ)
 * Vektor gerak searah lereng turun (aspek A, kemiringan β):
 *   s = (sinA·cosβ, cosA·cosβ, −sinβ)
 * d_LOS = V · (s·los) → V = d_LOS / (s·los). Konvensi tanda LiCSBAS: d_LOS positif = mendekati satelit.
 */
const rad = (d) => (d * Math.PI) / 180;

export function losVector({ heading, incidence }) {
  const look = rad(heading + 90);
  const t = rad(incidence);
  return [-Math.sin(t) * Math.sin(look), -Math.sin(t) * Math.cos(look), Math.cos(t)];
}

export function downslopeProjection(aspectDeg, slopeDeg, geometry) {
  const a = rad(aspectDeg);
  const b = rad(slopeDeg);
  const s = [Math.sin(a) * Math.cos(b), Math.cos(a) * Math.cos(b), -Math.sin(b)];
  const l = losVector(geometry);
  return s[0] * l[0] + s[1] * l[1] + s[2] * l[2];
}

/** Rata-rata sudut (derajat) dengan bobot. */
export function circularMean(angles, weights) {
  let x = 0;
  let y = 0;
  angles.forEach((a, i) => {
    const w = weights?.[i] ?? 1;
    x += w * Math.sin(rad(a));
    y += w * Math.cos(rad(a));
  });
  return ((Math.atan2(x, y) * 180) / Math.PI + 360) % 360;
}
