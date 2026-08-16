// One-off icon generator: draws a meal-prep tub glyph onto an HTML canvas in
// headless Chromium and saves it as PNGs at the sizes the manifest needs.
// Run with: node tools/generate-icons.mjs
import { chromium } from 'playwright';
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = join(__dirname, '..', 'icons');
mkdirSync(outDir, { recursive: true });

function drawIconScript(size, opaque) {
  return `(() => {
    const c = document.createElement('canvas');
    c.width = ${size}; c.height = ${size};
    const ctx = c.getContext('2d');
    const s = ${size};
    const bg = ctx.createLinearGradient(0, 0, s, s);
    bg.addColorStop(0, '#16794a');
    bg.addColorStop(1, '#3ecf8e');
    if (${opaque}) {
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, s, s);
    } else {
      ctx.clearRect(0, 0, s, s);
    }

    const pad = ${opaque} ? s * 0.28 : s * 0.18;
    const w = s - pad * 2;

    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#ffffff';
    ctx.lineCap = 'round';

    function roundRect(x, y, rw, rh, r) {
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.arcTo(x + rw, y, x + rw, y + rh, r);
      ctx.arcTo(x + rw, y + rh, x, y + rh, r);
      ctx.arcTo(x, y + rh, x, y, r);
      ctx.arcTo(x, y, x + rw, y, r);
      ctx.closePath();
      ctx.fill();
    }

    // Lid, then the tub body below it — a meal-prep container, side on.
    const lidH = w * 0.13;
    const bodyH = w * 0.46;
    const gap = w * 0.07;
    const bodyY = pad + (w - lidH - gap - bodyH) / 2 + lidH + gap;
    const lidY = bodyY - gap - lidH;

    roundRect(pad - w * 0.04, lidY, w + w * 0.08, lidH, lidH / 2);
    roundRect(pad, bodyY, w, bodyH, w * 0.10);

    // Divider inside the tub so it reads as compartments, not a plain box. On
    // the opaque icons it's painted in the background gradient; on the
    // transparent ones it's cut clean through.
    ctx.save();
    if (${opaque}) ctx.strokeStyle = bg;
    else ctx.globalCompositeOperation = 'destination-out';
    ctx.lineWidth = Math.max(2, w * 0.05);
    ctx.beginPath();
    ctx.moveTo(pad + w * 0.42, bodyY + bodyH * 0.16);
    ctx.lineTo(pad + w * 0.42, bodyY + bodyH * 0.84);
    ctx.stroke();
    ctx.restore();

    // Steam above the lid.
    ctx.lineWidth = Math.max(2, w * 0.055);
    for (const dx of [-w * 0.22, 0, w * 0.22]) {
      const x = pad + w / 2 + dx;
      ctx.beginPath();
      ctx.moveTo(x, lidY - w * 0.10);
      ctx.lineTo(x, lidY - w * 0.24);
      ctx.stroke();
    }

    return c.toDataURL('image/png');
  })()`;
}

// CHROMIUM_PATH lets this run against an already-installed Chromium instead of
// making Playwright download its own pinned build.
const browser = await chromium.launch(
  process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {}
);
const page = await browser.newPage();
await page.goto('about:blank');

const targets = [
  { file: 'icon-192.png', size: 192, opaque: false },
  { file: 'icon-512.png', size: 512, opaque: false },
  { file: 'icon-maskable-512.png', size: 512, opaque: true },
  { file: 'apple-touch-icon.png', size: 180, opaque: true },
];

for (const t of targets) {
  const dataUrl = await page.evaluate(drawIconScript(t.size, t.opaque));
  const base64 = dataUrl.split(',')[1];
  writeFileSync(join(outDir, t.file), Buffer.from(base64, 'base64'));
  console.log('wrote', t.file);
}

await browser.close();
