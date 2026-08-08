import { FoodItem, MealPlanEntry, Recipe, UserPreference } from '../types';
import { RECIPES } from './mockData';
import { getExpiryUrgency, urgencyRank, addDays } from '../utils/expiry';
import { generateId } from '../utils/id';

/**
 * Turns "what's in the kitchen + what the user likes + how they cook" into
 * meal choices. The real implementation would call an LLM with the same
 * inputs; the mock uses simple ingredient-name matching and expiry
 * scoring, which is enough to demonstrate the product loop.
 */
export interface MealGenerationService {
  /** Recipes the kitchen can already make, best (most urgent/most complete) first. */
  suggestForKitchen(kitchen: FoodItem[], preferences: UserPreference): Recipe[];

  /** Fills empty days in a week with a chosen recipe + a plain-language reason. */
  generateWeekPlan(params: {
    weekStart: string;
    kitchen: FoodItem[];
    preferences: UserPreference;
    existingEntries: MealPlanEntry[];
  }): MealPlanEntry[];
}

function normalise(s: string): string {
  return s.trim().toLowerCase();
}

function isExcluded(recipe: Recipe, preferences: UserPreference): boolean {
  const excluded = new Set(
    [...preferences.allergies, ...preferences.dislikedFoods].map(normalise),
  );
  if (excluded.size === 0) return false;
  return recipe.ingredients.some((ing) => excluded.has(normalise(ing.name)));
}

/** How many of a recipe's ingredients are already owned, and the soonest expiry among them. */
function matchKitchen(recipe: Recipe, kitchen: FoodItem[]) {
  let have = 0;
  let bestUrgencyRank = Infinity;
  let matchedExpiringItem: FoodItem | null = null;

  for (const ing of recipe.ingredients) {
    const match = kitchen.find((f) => normalise(f.name) === normalise(ing.name));
    if (match) {
      have += 1;
      const urgency = getExpiryUrgency(match.expiryDate);
      const rank = urgencyRank(urgency);
      if (rank < bestUrgencyRank) {
        bestUrgencyRank = rank;
        matchedExpiringItem = match;
      }
    }
  }

  return { have, total: recipe.ingredients.length, bestUrgencyRank, matchedExpiringItem };
}

function cookingTimeFits(recipe: Recipe, preference: UserPreference['preferredCookingTime']): boolean {
  if (preference === 'no_preference') return true;
  if (preference === 'under_15') return recipe.prepMinutes <= 15;
  if (preference === '15_30') return recipe.prepMinutes <= 30;
  if (preference === '30_60') return recipe.prepMinutes <= 60;
  return true;
}

function reasonFor(recipe: Recipe, match: ReturnType<typeof matchKitchen>): string {
  if (match.matchedExpiringItem) {
    const urgency = getExpiryUrgency(match.matchedExpiringItem.expiryDate);
    if (urgency === 'today' || urgency === 'tomorrow' || urgency === 'within3') {
      return `Uses your ${match.matchedExpiringItem.name.toLowerCase()} before it expires.`;
    }
  }
  if (match.have === match.total && match.total > 0) {
    return "You've already got everything you need for this.";
  }
  if (match.have > 0) {
    return `Uses ${match.have} ingredient${match.have === 1 ? '' : 's'} from your kitchen.`;
  }
  return 'A change of pace for this week.';
}

export class MockMealGenerationService implements MealGenerationService {
  suggestForKitchen(kitchen: FoodItem[], preferences: UserPreference): Recipe[] {
    return RECIPES.filter((r) => !isExcluded(r, preferences))
      .map((r) => ({ recipe: r, match: matchKitchen(r, kitchen) }))
      .filter(({ match }) => match.have > 0)
      .sort((a, b) => {
        if (a.match.bestUrgencyRank !== b.match.bestUrgencyRank) {
          return a.match.bestUrgencyRank - b.match.bestUrgencyRank;
        }
        return b.match.have / b.match.total - a.match.have / a.match.total;
      })
      .map(({ recipe }) => recipe);
  }

  generateWeekPlan(params: {
    weekStart: string;
    kitchen: FoodItem[];
    preferences: UserPreference;
    existingEntries: MealPlanEntry[];
  }): MealPlanEntry[] {
    const { weekStart, kitchen, preferences, existingEntries } = params;
    const entries: MealPlanEntry[] = [];
    const usedRecipeIds = new Set<string>();

    const eligible = RECIPES.filter(
      (r) => !isExcluded(r, preferences) && cookingTimeFits(r, preferences.preferredCookingTime),
    );

    for (let i = 0; i < 7; i++) {
      const date = addDays(weekStart, i);
      const existing = existingEntries.find((e) => e.date === date);

      if (existing && existing.status !== 'cooking') {
        // Respect days the user has already marked as eating out / unavailable / etc.
        entries.push(existing);
        continue;
      }
      if (existing?.recipeId) {
        entries.push(existing);
        continue;
      }

      const scored = eligible
        .filter((r) => !usedRecipeIds.has(r.id))
        .map((r) => ({ recipe: r, match: matchKitchen(r, kitchen) }))
        .sort((a, b) => {
          if (a.match.bestUrgencyRank !== b.match.bestUrgencyRank) {
            return a.match.bestUrgencyRank - b.match.bestUrgencyRank;
          }
          return b.match.have - a.match.have;
        });

      const pick = scored[0] ?? { recipe: eligible[i % eligible.length], match: matchKitchen(eligible[i % eligible.length], kitchen) };
      usedRecipeIds.add(pick.recipe.id);

      entries.push({
        id: existing?.id ?? generateId('plan'),
        date,
        recipeId: pick.recipe.id,
        status: 'cooking',
        reason: reasonFor(pick.recipe, pick.match),
      });
    }

    return entries;
  }
}

let instance: MealGenerationService | null = null;

export function getMealGenerationService(): MealGenerationService {
  if (!instance) instance = new MockMealGenerationService();
  return instance;
}
