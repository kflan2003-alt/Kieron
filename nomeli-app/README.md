# Nomeli — prototype

An AI-powered food management and meal-planning app. Nomeli tracks what
food you own, flags what's expiring, and plans meals around it —
automatically re-suggesting the week if you add something that expires
sooner than what's already planned. Built with Expo, React Native and
TypeScript.

## Running it on your phone

```
npm install
npx expo start
```

Scan the QR code with the **Expo Go** app (iOS/Android) or your phone's
camera. This needs your phone and computer on the same network — there's
no tunnel configured, since tunnelling doesn't work from every network
(it didn't from the sandboxed environment this was built in; run `npx
expo start --tunnel` yourself if your network needs it and you have
`@expo/ngrok` available).

Requires Node 18+.

## What's real vs. mocked

Everything in the product loop works — scanning (or manually adding)
food, seeing it organised and expiry-sorted in My Kitchen, an
auto-generated weekly plan that prioritises what's expiring, and dynamic
replanning when something new and urgent gets added. Three things are
intentionally mocked so the app runs standalone with no API keys:

- **`src/services/foodRecognitionService.ts`** — food ID and expiry dates
  come from a small local catalogue, not a real vision model. The camera
  capture itself is real (`expo-image-picker`); only the recognition step
  is faked.
- **`src/services/mealGenerationService.ts`** and
  **`mealReplanningService.ts`** — recipe selection and the "Nomeli has an
  idea" replanning logic use straightforward ingredient-matching and the
  deterministic expiry rules in `src/utils/expiry.ts`, not an LLM call.

All three are defined as interfaces (`FoodRecognitionService`,
`MealGenerationService`, `MealReplanningService`) with a mock
implementation behind a `get...Service()` factory function. Swapping in a
real vision/LLM API later means writing a new class that implements the
interface and changing one line in that factory — nothing in the UI
layer needs to change.

## Backend

There's no connected Supabase project. Everything (kitchen inventory,
meal plan, shopping list, preferences) lives in Zustand stores persisted
to `AsyncStorage` — it works fully offline and survives closing the app.

To connect a real backend:
1. Create a Supabase project with tables matching the shapes in
   `src/types/index.ts`.
2. Copy `.env.example` to `.env` and fill in your project URL and anon
   key.
3. Replace the store actions in `src/store/` with calls through
   `getSupabaseClient()` (from `src/services/supabaseClient.ts`), keeping
   the same store shape so screens don't need to change.

## Project structure

```
app/            expo-router file-based routes (screens)
src/components/ shared UI (Card, Button, Avocado mascot, badges…)
src/services/   the three AI service interfaces + mock recipe/food data
src/store/      Zustand stores (kitchen, meal plan, shopping, preferences)
src/theme/      colour/type/spacing tokens
src/types/      the data model (FoodItem, Recipe, MealPlan, etc.)
src/utils/      expiry-urgency logic — deterministic, never AI-driven
src/notifications/ local expiry notification scheduling (expo-notifications)
```

## Notes

- Expiry urgency (`expired` / `today` / `tomorrow` / `within3` /
  `within7` / `longlife`) is plain date arithmetic in
  `src/utils/expiry.ts` — this is deliberate per the brief: the language
  model reads a date off a photo, but urgency is always computed in code.
- The bottom nav's centre Scan button pushes a full-screen modal stack
  rather than being a normal tab, so it doesn't have its own persistent
  screen state.
- Social features (profiles, feed, likes) are not built, but `Recipe`'s
  shape in `src/types/index.ts` already has optional fields
  (`creatorUserId`, `caption`, `visibility`, `likeCount`, etc.) so adding
  them later doesn't need a data migration.
