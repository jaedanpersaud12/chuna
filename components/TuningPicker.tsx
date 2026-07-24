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
import { SlidersHorizontalIcon } from "@phosphor-icons/react";
import ManageTuningsDialog from "@/components/ManageTuningsDialog";

interface Props {
  currentNotes: number[];
  savedTunings: Tuning[];
  activeSavedName: string | null;
  onApply: (notes: number[], savedName?: string) => void;
  onSave: (name: string) => void;
  onDelete: (name: string) => void;
  onRename: (oldName: string, newName: string) => void;
}

const CUSTOM = "__custom__";

export default function TuningPicker({
  currentNotes,
  savedTunings,
  activeSavedName,
  onApply,
  onSave,
  onDelete,
  onRename,
}: Props) {
  const [saveOpen, setSaveOpen] = useState(false);
  const [saveName, setSaveName] = useState("");
  const [manageOpen, setManageOpen] = useState(false);

  const notesKey = (notes: number[]) => notes.join(",");
  const currentKey = notesKey(currentNotes);
  const all = [...PRESETS, ...savedTunings];
  const selected =
    all.find((t) => notesKey(t.notes) === currentKey)?.name ?? CUSTOM;
  const isSavedSelected = savedTunings.some((t) => t.name === selected);

  const trimmedName = saveName.trim();
  const willOverwrite = savedTunings.some((t) => t.name === trimmedName);

  const openSave = () => {
    // Pre-fill with the tuning currently being edited so changing its notes and
    // re-saving updates it in place instead of creating a duplicate.
    setSaveName(activeSavedName ?? (isSavedSelected ? selected : ""));
    setSaveOpen(true);
  };

  const submitSave = () => {
    if (!trimmedName) return;
    onSave(trimmedName);
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
          if (t) {
            const isSaved = savedTunings.some((s) => s.name === v);
            onApply(t.notes, isSaved ? v : undefined);
          }
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

      <Button variant="outline" onClick={openSave}>
        Save tuning
      </Button>

      {savedTunings.length > 0 && (
        <Button
          variant="outline"
          size="icon"
          aria-label="Manage saved tunings"
          title="Manage saved tunings"
          onClick={() => setManageOpen(true)}
        >
          <SlidersHorizontalIcon />
        </Button>
      )}

      <ManageTuningsDialog
        open={manageOpen}
        onOpenChange={setManageOpen}
        savedTunings={savedTunings}
        onApply={onApply}
        onRename={onRename}
        onDelete={onDelete}
      />

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
              <p className="font-mono text-xs text-muted-foreground">
                {currentNotes.map(midiLabel).join(" ")}
              </p>
              {willOverwrite && (
                <p className="text-xs text-amber-500">
                  Updates the existing “{trimmedName}”.
                </p>
              )}
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setSaveOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={!trimmedName}>
                {willOverwrite ? "Update" : "Save"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
