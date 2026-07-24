let ctx: AudioContext | null = null;

export function getAudioContext(): AudioContext {
  if (!ctx) ctx = new AudioContext();
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

/**
 * Play a reference tone: triangle wave with a soft attack/release envelope.
 */
export function playTone(frequency: number, duration = 1.6): void {
  const ac = getAudioContext();
  const now = ac.currentTime;

  const osc = ac.createOscillator();
  osc.type = "triangle";
  osc.frequency.value = frequency;

  const gain = ac.createGain();
  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(0.35, now + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

  osc.connect(gain).connect(ac.destination);
  osc.start(now);
  osc.stop(now + duration + 0.05);
}
