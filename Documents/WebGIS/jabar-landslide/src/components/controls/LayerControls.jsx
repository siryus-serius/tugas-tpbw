import { BASEMAPS, LAYERS, ORBITS, S2_MOSAIC_YEARS } from '../../config/constants';
import Segmented from './Segmented';

export default function LayerControls({ filters }) {
  const { layers, toggleLayer, year, orbit, orbitsAvailable, setOrbit, basemap, setBasemap } = filters;
  const basemapLabels = Object.fromEntries(Object.entries(BASEMAPS).map(([k, b]) => [k, b.label]));

  return (
    <section>
      <h2>Lapisan</h2>
      {Object.entries(LAYERS).map(([key, label]) => (
        <label key={key} className="toggle">
          <input type="checkbox" checked={layers[key]} onChange={() => toggleLayer(key)} />
          <span>{label}</span>
          {key === 's2' && layers.s2 && !S2_MOSAIC_YEARS.includes(year) && (
            <em className="muted small"> (tidak tersedia untuk {year})</em>
          )}
        </label>
      ))}
      <div className="row">
        <span className="muted small">Geometri InSAR</span>
        <Segmented
          options={ORBITS}
          value={orbit}
          onChange={setOrbit}
          isDisabled={(o) => !orbitsAvailable.includes(o)}
          disabledTitle={(o) => `Tidak ada data ${o} untuk ${year}`}
        />
      </div>
      <div className="row">
        <span className="muted small">Peta dasar</span>
        <Segmented options={basemapLabels} value={basemap} onChange={setBasemap} />
      </div>
    </section>
  );
}
