// The default weekly training template, and logic for resolving what a
// given calendar date's session actually is (default, or korfball override).

import { DAY_KEYS, DAY_LABELS, dayKeyFor, isoDate } from './utils.js';
import { getRunProgramSession } from './runProgram.js';

// The four lifts tracked on the Progress screen, matched by exact exercise name.
export const MAIN_LIFTS = ['Bench press', 'Squat', 'Deadlift', 'Overhead press'];

function topSetPlusBackoff(topLabel, backoffReps, backoffSets) {
  const sets = [{ label: topLabel, targetReps: 5, isTopSet: true }];
  for (let i = 0; i < backoffSets; i++) sets.push({ label: '~75%', targetReps: backoffReps });
  return sets;
}

function plainSets(count, reps, label) {
  return Array.from({ length: count }, () => ({ label: label || '', targetReps: reps }));
}

// type: 'gym' | 'run' | 'mobility'
export const TEMPLATE = {
  monday: {
    dayKey: 'monday',
    type: 'gym',
    name: 'Gym — Upper (Push-focus)',
    shortSleep: false,
    exercises: [
      { name: 'Bench press', targetLabel: 'Top set 3–5 reps, then 3×8 @ ~75%', sets: topSetPlusBackoff('Top set (3–5 reps)', 8, 3) },
      { name: 'Overhead press', targetLabel: '3×8', sets: plainSets(3, 8) },
      { name: 'Incline dumbbell press', targetLabel: '3×10', sets: plainSets(3, 10) },
      { name: 'Lateral raise', targetLabel: '3×15', sets: plainSets(3, 15) },
      { name: 'Tricep pushdown / dips', targetLabel: '3×12', sets: plainSets(3, 12) },
    ],
  },
  tuesday: {
    dayKey: 'tuesday',
    type: 'run',
    name: 'Easy run + mobility',
    shortSleep: true,
    exercises: [
      { name: 'Easy run', targetLabel: '20–25 min easy pace', sets: [{ label: 'Easy pace', targetReps: null, targetMinutes: 22 }] },
      { name: 'Mobility', targetLabel: '10 min', sets: [{ label: 'Mobility', targetReps: null, targetMinutes: 10 }] },
    ],
  },
  wednesday: {
    dayKey: 'wednesday',
    type: 'run',
    name: 'Easy run / intervals',
    shortSleep: true,
    exercises: [
      { name: 'Run', targetLabel: '25–30 min', sets: [{ label: 'Run', targetReps: null, targetMinutes: 27 }] },
    ],
  },
  thursday: {
    dayKey: 'thursday',
    type: 'gym',
    name: 'Gym — Lower (heavy)',
    shortSleep: false,
    exercises: [
      { name: 'Squat', targetLabel: 'Top set 3–5 reps, then 3×8 @ ~75%', sets: topSetPlusBackoff('Top set (3–5 reps)', 8, 3) },
      { name: 'Romanian deadlift', targetLabel: '3×8', sets: plainSets(3, 8) },
      { name: 'Walking lunge / split squat', targetLabel: '3×10 per leg', sets: plainSets(3, 10, 'per leg') },
      { name: 'Calf raise', targetLabel: '3×15', sets: plainSets(3, 15) },
      { name: 'Hip thrust', targetLabel: '3×10', sets: plainSets(3, 10) },
    ],
  },
  friday: {
    dayKey: 'friday',
    type: 'gym',
    name: 'Gym — Upper (Pull-focus)',
    shortSleep: false,
    exercises: [
      { name: 'Weighted pull-up / lat pulldown', targetLabel: '4×8', sets: plainSets(4, 8) },
      { name: 'Barbell row', targetLabel: '3×10', sets: plainSets(3, 10) },
      { name: 'Face pull', targetLabel: '3×15', sets: plainSets(3, 15) },
      { name: 'Bicep curl', targetLabel: '3×12', sets: plainSets(3, 12) },
      { name: 'Rear delt fly', targetLabel: '3×15', sets: plainSets(3, 15) },
    ],
  },
  saturday: {
    dayKey: 'saturday',
    type: 'gym',
    name: 'Gym — Lower / Full body (moderate)',
    shortSleep: false,
    exercises: [
      { name: 'Deadlift', targetLabel: 'Moderate, not max effort — 3×6', sets: plainSets(3, 6, 'moderate') },
      { name: 'Leg press', targetLabel: '3×10', sets: plainSets(3, 10) },
      { name: 'Single-leg RDL', targetLabel: '3×10 per leg', sets: plainSets(3, 10, 'per leg') },
      { name: 'Hanging leg raise', targetLabel: '3×12', sets: plainSets(3, 12) },
    ],
  },
  sunday: {
    dayKey: 'sunday',
    type: 'mobility',
    name: 'Mobility / stretch',
    shortSleep: false,
    exercises: [
      { name: 'Stretching / mobility', targetLabel: '10–15 min', sets: [{ label: 'Stretch', targetReps: null, targetMinutes: 12 }] },
    ],
  },
};

export function korfballSession(dayKey) {
  return {
    dayKey,
    type: 'korfball',
    name: 'Korfball',
    shortSleep: TEMPLATE[dayKey].shortSleep,
    exercises: [],
  };
}

// Resolves the effective session for a specific calendar date, applying
// ad-hoc per-date overrides first, then the recurring Settings assignment.
function applyRunProgram(dayKey, date) {
  const template = TEMPLATE[dayKey];
  const program = getRunProgramSession(date);
  if (!program) return template;

  const runSet = program.targetKm != null
    ? { label: 'Long run', targetKm: program.targetKm }
    : { label: 'Run', targetMinutes: program.targetMinutes };

  const exercises = [
    { name: 'Run', targetLabel: program.description, sets: [runSet] },
    // Tuesday keeps its trailing mobility block; Wednesday stays pure run.
    ...(dayKey === 'tuesday' ? [template.exercises.find((e) => e.name === 'Mobility')] : []),
  ].filter(Boolean);

  return {
    ...template,
    name: `${program.phase} — ${program.phaseNote}`,
    exercises,
    runProgram: program,
  };
}

export function getSessionForDate(date, state) {
  const dayKey = dayKeyFor(date);
  const iso = isoDate(date);
  const adhoc = state.dayOverrides[iso];
  if (adhoc === 'korfball') return { ...korfballSession(dayKey), date, iso };
  if (state.settings.korfballDay === dayKey) return { ...korfballSession(dayKey), date, iso };

  if (dayKey === 'tuesday' || dayKey === 'wednesday') {
    return { ...applyRunProgram(dayKey, date), date, iso };
  }
  return { ...TEMPLATE[dayKey], date, iso };
}

export function durationForSession(session, settings) {
  if (session.runProgram) {
    const p = session.runProgram;
    if (p.targetKm != null) return Math.round(p.targetKm * 7) + (session.dayKey === 'tuesday' ? settings.mobilityDuration : 0);
    if (p.targetMinutes != null) return p.targetMinutes + (session.dayKey === 'tuesday' ? settings.mobilityDuration : 0);
  }
  switch (session.type) {
    case 'gym': return settings.gymDuration;
    case 'run': return settings.runDuration;
    case 'mobility': return settings.mobilityDuration;
    case 'korfball': return settings.korfballDuration;
    default: return 60;
  }
}

export { DAY_KEYS, DAY_LABELS };
