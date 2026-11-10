import { useEffect, useMemo } from 'react';
import L from 'leaflet';
import { Marker, useMap } from 'react-leaflet';

/** Mode geser: pane "pre" dipotong (clip) di posisi slider; pane "post" utuh di bawahnya. */
export function SwipeClip({ split }) {
  const map = useMap();
  useEffect(() => {
    const pane = map.getPane('pre');
    if (!pane) return undefined;
    const update = () => {
      const nw = map.containerPointToLayerPoint([0, 0]);
      const se = map.containerPointToLayerPoint(map.getSize());
      const x = nw.x + ((se.x - nw.x) * split) / 100;
      pane.style.clip = `rect(${nw.y}px, ${x}px, ${se.y}px, ${nw.x}px)`;
    };
    update();
    map.on('move zoom resize', update);
    return () => {
      map.off('move zoom resize', update);
      pane.style.clip = '';
    };
  }, [map, split]);
  return null;
}

/** Sinkronkan pusat & zoom beberapa peta (mode berdampingan). `group`: { maps: Set, syncing } */
export function SyncView({ group }) {
  const map = useMap();
  useEffect(() => {
    group.maps.add(map);
    const onMove = () => {
      if (group.syncing) return;
      group.syncing = true;
      for (const m of group.maps) if (m !== map) m.setView(map.getCenter(), map.getZoom(), { animate: false });
      group.syncing = false;
    };
    map.on('move', onMove);
    return () => {
      map.off('move', onMove);
      group.maps.delete(map);
    };
  }, [map, group]);
  return null;
}

function arrowSvg({ aspect, look, consistent }) {
  const color = consistent === false ? '#facc15' : '#ef4444';
  const arrow = (deg, len, stroke, dash) =>
    `<g transform="rotate(${deg} 70 70)"><line x1="70" y1="70" x2="70" y2="${70 - len}" stroke="${stroke}" stroke-width="3"${
      dash ? ' stroke-dasharray="6 4"' : ''
    }/><path d="M62 ${78 - len} L70 ${62 - len} L78 ${78 - len} z" fill="${stroke}"/></g>`;
  return `<svg width="140" height="140" viewBox="0 0 140 140" style="overflow:visible;filter:drop-shadow(0 0 2px #000)">
    <circle cx="70" cy="70" r="7" fill="none" stroke="#fff" stroke-width="2"/>
    ${look != null ? arrow(look, 45, '#22d3ee', true) : ''}
    ${arrow(aspect, 60, color, false)}
  </svg>`;
}

/** Panah arah lereng turun (merah) & arah pandang satelit (biru putus-putus) di titik lokasi. */
export function DirectionMarker({ coord: [lng, lat], movement }) {
  const icon = useMemo(
    () => L.divIcon({ className: '', html: arrowSvg(movement), iconSize: [140, 140], iconAnchor: [70, 70] }),
    [movement]
  );
  return <Marker position={[lat, lng]} icon={icon} interactive={false} />;
}
