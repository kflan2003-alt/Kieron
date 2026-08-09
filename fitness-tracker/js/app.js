import * as db from './db.js';
import { getSessionForDate, TEMPLATE, durationForSession, MAIN_LIFTS, DAY_KEYS, DAY_LABELS } from './schedule.js';
import * as stats from './stats.js';
import { lineChartSVG } from './charts.js';
import * as gcal from './calendar.js';
import * as notif from './notifications.js';
import { currentProgramStatus } from './runProgram.js';
import {
  addDays, isoDate, parseIsoDate, startOfWeek, formatDayLabel, formatWeekRange,
  formatDateLong, escapeHtml, uid, qs, qsa, DAY_SHORT,
} from './utils.js';

const state = {
  tab: 'home',
  weekStart: startOfWeek(new Date()),
};

let selectedLift = MAIN_LIFTS[0];
let modalCtx = null; // { iso, session, existing, selectedFeeling }
let deferredInstallPrompt = null;

function el(html) {
  const t = document.createElement('template');
  t.innerHTML = html.trim();
  return t.content.firstElementChild;
}

function toast(msg, opts = {}) {
  const root = qs('#toast-root');
  if (!root) return;
  const node = el(`<div class="toast${opts.celebrate ? ' toast-celebrate' : ''}">${escapeHtml(msg)}</div>`);
  root.appendChild(node);
  requestAnimationFrame(() => node.classList.add('show'));
  setTimeout(() => {
    node.classList.remove('show');
    setTimeout(() => node.remove(), 300);
  }, opts.duration || 3000);
}

function closeModal() {
  qs('#modal-root').innerHTML = '';
  modalCtx = null;
}

function applyTheme(theme) {
  const root = document.documentElement;
  if (theme === 'light') root.setAttribute('data-theme', 'light');
  else if (theme === 'dark') root.setAttribute('data-theme', 'dark');
  else root.removeAttribute('data-theme');
}

function feelingEmoji(n) {
  return ['', '😩', '🙁', '😐', '🙂', '💪'][n] || '';
}

function formatTimeRange(settings, session) {
  const dur = durationForSession(session, settings);
  const [h, m] = settings.startTime.split(':').map(Number);
  const endMinutes = h * 60 + m + dur;
  const endLabel = `${String(Math.floor(endMinutes / 60) % 24).padStart(2, '0')}:${String(endMinutes % 60).padStart(2, '0')}`;
  return `${settings.startTime}–${endLabel} · ${dur} min`;
}

function notifStatusLabel() {
  const p = notif.permissionState();
  if (p === 'unsupported') return 'Not supported in this browser.';
  if (p === 'granted') return 'Permission granted.';
  if (p === 'denied') return 'Permission denied — enable it in your browser/site settings.';
  return 'Permission not yet requested.';
}

// ---------- HOME ----------
function renderHome() {
  const s = db.getState();
  const streak = stats.currentStreak(s.logs);
  const weeks = stats.weeksCompleted(s.logs);
  const days = Array.from({ length: 7 }, (_, i) => addDays(state.weekStart, i));
  const todayIso = isoDate(new Date());

  const cardsHtml = days.map((date) => {
    const iso = isoDate(date);
    const session = getSessionForDate(date, s);
    const entry = s.logs[iso];
    const done = !!(entry && entry.completed);
    const isToday = iso === todayIso;
    const override = s.dayOverrides[iso];
    const badges = [];
    if (session.shortSleep) badges.push('<span class="badge badge-sleep">😴 short sleep</span>');
    if (session.type === 'korfball') badges.push('<span class="badge badge-korfball">🏐 korfball</span>');
    if (entry && entry.feeling) badges.push(`<span class="badge badge-feeling">${feelingEmoji(entry.feeling)}</span>`);

    return `
      <div class="day-card ${done ? 'is-done' : ''} ${isToday ? 'is-today' : ''}">
        <button class="day-card-main" data-action="open-logger" data-iso="${iso}">
          <div class="day-card-date">
            <span class="day-name">${DAY_SHORT[session.dayKey]}</span>
            <span class="day-num">${formatDayLabel(date)}</span>
          </div>
          <div class="day-card-body">
            <div class="day-session-name">${escapeHtml(session.name)}</div>
            <div class="day-session-meta">${formatTimeRange(s.settings, session)}</div>
            <div class="day-badges">${badges.join('')}</div>
          </div>
          <div class="day-card-check ${done ? 'checked' : ''}" aria-hidden="true">${done ? '✓' : ''}</div>
        </button>
        <button class="day-card-menu" data-action="toggle-korfball" data-iso="${iso}" title="Toggle korfball for this day">
          ${override === 'korfball' ? '↩︎' : '🏐'}
        </button>
      </div>`;
  }).join('');

  const runStatus = currentProgramStatus(new Date());
  const runBannerHtml = runStatus
    ? `<div class="run-plan-banner">🏃 Half-marathon plan — Week ${runStatus.weekNumber} of ${runStatus.totalWeeks} · ${runStatus.complete ? 'Complete 🏁' : runStatus.phase}</div>`
    : '';

  qs('#view-root').innerHTML = `
    <div class="streak-banner">🔥 ${streak} day streak · ${weeks} week${weeks === 1 ? '' : 's'} completed</div>
    ${runBannerHtml}
    <div class="week-nav">
      <button class="btn btn-icon" data-action="week-prev" aria-label="Previous week">‹</button>
      <div class="week-range">${formatWeekRange(state.weekStart)}</div>
      <button class="btn btn-icon" data-action="week-today">Today</button>
      <button class="btn btn-icon" data-action="week-next" aria-label="Next week">›</button>
    </div>
    <div class="day-list">${cardsHtml}</div>
  `;
}

function toggleKorfball(iso) {
  const s = db.getState();
  const current = s.dayOverrides[iso];
  db.setDayOverride(iso, current === 'korfball' ? null : 'korfball');
  renderHome();
}

// ---------- LOGGER MODAL ----------
function lastSetValues(logs, exerciseName) {
  const dates = Object.keys(logs).sort().reverse();
  for (const iso of dates) {
    const entry = logs[iso];
    if (!entry || !entry.completed) continue;
    const ex = entry.exercises && entry.exercises.find((e) => e.name === exerciseName);
    if (ex) return ex.sets;
  }
  return [];
}

function openLogger(iso) {
  const s = db.getState();
  const date = parseIsoDate(iso);
  const session = getSessionForDate(date, s);
  const existing = s.logs[iso];
  modalCtx = { iso, session, existing, selectedFeeling: existing ? existing.feeling : null };
  renderLoggerModal();
}

function renderLoggerModal() {
  const s = db.getState();
  const { iso, session, existing } = modalCtx;
  const isTimeBased = (ex) => ex.sets[0] && ex.sets[0].targetMinutes != null;

  let bodyHtml;
  if (session.type === 'korfball') {
    bodyHtml = '<p class="modal-hint">Korfball training or match today. 🏐</p>';
  } else {
    bodyHtml = session.exercises.map((ex, exIdx) => {
      const existingEx = existing && existing.exercises && existing.exercises.find((e) => e.name === ex.name);
      const isDistanceBased = ex.sets[0] && ex.sets[0].targetKm != null;
      if (isDistanceBased) {
        const prevKm = existingEx ? existingEx.sets[0].km : ex.sets[0].targetKm;
        return `
          <div class="exercise-block">
            <div class="exercise-name">${escapeHtml(ex.name)} <span class="exercise-target">${escapeHtml(ex.targetLabel)}</span></div>
            <div class="set-row">
              <span class="set-label">Distance run (km)</span>
              <input type="number" min="0" step="0.1" class="input-km" data-ex="${exIdx}" value="${prevKm ?? ''}" />
            </div>
          </div>`;
      }
      if (isTimeBased(ex)) {
        const prevMinutes = existingEx ? existingEx.sets[0].minutes : ex.sets[0].targetMinutes;
        return `
          <div class="exercise-block">
            <div class="exercise-name">${escapeHtml(ex.name)} <span class="exercise-target">${escapeHtml(ex.targetLabel)}</span></div>
            <div class="set-row">
              <span class="set-label">Minutes done</span>
              <input type="number" min="0" step="1" class="input-minutes" data-ex="${exIdx}" value="${prevMinutes ?? ''}" />
            </div>
          </div>`;
      }
      const lastSets = lastSetValues(s.logs, ex.name);
      const setsHtml = ex.sets.map((setTarget, setIdx) => {
        const existingSet = existingEx && existingEx.sets[setIdx];
        const lastSet = lastSets[setIdx];
        const weightVal = existingSet ? existingSet.weight : (lastSet ? lastSet.weight : '');
        const repsVal = existingSet ? existingSet.reps : (setTarget.targetReps ?? '');
        return `
          <div class="set-row">
            <span class="set-label">${escapeHtml(setTarget.label || `Set ${setIdx + 1}`)}</span>
            <input type="number" min="0" step="0.5" placeholder="kg" class="input-weight" data-ex="${exIdx}" data-set="${setIdx}" value="${weightVal ?? ''}" />
            <input type="number" min="0" step="1" placeholder="reps" class="input-reps" data-ex="${exIdx}" data-set="${setIdx}" value="${repsVal ?? ''}" />
          </div>`;
      }).join('');
      return `
        <div class="exercise-block">
          <div class="exercise-name">${escapeHtml(ex.name)} <span class="exercise-target">${escapeHtml(ex.targetLabel)}</span></div>
          ${setsHtml}
        </div>`;
    }).join('');
  }

  const feeling = modalCtx.selectedFeeling;
  const feelingButtons = [1, 2, 3, 4, 5].map((n) => `<button type="button" class="feeling-btn ${feeling === n ? 'selected' : ''}" data-action="select-feeling" data-feeling="${n}">${feelingEmoji(n)}</button>`).join('');

  qs('#modal-root').innerHTML = `
    <div class="modal-overlay">
      <div class="modal-sheet">
        <div class="modal-header">
          <div>
            <div class="modal-title">${escapeHtml(session.name)}</div>
            <div class="modal-subtitle">${formatDateLong(parseIsoDate(iso))}</div>
          </div>
          <button class="btn btn-icon" data-action="close-modal">✕</button>
        </div>
        <div class="modal-body">
          ${bodyHtml}
          <div class="feeling-row">
            <span class="field-label">How did it feel?</span>
            <div class="feeling-buttons">${feelingButtons}</div>
          </div>
          <div class="notes-row">
            <label for="log-notes" class="field-label">Notes</label>
            <textarea id="log-notes" rows="2" placeholder="Anything worth remembering...">${escapeHtml(existing ? existing.notes : '')}</textarea>
          </div>
        </div>
        <div class="modal-footer">
          ${existing ? '<button class="btn btn-danger" data-action="delete-log">Delete</button>' : '<span></span>'}
          <button class="btn btn-primary" data-action="save-log">${existing ? 'Update' : 'Mark done & save'}</button>
        </div>
      </div>
    </div>
  `;
}

function handleSaveLog() {
  const { iso, session } = modalCtx;
  const notesEl = qs('#log-notes');
  const notes = notesEl ? notesEl.value.trim() : '';
  const feeling = modalCtx.selectedFeeling || null;

  let exercises = [];
  if (session.type !== 'korfball') {
    exercises = session.exercises.map((ex, exIdx) => {
      const isDistanceBased = ex.sets[0] && ex.sets[0].targetKm != null;
      if (isDistanceBased) {
        const input = qs(`.input-km[data-ex="${exIdx}"]`);
        const km = input && input.value !== '' ? Number(input.value) : null;
        return { name: ex.name, sets: [{ km }] };
      }
      const isTimeBased = ex.sets[0] && ex.sets[0].targetMinutes != null;
      if (isTimeBased) {
        const input = qs(`.input-minutes[data-ex="${exIdx}"]`);
        const minutes = input && input.value !== '' ? Number(input.value) : null;
        return { name: ex.name, sets: [{ minutes }] };
      }
      const sets = ex.sets.map((_, setIdx) => {
        const w = qs(`.input-weight[data-ex="${exIdx}"][data-set="${setIdx}"]`);
        const r = qs(`.input-reps[data-ex="${exIdx}"][data-set="${setIdx}"]`);
        return {
          weight: w && w.value !== '' ? Number(w.value) : null,
          reps: r && r.value !== '' ? Number(r.value) : null,
        };
      });
      return { name: ex.name, sets };
    });
  }

  const before = db.getState();
  const prevBests = {};
  for (const lift of MAIN_LIFTS) {
    const pr = stats.currentPR(before.logs, lift);
    prevBests[lift] = pr ? pr.estOneRM : 0;
  }

  const entry = {
    dayKey: session.dayKey,
    sessionName: session.name,
    type: session.type,
    completed: true,
    feeling,
    notes,
    exercises,
  };
  db.saveLog(iso, entry);

  const newPRs = [];
  for (const lift of MAIN_LIFTS) {
    const ex = exercises.find((e) => e.name === lift);
    if (!ex) continue;
    for (const set of ex.sets) {
      if (!set.weight || !set.reps) continue;
      const e1rm = stats.estOneRM(set.weight, set.reps);
      if (e1rm > prevBests[lift] + 0.001) {
        prevBests[lift] = e1rm;
        if (!newPRs.includes(lift)) newPRs.push(lift);
      }
    }
  }

  closeModal();
  renderHome();
  if (newPRs.length) toast(`🎉 New PR: ${newPRs.join(', ')}!`, { celebrate: true, duration: 4500 });
  else toast('Saved.');
}

function handleDeleteLog() {
  if (!modalCtx || !modalCtx.existing) return;
  if (!confirm('Delete this logged session?')) return;
  db.deleteLog(modalCtx.iso);
  closeModal();
  renderHome();
  toast('Deleted.');
}

// ---------- PROGRESS ----------
function renderProgress() {
  const s = db.getState();
  const liftButtons = MAIN_LIFTS.map((l) => `<button class="chip ${l === selectedLift ? 'selected' : ''}" data-action="select-lift" data-lift="${escapeHtml(l)}">${escapeHtml(l)}</button>`).join('');
  const history = stats.liftHistory(s.logs, selectedLift);
  const points = history.map((h, i) => ({
    x: i,
    y: Math.round(h.estOneRM * 10) / 10,
    label: `${h.date}: ${h.weight}kg × ${h.reps} (est. 1RM ${h.estOneRM.toFixed(1)}kg)`,
    highlight: h.isPR,
  }));
  const pr = history.length ? history.reduce((b, p) => (p.estOneRM > b.estOneRM ? p : b), history[0]) : null;

  const rows = [...history].reverse().slice(0, 20).map((h) => `
    <tr class="${h.isPR ? 'row-pr' : ''}">
      <td>${escapeHtml(h.date)}</td>
      <td>${h.weight}kg × ${h.reps}</td>
      <td>${h.estOneRM.toFixed(1)}kg${h.isPR ? ' 🏆' : ''}</td>
    </tr>`).join('');

  qs('#view-root').innerHTML = `
    <div class="section-title">Progress</div>
    <div class="chip-row">${liftButtons}</div>
    ${pr ? `
      <div class="pr-card">
        <div class="pr-label">Current best (est. 1RM)</div>
        <div class="pr-value">${pr.estOneRM.toFixed(1)} kg</div>
        <div class="pr-sub">${pr.weight}kg × ${pr.reps} on ${escapeHtml(pr.date)}</div>
      </div>` : ''}
    <div class="chart-card">${lineChartSVG(points, { emptyText: `Log a ${selectedLift} session to see progress` })}</div>
    <table class="history-table">
      <thead><tr><th>Date</th><th>Best set</th><th>Est. 1RM</th></tr></thead>
      <tbody>${rows || '<tr><td colspan="3" class="empty-row">No entries yet</td></tr>'}</tbody>
    </table>
  `;
}

// ---------- BODYWEIGHT ----------
function renderBody() {
  const s = db.getState();
  const entries = stats.bodyweightTrend(s.bodyweight);
  const points = entries.map((e, i) => ({ x: i, y: e.weight, label: `${e.date}: ${e.weight}kg` }));
  const latest = entries[entries.length - 1];
  const listRows = [...entries].reverse().slice(0, 20).map((e) => `
    <li class="bw-row">
      <span>${escapeHtml(e.date)}</span>
      <span>${e.weight} kg</span>
      <button class="btn btn-icon" data-action="delete-bw" data-id="${e.id}">✕</button>
    </li>`).join('');

  qs('#view-root').innerHTML = `
    <div class="section-title">Bodyweight</div>
    <form id="bw-form" class="bw-form">
      <input type="date" id="bw-date" value="${isoDate(new Date())}" required />
      <input type="number" id="bw-weight" step="0.1" min="0" placeholder="kg" required />
      <button type="submit" class="btn btn-primary">Add</button>
    </form>
    ${latest ? `
      <div class="pr-card">
        <div class="pr-label">Latest</div>
        <div class="pr-value">${latest.weight} kg</div>
        <div class="pr-sub">${escapeHtml(latest.date)}</div>
      </div>` : ''}
    <div class="chart-card">${lineChartSVG(points, { emptyText: 'Log your weight to see a trend' })}</div>
    <ul class="bw-list">${listRows || '<li class="empty-row">No entries yet</li>'}</ul>
  `;

  qs('#bw-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const date = qs('#bw-date').value;
    const weight = Number(qs('#bw-weight').value);
    if (!date || !weight) return;
    db.addBodyweight({ id: uid(), date, weight });
    renderBody();
    toast('Bodyweight logged.');
  });
}

// ---------- SETTINGS ----------
function renderSettings() {
  const s = db.getState();
  const dayOptions = ['<option value="">Not set</option>']
    .concat(DAY_KEYS.map((k) => `<option value="${k}" ${s.settings.korfballDay === k ? 'selected' : ''}>${DAY_LABELS[k]}</option>`))
    .join('');
  const signedIn = gcal.isSignedIn();
  const hasSyncedBefore = Object.keys(s.calendar.eventIds).length > 0;

  qs('#view-root').innerHTML = `
    <div class="section-title">Settings</div>

    <div class="settings-section">
      <h3>Schedule</h3>
      <label class="field-row">Workout start time
        <input type="time" id="set-start-time" value="${s.settings.startTime}" />
      </label>
      <label class="field-row">Gym session duration (min)
        <input type="number" id="set-gym-dur" min="15" step="5" value="${s.settings.gymDuration}" />
      </label>
      <label class="field-row">Run session duration (min)
        <input type="number" id="set-run-dur" min="10" step="5" value="${s.settings.runDuration}" />
      </label>
      <label class="field-row">Mobility session duration (min)
        <input type="number" id="set-mob-dur" min="5" step="5" value="${s.settings.mobilityDuration}" />
      </label>
      <label class="field-row">Korfball session duration (min)
        <input type="number" id="set-korf-dur" min="15" step="5" value="${s.settings.korfballDuration}" />
      </label>
      <label class="field-row">Korfball day
        <select id="set-korfball-day">${dayOptions}</select>
      </label>
      <p class="field-hint">This sets the recurring day used for calendar sync. You can also mark any single day as korfball from the dashboard without changing this.</p>
    </div>

    <div class="settings-section">
      <h3>Appearance</h3>
      <label class="field-row">Theme
        <select id="set-theme">
          <option value="auto" ${s.settings.theme === 'auto' ? 'selected' : ''}>Match system</option>
          <option value="light" ${s.settings.theme === 'light' ? 'selected' : ''}>Light</option>
          <option value="dark" ${s.settings.theme === 'dark' ? 'selected' : ''}>Dark</option>
        </select>
      </label>
    </div>

    <div class="settings-section">
      <h3>Reminders</h3>
      <label class="field-row checkbox-row">
        <input type="checkbox" id="set-notif-enabled" ${s.settings.notificationsEnabled ? 'checked' : ''} />
        Remind me at my workout start time
      </label>
      <p class="field-hint">Best-effort only: this fires while the app or browser tab is open. Phones don't let web pages schedule alarms while fully closed without a push server, so treat it as a nudge, not an alarm clock.</p>
      <div class="btn-row">
        <button class="btn btn-secondary" data-action="request-notif">Enable notifications</button>
        <span class="field-hint" id="notif-status">${notifStatusLabel()}</span>
      </div>
    </div>

    <div class="settings-section">
      <h3>Google Calendar sync</h3>
      <label class="field-row">OAuth Client ID
        <input type="text" id="set-client-id" placeholder="xxxx.apps.googleusercontent.com" value="${escapeHtml(s.calendar.clientId)}" />
      </label>
      <p class="field-hint">Create your own OAuth Client ID in Google Cloud Console (see README) — the app talks to Google directly from your phone, no server involved.</p>
      <div class="field-row checkbox-row">
        <input type="checkbox" id="set-cal-indefinite" ${s.calendar.indefinite ? 'checked' : ''} />
        Repeat indefinitely (until I turn it off)
      </div>
      <label class="field-row" id="weeks-row" ${s.calendar.indefinite ? 'style="display:none"' : ''}>Weeks to repeat
        <input type="number" id="set-cal-weeks" min="1" max="104" value="${s.calendar.weeksToRepeat}" />
      </label>
      <div class="btn-row">
        <button class="btn btn-secondary" data-action="${signedIn ? 'gcal-signout' : 'gcal-signin'}">${signedIn ? 'Sign out of Google' : 'Sign in with Google'}</button>
        <button class="btn btn-primary" data-action="gcal-sync">${hasSyncedBefore ? 'Re-sync calendar' : 'Push schedule to Calendar'}</button>
      </div>
      <p class="field-hint" id="cal-sync-status">${s.calendar.lastSyncedAt ? 'Last synced ' + new Date(s.calendar.lastSyncedAt).toLocaleString() : 'Not yet synced.'}</p>
    </div>

    <div class="settings-section">
      <h3>Your data</h3>
      <p class="field-hint">Everything lives only in this browser's local storage — no accounts, no server. Back it up before clearing browser data or switching phones.</p>
      <div class="btn-row">
        <button class="btn btn-secondary" data-action="export-data">Export to clipboard</button>
        <button class="btn btn-danger" data-action="reset-data">Reset all data</button>
      </div>
      <details class="import-details">
        <summary>Import from backup</summary>
        <textarea id="import-area" rows="4" placeholder="Paste exported JSON here"></textarea>
        <button class="btn btn-secondary" data-action="import-data">Import</button>
      </details>
    </div>
  `;

  qs('#set-start-time').addEventListener('change', (e) => db.updateSettings({ startTime: e.target.value }));
  qs('#set-gym-dur').addEventListener('change', (e) => db.updateSettings({ gymDuration: Number(e.target.value) }));
  qs('#set-run-dur').addEventListener('change', (e) => db.updateSettings({ runDuration: Number(e.target.value) }));
  qs('#set-mob-dur').addEventListener('change', (e) => db.updateSettings({ mobilityDuration: Number(e.target.value) }));
  qs('#set-korf-dur').addEventListener('change', (e) => db.updateSettings({ korfballDuration: Number(e.target.value) }));
  qs('#set-korfball-day').addEventListener('change', (e) => db.updateSettings({ korfballDay: e.target.value || null }));
  qs('#set-theme').addEventListener('change', (e) => { db.updateSettings({ theme: e.target.value }); applyTheme(e.target.value); });
  qs('#set-notif-enabled').addEventListener('change', (e) => db.updateSettings({ notificationsEnabled: e.target.checked }));
  qs('#set-client-id').addEventListener('change', (e) => db.updateCalendar({ clientId: e.target.value.trim() }));
  qs('#set-cal-indefinite').addEventListener('change', (e) => {
    db.updateCalendar({ indefinite: e.target.checked });
    const row = qs('#weeks-row');
    if (row) row.style.display = e.target.checked ? 'none' : '';
  });
  qs('#set-cal-weeks').addEventListener('change', (e) => db.updateCalendar({ weeksToRepeat: Number(e.target.value) }));
}

async function handleRequestNotif() {
  const perm = await notif.requestPermission();
  const label = qs('#notif-status');
  if (label) label.textContent = notifStatusLabel();
  if (perm === 'granted') toast('Notifications enabled.');
}

async function handleGcalSignIn() {
  const s = db.getState();
  try {
    await gcal.signIn(s.calendar.clientId);
    toast('Signed in to Google.');
    renderSettings();
  } catch (e) {
    toast(e.message || 'Sign-in failed.');
  }
}

async function handleGcalSync() {
  const s = db.getState();
  if (!s.calendar.clientId) { toast('Add your Google OAuth Client ID first.'); return; }
  const statusEl = qs('#cal-sync-status');
  try {
    if (!gcal.isSignedIn()) await gcal.signIn(s.calendar.clientId);
    if (statusEl) statusEl.textContent = 'Syncing…';
    const result = await gcal.syncSchedule(s.settings, s.calendar);
    db.updateCalendar({ eventIds: result.eventIds, lastSyncedAt: result.lastSyncedAt });
    renderSettings();
    toast('Calendar synced.');
  } catch (e) {
    toast(e.message || 'Calendar sync failed.');
    renderSettings();
  }
}

function handleExport() {
  const json = db.exportJSON();
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(json).then(() => toast('Copied to clipboard.')).catch(() => fallbackExport(json));
  } else {
    fallbackExport(json);
  }
}

function fallbackExport(json) {
  const area = qs('#import-area');
  if (area) area.value = json;
  toast('Clipboard unavailable — copy from the text box below.');
}

function handleImport() {
  const area = qs('#import-area');
  const raw = area ? area.value.trim() : '';
  if (!raw) return;
  try {
    db.importJSON(raw);
    toast('Data imported.');
    renderSettings();
  } catch (e) {
    toast('Invalid backup data.');
  }
}

function handleReset() {
  if (!confirm('This deletes all logs, bodyweight entries and settings on this device. Continue?')) return;
  db.resetAll();
  renderSettings();
  toast('All data reset.');
}

// ---------- TABS ----------
function switchTab(tab) {
  state.tab = tab;
  qsa('.tab-btn').forEach((b) => b.classList.toggle('active', b.dataset.tab === tab));
  renderCurrentTab();
}

function renderCurrentTab() {
  if (state.tab === 'home') renderHome();
  else if (state.tab === 'progress') renderProgress();
  else if (state.tab === 'body') renderBody();
  else if (state.tab === 'settings') renderSettings();
}

// ---------- INSTALL PROMPT ----------
function showInstallBanner() {
  if (qs('#install-banner')) return;
  const banner = el(`<div id="install-banner" class="install-banner">
    <span>Install this app on your home screen for quick access.</span>
    <button class="btn btn-primary btn-small" data-action="install-app">Install</button>
    <button class="btn btn-icon" data-action="dismiss-install">✕</button>
  </div>`);
  document.body.insertBefore(banner, document.body.firstChild);
}

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredInstallPrompt = e;
  showInstallBanner();
});

// ---------- GLOBAL EVENT DELEGATION ----------
document.addEventListener('click', (e) => {
  if (e.target.classList && e.target.classList.contains('modal-overlay')) {
    closeModal();
    return;
  }
  const btn = e.target.closest('[data-action]');
  if (!btn) return;
  const action = btn.dataset.action;
  switch (action) {
    case 'switch-tab': switchTab(btn.dataset.tab); break;
    case 'close-modal': closeModal(); break;
    case 'open-logger': openLogger(btn.dataset.iso); break;
    case 'toggle-korfball': toggleKorfball(btn.dataset.iso); break;
    case 'week-prev': state.weekStart = addDays(state.weekStart, -7); renderHome(); break;
    case 'week-next': state.weekStart = addDays(state.weekStart, 7); renderHome(); break;
    case 'week-today': state.weekStart = startOfWeek(new Date()); renderHome(); break;
    case 'select-feeling':
      if (modalCtx) {
        modalCtx.selectedFeeling = Number(btn.dataset.feeling);
        qsa('.feeling-btn').forEach((b) => b.classList.toggle('selected', Number(b.dataset.feeling) === modalCtx.selectedFeeling));
      }
      break;
    case 'save-log': handleSaveLog(); break;
    case 'delete-log': handleDeleteLog(); break;
    case 'select-lift': selectedLift = btn.dataset.lift; renderProgress(); break;
    case 'delete-bw': db.deleteBodyweight(btn.dataset.id); renderBody(); break;
    case 'request-notif': handleRequestNotif(); break;
    case 'gcal-signin': handleGcalSignIn(); break;
    case 'gcal-signout': gcal.signOut(); renderSettings(); toast('Signed out.'); break;
    case 'gcal-sync': handleGcalSync(); break;
    case 'export-data': handleExport(); break;
    case 'import-data': handleImport(); break;
    case 'reset-data': handleReset(); break;
    case 'install-app':
      if (deferredInstallPrompt) { deferredInstallPrompt.prompt(); deferredInstallPrompt = null; }
      qs('#install-banner')?.remove();
      break;
    case 'dismiss-install': qs('#install-banner')?.remove(); break;
    default: break;
  }
});

// ---------- INIT ----------
async function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    try {
      await navigator.serviceWorker.register('./sw.js');
    } catch (e) {
      console.warn('Service worker registration failed', e);
    }
  }
}

function init() {
  const s = db.load();
  applyTheme(s.settings.theme);
  registerServiceWorker();
  renderCurrentTab();
  notif.startReminderWatcher(() => db.getState());
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
