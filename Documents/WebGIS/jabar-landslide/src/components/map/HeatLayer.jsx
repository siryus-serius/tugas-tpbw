import L from 'leaflet';
import { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import { HEAT_GRADIENT } from '../../config/constants';

/*
 * Peta panas (kernel density sederhana) di atas kanvas — tanpa dependensi tambahan.
 * Setiap kejadian digambar sebagai titik buram; kepadatan alfa yang menumpuk lalu diwarnai
 * dengan gradasi HEAT_GRADIENT. Radius mengikuti jarak di lapangan (±6 km) dan dibatasi agar
 * tetap terbaca di semua tingkat zoom.
 */

const PANE = 'heatPane';
const RADIUS_M = 6000;
const SATURATE_AT = 3; // jumlah kejadian bertumpuk yang dianggap "sangat padat"

function buildPalette() {
  const c = document.createElement('canvas');
  c.width = 1;
  c.height = 256;
  const ctx = c.getContext('2d');
  const g = ctx.createLinearGradient(0, 0, 0, 256);
  for (const [stop, color] of Object.entries(HEAT_GRADIENT)) g.addColorStop(Number(stop), color);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 1, 256);
  return ctx.getImageData(0, 0, 1, 256).data;
}

function buildStamp(r, blur) {
  const c = document.createElement('canvas');
  const r2 = r + blur;
  c.width = c.height = r2 * 2;
  const ctx = c.getContext('2d');
  ctx.shadowOffsetX = ctx.shadowOffsetY = r2 * 2;
  ctx.shadowBlur = blur;
  ctx.shadowColor = 'black';
  ctx.beginPath();
  ctx.arc(-r2, -r2, r, 0, Math.PI * 2);
  ctx.fill();
  return c;
}

const HeatCanvas = L.Layer.extend({
  initialize() {
    this._points = [];
  },

  setPoints(points) {
    this._points = points;
    if (this._map) this._redraw();
  },

  onAdd(map) {
    if (!map.getPane(PANE)) map.createPane(PANE).style.zIndex = 350; // di atas citra, di bawah titik
    this._canvas = L.DomUtil.create('canvas', 'heat-canvas leaflet-zoom-hide', map.getPane(PANE));
    this._palette ??= buildPalette();
    map.on('moveend zoomend resize', this._reset, this);
    this._reset();
  },

  onRemove(map) {
    map.off('moveend zoomend resize', this._reset, this);
    L.DomUtil.remove(this._canvas);
  },

  _reset() {
    const map = this._map;
    const size = map.getSize();
    L.DomUtil.setPosition(this._canvas, map.containerPointToLayerPoint([0, 0]));
    this._canvas.width = size.x;
    this._canvas.height = size.y;
    this._redraw();
  },

  _radius() {
    const map = this._map;
    const lat = map.getCenter().lat;
    const metersPerPx = (40075016.686 * Math.cos((lat * Math.PI) / 180)) / 2 ** (map.getZoom() + 8);
    return Math.round(Math.min(80, Math.max(24, RADIUS_M / metersPerPx)));
  },

  _redraw() {
    const canvas = this._canvas;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (!this._points.length || !canvas.width || !canvas.height) return;

    const r = this._radius();
    const blur = Math.round(r * 0.9);
    const r2 = r + blur;
    const stamp = buildStamp(r, blur);

    for (const [lat, lng, w = 1] of this._points) {
      const p = this._map.latLngToContainerPoint([lat, lng]);
      if (p.x < -r2 || p.y < -r2 || p.x > canvas.width + r2 || p.y > canvas.height + r2) continue;
      ctx.globalAlpha = Math.min(1, Math.max(0.05, w / SATURATE_AT));
      ctx.drawImage(stamp, p.x - r2, p.y - r2);
    }

    const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const px = img.data;
    const pal = this._palette;
    for (let i = 3; i < px.length; i += 4) {
      const a = px[i];
      if (!a) continue;
      const j = a * 4;
      px[i - 3] = pal[j];
      px[i - 2] = pal[j + 1];
      px[i - 1] = pal[j + 2];
      px[i] = Math.min(235, 60 + a * 1.8); // sedikit transparan agar peta dasar tetap terbaca
    }
    ctx.globalAlpha = 1;
    ctx.putImageData(img, 0, 0);
  },
});

/** `points`: [[lat, lng, bobot?], ...] */
export default function HeatLayer({ points }) {
  const map = useMap();
  const layer = useRef(null);

  useEffect(() => {
    const l = new HeatCanvas();
    l.addTo(map);
    layer.current = l;
    return () => {
      l.remove();
      layer.current = null;
    };
  }, [map]);

  useEffect(() => {
    layer.current?.setPoints(points);
  }, [points]);

  return null;
}
