/**
 * Kartu dampak & kerugian satu kejadian (korban jiwa, rumah, fasilitas umum, lainnya).
 * Hanya angka yang tercantum eksplisit di sumber yang ditampilkan; setiap angka diberi tautan
 * ke sumbernya (`dampak.bukti`). Kolom tanpa data tidak ditampilkan — bukan dianggap nol.
 */

const KORBAN = [
  ['meninggal', 'Meninggal dunia'],
  ['hilang', 'Hilang'],
  ['luka_berat', 'Luka berat'],
  ['luka_ringan', 'Luka ringan'],
  ['luka', 'Luka-luka'],
  ['mengungsi_jiwa', 'Mengungsi', 'jiwa'],
  ['terdampak_jiwa', 'Terdampak', 'jiwa'],
  ['terdampak_kk', 'Terdampak', 'KK'],
];

const RUMAH = [
  ['rusak_berat', 'Rusak berat'],
  ['rusak_sedang', 'Rusak sedang'],
  ['rusak_ringan', 'Rusak ringan'],
  ['tertimbun_hanyut', 'Tertimbun/hanyut'],
  ['rusak_tidak_rinci', 'Rusak (tingkat tidak dirinci)'],
  ['terancam', 'Terancam'],
];

const fmt = (n) => n.toLocaleString('id-ID');

export default function ImpactCard({ dampak, deaths }) {
  const bukti = dampak?.bukti ?? [];
  const urls = [...new Set(bukti.map((b) => b.url))];
  const ref = (field) => {
    const b = bukti.find((x) => x.field === field);
    if (!b) return null;
    return (
      <a className="impact-ref" href={b.url} target="_blank" rel="noreferrer" title={`“${b.kutipan}”`}>
        [{urls.indexOf(b.url) + 1}]
      </a>
    );
  };

  // Angka meninggal mengikuti data kejadian; 0 dengan korban hilang berarti "belum ditemukan", bukan "tidak ada korban"
  const hilang = dampak?.korban?.hilang;
  const meninggal = deaths === 0 && hilang ? null : (deaths ?? dampak?.korban?.meninggal ?? null);
  const korban = { ...(dampak?.korban ?? {}), meninggal };
  const korbanRows = KORBAN.filter(([k]) => korban[k] != null);
  const rumahRows = RUMAH.filter(([k]) => dampak?.rumah?.[k] != null);
  const fasilitas = dampak?.fasilitas_umum ?? [];
  const lainnya = dampak?.lainnya ?? [];

  return (
    <div className="impact">
      <h3>Dampak &amp; kerugian</h3>

      <div className="impact-group">
        <h4>Korban jiwa</h4>
        <table>
          <tbody>
            {korbanRows.map(([k, label, unit = 'orang']) => (
              <tr key={k}>
                <td>{label}</td>
                <td className={k === 'meninggal' ? 'num strong' : 'num'}>
                  {fmt(korban[k])} {unit} {ref(`korban.${k}`)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="impact-group">
        <h4>Rumah</h4>
        {rumahRows.length ? (
          <table>
            <tbody>
              {rumahRows.map(([k, label]) => (
                <tr key={k}>
                  <td>{label}</td>
                  <td className="num">
                    {fmt(dampak.rumah[k])} unit {ref(`rumah.${k}`)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="muted small">Jumlah tidak dilaporkan di sumber.</p>
        )}
      </div>

      <div className="impact-group">
        <h4>Fasilitas umum &amp; infrastruktur</h4>
        {fasilitas.length ? (
          <ul>
            {fasilitas.map((f, i) => (
              <li key={i}>
                {f.jumlah != null && `${fmt(f.jumlah)} ${f.satuan && f.satuan !== 'unit' ? f.satuan + ' ' : ''}`}
                {f.jenis}
                {f.kondisi && ` — ${f.kondisi}`} {ref(`fasilitas_umum.${i}`)}
              </li>
            ))}
          </ul>
        ) : (
          <p className="muted small">Tidak ada kerusakan fasilitas umum yang dilaporkan di sumber.</p>
        )}
      </div>

      {lainnya.length > 0 && (
        <div className="impact-group">
          <h4>Kerugian lainnya</h4>
          <ul>
            {lainnya.map((t, i) => (
              <li key={i}>
                {t} {ref(`lainnya.${i}`)}
              </li>
            ))}
          </ul>
        </div>
      )}

      {dampak?.catatan && <p className="muted small">Catatan: {dampak.catatan}</p>}
      <p className="muted small">
        {dampak
          ? `Angka diambil dari ${urls.length} sumber berita/BPBD (arahkan kursor ke [n] untuk kutipan). Data yang tidak dilaporkan tidak ditampilkan.`
          : 'Rincian kerugian belum tersedia untuk kejadian ini.'}
      </p>
    </div>
  );
}
