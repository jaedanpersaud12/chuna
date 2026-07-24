export const NOTE_NAMES = [
  "C",
  "C#",
  "D",
  "D#",
  "E",
  "F",
  "F#",
  "G",
  "G#",
  "A",
  "A#",
  "B",
] as const;

export const A4_MIDI = 69;
export const DEFAULT_A4 = 440;

// Selectable range for a string target: C1 .. E5
export const MIN_MIDI = 24;
export const MAX_MIDI = 76;

export function midiToFreq(midi: number, a4: number = DEFAULT_A4): number {
  return a4 * Math.pow(2, (midi - A4_MIDI) / 12);
}

export function freqToMidiFloat(freq: number, a4: number = DEFAULT_A4): number {
  return A4_MIDI + 12 * Math.log2(freq / a4);
}

export function centsOff(freq: number, targetFreq: number): number {
  return 1200 * Math.log2(freq / targetFreq);
}

export function midiNoteName(midi: number): string {
  return NOTE_NAMES[((midi % 12) + 12) % 12];
}

export function midiOctave(midi: number): number {
  return Math.floor(midi / 12) - 1;
}

export function midiLabel(midi: number): string {
  return `${midiNoteName(midi)}${midiOctave(midi)}`;
}
