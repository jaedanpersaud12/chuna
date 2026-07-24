"use client";

import { useState } from "react";
import { PRESETS, Tuning } from "@/lib/tunings";
import { midiLabel } from "@/lib/notes";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TrashIcon } from "@phosphor-icons/react";

interface Props {
  currentNotes: number[];
  savedTunings: Tuning[];
  onApply: (notes: number[]) => void;
  onSave: (name: string) => void;
  onDelete: (name: string) => void;
}

const CUSTOM = "__custom__";

export default function TuningPicker({
  currentNotes,
  savedTunings,
  onApply,
  onSave,
  onDelete,
}: Props) {
  const [saveOpen, setSaveOpen] = useState(false);
  const [saveName, setSaveName] = useState("");

  const notesKey = (notes: number[]) => notes.join(",");
  const currentKey = notesKey(currentNotes);
  const all = [...PRESETS, ...savedTunings];
  const selected =
    all.find((t) => notesKey(t.notes) === currentKey)?.name ?? CUSTOM;
  const isSavedSelected = savedTunings.some((t) => t.name === selected);

  const submitSave = () => {
    const name = saveName.trim();
    if (!name) return;
    onSave(name);
    setSaveName("");
    setSaveOpen(false);
  };

  return (
    <div className="flex flex-wrap items-center justify-center gap-2">
      <Select
        value={selected}
        onValueChange={(v) => {
          if (!v || v === CUSTOM) return;
          const t = all.find((x) => x.name === v);
          if (t) onApply(t.notes);
        }}
      >
        <SelectTrigger className="w-64">
          <SelectValue placeholder="Choose a tuning">
            {selected === CUSTOM
              ? `Custom · ${currentNotes.map(midiLabel).join(" ")}`
              : selected}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectLabel>Presets</SelectLabel>
            {PRESETS.map((t) => (
              <SelectItem key={t.name} value={t.name}>
                {t.name}
              </SelectItem>
            ))}
          </SelectGroup>
          {savedTunings.length > 0 && (
            <SelectGroup>
              <SelectLabel>My tunings</SelectLabel>
              {savedTunings.map((t) => (
                <SelectItem key={t.name} value={t.name}>
                  {t.name} · {t.notes.map(midiLabel).join(" ")}
                </SelectItem>
              ))}
            </SelectGroup>
          )}
        </SelectContent>
      </Select>

      <Button variant="outline" onClick={() => setSaveOpen(true)}>
        Save tuning
      </Button>

      {isSavedSelected && (
        <Button
          variant="destructive"
          size="icon"
          aria-label="Delete this saved tuning"
          onClick={() => onDelete(selected)}
        >
          <TrashIcon />
        </Button>
      )}

      <Dialog open={saveOpen} onOpenChange={setSaveOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Save this tuning</DialogTitle>
          </DialogHeader>
          <form
            className="flex flex-col gap-4"
            onSubmit={(e) => {
              e.preventDefault();
              submitSave();
            }}
          >
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="tuning-name">Name</Label>
              <Input
                id="tuning-name"
                autoFocus
                value={saveName}
                onChange={(e) => setSaveName(e.target.value)}
                placeholder="e.g. My weird tuning"
              />
              <p className="text-xs text-muted-foreground">
                {currentNotes.map(midiLabel).join(" ")}
              </p>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setSaveOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={!saveName.trim()}>
                Save
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
