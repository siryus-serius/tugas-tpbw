/** Utilitas HTTP & konkurensi bersama untuk seluruh tahap pipeline. */

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * fetch dengan retry (3×, backoff). 403/404 dianggap final (tidak di-retry).
 * @param {'json'|'text'|'arrayBuffer'} as
 */
export async function fetchRetry(url, { as = 'json', init } = {}) {
  for (let attempt = 1; ; attempt++) {
    try {
      const res = await fetch(url, init);
      if (res.status === 403 || res.status === 404) {
        throw Object.assign(new Error(`HTTP ${res.status}`), { fatal: true });
      }
      if (!res.ok) throw Object.assign(new Error(`HTTP ${res.status}`), { status: res.status });
      return await res[as]();
    } catch (err) {
      if (err.fatal || attempt >= 3) throw new Error(`${url.split('?')[0]}: ${err.message}`);
      await sleep(err.status === 429 ? 30000 * attempt : 2000 * attempt); // 429 = kuota per menit habis
    }
  }
}

export const postJson = (url, body) =>
  fetchRetry(url, {
    init: { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) },
  });

/** Jalankan fn untuk setiap item dengan maksimum n tugas paralel. */
export async function pool(items, n, fn) {
  const results = new Array(items.length);
  let next = 0;
  await Promise.all(
    Array.from({ length: Math.min(n, items.length) }, async () => {
      while (next < items.length) {
        const i = next++;
        results[i] = await fn(items[i], i);
      }
    })
  );
  return results;
}
