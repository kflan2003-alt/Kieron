// Core data model. Shapes mirror what would eventually live in Supabase
// tables (snake_case-free, camelCase in the client — a thin mapping layer
// in src/services/supabaseClient.ts is where snake_case would be handled).

export type FoodCategory = 'fridge' | 'freezer' | 'cupboard' | 'fruit_veg';

export type ExpiryType = 'use_by' | 'best_before' | 'none';

export type RecognitionConfidence = 'high' | 'medium' | 'low';

export interface FoodItem {
  id: string;
  userId: string;
  name: string;
  quantity: number;
  unit: string;
  category: FoodCategory;
  expiryDate: string | null; // ISO date, null = long life / none
  expiryType: ExpiryType;
  opened: boolean;
  dateAdded: string; // ISO date
  imageUrl: string | null;
  recognitionConfidence: RecognitionConfidence | null;
  needsCheck?: boolean; // AI wasn't sure — surfaced for correction
  needsCheckReason?: string;
}

export type CookingConfidence = 'beginner' | 'confident' | 'very_confident';

export type CookingTimePreference = 'under_15' | '15_30' | '30_60' | 'no_preference';

export interface UserPreference {
  userId: string;
  name: string;
  peopleCount: number;
  dietaryPreferences: string[];
  allergies: string[];
  dislikedFoods: string[];
  favouriteCuisines: string[];
  cookingConfidence: CookingConfidence;
  preferredCookingTime: CookingTimePreference;
  autoSuggestReplan: boolean;
  notifyDaysBefore: number[]; // e.g. [2, 1, 0]
  onboardingComplete: boolean;
}

export interface Ingredient {
  name: string;
  quantity: number;
  unit: string;
  // matched against FoodItem.name when computing have/need in a recipe
}

export interface Recipe {
  id: string;
  name: string;
  imageEmoji: string; // stand-in for a real photo in the prototype
  prepMinutes: number;
  servings: number;
  ingredients: Ingredient[];
  steps: string[];
  cuisines: string[];

  // Anticipates future social features — not built yet, but the shape
  // supports them without a migration later.
  creatorUserId?: string;
  caption?: string;
  visibility?: 'private' | 'public';
  likeCount?: number;
  commentCount?: number;
  saveCount?: number;
}

export type DayStatus =
  | 'cooking'
  | 'eating_out'
  | 'working_late'
  | 'unavailable'
  | 'leftovers'
  | 'quick_meal';

export interface MealPlanEntry {
  id: string;
  date: string; // ISO date, one per calendar day
  recipeId: string | null;
  status: DayStatus;
  reason?: string; // "Uses your chicken before it expires."
  cooked?: boolean;
}

export interface MealPlan {
  id: string;
  userId: string;
  weekStart: string; // ISO date (Monday)
  entries: MealPlanEntry[];
}

export interface ShoppingListItem {
  id: string;
  name: string;
  quantity?: string;
  source: 'recipe' | 'manual';
  recipeId?: string;
  checked: boolean;
}

export interface ScanSession {
  id: string;
  createdAt: string;
  photoUris: string[];
  status: 'capturing' | 'processing' | 'reviewing' | 'done';
}

export interface FoodRecognitionResultItem {
  name: string;
  quantity: number;
  unit: string;
  expiryDate: string | null;
  expiryType: ExpiryType;
  category: FoodCategory;
  confidence: number; // 0-1
  uncertainField?: 'name' | 'expiryDate' | 'category';
  uncertainNote?: string;
}

export interface FoodRecognitionResult {
  items: FoodRecognitionResultItem[];
}

/** A proposed change to the current week, produced by MealReplanningService. */
export interface ReplanProposal {
  id: string;
  createdAt: string;
  triggerItemId: string; // the newly added FoodItem that caused this
  message: string;
  changes: Array<{
    date: string;
    fromRecipeId: string | null;
    toRecipeId: string | null;
  }>;
}
