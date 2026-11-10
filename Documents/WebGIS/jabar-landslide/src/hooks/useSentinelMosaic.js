import { useEffect, useState } from 'react';
import { registerMosaic } from '../services/pcMosaic';
import { PRESET_BY_KEY, mosaicTileUrl } from '../utils/sentinelImagery';

/** URL tile mosaik Sentinel untuk preset & periode terpilih (null bila layer mati). */
export default function useSentinelMosaic({ enabled, presetKey, year, month }) {
  const [state, setState] = useState({ key: null, url: null, error: null });
  const collection = PRESET_BY_KEY[presetKey]?.collection;
  const key = enabled && year ? `${collection}|${year}|${month}|${presetKey}` : null;

  useEffect(() => {
    if (!key) return undefined;
    const ctrl = new AbortController();
    registerMosaic({ collection, year, month, signal: ctrl.signal })
      .then((id) => setState({ key, url: mosaicTileUrl(id, presetKey), error: null }))
      .catch((err) => {
        if (err.name !== 'AbortError') setState({ key, url: null, error: err.message });
      });
    return () => ctrl.abort();
  }, [key, collection, year, month, presetKey]);

  const current = state.key === key;
  return {
    url: current ? state.url : null,
    error: current ? state.error : null,
    loading: Boolean(key) && !current,
  };
}
