/**
 * Login Google Earth Engine tanpa file kunci.
 *
 * Di GitHub Actions, google-github-actions/auth (Workload Identity Federation) menukar token OIDC
 * GitHub menjadi access token service account → diteruskan lewat env GEE_ACCESS_TOKEN.
 * Lokal (opsional): GEE_ACCESS_TOKEN=$(gcloud auth print-access-token) dengan akun yang punya akses.
 *
 * Env: GEE_ACCESS_TOKEN (wajib), GEE_PROJECT (ID project Cloud yang terdaftar di Earth Engine).
 */
import ee from '@google/earthengine';

export const geeAvailable = () => Boolean(process.env.GEE_ACCESS_TOKEN && process.env.GEE_PROJECT);

let ready = null;

export function initGee() {
  if (ready) return ready;
  if (!geeAvailable()) {
    return Promise.reject(new Error('GEE_ACCESS_TOKEN / GEE_PROJECT belum diset (login GEE hanya aktif di GitHub Actions).'));
  }
  ready = new Promise((resolve, reject) => {
    ee.data.setAuthToken('', 'Bearer', process.env.GEE_ACCESS_TOKEN, 3600, [], () => {
      ee.initialize(null, null, () => resolve(ee), (err) => reject(new Error(`ee.initialize: ${err}`)), null, process.env.GEE_PROJECT);
    }, false);
  });
  return ready;
}

/** Evaluasi objek ee secara async (getInfo dengan callback). */
export const evaluate = (eeObject) =>
  new Promise((resolve, reject) => eeObject.evaluate((value, err) => (err ? reject(new Error(err)) : resolve(value))));
