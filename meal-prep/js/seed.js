// Starting ingredient prices and recipes.
//
// PRICES ARE ESTIMATES. They're typical UK supermarket own-brand prices, put
// here so the app does something useful the first time it's opened. Every one
// of them is meant to be overwritten with the real price from the shop — the
// Prices tab flags which ones you've never confirmed.
//
// Nutrition is per 100g / 100ml, except for items sold by the unit (eggs,
// bananas, wraps…) where it's per item. Dry goods (rice, pasta, oats, lentils)
// are dry weight throughout — recipes say "dry" so there's no ambiguity.

// Ordered the way the aisles run, so the shopping list reads as a walk round
// the shop rather than an alphabetical dump. Icons name sprite symbols.
export const CATEGORIES = [
  { key: 'fruit-veg', label: 'Fruit & veg', icon: 'carrot' },
  { key: 'meat-fish', label: 'Meat & fish', icon: 'beef' },
  { key: 'dairy-eggs', label: 'Dairy & eggs', icon: 'egg' },
  { key: 'bakery', label: 'Bakery', icon: 'croissant' },
  { key: 'frozen', label: 'Frozen', icon: 'snowflake' },
  { key: 'cupboard', label: 'Cupboard', icon: 'soup' },
];

// staple: true means "a bottle of oil lasts months" — these get their own
// section in the shopping list so a single week isn't charged for the lot.
export function seedIngredients() {
  return [
    // ---------- Meat & fish ----------
    ing('chicken-breast-frozen', 'Chicken breast fillets (frozen)', 'meat-fish', 5.75, 1000, 'g', 23.0, 106),
    ing('chicken-breast-fresh', 'Chicken breast fillets (fresh)', 'meat-fish', 5.20, 650, 'g', 23.0, 106),
    ing('chicken-thigh', 'Chicken thighs, boneless skinless', 'meat-fish', 5.50, 1000, 'g', 18.5, 145),
    ing('beef-mince-5', 'Beef mince, 5% fat', 'meat-fish', 4.40, 500, 'g', 21.0, 129),
    ing('beef-mince-20', 'Beef mince, 20% fat', 'meat-fish', 3.30, 500, 'g', 18.0, 221),
    ing('turkey-mince', 'Turkey mince, 5% fat', 'meat-fish', 4.00, 500, 'g', 22.0, 122),
    ing('pork-mince', 'Pork mince', 'meat-fish', 3.00, 500, 'g', 20.0, 204),
    ing('sausages', 'Pork sausages', 'meat-fish', 2.50, 454, 'g', 12.0, 250),
    ing('bacon-medallions', 'Bacon medallions', 'meat-fish', 2.50, 200, 'g', 22.0, 120),
    ing('ham', 'Cooked ham slices', 'meat-fish', 2.75, 400, 'g', 18.0, 105),
    ing('tuna-tinned', 'Tuna, tinned in water (drained wt)', 'meat-fish', 4.00, 416, 'g', 26.0, 108),
    ing('white-fish-frozen', 'White fish fillets (frozen)', 'frozen', 3.50, 500, 'g', 17.0, 90),
    ing('salmon-frozen', 'Salmon fillets (frozen)', 'frozen', 6.50, 440, 'g', 20.0, 180),

    // ---------- Dairy & eggs ----------
    ing('eggs', 'Eggs, large', 'dairy-eggs', 3.20, 15, 'unit', 6.4, 72, { unitNoun: 'egg' }),
    ing('greek-yoghurt', 'Greek style yoghurt, 0% fat', 'dairy-eggs', 2.25, 1000, 'g', 9.0, 57),
    ing('cottage-cheese', 'Cottage cheese', 'dairy-eggs', 1.30, 300, 'g', 11.0, 78),
    ing('cheddar', 'Mature cheddar', 'dairy-eggs', 3.50, 400, 'g', 25.0, 416),
    ing('milk', 'Semi-skimmed milk', 'dairy-eggs', 1.45, 2000, 'ml', 3.6, 50),

    // ---------- Fruit & veg ----------
    ing('onions', 'Onions', 'fruit-veg', 1.15, 1000, 'g', 1.2, 40),
    ing('garlic', 'Garlic bulbs', 'fruit-veg', 1.00, 3, 'unit', 0.6, 15, { unitNoun: 'bulb', staple: true }),
    ing('carrots', 'Carrots', 'fruit-veg', 0.75, 1000, 'g', 0.9, 41),
    ing('potatoes', 'White potatoes', 'fruit-veg', 2.20, 2500, 'g', 1.8, 79),
    ing('sweet-potato', 'Sweet potatoes', 'fruit-veg', 1.60, 1000, 'g', 1.6, 86),
    ing('broccoli', 'Broccoli', 'fruit-veg', 0.75, 350, 'g', 2.8, 34),
    ing('peppers', 'Mixed peppers', 'fruit-veg', 1.75, 3, 'unit', 1.8, 46, { unitNoun: 'pepper' }),
    ing('courgette', 'Courgettes', 'fruit-veg', 1.10, 2, 'unit', 3.0, 33, { unitNoun: 'courgette' }),
    ing('mushrooms', 'Mushrooms', 'fruit-veg', 0.95, 300, 'g', 3.1, 22),
    ing('salad-leaves', 'Spinach & salad leaves', 'fruit-veg', 1.00, 200, 'g', 2.9, 25),
    ing('bananas', 'Bananas', 'fruit-veg', 0.95, 6, 'unit', 1.3, 105, { unitNoun: 'banana' }),
    ing('apples', 'Apples', 'fruit-veg', 1.50, 6, 'unit', 0.3, 95, { unitNoun: 'apple' }),

    // ---------- Frozen ----------
    ing('frozen-mixed-veg', 'Frozen mixed vegetables', 'frozen', 1.50, 1000, 'g', 3.0, 55),
    ing('frozen-peas', 'Frozen peas', 'frozen', 1.40, 1000, 'g', 5.4, 81),
    ing('frozen-spinach', 'Frozen spinach', 'frozen', 1.75, 1000, 'g', 3.0, 30),
    ing('frozen-stirfry', 'Frozen stir-fry vegetables', 'frozen', 1.60, 750, 'g', 2.0, 40),
    ing('frozen-berries', 'Frozen mixed berries', 'frozen', 2.25, 500, 'g', 1.0, 50),

    // ---------- Bakery ----------
    ing('bread', 'Wholemeal bread', 'bakery', 1.30, 800, 'g', 10.0, 235),
    ing('wraps', 'Tortilla wraps', 'bakery', 1.20, 8, 'unit', 6.0, 160, { unitNoun: 'wrap' }),

    // ---------- Cupboard ----------
    ing('oats', 'Rolled oats', 'cupboard', 1.30, 1000, 'g', 11.0, 372),
    ing('rice-white', 'Long grain white rice (dry)', 'cupboard', 2.50, 2000, 'g', 7.0, 349),
    ing('rice-brown', 'Brown rice (dry)', 'cupboard', 1.80, 1000, 'g', 8.0, 350),
    ing('pasta', 'Pasta (dry)', 'cupboard', 1.10, 1000, 'g', 12.0, 350),
    ing('pasta-wholemeal', 'Wholemeal pasta (dry)', 'cupboard', 0.95, 500, 'g', 13.0, 330),
    ing('couscous', 'Couscous (dry)', 'cupboard', 1.10, 500, 'g', 13.0, 350),
    ing('noodles', 'Egg noodles (dry)', 'cupboard', 1.30, 375, 'g', 12.0, 350),
    ing('lentils', 'Red lentils (dry)', 'cupboard', 1.30, 500, 'g', 24.0, 353),
    ing('chickpeas', 'Chickpeas, tinned (drained wt)', 'cupboard', 0.55, 240, 'g', 7.2, 119),
    ing('kidney-beans', 'Kidney beans, tinned (drained wt)', 'cupboard', 0.55, 235, 'g', 7.0, 110),
    ing('black-beans', 'Black beans, tinned (drained wt)', 'cupboard', 0.85, 235, 'g', 7.0, 114),
    ing('baked-beans', 'Baked beans', 'cupboard', 0.45, 415, 'g', 4.7, 89),
    ing('chopped-tomatoes', 'Chopped tomatoes, tinned', 'cupboard', 0.45, 400, 'g', 1.3, 30),
    ing('tomato-puree', 'Tomato purée', 'cupboard', 0.60, 200, 'g', 4.5, 80, { staple: true }),
    ing('peanut-butter', 'Peanut butter', 'cupboard', 1.60, 340, 'g', 27.0, 600),
    ing('tofu', 'Firm tofu', 'cupboard', 2.00, 396, 'g', 14.0, 120),
    ing('whey', 'Whey protein powder', 'cupboard', 18.00, 1000, 'g', 78.0, 390, { staple: true }),
    ing('honey', 'Honey', 'cupboard', 1.75, 340, 'g', 0.3, 300, { staple: true }),
    ing('olive-oil', 'Olive oil', 'cupboard', 3.75, 500, 'ml', 0, 884, { staple: true }),
    ing('veg-oil', 'Vegetable oil', 'cupboard', 2.20, 1000, 'ml', 0, 884, { staple: true }),
    ing('soy-sauce', 'Soy sauce', 'cupboard', 1.10, 150, 'ml', 6.0, 60, { staple: true }),
    ing('stock-cubes', 'Stock cubes', 'cupboard', 0.70, 10, 'unit', 0.5, 20, { unitNoun: 'cube', staple: true }),
    ing('mixed-herbs', 'Mixed dried herbs', 'cupboard', 0.85, 12, 'g', 0, 250, { staple: true }),
    ing('paprika', 'Paprika', 'cupboard', 0.90, 45, 'g', 0, 280, { staple: true }),
    ing('curry-powder', 'Curry powder', 'cupboard', 1.00, 90, 'g', 0, 325, { staple: true }),
    ing('chilli-flakes', 'Chilli flakes', 'cupboard', 0.90, 33, 'g', 0, 280, { staple: true }),
    ing('salt', 'Salt', 'cupboard', 0.65, 750, 'g', 0, 0, { staple: true }),
  ];
}

function ing(id, name, category, packPrice, packQty, unit, protein, kcal, extra = {}) {
  return {
    id,
    name,
    category,
    packPrice,
    packQty,
    unit,
    protein,
    kcal,
    unitNoun: extra.unitNoun || 'x',
    staple: !!extra.staple,
    confirmedAt: null, // set when you overwrite the estimate with a real price
  };
}

// ---------------------------------------------------------------------------
// Recipes. Quantities are per single portion, so the planner can scale a
// recipe to however many portions a cook session needs.
//
// mode: 'batch' cooks once and reheats; 'assemble' is thrown together in a
//   couple of minutes on the day (yoghurt, shakes, toast).
// keeps: how many days a cooked portion is good for in the fridge — the Cook
//   tab uses it to tell you which portions to freeze.
// ---------------------------------------------------------------------------
export function seedRecipes() {
  return [
    // ---------- Breakfast ----------
    rec('overnight-oats', 'Protein overnight oats', 'breakfast', 'assemble', 5, 3, [
      ['oats', 80], ['greek-yoghurt', 150], ['milk', 100], ['bananas', 1], ['peanut-butter', 15],
    ], [
      'Stir the oats, yoghurt and milk together in a tub or jar.',
      'Swirl the peanut butter through and slice the banana on top.',
      'Lid on, fridge overnight. Make three or four at once — they keep three days.',
    ]),
    rec('scrambled-eggs-toast', 'Big scrambled eggs on toast', 'breakfast', 'assemble', 10, 0, [
      ['eggs', 3], ['bread', 80], ['milk', 20], ['veg-oil', 5],
    ], [
      'Beat the eggs with the milk and a pinch of salt.',
      'Low heat, keep them moving, pull them off while still slightly wet.',
      'Two slices of toast underneath.',
    ]),
    rec('bacon-egg-wrap', 'Bacon & egg wrap', 'breakfast', 'assemble', 10, 0, [
      ['wraps', 1], ['bacon-medallions', 60], ['eggs', 2],
    ], [
      'Grill the bacon medallions, fry or scramble the eggs.',
      'Pile into the wrap, fold, done.',
    ]),
    rec('yoghurt-berry-bowl', 'Greek yoghurt, berries & oats', 'breakfast', 'assemble', 3, 0, [
      ['greek-yoghurt', 200], ['frozen-berries', 80], ['oats', 40], ['honey', 10],
    ], [
      'Berries out of the freezer the night before, or microwave 40 seconds.',
      'Yoghurt, oats, berries, drizzle of honey.',
    ]),

    // ---------- Lunch ----------
    rec('chicken-rice-box', 'Chicken & rice box', 'lunch', 'batch', 30, 4, [
      ['chicken-breast-frozen', 180], ['rice-white', 90], ['frozen-mixed-veg', 150],
      ['soy-sauce', 10], ['veg-oil', 8], ['paprika', 2],
    ], [
      'Rice on: 90g dry per portion, double the water, 10 minutes, lid on, off the heat 5 more.',
      'Chicken diced and fried with the paprika until coloured through, 8–10 minutes.',
      'Veg straight from frozen into the pan for the last 4 minutes, then the soy sauce.',
      'Split between tubs, rice at the bottom, cool before the lids go on.',
    ]),
    rec('turkey-chilli', 'Turkey chilli with rice', 'lunch', 'batch', 40, 4, [
      ['turkey-mince', 150], ['kidney-beans', 120], ['chopped-tomatoes', 200], ['onions', 60],
      ['rice-white', 80], ['tomato-puree', 15], ['chilli-flakes', 1], ['stock-cubes', 0.5], ['veg-oil', 8],
    ], [
      'Onion soft in the oil, then the mince until no pink left.',
      'Purée, chilli flakes, tinned tomatoes, drained beans, crumbled stock cube.',
      'Simmer 20–25 minutes until it thickens. Freezes well.',
      'Cook the rice fresh or batch it alongside.',
    ]),
    rec('tuna-pasta-salad', 'Tuna pasta salad', 'lunch', 'batch', 15, 3, [
      ['tuna-tinned', 104], ['pasta', 100], ['frozen-peas', 80], ['greek-yoghurt', 40], ['salad-leaves', 30],
    ], [
      'Pasta on, peas thrown in for the last 2 minutes.',
      'Drain, cool under the tap so it does not go claggy.',
      'Fold through the tuna, yoghurt and leaves. Keeps three days.',
    ]),
    rec('lentil-chickpea-curry', 'Lentil & chickpea curry', 'lunch', 'batch', 35, 4, [
      ['lentils', 80], ['chickpeas', 120], ['chopped-tomatoes', 200], ['onions', 60],
      ['curry-powder', 5], ['rice-white', 80], ['veg-oil', 8], ['stock-cubes', 0.5],
    ], [
      'Onion in the oil, curry powder in for a minute until it smells like something.',
      'Lentils, tomatoes, drained chickpeas, stock cube, 400ml water.',
      'Simmer 25 minutes until the lentils collapse. Cheapest protein in the whole plan.',
    ]),
    rec('chicken-couscous-box', 'Chicken & couscous box', 'lunch', 'batch', 25, 4, [
      ['chicken-thigh', 180], ['couscous', 80], ['peppers', 0.5], ['courgette', 0.5],
      ['olive-oil', 10], ['paprika', 3], ['stock-cubes', 0.5],
    ], [
      'Thighs and chopped veg on a tray with the oil and paprika, 200°C for 22 minutes.',
      'Couscous in a bowl, stock cube dissolved in boiling water over it, cover for 5 minutes, fork through.',
      'Everything into tubs.',
    ]),

    // ---------- Dinner ----------
    rec('bolognese', 'Beef bolognese with pasta', 'dinner', 'batch', 40, 4, [
      ['beef-mince-5', 150], ['chopped-tomatoes', 200], ['onions', 60], ['carrots', 60],
      ['tomato-puree', 15], ['pasta', 100], ['mixed-herbs', 2], ['stock-cubes', 0.5], ['veg-oil', 8],
    ], [
      'Onion and grated carrot soft in the oil, then brown the mince hard.',
      'Purée, herbs, tomatoes, stock cube, splash of water.',
      'Simmer 25 minutes minimum. Sauce batches and freezes; cook pasta fresh each night.',
    ]),
    rec('chicken-traybake', 'Chicken thigh traybake', 'dinner', 'batch', 45, 3, [
      ['chicken-thigh', 200], ['potatoes', 300], ['peppers', 0.5], ['onions', 60],
      ['olive-oil', 12], ['paprika', 3],
    ], [
      'Potatoes chopped small, everything on one tray, oil and paprika, toss.',
      '200°C for 40 minutes, shake the tray halfway.',
      'One tray does three or four portions with no washing up.',
    ]),
    rec('cottage-pie', 'Cottage pie', 'dinner', 'batch', 55, 4, [
      ['beef-mince-20', 150], ['potatoes', 300], ['carrots', 80], ['frozen-peas', 80],
      ['onions', 60], ['stock-cubes', 0.5], ['milk', 30], ['tomato-puree', 10],
    ], [
      'Potatoes on to boil. Mince browned with the onion and diced carrot.',
      'Purée, stock cube, water, simmer 15 minutes, peas in at the end.',
      'Mash with the milk, spread over, 200°C for 20 minutes until the top catches.',
      'Portion straight out of the dish into tubs.',
    ]),
    rec('fish-potatoes-peas', 'Fish, potatoes & peas', 'dinner', 'assemble', 30, 2, [
      ['white-fish-frozen', 150], ['potatoes', 300], ['frozen-peas', 100], ['veg-oil', 8],
    ], [
      'Fish from frozen onto a tray, 200°C for 22 minutes.',
      'Potatoes in wedges on the same tray with the oil.',
      'Peas in the last 3 minutes in a pan. Best cooked fresh, not batched.',
    ]),
    rec('chicken-stir-fry', 'Chicken stir fry with noodles', 'dinner', 'assemble', 20, 2, [
      ['chicken-breast-frozen', 180], ['frozen-stirfry', 200], ['noodles', 90],
      ['soy-sauce', 15], ['veg-oil', 8], ['garlic', 0.15],
    ], [
      'Noodles in boiling water while the pan gets properly hot.',
      'Chicken strips first, 5 minutes, then garlic, then the frozen veg.',
      'Drained noodles and soy sauce in at the end, toss hard for a minute.',
    ]),
    rec('sausage-bean-casserole', 'Sausage & bean casserole', 'dinner', 'batch', 35, 4, [
      ['sausages', 150], ['baked-beans', 200], ['chopped-tomatoes', 200], ['onions', 60], ['bread', 60],
    ], [
      'Sausages browned and cut into chunks.',
      'Onion in the same pan, then the tomatoes and beans.',
      'Simmer 20 minutes. Bread on the side to mop it up.',
    ]),
    rec('tofu-veg-curry', 'Tofu & veg curry with rice', 'dinner', 'batch', 30, 4, [
      ['tofu', 150], ['frozen-mixed-veg', 200], ['chopped-tomatoes', 200],
      ['curry-powder', 5], ['rice-white', 80], ['veg-oil', 8], ['onions', 50],
    ], [
      'Press the tofu between two plates for 10 minutes, cube, fry until golden. Do not rush this bit.',
      'Set it aside, onion and curry powder in the pan, then tomatoes and frozen veg.',
      'Simmer 15 minutes, tofu back in at the end so it stays firm.',
    ]),
    rec('salmon-rice-broccoli', 'Salmon, rice & broccoli', 'dinner', 'assemble', 25, 2, [
      ['salmon-frozen', 110], ['rice-white', 90], ['broccoli', 120], ['olive-oil', 6], ['soy-sauce', 10],
    ], [
      'Salmon from frozen, 200°C for 25 minutes.',
      'Rice on, broccoli steamed over it for the last 5 minutes.',
      'Oil and soy over the lot. The expensive one — the planner only picks it if there is room in the budget.',
    ]),

    // ---------- Snack ----------
    rec('yoghurt-honey', 'Greek yoghurt & honey', 'snack', 'assemble', 2, 0, [
      ['greek-yoghurt', 170], ['honey', 10],
    ], ['Yoghurt in a tub, honey on top. That is the recipe.']),
    rec('banana-pb', 'Banana & peanut butter', 'snack', 'assemble', 2, 0, [
      ['bananas', 1], ['peanut-butter', 20],
    ], ['Banana split lengthways, peanut butter along it.']),
    rec('cottage-cheese-toast', 'Cottage cheese on toast', 'snack', 'assemble', 5, 0, [
      ['cottage-cheese', 100], ['bread', 40],
    ], ['Toast, cottage cheese, black pepper.']),
    rec('boiled-eggs', 'Two boiled eggs', 'snack', 'batch', 10, 5, [
      ['eggs', 2],
    ], ['8 minutes in boiling water, then straight into cold.', 'Boil six at once on cook day, they keep all week in the shell.']),
    rec('protein-shake', 'Protein shake', 'snack', 'assemble', 1, 0, [
      ['whey', 30], ['milk', 250],
    ], ['Shaker, milk first, then the powder, or it welds itself to the bottom.']),
    rec('apple-cheese', 'Apple & cheese', 'snack', 'assemble', 2, 0, [
      ['apples', 1], ['cheddar', 30],
    ], ['Apple sliced, cheese cut into it.']),
  ];
}

function rec(id, name, slot, mode, minutes, keeps, items, steps) {
  return {
    id,
    name,
    slot,
    mode,
    minutes,
    keeps, // fridge days for a cooked portion; 0 = make it on the day
    items: items.map(([ingredient, amount]) => ({ ingredient, amount })),
    steps,
    custom: false,
  };
}
