# Fitness Tracker

A mobile-first personal fitness tracker: a single-page, installable PWA that
works offline. No accounts, no backend, no database — your training log,
bodyweight history and settings live only in your phone's browser storage.
The only external connection is optional, direct-from-your-phone Google
Calendar sync.

## What it does

- **Weekly dashboard** — all 7 days with their planned session, a tap-to-log
  checkbox, current streak and weeks-completed count.
- **Exercise logger** — tapping a day opens a form pre-filled with that
  session's target sets/reps (and your last logged weight for each exercise),
  editable before saving. Gym, run/mobility and korfball days all get an
  appropriate form; every session also gets an optional 1–5 "how did it feel"
  rating and a notes field.
- **Progress charts** — weight-over-time for bench press, squat, deadlift and
  overhead press, using estimated 1RM (Epley formula) so different rep ranges
  are comparable. New PRs are automatically detected and highlighted.
- **Bodyweight log** — quick add form and trend chart.
- **Settings** — workout start time, session durations per session type,
  which day (if any) is your recurring korfball day, theme, and the Google
  Calendar sync controls. You can also mark any single date as korfball
  ad-hoc from the dashboard (tap the 🏐 button on a day card) without
  changing the recurring assignment.
- **Google Calendar sync** — push the whole weekly plan as recurring weekly
  events. Tuesday and Wednesday events get a "short sleep day — keep
  intensity easy" note in the description, since those mornings follow late
  work shifts. Re-syncing after you change Settings updates the existing
  events instead of creating duplicates.
- **PWA** — installable to your home screen, works offline (service worker
  caches the app shell), dark mode, best-effort local reminder notification.

## Hosting it

This is a static site — any static host works. If you're using GitHub Pages
for this repository, point it at whichever branch/folder serves this
directory, and the app will be reachable at that URL plus `/fitness-tracker/`
(e.g. `https://<username>.github.io/<repo>/fitness-tracker/`). All asset
paths in this app are relative, so it works from any subpath.

To try it locally first:

```bash
cd fitness-tracker
python3 -m http.server 8080
# then open http://localhost:8080 in a browser
```

Opening `index.html` directly as a `file://` URL will **not** fully work —
ES module imports and the service worker both require a real `http(s)`
origin. Always serve it.

### Add it to your home screen

**iOS (Safari):** open the hosted URL in Safari → Share icon → **Add to Home
Screen**. Must be Safari, not Chrome, for this to work on iOS.

**Android (Chrome):** open the URL → the app may prompt you to install
automatically, or use the **⋮** menu → **Add to Home screen** (or **Install
app**).

Once installed, it opens full-screen without browser chrome, and keeps
working offline after the first visit.

## Setting up Google Calendar sync

This app talks to the Google Calendar API directly from your phone/browser
using Google Identity Services — there's no backend server involved, which
also means **you** need to create your own OAuth Client ID (it's free, and
takes a few minutes):

1. Go to the [Google Cloud Console](https://console.cloud.google.com/) and
   create a new project (or reuse one you already have).
2. **APIs & Services → Library** — search for "Google Calendar API" and
   enable it.
3. **APIs & Services → OAuth consent screen** — set it up as **External**,
   fill in the required fields (app name, your email). You can leave it in
   "Testing" mode and add your own Google account under **Test users** — no
   need to publish it, since this is just for you.
4. **APIs & Services → Credentials → Create Credentials → OAuth client ID**:
   - Application type: **Web application**.
   - Under **Authorized JavaScript origins**, add the exact origin you host
     this app on, e.g. `https://<username>.github.io` (no path, no trailing
     slash) and, if you test locally, `http://localhost:8080`.
   - Save, then copy the generated **Client ID**
     (`....apps.googleusercontent.com`).
5. In the app: **Settings → Google Calendar sync → OAuth Client ID**, paste
   it in. It's saved locally on your device.
6. Tap **Sign in with Google**, approve access, then **Push schedule to
   Calendar**. Choose how many weeks to repeat first (or check "repeat
   indefinitely" for events that keep going until you delete them from
   Google Calendar or turn sync off).
7. If you later change a session's time/duration/exercises in Settings, tap
   **Re-sync calendar** — it updates the existing 7 recurring events in
   place rather than creating new ones.

The requested scope (`calendar.events`) only allows creating/editing events —
it can't read the rest of your calendar.

## Data & backups

Everything (settings, logs, bodyweight entries, calendar sync state) is
stored in `localStorage` on your device only. **Settings → Your data →
Export to clipboard** copies a full JSON backup; **Import from backup**
pastes it back in. Do this before clearing browser data, switching phones, or
uninstalling the app — there is no cloud backup.

## Notification limitations

The optional "remind me at my workout start time" toggle is best-effort: web
pages can't schedule a true background alarm on a phone without a push
server. The reminder only fires while the app (or its browser tab) is open
in the foreground or background — it is not a guaranteed wake-up like a
native alarm app.

## Regenerating the icons

`icons/*.png` were generated once via `tools/generate-icons.mjs` (draws a
simple dumbbell glyph on an HTML canvas in headless Chromium). To regenerate
after changing the design, install Playwright locally (`npm i -D
playwright`) and run `node tools/generate-icons.mjs`.

## Project structure

```
fitness-tracker/
├── index.html            App shell
├── manifest.webmanifest  PWA manifest
├── sw.js                 Service worker (offline app-shell caching)
├── css/styles.css        All styling (mobile-first, light/dark theme)
├── js/
│   ├── app.js            UI rendering + event wiring (entry point)
│   ├── db.js             localStorage persistence
│   ├── schedule.js       Weekly training template + korfball override logic
│   ├── stats.js          Estimated 1RM, PR detection, streaks
│   ├── charts.js         Dependency-free inline SVG line charts
│   ├── calendar.js       Google Identity Services + Calendar API sync
│   ├── notifications.js  Local reminder notifications
│   └── utils.js          Date/formatting helpers
├── icons/                PWA icons (any + maskable + apple-touch-icon)
└── tools/generate-icons.mjs
```

No build step, no dependencies, no bundler — every file is loaded directly
as an ES module.
