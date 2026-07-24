"use client";

interface Props {
  noteLabel: string | null;
  cents: number | null;
  frequency: number | null;
  inTune: boolean;
}

const RANGE = 50; // gauge shows -50..+50 cents
const SWEEP = 120; // degrees of needle travel
const IN_TUNE_COLOR = "#4ade80";

// Round to fixed precision so server and client render byte-identical SVG
// coordinates (raw Math.sin/cos values serialize differently and break hydration).
const r3 = (n: number) => Math.round(n * 1000) / 1000;

export default function TunerGauge({
  noteLabel,
  cents,
  frequency,
  inTune,
}: Props) {
  const clamped =
    cents === null ? 0 : Math.max(-RANGE, Math.min(RANGE, cents));
  const angle = (clamped / RANGE) * (SWEEP / 2);
  const active = cents !== null;
  const color = !active
    ? "var(--muted-foreground)"
    : inTune
      ? IN_TUNE_COLOR
      : "var(--primary)";

  const ticks = [];
  for (let c = -RANGE; c <= RANGE; c += 10) {
    const a = ((c / RANGE) * (SWEEP / 2) * Math.PI) / 180;
    const major = c === 0 || Math.abs(c) === RANGE;
    const r1 = major ? 128 : 134;
    const r2 = 144;
    ticks.push(
      <line
        key={c}
        x1={r3(200 + r1 * Math.sin(a))}
        y1={r3(160 - r1 * Math.cos(a))}
        x2={r3(200 + r2 * Math.sin(a))}
        y2={r3(160 - r2 * Math.cos(a))}
        stroke={c === 0 ? IN_TUNE_COLOR : "var(--border)"}
        strokeWidth={c === 0 ? 3 : 2}
      />
    );
  }

  return (
    <div className="flex select-none flex-col items-center">
      <svg viewBox="0 0 400 190" className="w-full max-w-md">
        {/* in-tune zone (±5 cents) */}
        <path
          d={arcPath(200, 160, 148, -5, 5)}
          stroke={IN_TUNE_COLOR}
          strokeOpacity={0.35}
          strokeWidth={8}
          fill="none"
        />
        {ticks}
        <g
          style={{
            transform: `rotate(${angle}deg)`,
            transformOrigin: "200px 160px",
            transition: "transform 90ms linear",
          }}
        >
          <line
            x1={200}
            y1={160}
            x2={200}
            y2={38}
            stroke={color}
            strokeWidth={4}
            strokeLinecap="round"
          />
        </g>
        <circle cx={200} cy={160} r={8} fill={color} />
      </svg>

      <div className="-mt-6 flex flex-col items-center gap-1">
        <div
          className="text-6xl font-bold tabular-nums"
          style={{
            color: !active
              ? "var(--muted-foreground)"
              : inTune
                ? IN_TUNE_COLOR
                : "var(--foreground)",
          }}
        >
          {noteLabel ?? "—"}
        </div>
        <div className="h-6 text-sm tabular-nums text-muted-foreground">
          {active && cents !== null ? (
            <>
              {cents > 0 ? "+" : ""}
              {cents.toFixed(0)} cents
              {frequency !== null && <> · {frequency.toFixed(1)} Hz</>}
            </>
          ) : (
            "play a string"
          )}
        </div>
      </div>
    </div>
  );
}

function arcPath(
  cx: number,
  cy: number,
  r: number,
  fromCents: number,
  toCents: number
): string {
  const toXY = (c: number) => {
    const a = ((c / RANGE) * (SWEEP / 2) * Math.PI) / 180;
    return [r3(cx + r * Math.sin(a)), r3(cy - r * Math.cos(a))];
  };
  const [x1, y1] = toXY(fromCents);
  const [x2, y2] = toXY(toCents);
  return `M ${x1} ${y1} A ${r} ${r} 0 0 1 ${x2} ${y2}`;
}
