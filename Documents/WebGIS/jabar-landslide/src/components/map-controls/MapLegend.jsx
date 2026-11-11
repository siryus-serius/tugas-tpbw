import {
  AGGREGATE_MAX_ZOOM,
  EVENT_COLOR,
  HEAT_GRADIENT,
  QUAKE_COLOR,
  SEVERITY,
  UNKNOWN_COLOR,
} from '../../config/constants';
import { BIG_DEATHS } from '../../config/constants';
import { FS_CLASSES } from '../../utils/factorOfSafety';
import { RISK_CLASSES } from '../../utils/susceptibility';

const Dot = ({ color, small }) => <span className={`dot${small ? ' small' : ''}`} style={{ background: color }} />;
const Pin = ({ color }) => <span className="anomaly-pin static" style={{ '--c': color }} />;
const Ring = ({ color }) => <span className="ring" style={{ borderColor: color }} />;
const Count = ({ c, n }) => (
  <span className="kab-count static" style={{ '--c': c.color, '--ink': c.ink }}>
    {n}
  </span>
);

const heatRamp = `linear-gradient(90deg, ${Object.entries(HEAT_GRADIENT)
  .map(([s, c]) => `${c} ${Number(s) * 100}%`)
  .join(', ')})`;

/** Satu kelompok keterangan: judul bernomor + tabel simbol/uraian. */
function Group({ no, title, inactive, children }) {
  return (
    <section className={`lg-group${inactive ? ' inactive' : ''}`}>
      <h3>
        <span>{no}.</span> {title}
        {inactive && <em> (lapisan nonaktif)</em>}
      </h3>
      <table className="lg-table">
        <tbody>{children}</tbody>
      </table>
    </section>
  );
}

const Row = ({ symbol, children }) => (
  <tr>
    <td className="lg-sym">{symbol}</td>
    <td>{children}</td>
  </tr>
);

/**
 * Keterangan peta bergaya kartografis formal: judul peta, periode, kelompok simbol bernomor,
 * serta catatan sistem referensi & sumber data.
 */
export default function MapLegend({ colorMode, layers, period, region, galura }) {
  const isGalura = region?.source === 'galura';
  const sampleN = (c, i, all) => (c.max === Infinity ? (all[i - 1]?.max ?? 0) + 1 : c.max);
  const fsRange = { labil: 'FK < 1,07', kritis: '1,07 ≤ FK ≤ 1,25', stabil: 'FK > 1,25' };

  return (
    <section className="map-legend">
      <header className="lg-head">
        <p className="lg-kicker">Keterangan Peta</p>
        <h2>Kejadian &amp; Kerawanan Longsor Provinsi Jawa Barat</h2>
        <p className="lg-meta">
          Periode data: <strong>{period}</strong>
        </p>
      </header>

      <Group no="I" title="Kejadian longsor" inactive={!layers.events}>
        {colorMode === 'kategori' && (
          <>
            <Row symbol={<Dot color={EVENT_COLOR.current} />}>Kejadian pada periode terpilih</Row>
            <Row symbol={<Dot color={EVENT_COLOR.other} small />}>Kejadian di luar periode terpilih</Row>
          </>
        )}
        {colorMode === 'stabilitas' &&
          FS_CLASSES.map((c) => (
            <Row key={c.key} symbol={<Dot color={c.color} />}>
              {c.label} <span className="muted">({fsRange[c.key]})</span>
            </Row>
          ))}
        {colorMode === 'kerawanan' &&
          RISK_CLASSES.map((c) => (
            <Row key={c.key} symbol={<Dot color={c.color} />}>
              Kerawanan {c.label.toLowerCase()}
            </Row>
          ))}
        {colorMode !== 'kategori' && <Row symbol={<Dot color={UNKNOWN_COLOR} />}>Data belum mencukupi</Row>}
        <Row symbol={<span className="dot dashed" style={{ background: EVENT_COLOR.current }} />}>
          Lokasi perkiraan (pusat desa)
        </Row>
        <Row symbol={<span className="lg-big" />}>Kejadian besar (≥ {BIG_DEATHS} korban) pada tahun terpilih</Row>
      </Group>

      <Group no="II" title={`Jumlah kejadian per kabupaten/kota (zoom ≤ ${AGGREGATE_MAX_ZOOM})`} inactive={!layers.events}>
        {(region?.classes ?? []).map((c, i, all) => (
          <Row key={c.label} symbol={<Count c={c} n={sampleN(c, i, all).toLocaleString('id-ID')} />}>
            {c.label}
          </Row>
        ))}
        <tr>
          <td colSpan={2} className="muted small">
            Angka & warna wilayah:{' '}
            {isGalura
              ? `kejadian tercatat desa ${region.galuraLabel}, Galura Data Jabar (DPMD). Kota berbasis kelurahan tidak tercakup (simbol putih = hanya kejadian terverifikasi).`
              : 'kejadian terverifikasi berita pada periode terpilih.'}
            {region?.note && ` ${region.note}`}
          </td>
        </tr>
      </Group>

      <Group no="III" title="Kepadatan kejadian (peta panas)" inactive={!layers.heat}>
        <tr>
          <td colSpan={2}>
            <div className="lg-ramp" style={{ background: heatRamp }} />
            <div className="ramp-labels muted small">
              <span>Rendah</span>
              <span>Tinggi</span>
            </div>
          </td>
        </tr>
      </Group>

      <Group no="IV" title="Deformasi tanah (InSAR Sentinel-1)" inactive={!layers.anomalies && !layers.insar}>
        {Object.entries(SEVERITY).map(([s, { color, range }]) => (
          <Row key={s} symbol={<Pin color={color} />}>
            Anomali {s} <span className="muted">({range})</span>
          </Row>
        ))}
        <tr>
          <td colSpan={2}>
            <div className="ramp" />
            <div className="ramp-labels muted small">
              <span>Menjauhi satelit (penurunan)</span>
              <span>Mendekati</span>
            </div>
            <p className="muted small">Perubahan kecepatan LOS terhadap rata-rata tahun sebelumnya; |Δ| &lt; 15 mm/thn tidak diwarnai.</p>
          </td>
        </tr>
      </Group>

      <Group no="V" title="Gempa bumi" inactive={!layers.quakes}>
        <Row symbol={<Ring color={QUAKE_COLOR.BMKG} />}>Gempa terkini (BMKG)</Row>
        <Row symbol={<Ring color={QUAKE_COLOR.USGS} />}>Riwayat gempa (USGS); ukuran sebanding magnitudo</Row>
      </Group>

      <Group no="VI" title="Batas administrasi" inactive={!layers.adm}>
        <Row symbol={<span className="lg-line" />}>Batas kabupaten/kota</Row>
      </Group>

      <footer className="lg-foot">
        Sistem referensi: WGS 84 (EPSG:4326). Klasifikasi FK menurut Bowles (1989). Sumber: BNPB/BPBD, BMKG, USGS,
        COMET-LiCSAR, Copernicus Sentinel{galura ? ', Galura Data Jabar (DPMD)' : ''}.
      </footer>
    </section>
  );
}
