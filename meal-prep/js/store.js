// Local persistence. Everything lives in localStorage under one key — no
// server, no account, nothing leaves the phone.

import { seedIngredients, seedRecipes } from './seed.js';
import { baseSlot, uid } from './utils.js';

const STORAGE_KEY = 'mealPrep.v1';

function defaultState() {
  return {
    version: 1,
    settings: {
      proteinTarget: 150,   // grams per day
      budget: 45,           // pounds per week, the target the planner aims under
      cookDays: ['sunday', 'wednesday'],
      slots: { breakfast: true, lunch: true, dinner: true, snack: true, snack2: false },
      servings: 1,          // portions per meal — 1 if you're only feeding yourself
      theme: 'auto',
      priceStaleWeeks: 8,   // nag to re-check a price after this long
    },
    ingredients: seedIngredients(),
    recipes: seedRecipes(),
    plans: {},              // weekStartIso -> { meals, bought, seed, generatedAt }
    pantry: {},             // ingredientId -> true ("already in the cupboard")
  };
}

let state = null;

function mergeDefaults(base, loaded) {
  const out = { ...base, ...loaded };
  for (const key of Object.keys(base)) {
    const b = base[key];
    if (b && typeof b === 'object' && !Array.isArray(b)) {
      out[key] = { ...b, ...(loaded && loaded[key] ? loaded[key] : {}) };
    }
  }
  return out;
}

// New seed items get added on upgrade; anything already saved is left alone so
// prices you've corrected are never clobbered by an app update.
function mergeSeeds(saved, seeds) {
  const list = Array.isArray(saved) ? saved.slice() : [];
  const have = new Set(list.map((x) => x.id));
  for (const s of seeds) if (!have.has(s.id)) list.push(s);
  return list;
}

export function load() {
  if (state) return state;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    state = parsed ? mergeDefaults(defaultState(), parsed) : defaultState();
    state.ingredients = mergeSeeds(state.ingredients, seedIngredients());
    state.recipes = mergeSeeds(state.recipes, seedRecipes());
  } catch (e) {
    console.error('meal-prep: could not read saved data, starting fresh', e);
    state = defaultState();
  }
  return state;
}

export function save() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.error('meal-prep: could not save', e);
  }
}

export function getState() {
  return load();
}

export function updateSettings(patch) {
  load();
  state.settings = { ...state.settings, ...patch };
  save();
  return state.settings;
}

// ---------- Ingredients ----------

export function ingredientMap() {
  load();
  const map = new Map();
  for (const i of state.ingredients) map.set(i.id, i);
  return map;
}

export function getIngredient(id) {
  load();
  return state.ingredients.find((i) => i.id === id) || null;
}

export function updateIngredient(id, patch) {
  load();
  const ing = state.ingredients.find((i) => i.id === id);
  if (!ing) return null;
  Object.assign(ing, patch);
  // Touching the price is what "confirming" means — it's no longer my estimate.
  if (patch.packPrice != null || patch.packQty != null) ing.confirmedAt = new Date().toISOString();
  save();
  return ing;
}

export function addIngredient(fields) {
  load();
  const ing = {
    id: uid(),
    name: 'New item',
    category: 'cupboard',
    packPrice: 1,
    packQty: 100,
    unit: 'g',
    protein: 0,
    kcal: 0,
    unitNoun: 'x',
    staple: false,
    confirmedAt: new Date().toISOString(),
    ...fields,
  };
  state.ingredients.push(ing);
  save();
  return ing;
}

export function deleteIngredient(id) {
  load();
  state.ingredients = state.ingredients.filter((i) => i.id !== id);
  for (const r of state.recipes) r.items = r.items.filter((it) => it.ingredient !== id);
  delete state.pantry[id];
  save();
}

export function setPantry(id, have) {
  load();
  if (have) state.pantry[id] = true;
  else delete state.pantry[id];
  save();
}

// ---------- Recipes ----------

export function recipeMap() {
  load();
  const map = new Map();
  for (const r of state.recipes) map.set(r.id, r);
  return map;
}

export function getRecipe(id) {
  load();
  return state.recipes.find((r) => r.id === id) || null;
}

export function recipesForSlot(slot) {
  load();
  const want = baseSlot(slot);
  return state.recipes.filter((r) => r.slot === want);
}

export function saveRecipe(recipe) {
  load();
  const idx = state.recipes.findIndex((r) => r.id === recipe.id);
  if (idx >= 0) state.recipes[idx] = recipe;
  else state.recipes.push(recipe);
  save();
  return recipe;
}

export function deleteRecipe(id) {
  load();
  state.recipes = state.recipes.filter((r) => r.id !== id);
  for (const plan of Object.values(state.plans)) {
    for (const day of Object.values(plan.meals || {})) {
      for (const [slot, entry] of Object.entries(day)) {
        if (entry && entry.recipe === id) delete day[slot];
      }
    }
  }
  save();
}

// ---------- Plans ----------

export function getPlan(weekIso) {
  load();
  return state.plans[weekIso] || null;
}

export function ensurePlan(weekIso) {
  load();
  if (!state.plans[weekIso]) {
    state.plans[weekIso] = { meals: {}, bought: {}, seed: 1, generatedAt: null };
    save();
  }
  return state.plans[weekIso];
}

export function setPlan(weekIso, plan) {
  load();
  state.plans[weekIso] = plan;
  save();
  return plan;
}

export function setMeal(weekIso, dayKey, slot, entry) {
  const plan = ensurePlan(weekIso);
  if (!plan.meals[dayKey]) plan.meals[dayKey] = {};
  if (entry) plan.meals[dayKey][slot] = entry;
  else delete plan.meals[dayKey][slot];
  save();
  return plan;
}

export function toggleBought(weekIso, lineId) {
  const plan = ensurePlan(weekIso);
  if (plan.bought[lineId]) delete plan.bought[lineId];
  else plan.bought[lineId] = true;
  save();
  return plan;
}

export function clearBought(weekIso) {
  const plan = ensurePlan(weekIso);
  plan.bought = {};
  save();
  return plan;
}

// ---------- Backup ----------

export function exportJson() {
  load();
  return JSON.stringify(state, null, 2);
}

export function importJson(text) {
  const parsed = JSON.parse(text);
  if (!parsed || typeof parsed !== 'object') throw new Error('That is not a backup file.');
  state = mergeDefaults(defaultState(), parsed);
  state.ingredients = mergeSeeds(state.ingredients, seedIngredients());
  state.recipes = mergeSeeds(state.recipes, seedRecipes());
  save();
  return state;
}

export function resetAll() {
  localStorage.removeItem(STORAGE_KEY);
  state = null;
  return load();
}
