export interface PitchResult {
  frequency: number;
  clarity: number;
}

const MIN_FREQ = 50; // below low guitar range (drop A ~55 Hz)
const MAX_FREQ = 1200;
const CLARITY_THRESHOLD = 0.88;
const RMS_THRESHOLD = 0.008;

/**
 * McLeod Pitch Method (NSDF) with parabolic peak interpolation.
 * Returns null when the buffer is silence/noise rather than a clear pitch.
 */
export function detectPitch(
  buf: Float32Array,
  sampleRate: number
): PitchResult | null {
  const n = buf.length;

  let sumSq = 0;
  for (let i = 0; i < n; i++) sumSq += buf[i] * buf[i];
  if (Math.sqrt(sumSq / n) < RMS_THRESHOLD) return null;

  const maxTau = Math.min(Math.floor(sampleRate / MIN_FREQ), n - 1);
  const minTau = Math.max(2, Math.floor(sampleRate / MAX_FREQ));

  // NSDF: n'(tau) = 2 * acf(tau) / (m(tau))
  const nsdf = new Float32Array(maxTau + 1);
  for (let tau = minTau; tau <= maxTau; tau++) {
    let acf = 0;
    let m = 0;
    for (let i = 0; i + tau < n; i++) {
      acf += buf[i] * buf[i + tau];
      m += buf[i] * buf[i] + buf[i + tau] * buf[i + tau];
    }
    nsdf[tau] = m > 0 ? (2 * acf) / m : 0;
  }

  // Collect local maxima between positive-going zero crossings.
  const maxima: number[] = [];
  let tau = minTau;
  while (tau <= maxTau && nsdf[tau] > 0) tau++; // skip the initial lobe
  while (tau <= maxTau) {
    while (tau <= maxTau && nsdf[tau] <= 0) tau++;
    let best = -1;
    let bestVal = -Infinity;
    while (tau <= maxTau && nsdf[tau] > 0) {
      if (nsdf[tau] > bestVal) {
        bestVal = nsdf[tau];
        best = tau;
      }
      tau++;
    }
    if (best > 0) maxima.push(best);
  }
  if (maxima.length === 0) return null;

  let highest = 0;
  for (const t of maxima) if (nsdf[t] > highest) highest = nsdf[t];
  if (highest < CLARITY_THRESHOLD) return null;

  // First maximum above k * highest wins (avoids octave errors).
  const k = 0.9;
  let chosen = maxima[0];
  for (const t of maxima) {
    if (nsdf[t] >= k * highest) {
      chosen = t;
      break;
    }
  }

  // Parabolic interpolation around the chosen lag for sub-sample accuracy.
  let refined = chosen;
  if (chosen > minTau && chosen < maxTau) {
    const a = nsdf[chosen - 1];
    const b = nsdf[chosen];
    const c = nsdf[chosen + 1];
    const denom = a - 2 * b + c;
    if (denom !== 0) refined = chosen + (0.5 * (a - c)) / denom;
  }

  const frequency = sampleRate / refined;
  if (frequency < MIN_FREQ || frequency > MAX_FREQ) return null;

  return { frequency, clarity: nsdf[chosen] };
}
