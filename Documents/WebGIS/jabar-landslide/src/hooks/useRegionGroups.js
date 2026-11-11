import { useMemo } from 'react';
import { buildKabupatenIndex } from '../utils/kabupaten';
import { regionGroups } from '../utils/regionCounts';
import { inYear } from '../utils/years';

/**
 * Angka & kelas warna per kabupaten/kota untuk periode & sumber terpilih (Galura DPMD /
 * kejadian terverifikasi). Dipakai bersama oleh peta (angka + choropleth) dan keterangan peta.
 */
export default function useRegionGroups(data, { year, regionSource }) {
  const kabIndex = useMemo(() => buildKabupatenIndex(data.adm), [data.adm]);
  const periodEvents = useMemo(() => data.allEvents.filter((f) => inYear(f.properties.tahun, year)), [data.allEvents, year]);
  const region = useMemo(
    () => regionGroups({ events: periodEvents, kabIndex, galura: data.galura, year, source: regionSource }),
    [periodEvents, kabIndex, data.galura, year, regionSource]
  );
  return { ...region, periodEvents };
}
