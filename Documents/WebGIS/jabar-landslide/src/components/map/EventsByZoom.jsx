import { AGGREGATE_MAX_ZOOM } from '../../config/constants';
import EventLayer from './EventLayer';
import KabupatenCountLayer from './KabupatenCountLayer';
import useMapZoom from './useMapZoom';

/**
 * Kejadian longsor sesuai tingkat zoom: diperkecil (≤ AGGREGATE_MAX_ZOOM) → angka per kabupaten/kota
 * untuk periode terpilih; diperbesar → titik koordinat masing-masing kejadian.
 */
export default function EventsByZoom({ events, groups, periodLabel, ctx, selectedId, onSelect }) {
  const zoom = useMapZoom();
  if (zoom <= AGGREGATE_MAX_ZOOM) return <KabupatenCountLayer groups={groups} periodLabel={periodLabel} onSelect={onSelect} />;
  return <EventLayer events={events} ctx={ctx} selectedId={selectedId} onSelect={onSelect} />;
}
