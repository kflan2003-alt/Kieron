import { Recipe, FoodCategory, ExpiryType } from '../types';

export const RECIPES: Recipe[] = [
  {
    id: 'cajun-chicken-pasta',
    name: 'Creamy Cajun Chicken Pasta',
    imageEmoji: '🍝',
    prepMinutes: 25,
    servings: 2,
    cuisines: ['American', 'Italian-ish'],
    ingredients: [
      { name: 'Chicken breast', quantity: 2, unit: 'portions' },
      { name: 'Penne pasta', quantity: 250, unit: 'g' },
      { name: 'Double cream', quantity: 150, unit: 'ml' },
      { name: 'Peppers', quantity: 1, unit: 'unit' },
      { name: 'Cajun seasoning', quantity: 1, unit: 'tbsp' },
      { name: 'Parmesan', quantity: 50, unit: 'g' },
    ],
    steps: [
      'Season the chicken with Cajun spice and pan-fry until cooked through, then slice.',
      'Cook the pasta until al dente.',
      'Soften the peppers in the same pan, then stir in the cream and simmer.',
      'Toss the chicken and drained pasta through the sauce, finish with parmesan.',
    ],
  },
  {
    id: 'salmon-rice-bowl',
    name: 'Salmon Rice Bowl',
    imageEmoji: '🍣',
    prepMinutes: 20,
    servings: 2,
    cuisines: ['Japanese-inspired'],
    ingredients: [
      { name: 'Salmon', quantity: 2, unit: 'fillets' },
      { name: 'Rice', quantity: 200, unit: 'g' },
      { name: 'Spring onion', quantity: 2, unit: 'unit' },
      { name: 'Soy sauce', quantity: 1, unit: 'tbsp' },
      { name: 'Cucumber', quantity: 1, unit: 'unit' },
    ],
    steps: [
      'Cook the rice.',
      'Pan-fry or grill the salmon until just cooked.',
      'Slice the cucumber and spring onion.',
      'Build the bowl: rice, salmon, vegetables, a drizzle of soy sauce.',
    ],
  },
  {
    id: 'chicken-fajitas',
    name: 'Chicken Fajitas',
    imageEmoji: '🌯',
    prepMinutes: 30,
    servings: 2,
    cuisines: ['Mexican'],
    ingredients: [
      { name: 'Chicken breast', quantity: 2, unit: 'portions' },
      { name: 'Peppers', quantity: 2, unit: 'unit' },
      { name: 'Onion', quantity: 1, unit: 'unit' },
      { name: 'Wraps', quantity: 4, unit: 'unit' },
      { name: 'Fajita seasoning', quantity: 1, unit: 'tbsp' },
      { name: 'Cheese', quantity: 80, unit: 'g' },
    ],
    steps: [
      'Slice the chicken, peppers and onion into strips.',
      'Fry the chicken with fajita seasoning until cooked through.',
      'Add the peppers and onion, cook until softened.',
      'Warm the wraps and serve with cheese.',
    ],
  },
  {
    id: 'veg-stir-fry',
    name: 'Vegetable Stir Fry',
    imageEmoji: '🥦',
    prepMinutes: 15,
    servings: 2,
    cuisines: ['Chinese-inspired'],
    ingredients: [
      { name: 'Broccoli', quantity: 1, unit: 'head' },
      { name: 'Peppers', quantity: 1, unit: 'unit' },
      { name: 'Carrot', quantity: 2, unit: 'unit' },
      { name: 'Soy sauce', quantity: 2, unit: 'tbsp' },
      { name: 'Garlic', quantity: 2, unit: 'cloves' },
      { name: 'Noodles', quantity: 200, unit: 'g' },
    ],
    steps: [
      'Cook the noodles and set aside.',
      'Stir-fry the garlic, then the vegetables, over high heat.',
      'Add the noodles and soy sauce, toss to combine.',
    ],
  },
  {
    id: 'chicken-curry',
    name: 'Chicken Curry',
    imageEmoji: '🍛',
    prepMinutes: 35,
    servings: 3,
    cuisines: ['Indian-inspired'],
    ingredients: [
      { name: 'Chicken breast', quantity: 3, unit: 'portions' },
      { name: 'Onion', quantity: 1, unit: 'unit' },
      { name: 'Curry paste', quantity: 2, unit: 'tbsp' },
      { name: 'Coconut milk', quantity: 400, unit: 'ml' },
      { name: 'Rice', quantity: 250, unit: 'g' },
    ],
    steps: [
      'Fry the onion until soft, add the curry paste and cook for a minute.',
      'Add the chicken and brown it.',
      'Pour in the coconut milk and simmer until the chicken is cooked through.',
      'Serve with rice.',
    ],
  },
  {
    id: 'yoghurt-berry-bowl',
    name: 'Greek Yoghurt & Berry Bowl',
    imageEmoji: '🍓',
    prepMinutes: 5,
    servings: 1,
    cuisines: ['Breakfast'],
    ingredients: [
      { name: 'Greek yoghurt', quantity: 200, unit: 'g' },
      { name: 'Strawberries', quantity: 125, unit: 'g' },
      { name: 'Honey', quantity: 1, unit: 'tbsp' },
      { name: 'Granola', quantity: 30, unit: 'g' },
    ],
    steps: [
      'Spoon the yoghurt into a bowl.',
      'Top with sliced strawberries, a drizzle of honey and the granola.',
    ],
  },
  {
    id: 'spinach-omelette',
    name: 'Spinach & Cheese Omelette',
    imageEmoji: '🍳',
    prepMinutes: 10,
    servings: 1,
    cuisines: ['Quick'],
    ingredients: [
      { name: 'Eggs', quantity: 3, unit: 'unit' },
      { name: 'Spinach', quantity: 50, unit: 'g' },
      { name: 'Cheese', quantity: 40, unit: 'g' },
    ],
    steps: [
      'Wilt the spinach in a hot pan.',
      'Beat the eggs and pour over the spinach.',
      'Sprinkle with cheese and fold once set.',
    ],
  },
];

interface CatalogueEntry {
  name: string;
  category: FoodCategory;
  unit: string;
  quantity: number;
  expiryType: ExpiryType;
  typicalShelfDays: number; // used to fabricate a plausible expiry date
}

// A pool the mock FoodRecognitionService draws from — enough variety that
// repeated scanning during testing doesn't feel identical every time.
export const MOCK_FOOD_CATALOGUE: CatalogueEntry[] = [
  { name: 'Chicken breast', category: 'fridge', unit: 'portions', quantity: 2, expiryType: 'use_by', typicalShelfDays: 3 },
  { name: 'Salmon', category: 'fridge', unit: 'fillets', quantity: 2, expiryType: 'use_by', typicalShelfDays: 2 },
  { name: 'Greek yoghurt', category: 'fridge', unit: 'g', quantity: 500, expiryType: 'use_by', typicalShelfDays: 6 },
  { name: 'Spinach', category: 'fruit_veg', unit: 'g', quantity: 100, expiryType: 'use_by', typicalShelfDays: 4 },
  { name: 'Strawberries', category: 'fruit_veg', unit: 'g', quantity: 125, expiryType: 'best_before', typicalShelfDays: 3 },
  { name: 'Broccoli', category: 'fruit_veg', unit: 'head', quantity: 1, expiryType: 'use_by', typicalShelfDays: 5 },
  { name: 'Peppers', category: 'fruit_veg', unit: 'unit', quantity: 3, expiryType: 'use_by', typicalShelfDays: 7 },
  { name: 'Onion', category: 'cupboard', unit: 'unit', quantity: 4, expiryType: 'best_before', typicalShelfDays: 21 },
  { name: 'Carrot', category: 'fruit_veg', unit: 'unit', quantity: 5, expiryType: 'use_by', typicalShelfDays: 10 },
  { name: 'Eggs', category: 'fridge', unit: 'unit', quantity: 6, expiryType: 'best_before', typicalShelfDays: 14 },
  { name: 'Milk', category: 'fridge', unit: 'L', quantity: 1, expiryType: 'use_by', typicalShelfDays: 5 },
  { name: 'Cheese', category: 'fridge', unit: 'g', quantity: 200, expiryType: 'best_before', typicalShelfDays: 12 },
  { name: 'Penne pasta', category: 'cupboard', unit: 'g', quantity: 500, expiryType: 'none', typicalShelfDays: 0 },
  { name: 'Rice', category: 'cupboard', unit: 'g', quantity: 1000, expiryType: 'none', typicalShelfDays: 0 },
  { name: 'Wraps', category: 'cupboard', unit: 'unit', quantity: 8, expiryType: 'best_before', typicalShelfDays: 9 },
  { name: 'Frozen peas', category: 'freezer', unit: 'g', quantity: 600, expiryType: 'none', typicalShelfDays: 0 },
  { name: 'Frozen chicken thighs', category: 'freezer', unit: 'g', quantity: 500, expiryType: 'none', typicalShelfDays: 0 },
];
