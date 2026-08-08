import { FoodItem, MealPlanEntry, ReplanProposal, UserPreference } from '../types';
import { RECIPES } from './mockData';
import { getExpiryUrgency, urgencyRank, todayISO } from '../utils/expiry';
import { generateId } from '../utils/id';

/**
 * Watches for a newly-added FoodItem that expires sooner than what the
 * current week's plan accounts for, and proposes a swap. This is the
 * "dynamic replanning" feature from the brief — it never applies a change
 * silently; it only ever proposes one, which the user accepts, edits or
 * rejects.
 */
export interface MealReplanningService {
  proposeReplan(params: {
    newItem: FoodItem;
    kitchen: FoodItem[];
    plan: MealPlanEntry[];
    preferences: UserPreference;
  }): ReplanProposal | null;
}

function normalise(s: string): string {
  return s.trim().toLowerCase();
}

function dayName(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', { weekday: 'long' });
}

function recipeById(id: string | null) {
  return id ? RECIPES.find((r) => r.id === id) ?? null : null;
}

/** Best urgency among a recipe's ingredients that are actually in the kitchen — how "justified" its slot is. */
function recipeUrgencyRank(recipeId: string | null, kitchen: FoodItem[]): number {
  const recipe = recipeById(recipeId);
  if (!recipe) return urgencyRank('longlife'); // empty slot — safest to overwrite
  let best = urgencyRank('longlife');
  for (const ing of recipe.ingredients) {
    const match = kitchen.find((f) => normalise(f.name) === normalise(ing.name));
    if (match) {
      const rank = urgencyRank(getExpiryUrgency(match.expiryDate));
      if (rank < best) best = rank;
    }
  }
  return best;
}

export class MockMealReplanningService implements MealReplanningService {
  proposeReplan(params: {
    newItem: FoodItem;
    kitchen: FoodItem[];
    plan: MealPlanEntry[];
    preferences: UserPreference;
  }): ReplanProposal | null {
    const { newItem, kitchen, plan, preferences } = params;
    if (!newItem.expiryDate) return null;

    const newItemUrgency = getExpiryUrgency(newItem.expiryDate);
    const newItemRank = urgencyRank(newItemUrgency);
    // Long-life items don't need urgent replanning.
    if (newItemUrgency === 'longlife') return null;

    const today = todayISO();
    const excluded = new Set([...preferences.allergies, ...preferences.dislikedFoods].map(normalise));

    // Already covered? If some day on/before the expiry date already cooks
    // a recipe using this ingredient, there's nothing to propose.
    const alreadyCovered = plan.some((entry) => {
      if (entry.date < today || entry.date > newItem.expiryDate!) return false;
      const recipe = recipeById(entry.recipeId);
      if (!recipe) return false;
      return recipe.ingredients.some((ing) => normalise(ing.name) === normalise(newItem.name));
    });
    if (alreadyCovered) return null;

    // Find the best recipe that would use this ingredient.
    const candidates = RECIPES.filter((r) => r.ingredients.some((ing) => normalise(ing.name) === normalise(newItem.name)))
      .filter((r) => !r.ingredients.some((ing) => excluded.has(normalise(ing.name))))
      .sort((a, b) => {
        const aHave = a.ingredients.filter((ing) => kitchen.some((f) => normalise(f.name) === normalise(ing.name))).length;
        const bHave = b.ingredients.filter((ing) => kitchen.some((f) => normalise(f.name) === normalise(ing.name))).length;
        return bHave - aHave;
      });
    const bestRecipe = candidates[0];
    if (!bestRecipe) return null;

    // Candidate days: today..expiry, status 'cooking' (not eating out / away / etc), not already this recipe.
    const eligibleDays = plan
      .filter(
        (entry) =>
          entry.date >= today &&
          entry.date <= newItem.expiryDate! &&
          entry.status === 'cooking' &&
          entry.recipeId !== bestRecipe.id,
      )
      .sort((a, b) => {
        // Prefer the day whose current meal is least justified by its own expiry pressure.
        const rankDiff = recipeUrgencyRank(b.recipeId, kitchen) - recipeUrgencyRank(a.recipeId, kitchen);
        if (rankDiff !== 0) return rankDiff;
        return a.date < b.date ? -1 : 1; // earlier day first
      });

    const targetEntry = eligibleDays[0];
    if (!targetEntry) return null;

    // Don't bump a meal that's more (or equally) expiry-critical than the new item.
    if (recipeUrgencyRank(targetEntry.recipeId, kitchen) <= newItemRank) return null;

    const displacedRecipeId = targetEntry.recipeId;
    const displacedRecipe = recipeById(displacedRecipeId);

    // Find the latest later 'cooking' day to relocate the displaced meal to.
    const laterDays = plan
      .filter((e) => e.date > targetEntry.date && e.status === 'cooking')
      .sort((a, b) => (a.date < b.date ? 1 : -1)); // latest first
    const relocateEntry = displacedRecipe ? laterDays[0] : undefined;

    const changes: ReplanProposal['changes'] = [
      { date: targetEntry.date, fromRecipeId: targetEntry.recipeId, toRecipeId: bestRecipe.id },
    ];
    if (relocateEntry) {
      changes.push({ date: relocateEntry.date, fromRecipeId: relocateEntry.recipeId, toRecipeId: displacedRecipeId });
    }

    const message = displacedRecipe
      ? relocateEntry
        ? `Your ${newItem.name.toLowerCase()} expires ${newItemUrgency === 'today' ? 'today' : newItemUrgency === 'tomorrow' ? 'tomorrow' : `on ${dayName(newItem.expiryDate!)}`} — before some of the ingredients in your current plan. I can move ${dayName(targetEntry.date)}'s ${displacedRecipe.name} to ${dayName(relocateEntry.date)} and suggest ${bestRecipe.name} for ${dayName(targetEntry.date)}.`
        : `Your ${newItem.name.toLowerCase()} expires soon. I can swap ${dayName(targetEntry.date)}'s ${displacedRecipe.name} for ${bestRecipe.name} so it gets used in time.`
      : `Your ${newItem.name.toLowerCase()} expires soon. I can suggest ${bestRecipe.name} for ${dayName(targetEntry.date)}.`;

    return {
      id: generateId('replan'),
      createdAt: new Date().toISOString(),
      triggerItemId: newItem.id,
      message,
      changes,
    };
  }
}

let instance: MealReplanningService | null = null;

export function getMealReplanningService(): MealReplanningService {
  if (!instance) instance = new MockMealReplanningService();
  return instance;
}
