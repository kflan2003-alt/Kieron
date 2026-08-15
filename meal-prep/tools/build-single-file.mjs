// Bundles the app into one self-contained HTML file with no external requests —
// for hosts that serve a single page rather than a directory (Claude Artifacts,
// emailing it to yourself, a USB stick).
//
// Run with: node tools/build-single-file.mjs [outfile]
// Default output: dist/meal-prep.html
//
// The multi-file app under js/ stays the source of truth; rerun this after
// changing it. Deliberately a tiny bundler rather than a dependency: each module
// becomes a namespace object, so `import * as store` and named imports both keep
// working without touching the source.

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

// Dependency order — every module only imports from ones above it.
const MODULES = ['utils', 'seed', 'costing', 'planner', 'store', 'views', 'app'];

const NS = (name) => `__${name}`;

function exportedNames(source) {
  const names = new Set();
  const patterns = [
    /^export\s+(?:async\s+)?function\s+([A-Za-z_$][\w$]*)/gm,
    /^export\s+(?:const|let|var)\s+([A-Za-z_$][\w$]*)/gm,
  ];
  for (const re of patterns) {
    for (const m of source.matchAll(re)) names.add(m[1]);
  }
  return [...names];
}

// `import { a, b } from './x.js'` -> `const { a, b } = __x;`
// `import * as store from './store.js'` -> `const store = __store;`
function rewriteImports(source) {
  return source
    .replace(/^import\s+\*\s+as\s+([A-Za-z_$][\w$]*)\s+from\s+['"]\.\/([\w-]+)\.js['"];?\s*$/gm,
      (_, alias, mod) => `const ${alias} = ${NS(mod)};`)
    .replace(/^import\s+\{([\s\S]*?)\}\s+from\s+['"]\.\/([\w-]+)\.js['"];?\s*$/gm,
      (_, names, mod) => `const {${names.replace(/\s+/g, ' ').trim()}} = ${NS(mod)};`);
}

function bundleModule(name) {
  const source = readFileSync(join(root, 'js', `${name}.js`), 'utf8');
  const exports = exportedNames(source);
  const body = rewriteImports(source).replace(/^export\s+/gm, '');
  return `// ---------- js/${name}.js ----------
const ${NS(name)} = (() => {
${body}
return { ${exports.join(', ')} };
})();`;
}

const css = readFileSync(join(root, 'css', 'styles.css'), 'utf8');
const script = MODULES.map(bundleModule).join('\n\n');

// The page body only — the host wraps it in <!doctype html><head></head><body>.
// The charset declaration matters: this file is full of £, · and emoji, and a
// host that serves it without one renders them as mojibake.
const html = `<meta charset="utf-8" />
<title>Meal Prep</title>
<meta name="description" content="Weekly meal plan, shopping list and exact cost — cheap, high protein, two cook sessions a week." />
<meta name="theme-color" content="#16794a" />

<style>
${css}</style>

<div id="app">
  <header class="topbar">
    <span id="topbar-title">🥘 This week</span>
  </header>

  <main id="view-root" class="view-root"></main>

  <nav class="tabbar">
    <button class="tab-btn active" data-action="switch-tab" data-tab="week">
      <span class="tab-icon">🗓️</span><span class="tab-label">Week</span>
    </button>
    <button class="tab-btn" data-action="switch-tab" data-tab="shop">
      <span class="tab-icon">🛒</span><span class="tab-label">Shop</span>
    </button>
    <button class="tab-btn" data-action="switch-tab" data-tab="cook">
      <span class="tab-icon">👨‍🍳</span><span class="tab-label">Cook</span>
    </button>
    <button class="tab-btn" data-action="switch-tab" data-tab="prices">
      <span class="tab-icon">🏷️</span><span class="tab-label">Prices</span>
    </button>
    <button class="tab-btn" data-action="switch-tab" data-tab="more">
      <span class="tab-icon">⚙️</span><span class="tab-label">More</span>
    </button>
  </nav>

  <div id="modal-root"></div>
  <div id="toast-root" class="toast-root"></div>
</div>

<script type="module">
${script}
</script>
`;

const out = resolve(process.argv[2] || join(root, 'dist', 'meal-prep.html'));
mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, html);
console.log(`wrote ${out} (${Math.round(html.length / 1024)} KB)`);
