// Progress calculations: estimated 1RM, PR detection, streaks, weekly completion.

import { addDays, isoDate, startOfWeek, DAY_KEYS } from './utils.js';

// Epley formula — good enough approximation for tracking trend/PRs, not a lab measurement.
export function estOneRM(weight, reps) {
  if (!weight || !reps) return 0;
  return weight * (1 + reps / 30);
}

// Best (weight, reps, estOneRM) achieved for a given exercise name within one log entry.
function bestSetForExercise(entry, exerciseName) {
  const ex = entry.exercises && entry.exercises.find((e) => e.name === exerciseName);
  if (!ex) return null;
  let best = null;
  for (const set of ex.sets) {
    if (!set.weight || !set.reps) continue;
    const e1rm = estOneRM(set.weight, set.reps);
    if (!best || e1rm > best.estOneRM) {
      best = { weight: set.weight, reps: set.reps, estOneRM: e1rm };
    }
  }
  return best;
}

// Returns a chronological series of { date, weight, reps, estOneRM, isPR } for one lift,
// scanning every logged session (not just the day it's normally scheduled on).
export function liftHistory(logs, exerciseName) {
  const dates = Object.keys(logs).sort();
  const series = [];
  let runningBest = 0;
  for (const iso of dates) {
    const entry = logs[iso];
    if (!entry || !entry.completed) continue;
    const best = bestSetForExercise(entry, exerciseName);
    if (!best) continue;
    const isPR = best.estOneRM > runningBest + 0.001;
    if (isPR) runningBest = best.estOneRM;
    series.push({ date: iso, weight: best.weight, reps: best.reps, estOneRM: best.estOneRM, isPR });
  }
  return series;
}

export function currentPR(logs, exerciseName) {
  const history = liftHistory(logs, exerciseName);
  if (!history.length) return null;
  return history.reduce((best, pt) => (pt.estOneRM > best.estOneRM ? pt : best), history[0]);
}

// Consecutive completed scheduled days walking back from today (every day of the
// week has a planned session in this program, so any completed day counts).
export function currentStreak(logs, today = new Date()) {
  let streak = 0;
  let cursor = new Date(today);
  cursor.setHours(0, 0, 0, 0);
  // If today isn't logged yet, don't break the streak on it — start counting from yesterday.
  const todayIso = isoDate(cursor);
  if (!logs[todayIso] || !logs[todayIso].completed) {
    cursor = addDays(cursor, -1);
  }
  while (true) {
    const iso = isoDate(cursor);
    const entry = logs[iso];
    if (entry && entry.completed) {
      streak += 1;
      cursor = addDays(cursor, -1);
    } else {
      break;
    }
  }
  return streak;
}

// Count of full Mon–Sun weeks, strictly before the current week, where all 7 days were logged done.
export function weeksCompleted(logs, today = new Date()) {
  const thisWeekStart = startOfWeek(today);
  let count = 0;
  let weekStart = addDays(thisWeekStart, -7);
  // Walk backward until we hit a week with zero completed days (bounded scan of the log history).
  for (let guard = 0; guard < 260; guard++) {
    let allDone = true;
    let anyLogged = false;
    for (let i = 0; i < 7; i++) {
      const iso = isoDate(addDays(weekStart, i));
      const entry = logs[iso];
      if (entry && entry.completed) anyLogged = true;
      else allDone = false;
    }
    if (!anyLogged) break;
    if (allDone) count += 1;
    weekStart = addDays(weekStart, -7);
  }
  return count;
}

export function bodyweightTrend(entries) {
  return [...entries].sort((a, b) => a.date.localeCompare(b.date));
}
