// A tiny dependency-free SVG line chart. No canvas, no chart library —
// just enough to plot a trend line with highlighted points.

import { escapeHtml } from './utils.js';

/**
 * @param {Array<{x:number, y:number, label?:string, highlight?:boolean}>} points
 * @param {{width?:number,height?:number,unit?:string,emptyText?:string}} opts
 * @returns {string} SVG markup
 */
export function lineChartSVG(points, opts = {}) {
  const width = opts.width || 320;
  const height = opts.height || 160;
  const padding = { top: 16, right: 16, bottom: 24, left: 40 };
  const unit = opts.unit || '';

  if (!points || points.length === 0) {
    return `<svg viewBox="0 0 ${width} ${height}" class="chart-svg" role="img" aria-label="No data yet">
      <text x="${width / 2}" y="${height / 2}" text-anchor="middle" class="chart-empty">${escapeHtml(opts.emptyText || 'No data yet')}</text>
    </svg>`;
  }

  const xs = points.map((p) => p.x);
  const ys = points.map((p) => p.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minYRaw = Math.min(...ys);
  const maxYRaw = Math.max(...ys);
  const yPad = Math.max((maxYRaw - minYRaw) * 0.15, maxYRaw * 0.05, 1);
  const minY = Math.max(0, minYRaw - yPad);
  const maxY = maxYRaw + yPad;

  const innerW = width - padding.left - padding.right;
  const innerH = height - padding.top - padding.bottom;

  const scaleX = (x) => (maxX === minX ? padding.left + innerW / 2 : padding.left + ((x - minX) / (maxX - minX)) * innerW);
  const scaleY = (y) => padding.top + innerH - ((y - minY) / (maxY - minY || 1)) * innerH;

  const pathD = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${scaleX(p.x).toFixed(1)} ${scaleY(p.y).toFixed(1)}`)
    .join(' ');

  const areaD = `${pathD} L ${scaleX(points[points.length - 1].x).toFixed(1)} ${(padding.top + innerH).toFixed(1)} L ${scaleX(points[0].x).toFixed(1)} ${(padding.top + innerH).toFixed(1)} Z`;

  const gridLines = [0, 0.5, 1].map((f) => {
    const y = padding.top + innerH * f;
    const val = maxY - (maxY - minY) * f;
    return `<line x1="${padding.left}" x2="${width - padding.right}" y1="${y.toFixed(1)}" y2="${y.toFixed(1)}" class="chart-grid" />
      <text x="${padding.left - 6}" y="${(y + 3).toFixed(1)}" text-anchor="end" class="chart-axis-label">${Math.round(val)}</text>`;
  }).join('');

  const dots = points.map((p) => {
    const cx = scaleX(p.x).toFixed(1);
    const cy = scaleY(p.y).toFixed(1);
    const r = p.highlight ? 5 : 3;
    const cls = p.highlight ? 'chart-dot chart-dot-pr' : 'chart-dot';
    const title = p.label ? `<title>${escapeHtml(p.label)}</title>` : '';
    return `<circle cx="${cx}" cy="${cy}" r="${r}" class="${cls}">${title}</circle>`;
  }).join('');

  return `<svg viewBox="0 0 ${width} ${height}" class="chart-svg" role="img" aria-label="Progress chart">
    ${gridLines}
    <path d="${areaD}" class="chart-area" />
    <path d="${pathD}" class="chart-line" />
    ${dots}
  </svg>`;
}
