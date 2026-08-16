# Meal Prep

A weekly meal planner that ends in two numbers: exactly what to buy, and
exactly what it costs. Built for cheap, high-protein meal prep with two cook
sessions a week.

Offline, no accounts, no server. Everything lives in your phone's browser
storage.

## Two ways to run it

**As a Claude artifact** — one self-contained page, nothing to install. Built
from the same source with `node tools/build-single-file.mjs`, which flattens the
modules and inlines the CSS into `dist/meal-prep.html`. Rerun it after any change
to `js/` or `css/` and republish.

**As a home screen app** — the multi-file version below, served from GitHub
Pages, which adds the app icon, full-screen launch and offline caching.

Both share one codebase and one set of behaviour. What differs: the installed
version registers a service worker (the single-file build skips it, having no
`sw.js` beside it), and each keeps its own separate saved data, since browser
storage doesn't cross origins.

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

## The look

The design follows one idea: a **shelf-edge price ticket**. That's the
typography this app's reader looks at all day at work, and it's the right form
for the content — every screen resolves to a number you hand over at a till.

- **Type** is Archivo Variable, one 78KB file carrying both a weight axis
  (100–900) and a width axis (62–125). The width axis does real work: prices set
  condensed and heavy like a ticket, micro-labels set expanded and letter-spaced
  like the unit-price line under it. Subset to the characters the app actually
  sets, and served from `fonts/` rather than a CDN — the artifact's content
  policy blocks external hosts, so a linked webfont would silently fall back to
  the system stack.
- **Money** gets ticket typography wherever the price is the point: small raised
  £, large pounds, small pence, tabular figures so columns line up.
- **Icons** are Lucide (ISC), compiled into one inline SVG sprite. Strokes
  inherit `currentColor`, so an icon is simply the colour and size of the text
  beside it. There is no emoji anywhere in the interface — emoji can't take the
  theme's colour and render differently on every phone.
- **Colour** is a deep grocer's green with neutrals carrying a slight green cast
  rather than being flat grey. Amber and red are reserved for meaning — a price
  that's still a guess, a budget that's blown — and are never used decoratively.
  Every text/background pair is contrast-checked in both themes.

## Why it can't fetch prices from the web

Worth stating plainly, because it's the obvious thing to want:

- **No UK supermarket publishes a price API.** Tesco retired theirs years ago and
  nobody replaced it. There is no legitimate source to call.
- **A web page can't read a supermarket's site anyway.** Browsers block reading a
  response from another site unless that site opts in, and they don't. That's the
  browser's security model, not something code can work around.
- **Scraping means a server**, which breaks their terms, gets blocked by bot
  protection, and costs money to keep running.

So the price is typed, always. What the lookups save you is the *rest* of the
form — name, pack size, protein, calories — which is the tedious part anyway.

Two lookups, because they fail in different places:

**Fill from food list** (`js/foods.js`) is a table of common UK foods compiled
into the app. No network, so it works everywhere including inside Claude, where
outside requests are blocked outright.

**Scan barcode** (`js/barcode.js`) queries Open Food Facts — free, open, no key,
no prices. It needs a connection and only works in the installed version. Camera
scanning uses the browser's own barcode reader, which Chrome and Android have and
Safari doesn't; on Safari you type the digits instead, same lookup.

A caveat kept deliberately visible: the Open Food Facts parser was written on a
machine that couldn't reach the API, so it's built defensively — several possible
key names per field, types checked, anything unreadable left blank for you rather
than guessed. It's covered by fixture tests, not by a live call. If the real
responses differ, it should say "couldn't read that" rather than write nonsense
into your price list — but that's the one part of the app that hasn't met the
real thing.

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
by *this week's shop* to see only what's on the list in front of you. Two
shortcuts fill in everything except the price: **Fill from food list** searches a
few hundred common UK foods built into the app, and **Scan barcode** looks the
product up in Open Food Facts.

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

Export is also how you move your corrected prices from one version to the other,
since they save separately.

If a browser blocks storage entirely — iOS private browsing, some embedded
frames — the app says so in a banner and keeps working from memory for that
session. Export before closing the tab or the prices go with it.

## Notes

- Nutrition figures, including everything in the built-in food list, are typical
  values for the food rather than any one brand's label. Good enough to compare
  meals and plan a week; check the packet if you need it exact.
- Pack sizes offered by the food list are the common shelf size, a starting
  point to correct — they vary by shop.
- Dry goods are dry weight throughout — 90g of rice means 90g uncooked.
- Recipes are editable and you can add your own; anything you already cook works
  as long as you list the ingredients and rough per-portion amounts.
- The only network call the app can make is a barcode lookup you explicitly ask
  for. Nothing else leaves the phone, and there is nothing to sign into.

## Building the single-file version

```
node tools/build-single-file.mjs [outfile]     # default: dist/meal-prep.html
```

A ~30-line bundler rather than a dependency: each module under `js/` becomes a
namespace object and the imports are rewritten to destructure from it, so named
imports and `import * as store` both keep working with no changes to the source.
`dist/` is committed so the published page and the repo can't drift apart.

## Regenerating the design assets

```
npm pack lucide-static @fontsource-variable/archivo    # into a temp dir, unpack
node tools/build-assets.mjs <that-dir>
```

Rewrites `js/icons.js` (the sprite) and `fonts/archivo-subset.woff2`. Both are
committed; this only needs running when the icon set or character coverage
changes. Needs `pyftsubset` (`pip install fonttools brotli`).

## Tests

```
node tools/barcode-test.mjs
```

38 fixture tests over the Open Food Facts parser: quantity strings (`1kg`,
`4 x 125g`, `75cl`), kJ-to-kcal conversion, missing nutrition, junk input, and
every failure path of the lookup with a stubbed transport. Including one that
asserts a lookup can never return a price.

## Regenerating the icons

`node tools/generate-icons.mjs` (needs Playwright). Set `CHROMIUM_PATH` to use an
already-installed Chromium rather than letting Playwright download its own.
