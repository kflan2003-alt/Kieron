// Pure rendering. Every function here returns an HTML string; app.js owns the
// state, the events and the modals.

import {
  DAY_KEYS, DAY_LABELS, DAY_SHORT, SLOT_KEYS, SLOT_LABELS, SLOT_ICONS,
  escapeHtml, money, amountLabel, formatWeekRange, addDays, clamp,
} from './utils.js';
import { recipeStats, unitPrice, outstandingTotal } from './costing.js';
import { CATEGORIES } from './seed.js';
import { cookSessions, cookBlocks, daysAfterCook } from './planner.js';

// ---------------------------------------------------------------------------
// Week
// ---------------------------------------------------------------------------

export function renderWeek(ctx) {
  const { weekStart, plan, summary, state } = ctx;
  const { settings } = state;

  if (!plan || !summary.meals.length) {
    return `
      ${weekNav(weekStart)}
      <div class="empty-state">
        <p style="font-size:2.2rem;margin:0 0 8px">🍳</p>
        <p><strong>No plan for this week yet.</strong></p>
        <p>Build one and it'll pick the cheapest meals that still hit
        ${settings.proteinTarget}g of protein a day, then tell you exactly what
        to buy.</p>
      </div>
      <button class="btn primary block" data-action="generate">Build this week's plan</button>
    `;
  }

  const budget = settings.budget || 0;
  const budgetPct = budget ? clamp((summary.tillTotal / budget) * 100, 0, 100) : 0;
  const over = budget && summary.tillTotal > budget;
  const proteinPct = settings.proteinTarget
    ? clamp((summary.avgProtein / settings.proteinTarget) * 100, 0, 100)
    : 0;
  // A couple of grams either side of target isn't worth flagging.
  const proteinShort = settings.proteinTarget && summary.avgProtein < settings.proteinTarget - 5;

  const blocks = cookBlocks(settings.cookDays);

  return `
    ${weekNav(weekStart)}

    <div class="stat-row">
      <div class="stat ${over ? 'over' : 'good'}">
        <div class="stat-value">${money(summary.tillTotal)}</div>
        <div class="stat-label">TILL TOTAL</div>
      </div>
      <div class="stat">
        <div class="stat-value">${money(summary.costPerMeal)}</div>
        <div class="stat-label">PER MEAL</div>
      </div>
      <div class="stat ${proteinShort ? 'over' : 'good'}">
        <div class="stat-value">${Math.round(summary.avgProtein)}g</div>
        <div class="stat-label">PROTEIN / DAY</div>
      </div>
    </div>

    <div class="card">
      <div class="card-head">
        <span class="card-title">Budget</span>
        <span class="card-sub">${money(summary.tillTotal)} of ${money(budget)}</span>
      </div>
      <div class="meter"><div class="meter-fill ${over ? 'over' : ''}" style="width:${budgetPct}%"></div></div>
      <div class="card-head" style="margin-top:12px">
        <span class="card-title">Protein</span>
        <span class="card-sub">${Math.round(summary.avgProtein)}g of ${settings.proteinTarget}g a day</span>
      </div>
      <div class="meter"><div class="meter-fill ${proteinShort ? 'over' : ''}" style="width:${proteinPct}%"></div></div>
      <div class="field-hint" style="margin-top:10px">
        ${summary.mealCount} meals · ${Math.round(summary.avgKcal)} kcal a day ·
        ${money(summary.usedTotal)} of food actually eaten, ${money(summary.leftoverValue)}
        left in the cupboard for next week.
      </div>
    </div>

    ${proteinShort && plan.generatedAt ? `
      <div class="notice">
        This is the best it could do: nothing in the recipe list reaches
        ${settings.proteinTarget}g a day while staying inside ${money(budget)}.
        It's short by ${Math.round(settings.proteinTarget - summary.avgProtein)}g.
        Raise the budget, turn on a second snack, or add a high-protein recipe of
        your own — all on the <strong>More</strong> tab.
      </div>` : ''}

    ${summary.estimatedLines > 0 ? `
      <div class="notice warn">
        ${summary.estimatedLines} price${summary.estimatedLines === 1 ? '' : 's'} on this
        list ${summary.estimatedLines === 1 ? 'is' : 'are'} still my estimate. Look them up
        in Inform as you shop and correct them on the <strong>Prices</strong> tab — the
        total is only as good as those numbers.
      </div>` : ''}

    <div class="btn-row">
      <button class="btn" data-action="generate">Regenerate</button>
      <button class="btn" data-action="clear-week">Clear week</button>
    </div>

    ${DAY_KEYS.map((dayKey, i) => dayCard(dayKey, addDays(weekStart, i), ctx, blocks)).join('')}
  `;
}

function weekNav(weekStart) {
  return `
    <div class="week-nav">
      <button class="btn small" data-action="week-prev">‹ Prev</button>
      <span class="week-range">${formatWeekRange(weekStart)}</span>
      <button class="btn small" data-action="week-next">Next ›</button>
    </div>
  `;
}

function dayCard(dayKey, date, ctx, blocks) {
  const { plan, state, ingMap, recipeMap } = ctx;
  const day = (plan.meals || {})[dayKey] || {};
  const totals = ctx.summary.perDay[dayKey] || { protein: 0, cost: 0 };
  const cookDay = blocks.dayToBlock[dayKey];
  const isCookDay = state.settings.cookDays.includes(dayKey);

  const rows = SLOT_KEYS.filter((slot) => state.settings.slots[slot]).map((slot) => {
    const entry = day[slot];
    const recipe = entry ? recipeMap.get(entry.recipe) : null;
    if (!recipe) {
      return `
        <button class="meal-row" data-action="pick-meal" data-day="${dayKey}" data-slot="${slot}">
          <span class="meal-icon">${SLOT_ICONS[slot]}</span>
          <span class="meal-main"><span class="meal-name empty">Add ${SLOT_LABELS[slot].toLowerCase()}</span></span>
        </button>`;
    }
    const stats = recipeStats(recipe, ingMap);
    const servings = entry.servings || 1;
    const age = daysAfterCook(cookDay, dayKey);
    const stale = recipe.mode === 'batch' && recipe.keeps > 0 && age > recipe.keeps;
    return `
      <button class="meal-row" data-action="pick-meal" data-day="${dayKey}" data-slot="${slot}">
        <span class="meal-icon">${SLOT_ICONS[slot]}</span>
        <span class="meal-main">
          <span class="meal-name">${escapeHtml(recipe.name)}${servings > 1 ? ` ×${servings}` : ''}</span>
          <span class="meal-sub">
            ${Math.round(stats.protein * servings)}g protein · ${Math.round(stats.kcal * servings)} kcal
            ${stale ? ' · <strong>from the freezer</strong>' : ''}
          </span>
        </span>
        <span class="meal-cost">${money(stats.cost * servings)}</span>
      </button>`;
  }).join('');

  return `
    <div class="card day-card">
      <div class="day-head">
        <span>${DAY_LABELS[dayKey]} ${date.getDate()}/${date.getMonth() + 1}${isCookDay ? ' · 👨‍🍳 cook day' : ''}</span>
        <span class="day-meta">${Math.round(totals.protein)}g · ${money(totals.cost)}</span>
      </div>
      ${rows}
    </div>
  `;
}

// ---------------------------------------------------------------------------
// Shop
// ---------------------------------------------------------------------------

export function renderShop(ctx) {
  const { plan, summary, weekStart } = ctx;

  if (!summary.lines.length) {
    return `
      ${weekNav(weekStart)}
      <div class="empty-state">Build a plan on the Week tab and the shopping list appears here.</div>
    `;
  }

  const bought = plan.bought || {};
  const buyLines = summary.lines.filter((l) => !l.staple && !l.have);
  const stapleLines = summary.lines.filter((l) => l.staple || l.have);
  const left = outstandingTotal(summary.lines, bought);

  const groups = CATEGORIES.map((cat) => {
    const lines = buyLines.filter((l) => l.ing.category === cat.key);
    if (!lines.length) return '';
    return `
      <div class="shop-group-title">${cat.icon} ${cat.label}</div>
      ${lines.map((l) => shopLine(l, bought)).join('')}
    `;
  }).join('');

  return `
    ${weekNav(weekStart)}

    <div class="notice">
      Quantities are whole packs, because you can't buy 300g of a 500g bag. The
      leftovers are yours to keep — that's why "per meal" below is lower than the
      till total divided by meals.
    </div>

    ${groups}

    ${stapleLines.length ? `
      <div class="shop-group-title">🧂 Cupboard staples</div>
      <div class="notice">
        Oil, spices, stock cubes and the like. Tick the ones you already have and
        they come off the total — untick when they run out.
      </div>
      ${stapleLines.map((l) => stapleLine(l)).join('')}
    ` : ''}

    <div class="total-bar">
      <span>
        ${money(left)}
        <span class="total-sub" style="display:block">left to buy</span>
      </span>
      <span style="text-align:right">
        ${money(summary.tillTotal)}
        <span class="total-sub" style="display:block">full list</span>
      </span>
    </div>

    <div class="btn-row" style="margin-top:12px">
      <button class="btn" data-action="clear-ticks">Untick all</button>
      <button class="btn" data-action="copy-list">Copy list</button>
    </div>
  `;
}

function shopLine(line, bought) {
  const done = !!bought[line.id];
  const ing = line.ing;
  const packLabel = amountLabel(ing, ing.packQty);
  const packs = line.packs > 1 ? `${line.packs} × ` : '';
  const leftoverNote = line.leftover > 0
    ? ` · ${amountLabel(ing, line.leftover)} spare`
    : '';

  return `
    <div class="shop-line ${done ? 'done' : ''}">
      <button class="tickbox ${done ? 'on' : ''}" data-action="tick" data-id="${line.id}">${done ? '✓' : ''}</button>
      <div class="shop-main" data-action="edit-price" data-id="${line.id}">
        <div class="shop-name">${escapeHtml(ing.name)}${line.estimate ? '<span class="badge estimate">est</span>' : ''}</div>
        <div class="shop-sub">${packs}${packLabel} pack · need ${amountLabel(ing, line.required)}${leftoverNote}</div>
      </div>
      <div class="shop-cost">${money(line.packCost)}</div>
    </div>
  `;
}

function stapleLine(line) {
  const ing = line.ing;
  return `
    <div class="shop-line ${line.have ? 'done' : ''}">
      <button class="tickbox ${line.have ? 'on' : ''}" data-action="pantry" data-id="${line.id}">${line.have ? '✓' : ''}</button>
      <div class="shop-main" data-action="edit-price" data-id="${line.id}">
        <div class="shop-name">${escapeHtml(ing.name)}${line.estimate ? '<span class="badge estimate">est</span>' : ''}</div>
        <div class="shop-sub">${line.have ? 'already have it' : `need ${amountLabel(ing, line.required)} this week`}</div>
      </div>
      <div class="shop-cost">${line.have ? '—' : money(line.packCost)}</div>
    </div>
  `;
}

// The plain-text version for the clipboard, so the list can be pasted into
// notes, messages, or read off with the phone locked.
export function shoppingText(summary, weekStart) {
  const lines = [`Shopping list — week of ${formatWeekRange(weekStart)}`, ''];
  for (const cat of CATEGORIES) {
    const items = summary.lines.filter((l) => l.ing.category === cat.key && !l.have && l.packs > 0);
    if (!items.length) continue;
    lines.push(cat.label.toUpperCase());
    for (const l of items) {
      const packLabel = amountLabel(l.ing, l.ing.packQty);
      lines.push(`  ${l.packs} × ${l.ing.name} (${packLabel})  ${money(l.packCost)}`);
    }
    lines.push('');
  }
  lines.push(`TOTAL ${money(summary.tillTotal)}`);
  return lines.join('\n');
}

// ---------------------------------------------------------------------------
// Cook
// ---------------------------------------------------------------------------

export function renderCook(ctx) {
  const { plan, state, ingMap, recipeMap, weekStart, summary } = ctx;

  if (!summary.meals.length) {
    return `${weekNav(weekStart)}<div class="empty-state">Build a plan first and your cook sessions show up here.</div>`;
  }

  const sessions = cookSessions(plan, state, recipeMap);

  return `
    ${weekNav(weekStart)}
    <div class="notice">
      Two sessions, everything else is reheating or five minutes of assembly.
      Portions are counted from the plan, so cook exactly this much and there's
      nothing spare going off in the fridge.
    </div>
    ${sessions.map((s) => cookSession(s, ingMap)).join('')}
  `;
}

function cookSession(session, ingMap) {
  const batch = session.items.filter((i) => i.recipe.mode === 'batch');
  const fresh = session.items.filter((i) => i.recipe.mode !== 'batch');
  const covers = session.days.map((d) => DAY_SHORT[d]).join(', ');

  return `
    <div class="card">
      <div class="card-head">
        <span class="card-title">👨‍🍳 ${DAY_LABELS[session.cookDay]}</span>
        <span class="card-sub">${session.batchMinutes} min · feeds ${covers}</span>
      </div>
      ${batch.length ? batch.map((item) => cookItem(item, session, ingMap)).join('') : `
        <div class="field-hint">Nothing to batch cook in this session.</div>`}
      ${fresh.length ? `
        <div class="shop-group-title" style="margin-top:14px">Cook fresh on the day</div>
        ${fresh.map((item) => `
          <div class="ing-line">
            <span>${escapeHtml(item.recipe.name)}</span>
            <span class="ing-amt">${item.portions} × ${item.recipe.minutes} min</span>
          </div>`).join('')}
      ` : ''}
    </div>
  `;
}

function cookItem(item, session, ingMap) {
  const { recipe, portions } = item;
  const ingredients = recipe.items.map((it) => {
    const ing = ingMap.get(it.ingredient);
    if (!ing) return '';
    const amount = it.amount * portions;
    const label = amountLabel(ing, amount);
    return `
      <div class="ing-line">
        <span>${escapeHtml(ing.name)}</span>
        <span class="ing-amt">${label}</span>
      </div>`;
  }).join('');

  const freeze = item.freezeAfter
    ? `<div class="notice warn" style="margin:10px 0 0">
         ${item.freezeAfter.length} portion${item.freezeAfter.length === 1 ? '' : 's'} into the
         freezer — ${item.freezeAfter.map((d) => DAY_SHORT[d.dayKey]).join(', ')}
         ${item.freezeAfter.length === 1 ? 'is' : 'are'} past the
         ${recipe.keeps}-day fridge life. Out the night before.
       </div>`
    : '';

  return `
    <div style="margin-bottom:16px">
      <div class="card-head" style="margin-bottom:6px">
        <span class="card-title" style="font-size:0.94rem">
          ${escapeHtml(recipe.name)}<span class="badge batch">${portions} portion${portions === 1 ? '' : 's'}</span>
        </span>
        <span class="card-sub">${recipe.minutes} min</span>
      </div>
      ${ingredients}
      <div style="margin-top:10px">
        ${recipe.steps.map((s, i) => `
          <div class="cook-step"><span class="num">${i + 1}</span><span>${escapeHtml(s)}</span></div>
        `).join('')}
      </div>
      ${freeze}
    </div>
  `;
}

// ---------------------------------------------------------------------------
// Prices
// ---------------------------------------------------------------------------

export function renderPrices(ctx) {
  const { state, summary, priceFilter } = ctx;
  const inList = new Set(summary.lines.map((l) => l.id));
  const unconfirmed = state.ingredients.filter((i) => !i.confirmedAt).length;

  let items = state.ingredients.slice();
  if (priceFilter === 'week') items = items.filter((i) => inList.has(i.id));
  if (priceFilter === 'estimates') items = items.filter((i) => !i.confirmedAt);

  const groups = CATEGORIES.map((cat) => {
    const list = items.filter((i) => i.category === cat.key)
      .sort((a, b) => a.name.localeCompare(b.name));
    if (!list.length) return '';
    return `
      <div class="shop-group-title">${cat.icon} ${cat.label}</div>
      ${list.map((ing) => priceRow(ing, inList.has(ing.id))).join('')}
    `;
  }).join('');

  return `
    <div class="notice">
      <strong>This is the bit only you can do.</strong> There's no way for an app
      to read prices out of Inform — it's an internal staff system with no public
      way in, and pointing a script at it with your work login is a policy problem,
      not a technical one. So: look the price up in Inform, tap the item here, type
      it in once. It stays until the price changes, and every total in the app
      follows from it.
    </div>

    <div class="chip-row" style="margin-bottom:12px">
      <button class="chip ${priceFilter === 'week' ? 'on' : ''}" data-action="price-filter" data-filter="week">This week's shop</button>
      <button class="chip ${priceFilter === 'estimates' ? 'on' : ''}" data-action="price-filter" data-filter="estimates">Still estimates${unconfirmed ? ` (${unconfirmed})` : ''}</button>
      <button class="chip ${priceFilter === 'all' ? 'on' : ''}" data-action="price-filter" data-filter="all">Everything</button>
    </div>

    ${groups || '<div class="empty-state">Nothing here — try another filter.</div>'}

    <button class="btn block" data-action="add-ingredient" style="margin-top:14px">+ Add an item</button>
  `;
}

function priceRow(ing, inWeek) {
  const per = unitPrice(ing);
  const perLabel = ing.unit === 'unit'
    ? `${money(per)} each`
    : `${money(per * 100)} / 100${ing.unit}`;
  const packLabel = amountLabel(ing, ing.packQty);

  return `
    <div class="shop-line" data-action="edit-price" data-id="${ing.id}">
      <div class="shop-main">
        <div class="shop-name">
          ${escapeHtml(ing.name)}
          ${ing.confirmedAt ? '<span class="badge confirmed">yours</span>' : '<span class="badge estimate">est</span>'}
          ${inWeek ? '<span class="badge batch">this week</span>' : ''}
        </div>
        <div class="shop-sub">${packLabel} · ${perLabel} · ${ing.protein}g protein${ing.unit === 'unit' ? ' each' : ' / 100' + ing.unit}</div>
      </div>
      <div class="shop-cost">${money(ing.packPrice)}</div>
    </div>
  `;
}

// ---------------------------------------------------------------------------
// More
// ---------------------------------------------------------------------------

export function renderMore(ctx) {
  const { state } = ctx;
  const s = state.settings;

  return `
    <div class="section-title">Targets</div>
    <div class="card">
      <div class="field-pair">
        <div class="field">
          <label for="set-protein">Protein a day (g)</label>
          <input id="set-protein" type="number" inputmode="numeric" value="${s.proteinTarget}" data-action="set-number" data-key="proteinTarget" />
        </div>
        <div class="field">
          <label for="set-budget">Budget a week (£)</label>
          <input id="set-budget" type="number" inputmode="decimal" step="0.5" value="${s.budget}" data-action="set-number" data-key="budget" />
        </div>
      </div>
      <div class="field">
        <label for="set-servings">Portions per meal</label>
        <input id="set-servings" type="number" inputmode="numeric" min="1" value="${s.servings}" data-action="set-number" data-key="servings" />
        <div class="field-hint">1 if it's just you. 2 if you're feeding someone else the same food.</div>
      </div>
      <div class="field-hint">
        The planner treats the budget as close to a hard ceiling and protein as a
        strong pull, then goes for the cheapest plan that clears both. Set the
        budget too low and it'll get as close as the prices allow.
      </div>
    </div>

    <div class="section-title">Cook days</div>
    <div class="card">
      <div class="chip-row">
        ${DAY_KEYS.map((d) => `
          <button class="chip ${s.cookDays.includes(d) ? 'on' : ''}" data-action="toggle-cookday" data-day="${d}">${DAY_SHORT[d]}</button>
        `).join('')}
      </div>
      <div class="field-hint" style="margin-top:10px">
        Each day eats from the most recent cook session. Two days is the sweet
        spot: nothing sits in the fridge longer than four days.
      </div>
    </div>

    <div class="section-title">Meals to plan</div>
    <div class="card">
      ${SLOT_KEYS.map((slot) => `
        <div class="switch-row">
          <div>
            <div class="switch-label">${SLOT_ICONS[slot]} ${SLOT_LABELS[slot]}</div>
            ${slot === 'snack2' ? '<div class="switch-sub">The cheapest way to close a protein gap</div>' : ''}
          </div>
          <button class="chip ${s.slots[slot] ? 'on' : ''}" data-action="toggle-slot" data-slot="${slot}">${s.slots[slot] ? 'On' : 'Off'}</button>
        </div>
      `).join('')}
    </div>

    <div class="section-title">Recipes</div>
    <div class="card">
      <div class="field-hint" style="margin-bottom:10px">
        ${state.recipes.length} recipes. Add your own — anything you already cook
        works, as long as you tell it the ingredients and rough amounts.
      </div>
      <button class="btn block" data-action="browse-recipes">Browse & edit recipes</button>
      <button class="btn block primary" data-action="new-recipe" style="margin-top:8px">+ New recipe</button>
    </div>

    <div class="section-title">Appearance</div>
    <div class="card">
      <div class="chip-row">
        ${['auto', 'light', 'dark'].map((t) => `
          <button class="chip ${s.theme === t ? 'on' : ''}" data-action="set-theme" data-theme="${t}">${t[0].toUpperCase() + t.slice(1)}</button>
        `).join('')}
      </div>
    </div>

    <div class="section-title">Your data</div>
    <div class="card">
      <div class="field-hint" style="margin-bottom:10px">
        Everything lives in this browser on this phone. Nothing is uploaded
        anywhere. Export before you clear your browser data or change phone.
      </div>
      <button class="btn block" data-action="export">Export data</button>
      <button class="btn block" data-action="import" style="margin-top:8px">Import data</button>
      <button class="btn block danger" data-action="reset" style="margin-top:8px">Reset everything</button>
    </div>

    <div class="section-title">About the prices</div>
    <div class="card">
      <div class="field-hint">
        The prices this app started with are typical UK supermarket estimates, not
        your shop's. Inform has no public interface an app can read, so nothing
        here talks to it — you type a price in once and it's remembered. The
        <strong>Prices</strong> tab marks which are still guesses.
      </div>
    </div>
  `;
}
