# Debt & Cashflow

A single-file, offline personal debt and cashflow tracker. Everything lives in
`index.html` — no server, no accounts, no analytics. Your data stays on your
phone, in the browser's local storage.

## Get it onto your phone's home screen

### iOS (Safari)

1. Get `index.html` onto your phone. Easiest ways:
   - Email it to yourself and open the attachment in Safari, or
   - AirDrop it from a Mac, or
   - Put it in iCloud Drive / Files and open it from there.
2. Open the file in **Safari** (it must be Safari, not Chrome, for this to work on iOS).
3. Tap the **Share** icon (the square with an arrow pointing up).
4. Tap **Add to Home Screen**.
5. Confirm the name and tap **Add**.

The app icon now appears on your home screen and opens full-screen, without
Safari's address bar.

### Android (Chrome)

1. Get `index.html` onto your phone (email attachment, USB transfer, cloud
   storage app — whatever's easiest).
2. Open it with **Chrome** using a file manager app, or by opening the file
   link directly.
3. Tap the **⋮** menu (top right).
4. Tap **Add to Home screen**.
5. Confirm and tap **Add**.

Note: because this is a plain HTML file with no server behind it, opening it
via `file://` on Android sometimes opens in a browser tab rather than a
standalone window — the shortcut still works and the app still runs fully
offline either way.

## Using it

- First time you open it, a short setup wizard asks for the numbers marked
  `TODO` in the brief (council tax, utilities, phone, food, transport,
  subscriptions, both cards, the trip) one question at a time. You can bail
  out at any point with **Finish later** — everything works with just one
  debt entered, and you can fill in the rest later from **More → Your data**.
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
