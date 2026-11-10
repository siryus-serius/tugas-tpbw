export const signed = (x) => (x > 0 ? `+${x}` : `${x}`);

export const dateId = (iso, opts = { day: 'numeric', month: 'long', year: 'numeric' }) =>
  new Date(iso).toLocaleDateString('id-ID', opts);

export const shortKab = (name) => name.replace('Kabupaten ', 'Kab. ');

export const percent = (x) => (x == null ? '–' : `${Math.round(x * 100)}%`);
