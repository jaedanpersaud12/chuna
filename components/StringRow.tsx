"use client";

import { MAX_MIDI, MIN_MIDI, midiLabel, midiNoteName, midiOctave } from "@/lib/notes";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { CaretUpIcon, CaretDownIcon } from "@phosphor-icons/react";

interface Props {
  stringNumber: number; // 6 = low E position, 1 = high E position
  midi: number;
  isActive: boolean;
  isLocked: boolean;
  inTune: boolean;
  onChange: (midi: number) => void;
  onSelect: () => void;
}

const NOTE_ITEMS = Array.from(
  { length: MAX_MIDI - MIN_MIDI + 1 },
  (_, i) => {
    const m = MIN_MIDI + i;
    return { label: midiLabel(m), value: String(m) };
  }
);

export default function StringRow({
  stringNumber,
  midi,
  isActive,
  isLocked,
  inTune,
  onChange,
  onSelect,
}: Props) {
  return (
    <div className="flex flex-col items-center gap-1.5">
      <Button
        variant="secondary"
        className="h-6 w-12 px-0"
        onClick={() => onChange(Math.min(MAX_MIDI, midi + 1))}
        aria-label={`String ${stringNumber} up a semitone`}
      >
        <CaretUpIcon className="size-3" />
      </Button>

      <button
        type="button"
        onClick={onSelect}
        data-cuelume-press="tick"
        className={cn(
          "flex h-16 w-14 flex-col items-center justify-center rounded-2xl border-2 bg-card transition-colors",
          inTune
            ? "border-green-400 text-green-400"
            : isActive
              ? "border-primary text-primary"
              : isLocked
                ? "border-ring text-foreground"
                : "border-border text-foreground"
        )}
        title={
          isLocked
            ? "Tap to unlock (back to auto-detect)"
            : "Tap to play reference tone and lock to this string"
        }
      >
        <span className="text-xl font-bold leading-none">
          {midiNoteName(midi)}
        </span>
        <span className="mt-1 text-[11px] leading-none text-muted-foreground">
          {midiOctave(midi)}
        </span>
      </button>

      <Button
        variant="secondary"
        className="h-6 w-12 px-0"
        onClick={() => onChange(Math.max(MIN_MIDI, midi - 1))}
        aria-label={`String ${stringNumber} down a semitone`}
      >
        <CaretDownIcon className="size-3" />
      </Button>

      <Select
        items={NOTE_ITEMS}
        value={String(midi)}
        onValueChange={(v) => {
          if (v) onChange(Number(v));
        }}
      >
        <SelectTrigger
          size="sm"
          className="w-14 justify-center px-2 text-xs"
          aria-label={`String ${stringNumber} note`}
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {NOTE_ITEMS.map((it) => (
            <SelectItem key={it.value} value={it.value}>
              {it.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
