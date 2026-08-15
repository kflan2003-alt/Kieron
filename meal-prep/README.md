# Meal Prep

A weekly meal planner that ends in two numbers: exactly what to buy, and
exactly what it costs. Built for cheap, high-protein meal prep with two cook
sessions a week.

Offline, no accounts, no server. Everything lives in your phone's browser
storage.

## Get it onto your phone's home screen

Hosted via GitHub Pages at:

**`https://kflan2003-alt.github.io/Kieron/meal-prep/`**

### iOS (Safari)

1. Open **Safari** (it must be Safari on iOS) and go to the address above.
2. Tap the **Share** icon.
3. Tap **Add to Home Screen**, then **Add**.

### Android (Chrome)

1. Open **Chrome** and go to the address above.
2. Tap the **⋮** menu → **Add to Home screen** → **Add**.

After the first visit the page is cached, and the app works with no signal —
which is the normal state of affairs standing in the middle of a shop.

## About Inform, and why the app can't read it

Inform is an internal staff system. There's no public API, no export, and no
supported way for an outside app to query it. The only technical route in would
be driving the app or its endpoints with your work login, which is a breach of
almost every staff IT policy going and would break the first time they ship an
update. So this app doesn't attempt it.

What it does instead: it keeps **its own price list**. You look a price up in
Inform once, type it in, and it's remembered until the price changes. Every
total in the app is computed from those numbers, so the arithmetic is exact even
though the lookup is manual.

The app ships with typical UK supermarket estimates so it works on day one.
Anything you haven't corrected yourself is tagged **est** — on the Prices tab,
in the shopping list, and in a running count on the Week tab.

## The five tabs

**Week** — the plan. Tap **Build this week's plan** and it picks meals, then
shows the till total, cost per meal and protein per day against your targets.
Tap any meal to swap it for something else (options are sorted by protein per
pound). **Regenerate** gives a different plan of roughly equal quality. Prev/Next
move between weeks; each week keeps its own plan and its own ticked-off list.

**Shop** — the list, grouped by aisle, in whole packs. Tick things off as they
go in the trolley and the "left to buy" figure comes down. Cupboard staples
(oil, spices, stock cubes) sit in their own section — tick the ones you already
have and they drop out of the total until you untick them.

**Cook** — the two cook sessions, with the ingredient amounts already multiplied
up to the number of portions the week needs, plus the method. If a batch is
being eaten past its fridge life it tells you which portions to freeze.

**Prices** — the price list. Tap any item to enter what it really costs. Filter
by *this week's shop* to see only what's on the list in front of you.

**More** — targets (protein, budget, portions), which days you cook, which meals
to plan, the recipe editor, and export/import.

## How the plan is chosen

The planner builds a week and then hill-climbs it: it tries every alternative in
every slot, keeps whichever single swap improves things most, and repeats until
nothing helps — six times over from different starting points, keeping the best
result. It takes a few dozen milliseconds.

What it's optimising, in pounds so the trade-offs stay legible:

- the cost of the food actually eaten, which it minimises;
- **£8 per pound over budget** — near enough a hard ceiling;
- **35p per gram per day short of the protein target** — a strong pull, roughly
  double what a gram of protein costs at the margin;
- small nudges towards recipes that genuinely batch-cook, and towards variety —
  though variety is only ever a tie-breaker, never bought at the cost of protein.

If it can't reach your protein target inside your budget it says so on the Week
tab rather than quietly missing.

## Two different costs, both shown

- **Till total** — every ingredient rounded up to whole packs. What actually
  leaves your account. You can't buy 300g of a 500g bag.
- **Food used** — the value of what the week's meals eat. The rest of the pack
  is still in your cupboard, so this is the fair cost per meal.

The gap between them is the leftover value, shown on the Week tab. It's why the
first shop is dearest: once the cupboard staples are in and ticked off, the same
plan comes in several pounds cheaper.

## Backing up

**More → Export data** puts everything on the clipboard as JSON. Paste it
somewhere safe. **Import data** puts it back. That's the only backup — there's
no cloud sync, and clearing your browser data clears the app.

## Notes

- Nutrition figures are typical values for the food, not label-exact. Protein
  and calories are approximations good enough to compare meals and plan a week.
- Dry goods are dry weight throughout — 90g of rice means 90g uncooked.
- Recipes are editable and you can add your own; anything you already cook works
  as long as you list the ingredients and rough per-portion amounts.
- Nothing in the app makes a network call. There is nothing to sign into.

## Regenerating the icons

`node tools/generate-icons.mjs` (needs Playwright). Set `CHROMIUM_PATH` to use an
already-installed Chromium rather than letting Playwright download its own.
