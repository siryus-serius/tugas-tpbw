// Arah mata angin & geometri pandang satelit untuk interpretasi arah geseran.

const WINDS = ['utara', 'timur laut', 'timur', 'tenggara', 'selatan', 'barat daya', 'barat', 'barat laut'];

export const compassName = (deg) => (deg == null ? '–' : WINDS[Math.round((((deg % 360) + 360) % 360) / 45) % 8]);

/** Sentinel-1 right-looking: arah pandang (dari satelit ke tanah) = heading + 90°. */
export const lookAzimuth = (heading) => (heading == null ? null : (((heading + 90) % 360) + 360) % 360);

/**
 * Ringkasan arah geseran untuk overlay & keterangan.
 * - Kejadian: arah lereng turun (aspek DEM) = arah gerak paling mungkin.
 * - Anomali: aspek + uji konsistensi dengan tanda LOS InSAR + arah pandang satelit.
 */
export function movementInfo({ type, feature, scenes }) {
  if (type === 'event') {
    const t = scenes?.terrain;
    if (t?.aspect_deg == null) return null;
    return {
      aspect: t.aspect_deg,
      slope: t.slope_deg,
      headline: `Lereng turun ke arah ${compassName(t.aspect_deg)} (${t.aspect_deg}°)`,
      detail: `Perkiraan arah material longsor bergerak, dari DEM Copernicus 90 m (lereng ${t.slope_deg}°).`,
    };
  }
  const p = feature.properties;
  if (p.aspect_deg == null) return null;
  const look = lookAzimuth(p.los_heading);
  let verdict;
  if (p.konsisten_lereng === true) {
    verdict = `Sinyal InSAR konsisten dengan gerak searah lereng turun; perkiraan kecepatan searah lereng ±${Math.abs(p.v_downslope_mm_yr)} mm/thn.`;
  } else if (p.konsisten_lereng === false) {
    verdict = 'Tanda sinyal InSAR berlawanan dengan gerak searah lereng → kemungkinan bukan gerakan lereng (noise/penurunan/proses lain).';
  } else {
    verdict = 'Arah lereng hampir tegak lurus garis pandang satelit → arah gerak tak dapat dipastikan dari satu geometri.';
  }
  return {
    aspect: p.aspect_deg,
    slope: p.slope_deg,
    look,
    consistent: p.konsisten_lereng,
    headline: `Lereng turun ke arah ${compassName(p.aspect_deg)} (${p.aspect_deg}°)`,
    detail: verdict,
  };
}
