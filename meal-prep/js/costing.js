// All the arithmetic: what a recipe costs, what a week needs, what you'll
// actually hand over at the till.
//
// Two different numbers matter and the app shows both, because they answer
// different questions:
//
//   Till total  — you can't buy 300g of a 500g pack. This rounds every
//                 ingredient up to whole packs. It's what leaves your bank.
//   Food used   — the value of what the week's meals actually eat. Lower than
//                 the till total, because the rest of the pack is still in your
//                 cupboard next week. This is the fair cost per meal.

import { DAY_KEYS, SLOT_KEYS } from './utils.js';

// Price per gram / per ml / per unit.
export function unitPrice(ing) {
  if (!ing || !ing.packQty) return 0;
  return ing.packPrice / ing.packQty;
}

export function costOf(ing, amount) {
  return unitPrice(ing) * amount;
}

// Nutrition is per 100g/100ml for weighed items, per item for unit items.
export function nutritionOf(ing, amount) {
  if (!ing) return { protein: 0, kcal: 0 };
  const factor = ing.unit === 'unit' ? amount : amount / 100;
  return { protein: (ing.protein || 0) * factor, kcal: (ing.kcal || 0) * factor };
}

// Per single portion.
export function recipeStats(recipe, ingMap) {
  let cost = 0;
  let protein = 0;
  let kcal = 0;
  let missing = 0;
  for (const item of recipe.items) {
    const ing = ingMap.get(item.ingredient);
    if (!ing) { missing++; continue; }
    cost += costOf(ing, item.amount);
    const n = nutritionOf(ing, item.amount);
    protein += n.protein;
    kcal += n.kcal;
  }
  return { cost, protein, kcal, missing };
}

// The number the planner optimises: grams of protein per pound spent.
export function proteinPerPound(recipe, ingMap) {
  const { cost, protein } = recipeStats(recipe, ingMap);
  if (cost <= 0) return protein > 0 ? Infinity : 0;
  return protein / cost;
}

// Every meal in a week's plan, flattened. Skips empty slots.
export function planMeals(plan, recipeMap) {
  const out = [];
  if (!plan || !plan.meals) return out;
  for (const dayKey of DAY_KEYS) {
    const day = plan.meals[dayKey];
    if (!day) continue;
    for (const slot of SLOT_KEYS) {
      const entry = day[slot];
      if (!entry || !entry.recipe) continue;
      const recipe = recipeMap.get(entry.recipe);
      if (!recipe) continue;
      out.push({ dayKey, slot, recipe, servings: entry.servings || 1 });
    }
  }
  return out;
}

// ingredientId -> total amount needed across the week.
export function requirements(plan, recipeMap) {
  const req = new Map();
  for (const meal of planMeals(plan, recipeMap)) {
    for (const item of meal.recipe.items) {
      const amount = item.amount * meal.servings;
      req.set(item.ingredient, (req.get(item.ingredient) || 0) + amount);
    }
  }
  return req;
}

// The shopping list. `pantry` marks things already in the cupboard, which come
// off the total but stay visible so you can untick them when they run out.
export function shoppingList(plan, recipeMap, ingMap, pantry = {}) {
  const req = requirements(plan, recipeMap);
  const lines = [];

  for (const [ingId, required] of req.entries()) {
    const ing = ingMap.get(ingId);
    if (!ing) continue;
    const have = !!pantry[ingId];
    const packs = have ? 0 : Math.ceil(required / ing.packQty - 1e-9);
    const packCost = packs * ing.packPrice;
    const usedCost = costOf(ing, required);
    lines.push({
      id: ingId,
      ing,
      required,
      packs,
      packCost,
      usedCost,
      leftover: Math.max(0, packs * ing.packQty - required),
      have,
      staple: !!ing.staple,
      estimate: !ing.confirmedAt,
    });
  }

  lines.sort((a, b) => a.ing.name.localeCompare(b.ing.name));
  return lines;
}

export function summarise(plan, recipeMap, ingMap, pantry = {}) {
  const lines = shoppingList(plan, recipeMap, ingMap, pantry);
  const meals = planMeals(plan, recipeMap);

  let tillTotal = 0;
  let usedTotal = 0;
  let stapleTotal = 0;
  let estimatedLines = 0;

  for (const line of lines) {
    tillTotal += line.packCost;
    usedTotal += line.usedCost;
    if (line.staple && !line.have) stapleTotal += line.packCost;
    if (line.estimate && line.packs > 0) estimatedLines++;
  }

  const perDay = {};
  for (const dayKey of DAY_KEYS) perDay[dayKey] = { protein: 0, kcal: 0, cost: 0, meals: 0 };
  let mealCount = 0;

  for (const meal of meals) {
    const stats = recipeStats(meal.recipe, ingMap);
    const d = perDay[meal.dayKey];
    d.protein += stats.protein * meal.servings;
    d.kcal += stats.kcal * meal.servings;
    d.cost += stats.cost * meal.servings;
    d.meals += 1;
    mealCount += meal.servings;
  }

  const daysWithFood = DAY_KEYS.filter((k) => perDay[k].meals > 0);
  const avg = (pick) => (daysWithFood.length
    ? daysWithFood.reduce((sum, k) => sum + perDay[k][pick], 0) / daysWithFood.length
    : 0);

  return {
    lines,
    meals,
    mealCount,
    tillTotal,
    usedTotal,
    stapleTotal,
    leftoverValue: Math.max(0, tillTotal - usedTotal),
    estimatedLines,
    perDay,
    avgProtein: avg('protein'),
    avgKcal: avg('kcal'),
    costPerMeal: mealCount ? usedTotal / mealCount : 0,
    tillPerMeal: mealCount ? tillTotal / mealCount : 0,
  };
}

// What still needs buying — used for the "£X left to buy" running total on the
// shopping tab.
export function outstandingTotal(lines, bought = {}) {
  return lines.reduce((sum, l) => (bought[l.id] || l.have ? sum : sum + l.packCost), 0);
}
