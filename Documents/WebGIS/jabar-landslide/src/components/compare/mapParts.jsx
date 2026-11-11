import { useEffect } from 'react';
import { useMap } from 'react-leaflet';

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

