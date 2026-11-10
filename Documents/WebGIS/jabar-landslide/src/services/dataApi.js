// Pemuat data statis yang dihasilkan pipeline (public/data/*).

const BASE = import.meta.env.BASE_URL;

export const dataUrl = (path) => `${BASE}${path.startsWith('data/') ? path : `data/${path}`}`;

export async function loadJson(path) {
  const res = await fetch(dataUrl(path));
  if (!res.ok) throw new Error(`${path}: HTTP ${res.status}`);
  return res.json();
}
