import { BASEMAPS, LAYERS, ORBITS } from '../../config/constants';
import Checkbox from '../ui/Checkbox';
import RadioGroup from '../ui/RadioGroup';

export default function LayerControls({ filters }) {
  const { layers, toggleLayer, year, orbit, orbitsAvailable, setOrbit, basemap, setBasemap } = filters;
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
          disabledTitle={(o) => `Tidak ada data ${o} untuk ${year}`}
        />
      </div>
      <div className="row">
        <span className="muted small">Peta dasar</span>
        <RadioGroup options={basemapLabels} value={basemap} onChange={setBasemap} />
      </div>
    </section>
  );
}
