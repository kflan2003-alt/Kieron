// A progressive "zero to half marathon" running program, delivered across
// your existing Tuesday/Wednesday run slots (2 sessions/week). Deliberately
// conservative: you're building running volume on top of already-heavy
// squat/deadlift days and korfball, so the priority is staying injury-free,
// not speed of progress. If a session ever feels too hard, repeat it rather
// than pushing to the next one — the plan doesn't mind waiting.
//
// Structure: Phase 1 "Learn to Run" (run/walk intervals -> continuous 30-40
// min, adapted from the classic Couch-to-5K progression but spread across
// 2 sessions/week instead of 3), then Phase 2 "Half-Marathon Build" (a
// steady mid-week run + a progressively longer Wednesday long run, with a
// lighter cutback week every 4th week), then a 2-week taper into race day.

import { addDays, dayKeyFor, isoDate, parseIsoDate, startOfWeek, stripTime } from './utils.js';

// First Tuesday of the plan. Change this if you want to push the start date.
export const PLAN_START_DATE = '2026-08-11';

// Phase 1 — "Learn to Run": 28 sessions (14 weeks @ 2/week).
export const PHASE1_SESSIONS = [
  'Run 1 min / walk 1.5 min — repeat 8× (~20 min total)',
  'Run 1 min / walk 1.5 min — repeat 8× (repeat, lock it in)',
  'Run 1.5 min / walk 2 min — repeat 6× (~21 min)',
  'Run 1.5 min / walk 2 min — repeat 6× (repeat)',
  '(Run 1.5 min / walk 1.5 min) ×2, then (run 3 min / walk 3 min) ×2 (~23 min)',
  'Same as last session — repeat to consolidate',
  'Run 3 min / walk 1.5 min, run 5 min / walk 2.5 min, run 3 min / walk 1.5 min, run 5 min (~24 min)',
  'Same as last session — repeat to consolidate',
  '(Run 5 min / walk 3 min) ×3 (~24 min)',
  'Run 8 min / walk 5 min, run 8 min (~26 min)',
  'Run 20 min continuous, easy pace — your first unbroken run',
  'Run 20 min continuous (repeat, get comfortable)',
  'Run 10 min / walk 3 min / run 10 min (~23 min, stepping stone)',
  'Run 25 min continuous',
  'Run 25 min continuous (repeat)',
  'Run 25 min continuous, aim for slightly further than last time',
  'Run 28 min continuous',
  'Run 28 min continuous (repeat)',
  'Run 30 min continuous — roughly 5K done',
  'Run 30 min continuous (repeat, consolidate)',
  'Run 30 min continuous, nudge the pace slightly',
  'Run 32 min continuous',
  'Run 32 min continuous (repeat)',
  'Run 35 min continuous',
  'Run 35 min continuous (repeat)',
  'Run 35 min continuous, steady effort',
  'Run 35–38 min continuous',
  'Run 38–40 min continuous — Phase 1 complete, you’re a runner',
];

// Rough total minutes for each Phase 1 session (for pre-filling the logger only —
// the description above is the actual prescription).
export const PHASE1_EST_MINUTES = [
  20, 20, 21, 21, 23, 23, 24, 24, 24, 26, 20, 20, 23, 25,
  25, 25, 28, 28, 30, 30, 30, 32, 32, 35, 35, 35, 37, 39,
];

// Phase 2 — "Half-Marathon Build": 14 weeks. Tuesday = steady run (minutes),
// Wednesday = long run (km). Cutback (lighter) week every 4th week: 4, 8, 12.
export const PHASE2_TUE_MINUTES = [30, 30, 35, 25, 35, 35, 40, 30, 40, 40, 40, 30, 35, 30];
export const PHASE2_WED_KM = [6, 7, 8, 6, 9, 10, 11, 8, 12, 14, 15, 10, 17, 18];

// Taper — 2 weeks (4 sessions) into race day.
export const TAPER = [
  { description: 'Easy 25 min run, relaxed pace — taper begins, trust the training', minutes: 25 },
  { description: 'Long run: 10 km at an easy, comfortable pace', km: 10 },
  { description: 'Very easy 15–20 min shakeout jog, a few relaxed strides', minutes: 18 },
  { description: 'Rest, or a gentle 10 min jog — save your legs for race day', minutes: 10 },
];

export const TOTAL_WEEKS = 14 + PHASE2_WED_KM.length + 2; // 30

function weekOffset(date) {
  const start = parseIsoDate(PLAN_START_DATE);
  const d = stripTime(date);
  const weekStartOfStart = startOfWeek(start);
  const weekStartOfDate = startOfWeek(d);
  return {
    d,
    start,
    weeksElapsed: Math.round((weekStartOfDate - weekStartOfStart) / (7 * 86400000)),
  };
}

/**
 * Returns the prescribed run for a specific date if it falls on a Tuesday or
 * Wednesday on/after PLAN_START_DATE, else null (plan not active for that date).
 */
export function getRunProgramSession(date) {
  const { d, start, weeksElapsed } = weekOffset(date);
  if (d < start) return null;
  const dayKey = dayKeyFor(d);
  if (dayKey !== 'tuesday' && dayKey !== 'wednesday') return null;
  if (weeksElapsed < 0) return null;

  const index = weeksElapsed * 2 + (dayKey === 'wednesday' ? 1 : 0);
  const weekNumber = weeksElapsed + 1;
  const base = { weekNumber, totalWeeks: TOTAL_WEEKS, complete: false };

  if (index < PHASE1_SESSIONS.length) {
    return {
      ...base,
      phase: 'Learn to Run',
      phaseNote: `Session ${index + 1} of ${PHASE1_SESSIONS.length}`,
      description: PHASE1_SESSIONS[index],
      targetMinutes: PHASE1_EST_MINUTES[index],
      targetKm: null,
    };
  }

  const buildLen = PHASE2_WED_KM.length * 2;
  const phase2Index = index - PHASE1_SESSIONS.length;
  if (phase2Index < buildLen) {
    const weekInPhase2 = Math.floor(phase2Index / 2);
    const isWed = phase2Index % 2 === 1;
    return isWed
      ? {
          ...base,
          phase: 'Half-Marathon Build',
          phaseNote: `Week ${weekInPhase2 + 1} of ${PHASE2_WED_KM.length} · Long run`,
          description: `${PHASE2_WED_KM[weekInPhase2]} km at an easy, conversational pace`,
          targetMinutes: null,
          targetKm: PHASE2_WED_KM[weekInPhase2],
        }
      : {
          ...base,
          phase: 'Half-Marathon Build',
          phaseNote: `Week ${weekInPhase2 + 1} of ${PHASE2_TUE_MINUTES.length} · Steady run`,
          description: `${PHASE2_TUE_MINUTES[weekInPhase2]} min steady, comfortable pace`,
          targetMinutes: PHASE2_TUE_MINUTES[weekInPhase2],
          targetKm: null,
        };
  }

  const taperIndex = phase2Index - buildLen;
  if (taperIndex < TAPER.length) {
    const t = TAPER[taperIndex];
    return {
      ...base,
      phase: 'Taper',
      phaseNote: 'Race is close — trust the training',
      description: t.description,
      targetMinutes: t.minutes ?? null,
      targetKm: t.km ?? null,
    };
  }

  return {
    ...base,
    weekNumber: TOTAL_WEEKS,
    complete: true,
    phase: 'Complete',
    phaseNote: 'Plan complete — race day!',
    description: 'Half-marathon plan complete. Keep it up with steady maintenance running: 30–40 min easy, twice a week.',
    targetMinutes: 35,
    targetKm: null,
  };
}

/** Summary of where the plan stands for any given day (not just Tue/Wed) — for a home-screen banner. */
export function currentProgramStatus(today = new Date()) {
  const { d, start, weeksElapsed } = weekOffset(today);
  if (d < start) return null;
  const weekNumber = weeksElapsed + 1;
  const index = Math.max(0, weeksElapsed) * 2;
  const buildLen = PHASE2_WED_KM.length * 2;
  let phase;
  if (weekNumber > TOTAL_WEEKS) phase = 'Complete';
  else if (index < PHASE1_SESSIONS.length) phase = 'Learn to Run';
  else if (index - PHASE1_SESSIONS.length < buildLen) phase = 'Half-Marathon Build';
  else phase = 'Taper';
  return {
    weekNumber: Math.min(Math.max(weekNumber, 1), TOTAL_WEEKS),
    totalWeeks: TOTAL_WEEKS,
    phase,
    complete: weekNumber > TOTAL_WEEKS,
  };
}
