// One-off icon generator: draws a simple dumbbell glyph onto an HTML canvas
// in headless Chromium and saves it as PNGs at the sizes the manifest needs.
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
    if (${opaque}) {
      const g = ctx.createLinearGradient(0, 0, s, s);
      g.addColorStop(0, '#2563eb');
      g.addColorStop(1, '#7c3aed');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, s, s);
    } else {
      ctx.clearRect(0, 0, s, s);
    }

    // Dumbbell glyph, centered. Padding differs for maskable (safe-zone) vs plain icons.
    const pad = ${opaque} ? s * 0.30 : s * 0.20;
    const barY = s / 2;
    const barH = s * 0.11;
    const plateW = s * 0.13;
    const plateH = s * 0.46;
    const barX1 = pad + plateW;
    const barX2 = s - pad - plateW;

    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#ffffff';

    function roundRect(x, y, w, h, r) {
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.arcTo(x + w, y, x + w, y + h, r);
      ctx.arcTo(x + w, y + h, x, y + h, r);
      ctx.arcTo(x, y + h, x, y, r);
      ctx.arcTo(x, y, x + w, y, r);
      ctx.closePath();
      ctx.fill();
    }

    // bar
    roundRect(barX1, barY - barH / 2, barX2 - barX1, barH, barH / 2);
    // plates
    roundRect(pad, barY - plateH / 2, plateW, plateH, plateW / 2);
    roundRect(s - pad - plateW, barY - plateH / 2, plateW, plateH, plateW / 2);

    return c.toDataURL('image/png');
  })()`;
}

const browser = await chromium.launch();
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
