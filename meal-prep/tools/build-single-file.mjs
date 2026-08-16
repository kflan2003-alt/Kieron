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

// Modules are discovered by walking imports out from the entry point and
// emitted in dependency order. Deriving it beats hand-maintaining a list: a new
// module used to be silently left out, producing a bundle that threw on load.
const ENTRY = 'app';

function readModule(name) {
  return readFileSync(join(root, 'js', `${name}.js`), 'utf8');
}

function importsOf(source) {
  return [...source.matchAll(/^import\s+(?:[\s\S]*?)\s+from\s+['"]\.\/([\w-]+)\.js['"]/gm)]
    .map((m) => m[1]);
}

function moduleOrder(entry) {
  const order = [];
  const seen = new Set();
  const visiting = new Set();

  const visit = (name) => {
    if (seen.has(name)) return;
    if (visiting.has(name)) throw new Error(`circular import via ${name}.js`);
    visiting.add(name);
    for (const dep of importsOf(readModule(name))) visit(dep);
    visiting.delete(name);
    seen.add(name);
    order.push(name); // post-order: dependencies land before their dependents
  };

  visit(entry);
  return order;
}

const MODULES = moduleOrder(ENTRY);

const NS = (name) => `__${name}`;

function exportedNames(source) {
  const names = new Set();
  const patterns = [
    /^export\s+(?:async\s+)?function\s+([A-Za-z_$][\w$]*)/gm,
    /^export\s+(?:const|let|var)\s+([A-Za-z_$][\w$]*)/gm,
    /^export\s+class\s+([A-Za-z_$][\w$]*)/gm,
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
  const source = readModule(name);
  const exports = exportedNames(source);
  const body = rewriteImports(source).replace(/^export\s+/gm, '');
  return `// ---------- js/${name}.js ----------
const ${NS(name)} = (() => {
${body}
return { ${exports.join(', ')} };
})();`;
}

const script = MODULES.map(bundleModule).join('\n\n');

// Belt and braces: every namespace referenced must also be defined, so a bundle
// that would throw on load fails the build instead.
const defined = new Set(MODULES.map(NS));
for (const [, ref] of script.matchAll(/\b(__[a-z][\w-]*)\b/gi)) {
  if (!defined.has(ref)) throw new Error(`bundle references ${ref}, which no module defines`);
}

// The font goes in as a data URI. A linked webfont would silently fall back to
// the system stack: the artifact's content policy blocks every external host,
// and there's no separate file to link to in a single-file build anyway.
const fontData = readFileSync(join(root, 'fonts', 'archivo-subset.woff2')).toString('base64');
const fontsCss = readFileSync(join(root, 'css', 'fonts.css'), 'utf8')
  .replace(/url\([^)]*\)/, `url('data:font/woff2;base64,${fontData}')`);
const css = readFileSync(join(root, 'css', 'styles.css'), 'utf8');

// Derived from index.html rather than a second copy of the markup — the two
// builds drifting apart is exactly the bug this avoids.
function inline(html, pattern, replacement, what) {
  if (!pattern.test(html)) throw new Error(`index.html has no ${what} to replace`);
  return html.replace(pattern, () => replacement);
}

let html = readFileSync(join(root, 'index.html'), 'utf8');

// Keep the head's metas (charset, title, description, theme-color); drop the
// document skeleton, which the host supplies.
html = html
  .replace(/^[\s\S]*?<head>\s*/, '')
  .replace(/<\/head>[\s\S]*?<body>\s*/, '')
  .replace(/\s*<\/body>[\s\S]*$/, '\n');

// No manifest, no icon files, no service worker beside a single file.
html = html
  .replace(/[ \t]*<link rel="manifest"[^>]*>\n?/g, '')
  .replace(/[ \t]*<link rel="icon"[^>]*>\n?/g, '')
  .replace(/[ \t]*<link rel="apple-touch-icon"[^>]*>\n?/g, '');

html = inline(html, /<link rel="stylesheet" href="css\/fonts\.css"[^>]*>/,
  `<style>\n${fontsCss}</style>`, 'fonts.css link');
html = inline(html, /<link rel="stylesheet" href="css\/styles\.css"[^>]*>/,
  `<style>\n${css}</style>`, 'styles.css link');
html = inline(html, /<script type="module" src="js\/app\.js"><\/script>/,
  `<script type="module">\n${script}\n</script>`, 'app.js script tag');

const out = resolve(process.argv[2] || join(root, 'dist', 'meal-prep.html'));
mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, html);
console.log(`wrote ${out} (${Math.round(html.length / 1024)} KB, ${MODULES.length} modules, font inlined)`);
