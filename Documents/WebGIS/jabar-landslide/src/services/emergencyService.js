/**
 * EMERGENCY FACILITIES & GOOGLE MAPS API INTEGRATION SERVICE
 * File: src/services/emergencyService.js
 * 
 * Menyediakan integrasi API Google Maps (Directions & Place Search)
 * serta penghitungan jarak spasial (Haversine Formula) untuk mencari:
 * - Kantor BPBD / BNPB terdekat
 * - Posko SAR Basarnas terdekat
 * - Puskesmas & RS Rujukan Bencana terdekat
 */

/**
 * Menghitung jarak garis lurus bola bumi menggunakan Haversine Formula (km)
 */
export function calculateDistanceKm(lat1, lon1, lat2, lon2) {
  if (lat1 == null || lon1 == null || lat2 == null || lon2 == null) return null;
  const R = 6371; // Radius bumi dalam kilometer
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return parseFloat((R * c).toFixed(2));
}

/**
 * Estimasi waktu tempuh ambulans / kendaraan taktis evakuasi (menit)
 * Asumsi kecepatan rata-rata di medan perbukitan Jabar: ~45 km/jam
 */
export function estimateDrivingMinutes(distanceKm) {
  if (!distanceKm) return 0;
  const minutes = Math.round((distanceKm / 45) * 60);
  return Math.max(2, minutes);
}

/**
 * Generate Google Maps Universal Navigation URL (100% Gratis & Tanpa Kuota)
 * Membuka aplikasi Google Maps langsung dengan rute navigasi belokan demi belokan (Turn-by-turn)
 */
export function getGoogleMapsNavigationUrl(destLat, destLng, originLat = null, originLng = null) {
  const baseUrl = 'https://www.google.com/maps/dir/?api=1';
  let url = `${baseUrl}&destination=${destLat},${destLng}&travelmode=driving`;
  if (originLat != null && originLng != null) {
    url += `&origin=${originLat},${originLng}`;
  }
  return url;
}

/**
 * Generate Google Maps Place Search URL
 */
export function getGoogleMapsSearchUrl(placeName, address = '') {
  const query = encodeURIComponent(`${placeName} ${address}`.trim());
  return `https://www.google.com/maps/search/?api=1&query=${query}`;
}

/**
 * Generate Google Maps Static / Free Embed Preview URL (iframe)
 */
export function getGoogleMapsEmbedUrl(lat, lng) {
  return `https://maps.google.com/maps?q=${lat},${lng}&t=&z=15&ie=UTF8&iwloc=&output=embed`;
}

/**
 * Cari fasilitas darurat terdekat dari titik koordinat tertentu
 */
export function findNearestFacilities(originLat, originLng, facilities = [], limit = 5, typeFilter = null) {
  if (!originLat || !originLng || !Array.isArray(facilities)) return [];

  let filtered = facilities;
  if (typeFilter && typeFilter !== 'all') {
    filtered = facilities.filter(f => f.type === typeFilter);
  }

  return filtered
    .map(f => {
      const dist = calculateDistanceKm(originLat, originLng, f.lat, f.lng);
      return {
        ...f,
        distanceKm: dist,
        drivingTimeMinutes: estimateDrivingMinutes(dist),
        googleMapsNavUrl: getGoogleMapsNavigationUrl(f.lat, f.lng, originLat, originLng)
      };
    })
    .sort((a, b) => a.distanceKm - b.distanceKm)
    .slice(0, limit);
}
