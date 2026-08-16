// An offline reference table of common UK foods, so adding an ingredient is
// "search a name, tap it" rather than typing nutrition off the back of a packet.
//
// Protein and kcal are per 100g / 100ml, or per item for things sold by the
// unit. They're typical values for the food, not any one brand's label — good
// enough to plan a week and compare meals, not a substitute for reading the
// packet if you need it exact.
//
// Pack sizes are the common shelf size, offered only as a starting point. They
// vary by shop and they're yours to correct — the price always is.
//
// Raw weights for meat and fish. Dry weights for grains, pasta and pulses.

function f(name, category, protein, kcal, pack, extra = {}) {
  return {
    name,
    category,
    protein,
    kcal,
    pack: pack || null,
    unit: extra.unit || 'g',
    unitNoun: extra.unitNoun || 'x',
    staple: !!extra.staple,
  };
}

const each = (noun) => ({ unit: 'unit', unitNoun: noun });
const liquid = { unit: 'ml' };

export const FOOD_TABLE = [
  // ---------------- Poultry ----------------
  f('Chicken breast, skinless, raw', 'meat-fish', 23.0, 106, 650),
  f('Chicken breast, frozen', 'meat-fish', 23.0, 106, 1000),
  f('Chicken thigh, boneless skinless, raw', 'meat-fish', 18.5, 145, 1000),
  f('Chicken thigh, bone in', 'meat-fish', 17.0, 175, 1000),
  f('Chicken drumsticks', 'meat-fish', 18.0, 165, 1000),
  f('Chicken mince', 'meat-fish', 20.0, 143, 500),
  f('Whole chicken', 'meat-fish', 20.0, 190, 1500),
  f('Cooked chicken slices', 'meat-fish', 22.0, 120, 200),
  f('Turkey breast, raw', 'meat-fish', 24.0, 105, 500),
  f('Turkey mince, 5% fat', 'meat-fish', 22.0, 122, 500),
  f('Turkey rashers', 'meat-fish', 19.0, 110, 200),

  // ---------------- Red meat ----------------
  f('Beef mince, 5% fat', 'meat-fish', 21.0, 129, 500),
  f('Beef mince, 12% fat', 'meat-fish', 19.5, 176, 500),
  f('Beef mince, 20% fat', 'meat-fish', 18.0, 221, 500),
  f('Beef steak, rump', 'meat-fish', 22.0, 175, 300),
  f('Beef braising steak', 'meat-fish', 21.0, 155, 500),
  f('Lamb mince', 'meat-fish', 18.0, 230, 500),
  f('Lamb chops', 'meat-fish', 19.0, 260, 400),
  f('Pork mince', 'meat-fish', 20.0, 204, 500),
  f('Pork chops', 'meat-fish', 22.0, 200, 400),
  f('Pork loin steaks', 'meat-fish', 23.0, 165, 400),
  f('Gammon steaks', 'meat-fish', 22.0, 160, 300),
  f('Pork sausages', 'meat-fish', 12.0, 250, 454),
  f('Chicken sausages', 'meat-fish', 14.0, 170, 400),
  f('Bacon, streaky', 'meat-fish', 17.0, 320, 300),
  f('Bacon medallions', 'meat-fish', 22.0, 120, 200),
  f('Cooked ham slices', 'meat-fish', 18.0, 105, 400),
  f('Chorizo', 'meat-fish', 24.0, 375, 200),
  f('Corned beef', 'meat-fish', 23.0, 217, 340),

  // ---------------- Fish ----------------
  f('Tuna, tinned in water (drained)', 'meat-fish', 26.0, 108, 416),
  f('Tuna, tinned in oil (drained)', 'meat-fish', 24.0, 190, 416),
  f('Salmon fillet, fresh', 'meat-fish', 20.0, 180, 240),
  f('Salmon fillets, frozen', 'frozen', 20.0, 180, 440),
  f('Tinned salmon', 'meat-fish', 21.0, 150, 213),
  f('Mackerel, tinned', 'meat-fish', 19.0, 230, 125),
  f('Sardines, tinned', 'meat-fish', 21.0, 210, 120),
  f('White fish fillets, frozen', 'frozen', 17.0, 90, 500),
  f('Cod fillet, fresh', 'meat-fish', 18.0, 82, 260),
  f('Haddock fillet', 'meat-fish', 19.0, 90, 260),
  f('Frozen breaded fish fillets', 'frozen', 13.0, 200, 400),
  f('Prawns, cooked', 'meat-fish', 20.0, 80, 180),
  f('Frozen prawns, raw', 'frozen', 18.0, 75, 400),
  f('Smoked mackerel', 'meat-fish', 19.0, 300, 200),

  // ---------------- Eggs & dairy ----------------
  f('Eggs, large', 'dairy-eggs', 6.4, 72, 15, each('egg')),
  f('Eggs, medium', 'dairy-eggs', 5.8, 64, 15, each('egg')),
  f('Egg whites, liquid', 'dairy-eggs', 11.0, 48, 500, liquid),
  f('Greek yoghurt, 0% fat', 'dairy-eggs', 9.0, 57, 1000),
  f('Greek yoghurt, full fat', 'dairy-eggs', 5.0, 133, 500),
  f('Natural yoghurt', 'dairy-eggs', 4.8, 79, 500),
  f('Skyr', 'dairy-eggs', 11.0, 63, 450),
  f('Cottage cheese', 'dairy-eggs', 11.0, 78, 300),
  f('Quark', 'dairy-eggs', 12.0, 68, 250),
  f('Cheddar, mature', 'dairy-eggs', 25.0, 416, 400),
  f('Mozzarella', 'dairy-eggs', 18.0, 250, 125),
  f('Feta', 'dairy-eggs', 17.0, 265, 200),
  f('Parmesan', 'dairy-eggs', 32.0, 400, 150),
  f('Cream cheese', 'dairy-eggs', 6.0, 250, 200),
  f('Halloumi', 'dairy-eggs', 22.0, 330, 225),
  f('Semi-skimmed milk', 'dairy-eggs', 3.6, 50, 2000, liquid),
  f('Whole milk', 'dairy-eggs', 3.4, 64, 2000, liquid),
  f('Skimmed milk', 'dairy-eggs', 3.6, 35, 2000, liquid),
  f('Oat milk', 'dairy-eggs', 1.0, 45, 1000, liquid),
  f('Soya milk, unsweetened', 'dairy-eggs', 3.3, 33, 1000, liquid),
  f('Butter', 'dairy-eggs', 0.6, 740, 250, { staple: true }),
  f('Double cream', 'dairy-eggs', 1.7, 450, 300, liquid),
  f('Creme fraiche, half fat', 'dairy-eggs', 3.0, 165, 300),

  // ---------------- Meat alternatives ----------------
  f('Firm tofu', 'cupboard', 14.0, 120, 396),
  f('Silken tofu', 'cupboard', 7.0, 60, 349),
  f('Tempeh', 'cupboard', 19.0, 195, 200),
  f('Quorn mince', 'frozen', 15.0, 105, 300),
  f('Quorn pieces', 'frozen', 15.0, 105, 300),
  f('Vegetarian sausages', 'frozen', 12.0, 190, 300),
  f('Falafel', 'cupboard', 12.0, 300, 200),
  f('Textured soya protein, dry', 'cupboard', 50.0, 340, 375),

  // ---------------- Pulses ----------------
  f('Red lentils, dry', 'cupboard', 24.0, 353, 500),
  f('Green lentils, dry', 'cupboard', 25.0, 350, 500),
  f('Lentils, tinned (drained)', 'cupboard', 8.0, 105, 235),
  f('Chickpeas, tinned (drained)', 'cupboard', 7.2, 119, 240),
  f('Chickpeas, dry', 'cupboard', 21.0, 360, 500),
  f('Kidney beans, tinned (drained)', 'cupboard', 7.0, 110, 235),
  f('Black beans, tinned (drained)', 'cupboard', 7.0, 114, 235),
  f('Cannellini beans, tinned (drained)', 'cupboard', 7.0, 110, 235),
  f('Butter beans, tinned (drained)', 'cupboard', 6.0, 105, 235),
  f('Baked beans', 'cupboard', 4.7, 89, 415),
  f('Mixed beans, tinned (drained)', 'cupboard', 7.0, 110, 235),
  f('Split peas, dry', 'cupboard', 23.0, 340, 500),

  // ---------------- Grains, pasta, rice ----------------
  f('Rolled oats', 'cupboard', 11.0, 372, 1000),
  f('Instant oats', 'cupboard', 11.0, 370, 1000),
  f('Long grain white rice, dry', 'cupboard', 7.0, 349, 2000),
  f('Basmati rice, dry', 'cupboard', 8.0, 350, 1000),
  f('Brown rice, dry', 'cupboard', 8.0, 350, 1000),
  f('Microwave rice pouch', 'cupboard', 3.0, 150, 250),
  f('Pasta, dry', 'cupboard', 12.0, 350, 1000),
  f('Wholemeal pasta, dry', 'cupboard', 13.0, 330, 500),
  f('Egg noodles, dry', 'cupboard', 12.0, 350, 375),
  f('Rice noodles, dry', 'cupboard', 6.0, 360, 375),
  f('Couscous, dry', 'cupboard', 13.0, 350, 500),
  f('Quinoa, dry', 'cupboard', 14.0, 370, 500),
  f('Bulgur wheat, dry', 'cupboard', 12.0, 340, 500),
  f('Pearl barley, dry', 'cupboard', 10.0, 350, 500),
  f('Cornflakes', 'cupboard', 7.0, 380, 500),
  f('Weetabix', 'cupboard', 12.0, 360, 430),
  f('Muesli', 'cupboard', 10.0, 370, 750),
  f('Granola', 'cupboard', 8.0, 450, 500),

  // ---------------- Bakery ----------------
  f('Wholemeal bread', 'bakery', 10.0, 235, 800),
  f('White bread', 'bakery', 8.0, 245, 800),
  f('Seeded bread', 'bakery', 11.0, 265, 800),
  f('Bagels', 'bakery', 9.5, 250, 5, each('bagel')),
  f('Tortilla wraps', 'bakery', 6.0, 160, 8, each('wrap')),
  f('Pitta bread', 'bakery', 5.5, 160, 6, each('pitta')),
  f('Crumpets', 'bakery', 3.5, 95, 6, each('crumpet')),
  f('English muffins', 'bakery', 6.0, 140, 6, each('muffin')),
  f('Naan bread', 'bakery', 8.0, 290, 2, each('naan')),
  f('Bread rolls', 'bakery', 5.0, 145, 6, each('roll')),

  // ---------------- Vegetables ----------------
  f('Onions', 'fruit-veg', 1.2, 40, 1000),
  f('Red onions', 'fruit-veg', 1.2, 42, 750),
  f('Garlic bulbs', 'fruit-veg', 0.6, 15, 3, { ...each('bulb'), staple: true }),
  f('Carrots', 'fruit-veg', 0.9, 41, 1000),
  f('White potatoes', 'fruit-veg', 1.8, 79, 2500),
  f('Baby potatoes', 'fruit-veg', 1.8, 75, 1000),
  f('Sweet potatoes', 'fruit-veg', 1.6, 86, 1000),
  f('Broccoli', 'fruit-veg', 2.8, 34, 350),
  f('Cauliflower', 'fruit-veg', 1.9, 30, 700),
  f('Cabbage', 'fruit-veg', 1.3, 28, 500),
  f('Mixed peppers', 'fruit-veg', 1.8, 46, 3, each('pepper')),
  f('Courgettes', 'fruit-veg', 3.0, 33, 2, each('courgette')),
  f('Aubergine', 'fruit-veg', 2.5, 30, 1, each('aubergine')),
  f('Mushrooms', 'fruit-veg', 3.1, 22, 300),
  f('Tomatoes', 'fruit-veg', 0.9, 18, 400),
  f('Cherry tomatoes', 'fruit-veg', 0.9, 20, 300),
  f('Cucumber', 'fruit-veg', 0.7, 15, 1, each('cucumber')),
  f('Spinach & salad leaves', 'fruit-veg', 2.9, 25, 200),
  f('Lettuce', 'fruit-veg', 1.0, 15, 1, each('lettuce')),
  f('Spring onions', 'fruit-veg', 1.8, 32, 100),
  f('Leeks', 'fruit-veg', 1.5, 30, 500),
  f('Celery', 'fruit-veg', 0.7, 16, 1, each('head')),
  f('Butternut squash', 'fruit-veg', 1.0, 45, 1000),
  f('Green beans', 'fruit-veg', 1.8, 31, 220),
  f('Asparagus', 'fruit-veg', 2.2, 20, 200),
  f('Beetroot, cooked', 'fruit-veg', 1.7, 45, 250),
  f('Ginger root', 'fruit-veg', 1.8, 80, 100, { staple: true }),
  f('Chillies, fresh', 'fruit-veg', 1.9, 40, 50, { staple: true }),

  // ---------------- Fruit ----------------
  f('Bananas', 'fruit-veg', 1.3, 105, 6, each('banana')),
  f('Apples', 'fruit-veg', 0.3, 95, 6, each('apple')),
  f('Oranges', 'fruit-veg', 1.2, 62, 5, each('orange')),
  f('Satsumas', 'fruit-veg', 0.6, 35, 8, each('satsuma')),
  f('Grapes', 'fruit-veg', 0.6, 69, 500),
  f('Strawberries', 'fruit-veg', 0.7, 33, 400),
  f('Blueberries', 'fruit-veg', 0.7, 57, 200),
  f('Raspberries', 'fruit-veg', 1.2, 52, 200),
  f('Pears', 'fruit-veg', 0.4, 100, 4, each('pear')),
  f('Kiwi', 'fruit-veg', 1.1, 45, 6, each('kiwi')),
  f('Melon', 'fruit-veg', 0.8, 34, 1, each('melon')),
  f('Pineapple', 'fruit-veg', 0.5, 50, 1, each('pineapple')),
  f('Avocado', 'fruit-veg', 2.0, 240, 2, each('avocado')),
  f('Lemons', 'fruit-veg', 1.1, 29, 4, each('lemon')),
  f('Raisins', 'cupboard', 3.1, 300, 500),
  f('Dates', 'cupboard', 2.5, 280, 250),

  // ---------------- Frozen ----------------
  f('Frozen mixed vegetables', 'frozen', 3.0, 55, 1000),
  f('Frozen peas', 'frozen', 5.4, 81, 1000),
  f('Frozen sweetcorn', 'frozen', 3.3, 90, 1000),
  f('Frozen spinach', 'frozen', 3.0, 30, 1000),
  f('Frozen broccoli', 'frozen', 3.0, 35, 900),
  f('Frozen stir-fry vegetables', 'frozen', 2.0, 40, 750),
  f('Frozen mixed berries', 'frozen', 1.0, 50, 500),
  f('Frozen chips', 'frozen', 3.0, 160, 1500),
  f('Frozen sweet potato fries', 'frozen', 2.0, 150, 750),
  f('Frozen diced onions', 'frozen', 1.2, 40, 500),
  f('Frozen chicken breast pieces', 'frozen', 22.0, 110, 1000),
  f('Frozen meatballs', 'frozen', 14.0, 210, 500),
  f('Frozen Yorkshire puddings', 'frozen', 7.0, 280, 12, each('pudding')),

  // ---------------- Tins, jars, sauces ----------------
  f('Chopped tomatoes, tinned', 'cupboard', 1.3, 30, 400),
  f('Passata', 'cupboard', 1.5, 35, 500),
  f('Tomato purée', 'cupboard', 4.5, 80, 200, { staple: true }),
  f('Pasta sauce, tomato', 'cupboard', 1.5, 55, 500),
  f('Curry sauce, jar', 'cupboard', 2.0, 110, 500),
  f('Coconut milk, tinned', 'cupboard', 2.0, 180, 400),
  f('Sweetcorn, tinned (drained)', 'cupboard', 3.0, 90, 165),
  f('Tinned tomatoes, plum', 'cupboard', 1.3, 30, 400),
  f('Soy sauce', 'cupboard', 6.0, 60, 150, { ...liquid, staple: true }),
  f('Sriracha', 'cupboard', 2.0, 95, 250, { staple: true }),
  f('Mayonnaise', 'cupboard', 1.0, 680, 500, { staple: true }),
  f('Light mayonnaise', 'cupboard', 1.0, 290, 500, { staple: true }),
  f('Ketchup', 'cupboard', 1.2, 100, 500, { staple: true }),
  f('Brown sauce', 'cupboard', 1.0, 110, 450, { staple: true }),
  f('Mustard', 'cupboard', 7.0, 160, 180, { staple: true }),
  f('Balsamic vinegar', 'cupboard', 0.5, 100, 250, { ...liquid, staple: true }),
  f('Stock cubes', 'cupboard', 0.5, 20, 10, { ...each('cube'), staple: true }),
  f('Peanut butter', 'cupboard', 27.0, 600, 340),
  f('Honey', 'cupboard', 0.3, 300, 340, { staple: true }),
  f('Jam', 'cupboard', 0.5, 260, 340, { staple: true }),
  f('Olive oil', 'cupboard', 0, 884, 500, { ...liquid, staple: true }),
  f('Vegetable oil', 'cupboard', 0, 884, 1000, { ...liquid, staple: true }),
  f('Coconut oil', 'cupboard', 0, 900, 500, { staple: true }),
  f('Cooking spray', 'cupboard', 0, 30, 190, { ...liquid, staple: true }),

  // ---------------- Herbs & spices ----------------
  f('Salt', 'cupboard', 0, 0, 750, { staple: true }),
  f('Black pepper', 'cupboard', 0, 250, 50, { staple: true }),
  f('Mixed dried herbs', 'cupboard', 0, 250, 12, { staple: true }),
  f('Paprika', 'cupboard', 0, 280, 45, { staple: true }),
  f('Smoked paprika', 'cupboard', 0, 280, 45, { staple: true }),
  f('Curry powder', 'cupboard', 0, 325, 90, { staple: true }),
  f('Garam masala', 'cupboard', 0, 330, 90, { staple: true }),
  f('Cumin, ground', 'cupboard', 0, 375, 45, { staple: true }),
  f('Chilli flakes', 'cupboard', 0, 280, 33, { staple: true }),
  f('Chilli powder', 'cupboard', 0, 280, 45, { staple: true }),
  f('Garlic granules', 'cupboard', 0, 330, 45, { staple: true }),
  f('Cinnamon, ground', 'cupboard', 0, 250, 38, { staple: true }),
  f('Turmeric', 'cupboard', 0, 310, 45, { staple: true }),
  f('Oregano, dried', 'cupboard', 0, 265, 11, { staple: true }),
  f('Bay leaves', 'cupboard', 0, 310, 5, { staple: true }),

  // ---------------- Nuts & seeds ----------------
  f('Almonds', 'cupboard', 21.0, 580, 200),
  f('Peanuts', 'cupboard', 26.0, 570, 200),
  f('Cashews', 'cupboard', 18.0, 550, 200),
  f('Walnuts', 'cupboard', 15.0, 650, 200),
  f('Mixed nuts', 'cupboard', 20.0, 600, 250),
  f('Chia seeds', 'cupboard', 17.0, 490, 250),
  f('Sunflower seeds', 'cupboard', 21.0, 580, 250),
  f('Pumpkin seeds', 'cupboard', 24.0, 560, 250),
  f('Ground flaxseed', 'cupboard', 18.0, 530, 250),

  // ---------------- Supplements & snacks ----------------
  f('Whey protein powder', 'cupboard', 78.0, 390, 1000, { staple: true }),
  f('Vegan protein powder', 'cupboard', 70.0, 380, 1000, { staple: true }),
  f('Protein bar', 'cupboard', 20.0, 210, 12, each('bar')),
  f('Protein yoghurt pot', 'dairy-eggs', 10.0, 65, 200),
  f('Rice cakes', 'cupboard', 8.0, 380, 130),
  f('Oatcakes', 'cupboard', 10.0, 430, 250),
  f('Crisps', 'cupboard', 6.0, 530, 150),
  f('Dark chocolate', 'cupboard', 8.0, 560, 100),
  f('Milk chocolate', 'cupboard', 7.5, 535, 110),
  f('Popcorn, plain', 'cupboard', 11.0, 390, 100),
  f('Hummus', 'dairy-eggs', 7.0, 300, 200),
  f('Tzatziki', 'dairy-eggs', 4.0, 130, 200),
];

// Ranked name search: exact prefix beats word-start beats anywhere, so typing
// "chick" puts chicken breast above "chickpeas, tinned".
export function searchFoods(query, limit = 30) {
  const q = String(query || '').trim().toLowerCase();
  if (!q) return FOOD_TABLE.slice(0, limit);

  const scored = [];
  for (const food of FOOD_TABLE) {
    const name = food.name.toLowerCase();
    let score;
    if (name === q) score = 0;
    else if (name.startsWith(q)) score = 1;
    else if (new RegExp(`\\b${q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`).test(name)) score = 2;
    else if (name.includes(q)) score = 3;
    else continue;
    scored.push({ food, score });
  }

  scored.sort((a, b) => (a.score - b.score) || a.food.name.localeCompare(b.food.name));
  return scored.slice(0, limit).map((s) => s.food);
}
