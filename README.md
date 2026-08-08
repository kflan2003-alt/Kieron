# Debt & Cashflow

A single-file, offline personal debt and cashflow tracker. Everything lives in
`index.html` — no server, no accounts, no analytics. Your data stays on your
phone, in the browser's local storage.

> Also in this repo: [`nomeli/`](nomeli/) — a UI-only click-through prototype
> of the Nomeli kitchen-companion app design, at
> `https://kflan2003-alt.github.io/Kieron/nomeli/`. Unrelated to the app
> below.

## Get it onto your phone's home screen

The app is hosted as a plain web page via GitHub Pages, at:

**`https://kflan2003-alt.github.io/Kieron/`**

Visit that link in your phone's browser and add it to your home screen from
there. (A loose `.html` file can't be opened by Safari directly from the
Files app — there's no "open in Safari" handler for local files on iOS —
which is why this needs a real web address rather than a downloaded file.)

### iOS (Safari)

1. Open **Safari** (it must be Safari, not Chrome, for this to work on iOS)
   and go to `https://kflan2003-alt.github.io/Kieron/`.
2. Tap the **Share** icon (the square with an arrow pointing up).
3. Tap **Add to Home Screen**.
4. Confirm the name and tap **Add**.

The app icon now appears on your home screen and opens full-screen, without
Safari's address bar.

### Android (Chrome)

1. Open **Chrome** and go to `https://kflan2003-alt.github.io/Kieron/`.
2. Tap the **⋮** menu (top right).
3. Tap **Add to Home screen**.
4. Confirm and tap **Add**.

After that first visit, the page is cached on your phone and the app keeps
working with no network connection — nothing in it calls out anywhere.

## Using it

- First time you open it, a short setup wizard asks for your numbers one
  question at a time — income, rent, council tax, utilities, phone, food,
  transport, subscriptions, any money owed to a friend, both cards, and
  anything you're saving up for. You can bail out at any point with
  **Finish later** — everything works with just one debt entered, and you
  can fill in the rest later from **More → Your data**. Nothing you type
  ever leaves your phone; it's saved to local storage only, never to the
  repo this app is hosted from.
- **Rhythm** is the home screen: your next six months, lean months and the
  quarterly lump month sitting side by side so the contrast is obvious at a
  glance. Tap a month to see the breakdown.
- **Debts** lists what you owe, sorted by whichever payoff strategy is
  active, with monthly interest cost in pounds and a projected clear date.
  Switch between Avalanche, Snowball and Custom (drag to reorder), and pin
  any debt to a fixed position — the app tells you exactly what that pin
  costs in extra interest.
- **Afford** answers "can I afford this" for a one-off amount and date,
  comparing paying it as a lump sum against spreading it as 0% instalments.
- **More** has the monthly check-in (log what actually happened and see the
  drift from plan), all your editable data, and Export/Import for backups.

## Backing up your data

**More → Export data** copies everything to your clipboard as JSON. Paste it
somewhere safe (notes app, email to yourself, password manager). **More →
Import data** pastes it back in — useful when you get a new phone or clear
your browser data. This is the only backup mechanism; there is no cloud sync.

## Notes

- All figures are arithmetic and projections based on the numbers you enter.
  Nothing in this app is financial advice.
- Interest is approximated as `balance × APR ÷ 100 ÷ 12` per month — a
  simplification, not what your card issuer's statement will show to the
  penny, but close enough to compare strategies and spot the cost of a
  decision.
- Works fully offline. There are no network calls anywhere in the file.
