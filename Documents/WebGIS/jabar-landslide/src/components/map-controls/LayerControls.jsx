import { BASEMAPS, LAYERS, ORBITS } from '../../config/constants';
import Checkbox from '../ui/Checkbox';
import RadioGroup from '../ui/RadioGroup';
import { REGION_SOURCES } from '../../utils/regionCounts';

export default function LayerControls({ filters, region }) {
  const { regionSource, setRegionSource, layers, toggleLayer, year, allYears, orbit, orbitsAvailable, setOrbit, basemap, setBasemap } = filters;
  const basemapLabels = Object.fromEntries(Object.entries(BASEMAPS).map(([k, b]) => [k, b.label]));

  return (
    <section>
      <h2>Lapisan</h2>
      {Object.entries(LAYERS).map(([key, label]) => (
        <Checkbox key={key} checked={layers[key]} onChange={() => toggleLayer(key)}>
          {label}
        </Checkbox>
      ))}
      <div className="row">
        <span className="muted small">Geometri InSAR</span>
        <RadioGroup
          options={ORBITS}
          value={orbit}
          onChange={setOrbit}
          isDisabled={(o) => !orbitsAvailable.includes(o)}
          disabledTitle={(o) => (allYears ? 'Pilih satu tahun untuk peta warna InSAR' : `Tidak ada data ${o} untuk ${year}`)}
        />
      </div>
      {allYears && (
        <p className="muted small">
          Mode semua tahun: peta warna InSAR (selisih per tahun) disembunyikan; pin anomali seluruh tahun ditampilkan.
        </p>
      )}
      <div className="row">
        <span className="muted small">Angka wilayah</span>
        <RadioGroup options={REGION_SOURCES} value={regionSource} onChange={setRegionSource} />
      </div>
      {region?.note && <p className="muted small">{region.note}</p>}
      <div className="row">
        <span className="muted small">Peta dasar</span>
        <RadioGroup options={basemapLabels} value={basemap} onChange={setBasemap} />
      </div>
    </section>
  );
}
