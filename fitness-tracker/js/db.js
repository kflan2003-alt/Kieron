// Local persistence layer. Everything lives in localStorage under one key —
// no server, no accounts beyond the optional Google OAuth used only for Calendar sync.

const STORAGE_KEY = 'fitnessTracker.v1';

function defaultState() {
  return {
    version: 1,
    settings: {
      startTime: '06:00',
      gymDuration: 65,
      runDuration: 30,
      mobilityDuration: 15,
      korfballDuration: 90,
      korfballDay: null, // one of DAY_KEYS or null
      theme: 'auto', // auto | light | dark
      notificationsEnabled: false,
    },
    logs: {}, // isoDate -> log entry
    dayOverrides: {}, // isoDate -> 'korfball' (ad-hoc, this specific date only)
    bodyweight: [], // { id, date (iso), weight }
    calendar: {
      clientId: '',
      weeksToRepeat: 12,
      indefinite: false,
      eventIds: {}, // dayKey -> google event id
      lastSyncedAt: null,
    },
  };
}

let state = null;

function deepMergeDefaults(base, loaded) {
  const out = { ...base, ...loaded };
  for (const key of Object.keys(base)) {
    if (base[key] && typeof base[key] === 'object' && !Array.isArray(base[key])) {
      out[key] = { ...base[key], ...(loaded && loaded[key] ? loaded[key] : {}) };
    }
  }
  return out;
}

export function load() {
  if (state) return state;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    state = parsed ? deepMergeDefaults(defaultState(), parsed) : defaultState();
  } catch (e) {
    console.error('fitness-tracker: failed to load saved data, starting fresh', e);
    state = defaultState();
  }
  return state;
}

export function save() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function getState() {
  return load();
}

export function updateSettings(patch) {
  load();
  state.settings = { ...state.settings, ...patch };
  save();
  return state.settings;
}

export function updateCalendar(patch) {
  load();
  state.calendar = { ...state.calendar, ...patch };
  save();
  return state.calendar;
}

export function setEventId(dayKey, eventId) {
  load();
  state.calendar.eventIds[dayKey] = eventId;
  save();
}

export function getLog(iso) {
  load();
  return state.logs[iso] || null;
}

export function saveLog(iso, entry) {
  load();
  state.logs[iso] = entry;
  save();
}

export function deleteLog(iso) {
  load();
  delete state.logs[iso];
  save();
}

export function allLogs() {
  load();
  return state.logs;
}

export function setDayOverride(iso, value) {
  load();
  if (value) state.dayOverrides[iso] = value;
  else delete state.dayOverrides[iso];
  save();
}

export function getDayOverride(iso) {
  load();
  return state.dayOverrides[iso] || null;
}

export function addBodyweight(entry) {
  load();
  state.bodyweight.push(entry);
  state.bodyweight.sort((a, b) => a.date.localeCompare(b.date));
  save();
}

export function deleteBodyweight(id) {
  load();
  state.bodyweight = state.bodyweight.filter((e) => e.id !== id);
  save();
}

export function allBodyweight() {
  load();
  return state.bodyweight;
}

export function exportJSON() {
  load();
  return JSON.stringify(state, null, 2);
}

export function importJSON(json) {
  const parsed = JSON.parse(json);
  state = deepMergeDefaults(defaultState(), parsed);
  save();
  return state;
}

export function resetAll() {
  state = defaultState();
  save();
  return state;
}
