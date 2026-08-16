// Pure rendering. Every function here returns an HTML string; app.js owns the
// state, the events and the modals.

import {
  DAY_KEYS, DAY_LABELS, DAY_SHORT, SLOT_KEYS, SLOT_LABELS, SLOT_ICONS,
  escapeHtml, money, moneyTicket, amountLabel, formatWeekRange, addDays, clamp,
} from './utils.js';
import { recipeStats, unitPrice, outstandingTotal } from './costing.js';
import { isPersistent } from './store.js';
import { CATEGORIES } from './seed.js';
import { icon } from './icons.js';
import { cookSessions, cookBlocks, daysAfterCook } from './planner.js';

// ---------------------------------------------------------------------------
// Shared pieces
// ---------------------------------------------------------------------------

function weekNav(weekStart) {
  return `
    <div class="week-nav">
      <button class="nav-btn" data-action="week-prev" aria-label="Previous week">${icon('chevron-left')}</button>
      <span class="week-range">${formatWeekRange(weekStart)}</span>
      <button class="nav-btn" data-action="week-next" aria-label="Next week">${icon('chevron-right')}</button>
    </div>
  `;
}

function notice(text, kind = '') {
  return `
    <div class="notice ${kind}">
      ${icon(kind === 'warn' ? 'triangle-alert' : 'info')}
      <div>${text}</div>
    </div>`;
}

// Shown wherever losing data would hurt. Silence here would be worse than a
// banner: prices you typed in are the one thing in the app you can't redo fast.
export function storageWarning() {
  if (isPersistent()) return '';
  return notice(`This browser won't let the page save anything, so your prices and
    plan will be gone when you close the tab. Everything still works for now — use
    <strong>More → Export data</strong> before you leave if you want to keep it.`, 'warn');
}

function emptyState(iconName, title, body) {
  return `
    <div class="empty-state">
      ${icon(iconName)}
      <strong>${title}</strong>
      ${body}
    </div>`;
}

// ---------------------------------------------------------------------------
// Week
// ---------------------------------------------------------------------------

export function renderWeek(ctx) {
  const { weekStart, plan, summary, state } = ctx;
  const { settings } = state;

  if (!plan || !summary.meals.length) {
    return `
      ${weekNav(weekStart)}
      ${storageWarning()}
      ${emptyState('calendar-days', 'No plan for this week yet',
        `Build one and it picks the cheapest meals that still reach
         ${settings.proteinTarget}g of protein a day, then tells you exactly what
         to buy and what it costs.`)}
      <button class="btn primary block" data-action="generate">Build this week's plan</button>
    `;
  }

  const budget = settings.budget || 0;
  const over = budget && summary.tillTotal > budget;
  const budgetPct = budget ? clamp((summary.tillTotal / budget) * 100, 0, 100) : 0;
  const proteinPct = settings.proteinTarget
    ? clamp((summary.avgProtein / settings.proteinTarget) * 100, 0, 100)
    : 0;
  // A couple of grams either side of target isn't worth flagging.
  const short = settings.proteinTarget && summary.avgProtein < settings.proteinTarget - 5;

  const blocks = cookBlocks(settings.cookDays);

  return `
    ${weekNav(weekStart)}
    ${storageWarning()}

    <div class="headline ${over ? 'over' : ''}">
      <div class="headline-top">
        <div>
          <div class="micro">Till total</div>
          <div style="margin-top:7px">${moneyTicket(summary.tillTotal, 'ticket-xl')}</div>
        </div>
        <div class="headline-aside">
          <span class="figure">
            <span class="micro">Per meal</span>
            <span class="figure-value">${money(summary.costPerMeal)}</span>
          </span>
          <span class="figure">
            <span class="micro">Protein</span>
            <span class="figure-value ${short ? 'short' : 'met'}">${Math.round(summary.avgProtein)}g</span>
          </span>
        </div>
      </div>

      <div class="headline-rule"></div>

      <div class="gauge">
        <div class="gauge-head">
          <span class="micro">Budget</span>
          <span class="gauge-value">${money(summary.tillTotal)} of ${money(budget)}</span>
        </div>
        <div class="meter"><div class="meter-fill ${over ? 'over' : ''}" style="width:${budgetPct}%"></div></div>
      </div>
      <div class="gauge">
        <div class="gauge-head">
          <span class="micro">Protein a day</span>
          <span class="gauge-value">${Math.round(summary.avgProtein)}g of ${settings.proteinTarget}g</span>
        </div>
        <div class="meter"><div class="meter-fill ${short ? 'over' : ''}" style="width:${proteinPct}%"></div></div>
      </div>

      <div class="headline-foot">
        ${summary.mealCount} meals · ${Math.round(summary.avgKcal).toLocaleString()} kcal a day ·
        ${money(summary.usedTotal)} of food actually eaten, ${money(summary.leftoverValue)} left
        in the cupboard for next week.
      </div>
    </div>

    ${short && plan.generatedAt ? notice(`This is the best it could do: nothing in the
      recipe list reaches ${settings.proteinTarget}g a day while staying inside
      ${money(budget)}. It's short by ${Math.round(settings.proteinTarget - summary.avgProtein)}g.
      Raise the budget, turn on a second snack, or add a high-protein recipe of your
      own — all on the <strong>More</strong> tab.`) : ''}

    ${summary.estimatedLines > 0 ? notice(`${summary.estimatedLines}
      price${summary.estimatedLines === 1 ? '' : 's'} on this list
      ${summary.estimatedLines === 1 ? 'is' : 'are'} still an estimate. Look them up in
      Inform as you shop and correct them on the <strong>Prices</strong> tab — the total
      is only as good as those numbers.`, 'warn') : ''}

    <div class="btn-row">
      <button class="btn" data-action="generate">${icon('refresh-cw')} Regenerate</button>
      <button class="btn" data-action="clear-week">${icon('trash-2')} Clear week</button>
    </div>

    ${DAY_KEYS.map((dayKey, i) => dayCard(dayKey, addDays(weekStart, i), ctx, blocks)).join('')}
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
          ${icon(SLOT_ICONS[slot])}
          <span class="meal-main"><span class="meal-name empty">Add ${SLOT_LABELS[slot].toLowerCase()}</span></span>
          ${icon('plus', 'ico-sm')}
        </button>`;
    }

    const stats = recipeStats(recipe, ingMap);
    const servings = entry.servings || 1;
    const stale = recipe.mode === 'batch' && recipe.keeps > 0
      && daysAfterCook(cookDay, dayKey) > recipe.keeps;

    return `
      <button class="meal-row" data-action="pick-meal" data-day="${dayKey}" data-slot="${slot}">
        ${icon(SLOT_ICONS[slot])}
        <span class="meal-main">
          <span class="meal-name">${escapeHtml(recipe.name)}${servings > 1 ? ` ×${servings}` : ''}</span>
          <span class="meal-sub">
            ${Math.round(stats.protein * servings)}g protein · ${Math.round(stats.kcal * servings)} kcal${stale
              ? ' · <span class="frozen">from the freezer</span>' : ''}
          </span>
        </span>
        <span class="meal-cost">${money(stats.cost * servings)}</span>
      </button>`;
  }).join('');

  return `
    <div class="card day-card">
      <div class="day-head">
        <div>
          <span class="day-name">${DAY_LABELS[dayKey]}</span>
          <span class="day-date">${date.getDate()}/${date.getMonth() + 1}</span>
          ${isCookDay ? `<span class="cook-flag">${icon('chef-hat', 'ico-sm')} Cook</span>` : ''}
        </div>
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
      ${emptyState('shopping-basket', 'Nothing to buy yet',
        'Build a plan on the Week tab and the shopping list appears here.')}`;
  }

  const bought = plan.bought || {};
  const buyLines = summary.lines.filter((l) => !l.staple && !l.have);
  const stapleLines = summary.lines.filter((l) => l.staple || l.have);
  const left = outstandingTotal(summary.lines, bought);

  const groups = CATEGORIES.map((cat) => {
    const lines = buyLines.filter((l) => l.ing.category === cat.key);
    if (!lines.length) return '';
    return aisle(cat.icon, cat.label) + lines.map((l) => shopLine(l, bought)).join('');
  }).join('');

  return `
    ${weekNav(weekStart)}
    ${storageWarning()}

    ${notice(`Quantities are whole packs, because you can't buy 300g of a 500g bag.
      The leftovers are yours to keep, which is why the per-meal figure is lower than
      the till total split between meals.`)}

    ${groups}

    ${stapleLines.length ? `
      ${aisle('package', 'Cupboard staples')}
      ${notice(`Oil, spices, stock cubes and the like. Tick the ones you already have
        and they come off the total — untick when they run out.`)}
      ${stapleLines.map(stapleLine).join('')}
    ` : ''}

    <div class="total-bar">
      <span>
        <span class="micro">Left to buy</span>
        ${moneyTicket(left)}
      </span>
      <span class="side">
        <span class="micro">Full list</span>
        ${moneyTicket(summary.tillTotal)}
      </span>
    </div>

    <div class="btn-row" style="margin-top:14px">
      <button class="btn" data-action="clear-ticks">${icon('x')} Untick all</button>
      <button class="btn" data-action="copy-list">${icon('check')} Copy list</button>
    </div>
  `;
}

function aisle(iconName, label) {
  return `
    <div class="aisle">
      ${icon(iconName)}
      <span class="micro">${label}</span>
      <span class="aisle-line"></span>
    </div>`;
}

function shopLine(line, bought) {
  const done = !!bought[line.id];
  const ing = line.ing;
  const packs = line.packs > 1 ? `${line.packs} × ` : '';
  const leftoverNote = line.leftover > 0 ? ` · ${amountLabel(ing, line.leftover)} spare` : '';

  return `
    <div class="shop-line ${done ? 'done' : ''}">
      <button class="tickbox ${done ? 'on' : ''}" data-action="tick" data-id="${line.id}"
              aria-label="Tick off ${escapeHtml(ing.name)}">${icon('check', 'ico-sm')}</button>
      <div class="shop-main" data-action="edit-price" data-id="${line.id}">
        <div class="shop-name">${escapeHtml(ing.name)}${line.estimate ? '<span class="badge estimate">est</span>' : ''}</div>
        <div class="shop-sub">
          <span class="qty-chip">${packs}${amountLabel(ing, ing.packQty)}</span>
          · need ${amountLabel(ing, line.required)}${leftoverNote}
        </div>
      </div>
      <div class="shop-cost">${money(line.packCost)}</div>
    </div>`;
}

function stapleLine(line) {
  const ing = line.ing;
  return `
    <div class="shop-line ${line.have ? 'done' : ''}">
      <button class="tickbox ${line.have ? 'on' : ''}" data-action="pantry" data-id="${line.id}"
              aria-label="I already have ${escapeHtml(ing.name)}">${icon('check', 'ico-sm')}</button>
      <div class="shop-main" data-action="edit-price" data-id="${line.id}">
        <div class="shop-name">${escapeHtml(ing.name)}${line.estimate ? '<span class="badge estimate">est</span>' : ''}</div>
        <div class="shop-sub">${line.have ? 'already have it' : `need ${amountLabel(ing, line.required)} this week`}</div>
      </div>
      <div class="shop-cost">${line.have ? '—' : money(line.packCost)}</div>
    </div>`;
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
      lines.push(`  ${l.packs} × ${l.ing.name} (${amountLabel(l.ing, l.ing.packQty)})  ${money(l.packCost)}`);
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
    return `
      ${weekNav(weekStart)}
      ${emptyState('chef-hat', 'No cook sessions yet',
        'Build a plan and the two sessions show up here, scaled to the portions you need.')}`;
  }

  const sessions = cookSessions(plan, state, recipeMap);

  return `
    ${weekNav(weekStart)}
    ${notice(`Two sessions; everything else is reheating or five minutes of assembly.
      Portions come from the plan, so cook exactly this much and nothing spare goes off
      in the fridge.`)}
    ${sessions.map((s, i) => cookSession(s, i + 1, ingMap)).join('')}
  `;
}

function cookSession(session, number, ingMap) {
  const batch = session.items.filter((i) => i.recipe.mode === 'batch');
  const fresh = session.items.filter((i) => i.recipe.mode !== 'batch');
  const covers = session.days.map((d) => DAY_SHORT[d]).join(', ');

  return `
    <div class="card">
      <div class="card-head">
        <span class="card-title">
          <span class="session-no">${number}</span>
          ${DAY_LABELS[session.cookDay]}
        </span>
        <span class="card-sub">${icon('timer', 'ico-sm')} ${session.batchMinutes} min · feeds ${covers}</span>
      </div>

      ${batch.length
        ? batch.map((item) => cookItem(item, ingMap)).join('')
        : '<div class="field-hint">Nothing to batch cook in this session.</div>'}

      ${fresh.length ? `
        ${aisle('flame', 'Cook fresh on the day')}
        ${fresh.map((item) => `
          <div class="ing-line">
            <span>${escapeHtml(item.recipe.name)}</span>
            <span class="leader"></span>
            <span class="ing-amt">${item.portions} × ${item.recipe.minutes} min</span>
          </div>`).join('')}
      ` : ''}
    </div>
  `;
}

function cookItem(item, ingMap) {
  const { recipe, portions } = item;

  const ingredients = recipe.items.map((it) => {
    const ing = ingMap.get(it.ingredient);
    if (!ing) return '';
    return `
      <div class="ing-line">
        <span>${escapeHtml(ing.name)}</span>
        <span class="leader"></span>
        <span class="ing-amt">${amountLabel(ing, it.amount * portions)}</span>
      </div>`;
  }).join('');

  const freeze = item.freezeAfter
    ? notice(`${item.freezeAfter.length} portion${item.freezeAfter.length === 1 ? '' : 's'}
        into the freezer — ${item.freezeAfter.map((d) => DAY_SHORT[d.dayKey]).join(', ')}
        ${item.freezeAfter.length === 1 ? 'is' : 'are'} past the ${recipe.keeps}-day fridge
        life. Out the night before.`, 'warn')
    : '';

  return `
    <div class="recipe-block">
      <div class="recipe-head">
        <span class="recipe-name">${escapeHtml(recipe.name)}<span class="badge batch">${portions} portion${portions === 1 ? '' : 's'}</span></span>
        <span class="card-sub">${recipe.minutes} min</span>
      </div>
      ${ingredients}
      <div style="margin-top:12px">
        ${recipe.steps.map((s, i) => `
          <div class="cook-step"><span class="num">${String(i + 1).padStart(2, '0')}</span><span>${escapeHtml(s)}</span></div>
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
    return aisle(cat.icon, cat.label) + list.map((ing) => priceRow(ing, inList.has(ing.id))).join('');
  }).join('');

  return `
    ${storageWarning()}
    ${notice(`<strong>This is the bit only you can do.</strong> No app can read prices
      out of Inform — it's an internal staff system with no public way in, and pointing
      a script at it with your work login is a policy problem rather than a technical
      one. So: look the price up, tap the item, type it once. It stays until the price
      changes, and every total in the app follows from it.`)}

    <div class="chip-row" style="margin-bottom:14px">
      <button class="chip ${priceFilter === 'week' ? 'on' : ''}" data-action="price-filter" data-filter="week">This week's shop</button>
      <button class="chip ${priceFilter === 'estimates' ? 'on' : ''}" data-action="price-filter" data-filter="estimates">Estimates${unconfirmed ? ` (${unconfirmed})` : ''}</button>
      <button class="chip ${priceFilter === 'all' ? 'on' : ''}" data-action="price-filter" data-filter="all">Everything</button>
    </div>

    ${groups || emptyState('search', 'Nothing here', 'Try another filter.')}

    <button class="btn block" data-action="add-ingredient" style="margin-top:16px">
      ${icon('plus')} Add an item
    </button>
  `;
}

function priceRow(ing, inWeek) {
  const per = unitPrice(ing);
  const perLabel = ing.unit === 'unit' ? `${money(per)} each` : `${money(per * 100)} / 100${ing.unit}`;

  return `
    <div class="shop-line" data-action="edit-price" data-id="${ing.id}">
      <div class="shop-main">
        <div class="shop-name">
          ${escapeHtml(ing.name)}
          ${ing.confirmedAt ? '<span class="badge confirmed">yours</span>' : '<span class="badge estimate">est</span>'}
          ${inWeek ? '<span class="badge batch">this week</span>' : ''}
        </div>
        <div class="shop-sub">
          <span class="qty-chip">${amountLabel(ing, ing.packQty)}</span>
          · ${perLabel} · ${ing.protein}g protein${ing.unit === 'unit' ? ' each' : ` / 100${ing.unit}`}
        </div>
      </div>
      <div class="shop-cost">${money(ing.packPrice)}</div>
      ${icon('chevron-right', 'ico-sm')}
    </div>`;
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
        strong pull, then goes for the cheapest plan that clears both. Set the budget
        too low and it gets as close as the prices allow.
      </div>
    </div>

    <div class="section-title">Cook days</div>
    <div class="card">
      <div class="chip-row">
        ${DAY_KEYS.map((d) => `
          <button class="chip ${s.cookDays.includes(d) ? 'on' : ''}" data-action="toggle-cookday" data-day="${d}">${DAY_SHORT[d]}</button>
        `).join('')}
      </div>
      <div class="field-hint" style="margin-top:12px">
        Each day eats from the most recent cook session. Two days is the sweet spot:
        nothing sits in the fridge longer than four days.
      </div>
    </div>

    <div class="section-title">Meals to plan</div>
    <div class="card">
      ${SLOT_KEYS.map((slot) => `
        <div class="switch-row">
          <div>
            <div class="switch-label">${icon(SLOT_ICONS[slot])} ${SLOT_LABELS[slot]}</div>
            ${slot === 'snack2' ? '<div class="switch-sub">The cheapest way to close a protein gap</div>' : ''}
          </div>
          <button class="chip ${s.slots[slot] ? 'on' : ''}" data-action="toggle-slot" data-slot="${slot}">${s.slots[slot] ? 'On' : 'Off'}</button>
        </div>
      `).join('')}
    </div>

    <div class="section-title">Recipes</div>
    <div class="card">
      <div class="field-hint" style="margin-bottom:12px">
        ${state.recipes.length} recipes. Add your own — anything you already cook works,
        as long as you tell it the ingredients and rough amounts.
      </div>
      <button class="btn block" data-action="browse-recipes">${icon('pencil')} Browse &amp; edit recipes</button>
      <button class="btn block primary" data-action="new-recipe" style="margin-top:8px">${icon('plus')} New recipe</button>
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
    ${storageWarning()}
    <div class="card">
      <div class="field-hint" style="margin-bottom:12px">
        Everything lives in this browser on this phone. Nothing is uploaded anywhere.
        Export before you clear your browser data or change phone.
      </div>
      <button class="btn block" data-action="export">Export data</button>
      <button class="btn block" data-action="import" style="margin-top:8px">Import data</button>
      <button class="btn block danger" data-action="reset" style="margin-top:8px">${icon('trash-2')} Reset everything</button>
    </div>

    <div class="section-title">About the prices</div>
    <div class="card">
      <div class="field-hint">
        The prices this app started with are typical UK supermarket estimates, not your
        shop's. Inform has no public interface an app can read, so nothing here talks to
        it — you type a price in once and it's remembered. The <strong>Prices</strong>
        tab marks which are still guesses.
      </div>
    </div>
  `;
}
