// Builds the week.
//
// The brief is "as cheap as possible, as much protein as possible, two cook
// sessions". Those pull against each other, so this doesn't just sort by one
// number — it builds a plan and then hill-climbs it: try every alternative in
// every slot, keep whichever swap improves the score most, repeat until no
// swap helps. Fast enough to be instant with a couple of dozen recipes.

import { DAY_KEYS, SLOT_KEYS, baseSlot, seededShuffle } from './utils.js';
import { recipeStats, summarise } from './costing.js';

// Which cook session feeds a given day: the most recent cook day at or before
// it, wrapping back to the last cook day of the week for early-week days.
// Cooking Sun + Wed gives blocks of Sun/Mon/Tue and Wed/Thu/Fri/Sat.
export function cookBlocks(cookDays) {
  const days = (cookDays && cookDays.length ? cookDays : ['sunday'])
    .filter((d) => DAY_KEYS.includes(d))
    .sort((a, b) => DAY_KEYS.indexOf(a) - DAY_KEYS.indexOf(b));
  if (!days.length) days.push('sunday');

  const blocks = new Map(days.map((d) => [d, []]));
  const dayToBlock = {};

  for (const dayKey of DAY_KEYS) {
    const idx = DAY_KEYS.indexOf(dayKey);
    let chosen = days[days.length - 1]; // wrap: cooked at the end of last week
    for (const cookDay of days) {
      if (DAY_KEYS.indexOf(cookDay) <= idx) chosen = cookDay;
    }
    blocks.get(chosen).push(dayKey);
    dayToBlock[dayKey] = chosen;
  }

  return { order: days, blocks, dayToBlock };
}

// Days between cooking and eating — drives the "freeze this one" advice.
export function daysAfterCook(cookDay, dayKey) {
  const c = DAY_KEYS.indexOf(cookDay);
  const d = DAY_KEYS.indexOf(dayKey);
  return d >= c ? d - c : d + 7 - c;
}

// Independent hill-climbs per generate. Six is enough to stop it settling for a
// bad local optimum, and still finishes in well under a tenth of a second.
const RESTARTS = 6;

function candidatesFor(slot, recipes, ingMap) {
  const want = baseSlot(slot);
  return recipes
    .filter((r) => r.slot === want)
    .filter((r) => r.items.length && r.items.every((it) => ingMap.has(it.ingredient)));
}

// The two snack slots land on the same day, so they must not hold the same
// recipe — two identical snacks in one day reads as a broken plan even when the
// numbers work out. Returns the position whose choice this one has to differ
// from, or null.
function samedayTwin(key) {
  if (key.startsWith('snack2:')) return `snack:${key.slice('snack2:'.length)}`;
  if (key.startsWith('snack:')) return `snack2:${key.slice('snack:'.length)}`;
  return null;
}

// Stable pseudo-random in [0, 1) from a seed and an index — no Math.random, so
// a plan is reproducible from its seed.
function noise(seed, i) {
  const x = Math.sin((seed + 1) * 12.9898 + i * 78.233) * 43758.5453;
  return x - Math.floor(x);
}

// Positions are the knobs the hill-climb turns: two breakfasts alternating
// through the week, one lunch and two dinners per cook session, and two
// alternating options for each snack slot that's switched on.
function buildPositions(settings, blocks) {
  const positions = [];
  if (settings.slots.breakfast) {
    positions.push({ kind: 'breakfast', slot: 'breakfast', key: 'breakfast:0' });
    positions.push({ kind: 'breakfast', slot: 'breakfast', key: 'breakfast:1' });
  }
  for (const cookDay of blocks.order) {
    if (settings.slots.lunch) positions.push({ kind: 'lunch', slot: 'lunch', key: `l:${cookDay}`, cookDay });
    if (settings.slots.dinner) {
      positions.push({ kind: 'dinner', slot: 'dinner', key: `d0:${cookDay}`, cookDay, idx: 0 });
      positions.push({ kind: 'dinner', slot: 'dinner', key: `d1:${cookDay}`, cookDay, idx: 1 });
    }
  }
  for (const slot of ['snack', 'snack2']) {
    if (!settings.slots[slot]) continue;
    positions.push({ kind: slot, slot, key: `${slot}:0` });
    positions.push({ kind: slot, slot, key: `${slot}:1` });
  }
  return positions;
}

// choice: position key -> recipe id. Turns into the day/slot grid the rest of
// the app reads.
function assemble(choice, positions, settings, blocks) {
  const meals = {};
  const servings = Math.max(1, settings.servings || 1);
  // Slots whose two options alternate day by day, so you're not eating the same
  // breakfast or snack seven days running.
  const alternating = {};
  for (const slot of ['breakfast', 'snack', 'snack2']) {
    alternating[slot] = positions.filter((p) => p.slot === slot).map((p) => p.key);
  }

  DAY_KEYS.forEach((dayKey, dayIdx) => {
    const day = {};
    const cookDay = blocks.dayToBlock[dayKey];
    const posInBlock = blocks.blocks.get(cookDay).indexOf(dayKey);

    for (const slot of ['breakfast', 'snack', 'snack2']) {
      const keys = alternating[slot];
      if (!keys.length) continue;
      const id = choice[keys[dayIdx % keys.length]];
      if (id) day[slot] = { recipe: id, servings };
    }
    if (settings.slots.lunch) {
      const id = choice[`l:${cookDay}`];
      if (id) day.lunch = { recipe: id, servings };
    }
    if (settings.slots.dinner) {
      const id = choice[`d${posInBlock % 2}:${cookDay}`];
      if (id) day.dinner = { recipe: id, servings };
    }
    meals[dayKey] = day;
  });

  return meals;
}

// Lower is better. Everything is expressed in pounds so the trade-offs are
// legible: a gram of protein short of target costs 35p of "regret", a pound
// over budget costs £8 — i.e. the budget is close to hard, protein is a strong
// pull, and among plans that clear both, the cheapest wins.
function score(meals, state, recipeMap, ingMap, settings, expected, jitter) {
  const summary = summarise({ meals }, recipeMap, ingMap, state.pantry);
  const proteinGap = Math.max(0, (settings.proteinTarget || 0) - summary.avgProtein);
  const overBudget = Math.max(0, summary.tillTotal - (settings.budget || Infinity));

  const nonBatch = summary.meals.filter(
    (m) => (m.slot === 'lunch' || m.slot === 'dinner') && m.recipe.mode !== 'batch'
  ).length;

  // Eating the identical lunch every day of the week is what makes people give
  // up on meal prep, so repeating a main across cook sessions costs something.
  let repeats = 0;
  for (const slot of ['lunch', 'dinner']) {
    const ids = new Set(summary.meals.filter((m) => m.slot === slot).map((m) => m.recipe.id));
    repeats += Math.max(0, (expected[slot] || 0) - ids.size);
  }

  const ids = new Set(summary.meals.map((m) => m.recipe.id));
  const distinct = ids.size;

  // A few pence of seeded preference per recipe. Far too small to override a
  // real difference in cost or protein, but enough that Regenerate lands on a
  // different plan when several are near enough equally good.
  let taste = 0;
  if (jitter) for (const id of ids) taste += jitter.get(id) || 0;

  // Variety is a tie-breaker, never something bought with protein: while the
  // plan is still short of target, a more interesting week that hits less
  // protein must not win.
  const variety = proteinGap <= 1 ? repeats * 0.6 - distinct * 0.15 : 0;

  return summary.usedTotal
    + overBudget * 8
    + proteinGap * 0.35
    + nonBatch * 0.12   // mild nudge towards things that actually batch-cook
    + variety
    + taste;
}

export function generatePlan(state, seed = 1) {
  const { settings, recipes } = state;
  const ingMap = new Map(state.ingredients.map((i) => [i.id, i]));
  const recipeMap = new Map(recipes.map((r) => [r.id, r]));
  const blocks = cookBlocks(settings.cookDays);
  const positions = buildPositions(settings, blocks);

  const pools = {};
  for (const slot of SLOT_KEYS) {
    pools[slot] = candidatesFor(slot, recipes, ingMap);
  }

  const jitter = new Map(recipes.map((r, i) => [r.id, noise(seed, i) * 0.06]));

  // How many distinct mains a varied week would have, for the repeat penalty.
  const expected = {
    lunch: new Set(positions.filter((p) => p.kind === 'lunch').map((p) => p.key)).size,
    dinner: new Set(positions.filter((p) => p.kind === 'dinner').map((p) => p.key)).size,
  };

  const evaluate = (meals) => score(meals, state, recipeMap, ingMap, settings, expected, jitter);

  // A single hill-climb gets stuck wherever it started, and with a tight budget
  // the local optima are meaningfully far apart — so run several from different
  // starting points and keep the best. Each pass is a few milliseconds.
  let bestMeals = null;
  let bestScore = Infinity;

  for (let restart = 0; restart < RESTARTS; restart++) {
    const choice = openingGuess(positions, pools, ingMap, seed + restart * 101, restart);
    let current = assemble(choice, positions, settings, blocks);
    let best = evaluate(current);

    for (let pass = 0; pass < 30; pass++) {
      let improvedKey = null;
      let improvedId = null;
      let improvedScore = best;

      for (const pos of positions) {
        const original = choice[pos.key];
        const twin = samedayTwin(pos.key);
        const blocked = twin ? choice[twin] : null;
        for (const candidate of pools[pos.slot]) {
          if (candidate.id === original) continue;
          if (blocked && candidate.id === blocked) continue;
          choice[pos.key] = candidate.id;
          const s = evaluate(assemble(choice, positions, settings, blocks));
          if (s < improvedScore - 1e-9) {
            improvedScore = s;
            improvedKey = pos.key;
            improvedId = candidate.id;
          }
        }
        choice[pos.key] = original;
      }

      if (!improvedKey) break;
      choice[improvedKey] = improvedId;
      best = improvedScore;
      current = assemble(choice, positions, settings, blocks);
    }

    if (best < bestScore) {
      bestScore = best;
      bestMeals = current;
    }
  }

  return {
    meals: bestMeals || {},
    bought: {},
    seed,
    generatedAt: new Date().toISOString(),
  };
}

// Restart 0 starts from the best protein-per-pound in each slot — the sensible
// greedy answer. The rest start from shuffled picks so the climbs explore
// different corners.
function openingGuess(positions, pools, ingMap, seed, restart) {
  const choice = {};
  const used = new Set();

  for (const pos of positions) {
    const pool = pools[pos.slot];
    if (!pool || !pool.length) continue;

    let ranked;
    if (restart === 0) {
      ranked = pool.slice().sort((a, b) => {
        const sa = recipeStats(a, ingMap);
        const sb = recipeStats(b, ingMap);
        const pa = sa.cost > 0 ? sa.protein / sa.cost : 0;
        const pb = sb.cost > 0 ? sb.protein / sb.cost : 0;
        return pb - pa;
      });
    } else {
      ranked = seededShuffle(pool, seed + positions.indexOf(pos));
    }

    const fresh = ranked.find((r) => !used.has(r.id)) || ranked[0];
    choice[pos.key] = fresh.id;
    used.add(fresh.id);
  }

  return choice;
}

// What each cook session has to produce: recipe, how many portions, and which
// of those portions won't survive in the fridge that long.
export function cookSessions(plan, state, recipeMap) {
  const blocks = cookBlocks(state.settings.cookDays);
  const sessions = [];

  for (const cookDay of blocks.order) {
    const days = blocks.blocks.get(cookDay);
    const byRecipe = new Map();

    for (const dayKey of days) {
      const day = (plan.meals || {})[dayKey] || {};
      for (const slot of SLOT_KEYS) {
        const entry = day[slot];
        if (!entry || !entry.recipe) continue;
        const recipe = recipeMap.get(entry.recipe);
        if (!recipe) continue;
        if (!byRecipe.has(recipe.id)) {
          byRecipe.set(recipe.id, { recipe, portions: 0, days: [], freezeAfter: null });
        }
        const agg = byRecipe.get(recipe.id);
        agg.portions += entry.servings || 1;
        agg.days.push({ dayKey, slot, age: daysAfterCook(cookDay, dayKey) });
      }
    }

    for (const agg of byRecipe.values()) {
      agg.days.sort((a, b) => a.age - b.age);
      if (agg.recipe.keeps > 0) {
        const beyond = agg.days.filter((d) => d.age > agg.recipe.keeps);
        agg.freezeAfter = beyond.length ? beyond : null;
      }
    }

    // Batch first — that's the order you'd actually cook in.
    const items = Array.from(byRecipe.values()).sort((a, b) => {
      if (a.recipe.mode !== b.recipe.mode) return a.recipe.mode === 'batch' ? -1 : 1;
      return b.portions - a.portions;
    });

    sessions.push({
      cookDay,
      days,
      items,
      batchMinutes: items.filter((i) => i.recipe.mode === 'batch').reduce((m, i) => m + i.recipe.minutes, 0),
    });
  }

  // Cooking on Sunday feeds Monday, so order sessions by the first day they
  // actually feed rather than by where the cook day falls in the week.
  sessions.sort((a, b) => {
    const first = (s) => Math.min(...s.days.map((d) => DAY_KEYS.indexOf(d)));
    return first(a) - first(b);
  });

  return sessions;
}
