import { AGGREGATE_MAX_ZOOM } from '../../config/constants';
import EventLayer from './EventLayer';
import KabupatenCountLayer from './KabupatenCountLayer';
import RegionChoropleth from './RegionChoropleth';
import useMapZoom from './useMapZoom';

/**
 * Kejadian longsor sesuai tingkat zoom: diperkecil (≤ AGGREGATE_MAX_ZOOM) → pewarnaan + angka per
 * kabupaten/kota (sumber Galura DPMD / terverifikasi); diperbesar → titik koordinat tiap kejadian.
 */
export default function EventsByZoom({ events, region, adm, periodLabel, ctx, selectedId, onSelect }) {
  const zoom = useMapZoom();
  if (zoom <= AGGREGATE_MAX_ZOOM) {
    return (
      <>
        <RegionChoropleth adm={adm} region={region} />
        <KabupatenCountLayer region={region} periodLabel={periodLabel} onSelect={onSelect} />
      </>
    );
  }
  return <EventLayer events={events} ctx={ctx} selectedId={selectedId} onSelect={onSelect} />;
}
