// App shell: state wiring, tab routing, event delegation, modals.

import {
  DAY_KEYS, SLOT_KEYS, SLOT_LABELS, isoDate, startOfWeek, addDays,
  escapeHtml, money, qs, uid,
} from './utils.js';
import * as store from './store.js';
import { summarise, recipeStats, proteinPerPound } from './costing.js';
import { generatePlan } from './planner.js';
import { CATEGORIES } from './seed.js';
import { searchFoods } from './foods.js';
import { canScanWithCamera, lookupBarcode, LookupError } from './barcode.js';
import {
  renderWeek, renderShop, renderCook, renderPrices, renderMore, shoppingText,
} from './views.js';

const ui = {
  tab: 'week',
  weekStart: startOfWeek(new Date()),
  priceFilter: 'week',
  modal: null,       // { type, ... }
  recipeDraft: null,
  priceDraft: null,  // the ingredient being edited, so a lookup can fill it in
  foodQuery: '',
  scan: null,        // { status, message, stream }
};

// ---------------------------------------------------------------------------
// Context + render
// ---------------------------------------------------------------------------

function buildCtx() {
  const state = store.getState();
  const ingMap = store.ingredientMap();
  const recipeMap = store.recipeMap();
  const weekIso = isoDate(ui.weekStart);
  const plan = store.getPlan(weekIso) || { meals: {}, bought: {}, seed: 1, generatedAt: null };
  const summary = summarise(plan, recipeMap, ingMap, state.pantry);
  return {
    state, ingMap, recipeMap, weekIso, plan, summary,
    weekStart: ui.weekStart,
    priceFilter: ui.priceFilter,
  };
}

function render() {
  const ctx = buildCtx();
  applyTheme(ctx.state.settings.theme);

  const root = qs('#view-root');
  const titles = {
    week: '🥘 This week', shop: '🛒 Shopping list', cook: '👨‍🍳 Cook sessions',
    prices: '🏷️ Prices', more: '⚙️ Settings',
  };
  qs('#topbar-title').textContent = titles[ui.tab] || 'Meal Prep';

  if (ui.tab === 'week') root.innerHTML = renderWeek(ctx);
  else if (ui.tab === 'shop') root.innerHTML = renderShop(ctx);
  else if (ui.tab === 'cook') root.innerHTML = renderCook(ctx);
  else if (ui.tab === 'prices') root.innerHTML = renderPrices(ctx);
  else root.innerHTML = renderMore(ctx);

  for (const btn of document.querySelectorAll('.tab-btn')) {
    btn.classList.toggle('active', btn.dataset.tab === ui.tab);
  }

  renderModal(ctx);
}

// Some hosts stamp data-theme on the root themselves to pass their own
// light/dark choice down. "Auto" has to mean "don't touch that", so this only
// ever clears a stamp it put there itself.
let themeStampedByApp = false;

function applyTheme(theme) {
  const root = document.documentElement;
  if (theme === 'auto') {
    if (themeStampedByApp) {
      delete root.dataset.theme;
      themeStampedByApp = false;
    }
    return;
  }
  root.dataset.theme = theme;
  themeStampedByApp = true;
}

function toast(message) {
  const root = qs('#toast-root');
  const el = document.createElement('div');
  el.className = 'toast';
  el.textContent = message;
  root.appendChild(el);
  setTimeout(() => el.remove(), 2200);
}

// ---------------------------------------------------------------------------
// Modals
// ---------------------------------------------------------------------------

function openModal(modal) {
  ui.modal = modal;
  render();
}

function closeModal() {
  stopScanner();
  ui.modal = null;
  ui.recipeDraft = null;
  ui.priceDraft = null;
  ui.foodQuery = '';
  render();
}

function renderModal(ctx) {
  const root = qs('#modal-root');
  if (!ui.modal) { root.innerHTML = ''; return; }

  let body = '';
  if (ui.modal.type === 'pick-meal') body = pickMealModal(ctx);
  else if (ui.modal.type === 'edit-price') body = editPriceModal(ctx);
  else if (ui.modal.type === 'recipes') body = recipeListModal(ctx);
  else if (ui.modal.type === 'recipe-edit') body = recipeEditModal(ctx);
  else if (ui.modal.type === 'food-search') body = foodSearchModal(ctx);
  else if (ui.modal.type === 'barcode') body = barcodeModal(ctx);
  else if (ui.modal.type === 'text') body = textModal(ctx);

  root.innerHTML = `<div class="modal-backdrop" data-action="close-modal"><div class="modal" data-stop>${body}</div></div>`;
}

function pickMealModal(ctx) {
  const { slot, day } = ui.modal;
  const { ingMap, plan } = ctx;
  const current = ((plan.meals || {})[day] || {})[slot];

  const options = store.recipesForSlot(slot)
    .map((r) => ({ r, stats: recipeStats(r, ingMap), ppp: proteinPerPound(r, ingMap) }))
    .sort((a, b) => b.ppp - a.ppp);

  return `
    <div class="modal-title">${SLOT_LABELS[slot]} — ${day[0].toUpperCase() + day.slice(1)}</div>
    <div class="field-hint" style="margin-bottom:10px">Sorted by protein per pound, best value first.</div>
    ${options.map(({ r, stats }) => `
      <button class="option-row ${current && current.recipe === r.id ? 'on' : ''}" data-action="set-meal" data-recipe="${r.id}">
        <div class="option-main">
          <div class="option-name">${escapeHtml(r.name)}<span class="badge ${r.mode === 'batch' ? 'batch' : 'fresh'}">${r.mode === 'batch' ? 'batch' : 'fresh'}</span></div>
          <div class="option-sub">${Math.round(stats.protein)}g protein · ${Math.round(stats.kcal)} kcal · ${r.minutes} min</div>
        </div>
        <div class="shop-cost">${money(stats.cost)}</div>
      </button>
    `).join('')}
    <div class="btn-row" style="margin-top:12px">
      ${current ? '<button class="btn danger" data-action="clear-meal">Remove</button>' : ''}
      <button class="btn" data-action="close-modal">Close</button>
    </div>
  `;
}

function editPriceModal(ctx) {
  const ing = ui.priceDraft;
  if (!ing) return '<div class="modal-title">Gone</div>';

  return `
    <div class="modal-title">${escapeHtml(ing.name)}</div>

    <div class="btn-row">
      <button class="btn small" data-action="open-food-search">🔍 Fill from food list</button>
      <button class="btn small" data-action="open-barcode">📷 Scan barcode</button>
    </div>
    <div class="field-hint" style="margin:-6px 0 14px">
      Either one fills in the name, pack size and nutrition. Neither can fill in
      the price — no database has your shop's prices, so that stays yours to type.
    </div>

    <div class="field">
      <label for="ing-name">Name</label>
      <input id="ing-name" type="text" value="${escapeHtml(ing.name)}" />
    </div>
    <div class="field-pair">
      <div class="field">
        <label for="ing-price">Pack price (£)</label>
        <input id="ing-price" type="number" inputmode="decimal" step="0.01" value="${ing.packPrice}" />
      </div>
      <div class="field">
        <label for="ing-qty">Pack size</label>
        <input id="ing-qty" type="number" inputmode="decimal" step="1" value="${ing.packQty}" />
      </div>
      <div class="field">
        <label for="ing-unit">Unit</label>
        <select id="ing-unit">
          <option value="g" ${ing.unit === 'g' ? 'selected' : ''}>g</option>
          <option value="ml" ${ing.unit === 'ml' ? 'selected' : ''}>ml</option>
          <option value="unit" ${ing.unit === 'unit' ? 'selected' : ''}>each</option>
        </select>
      </div>
    </div>
    <div class="field-hint" style="margin-top:-6px;margin-bottom:12px">
      Whatever's on the shelf edge: £5.75 for a 1000g bag, £3.20 for 15 eggs.
    </div>
    <div class="field-pair">
      <div class="field">
        <label for="ing-protein">Protein${ing.unit === 'unit' ? ' each' : ' / 100' + ing.unit}</label>
        <input id="ing-protein" type="number" inputmode="decimal" step="0.1" value="${ing.protein}" />
      </div>
      <div class="field">
        <label for="ing-kcal">kcal${ing.unit === 'unit' ? ' each' : ' / 100' + ing.unit}</label>
        <input id="ing-kcal" type="number" inputmode="decimal" step="1" value="${ing.kcal}" />
      </div>
      <div class="field">
        <label for="ing-cat">Aisle</label>
        <select id="ing-cat">
          ${CATEGORIES.map((c) => `<option value="${c.key}" ${ing.category === c.key ? 'selected' : ''}>${c.label}</option>`).join('')}
        </select>
      </div>
    </div>
    <div class="switch-row">
      <div>
        <div class="switch-label">Cupboard staple</div>
        <div class="switch-sub">Lasts months — kept out of the weekly total once you have it</div>
      </div>
      <button class="chip ${ing.staple ? 'on' : ''}" data-action="toggle-staple" data-id="${ing.id}">${ing.staple ? 'Yes' : 'No'}</button>
    </div>
    <div class="btn-row" style="margin-top:14px">
      <button class="btn primary" data-action="save-price" data-id="${ing.id}">Save</button>
      <button class="btn" data-action="close-modal">Cancel</button>
    </div>
    <button class="btn block danger" data-action="delete-ingredient" data-id="${ing.id}" style="margin-top:8px">Delete item</button>
  `;
}

function recipeListModal(ctx) {
  const { ingMap } = ctx;
  const bySlot = SLOT_KEYS.map((slot) => {
    const list = store.recipesForSlot(slot);
    if (!list.length) return '';
    return `
      <div class="shop-group-title">${SLOT_LABELS[slot]}</div>
      ${list.map((r) => {
        const stats = recipeStats(r, ingMap);
        return `
          <button class="option-row" data-action="edit-recipe" data-recipe="${r.id}">
            <div class="option-main">
              <div class="option-name">${escapeHtml(r.name)}</div>
              <div class="option-sub">${Math.round(stats.protein)}g protein · ${money(stats.cost)} · ${r.minutes} min</div>
            </div>
            <div class="shop-cost">›</div>
          </button>`;
      }).join('')}
    `;
  }).join('');

  return `
    <div class="modal-title">Recipes</div>
    ${bySlot}
    <div class="btn-row" style="margin-top:12px">
      <button class="btn primary" data-action="new-recipe">+ New</button>
      <button class="btn" data-action="close-modal">Close</button>
    </div>
  `;
}

function recipeEditModal(ctx) {
  const d = ui.recipeDraft;
  if (!d) return '';
  const { state } = ctx;
  const sorted = state.ingredients.slice().sort((a, b) => a.name.localeCompare(b.name));

  return `
    <div class="modal-title">${d.isNew ? 'New recipe' : 'Edit recipe'}</div>
    <div class="field">
      <label for="r-name">Name</label>
      <input id="r-name" type="text" value="${escapeHtml(d.name)}" />
    </div>
    <div class="field-pair">
      <div class="field">
        <label for="r-slot">Meal</label>
        <select id="r-slot">
          ${SLOT_KEYS.map((s) => `<option value="${s}" ${d.slot === s ? 'selected' : ''}>${SLOT_LABELS[s]}</option>`).join('')}
        </select>
      </div>
      <div class="field">
        <label for="r-mode">Style</label>
        <select id="r-mode">
          <option value="batch" ${d.mode === 'batch' ? 'selected' : ''}>Batch cook</option>
          <option value="assemble" ${d.mode !== 'batch' ? 'selected' : ''}>Made fresh</option>
        </select>
      </div>
    </div>
    <div class="field-pair">
      <div class="field">
        <label for="r-minutes">Minutes</label>
        <input id="r-minutes" type="number" inputmode="numeric" value="${d.minutes}" />
      </div>
      <div class="field">
        <label for="r-keeps">Fridge days</label>
        <input id="r-keeps" type="number" inputmode="numeric" value="${d.keeps}" />
      </div>
    </div>

    <div class="shop-group-title">Ingredients (per portion)</div>
    ${d.items.map((it, i) => `
      <div class="field-pair" style="align-items:flex-end">
        <div class="field" style="flex:2">
          <select data-action="draft-ing" data-index="${i}">
            ${sorted.map((ing) => `<option value="${ing.id}" ${it.ingredient === ing.id ? 'selected' : ''}>${escapeHtml(ing.name)}</option>`).join('')}
          </select>
        </div>
        <div class="field" style="flex:1">
          <input type="number" inputmode="decimal" step="0.1" value="${it.amount}" data-action="draft-amt" data-index="${i}" />
        </div>
        <div class="field" style="flex:none">
          <button class="btn small danger" data-action="draft-remove" data-index="${i}">✕</button>
        </div>
      </div>
    `).join('')}
    <button class="btn small" data-action="draft-add">+ Ingredient</button>
    <div class="field-hint" style="margin-top:6px">
      Amounts are grams, ml or count, per single portion — dry weight for rice,
      pasta and oats.
    </div>

    <div class="field" style="margin-top:14px">
      <label for="r-steps">Method (one step per line)</label>
      <textarea id="r-steps" rows="5">${escapeHtml(d.steps.join('\n'))}</textarea>
    </div>

    <div class="btn-row">
      <button class="btn primary" data-action="save-recipe">Save</button>
      <button class="btn" data-action="close-modal">Cancel</button>
    </div>
    ${d.isNew ? '' : '<button class="btn block danger" data-action="delete-recipe">Delete recipe</button>'}
  `;
}

// Search the bundled food table. No network — this works everywhere, including
// inside Claude where outside requests are blocked.
function foodSearchModal() {
  const results = searchFoods(ui.foodQuery, 40);

  return `
    <div class="modal-title">Fill from food list</div>
    <div class="field">
      <input id="food-query" type="search" placeholder="chicken, oats, yoghurt…"
             value="${escapeHtml(ui.foodQuery)}" data-action="food-query" autocomplete="off" />
      <div class="field-hint">
        Typical values for the food, not a specific brand. Fills the nutrition and
        a common pack size — check both against the packet, and type the price.
      </div>
    </div>
    ${results.length ? results.map((food, i) => `
      <button class="option-row" data-action="pick-food" data-index="${i}">
        <div class="option-main">
          <div class="option-name">${escapeHtml(food.name)}</div>
          <div class="option-sub">
            ${food.protein}g protein · ${food.kcal} kcal
            ${food.unit === 'unit' ? 'each' : `per 100${food.unit}`}
            ${food.pack ? ` · usually ${food.pack}${food.unit === 'unit' ? ' ' + food.unitNoun + 's' : food.unit}` : ''}
          </div>
        </div>
      </button>
    `).join('') : '<div class="empty-state">Nothing matching. Type the details in yourself.</div>'}
    <div class="btn-row" style="margin-top:12px">
      <button class="btn" data-action="cancel-lookup">Back</button>
    </div>
  `;
}

function barcodeModal() {
  const scan = ui.scan || {};
  const camera = canScanWithCamera();

  return `
    <div class="modal-title">Scan a barcode</div>

    ${camera ? `
      <video id="scan-video" playsinline muted
             style="width:100%;border-radius:12px;background:#000;aspect-ratio:4/3;object-fit:cover"></video>
      <div class="field-hint" style="margin:8px 0 14px">
        Hold the barcode in frame. If it won't catch, type the digits below instead.
      </div>
    ` : `
      <div class="notice">
        This browser can't read barcodes with the camera — Safari doesn't support
        it. Type the digits from under the barcode instead; it's the same lookup.
      </div>
    `}

    <div class="field">
      <label for="scan-code">Barcode digits</label>
      <input id="scan-code" type="text" inputmode="numeric" placeholder="5000157024671"
             value="${escapeHtml(scan.code || '')}" autocomplete="off" />
    </div>

    ${scan.message ? `<div class="notice ${scan.status === 'error' ? 'warn' : ''}">${escapeHtml(scan.message)}</div>` : ''}

    <div class="btn-row">
      <button class="btn primary" data-action="lookup-barcode">Look it up</button>
      <button class="btn" data-action="cancel-lookup">Back</button>
    </div>
    <div class="field-hint">
      Looks the product up in Open Food Facts, a free open database. It has names,
      pack sizes and nutrition — never prices. Needs a connection, and doesn't
      work inside Claude.
    </div>
  `;
}

function textModal() {
  const { title, hint, value, mode } = ui.modal;
  return `
    <div class="modal-title">${escapeHtml(title)}</div>
    <div class="field-hint" style="margin-bottom:10px">${escapeHtml(hint)}</div>
    <div class="field">
      <textarea id="text-box" rows="10" ${mode === 'export' ? 'readonly' : ''}>${escapeHtml(value || '')}</textarea>
    </div>
    <div class="btn-row">
      ${mode === 'export'
        ? '<button class="btn primary" data-action="copy-text">Copy</button>'
        : '<button class="btn primary" data-action="do-import">Import</button>'}
      <button class="btn" data-action="close-modal">Close</button>
    </div>
  `;
}

// ---------------------------------------------------------------------------
// Actions
// ---------------------------------------------------------------------------

const actions = {
  'switch-tab'(el) {
    ui.tab = el.dataset.tab;
    render();
  },

  'week-prev'() { ui.weekStart = addDays(ui.weekStart, -7); render(); },
  'week-next'() { ui.weekStart = addDays(ui.weekStart, 7); render(); },

  generate() {
    const ctx = buildCtx();
    const prev = store.getPlan(ctx.weekIso);
    const seed = prev && prev.generatedAt ? (prev.seed || 1) + 7 : 1;
    const plan = generatePlan(ctx.state, seed);
    plan.bought = prev ? prev.bought || {} : {};
    store.setPlan(ctx.weekIso, plan);
    const after = summarise(plan, ctx.recipeMap, ctx.ingMap, ctx.state.pantry);
    toast(`${money(after.tillTotal)} · ${Math.round(after.avgProtein)}g protein a day`);
    render();
  },

  'clear-week'() {
    const ctx = buildCtx();
    store.setPlan(ctx.weekIso, { meals: {}, bought: {}, seed: 1, generatedAt: null });
    render();
  },

  'pick-meal'(el) {
    openModal({ type: 'pick-meal', day: el.dataset.day, slot: el.dataset.slot });
  },

  'set-meal'(el) {
    const ctx = buildCtx();
    const { day, slot } = ui.modal;
    store.setMeal(ctx.weekIso, day, slot, {
      recipe: el.dataset.recipe,
      servings: Math.max(1, ctx.state.settings.servings || 1),
    });
    closeModal();
  },

  'clear-meal'() {
    const ctx = buildCtx();
    store.setMeal(ctx.weekIso, ui.modal.day, ui.modal.slot, null);
    closeModal();
  },

  tick(el) {
    const ctx = buildCtx();
    store.toggleBought(ctx.weekIso, el.dataset.id);
    render();
  },

  pantry(el) {
    const state = store.getState();
    store.setPantry(el.dataset.id, !state.pantry[el.dataset.id]);
    render();
  },

  'clear-ticks'() {
    const ctx = buildCtx();
    store.clearBought(ctx.weekIso);
    render();
  },

  async 'copy-list'() {
    const ctx = buildCtx();
    await copyText(shoppingText(ctx.summary, ctx.weekStart));
    toast('Shopping list copied');
  },

  'edit-price'(el) {
    const ing = store.getIngredient(el.dataset.id);
    if (!ing) return;
    ui.priceDraft = { ...ing };
    openModal({ type: 'edit-price', id: ing.id });
  },

  'toggle-staple'() {
    capturePriceFields();
    if (ui.priceDraft) ui.priceDraft.staple = !ui.priceDraft.staple;
    render();
  },

  'save-price'(el) {
    const price = Number(qs('#ing-price').value);
    const packQty = Number(qs('#ing-qty').value);
    if (!Number.isFinite(price) || price < 0 || !Number.isFinite(packQty) || packQty <= 0) {
      toast('Check the price and pack size');
      return;
    }
    store.updateIngredient(el.dataset.id, {
      name: qs('#ing-name').value.trim() || 'Unnamed',
      packPrice: price,
      packQty,
      unit: qs('#ing-unit').value,
      protein: Number(qs('#ing-protein').value) || 0,
      kcal: Number(qs('#ing-kcal').value) || 0,
      category: qs('#ing-cat').value,
      staple: !!(ui.priceDraft && ui.priceDraft.staple),
      unitNoun: (ui.priceDraft && ui.priceDraft.unitNoun) || 'x',
    });
    closeModal();
    toast('Price saved');
  },

  'delete-ingredient'(el) {
    if (!confirm('Delete this item? It will be removed from any recipe using it.')) return;
    store.deleteIngredient(el.dataset.id);
    closeModal();
  },

  'open-food-search'() {
    capturePriceFields();
    ui.foodQuery = '';
    openModal({ type: 'food-search' });
  },

  'pick-food'(el) {
    const food = searchFoods(ui.foodQuery, 40)[Number(el.dataset.index)];
    if (!food) return;
    const d = ui.priceDraft;
    d.name = food.name;
    d.protein = food.protein;
    d.kcal = food.kcal;
    d.unit = food.unit;
    d.category = food.category;
    d.unitNoun = food.unitNoun;
    d.staple = food.staple;
    if (food.pack) d.packQty = food.pack;
    openModal({ type: 'edit-price', id: d.id });
    toast('Filled in — now the price');
  },

  'open-barcode'() {
    capturePriceFields();
    ui.scan = null;
    openModal({ type: 'barcode' });
    startScanner();
  },

  'lookup-barcode'() {
    const code = qs('#scan-code').value;
    stopScanner();
    ui.scan = { code, status: 'busy', message: 'Looking it up…' };
    render();
    runLookup(code);
  },

  'cancel-lookup'() {
    stopScanner();
    openModal({ type: 'edit-price', id: ui.priceDraft ? ui.priceDraft.id : null });
  },

  'price-filter'(el) {
    ui.priceFilter = el.dataset.filter;
    render();
  },

  'add-ingredient'() {
    const ing = store.addIngredient({ name: 'New item' });
    ui.priceDraft = { ...ing };
    // Otherwise the default "this week's shop" filter hides what you just added.
    ui.priceFilter = 'all';
    openModal({ type: 'edit-price', id: ing.id });
  },

  'toggle-cookday'(el) {
    const state = store.getState();
    const day = el.dataset.day;
    const days = state.settings.cookDays.includes(day)
      ? state.settings.cookDays.filter((d) => d !== day)
      : [...state.settings.cookDays, day];
    if (!days.length) { toast('You need at least one cook day'); return; }
    store.updateSettings({ cookDays: days.sort((a, b) => DAY_KEYS.indexOf(a) - DAY_KEYS.indexOf(b)) });
    render();
  },

  'toggle-slot'(el) {
    const state = store.getState();
    const slot = el.dataset.slot;
    store.updateSettings({ slots: { ...state.settings.slots, [slot]: !state.settings.slots[slot] } });
    render();
  },

  'set-theme'(el) {
    store.updateSettings({ theme: el.dataset.theme });
    render();
  },

  'browse-recipes'() { openModal({ type: 'recipes' }); },

  'new-recipe'() {
    ui.recipeDraft = {
      id: uid(), name: '', slot: 'dinner', mode: 'batch', minutes: 30, keeps: 3,
      items: [], steps: [], custom: true, isNew: true,
    };
    openModal({ type: 'recipe-edit' });
  },

  'edit-recipe'(el) {
    const r = store.getRecipe(el.dataset.recipe);
    if (!r) return;
    ui.recipeDraft = { ...r, items: r.items.map((i) => ({ ...i })), steps: [...r.steps], isNew: false };
    openModal({ type: 'recipe-edit' });
  },

  'draft-add'() {
    const state = store.getState();
    captureRecipeFields();
    ui.recipeDraft.items.push({ ingredient: state.ingredients[0].id, amount: 100 });
    render();
  },

  'draft-remove'(el) {
    captureRecipeFields();
    ui.recipeDraft.items.splice(Number(el.dataset.index), 1);
    render();
  },

  'save-recipe'() {
    captureRecipeFields();
    const d = ui.recipeDraft;
    if (!d.name.trim()) { toast('Give it a name'); return; }
    if (!d.items.length) { toast('Add at least one ingredient'); return; }
    store.saveRecipe({
      id: d.id, name: d.name.trim(), slot: d.slot, mode: d.mode,
      minutes: d.minutes, keeps: d.keeps, items: d.items, steps: d.steps, custom: true,
    });
    closeModal();
    toast('Recipe saved');
  },

  'delete-recipe'() {
    if (!confirm('Delete this recipe? It will be removed from any plan using it.')) return;
    store.deleteRecipe(ui.recipeDraft.id);
    closeModal();
  },

  export() {
    openModal({
      type: 'text', mode: 'export', title: 'Export data',
      hint: 'Copy this somewhere safe — notes app, email to yourself. It is the only backup.',
      value: store.exportJson(),
    });
  },

  import() {
    openModal({
      type: 'text', mode: 'import', title: 'Import data',
      hint: 'Paste a backup here. It replaces everything currently in the app.',
      value: '',
    });
  },

  async 'copy-text'() {
    await copyText(qs('#text-box').value);
    toast('Copied');
  },

  'do-import'() {
    try {
      store.importJson(qs('#text-box').value);
      closeModal();
      toast('Data imported');
    } catch (e) {
      toast('That did not look like a backup');
    }
  },

  reset() {
    if (!confirm('Delete every plan, price and recipe change and start over?')) return;
    store.resetAll();
    ui.weekStart = startOfWeek(new Date());
    closeModal();
    toast('Reset');
  },

  'close-modal'() { closeModal(); },
};

// Keeps whatever is typed in the price form when a lookup modal opens over it.
function capturePriceFields() {
  const d = ui.priceDraft;
  if (!d) return;
  const name = qs('#ing-name');
  if (!name) return;
  d.name = name.value;
  d.packPrice = Number(qs('#ing-price').value) || 0;
  d.packQty = Number(qs('#ing-qty').value) || d.packQty;
  d.unit = qs('#ing-unit').value;
  d.protein = Number(qs('#ing-protein').value) || 0;
  d.kcal = Number(qs('#ing-kcal').value) || 0;
  d.category = qs('#ing-cat').value;
}

// The camera runs only while the barcode modal is open; anything that closes it
// has to hand the camera back or the light stays on.
function stopScanner() {
  if (ui.scan && ui.scan.stream) {
    for (const track of ui.scan.stream.getTracks()) track.stop();
  }
  if (ui.scan && ui.scan.raf) cancelAnimationFrame(ui.scan.raf);
  ui.scan = null;
}

async function startScanner() {
  if (!canScanWithCamera()) return;
  const video = qs('#scan-video');
  if (!video) return;

  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'environment' },
    });
    if (!ui.modal || ui.modal.type !== 'barcode') {
      for (const track of stream.getTracks()) track.stop();
      return;
    }
    ui.scan = { ...(ui.scan || {}), stream };
    video.srcObject = stream;
    await video.play();

    const detector = new window.BarcodeDetector({
      formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128'],
    });

    const tick = async () => {
      if (!ui.modal || ui.modal.type !== 'barcode' || !ui.scan) return;
      try {
        const codes = await detector.detect(video);
        if (codes && codes.length && codes[0].rawValue) {
          const code = codes[0].rawValue;
          stopScanner();
          ui.scan = { code, status: 'busy', message: 'Looking it up…' };
          render();
          runLookup(code);
          return;
        }
      } catch (e) {
        /* a frame that won't decode is normal — keep going */
      }
      ui.scan.raf = requestAnimationFrame(tick);
    };
    ui.scan.raf = requestAnimationFrame(tick);
  } catch (e) {
    ui.scan = { status: 'error', message: 'No camera access. Type the digits instead.' };
    render();
  }
}

async function runLookup(code) {
  if (!ui.priceDraft) return;
  try {
    const found = await lookupBarcode(code);
    applyLookup(found);
    openModal({ type: 'edit-price', id: ui.priceDraft.id });
    toast(found.protein == null ? 'Found it — nutrition was missing' : 'Filled from barcode');
  } catch (e) {
    const message = e instanceof LookupError ? e.message : 'That lookup failed.';
    ui.scan = { code, status: 'error', message };
    render();
  }
}

// Only ever writes fields the lookup actually returned, and never the price.
function applyLookup(found) {
  const d = ui.priceDraft;
  if (!d) return;
  if (found.name) d.name = found.name;
  if (found.packQty) d.packQty = found.packQty;
  if (found.unit) d.unit = found.unit;
  if (found.protein != null) d.protein = found.protein;
  if (found.kcal != null) d.kcal = found.kcal;
}

// Reads the recipe form back into the draft before any re-render, so typing
// isn't lost when a row is added or removed.
function captureRecipeFields() {
  const d = ui.recipeDraft;
  if (!d) return;
  const name = qs('#r-name');
  if (!name) return;
  d.name = name.value;
  d.slot = qs('#r-slot').value;
  d.mode = qs('#r-mode').value;
  d.minutes = Number(qs('#r-minutes').value) || 0;
  d.keeps = Number(qs('#r-keeps').value) || 0;
  d.steps = qs('#r-steps').value.split('\n').map((s) => s.trim()).filter(Boolean);
  for (const sel of document.querySelectorAll('[data-action="draft-ing"]')) {
    d.items[Number(sel.dataset.index)].ingredient = sel.value;
  }
  for (const inp of document.querySelectorAll('[data-action="draft-amt"]')) {
    d.items[Number(inp.dataset.index)].amount = Number(inp.value) || 0;
  }
}

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
  } catch (e) {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    ta.remove();
  }
}

// ---------------------------------------------------------------------------
// Wiring
// ---------------------------------------------------------------------------

document.addEventListener('click', (event) => {
  if (!(event.target instanceof Element)) return;
  const el = event.target.closest('[data-action]');
  if (!el) return;
  // The backdrop closes the sheet, but only when the backdrop itself is what
  // was tapped — anything inside the sheet bubbles up through it.
  if (el.classList.contains('modal-backdrop') && event.target !== el) return;
  const fn = actions[el.dataset.action];
  if (!fn) return;
  event.preventDefault();
  fn(el);
});

// The food search filters as you type. Re-rendering replaces the input, so the
// caret has to be put back or typing jumps to the end of the box.
document.addEventListener('input', (event) => {
  const el = event.target.closest('[data-action="food-query"]');
  if (!el) return;
  const caret = el.selectionStart;
  ui.foodQuery = el.value;
  render();
  const again = qs('#food-query');
  if (!again) return;
  again.focus();
  try {
    again.setSelectionRange(caret, caret);
  } catch (e) {
    /* some browsers refuse selection on search inputs — focus alone is enough */
  }
});

// Settings inputs commit on change rather than every keystroke.
document.addEventListener('change', (event) => {
  const el = event.target.closest('[data-action="set-number"]');
  if (!el) return;
  const value = Number(el.value);
  if (!Number.isFinite(value) || value < 0) return;
  store.updateSettings({ [el.dataset.key]: value });
  render();
});

function boot() {
  store.load();
  render();

  // The single-file build has no manifest and no sw.js beside it; the installed
  // PWA has both. Registering only when the manifest is present keeps one
  // codebase serving both without a build-time switch.
  if ('serviceWorker' in navigator && document.querySelector('link[rel="manifest"]')) {
    navigator.serviceWorker.register('./sw.js').catch(() => { /* offline support is optional */ });
  }
}

boot();
