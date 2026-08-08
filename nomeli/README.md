# Nomeli — UI prototype

A click-through UI prototype of the Nomeli app design (AI kitchen companion:
scan food, track expiry, get recipe ideas, plan meals, shopping list). It's a
single self-contained `index.html`, same approach as the debt tracker at the
repo root — no build step, no server.

**View it:** `https://kflan2003-alt.github.io/Kieron/nomeli/`

## What this is — and isn't

This is UI only. Every screen from the design is here and navigable, but:

- **No real camera / AI recognition.** "Scan Food" shows a mock viewfinder;
  the result ("Strawberries, 125g…") is fixed, not a real photo analysis.
- **No real recipe generation.** The three recipes on "What should I eat?"
  are hand-written mock data, not generated from your actual kitchen
  contents.
- **No accounts, no database, no sync.** Sign-up is a form that goes nowhere;
  all state (kitchen items, meal plan, shopping list) lives in memory and
  resets on refresh.
- A few taps (notifications, edit details, pantry staples, editing profile
  settings) just show a toast saying they're not wired up.

What *is* functional: navigation between all 13 screens, the kitchen
search/filter, expiry filters, adding a meal to the planner, checking off /
adding shopping list items, and reshuffling recipe ideas.

## Why it's split from the root app

The root of this repo hosts an unrelated, already-in-use app (the debt &
cashflow tracker). This lives in its own folder so it doesn't touch that.

## Colours & type

Approximates the design system shown in the mockup: warm cream background,
forest green primary / sage green secondary / peach accent for
expiry-soon tags, Playfair Display for headings and Inter for body text
(loaded from Google Fonts with a system-font fallback if offline).
