export interface Tuning {
  name: string;
  // MIDI note per string, low string first (index 0 = 6th string)
  notes: number[];
}

export const STRING_COUNT = 6;

export const PRESETS: Tuning[] = [
  { name: "Standard (E A D G B E)", notes: [40, 45, 50, 55, 59, 64] },
  { name: "Drop D", notes: [38, 45, 50, 55, 59, 64] },
  { name: "Half-step down (Eb)", notes: [39, 44, 49, 54, 58, 63] },
  { name: "Full step down (D)", notes: [38, 43, 48, 53, 57, 62] },
  { name: "Drop C", notes: [36, 43, 48, 53, 57, 62] },
  { name: "Drop B", notes: [35, 42, 47, 52, 56, 61] },
  { name: "DADGAD", notes: [38, 45, 50, 55, 57, 62] },
  { name: "Open G", notes: [38, 43, 50, 55, 59, 62] },
  { name: "Open D", notes: [38, 45, 50, 54, 57, 62] },
  { name: "Open E", notes: [40, 47, 52, 56, 59, 64] },
  { name: "Open C", notes: [36, 43, 48, 55, 60, 64] },
];

const SAVED_KEY = "chune.savedTunings";
const STATE_KEY = "chune.state";

export interface PersistedState {
  notes: number[];
  a4: number;
}

function isValidNotes(notes: unknown): notes is number[] {
  return (
    Array.isArray(notes) &&
    notes.length === STRING_COUNT &&
    notes.every((n) => Number.isInteger(n))
  );
}

export function loadSavedTunings(): Tuning[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(SAVED_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (t): t is Tuning => typeof t?.name === "string" && isValidNotes(t?.notes)
    );
  } catch {
    return [];
  }
}

export function persistSavedTunings(tunings: Tuning[]): void {
  localStorage.setItem(SAVED_KEY, JSON.stringify(tunings));
}

export function loadState(): PersistedState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STATE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!isValidNotes(parsed?.notes) || typeof parsed?.a4 !== "number") {
      return null;
    }
    return { notes: parsed.notes, a4: parsed.a4 };
  } catch {
    return null;
  }
}

export function persistState(state: PersistedState): void {
  localStorage.setItem(STATE_KEY, JSON.stringify(state));
}
