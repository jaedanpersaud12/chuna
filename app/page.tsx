"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import TunerGauge from "@/components/TunerGauge";
import StringRow from "@/components/StringRow";
import TuningPicker from "@/components/TuningPicker";
import AccountMenu from "@/components/AccountMenu";
import { useTuner } from "@/hooks/useTuner";
import { useUser } from "@/hooks/useUser";
import { playTone } from "@/lib/audio";
import {
  DEFAULT_A4,
  MAX_MIDI,
  MIN_MIDI,
  centsOff,
  midiLabel,
  midiToFreq,
} from "@/lib/notes";
import {
  PRESETS,
  Tuning,
  loadSavedTunings,
  loadState,
  persistSavedTunings,
  persistState,
} from "@/lib/tunings";
import {
  deleteCloudTuning,
  fetchCloudTunings,
  renameCloudTuning,
  saveCloudTuning,
} from "@/lib/cloudTunings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import AdUnit from "@/components/AdUnit";
import { AD_SLOTS } from "@/lib/adsense";

const IN_TUNE_CENTS = 5;

export default function Home() {
  const [notes, setNotes] = useState<number[]>(PRESETS[0].notes);
  const [a4, setA4] = useState(DEFAULT_A4);
  const [locked, setLocked] = useState<number | null>(null);
  const [saved, setSaved] = useState<Tuning[]>([]);
  const [hydrated, setHydrated] = useState(false);
  // Name of the saved tuning currently being edited, tracked across note
  // changes so re-saving updates it in place rather than making a duplicate.
  const [activeSavedName, setActiveSavedName] = useState<string | null>(null);

  const { status, reading, start, stop } = useTuner();
  const { user } = useUser();

  // Restore last tuning + calibration from localStorage on first mount.
  useEffect(() => {
    const state = loadState();
    if (state) {
      setNotes(state.notes);
      setA4(state.a4);
    }
    setHydrated(true);
  }, []);

  const persistTimer = useRef<number | null>(null);
  useEffect(() => {
    if (!hydrated) return;
    if (persistTimer.current !== null) window.clearTimeout(persistTimer.current);
    persistTimer.current = window.setTimeout(
      () => persistState({ notes, a4 }),
      300
    );
  }, [notes, a4, hydrated]);

  // Saved tunings come from the cloud when signed in, otherwise localStorage.
  // On sign-in, migrate any local tunings the account doesn't already have.
  useEffect(() => {
    let cancelled = false;
    if (!user) {
      setSaved(loadSavedTunings());
      return;
    }
    (async () => {
      try {
        const local = loadSavedTunings();
        let cloud = await fetchCloudTunings();
        const missing = local.filter(
          (l) => !cloud.some((c) => c.name === l.name)
        );
        if (missing.length > 0) {
          await Promise.all(
            missing.map((t) => saveCloudTuning(user.id, t.name, t.notes))
          );
          cloud = await fetchCloudTunings();
        }
        if (!cancelled) setSaved(cloud);
      } catch (err) {
        if (!cancelled) {
          toast.error(
            err instanceof Error ? err.message : "Couldn't load your tunings"
          );
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  const detection = useMemo(() => {
    if (!reading) return null;
    let index: number;
    if (locked !== null) {
      index = locked;
    } else {
      index = 0;
      let best = Infinity;
      notes.forEach((midi, i) => {
        const d = Math.abs(centsOff(reading.frequency, midiToFreq(midi, a4)));
        if (d < best) {
          best = d;
          index = i;
        }
      });
    }
    const cents = centsOff(reading.frequency, midiToFreq(notes[index], a4));
    return { index, cents, frequency: reading.frequency };
  }, [reading, notes, a4, locked]);

  const inTune = detection !== null && Math.abs(detection.cents) <= IN_TUNE_CENTS;

  const setStringNote = (i: number, midi: number) => {
    setNotes((prev) => prev.map((n, j) => (j === i ? midi : n)));
  };

  const shiftAll = (delta: number) => {
    setNotes((prev) => {
      if (prev.some((n) => n + delta < MIN_MIDI || n + delta > MAX_MIDI)) {
        return prev;
      }
      return prev.map((n) => n + delta);
    });
  };

  const selectString = (i: number) => {
    playTone(midiToFreq(notes[i], a4));
    setLocked((prev) => (prev === i ? null : i));
  };

  const saveTuning = useCallback(
    async (name: string) => {
      const tuning: Tuning = { name, notes: [...notes] };
      const next = [...saved.filter((t) => t.name !== name), tuning];
      setSaved(next);
      setActiveSavedName(name);
      if (user) {
        try {
          await saveCloudTuning(user.id, name, tuning.notes);
          toast.success(`Saved "${name}" to your account`);
        } catch (err) {
          toast.error(
            err instanceof Error ? err.message : "Couldn't save to your account"
          );
        }
      } else {
        persistSavedTunings(next);
        toast.success(`Saved "${name}" on this device`);
      }
    },
    [notes, saved, user]
  );

  const deleteTuning = useCallback(
    async (name: string) => {
      const next = saved.filter((t) => t.name !== name);
      setSaved(next);
      if (name === activeSavedName) setActiveSavedName(null);
      if (user) {
        try {
          await deleteCloudTuning(name);
          toast.success(`Deleted "${name}"`);
        } catch (err) {
          toast.error(
            err instanceof Error ? err.message : "Couldn't delete tuning"
          );
        }
      } else {
        persistSavedTunings(next);
        toast.success(`Deleted "${name}"`);
      }
    },
    [saved, user, activeSavedName]
  );

  const renameTuning = useCallback(
    async (oldName: string, newNameRaw: string) => {
      const newName = newNameRaw.trim();
      if (!newName || newName === oldName) return;
      if (saved.some((t) => t.name === newName)) {
        toast.error(`A tuning named "${newName}" already exists`);
        return;
      }
      const next = saved.map((t) =>
        t.name === oldName ? { ...t, name: newName } : t
      );
      setSaved(next);
      setActiveSavedName((cur) => (cur === oldName ? newName : cur));
      if (user) {
        try {
          await renameCloudTuning(oldName, newName);
          toast.success(`Renamed to "${newName}"`);
        } catch (err) {
          toast.error(
            err instanceof Error ? err.message : "Couldn't rename tuning"
          );
        }
      } else {
        persistSavedTunings(next);
        toast.success(`Renamed to "${newName}"`);
      }
    },
    [saved, user]
  );

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center gap-6 px-4 py-8">
      <header className="relative flex w-full flex-col items-center gap-1">
        <div className="absolute right-0 top-0">
          <AccountMenu user={user} />
        </div>
        <h1 className="text-3xl font-bold tracking-tight">
          ch<span className="text-primary">u</span>ne
        </h1>
        <p className="text-sm text-muted-foreground">
          tune to literally whatever you want
        </p>
      </header>

      <TuningPicker
        currentNotes={notes}
        savedTunings={saved}
        activeSavedName={activeSavedName}
        onApply={(n, savedName) => {
          setNotes([...n]);
          setLocked(null);
          setActiveSavedName(savedName ?? null);
        }}
        onSave={saveTuning}
        onDelete={deleteTuning}
        onRename={renameTuning}
      />

      <TunerGauge
        noteLabel={detection ? midiLabel(notes[detection.index]) : null}
        cents={detection?.cents ?? null}
        frequency={detection?.frequency ?? null}
        inTune={inTune}
      />

      {status !== "running" ? (
        <Button
          size="lg"
          onClick={start}
          disabled={status === "starting"}
        >
          {status === "starting" ? "Starting…" : "Start tuner (mic)"}
        </Button>
      ) : (
        <Button size="lg" variant="secondary" onClick={stop}>
          Stop mic
        </Button>
      )}
      {status === "denied" && (
        <p className="-mt-3 text-sm text-destructive">
          Mic access was denied — allow it in your browser settings, or tap a
          string below to tune by ear.
        </p>
      )}
      {status === "error" && (
        <p className="-mt-3 text-sm text-destructive">
          Couldn&apos;t access a microphone. You can still tap strings to tune
          by ear.
        </p>
      )}

      <section className="flex flex-col items-center gap-3">
        <div className="flex items-end gap-2 sm:gap-3">
          {notes.map((midi, i) => (
            <StringRow
              key={i}
              stringNumber={6 - i}
              midi={midi}
              isActive={detection?.index === i}
              isLocked={locked === i}
              inTune={detection?.index === i && inTune}
              onChange={(m) => setStringNote(i, m)}
              onSelect={() => selectString(i)}
            />
          ))}
        </div>
        <p className="text-xs text-muted-foreground">
          tap a string to hear it &amp; lock onto it · ▲▼ or the dropdowns set
          any note
        </p>
      </section>

      <footer className="flex flex-wrap items-center justify-center gap-4 text-sm text-muted-foreground">
        <span className="flex items-center gap-1.5">
          Shift all:
          <Button variant="secondary" size="sm" onClick={() => shiftAll(-1)}>
            −1 st
          </Button>
          <Button variant="secondary" size="sm" onClick={() => shiftAll(1)}>
            +1 st
          </Button>
        </span>
        <Label className="flex items-center gap-2">
          A4
          <Input
            type="number"
            min={415}
            max={466}
            value={a4}
            onChange={(e) => {
              const v = Number(e.target.value);
              if (Number.isFinite(v)) setA4(Math.min(466, Math.max(415, v)));
            }}
            className="w-20 tabular-nums"
          />
          Hz
        </Label>
      </footer>

      <AdUnit slot={AD_SLOTS.belowTuner} className="mt-2 max-w-md" />
    </main>
  );
}
