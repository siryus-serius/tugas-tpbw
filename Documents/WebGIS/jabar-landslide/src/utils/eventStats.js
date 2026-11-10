// Agregasi data kejadian untuk dashboard.

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
const shortKab = (k) => k.replace(/^Kabupaten\s+/i, '');

export function eventStats(events) {
  const P = events.map((f) => f.properties);
  const years = [...new Set(P.map((p) => p.tahun))].sort((a, b) => a - b);

  const perYear = years.map((y) => {
    const list = P.filter((p) => p.tahun === y);
    return {
      key: y,
      label: String(y),
      count: list.length,
      deaths: list.reduce((s, p) => s + (p.korban_meninggal ?? 0), 0),
    };
  });

  const kabMap = new Map();
  for (const p of P) {
    const k = shortKab(p.kabupaten);
    const cur = kabMap.get(k) ?? { count: 0, deaths: 0 };
    kabMap.set(k, { count: cur.count + 1, deaths: cur.deaths + (p.korban_meninggal ?? 0) });
  }
  const perKab = [...kabMap.entries()]
    .map(([k, v]) => ({ key: k, label: k, value: v.count, detail: `${v.deaths} korban meninggal` }))
    .sort((a, b) => b.value - a.value || a.label.localeCompare(b.label));

  const perMonth = MONTHS.map((m, i) => ({
    key: m,
    label: m,
    value: P.filter((p) => Number(p.tanggal.slice(5, 7)) === i + 1).length,
  }));

  return {
    total: P.length,
    deaths: P.reduce((s, p) => s + (p.korban_meninggal ?? 0), 0),
    kabupaten: kabMap.size,
    perYear,
    perKab,
    perMonth,
    deadliest: [...events].sort((a, b) => (b.properties.korban_meninggal ?? 0) - (a.properties.korban_meninggal ?? 0))[0],
  };
}
